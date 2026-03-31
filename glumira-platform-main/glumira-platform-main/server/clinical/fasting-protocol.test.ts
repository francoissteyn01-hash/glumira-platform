import { describe, it, expect } from "vitest";
import { generateFastingProtocol, type FastingInput } from "./fasting-protocol";

/* ── helpers ─────────────────────────────────────────────────── */
const baseInput: FastingInput = {
  fastingType: "intermittent-16-8",
  fastingStartHour: 20,
  fastingDurationHours: 16,
  diabetesType: "type2",
  currentBasalUnits: 20,
  currentBolusPerMeal: 6,
  mealsPerDay: 3,
  recentGlucoseReadings: [6.5, 7.0, 6.8, 7.2, 6.0],
};

/* ── Basic protocol generation ───────────────────────────────── */
describe("generateFastingProtocol — basics", () => {
  it("generates a protocol for 16:8 fasting", () => {
    const r = generateFastingProtocol(baseInput);
    expect(r.fastingType).toBe("intermittent-16-8");
    expect(r.fastingWindow.durationHours).toBe(16);
    expect(r.eatingWindow.durationHours).toBe(8);
  });

  it("calculates correct eating window", () => {
    const r = generateFastingProtocol(baseInput);
    expect(r.eatingWindow.durationHours).toBe(24 - baseInput.fastingDurationHours);
  });

  it("returns recommendations array", () => {
    const r = generateFastingProtocol(baseInput);
    expect(r.recommendations.length).toBeGreaterThan(0);
  });
});

/* ── Risk assessment ─────────────────────────────────────────── */
describe("generateFastingProtocol — risk", () => {
  it("low risk for stable type 2 with short fast", () => {
    const input: FastingInput = {
      ...baseInput,
      fastingDurationHours: 12,
      fastingType: "custom",
    };
    const r = generateFastingProtocol(input);
    expect(r.riskLevel).toBe("low");
    expect(r.approved).toBe(true);
  });

  it("moderate risk for type 2 with 16h fast", () => {
    const r = generateFastingProtocol(baseInput);
    expect(["low", "moderate"]).toContain(r.riskLevel);
    expect(r.approved).toBe(true);
  });

  it("high risk for type 1 with long fast", () => {
    const input: FastingInput = {
      ...baseInput,
      diabetesType: "type1",
      fastingDurationHours: 20,
      fastingType: "intermittent-20-4",
    };
    const r = generateFastingProtocol(input);
    expect(["high", "very-high"]).toContain(r.riskLevel);
  });

  it("very high risk with recent hypos + sulfonylurea + type 1", () => {
    const input: FastingInput = {
      ...baseInput,
      diabetesType: "type1",
      fastingDurationHours: 20,
      recentGlucoseReadings: [3.2, 3.5, 6.0, 14.0, 3.8],
      takesSulfonylurea: true,
    };
    const r = generateFastingProtocol(input);
    expect(r.riskLevel).toBe("very-high");
    expect(r.approved).toBe(false);
  });
});

/* ── Basal adjustment ────────────────────────────────────────── */
describe("generateFastingProtocol — basal", () => {
  it("reduces basal for 16h fast", () => {
    const r = generateFastingProtocol(baseInput);
    expect(r.basalAdjustment.changePercent).toBeLessThan(0);
    expect(r.basalAdjustment.newDose).toBeLessThan(baseInput.currentBasalUnits);
  });

  it("reduces basal more for 20h fast", () => {
    const short = generateFastingProtocol({ ...baseInput, fastingDurationHours: 16 });
    const long = generateFastingProtocol({ ...baseInput, fastingDurationHours: 20, fastingType: "intermittent-20-4" });
    expect(long.basalAdjustment.changePercent).toBeLessThan(short.basalAdjustment.changePercent);
  });

  it("further reduces for type 1", () => {
    const t2 = generateFastingProtocol(baseInput);
    const t1 = generateFastingProtocol({ ...baseInput, diabetesType: "type1" });
    expect(t1.basalAdjustment.changePercent).toBeLessThan(t2.basalAdjustment.changePercent);
  });
});

/* ── Bolus guidance ──────────────────────────────────────────── */
describe("generateFastingProtocol — bolus", () => {
  it("redistributes bolus across eating window meals", () => {
    const r = generateFastingProtocol(baseInput);
    expect(r.bolusGuidance.mealsInWindow).toBeGreaterThan(0);
    expect(r.bolusGuidance.adjustedBolusPerMeal).toBeGreaterThan(0);
  });

  it("fewer meals in window for longer fasts", () => {
    const short = generateFastingProtocol({ ...baseInput, fastingDurationHours: 12, fastingType: "custom" });
    const long = generateFastingProtocol({ ...baseInput, fastingDurationHours: 20, fastingType: "intermittent-20-4" });
    expect(long.bolusGuidance.mealsInWindow).toBeLessThanOrEqual(short.bolusGuidance.mealsInWindow);
  });
});

