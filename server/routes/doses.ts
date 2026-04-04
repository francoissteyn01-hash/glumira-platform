/**
 * GluMira™ V7 — server/routes/doses.ts
 * Wired to Drizzle ORM — doseLog table
 */

import { Router, type Request, type Response } from "express";
import { requireAuth, getUserId } from "../middleware/auth";
import { db } from "../db";
import { doseLog } from "../db/schema";
import { eq, and, gt, desc } from "drizzle-orm";

export const dosesRouter = Router();
dosesRouter.use(requireAuth);

// GET /api/doses/history?days=7
dosesRouter.get("/history", async (req: Request, res: Response) => {
  try {
    const daysParam = req.query.days as string;
    const days = Math.min(Math.max(parseInt(daysParam ?? "7", 10) || 7, 1), 90);
    const userId = getUserId(req);
    const since = new Date(Date.now() - days * 86_400_000);

    const doses = await db.select().from(doseLog)
      .where(and(eq(doseLog.createdBy, userId), gt(doseLog.administeredAt, since)))
      .orderBy(desc(doseLog.administeredAt));

    // Group by date
    const groups = new Map<string, typeof doses>();
    for (const d of doses) {
      const date = d.administeredAt.toISOString().slice(0, 10);
      if (!groups.has(date)) groups.set(date, []);
      groups.get(date)!.push(d);
    }

    const grouped = Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, dd]) => ({
        date,
        doses: dd,
        totalUnits: dd.reduce((s, d) => s + parseFloat(d.doseUnits), 0),
      }));

    res.json({
      ok: true,
      days,
      totalDoses: doses.length,
      totalUnits: doses.reduce((s, d) => s + parseFloat(d.doseUnits), 0),
      groups: grouped,
      disclaimer: "GluMira™ is an educational platform, not a medical device.",
    });
  } catch (err) {
    console.error("[doses/history]", err);
    res.status(500).json({ error: "Failed to fetch dose history" });
  }
});

// POST /api/doses/log
dosesRouter.post("/log", async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { patientId, insulinType, doseUnits, administeredAt, doseReason, carbsG, glucoseAtTime, notes } = req.body;

    if (!patientId || !insulinType || !doseUnits) {
      return res.status(400).json({ error: "patientId, insulinType, doseUnits required" });
    }

    const [inserted] = await db.insert(doseLog).values({
      patientId,
      insulinType,
      doseUnits: String(doseUnits),
      administeredAt: administeredAt ? new Date(administeredAt) : new Date(),
      doseReason: doseReason ?? null,
      carbsG: carbsG ? String(carbsG) : null,
      glucoseAtTime: glucoseAtTime ? String(glucoseAtTime) : null,
      notes: notes ?? null,
      createdBy: userId,
    }).returning();

    res.status(201).json({ ok: true, dose: inserted });
  } catch (err) {
    console.error("[doses/log]", err);
    res.status(500).json({ error: "Failed to log dose" });
  }
});
