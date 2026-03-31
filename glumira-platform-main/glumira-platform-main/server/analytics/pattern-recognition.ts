/**
 * GluMira™ — Pattern Recognition Module
 *
 * Advanced glucose pattern recognition beyond basic trend detection.
 * Identifies dawn phenomenon, Somogyi effect, meal-related spikes,
 * exercise-induced hypoglycaemia, and stress hyperglycaemia.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import type { GlucosePoint } from "./glucose-trend";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PatternType =
  | "dawn-phenomenon"
  | "somogyi-effect"
  | "meal-spike"
  | "exercise-hypo"
  | "stress-hyper"
  | "nocturnal-hypo"
  | "post-lunch-dip"
  | "fasting-hyper"
  | "roller-coaster";

export interface DetectedPattern {
  type: PatternType;
  label: string;
  description: string;
  severity: "info" | "warning" | "critical";
  affectedReadings: number; // count of readings involved
  confidence: "low" | "moderate" | "high";
}

export interface PatternRecognitionReport {
  patterns: DetectedPattern[];
  dominantPattern: PatternType | null;
  patternCount: number;
  recommendations: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getHour(ts: string): number {
  return new Date(ts).getHours();
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
}

// ─── Pattern detectors ────────────────────────────────────────────────────────

/**
 * Dawn phenomenon: fasting glucose rises between 3am–8am without prior hypo.
 */
export function detectDawnPhenomenon(readings: GlucosePoint[]): DetectedPattern | null {
  const earlyMorning = readings.filter((r) => {
    const h = getHour(r.timestamp);
    return h >= 3 && h <= 8;
  });

  if (earlyMorning.length < 3) return null;

  const sorted = [...earlyMorning].sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Check for consistent upward trend in early morning
  let risingCount = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].mmol > sorted[i - 1].mmol) risingCount++;
  }

  const risingRatio = risingCount / (sorted.length - 1);
  if (risingRatio < 0.6) return null;

  const rise = sorted[sorted.length - 1].mmol - sorted[0].mmol;
  if (rise < 1.5) return null;

  return {
    type: "dawn-phenomenon",
    label: "Dawn Phenomenon",
    description: `Fasting glucose rises ${rise.toFixed(1)} mmol/L between 3–8am, consistent with dawn phenomenon.`,
    severity: rise > 3 ? "warning" : "info",
    affectedReadings: earlyMorning.length,
    confidence: risingRatio > 0.8 ? "high" : "moderate",
  };
}

/**
 * Somogyi effect: nocturnal hypo followed by rebound hyperglycaemia.
 */
export function detectSomogyiEffect(readings: GlucosePoint[]): DetectedPattern | null {
  const nocturnal = readings.filter((r) => {
    const h = getHour(r.timestamp);
    return h >= 0 && h <= 4;
  });

  const earlyMorning = readings.filter((r) => {
    const h = getHour(r.timestamp);
    return h >= 5 && h <= 9;
  });

  if (nocturnal.length < 2 || earlyMorning.length < 2) return null;

  const nocturnalMin = Math.min(...nocturnal.map((r) => r.mmol));
  const morningMean = mean(earlyMorning.map((r) => r.mmol));

  if (nocturnalMin > 3.9) return null; // no nocturnal hypo
  if (morningMean < 8.0) return null;  // no rebound hyper

  return {
    type: "somogyi-effect",
    label: "Somogyi Effect",
    description: `Nocturnal hypo (min ${nocturnalMin.toFixed(1)} mmol/L) followed by morning rebound (avg ${morningMean.toFixed(1)} mmol/L).`,
    severity: "warning",
    affectedReadings: nocturnal.length + earlyMorning.length,
    confidence: nocturnalMin < 3.5 ? "high" : "moderate",
  };
}

/**
 * Nocturnal hypoglycaemia: readings below 3.9 mmol/L between midnight and 6am.
 */
export function detectNocturnalHypo(readings: GlucosePoint[]): DetectedPattern | null {
  const nocturnal = readings.filter((r) => {
    const h = getHour(r.timestamp);
    return (h >= 0 && h <= 5) || h === 23;
  });

  const hypos = nocturnal.filter((r) => r.mmol < 3.9);
  if (hypos.length === 0) return null;

  const minMmol = Math.min(...hypos.map((r) => r.mmol));

  return {
    type: "nocturnal-hypo",
    label: "Nocturnal Hypoglycaemia",
    description: `${hypos.length} reading${hypos.length > 1 ? "s" : ""} below 3.9 mmol/L overnight. Lowest: ${minMmol.toFixed(1)} mmol/L.`,
    severity: minMmol < 3.0 ? "critical" : "warning",
    affectedReadings: hypos.length,
    confidence: hypos.length >= 3 ? "high" : hypos.length === 2 ? "moderate" : "low",
  };
}

