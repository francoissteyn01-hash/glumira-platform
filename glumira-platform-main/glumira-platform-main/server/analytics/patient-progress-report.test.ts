/**
 * GluMira™ — patient-progress-report.test.ts
 *
 * Test suite for server/analytics/patient-progress-report.ts
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { describe, it, expect } from "vitest";
import {
  classifyStatus,
  computeDoseSummary,
  computeGlucoseSummary,
  generateProgressReport,
} from "./patient-progress-report";
import type { ProgressReportInput } from "./patient-progress-report";
import type { GlucosePoint } from "./glucose-trend";
import type { DoseRecord } from "../doses/dose-log";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeReadings(values: number[]): GlucosePoint[] {
  return values.map((glucose, i) => ({
    glucose,
    timestamp: new Date(Date.now() - i * 5 * 60 * 1000).toISOString(),
  }));
}

const IN_RANGE_READINGS = makeReadings([5.5, 6.0, 5.8, 6.2, 5.9, 6.1, 5.7]);
const HYPO_READINGS     = makeReadings([3.2, 3.5, 3.1, 3.8, 3.3, 3.6, 3.4]);
const HYPER_READINGS    = makeReadings([12.0, 13.5, 11.8, 14.2, 12.5, 13.0, 11.5]);

const NOW = new Date().toISOString();
const SAMPLE_DOSES: DoseRecord[] = [
  { id: "d1", userId: "u1", insulinType: "NovoRapid", units: 4,   doseType: "bolus",      administeredAt: NOW, createdAt: NOW },
  { id: "d2", userId: "u1", insulinType: "NovoRapid", units: 2,   doseType: "correction", administeredAt: NOW, createdAt: NOW },
  { id: "d3", userId: "u1", insulinType: "Lantus",    units: 10,  doseType: "basal",      administeredAt: NOW, createdAt: NOW },
  { id: "d4", userId: "u1", insulinType: "NovoRapid", units: 3.5, doseType: "bolus",      administeredAt: NOW, createdAt: NOW },
];

const BASE_INPUT: ProgressReportInput = {
  patientId:     "patient-001",
  patientName:   "Alex Johnson",
  clinicianName: "Dr. Sarah Lee",
  period:        "14d",
  readings:      IN_RANGE_READINGS,
  doses:         SAMPLE_DOSES,
};

// ─── classifyStatus ───────────────────────────────────────────────────────────

describe("classifyStatus", () => {
  it("returns 'excellent' for TIR ≥70% and GMI <7.0", () => {
    const { status } = classifyStatus(72, 6.8);
    expect(status).toBe("excellent");
  });

  it("returns 'good' for TIR ≥60% and GMI <8.0", () => {
    const { status } = classifyStatus(65, 7.5);
    expect(status).toBe("good");
  });

  it("returns 'fair' for TIR ≥50% and GMI ≥8.0", () => {
    const { status } = classifyStatus(55, 8.5);
    expect(status).toBe("fair");
  });

  it("returns 'poor' for TIR <50%", () => {
    const { status } = classifyStatus(40, 9.5);
    expect(status).toBe("poor");
  });

  it("rationale includes TIR value", () => {
    const { rationale } = classifyStatus(72, 6.8);
    expect(rationale).toContain("72");
  });

  it("rationale includes GMI value", () => {
    const { rationale } = classifyStatus(72, 6.8);
    expect(rationale).toContain("6.8");
  });
});

// ─── computeDoseSummary ───────────────────────────────────────────────────────

describe("computeDoseSummary", () => {
  it("returns zeros for empty doses", () => {
    const s = computeDoseSummary([], 7);
    expect(s.totalDoses).toBe(0);
    expect(s.totalUnits).toBe(0);
  });

  it("counts total doses correctly", () => {
    const s = computeDoseSummary(SAMPLE_DOSES, 7);
    expect(s.totalDoses).toBe(4);
  });

  it("sums bolus units correctly", () => {
    const s = computeDoseSummary(SAMPLE_DOSES, 7);
    expect(s.bolusUnits).toBeCloseTo(7.5, 1);
  });

  it("sums basal units correctly", () => {
    const s = computeDoseSummary(SAMPLE_DOSES, 7);
    expect(s.basalUnits).toBe(10);
  });

  it("sums correction units correctly", () => {
    const s = computeDoseSummary(SAMPLE_DOSES, 7);
    expect(s.correctionUnits).toBe(2);
  });

  it("calculates total units as sum of all types", () => {
    const s = computeDoseSummary(SAMPLE_DOSES, 7);
    expect(s.totalUnits).toBeCloseTo(19.5, 1);
  });

  it("calculates avgDailyUnits over period", () => {
    const s = computeDoseSummary(SAMPLE_DOSES, 7);
    expect(s.avgDailyUnits).toBeCloseTo(19.5 / 7, 0);
  });

  it("calculates avgDailyDoses over period", () => {
    const s = computeDoseSummary(SAMPLE_DOSES, 7);
    expect(s.avgDailyDoses).toBeCloseTo(4 / 7, 1);
  });
});

// ─── computeGlucoseSummary ────────────────────────────────────────────────────

describe("computeGlucoseSummary", () => {
  it("returns zeros for empty readings", () => {
    const s = computeGlucoseSummary([]);
    expect(s.readingCount).toBe(0);
    expect(s.avgGlucose).toBe(0);
  });

  it("counts readings correctly", () => {
    const s = computeGlucoseSummary(IN_RANGE_READINGS);
    expect(s.readingCount).toBe(7);
  });

  it("calculates average glucose", () => {
    const s = computeGlucoseSummary(IN_RANGE_READINGS);
    expect(s.avgGlucose).toBeGreaterThan(5.5);
    expect(s.avgGlucose).toBeLessThan(6.5);
  });

  it("returns 100% TIR for all in-range readings", () => {
    const s = computeGlucoseSummary(IN_RANGE_READINGS);
    expect(s.tirPercent).toBe(100);
  });

  it("returns 0% TIR for all hypo readings", () => {
    const s = computeGlucoseSummary(HYPO_READINGS);
    expect(s.tirPercent).toBe(0);
    expect(s.timeBelow).toBe(100);
  });

  it("returns 0% TIR for all hyper readings", () => {
    const s = computeGlucoseSummary(HYPER_READINGS);
    expect(s.tirPercent).toBe(0);
    expect(s.timeAbove).toBe(100);
  });

  it("calculates GMI > 0 for non-zero readings", () => {
    const s = computeGlucoseSummary(IN_RANGE_READINGS);
    expect(s.gmi).toBeGreaterThan(0);
  });

  it("calculates CV ≥ 0", () => {
    const s = computeGlucoseSummary(IN_RANGE_READINGS);
    expect(s.cv).toBeGreaterThanOrEqual(0);
  });

  it("identifies min and max glucose correctly", () => {
    const s = computeGlucoseSummary(IN_RANGE_READINGS);
    expect(s.minGlucose).toBe(5.5);
    expect(s.maxGlucose).toBe(6.2);
  });
});

// ─── generateProgressReport ───────────────────────────────────────────────────

describe("generateProgressReport", () => {
  it("returns a report object", () => {
    const report = generateProgressReport(BASE_INPUT);
    expect(report).toBeTruthy();
    expect(typeof report).toBe("object");
  });

  it("includes patient name", () => {
    const report = generateProgressReport(BASE_INPUT);
    expect(report.patientName).toBe("Alex Johnson");
  });

  it("includes clinician name", () => {
    const report = generateProgressReport(BASE_INPUT);
    expect(report.clinicianName).toBe("Dr. Sarah Lee");
  });

  it("includes period days for 14d", () => {
    const report = generateProgressReport(BASE_INPUT);
    expect(report.periodDays).toBe(14);
  });

  it("includes period days for 30d", () => {
    const report = generateProgressReport({ ...BASE_INPUT, period: "30d" });
    expect(report.periodDays).toBe(30);
  });

  it("includes generatedAt timestamp", () => {
    const report = generateProgressReport(BASE_INPUT);
    expect(new Date(report.generatedAt).getTime()).toBeGreaterThan(0);
  });

  it("respects custom generatedAt", () => {
    const ts = "2026-03-26T10:00:00.000Z";
    const report = generateProgressReport({ ...BASE_INPUT, generatedAt: ts });
    expect(report.generatedAt).toBe(ts);
  });

  it("includes glucose summary", () => {
    const report = generateProgressReport(BASE_INPUT);
    expect(report.glucose.readingCount).toBe(7);
  });

  it("includes dose summary", () => {
    const report = generateProgressReport(BASE_INPUT);
    expect(report.doses.totalDoses).toBe(4);
  });

  it("includes overallStatus", () => {
    const report = generateProgressReport(BASE_INPUT);
    expect(["excellent", "good", "fair", "poor"]).toContain(report.overallStatus);
  });

  it("includes disclaimer with GluMira branding", () => {
    const report = generateProgressReport(BASE_INPUT);
    expect(report.disclaimer.toLowerCase()).toContain("glumira");
    expect(report.disclaimer.toLowerCase()).toContain("educational platform");
  });

  it("handles empty readings gracefully", () => {
    const report = generateProgressReport({ ...BASE_INPUT, readings: [] });
    expect(report.glucose.readingCount).toBe(0);
    expect(report.overallStatus).toBe("poor");
  });

  it("handles empty doses gracefully", () => {
    const report = generateProgressReport({ ...BASE_INPUT, doses: [] });
    expect(report.doses.totalDoses).toBe(0);
  });
});
