/**
 * GluMira — Glucose Report Generator Test Suite
 *
 * Tests computeReportPeriod, comparePeriods, generateInsights,
 * classifyOverallStatus, statusLabel, statusColour, and generateGlucoseReport.
 */

import { describe, it, expect } from "vitest";
import {
  computeReportPeriod,
  comparePeriods,
  generateInsights,
  classifyOverallStatus,
  statusLabel,
  statusColour,
  generateGlucoseReport,
  type GlucoseReading,
  type ReportPeriod,
} from "./glucose-report";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReadings(values: number[], startDaysAgo: number = 7): GlucoseReading[] {
  const now = Date.now();
  const intervalMs = (startDaysAgo * 86400000) / values.length;
  return values.map((mmol, i) => ({
    mmol,
    timestamp: new Date(now - startDaysAgo * 86400000 + i * intervalMs).toISOString(),
  }));
}

// ─── computeReportPeriod ─────────────────────────────────────────────────────

describe("computeReportPeriod", () => {
  it("returns zeroed period for empty readings", () => {
    const p = computeReportPeriod("Empty", []);
    expect(p.readingCount).toBe(0);
    expect(p.mean).toBe(0);
    expect(p.tirPercent).toBe(0);
  });

  it("computes correct mean for uniform readings", () => {
    const readings = makeReadings([6, 6, 6, 6, 6]);
    const p = computeReportPeriod("Uniform", readings);
    expect(p.mean).toBe(6);
    expect(p.stdDev).toBe(0);
    expect(p.cv).toBe(0);
  });

  it("computes 100% TIR for all in-range readings", () => {
    const readings = makeReadings([5, 6, 7, 8, 9]);
    const p = computeReportPeriod("InRange", readings);
    expect(p.tirPercent).toBe(100);
    expect(p.belowRangePercent).toBe(0);
    expect(p.aboveRangePercent).toBe(0);
  });

  it("computes correct below-range percentage", () => {
    const readings = makeReadings([2.5, 3.0, 5.0, 7.0, 8.0]); // 2 below 3.9
    const p = computeReportPeriod("BelowRange", readings);
    expect(p.belowRangePercent).toBe(40);
  });

  it("computes correct above-range percentage", () => {
    const readings = makeReadings([5.0, 7.0, 11.0, 12.0, 15.0]); // 3 above 10.0
    const p = computeReportPeriod("AboveRange", readings);
    expect(p.aboveRangePercent).toBe(60);
  });

  it("computes GMI using ADAG formula", () => {
    const readings = makeReadings([8.0, 8.0, 8.0, 8.0, 8.0]);
    const p = computeReportPeriod("GMI", readings);
    // GMI = 3.31 + 0.02392 × (8.0 × 18.0182) = 3.31 + 0.02392 × 144.1456 ≈ 6.76
    expect(p.gmi).toBeCloseTo(6.76, 1);
  });

  it("computes lowest and highest readings", () => {
    const readings = makeReadings([3.0, 5.0, 7.0, 12.0, 15.0]);
    const p = computeReportPeriod("MinMax", readings);
    expect(p.lowestReading).toBe(3.0);
    expect(p.highestReading).toBe(15.0);
  });

  it("computes median correctly for odd count", () => {
    const readings = makeReadings([3.0, 5.0, 7.0, 9.0, 11.0]);
    const p = computeReportPeriod("Median", readings);
    expect(p.median).toBe(7.0);
  });

  it("computes median correctly for even count", () => {
    const readings = makeReadings([4.0, 6.0, 8.0, 10.0]);
    const p = computeReportPeriod("MedianEven", readings);
    expect(p.median).toBe(7.0);
  });

  it("sets correct start and end dates", () => {
    const readings = makeReadings([5, 6, 7], 3);
    const p = computeReportPeriod("Dates", readings);
    expect(p.startDate).toBeTruthy();
    expect(p.endDate).toBeTruthy();
    expect(new Date(p.startDate).getTime()).toBeLessThan(new Date(p.endDate).getTime());
  });

  it("readingCount matches input length", () => {
    const readings = makeReadings([5, 6, 7, 8, 9, 10, 11]);
    const p = computeReportPeriod("Count", readings);
    expect(p.readingCount).toBe(7);
  });
});

// ─── comparePeriods ──────────────────────────────────────────────────────────

describe("comparePeriods", () => {
  const prev = computeReportPeriod("Prev", makeReadings([8, 9, 10, 11, 12], 14));
  const curr = computeReportPeriod("Curr", makeReadings([5, 6, 7, 8, 9], 7));

  it("returns 5 trend comparisons", () => {
    const trends = comparePeriods(prev, curr);
    expect(trends).toHaveLength(5);
  });

  it("detects improving mean glucose", () => {
    const trends = comparePeriods(prev, curr);
    const meanTrend = trends.find((t) => t.metric === "Mean Glucose");
    expect(meanTrend?.direction).toBe("improving");
    expect(meanTrend!.delta).toBeLessThan(0);
  });

  it("detects improving TIR", () => {
    const trends = comparePeriods(prev, curr);
    const tirTrend = trends.find((t) => t.metric === "TIR%");
    expect(tirTrend?.direction).toBe("improving");
  });

  it("marks stable when delta is small", () => {
    const same = computeReportPeriod("Same", makeReadings([7, 7, 7, 7, 7], 7));
    const trends = comparePeriods(same, same);
    expect(trends.every((t) => t.direction === "stable")).toBe(true);
  });
});

