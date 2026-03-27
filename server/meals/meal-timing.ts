/**
 * GluMira™ — meal-timing.ts
 *
 * Meal timing analysis module.
 * Analyses meal patterns, pre-bolus timing, and post-meal glucose excursions.
 * Provides recommendations for optimal meal timing and bolus timing.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MealEvent {
  eatenAt: Date | string;
  carbsGrams: number;
  mealType?: "breakfast" | "lunch" | "dinner" | "snack";
}

export interface DoseEvent {
  administeredAt: Date | string;
  doseUnits: number;
  doseType: "bolus" | "correction" | "basal";
}

export interface PostMealGlucoseEvent {
  mealAt: Date | string;
  glucoseAt: Date | string;
  glucoseMmol: number;
  preMealMmol: number;
}

export interface MealTimingPattern {
  mealType: string;
  averageTime: string;        // HH:MM
  count: number;
  averageCarbsGrams: number;
  consistency: "consistent" | "variable" | "irregular";
}

export interface PreBolusAnalysis {
  averagePreBolusMinutes: number;  // negative = bolus after meal
  recommendedMinutes: number;
  events: number;
  adequacy: "optimal" | "too-late" | "too-early";
}

export interface PostMealExcursionResult {
  averagePeakRiseMmol: number;
  averagePeakTime: number;        // minutes after meal
  excursionsAbove10: number;      // count of excursions > 10 mmol/L
  totalEvents: number;
  severity: "mild" | "moderate" | "significant";
}

export interface MealTimingReport {
  patterns: MealTimingPattern[];
  preBolusAnalysis: PreBolusAnalysis | null;
  postMealExcursions: PostMealExcursionResult | null;
  recommendations: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDate(val: Date | string): Date {
  return val instanceof Date ? val : new Date(val);
}

function getHourMinute(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function minutesSinceMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

// ─── Meal Pattern Analysis ────────────────────────────────────────────────────

/**
 * Analyse meal timing patterns grouped by meal type.
 */
