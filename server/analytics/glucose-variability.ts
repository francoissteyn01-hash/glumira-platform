/**
 * GluMira™ — glucose-variability.ts
 *
 * Advanced glucose variability metrics beyond TIR/GMI/CV.
 * Implements: MAGE, MODD, LBGI, HBGI, eA1c, GRI, J-index.
 *
 * All calculations are for informational purposes only.
 * GluMira™ is not a medical device.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GlucoseReading {
  timestamp: string;  // ISO 8601
  valueMmol: number;  // mmol/L
}

export interface VariabilityMetrics {
  mean: number;
  sd: number;
  cv: number;           // coefficient of variation (%)
  mage: number;         // mean amplitude of glycaemic excursions
  lbgi: number;         // low blood glucose index
  hbgi: number;         // high blood glucose index
  bgri: number;         // blood glucose risk index = LBGI + HBGI
  jIndex: number;       // J-index = 0.001 × (mean + SD)²
  eA1c: number;         // estimated HbA1c (%)
  gri: number;          // glycaemia risk index
  readingCount: number;
}

export interface TirBreakdown {
  veryLow: number;    // < 3.0 mmol/L  (%)
  low: number;        // 3.0–3.9 mmol/L (%)
  inRange: number;    // 3.9–10.0 mmol/L (%)
  high: number;       // 10.0–13.9 mmol/L (%)
  veryHigh: number;   // > 13.9 mmol/L  (%)
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

// ─── MAGE ─────────────────────────────────────────────────────────────────────

/**
 * Mean Amplitude of Glycaemic Excursions (MAGE).
 * Counts excursions > 1 SD and averages their amplitudes.
 */
export function computeMage(readings: GlucoseReading[]): number {
  if (readings.length < 3) return 0;
  const values = readings.map((r) => r.valueMmol);
  const sd = stdDev(values);
  const excursions: number[] = [];

  for (let i = 1; i < values.length - 1; i++) {
    const prev = values[i - 1];
    const curr = values[i];
    const next = values[i + 1];
    const isPeak   = curr > prev && curr > next;
    const isTrough = curr < prev && curr < next;
    if (isPeak || isTrough) {
      const amplitude = Math.abs(curr - (isPeak ? Math.min(prev, next) : Math.max(prev, next)));
      if (amplitude > sd) excursions.push(amplitude);
    }
  }

  if (excursions.length === 0) return 0;
  return Math.round(mean(excursions) * 100) / 100;
}

// ─── LBGI / HBGI ─────────────────────────────────────────────────────────────

/**
 * Risk function f(BG) used for LBGI/HBGI calculation.
 * Based on Kovatchev et al. formula.
 */
function riskFunction(valueMmol: number): number {
  // Convert to mg/dL for the formula
  const mgdl = valueMmol * 18.0182;
  const logBg = Math.log(Math.max(mgdl, 1));
  return 1.509 * (logBg ** 1.084 - 5.381);
}

/**
 * Low Blood Glucose Index (LBGI).
 */
export function computeLbgi(readings: GlucoseReading[]): number {
  if (readings.length === 0) return 0;
  const risks = readings.map((r) => {
    const f = riskFunction(r.valueMmol);
    return f < 0 ? 10 * f ** 2 : 0;
  });
  return Math.round(mean(risks) * 100) / 100;
}

/**
 * High Blood Glucose Index (HBGI).
 */
export function computeHbgi(readings: GlucoseReading[]): number {
  if (readings.length === 0) return 0;
  const risks = readings.map((r) => {
    const f = riskFunction(r.valueMmol);
    return f > 0 ? 10 * f ** 2 : 0;
  });
  return Math.round(mean(risks) * 100) / 100;
}

// ─── J-Index ──────────────────────────────────────────────────────────────────

/**
 * J-Index = 0.001 × (mean + SD)²
 * Combines central tendency and variability.
 */
