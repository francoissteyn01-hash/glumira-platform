/**
 * GluMira™ — patient-progress-report.ts
 *
 * Generates a structured patient progress report for clinician review.
 * Combines TIR, GMI, CV, dose totals, and pattern detection into a
 * single summary object suitable for PDF export or dashboard display.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import type { GlucosePoint } from "./glucose-trend";
import { computeTrend } from "./glucose-trend";
import type { DoseRecord } from "../doses/dose-log";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReportPeriod = "7d" | "14d" | "30d" | "90d";

export interface ProgressReportInput {
  patientId: string;
  patientName: string;
  clinicianName: string;
  period: ReportPeriod;
  readings: GlucosePoint[];
  doses: DoseRecord[];
  generatedAt?: string;
}

export interface DoseSummary {
  totalDoses: number;
  totalUnits: number;
  bolusUnits: number;
  basalUnits: number;
  correctionUnits: number;
  avgDailyUnits: number;
  avgDailyDoses: number;
}

export interface GlucoseSummary {
  readingCount: number;
  avgGlucose: number;
  minGlucose: number;
  maxGlucose: number;
  tirPercent: number;
  timeBelow: number;
  timeAbove: number;
  gmi: number;
  cv: number;
  stdDev: number;
}

export interface PatientProgressReport {
  patientId: string;
  patientName: string;
  clinicianName: string;
  period: ReportPeriod;
  periodDays: number;
  generatedAt: string;
  glucose: GlucoseSummary;
  doses: DoseSummary;
  patterns: string[];
  overallStatus: "excellent" | "good" | "fair" | "poor";
  statusRationale: string;
  disclaimer: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PERIOD_DAYS: Record<ReportPeriod, number> = {
  "7d":  7,
  "14d": 14,
  "30d": 30,
  "90d": 90,
};

/**
 * Classify overall glycaemic status from TIR and GMI.
 */
export function classifyStatus(
  tirPercent: number,
  gmi: number
): { status: PatientProgressReport["overallStatus"]; rationale: string } {
  if (tirPercent >= 70 && gmi < 7.0) {
    return {
      status: "excellent",
      rationale: `TIR ${tirPercent.toFixed(0)}% meets target (≥70%) and GMI ${gmi.toFixed(1)}% is within optimal range.`,
    };
  }
  if (tirPercent >= 60 && gmi < 8.0) {
    return {
      status: "good",
      rationale: `TIR ${tirPercent.toFixed(0)}% is approaching target and GMI ${gmi.toFixed(1)}% is acceptable.`,
    };
  }
  if (tirPercent >= 50) {
    return {
      status: "fair",
      rationale: `TIR ${tirPercent.toFixed(0)}% is below the 70% target. Review meal timing and correction doses.`,
    };
  }
  return {
    status: "poor",
    rationale: `TIR ${tirPercent.toFixed(0)}% requires urgent review. GMI ${gmi.toFixed(1)}% indicates elevated average glucose.`,
  };
}

/**
 * Compute dose summary from an array of dose records.
 */
export function computeDoseSummary(
  doses: DoseRecord[],
  periodDays: number
): DoseSummary {
  if (doses.length === 0) {
    return {
      totalDoses: 0,
      totalUnits: 0,
      bolusUnits: 0,
      basalUnits: 0,
      correctionUnits: 0,
      avgDailyUnits: 0,
      avgDailyDoses: 0,
    };
  }

  let bolusUnits = 0;
  let basalUnits = 0;
  let correctionUnits = 0;

  for (const d of doses) {
    const units = d.units ?? 0;
    const type = (d.doseType ?? "").toLowerCase();
    if (type === "basal") {
      basalUnits += units;
    } else if (type === "correction") {
      correctionUnits += units;
    } else {
      bolusUnits += units;
    }
  }

  const totalUnits = bolusUnits + basalUnits + correctionUnits;
  const days = Math.max(periodDays, 1);

  return {
    totalDoses: doses.length,
    totalUnits: Math.round(totalUnits * 10) / 10,
    bolusUnits: Math.round(bolusUnits * 10) / 10,
    basalUnits: Math.round(basalUnits * 10) / 10,
    correctionUnits: Math.round(correctionUnits * 10) / 10,
    avgDailyUnits: Math.round((totalUnits / days) * 10) / 10,
    avgDailyDoses: Math.round((doses.length / days) * 10) / 10,
  };
}

/**
 * Compute glucose summary from an array of readings.
 */
export function computeGlucoseSummary(readings: GlucosePoint[]): GlucoseSummary {
  if (readings.length === 0) {
    return {
      readingCount: 0,
      avgGlucose: 0,
      minGlucose: 0,
      maxGlucose: 0,
      tirPercent: 0,
      timeBelow: 0,
      timeAbove: 0,
      gmi: 0,
      cv: 0,
      stdDev: 0,
    };
  }

  const values = readings.map((r) => r.glucose);
  const n = values.length;
  const avg = values.reduce((s, v) => s + v, 0) / n;
  const min = Math.min(...values);
  const max = Math.max(...values);

  const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);
  const cv = avg > 0 ? (stdDev / avg) * 100 : 0;

  // TIR: 3.9–10.0 mmol/L
  const inRange = values.filter((v) => v >= 3.9 && v <= 10.0).length;
  const below   = values.filter((v) => v < 3.9).length;
  const above   = values.filter((v) => v > 10.0).length;

  const tirPercent    = (inRange / n) * 100;
  const timeBelow     = (below / n) * 100;
  const timeAbove     = (above / n) * 100;

  // GMI = 3.31 + 0.02392 × mean_glucose_mg_dL
  const avgMgdl = avg * 18.0182;
  const gmi = 3.31 + 0.02392 * avgMgdl;

  return {
    readingCount: n,
    avgGlucose:  Math.round(avg  * 100) / 100,
    minGlucose:  Math.round(min  * 100) / 100,
    maxGlucose:  Math.round(max  * 100) / 100,
    tirPercent:  Math.round(tirPercent * 10) / 10,
    timeBelow:   Math.round(timeBelow  * 10) / 10,
    timeAbove:   Math.round(timeAbove  * 10) / 10,
    gmi:         Math.round(gmi  * 100) / 100,
    cv:          Math.round(cv   * 10)  / 10,
    stdDev:      Math.round(stdDev * 100) / 100,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Generate a full patient progress report.
 */
export function generateProgressReport(
  input: ProgressReportInput
): PatientProgressReport {
  const periodDays = PERIOD_DAYS[input.period];
  const glucose    = computeGlucoseSummary(input.readings);
  const doses      = computeDoseSummary(input.doses, periodDays);
  const { status, rationale } = classifyStatus(glucose.tirPercent, glucose.gmi);

  // Detect patterns using the existing trend engine
  let patterns: string[] = [];
  try {
    const trend = computeTrend(input.readings);
    patterns = trend.patterns ?? [];
  } catch {
    patterns = [];
  }

  return {
    patientId:       input.patientId,
    patientName:     input.patientName,
    clinicianName:   input.clinicianName,
    period:          input.period,
    periodDays,
    generatedAt:     input.generatedAt ?? new Date().toISOString(),
    glucose,
    doses,
    patterns,
    overallStatus:   status,
    statusRationale: rationale,
    disclaimer:
      "GluMira™ is an informational tool only. Not a medical device. " +
      "This report is for educational purposes and does not constitute medical advice.",
  };
}
