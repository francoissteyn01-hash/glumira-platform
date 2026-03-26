/**
 * GluMira™ — isf-analysis.test.ts
 *
 * Unit tests for the ISF analysis module.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { describe, it, expect } from "vitest";
import {
  estimateIsf,
  analyseCorrectionAccuracy,
  detectIsfTrend,
  validateIsf,
  type CorrectionEvent,
} from "./isf-analysis";

// ─── estimateIsf ──────────────────────────────────────────────────────────────

describe("estimateIsf", () => {
  it("estimates ISF in mmol/L using 1700 rule", () => {
    const result = estimateIsf(40, "mmol");
    expect(result.rule).toBe("1700");
    expect(result.estimatedIsf).toBeCloseTo(94 / 40, 1);
  });

  it("estimates ISF in mg/dL using 1800 rule", () => {
    const result = estimateIsf(40, "mgdl");
    expect(result.rule).toBe("1800");
    expect(result.estimatedIsf).toBe(Math.round(1800 / 40));
  });

  it("returns high confidence for typical TDD (30–100U)", () => {
    const result = estimateIsf(50, "mmol");
    expect(result.confidence).toBe("high");
  });

  it("returns low confidence for very low TDD (< 10U)", () => {
    const result = estimateIsf(8, "mmol");
    expect(result.confidence).toBe("low");
  });

  it("returns medium confidence for low TDD (10–20U)", () => {
    const result = estimateIsf(15, "mmol");
    expect(result.confidence).toBe("medium");
  });

  it("adds note for high TDD (> 150U)", () => {
    const result = estimateIsf(160, "mmol");
    expect(result.notes.some((n) => n.includes("insulin resistance"))).toBe(true);
  });

  it("throws for TDD <= 0", () => {
    expect(() => estimateIsf(0)).toThrow();
    expect(() => estimateIsf(-5)).toThrow();
  });

  it("returns totalDailyDose in result", () => {
    const result = estimateIsf(45, "mmol");
    expect(result.totalDailyDose).toBe(45);
  });
});

// ─── analyseCorrectionAccuracy ────────────────────────────────────────────────

describe("analyseCorrectionAccuracy", () => {
  const makeEvent = (pre: number, post: number, dose: number, target = 5.5): CorrectionEvent => ({
    preCorrectionMmol: pre,
    postCorrectionMmol: post,
    doseUnits: dose,
    targetMmol: target,
  });

  it("returns accurate bias when observed ISF matches configured ISF", () => {
    // ISF = 2.5 mmol/L/U: 2U correction drops glucose by 5 mmol/L
    const events = [
      makeEvent(10.0, 5.0, 2.0),
      makeEvent(9.5, 4.5, 2.0),
      makeEvent(11.0, 6.0, 2.0),
    ];
    const result = analyseCorrectionAccuracy(events, 2.5);
    expect(result.bias).toBe("accurate");
    expect(result.accuracy).toBeGreaterThan(80);
  });

  it("detects over-correcting when observed ISF is much higher than configured", () => {
    // Observed ISF = 5.0 but configured = 2.5 → over-correcting
    const events = [
      makeEvent(10.0, 0.0, 2.0),  // drop of 10 = ISF 5.0
      makeEvent(9.0, -1.0, 2.0),
    ];
    const result = analyseCorrectionAccuracy(events, 2.5);
    expect(result.bias).toBe("over-correcting");
  });

  it("detects under-correcting when observed ISF is much lower than configured", () => {
    // Observed ISF = 1.0 but configured = 2.5 → under-correcting
    const events = [
      makeEvent(10.0, 8.0, 2.0),  // drop of 2 = ISF 1.0
      makeEvent(9.0, 7.0, 2.0),
    ];
    const result = analyseCorrectionAccuracy(events, 2.5);
    expect(result.bias).toBe("under-correcting");
  });

  it("returns events count", () => {
    const events = [makeEvent(10.0, 5.0, 2.0), makeEvent(9.0, 4.0, 2.0)];
    const result = analyseCorrectionAccuracy(events, 2.5);
    expect(result.events).toBe(2);
  });

  it("throws for empty events", () => {
    expect(() => analyseCorrectionAccuracy([], 2.5)).toThrow();
  });

  it("throws for configuredIsf <= 0", () => {
    expect(() => analyseCorrectionAccuracy([makeEvent(10, 5, 2)], 0)).toThrow();
  });

  it("accuracy is between 0 and 100", () => {
    const events = [makeEvent(10.0, 5.0, 2.0)];
    const result = analyseCorrectionAccuracy(events, 2.5);
    expect(result.accuracy).toBeGreaterThanOrEqual(0);
    expect(result.accuracy).toBeLessThanOrEqual(100);
  });
});

// ─── detectIsfTrend ───────────────────────────────────────────────────────────

describe("detectIsfTrend", () => {
  const makeEvent = (isf: number): CorrectionEvent => ({
    preCorrectionMmol: 10.0,
    postCorrectionMmol: 10.0 - isf * 2,
    doseUnits: 2.0,
    targetMmol: 5.5,
  });

  it("detects improving trend when recent ISF is higher", () => {
    const events = [
      makeEvent(1.5), makeEvent(1.6), makeEvent(1.5),
      makeEvent(2.5), makeEvent(2.6), makeEvent(2.7), makeEvent(2.8), makeEvent(2.9),
    ];
    const result = detectIsfTrend(events, 5);
    expect(result.trend).toBe("improving");
    expect(result.changePercent).toBeGreaterThan(10);
  });

  it("detects worsening trend when recent ISF is lower", () => {
    const events = [
      makeEvent(3.0), makeEvent(3.1), makeEvent(3.0),
      makeEvent(1.5), makeEvent(1.4), makeEvent(1.6), makeEvent(1.5), makeEvent(1.4),
    ];
    const result = detectIsfTrend(events, 5);
    expect(result.trend).toBe("worsening");
    expect(result.changePercent).toBeLessThan(-10);
  });

  it("detects stable trend when ISF is similar", () => {
    const events = [
      makeEvent(2.5), makeEvent(2.6), makeEvent(2.4),
      makeEvent(2.5), makeEvent(2.5), makeEvent(2.6), makeEvent(2.4), makeEvent(2.5),
    ];
    const result = detectIsfTrend(events, 5);
    expect(result.trend).toBe("stable");
  });

  it("throws for fewer than 4 events", () => {
    expect(() => detectIsfTrend([makeEvent(2.5), makeEvent(2.5), makeEvent(2.5)])).toThrow();
  });

  it("returns recommendation string", () => {
    const events = [
      makeEvent(1.5), makeEvent(1.6), makeEvent(1.5),
      makeEvent(2.5), makeEvent(2.6), makeEvent(2.7), makeEvent(2.8), makeEvent(2.9),
    ];
    const result = detectIsfTrend(events, 5);
    expect(typeof result.recommendation).toBe("string");
    expect(result.recommendation.length).toBeGreaterThan(0);
  });
});

// ─── validateIsf ─────────────────────────────────────────────────────────────

describe("validateIsf", () => {
  it("validates typical ISF values as valid", () => {
    expect(validateIsf(2.5).valid).toBe(true);
    expect(validateIsf(1.5).valid).toBe(true);
    expect(validateIsf(5.0).valid).toBe(true);
  });

  it("rejects ISF below 0.5", () => {
    expect(validateIsf(0.3).valid).toBe(false);
  });

  it("rejects ISF above 15", () => {
    expect(validateIsf(16.0).valid).toBe(false);
  });

  it("warns for ISF < 1.0 (high resistance)", () => {
    const result = validateIsf(0.8);
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes("resistance"))).toBe(true);
  });

  it("warns for ISF > 8.0 (high sensitivity)", () => {
    const result = validateIsf(9.0);
    expect(result.valid).toBe(true);
    expect(result.warnings.some((w) => w.includes("sensitivity"))).toBe(true);
  });

  it("returns no warnings for normal ISF range", () => {
    const result = validateIsf(3.0);
    expect(result.warnings).toHaveLength(0);
  });
});