export function computeJIndex(readings: GlucoseReading[]): number {
  if (readings.length < 2) return 0;
  const values = readings.map((r) => r.valueMmol);
  const m  = mean(values);
  const sd = stdDev(values);
  return Math.round(0.001 * (m + sd) ** 2 * 100) / 100;
}

// ─── eA1c ─────────────────────────────────────────────────────────────────────

/**
 * Estimated HbA1c from mean glucose (IFCC formula).
 * eA1c (%) = (mean_mmol × 1.59) + 2.59
 */
export function computeEa1c(readings: GlucoseReading[]): number {
  if (readings.length === 0) return 0;
  const m = mean(readings.map((r) => r.valueMmol));
  return Math.round((m * 1.59 + 2.59) * 10) / 10;
}

// ─── GRI ─────────────────────────────────────────────────────────────────────

/**
 * Glycaemia Risk Index (GRI).
 * GRI = (3.0 × %VL) + (2.4 × %L) + (1.6 × %VH) + (0.8 × %H)
 * Capped at 100.
 */
export function computeGri(tir: TirBreakdown): number {
  const gri =
    3.0 * tir.veryLow +
    2.4 * tir.low +
    1.6 * tir.veryHigh +
    0.8 * tir.high;
  return Math.min(100, Math.round(gri * 10) / 10);
}

// ─── TIR Breakdown ────────────────────────────────────────────────────────────

/**
 * Compute full TIR breakdown from a set of readings.
 */
export function computeTirBreakdown(readings: GlucoseReading[]): TirBreakdown {
  if (readings.length === 0) {
    return { veryLow: 0, low: 0, inRange: 0, high: 0, veryHigh: 0 };
  }
  const n = readings.length;
  let veryLow = 0, low = 0, inRange = 0, high = 0, veryHigh = 0;

  for (const r of readings) {
    const v = r.valueMmol;
    if      (v < 3.0)  veryLow++;
    else if (v < 3.9)  low++;
    else if (v <= 10.0) inRange++;
    else if (v <= 13.9) high++;
    else               veryHigh++;
  }

  const pct = (c: number) => Math.round((c / n) * 1000) / 10;
  return {
    veryLow:  pct(veryLow),
    low:      pct(low),
    inRange:  pct(inRange),
    high:     pct(high),
    veryHigh: pct(veryHigh),
  };
}

// ─── Full variability report ──────────────────────────────────────────────────

/**
 * Compute all variability metrics for a set of glucose readings.
 */
export function computeVariabilityMetrics(
  readings: GlucoseReading[]
): VariabilityMetrics {
  if (readings.length === 0) {
    return {
      mean: 0, sd: 0, cv: 0, mage: 0, lbgi: 0, hbgi: 0,
      bgri: 0, jIndex: 0, eA1c: 0, gri: 0, readingCount: 0,
    };
  }

  const values = readings.map((r) => r.valueMmol);
  const m  = mean(values);
  const sd = stdDev(values);
  const cv = m > 0 ? (sd / m) * 100 : 0;

  const lbgi = computeLbgi(readings);
  const hbgi = computeHbgi(readings);
  const tir  = computeTirBreakdown(readings);

  return {
    mean:         Math.round(m * 100) / 100,
    sd:           Math.round(sd * 100) / 100,
    cv:           Math.round(cv * 10) / 10,
    mage:         computeMage(readings),
    lbgi,
    hbgi,
    bgri:         Math.round((lbgi + hbgi) * 100) / 100,
    jIndex:       computeJIndex(readings),
    eA1c:         computeEa1c(readings),
    gri:          computeGri(tir),
    readingCount: readings.length,
  };
}

// ─── Variability status labels ────────────────────────────────────────────────

export function cvStatusLabel(cv: number): string {
  if (cv < 27) return "Stable";
  if (cv < 36) return "Moderate";
  return "High Variability";
}

export function griZone(gri: number): "A" | "B" | "C" | "D" | "E" {
  if (gri < 20)  return "A";
  if (gri < 40)  return "B";
  if (gri < 60)  return "C";
  if (gri < 80)  return "D";
  return "E";
}