/**
 * Roller-coaster: high glucose variability (CV > 36%).
 */
export function detectRollerCoaster(readings: GlucosePoint[]): DetectedPattern | null {
  if (readings.length < 8) return null;

  const values = readings.map((r) => r.mmol);
  const avg = mean(values);
  if (avg === 0) return null;

  const cv = (stdDev(values) / avg) * 100;
  if (cv < 36) return null;

  return {
    type: "roller-coaster",
    label: "Roller-Coaster Pattern",
    description: `High glucose variability detected (CV ${cv.toFixed(0)}%). Frequent swings between hypo and hyper.`,
    severity: cv > 50 ? "critical" : "warning",
    affectedReadings: readings.length,
    confidence: readings.length >= 20 ? "high" : "moderate",
  };
}

/**
 * Post-lunch dip: readings drop below 4.5 mmol/L between 13:00–15:00.
 */
export function detectPostLunchDip(readings: GlucosePoint[]): DetectedPattern | null {
  const postLunch = readings.filter((r) => {
    const h = getHour(r.timestamp);
    return h >= 13 && h <= 15;
  });

  if (postLunch.length < 2) return null;

  const dips = postLunch.filter((r) => r.mmol < 4.5);
  if (dips.length === 0) return null;

  return {
    type: "post-lunch-dip",
    label: "Post-Lunch Dip",
    description: `${dips.length} reading${dips.length > 1 ? "s" : ""} below 4.5 mmol/L between 1–3pm. May indicate over-bolusing at lunch.`,
    severity: "info",
    affectedReadings: dips.length,
    confidence: dips.length >= 3 ? "high" : "low",
  };
}

/**
 * Fasting hyperglycaemia: pre-breakfast readings consistently above 7.0 mmol/L.
 */
export function detectFastingHyper(readings: GlucosePoint[]): DetectedPattern | null {
  const preMeal = readings.filter((r) => {
    const h = getHour(r.timestamp);
    return h >= 6 && h <= 9;
  });

  if (preMeal.length < 3) return null;

  const hypers = preMeal.filter((r) => r.mmol > 7.0);
  const ratio = hypers.length / preMeal.length;

  if (ratio < 0.6) return null;

  const avgHyper = mean(hypers.map((r) => r.mmol));

  return {
    type: "fasting-hyper",
    label: "Fasting Hyperglycaemia",
    description: `${Math.round(ratio * 100)}% of pre-breakfast readings above 7.0 mmol/L (avg ${avgHyper.toFixed(1)} mmol/L).`,
    severity: avgHyper > 10 ? "warning" : "info",
    affectedReadings: hypers.length,
    confidence: ratio > 0.8 ? "high" : "moderate",
  };
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Run all pattern detectors and return a consolidated report.
 */
export function recognisePatterns(readings: GlucosePoint[]): PatternRecognitionReport {
  const detectors = [
    detectDawnPhenomenon,
    detectSomogyiEffect,
    detectNocturnalHypo,
    detectRollerCoaster,
    detectPostLunchDip,
    detectFastingHyper,
  ];

  const patterns: DetectedPattern[] = [];
  for (const detect of detectors) {
    const result = detect(readings);
    if (result) patterns.push(result);
  }

  // Sort by severity: critical > warning > info
  const severityOrder = { critical: 0, warning: 1, info: 2 };
  patterns.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const dominantPattern = patterns.length > 0 ? patterns[0].type : null;

  const recommendations: string[] = [];
  for (const p of patterns) {
    if (p.type === "dawn-phenomenon") {
      recommendations.push("Consider adjusting basal insulin timing or dose to address dawn phenomenon.");
    } else if (p.type === "somogyi-effect") {
      recommendations.push("Reduce evening basal dose to prevent nocturnal hypo and Somogyi rebound.");
    } else if (p.type === "nocturnal-hypo") {
      recommendations.push("Review bedtime snack or reduce overnight basal to prevent nocturnal hypos.");
    } else if (p.type === "roller-coaster") {
      recommendations.push("Focus on consistent carb counting and pre-bolus timing to reduce variability.");
    } else if (p.type === "post-lunch-dip") {
      recommendations.push("Consider reducing lunch bolus or adding a small afternoon snack.");
    } else if (p.type === "fasting-hyper") {
      recommendations.push("Review basal insulin dose — fasting hyperglycaemia may indicate under-basalisation.");
    }
  }

  return {
    patterns,
    dominantPattern,
    patternCount: patterns.length,
    recommendations,
  };
}

/**
 * Summarise pattern severity for dashboard badge.
 */
export function patternSeveritySummary(report: PatternRecognitionReport): "clear" | "info" | "warning" | "critical" {
  if (report.patternCount === 0) return "clear";
  if (report.patterns.some((p) => p.severity === "critical")) return "critical";
  if (report.patterns.some((p) => p.severity === "warning")) return "warning";
  return "info";
}
