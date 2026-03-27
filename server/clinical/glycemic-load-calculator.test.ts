import { describe, it, expect } from "vitest";
import { calculateMealGL, type FoodItem } from "./glycemic-load-calculator";

/* ── helpers ─────────────────────────────────────────────────── */
const lowGIFood: FoodItem = { name: "Lentils", gi: 32, carbsG: 20, servingSize: "1 cup", fiberG: 8 };
const medGIFood: FoodItem = { name: "Basmati rice", gi: 58, carbsG: 45, servingSize: "1 cup" };
const highGIFood: FoodItem = { name: "White bread", gi: 75, carbsG: 30, servingSize: "2 slices" };
const highGIFood2: FoodItem = { name: "Cornflakes", gi: 81, carbsG: 25, servingSize: "1 cup" };

/* ── Empty ───────────────────────────────────────────────────── */
describe("calculateMealGL — empty", () => {
  it("handles no foods", () => {
    const r = calculateMealGL([]);
    expect(r.totalGL).toBe(0);
    expect(r.foods.length).toBe(0);
  });
});

/* ── Single food GL ──────────────────────────────────────────── */
describe("calculateMealGL — single food", () => {
  it("calculates GL for low-GI food", () => {
    const r = calculateMealGL([lowGIFood]);
    expect(r.foods[0].gl).toBeGreaterThan(0);
    expect(r.foods[0].glCategory).toBe("low");
  });

  it("calculates GL for high-GI food", () => {
    const r = calculateMealGL([highGIFood]);
    expect(r.foods[0].gl).toBeGreaterThan(10);
    expect(r.foods[0].giCategory).toBe("high");
  });

  it("accounts for fiber in net carbs", () => {
    const r = calculateMealGL([lowGIFood]);
    expect(r.foods[0].netCarbsG).toBe(12); // 20 - 8
  });
});

/* ── GI classification ───────────────────────────────────────── */
describe("calculateMealGL — GI classification", () => {
  it("low GI <= 55", () => {
    const r = calculateMealGL([lowGIFood]);
    expect(r.foods[0].giCategory).toBe("low");
  });

  it("medium GI 56-69", () => {
    const r = calculateMealGL([medGIFood]);
    expect(r.foods[0].giCategory).toBe("medium");
  });

  it("high GI >= 70", () => {
    const r = calculateMealGL([highGIFood]);
    expect(r.foods[0].giCategory).toBe("high");
  });
});

/* ── Meal totals ─────────────────────────────────────────────── */
describe("calculateMealGL — meal totals", () => {
  it("sums GL across foods", () => {
    const r = calculateMealGL([lowGIFood, highGIFood]);
    expect(r.totalGL).toBeGreaterThan(r.foods[0].gl);
  });

  it("sums carbs", () => {
    const r = calculateMealGL([lowGIFood, highGIFood]);
    expect(r.totalCarbsG).toBe(50); // 20 + 30
  });

  it("calculates weighted average GI", () => {
    const r = calculateMealGL([lowGIFood, highGIFood]);
    expect(r.averageGI).toBeGreaterThan(32);
    expect(r.averageGI).toBeLessThan(75);
  });
});

/* ── Meal GL category ────────────────────────────────────────── */
describe("calculateMealGL — meal category", () => {
  it("low GL meal", () => {
    const r = calculateMealGL([lowGIFood]);
    expect(r.mealGLCategory).toBe("low");
  });

  it("high GL meal", () => {
    const r = calculateMealGL([highGIFood, highGIFood2, medGIFood]);
    expect(r.mealGLCategory).toBe("high");
  });
});

/* ── Recommendations ─────────────────────────────────────────── */
describe("calculateMealGL — recommendations", () => {
  it("positive for low GL", () => {
    const r = calculateMealGL([lowGIFood]);
    expect(r.recommendations.some((rec) => rec.includes("Great choice"))).toBe(true);
  });

  it("warns for high GL", () => {
    const r = calculateMealGL([highGIFood, highGIFood2, medGIFood]);
    expect(r.recommendations.some((rec) => rec.includes("high glycemic load"))).toBe(true);
  });

  it("identifies high-GI foods", () => {
    const r = calculateMealGL([highGIFood]);
    expect(r.recommendations.some((rec) => rec.includes("White bread"))).toBe(true);
  });
});

/* ── Swap suggestions ────────────────────────────────────────── */
describe("calculateMealGL — swaps", () => {
  it("suggests swaps for known high-GI foods", () => {
    const r = calculateMealGL([highGIFood]);
    expect(r.swapSuggestions.some((s) => s.includes("whole grain"))).toBe(true);
  });

  it("suggests cornflakes swap", () => {
    const r = calculateMealGL([highGIFood2]);
    expect(r.swapSuggestions.some((s) => s.includes("oatmeal"))).toBe(true);
  });

  it("no swaps for low-GI foods", () => {
    const r = calculateMealGL([lowGIFood]);
    expect(r.swapSuggestions.length).toBe(0);
  });
});

/* ── Disclaimer ──────────────────────────────────────────────── */
describe("calculateMealGL — disclaimer", () => {
  it("includes disclaimer", () => {
    const r = calculateMealGL([lowGIFood]);
    expect(r.disclaimer).toContain("educational platform");
  });
});
