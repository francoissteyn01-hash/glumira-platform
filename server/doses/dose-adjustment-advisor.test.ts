/**
 * GluMira — Dose Adjustment Advisor Test Suite
 *
 * Tests suggestBasalAdjustment, suggestIcrAdjustment, suggestIsfAdjustment,
 * assessOverallRisk, generateSafetyNotes, and generateAdjustmentReport.
 */

import { describe, it, expect } from "vitest";
import {
  suggestBasalAdjustment,
  suggestIcrAdjustment,
  suggestIsfAdjustment,
  assessOverallRisk,
  generateSafetyNotes,
  generateAdjustmentReport,
  type GlucoseWindow,
  type CurrentRegimen,
  type DoseAdjustment,
} from "./dose-adjustment-advisor";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const regimen: CurrentRegimen = { basalUnits: 20, icrGrams: 10, isfMmol: 2.5 };

function win(overrides: Partial<GlucoseWindow> = {}): GlucoseWindow {
  return {
    label: "test",
    meanMmol: 5.5,
    readings: 14,
    percentBelow: 2,
    percentAbove: 5,
    ...overrides,
  };
}

// ─── suggestBasalAdjustment ───────────────────────────────────────────────────

describe("suggestBasalAdjustment", () => {
  it("suggests decrease when percentBelow > 10", () => {
    const r = suggestBasalAdjustment(win({ percentBelow: 15 }), regimen);
    expect(r.direction).toBe("decrease");
    expect(r.suggestedValue).toBeLessThan(regimen.basalUnits);
    expect(r.parameter).toBe("basal");
  });

  it("suggests increase when fasting mean > 7.0", () => {
    const r = suggestBasalAdjustment(win({ meanMmol: 8.0 }), regimen);
    expect(r.direction).toBe("increase");
    expect(r.suggestedValue).toBeGreaterThan(regimen.basalUnits);
  });

  it("suggests small increase when fasting mean slightly above target", () => {
    const r = suggestBasalAdjustment(win({ meanMmol: 6.2 }), regimen);
    expect(r.direction).toBe("increase");
    expect(r.delta).toBeLessThanOrEqual(2);
  });

  it("suggests no-change when fasting is on target", () => {
    const r = suggestBasalAdjustment(win({ meanMmol: 5.5 }), regimen);
    expect(r.direction).toBe("no-change");
    expect(r.delta).toBe(0);
  });

  it("has high confidence with >= 10 readings", () => {
    const r = suggestBasalAdjustment(win({ meanMmol: 8.0, readings: 14 }), regimen);
    expect(r.confidence).toBe("high");
  });

  it("has moderate confidence with < 10 readings", () => {
    const r = suggestBasalAdjustment(win({ meanMmol: 8.0, readings: 5 }), regimen);
    expect(r.confidence).toBe("moderate");
  });
});

// ─── suggestIcrAdjustment ─────────────────────────────────────────────────────

describe("suggestIcrAdjustment", () => {
  it("suggests decrease (increase ICR grams) when percentBelow > 15", () => {
    const r = suggestIcrAdjustment(win({ percentBelow: 20 }), regimen);
    expect(r.direction).toBe("decrease");
    expect(r.suggestedValue).toBeGreaterThan(regimen.icrGrams);
  });

  it("suggests increase (decrease ICR grams) when post-meal mean > 10", () => {
    const r = suggestIcrAdjustment(win({ meanMmol: 11.0 }), regimen);
    expect(r.direction).toBe("increase");
    expect(r.suggestedValue).toBeLessThan(regimen.icrGrams);
  });

  it("suggests no-change when post-meal is within range", () => {
    const r = suggestIcrAdjustment(win({ meanMmol: 7.5 }), regimen);
    expect(r.direction).toBe("no-change");
  });

  it("never suggests ICR below 1", () => {
    const tiny = { ...regimen, icrGrams: 2 };
    const r = suggestIcrAdjustment(win({ meanMmol: 15.0 }), tiny);
    expect(r.suggestedValue).toBeGreaterThanOrEqual(1);
  });

  it("parameter is always icr", () => {
    const r = suggestIcrAdjustment(win(), regimen);
    expect(r.parameter).toBe("icr");
  });
});

// ─── suggestIsfAdjustment ─────────────────────────────────────────────────────

describe("suggestIsfAdjustment", () => {
  it("suggests decrease (increase ISF) when percentBelow > 15", () => {
    const r = suggestIsfAdjustment(win({ percentBelow: 20 }), regimen);
    expect(r.direction).toBe("decrease");
    expect(r.suggestedValue).toBeGreaterThan(regimen.isfMmol);
  });

  it("suggests increase (decrease ISF) when post-correction mean > 8", () => {
    const r = suggestIsfAdjustment(win({ meanMmol: 9.0 }), regimen);
    expect(r.direction).toBe("increase");
    expect(r.suggestedValue).toBeLessThan(regimen.isfMmol);
  });

  it("suggests no-change when corrections are on target", () => {
    const r = suggestIsfAdjustment(win({ meanMmol: 6.0 }), regimen);
    expect(r.direction).toBe("no-change");
  });

  it("never suggests ISF below 0.5", () => {
    const tiny = { ...regimen, isfMmol: 0.8 };
    const r = suggestIsfAdjustment(win({ meanMmol: 12.0 }), tiny);
    expect(r.suggestedValue).toBeGreaterThanOrEqual(0.5);
  });

  it("has moderate confidence with >= 5 readings", () => {
    const r = suggestIsfAdjustment(win({ meanMmol: 9.0, readings: 6 }), regimen);
    expect(r.confidence).toBe("moderate");
  });

  it("has low confidence with < 5 readings", () => {
    const r = suggestIsfAdjustment(win({ meanMmol: 9.0, readings: 3 }), regimen);
    expect(r.confidence).toBe("low");
  });
});

