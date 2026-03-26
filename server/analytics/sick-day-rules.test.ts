/**
 * GluMira™ — Sick Day Rules Test Suite
 *
 * Tests ketone classification, severity classification, advice generation,
 * and edge cases for sick day management.
 *
 * GluMira is an informational tool only. Not a medical device.
 */

import { describe, it, expect } from "vitest";
import {
  classifyKetones,
  ketoneColour,
  classifySickDaySeverity,
  sickDaySeverityColour,
  generateSickDayAdvice,
  type SickDayInput,
} from "./sick-day-rules";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeInput(overrides: Partial<SickDayInput> = {}): SickDayInput {
  return {
    currentGlucoseMmol: 8.0,
    ketonesMmol: 0.2,
    temperature: 37.0,
    vomiting: false,
    diarrhoea: false,
    ableToEat: true,
    hoursIll: 2,
    ...overrides,
  };
}

// ─── classifyKetones ─────────────────────────────────────────────────────────

describe("classifyKetones", () => {
  it("negative below 0.6", () => expect(classifyKetones(0.3)).toBe("negative"));
  it("trace at 0.6-0.9", () => expect(classifyKetones(0.8)).toBe("trace"));
  it("small at 1.0-1.4", () => expect(classifyKetones(1.2)).toBe("small"));
  it("moderate at 1.5-2.9", () => expect(classifyKetones(2.0)).toBe("moderate"));
  it("large at 3.0+", () => expect(classifyKetones(3.5)).toBe("large"));
  it("zero is negative", () => expect(classifyKetones(0)).toBe("negative"));
});

// ─── ketoneColour ────────────────────────────────────────────────────────────

describe("ketoneColour", () => {
  it("green for negative", () => expect(ketoneColour("negative")).toBe("#22c55e"));
  it("lime for trace", () => expect(ketoneColour("trace")).toBe("#84cc16"));
  it("amber for small", () => expect(ketoneColour("small")).toBe("#f59e0b"));
  it("orange for moderate", () => expect(ketoneColour("moderate")).toBe("#f97316"));
  it("red for large", () => expect(ketoneColour("large")).toBe("#ef4444"));
});

// ─── classifySickDaySeverity ─────────────────────────────────────────────────

describe("classifySickDaySeverity", () => {
  it("mild for normal readings", () => {
    expect(classifySickDaySeverity(makeInput())).toBe("mild");
  });

  it("moderate for glucose > 13", () => {
    expect(classifySickDaySeverity(makeInput({ currentGlucoseMmol: 14 }))).toBe("moderate");
  });

  it("moderate for vomiting", () => {
    expect(classifySickDaySeverity(makeInput({ vomiting: true }))).toBe("moderate");
  });

  it("moderate for small ketones", () => {
    expect(classifySickDaySeverity(makeInput({ ketonesMmol: 1.2 }))).toBe("moderate");
  });

  it("severe for moderate ketones", () => {
    expect(classifySickDaySeverity(makeInput({ ketonesMmol: 2.0 }))).toBe("severe");
  });

  it("severe for high glucose + vomiting", () => {
    expect(classifySickDaySeverity(makeInput({ currentGlucoseMmol: 16, vomiting: true }))).toBe("severe");
  });

  it("emergency for large ketones", () => {
    expect(classifySickDaySeverity(makeInput({ ketonesMmol: 3.5 }))).toBe("emergency");
  });

  it("emergency for glucose > 20", () => {
    expect(classifySickDaySeverity(makeInput({ currentGlucoseMmol: 22 }))).toBe("emergency");
  });

  it("emergency for prolonged vomiting + unable to eat", () => {
    expect(classifySickDaySeverity(makeInput({
      vomiting: true,
      ableToEat: false,
      hoursIll: 8,
    }))).toBe("emergency");
  });

  it("handles null ketones as negative", () => {
    expect(classifySickDaySeverity(makeInput({ ketonesMmol: null }))).toBe("mild");
  });
});

// ─── sickDaySeverityColour ───────────────────────────────────────────────────

describe("sickDaySeverityColour", () => {
  it("green for mild", () => expect(sickDaySeverityColour("mild")).toBe("#22c55e"));
  it("amber for moderate", () => expect(sickDaySeverityColour("moderate")).toBe("#f59e0b"));
  it("orange for severe", () => expect(sickDaySeverityColour("severe")).toBe("#f97316"));
  it("red for emergency", () => expect(sickDaySeverityColour("emergency")).toBe("#ef4444"));
});

// ─── generateSickDayAdvice ───────────────────────────────────────────────────

describe("generateSickDayAdvice", () => {
  it("mild advice — 4-hour glucose checks", () => {
    const advice = generateSickDayAdvice(makeInput());
    expect(advice.severity).toBe("mild");
    expect(advice.glucoseCheckFrequencyHours).toBe(4);
    expect(advice.seekMedicalAttention).toBe(false);
  });

  it("moderate advice — 2-hour glucose checks", () => {
    const advice = generateSickDayAdvice(makeInput({ currentGlucoseMmol: 14 }));
    expect(advice.severity).toBe("moderate");
    expect(advice.glucoseCheckFrequencyHours).toBe(2);
  });

  it("severe advice — seek medical attention", () => {
    const advice = generateSickDayAdvice(makeInput({ ketonesMmol: 2.0 }));
    expect(advice.severity).toBe("severe");
    expect(advice.seekMedicalAttention).toBe(true);
  });

  it("emergency advice — immediate medical attention", () => {
    const advice = generateSickDayAdvice(makeInput({ ketonesMmol: 3.5 }));
    expect(advice.severity).toBe("emergency");
    expect(advice.seekMedicalAttention).toBe(true);
    expect(advice.warnings.some((w) => w.includes("EMERGENCY"))).toBe(true);
  });

  it("includes vomiting-specific fluid advice", () => {
    const advice = generateSickDayAdvice(makeInput({ vomiting: true }));
    expect(advice.recommendations.some((r) => r.includes("small sips"))).toBe(true);
  });

  it("includes unable-to-eat advice", () => {
    const advice = generateSickDayAdvice(makeInput({ ableToEat: false }));
    expect(advice.recommendations.some((r) => r.includes("sugary fluids"))).toBe(true);
  });

  it("includes fever advice for high temperature", () => {
    const advice = generateSickDayAdvice(makeInput({ temperature: 39.0 }));
    expect(advice.recommendations.some((r) => r.includes("Fever"))).toBe(true);
  });

  it("always includes never-stop-insulin advice", () => {
    const advice = generateSickDayAdvice(makeInput());
    expect(advice.recommendations.some((r) => r.includes("Never stop"))).toBe(true);
  });

  it("DKA warning for large ketones", () => {
    const advice = generateSickDayAdvice(makeInput({ ketonesMmol: 4.0 }));
    expect(advice.warnings.some((w) => w.includes("DKA"))).toBe(true);
  });
});
