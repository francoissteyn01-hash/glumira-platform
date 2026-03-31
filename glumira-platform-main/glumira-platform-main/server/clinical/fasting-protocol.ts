/**
 * GluMira™ — Fasting Protocol Module
 *
 * Provides guidance for managing diabetes during various fasting protocols
 * including intermittent fasting, religious fasting (Ramadan), and medical fasting.
 *
 * Clinical basis:
 * - Fasting increases hypoglycemia risk, especially with insulin/sulfonylureas
 * - Dawn phenomenon may cause morning highs during extended fasts
 * - Refeeding after prolonged fasts can cause glucose spikes
 * - Basal insulin usually needs reduction during fasting
 * - Bolus insulin should only be given with meals
 *
 * NOT a medical device. Educational purposes only.
 */

export type FastingType =
  | "intermittent-16-8"
  | "intermittent-18-6"
  | "intermittent-20-4"
  | "omad"
  | "ramadan"
  | "medical-prep"
  | "custom";

export interface FastingInput {
  fastingType: FastingType;
  fastingStartHour: number;       // 0-23
  fastingDurationHours: number;   // hours of fasting
  diabetesType: "type1" | "type2";
  currentBasalUnits: number;
  currentBolusPerMeal: number;
  mealsPerDay: number;            // normal meals per day
  recentGlucoseReadings: number[]; // mmol/L
  usesInsulinPump?: boolean;
  takesSulfonylurea?: boolean;
  takesMetformin?: boolean;
}

export interface FastingProtocolResult {
  fastingType: FastingType;
  riskLevel: "low" | "moderate" | "high" | "very-high";
  approved: boolean;
  fastingWindow: { start: number; end: number; durationHours: number };
  eatingWindow: { start: number; end: number; durationHours: number };
  basalAdjustment: {
    changePercent: number;
    newDose: number;
    timing: string;
    explanation: string;
  };
  bolusGuidance: {
    mealsInWindow: number;
    adjustedBolusPerMeal: number;
    explanation: string;
  };
  breakFastGuidance: {
    recommendedCarbsGrams: number;
    bolusTimingMinutes: number;
    explanation: string;
  };
  monitoringSchedule: {
    checkTimes: number[];  // hours (0-23)
    frequencyHours: number;
    explanation: string;
  };
  breakFastingThresholds: {
    hypoThresholdMmol: number;
    hyperThresholdMmol: number;
    explanation: string;
  };
  medicationAdjustments: string[];
  warnings: string[];
  recommendations: string[];
}

function computeRisk(input: FastingInput): "low" | "moderate" | "high" | "very-high" {
  let score = 0;

  // Duration risk
  if (input.fastingDurationHours >= 20) score += 3;
  else if (input.fastingDurationHours >= 16) score += 2;
  else if (input.fastingDurationHours >= 12) score += 1;

  // Type 1 is higher risk
  if (input.diabetesType === "type1") score += 2;

  // Recent hypos
  const hypos = input.recentGlucoseReadings.filter((g) => g < 4.0);
  if (hypos.length > 0) score += 2;

  // High variability
  if (input.recentGlucoseReadings.length >= 3) {
    const max = Math.max(...input.recentGlucoseReadings);
    const min = Math.min(...input.recentGlucoseReadings);
    if (max - min > 8) score += 2;
    else if (max - min > 5) score += 1;
  }

  // Sulfonylurea risk
  if (input.takesSulfonylurea) score += 2;

  if (score >= 7) return "very-high";
  if (score >= 5) return "high";
  if (score >= 3) return "moderate";
  return "low";
}

