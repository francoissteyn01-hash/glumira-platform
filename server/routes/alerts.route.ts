/**
 * GluMira™ V7 — server/routes/alerts.route.ts
 *
 * Glucose-aware alert API. Alerts are *derived state*, computed on demand
 * from glucose_readings + insulin_events. There is no `alerts` table.
 *
 * Endpoints:
 *   GET    /api/alerts            — list active alerts for the user
 *   POST   /api/alerts/dismiss    — record a dismissal in auditLog
 *   PUT    /api/alerts/snooze     — record a snooze in auditLog
 *
 * Dismiss / snooze state is persisted **client-side in localStorage** because
 * it's a per-device UX preference. The server's POST/PUT endpoints exist
 * for telemetry (analytics on which alerts users dismiss most) and forward
 * compatibility (a future `alerts` table can hang off these handlers).
 *
 * Alert types currently emitted:
 *   - hypo            glucose < 3.9 mmol/L in last 30 min
 *   - hyper           glucose > 13.9 mmol/L in last 30 min
 *   - stacking        ≥3 active insulin doses still on board (IOB tail)
 *   - rising_fast     >2.2 mmol/L rise in last 15 min
 *   - falling_fast    <-2.2 mmol/L drop in last 15 min
 *
 * GluMira™ is an educational platform, not a medical device.
 * Version: v1.0 · 2026-04-10
 */

import { Router, type Response } from "express";
import { z } from "zod";
import { requireAuth, type AuthRequest } from "../middleware/auth";
import { supabase } from "../index";

export const alertsRouter = Router();

type Severity = "info" | "warning" | "critical";

type ActiveAlert = {
  id:        string;     // stable hash of type + bucket time
  type:      "hypo" | "hyper" | "stacking" | "rising_fast" | "falling_fast";
  severity:  Severity;
  title:     string;
  body:      string;
  triggeredAt: string;   // ISO
  metadata?: Record<string, unknown>;
}

const HYPO_THRESHOLD     = 3.9;
const HYPER_THRESHOLD    = 13.9;
const RECENT_WINDOW_MIN  = 30;
const FAST_TREND_WINDOW  = 15;
const FAST_TREND_DELTA   = 2.2;
const STACKING_THRESHOLD = 3;
const STACKING_LOOKBACK_HOURS = 6;

function alertId(type: string, bucketIso: string): string {
  return `${type}:${bucketIso}`;
}

// ── GET /api/alerts ──────────────────────────────────────────────────────────
alertsRouter.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const sinceMs = Date.now() - RECENT_WINDOW_MIN * 60_000;
  const since   = new Date(sinceMs).toISOString();

  const [{ data: gRows, error: gErr }, { data: iRows, error: iErr }] = await Promise.all([
    supabase.from("glucose_readings")
      .select("value_mmol, recorded_at")
      .eq("patient_id", userId)
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: false })
      .limit(100),
    supabase.from("insulin_events")
      .select("event_time, dose_units")
      .eq("user_id", userId)
      .gte("event_time", new Date(Date.now() - STACKING_LOOKBACK_HOURS * 3600_000).toISOString())
      .order("event_time", { ascending: false })
      .limit(50),
  ]);

  if (gErr || iErr) {
    console.error("[alerts] db error:", gErr?.message ?? iErr?.message);
    return res.status(500).json({ error: "Database error" });
  }

  const readings = (gRows ?? []).map((r) => ({ value: Number(r.value_mmol), at: r.recorded_at as string }));
  const doses    = (iRows ?? []).map((d) => ({ units: Number(d.dose_units),  at: d.event_time   as string }));
  const alerts: ActiveAlert[] = [];
  const latest = readings[0];

  if (latest && latest.value < HYPO_THRESHOLD) {
    alerts.push({
      id: alertId("hypo", latest.at), type: "hypo", severity: "critical",
      title: "Low glucose detected",
      body:  `${latest.value.toFixed(1)} mmol/L — confirm and treat per your hypo plan.`,
      triggeredAt: latest.at, metadata: { value: latest.value },
    });
  }
  if (latest && latest.value > HYPER_THRESHOLD) {
    alerts.push({
      id: alertId("hyper", latest.at), type: "hyper", severity: "warning",
      title: "High glucose detected",
      body:  `${latest.value.toFixed(1)} mmol/L — review with your care team.`,
      triggeredAt: latest.at, metadata: { value: latest.value },
    });
  }

  // Fast trend: compare latest to a reading ~FAST_TREND_WINDOW ago
  if (readings.length >= 2) {
    const target = Date.now() - FAST_TREND_WINDOW * 60_000;
    const earlier = readings.find((r) => new Date(r.at).getTime() <= target) ?? readings[readings.length - 1];
    const delta = latest.value - earlier.value;
    if (delta >= FAST_TREND_DELTA) {
      alerts.push({
        id: alertId("rising_fast", latest.at), type: "rising_fast", severity: "warning",
        title: "Glucose rising fast",
        body:  `+${delta.toFixed(1)} mmol/L in the last ${FAST_TREND_WINDOW} min.`,
        triggeredAt: latest.at, metadata: { delta, windowMin: FAST_TREND_WINDOW },
      });
    } else if (delta <= -FAST_TREND_DELTA) {
      alerts.push({
        id: alertId("falling_fast", latest.at), type: "falling_fast", severity: "warning",
        title: "Glucose falling fast",
        body:  `${delta.toFixed(1)} mmol/L in the last ${FAST_TREND_WINDOW} min.`,
        triggeredAt: latest.at, metadata: { delta, windowMin: FAST_TREND_WINDOW },
      });
    }
  }

  // Stacking: count distinct doses still likely on board (simple proxy)
  const stackCount = doses.length;
  if (stackCount >= STACKING_THRESHOLD) {
    const bucket = doses[0]?.at ?? new Date().toISOString();
    alerts.push({
      id: alertId("stacking", bucket), type: "stacking", severity: "warning",
      title: "Insulin stacking detected",
      body:  `${stackCount} doses in the last ${STACKING_LOOKBACK_HOURS}h — IOB tails may overlap.`,
      triggeredAt: bucket, metadata: { count: stackCount, hours: STACKING_LOOKBACK_HOURS },
    });
  }

  return res.json({ ok: true, alerts, computedAt: new Date().toISOString() });
});

// ── POST /api/alerts/dismiss ─────────────────────────────────────────────────
const DismissBody = z.object({ alertId: z.string().min(1).max(200) });

alertsRouter.post("/dismiss", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = DismissBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "alertId required" });

  const userId = req.user!.id;
  await supabase.from("audit_log").insert({
    user_id: userId, action: "alert.dismiss",
    resource_type: "alert", resource_id: parsed.data.alertId,
    metadata: { dismissedAt: new Date().toISOString() },
  });
  return res.json({ ok: true });
});

// ── PUT /api/alerts/snooze ───────────────────────────────────────────────────
const SnoozeBody = z.object({
  alertId: z.string().min(1).max(200),
  untilIso: z.string().regex(/^\d{4}-\d{2}-\d{2}T/),
});

alertsRouter.put("/snooze", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = SnoozeBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "alertId and untilIso required" });

  const userId = req.user!.id;
  await supabase.from("audit_log").insert({
    user_id: userId, action: "alert.snooze",
    resource_type: "alert", resource_id: parsed.data.alertId,
    metadata: { snoozedUntil: parsed.data.untilIso, recordedAt: new Date().toISOString() },
  });
  return res.json({ ok: true, snoozedUntil: parsed.data.untilIso });
});
