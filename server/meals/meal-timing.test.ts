/**
 * GluMira™ — meal-timing.test.ts
 *
 * Unit tests for the meal timing analysis module.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { describe, it, expect } from "vitest";
import {
  analyseMealPatterns,
  analysePreBolusTiming,
  analysePostMealExcursions,
  generateMealTimingReport,
  type MealEvent,
  type DoseEvent,
  type PostMealGlucoseEvent,
} from "./meal-timing";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDate(hour: number, minute = 0, dayOffset = 0): Date {
  const d = new Date("2026-03-20T00:00:00.000Z");
  d.setUTCDate(d.getUTCDate() + dayOffset);
  d.setUTCHours(hour, minute, 0, 0);
  return d;
}

// ─── analyseMealPatterns ──────────────────────────────────────────────────────

describe("analyseMealPatterns", () => {
  it("returns empty array for no meals", () => {
    expect(analyseMealPatterns([])).toEqual([]);
  });

  it("groups meals by type", () => {
    const meals: MealEvent[] = [
      { eatenAt: makeDate(8, 0), carbsGrams: 40, mealType: "breakfast" },
      { eatenAt: makeDate(8, 5), carbsGrams: 45, mealType: "breakfast" },
      { eatenAt: makeDate(12, 0), carbsGrams: 60, mealType: "lunch" },
    ];
    const result = analyseMealPatterns(meals);
    expect(result).toHaveLength(2);
    const breakfast = result.find((p) => p.mealType === "breakfast");
    expect(breakfast).toBeDefined();
    expect(breakfast!.count).toBe(2);
  });

  it("marks consistent meals when SD < 30 min", () => {
    const meals: MealEvent[] = [
      { eatenAt: makeDate(8, 0), carbsGrams: 40, mealType: "breakfast" },
      { eatenAt: makeDate(8, 10), carbsGrams: 42, mealType: "breakfast" },
      { eatenAt: makeDate(8, 5), carbsGrams: 38, mealType: "breakfast" },
    ];
    const result = analyseMealPatterns(meals);
    expect(result[0].consistency).toBe("consistent");
  });

  it("marks irregular meals when SD >= 60 min", () => {
    const meals: MealEvent[] = [
      { eatenAt: makeDate(7, 0), carbsGrams: 40, mealType: "breakfast" },
      { eatenAt: makeDate(10, 0), carbsGrams: 42, mealType: "breakfast" },
      { eatenAt: makeDate(6, 0), carbsGrams: 38, mealType: "breakfast" },
    ];
    const result = analyseMealPatterns(meals);
    expect(result[0].consistency).toBe("irregular");
  });

  it("defaults mealType to snack when not provided", () => {
    const meals: MealEvent[] = [
      { eatenAt: makeDate(15, 0), carbsGrams: 20 },
    ];
    const result = analyseMealPatterns(meals);
    expect(result[0].mealType).toBe("snack");
  });

  it("computes average carbs correctly", () => {
    const meals: MealEvent[] = [
      { eatenAt: makeDate(8, 0), carbsGrams: 40, mealType: "breakfast" },
      { eatenAt: makeDate(8, 0), carbsGrams: 60, mealType: "breakfast" },
    ];
    const result = analyseMealPatterns(meals);
    expect(result[0].averageCarbsGrams).toBe(50);
  });
});

// ─── analysePreBolusTiming ────────────────────────────────────────────────────

describe("analysePreBolusTiming", () => {
  it("returns null for empty meals", () => {
    expect(analysePreBolusTiming([], [], 60)).toBeNull();
  });

  it("returns null when no bolus doses", () => {
    const meals: MealEvent[] = [{ eatenAt: makeDate(8, 0), carbsGrams: 40 }];
    const doses: DoseEvent[] = [{ administeredAt: makeDate(8, 0), doseUnits: 4, doseType: "basal" }];
    expect(analysePreBolusTiming(meals, doses)).toBeNull();
  });

  it("detects optimal pre-bolus timing (10–20 min before meal)", () => {
    const meals: MealEvent[] = [
      { eatenAt: makeDate(8, 15), carbsGrams: 40 },
      { eatenAt: makeDate(12, 15), carbsGrams: 60 },
    ];
    const doses: DoseEvent[] = [
      { administeredAt: makeDate(8, 0), doseUnits: 4, doseType: "bolus" },
      { administeredAt: makeDate(12, 0), doseUnits: 5, doseType: "bolus" },
    ];
    const result = analysePreBolusTiming(meals, doses);
    expect(result).not.toBeNull();
    expect(result!.adequacy).toBe("optimal");
  });

  it("detects too-late bolus (dose after meal)", () => {
    const meals: MealEvent[] = [
      { eatenAt: makeDate(8, 0), carbsGrams: 40 },
    ];
    const doses: DoseEvent[] = [
      { administeredAt: makeDate(8, 10), doseUnits: 4, doseType: "bolus" }, // 10 min after meal
    ];
    const result = analysePreBolusTiming(meals, doses);
    expect(result!.adequacy).toBe("too-late");
  });

  it("detects too-early bolus (> 20 min before meal)", () => {
    const meals: MealEvent[] = [
      { eatenAt: makeDate(8, 30), carbsGrams: 40 },
    ];
    const doses: DoseEvent[] = [
      { administeredAt: makeDate(8, 0), doseUnits: 4, doseType: "bolus" }, // 30 min before meal
    ];
    const result = analysePreBolusTiming(meals, doses);
    expect(result!.adequacy).toBe("too-early");
  });

  it("returns events count", () => {
    const meals: MealEvent[] = [
      { eatenAt: makeDate(8, 15), carbsGrams: 40 },
      { eatenAt: makeDate(12, 15), carbsGrams: 60 },
    ];
    const doses: DoseEvent[] = [
      { administeredAt: makeDate(8, 0), doseUnits: 4, doseType: "bolus" },
      { administeredAt: makeDate(12, 0), doseUnits: 5, doseType: "bolus" },
    ];
    const result = analysePreBolusTiming(meals, doses);
    expect(result!.events).toBe(2);
  });
});

// ─── analysePostMealExcursions ────────────────────────────────────────────────

describe("analysePostMealExcursions", () => {
  it("returns null for empty events", () => {
    expect(analysePostMealExcursions([])).toBeNull();
  });

  it("classifies mild excursions (avg rise < 2 mmol/L)", () => {
    const events: PostMealGlucoseEvent[] = [
      { mealAt: makeDate(8, 0), glucoseAt: makeDate(9, 0), glucoseMmol: 7.5, preMealMmol: 6.0 },
      { mealAt: makeDate(12, 0), glucoseAt: makeDate(13, 0), glucoseMmol: 8.0, preMealMmol: 6.5 },
    ];
    const result = analysePostMealExcursions(events);
    expect(result!.severity).toBe("mild");
  });

  it("classifies significant excursions (avg rise >= 4 mmol/L)", () => {
    const events: PostMealGlucoseEvent[] = [
      { mealAt: makeDate(8, 0), glucoseAt: makeDate(9, 0), glucoseMmol: 14.0, preMealMmol: 6.0 },
      { mealAt: makeDate(12, 0), glucoseAt: makeDate(13, 0), glucoseMmol: 15.0, preMealMmol: 6.5 },
    ];
    const result = analysePostMealExcursions(events);
    expect(result!.severity).toBe("significant");
  });

  it("counts excursions above 10 mmol/L", () => {
    const events: PostMealGlucoseEvent[] = [
      { mealAt: makeDate(8, 0), glucoseAt: makeDate(9, 0), glucoseMmol: 11.0, preMealMmol: 6.0 },
      { mealAt: makeDate(12, 0), glucoseAt: makeDate(13, 0), glucoseMmol: 9.0, preMealMmol: 6.0 },
    ];
    const result = analysePostMealExcursions(events);
    expect(result!.excursionsAbove10).toBe(1);
  });

  it("computes average peak time in minutes", () => {
    const events: PostMealGlucoseEvent[] = [
      { mealAt: makeDate(8, 0), glucoseAt: makeDate(9, 0), glucoseMmol: 9.0, preMealMmol: 6.0 }, // 60 min
      { mealAt: makeDate(12, 0), glucoseAt: makeDate(13, 0), glucoseMmol: 9.0, preMealMmol: 6.0 }, // 60 min
    ];
    const result = analysePostMealExcursions(events);
    expect(result!.averagePeakTime).toBe(60);
  });
});

// ─── generateMealTimingReport ─────────────────────────────────────────────────

describe("generateMealTimingReport", () => {
  it("returns a report with recommendations", () => {
    const meals: MealEvent[] = [
      { eatenAt: makeDate(8, 0), carbsGrams: 40, mealType: "breakfast" },
      { eatenAt: makeDate(12, 0), carbsGrams: 60, mealType: "lunch" },
    ];
    const doses: DoseEvent[] = [
      { administeredAt: makeDate(8, 10), doseUnits: 4, doseType: "bolus" },
      { administeredAt: makeDate(12, 10), doseUnits: 5, doseType: "bolus" },
    ];
    const postMeal: PostMealGlucoseEvent[] = [
      { mealAt: makeDate(8, 0), glucoseAt: makeDate(9, 0), glucoseMmol: 8.0, preMealMmol: 6.5 },
    ];
    const report = generateMealTimingReport(meals, doses, postMeal);
    expect(report.recommendations).toBeInstanceOf(Array);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it("includes patterns in report", () => {
    const meals: MealEvent[] = [
      { eatenAt: makeDate(8, 0), carbsGrams: 40, mealType: "breakfast" },
    ];
    const report = generateMealTimingReport(meals, [], []);
    expect(report.patterns).toHaveLength(1);
  });

  it("returns null preBolusAnalysis when no doses", () => {
    const meals: MealEvent[] = [{ eatenAt: makeDate(8, 0), carbsGrams: 40 }];
    const report = generateMealTimingReport(meals, [], []);
    expect(report.preBolusAnalysis).toBeNull();
  });

  it("returns null postMealExcursions when no events", () => {
    const report = generateMealTimingReport([], [], []);
    expect(report.postMealExcursions).toBeNull();
  });

  it("adds recommendation for too-late bolus", () => {
    const meals: MealEvent[] = [{ eatenAt: makeDate(8, 0), carbsGrams: 40 }];
    const doses: DoseEvent[] = [
      { administeredAt: makeDate(8, 15), doseUnits: 4, doseType: "bolus" }, // 15 min after
    ];
    const report = generateMealTimingReport(meals, doses, []);
    expect(report.recommendations.some((r) => r.includes("too late") || r.includes("10–20 min"))).toBe(true);
  });

  it("adds recommendation for significant excursions", () => {
    const meals: MealEvent[] = [{ eatenAt: makeDate(8, 0), carbsGrams: 60 }];
    const postMeal: PostMealGlucoseEvent[] = [
      { mealAt: makeDate(8, 0), glucoseAt: makeDate(9, 0), glucoseMmol: 15.0, preMealMmol: 6.0 },
      { mealAt: makeDate(12, 0), glucoseAt: makeDate(13, 0), glucoseMmol: 14.0, preMealMmol: 6.0 },
    ];
    const report = generateMealTimingReport(meals, [], postMeal);
    expect(report.recommendations.some((r) => r.includes("excursion") || r.includes("ICR"))).toBe(true);
  });
});
