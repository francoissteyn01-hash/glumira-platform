import { describe, it, expect } from "vitest";
import { calculateISF, type ISFInput, type CorrectionEvent } from "./isf-calculator";

/* ── helpers ─────────────────────────────────────────────────── */
const baseInput: ISFInput = {
  tdd: 40,
  insulinType: "rapid",
  diabetesType: "type1",
};

function mkCorrectionHistory(count: number, avgDrop: number): CorrectionEvent[] {
  return Array.from({ length: count }, (_, i) => ({
    timestampUtc: new Date(Date.UTC(2026, 2, 15, 12 + i)).toISOString(),
    preGlucoseMmol: 12.0,
    postGlucoseMmol: 12.0 - avgDrop,
    correctionUnits: 1,
    hoursToPost: 3,
  }));
}

/* ── Structure ───────────────────────────────────────────────── */
describe("calculateISF — structure", () => {
  it("returns complete result", () => {
    const r = calculateISF(baseInput);
    expect(r.estimates.length).toBeGreaterThan(0);
    expect(r.bestEstimate).toBeGreaterThan(0);
    expect(r.disclaimer).toContain("NOT a medical device");
  });

  it("handles zero TDD", () => {
    const r = calculateISF({ ...baseInput, tdd: 0 });
    expect(r.bestEstimate).toBe(0);
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});

/* ── 1800 Rule ───────────────────────────────────────────────── */
describe("calculateISF — 1800 rule", () => {
  it("uses 1800 rule for rapid insulin", () => {
    const r = calculateISF(baseInput);
    expect(r.estimates.some((e) => e.method === "1800 Rule")).toBe(true);
  });

  it("ISF = 1800/40 = 45 mg/dL", () => {
    const r = calculateISF(baseInput);
    const e1800 = r.estimates.find((e) => e.method === "1800 Rule")!;
    expect(e1800.isfMgdl).toBe(45);
  });

  it("best estimate uses 1800 for rapid", () => {
    const r = calculateISF(baseInput);
    expect(r.bestEstimateMgdl).toBe(45);
  });
});

/* ── 1700 Rule ───────────────────────────────────────────────── */
describe("calculateISF — 1700 rule", () => {
  it("uses 1700 rule for regular insulin", () => {
    const r = calculateISF({ ...baseInput, insulinType: "regular" });
    expect(r.estimates.some((e) => e.method === "1700 Rule")).toBe(true);
  });

  it("best estimate uses 1700 for regular", () => {
    const r = calculateISF({ ...baseInput, insulinType: "regular", tdd: 40 });
    expect(r.bestEstimateMgdl).toBeCloseTo(42.5, 0);
  });
});

/* ── Mixed insulin ───────────────────────────────────────────── */
describe("calculateISF — mixed insulin", () => {
  it("includes both 1800 and 1700 for mixed", () => {
    const r = calculateISF({ ...baseInput, insulinType: "mixed" });
    expect(r.estimates.some((e) => e.method === "1800 Rule")).toBe(true);
    expect(r.estimates.some((e) => e.method === "1700 Rule")).toBe(true);
  });
});

/* ── 1500 Rule ───────────────────────────────────────────────── */
describe("calculateISF — 1500 rule", () => {
  it("always includes 1500 rule", () => {
    const r = calculateISF(baseInput);
    expect(r.estimates.some((e) => e.method === "1500 Rule")).toBe(true);
  });
});

/* ── Empirical ISF ───────────────────────────────────────────── */
describe("calculateISF — empirical", () => {
  it("calculates from correction history", () => {
    const r = calculateISF({
      ...baseInput,
      correctionHistory: mkCorrectionHistory(5, 2.5),
    });
    expect(r.empiricalISF).toBeCloseTo(2.5, 0);
  });

  it("null without enough history", () => {
    const r = calculateISF({
      ...baseInput,
      correctionHistory: mkCorrectionHistory(1, 2.5),
    });
    expect(r.empiricalISF).toBeNull();
  });

  it("null without correction history", () => {
    const r = calculateISF(baseInput);
    expect(r.empiricalISF).toBeNull();
  });
});

/* ── Time of day variation ───────────────────────────────────── */
describe("calculateISF — time of day", () => {
  it("includes time periods", () => {
    const r = calculateISF(baseInput);
    expect(r.timeOfDayVariation.length).toBe(5);
  });

  it("dawn has lower multiplier", () => {
    const r = calculateISF(baseInput);
    const dawn = r.timeOfDayVariation.find((t) => t.period.includes("Dawn"))!;
    expect(dawn.multiplier).toBeLessThan(1.0);
  });

  it("night has higher multiplier", () => {
    const r = calculateISF(baseInput);
    const night = r.timeOfDayVariation.find((t) => t.period.includes("Night"))!;
    expect(night.multiplier).toBeGreaterThan(1.0);
  });
});

/* ── TDD scaling ─────────────────────────────────────────────── */
describe("calculateISF — TDD scaling", () => {
  it("higher TDD = lower ISF", () => {
    const low = calculateISF({ ...baseInput, tdd: 20 });
    const high = calculateISF({ ...baseInput, tdd: 80 });
    expect(high.bestEstimate).toBeLessThan(low.bestEstimate);
  });
});

/* ── Recommendations ─────────────────────────────────────────── */
describe("calculateISF — recommendations", () => {
  it("always recommends testing ISF", () => {
    const r = calculateISF(baseInput);
    expect(r.recommendations.some((rec) => rec.includes("Test your ISF"))).toBe(true);
  });

  it("type 2 note", () => {
    const r = calculateISF({ ...baseInput, diabetesType: "type2" });
    expect(r.recommendations.some((rec) => rec.includes("Type 2"))).toBe(true);
  });
});

/* ── Warnings ────────────────────────────────────────────────── */
describe("calculateISF — warnings", () => {
  it("warns for very low TDD", () => {
    const r = calculateISF({ ...baseInput, tdd: 5 });
    expect(r.warnings.some((w) => w.includes("Very low TDD"))).toBe(true);
  });

  it("warns for high TDD", () => {
    const r = calculateISF({ ...baseInput, tdd: 120 });
    expect(r.warnings.some((w) => w.includes("High TDD"))).toBe(true);
  });
});
