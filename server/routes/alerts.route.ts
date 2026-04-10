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
import {
  computeAlerts,
  shapeHistory,
  STACKING_LOOKBACK_HOURS,
  type AuditLogRow,
  type GlucoseReading,
  type InsulinDose,
} from "../analytics/alerts-engine";

export const alertsRouter = Router();

const RECENT_WINDOW_MIN = 30;

// ── GET /api/alerts ──────────────────────────────────────────────────────────
alertsRouter.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const since = new Date(Date.now() - RECENT_WINDOW_MIN * 60_000).toISOString();

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

  const readings: GlucoseReading[] = (gRows ?? []).map((r) => ({
    value: Number(r.value_mmol),
    at:    r.recorded_at as string,
  }));
  const doses: InsulinDose[] = (iRows ?? []).map((d) => ({
    units: Number(d.dose_units),
    at:    d.event_time as string,
  }));

  const alerts = computeAlerts(readings, doses);
  return res.json({ ok: true, alerts, computedAt: new Date().toISOString() });
});

// ── POST /api/alerts/dismiss ─────────────────────────────────────────────────
const DismissBody = z.object({ alertId: z.string().min(1).max(200) });

alertsRouter.post("/dismiss", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = DismissBody.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "alertId required" });

  const userId = req.user!.id;
  // NOTE: audit_log.resource_id is a uuid column, but our alertIds are
  // composite strings (`${type}:${bucketIso}`). We store the alertId in
  // metadata.alertId and leave resource_id null.
  await supabase.from("audit_log").insert({
    user_id: userId,
    action: "alert.dismiss",
    resource_type: "alert",
    metadata: { alertId: parsed.data.alertId, dismissedAt: new Date().toISOString() },
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
    user_id: userId,
    action: "alert.snooze",
    resource_type: "alert",
    metadata: {
      alertId: parsed.data.alertId,
      snoozedUntil: parsed.data.untilIso,
      recordedAt: new Date().toISOString(),
    },
  });
  return res.json({ ok: true, snoozedUntil: parsed.data.untilIso });
});

// ── GET /api/alerts/history ──────────────────────────────────────────────────
//
// Returns a paged list of past dismiss/snooze actions for the current user,
// sourced from the audit_log table. Used by the AlertHistoryPage to show
// users what they have hidden and when.
//
// Query params:
//   limit  — 1..200, default 50
//   action — "dismiss" | "snooze" (optional filter)
//   type   — "hypo" | "hyper" | "stacking" | "rising_fast" | "falling_fast" (optional)

const HistoryQuery = z.object({
  limit:  z.coerce.number().int().min(1).max(200).default(50),
  action: z.enum(["dismiss", "snooze"]).optional(),
  type:   z.enum(["hypo", "hyper", "stacking", "rising_fast", "falling_fast"]).optional(),
});

alertsRouter.get("/history", requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = HistoryQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid query", details: parsed.error.flatten().fieldErrors });
  }
  const { limit, action, type } = parsed.data;
  const userId = req.user!.id;

  let query = supabase.from("audit_log")
    .select("id, user_id, action, resource_type, resource_id, metadata, created_at")
    .eq("user_id", userId)
    .in("action", action ? [`alert.${action}`] : ["alert.dismiss", "alert.snooze"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (type) {
    // metadata.alertId follows the `${type}:${bucketIso}` convention,
    // so a prefix filter on the JSONB field recovers the right rows.
    query = query.like("metadata->>alertId", `${type}:%`);
  }

  const { data: rows, error } = await query;
  if (error) {
    console.error("[alerts/history] db error:", error.message);
    return res.status(500).json({ error: "Database error" });
  }

  const entries = shapeHistory((rows ?? []) as AuditLogRow[]);
  return res.json({
    ok: true,
    entries,
    total: entries.length,
    appliedFilters: { action: action ?? null, type: type ?? null, limit },
  });
});
