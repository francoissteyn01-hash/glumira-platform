/**
 * GluMira™ — carb-counter.test.ts
 *
 * Unit tests for the carb-counter module.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { describe, it, expect } from "vitest";
import {
  estimateCarbs,
  lookupFood,
  sumCarbs,
  sumNetCarbs,
  averageGlycaemicLoad,
  recommendIcrDose,
  classifyGlycaemicLoad,
  carbsToGlucoseRise,
  FOOD_DB,
  type FoodItem,
} from "./carb-counter";

// ─── estimateCarbs ────────────────────────────────────────────────────────────

describe("estimateCarbs", () => {
  const whiteBread: FoodItem = {
    name: "white bread",
    servingGrams: 30,
    carbsPer100g: 49,
    fibrePer100g: 2.7,
    glycaemicIndex: 75,
  };

  it("computes totalCarbs correctly", () => {
    // 30g × 49/100 = 14.7g
    const est = estimateCarbs(whiteBread);
    expect(est.totalCarbs).toBeCloseTo(14.7, 1);
  });

  it("computes netCarbs = totalCarbs - fibre", () => {
    // fibre = 30g × 2.7/100 = 0.81g → netCarbs = 14.7 - 0.81 ≈ 13.9
    const est = estimateCarbs(whiteBread);
    expect(est.netCarbs).toBeCloseTo(13.9, 0);
  });

  it("computes glycaemicLoad = (GI × netCarbs) / 100", () => {
    const est = estimateCarbs(whiteBread);
    const expectedGL = (75 * est.netCarbs) / 100;
    expect(est.glycaemicLoad).toBeCloseTo(expectedGL, 1);
  });

  it("uses custom serving size when provided", () => {
    const est = estimateCarbs(whiteBread, 60);
    expect(est.servingGrams).toBe(60);
    expect(est.totalCarbs).toBeCloseTo(29.4, 1);
  });

  it("returns 0 netCarbs when fibre exceeds carbs", () => {
    const highFibre: FoodItem = {
      name: "test",
      servingGrams: 100,
      carbsPer100g: 5,
      fibrePer100g: 10,
    };
    const est = estimateCarbs(highFibre);
    expect(est.netCarbs).toBe(0);
  });

  it("uses default GI of 55 when not provided", () => {
    const noGI: FoodItem = { name: "test", servingGrams: 100, carbsPer100g: 20 };
    const est = estimateCarbs(noGI);
    // GL = (55 × 20) / 100 = 11
    expect(est.glycaemicLoad).toBeCloseTo(11, 1);
  });
});

// ─── lookupFood ───────────────────────────────────────────────────────────────

describe("lookupFood", () => {
  it("finds white bread by exact name", () => {
    const food = lookupFood("white bread");
    expect(food).not.toBeUndefined();
    expect(food!.name).toBe("white bread");
  });

  it("finds food by partial name (case-insensitive)", () => {
    const food = lookupFood("RICE");
    expect(food).not.toBeUndefined();
  });

  it("returns undefined for unknown food", () => {
    expect(lookupFood("unicorn meat")).toBeUndefined();
  });

  it("finds banana", () => {
    const food = lookupFood("banana");
    expect(food).not.toBeUndefined();
    expect(food!.carbsPer100g).toBeGreaterThan(0);
  });
});

// ─── sumCarbs / sumNetCarbs ───────────────────────────────────────────────────

describe("sumCarbs", () => {
  it("returns 0 for empty array", () => {
    expect(sumCarbs([])).toBe(0);
  });

  it("sums totalCarbs correctly", () => {
    const estimates = [
      { totalCarbs: 14.7, netCarbs: 13.9, glycaemicLoad: 10.4, servingGrams: 30 },
      { totalCarbs: 42.0, netCarbs: 41.4, glycaemicLoad: 29.8, servingGrams: 150 },
    ];
    expect(sumCarbs(estimates)).toBeCloseTo(56.7, 1);
  });
});

describe("sumNetCarbs", () => {
  it("returns 0 for empty array", () => {
    expect(sumNetCarbs([])).toBe(0);
  });

  it("sums netCarbs correctly", () => {
    const estimates = [
      { totalCarbs: 14.7, netCarbs: 13.9, glycaemicLoad: 10.4, servingGrams: 30 },
      { totalCarbs: 42.0, netCarbs: 40.0, glycaemicLoad: 29.8, servingGrams: 150 },
    ];
    expect(sumNetCarbs(estimates)).toBeCloseTo(53.9, 1);
  });
});

// ─── averageGlycaemicLoad ─────────────────────────────────────────────────────

describe("averageGlycaemicLoad", () => {
  it("returns 0 for empty array", () => {
    expect(averageGlycaemicLoad([])).toBe(0);
  });

  it("computes average correctly", () => {
    const estimates = [
      { totalCarbs: 14.7, netCarbs: 13.9, glycaemicLoad: 10.0, servingGrams: 30 },
      { totalCarbs: 42.0, netCarbs: 40.0, glycaemicLoad: 20.0, servingGrams: 150 },
    ];
    expect(averageGlycaemicLoad(estimates)).toBeCloseTo(15.0, 1);
  });
});

// ─── recommendIcrDose ─────────────────────────────────────────────────────────

describe("recommendIcrDose", () => {
  it("computes carb dose correctly (50g carbs, ICR=10 → 5U)", () => {
    const rec = recommendIcrDose(50, 10);
    expect(rec.suggestedDose).toBe(5);
  });

  it("rounds to nearest 0.5U", () => {
    // 45g / 10 = 4.5U → rounds to 4.5
    const rec = recommendIcrDose(45, 10);
    expect(rec.suggestedDose).toBe(4.5);
  });

  it("adds correction dose when glucose is above target", () => {
    // carb dose = 50/10 = 5U; correction = (10 - 6) / 2.5 = 1.6U → total 6.5U
    const rec = recommendIcrDose(50, 10, 10.0, 6.0, 2.5);
    expect(rec.suggestedDose).toBeGreaterThan(5);
  });

  it("reduces dose when glucose is below target", () => {
    // carb dose = 50/10 = 5U; correction = (4 - 6) / 2.5 = -0.8U → total 4.5U
    const rec = recommendIcrDose(50, 10, 4.0, 6.0, 2.5);
    expect(rec.suggestedDose).toBeLessThan(5);
  });

  it("returns high confidence for ICR in [5, 20]", () => {
    const rec = recommendIcrDose(40, 10);
    expect(rec.confidence).toBe("high");
  });

  it("returns medium confidence for ICR outside [5, 20]", () => {
    const rec = recommendIcrDose(40, 25);
    expect(rec.confidence).toBe("medium");
  });

  it("never returns negative dose", () => {
    // Very low glucose, small meal
    const rec = recommendIcrDose(10, 10, 2.0, 6.0, 2.5);
    expect(rec.suggestedDose).toBeGreaterThanOrEqual(0);
  });

  it("throws for ICR <= 0", () => {
    expect(() => recommendIcrDose(50, 0)).toThrow();
    expect(() => recommendIcrDose(50, -5)).toThrow();
  });

  it("throws for negative carbs", () => {
    expect(() => recommendIcrDose(-10, 10)).toThrow();
  });
});

// ─── classifyGlycaemicLoad ────────────────────────────────────────────────────

describe("classifyGlycaemicLoad", () => {
  it("classifies GL < 10 as low", () => {
    expect(classifyGlycaemicLoad(5)).toBe("low");
    expect(classifyGlycaemicLoad(9.9)).toBe("low");
  });

  it("classifies GL 10–19 as medium", () => {
    expect(classifyGlycaemicLoad(10)).toBe("medium");
    expect(classifyGlycaemicLoad(19.9)).toBe("medium");
  });

  it("classifies GL >= 20 as high", () => {
    expect(classifyGlycaemicLoad(20)).toBe("high");
    expect(classifyGlycaemicLoad(50)).toBe("high");
  });
});

// ─── carbsToGlucoseRise ───────────────────────────────────────────────────────

describe("carbsToGlucoseRise", () => {
  it("returns 0 for 0 carbs", () => {
    expect(carbsToGlucoseRise(0)).toBe(0);
  });

  it("uses default sensitivity factor of 0.2", () => {
    // 50g × 0.2 = 10 mmol/L
    expect(carbsToGlucoseRise(50)).toBe(10);
  });

  it("uses custom sensitivity factor", () => {
    // 50g × 0.15 = 7.5 mmol/L
    expect(carbsToGlucoseRise(50, 0.15)).toBe(7.5);
  });

  it("scales linearly with carbs", () => {
    const r1 = carbsToGlucoseRise(20);
    const r2 = carbsToGlucoseRise(40);
    expect(r2).toBeCloseTo(r1 * 2, 1);
  });
});

// ─── FOOD_DB integrity ────────────────────────────────────────────────────────

describe("FOOD_DB", () => {
  it("contains at least 10 food items", () => {
    expect(FOOD_DB.length).toBeGreaterThanOrEqual(10);
  });

  it("all items have positive carbsPer100g", () => {
    for (const food of FOOD_DB) {
      expect(food.carbsPer100g).toBeGreaterThan(0);
    }
  });

  it("all items have positive servingGrams", () => {
    for (const food of FOOD_DB) {
      expect(food.servingGrams).toBeGreaterThan(0);
    }
  });
});
