/**
 * GluMira™ V7 — server/routes/telemetry.ts
 * Wired to Drizzle ORM — telemetryWaveGroupB table
 */

import { Router, type Request, type Response } from "express";
import { db } from "../db";
import { telemetryWaveGroupB } from "../db/schema";

export const telemetryRouter = Router();

// POST /api/telemetry/events
telemetryRouter.post("/events", async (req: Request, res: Response) => {
  try {
    const { userId, sessionId, events } = req.body;
    if (!Array.isArray(events)) return res.status(400).json({ error: "events array required" });

    const rows = events.map((e: { eventType: string; eventData?: Record<string, unknown> }) => ({
      patientId: userId ?? null,
      eventType: e.eventType ?? "unknown",
      eventData: e.eventData ?? null,
      sessionId: sessionId ?? null,
    }));

    if (rows.length > 0) {
      await db.insert(telemetryWaveGroupB).values(rows);
    }

    res.status(202).json({ ok: true, accepted: rows.length });
  } catch (err) {
    // Telemetry must never error loudly — silent 202
    console.error("[telemetry]", err);
    res.status(202).json({ ok: true, accepted: 0 });
  }
});
