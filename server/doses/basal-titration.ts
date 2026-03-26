/**
 * GluMira™ — basal-titration.ts
 *
 * Basal insulin titration algorithms.
 * Implements: 303 rule, 2-0-2 rule, fasting test analysis,
 * dawn phenomenon detection, and basal adequacy scoring.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 * All titration suggestions must be reviewed by a qualified clinician.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FastingGlucoseEntry {
  date: string;         // YYYY-MM-DD
  fastingMmol: number;  // fasting glucose in mmol/L
  bedtimeMmol?: number; // bedtime glucose in mmol/L (optional)
}

export interface BasalTitrationResult {
  currentDose: number;
  suggestedDose: number;
  adjustmentUnits: number;   // positive = increase, negative = decrease
  adjustmentPercent: number;
  rule: "303" | "2-0-2" | "conservative" | "hold";
  rationale: string;
  targetMet: boolean;
  warnings: string[];
}

export interface DawnPhenomenonResult {
  detected: boolean;
  averageRiseMmol: number;   // average overnight glucose rise
  affectedNights: number;
  totalNights: number;
  severity: "none" | "mild" | "moderate" | "significant";
}

export interface BasalAdequacyScore {
  score: number;             // 0–100
  label: "poor" | "fair" | "good" | "excellent";
  fastingInRange: number;    // % of fasting readings in target
  averageFasting: number;    // mean fasting glucose
  variability: number;       // SD of fasting readings
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const BASAL_TITRATION_TARGETS = {
  fastingLow:  4.4,   // mmol/L
  fastingHigh: 7.2,   // mmol/L
  fastingIdeal: 5.5,  // mmol/L
  maxDailyIncrease: 4, // units per adjustment
  maxDailyDecrease: 4, // units per adjustment
  minDose: 2,
  maxDose: 100,
} as const;

// ─── 303 Rule ─────────────────────────────────────────────────────────────────

/**
 * 303 Rule: increase basal by 3U every 3 days if fasting glucose > target.
 * Decrease by 3U if fasting glucose < 4.4 mmol/L.
 */
export function apply303Rule(
  currentDose: number,
  fastingReadings: number[],
  targetFasting = BASAL_TITRATION_TARGETS.fastingHigh
): BasalTitrationResult {
  if (fastingReadings.length === 0) {
    throw new Error("At least one fasting reading required");
  }
  if (currentDose <= 0) throw new Error("currentDose must be positive");

  const warnings: string[] = [];
  const avgFasting = fastingReadings.reduce((a, b) => a + b, 0) / fastingReadings.length;

  let adjustment = 0;
  let rule: BasalTitrationResult["rule"] = "hold";
  let rationale = "";

  if (avgFasting > targetFasting) {
    adjustment = 3;
    rule = "303";
    rationale = `Average fasting ${avgFasting.toFixed(1)} mmol/L above target ${targetFasting} — increase by 3U`;
  } else if (avgFasting < BASAL_TITRATION_TARGETS.fastingLow) {
    adjustment = -3;
    rule = "303";
    rationale = `Average fasting ${avgFasting.toFixed(1)} mmol/L below safety threshold — decrease by 3U`;
    warnings.push("Hypoglycaemia risk — review with clinician before reducing");
  } else {
    rule = "hold";
    rationale = `Average fasting ${avgFasting.toFixed(1)} mmol/L within target range — no change`;
  }

  const suggestedDose = Math.min(
    BASAL_TITRATION_TARGETS.maxDose,
    Math.max(BASAL_TITRATION_TARGETS.minDose, currentDose + adjustment)
  );

  if (suggestedDose >= 50) {
    warnings.push("Dose >= 50U — consider splitting into two injections");
  }

  return {
    currentDose,
    suggestedDose,
    adjustmentUnits: suggestedDose - currentDose,
    adjustmentPercent: Math.round(((suggestedDose - currentDose) / currentDose) * 100),
    rule,
    rationale,
    targetMet: avgFasting >= BASAL_TITRATION_TARGETS.fastingLow && avgFasting <= targetFasting,
    warnings,
  };
}

// ─── 2-0-2 Rule ───────────────────────────────────────────────────────────────

/**
 * 2-0-2 Rule: increase by 2U if 2 consecutive fasting readings > target.
 * More conservative than 303 — used for Type 1 or sensitive patients.
 */
