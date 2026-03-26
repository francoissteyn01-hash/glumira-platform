import { describe, it, expect } from "vitest";
import { calculateICR, type ICRInput, type MealEvent } from "./icr-calculator";

/* ── helpers ─────────────────────────────────────────────────── */
const baseInput: ICRInput = {
  tdd: 40,
  insulinType: "rapid",
  diabetesType: "type1",
};

function mkMealHistory(mealType: string, count: number, carbsG: number, units: number): MealEvent[] {
  return Array.from({ length: count }, (_, i) => ({
    timestampUtc: new Date(Date.UTC(2026, 2, 15, 12, i * 10)).toISOString(),
    mealType: mealType as MealEvent["mealType"],
    carbsG,
    bolusUnits: units,
    preGlucoseMmol: 6.5,
    postGlucoseMmol: 7.0,
    hoursToPost: 3,
  }));
}

/* ── Structure ───────────────────────────────────────────────── */
describe("calculateICR — structure", () => {
  it("returns complete result", () => {
    const r = calculateICR(baseInput);
    expect(r.estimates.length).toBeGreaterThan(0);
    expect(r.bestEstimate).toBeGreaterThan(0);
    expect(r.disclaimer).toContain("NOT a medical device");
  });

  it("handles zero TDD", () => {
    const r = calculateICR({ ...baseInput, tdd: 0 });
    expect(r.bestEstimate).toBe(0);
  });
});

/* ── 500 Rule ────────────────────────────────────────────────── */
describe("calculateICR — 500 rule", () => {
  it("uses 500 rule", () => {
    const r = calculateICR(baseInput);
    expect(r.estimates.some((e) => e.method === "500 Rule")).toBe(true);
  });

  it("ICR = 500/40 = 12.5", () => {
    const r = calculateICR(baseInput);
    const e500 = r.estimates.find((e) => e.method === "500 Rule")!;
    expect(e500.icrValue).toBe(12.5);
  });

  it("best estimate for rapid is 500 rule", () => {
    const r = calculateICR(baseInput);
    expect(r.bestEstimate).toBe(12.5);
  });
});

/* ── 450 Rule ────────────────────────────────────────────────── */
describe("calculateICR — 450 rule", () => {
  it("uses 450 rule for regular insulin", () => {
    const r = calculateICR({ ...baseInput, insulinType: "regular" });
    expect(r.estimates.some((e) => e.method === "450 Rule")).toBe(true);
  });

  it("best estimate for regular is 450 rule", () => {
    const r = calculateICR({ ...baseInput, insulinType: "regular" });
    expect(r.bestEstimate).toBeCloseTo(11.3, 0);
  });
});

/* ── TDD scaling ─────────────────────────────────────────────── */
describe("calculateICR — TDD scaling", () => {
  it("higher TDD = lower ICR", () => {
    const low = calculateICR({ ...baseInput, tdd: 20 });
    const high = calculateICR({ ...baseInput, tdd: 80 });
    expect(high.bestEstimate).toBeLessThan(low.bestEstimate);
  });
});

/* ── Meal-specific ICR ───────────────────────────────────────── */
describe("calculateICR — meal-specific", () => {
  it("calculates from meal history", () => {
    const r = calculateICR({
      ...baseInput,
      mealHistory: mkMealHistory("lunch", 5, 60, 5),
    });
    expect(r.mealSpecificICR.length).toBeGreaterThan(0);
    expect(r.mealSpecificICR[0].empiricalICR).toBeCloseTo(12, 0);
  });

  it("empty without meal history", () => {
    const r = calculateICR(baseInput);
    expect(r.mealSpecificICR.length).toBe(0);
  });

  it("high confidence with 5+ meals", () => {
    const r = calculateICR({
      ...baseInput,
      mealHistory: mkMealHistory("lunch", 6, 60, 5),
    });
    expect(r.mealSpecificICR[0].confidence).toBe("high");
  });
});

/* ── Time of day factors ─────────────────────────────────────── */
describe("calculateICR — time of day", () => {
  it("includes meal periods", () => {
    const r = calculateICR(baseInput);
    expect(r.timeOfDayFactors.length).toBe(4);
  });

  it("breakfast needs more insulin", () => {
    const r = calculateICR(baseInput);
    const breakfast = r.timeOfDayFactors.find((t) => t.period === "Breakfast")!;
    expect(breakfast.adjustment).toContain("lower ICR");
  });
});

/* ── Recommendations ─────────────────────────────────────────── */
describe("calculateICR — recommendations", () => {
  it("always recommends testing ICR", () => {
    const r = calculateICR(baseInput);
    expect(r.recommendations.some((rec) => rec.includes("Test your ICR"))).toBe(true);
  });

  it("type 2 note", () => {
    const r = calculateICR({ ...baseInput, diabetesType: "type2" });
    expect(r.recommendations.some((rec) => rec.includes("Type 2"))).toBe(true);
  });
});

/* ── Warnings ────────────────────────────────────────────────── */
describe("calculateICR — warnings", () => {
  it("warns for very low TDD", () => {
    const r = calculateICR({ ...baseInput, tdd: 5 });
    expect(r.warnings.some((w) => w.includes("Very low TDD"))).toBe(true);
  });

  it("warns for very high ICR", () => {
    const r = calculateICR({ ...baseInput, tdd: 15 });
    expect(r.warnings.some((w) => w.includes("Very high ICR"))).toBe(true);
  });
});
