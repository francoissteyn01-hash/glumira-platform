/**
 * GluMira™ V7 — server/routes/nightscout.ts
 * Adapts: 04.2.15_useNightscoutSync, 04.2.16_useNightscoutData
 */

import { Router, type Request, type Response } from "express";
import { requireAuth, getUserId } from "../middleware/auth";

export const nightscoutRouter = Router();
nightscoutRouter.use(requireAuth);

// POST /api/nightscout/sync
nightscoutRouter.post("/sync", async (req: Request, res: Response) => {
  try {
    const { url, apiSecret, days = 1 } = req.body;
    if (!url) return res.status(400).json({ error: "url required" });

    // Nightscout API: fetch SGV entries
    const hours = days * 24;
    const since = new Date(Date.now() - hours * 3_600_000).toISOString();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (apiSecret) headers["api-secret"] = apiSecret;

    const nsRes = await fetch(`${url}/api/v1/entries/sgv.json?count=1000&find[dateString][$gte]=${since}`, { headers });
    if (!nsRes.ok) {
      return res.status(400).json({ error: `Nightscout returned ${nsRes.status}` });
    }
    const entries = (await nsRes.json()) as Array<{ sgv: number; dateString: string; direction?: string }>;

    const readings = entries.map((e) => ({
      glucose: parseFloat((e.sgv / 18.0182).toFixed(1)), // mg/dL → mmol/L
      time: e.dateString,
      trend: e.direction ?? "NONE",
      source: "nightscout",
    }));

    // TODO: upsert to glucose_readings table via Drizzle

    res.json({
      status: "success",
      readingsImported: readings.length,
      dosesImported: 0,
      lastSyncAt: new Date().toISOString(),
      errors: [],
      readings,
    });
  } catch (err) {
    console.error("[nightscout/sync]", err);
    res.status(500).json({ error: "Sync failed" });
  }
});

// GET /api/nightscout/sync?patientId=&hours= (useNightscoutData hook)
nightscoutRouter.get("/sync", async (req: Request, res: Response) => {
  try {
    const { patientId, hours = "24" } = req.query as Record<string, string>;
    if (!patientId) return res.status(400).json({ error: "patientId required" });

    // TODO: fetch from glucose_readings table via Drizzle
    // const readings = await db.select().from(glucoseReadings)
    //   .where(eq(glucoseReadings.patientId, patientId))
    //   .where(gt(glucoseReadings.recordedAt, new Date(Date.now() - parseInt(hours)*3600000)))
    //   .orderBy(asc(glucoseReadings.recordedAt));

    res.json({ readings: [], patientId, hours: parseInt(hours, 10) });
  } catch (err) {
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
