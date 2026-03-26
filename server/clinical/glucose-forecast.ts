/**
 * GluMira™ — Glucose Forecast Engine Module
 *
 * Projects future glucose levels based on current trend, IOB,
 * COB (carbs on board), and activity using simplified pharmacokinetic
 * models.
 *
 * Clinical relevance:
 * - Forecasting helps prevent hypos and hypers before they happen
 * - IOB and COB curves are critical for accurate prediction
 * - Activity significantly affects glucose trajectory
 *
 * NOT a medical device. Educational purposes only.
 */

export interface ForecastInput {
  currentGlucoseMmol: number;
  currentTrend: number;            // mmol/L per 5 minutes
  iob: number;                     // insulin on board (units)
  isf: number;                     // mmol/L per unit
  cobG: number;                    // carbs on board (grams)
  icr: number;                     // grams per unit
  timeSinceLastBolusMin: number;
  timeSinceLastMealMin: number;
  exerciseActive: boolean;
  exerciseIntensity?: "light" | "moderate" | "vigorous";
  forecastMinutes: number;         // how far to forecast (30-240)
}

export interface ForecastPoint {
  minutesAhead: number;
  predictedGlucose: number;
  iobRemaining: number;
  cobRemaining: number;
  confidence: "high" | "moderate" | "low";
}

export interface ForecastResult {
  points: ForecastPoint[];
  peakGlucose: number;
  peakTime: number;
  nadirGlucose: number;
  nadirTime: number;
  hypoRisk: boolean;
  hyperRisk: boolean;
  predictedRange: { low: number; high: number };
  warnings: string[];
  notes: string[];
  disclaimer: string;
}

/* ── Pharmacokinetic curves ──────────────────────────────────── */

/** IOB decay: exponential with ~4h DIA */
function iobAtTime(iob: number, minutesSinceBolus: number, minutesAhead: number): number {
  const totalMin = minutesSinceBolus + minutesAhead;
  const dia = 240; // 4 hours
  if (totalMin >= dia) return 0;
  const remaining = 1 - (totalMin / dia) ** 1.5;
  return Math.max(0, iob * remaining);
}

/** COB absorption: linear over ~3h */
function cobAtTime(cob: number, minutesSinceMeal: number, minutesAhead: number): number {
  const totalMin = minutesSinceMeal + minutesAhead;
  const absorptionTime = 180; // 3 hours
  if (totalMin >= absorptionTime) return 0;
  const remaining = 1 - totalMin / absorptionTime;
  return Math.max(0, cob * remaining);
}

/* ── Main forecast ───────────────────────────────────────────── */

export function forecastGlucose(input: ForecastInput): ForecastResult {
  const {
    currentGlucoseMmol, currentTrend, iob, isf, cobG, icr,
    timeSinceLastBolusMin, timeSinceLastMealMin,
    exerciseActive, exerciseIntensity,
    forecastMinutes,
  } = input;

  const clampedForecast = Math.max(30, Math.min(240, forecastMinutes));
  const stepMin = 15;
  const steps = Math.ceil(clampedForecast / stepMin);

  const points: ForecastPoint[] = [];
  let glucose = currentGlucoseMmol;
  let peakGlucose = glucose;
  let peakTime = 0;
  let nadirGlucose = glucose;
  let nadirTime = 0;

  for (let i = 1; i <= steps; i++) {
    const min = i * stepMin;

    // Trend contribution (decays over time)
    const trendDecay = Math.max(0, 1 - min / 120); // trend fades over 2h
    const trendEffect = currentTrend * (stepMin / 5) * trendDecay;

    // IOB effect: insulin lowers glucose
    const iobNow = iobAtTime(iob, timeSinceLastBolusMin, min);
    const iobPrev = iobAtTime(iob, timeSinceLastBolusMin, min - stepMin);
    const insulinUsed = iobPrev - iobNow;
    const insulinEffect = -insulinUsed * isf;

    // COB effect: carbs raise glucose
    const cobNow = cobAtTime(cobG, timeSinceLastMealMin, min);
    const cobPrev = cobAtTime(cobG, timeSinceLastMealMin, min - stepMin);
    const carbsAbsorbed = cobPrev - cobNow;
    const carbEffect = icr > 0 ? (carbsAbsorbed / icr) * isf : 0;

    // Exercise effect
    let exerciseEffect = 0;
    if (exerciseActive) {
      const rate = exerciseIntensity === "vigorous" ? 0.15
        : exerciseIntensity === "moderate" ? 0.08
        : 0.04;
      exerciseEffect = -rate * (stepMin / 15);
    }

    glucose += trendEffect + insulinEffect + carbEffect + exerciseEffect;
    glucose = Math.round(Math.max(1.0, glucose) * 10) / 10;

    // Confidence decreases with time
    let confidence: ForecastPoint["confidence"] = "high";
    if (min > 120) confidence = "low";
    else if (min > 60) confidence = "moderate";

    points.push({
      minutesAhead: min,
      predictedGlucose: glucose,
      iobRemaining: Math.round(iobNow * 10) / 10,
      cobRemaining: Math.round(cobNow * 10) / 10,
      confidence,
    });

    if (glucose > peakGlucose) { peakGlucose = glucose; peakTime = min; }
    if (glucose < nadirGlucose) { nadirGlucose = glucose; nadirTime = min; }
  }

  // ── Risk assessment ──
  const hypoRisk = points.some((p) => p.predictedGlucose < 4.0);
  const hyperRisk = points.some((p) => p.predictedGlucose > 13.9);

  const allPredicted = points.map((p) => p.predictedGlucose);
  const predictedRange = {
    low: Math.min(...allPredicted),
    high: Math.max(...allPredicted),
  };

  // ── Warnings ──
  const warnings: string[] = [];
  if (hypoRisk) {
    const hypoPoint = points.find((p) => p.predictedGlucose < 4.0)!;
    warnings.push(`Hypoglycemia predicted in ~${hypoPoint.minutesAhead} minutes. Consider eating carbs now.`);
  }
  if (hyperRisk) {
    const hyperPoint = points.find((p) => p.predictedGlucose > 13.9)!;
    warnings.push(`Hyperglycemia predicted in ~${hyperPoint.minutesAhead} minutes. Consider a correction bolus.`);
  }

  // ── Notes ──
  const notes: string[] = [];
  if (iob > 0) {
    notes.push(`${Math.round(iob * 10) / 10}U of insulin still active — will continue lowering glucose.`);
  }
  if (cobG > 0) {
    notes.push(`${Math.round(cobG)}g of carbs still absorbing — will continue raising glucose.`);
  }
  if (exerciseActive) {
    notes.push(`Exercise is lowering glucose at ~${exerciseIntensity ?? "moderate"} intensity.`);
  }

  return {
    points,
    peakGlucose,
    peakTime,
    nadirGlucose,
    nadirTime,
    hypoRisk,
    hyperRisk,
    predictedRange,
    warnings,
    notes,
    disclaimer:
      "GluMira™ is an informational and educational tool only. It is NOT a medical device. " +
      "Glucose forecasts are estimates and may not reflect actual future values.",
  };
}
