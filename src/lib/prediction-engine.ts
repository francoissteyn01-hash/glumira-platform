/**
 * GluMira™ V7 — Glucose Prediction & AI Advisory Engine
 * Blocks 52-56: Pure-math prediction, bolus advisory, basal optimisation.
 *
 * Founding statement: "AI explains. It does not prescribe."
 * All outputs include safety disclaimers per regulatory requirements.
 */

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

export interface PredictionInput {
  recentReadings: { value: number; time: string; units: "mmol" | "mg" }[];
  activeIOB: number;
  recentCarbs: { grams: number; time: string }[];
  recentExercise: { type: string; intensity: string; durationMin: number; time: string }[];
  basalRate: number;
  currentTime: string;
}

export interface GlucosePrediction {
  predictions: { time: string; value: number; confidence: number }[];
  trend: "rising" | "falling" | "stable" | "rising_fast" | "falling_fast";
  hypoRisk: { probability: number; timeToHypo: number | null; severity: "low" | "moderate" | "high" };
  hyperRisk: { probability: number; timeToHyper: number | null };
  educationalNote: string;
  confidenceNote: string;
}

export interface BolusAdvisory {
  suggestedBolus: number | null;
  confidence: number;
  reasoning: string[];
  iobContribution: number;
  carbContribution: number;
  correctionContribution: number;
  safetyFlags: string[];
  disclaimer: string;
}

export interface BasalOptimisation {
  currentProfile: { hour: number; rate: number }[];
  suggestedProfile: { hour: number; rate: number; reason: string }[];
  changes: { hour: number; from: number; to: number; reason: string }[];
  overallAssessment: string;
  disclaimer: string;
}

