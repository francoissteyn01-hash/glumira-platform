/**
 * GluMira™ — regime-comparison.ts
 *
 * Compares glucose outcomes across different meal regimes.
 * Used to help patients understand how their chosen regime
 * affects TIR, mean glucose, and hypo/hyper frequency.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import type { GlucosePoint } from "./glucose-trend";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegimeWindow {
  regimeId: string;
  regimeName: string;
  startDate: string; // ISO date string YYYY-MM-DD
  endDate: string;   // ISO date string YYYY-MM-DD
}

export interface RegimeOutcome {
  regimeId: string;
  regimeName: string;
  startDate: string;
  endDate: string;
  count: number;
  mean: number;
  tirPercent: number;
  hypoPercent: number;
  hyperPercent: number;
  cv: number;
  gmi: number;
  daysTracked: number;
}

export interface RegimeComparisonResult {
  regimes: RegimeOutcome[];
  bestTirRegime: string | null;
  lowestHypoRegime: string | null;
  lowestCvRegime: string | null;
  generatedAt: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TIR_LOW = 3.9;   // mmol/L
const TIR_HIGH = 10.0; // mmol/L

// ─── Core computation ─────────────────────────────────────────────────────────

/**
 * Compute glucose outcome statistics for a set of readings.
 */
export function computeRegimeOutcome(
  readings: GlucosePoint[],
  window: RegimeWindow
): RegimeOutcome {
  const n = readings.length;

  if (n === 0) {
    return {
      ...window,
      count: 0,
      mean: 0,
      tirPercent: 0,
      hypoPercent: 0,
      hyperPercent: 0,
      cv: 0,
      gmi: 0,
      daysTracked: 0,
    };
  }

  const values = readings.map((r) => r.glucose);
  const mean = values.reduce((s, v) => s + v, 0) / n;

  const inRange = values.filter((v) => v >= TIR_LOW && v <= TIR_HIGH).length;
  const hypo = values.filter((v) => v < TIR_LOW).length;
  const hyper = values.filter((v) => v > TIR_HIGH).length;

  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const sd = Math.sqrt(variance);
  const cv = mean > 0 ? parseFloat(((sd / mean) * 100).toFixed(1)) : 0;

  // GMI = 3.31 + 0.02392 × mean_glucose_mg_dL
  const meanMgDl = mean * 18.0182;
  const gmi = parseFloat((3.31 + 0.02392 * meanMgDl).toFixed(2));

  const start = new Date(window.startDate).getTime();
  const end = new Date(window.endDate).getTime();
  const daysTracked = Math.max(
    1,
    Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1
  );

  return {
    regimeId: window.regimeId,
    regimeName: window.regimeName,
    startDate: window.startDate,
    endDate: window.endDate,
    count: n,
    mean: parseFloat(mean.toFixed(2)),
    tirPercent: parseFloat(((inRange / n) * 100).toFixed(1)),
    hypoPercent: parseFloat(((hypo / n) * 100).toFixed(1)),
    hyperPercent: parseFloat(((hyper / n) * 100).toFixed(1)),
    cv,
    gmi,
    daysTracked,
  };
}

/**
 * Compare outcomes across multiple regime windows.
 * Each window specifies a date range and regime identity.
 * Readings are filtered to the window's date range.
 */
export function compareRegimes(
  allReadings: GlucosePoint[],
  windows: RegimeWindow[]
): RegimeComparisonResult {
  const regimes: RegimeOutcome[] = windows.map((w) => {
    const start = new Date(w.startDate).getTime();
    const end = new Date(w.endDate).getTime() + 24 * 60 * 60 * 1000; // inclusive end
    const filtered = allReadings.filter((r) => {
      const t = new Date(r.timestamp).getTime();
      return t >= start && t < end;
    });
    return computeRegimeOutcome(filtered, w);
  });

  const withData = regimes.filter((r) => r.count > 0);

  const bestTirRegime =
    withData.length > 0
      ? withData.reduce((best, r) => (r.tirPercent > best.tirPercent ? r : best)).regimeId
      : null;

  const lowestHypoRegime =
    withData.length > 0
      ? withData.reduce((best, r) => (r.hypoPercent < best.hypoPercent ? r : best)).regimeId
      : null;

  const lowestCvRegime =
    withData.length > 0
      ? withData.reduce((best, r) => (r.cv < best.cv ? r : best)).regimeId
      : null;

  return {
    regimes,
    bestTirRegime,
    lowestHypoRegime,
    lowestCvRegime,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns a human-readable outcome label for a regime.
 */
export function regimeOutcomeLabel(outcome: RegimeOutcome): string {
  if (outcome.count === 0) return "No data";
  if (outcome.tirPercent >= 70) return "Excellent control";
  if (outcome.tirPercent >= 50) return "Good control";
  if (outcome.tirPercent >= 30) return "Fair control";
  return "Needs improvement";
}

/**
 * Returns a colour class for a TIR percent value.
 */
export function regimeTirColour(tirPercent: number): string {
  if (tirPercent >= 70) return "text-emerald-600";
  if (tirPercent >= 50) return "text-amber-500";
  return "text-red-600";
}
