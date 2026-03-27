/**
 * GluMira™ Telemetry Route
 * Version: 7.0.0
 * Module: TEL-ROUTE
 *
 * POST /api/telemetry/events
 *   Receives a batch of telemetry events from the client.
 *
 * POST /api/telemetry/cron/daily-metrics
 *   Cron endpoint to compute and store daily metrics.
 *
 * GET  /api/telemetry/status
 *   Returns current telemetry system status and recent event counts.
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { Router, type Request, type Response } from "express";
import {
  validateBatch,
  batchToInserts,
  computeDailyMetrics,
  type TelemetryBatch,
  type TelemetryInsert,
} from "./telemetry-engine";

export const telemetryRouter = Router();

// In-memory buffer for development/testing
// In production, this writes directly to Supabase via the client
const eventBuffer: TelemetryInsert[] = [];

// ─── POST /api/telemetry/events ──────────────────────────────

telemetryRouter.post("/events", async (req: Request, res: Response) => {
  const batch = req.body as TelemetryBatch;

  // Validate
  const errors = validateBatch(batch);
  if (errors.length > 0) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }

  try {
    // Transform to insert rows
    const inserts = batchToInserts(batch);

    // In production: await supabase.from('telemetry_events').insert(inserts);
    // For now: buffer in memory
    eventBuffer.push(...inserts);

    return res.status(201).json({
      success: true,
      eventsReceived: inserts.length,
      totalBuffered: eventBuffer.length,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Failed to process telemetry batch" });
  }
});

// ─── POST /api/telemetry/cron/daily-metrics ──────────────────

telemetryRouter.post("/cron/daily-metrics", async (req: Request, res: Response) => {
  const cronSecret = req.headers["x-cron-secret"];
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && cronSecret !== expectedSecret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    // In production: query telemetry_events for today's events from Supabase
    // For now: use the in-memory buffer
    const todayEvents = eventBuffer.filter((e) =>
      e.created_at.startsWith(today)
    );

    // In production: query user counts from Supabase
    const totalUsers = new Set(eventBuffer.map((e) => e.user_id)).size;
    const newUsers = 0; // Would query users created today

    const metrics = computeDailyMetrics(todayEvents, today, totalUsers, newUsers);

    // In production: await supabase.from('beta_metrics_daily').upsert(metrics);

    return res.status(200).json({
      success: true,
      metrics,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Failed to compute daily metrics" });
  }
});

// ─── GET /api/telemetry/status ───────────────────────────────

telemetryRouter.get("/status", async (_req: Request, res: Response) => {
  const uniqueUsers = new Set(eventBuffer.map((e) => e.user_id)).size;
  const uniqueSessions = new Set(eventBuffer.map((e) => e.session_id)).size;

  // Category breakdown
  const categoryBreakdown: Record<string, number> = {};
  eventBuffer.forEach((e) => {
    categoryBreakdown[e.event_category] =
      (categoryBreakdown[e.event_category] ?? 0) + 1;
  });

  return res.status(200).json({
    totalEvents: eventBuffer.length,
    uniqueUsers,
    uniqueSessions,
    categoryBreakdown,
    oldestEvent: eventBuffer[0]?.created_at ?? null,
    newestEvent: eventBuffer[eventBuffer.length - 1]?.created_at ?? null,
  });
});
