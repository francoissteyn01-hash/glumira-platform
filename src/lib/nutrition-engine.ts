/**
 * GluMira™ V7 — Nutrition Intelligence Engine (Block 42)
 * Glucose-response correlation engine linking meals to glucose outcomes.
 */

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface MealEntry {
  id: string;
  description: string;
  mealType: string; // e.g. "breakfast", "lunch", "dinner", "snack"
  carbsG: number;
  timestamp: number; // epoch ms
  insulinDosed: number; // units
  preBolus: boolean;
  preBolusMins?: number; // minutes before eating that insulin was dosed
}

export interface GlucoseReading {
  timestamp: number; // epoch ms
  value: number; // mmol/L
}

export interface MealGlucoseCorrelation {
  mealId: string;
  mealDescription: string;
  mealType: string;
  carbsG: number;
  preMealGlucose: number;
  postMealGlucose1h: number | null;
  postMealGlucose2h: number | null;
  glucoseRise: number;
  timeToReturn: number | null; // minutes to return to pre-meal level
  insulinDosed: number;
  effectiveness: "optimal" | "under_dosed" | "over_dosed" | "delayed" | "unknown";
}

export interface NutritionInsight {
  avgGlucoseRiseByMealType: Record<string, number>;
  worstMealTypes: string[];
  bestMealTypes: string[];
  avgTimeToReturn: number;
  carbSensitivityEstimate: number; // mmol/L rise per 10g carbs
  recommendations: string[];
}

/* ─── Constants ─────────────────────────────────────────────────────────── */

const ONE_HOUR_MS = 60 * 60 * 1000;
const TWO_HOURS_MS = 2 * ONE_HOUR_MS;
const FIVE_HOURS_MS = 5 * ONE_HOUR_MS;
const READING_WINDOW_MS = 15 * 60 * 1000; // ±15 min tolerance

// Thresholds (mmol/L)
const OPTIMAL_RISE_MAX = 3.0;
const OVER_DOSED_DROP = -1.5; // net drop from pre-meal
const DELAYED_PEAK_THRESHOLD_MS = 90 * 60 * 1000; // peak after 90 min suggests delayed absorption

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function findClosestReading(
  readings: GlucoseReading[],
  targetTime: number,
  windowMs: number = READING_WINDOW_MS
): GlucoseReading | null {
  let best: GlucoseReading | null = null;
  let bestDelta = Infinity;

  for (const r of readings) {
    const delta = Math.abs(r.timestamp - targetTime);
    if (delta < windowMs && delta < bestDelta) {
      best = r;
      bestDelta = delta;
    }
  }
  return best;
}

function findPeakReading(
  readings: GlucoseReading[],
  startTime: number,
  endTime: number
): { reading: GlucoseReading; timeFromStart: number } | null {
  let peak: GlucoseReading | null = null;

  for (const r of readings) {
    if (r.timestamp >= startTime && r.timestamp <= endTime) {
      if (!peak || r.value > peak.value) {
        peak = r;
      }
    }
  }

  if (!peak) return null;
  return { reading: peak, timeFromStart: peak.timestamp - startTime };
}

function findReturnTime(
  readings: GlucoseReading[],
  mealTime: number,
  preMealValue: number,
  maxWindowMs: number = FIVE_HOURS_MS
): number | null {
  // Find the first reading after the peak that returns to within 0.5 mmol/L of pre-meal
  const peakInfo = findPeakReading(readings, mealTime, mealTime + maxWindowMs);
  if (!peakInfo) return null;

  for (const r of readings) {
    if (
      r.timestamp > peakInfo.reading.timestamp &&
      r.timestamp <= mealTime + maxWindowMs &&
      Math.abs(r.value - preMealValue) <= 0.5
    ) {
      return Math.round((r.timestamp - mealTime) / 60000); // minutes
    }
  }
  return null;
}

