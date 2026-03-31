/**
 * GluMira™ V7 — server/analytics/glucose-trend.ts
 *
 * Core glucose trend analytics module.
 * API contract derived from: 04.1.20_glucose-trend-extended.test_v1.0.ts
 * Used by: 04.1.43_api-glucose-trend-route (Express conversion)
 *          04.2.85_AnalyticsSummaryCard (via analytics-summary.ts)
 *          glucose-export.ts (GlucosePoint type)
 *
 * All functions are pure — no side effects, no DB calls.
 * GluMira™ is an educational platform, not a medical device.
 * Version: v1.0 · 2026-03-29
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GlucosePoint {
  glucose:   number;   // mmol/L
  timestamp: string;   // ISO datetime
}

export type TirCategory = "veryLow" | "low" | "inRange" | "high" | "veryHigh";
export type TrendDirection = "stable" | "rising" | "rising_fast" | "falling" | "falling_fast";

export interface TrendReport {
  count:       number;
  mean:        number;    // mmol/L, 1 decimal
  min:         number;
  max:         number;
  sd:          number;
  cv:          number;    // coefficient of variation %
  gmi:         number;    // Glucose Management Indicator %
  tirPercent:  number;    // % in range 3.9–10.0
  belowPercent: number;
  abovePercent: number;
  trend:       TrendDirection;
  patterns:    string[];
  periodHours: number;    // time span of readings in hours
  computedAt:  string;    // ISO datetime
}

// ─── TIR classification ───────────────────────────────────────────────────────
// Boundaries from NICE NG17 / ADA Standards
// < 3.0      → veryLow
// 3.0–3.89   → low
// 3.9–10.0   → inRange
// 10.1–13.9  → high
// ≥ 14.0     → veryHigh

export function classifyTir(mmol: number): TirCategory {
  if (mmol < 3.0)  return "veryLow";
  if (mmol < 3.9)  return "low";
  if (mmol <= 10.0) return "inRange";
  if (mmol <= 13.9) return "high";
  return "veryHigh";
}

// ─── GMI ─────────────────────────────────────────────────────────────────────
// Glucose Management Indicator: 3.31 + (0.02392 × mean_glucose_mgdl)
// Returns 1 decimal place.

export function computeGmi(meanMmol: number): number {
  const meanMgdl = meanMmol * 18.0182;
  const gmi = 3.31 + 0.02392 * meanMgdl;
  return Math.round(gmi * 10) / 10;
}

// ─── Trend direction ──────────────────────────────────────────────────────────
// Uses linear regression on last 5 readings (or all if fewer).
// Rate thresholds (per minute):
//   |slope| < 0.056  → stable     (~3.3 mmol/hr)
//   |slope| < 0.111  → rising/falling
//   |slope| ≥ 0.111  → rising_fast/falling_fast

const RISING_FAST_THRESHOLD  = 0.111;  // mmol/L per minute
const STABLE_THRESHOLD       = 0.056;

export function computeTrend(readings: GlucosePoint[]): TrendDirection {
  if (readings.length < 2) return "stable";

  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const recent = sorted.slice(-5);
  const n = recent.length;

  const times  = recent.map(r => new Date(r.timestamp).getTime() / 60000); // minutes
  const values = recent.map(r => r.glucose);

  const meanT = times.reduce((s, t) => s + t, 0) / n;
  const meanV = values.reduce((s, v) => s + v, 0) / n;

  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (times[i] - meanT) * (values[i] - meanV);
    den += (times[i] - meanT) ** 2;
  }

  if (den === 0) return "stable";
  const slope = num / den; // mmol/L per minute

  if (Math.abs(slope) < STABLE_THRESHOLD)  return "stable";
  if (slope >= RISING_FAST_THRESHOLD)       return "rising_fast";
  if (slope > 0)                            return "rising";
  if (slope <= -RISING_FAST_THRESHOLD)      return "falling_fast";
  return "falling";
}

// ─── Pattern detection ────────────────────────────────────────────────────────
// Returns human-readable pattern strings for the UI.
// Requires ≥ 12 readings to be meaningful.

export function detectPatterns(readings: GlucosePoint[]): string[] {
  if (readings.length < 12) return [];

  const patterns: string[] = [];
  const values = readings.map(r => r.glucose);

  // ── Coefficient of Variation > 36% → high variability
  const mean_ = values.reduce((s, v) => s + v, 0) / values.length;
  const sd    = Math.sqrt(values.reduce((s, v) => s + (v - mean_) ** 2, 0) / values.length);
  const cv    = mean_ > 0 ? (sd / mean_) * 100 : 0;
  if (cv > 36) {
    patterns.push(`High glucose variability detected (CV ${cv.toFixed(0)}%)`);
  }

  // ── Nocturnal hypoglycaemia: readings between 23:00–06:00 below 3.9
  const noctHypo = readings.filter(r => {
    const h = new Date(r.timestamp).getHours();
    return (h >= 23 || h < 6) && r.glucose < 3.9;
  });
  if (noctHypo.length > 0) {
    patterns.push(`Nocturnal hypoglycaemia (${noctHypo.length} reading${noctHypo.length > 1 ? "s" : ""} below 3.9 mmol/L between 23:00–06:00)`);
  }

  // ── Post-meal hyperglycaemia: any reading > 12.0
  const postMealHyper = readings.filter(r => r.glucose > 12.0);
  if (postMealHyper.length > 0) {
    patterns.push(`Post-meal hyperglycaemia (${postMealHyper.length} reading${postMealHyper.length > 1 ? "s" : ""} above 12.0 mmol/L)`);
  }

  // ── Dawn phenomenon: readings 03:00–08:00 mean > 8.5
  const dawn     = readings.filter(r => { const h = new Date(r.timestamp).getHours(); return h >= 3 && h < 8; });
  const dawnMean = dawn.length ? dawn.reduce((s, r) => s + r.glucose, 0) / dawn.length : 0;
  if (dawn.length >= 3 && dawnMean > 8.5) {
    patterns.push(`Dawn phenomenon detected (mean ${dawnMean.toFixed(1)} mmol/L between 03:00–08:00)`);
  }

  return patterns;
}

// ─── Full trend report ────────────────────────────────────────────────────────

export function computeTrendReport(readings: GlucosePoint[]): TrendReport {
  const computedAt = new Date().toISOString();

  if (readings.length === 0) {
    return { count:0, mean:0, min:0, max:0, sd:0, cv:0, gmi:0, tirPercent:0, belowPercent:0, abovePercent:0, trend:"stable", patterns:[], periodHours:0, computedAt };
  }

  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const values = sorted.map(r => r.glucose);
  const n      = values.length;

  const mean_  = values.reduce((s, v) => s + v, 0) / n;
  const sd     = n < 2 ? 0 : Math.sqrt(values.reduce((s, v) => s + (v - mean_) ** 2, 0) / n);
  const cv     = mean_ > 0 ? (sd / mean_) * 100 : 0;

  const inRange = values.filter(v => v >= 3.9 && v <= 10.0).length;
  const below   = values.filter(v => v < 3.9).length;
  const above   = values.filter(v => v > 10.0).length;

  const firstMs  = new Date(sorted[0].timestamp).getTime();
  const lastMs   = new Date(sorted[n - 1].timestamp).getTime();
  const periodHours = n < 2 ? 0 : Math.round(((lastMs - firstMs) / 3600000) * 10) / 10;

  const r2 = (x: number) => Math.round(x * 100) / 100;

  return {
    count:        n,
    mean:         r2(mean_),
    min:          r2(Math.min(...values)),
    max:          r2(Math.max(...values)),
    sd:           r2(sd),
    cv:           r2(cv),
    gmi:          computeGmi(mean_),
    tirPercent:   r2((inRange / n) * 100),
    belowPercent: r2((below  / n) * 100),
    abovePercent: r2((above  / n) * 100),
    trend:        computeTrend(sorted),
    patterns:     detectPatterns(sorted),
    periodHours,
    computedAt,
  };
}
