/**
 * GluMira™ — analytics-summary.test.ts
 *
 * Test suite for server/analytics/analytics-summary.ts
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  computeAnalyticsSummary,
  tirStatusLabel,
  gmiCategory,
  tirColour,
} from "./analytics-summary";
import type { GlucosePoint } from "./glucose-trend";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function recentPts(values: number[], daysAgo = 0, stepMs = 300_000): GlucosePoint[] {
  const base = Date.now() - daysAgo * 24 * 60 * 60 * 1000;
  return values.map((glucose, i) => ({
    glucose,
    timestamp: new Date(base + i * stepMs).toISOString(),
  }));
}

/** Build 14 days of readings: 7d of one value + 7d of another */
function buildTwoWeekReadings(
  olderValue: number,
  recentValue: number,
  countPerPeriod = 100
): GlucosePoint[] {
  const older = recentPts(Array(countPerPeriod).fill(olderValue), 13);
  const recent = recentPts(Array(countPerPeriod).fill(recentValue), 6);
  return [...older, ...recent];
}

// ─── computeAnalyticsSummary ──────────────────────────────────────────────────

describe("computeAnalyticsSummary", () => {
  it("returns zero summaries for empty array", () => {
    const result = computeAnalyticsSummary([]);
    expect(result.sevenDay.count).toBe(0);
    expect(result.fourteenDay.count).toBe(0);
    expect(result.tirDelta).toBe(0);
    expect(result.gmiDelta).toBe(0);
  });

  it("includes generatedAt ISO timestamp", () => {
    const result = computeAnalyticsSummary([]);
    expect(result.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("sevenDay has days = 7", () => {
    const result = computeAnalyticsSummary([]);
    expect(result.sevenDay.days).toBe(7);
  });

  it("fourteenDay has days = 14", () => {
    const result = computeAnalyticsSummary([]);
    expect(result.fourteenDay.days).toBe(14);
  });

  it("sevenDay count is subset of fourteenDay count", () => {
    const readings = buildTwoWeekReadings(7.0, 7.0);
    const result = computeAnalyticsSummary(readings);
    expect(result.sevenDay.count).toBeLessThanOrEqual(result.fourteenDay.count);
  });

  it("computes 100% TIR for all in-range readings", () => {
    const readings = recentPts(Array(50).fill(7.0), 0);
    const result = computeAnalyticsSummary(readings);
    expect(result.sevenDay.tirPercent).toBe(100);
  });

  it("computes 0% TIR for all out-of-range readings", () => {
    const readings = recentPts(Array(50).fill(15.0), 0);
    const result = computeAnalyticsSummary(readings);
    expect(result.sevenDay.tirPercent).toBe(0);
  });

  it("tirDelta is positive when recent TIR is better than older TIR", () => {
    // Recent 7d: all in-range (100% TIR)
    // Older 7d: all high (0% TIR)
    const readings = buildTwoWeekReadings(15.0, 7.0);
    const result = computeAnalyticsSummary(readings);
    // sevenDay TIR should be higher than fourteenDay TIR
    expect(result.tirDelta).toBeGreaterThan(0);
  });

  it("gmiDelta is positive when recent GMI is lower (better)", () => {
    // Recent 7d: lower glucose → lower GMI
    // Older 7d: higher glucose → higher GMI
    const readings = buildTwoWeekReadings(12.0, 6.0);
    const result = computeAnalyticsSummary(readings);
    // fourteenDay GMI > sevenDay GMI → gmiDelta > 0 (improvement)
    expect(result.gmiDelta).toBeGreaterThan(0);
  });

  it("sevenDay mean is close to recent value", () => {
    const readings = buildTwoWeekReadings(12.0, 7.0);
    const result = computeAnalyticsSummary(readings);
    expect(result.sevenDay.mean).toBeCloseTo(7.0, 0);
  });

  it("fourteenDay includes both periods", () => {
    const readings = buildTwoWeekReadings(12.0, 7.0, 50);
    const result = computeAnalyticsSummary(readings);
    // 14d mean should be between 7 and 12
    expect(result.fourteenDay.mean).toBeGreaterThan(7.0);
    expect(result.fourteenDay.mean).toBeLessThan(12.0);
  });
});

// ─── tirStatusLabel ───────────────────────────────────────────────────────────

describe("tirStatusLabel", () => {
  it("returns Target met for >= 70%", () => {
    expect(tirStatusLabel(70)).toBe("Target met");
    expect(tirStatusLabel(100)).toBe("Target met");
  });

  it("returns Approaching target for 50–69%", () => {
    expect(tirStatusLabel(50)).toBe("Approaching target");
    expect(tirStatusLabel(69)).toBe("Approaching target");
  });

  it("returns Below target for < 50%", () => {
    expect(tirStatusLabel(49)).toBe("Below target");
    expect(tirStatusLabel(0)).toBe("Below target");
  });
});

// ─── gmiCategory ─────────────────────────────────────────────────────────────

describe("gmiCategory", () => {
  it("returns Normal for < 5.7", () => {
    expect(gmiCategory(5.6)).toBe("Normal");
    expect(gmiCategory(5.0)).toBe("Normal");
  });

  it("returns Pre-diabetes range for 5.7–6.49", () => {
    expect(gmiCategory(5.7)).toBe("Pre-diabetes range");
    expect(gmiCategory(6.4)).toBe("Pre-diabetes range");
  });

  it("returns Diabetes range for >= 6.5", () => {
    expect(gmiCategory(6.5)).toBe("Diabetes range");
    expect(gmiCategory(9.0)).toBe("Diabetes range");
  });
});

// ─── tirColour ────────────────────────────────────────────────────────────────

describe("tirColour", () => {
  it("returns emerald for >= 70%", () => {
    expect(tirColour(70)).toContain("emerald");
    expect(tirColour(100)).toContain("emerald");
  });

  it("returns amber for 50–69%", () => {
    expect(tirColour(50)).toContain("amber");
    expect(tirColour(69)).toContain("amber");
  });

  it("returns red for < 50%", () => {
    expect(tirColour(49)).toContain("red");
    expect(tirColour(0)).toContain("red");
  });
});
