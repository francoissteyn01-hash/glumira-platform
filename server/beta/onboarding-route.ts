/**
 * GluMira™ Beta Onboarding Routes
 * Version: 7.0.0
 * Module: BETA-ONBOARDING-ROUTE
 *
 * GET  /api/onboarding/status
 *   Returns the current onboarding checkpoint state for the authenticated user.
 *
 * POST /api/onboarding/profile
 *   Saves Step 1: Personal info (firstName, diabetesType).
 *
 * POST /api/onboarding/glucose-settings
 *   Saves Step 2: Glucose unit and target range.
 *
 * POST /api/onboarding/insulin-settings
 *   Saves Step 3: ISF, ICR, DIA.
 *
 * POST /api/onboarding/cgm-source
 *   Saves Step 4: CGM connection credentials (encrypted at rest).
 *
 * POST /api/onboarding/complete
 *   Marks onboarding as complete after first sync verification.
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { Router, type Request, type Response } from "express";

export const onboardingRouter = Router();

// In-memory store for development/testing
// In production: reads/writes to onboarding_checkpoints + patientProfiles via Supabase
const checkpointStore = new Map<string, Record<string, boolean | string | number>>();

// ─── GET /api/onboarding/status ──────────────────────────────

onboardingRouter.get("/status", async (req: Request, res: Response) => {
  const userId = (req as any).userId ?? "dev-user";

  const checkpoints = checkpointStore.get(userId) ?? {
    profileCreated: false,
    diabetesTypeSet: false,
    glucoseUnitSet: false,
    targetRangeSet: false,
    isfSet: false,
    icrSet: false,
    diaSet: false,
    cgmSourceConnected: false,
    firstSyncComplete: false,
    dashboardViewed: false,
    iobChartViewed: false,
    feedbackSubmitted: false,
    onboardingComplete: false,
  };

  return res.status(200).json(checkpoints);
});

// ─── POST /api/onboarding/profile ────────────────────────────

onboardingRouter.post("/profile", async (req: Request, res: Response) => {
  const userId = (req as any).userId ?? "dev-user";
  const { firstName, diabetesType } = req.body;

  if (!firstName || !diabetesType) {
    return res.status(400).json({ error: "firstName and diabetesType are required" });
  }

  const validTypes = ["type1", "type2", "gestational", "lada", "mody", "other"];
  if (!validTypes.includes(diabetesType)) {
    return res.status(400).json({ error: `diabetesType must be one of: ${validTypes.join(", ")}` });
  }

  const existing = checkpointStore.get(userId) ?? {};
  checkpointStore.set(userId, {
    ...existing,
    profileCreated: true,
    diabetesTypeSet: true,
    firstName,
    diabetesType,
  });

  // In production: await supabase.from('patient_profiles').upsert({ ... })
  // In production: await supabase.from('onboarding_checkpoints').upsert({ ... })

  return res.status(200).json({ success: true, step: 1 });
});

// ─── POST /api/onboarding/glucose-settings ───────────────────

onboardingRouter.post("/glucose-settings", async (req: Request, res: Response) => {
  const userId = (req as any).userId ?? "dev-user";
  const { glucoseUnit, targetMin, targetMax } = req.body;

  if (!glucoseUnit || targetMin == null || targetMax == null) {
    return res.status(400).json({ error: "glucoseUnit, targetMin, and targetMax are required" });
  }

  if (!["mg/dL", "mmol/L"].includes(glucoseUnit)) {
    return res.status(400).json({ error: "glucoseUnit must be mg/dL or mmol/L" });
  }

  if (typeof targetMin !== "number" || typeof targetMax !== "number" || targetMin >= targetMax) {
    return res.status(400).json({ error: "targetMin must be less than targetMax" });
  }

  const existing = checkpointStore.get(userId) ?? {};
  checkpointStore.set(userId, {
    ...existing,
    glucoseUnitSet: true,
    targetRangeSet: true,
    glucoseUnit,
    targetMin,
    targetMax,
  });

  return res.status(200).json({ success: true, step: 2 });
});

// ─── POST /api/onboarding/insulin-settings ───────────────────

onboardingRouter.post("/insulin-settings", async (req: Request, res: Response) => {
  const userId = (req as any).userId ?? "dev-user";
  const { insulinSensitivityFactor, carbRatio, iobDecayTimeMinutes } = req.body;

  if (!insulinSensitivityFactor || !carbRatio || !iobDecayTimeMinutes) {
    return res.status(400).json({
      error: "insulinSensitivityFactor, carbRatio, and iobDecayTimeMinutes are required",
    });
  }

  if (typeof insulinSensitivityFactor !== "number" || insulinSensitivityFactor <= 0) {
    return res.status(400).json({ error: "ISF must be a positive number" });
  }
  if (typeof carbRatio !== "number" || carbRatio <= 0) {
    return res.status(400).json({ error: "ICR must be a positive number" });
  }
  if (typeof iobDecayTimeMinutes !== "number" || iobDecayTimeMinutes < 60 || iobDecayTimeMinutes > 600) {
    return res.status(400).json({ error: "DIA must be between 60 and 600 minutes (1-10 hours)" });
  }

  const existing = checkpointStore.get(userId) ?? {};
  checkpointStore.set(userId, {
    ...existing,
    isfSet: true,
    icrSet: true,
    diaSet: true,
    insulinSensitivityFactor,
    carbRatio,
    iobDecayTimeMinutes,
  });

  return res.status(200).json({ success: true, step: 3 });
});

// ─── POST /api/onboarding/cgm-source ─────────────────────────

onboardingRouter.post("/cgm-source", async (req: Request, res: Response) => {
  const userId = (req as any).userId ?? "dev-user";
  const { cgmSource } = req.body;

  if (!cgmSource || !["dexcom", "nightscout"].includes(cgmSource)) {
    return res.status(400).json({ error: "cgmSource must be 'dexcom' or 'nightscout'" });
  }

  // In production: encrypt and store credentials in Supabase Vault
  // NEVER store plaintext passwords in the database

  const existing = checkpointStore.get(userId) ?? {};
  checkpointStore.set(userId, {
    ...existing,
    cgmSourceConnected: true,
    cgmSource,
  });

  return res.status(200).json({ success: true, step: 4 });
});

// ─── POST /api/onboarding/complete ───────────────────────────

onboardingRouter.post("/complete", async (req: Request, res: Response) => {
  const userId = (req as any).userId ?? "dev-user";
  const { skippedSync } = req.body ?? {};

  const existing = checkpointStore.get(userId) ?? {};
  checkpointStore.set(userId, {
    ...existing,
    firstSyncComplete: !skippedSync,
    onboardingComplete: true,
    completedAt: new Date().toISOString(),
  });

  return res.status(200).json({ success: true, onboardingComplete: true });
});
