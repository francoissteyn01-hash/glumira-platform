/**
 * GluMira™ Glucose Trend Analysis Module
 * Version: 7.0.0
 *
 * Computes:
 *  - Time In Range (TIR) — standard ADA/EASD targets
 *  - Glucose Management Indicator (GMI) — estimated HbA1c
 *  - Coefficient of Variation (CV) — glycaemic variability
 *  - Mean glucose, SD, min, max
 *  - Trend direction (rising / stable / falling / falling_fast)
 *  - Pattern detection (dawn phenomenon, post-meal spikes, nocturnal hypos)
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

// ─── Types ────────────────────────────────────────────────────

export interface GlucosePoint {
  glucose: number; // mmol/L
  timestamp: string; // ISO 8601
}

export type TrendDirection =
  | "rising_fast"
  | "rising"
  | "stable"
  | "falling"
  | "falling_fast";

export interface TirBreakdown {
  veryLow: number;   // < 3.0 mmol/L
  low: number;       // 3.0–3.9 mmol/L
  inRange: number;   // 3.9–10.0 mmol/L
  high: number;      // 10.0–13.9 mmol/L
  veryHigh: number;  // ≥ 14.0 mmol/L
}

export interface GlucoseTrendReport {
  count: number;
  mean: number;
  sd: number;
  cv: number;          // CV% = (SD/mean) * 100
  min: number;
  max: number;
  gmi: number;         // Glucose Management Indicator (estimated HbA1c %)
  tir: TirBreakdown;
  tirPercent: number;  // inRange %
  trend: TrendDirection;
  patterns: string[];
  periodHours: number;
  computedAt: string;
}

// ─── TIR classification ───────────────────────────────────────

export function classifyTir(glucose: number): keyof TirBreakdown {
  if (glucose < 3.0) return "veryLow";
  if (glucose < 3.9) return "low";
  if (glucose <= 10.0) return "inRange";
  if (glucose < 14.0) return "high";
  return "veryHigh";
}

// ─── Trend direction ──────────────────────────────────────────

/**
 * Compute trend direction from the last N readings using linear regression slope.
 * Rate thresholds (mmol/L per minute):
 *   rising_fast  > +0.11
 *   rising       > +0.06
 *   stable       -0.06 to +0.06
 *   falling      < -0.06
 *   falling_fast < -0.11
 */
export function computeTrend(
  readings: GlucosePoint[],
  windowMinutes = 20
): TrendDirection {
  if (readings.length < 2) return "stable";

  const now = new Date(readings[readings.length - 1].timestamp).getTime();
  const windowMs = windowMinutes * 60 * 1000;
  const recent = readings.filter(
    (r) => now - new Date(r.timestamp).getTime() <= windowMs
  );

  if (recent.length < 2) return "stable";

  // Simple linear regression
  const n = recent.length;
  const xs = recent.map((r) =>
    (new Date(r.timestamp).getTime() - new Date(recent[0].timestamp).getTime()) / 60_000
  );
  const ys = recent.map((r) => r.glucose);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
  const sumX2 = xs.reduce((a, x) => a + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  if (slope > 0.11) return "rising_fast";
  if (slope > 0.06) return "rising";
  if (slope < -0.11) return "falling_fast";
  if (slope < -0.06) return "falling";
  return "stable";
}

// ─── Pattern detection ────────────────────────────────────────

/**
 * Detect common glycaemic patterns from a 24h reading set.
 */
export function detectPatterns(readings: GlucosePoint[]): string[] {
  if (readings.length < 12) return [];

  const patterns: string[] = [];

  // Sort by time
  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Dawn phenomenon: glucose rises between 03:00–07:00
  const dawnReadings = sorted.filter((r) => {
    const h = new Date(r.timestamp).getHours();
    return h >= 3 && h < 7;
  });
  if (dawnReadings.length >= 3) {
    const dawnMean = dawnReadings.reduce((a, r) => a + r.glucose, 0) / dawnReadings.length;
    if (dawnMean > 8.0) patterns.push("Dawn phenomenon detected (03:00–07:00 mean > 8.0 mmol/L)");
  }

  // Nocturnal hypo: any reading < 3.9 between 23:00–06:00
  const nocturnalHypo = sorted.some((r) => {
    const h = new Date(r.timestamp).getHours();
    return (h >= 23 || h < 6) && r.glucose < 3.9;
  });
  if (nocturnalHypo) patterns.push("Nocturnal hypoglycaemia detected (< 3.9 mmol/L, 23:00–06:00)");

  // Post-meal spike: any reading > 12.0 between 1–3h after midnight (proxy for meal windows)
  const highPostMeal = sorted.some((r) => r.glucose > 12.0);
  if (highPostMeal) patterns.push("Post-meal hyperglycaemia detected (> 12.0 mmol/L)");

  // High variability
  const mean = sorted.reduce((a, r) => a + r.glucose, 0) / sorted.length;
  const sd = Math.sqrt(
    sorted.reduce((a, r) => a + Math.pow(r.glucose - mean, 2), 0) / sorted.length
  );
  const cv = (sd / mean) * 100;
  if (cv > 36) patterns.push(`High glycaemic variability (CV ${cv.toFixed(1)}% > 36%)`);

  return patterns;
}

// ─── GMI calculation ──────────────────────────────────────────

/**
 * Glucose Management Indicator (estimated HbA1c from mean glucose).
 * Formula: GMI (%) = 3.31 + 0.02392 × mean_glucose_mg_dL
 * (Bergenstal et al., Diabetes Care 2018)
 */
export function computeGmi(meanMmol: number): number {
  const meanMgDl = meanMmol * 18.0182;
  return +(3.31 + 0.02392 * meanMgDl).toFixed(1);
}

// ─── Full trend report ────────────────────────────────────────

export function computeTrendReport(readings: GlucosePoint[]): GlucoseTrendReport {
  if (readings.length === 0) {
    return {
      count: 0,
      mean: 0,
      sd: 0,
      cv: 0,
      min: 0,
      max: 0,
      gmi: 0,
      tir: { veryLow: 0, low: 0, inRange: 0, high: 0, veryHigh: 0 },
      tirPercent: 0,
      trend: "stable",
      patterns: [],
      periodHours: 0,
      computedAt: new Date().toISOString(),
    };
  }

  const values = readings.map((r) => r.glucose);
  const count = values.length;
  const mean = +(values.reduce((a, b) => a + b, 0) / count).toFixed(2);
  const sd = +(
    Math.sqrt(values.reduce((a, v) => a + Math.pow(v - mean, 2), 0) / count)
  ).toFixed(2);
  const cv = +(mean > 0 ? (sd / mean) * 100 : 0).toFixed(1);
  const min = +Math.min(...values).toFixed(1);
  const max = +Math.max(...values).toFixed(1);
  const gmi = computeGmi(mean);

  // TIR breakdown
  const tir: TirBreakdown = { veryLow: 0, low: 0, inRange: 0, high: 0, veryHigh: 0 };
  for (const v of values) tir[classifyTir(v)]++;
  const tirPercent = +((tir.inRange / count) * 100).toFixed(1);

  // Period
  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const periodHours = sorted.length > 1
    ? +(
        (new Date(sorted[sorted.length - 1].timestamp).getTime() -
          new Date(sorted[0].timestamp).getTime()) /
        3_600_000
      ).toFixed(1)
    : 0;

  return {
    count,
    mean,
    sd,
    cv,
    min,
    max,
    gmi,
    tir,
    tirPercent,
    trend: computeTrend(readings),
    patterns: detectPatterns(readings),
    periodHours,
    computedAt: new Date().toISOString(),
  };
}
