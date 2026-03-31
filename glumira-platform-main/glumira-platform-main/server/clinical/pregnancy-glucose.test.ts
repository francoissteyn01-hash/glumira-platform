import { describe, it, expect } from "vitest";
import { assessPregnancyGlucose, type PregnancyGlucoseInput } from "./pregnancy-glucose";

/* ── helpers ─────────────────────────────────────────────────── */
const mkReadings = (
  tags: ("fasting" | "1h-post" | "2h-post" | "pre-meal" | "bedtime")[],
  values: number[]
) =>
  tags.map((tag, i) => ({
    timestampUtc: new Date(Date.UTC(2026, 2, 15, 6 + i * 3)).toISOString(),
    glucoseMmol: values[i],
    tag,
  }));

const baseInput: PregnancyGlucoseInput = {
  diabetesType: "type1",
  trimester: 2,
  weeksGestation: 22,
  recentReadings: mkReadings(
    ["fasting", "1h-post", "fasting", "1h-post", "2h-post", "bedtime"],
    [5.0, 7.0, 4.8, 7.5, 6.0, 6.2]
  ),
  currentA1c: 6.0,
  onInsulin: true,
  hypoEventsLastWeek: 1,
};

/* ── Structure ───────────────────────────────────────────────── */
describe("assessPregnancyGlucose — structure", () => {
  it("returns complete result", () => {
    const r = assessPregnancyGlucose(baseInput);
    expect(r.targets.length).toBeGreaterThan(0);
    expect(r.disclaimer).toContain("educational platform");
    expect(r.monitoringSchedule.length).toBeGreaterThan(0);
  });

  it("includes 5 target contexts", () => {
    const r = assessPregnancyGlucose(baseInput);
    expect(r.targets.length).toBe(5);
    expect(r.targets.map((t) => t.context)).toContain("Fasting");
    expect(r.targets.map((t) => t.context)).toContain("1 hour post-meal");
  });
});

/* ── Current performance ─────────────────────────────────────── */
describe("assessPregnancyGlucose — performance", () => {
  it("calculates fasting mean", () => {
    const r = assessPregnancyGlucose(baseInput);
    expect(r.currentPerformance.fastingMean).toBeGreaterThan(0);
  });

  it("calculates 1h post-meal mean", () => {
    const r = assessPregnancyGlucose(baseInput);
    expect(r.currentPerformance.oneHourPostMean).toBeGreaterThan(0);
  });

  it("fasting in target for good readings", () => {
    const r = assessPregnancyGlucose(baseInput);
    expect(r.currentPerformance.fastingInTarget).toBe(true);
  });

  it("fasting out of target for high readings", () => {
    const input: PregnancyGlucoseInput = {
      ...baseInput,
      recentReadings: mkReadings(["fasting", "fasting"], [6.0, 6.5]),
    };
    const r = assessPregnancyGlucose(input);
    expect(r.currentPerformance.fastingInTarget).toBe(false);
  });

  it("handles no readings for a tag", () => {
    const input: PregnancyGlucoseInput = {
      ...baseInput,
      recentReadings: mkReadings(["fasting"], [5.0]),
    };
    const r = assessPregnancyGlucose(input);
    expect(r.currentPerformance.oneHourPostMean).toBeNull();
  });
});

/* ── A1c assessment ──────────────────────────────────────────── */
describe("assessPregnancyGlucose — A1c", () => {
  it("excellent for A1c <= 6.0", () => {
    const r = assessPregnancyGlucose(baseInput);
    expect(r.a1cStatus).toContain("Excellent");
  });

  it("good for A1c 6.0-6.5", () => {
    const input = { ...baseInput, currentA1c: 6.3 };
    const r = assessPregnancyGlucose(input);
    expect(r.a1cStatus).toContain("Good");
  });

  it("above target for A1c 6.5-7.0", () => {
    const input = { ...baseInput, currentA1c: 6.8 };
    const r = assessPregnancyGlucose(input);
    expect(r.a1cStatus).toContain("Above target");
  });

  it("significantly above for A1c > 7.0", () => {
    const input = { ...baseInput, currentA1c: 7.5 };
    const r = assessPregnancyGlucose(input);
    expect(r.a1cStatus).toContain("Significantly");
  });

  it("null status when no A1c provided", () => {
    const input = { ...baseInput, currentA1c: undefined };
    const r = assessPregnancyGlucose(input);
    expect(r.a1cStatus).toBeNull();
  });
});

