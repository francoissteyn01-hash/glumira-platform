/**
 * GluMira™ — Hypoglycemia Risk Predictor Module
 *
 * Analyzes glucose patterns, insulin data, and lifestyle factors
 * to predict hypoglycemia risk over the next 1-4 hours.
 *
 * Clinical relevance:
 * - Preventing hypos is a top priority in diabetes management
 * - Pattern-based prediction catches risks before they happen
 * - Exercise, alcohol, and missed meals are major risk factors
 *
 * NOT a medical device. Educational purposes only.
 */

export interface HypoRiskInput {
  recentReadings: { timestampUtc: string; glucoseMmol: number }[];
  currentGlucoseMmol: number;
  glucoseTrend: "rising-fast" | "rising" | "stable" | "falling" | "falling-fast";
  iob: number;                     // insulin on board (units)
  lastMealHoursAgo: number;
  exerciseActive: boolean;
  exerciseIntensity?: "light" | "moderate" | "vigorous";
  alcoholConsumed: boolean;
  alcoholUnits?: number;
  sleepingSoon: boolean;
  hypoUnawareness: boolean;
  recentHyposThisWeek: number;
}

export type RiskLevel = "very-high" | "high" | "moderate" | "low" | "minimal";

export interface RiskFactor {
  factor: string;
  contribution: number;  // 0-30 points
  description: string;
}

export interface HypoRiskResult {
  riskLevel: RiskLevel;
  riskScore: number;             // 0-100
  riskFactors: RiskFactor[];
  predictedTimeToHypo: string | null;
  currentTrend: string;
  immediateActions: string[];
  preventiveActions: string[];
  warnings: string[];
  disclaimer: string;
}

/* ── Risk scoring ────────────────────────────────────────────── */

