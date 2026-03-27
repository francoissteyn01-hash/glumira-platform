/**
 * GluMira™ Cron — Nightscout Sync API Route
 * Version: 7.0.0
 * Route: POST /api/cron/nightscout-sync
 *
 * Triggered by Vercel Cron (every 5 minutes).
 * Iterates all active beta participants with Nightscout configured
 * and pulls the latest CGM readings into the database.
 * Protected by CRON_SECRET header.
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const CRON_SECRET = process.env.CRON_SECRET ?? "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

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

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Validate cron secret
  const cronSecret = req.headers.get("X-Cron-Secret");
  if (!CRON_SECRET || cronSecret !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const syncedAt = new Date().toISOString();
  const results: ParticipantSyncResult[] = [];

  // Fetch all active participants with Nightscout configured
  const { data: participants, error: fetchError } = await supabase
    .from("patient_profiles")
    .select("id, nightscout_url, nightscout_secret")
    .eq("status", "active")
    .not("nightscout_url", "is", null);

  if (fetchError) {
    console.error("Failed to fetch participants:", fetchError.message);
    return NextResponse.json({ error: "Failed to fetch participants" }, { status: 500 });
  }

  const activeParticipants = participants ?? [];

  for (const participant of activeParticipants) {
    if (!participant.nightscout_url) {
      results.push({ participantId: participant.id, status: "skipped" });
      continue;
    }

    try {
      // Fetch last 5 minutes of CGM readings from Nightscout
      const since = new Date(Date.now() - 6 * 60 * 1000).toISOString();
      const nsUrl = `${participant.nightscout_url}/api/v1/entries/sgv.json?find[dateString][$gte]=${since}&count=12`;

      const nsResponse = await fetch(nsUrl, {
        headers: participant.nightscout_secret
          ? { "api-secret": participant.nightscout_secret }
          : {},
        signal: AbortSignal.timeout(10_000),
      });

      if (!nsResponse.ok) {
        throw new Error(`Nightscout returned HTTP ${nsResponse.status}`);
      }

      const entries = await nsResponse.json();

      if (!Array.isArray(entries) || entries.length === 0) {
        results.push({ participantId: participant.id, status: "synced", readingsAdded: 0 });
        continue;
      }

      // Upsert readings to glucose_readings table
      const readings = entries.map((e: any) => ({
        patient_id: participant.id,
        glucose_value: e.sgv,
        trend: e.direction,
        recorded_at: e.dateString ?? new Date(e.date).toISOString(),
        source: "nightscout",
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
    } catch (err) {
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
    `Nightscout sync: ${summary.syncedCount}/${summary.totalParticipants} synced, ` +
    `${summary.errorCount} errors`
  );

  return NextResponse.json(summary, { status: 200 });
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
