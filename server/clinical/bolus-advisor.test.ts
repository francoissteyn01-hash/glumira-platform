import { describe, it, expect } from "vitest";
import { calculateBolus, type BolusInput } from "./bolus-advisor";

/* ── helpers ─────────────────────────────────────────────────── */
const baseInput: BolusInput = {
  currentGlucoseMmol: 7.0,
  targetGlucoseMmol: 6.0,
  carbsG: 60,
  icr: 10,
  isf: 2.5,
  iob: 0,
  mealType: "standard",
  exercisePlanned: false,
  isPreBolus: false,
};

/* ── Structure ───────────────────────────────────────────────── */
describe("calculateBolus — structure", () => {
  it("returns complete result", () => {
    const r = calculateBolus(baseInput);
    expect(r.breakdown).toBeDefined();
    expect(r.strategy).toBeDefined();
    expect(r.disclaimer).toContain("NOT a medical device");
  });
});

/* ── Carb bolus ──────────────────────────────────────────────── */
describe("calculateBolus — carb bolus", () => {
  it("calculates carb bolus from ICR", () => {
    const r = calculateBolus(baseInput);
    expect(r.breakdown.carbBolus).toBe(6); // 60g / 10
  });

  it("zero carb bolus for no carbs", () => {
    const r = calculateBolus({ ...baseInput, carbsG: 0 });
    expect(r.breakdown.carbBolus).toBe(0);
  });

  it("scales with carb amount", () => {
    const r30 = calculateBolus({ ...baseInput, carbsG: 30 });
    const r90 = calculateBolus({ ...baseInput, carbsG: 90 });
    expect(r90.breakdown.carbBolus).toBeGreaterThan(r30.breakdown.carbBolus);
  });
});

/* ── Correction bolus ────────────────────────────────────────── */
describe("calculateBolus — correction", () => {
  it("adds correction for high glucose", () => {
    const input = { ...baseInput, currentGlucoseMmol: 12.0 };
    const r = calculateBolus(input);
    expect(r.breakdown.correctionBolus).toBeGreaterThan(0);
  });

  it("no correction at target", () => {
    const input = { ...baseInput, currentGlucoseMmol: 6.0 };
    const r = calculateBolus(input);
    expect(r.breakdown.correctionBolus).toBe(0);
  });

  it("no correction below target", () => {
    const input = { ...baseInput, currentGlucoseMmol: 4.5 };
    const r = calculateBolus(input);
    expect(r.breakdown.correctionBolus).toBe(0);
  });

  it("correction scales with ISF", () => {
    const r = calculateBolus({ ...baseInput, currentGlucoseMmol: 12.0 });
    expect(r.breakdown.correctionBolus).toBeCloseTo(2.4, 1); // (12-6)/2.5
  });
});

/* ── IOB adjustment ──────────────────────────────────────────── */
describe("calculateBolus — IOB", () => {
  it("subtracts IOB", () => {
    const r = calculateBolus({ ...baseInput, iob: 2 });
    expect(r.breakdown.iobAdjustment).toBeLessThan(0);
  });

  it("IOB capped at total bolus", () => {
    const r = calculateBolus({ ...baseInput, iob: 20 });
    // IOB adjustment should not exceed carb + correction
    expect(Math.abs(r.breakdown.iobAdjustment)).toBeLessThanOrEqual(
      r.breakdown.carbBolus + r.breakdown.correctionBolus
    );
  });

  it("no IOB adjustment when zero", () => {
    const r = calculateBolus(baseInput);
    expect(r.breakdown.iobAdjustment).toBe(0);
  });
});

