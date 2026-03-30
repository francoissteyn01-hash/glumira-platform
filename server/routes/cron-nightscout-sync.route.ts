/**
 * GluMira™ V7 — server/routes/cron-nightscout-sync.route.ts
 *
 * REPLACES: 04.2.63_api-cron-nightscout-sync_v1.0.txt (Next.js)
 * REASON:   Stack is Vite + Express, not Next.js (Drive Auditor v2.0, 2026-03-28)
 * ARCHIVE:  Original → 99_ARCHIVE/Superseded/ per GLUMIRA-V7-GLOBAL
 *
 * POST /api/cron/nightscout-sync
 * Protected by X-Cron-Secret header.
 * In production: triggered by a cron job (cron-job.org, Railway cron, or
 * a simple setInterval in server/index.ts every 5 minutes).
 *
 * GluMira™ is an educational platform, not a medical device.
 * Version: v1.0 · 2026-03-29
 */

import { Router, Request, Response } from "express";
import { supabase } from "../index";

export const cronNightscoutSyncRouter = Router();

const CRON_SECRET = process.env.CRON_SECRET ?? "";

// ── Types ────────────────────────────────────────────────────────────────────

interface ParticipantSyncResult {
  participantId: string;
  status: "synced" | "skipped" | "error";
  readingsAdded?: number;
  error?: string;
}

interface SyncSummary {
  syncedAt: string;
  totalParticipants: number;
  syncedCount: number;
  skippedCount: number;
  errorCount: number;
  results: ParticipantSyncResult[];
}

// ── POST /api/cron/nightscout-sync ───────────────────────────────────────────

cronNightscoutSyncRouter.post(
  "/nightscout-sync",
  async (req: Request, res: Response) => {
    // Validate cron secret
    const cronSecret = req.headers["x-cron-secret"];
    if (!CRON_SECRET || cronSecret !== CRON_SECRET) {
      return res.status(401).json({ error: "Unauthorised — invalid cron secret" });
    }

    const syncedAt = new Date().toISOString();
    const results: ParticipantSyncResult[] = [];

    // Fetch all active patients with Nightscout configured
    const { data: participants, error: fetchError } = await supabase
      .from("patient_profiles")
      .select("id, nightscout_url, nightscout_token")
      .eq("is_active", true)
      .not("nightscout_url", "is", null);

    if (fetchError) {
      console.error("[nightscout-sync] Failed to fetch participants:", fetchError.message);
      return res.status(500).json({ error: "Failed to fetch participants" });
    }

    const activeParticipants = participants ?? [];

    for (const participant of activeParticipants) {
      if (!participant.nightscout_url) {
        results.push({ participantId: participant.id, status: "skipped" });
        continue;
      }

      try {
        // Fetch last 6 minutes of CGM readings from Nightscout
        const since = new Date(Date.now() - 6 * 60 * 1000).toISOString();
        const nsUrl = `${participant.nightscout_url}/api/v1/entries/sgv.json?find[dateString][$gte]=${since}&count=12`;

        const nsResponse = await fetch(nsUrl, {
          headers: participant.nightscout_token
            ? { "api-secret": participant.nightscout_token }
            : {},
          signal: AbortSignal.timeout(10_000),
        });

        if (!nsResponse.ok) {
          throw new Error(`Nightscout returned HTTP ${nsResponse.status}`);
        }

        const entries = await nsResponse.json() as Array<{
          sgv: number;
          direction?: string;
          dateString?: string;
          date?: number;
        }>;

        if (!Array.isArray(entries) || entries.length === 0) {
          results.push({ participantId: participant.id, status: "synced", readingsAdded: 0 });
          continue;
        }

        // Upsert readings to glucose_readings table
        const readings = entries.map((e) => ({
          patient_id:   participant.id,
          value_mmol:   parseFloat((e.sgv / 18.0182).toFixed(1)),  // mg/dL → mmol/L
          trend_arrow:  e.direction ?? "Flat",
          source:       "nightscout",
          recorded_at:  e.dateString ?? new Date(e.date ?? Date.now()).toISOString(),
        }));

        const { error: upsertError } = await supabase
          .from("glucose_readings")
          .upsert(readings, { onConflict: "patient_id,recorded_at" });

        if (upsertError) throw new Error(upsertError.message);

        results.push({
          participantId: participant.id,
          status: "synced",
          readingsAdded: readings.length,
        });

        // Audit log
        await supabase.from("audit_log").insert({
          action:        "nightscout_sync",
          resource_type: "glucose_readings",
          metadata:      { readingsAdded: readings.length },
        });

      } catch (err) {
        console.error(`[nightscout-sync] Patient ${participant.id}:`, err);
        results.push({
          participantId: participant.id,
          status: "error",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const summary: SyncSummary = {
      syncedAt,
      totalParticipants: activeParticipants.length,
      syncedCount: results.filter((r) => r.status === "synced").length,
      skippedCount: results.filter((r) => r.status === "skipped").length,
      errorCount: results.filter((r) => r.status === "error").length,
      results,
    };

    console.log(
      `[nightscout-sync] ${summary.syncedCount}/${summary.totalParticipants} synced, ` +
      `${summary.errorCount} errors`
    );

    return res.status(200).json(summary);
  }
);

// ── Convenience: schedule sync internally (every 5 min) ─────────────────────
// Call this from server/index.ts if you don't have an external cron service:
//
// import { scheduleSyncJob } from "./routes/cron-nightscout-sync.route";
// scheduleSyncJob();

export function scheduleSyncJob() {
  const FIVE_MIN = 5 * 60 * 1000;
  console.log("[nightscout-sync] Scheduled every 5 minutes");
  setInterval(async () => {
    try {
      const res = await fetch(`http://localhost:${process.env.PORT ?? 3001}/api/cron/nightscout-sync`, {
        method: "POST",
        headers: { "x-cron-secret": CRON_SECRET },
      });
      const data = (await res.json()) as Record<string, unknown>;
      console.log("[nightscout-sync] Internal trigger:", data.syncedCount, "synced");
    } catch (err) {
      console.error("[nightscout-sync] Internal trigger failed:", err);
    }
  }, FIVE_MIN);
}
