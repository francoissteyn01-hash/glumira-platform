/**
 * GluMira — Data Quality Test Suite
 *
 * Tests gap detection, noise scoring, completeness computation,
 * quality grading, and full report generation.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { describe, it, expect } from "vitest";
import {
  detectGaps,
  computeNoiseScore,
  computeExpectedReadings,
  qualityGrade,
  isDataReliable,
  generateDataQualityReport,
  type GlucoseReading,
} from "./data-quality";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReadings(count: number, intervalMin: number = 5, startMmol: number = 5.5): GlucoseReading[] {
  const base = new Date("2026-03-20T08:00:00Z").getTime();
  return Array.from({ length: count }, (_, i) => ({
    mmol: startMmol + Math.sin(i * 0.1) * 0.5,
    timestamp: new Date(base + i * intervalMin * 60000).toISOString(),
  }));
}

function makeReadingsWithGap(gapStartIdx: number, gapMinutes: number): GlucoseReading[] {
  const base = new Date("2026-03-20T08:00:00Z").getTime();
  const readings: GlucoseReading[] = [];
  let time = base;
  for (let i = 0; i < 20; i++) {
    readings.push({ mmol: 5.5, timestamp: new Date(time).toISOString() });
    if (i === gapStartIdx) {
      time += gapMinutes * 60000;
    } else {
      time += 5 * 60000;
    }
  }
  return readings;
}

// ─── detectGaps ──────────────────────────────────────────────────────────────

describe("detectGaps", () => {
  it("returns empty for continuous data", () => {
    const readings = makeReadings(20);
    expect(detectGaps(readings)).toEqual([]);
  });

  it("detects a 30-minute gap", () => {
    const readings = makeReadingsWithGap(5, 30);
    const gaps = detectGaps(readings);
    expect(gaps).toHaveLength(1);
    expect(gaps[0].durationMinutes).toBe(30);
  });

  it("detects multiple gaps", () => {
    const readings = makeReadingsWithGap(3, 20);
    // Add another gap
    const base = new Date(readings[readings.length - 1].timestamp).getTime();
    readings.push({ mmol: 5.5, timestamp: new Date(base + 25 * 60000).toISOString() });
    const gaps = detectGaps(readings);
    expect(gaps.length).toBeGreaterThanOrEqual(2);
  });

  it("respects custom threshold", () => {
    const readings = makeReadingsWithGap(5, 12);
    expect(detectGaps(readings, 10)).toHaveLength(1);
    expect(detectGaps(readings, 15)).toHaveLength(0);
  });

  it("returns empty for fewer than 2 readings", () => {
    expect(detectGaps([{ mmol: 5.5, timestamp: "2026-03-20T08:00:00Z" }])).toEqual([]);
    expect(detectGaps([])).toEqual([]);
  });
});

// ─── computeNoiseScore ───────────────────────────────────────────────────────

describe("computeNoiseScore", () => {
  it("returns 0 for fewer than 3 readings", () => {
    expect(computeNoiseScore(makeReadings(2))).toBe(0);
  });

  it("returns 0 for monotonically increasing data", () => {
    const readings: GlucoseReading[] = Array.from({ length: 10 }, (_, i) => ({
      mmol: 4.0 + i * 0.1,
      timestamp: new Date(Date.now() + i * 300000).toISOString(),
    }));
    expect(computeNoiseScore(readings)).toBe(0);
  });

  it("returns high score for alternating data", () => {
    const readings: GlucoseReading[] = Array.from({ length: 20 }, (_, i) => ({
      mmol: i % 2 === 0 ? 5.0 : 7.0,
      timestamp: new Date(Date.now() + i * 300000).toISOString(),
    }));
    const score = computeNoiseScore(readings);
    expect(score).toBeGreaterThan(80);
  });

  it("returns moderate score for somewhat noisy data", () => {
    const readings: GlucoseReading[] = Array.from({ length: 20 }, (_, i) => ({
      mmol: 5.5 + Math.sin(i) * 0.3 + (i % 3 === 0 ? -0.5 : 0),
      timestamp: new Date(Date.now() + i * 300000).toISOString(),
    }));
    const score = computeNoiseScore(readings);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);
  });
});

// ─── computeExpectedReadings ─────────────────────────────────────────────────

describe("computeExpectedReadings", () => {
  it("returns count for fewer than 2 readings", () => {
    expect(computeExpectedReadings([])).toBe(0);
    expect(computeExpectedReadings([{ mmol: 5.5, timestamp: "2026-03-20T08:00:00Z" }])).toBe(1);
  });

  it("computes expected count for 1 hour of 5-min data", () => {
    const readings = makeReadings(13); // 0..60 min = 13 readings
    expect(computeExpectedReadings(readings)).toBe(13);
  });

  it("respects custom interval", () => {
    const readings = makeReadings(7, 10); // 0..60 min at 10-min intervals = 7 readings
    expect(computeExpectedReadings(readings, 10)).toBe(7);
  });
});

// ─── qualityGrade ────────────────────────────────────────────────────────────

describe("qualityGrade", () => {
  it("returns A for excellent data", () => {
    expect(qualityGrade(95, 20)).toBe("A");
  });

  it("returns B for good data", () => {
    expect(qualityGrade(85, 40)).toBe("B");
  });

  it("returns C for acceptable data", () => {
    expect(qualityGrade(75, 55)).toBe("C");
  });

  it("returns D for poor data", () => {
    expect(qualityGrade(55, 70)).toBe("D");
  });

  it("returns F for very poor data", () => {
    expect(qualityGrade(40, 80)).toBe("F");
  });
});

// ─── isDataReliable ──────────────────────────────────────────────────────────

describe("isDataReliable", () => {
  it("returns true for good completeness and low noise", () => {
    expect(isDataReliable(80, 30)).toBe(true);
  });

  it("returns false for low completeness", () => {
    expect(isDataReliable(60, 30)).toBe(false);
  });

  it("returns false for high noise", () => {
    expect(isDataReliable(90, 70)).toBe(false);
  });
});

// ─── generateDataQualityReport ───────────────────────────────────────────────

describe("generateDataQualityReport", () => {
  it("generates a full report for clean data", () => {
    const readings = makeReadings(288); // 1 day of 5-min data
    const report = generateDataQualityReport(readings);
    expect(report.totalReadings).toBe(288);
    expect(report.completenessPercent).toBeGreaterThanOrEqual(99);
    expect(report.gaps).toHaveLength(0);
    expect(report.qualityGrade).toBe("A");
    expect(report.isReliable).toBe(true);
    expect(report.warnings).toHaveLength(0);
  });

  it("generates warnings for sparse data", () => {
    const readings = makeReadings(50);
    const report = generateDataQualityReport(readings);
    expect(report.warnings.length).toBeGreaterThan(0);
  });

  it("detects gaps in the report", () => {
    const readings = makeReadingsWithGap(10, 60);
    const report = generateDataQualityReport(readings);
    expect(report.gaps.length).toBeGreaterThan(0);
    expect(report.longestGapMinutes).toBeGreaterThanOrEqual(60);
  });

  it("handles empty readings", () => {
    const report = generateDataQualityReport([]);
    expect(report.totalReadings).toBe(0);
    expect(report.qualityGrade).toBe("F");
    expect(report.isReliable).toBe(false);
  });

  it("computes avgReadingsPerDay", () => {
    const readings = makeReadings(288); // 1 day
    const report = generateDataQualityReport(readings);
    expect(report.avgReadingsPerDay).toBeGreaterThan(250);
  });
});
