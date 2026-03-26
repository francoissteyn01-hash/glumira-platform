/**
 * GluMira™ — Stress Response Test Suite
 *
 * Tests pre-stress baseline, glucose window, impact severity,
 * recommendations, correlation, and full report generation.
 *
 * GluMira is an informational tool only. Not a medical device.
 */

import { describe, it, expect } from "vitest";
import {
  computePreStressBaseline,
  computeStressGlucoseWindow,
  classifyImpactSeverity,
  severityColour,
  generateStressRecommendation,
  computeStressCorrelation,
  generateStressReport,
  type GlucoseReading,
  type StressPeriod,
} from "./stress-response";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReadings(
  values: number[],
  startIso: string = "2026-03-25T08:00:00Z",
  intervalMin: number = 5
): GlucoseReading[] {
  const base = new Date(startIso).getTime();
  return values.map((mmol, i) => ({
    mmol,
    timestamp: new Date(base + i * intervalMin * 60000).toISOString(),
  }));
}

const STRESS_PERIOD: StressPeriod = {
  startTime: "2026-03-25T10:00:00Z",
  endTime: "2026-03-25T11:00:00Z",
  stressLevel: 3,
  category: "work",
};

// ─── computePreStressBaseline ────────────────────────────────────────────────

describe("computePreStressBaseline", () => {
  it("computes mean of readings in the 2h window before stress", () => {
    // Readings from 08:00 to 10:00 (24 readings at 5-min intervals)
    const vals = Array(24).fill(6.0);
    const readings = makeReadings(vals, "2026-03-25T08:00:00Z");
    const baseline = computePreStressBaseline(readings, STRESS_PERIOD.startTime);
    expect(baseline).toBe(6.0);
  });

  it("returns 0 for no readings in window", () => {
    const readings = makeReadings([5.0], "2026-03-25T06:00:00Z");
    const baseline = computePreStressBaseline(readings, STRESS_PERIOD.startTime);
    expect(baseline).toBe(0);
  });

  it("uses custom window hours", () => {
    const vals = Array(12).fill(7.0);
    const readings = makeReadings(vals, "2026-03-25T09:00:00Z");
    const baseline = computePreStressBaseline(readings, STRESS_PERIOD.startTime, 1);
    expect(baseline).toBe(7.0);
  });
});

// ─── computeStressGlucoseWindow ──────────────────────────────────────────────

describe("computeStressGlucoseWindow", () => {
  it("computes pre, during, and post means", () => {
    // Pre: 08:00-10:00 = 6.0, During: 10:00-11:00 = 9.0, Post: 11:00-12:00 = 7.0
    const pre = Array(24).fill(6.0);
    const during = Array(12).fill(9.0);
    const post = Array(12).fill(7.0);
    const readings = [
      ...makeReadings(pre, "2026-03-25T08:00:00Z"),
      ...makeReadings(during, "2026-03-25T10:00:00Z"),
      ...makeReadings(post, "2026-03-25T11:00:00Z"),
    ];
    const window = computeStressGlucoseWindow(readings, STRESS_PERIOD);
    expect(window.preMean).toBeCloseTo(6.0, 0);
    expect(window.duringMean).toBeCloseTo(9.0, 0);
    expect(window.riseFromBaseline).toBeCloseTo(3.0, 0);
  });

  it("finds peak during stress", () => {
    const pre = Array(24).fill(6.0);
    const during = [8.0, 9.0, 11.0, 10.0, 9.0, 8.5, 8.0, 7.5, 7.0, 7.0, 7.0, 7.0];
    const readings = [
      ...makeReadings(pre, "2026-03-25T08:00:00Z"),
      ...makeReadings(during, "2026-03-25T10:00:00Z"),
    ];
    const window = computeStressGlucoseWindow(readings, STRESS_PERIOD);
    expect(window.peakDuring).toBe(11.0);
  });

  it("handles empty readings gracefully", () => {
    const window = computeStressGlucoseWindow([], STRESS_PERIOD);
    expect(window.preMean).toBe(0);
    expect(window.duringMean).toBe(0);
    expect(window.postMean).toBe(0);
  });
});

// ─── classifyImpactSeverity ──────────────────────────────────────────────────

describe("classifyImpactSeverity", () => {
  it("returns none for < 0.5", () => expect(classifyImpactSeverity(0.3)).toBe("none"));
  it("returns mild for 0.5-1.4", () => expect(classifyImpactSeverity(1.0)).toBe("mild"));
  it("returns moderate for 1.5-2.9", () => expect(classifyImpactSeverity(2.0)).toBe("moderate"));
  it("returns significant for >= 3.0", () => expect(classifyImpactSeverity(3.5)).toBe("significant"));
  it("returns none for 0", () => expect(classifyImpactSeverity(0)).toBe("none"));
  it("returns none for negative", () => expect(classifyImpactSeverity(-1.0)).toBe("none"));
});

