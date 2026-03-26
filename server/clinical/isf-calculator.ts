/**
 * GluMira™ — Insulin Sensitivity Factor (ISF) Calculator Module
 *
 * Calculates ISF using multiple validated rules (1800, 1700, 1500)
 * and analyzes correction dose effectiveness from historical data.
 *
 * Clinical relevance:
 * - ISF determines how much 1 unit of insulin lowers glucose
 * - Accurate ISF is critical for correction boluses
 * - ISF varies by time of day, activity, and illness
 *
 * NOT a medical device. Educational purposes only.
 */

export interface ISFInput {
  tdd: number;                     // total daily dose
  insulinType: "rapid" | "regular" | "mixed";
  diabetesType: "type1" | "type2";
  weight?: number;                 // kg
  correctionHistory?: CorrectionEvent[];
}

export interface CorrectionEvent {
  timestampUtc: string;
  preGlucoseMmol: number;
  postGlucoseMmol: number;        // 2-4h after correction
  correctionUnits: number;
  hoursToPost: number;
}

export interface ISFEstimate {
  method: string;
  isfMmol: number;                 // mmol/L per unit
  isfMgdl: number;                 // mg/dL per unit
  formula: string;
}

export interface ISFResult {
  estimates: ISFEstimate[];
  bestEstimate: number;            // mmol/L per unit
  bestEstimateMgdl: number;
  empiricalISF: number | null;     // from correction history
  timeOfDayVariation: { period: string; multiplier: number; description: string }[];
  recommendations: string[];
  warnings: string[];
  disclaimer: string;
}

/* ── ISF formulas ────────────────────────────────────────────── */

/** 1800 Rule (rapid-acting): ISF = 1800 / TDD */
function rule1800(tdd: number): number {
  return tdd > 0 ? Math.round((1800 / tdd) * 10) / 10 : 0;
}

/** 1700 Rule (regular insulin): ISF = 1700 / TDD */
function rule1700(tdd: number): number {
  return tdd > 0 ? Math.round((1700 / tdd) * 10) / 10 : 0;
}

/** 1500 Rule (older formula): ISF = 1500 / TDD */
function rule1500(tdd: number): number {
  return tdd > 0 ? Math.round((1500 / tdd) * 10) / 10 : 0;
}

function mgdlToMmol(mgdl: number): number {
  return Math.round((mgdl / 18.0182) * 10) / 10;
}

/* ── Empirical ISF from correction history ───────────────────── */

function calculateEmpiricalISF(events: CorrectionEvent[]): number | null {
  if (events.length < 3) return null;

  // Filter valid corrections (glucose dropped, reasonable units)
  const valid = events.filter(
    (e) => e.correctionUnits > 0 && e.preGlucoseMmol > e.postGlucoseMmol && e.hoursToPost >= 2 && e.hoursToPost <= 5
  );

  if (valid.length < 2) return null;

  const isfs = valid.map((e) => (e.preGlucoseMmol - e.postGlucoseMmol) / e.correctionUnits);
  const mean = isfs.reduce((a, b) => a + b, 0) / isfs.length;
  return Math.round(mean * 10) / 10;
}

/* ── Main function ───────────────────────────────────────────── */

