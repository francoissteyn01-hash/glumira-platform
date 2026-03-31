import { describe, expect, it } from "vitest";
import {
  MEAL_REGIMES,
  getMealRegime,
  getRegimesByCategory,
  getActiveRegimes,
  getFastingRegimes,
  getMealCategories,
  searchRegimes,
} from "./meal-regimes";

describe("Meal Regimes Library", () => {
  it("contains exactly 20 profiles", () => {
    expect(MEAL_REGIMES.length).toBe(20);
  });

  it("every regime has a unique ID", () => {
    const ids = MEAL_REGIMES.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every regime has at least one meal", () => {
    for (const r of MEAL_REGIMES) {
      expect(r.meals.length).toBeGreaterThan(0);
    }
  });

  it("every meal has valid time windows", () => {
    for (const r of MEAL_REGIMES) {
      for (const m of r.meals) {
        expect(m.timeWindow.start).toMatch(/^\d{2}:\d{2}$/);
        expect(m.timeWindow.end).toMatch(/^\d{2}:\d{2}$/);
      }
    }
  });

  it("every meal has valid carb ranges (min <= max, both >= 0)", () => {
    for (const r of MEAL_REGIMES) {
      for (const m of r.meals) {
        expect(m.carbRange.min).toBeGreaterThanOrEqual(0);
        expect(m.carbRange.max).toBeGreaterThanOrEqual(m.carbRange.min);
      }
    }
  });

  it("every regime has valid thresholds (hypo < hyper)", () => {
    for (const r of MEAL_REGIMES) {
      expect(r.hypoThreshold).toBeLessThan(r.hyperThreshold);
    }
  });
});

describe("getMealRegime", () => {
  it("returns regime by ID", () => {
    const r = getMealRegime("ramadan");
    expect(r).toBeDefined();
    expect(r!.name).toBe("Ramadan Fasting");
  });

  it("returns undefined for unknown ID", () => {
    expect(getMealRegime("nonexistent")).toBeUndefined();
  });
});

describe("getRegimesByCategory", () => {
  it("returns cultural regimes", () => {
    const cultural = getRegimesByCategory("cultural");
    expect(cultural.length).toBeGreaterThan(0);
    for (const r of cultural) {
      expect(r.category).toBe("cultural");
    }
  });

  it("returns pediatric regimes", () => {
    const pediatric = getRegimesByCategory("pediatric");
    expect(pediatric.length).toBeGreaterThanOrEqual(2);
  });

  it("returns religious-fasting regimes", () => {
    const fasting = getRegimesByCategory("religious-fasting");
    expect(fasting.length).toBeGreaterThanOrEqual(2);
  });
});

describe("getActiveRegimes", () => {
  it("returns all active regimes", () => {
    const active = getActiveRegimes();
    expect(active.length).toBe(20); // all are active by default
  });
});

describe("getFastingRegimes", () => {
  it("returns regimes with fasting config", () => {
    const fasting = getFastingRegimes();
    expect(fasting.length).toBeGreaterThanOrEqual(2);
    for (const r of fasting) {
      expect(r.fasting).toBeDefined();
    }
  });

  it("includes Ramadan", () => {
    const fasting = getFastingRegimes();
    expect(fasting.some(r => r.id === "ramadan")).toBe(true);
  });

  it("includes Yom Kippur", () => {
    const fasting = getFastingRegimes();
    expect(fasting.some(r => r.id === "yom-kippur")).toBe(true);
  });
});

describe("getMealCategories", () => {
  it("returns unique categories", () => {
    const cats = getMealCategories();
    expect(cats.length).toBeGreaterThan(0);
    expect(new Set(cats).size).toBe(cats.length);
  });
});

describe("searchRegimes", () => {
  it("finds by name", () => {
    const results = searchRegimes("ramadan");
    expect(results.length).toBeGreaterThan(0);
  });

  it("finds by description keyword", () => {
    const results = searchRegimes("pregnancy");
    expect(results.length).toBeGreaterThan(0);
  });

  it("returns empty for no match", () => {
    expect(searchRegimes("xyznonexistent")).toHaveLength(0);
  });

  it("is case-insensitive", () => {
    const a = searchRegimes("RAMADAN");
    const b = searchRegimes("ramadan");
    expect(a.length).toBe(b.length);
  });
});

describe("specific regime content", () => {
  it("Ramadan has Suhoor and Iftar meals", () => {
    const r = getMealRegime("ramadan")!;
    const names = r.meals.map(m => m.name);
    expect(names.some(n => n.includes("Suhoor"))).toBe(true);
    expect(names.some(n => n.includes("Iftar"))).toBe(true);
  });

  it("Yom Kippur has 25-hour fast", () => {
    const r = getMealRegime("yom-kippur")!;
    expect(r.fasting).toBeDefined();
    expect(r.fasting!.fastingHours).toBe(25);
  });

  it("Elderly has higher hypo threshold", () => {
    const r = getMealRegime("elderly")!;
    expect(r.hypoThreshold).toBeGreaterThanOrEqual(80);
  });

  it("Low-carb has tighter hyper threshold", () => {
    const r = getMealRegime("low-carb")!;
    expect(r.hyperThreshold).toBeLessThanOrEqual(160);
  });

  it("Southern African includes regional context", () => {
    const r = getMealRegime("southern-african")!;
    expect(r.name.toLowerCase()).toContain("southern african");
  });

  it("Gastroparesis uses post-meal dosing", () => {
    const r = getMealRegime("gastroparesis")!;
    for (const m of r.meals) {
      expect(m.insulinTiming).toBe("after");
    }
  });
});
