/**
 * GluMira — A1c Estimator Module
 *
 * Estimates HbA1c from glucose readings using multiple methods:
 * - ADAG (Nathan et al. 2008)
 * - eA1c (estimated A1c from mean glucose)
 * - Projected A1c with confidence intervals
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GlucoseReading {
  mmol: number;
  timestamp: string;
}

export interface A1cEstimate {
  eA1cPercent: number;
  eA1cMmolMol: number;
  meanGlucoseMmol: number;
  meanGlucoseMgdl: number;
  method: "ADAG" | "DCCT";
  readingCount: number;
  daysCovered: number;
  confidence: "low" | "moderate" | "high";
}

export interface A1cProjection {
  current: A1cEstimate;
  projected30d: number;
  projected90d: number;
  trend: "improving" | "stable" | "worsening";
  trendLabel: string;
}

export type A1cCategory = "normal" | "pre-diabetes" | "diabetes" | "well-controlled" | "above-target";

// ─── Conversion helpers ───────────────────────────────────────────────────────

export function mmolToMgdl(mmol: number): number {
  return Math.round(mmol * 18.0182 * 10) / 10;
}

export function mgdlToMmol(mgdl: number): number {
  return Math.round((mgdl / 18.0182) * 10) / 10;
}

// ─── ADAG formula: eA1c = (meanMgdl + 46.7) / 28.7 ──────────────────────────

export function estimateA1cFromMean(meanMmol: number): number {
  const meanMgdl = mmolToMgdl(meanMmol);
  const eA1c = (meanMgdl + 46.7) / 28.7;
  return Math.round(eA1c * 10) / 10;
}

// ─── IFCC conversion: mmol/mol = (A1c% - 2.15) * 10.929 ─────────────────────

export function a1cPercentToMmolMol(percent: number): number {
  return Math.round((percent - 2.15) * 10.929 * 10) / 10;
}

export function a1cMmolMolToPercent(mmolMol: number): number {
  return Math.round((mmolMol / 10.929 + 2.15) * 10) / 10;
}

// ─── Categorise A1c ──────────────────────────────────────────────────────────

export function categoriseA1c(a1cPercent: number): A1cCategory {
  if (a1cPercent < 5.7) return "normal";
  if (a1cPercent < 6.5) return "pre-diabetes";
  if (a1cPercent < 7.0) return "well-controlled";
  if (a1cPercent < 8.0) return "above-target";
  return "diabetes";
}

export function a1cCategoryLabel(cat: A1cCategory): string {
  const labels: Record<A1cCategory, string> = {
    normal: "Normal range",
    "pre-diabetes": "Pre-diabetes range",
    "well-controlled": "Well-controlled diabetes",
    "above-target": "Above target",
    diabetes: "Diabetes range",
  };
  return labels[cat];
}

export function a1cCategoryColour(cat: A1cCategory): string {
  const colours: Record<A1cCategory, string> = {
    normal: "green",
    "pre-diabetes": "amber",
    "well-controlled": "blue",
    "above-target": "orange",
    diabetes: "red",
  };
  return colours[cat];
}

// ─── Confidence based on reading count and days ──────────────────────────────

export function estimateConfidence(readingCount: number, daysCovered: number): "low" | "moderate" | "high" {
  if (readingCount >= 200 && daysCovered >= 14) return "high";
  if (readingCount >= 50 && daysCovered >= 7) return "moderate";
  return "low";
}

// ─── Main estimate function ──────────────────────────────────────────────────

export function estimateA1c(readings: GlucoseReading[]): A1cEstimate {
  if (readings.length === 0) {
    return {
      eA1cPercent: 0,
      eA1cMmolMol: 0,
      meanGlucoseMmol: 0,
      meanGlucoseMgdl: 0,
      method: "ADAG",
      readingCount: 0,
      daysCovered: 0,
      confidence: "low",
    };
  }

  const sum = readings.reduce((s, r) => s + r.mmol, 0);
  const meanMmol = Math.round((sum / readings.length) * 10) / 10;
  const meanMgdl = mmolToMgdl(meanMmol);
  const eA1c = estimateA1cFromMean(meanMmol);
  const eA1cMmolMol = a1cPercentToMmolMol(eA1c);

  const timestamps = readings.map((r) => new Date(r.timestamp).getTime());
  const minTs = Math.min(...timestamps);
  const maxTs = Math.max(...timestamps);
  const daysCovered = Math.max(1, Math.round((maxTs - minTs) / 86400000));

  return {
    eA1cPercent: eA1c,
    eA1cMmolMol,
    meanGlucoseMmol: meanMmol,
    meanGlucoseMgdl: meanMgdl,
    method: "ADAG",
    readingCount: readings.length,
    daysCovered,
    confidence: estimateConfidence(readings.length, daysCovered),
  };
}

// ─── Projection ──────────────────────────────────────────────────────────────

export function projectA1c(
  recentReadings: GlucoseReading[],
  olderReadings: GlucoseReading[]
): A1cProjection {
  const current = estimateA1c(recentReadings);
  const older = estimateA1c(olderReadings);

  const diff = current.eA1cPercent - older.eA1cPercent;
  let trend: "improving" | "stable" | "worsening";
  let trendLabel: string;

  if (diff < -0.2) {
    trend = "improving";
    trendLabel = `Improving by ${Math.abs(diff).toFixed(1)}%`;
  } else if (diff > 0.2) {
    trend = "worsening";
    trendLabel = `Worsening by ${diff.toFixed(1)}%`;
  } else {
    trend = "stable";
    trendLabel = "Stable";
  }

  // Simple linear projection
  const projected30d = Math.round((current.eA1cPercent + diff * 0.5) * 10) / 10;
  const projected90d = Math.round((current.eA1cPercent + diff * 1.5) * 10) / 10;

  return {
    current,
    projected30d: Math.max(4.0, projected30d),
    projected90d: Math.max(4.0, projected90d),
    trend,
    trendLabel,
  };
}
