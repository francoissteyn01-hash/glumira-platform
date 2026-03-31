/**
 * GluMira — Dose Log Extended Test Suite
 *
 * Integration-style tests combining bolus-calculator, basal-titration,
 * and dose-adjustment-advisor modules.
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
import {
  apply303Rule,
  apply202Rule,
  detectDawnPhenomenon,
  scoreBasalAdequacy,
  classifyFastingGlucose,
  BASAL_TITRATION_TARGETS,
} from "./basal-titration";
import {
  suggestBasalAdjustment,
  suggestIcrAdjustment,
  suggestIsfAdjustment,
  assessOverallRisk,
  generateSafetyNotes,
  generateAdjustmentReport,
  type GlucoseWindow,
  type CurrentRegimen,
} from "./dose-adjustment-advisor";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const regimen: CurrentRegimen = { basalUnits: 20, icrGrams: 10, isfMmol: 2.0 };

function makeWindow(label: string, meanMmol: number, pctBelow = 0, pctAbove = 0): GlucoseWindow {
  return { label, meanMmol, readings: 20, percentBelow: pctBelow, percentAbove: pctAbove };
}

// ─── Integration: Bolus + Correction combined ───────────────────────────────

describe("Dose Log Integration — Bolus + Correction", () => {
  it("meal bolus + correction should sum correctly", () => {
    const mealBolus = computeBolus({
      carbsGrams: 60, icr: 10, currentGlucose: 5.5, targetGlucose: 5.5, isf: 2.0, activeIob: 0,
    });
    const corrBolus = computeCorrectionBolus(12.0, 5.5, 2.0, 0);
    expect(mealBolus.totalDose).toBeCloseTo(6, 0); // 60/10 = 6
    expect(corrBolus.correctionDose).toBeCloseTo(3.25, 0); // (12-5.5)/2 = 3.25
    expect(mealBolus.totalDose + corrBolus.correctionDose).toBeGreaterThan(8);
  });

  it("IOB offset reduces total dose", () => {
    const withIob = computeBolus({
      carbsGrams: 40, icr: 10, currentGlucose: 8.0, targetGlucose: 5.5, isf: 2.0, activeIob: 3,
    });
    const noIob = computeBolus({
      carbsGrams: 40, icr: 10, currentGlucose: 8.0, targetGlucose: 5.5, isf: 2.0, activeIob: 0,
    });
    expect(withIob.totalDose).toBeLessThan(noIob.totalDose);
  });

  it("super bolus includes basal absorbed", () => {
    const result = computeSuperBolus({
      carbsGrams: 50, icr: 10, basalRate: 1.0, superBolusHours: 2,
      currentGlucose: 5.5, targetGlucose: 5.5, isf: 2.0, activeIob: 0,
    });
    expect(result.basalAbsorbed).toBe(2); // 1.0 × 2
    expect(result.totalDose).toBeGreaterThan(5); // meal + basal
  });
});

// ─── Integration: Basal Titration Scenarios ──────────────────────────────────

describe("Dose Log Integration — Basal Titration Scenarios", () => {
  it("apply303Rule suggests increase for high fasting", () => {
    const result = apply303Rule(20, [8.0, 8.5, 9.0]);
    expect(result.suggestedDose).toBeGreaterThan(20);
  });

  it("apply202Rule suggests decrease for low fasting", () => {
    const result = apply202Rule(20, [3.0, 3.5, 3.2]);
    expect(result.suggestedDose).toBeLessThan(20);
  });

  it("classifyFastingGlucose returns valid classification", () => {
    expect(classifyFastingGlucose(5.0)).toBeTruthy();
    expect(classifyFastingGlucose(3.0)).toBeTruthy();
    expect(classifyFastingGlucose(10.0)).toBeTruthy();
  });

  it("scoreBasalAdequacy returns a score object", () => {
    const score = scoreBasalAdequacy([5.0, 5.5, 5.2]);
    expect(score).toBeTruthy();
    expect(typeof score.score).toBe("number");
  });

  it("detectDawnPhenomenon returns a result", () => {
    const result = detectDawnPhenomenon([
      { time: "03:00", mmol: 5.0 },
      { time: "05:00", mmol: 5.5 },
      { time: "07:00", mmol: 8.0 },
    ]);
    expect(result).toBeTruthy();
    expect(typeof result.detected).toBe("boolean");
  });

  it("BASAL_TITRATION_TARGETS has expected keys", () => {
    expect(BASAL_TITRATION_TARGETS).toBeTruthy();
    expect(typeof BASAL_TITRATION_TARGETS.fastingHigh).toBe("number");
  });
});

// ─── Integration: Dose Adjustment Advisor ────────────────────────────────────

describe("Dose Log Integration — Dose Adjustment Advisor", () => {
  it("suggestBasalAdjustment returns a DoseAdjustment", () => {
    const window = makeWindow("fasting", 8.5, 0, 60);
    const result = suggestBasalAdjustment(window, regimen);
    expect(result).toBeTruthy();
    expect(result.direction).toBeTruthy();
  });

  it("suggestIcrAdjustment returns a DoseAdjustment", () => {
    const window = makeWindow("post-meal", 12.0, 0, 80);
    const result = suggestIcrAdjustment(window, regimen);
    expect(result).toBeTruthy();
    expect(result.direction).toBeTruthy();
  });

  it("suggestIsfAdjustment returns a DoseAdjustment", () => {
    const window = makeWindow("correction", 11.0, 0, 70);
    const result = suggestIsfAdjustment(window, regimen);
    expect(result).toBeTruthy();
    expect(result.direction).toBeTruthy();
  });

  it("assessOverallRisk returns valid risk level", () => {
    const adj = suggestBasalAdjustment(makeWindow("fasting", 8.0, 0, 50), regimen);
    const risk = assessOverallRisk([adj]);
    expect(["low", "moderate", "high"]).toContain(risk);
  });

  it("generateSafetyNotes returns array of strings", () => {
    const adj = suggestBasalAdjustment(makeWindow("fasting", 8.0, 0, 50), regimen);
    const notes = generateSafetyNotes([adj]);
    expect(Array.isArray(notes)).toBe(true);
  });

  it("generateAdjustmentReport returns a report object", () => {
    const fasting = makeWindow("fasting", 8.0, 0, 50);
    const postMeal = makeWindow("post-meal", 10.0, 0, 40);
    const correction = makeWindow("correction", 9.0, 0, 30);
    const report = generateAdjustmentReport(fasting, postMeal, correction, regimen);
    expect(report).toBeTruthy();
    expect(report.adjustments).toBeTruthy();
    expect(Array.isArray(report.adjustments)).toBe(true);
  });
});

// ─── roundDose + classifyDoseSize ────────────────────────────────────────────

describe("Dose Log Integration — Utility Functions", () => {
  it("roundDose rounds to nearest 0.5", () => {
    expect(roundDose(3.3)).toBe(3.5);
    expect(roundDose(3.7)).toBe(3.5);
    expect(roundDose(3.8)).toBe(4.0);
  });

  it("classifyDoseSize returns valid categories", () => {
    expect(classifyDoseSize(1)).toBeTruthy();
    expect(classifyDoseSize(5)).toBeTruthy();
    expect(classifyDoseSize(15)).toBeTruthy();
    expect(classifyDoseSize(25)).toBeTruthy();
  });
});
