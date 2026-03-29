/**
 * GluMira™ V7 — server/routes/doses.ts
 * Adapts: 04.1.30_doses-history-route_v1.0.ts
 */

import { Router, type Request, type Response } from "express";
import { requireAuth, getUserId } from "../middleware/auth";

export const dosesRouter = Router();
dosesRouter.use(requireAuth);

// GET /api/doses/history?days=7
// Adapts 04.1.30_doses-history-route_v1.0.ts
dosesRouter.get("/history", async (req: Request, res: Response) => {
  try {
    const daysParam = req.query.days as string;
    const days = Math.min(Math.max(parseInt(daysParam ?? "7", 10) || 7, 1), 90);
    const userId = getUserId(req);

    // TODO: replace with Drizzle query
    // const since = new Date(Date.now() - days * 86_400_000);
    // const doses = await db.select().from(doseLog)
    //   .where(and(eq(doseLog.patientId, userId), gt(doseLog.administeredAt, since)));

    res.json({
      ok: true,
      days,
      totalDoses: 0,
      totalUnits: 0,
      groups: [],
      disclaimer: "GluMira™ is an educational platform, not a medical device.",
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch dose history" });
  }
});

// POST /api/doses/log
dosesRouter.post("/log", async (req: Request, res: Response) => {
  try {
    const { patientId, insulinType, doseUnits, administeredAt, doseReason, carbsG, notes } = req.body;
    if (!patientId || !insulinType || !doseUnits) {
      return res.status(400).json({ error: "patientId, insulinType, doseUnits required" });
    }
    // TODO: Drizzle insert
    res.status(201).json({ ok: true, message: "Dose logged" });
  } catch (err) {
    res.status(500).json({ error: "Failed to log dose" });
  }
});
