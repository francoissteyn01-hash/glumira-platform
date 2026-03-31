/**
 * GluMira™ Clinician Assistant AI Engine — Test Suite
 * Version: 7.0.0
 *
 * Tests all pure statistical functions.
 * Claude API is NOT called in tests.
 */

import { describe, expect, it } from "vitest";
import {
  calculateTIR,
  calculateVariability,
  scoreHypoRisk,
  generateSafetyFlags,
  buildAnalysisPrompt,
  type GlucoseReading,
  type PatientContext,
  type AnalysisRequest,
} from "./clinician-assistant";

// ─── Fixtures ─────────────────────────────────────────────────

const makeReading = (value: number, offsetMinutes = 0): GlucoseReading => ({
  timestamp: new Date(Date.now() + offsetMinutes * 60_000).toISOString(),
  value,
  source: "cgm",
});

const IN_RANGE_READINGS = Array.from({ length: 100 }, (_, i) =>
  makeReading(120 + (i % 10), i * 5)
);

const HYPO_READINGS = [
  ...Array.from({ length: 10 }, (_, i) => makeReading(45, i * 5)),
  ...Array.from({ length: 90 }, (_, i) => makeReading(110, (i + 10) * 5)),
];

const HIGH_VARIABILITY_READINGS = [
  ...Array.from({ length: 50 }, (_, i) => makeReading(i % 2 === 0 ? 280 : 55, i * 5)),
];

const PATIENT_CONTEXT: PatientContext = {
  diabetesType: "T1",
  dia: 4,
  isf: 50,
  icr: 10,
  targetLow: 70,
  targetHigh: 180,
  units: "mg/dL",
};

// ─── calculateTIR ─────────────────────────────────────────────

describe("calculateTIR", () => {
  it("returns all zeros for empty readings", () => {
    const tir = calculateTIR([]);
    expect(tir.inRange).toBe(0);
    expect(tir.mean).toBe(0);
    expect(tir.gmi).toBe(0);
  });

  it("returns 100% in range for all in-range readings", () => {
    const readings = Array.from({ length: 50 }, () => makeReading(120));
    const tir = calculateTIR(readings, 70, 180);
    expect(tir.inRange).toBe(100);
    expect(tir.veryLow).toBe(0);
    expect(tir.low).toBe(0);
    expect(tir.high).toBe(0);
    expect(tir.veryHigh).toBe(0);
  });

  it("correctly classifies very low readings (<54 mg/dL)", () => {
    const readings = [makeReading(45), makeReading(120), makeReading(120), makeReading(120)];
    const tir = calculateTIR(readings, 70, 180);
    expect(tir.veryLow).toBe(25);
  });

  it("correctly classifies very high readings (>250 mg/dL)", () => {
    const readings = [makeReading(300), makeReading(120), makeReading(120), makeReading(120)];
    const tir = calculateTIR(readings, 70, 180);
    expect(tir.veryHigh).toBe(25);
  });

  it("calculates mean glucose correctly", () => {
    const readings = [makeReading(100), makeReading(200)];
    const tir = calculateTIR(readings);
    expect(tir.mean).toBe(150);
  });

  it("calculates GMI using Bergenstal formula", () => {
    // GMI = 3.31 + 0.02392 × mean
    const readings = [makeReading(154)]; // mean = 154
    const tir = calculateTIR(readings);
    const expected = Math.round((3.31 + 0.02392 * 154) * 100) / 100;
    expect(tir.gmi).toBe(expected);
  });

  it("TIR percentages sum to approximately 100", () => {
    const tir = calculateTIR(IN_RANGE_READINGS, 70, 180);
    const total = tir.veryLow + tir.low + tir.inRange + tir.high + tir.veryHigh;
    expect(total).toBeCloseTo(100, 0);
  });

  it("respects custom target range", () => {
    const readings = [makeReading(90), makeReading(90), makeReading(90)];
    const tirNarrow = calculateTIR(readings, 80, 100);
    const tirWide = calculateTIR(readings, 70, 180);
    expect(tirNarrow.inRange).toBe(100);
    expect(tirWide.inRange).toBe(100);
  });
});