/* ── Exercise adjustment ─────────────────────────────────────── */
describe("calculateBolus — exercise", () => {
  it("reduces for planned exercise", () => {
    const r = calculateBolus({
      ...baseInput,
      exercisePlanned: true,
      exerciseIntensity: "moderate",
      exerciseTimingHours: 1,
    });
    expect(r.breakdown.exerciseAdjustment).toBeLessThan(0);
  });

  it("vigorous exercise reduces more than light", () => {
    const light = calculateBolus({
      ...baseInput,
      exercisePlanned: true,
      exerciseIntensity: "light",
      exerciseTimingHours: 1,
    });
    const vigorous = calculateBolus({
      ...baseInput,
      exercisePlanned: true,
      exerciseIntensity: "vigorous",
      exerciseTimingHours: 1,
    });
    expect(vigorous.breakdown.exerciseAdjustment).toBeLessThan(light.breakdown.exerciseAdjustment);
  });

  it("no exercise adjustment when not planned", () => {
    const r = calculateBolus(baseInput);
    expect(r.breakdown.exerciseAdjustment).toBe(0);
  });
});

/* ── Total bolus ─────────────────────────────────────────────── */
describe("calculateBolus — total", () => {
  it("total is never negative", () => {
    const r = calculateBolus({ ...baseInput, iob: 50, carbsG: 5 });
    expect(r.suggestedDose).toBeGreaterThanOrEqual(0);
  });

  it("total combines all components", () => {
    const r = calculateBolus(baseInput);
    const expected = r.breakdown.carbBolus + r.breakdown.correctionBolus +
      r.breakdown.iobAdjustment + r.breakdown.exerciseAdjustment;
    expect(r.suggestedDose).toBeCloseTo(Math.max(0, expected), 0);
  });
});

/* ── Strategies ──────────────────────────────────────────────── */
describe("calculateBolus — strategy", () => {
  it("standard for normal meal", () => {
    const r = calculateBolus(baseInput);
    expect(r.strategy.type).toBe("standard");
    expect(r.strategy.upfrontPercent).toBe(100);
  });

  it("split for high-fat meal", () => {
    const r = calculateBolus({ ...baseInput, mealType: "high-fat" });
    expect(r.strategy.type).toBe("split");
    expect(r.strategy.upfrontPercent).toBeLessThan(100);
  });

  it("split for high-protein meal", () => {
    const r = calculateBolus({ ...baseInput, mealType: "high-protein" });
    expect(r.strategy.type).toBe("split");
  });

  it("extended for low-GI meal", () => {
    const r = calculateBolus({ ...baseInput, mealType: "low-gi" });
    expect(r.strategy.type).toBe("extended");
  });

  it("standard for liquid", () => {
    const r = calculateBolus({ ...baseInput, mealType: "liquid" });
    expect(r.strategy.type).toBe("standard");
  });

  it("upfront + extended = total", () => {
    const r = calculateBolus({ ...baseInput, mealType: "high-fat" });
    expect(r.upfrontDose + r.extendedDose).toBeCloseTo(r.suggestedDose, 0);
  });
});

/* ── Pre-bolus timing ────────────────────────────────────────── */
describe("calculateBolus — pre-bolus", () => {
  it("eat first for low glucose", () => {
    const r = calculateBolus({ ...baseInput, currentGlucoseMmol: 4.0 });
    expect(r.preBolusTiming).toContain("Eat first");
  });

  it("pre-bolus for high glucose", () => {
    const r = calculateBolus({ ...baseInput, currentGlucoseMmol: 12.0 });
    expect(r.preBolusTiming).toContain("pre-bolus");
  });

  it("custom pre-bolus timing", () => {
    const r = calculateBolus({ ...baseInput, isPreBolus: true, preBolusMinutes: 20 });
    expect(r.preBolusTiming).toContain("20 minutes");
  });
});

/* ── Warnings ────────────────────────────────────────────────── */
describe("calculateBolus — warnings", () => {
  it("warns for hypoglycemia", () => {
    const r = calculateBolus({ ...baseInput, currentGlucoseMmol: 3.0 });
    expect(r.warnings.some((w) => w.includes("HYPOGLYCEMIA"))).toBe(true);
  });

  it("warns for large bolus", () => {
    const r = calculateBolus({ ...baseInput, carbsG: 300 });
    expect(r.warnings.some((w) => w.includes("Large bolus"))).toBe(true);
  });

  it("warns for high IOB", () => {
    const r = calculateBolus({ ...baseInput, iob: 5 });
    expect(r.warnings.some((w) => w.includes("insulin on board"))).toBe(true);
  });
});
