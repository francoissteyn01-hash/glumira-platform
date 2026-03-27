/**
 * GluMira™ — bolus-calculator.test.ts
 *
 * Unit tests for the bolus calculator module.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { describe, it, expect } from "vitest";
import {
  computeBolus,
  computeCorrectionBolus,
  computeSuperBolus,
  roundDose,
  classifyDoseSize,
} from "./bolus-calculator";

// ─── computeBolus ─────────────────────────────────────────────────────────────

describe("computeBolus", () => {
  const base = {
    carbsGrams: 60,
    currentGlucose: 7.0,
    targetGlucose: 6.0,
    icr: 10,
    isf: 2.5,
    activeIob: 0,
  };

  it("computes meal dose = carbs / ICR", () => {
    const result = computeBolus(base);
    expect(result.mealDose).toBeCloseTo(6.0, 2);
  });

  it("computes correction dose = (current - target) / ISF", () => {
    // (7.0 - 6.0) / 2.5 = 0.4U
    const result = computeBolus(base);
    expect(result.correctionDose).toBeCloseTo(0.4, 2);
  });

  it("total dose = meal + correction when IOB = 0", () => {
    const result = computeBolus(base);
    expect(result.totalDose).toBeCloseTo(6.4, 1);
  });

  it("subtracts active IOB from total dose", () => {
    const withIob = { ...base, activeIob: 2.0 };
    const result  = computeBolus(withIob);
    expect(result.totalDose).toBeLessThan(6.4);
    expect(result.iobOffset).toBeCloseTo(2.0, 1);
  });

  it("never returns negative total dose", () => {
    const highIob = { ...base, activeIob: 20 };
    const result  = computeBolus(highIob);
    expect(result.totalDose).toBeGreaterThanOrEqual(0);
    expect(result.suggestedDose).toBeGreaterThanOrEqual(0);
  });

  it("rounds suggestedDose to nearest 0.5U", () => {
    const result = computeBolus(base);
    expect(result.suggestedDose % 0.5).toBe(0);
  });

  it("returns high confidence for typical ICR/ISF values", () => {
    const result = computeBolus(base);
    expect(result.confidence).toBe("high");
  });

  it("returns low confidence for unusual ICR/ISF", () => {
    const unusual = { ...base, icr: 50, isf: 0.2 };
    const result  = computeBolus(unusual);
    expect(result.confidence).toBe("low");
  });

  it("adds hypo warning when glucose < 4.0", () => {
    const hypo   = { ...base, currentGlucose: 3.5 };
    const result = computeBolus(hypo);
    expect(result.warnings.some((w) => w.includes("hypoglycaemia"))).toBe(true);
  });

  it("adds hyper warning when glucose > 14.0", () => {
    const hyper  = { ...base, currentGlucose: 15.0 };
    const result = computeBolus(hyper);
    expect(result.warnings.some((w) => w.includes("ketones"))).toBe(true);
  });

  it("adds stacking warning when IOB > 50% of meal dose", () => {
    const stacking = { ...base, activeIob: 4.0 }; // 4U > 50% of 6U
    const result   = computeBolus(stacking);
    expect(result.warnings.some((w) => w.includes("stacking"))).toBe(true);
  });

  it("throws for ICR <= 0", () => {
    expect(() => computeBolus({ ...base, icr: 0 })).toThrow();
    expect(() => computeBolus({ ...base, icr: -5 })).toThrow();
  });

  it("throws for ISF <= 0", () => {
    expect(() => computeBolus({ ...base, isf: 0 })).toThrow();
  });

  it("throws for negative carbs", () => {
    expect(() => computeBolus({ ...base, carbsGrams: -10 })).toThrow();
  });

  it("returns 0 bolusDelay for high-GI meal", () => {
    const highGI = { ...base, glucaemicIndex: 80 };
    const result = computeBolus(highGI);
    expect(result.bolusDelay).toBe(0);
  });

  it("returns positive bolusDelay for low-GI meal with normal glucose", () => {
    const lowGI = { ...base, glucaemicIndex: 35, currentGlucose: 7.0 };
    const result = computeBolus(lowGI);
    expect(result.bolusDelay).toBeGreaterThan(0);
  });
});

// ─── computeCorrectionBolus ───────────────────────────────────────────────────

describe("computeCorrectionBolus", () => {
  it("returns 0 meal dose", () => {
    const result = computeCorrectionBolus(10.0, 6.0, 2.5, 0);
    expect(result.mealDose).toBe(0);
  });

  it("computes correction dose correctly", () => {
    // (10.0 - 6.0) / 2.5 = 1.6U
    const result = computeCorrectionBolus(10.0, 6.0, 2.5, 0);
    expect(result.correctionDose).toBeCloseTo(1.6, 1);
  });

  it("returns 0 dose when glucose is at target", () => {
    const result = computeCorrectionBolus(6.0, 6.0, 2.5, 0);
    expect(result.suggestedDose).toBe(0);
  });

  it("returns 0 dose when glucose is below target", () => {
    const result = computeCorrectionBolus(4.0, 6.0, 2.5, 0);
    expect(result.suggestedDose).toBe(0);
  });
});

// ─── computeSuperBolus ────────────────────────────────────────────────────────

describe("computeSuperBolus", () => {
  const base = {
    carbsGrams: 60,
    currentGlucose: 7.0,
    targetGlucose: 6.0,
    icr: 10,
    isf: 2.5,
    activeIob: 0,
    basalRate: 1.0,
    superBolusHours: 2,
  };

  it("includes basalAbsorbed in result", () => {
    const result = computeSuperBolus(base);
    expect(result.basalAbsorbed).toBeCloseTo(2.0, 1); // 1U/hr × 2h
  });

  it("total dose is higher than standard bolus", () => {
    const standard = computeBolus({ ...base });
    const super_   = computeSuperBolus(base);
    expect(super_.suggestedDose).toBeGreaterThan(standard.suggestedDose);
  });

  it("includes reducedBasalDuration", () => {
    const result = computeSuperBolus(base);
    expect(result.reducedBasalDuration).toBe(2);
  });

  it("includes basal suspension warning", () => {
    const result = computeSuperBolus(base);
    expect(result.warnings.some((w) => w.includes("basal"))).toBe(true);
  });

  it("defaults to 2h super-bolus window", () => {
    const noWindow = { ...base, superBolusHours: undefined };
    const result   = computeSuperBolus(noWindow);
    expect(result.reducedBasalDuration).toBe(2);
  });
});

// ─── roundDose ────────────────────────────────────────────────────────────────

describe("roundDose", () => {
  it("rounds to nearest 0.5U by default", () => {
    expect(roundDose(4.3)).toBe(4.5);
    expect(roundDose(4.2)).toBe(4.0);
    expect(roundDose(4.75)).toBe(5.0);
  });

  it("rounds to custom increment", () => {
    expect(roundDose(4.3, 1.0)).toBe(4.0);
    expect(roundDose(4.6, 1.0)).toBe(5.0);
    expect(roundDose(4.3, 0.1)).toBeCloseTo(4.3, 1);
  });

  it("returns 0 for 0 input", () => {
    expect(roundDose(0)).toBe(0);
  });
});

// ─── classifyDoseSize ─────────────────────────────────────────────────────────

describe("classifyDoseSize", () => {
  it("classifies < 1U as micro", () => {
    expect(classifyDoseSize(0.5)).toBe("micro");
  });

  it("classifies 1–4.5U as small", () => {
    expect(classifyDoseSize(1)).toBe("small");
    expect(classifyDoseSize(4.5)).toBe("small");
  });

  it("classifies 5–9.5U as medium", () => {
    expect(classifyDoseSize(5)).toBe("medium");
    expect(classifyDoseSize(9.5)).toBe("medium");
  });

  it("classifies 10–19.5U as large", () => {
    expect(classifyDoseSize(10)).toBe("large");
    expect(classifyDoseSize(19.5)).toBe("large");
  });

  it("classifies >= 20U as very-large", () => {
    expect(classifyDoseSize(20)).toBe("very-large");
    expect(classifyDoseSize(50)).toBe("very-large");
  });
});