// ─── assessOverallRisk ────────────────────────────────────────────────────────

describe("assessOverallRisk", () => {
  it("returns low when all no-change", () => {
    const adjs: DoseAdjustment[] = [
      { parameter: "basal", direction: "no-change", suggestedValue: 20, currentValue: 20, delta: 0, reason: "", confidence: "high" },
      { parameter: "icr", direction: "no-change", suggestedValue: 10, currentValue: 10, delta: 0, reason: "", confidence: "high" },
    ];
    expect(assessOverallRisk(adjs)).toBe("low");
  });

  it("returns high when basal delta > 2", () => {
    const adjs: DoseAdjustment[] = [
      { parameter: "basal", direction: "increase", suggestedValue: 23, currentValue: 20, delta: 3, reason: "", confidence: "high" },
    ];
    expect(assessOverallRisk(adjs)).toBe("high");
  });

  it("returns moderate when multiple changes but no large basal", () => {
    const adjs: DoseAdjustment[] = [
      { parameter: "basal", direction: "increase", suggestedValue: 21, currentValue: 20, delta: 1, reason: "", confidence: "high" },
      { parameter: "icr", direction: "increase", suggestedValue: 9, currentValue: 10, delta: -1, reason: "", confidence: "high" },
    ];
    expect(assessOverallRisk(adjs)).toBe("moderate");
  });

  it("returns low with single small change", () => {
    const adjs: DoseAdjustment[] = [
      { parameter: "icr", direction: "increase", suggestedValue: 9, currentValue: 10, delta: -1, reason: "", confidence: "high" },
    ];
    expect(assessOverallRisk(adjs)).toBe("low");
  });
});

// ─── generateSafetyNotes ──────────────────────────────────────────────────────

describe("generateSafetyNotes", () => {
  it("includes basal increase note", () => {
    const adjs: DoseAdjustment[] = [
      { parameter: "basal", direction: "increase", suggestedValue: 22, currentValue: 20, delta: 2, reason: "", confidence: "high" },
    ];
    const notes = generateSafetyNotes(adjs);
    expect(notes.some((n) => n.includes("fasting glucose"))).toBe(true);
  });

  it("includes basal decrease note", () => {
    const adjs: DoseAdjustment[] = [
      { parameter: "basal", direction: "decrease", suggestedValue: 18, currentValue: 20, delta: -2, reason: "", confidence: "high" },
    ];
    const notes = generateSafetyNotes(adjs);
    expect(notes.some((n) => n.includes("nocturnal hypos"))).toBe(true);
  });

  it("includes ICR tightened note", () => {
    const adjs: DoseAdjustment[] = [
      { parameter: "icr", direction: "increase", suggestedValue: 9, currentValue: 10, delta: -1, reason: "", confidence: "high" },
    ];
    const notes = generateSafetyNotes(adjs);
    expect(notes.some((n) => n.includes("post-meal"))).toBe(true);
  });

  it("includes ISF change note", () => {
    const adjs: DoseAdjustment[] = [
      { parameter: "isf", direction: "increase", suggestedValue: 2.0, currentValue: 2.5, delta: -0.5, reason: "", confidence: "moderate" },
    ];
    const notes = generateSafetyNotes(adjs);
    expect(notes.some((n) => n.includes("correction"))).toBe(true);
  });

  it("returns default note when no changes", () => {
    const adjs: DoseAdjustment[] = [
      { parameter: "basal", direction: "no-change", suggestedValue: 20, currentValue: 20, delta: 0, reason: "", confidence: "high" },
    ];
    const notes = generateSafetyNotes(adjs);
    expect(notes.some((n) => n.includes("No adjustments"))).toBe(true);
  });
});

// ─── generateAdjustmentReport ─────────────────────────────────────────────────

describe("generateAdjustmentReport", () => {
  it("returns a report with 3 adjustments", () => {
    const report = generateAdjustmentReport(
      win({ meanMmol: 8.0 }),
      win({ meanMmol: 11.0 }),
      win({ meanMmol: 9.0 }),
      regimen
    );
    expect(report.adjustments).toHaveLength(3);
    expect(report.adjustments[0].parameter).toBe("basal");
    expect(report.adjustments[1].parameter).toBe("icr");
    expect(report.adjustments[2].parameter).toBe("isf");
  });

  it("has a valid timestamp", () => {
    const report = generateAdjustmentReport(win(), win(), win(), regimen);
    expect(new Date(report.timestamp).getTime()).not.toBeNaN();
  });

  it("includes safety notes", () => {
    const report = generateAdjustmentReport(win(), win(), win(), regimen);
    expect(report.safetyNotes.length).toBeGreaterThan(0);
  });

  it("returns low risk when all on target", () => {
    const report = generateAdjustmentReport(
      win({ meanMmol: 5.5 }),
      win({ meanMmol: 7.5 }),
      win({ meanMmol: 6.0 }),
      regimen
    );
    expect(report.overallRisk).toBe("low");
  });

  it("returns high risk when basal change is large", () => {
    const bigBasal = { ...regimen, basalUnits: 40 };
    const report = generateAdjustmentReport(
      win({ meanMmol: 10.0 }),
      win({ meanMmol: 7.5 }),
      win({ meanMmol: 6.0 }),
      bigBasal
    );
    expect(report.overallRisk).toBe("high");
  });
});
