import { describe, it, expect } from "vitest";
import { calculatePediatricDose, type PediatricInput } from "./pediatric-dose";

/* ── helpers ─────────────────────────────────────────────────── */
const baseInput: PediatricInput = {
  ageYears: 10,
  weightKg: 35,
  diabetesType: "type1",
  yearsSinceDiagnosis: 3,
  inHoneymoonPhase: false,
  pubertyStage: "pre-puberty",
  onInsulin: true,
  recentHyposPerWeek: 1,
  usePump: false,
  mealsPerDay: 3,
  avgCarbsPerMeal: 40,
} as any;

/* ── Structure ───────────────────────────────────────────────── */
describe("calculatePediatricDose — structure", () => {
  it("returns complete result", () => {
    const r = calculatePediatricDose(baseInput);
    expect(r.estimatedTDD).toBeGreaterThan(0);
    expect(r.disclaimer).toContain("educational platform");
    expect(r.guidance.length).toBeGreaterThan(0);
  });

  it("classifies age group", () => {
    const r = calculatePediatricDose(baseInput);
    expect(r.ageGroup).toBe("child");
  });
});

/* ── Age groups ──────────────────────────────────────────────── */
describe("calculatePediatricDose — age groups", () => {
  it("infant for < 1 year", () => {
    const input = { ...baseInput, ageYears: 0.5, weightKg: 8 };
    const r = calculatePediatricDose(input);
    expect(r.ageGroup).toBe("infant");
  });

  it("toddler for 1-5 years", () => {
    const input = { ...baseInput, ageYears: 3, weightKg: 15 };
    const r = calculatePediatricDose(input);
    expect(r.ageGroup).toBe("toddler");
  });

  it("child for 6-11 years", () => {
    const r = calculatePediatricDose(baseInput);
    expect(r.ageGroup).toBe("child");
  });

  it("adolescent for 12-17 years", () => {
    const input = { ...baseInput, ageYears: 14, weightKg: 55 };
    const r = calculatePediatricDose(input);
    expect(r.ageGroup).toBe("adolescent");
  });
});

/* ── TDD calculation ─────────────────────────────────────────── */
describe("calculatePediatricDose — TDD", () => {
  it("TDD scales with weight", () => {
    const light = calculatePediatricDose({ ...baseInput, weightKg: 25 });
    const heavy = calculatePediatricDose({ ...baseInput, weightKg: 45 });
    expect(heavy.estimatedTDD).toBeGreaterThan(light.estimatedTDD);
  });

  it("TDD per kg is reasonable", () => {
    const r = calculatePediatricDose(baseInput);
    expect(r.tddPerKg).toBeGreaterThan(0.2);
    expect(r.tddPerKg).toBeLessThan(2.0);
  });

  it("honeymoon reduces TDD", () => {
    const normal = calculatePediatricDose(baseInput);
    const honeymoon = calculatePediatricDose({ ...baseInput, inHoneymoonPhase: true });
    expect(honeymoon.estimatedTDD).toBeLessThan(normal.estimatedTDD);
  });

  it("puberty increases TDD", () => {
    const prePub = calculatePediatricDose({ ...baseInput, ageYears: 13, weightKg: 50, pubertyStage: "pre-puberty" });
    const midPub = calculatePediatricDose({ ...baseInput, ageYears: 13, weightKg: 50, pubertyStage: "mid-puberty" });
    expect(midPub.estimatedTDD).toBeGreaterThan(prePub.estimatedTDD);
  });
});

/* ── Basal/bolus split ───────────────────────────────────────── */
describe("calculatePediatricDose — basal/bolus", () => {
  it("basal is portion of TDD", () => {
    const r = calculatePediatricDose(baseInput);
    expect(r.basalDose).toBeGreaterThan(0);
    expect(r.basalDose).toBeLessThan(r.estimatedTDD);
  });

  it("basal percent is 35-55%", () => {
    const r = calculatePediatricDose(baseInput);
    expect(r.basalPercent).toBeGreaterThanOrEqual(35);
    expect(r.basalPercent).toBeLessThanOrEqual(55);
  });

  it("pump reduces basal percent", () => {
    const mdi = calculatePediatricDose(baseInput);
    const pump = calculatePediatricDose({ ...baseInput, usePump: true });
    expect(pump.basalPercent).toBeLessThanOrEqual(mdi.basalPercent);
  });

  it("bolus per meal is calculated", () => {
    const r = calculatePediatricDose(baseInput);
    expect(r.bolusPerMeal).toBeGreaterThan(0);
  });
});

