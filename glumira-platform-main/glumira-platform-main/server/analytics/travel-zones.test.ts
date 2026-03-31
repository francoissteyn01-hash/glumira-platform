/**
 * GluMira™ — Travel Zones Test Suite
 *
 * Tests timezone direction, risk classification, basal adjustment,
 * and full travel advice generation.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { describe, it, expect } from "vitest";
import {
  travelDirection,
  hoursDifference,
  classifyTravelRisk,
  travelRiskColour,
  computeBasalAdjustment,
  generateTravelAdvice,
  type TravelInput,
} from "./travel-zones";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeInput(overrides: Partial<TravelInput> = {}): TravelInput {
  return {
    originTimezoneOffset: 2,        // SAST
    destinationTimezoneOffset: 0,   // GMT
    departureHour: 10,
    flightDurationHours: 6,
    basalDoseTime: 22,
    basalDoseUnits: 24,
    ...overrides,
  };
}

// ─── travelDirection ─────────────────────────────────────────────────────────

describe("travelDirection", () => {
  it("east when destination offset is greater", () => {
    expect(travelDirection(0, 5)).toBe("east");
  });

  it("west when destination offset is smaller", () => {
    expect(travelDirection(5, 0)).toBe("west");
  });

  it("west when equal (fallback)", () => {
    expect(travelDirection(2, 2)).toBe("west");
  });
});

// ─── hoursDifference ─────────────────────────────────────────────────────────

describe("hoursDifference", () => {
  it("returns absolute difference", () => {
    expect(hoursDifference(2, 0)).toBe(2);
    expect(hoursDifference(0, 8)).toBe(8);
    expect(hoursDifference(-5, 3)).toBe(8);
  });

  it("zero for same timezone", () => {
    expect(hoursDifference(2, 2)).toBe(0);
  });
});

// ─── classifyTravelRisk ──────────────────────────────────────────────────────

describe("classifyTravelRisk", () => {
  it("low for <= 3 hours", () => {
    expect(classifyTravelRisk(0)).toBe("low");
    expect(classifyTravelRisk(2)).toBe("low");
    expect(classifyTravelRisk(3)).toBe("low");
  });

  it("moderate for 4-8 hours", () => {
    expect(classifyTravelRisk(4)).toBe("moderate");
    expect(classifyTravelRisk(8)).toBe("moderate");
  });

  it("high for > 8 hours", () => {
    expect(classifyTravelRisk(9)).toBe("high");
    expect(classifyTravelRisk(12)).toBe("high");
  });
});

// ─── travelRiskColour ────────────────────────────────────────────────────────

describe("travelRiskColour", () => {
  it("green for low", () => expect(travelRiskColour("low")).toBe("#22c55e"));
  it("amber for moderate", () => expect(travelRiskColour("moderate")).toBe("#f59e0b"));
  it("red for high", () => expect(travelRiskColour("high")).toBe("#ef4444"));
});

// ─── computeBasalAdjustment ──────────────────────────────────────────────────

describe("computeBasalAdjustment", () => {
  it("no adjustment for small timezone change", () => {
    const result = computeBasalAdjustment(makeInput({ destinationTimezoneOffset: 1 }));
    expect(result.adjustmentType).toBe("none");
    expect(result.unitsChange).toBe(0);
  });

  it("extra units for moderate eastward travel", () => {
    const result = computeBasalAdjustment(makeInput({
      originTimezoneOffset: 0,
      destinationTimezoneOffset: 6,
    }));
    expect(result.adjustmentType).toBe("extra_units");
    expect(result.unitsChange).toBeGreaterThan(0);
  });

  it("reduce units for moderate westward travel", () => {
    const result = computeBasalAdjustment(makeInput({
      originTimezoneOffset: 6,
      destinationTimezoneOffset: 0,
    }));
    expect(result.adjustmentType).toBe("reduce_units");
    expect(result.unitsChange).toBeLessThan(0);
  });

  it("split dose for large eastward travel", () => {
    const result = computeBasalAdjustment(makeInput({
      originTimezoneOffset: -5,
      destinationTimezoneOffset: 5,
    }));
    expect(result.adjustmentType).toBe("split_dose");
  });

  it("split dose for large westward travel", () => {
    const result = computeBasalAdjustment(makeInput({
      originTimezoneOffset: 5,
      destinationTimezoneOffset: -5,
    }));
    expect(result.adjustmentType).toBe("split_dose");
  });

  it("preserves dose time at destination", () => {
    const result = computeBasalAdjustment(makeInput({ basalDoseTime: 22 }));
    expect(result.newDoseTime).toBe(22);
  });
});

// ─── generateTravelAdvice ────────────────────────────────────────────────────

describe("generateTravelAdvice", () => {
  it("low risk for small timezone change", () => {
    const advice = generateTravelAdvice(makeInput({ destinationTimezoneOffset: 1 }));
    expect(advice.risk).toBe("low");
    expect(advice.monitoringFrequencyHours).toBe(4);
  });

  it("moderate risk for 5-hour change", () => {
    const advice = generateTravelAdvice(makeInput({
      originTimezoneOffset: 0,
      destinationTimezoneOffset: 5,
    }));
    expect(advice.risk).toBe("moderate");
    expect(advice.monitoringFrequencyHours).toBe(3);
  });

  it("high risk for > 8 hour change", () => {
    const advice = generateTravelAdvice(makeInput({
      originTimezoneOffset: -5,
      destinationTimezoneOffset: 5,
    }));
    expect(advice.risk).toBe("high");
    expect(advice.monitoringFrequencyHours).toBe(2);
    expect(advice.warnings.some((w) => w.includes("Large timezone"))).toBe(true);
  });

  it("warns about long flights", () => {
    const advice = generateTravelAdvice(makeInput({ flightDurationHours: 12 }));
    expect(advice.warnings.some((w) => w.includes("Long flight"))).toBe(true);
  });

  it("always recommends hand luggage", () => {
    const advice = generateTravelAdvice(makeInput());
    expect(advice.recommendations.some((r) => r.includes("hand luggage"))).toBe(true);
  });

  it("eastward meal timing advice mentions losing hours", () => {
    const advice = generateTravelAdvice(makeInput({
      originTimezoneOffset: 0,
      destinationTimezoneOffset: 6,
    }));
    expect(advice.direction).toBe("east");
    expect(advice.mealTimingAdvice).toContain("lose hours");
  });

  it("westward meal timing advice mentions gaining hours", () => {
    const advice = generateTravelAdvice(makeInput({
      originTimezoneOffset: 6,
      destinationTimezoneOffset: 0,
    }));
    expect(advice.direction).toBe("west");
    expect(advice.mealTimingAdvice).toContain("gain hours");
  });

  it("recommends fast-acting glucose for moderate+ risk", () => {
    const advice = generateTravelAdvice(makeInput({
      originTimezoneOffset: 0,
      destinationTimezoneOffset: 5,
    }));
    expect(advice.recommendations.some((r) => r.includes("fast-acting glucose"))).toBe(true);
  });
});
