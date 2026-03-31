/**
 * GluMira — Carb Ratio (ICR) Optimizer Test Suite
 *
 * Tests estimateIcrFrom500Rule, computeEffectiveIcr, computeExcursion,
 * analyseIcr, computeMealTimeIcr, icrDirectionLabel, icrDirectionColour,
 * and confidenceLabel.
 */

import { describe, it, expect } from "vitest";
import {
  estimateIcrFrom500Rule,
  computeEffectiveIcr,
  computeExcursion,
  analyseIcr,
  computeMealTimeIcr,
  icrDirectionLabel,
  icrDirectionColour,
  confidenceLabel,
  type MealEvent,
} from "./carb-ratio-optimizer";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeMeal(overrides: Partial<MealEvent> = {}): MealEvent {
  return {
    carbsGrams: 50,
    bolusUnits: 5,
    preMealGlucose: 6.0,
    postMealGlucose: 8.0,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

function makeTimedMeal(hour: number, postMeal: number): MealEvent {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return makeMeal({ postMealGlucose: postMeal, timestamp: d.toISOString() });
}

// ─── estimateIcrFrom500Rule ──────────────────────────────────────────────────

describe("estimateIcrFrom500Rule", () => {
  it("returns 10 for TDD of 50", () => {
    expect(estimateIcrFrom500Rule(50)).toBe(10);
  });

  it("returns 25 for TDD of 20", () => {
    expect(estimateIcrFrom500Rule(20)).toBe(25);
  });

  it("returns 5 for TDD of 100", () => {
    expect(estimateIcrFrom500Rule(100)).toBe(5);
  });

  it("throws for zero TDD", () => {
    expect(() => estimateIcrFrom500Rule(0)).toThrow();
  });

  it("throws for negative TDD", () => {
    expect(() => estimateIcrFrom500Rule(-10)).toThrow();
  });
});

// ─── computeEffectiveIcr ─────────────────────────────────────────────────────

describe("computeEffectiveIcr", () => {
  it("returns carbs/bolus for normal meal", () => {
    const meal = makeMeal({ carbsGrams: 60, bolusUnits: 6 });
    expect(computeEffectiveIcr(meal)).toBe(10);
  });

  it("returns Infinity for zero bolus", () => {
    const meal = makeMeal({ bolusUnits: 0 });
    expect(computeEffectiveIcr(meal)).toBe(Infinity);
  });

  it("handles fractional values", () => {
    const meal = makeMeal({ carbsGrams: 45, bolusUnits: 4 });
    expect(computeEffectiveIcr(meal)).toBe(11.25);
  });
});

// ─── computeExcursion ────────────────────────────────────────────────────────

describe("computeExcursion", () => {
  it("returns positive for glucose rise", () => {
    const meal = makeMeal({ preMealGlucose: 5.0, postMealGlucose: 9.0 });
    expect(computeExcursion(meal)).toBe(4.0);
  });

  it("returns negative for glucose drop", () => {
    const meal = makeMeal({ preMealGlucose: 8.0, postMealGlucose: 5.0 });
    expect(computeExcursion(meal)).toBe(-3.0);
  });

  it("returns zero for no change", () => {
    const meal = makeMeal({ preMealGlucose: 6.0, postMealGlucose: 6.0 });
    expect(computeExcursion(meal)).toBe(0);
  });
});

// ─── analyseIcr ──────────────────────────────────────────────────────────────

describe("analyseIcr", () => {
  it("returns no-change for empty meals", () => {
    const result = analyseIcr([], 10);
    expect(result.direction).toBe("no-change");
    expect(result.confidence).toBe("low");
    expect(result.mealCount).toBe(0);
  });

  it("suggests tighten for consistently high post-meal", () => {
    const meals = Array.from({ length: 10 }, () =>
      makeMeal({ postMealGlucose: 14.0 })
    );
    const result = analyseIcr(meals, 10);
    expect(result.direction).toBe("tighten");
    expect(result.suggestedIcr).toBeLessThan(10);
  });

  it("suggests loosen for consistently low post-meal", () => {
    const meals = Array.from({ length: 10 }, () =>
      makeMeal({ postMealGlucose: 3.0 })
    );
    const result = analyseIcr(meals, 10);
    expect(result.direction).toBe("loosen");
    expect(result.suggestedIcr).toBeGreaterThan(10);
  });

  it("suggests no-change for in-range post-meal", () => {
    const meals = Array.from({ length: 10 }, () =>
      makeMeal({ postMealGlucose: 7.5 })
    );
    const result = analyseIcr(meals, 10);
    expect(result.direction).toBe("no-change");
    expect(result.suggestedIcr).toBe(10);
  });

  it("confidence is high for 10+ meals", () => {
    const meals = Array.from({ length: 12 }, () => makeMeal());
    const result = analyseIcr(meals, 10);
    expect(result.confidence).toBe("high");
  });

  it("confidence is moderate for 5-9 meals", () => {
    const meals = Array.from({ length: 7 }, () => makeMeal());
    const result = analyseIcr(meals, 10);
    expect(result.confidence).toBe("moderate");
  });

  it("confidence is low for < 5 meals", () => {
    const meals = Array.from({ length: 3 }, () => makeMeal());
    const result = analyseIcr(meals, 10);
    expect(result.confidence).toBe("low");
  });

  it("clamps suggestedIcr to minimum 2", () => {
    const meals = Array.from({ length: 10 }, () =>
      makeMeal({ postMealGlucose: 25.0 })
    );
    // Even with extreme tightening, ICR should not go below 2
    const result = analyseIcr(meals, 3);
    expect(result.suggestedIcr).toBeGreaterThanOrEqual(2);
  });

  it("clamps suggestedIcr to maximum 50", () => {
    const meals = Array.from({ length: 10 }, () =>
      makeMeal({ postMealGlucose: 2.0 })
    );
    const result = analyseIcr(meals, 45);
    expect(result.suggestedIcr).toBeLessThanOrEqual(50);
  });

  it("computes correct postMealMean", () => {
    const meals = [
      makeMeal({ postMealGlucose: 8.0 }),
      makeMeal({ postMealGlucose: 10.0 }),
    ];
    const result = analyseIcr(meals, 10);
    expect(result.postMealMean).toBe(9.0);
  });
});

// ─── computeMealTimeIcr ──────────────────────────────────────────────────────

describe("computeMealTimeIcr", () => {
  it("returns 4 periods", () => {
    const result = computeMealTimeIcr([], 10);
    expect(result).toHaveLength(4);
    expect(result.map((r) => r.period)).toEqual(["breakfast", "lunch", "dinner", "snack"]);
  });

  it("classifies breakfast meals correctly (hour 7)", () => {
    const meals = [makeTimedMeal(7, 12.0), makeTimedMeal(7, 13.0)];
    const result = computeMealTimeIcr(meals, 10);
    const breakfast = result.find((r) => r.period === "breakfast")!;
    expect(breakfast.mealCount).toBe(2);
  });

  it("classifies lunch meals correctly (hour 12)", () => {
    const meals = [makeTimedMeal(12, 9.0)];
    const result = computeMealTimeIcr(meals, 10);
    const lunch = result.find((r) => r.period === "lunch")!;
    expect(lunch.mealCount).toBe(1);
  });

  it("classifies dinner meals correctly (hour 19)", () => {
    const meals = [makeTimedMeal(19, 10.0), makeTimedMeal(18, 11.0)];
    const result = computeMealTimeIcr(meals, 10);
    const dinner = result.find((r) => r.period === "dinner")!;
    expect(dinner.mealCount).toBe(2);
  });

  it("classifies snack meals correctly (hour 22)", () => {
    const meals = [makeTimedMeal(22, 8.0)];
    const result = computeMealTimeIcr(meals, 10);
    const snack = result.find((r) => r.period === "snack")!;
    expect(snack.mealCount).toBe(1);
  });

  it("returns default ICR for empty periods", () => {
    const meals = [makeTimedMeal(7, 8.0)]; // only breakfast
    const result = computeMealTimeIcr(meals, 10);
    const lunch = result.find((r) => r.period === "lunch")!;
    expect(lunch.suggestedIcr).toBe(10);
    expect(lunch.mealCount).toBe(0);
  });
});

// ─── Label + Colour helpers ──────────────────────────────────────────────────

describe("icrDirectionLabel", () => {
  it("returns correct label for tighten", () => {
    expect(icrDirectionLabel("tighten")).toContain("more insulin");
  });

  it("returns correct label for loosen", () => {
    expect(icrDirectionLabel("loosen")).toContain("less insulin");
  });

  it("returns correct label for no-change", () => {
    expect(icrDirectionLabel("no-change")).toContain("appropriate");
  });

  it("returns Unknown for invalid", () => {
    expect(icrDirectionLabel("invalid")).toBe("Unknown");
  });
});

describe("icrDirectionColour", () => {
  it("returns amber for tighten", () => {
    expect(icrDirectionColour("tighten")).toBe("amber");
  });

  it("returns green for no-change", () => {
    expect(icrDirectionColour("no-change")).toBe("green");
  });

  it("returns gray for unknown", () => {
    expect(icrDirectionColour("unknown")).toBe("gray");
  });
});

describe("confidenceLabel", () => {
  it("returns correct label for high", () => {
    expect(confidenceLabel("high")).toContain("10+");
  });

  it("returns correct label for moderate", () => {
    expect(confidenceLabel("moderate")).toContain("5-9");
  });

  it("returns correct label for low", () => {
    expect(confidenceLabel("low")).toContain("fewer");
  });

  it("returns Unknown for invalid", () => {
    expect(confidenceLabel("invalid")).toBe("Unknown");
  });
});