export function generateFastingProtocol(input: FastingInput): FastingProtocolResult {
  const riskLevel = computeRisk(input);
  const approved = riskLevel !== "very-high";

  // Calculate windows
  const fastStart = input.fastingStartHour;
  const fastEnd = (fastStart + input.fastingDurationHours) % 24;
  const eatStart = fastEnd;
  const eatDuration = 24 - input.fastingDurationHours;
  const eatEnd = (eatStart + eatDuration) % 24;

  // Basal adjustment
  let basalChangePercent = 0;
  if (input.fastingDurationHours >= 20) basalChangePercent = -30;
  else if (input.fastingDurationHours >= 16) basalChangePercent = -20;
  else if (input.fastingDurationHours >= 12) basalChangePercent = -10;

  if (input.diabetesType === "type1") basalChangePercent -= 5;

  const newBasal = Math.round(input.currentBasalUnits * (1 + basalChangePercent / 100) * 10) / 10;

  let basalTiming = "Take at usual time";
  if (input.fastingType === "ramadan") {
    basalTiming = "Take at Suhoor (pre-dawn meal)";
  } else if (input.usesInsulinPump) {
    basalTiming = "Set temporary basal rate during fasting window";
  }

  // Bolus guidance
  const mealsInWindow = input.fastingDurationHours >= 20 ? 1 : input.fastingDurationHours >= 16 ? 2 : 3;
  const totalDailyBolus = input.currentBolusPerMeal * input.mealsPerDay;
  const adjustedBolus = Math.round((totalDailyBolus / mealsInWindow) * 10) / 10;

  // Break-fast guidance
  let breakfastCarbs = 30;
  if (input.fastingDurationHours >= 20) breakfastCarbs = 20;
  else if (input.fastingDurationHours >= 16) breakfastCarbs = 25;

  const bolusTimingMinutes = input.fastingDurationHours >= 16 ? 10 : 15;

  // Monitoring schedule
  const checkTimes: number[] = [];
  const monitorFreq = riskLevel === "very-high" || riskLevel === "high" ? 2 : 3;

  // Add checks during fasting window
  let t = fastStart;
  for (let i = 0; i < Math.ceil(input.fastingDurationHours / monitorFreq); i++) {
    checkTimes.push(t % 24);
    t += monitorFreq;
  }
  // Always check at break-fast
  if (!checkTimes.includes(fastEnd)) checkTimes.push(fastEnd);

  // Break-fasting thresholds
  const hypoThreshold = 3.9;
  const hyperThreshold = 16.7;

  // Medication adjustments
  const medAdjustments: string[] = [];
  if (input.takesSulfonylurea) {
    medAdjustments.push("REDUCE sulfonylurea dose by 50% or skip during fasting. High hypo risk.");
  }
  if (input.takesMetformin) {
    medAdjustments.push("Metformin: Take with meals only. Split dose across eating window.");
  }
  if (input.usesInsulinPump) {
    medAdjustments.push("Set temporary basal rate reduction during fasting window.");
  }

  // Warnings
  const warnings: string[] = [];

  if (riskLevel === "very-high") {
    warnings.push("VERY HIGH RISK: Fasting is NOT recommended without direct medical supervision.");
  }

  if (input.diabetesType === "type1" && input.fastingDurationHours >= 20) {
    warnings.push("Extended fasting with Type 1 diabetes carries significant DKA risk. Never skip basal insulin entirely.");
  }

  if (input.takesSulfonylurea) {
    warnings.push("Sulfonylureas cause insulin secretion regardless of food intake — high hypo risk during fasting.");
  }

  const recentHypos = input.recentGlucoseReadings.filter((g) => g < 4.0);
  if (recentHypos.length > 0) {
    warnings.push(`Recent hypoglycemia detected (${recentHypos.length} readings < 4.0 mmol/L). Extra caution required.`);
  }

  if (input.fastingDurationHours >= 18) {
    warnings.push("Fasts over 18 hours significantly increase hypoglycemia risk. Break fast immediately if glucose < 3.9 mmol/L.");
  }

  // Recommendations
  const recommendations: string[] = [];

  recommendations.push(`Monitor glucose every ${monitorFreq} hours during fasting.`);
  recommendations.push(`Break fast immediately if glucose drops below ${hypoThreshold} mmol/L or rises above ${hyperThreshold} mmol/L.`);

  if (input.fastingType === "ramadan") {
    recommendations.push("Suhoor: Eat slow-release carbs (whole grains, lentils) to sustain glucose.");
    recommendations.push("Iftar: Break fast with dates and water, then a balanced meal after 15 minutes.");
  }

  recommendations.push(`Start break-fast meal with ${breakfastCarbs}g low-GI carbs to prevent refeeding spike.`);
  recommendations.push("Keep fast-acting glucose (15g) accessible at all times during fasting.");
  recommendations.push("Stay hydrated during eating windows — dehydration worsens glucose control.");

  if (input.diabetesType === "type1") {
    recommendations.push("Never skip basal insulin — even during fasting, basal is needed to prevent DKA.");
  }

  recommendations.push("Discuss this fasting plan with your diabetes team before starting.");

  return {
    fastingType: input.fastingType,
    riskLevel,
    approved,
    fastingWindow: { start: fastStart, end: fastEnd, durationHours: input.fastingDurationHours },
    eatingWindow: { start: eatStart, end: eatEnd, durationHours: eatDuration },
    basalAdjustment: {
      changePercent: basalChangePercent,
      newDose: newBasal,
      timing: basalTiming,
      explanation: `Reduce basal by ${Math.abs(basalChangePercent)}% during fasting to prevent hypoglycemia.`,
    },
    bolusGuidance: {
      mealsInWindow: mealsInWindow,
      adjustedBolusPerMeal: adjustedBolus,
      explanation: `Redistribute total daily bolus across ${mealsInWindow} meals in the eating window.`,
    },
    breakFastGuidance: {
      recommendedCarbsGrams: breakfastCarbs,
      bolusTimingMinutes,
      explanation: `Start with ${breakfastCarbs}g low-GI carbs. Bolus ${bolusTimingMinutes} minutes before eating.`,
    },
    monitoringSchedule: {
      checkTimes: [...new Set(checkTimes)].sort((a, b) => a - b),
      frequencyHours: monitorFreq,
      explanation: `Check glucose every ${monitorFreq} hours. More frequently if feeling unwell.`,
    },
    breakFastingThresholds: {
      hypoThresholdMmol: hypoThreshold,
      hyperThresholdMmol: hyperThreshold,
      explanation: "Break fast immediately if glucose goes below 3.9 or above 16.7 mmol/L.",
    },
    medicationAdjustments: medAdjustments,
    warnings,
    recommendations,
  };
}