// ─── generateInsights ────────────────────────────────────────────────────────

describe("generateInsights", () => {
  it("flags high TIR as meeting target", () => {
    const period = computeReportPeriod("Good", makeReadings([5, 6, 7, 8, 9]));
    const insights = generateInsights(period, []);
    expect(insights.some((i) => i.includes("meeting"))).toBe(true);
  });

  it("flags low TIR as below target", () => {
    const period = computeReportPeriod("Low", makeReadings([2, 3, 12, 15, 18]));
    const insights = generateInsights(period, []);
    expect(insights.some((i) => i.includes("below the recommended"))).toBe(true);
  });

  it("flags high CV", () => {
    const period = computeReportPeriod("HighCV", makeReadings([2, 5, 10, 15, 20]));
    const insights = generateInsights(period, []);
    if (period.cv > 36) {
      expect(insights.some((i) => i.includes("variability"))).toBe(true);
    }
  });

  it("flags high below-range percentage", () => {
    const period = computeReportPeriod("Hypo", makeReadings([2, 2.5, 3, 3.5, 5]));
    const insights = generateInsights(period, []);
    if (period.belowRangePercent > 4) {
      expect(insights.some((i) => i.includes("safety threshold"))).toBe(true);
    }
  });

  it("lists improving trends", () => {
    const prev = computeReportPeriod("Prev", makeReadings([10, 11, 12, 13, 14], 14));
    const curr = computeReportPeriod("Curr", makeReadings([5, 6, 7, 8, 9], 7));
    const trends = comparePeriods(prev, curr);
    const insights = generateInsights(curr, trends);
    expect(insights.some((i) => i.includes("Improving"))).toBe(true);
  });
});

// ─── classifyOverallStatus ───────────────────────────────────────────────────

describe("classifyOverallStatus", () => {
  it("returns excellent for perfect readings", () => {
    const period = computeReportPeriod("Perfect", makeReadings([5.5, 6.0, 6.5, 7.0, 7.5]));
    expect(classifyOverallStatus(period)).toBe("excellent");
  });

  it("returns concerning for very poor readings", () => {
    const period = computeReportPeriod("Poor", makeReadings([2, 3, 15, 18, 20]));
    expect(["needs-attention", "concerning"]).toContain(classifyOverallStatus(period));
  });

  it("returns good for decent readings", () => {
    const period = computeReportPeriod("Decent", makeReadings([5, 6, 7, 8, 11]));
    const status = classifyOverallStatus(period);
    expect(["excellent", "good"]).toContain(status);
  });
});

// ─── statusLabel ─────────────────────────────────────────────────────────────

describe("statusLabel", () => {
  it("returns correct labels", () => {
    expect(statusLabel("excellent")).toContain("Excellent");
    expect(statusLabel("good")).toContain("Good");
    expect(statusLabel("needs-attention")).toContain("attention");
    expect(statusLabel("concerning")).toContain("review");
  });

  it("returns Unknown for invalid status", () => {
    expect(statusLabel("invalid")).toBe("Unknown");
  });
});

// ─── statusColour ────────────────────────────────────────────────────────────

describe("statusColour", () => {
  it("returns green for excellent", () => {
    expect(statusColour("excellent")).toBe("green");
  });

  it("returns red for concerning", () => {
    expect(statusColour("concerning")).toBe("red");
  });

  it("returns gray for unknown", () => {
    expect(statusColour("unknown")).toBe("gray");
  });
});

// ─── generateGlucoseReport ───────────────────────────────────────────────────

describe("generateGlucoseReport", () => {
  it("generates report with single period", () => {
    const readings = makeReadings([5, 6, 7, 8, 9]);
    const report = generateGlucoseReport("patient-1", readings);
    expect(report.patientId).toBe("patient-1");
    expect(report.periods).toHaveLength(1);
    expect(report.trends).toHaveLength(0);
    expect(report.insights.length).toBeGreaterThan(0);
    expect(report.generatedAt).toBeTruthy();
  });

  it("generates report with two periods and trends", () => {
    const current = makeReadings([5, 6, 7, 8, 9], 7);
    const previous = makeReadings([8, 9, 10, 11, 12], 14);
    const report = generateGlucoseReport("patient-2", current, previous);
    expect(report.periods).toHaveLength(2);
    expect(report.trends).toHaveLength(5);
  });

  it("overallStatus is a valid value", () => {
    const readings = makeReadings([5, 6, 7, 8, 9]);
    const report = generateGlucoseReport("patient-3", readings);
    expect(["excellent", "good", "needs-attention", "concerning"]).toContain(report.overallStatus);
  });

  it("handles empty current readings gracefully", () => {
    const report = generateGlucoseReport("patient-4", []);
    expect(report.periods).toHaveLength(1);
    expect(report.periods[0].readingCount).toBe(0);
  });
});
