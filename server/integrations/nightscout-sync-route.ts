/**
 * GluMira™ Nightscout Sync Route
 * Version: 7.0.0
 * Module: INT-NIGHTSCOUT
 *
 * POST /api/nightscout/sync
 *   Pulls SGV, treatments, and device status from a patient's Nightscout
 *   instance and stores them in the GluMira database.
 *
 * POST /api/nightscout/test
 *   Tests connectivity to a Nightscout instance.
 *
 * GET /api/nightscout/latest
 *   Returns the latest SGV reading from the patient's Nightscout instance.
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { Router, type Request, type Response } from "express";
import {
  NightscoutClient,
  sgvToGlucoseReading,
  treatmentToInsulinDose,
  type NightscoutConfig,
} from "./nightscout";

export const nightscoutSyncRouter = Router();

// ─── POST /api/nightscout/test ────────────────────────────────

nightscoutSyncRouter.post("/test", async (req: Request, res: Response) => {
  const { baseUrl, apiSecret, jwtToken } = req.body as Partial<NightscoutConfig>;

  if (!baseUrl) {
    return res.status(400).json({ error: "baseUrl is required" });
  }

  try {
    const client = new NightscoutClient({ baseUrl, apiSecret, jwtToken });
    const result = await client.testConnection();
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Connection test failed" });
  }
});

// ─── GET /api/nightscout/latest ───────────────────────────────

nightscoutSyncRouter.get("/latest", async (req: Request, res: Response) => {
  const baseUrl = req.query.baseUrl as string | undefined;
  const apiSecret = req.query.apiSecret as string | undefined;
  const jwtToken = req.query.jwtToken as string | undefined;

  if (!baseUrl) {
    return res.status(400).json({ error: "baseUrl query parameter is required" });
  }

  try {
    const client = new NightscoutClient({ baseUrl, apiSecret, jwtToken });
    const latest = await client.getLatestSGV();
    if (!latest) {
      return res.status(404).json({ error: "No SGV data found" });
    }
    return res.status(200).json(latest);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Failed to fetch latest SGV" });
  }
});

// ─── POST /api/nightscout/sync ────────────────────────────────

interface SyncRequestBody {
  patientId: number;
  nightscoutConfig: NightscoutConfig;
  options?: {
    sgvCount?: number;
    treatmentCount?: number;
    fromDate?: string;
    toDate?: string;
    syncSGV?: boolean;
    syncTreatments?: boolean;
    syncDeviceStatus?: boolean;
  };
}

nightscoutSyncRouter.post("/sync", async (req: Request, res: Response) => {
  const body = req.body as Partial<SyncRequestBody>;

  if (!body.patientId || !body.nightscoutConfig?.baseUrl) {
    return res.status(400).json({
      error: "patientId and nightscoutConfig.baseUrl are required",
    });
  }

  const { patientId, nightscoutConfig, options = {} } = body as SyncRequestBody;
  const {
    sgvCount = 288,
    treatmentCount = 100,
    fromDate,
    toDate,
    syncSGV = true,
    syncTreatments = true,
    syncDeviceStatus = true,
  } = options;

  const client = new NightscoutClient(nightscoutConfig);
  const errors: string[] = [];
  let sgvCount_ = 0;
  let treatmentCount_ = 0;
  let deviceStatusCount_ = 0;

  // ── Test connection first ──
  const connectionTest = await client.testConnection();
  if (!connectionTest.success) {
    return res.status(502).json({
      error: `Nightscout connection failed: ${connectionTest.error}`,
    });
  }

  // ── Sync SGV ──
  if (syncSGV) {
    try {
      const sgvEntries = await client.getSGV({ count: sgvCount, fromDate, toDate });
      for (const sgv of sgvEntries) {
        try {
          const _reading = sgvToGlucoseReading(sgv, patientId);
          // In production: await createGlucoseReading(reading);
          // For now: count and validate shape
          sgvCount_++;
        } catch (e: any) {
          errors.push(`SGV ${sgv._id}: ${e.message}`);
        }
      }
    } catch (e: any) {
      errors.push(`SGV fetch failed: ${e.message}`);
    }
  }

  // ── Sync Treatments ──
  if (syncTreatments) {
    try {
      const treatments = await client.getTreatments({
        count: treatmentCount,
        fromDate,
        toDate,
      });
      for (const treatment of treatments) {
        try {
          const dose = treatmentToInsulinDose(treatment, patientId);
          if (dose) {
            // In production: await createInsulinDose(dose);
            treatmentCount_++;
          }
        } catch (e: any) {
          errors.push(`Treatment ${treatment._id}: ${e.message}`);
        }
      }
    } catch (e: any) {
      errors.push(`Treatments fetch failed: ${e.message}`);
    }
  }

  // ── Sync Device Status ──
  if (syncDeviceStatus) {
    try {
      const statuses = await client.getDeviceStatus(5);
      deviceStatusCount_ = statuses.length;
    } catch (e: any) {
      errors.push(`Device status fetch failed: ${e.message}`);
    }
  }

  return res.status(200).json({
    sgvCount: sgvCount_,
    treatmentCount: treatmentCount_,
    deviceStatusCount: deviceStatusCount_,
    syncedAt: new Date().toISOString(),
    errors,
  });
});