// ─── calculateVariability ─────────────────────────────────────

describe("calculateVariability", () => {
  it("returns zeros for empty or single reading", () => {
    expect(calculateVariability([]).cv).toBe(0);
    expect(calculateVariability([makeReading(120)]).cv).toBe(0);
  });

  it("returns zero SD for identical readings", () => {
    const readings = Array.from({ length: 20 }, () => makeReading(120));
    const v = calculateVariability(readings);
    expect(v.sd).toBe(0);
    expect(v.cv).toBe(0);
    expect(v.isHighVariability).toBe(false);
  });

  it("flags high variability when CV > 36%", () => {
    const v = calculateVariability(HIGH_VARIABILITY_READINGS);
    expect(v.isHighVariability).toBe(true);
    expect(v.cv).toBeGreaterThan(36);
  });

  it("SD is positive for variable readings", () => {
    const v = calculateVariability(HIGH_VARIABILITY_READINGS);
    expect(v.sd).toBeGreaterThan(0);
  });

  it("MAGE is non-negative", () => {
    const v = calculateVariability(IN_RANGE_READINGS);
    expect(v.mage).toBeGreaterThanOrEqual(0);
  });
});

// ─── scoreHypoRisk ────────────────────────────────────────────

describe("scoreHypoRisk", () => {
  it("returns low risk for all in-range readings", () => {
    const risk = scoreHypoRisk(IN_RANGE_READINGS, 70);
    expect(risk.level).toBe("low");
    expect(risk.score).toBe(0);
    expect(risk.hypoEvents).toBe(0);
    expect(risk.nearHypoEvents).toBe(0);
  });

  it("returns critical risk for many hypo events", () => {
    const risk = scoreHypoRisk(HYPO_READINGS, 70);
    expect(risk.level).toBe("critical");
    expect(risk.hypoEvents).toBe(10);
  });

  it("score is between 0 and 100", () => {
    const risk = scoreHypoRisk(HYPO_READINGS, 70);
    expect(risk.score).toBeGreaterThanOrEqual(0);
    expect(risk.score).toBeLessThanOrEqual(100);
  });

  it("description is non-empty", () => {
    const risk = scoreHypoRisk(IN_RANGE_READINGS, 70);
    expect(risk.description.length).toBeGreaterThan(10);
  });

  it("counts near-hypo events (54-70 mg/dL)", () => {
    const readings = [makeReading(60), makeReading(65), makeReading(120)];
    const risk = scoreHypoRisk(readings, 70);
    expect(risk.nearHypoEvents).toBe(2);
    expect(risk.hypoEvents).toBe(0);
  });
});

// ─── generateSafetyFlags ──────────────────────────────────────

