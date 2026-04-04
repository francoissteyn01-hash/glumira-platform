/**
 * GluMira™ V7 — server/routes/nightscout.ts
 * Wired to Drizzle ORM — glucoseReadings table
 */

import { Router, type Request, type Response } from "express";
import { requireAuth, getUserId } from "../middleware/auth";
import { db } from "../db";
import { glucoseReadings } from "../db/schema";
import { eq, gt, asc, and } from "drizzle-orm";

export const nightscoutRouter = Router();
nightscoutRouter.use(requireAuth);

// POST /api/nightscout/sync
nightscoutRouter.post("/sync", async (req: Request, res: Response) => {
  try {
    const { url, apiSecret, days = 1, patientId } = req.body;
    if (!url) return res.status(400).json({ error: "url required" });
    if (!patientId) return res.status(400).json({ error: "patientId required" });

    const hours = days * 24;
    const since = new Date(Date.now() - hours * 3_600_000).toISOString();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiSecret) headers["api-secret"] = apiSecret;

    const nsRes = await fetch(
      `${url}/api/v1/entries/sgv.json?count=1000&find[dateString][$gte]=${since}`,
      { headers, signal: AbortSignal.timeout(15000) }
    );
    if (!nsRes.ok) {
      return res.status(400).json({ error: `Nightscout returned ${nsRes.status}` });
    }
    const entries = (await nsRes.json()) as Array<{ sgv: number; dateString: string; direction?: string }>;

    let imported = 0;
    let errors = 0;

    for (const e of entries) {
      const mmol = parseFloat((e.sgv / 18.0182).toFixed(1));
      const recordedAt = new Date(e.dateString);

      try {
        await db.insert(glucoseReadings).values({
          patientId,
          valueMmol: String(mmol),
          valueMgdl: String(e.sgv),
          trendArrow: e.direction ?? "NONE",
          source: "nightscout",
          recordedAt,
        }).onConflictDoNothing();
        imported++;
      } catch {
        errors++;
      }
    }

    res.json({
      status: "success",
      readingsImported: imported,
      readingsSkipped: entries.length - imported,
      errors,
      lastSyncAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[nightscout/sync]", err);
    res.status(500).json({ error: "Sync failed" });
  }
});

// GET /api/nightscout/sync?patientId=&hours=24
nightscoutRouter.get("/sync", async (req: Request, res: Response) => {
  try {
    const { patientId, hours = "24" } = req.query as Record<string, string>;
    if (!patientId) return res.status(400).json({ error: "patientId required" });

    const since = new Date(Date.now() - parseInt(hours, 10) * 3_600_000);

    const readings = await db.select().from(glucoseReadings)
      .where(and(eq(glucoseReadings.patientId, patientId), gt(glucoseReadings.recordedAt, since)))
      .orderBy(asc(glucoseReadings.recordedAt));

    res.json({ readings, patientId, hours: parseInt(hours, 10) });
  } catch (err) {
    console.error("[nightscout/get]", err);
    res.status(500).json({ error: "Failed to fetch readings" });
  }
});

// POST /api/nightscout/test
nightscoutRouter.post("/test", async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "url required" });
    const testRes = await fetch(`${url}/api/v1/status.json`, { signal: AbortSignal.timeout(5000) });
    if (testRes.ok) res.json({ connected: true });
    else res.status(400).json({ connected: false, error: `HTTP ${testRes.status}` });
  } catch {
    res.status(400).json({ connected: false, error: "Connection failed" });
  }
});
