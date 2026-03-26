/**
 * GluMira™ — Hydration Impact Test Suite
 *
 * Tests hydration classification, hourly breakdown, correlation,
 * recommendations, and full report generation.
 *
 * GluMira is an informational tool only. Not a medical device.
 */

import { describe, it, expect } from "vitest";
import {
  classifyHydration,
  hydrationColour,
  computeHourlyHydration,
  computeHydrationCorrelation,
  generateHydrationRecommendations,
  generateHydrationReport,
  DEFAULT_DAILY_TARGET_ML,
  type HydrationEntry,
  type GlucoseReading,
} from "./hydration-impact";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeHydration(mlValues: number[], startHourLocal: number): HydrationEntry[] {
  const utcHour = startHourLocal + 4; // UTC-4 offset
  const base = new Date(`2026-03-25T${String(utcHour % 24).padStart(2, "0")}:00:00Z`).getTime();
  return mlValues.map((ml, i) => ({
    ml,
    timestamp: new Date(base + i * 3600000).toISOString(),
  }));
}

function makeGlucose(mmolValues: number[], startHourLocal: number): GlucoseReading[] {
  const utcHour = startHourLocal + 4;
  const base = new Date(`2026-03-25T${String(utcHour % 24).padStart(2, "0")}:00:00Z`).getTime();
  return mmolValues.map((mmol, i) => ({
    mmol,
    timestamp: new Date(base + i * 3600000).toISOString(),
  }));
}

// ─── classifyHydration ───────────────────────────────────────────────────────

describe("classifyHydration", () => {
  it("returns well-hydrated at 90%+ of target", () => {
    expect(classifyHydration(2300, 2500)).toBe("well-hydrated");
  });

  it("returns adequate at 60-89%", () => {
    expect(classifyHydration(1600, 2500)).toBe("adequate");
  });

  it("returns low at 30-59%", () => {
    expect(classifyHydration(1000, 2500)).toBe("low");
  });

  it("returns dehydrated below 30%", () => {
    expect(classifyHydration(500, 2500)).toBe("dehydrated");
  });

  it("uses default target when not specified", () => {
    expect(classifyHydration(2500)).toBe("well-hydrated");
  });
});

// ─── hydrationColour ─────────────────────────────────────────────────────────

describe("hydrationColour", () => {
  it("green for well-hydrated", () => expect(hydrationColour("well-hydrated")).toBe("#22c55e"));
  it("blue for adequate", () => expect(hydrationColour("adequate")).toBe("#3b82f6"));
  it("amber for low", () => expect(hydrationColour("low")).toBe("#f59e0b"));
  it("red for dehydrated", () => expect(hydrationColour("dehydrated")).toBe("#ef4444"));
});

// ─── DEFAULT_DAILY_TARGET_ML ─────────────────────────────────────────────────

describe("DEFAULT_DAILY_TARGET_ML", () => {
  it("is 2500", () => expect(DEFAULT_DAILY_TARGET_ML).toBe(2500));
});

// ─── computeHourlyHydration ──────────────────────────────────────────────────

describe("computeHourlyHydration", () => {
  it("groups entries by hour", () => {
    const entries = makeHydration([250, 300, 200], 8);
    const hourly = computeHourlyHydration(entries);
    expect(hourly.length).toBeGreaterThanOrEqual(1);
    expect(hourly.reduce((s, h) => s + h.totalMl, 0)).toBe(750);
  });

  it("returns empty for no entries", () => {
    expect(computeHourlyHydration([])).toEqual([]);
  });

  it("sorts by hour ascending", () => {
    const entries = [
      ...makeHydration([200], 14),
      ...makeHydration([300], 8),
    ];
    const hourly = computeHourlyHydration(entries);
    expect(hourly[0].hour).toBeLessThan(hourly[hourly.length - 1].hour);
  });
});

// ─── computeHydrationCorrelation ─────────────────────────────────────────────

describe("computeHydrationCorrelation", () => {
  it("correlates hydration with glucose readings", () => {
    const hydration = makeHydration([500, 500, 500, 500], 8);
    const glucose = makeGlucose([6.0, 6.5, 7.0, 7.5], 9);
    const corr = computeHydrationCorrelation(hydration, glucose, 2);
    expect(corr.length).toBeGreaterThan(0);
    expect(corr[0].readingCount).toBeGreaterThan(0);
  });

  it("returns empty when no glucose readings", () => {
    const hydration = makeHydration([300], 8);
    const corr = computeHydrationCorrelation(hydration, [], 2);
    expect(corr).toEqual([]);
  });
});

// ─── generateHydrationRecommendations ────────────────────────────────────────

describe("generateHydrationRecommendations", () => {
  it("warns about dehydration", () => {
    const recs = generateHydrationRecommendations("dehydrated", 20);
    expect(recs.some((r) => r.includes("Critically low"))).toBe(true);
    expect(recs.some((r) => r.includes("reminders"))).toBe(true);
  });

  it("suggests improvement for low hydration", () => {
    const recs = generateHydrationRecommendations("low", 45);
    expect(recs.some((r) => r.includes("below target"))).toBe(true);
  });

  it("encourages adequate hydration", () => {
    const recs = generateHydrationRecommendations("adequate", 70);
    expect(recs.some((r) => r.includes("could be improved"))).toBe(true);
  });

  it("praises well-hydrated status", () => {
    const recs = generateHydrationRecommendations("well-hydrated", 95);
    expect(recs.some((r) => r.includes("on target"))).toBe(true);
  });
});

// ─── generateHydrationReport ─────────────────────────────────────────────────

describe("generateHydrationReport", () => {
  it("generates a full report", () => {
    const hydration = makeHydration([300, 300, 300, 300, 300, 300, 300, 300], 8);
    const glucose = makeGlucose([6.0, 6.5, 7.0, 6.0], 9);
    const report = generateHydrationReport(hydration, glucose);
    expect(report.dailyTotalMl).toBe(2400);
    expect(report.dailyTarget).toBe(2500);
    expect(report.percentOfTarget).toBeCloseTo(96, 0);
    expect(report.hydrationStatus).toBe("well-hydrated");
    expect(report.hourlyBreakdown.length).toBeGreaterThan(0);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it("handles empty inputs", () => {
    const report = generateHydrationReport([], []);
    expect(report.dailyTotalMl).toBe(0);
    expect(report.hydrationStatus).toBe("dehydrated");
  });

  it("accepts custom target", () => {
    const hydration = makeHydration([500, 500], 10);
    const report = generateHydrationReport(hydration, [], 1000);
    expect(report.dailyTarget).toBe(1000);
    expect(report.hydrationStatus).toBe("well-hydrated");
  });
});