/* ── Risks ───────────────────────────────────────────────────── */
describe("assessPregnancyGlucose — risks", () => {
  it("flags elevated fasting glucose", () => {
    const input: PregnancyGlucoseInput = {
      ...baseInput,
      recentReadings: mkReadings(["fasting", "fasting"], [5.8, 6.0]),
    };
    const r = assessPregnancyGlucose(input);
    expect(r.risks.some((r) => r.risk.includes("fasting"))).toBe(true);
  });

  it("flags elevated post-meal glucose", () => {
    const input: PregnancyGlucoseInput = {
      ...baseInput,
      recentReadings: mkReadings(["1h-post", "1h-post"], [9.0, 8.5]),
    };
    const r = assessPregnancyGlucose(input);
    expect(r.risks.some((r) => r.risk.includes("post-meal"))).toBe(true);
  });

  it("flags frequent hypoglycemia", () => {
    const input = { ...baseInput, hypoEventsLastWeek: 4 };
    const r = assessPregnancyGlucose(input);
    expect(r.risks.some((r) => r.risk.includes("hypoglycemia"))).toBe(true);
  });

  it("flags first trimester hypo risk", () => {
    const input: PregnancyGlucoseInput = { ...baseInput, trimester: 1, weeksGestation: 8 };
    const r = assessPregnancyGlucose(input);
    expect(r.risks.some((r) => r.risk.includes("First trimester"))).toBe(true);
  });

  it("flags third trimester insulin resistance", () => {
    const input: PregnancyGlucoseInput = { ...baseInput, trimester: 3, weeksGestation: 32 };
    const r = assessPregnancyGlucose(input);
    expect(r.risks.some((r) => r.risk.includes("Third trimester"))).toBe(true);
  });

  it("no risks for good readings", () => {
    const r = assessPregnancyGlucose(baseInput);
    // Should have at most the trimester risk
    const highRisks = r.risks.filter((r) => r.severity === "high");
    expect(highRisks.length).toBe(0);
  });
});

/* ── Monitoring schedule ─────────────────────────────────────── */
describe("assessPregnancyGlucose — monitoring", () => {
  it("7+ tests for type 1", () => {
    const r = assessPregnancyGlucose(baseInput);
    expect(r.monitoringSchedule.some((s) => s.includes("7"))).toBe(true);
  });

  it("4+ tests for gestational", () => {
    const input: PregnancyGlucoseInput = { ...baseInput, diabetesType: "gestational" };
    const r = assessPregnancyGlucose(input);
    expect(r.monitoringSchedule.some((s) => s.includes("4"))).toBe(true);
  });
});

/* ── Insulin notes ───────────────────────────────────────────── */
describe("assessPregnancyGlucose — insulin", () => {
  it("first trimester: decrease warning", () => {
    const input: PregnancyGlucoseInput = { ...baseInput, trimester: 1, weeksGestation: 8 };
    const r = assessPregnancyGlucose(input);
    expect(r.insulinNotes.some((n) => n.includes("DECREASE"))).toBe(true);
  });

  it("second trimester: increasing needs", () => {
    const r = assessPregnancyGlucose(baseInput);
    expect(r.insulinNotes.some((n) => n.includes("increasing"))).toBe(true);
  });

  it("third trimester: peak needs", () => {
    const input: PregnancyGlucoseInput = { ...baseInput, trimester: 3, weeksGestation: 34 };
    const r = assessPregnancyGlucose(input);
    expect(r.insulinNotes.some((n) => n.includes("peak"))).toBe(true);
  });

  it("gestational diet note when not on insulin", () => {
    const input: PregnancyGlucoseInput = {
      ...baseInput,
      diabetesType: "gestational",
      onInsulin: false,
    };
    const r = assessPregnancyGlucose(input);
    expect(r.insulinNotes.some((n) => n.includes("diet"))).toBe(true);
  });
});

/* ── Trimester guidance ──────────────────────────────────────── */
describe("assessPregnancyGlucose — trimester guidance", () => {
  it("includes week number", () => {
    const r = assessPregnancyGlucose(baseInput);
    expect(r.trimesterGuidance).toContain("22");
  });

  it("first trimester mentions organ development", () => {
    const input: PregnancyGlucoseInput = { ...baseInput, trimester: 1, weeksGestation: 10 };
    const r = assessPregnancyGlucose(input);
    expect(r.trimesterGuidance).toContain("organ development");
  });

  it("third trimester mentions delivery", () => {
    const input: PregnancyGlucoseInput = { ...baseInput, trimester: 3, weeksGestation: 36 };
    const r = assessPregnancyGlucose(input);
    expect(r.trimesterGuidance).toContain("delivery");
  });
});

/* ── Warnings ────────────────────────────────────────────────── */
describe("assessPregnancyGlucose — warnings", () => {
  it("warns for high-risk factors", () => {
    const input: PregnancyGlucoseInput = {
      ...baseInput,
      recentReadings: mkReadings(["fasting", "fasting"], [7.0, 7.5]),
      currentA1c: 8.0,
    };
    const r = assessPregnancyGlucose(input);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("warns for frequent hypos", () => {
    const input = { ...baseInput, hypoEventsLastWeek: 5 };
    const r = assessPregnancyGlucose(input);
    expect(r.warnings.some((w) => w.includes("hypoglycemia"))).toBe(true);
  });

  it("no warnings for good control", () => {
    const r = assessPregnancyGlucose(baseInput);
    expect(r.warnings.length).toBe(0);
  });
});