export function analyseMealPatterns(meals: MealEvent[]): MealTimingPattern[] {
  if (meals.length === 0) return [];

  const groups = new Map<string, { times: number[]; carbs: number[] }>();

  for (const meal of meals) {
    const type = meal.mealType ?? "snack";
    const d = toDate(meal.eatenAt);
    const mins = minutesSinceMidnight(d);

    if (!groups.has(type)) groups.set(type, { times: [], carbs: [] });
    groups.get(type)!.times.push(mins);
    groups.get(type)!.carbs.push(meal.carbsGrams);
  }

  return Array.from(groups.entries()).map(([mealType, { times, carbs }]) => {
    const avgMins = times.reduce((a, b) => a + b, 0) / times.length;
    const avgCarbs = carbs.reduce((a, b) => a + b, 0) / carbs.length;

    // Consistency: SD of meal times
    const variance = times.reduce((acc, t) => acc + (t - avgMins) ** 2, 0) / times.length;
    const sd = Math.sqrt(variance);

    const consistency: MealTimingPattern["consistency"] =
      sd < 30 ? "consistent"
      : sd < 60 ? "variable"
      : "irregular";

    const hours = Math.floor(avgMins / 60);
    const mins = Math.round(avgMins % 60);
    const averageTime = `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;

    return {
      mealType,
      averageTime,
      count: times.length,
      averageCarbsGrams: Math.round(avgCarbs),
      consistency,
    };
  });
}

// ─── Pre-Bolus Timing Analysis ────────────────────────────────────────────────

/**
 * Analyse how far in advance bolus doses are given relative to meals.
 * Positive minutes = bolus before meal (correct).
 * Negative minutes = bolus after meal (late).
 */
export function analysePreBolusTiming(
  meals: MealEvent[],
  doses: DoseEvent[],
  windowMinutes = 60
): PreBolusAnalysis | null {
  if (meals.length === 0 || doses.length === 0) return null;

  const bolusDoses = doses.filter((d) => d.doseType === "bolus");
  if (bolusDoses.length === 0) return null;

  const preBolusDelays: number[] = [];

  for (const meal of meals) {
    const mealTime = toDate(meal.eatenAt).getTime();

    // Find the closest bolus dose within the window
    const closestDose = bolusDoses.reduce<{ dose: DoseEvent; diff: number } | null>(
      (best, dose) => {
        const doseTime = toDate(dose.administeredAt).getTime();
        const diff = (mealTime - doseTime) / 60000; // positive = dose before meal
        if (Math.abs(diff) <= windowMinutes) {
          if (!best || Math.abs(diff) < Math.abs(best.diff)) {
            return { dose, diff };
          }
        }
        return best;
      },
      null
    );

    if (closestDose) {
      preBolusDelays.push(closestDose.diff);
    }
  }

  if (preBolusDelays.length === 0) return null;

  const avgDelay = preBolusDelays.reduce((a, b) => a + b, 0) / preBolusDelays.length;
  const roundedAvg = Math.round(avgDelay);

  // Optimal pre-bolus: 10–20 min before meal for rapid insulin
  const adequacy: PreBolusAnalysis["adequacy"] =
    roundedAvg >= 10 && roundedAvg <= 20 ? "optimal"
    : roundedAvg < 10 ? "too-late"
    : "too-early";

  return {
    averagePreBolusMinutes: roundedAvg,
    recommendedMinutes: 15,
    events: preBolusDelays.length,
    adequacy,
  };
}

// ─── Post-Meal Excursion Analysis ─────────────────────────────────────────────

/**
 * Analyse post-meal glucose excursions.
 */
export function analysePostMealExcursions(
  events: PostMealGlucoseEvent[]
): PostMealExcursionResult | null {
  if (events.length === 0) return null;

  const rises = events.map((e) => e.glucoseMmol - e.preMealMmol);
  const avgRise = rises.reduce((a, b) => a + b, 0) / rises.length;

  const peakTimes = events.map((e) => {
    const mealMs = toDate(e.mealAt).getTime();
    const glucoseMs = toDate(e.glucoseAt).getTime();
    return (glucoseMs - mealMs) / 60000;
  });

  const avgPeakTime = peakTimes.reduce((a, b) => a + b, 0) / peakTimes.length;
  const excursionsAbove10 = events.filter((e) => e.glucoseMmol > 10.0).length;

  const severity: PostMealExcursionResult["severity"] =
    avgRise < 2.0 ? "mild"
    : avgRise < 4.0 ? "moderate"
    : "significant";

  return {
    averagePeakRiseMmol: Math.round(avgRise * 100) / 100,
    averagePeakTime: Math.round(avgPeakTime),
    excursionsAbove10,
    totalEvents: events.length,
    severity,
  };
}

// ─── Full Meal Timing Report ──────────────────────────────────────────────────

/**
 * Generate a full meal timing report combining all analyses.
 */
export function generateMealTimingReport(
  meals: MealEvent[],
  doses: DoseEvent[],
  postMealEvents: PostMealGlucoseEvent[]
): MealTimingReport {
  const patterns = analyseMealPatterns(meals);
  const preBolusAnalysis = analysePreBolusTiming(meals, doses);
  const postMealExcursions = analysePostMealExcursions(postMealEvents);

  const recommendations: string[] = [];

  if (preBolusAnalysis) {
    if (preBolusAnalysis.adequacy === "too-late") {
      recommendations.push(
        `Pre-bolus timing is too late (avg ${preBolusAnalysis.averagePreBolusMinutes} min) — aim for 10–20 min before meals`
      );
    } else if (preBolusAnalysis.adequacy === "too-early") {
      recommendations.push(
        `Pre-bolus timing is too early (avg ${preBolusAnalysis.averagePreBolusMinutes} min) — risk of hypoglycaemia before eating`
      );
    }
  }

  if (postMealExcursions?.severity === "significant") {
    recommendations.push(
      `Post-meal glucose excursions are significant (avg +${postMealExcursions.averagePeakRiseMmol} mmol/L) — review ICR and pre-bolus timing`
    );
  }

  const irregularMeals = patterns.filter((p) => p.consistency === "irregular");
  if (irregularMeals.length > 0) {
    recommendations.push(
      `Irregular ${irregularMeals.map((p) => p.mealType).join(", ")} timing — consistent meal times improve glucose predictability`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("Meal timing patterns look good — continue current approach");
  }

  return { patterns, preBolusAnalysis, postMealExcursions, recommendations };
}
