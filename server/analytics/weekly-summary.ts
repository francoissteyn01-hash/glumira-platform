/**
 * GluMira™ — weekly-summary.ts
 *
 * Weekly summary analytics module.
 * Generates a structured weekly summary comparing this week vs last week
 * across glucose, doses, and meal metrics.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeeklyGlucoseMetrics {
  meanMmol: number;
  tirPercent: number;       // % in range 3.9–10.0
  hypoPercent: number;      // % < 3.9
  hyperPercent: number;     // % > 10.0
  cv: number;               // coefficient of variation %
  readingCount: number;
}

export interface WeeklyDoseMetrics {
  totalDoses: number;
  totalUnits: number;
  averageDailyUnits: number;
  bolusCount: number;
  basalCount: number;
  correctionCount: number;
}

export interface WeeklyMealMetrics {
  totalMeals: number;
  averageDailyCarbsGrams: number;
  averageMealCarbsGrams: number;
}

export interface WeeklyDelta<T> {
  current: T;
  previous: T | null;
  deltaPercent: number | null;
  trend: "up" | "down" | "stable" | "no-data";
}

export interface WeeklySummary {
  weekStartDate: string;       // ISO date
  weekEndDate: string;
  glucose: WeeklyDelta<WeeklyGlucoseMetrics>;
  doses: WeeklyDelta<WeeklyDoseMetrics>;
  meals: WeeklyDelta<WeeklyMealMetrics>;
  highlights: string[];
  score: number;               // 0–100 overall week score
  scoreLabel: "excellent" | "good" | "fair" | "needs-attention";
}

// ─── Glucose Metrics ─────────────────────────────────────────────────────────

export function computeWeeklyGlucoseMetrics(
  readings: number[]
): WeeklyGlucoseMetrics {
  if (readings.length === 0) {
    return { meanMmol: 0, tirPercent: 0, hypoPercent: 0, hyperPercent: 0, cv: 0, readingCount: 0 };
  }

  const mean = readings.reduce((a, b) => a + b, 0) / readings.length;
  const variance = readings.reduce((acc, r) => acc + (r - mean) ** 2, 0) / readings.length;
  const sd = Math.sqrt(variance);
  const cv = mean > 0 ? (sd / mean) * 100 : 0;

  const inRange = readings.filter((r) => r >= 3.9 && r <= 10.0).length;
  const hypo = readings.filter((r) => r < 3.9).length;
  const hyper = readings.filter((r) => r > 10.0).length;

  return {
    meanMmol: Math.round(mean * 100) / 100,
    tirPercent: Math.round((inRange / readings.length) * 100 * 10) / 10,
    hypoPercent: Math.round((hypo / readings.length) * 100 * 10) / 10,
    hyperPercent: Math.round((hyper / readings.length) * 100 * 10) / 10,
    cv: Math.round(cv * 10) / 10,
    readingCount: readings.length,
  };
}

// ─── Dose Metrics ─────────────────────────────────────────────────────────────

export interface SimpleDose {
  units: number;
  doseType: "bolus" | "basal" | "correction";
}

export function computeWeeklyDoseMetrics(
  doses: SimpleDose[],
  days = 7
): WeeklyDoseMetrics {
  const totalUnits = doses.reduce((a, d) => a + d.units, 0);
  const bolusCount = doses.filter((d) => d.doseType === "bolus").length;
  const basalCount = doses.filter((d) => d.doseType === "basal").length;
  const correctionCount = doses.filter((d) => d.doseType === "correction").length;

  return {
    totalDoses: doses.length,
    totalUnits: Math.round(totalUnits * 10) / 10,
    averageDailyUnits: Math.round((totalUnits / days) * 10) / 10,
    bolusCount,
    basalCount,
    correctionCount,
  };
}

// ─── Meal Metrics ─────────────────────────────────────────────────────────────

export interface SimpleMeal {
  carbsGrams: number;
}

export function computeWeeklyMealMetrics(
  meals: SimpleMeal[],
  days = 7
): WeeklyMealMetrics {
  const totalCarbs = meals.reduce((a, m) => a + m.carbsGrams, 0);
  return {
    totalMeals: meals.length,
    averageDailyCarbsGrams: Math.round(totalCarbs / days),
    averageMealCarbsGrams: meals.length > 0 ? Math.round(totalCarbs / meals.length) : 0,
  };
}

// ─── Delta Computation ────────────────────────────────────────────────────────

function computeDelta<T>(
  current: T,
  previous: T | null,
  key: keyof T
): WeeklyDelta<T> {
  if (!previous) {
    return { current, previous: null, deltaPercent: null, trend: "no-data" };
  }

  const curr = current[key] as unknown as number;
  const prev = previous[key] as unknown as number;

  if (prev === 0) {
    return { current, previous, deltaPercent: null, trend: "no-data" };
  }

  const deltaPercent = Math.round(((curr - prev) / prev) * 100);
  const trend: WeeklyDelta<T>["trend"] =
    deltaPercent > 5 ? "up"
    : deltaPercent < -5 ? "down"
    : "stable";

  return { current, previous, deltaPercent, trend };
}

// ─── Week Score ───────────────────────────────────────────────────────────────

export function computeWeekScore(glucose: WeeklyGlucoseMetrics): number {
  // Score based on TIR (max 60 pts), hypo avoidance (max 25 pts), CV (max 15 pts)
  const tirScore = Math.min(60, (glucose.tirPercent / 70) * 60);
  const hypoScore = Math.max(0, 25 - glucose.hypoPercent * 5);
  const cvScore = Math.max(0, 15 - Math.max(0, glucose.cv - 20) * 0.5);

  return Math.round(tirScore + hypoScore + cvScore);
}

export function weekScoreLabel(score: number): WeeklySummary["scoreLabel"] {
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "fair";
  return "needs-attention";
}

// ─── Full Weekly Summary ──────────────────────────────────────────────────────

export function generateWeeklySummary(
  weekStart: Date,
  currentGlucose: number[],
  currentDoses: SimpleDose[],
  currentMeals: SimpleMeal[],
  previousGlucose?: number[],
  previousDoses?: SimpleDose[],
  previousMeals?: SimpleMeal[]
): WeeklySummary {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const currGlucoseMetrics = computeWeeklyGlucoseMetrics(currentGlucose);
  const currDoseMetrics = computeWeeklyDoseMetrics(currentDoses);
  const currMealMetrics = computeWeeklyMealMetrics(currentMeals);

  const prevGlucoseMetrics = previousGlucose ? computeWeeklyGlucoseMetrics(previousGlucose) : null;
  const prevDoseMetrics = previousDoses ? computeWeeklyDoseMetrics(previousDoses) : null;
  const prevMealMetrics = previousMeals ? computeWeeklyMealMetrics(previousMeals) : null;

  const glucose = computeDelta(currGlucoseMetrics, prevGlucoseMetrics, "tirPercent");
  const doses = computeDelta(currDoseMetrics, prevDoseMetrics, "totalUnits");
  const meals = computeDelta(currMealMetrics, prevMealMetrics, "averageDailyCarbsGrams");

  const score = computeWeekScore(currGlucoseMetrics);
  const scoreLabel = weekScoreLabel(score);

  const highlights: string[] = [];

  if (currGlucoseMetrics.tirPercent >= 70) {
    highlights.push(`Time in range: ${currGlucoseMetrics.tirPercent}% — target met`);
  } else {
    highlights.push(`Time in range: ${currGlucoseMetrics.tirPercent}% — below 70% target`);
  }

  if (currGlucoseMetrics.hypoPercent > 4) {
    highlights.push(`Hypo time: ${currGlucoseMetrics.hypoPercent}% — above 4% threshold`);
  }

  if (glucose.trend === "up" && glucose.deltaPercent !== null) {
    highlights.push(`TIR improved by ${glucose.deltaPercent}% vs last week`);
  } else if (glucose.trend === "down" && glucose.deltaPercent !== null) {
    highlights.push(`TIR declined by ${Math.abs(glucose.deltaPercent)}% vs last week`);
  }

  return {
    weekStartDate: weekStart.toISOString().split("T")[0],
    weekEndDate: weekEnd.toISOString().split("T")[0],
    glucose,
    doses,
    meals,
    highlights,
    score,
    scoreLabel,
  };
}
