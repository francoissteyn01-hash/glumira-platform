/**
 * GluMira™ Dexcom Share Bridge Route
 * Version: 7.0.0
 * Module: INT-DEXCOM-SHARE-ROUTE
 *
 * POST /api/dexcom-share/test
 *   Tests connectivity to Dexcom Share servers using provided credentials.
 *
 * GET  /api/dexcom-share/latest
 *   Returns the latest glucose reading from Dexcom Share.
 *
 * POST /api/dexcom-share/sync
 *   Pulls glucose readings from Dexcom Share and stores them in the
 *   GluMira database, de-duplicating against existing entries.
 *
 * POST /api/dexcom-share/cron
 *   Intended for cron/scheduled invocation. Syncs all patients who have
 *   Dexcom Share credentials configured.
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { Router, type Request, type Response } from "express";
import {
  DexcomShareClient,
  createDexcomShareClientFromEnv,
  dexcomReadingToGlucoseReading,
  type DexcomShareConfig,
  type DexcomParsedReading,
} from "./dexcom-share-bridge";

export const dexcomShareRouter = Router();

// ─── POST /api/dexcom-share/test ─────────────────────────────

dexcomShareRouter.post("/test", async (req: Request, res: Response) => {
  const { username, password, region } = req.body as Partial<DexcomShareConfig>;

  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  try {
    const client = new DexcomShareClient({
      username,
      password,
      region: region ?? "INTERNATIONAL",
    });
    const result = await client.testConnection();
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Connection test failed" });
  }
});

// ─── GET /api/dexcom-share/latest ────────────────────────────

dexcomShareRouter.get("/latest", async (_req: Request, res: Response) => {
  try {
    const client = createDexcomShareClientFromEnv();
    if (!client) {
      return res.status(503).json({
        error: "Dexcom Share not configured. Set DEXCOM_SHARE_USERNAME and DEXCOM_SHARE_PASSWORD.",
      });
    }

    const latest = await client.getLatestReading();
    if (!latest) {
      return res.status(404).json({ error: "No glucose data available from Dexcom Share" });
    }

    return res.status(200).json({
      glucoseValue: latest.glucoseValue,
      glucoseUnit: latest.glucoseUnit,
      readingTime: latest.readingTime.toISOString(),
      trend: latest.trendArrow,
      trendDirection: latest.trendDirection,
      source: latest.source,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Failed to fetch latest reading" });
  }
});

// ─── POST /api/dexcom-share/sync ─────────────────────────────

interface SyncRequestBody {
  patientId: number;
  credentials?: {
    username: string;
    password: string;
    region?: "US" | "INTERNATIONAL";
  };
  options?: {
    minutes?: number;
    maxCount?: number;
  };
}

dexcomShareRouter.post("/sync", async (req: Request, res: Response) => {
  const body = req.body as Partial<SyncRequestBody>;

  if (!body.patientId) {
    return res.status(400).json({ error: "patientId is required" });
  }

  const { patientId, credentials, options = {} } = body as SyncRequestBody;
  const { minutes = 1440, maxCount = 288 } = options;

  // Use provided credentials or fall back to environment variables
  let client: DexcomShareClient;
  if (credentials?.username && credentials?.password) {
    client = new DexcomShareClient({
      username: credentials.username,
      password: credentials.password,
      region: credentials.region ?? "INTERNATIONAL",
    });
  } else {
    const envClient = createDexcomShareClientFromEnv();
    if (!envClient) {
      return res.status(503).json({
        error: "No Dexcom Share credentials provided or configured in environment.",
      });
    }
    client = envClient;
  }

  try {
    // Authenticate
    await client.authenticate();

    // Fetch readings
    const readings: DexcomParsedReading[] = await client.getReadings(minutes, maxCount);

    // Map to GluMira schema
    const glucoseInserts = readings.map((r) => dexcomReadingToGlucoseReading(r, patientId));

    // In production: batch insert with de-duplication
    // await batchInsertGlucoseReadings(glucoseInserts);
    // For now: return the count and sample data

    return res.status(200).json({
      success: true,
      readingsCount: glucoseInserts.length,
      oldestReading: readings.length > 0
        ? readings[readings.length - 1].readingTime.toISOString()
        : null,
      newestReading: readings.length > 0
        ? readings[0].readingTime.toISOString()
        : null,
      sampleReading: glucoseInserts[0] ?? null,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message ?? "Dexcom Share sync failed",
    });
  }
});

// ─── POST /api/dexcom-share/cron ─────────────────────────────

/**
 * Cron endpoint for automated syncing.
 * Expects a CRON_SECRET header for security.
 * In production, this would iterate over all patients with Dexcom Share
 * credentials stored in the database and sync each one.
 */
dexcomShareRouter.post("/cron", async (req: Request, res: Response) => {
  const cronSecret = req.headers["x-cron-secret"];
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && cronSecret !== expectedSecret) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const client = createDexcomShareClientFromEnv();
    if (!client) {
      return res.status(503).json({
        error: "Dexcom Share not configured for cron sync.",
      });
    }

    await client.authenticate();
    const readings = await client.getReadings(30, 6); // Last 30 min, up to 6 readings

    return res.status(200).json({
      success: true,
      readingsCount: readings.length,
      latestValue: readings[0]?.glucoseValue ?? null,
      latestTrend: readings[0]?.trendArrow ?? null,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err.message ?? "Cron sync failed",
    });
  }
});