export interface HypoWindow {
  riskLevel: "low" | "moderate" | "high" | "critical";
  estimatedTimeMinutes: number | null;
  guidance: string;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Constants                                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

const HYPO_THRESHOLD_MMOL = 3.9;
const HYPER_THRESHOLD_MMOL = 10.0;
const MG_TO_MMOL = 1 / 18.0182;
const CONFIDENCE_BY_HOUR = [0.85, 0.70, 0.55, 0.40];

/** IOB decay: approximate fraction remaining at hours 1-4 post-bolus (rapid-acting) */
const IOB_DECAY = [0.65, 0.35, 0.15, 0.05];

/** Carb absorption: fraction absorbed at hours 1-4 post-meal (moderate GI) */
const CARB_ABSORPTION = [0.50, 0.80, 0.95, 1.0];

const SAFETY_DISCLAIMER =
  "This is an educational calculation based on your entered ISF and ICR values. " +
  "It is NOT a prescription. Always verify with your healthcare team.";

const PREDICTION_DISCLAIMER =
  "These predictions are educational estimates based on pattern analysis. " +
  "They are NOT medical advice. Always verify with glucose testing.";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Helpers                                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

function toMmol(value: number, units: "mmol" | "mg"): number {
  return units === "mg" ? value * MG_TO_MMOL : value;
}

function parseTime(iso: string): number {
  return new Date(iso).getTime();
}

function addHours(isoTime: string, hours: number): string {
  const d = new Date(isoTime);
  d.setTime(d.getTime() + hours * 3_600_000);
  return d.toISOString();
}

/**
 * Simple linear regression on (x, y) pairs.
 * Returns slope (mmol/L per ms) and intercept.
 */
function linearRegression(points: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: points[0]?.y ?? 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (const p of points) {
    sumX += p.x;
    sumY += p.y;
    sumXY += p.x * p.y;
    sumXX += p.x * p.x;
  }

  const denom = n * sumXX - sumX * sumX;
  if (Math.abs(denom) < 1e-12) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function classifyTrend(slopePerHour: number): GlucosePrediction["trend"] {
  // slope is mmol/L per hour
  if (slopePerHour > 2.0) return "rising_fast";
  if (slopePerHour > 0.5) return "rising";
  if (slopePerHour < -2.0) return "falling_fast";
  if (slopePerHour < -0.5) return "falling";
  return "stable";
}

function clampGlucose(mmol: number): number {
  return Math.max(1.0, Math.min(30.0, Math.round(mmol * 10) / 10));
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  1. predictGlucose                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function predictGlucose(input: PredictionInput): GlucosePrediction {
  const { recentReadings, activeIOB, recentCarbs, recentExercise, basalRate, currentTime } = input;

  // Normalise readings to mmol/L sorted newest-first
  const normalised = recentReadings
    .map((r) => ({ value: toMmol(r.value, r.units), time: r.time }))
    .sort((a, b) => parseTime(b.time) - parseTime(a.time));

  const currentGlucose = normalised[0]?.value ?? 5.5;
  const currentMs = parseTime(currentTime);

  // Linear regression on last 5 readings (or fewer)
  const regPoints = normalised.slice(0, 5).map((r) => ({
    x: parseTime(r.time),
    y: r.value,
  }));
  const { slope } = linearRegression(regPoints);
  const slopePerHour = slope * 3_600_000; // convert from per-ms to per-hour

  // IOB contribution: each unit of IOB drops glucose by ~1.8 mmol/L over its remaining life
  // Simplified: ISF assumed ~2.0 mmol/L per unit for estimation purposes
  const estimatedISF = 2.0;
  const iobGlucoseDrop = activeIOB * estimatedISF;

  // Carb contribution: sum remaining carbs not yet absorbed
  // Rough model: 10g carbs raises glucose ~1.5 mmol/L
  const carbRiseFactor = 0.15; // mmol/L per gram
  let totalPendingCarbRise = 0;
  const now = currentMs;
  for (const carb of recentCarbs) {
    const elapsed = (now - parseTime(carb.time)) / 3_600_000; // hours
    if (elapsed < 0 || elapsed > 4) continue;
    const hourIndex = Math.min(3, Math.floor(elapsed));
    const absorbed = CARB_ABSORPTION[hourIndex];
    const remaining = 1 - absorbed;
    totalPendingCarbRise += carb.grams * carbRiseFactor * remaining;
  }

  // Exercise contribution: moderate exercise lowers glucose
  let exerciseDrop = 0;
  for (const ex of recentExercise) {
    const elapsed = (now - parseTime(ex.time)) / 3_600_000;
    if (elapsed < 0 || elapsed > 3) continue;
    const intensityFactor = ex.intensity === "high" ? 0.08 : ex.intensity === "moderate" ? 0.05 : 0.02;
    const remaining = Math.max(0, 1 - elapsed / 3);
    exerciseDrop += ex.durationMin * intensityFactor * remaining;
  }

  // Build 4 hourly predictions
  const predictions: GlucosePrediction["predictions"] = [];
  let firstHypo: number | null = null;
  let firstHyper: number | null = null;

  for (let h = 1; h <= 4; h++) {
    const trendContrib = slopePerHour * h;
    const iobContrib = -iobGlucoseDrop * (1 - IOB_DECAY[h - 1]);
    const carbContrib = totalPendingCarbRise * CARB_ABSORPTION[h - 1];
    const exContrib = -exerciseDrop * Math.max(0, 1 - h / 4);

    const predicted = clampGlucose(currentGlucose + trendContrib + iobContrib + carbContrib + exContrib);
    const confidence = CONFIDENCE_BY_HOUR[h - 1];

    predictions.push({
      time: addHours(currentTime, h),
      value: predicted,
      confidence,
    });

    if (predicted < HYPO_THRESHOLD_MMOL && firstHypo === null) firstHypo = h * 60;
    if (predicted > HYPER_THRESHOLD_MMOL && firstHyper === null) firstHyper = h * 60;
  }

  // Hypo risk assessment
  const lowestPredicted = Math.min(...predictions.map((p) => p.value));
  let hypoProbability = 0;
  let hypoSeverity: "low" | "moderate" | "high" = "low";
  if (lowestPredicted < HYPO_THRESHOLD_MMOL) {
    hypoProbability = Math.min(0.95, 0.5 + (HYPO_THRESHOLD_MMOL - lowestPredicted) * 0.15);
    hypoSeverity = lowestPredicted < 3.0 ? "high" : lowestPredicted < 3.5 ? "moderate" : "low";
  } else if (lowestPredicted < 4.5) {
    hypoProbability = Math.max(0, (4.5 - lowestPredicted) / 4.5) * 0.3;
  }

  // Hyper risk
  const highestPredicted = Math.max(...predictions.map((p) => p.value));
  let hyperProbability = 0;
  if (highestPredicted > HYPER_THRESHOLD_MMOL) {
    hyperProbability = Math.min(0.9, 0.4 + (highestPredicted - HYPER_THRESHOLD_MMOL) * 0.1);
  }

  // Confidence note
  const missingData: string[] = [];
  if (recentReadings.length < 3) missingData.push("fewer than 3 recent readings");
  if (recentCarbs.length === 0) missingData.push("no recent carb data");
  if (activeIOB === 0 && recentReadings.length > 0) missingData.push("IOB data may be missing");
  const confidenceNote = missingData.length > 0
    ? `Confidence is reduced because: ${missingData.join("; ")}. More data improves accuracy.`
    : "Prediction uses recent readings, IOB, carbs, and exercise data. Confidence is typical for available data.";

  // Educational note
  const trend = classifyTrend(slopePerHour);
  let educationalNote = "";
  if (trend === "falling_fast") {
    educationalNote = "Your glucose is dropping quickly. This may be caused by active insulin or recent exercise. " +
      "Consider checking for hypo symptoms and having fast-acting carbs available.";
  } else if (trend === "rising_fast") {
    educationalNote = "Your glucose is rising rapidly. This could indicate a meal spike or insufficient insulin coverage. " +
      "Monitor your levels and consult your care plan.";
  } else if (hypoProbability > 0.3) {
    educationalNote = "There is a notable risk of low glucose in the coming hours. " +
      "Consider having a snack if your healthcare team has advised preventive carbs in this situation.";
  } else {
    educationalNote = "Your glucose trend appears relatively stable. Continue monitoring as usual.";
  }

  return {
    predictions,
    trend,
    hypoRisk: { probability: Math.round(hypoProbability * 100) / 100, timeToHypo: firstHypo, severity: hypoSeverity },
    hyperRisk: { probability: Math.round(hyperProbability * 100) / 100, timeToHyper: firstHyper },
    educationalNote: educationalNote + " " + PREDICTION_DISCLAIMER,
    confidenceNote,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  2. generateBolusAdvisory                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function generateBolusAdvisory(
  currentGlucose: number,
  targetGlucose: number,
  carbsPlanned: number,
  isf: number,
  icr: number,
  currentIOB: number,
  units: "mmol" | "mg",
): BolusAdvisory {
  const current = toMmol(currentGlucose, units);
  const target = toMmol(targetGlucose, units);
  const isfMmol = units === "mg" ? isf * MG_TO_MMOL : isf;

  const reasoning: string[] = [];
  const safetyFlags: string[] = [];

  // Correction dose
  const correctionContribution = isfMmol > 0 ? (current - target) / isfMmol : 0;
  reasoning.push(
    `Correction: (${current.toFixed(1)} − ${target.toFixed(1)}) ÷ ${isfMmol.toFixed(1)} = ${correctionContribution.toFixed(2)}U`,
  );

  // Carb coverage
  const carbContribution = icr > 0 ? carbsPlanned / icr : 0;
  reasoning.push(
    `Carb coverage: ${carbsPlanned}g ÷ ${icr} = ${carbContribution.toFixed(2)}U`,
  );

  // IOB subtraction
  const iobContribution = currentIOB;
  reasoning.push(
    `Active IOB subtracted: −${iobContribution.toFixed(2)}U`,
  );

  // Total
  const rawResult = correctionContribution + carbContribution - iobContribution;
  reasoning.push(
    `Total: ${correctionContribution.toFixed(2)} + ${carbContribution.toFixed(2)} − ${iobContribution.toFixed(2)} = ${rawResult.toFixed(2)}U`,
  );

  // Safety checks
  if (rawResult < 0) {
    safetyFlags.push("Calculated dose is negative — no bolus suggested. You may have sufficient IOB already.");
  }
  if (current < HYPO_THRESHOLD_MMOL) {
    safetyFlags.push("Current glucose is below hypo threshold (3.9 mmol/L). Treat low glucose first.");
  }
  if (current < 4.5 && correctionContribution > 0) {
    safetyFlags.push("Current glucose is near-low. A correction dose may not be appropriate.");
  }
  if (rawResult > 20) {
    safetyFlags.push("Calculated dose exceeds 20U — verify your ISF and ICR values.");
  }
  if (isfMmol <= 0 || icr <= 0) {
    safetyFlags.push("ISF or ICR is zero or negative — check your settings.");
  }
  if (iobContribution > rawResult + iobContribution) {
    safetyFlags.push("Active IOB already exceeds the needed dose. Risk of insulin stacking.");
  }

  // Confidence score
  let confidence = 80;
  if (isfMmol <= 0 || icr <= 0) confidence -= 40;
  if (carbsPlanned === 0 && correctionContribution <= 0) confidence -= 20;
  if (safetyFlags.length > 0) confidence -= safetyFlags.length * 10;
  confidence = Math.max(0, Math.min(100, confidence));

  const suggestedBolus = rawResult > 0 && safetyFlags.filter((f) => f.includes("below hypo")).length === 0
    ? Math.round(rawResult * 20) / 20 // round to nearest 0.05U
    : null;

  return {
    suggestedBolus,
    confidence,
    reasoning,
    iobContribution,
    carbContribution,
    correctionContribution,
    safetyFlags,
    disclaimer: SAFETY_DISCLAIMER,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  3. optimizeBasalProfile                                                  */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function optimizeBasalProfile(
  glucoseReadings: { value: number; time: string }[],
  currentBasalProfile: { hour: number; rate: number }[],
): BasalOptimisation {
  // Build hourly glucose averages
  const hourlyBuckets: number[][] = Array.from({ length: 24 }, () => []);
  for (const r of glucoseReadings) {
    const hour = new Date(r.time).getHours();
    hourlyBuckets[hour].push(r.value);
  }

  const hourlyAverages = hourlyBuckets.map((bucket) =>
    bucket.length > 0 ? bucket.reduce((a, b) => a + b, 0) / bucket.length : null,
  );

  // Build current profile map (default 0.8 U/h for missing hours)
  const profileMap = new Map<number, number>();
  for (let h = 0; h < 24; h++) profileMap.set(h, 0.8);
  for (const entry of currentBasalProfile) profileMap.set(entry.hour, entry.rate);

  const currentProfile = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    rate: profileMap.get(h)!,
  }));

  const suggestedProfile: BasalOptimisation["suggestedProfile"] = [];
  const changes: BasalOptimisation["changes"] = [];

  for (let h = 0; h < 24; h++) {
    const avg = hourlyAverages[h];
    const currentRate = profileMap.get(h)!;
    let suggestedRate = currentRate;
    let reason = "No change — insufficient data or glucose in range.";

    if (avg !== null) {
      if (avg > 8.0) {
        // Consistently high — suggest increase (max +20%)
        const increase = Math.min(currentRate * 0.2, 0.3);
        suggestedRate = Math.round((currentRate + increase) * 100) / 100;
        reason = `Average glucose ${avg.toFixed(1)} mmol/L is above target. Suggest modest increase.`;
      } else if (avg < 4.2) {
        // Consistently low — suggest decrease (max -20%)
        const decrease = Math.min(currentRate * 0.2, 0.3);
        suggestedRate = Math.round(Math.max(0.05, currentRate - decrease) * 100) / 100;
        reason = `Average glucose ${avg.toFixed(1)} mmol/L is below target. Suggest modest decrease.`;
      } else {
        reason = `Average glucose ${avg.toFixed(1)} mmol/L is within target range.`;
      }
    }

    suggestedProfile.push({ hour: h, rate: suggestedRate, reason });

    if (suggestedRate !== currentRate) {
      changes.push({ hour: h, from: currentRate, to: suggestedRate, reason });
    }
  }

  // Dawn phenomenon detection (03:00-07:00 rising pattern)
  const dawnReadings = [3, 4, 5, 6, 7]
    .map((h) => hourlyAverages[h])
    .filter((v): v is number => v !== null);

  let overallAssessment = "";
  if (dawnReadings.length >= 3) {
    const dawnTrend = dawnReadings[dawnReadings.length - 1] - dawnReadings[0];
    if (dawnTrend > 1.5) {
      overallAssessment += "Dawn phenomenon detected: glucose rises between 03:00 and 07:00. " +
        "The suggested profile includes increased basal rates during pre-dawn hours. ";
    }
  }

  if (changes.length === 0) {
    overallAssessment += "Your current basal profile appears well-tuned based on available data. " +
      "Continue monitoring and discuss with your healthcare team at your next review.";
  } else {
    overallAssessment += `${changes.length} time block(s) have suggested adjustments (max ±20% per block). ` +
      "These are educational suggestions based on glucose pattern analysis. " +
      "Always discuss basal rate changes with your endocrinologist or diabetes educator.";
  }

  return {
    currentProfile,
    suggestedProfile,
    changes,
    overallAssessment,
    disclaimer:
      "AI explains. It does not prescribe. These basal rate suggestions are educational only, " +
      "derived from your glucose patterns. They are NOT medical recommendations. " +
      "Always consult your healthcare team before adjusting basal rates.",
  };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  4. predictHypoWindow                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function predictHypoWindow(
  readings: { value: number; time: string }[],
  iobData: { totalIOB: number; decayRatePerHour?: number },
  exerciseRecent: { type: string; intensity: string; durationMin: number; time: string }[],
): HypoWindow {
  if (readings.length < 2) {
    return {
      riskLevel: "low",
      estimatedTimeMinutes: null,
      guidance: "Insufficient data to assess hypo risk. Continue regular monitoring. " +
        "AI explains. It does not prescribe.",
    };
  }

  // Sort newest first
  const sorted = [...readings].sort((a, b) => parseTime(b.time) - parseTime(a.time));
  const latest = sorted[0].value;
  const previous = sorted[Math.min(sorted.length - 1, 2)].value;
  const timeDiffHours = (parseTime(sorted[0].time) - parseTime(sorted[Math.min(sorted.length - 1, 2)].time)) / 3_600_000;

  const rateOfChange = timeDiffHours > 0 ? (latest - previous) / timeDiffHours : 0;

  // IOB contribution to future drop
  const estimatedISF = 2.0;
  const pendingDrop = iobData.totalIOB * estimatedISF * 0.6; // 60% of IOB effect remaining

  // Exercise contribution
  let exerciseDrop = 0;
  const now = Date.now();
  for (const ex of exerciseRecent) {
    const elapsed = (now - parseTime(ex.time)) / 3_600_000;
    if (elapsed < 0 || elapsed > 3) continue;
    const factor = ex.intensity === "high" ? 0.08 : ex.intensity === "moderate" ? 0.05 : 0.02;
    exerciseDrop += ex.durationMin * factor * Math.max(0, 1 - elapsed / 3);
  }

  // Estimate time to hypo
  const totalDropRate = (rateOfChange < 0 ? Math.abs(rateOfChange) : 0) + pendingDrop / 2 + exerciseDrop / 2;
  const marginToHypo = latest - HYPO_THRESHOLD_MMOL;

  let estimatedTimeMinutes: number | null = null;
  if (totalDropRate > 0.1 && marginToHypo > 0) {
    estimatedTimeMinutes = Math.round((marginToHypo / totalDropRate) * 60);
  } else if (latest < HYPO_THRESHOLD_MMOL) {
    estimatedTimeMinutes = 0;
  }

  // Risk classification
  let riskLevel: HypoWindow["riskLevel"] = "low";
  if (latest < HYPO_THRESHOLD_MMOL) {
    riskLevel = "critical";
  } else if (estimatedTimeMinutes !== null && estimatedTimeMinutes < 30) {
    riskLevel = "high";
  } else if (estimatedTimeMinutes !== null && estimatedTimeMinutes < 90) {
    riskLevel = "moderate";
  } else if (marginToHypo < 1.5 && totalDropRate > 0.3) {
    riskLevel = "moderate";
  }

  // Guidance
  let guidance = "";
  switch (riskLevel) {
    case "critical":
      guidance = "Your glucose is currently below 3.9 mmol/L. Follow your hypo treatment plan: " +
        "consume 15g of fast-acting carbs, wait 15 minutes, and retest. Contact your healthcare team if needed.";
      break;
    case "high":
      guidance = "High risk of hypoglycaemia within the next 30 minutes. Consider having fast-acting carbs " +
        "ready and monitor frequently. Follow your personal hypo action plan.";
      break;
    case "moderate":
      guidance = "Moderate hypo risk detected. Your glucose may drop below target in the next 1-2 hours. " +
        "Consider a preventive snack if your healthcare team has advised this approach.";
      break;
    default:
      guidance = "Low hypo risk based on current data. Continue monitoring as usual.";
  }

  guidance += " AI explains. It does not prescribe.";

  return { riskLevel, estimatedTimeMinutes, guidance };
}