export function predictHypoRisk(input: HypoRiskInput): HypoRiskResult {
  const riskFactors: RiskFactor[] = [];
  let riskScore = 0;

  // ── Current glucose level ──
  if (input.currentGlucoseMmol < 4.0) {
    riskFactors.push({ factor: "Low glucose now", contribution: 30, description: "Already near or in hypoglycemia range." });
    riskScore += 30;
  } else if (input.currentGlucoseMmol < 5.0) {
    riskFactors.push({ factor: "Borderline glucose", contribution: 15, description: "Glucose is in the lower range with limited buffer." });
    riskScore += 15;
  } else if (input.currentGlucoseMmol < 6.0) {
    riskFactors.push({ factor: "Lower-normal glucose", contribution: 5, description: "Glucose is in the lower-normal range." });
    riskScore += 5;
  }

  // ── Glucose trend ──
  if (input.glucoseTrend === "falling-fast") {
    riskFactors.push({ factor: "Rapidly falling glucose", contribution: 25, description: "Glucose is dropping quickly — hypo likely within 30-60 minutes." });
    riskScore += 25;
  } else if (input.glucoseTrend === "falling") {
    riskFactors.push({ factor: "Falling glucose", contribution: 15, description: "Glucose is trending down." });
    riskScore += 15;
  }

  // ── IOB ──
  if (input.iob > 5) {
    riskFactors.push({ factor: "High insulin on board", contribution: 20, description: `${input.iob}U of active insulin will continue lowering glucose.` });
    riskScore += 20;
  } else if (input.iob > 2) {
    riskFactors.push({ factor: "Moderate insulin on board", contribution: 10, description: `${input.iob}U of active insulin remaining.` });
    riskScore += 10;
  }

  // ── Time since last meal ──
  if (input.lastMealHoursAgo > 5) {
    riskFactors.push({ factor: "Extended fasting", contribution: 10, description: "No food for 5+ hours — glycogen stores may be depleted." });
    riskScore += 10;
  } else if (input.lastMealHoursAgo > 3) {
    riskFactors.push({ factor: "Post-absorptive state", contribution: 5, description: "Meal carbs are fully absorbed — no more glucose from food." });
    riskScore += 5;
  }

  // ── Exercise ──
  if (input.exerciseActive) {
    const exerciseScore = input.exerciseIntensity === "vigorous" ? 20
      : input.exerciseIntensity === "moderate" ? 15
      : 8;
    riskFactors.push({
      factor: "Active exercise",
      contribution: exerciseScore,
      description: `${input.exerciseIntensity ?? "Active"} exercise increases glucose uptake and hypo risk.`,
    });
    riskScore += exerciseScore;
  }

  // ── Alcohol ──
  if (input.alcoholConsumed) {
    const alcoholScore = (input.alcoholUnits ?? 1) > 3 ? 15 : 10;
    riskFactors.push({
      factor: "Alcohol consumption",
      contribution: alcoholScore,
      description: "Alcohol blocks liver glucose release, increasing hypo risk for up to 24 hours.",
    });
    riskScore += alcoholScore;
  }

  // ── Sleep ──
  if (input.sleepingSoon) {
    riskFactors.push({ factor: "Sleeping soon", contribution: 10, description: "Nocturnal hypos are harder to detect. Ensure glucose is above 6.0 before bed." });
    riskScore += 10;
  }

  // ── Hypo unawareness ──
  if (input.hypoUnawareness) {
    riskFactors.push({ factor: "Hypo unawareness", contribution: 15, description: "Reduced ability to feel hypo symptoms — rely on CGM alerts." });
    riskScore += 15;
  }

  // ── Recent hypo history ──
  if (input.recentHyposThisWeek > 3) {
    riskFactors.push({ factor: "Frequent recent hypos", contribution: 10, description: "Multiple hypos this week suggest doses need reducing." });
    riskScore += 10;
  }

  // Cap at 100
  riskScore = Math.min(100, riskScore);

  // ── Risk level ──
  let riskLevel: RiskLevel;
  if (riskScore >= 70) riskLevel = "very-high";
  else if (riskScore >= 50) riskLevel = "high";
  else if (riskScore >= 30) riskLevel = "moderate";
  else if (riskScore >= 15) riskLevel = "low";
  else riskLevel = "minimal";

  // ── Predicted time to hypo ──
  let predictedTimeToHypo: string | null = null;
  if (input.currentGlucoseMmol < 4.0) {
    predictedTimeToHypo = "NOW — already in hypo range";
  } else if (input.glucoseTrend === "falling-fast" && input.currentGlucoseMmol < 6.0) {
    predictedTimeToHypo = "Within 30 minutes";
  } else if (input.glucoseTrend === "falling-fast") {
    predictedTimeToHypo = "Within 1-2 hours";
  } else if (input.glucoseTrend === "falling" && input.currentGlucoseMmol < 5.5) {
    predictedTimeToHypo = "Within 1-2 hours";
  } else if (riskScore >= 50) {
    predictedTimeToHypo = "Within 2-4 hours if no action taken";
  }

  // ── Current trend description ──
  const trendDescriptions: Record<string, string> = {
    "rising-fast": "Glucose is rising rapidly",
    "rising": "Glucose is rising",
    "stable": "Glucose is stable",
    "falling": "Glucose is falling",
    "falling-fast": "Glucose is falling rapidly",
  };
  const currentTrend = trendDescriptions[input.glucoseTrend] ?? "Unknown trend";

  // ── Immediate actions ──
  const immediateActions: string[] = [];
  if (input.currentGlucoseMmol < 4.0) {
    immediateActions.push("TREAT NOW: Take 15g fast-acting carbs (glucose tablets, juice).");
    immediateActions.push("Recheck glucose in 15 minutes.");
  }
  if (input.glucoseTrend === "falling-fast" && input.currentGlucoseMmol < 6.0) {
    immediateActions.push("Eat 15-20g carbs now to prevent hypo.");
  }
  if (input.exerciseActive && riskScore >= 30) {
    immediateActions.push("Consider reducing exercise intensity or having a carb snack.");
  }

  // ── Preventive actions ──
  const preventiveActions: string[] = [];
  if (input.sleepingSoon && input.currentGlucoseMmol < 6.5) {
    preventiveActions.push("Have a bedtime snack with slow-release carbs (e.g., toast with peanut butter).");
  }
  if (input.iob > 3) {
    preventiveActions.push("Active insulin is high — have carbs available and monitor closely.");
  }
  if (input.alcoholConsumed) {
    preventiveActions.push("Set CGM low alert to 5.0 mmol/L. Have snacks before bed.");
  }
  if (input.lastMealHoursAgo > 4) {
    preventiveActions.push("Consider having a snack — it's been several hours since your last meal.");
  }
  if (riskScore >= 30) {
    preventiveActions.push("Keep fast-acting glucose within reach.");
  }

  // ── Warnings ──
  const warnings: string[] = [];
  if (riskLevel === "very-high") {
    warnings.push("VERY HIGH hypo risk — take immediate preventive action.");
  }
  if (riskLevel === "high") {
    warnings.push("HIGH hypo risk — monitor closely and have carbs ready.");
  }
  if (input.hypoUnawareness && riskScore >= 30) {
    warnings.push("You have hypo unawareness — do NOT rely on symptoms. Use CGM alerts.");
  }

  return {
    riskLevel,
    riskScore,
    riskFactors,
    predictedTimeToHypo,
    currentTrend,
    immediateActions,
    preventiveActions,
    warnings,
    disclaimer:
      "GluMira™ is an educational platform. The science of insulin, made visible. " +
      "Always treat hypoglycemia immediately regardless of predictions.",
  };
}
