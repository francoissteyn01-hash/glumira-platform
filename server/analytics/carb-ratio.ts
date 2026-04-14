/**
 * GluMira™ V7 — server/analytics/carb-ratio.ts
 *
 * Estimates effective insulin-to-carb ratio (ICR) from logged meal_bolus
 * events with carbs and the post-meal glucose excursion.
 *
 * Algorithm (educational, NOT a medical recommendation):
 *   For each meal_log row where event_type='meal_bolus', carbs_g > 10, units > 0:
 *     1. G_pre  = closest glucose reading within 15 min before the meal
 *     2. G_post = closest glucose reading 180–240 min after the meal
 *     3. rise   = max(G_peak in 60–180 min) - G_pre   (peak excursion)
 *     4. delta  = G_post - G_pre                      (return-to-baseline delta)
 *
 *   Aggregate across qualified meals:
 *     totalCarbs / totalUnits  →  "observed grams per unit" (effective ICR proxy)
 *     meanRise                  →  typical post-meal peak
 *     meanDelta                 →  typical 4h return delta
 *
 *   Direction recommendation (educational):
 *     mean delta > +1.5  → bolus appears under-dosed (tighten ICR)
 *     mean delta < -1.5  → bolus appears over-dosed  (relax ICR)
 *     otherwise           → coverage looks balanced
 *
 * GluMira™ is an educational platform, not a medical device.
 * Version: v1.0 · 2026-04-10
 */

export type MealBolus = {
  meal_time: string;       // ISO
  units: number;
  carbs_g: number;
}

export type GlucosePoint = {
  value_mmol: number;
  recorded_at: string;
}

export type CarbRatioResult = {
  configuredIcr: number | null;     // grams per unit (from profile)
  observedGramsPerUnit: number | null;
  meanRise: number | null;          // mmol/L
  meanDelta: number | null;         // mmol/L
  qualifiedMeals: number;
  totalMeals: number;
  windowDays: number;
  recommendation: "tighten" | "relax" | "balanced" | "insufficient";
  recommendationText: string;
  computedAt: string;
  disclaimer: string;
}

const PRE_LOOKBACK_MIN = 15;
const PEAK_MIN_MIN     = 60;
const PEAK_MAX_MIN     = 180;
const POST_MIN_MIN     = 180;
const POST_MAX_MIN     = 240;
const MIN_CARBS        = 10;

function lowerBound(arr: GlucosePoint[], tMs: number): number {
  let lo = 0, hi = arr.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (new Date(arr[mid].recorded_at).getTime() < tMs) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function findBefore(arr: GlucosePoint[], tMs: number, lookbackMs: number): GlucosePoint | null {
  const idx = lowerBound(arr, tMs);
  for (let i = idx - 1; i >= 0; i--) {
    const rt = new Date(arr[i].recorded_at).getTime();
    if (rt < tMs - lookbackMs) return null;
    if (rt <= tMs) return arr[i];
  }
  return null;
}

function findInWindow(arr: GlucosePoint[], tMs: number, minMs: number, maxMs: number): GlucosePoint[] {
  const lo = lowerBound(arr, tMs + minMs);
  const hi = lowerBound(arr, tMs + maxMs);
  return arr.slice(lo, hi);
}

export function computeCarbRatio(
  meals: MealBolus[],
  glucoseReadings: GlucosePoint[],
  windowDays: number,
  configuredIcr: number | null,
): CarbRatioResult {
  const sorted = [...glucoseReadings].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
  );

  const qualifying = meals.filter((m) => m.carbs_g >= MIN_CARBS && m.units > 0);

  let totalCarbs = 0;
  let totalUnits = 0;
  const rises:  number[] = [];
  const deltas: number[] = [];

  for (const m of qualifying) {
    const tMs   = new Date(m.meal_time).getTime();
    const gPre  = findBefore(sorted, tMs, PRE_LOOKBACK_MIN * 60_000);
    if (!gPre) continue;

    const peakWindow = findInWindow(sorted, tMs, PEAK_MIN_MIN * 60_000, PEAK_MAX_MIN * 60_000);
    if (peakWindow.length === 0) continue;
    const gPeak = peakWindow.reduce((max, p) => (p.value_mmol > max.value_mmol ? p : max), peakWindow[0]);

    const postWindow = findInWindow(sorted, tMs, POST_MIN_MIN * 60_000, POST_MAX_MIN * 60_000);
    if (postWindow.length === 0) continue;
    const gPost = postWindow[Math.floor(postWindow.length / 2)];

    rises.push(gPeak.value_mmol - gPre.value_mmol);
    deltas.push(gPost.value_mmol - gPre.value_mmol);
    totalCarbs += m.carbs_g;
    totalUnits += m.units;
  }

  const used = rises.length;

  if (used === 0) {
    return {
      configuredIcr,
      observedGramsPerUnit: null,
      meanRise: null,
      meanDelta: null,
      qualifiedMeals: 0,
      totalMeals: meals.length,
      windowDays,
      recommendation: "insufficient",
      recommendationText: "Not enough qualifying meals with paired glucose data yet.",
      computedAt: new Date().toISOString(),
      disclaimer: "GluMira™ is an educational platform, not a medical device.",
    };
  }

  const meanRise  = round2(rises.reduce((s, x) => s + x, 0) / used);
  const meanDelta = round2(deltas.reduce((s, x) => s + x, 0) / used);
  const observedGramsPerUnit = round2(totalCarbs / totalUnits);

  let recommendation: CarbRatioResult["recommendation"];
  let recommendationText: string;
  if (meanDelta > 1.5) {
    recommendation = "tighten";
    recommendationText = `Post-meal glucose averages +${meanDelta.toFixed(1)} mmol/L 4h after bolus — bolus may be under-dosed. Discuss tightening your ICR with your care team.`;
  } else if (meanDelta < -1.5) {
    recommendation = "relax";
    recommendationText = `Post-meal glucose averages ${meanDelta.toFixed(1)} mmol/L 4h after bolus — bolus may be over-dosed. Discuss loosening your ICR with your care team.`;
  } else {
    recommendation = "balanced";
    recommendationText = `Post-meal glucose returns within ±1.5 mmol/L of pre-meal — bolus coverage looks balanced.`;
  }

  return {
    configuredIcr,
    observedGramsPerUnit,
    meanRise,
    meanDelta,
    qualifiedMeals: used,
    totalMeals: meals.length,
    windowDays,
    recommendation,
    recommendationText,
    computedAt: new Date().toISOString(),
    disclaimer: "GluMira™ is an educational platform, not a medical device.",
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