// ─── severityColour ──────────────────────────────────────────────────────────

describe("severityColour", () => {
  it("returns green for none", () => expect(severityColour("none")).toBe("#22c55e"));
  it("returns lime for mild", () => expect(severityColour("mild")).toBe("#84cc16"));
  it("returns amber for moderate", () => expect(severityColour("moderate")).toBe("#f59e0b"));
  it("returns red for significant", () => expect(severityColour("significant")).toBe("#ef4444"));
});

// ─── generateStressRecommendation ────────────────────────────────────────────

describe("generateStressRecommendation", () => {
  it("returns minimal impact message for none", () => {
    const rec = generateStressRecommendation("none", STRESS_PERIOD, 0);
    expect(rec).toContain("minimal impact");
  });

  it("mentions clinician for significant severity", () => {
    const rec = generateStressRecommendation("significant", STRESS_PERIOD, 60);
    expect(rec).toContain("clinician");
  });

  it("warns about long recovery", () => {
    const rec = generateStressRecommendation("moderate", STRESS_PERIOD, 150);
    expect(rec).toContain("2 hours");
  });

  it("mentions work stress for work category", () => {
    const rec = generateStressRecommendation("mild", STRESS_PERIOD, 30);
    expect(rec).toContain("Work-related");
  });

  it("mentions sick-day for illness category", () => {
    const illnessPeriod: StressPeriod = { ...STRESS_PERIOD, category: "illness" };
    const rec = generateStressRecommendation("moderate", illnessPeriod, 60);
    expect(rec).toContain("sick-day");
  });

  it("mentions breathing exercises for high stress level", () => {
    const highStress: StressPeriod = { ...STRESS_PERIOD, stressLevel: 5 };
    const rec = generateStressRecommendation("moderate", highStress, 60);
    expect(rec).toContain("breathing");
  });
});

// ─── computeStressCorrelation ────────────────────────────────────────────────

describe("computeStressCorrelation", () => {
  it("groups by stress level", () => {
    const pre = Array(24).fill(6.0);
    const during = Array(12).fill(9.0);
    const readings = [
      ...makeReadings(pre, "2026-03-25T08:00:00Z"),
      ...makeReadings(during, "2026-03-25T10:00:00Z"),
    ];
    const periods: StressPeriod[] = [
      { ...STRESS_PERIOD, stressLevel: 3 },
      { ...STRESS_PERIOD, stressLevel: 3 },
    ];
    const corr = computeStressCorrelation(readings, periods);
    expect(corr).toHaveLength(1);
    expect(corr[0].stressLevel).toBe(3);
    expect(corr[0].sampleSize).toBe(2);
  });

  it("returns empty for no periods", () => {
    expect(computeStressCorrelation([], [])).toEqual([]);
  });

  it("sorts by stress level ascending", () => {
    const pre = Array(24).fill(6.0);
    const during = Array(12).fill(8.0);
    const readings = [
      ...makeReadings(pre, "2026-03-25T08:00:00Z"),
      ...makeReadings(during, "2026-03-25T10:00:00Z"),
    ];
    const periods: StressPeriod[] = [
      { ...STRESS_PERIOD, stressLevel: 5 },
      { ...STRESS_PERIOD, stressLevel: 1 },
      { ...STRESS_PERIOD, stressLevel: 3 },
    ];
    const corr = computeStressCorrelation(readings, periods);
    expect(corr[0].stressLevel).toBe(1);
    expect(corr[corr.length - 1].stressLevel).toBe(5);
  });
});

// ─── generateStressReport ────────────────────────────────────────────────────

describe("generateStressReport", () => {
  it("generates a full report", () => {
    const pre = Array(24).fill(6.0);
    const during = Array(12).fill(9.0);
    const post = Array(12).fill(6.5);
    const readings = [
      ...makeReadings(pre, "2026-03-25T08:00:00Z"),
      ...makeReadings(during, "2026-03-25T10:00:00Z"),
      ...makeReadings(post, "2026-03-25T11:00:00Z"),
    ];
    const report = generateStressReport(readings, STRESS_PERIOD);
    expect(report.period).toEqual(STRESS_PERIOD);
    expect(report.glucoseWindow.riseFromBaseline).toBeGreaterThan(2.0);
    expect(["moderate", "significant"]).toContain(report.impactSeverity);
    expect(report.recommendation.length).toBeGreaterThan(0);
  });

  it("reports no impact for flat glucose", () => {
    const flat = Array(48).fill(6.0);
    const readings = makeReadings(flat, "2026-03-25T08:00:00Z");
    const report = generateStressReport(readings, STRESS_PERIOD);
    expect(report.impactSeverity).toBe("none");
  });

  it("handles empty readings", () => {
    const report = generateStressReport([], STRESS_PERIOD);
    expect(report.impactSeverity).toBe("none");
  });
});
