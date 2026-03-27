/**
 * GluMira — Carb Ratio (ICR) Optimizer Module
 *
 * Analyses post-meal glucose excursions to suggest optimal ICR adjustments.
 * Uses the 500-rule baseline and refines with real-world meal data.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MealEvent {
  carbsGrams: number;
  bolusUnits: number;
  preMealGlucose: number;   // mmol/L
  postMealGlucose: number;  // mmol/L (2h post)
  timestamp: string;
}

export interface IcrAnalysis {
  currentIcr: number;
  effectiveIcr: number;
  suggestedIcr: number;
  direction: "tighten" | "loosen" | "no-change";
  confidence: "high" | "moderate" | "low";
  postMealMean: number;
  postMealTarget: number;
  excursionMean: number;
  mealCount: number;
}

export interface MealTimeIcr {
  period: "breakfast" | "lunch" | "dinner" | "snack";
  suggestedIcr: number;
  mealCount: number;
  avgExcursion: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ─── 500-Rule baseline ──────────────────────────────────────────────────────

/**
 * Estimate ICR using the 500-rule: ICR = 500 / TDD
 */
export function estimateIcrFrom500Rule(totalDailyDose: number): number {
  if (totalDailyDose <= 0) throw new Error("TDD must be positive");
  return round2(500 / totalDailyDose);
}

// ─── Effective ICR from meal data ────────────────────────────────────────────

/**
 * Compute the effective ICR from a single meal event.
 * effectiveIcr = carbsGrams / bolusUnits (what was actually used)
 */
export function computeEffectiveIcr(meal: MealEvent): number {
  if (meal.bolusUnits <= 0) return Infinity;
  return round2(meal.carbsGrams / meal.bolusUnits);
}

/**
 * Compute the post-meal excursion (rise or fall).
 */
export function computeExcursion(meal: MealEvent): number {
  return round2(meal.postMealGlucose - meal.preMealGlucose);
}

// ─── ICR Analysis ────────────────────────────────────────────────────────────

/**
 * Analyse a set of meal events and suggest an ICR adjustment.
 *
 * If post-meal glucose is consistently high → tighten (lower ICR number = more insulin per gram)
 * If post-meal glucose is consistently low → loosen (higher ICR number = less insulin per gram)
 */
export function analyseIcr(
  meals: MealEvent[],
  currentIcr: number,
  postMealTarget: number = 8.0
): IcrAnalysis {
  if (meals.length === 0) {
    return {
      currentIcr,
      effectiveIcr: currentIcr,
      suggestedIcr: currentIcr,
      direction: "no-change",
      confidence: "low",
      postMealMean: 0,
      postMealTarget,
      excursionMean: 0,
      mealCount: 0,
    };
  }

  const excursions = meals.map(computeExcursion);
  const postMeals = meals.map((m) => m.postMealGlucose);
  const effectiveIcrs = meals.filter((m) => m.bolusUnits > 0).map(computeEffectiveIcr);

  const excursionMean = round2(mean(excursions));
  const postMealMean = round2(mean(postMeals));
  const effectiveIcr = effectiveIcrs.length > 0 ? round2(mean(effectiveIcrs)) : currentIcr;

  // Determine direction
  const highThreshold = postMealTarget + 2.0; // > 10 mmol/L
  const lowThreshold = postMealTarget - 4.0;  // < 4 mmol/L

  let direction: "tighten" | "loosen" | "no-change";
  let suggestedIcr: number;

  if (postMealMean > highThreshold) {
    // Too high → tighten (decrease ICR by 10-20%)
    const reduction = postMealMean > highThreshold + 3 ? 0.2 : 0.1;
    suggestedIcr = round2(currentIcr * (1 - reduction));
    direction = "tighten";
  } else if (postMealMean < lowThreshold) {
    // Too low → loosen (increase ICR by 10-20%)
    const increase = postMealMean < lowThreshold - 2 ? 0.2 : 0.1;
    suggestedIcr = round2(currentIcr * (1 + increase));
    direction = "loosen";
  } else {
    suggestedIcr = currentIcr;
    direction = "no-change";
  }

  // Clamp ICR to reasonable range
  suggestedIcr = clamp(suggestedIcr, 2, 50);

  // Confidence based on meal count
  const confidence: "high" | "moderate" | "low" =
    meals.length >= 10 ? "high" : meals.length >= 5 ? "moderate" : "low";

  return {
    currentIcr,
    effectiveIcr,
    suggestedIcr,
    direction,
    confidence,
    postMealMean,
    postMealTarget,
    excursionMean,
    mealCount: meals.length,
  };
}

// ─── Meal-time specific ICR ──────────────────────────────────────────────────

function classifyMealTime(timestamp: string): "breakfast" | "lunch" | "dinner" | "snack" {
  const hour = new Date(timestamp).getHours();
  if (hour >= 5 && hour < 10) return "breakfast";
  if (hour >= 11 && hour < 14) return "lunch";
  if (hour >= 17 && hour < 21) return "dinner";
  return "snack";
}

/**
 * Compute per-meal-time ICR suggestions.
 */
export function computeMealTimeIcr(
  meals: MealEvent[],
  currentIcr: number,
  postMealTarget: number = 8.0
): MealTimeIcr[] {
  const groups: Record<string, MealEvent[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  };

  for (const meal of meals) {
    const period = classifyMealTime(meal.timestamp);
    groups[period].push(meal);
  }

  return (["breakfast", "lunch", "dinner", "snack"] as const).map((period) => {
    const periodMeals = groups[period];
    if (periodMeals.length === 0) {
      return { period, suggestedIcr: currentIcr, mealCount: 0, avgExcursion: 0 };
    }

    const analysis = analyseIcr(periodMeals, currentIcr, postMealTarget);
    return {
      period,
      suggestedIcr: analysis.suggestedIcr,
      mealCount: periodMeals.length,
      avgExcursion: analysis.excursionMean,
    };
  });
}

// ─── ICR direction label + colour ────────────────────────────────────────────

export function icrDirectionLabel(direction: string): string {
  const labels: Record<string, string> = {
    tighten: "Decrease ratio (more insulin per gram)",
    loosen: "Increase ratio (less insulin per gram)",
    "no-change": "Current ratio is appropriate",
  };
  return labels[direction] ?? "Unknown";
}

export function icrDirectionColour(direction: string): string {
  const colours: Record<string, string> = {
    tighten: "amber",
    loosen: "blue",
    "no-change": "green",
  };
  return colours[direction] ?? "gray";
}

// ─── Confidence label ────────────────────────────────────────────────────────

export function confidenceLabel(confidence: string): string {
  const labels: Record<string, string> = {
    high: "High confidence — based on 10+ meals",
    moderate: "Moderate confidence — based on 5-9 meals",
    low: "Low confidence — fewer than 5 meals recorded",
  };
  return labels[confidence] ?? "Unknown";
}
