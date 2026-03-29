/**
 * GluMira™ V7 — server/routes/settings.ts
 * Adapts: 04.2.11_useSettings_v1.0.ts
 */

import { Router, type Request, type Response } from "express";
import { requireAuth, getUserId } from "../middleware/auth";

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

// GET /api/settings
settingsRouter.get("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    // TODO: Drizzle fetch from user_settings table
    res.json({
      glucoseUnit: "mmol",
      theme: "system",
      notificationsEnabled: true,
      pushEnabled: false,
      lowAlertThreshold: 3.9,
      highAlertThreshold: 10.0,
      nightscoutUrl: null,
      nightscoutToken: null,
      language: "en",
      timezone: "Africa/Windhoek",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load settings" });
  }
});

// PATCH /api/settings
settingsRouter.patch("/", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const patch = req.body;
    // TODO: Drizzle upsert settings
    res.json({ ok: true, ...patch });
  } catch (err) {
    res.status(500).json({ error: "Failed to save settings" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────

/**
 * GluMira™ V7 — server/routes/telemetry.ts
 * Adapts: 04.2.9_useTelemetry_v1.0.ts
 */

import { Router as TRouter, type Request as TReq, type Response as TRes } from "express";

export const telemetryRouter = TRouter();
// No auth required — telemetry is best-effort, unauthenticated events are dropped

// POST /api/telemetry/events
telemetryRouter.post("/events", async (req: TReq, res: TRes) => {
  try {
    const { userId, sessionId, events, batchSentAt } = req.body;
    if (!Array.isArray(events)) return res.status(400).json({ error: "events array required" });

    // TODO: Insert to telemetry_wave_groupb table via Drizzle
    // Pending migration: 20260327_wave_groupb_telemetry.sql (Priority 1)
    console.log(`[telemetry] ${events.length} events from session ${sessionId}`);

    res.status(202).json({ ok: true, accepted: events.length });
  } catch (err) {
    // Telemetry must never error loudly — silent 202
    res.status(202).json({ ok: true, accepted: 0 });
  }
});
