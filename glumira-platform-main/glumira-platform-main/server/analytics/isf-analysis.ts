/**
 * GluMira™ — isf-analysis.ts
 *
 * Insulin Sensitivity Factor (ISF) analysis module.
 * Implements: ISF estimation rules (1700/1800 rule), ISF validation,
 * correction dose accuracy analysis, and ISF trend detection.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 * All ISF adjustments must be reviewed by a qualified clinician.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CorrectionEvent {
  preCorrectionMmol: number;
  postCorrectionMmol: number;   // glucose 2–4 hours after correction
  doseUnits: number;
  targetMmol: number;
}

export interface IsfEstimateResult {
  estimatedIsf: number;         // mmol/L per unit
  rule: "1700" | "1800";
  totalDailyDose: number;
  confidence: "high" | "medium" | "low";
  notes: string[];
}

export interface CorrectionAccuracyResult {
  observedIsf: number;          // actual glucose drop / dose
  expectedIsf: number;          // configured ISF
  accuracy: number;             // 0–100%
  bias: "over-correcting" | "under-correcting" | "accurate";
  events: number;
  meanError: number;            // mean absolute error in mmol/L
}

export interface IsfTrendResult {
  trend: "improving" | "worsening" | "stable";
  recentIsf: number;
  historicalIsf: number;
  changePercent: number;
  recommendation: string;
}

// ─── 1700 / 1800 Rule ─────────────────────────────────────────────────────────

/**
 * Estimate ISF using the 1700 rule (mmol/L) or 1800 rule (mg/dL).
 * 1700 rule (mmol/L): ISF = 1700 / TDD (in mmol/L per unit)
 * 1800 rule (mg/dL):  ISF = 1800 / TDD (in mg/dL per unit)
 *
 * Note: 1700 rule is used for mmol/L (1700 / 18.018 ≈ 94.3 ≈ 1800/19.1)
 * In practice: ISF_mmol = 94 / TDD (approximation of 1700/18.018/TDD)
 */
export function estimateIsf(
  totalDailyDoseUnits: number,
  units: "mmol" | "mgdl" = "mmol"
): IsfEstimateResult {
  if (totalDailyDoseUnits <= 0) {
    throw new Error("totalDailyDoseUnits must be positive");
  }

  const notes: string[] = [];
  let confidence: IsfEstimateResult["confidence"] = "high";

  if (totalDailyDoseUnits < 10) {
    notes.push("Very low TDD — estimate may be less reliable");
    confidence = "low";
  } else if (totalDailyDoseUnits < 20) {
    notes.push("Low TDD — estimate is approximate");
    confidence = "medium";
  }

  if (totalDailyDoseUnits > 150) {
    notes.push("High TDD — consider insulin resistance evaluation");
    confidence = "medium";
  }

  if (units === "mmol") {
    const estimatedIsf = Math.round((94 / totalDailyDoseUnits) * 10) / 10;
    return {
      estimatedIsf,
      rule: "1700",
      totalDailyDose: totalDailyDoseUnits,
      confidence,
      notes,
    };
  } else {
    const estimatedIsf = Math.round(1800 / totalDailyDoseUnits);
    return {
      estimatedIsf,
      rule: "1800",
      totalDailyDose: totalDailyDoseUnits,
      confidence,
      notes,
    };
  }
}

// ─── Correction Accuracy Analysis ─────────────────────────────────────────────

/**
 * Analyse how accurately a patient's configured ISF predicts actual glucose drops.
 */
export function analyseCorrectionAccuracy(
  events: CorrectionEvent[],
  configuredIsf: number
): CorrectionAccuracyResult {
  if (events.length === 0) {
    throw new Error("At least one correction event required");
  }
  if (configuredIsf <= 0) {
    throw new Error("configuredIsf must be positive");
  }

  const observedDrops = events.map((e) => {
    const drop = e.preCorrectionMmol - e.postCorrectionMmol;
    return drop / e.doseUnits; // observed ISF per event
  });

  const observedIsf =
    Math.round(
      (observedDrops.reduce((a, b) => a + b, 0) / observedDrops.length) * 100
    ) / 100;

  const errors = events.map((e) => {
    const expectedDrop = configuredIsf * e.doseUnits;
    const actualDrop = e.preCorrectionMmol - e.postCorrectionMmol;
    return Math.abs(expectedDrop - actualDrop);
  });

  const meanError =
    Math.round((errors.reduce((a, b) => a + b, 0) / errors.length) * 100) / 100;

  // Accuracy: 100% when observed == configured, drops linearly with error
  const ratio = observedIsf / configuredIsf;
  const accuracy = Math.min(100, Math.max(0, Math.round(100 - Math.abs(1 - ratio) * 100)));

  const bias: CorrectionAccuracyResult["bias"] =
    ratio > 1.15 ? "over-correcting"
    : ratio < 0.85 ? "under-correcting"
    : "accurate";

  return {
    observedIsf,
    expectedIsf: configuredIsf,
    accuracy,
    bias,
    events: events.length,
    meanError,
  };
}

// ─── ISF Trend Detection ───────────────────────────────────────────────────────

/**
 * Detect whether ISF is improving or worsening over time.
 * Compares recent ISF (last N events) vs historical ISF (earlier events).
 */
export function detectIsfTrend(
  events: CorrectionEvent[],
  recentCount = 5
): IsfTrendResult {
  if (events.length < 4) {
    throw new Error("At least 4 correction events required for trend analysis");
  }

  const computeAvgIsf = (evts: CorrectionEvent[]) => {
    const drops = evts.map((e) => (e.preCorrectionMmol - e.postCorrectionMmol) / e.doseUnits);
    return drops.reduce((a, b) => a + b, 0) / drops.length;
  };

  const recent = events.slice(-recentCount);
  const historical = events.slice(0, events.length - recentCount);

  if (historical.length === 0) {
    throw new Error("Not enough historical events — need more than recentCount events");
  }

  const recentIsf = Math.round(computeAvgIsf(recent) * 100) / 100;
  const historicalIsf = Math.round(computeAvgIsf(historical) * 100) / 100;
  const changePercent = Math.round(((recentIsf - historicalIsf) / historicalIsf) * 100);

  // Higher ISF = more sensitive (better). Lower ISF = more resistant (worse).
  const trend: IsfTrendResult["trend"] =
    changePercent > 10 ? "improving"
    : changePercent < -10 ? "worsening"
    : "stable";

  const recommendation =
    trend === "improving"
      ? "Insulin sensitivity is improving — consider reviewing basal and bolus doses with clinician"
      : trend === "worsening"
      ? "Insulin sensitivity is declining — review lifestyle factors and consult clinician"
      : "ISF is stable — continue current management";

  return { trend, recentIsf, historicalIsf, changePercent, recommendation };
}

// ─── ISF Validation ───────────────────────────────────────────────────────────

/**
 * Validate an ISF value is within physiologically plausible range.
 */
export function validateIsf(
  isfMmol: number
): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  if (isfMmol < 0.5) {
    return { valid: false, warnings: ["ISF below 0.5 mmol/L/U is not physiologically plausible"] };
  }
  if (isfMmol > 15) {
    return { valid: false, warnings: ["ISF above 15 mmol/L/U is not physiologically plausible"] };
  }
  if (isfMmol < 1.0) {
    warnings.push("ISF < 1.0 mmol/L/U suggests high insulin resistance — verify with clinician");
  }
  if (isfMmol > 8.0) {
    warnings.push("ISF > 8.0 mmol/L/U suggests high sensitivity — use with caution");
  }

  return { valid: true, warnings };
}