export function apply202Rule(
  currentDose: number,
  fastingReadings: number[],
  targetFasting = BASAL_TITRATION_TARGETS.fastingHigh
): BasalTitrationResult {
  if (fastingReadings.length < 2) {
    throw new Error("At least 2 fasting readings required for 2-0-2 rule");
  }
  if (currentDose <= 0) throw new Error("currentDose must be positive");

  const warnings: string[] = [];
  const lastTwo = fastingReadings.slice(-2);
  const bothAbove = lastTwo.every((r) => r > targetFasting);
  const eitherBelow = lastTwo.some((r) => r < BASAL_TITRATION_TARGETS.fastingLow);

  let adjustment = 0;
  let rule: BasalTitrationResult["rule"] = "hold";
  let rationale = "";

  if (eitherBelow) {
    adjustment = -2;
    rule = "2-0-2";
    rationale = `Fasting reading below 4.4 mmol/L — decrease by 2U`;
    warnings.push("Hypoglycaemia detected — review with clinician");
  } else if (bothAbove) {
    adjustment = 2;
    rule = "2-0-2";
    rationale = `2 consecutive fasting readings above ${targetFasting} mmol/L — increase by 2U`;
  } else {
    rule = "hold";
    rationale = `Fasting readings not consistently above target — hold dose`;
  }

  const suggestedDose = Math.min(
    BASAL_TITRATION_TARGETS.maxDose,
    Math.max(BASAL_TITRATION_TARGETS.minDose, currentDose + adjustment)
  );

  return {
    currentDose,
    suggestedDose,
    adjustmentUnits: suggestedDose - currentDose,
    adjustmentPercent: Math.round(((suggestedDose - currentDose) / currentDose) * 100),
    rule,
    rationale,
    targetMet: lastTwo.every(
      (r) => r >= BASAL_TITRATION_TARGETS.fastingLow && r <= targetFasting
    ),
    warnings,
  };
}

// ─── Dawn Phenomenon Detection ────────────────────────────────────────────────

/**
 * Detect dawn phenomenon from paired bedtime + fasting glucose readings.
 * Dawn phenomenon: fasting glucose consistently higher than bedtime glucose.
 */
export function detectDawnPhenomenon(
  entries: FastingGlucoseEntry[]
): DawnPhenomenonResult {
  const paired = entries.filter(
    (e) => e.bedtimeMmol !== undefined && e.fastingMmol !== undefined
  );

  if (paired.length === 0) {
    return {
      detected: false,
      averageRiseMmol: 0,
      affectedNights: 0,
      totalNights: 0,
      severity: "none",
    };
  }

  const rises = paired.map((e) => e.fastingMmol - e.bedtimeMmol!);
  const positiveRises = rises.filter((r) => r > 0);
  const averageRise = rises.reduce((a, b) => a + b, 0) / rises.length;
  const affectedNights = positiveRises.length;

  // Dawn phenomenon: > 50% of nights show rise, average rise > 1.5 mmol/L
  const detected = affectedNights / paired.length > 0.5 && averageRise > 1.5;

  let severity: DawnPhenomenonResult["severity"] = "none";
  if (detected) {
    if (averageRise < 2.0)      severity = "mild";
    else if (averageRise < 3.5) severity = "moderate";
    else                        severity = "significant";
  }

  return {
    detected,
    averageRiseMmol: Math.round(averageRise * 100) / 100,
    affectedNights,
    totalNights: paired.length,
    severity,
  };
}

// ─── Basal Adequacy Score ─────────────────────────────────────────────────────

/**
 * Score basal insulin adequacy based on fasting glucose patterns.
 * Returns a 0–100 score with label.
 */
export function scoreBasalAdequacy(
  fastingReadings: number[]
): BasalAdequacyScore {
  if (fastingReadings.length === 0) {
    return { score: 0, label: "poor", fastingInRange: 0, averageFasting: 0, variability: 0 };
  }

  const { fastingLow, fastingHigh } = BASAL_TITRATION_TARGETS;
  const inRange = fastingReadings.filter((r) => r >= fastingLow && r <= fastingHigh);
  const fastingInRange = (inRange.length / fastingReadings.length) * 100;

  const avg = fastingReadings.reduce((a, b) => a + b, 0) / fastingReadings.length;
  const variance = fastingReadings.reduce((acc, v) => acc + (v - avg) ** 2, 0) / fastingReadings.length;
  const sd = Math.sqrt(variance);

  // Score components:
  // 60% weight on % in range, 40% weight on low variability
  const rangeScore = fastingInRange * 0.6;
  const varScore   = Math.max(0, (1 - sd / 3.0)) * 40; // SD of 0 = 40pts, SD >= 3 = 0pts
  const score      = Math.min(100, Math.round(rangeScore + varScore));

  const label: BasalAdequacyScore["label"] =
    score >= 80 ? "excellent"
    : score >= 60 ? "good"
    : score >= 40 ? "fair"
    : "poor";

  return {
    score,
    label,
    fastingInRange: Math.round(fastingInRange * 10) / 10,
    averageFasting: Math.round(avg * 100) / 100,
    variability:    Math.round(sd * 100) / 100,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Classify a fasting glucose reading.
 */
export function classifyFastingGlucose(
  valueMmol: number
): "hypo" | "low" | "target" | "above-target" | "high" {
  if (valueMmol < 4.0)  return "hypo";
  if (valueMmol < 4.4)  return "low";
  if (valueMmol <= 7.2) return "target";
  if (valueMmol <= 10.0) return "above-target";
  return "high";
}
