/**
 * GluMira™ — analytics-summary.ts
 *
 * Aggregates multi-period glucose analytics for the patient dashboard.
 * Computes 7-day and 14-day TIR, GMI, CV, and trend comparison.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { computeTrendReport } from "./glucose-trend";
import type { GlucosePoint } from "./glucose-trend";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PeriodSummary {
  days: number;
  count: number;
  mean: number;
  gmi: number;
  tirPercent: number;
  cv: number;
  min: number;
  max: number;
  trend: string;
  patterns: string[];
  periodHours: number;
  computedAt: string;
}

export interface AnalyticsSummary {
  sevenDay: PeriodSummary;
  fourteenDay: PeriodSummary;
  /** Positive = TIR improved over 14d vs 7d, negative = worsened */
  tirDelta: number;
  /** Positive = GMI improved (lower), negative = worsened (higher) */
  gmiDelta: number;
  generatedAt: string;
}

// ─── Core function ────────────────────────────────────────────────────────────

/**
 * Compute a multi-period analytics summary from a set of glucose readings.
 * The readings array should cover at least 14 days for meaningful comparison.
 */
export function computeAnalyticsSummary(
  readings: GlucosePoint[]
): AnalyticsSummary {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;

  const sevenDayReadings = readings.filter(
    (r) => new Date(r.timestamp).getTime() >= sevenDaysAgo
  );
  const fourteenDayReadings = readings.filter(
    (r) => new Date(r.timestamp).getTime() >= fourteenDaysAgo
  );

  const sevenDayReport = computeTrendReport(sevenDayReadings);
  const fourteenDayReport = computeTrendReport(fourteenDayReadings);

  const sevenDay: PeriodSummary = { days: 7, ...sevenDayReport };
  const fourteenDay: PeriodSummary = { days: 14, ...fourteenDayReport };

  // Delta: positive means improvement
  const tirDelta = parseFloat(
    (sevenDay.tirPercent - fourteenDay.tirPercent).toFixed(1)
  );
  // GMI: lower is better, so delta is inverted
  const gmiDelta = parseFloat(
    (fourteenDay.gmi - sevenDay.gmi).toFixed(2)
  );

  return {
    sevenDay,
    fourteenDay,
    tirDelta,
    gmiDelta,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns a human-readable TIR status label.
 */
export function tirStatusLabel(tirPercent: number): string {
  if (tirPercent >= 70) return "Target met";
  if (tirPercent >= 50) return "Approaching target";
  return "Below target";
}

/**
 * Returns a human-readable GMI category.
 */
export function gmiCategory(gmi: number): string {
  if (gmi < 5.7) return "Normal";
  if (gmi < 6.5) return "Pre-diabetes range";
  return "Diabetes range";
}

/**
 * Colour class for TIR percent display.
 */
export function tirColour(tirPercent: number): string {
  if (tirPercent >= 70) return "text-emerald-600";
  if (tirPercent >= 50) return "text-amber-500";
  return "text-red-600";
}
