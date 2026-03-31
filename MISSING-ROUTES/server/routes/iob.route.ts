/**
 * GluMira™ V7 — server/routes/iob.route.ts
 * POST /api/iob/calculate   — full IOB + stacking score + optimal timing
 * POST /api/iob/snapshot    — save snapshot to iob_snapshots table
 * GET  /api/iob/history/:patientId — last 24h IOB snapshots
 * Version: v1.0 · 2026-03-29
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { supabase } from "../index";
import { requireAuth, getUserId } from "../middleware/auth";
import {
  calcIOB, calcStackingScore, getStackingRiskZone,
  calcISF, calcICR, calcCorrectionDose, calcNetCorrection,
  calcMealBolus, calcTotalBolus, calcOptimalDoseTime,
  INSULIN_PARAMS,
} from "../analytics/iob-engine";

export const iobRouter = Router();

// ── Schemas ───────────────────────────────────────────────────────────────────
const DoseInputSchema = z.object({
  insulinType:    z.enum(["glargine_u100","glargine_u300","degludec","detemir","nph","aspart","lispro","glulisine","regular"]),
  doseUnits:      z.number().min(0.5).max(200),
  administeredAt: z.string().datetime(),
});

const CalcSchema = z.object({
  patientId:       z.string().uuid().optional(),
  doses:           z.array(DoseInputSchema).min(1),
  tdd:             z.number().min(2).max(300).default(18),
  typicalBasalDose:z.number().min(1).max(300).default(18),
  currentGlucose:  z.number().min(0).max(40).optional(),
  targetGlucose:   z.number().min(3.5).max(12).default(6.0),
  carbGrams:       z.number().min(0).max(500).default(0),
  isfOverride:     z.number().min(0.5).max(15).optional(),
  icrOverride:     z.number().min(2).max(50).optional(),
});

// ── POST /api/iob/calculate ───────────────────────────────────────────────────
iobRouter.post("/calculate", requireAuth, async (req: Request, res: Response) => {
  const p = CalcSchema.safeParse(req.body);
  if (!p.success)
    return res.status(400).json({ error: "Invalid input", details: p.error.flatten().fieldErrors });

  const {
    doses, tdd, typicalBasalDose,
    currentGlucose, targetGlucose, carbGrams,
    isfOverride, icrOverride,
  } = p.data;

  const now = new Date();
  const isf = isfOverride ?? calcISF(tdd);
  const icr = icrOverride ?? calcICR(tdd);

  // Build dose breakdown
  const doseBreakdown = doses.map(d => {
    const hoursElapsed = (now.getTime() - new Date(d.administeredAt).getTime()) / 3_600_000;
    const doa = INSULIN_PARAMS[d.insulinType].doa;
    const residualIOB = calcIOB(d.doseUnits, hoursElapsed, doa);
    return {
      insulinType:   d.insulinType,
      doseUnits:     d.doseUnits,
      administeredAt:d.administeredAt,
      hoursElapsed:  Math.round(hoursElapsed * 10) / 10,
      residualIOB:   Math.round(residualIOB * 1000) / 1000,
      pctRemaining:  d.doseUnits > 0 ? Math.round((residualIOB / d.doseUnits) * 100) : 0,
      doa,
    };
  });

  const totalIOB     = doseBreakdown.reduce((s, d) => s + d.residualIOB, 0);
  const stackingScore= calcStackingScore(totalIOB, typicalBasalDose);
  const riskZone     = getStackingRiskZone(stackingScore);
  const correctionDose = currentGlucose != null
    ? calcCorrectionDose(currentGlucose, targetGlucose, isf)
    : 0;
  const netCorrection  = calcNetCorrection(correctionDose, totalIOB);
  const mealBolus      = carbGrams > 0 ? calcMealBolus(carbGrams, icr) : 0;
  const totalBolus     = calcTotalBolus(mealBolus, netCorrection);

  const optimalNextDoseH = calcOptimalDoseTime(
    doseBreakdown.map(d => ({ doseUnits: d.doseUnits, hoursElapsed: d.hoursElapsed, insulinType: d.insulinType as keyof typeof INSULIN_PARAMS })),
    typicalBasalDose
  );

  const result = {
    totalIOB:          Math.round(totalIOB * 1000) / 1000,
    stackingScore:     Math.round(stackingScore * 10) / 10,
    riskZone,
    isf:               Math.round(isf * 100) / 100,
    icr:               Math.round(icr * 100) / 100,
    correctionDose:    Math.round(correctionDose * 100) / 100,
    netCorrection:     Math.round(netCorrection * 100) / 100,
    mealBolus:         Math.round(mealBolus * 100) / 100,
    totalBolus:        Math.round(totalBolus * 100) / 100,
    optimalNextDoseH,
    doseBreakdown,
    calculatedAt:      now.toISOString(),
    disclaimer:        "GluMira™ is an educational platform, not a medical device. Discuss all clinical decisions with your care team.",
  };

  return res.json({ ok: true, ...result });
});

// ── POST /api/iob/snapshot ────────────────────────────────────────────────────
iobRouter.post("/snapshot", requireAuth, async (req: Request, res: Response) => {
  const { patientId, totalIOB, stackingScore, riskZone, doseBreakdown, isfUsed, icrUsed, optimalNextDoseH } = req.body;
  if (!patientId) return res.status(400).json({ error: "patientId required" });

  const { error } = await supabase.from("iob_snapshots").insert({
    patient_id:         patientId,
    total_iob:          totalIOB,
    stacking_score:     stackingScore,
    risk_zone:          riskZone,
    dose_breakdown:     doseBreakdown,
    isf_used:           isfUsed,
    icr_used:           icrUsed,
    optimal_next_dose_h: optimalNextDoseH,
  });

  if (error) return res.status(500).json({ error: "Failed to save snapshot" });
  return res.json({ ok: true });
});

// ── GET /api/iob/history/:patientId ──────────────────────────────────────────
iobRouter.get("/history/:patientId", requireAuth, async (req: Request, res: Response) => {
  const { data, error } = await supabase
    .from("iob_snapshots")
    .select("total_iob, stacking_score, risk_zone, calculated_at")
    .eq("patient_id", req.params.patientId)
    .gte("calculated_at", new Date(Date.now() - 86400000).toISOString())
    .order("calculated_at", { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ error: "Failed to fetch IOB history" });
  return res.json({ ok: true, history: data ?? [] });
});
