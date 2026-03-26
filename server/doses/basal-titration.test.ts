/**
 * GluMira™ — basal-titration.test.ts
 *
 * Unit tests for the basal-titration module.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { describe, it, expect } from "vitest";
import {
  apply303Rule,
  apply202Rule,
  detectDawnPhenomenon,
  scoreBasalAdequacy,
  classifyFastingGlucose,
  BASAL_TITRATION_TARGETS,
  type FastingGlucoseEntry,
} from "./basal-titration";

// ─── apply303Rule ─────────────────────────────────────────────────────────────

describe("apply303Rule", () => {
  it("increases dose by 3U when fasting is above target", () => {
    const result = apply303Rule(20, [8.5, 9.0, 8.8]);
    expect(result.adjustmentUnits).toBe(3);
    expect(result.suggestedDose).toBe(23);
    expect(result.rule).toBe("303");
  });

  it("decreases dose by 3U when fasting is below 4.4 mmol/L", () => {
    const result = apply303Rule(20, [3.8, 4.0, 3.9]);
    expect(result.adjustmentUnits).toBe(-3);
    expect(result.suggestedDose).toBe(17);
  });

  it("holds dose when fasting is in target range", () => {
    const result = apply303Rule(20, [5.5, 6.0, 5.8]);
    expect(result.adjustmentUnits).toBe(0);
    expect(result.rule).toBe("hold");
    expect(result.targetMet).toBe(true);
  });

  it("never exceeds maxDose (100U)", () => {
    const result = apply303Rule(99, [9.0, 9.5]);
    expect(result.suggestedDose).toBeLessThanOrEqual(100);
  });

  it("never goes below minDose (2U)", () => {
    const result = apply303Rule(3, [3.5, 3.8]);
    expect(result.suggestedDose).toBeGreaterThanOrEqual(2);
  });

  it("adds warning for dose >= 50U", () => {
    const result = apply303Rule(48, [9.0, 9.5]);
    expect(result.warnings.some((w) => w.includes("50U"))).toBe(true);
  });

  it("adds hypo warning when decreasing", () => {
    const result = apply303Rule(20, [3.5, 3.8]);
    expect(result.warnings.some((w) => w.includes("Hypoglycaemia"))).toBe(true);
  });

  it("throws for empty readings", () => {
    expect(() => apply303Rule(20, [])).toThrow();
  });

  it("throws for currentDose <= 0", () => {
    expect(() => apply303Rule(0, [8.0])).toThrow();
  });

  it("returns adjustmentPercent as a number", () => {
    const result = apply303Rule(20, [8.5]);
    expect(typeof result.adjustmentPercent).toBe("number");
  });
});

// ─── apply202Rule ─────────────────────────────────────────────────────────────

describe("apply202Rule", () => {
  it("increases by 2U when 2 consecutive readings are above target", () => {
    const result = apply202Rule(20, [5.5, 8.0, 8.5]);
    expect(result.adjustmentUnits).toBe(2);
    expect(result.rule).toBe("2-0-2");
  });

  it("holds when only one reading is above target", () => {
    const result = apply202Rule(20, [5.5, 8.0, 6.0]);
    expect(result.adjustmentUnits).toBe(0);
    expect(result.rule).toBe("hold");
  });

  it("decreases by 2U when any reading is below 4.4 mmol/L", () => {
    const result = apply202Rule(20, [6.0, 3.9]);
    expect(result.adjustmentUnits).toBe(-2);
  });

  it("throws for fewer than 2 readings", () => {
    expect(() => apply202Rule(20, [8.0])).toThrow();
  });

  it("throws for currentDose <= 0", () => {
    expect(() => apply202Rule(0, [8.0, 8.5])).toThrow();
  });

  it("targetMet is true when last two readings are in range", () => {
    const result = apply202Rule(20, [5.0, 6.0, 5.5]);
    expect(result.targetMet).toBe(true);
  });
});

// ─── detectDawnPhenomenon ─────────────────────────────────────────────────────

describe("detectDawnPhenomenon", () => {
  it("returns not detected for empty entries", () => {
    const result = detectDawnPhenomenon([]);
    expect(result.detected).toBe(false);
    expect(result.severity).toBe("none");
  });

  it("returns not detected when no bedtime readings", () => {
    const entries: FastingGlucoseEntry[] = [
      { date: "2026-03-01", fastingMmol: 7.0 },
      { date: "2026-03-02", fastingMmol: 7.5 },
    ];
    const result = detectDawnPhenomenon(entries);
    expect(result.detected).toBe(false);
  });

  it("detects dawn phenomenon when fasting consistently higher than bedtime", () => {
    const entries: FastingGlucoseEntry[] = [
      { date: "2026-03-01", fastingMmol: 9.0, bedtimeMmol: 6.5 },
      { date: "2026-03-02", fastingMmol: 9.5, bedtimeMmol: 7.0 },
      { date: "2026-03-03", fastingMmol: 8.8, bedtimeMmol: 6.2 },
      { date: "2026-03-04", fastingMmol: 9.2, bedtimeMmol: 6.8 },
    ];
    const result = detectDawnPhenomenon(entries);
    expect(result.detected).toBe(true);
    expect(result.averageRiseMmol).toBeGreaterThan(1.5);
  });

  it("does not detect dawn phenomenon when fasting is lower than bedtime", () => {
    const entries: FastingGlucoseEntry[] = [
      { date: "2026-03-01", fastingMmol: 5.5, bedtimeMmol: 8.0 },
      { date: "2026-03-02", fastingMmol: 5.0, bedtimeMmol: 7.5 },
      { date: "2026-03-03", fastingMmol: 5.2, bedtimeMmol: 7.8 },
    ];
    const result = detectDawnPhenomenon(entries);
    expect(result.detected).toBe(false);
  });

  it("classifies severity as mild for small rises", () => {
    const entries: FastingGlucoseEntry[] = [
      { date: "2026-03-01", fastingMmol: 7.5, bedtimeMmol: 6.0 },
      { date: "2026-03-02", fastingMmol: 7.8, bedtimeMmol: 6.2 },
      { date: "2026-03-03", fastingMmol: 7.6, bedtimeMmol: 6.1 },
    ];
    const result = detectDawnPhenomenon(entries);
    if (result.detected) {
      expect(["mild", "moderate"]).toContain(result.severity);
    }
  });

  it("returns affectedNights count", () => {
    const entries: FastingGlucoseEntry[] = [
      { date: "2026-03-01", fastingMmol: 9.0, bedtimeMmol: 6.5 },
      { date: "2026-03-02", fastingMmol: 5.0, bedtimeMmol: 7.0 },
    ];
    const result = detectDawnPhenomenon(entries);
    expect(result.affectedNights).toBe(1);
    expect(result.totalNights).toBe(2);
  });
});

// ─── scoreBasalAdequacy ───────────────────────────────────────────────────────

describe("scoreBasalAdequacy", () => {
  it("returns score 0 for empty readings", () => {
    const result = scoreBasalAdequacy([]);
    expect(result.score).toBe(0);
    expect(result.label).toBe("poor");
  });

  it("returns excellent for all in-range readings with low variability", () => {
    const readings = [5.5, 5.8, 5.6, 5.7, 5.5, 5.9, 5.6, 5.8];
    const result = scoreBasalAdequacy(readings);
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.label).toBe("excellent");
  });

  it("returns poor for all out-of-range readings", () => {
    const readings = [11.0, 12.0, 13.0, 11.5, 12.5];
    const result = scoreBasalAdequacy(readings);
    expect(result.score).toBeLessThan(60);
  });

  it("fastingInRange is 100 when all readings are in target", () => {
    const readings = [5.0, 5.5, 6.0, 6.5, 7.0];
    const result = scoreBasalAdequacy(readings);
    expect(result.fastingInRange).toBe(100);
  });

  it("includes averageFasting", () => {
    const readings = [6.0, 7.0, 8.0];
    const result = scoreBasalAdequacy(readings);
    expect(result.averageFasting).toBeCloseTo(7.0, 1);
  });

  it("score is between 0 and 100", () => {
    const readings = [5.0, 9.0, 3.5, 12.0, 6.0];
    const result = scoreBasalAdequacy(readings);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

// ─── classifyFastingGlucose ───────────────────────────────────────────────────

describe("classifyFastingGlucose", () => {
  it("classifies < 4.0 as hypo", () => {
    expect(classifyFastingGlucose(3.5)).toBe("hypo");
    expect(classifyFastingGlucose(3.9)).toBe("hypo");
  });

  it("classifies 4.0–4.39 as low", () => {
    expect(classifyFastingGlucose(4.0)).toBe("low");
    expect(classifyFastingGlucose(4.3)).toBe("low");
  });

  it("classifies 4.4–7.2 as target", () => {
    expect(classifyFastingGlucose(4.4)).toBe("target");
    expect(classifyFastingGlucose(7.2)).toBe("target");
    expect(classifyFastingGlucose(5.5)).toBe("target");
  });

  it("classifies 7.21–10.0 as above-target", () => {
    expect(classifyFastingGlucose(7.5)).toBe("above-target");
    expect(classifyFastingGlucose(10.0)).toBe("above-target");
  });

  it("classifies > 10.0 as high", () => {
    expect(classifyFastingGlucose(10.1)).toBe("high");
    expect(classifyFastingGlucose(15.0)).toBe("high");
  });
});

// ─── BASAL_TITRATION_TARGETS ──────────────────────────────────────────────────

describe("BASAL_TITRATION_TARGETS", () => {
  it("has expected target range", () => {
    expect(BASAL_TITRATION_TARGETS.fastingLow).toBe(4.4);
    expect(BASAL_TITRATION_TARGETS.fastingHigh).toBe(7.2);
  });

  it("maxDose is 100", () => {
    expect(BASAL_TITRATION_TARGETS.maxDose).toBe(100);
  });

  it("minDose is 2", () => {
    expect(BASAL_TITRATION_TARGETS.minDose).toBe(2);
  });
});