export function calculateISF(input: ISFInput): ISFResult {
  const { tdd, insulinType, diabetesType, weight, correctionHistory } = input;

  const warnings: string[] = [];

  if (tdd <= 0) {
    return {
      estimates: [],
      bestEstimate: 0,
      bestEstimateMgdl: 0,
      empiricalISF: null,
      timeOfDayVariation: [],
      recommendations: ["Enter your total daily dose (TDD) to calculate ISF."],
      warnings: ["TDD must be greater than 0."],
      disclaimer: "GluMira™ is NOT a medical device.",
    };
  }

  // ── Calculate estimates ──
  const estimates: ISFEstimate[] = [];

  if (insulinType === "rapid") {
    const isf1800 = rule1800(tdd);
    estimates.push({
      method: "1800 Rule",
      isfMmol: mgdlToMmol(isf1800),
      isfMgdl: isf1800,
      formula: "ISF = 1800 / TDD",
    });
  }

  if (insulinType === "regular") {
    const isf1700 = rule1700(tdd);
    estimates.push({
      method: "1700 Rule",
      isfMmol: mgdlToMmol(isf1700),
      isfMgdl: isf1700,
      formula: "ISF = 1700 / TDD",
    });
  }

  // Always include 1500 as reference
  const isf1500 = rule1500(tdd);
  estimates.push({
    method: "1500 Rule",
    isfMmol: mgdlToMmol(isf1500),
    isfMgdl: isf1500,
    formula: "ISF = 1500 / TDD",
  });

  // For mixed, include both
  if (insulinType === "mixed") {
    const isf1800 = rule1800(tdd);
    estimates.push({
      method: "1800 Rule",
      isfMmol: mgdlToMmol(isf1800),
      isfMgdl: isf1800,
      formula: "ISF = 1800 / TDD",
    });
    const isf1700 = rule1700(tdd);
    estimates.push({
      method: "1700 Rule",
      isfMmol: mgdlToMmol(isf1700),
      isfMgdl: isf1700,
      formula: "ISF = 1700 / TDD",
    });
  }

  // Best estimate: use 1800 for rapid, 1700 for regular, average for mixed
  let bestMgdl: number;
  if (insulinType === "rapid") bestMgdl = rule1800(tdd);
  else if (insulinType === "regular") bestMgdl = rule1700(tdd);
  else bestMgdl = Math.round((rule1800(tdd) + rule1700(tdd)) / 2);

  const bestEstimate = mgdlToMmol(bestMgdl);
  const bestEstimateMgdl = bestMgdl;

  // ── Empirical ISF ──
  const empiricalISF = correctionHistory ? calculateEmpiricalISF(correctionHistory) : null;

  // ── Time of day variation ──
  const timeOfDayVariation = [
    { period: "Dawn (3-7am)", multiplier: 0.8, description: "ISF is typically lower due to dawn phenomenon — you may need more insulin per unit of correction." },
    { period: "Morning (7-12pm)", multiplier: 0.9, description: "Moderate sensitivity — cortisol levels are still elevated." },
    { period: "Afternoon (12-6pm)", multiplier: 1.0, description: "Baseline sensitivity — formulas are most accurate here." },
    { period: "Evening (6-10pm)", multiplier: 1.1, description: "Slightly higher sensitivity — less insulin needed per correction." },
    { period: "Night (10pm-3am)", multiplier: 1.2, description: "Highest sensitivity — be cautious with corrections to avoid nocturnal hypos." },
  ];

  // ── Recommendations ──
  const recommendations: string[] = [];

  if (empiricalISF !== null) {
    const diff = Math.abs(empiricalISF - bestEstimate);
    if (diff > 1.0) {
      recommendations.push(`Your empirical ISF (${empiricalISF} mmol/L/U) differs significantly from the formula estimate (${bestEstimate} mmol/L/U). Use the empirical value as a starting point.`);
    } else {
      recommendations.push(`Your empirical ISF (${empiricalISF} mmol/L/U) closely matches the formula estimate (${bestEstimate} mmol/L/U).`);
    }
  }

  if (diabetesType === "type2") {
    recommendations.push("Type 2 diabetes often has higher insulin resistance. Your ISF may be lower than formula estimates.");
  }

  if (weight && weight > 100) {
    recommendations.push("Higher body weight may reduce insulin sensitivity. Consider starting with a lower ISF.");
  }

  recommendations.push("Test your ISF by correcting a high glucose (no food, no exercise) and checking 3-4 hours later.");
  recommendations.push("ISF varies by time of day — consider using different values for different periods.");

  // ── Warnings ──
  if (tdd < 10) {
    warnings.push("Very low TDD — ISF estimate may be unreliable. Verify with your healthcare team.");
  }
  if (tdd > 100) {
    warnings.push("High TDD — ensure this includes all insulin (basal + bolus).");
  }
  if (bestEstimate > 6.0) {
    warnings.push("Very high ISF — small doses cause large drops. Be cautious with corrections.");
  }

  return {
    estimates,
    bestEstimate,
    bestEstimateMgdl,
    empiricalISF,
    timeOfDayVariation,
    recommendations,
    warnings,
    disclaimer:
      "GluMira™ is an informational and educational tool only. It is NOT a medical device. " +
      "Always verify ISF with your healthcare team before making dose changes.",
  };
}