/* ── ICR and ISF ─────────────────────────────────────────────── */
describe("calculatePediatricDose — ICR and ISF", () => {
  it("ICR is positive", () => {
    const r = calculatePediatricDose(baseInput);
    expect(r.icr).toBeGreaterThan(0);
  });

  it("ISF is positive", () => {
    const r = calculatePediatricDose(baseInput);
    expect(r.isf).toBeGreaterThan(0);
    expect(r.isfMgdl).toBeGreaterThan(0);
  });

  it("higher TDD = lower ICR", () => {
    const light = calculatePediatricDose({ ...baseInput, weightKg: 20 });
    const heavy = calculatePediatricDose({ ...baseInput, weightKg: 60 });
    expect(heavy.icr).toBeLessThan(light.icr);
  });

  it("higher TDD = lower ISF", () => {
    const light = calculatePediatricDose({ ...baseInput, weightKg: 20 });
    const heavy = calculatePediatricDose({ ...baseInput, weightKg: 60 });
    expect(heavy.isf).toBeLessThan(light.isf);
  });
});

/* ── Adjustments ─────────────────────────────────────────────── */
describe("calculatePediatricDose — adjustments", () => {
  it("honeymoon adjustment noted", () => {
    const r = calculatePediatricDose({ ...baseInput, inHoneymoonPhase: true });
    expect(r.adjustments.some((a) => a.factor.includes("Honeymoon"))).toBe(true);
  });

  it("puberty adjustment noted", () => {
    const r = calculatePediatricDose({ ...baseInput, pubertyStage: "mid-puberty" });
    expect(r.adjustments.some((a) => a.factor.includes("Puberty"))).toBe(true);
  });

  it("hypo adjustment noted", () => {
    const r = calculatePediatricDose({ ...baseInput, recentHyposPerWeek: 4 });
    expect(r.adjustments.some((a) => a.factor.includes("hypoglycemia"))).toBe(true);
  });

  it("A1c adjustment noted", () => {
    const r = calculatePediatricDose({ ...baseInput, currentA1c: 9.0 });
    expect(r.adjustments.some((a) => a.factor.includes("A1c"))).toBe(true);
  });
});

/* ── Safety checks ───────────────────────────────────────────── */
describe("calculatePediatricDose — safety", () => {
  it("passes safety for normal doses", () => {
    const r = calculatePediatricDose(baseInput);
    expect(r.safetyChecks.some((c) => c.status === "pass")).toBe(true);
  });

  it("warns for frequent hypos", () => {
    const r = calculatePediatricDose({ ...baseInput, recentHyposPerWeek: 5 });
    expect(r.safetyChecks.some((c) => c.check === "Hypoglycemia frequency" && c.status === "fail")).toBe(true);
  });

  it("warns for infant under 2", () => {
    const r = calculatePediatricDose({ ...baseInput, ageYears: 1.5, weightKg: 10 });
    expect(r.warnings.some((w) => w.includes("under 2"))).toBe(true);
  });
});

/* ── Guidance ────────────────────────────────────────────────── */
describe("calculatePediatricDose — guidance", () => {
  it("includes TDD in guidance", () => {
    const r = calculatePediatricDose(baseInput);
    expect(r.guidance.some((g) => g.includes("TDD"))).toBe(true);
  });

  it("pump guidance for pump users", () => {
    const r = calculatePediatricDose({ ...baseInput, usePump: true });
    expect(r.guidance.some((g) => g.includes("basal rate"))).toBe(true);
  });

  it("injection guidance for MDI users", () => {
    const r = calculatePediatricDose(baseInput);
    expect(r.guidance.some((g) => g.includes("injection"))).toBe(true);
  });

  it("half-unit pen note for toddlers", () => {
    const r = calculatePediatricDose({ ...baseInput, ageYears: 3, weightKg: 15 });
    expect(r.guidance.some((g) => g.includes("half-unit"))).toBe(true);
  });
});