describe("generateSafetyFlags", () => {
  it("returns no flags for perfect data", () => {
    const tir = calculateTIR(IN_RANGE_READINGS, 70, 180);
    const variability = calculateVariability(IN_RANGE_READINGS);
    const hypoRisk = scoreHypoRisk(IN_RANGE_READINGS, 70);
    const flags = generateSafetyFlags(tir, variability, hypoRisk);
    expect(flags).toHaveLength(0);
  });

  it("generates SF-01 for veryLow > 1%", () => {
    const tir = { veryLow: 2, low: 0, inRange: 98, high: 0, veryHigh: 0, mean: 110, gmi: 5.9 };
    const variability = { cv: 20, sd: 22, mage: 30, isHighVariability: false };
    const hypoRisk = { score: 0, level: "low" as const, hypoEvents: 0, nearHypoEvents: 0, description: "" };
    const flags = generateSafetyFlags(tir, variability, hypoRisk);
    expect(flags.some((f) => f.code === "SF-01")).toBe(true);
    expect(flags.find((f) => f.code === "SF-01")?.severity).toBe("critical");
  });

  it("generates SF-04 for high variability", () => {
    const tir = { veryLow: 0, low: 0, inRange: 100, high: 0, veryHigh: 0, mean: 120, gmi: 6.2 };
    const variability = { cv: 40, sd: 48, mage: 60, isHighVariability: true };
    const hypoRisk = { score: 0, level: "low" as const, hypoEvents: 0, nearHypoEvents: 0, description: "" };
    const flags = generateSafetyFlags(tir, variability, hypoRisk);
    expect(flags.some((f) => f.code === "SF-04")).toBe(true);
  });

  it("generates SF-05 for critical hypo risk", () => {
    const tir = { veryLow: 0, low: 0, inRange: 100, high: 0, veryHigh: 0, mean: 120, gmi: 6.2 };
    const variability = { cv: 20, sd: 24, mage: 30, isHighVariability: false };
    const hypoRisk = { score: 90, level: "critical" as const, hypoEvents: 5, nearHypoEvents: 3, description: "Critical" };
    const flags = generateSafetyFlags(tir, variability, hypoRisk);
    expect(flags.some((f) => f.code === "SF-05")).toBe(true);
  });

  it("all flags have code, severity, and message", () => {
    const tir = { veryLow: 5, low: 10, inRange: 50, high: 20, veryHigh: 15, mean: 180, gmi: 7.6 };
    const variability = { cv: 45, sd: 81, mage: 90, isHighVariability: true };
    const hypoRisk = { score: 100, level: "critical" as const, hypoEvents: 10, nearHypoEvents: 5, description: "Critical" };
    const flags = generateSafetyFlags(tir, variability, hypoRisk);
    for (const flag of flags) {
      expect(flag.code).toBeTruthy();
      expect(flag.severity).toMatch(/^(info|warning|critical)$/);
      expect(flag.message.length).toBeGreaterThan(10);
    }
  });
});

// ─── buildAnalysisPrompt ──────────────────────────────────────

describe("buildAnalysisPrompt", () => {
  const tir = calculateTIR(IN_RANGE_READINGS, 70, 180);
  const variability = calculateVariability(IN_RANGE_READINGS);
  const hypoRisk = scoreHypoRisk(IN_RANGE_READINGS, 70);

  const request: AnalysisRequest = {
    patientContext: PATIENT_CONTEXT,
    glucoseReadings: IN_RANGE_READINGS,
    analysisType: "pattern_summary",
  };

  it("returns a non-empty string", () => {
    const prompt = buildAnalysisPrompt(request, tir, variability, hypoRisk);
    expect(prompt.length).toBeGreaterThan(100);
  });

  it("includes patient diabetes type", () => {
    const prompt = buildAnalysisPrompt(request, tir, variability, hypoRisk);
    expect(prompt).toContain("T1");
  });

  it("includes TIR values", () => {
    const prompt = buildAnalysisPrompt(request, tir, variability, hypoRisk);
    expect(prompt).toContain("TIME IN RANGE");
    expect(prompt).toContain("In Range");
  });

  it("includes variability section", () => {
    const prompt = buildAnalysisPrompt(request, tir, variability, hypoRisk);
    expect(prompt).toContain("VARIABILITY");
    expect(prompt).toContain("CV:");
  });

  it("includes hypo risk section", () => {
    const prompt = buildAnalysisPrompt(request, tir, variability, hypoRisk);
    expect(prompt).toContain("HYPO RISK");
  });

  it("includes clinician question when provided", () => {
    const reqWithQuestion = { ...request, clinicianQuestion: "Why is overnight glucose rising?" };
    const prompt = buildAnalysisPrompt(reqWithQuestion, tir, variability, hypoRisk);
    expect(prompt).toContain("Why is overnight glucose rising?");
  });

  it("includes DISCLAIMER instruction", () => {
    const prompt = buildAnalysisPrompt(request, tir, variability, hypoRisk);
    expect(prompt).toContain("DISCLAIMER");
  });

  it("includes safety instruction not to suggest doses", () => {
    const prompt = buildAnalysisPrompt(request, tir, variability, hypoRisk);
    expect(prompt).toContain("dose");
  });
});