function classifyEffectiveness(
  rise: number,
  preMeal: number,
  postMeal2h: number | null,
  peakTimeMs: number | null
): MealGlucoseCorrelation["effectiveness"] {
  if (postMeal2h === null && peakTimeMs === null) return "unknown";

  const netChange = postMeal2h !== null ? postMeal2h - preMeal : rise;

  if (netChange < OVER_DOSED_DROP) return "over_dosed";
  if (peakTimeMs !== null && peakTimeMs > DELAYED_PEAK_THRESHOLD_MS) return "delayed";
  if (rise <= OPTIMAL_RISE_MAX && netChange <= 2.0) return "optimal";
  if (rise > OPTIMAL_RISE_MAX) return "under_dosed";

  return "optimal";
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/* ─── Public API ────────────────────────────────────────────────────────── */

/**
 * Matches meals to subsequent glucose readings and calculates per-meal
 * glucose response correlations.
 */
export function analyzeMealGlucoseResponse(
  meals: MealEntry[],
  glucoseReadings: GlucoseReading[]
): MealGlucoseCorrelation[] {
  // Sort readings by time for efficient searching
  const sorted = [...glucoseReadings].sort((a, b) => a.timestamp - b.timestamp);
  const correlations: MealGlucoseCorrelation[] = [];

  for (const meal of meals) {
    // Find pre-meal reading (closest within 15 min before meal)
    const preReading = findClosestReading(sorted, meal.timestamp, READING_WINDOW_MS);
    if (!preReading) continue; // cannot correlate without a pre-meal reading

    const preMealGlucose = preReading.value;

    // Find 1h and 2h post-meal readings
    const post1h = findClosestReading(sorted, meal.timestamp + ONE_HOUR_MS);
    const post2h = findClosestReading(sorted, meal.timestamp + TWO_HOURS_MS);

    // Find peak within the 3-hour post-meal window
    const peak = findPeakReading(sorted, meal.timestamp, meal.timestamp + 3 * ONE_HOUR_MS);
    const glucoseRise = peak ? round1(peak.reading.value - preMealGlucose) : 0;

    // Find time to return to baseline
    const timeToReturn = findReturnTime(sorted, meal.timestamp, preMealGlucose);

    const effectiveness = classifyEffectiveness(
      glucoseRise,
      preMealGlucose,
      post2h?.value ?? null,
      peak?.timeFromStart ?? null
    );

    correlations.push({
      mealId: meal.id,
      mealDescription: meal.description,
      mealType: meal.mealType,
      carbsG: meal.carbsG,
      preMealGlucose: round1(preMealGlucose),
      postMealGlucose1h: post1h ? round1(post1h.value) : null,
      postMealGlucose2h: post2h ? round1(post2h.value) : null,
      glucoseRise: round1(glucoseRise),
      timeToReturn,
      insulinDosed: meal.insulinDosed,
      effectiveness,
    });
  }

  return correlations;
}

/**
 * Estimates personal carbohydrate sensitivity from historical meal-glucose
 * correlations: mmol/L rise per 10 g of carbohydrate.
 */
export function estimateCarbSensitivity(
  correlations: MealGlucoseCorrelation[]
): number {
  const valid = correlations.filter(
    (c) => c.carbsG > 0 && c.glucoseRise > 0 && c.effectiveness !== "unknown"
  );
  if (valid.length === 0) return 0;

  const sensitivities = valid.map((c) => (c.glucoseRise / c.carbsG) * 10);
  const avg = sensitivities.reduce((sum, v) => sum + v, 0) / sensitivities.length;
  return round1(avg);
}

/**
 * Generates aggregated nutrition insights from a set of meal-glucose
 * correlations.
 */
export function generateNutritionInsights(
  correlations: MealGlucoseCorrelation[]
): NutritionInsight {
  // Group by meal type
  const byType: Record<string, MealGlucoseCorrelation[]> = {};
  for (const c of correlations) {
    const key = c.mealType.toLowerCase();
    if (!byType[key]) byType[key] = [];
    byType[key].push(c);
  }

  // Average glucose rise by meal type
  const avgGlucoseRiseByMealType: Record<string, number> = {};
  for (const [type, items] of Object.entries(byType)) {
    const avg = items.reduce((s, i) => s + i.glucoseRise, 0) / items.length;
    avgGlucoseRiseByMealType[type] = round1(avg);
  }

  // Sort meal types by average rise
  const sortedTypes = Object.entries(avgGlucoseRiseByMealType).sort(
    (a, b) => b[1] - a[1]
  );
  const worstMealTypes = sortedTypes
    .filter(([, avg]) => avg > OPTIMAL_RISE_MAX)
    .map(([type]) => type);
  const bestMealTypes = sortedTypes
    .filter(([, avg]) => avg <= OPTIMAL_RISE_MAX)
    .map(([type]) => type);

  // Average time to return
  const withReturn = correlations.filter((c) => c.timeToReturn !== null);
  const avgTimeToReturn =
    withReturn.length > 0
      ? Math.round(
          withReturn.reduce((s, c) => s + c.timeToReturn!, 0) / withReturn.length
        )
      : 0;

  const carbSensitivityEstimate = estimateCarbSensitivity(correlations);

  // Generate recommendations
  const recommendations: string[] = [];

  if (worstMealTypes.length > 0) {
    recommendations.push(
      `Your highest glucose rises occur at ${worstMealTypes.join(", ")}. Consider reviewing carb counts, pre-bolus timing, or food choices for these meals.`
    );
  }

  if (bestMealTypes.length > 0) {
    recommendations.push(
      `Your ${bestMealTypes.join(", ")} meals show good glucose responses. These patterns can guide improvements for other meal times.`
    );
  }

  const underDosed = correlations.filter((c) => c.effectiveness === "under_dosed");
  if (underDosed.length > correlations.length * 0.3 && correlations.length >= 5) {
    recommendations.push(
      "More than 30% of meals show possible under-dosing. Discuss insulin-to-carb ratio adjustments with your care team."
    );
  }

  const delayed = correlations.filter((c) => c.effectiveness === "delayed");
  if (delayed.length > correlations.length * 0.2 && correlations.length >= 5) {
    recommendations.push(
      "A significant proportion of meals show delayed glucose peaks. This may indicate fat/protein effects or gastroparesis. Consider extended bolus strategies."
    );
  }

  if (avgTimeToReturn > 180) {
    recommendations.push(
      `Average time to return to baseline is ${avgTimeToReturn} minutes (over 3 hours). This suggests insulin action or meal composition may need review.`
    );
  }

  if (carbSensitivityEstimate > 0) {
    recommendations.push(
      `Your estimated carb sensitivity is ${carbSensitivityEstimate} mmol/L per 10 g carbs. Share this with your care team to refine your insulin-to-carb ratios.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push(
      "Not enough data to generate personalised recommendations yet. Continue logging meals and glucose readings to build your profile."
    );
  }

  return {
    avgGlucoseRiseByMealType,
    worstMealTypes,
    bestMealTypes,
    avgTimeToReturn,
    carbSensitivityEstimate,
    recommendations,
  };
}

/**
 * Suggests pre-bolus timing based on observed meal-type glucose response.
 * Returns the suggested number of minutes to bolus before eating.
 *
 * This is educational guidance — always confirm changes with your care team.
 */
export function suggestPreBolusTiming(
  mealType: string,
  avgRise: number
): { minutes: number; confidence: "low" | "moderate" | "high"; rationale: string } {
  // Higher rise → longer pre-bolus recommended
  // Base suggestion: 15 min for moderate rise, scale from there
  let minutes: number;
  let confidence: "low" | "moderate" | "high";
  let rationale: string;

  if (avgRise <= 2.0) {
    minutes = 5;
    confidence = "moderate";
    rationale =
      `Your ${mealType} meals produce a modest glucose rise (avg ${round1(avgRise)} mmol/L). ` +
      "A short pre-bolus of ~5 minutes or bolusing at meal time is likely sufficient.";
  } else if (avgRise <= 4.0) {
    minutes = 15;
    confidence = "moderate";
    rationale =
      `Your ${mealType} meals produce a moderate glucose rise (avg ${round1(avgRise)} mmol/L). ` +
      "A 15-minute pre-bolus may help reduce the post-meal spike.";
  } else if (avgRise <= 6.0) {
    minutes = 20;
    confidence = "moderate";
    rationale =
      `Your ${mealType} meals produce a significant glucose rise (avg ${round1(avgRise)} mmol/L). ` +
      "A 20-minute pre-bolus is suggested to allow insulin to begin acting before the carb load arrives.";
  } else if (avgRise <= 9.0) {
    minutes = 25;
    confidence = "high";
    rationale =
      `Your ${mealType} meals produce a large glucose rise (avg ${round1(avgRise)} mmol/L). ` +
      "A 25-minute pre-bolus is recommended. Also consider reviewing carb counts and meal composition.";
  } else {
    minutes = 30;
    confidence = "high";
    rationale =
      `Your ${mealType} meals produce a very large glucose rise (avg ${round1(avgRise)} mmol/L). ` +
      "A 30-minute pre-bolus is suggested, but this level of rise may also indicate an insulin-to-carb ratio that needs adjustment. Discuss with your care team.";
  }

  return { minutes, confidence, rationale };
}