/* ── Break-fast guidance ─────────────────────────────────────── */
describe("generateFastingProtocol — break-fast", () => {
  it("recommends carbs for breaking fast", () => {
    const r = generateFastingProtocol(baseInput);
    expect(r.breakFastGuidance.recommendedCarbsGrams).toBeGreaterThan(0);
  });

  it("recommends fewer carbs for longer fasts", () => {
    const short = generateFastingProtocol({ ...baseInput, fastingDurationHours: 12, fastingType: "custom" });
    const long = generateFastingProtocol({ ...baseInput, fastingDurationHours: 20, fastingType: "intermittent-20-4" });
    expect(long.breakFastGuidance.recommendedCarbsGrams).toBeLessThanOrEqual(short.breakFastGuidance.recommendedCarbsGrams);
  });
});

/* ── Monitoring ──────────────────────────────────────────────── */
describe("generateFastingProtocol — monitoring", () => {
  it("includes monitoring check times", () => {
    const r = generateFastingProtocol(baseInput);
    expect(r.monitoringSchedule.checkTimes.length).toBeGreaterThan(0);
  });

  it("more frequent monitoring for higher risk", () => {
    const low: FastingInput = { ...baseInput, fastingDurationHours: 12, fastingType: "custom" };
    const high: FastingInput = {
      ...baseInput,
      diabetesType: "type1",
      fastingDurationHours: 20,
      recentGlucoseReadings: [3.5, 6.0, 14.0],
      fastingType: "intermittent-20-4",
    };
    const lowR = generateFastingProtocol(low);
    const highR = generateFastingProtocol(high);
    expect(highR.monitoringSchedule.frequencyHours).toBeLessThanOrEqual(lowR.monitoringSchedule.frequencyHours);
  });
});

/* ── Break-fasting thresholds ────────────────────────────────── */
describe("generateFastingProtocol — thresholds", () => {
  it("sets hypo threshold at 3.9 mmol/L", () => {
    const r = generateFastingProtocol(baseInput);
    expect(r.breakFastingThresholds.hypoThresholdMmol).toBe(3.9);
  });

  it("sets hyper threshold at 16.7 mmol/L", () => {
    const r = generateFastingProtocol(baseInput);
    expect(r.breakFastingThresholds.hyperThresholdMmol).toBe(16.7);
  });
});

/* ── Ramadan-specific ────────────────────────────────────────── */
describe("generateFastingProtocol — Ramadan", () => {
  it("provides Suhoor guidance for Ramadan", () => {
    const input: FastingInput = {
      ...baseInput,
      fastingType: "ramadan",
      fastingStartHour: 4,
      fastingDurationHours: 15,
    };
    const r = generateFastingProtocol(input);
    expect(r.recommendations.some((rec) => rec.includes("Suhoor"))).toBe(true);
  });

  it("provides Iftar guidance for Ramadan", () => {
    const input: FastingInput = {
      ...baseInput,
      fastingType: "ramadan",
      fastingStartHour: 4,
      fastingDurationHours: 15,
    };
    const r = generateFastingProtocol(input);
    expect(r.recommendations.some((rec) => rec.includes("Iftar"))).toBe(true);
  });

  it("sets basal timing to Suhoor for Ramadan", () => {
    const input: FastingInput = {
      ...baseInput,
      fastingType: "ramadan",
      fastingStartHour: 4,
      fastingDurationHours: 15,
    };
    const r = generateFastingProtocol(input);
    expect(r.basalAdjustment.timing).toContain("Suhoor");
  });
});

/* ── Medication warnings ─────────────────────────────────────── */
describe("generateFastingProtocol — medications", () => {
  it("warns about sulfonylurea", () => {
    const input: FastingInput = { ...baseInput, takesSulfonylurea: true };
    const r = generateFastingProtocol(input);
    expect(r.warnings.some((w) => w.includes("Sulfonylurea"))).toBe(true);
    expect(r.medicationAdjustments.some((m) => m.includes("sulfonylurea"))).toBe(true);
  });

  it("adjusts metformin timing", () => {
    const input: FastingInput = { ...baseInput, takesMetformin: true };
    const r = generateFastingProtocol(input);
    expect(r.medicationAdjustments.some((m) => m.includes("Metformin"))).toBe(true);
  });

  it("suggests pump temp basal", () => {
    const input: FastingInput = { ...baseInput, usesInsulinPump: true };
    const r = generateFastingProtocol(input);
    expect(r.medicationAdjustments.some((m) => m.includes("temporary basal"))).toBe(true);
  });
});

/* ── Type 1 warnings ─────────────────────────────────────────── */
describe("generateFastingProtocol — type 1", () => {
  it("warns about DKA risk for extended type 1 fasting", () => {
    const input: FastingInput = {
      ...baseInput,
      diabetesType: "type1",
      fastingDurationHours: 20,
      fastingType: "intermittent-20-4",
    };
    const r = generateFastingProtocol(input);
    expect(r.warnings.some((w) => w.includes("DKA"))).toBe(true);
  });

  it("recommends never skipping basal for type 1", () => {
    const input: FastingInput = { ...baseInput, diabetesType: "type1" };
    const r = generateFastingProtocol(input);
    expect(r.recommendations.some((rec) => rec.includes("Never skip basal"))).toBe(true);
  });
});
