/**
 * GluMira™ — weekly-summary.test.ts
 *
 * Unit tests for the weekly summary analytics module.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { describe, it, expect } from "vitest";
import {
  computeWeeklyGlucoseMetrics,
  computeWeeklyDoseMetrics,
  computeWeeklyMealMetrics,
  computeWeekScore,
  weekScoreLabel,
  generateWeeklySummary,
  type SimpleDose,
  type SimpleMeal,
} from "./weekly-summary";

// ─── computeWeeklyGlucoseMetrics ──────────────────────────────────────────────

describe("computeWeeklyGlucoseMetrics", () => {
  it("returns zeros for empty readings", () => {
    const result = computeWeeklyGlucoseMetrics([]);
    expect(result.meanMmol).toBe(0);
    expect(result.tirPercent).toBe(0);
    expect(result.readingCount).toBe(0);
  });

  it("computes mean correctly", () => {
    const result = computeWeeklyGlucoseMetrics([4.0, 6.0, 8.0]);
    expect(result.meanMmol).toBeCloseTo(6.0, 1);
  });

  it("computes TIR correctly (3.9–10.0 mmol/L)", () => {
    const readings = [3.0, 5.0, 7.0, 11.0]; // 2 in range out of 4
    const result = computeWeeklyGlucoseMetrics(readings);
    expect(result.tirPercent).toBe(50.0);
  });

  it("computes hypo percent correctly (< 3.9)", () => {
    const readings = [3.0, 3.5, 6.0, 7.0]; // 2 hypo out of 4
    const result = computeWeeklyGlucoseMetrics(readings);
    expect(result.hypoPercent).toBe(50.0);
  });

  it("computes hyper percent correctly (> 10.0)", () => {
    const readings = [6.0, 7.0, 11.0, 12.0]; // 2 hyper out of 4
    const result = computeWeeklyGlucoseMetrics(readings);
    expect(result.hyperPercent).toBe(50.0);
  });

  it("computes CV correctly", () => {
    // All same value → CV = 0
    const result = computeWeeklyGlucoseMetrics([6.0, 6.0, 6.0, 6.0]);
    expect(result.cv).toBe(0);
  });

  it("returns readingCount", () => {
    const result = computeWeeklyGlucoseMetrics([5.0, 6.0, 7.0]);
    expect(result.readingCount).toBe(3);
  });
});

// ─── computeWeeklyDoseMetrics ─────────────────────────────────────────────────

describe("computeWeeklyDoseMetrics", () => {
  const doses: SimpleDose[] = [
    { units: 4, doseType: "bolus" },
    { units: 5, doseType: "bolus" },
    { units: 20, doseType: "basal" },
    { units: 2, doseType: "correction" },
  ];

  it("counts total doses", () => {
    expect(computeWeeklyDoseMetrics(doses).totalDoses).toBe(4);
  });

  it("sums total units", () => {
    expect(computeWeeklyDoseMetrics(doses).totalUnits).toBe(31);
  });

  it("computes average daily units", () => {
    const result = computeWeeklyDoseMetrics(doses, 7);
    expect(result.averageDailyUnits).toBeCloseTo(31 / 7, 1);
  });

  it("counts bolus, basal, correction separately", () => {
    const result = computeWeeklyDoseMetrics(doses);
    expect(result.bolusCount).toBe(2);
    expect(result.basalCount).toBe(1);
    expect(result.correctionCount).toBe(1);
  });

  it("handles empty doses", () => {
    const result = computeWeeklyDoseMetrics([]);
    expect(result.totalDoses).toBe(0);
    expect(result.totalUnits).toBe(0);
  });
});

// ─── computeWeeklyMealMetrics ─────────────────────────────────────────────────

describe("computeWeeklyMealMetrics", () => {
  const meals: SimpleMeal[] = [
    { carbsGrams: 40 },
    { carbsGrams: 60 },
    { carbsGrams: 50 },
  ];

  it("counts total meals", () => {
    expect(computeWeeklyMealMetrics(meals).totalMeals).toBe(3);
  });

  it("computes average daily carbs", () => {
    const result = computeWeeklyMealMetrics(meals, 7);
    expect(result.averageDailyCarbsGrams).toBe(Math.round(150 / 7));
  });

  it("computes average meal carbs", () => {
    const result = computeWeeklyMealMetrics(meals);
    expect(result.averageMealCarbsGrams).toBe(50);
  });

  it("returns zero averages for empty meals", () => {
    const result = computeWeeklyMealMetrics([]);
    expect(result.averageMealCarbsGrams).toBe(0);
  });
});

// ─── computeWeekScore ─────────────────────────────────────────────────────────

describe("computeWeekScore", () => {
  it("returns high score for excellent metrics", () => {
    const score = computeWeekScore({
      meanMmol: 6.5,
      tirPercent: 80,
      hypoPercent: 0,
      hyperPercent: 20,
      cv: 18,
      readingCount: 100,
    });
    expect(score).toBeGreaterThan(75);
  });

  it("returns low score for poor metrics", () => {
    const score = computeWeekScore({
      meanMmol: 12.0,
      tirPercent: 20,
      hypoPercent: 10,
      hyperPercent: 70,
      cv: 50,
      readingCount: 100,
    });
    expect(score).toBeLessThan(40);
  });

  it("score is between 0 and 100", () => {
    const score = computeWeekScore({
      meanMmol: 6.0,
      tirPercent: 70,
      hypoPercent: 2,
      hyperPercent: 28,
      cv: 25,
      readingCount: 80,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ─── weekScoreLabel ───────────────────────────────────────────────────────────

describe("weekScoreLabel", () => {
  it("labels 80+ as excellent", () => {
    expect(weekScoreLabel(85)).toBe("excellent");
  });
  it("labels 60–79 as good", () => {
    expect(weekScoreLabel(65)).toBe("good");
  });
  it("labels 40–59 as fair", () => {
    expect(weekScoreLabel(45)).toBe("fair");
  });
  it("labels < 40 as needs-attention", () => {
    expect(weekScoreLabel(30)).toBe("needs-attention");
  });
});

// ─── generateWeeklySummary ────────────────────────────────────────────────────

describe("generateWeeklySummary", () => {
  const weekStart = new Date("2026-03-20T00:00:00.000Z");
  const readings = Array.from({ length: 96 }, () => 6.5 + (Math.random() - 0.5) * 2);
  const doses: SimpleDose[] = Array.from({ length: 21 }, (_, i) => ({
    units: i % 3 === 0 ? 20 : 4,
    doseType: i % 3 === 0 ? "basal" : "bolus",
  }));
  const meals: SimpleMeal[] = Array.from({ length: 21 }, () => ({ carbsGrams: 50 }));

  it("returns a summary with weekStartDate and weekEndDate", () => {
    const summary = generateWeeklySummary(weekStart, readings, doses, meals);
    expect(summary.weekStartDate).toBe("2026-03-20");
    expect(summary.weekEndDate).toBe("2026-03-26");
  });

  it("includes glucose, doses, and meals deltas", () => {
    const summary = generateWeeklySummary(weekStart, readings, doses, meals);
    expect(summary.glucose.current).toBeDefined();
    expect(summary.doses.current).toBeDefined();
    expect(summary.meals.current).toBeDefined();
  });

  it("sets trend to no-data when no previous data", () => {
    const summary = generateWeeklySummary(weekStart, readings, doses, meals);
    expect(summary.glucose.trend).toBe("no-data");
  });

  it("computes trend when previous data provided", () => {
    const prevReadings = Array.from({ length: 96 }, () => 8.0); // worse TIR
    const summary = generateWeeklySummary(weekStart, readings, doses, meals, prevReadings, doses, meals);
    expect(["up", "down", "stable"]).toContain(summary.glucose.trend);
  });

  it("includes highlights array", () => {
    const summary = generateWeeklySummary(weekStart, readings, doses, meals);
    expect(summary.highlights).toBeInstanceOf(Array);
    expect(summary.highlights.length).toBeGreaterThan(0);
  });

  it("score is between 0 and 100", () => {
    const summary = generateWeeklySummary(weekStart, readings, doses, meals);
    expect(summary.score).toBeGreaterThanOrEqual(0);
    expect(summary.score).toBeLessThanOrEqual(100);
  });

  it("scoreLabel is a valid label", () => {
    const summary = generateWeeklySummary(weekStart, readings, doses, meals);
    expect(["excellent", "good", "fair", "needs-attention"]).toContain(summary.scoreLabel);
  });
});
