import { describe, it, expect } from "vitest";
import { estimateA1C, type A1CInput } from "./a1c-estimator";

/* ── helpers ─────────────────────────────────────────────────── */
function mkReadings(days: number, baseMmol: number): A1CInput["readings"] {
  const readings: A1CInput["readings"] = [];
  for (let d = 0; d < days; d++) {
    for (let i = 0; i < 96; i++) {
      readings.push({
        timestampUtc: new Date(Date.UTC(2026, 2, 1 + d) + i * 15 * 60 * 1000).toISOString(),
        glucoseMmol: Math.round((baseMmol + Math.sin(i / 10) * 0.5) * 10) / 10,
      });
    }
  }
  return readings;
}

const goodReadings = mkReadings(14, 7.0);
const highReadings = mkReadings(14, 12.0);

const baseInput: A1CInput = {
  readings: goodReadings,
  diabetesType: "type1",
};

/* ── Structure ───────────────────────────────────────────────── */
describe("estimateA1C — structure", () => {
  it("returns complete result", () => {
    const r = estimateA1C(baseInput);
    expect(r.gmi).toBeGreaterThan(0);
    expect(r.estimates.length).toBe(3);
    expect(r.disclaimer).toContain("NOT a medical device");
  });

  it("handles empty readings", () => {
    const r = estimateA1C({ readings: [], diabetesType: "type1" });
    expect(r.readingCount).toBe(0);
    expect(r.gmi).toBe(0);
  });
});

/* ── Mean glucose ────────────────────────────────────────────── */
describe("estimateA1C — mean glucose", () => {
  it("calculates mean in mmol", () => {
    const r = estimateA1C(baseInput);
    expect(r.meanGlucoseMmol).toBeGreaterThan(6);
    expect(r.meanGlucoseMmol).toBeLessThan(8);
  });

  it("converts to mg/dL", () => {
    const r = estimateA1C(baseInput);
    expect(r.meanGlucoseMgdl).toBeGreaterThan(100);
  });

  it("higher glucose = higher mean", () => {
    const normal = estimateA1C(baseInput);
    const high = estimateA1C({ ...baseInput, readings: highReadings });
    expect(high.meanGlucoseMmol).toBeGreaterThan(normal.meanGlucoseMmol);
  });
});

/* ── GMI ─────────────────────────────────────────────────────── */
describe("estimateA1C — GMI", () => {
  it("GMI is reasonable for normal glucose", () => {
    const r = estimateA1C(baseInput);
    expect(r.gmi).toBeGreaterThan(5);
    expect(r.gmi).toBeLessThan(9);
  });

  it("GMI is higher for high glucose", () => {
    const normal = estimateA1C(baseInput);
    const high = estimateA1C({ ...baseInput, readings: highReadings });
    expect(high.gmi).toBeGreaterThan(normal.gmi);
  });

  it("GMI matches bestEstimate", () => {
    const r = estimateA1C(baseInput);
    expect(r.bestEstimate).toBe(r.gmi);
  });
});

/* ── Multiple estimates ──────────────────────────────────────── */
describe("estimateA1C — estimates", () => {
  it("includes GMI, ADAG, Nathan", () => {
    const r = estimateA1C(baseInput);
    const methods = r.estimates.map((e) => e.method);
    expect(methods).toContain("GMI");
    expect(methods).toContain("ADAG");
    expect(methods).toContain("Nathan");
  });

  it("all estimates are positive", () => {
    const r = estimateA1C(baseInput);
    r.estimates.forEach((e) => {
      expect(e.estimatedA1C).toBeGreaterThan(0);
    });
  });

  it("each estimate has formula", () => {
    const r = estimateA1C(baseInput);
    r.estimates.forEach((e) => {
      expect(e.formula.length).toBeGreaterThan(0);
    });
  });
});

/* ── Data quality ────────────────────────────────────────────── */
describe("estimateA1C — data quality", () => {
  it("excellent for 14+ days with dense readings", () => {
    const r = estimateA1C(baseInput);
    expect(r.dataQuality).toBe("excellent");
  });

  it("poor for minimal data", () => {
    const r = estimateA1C({
      ...baseInput,
      readings: [
        { timestampUtc: new Date().toISOString(), glucoseMmol: 7.0 },
        { timestampUtc: new Date(Date.now() + 60000).toISOString(), glucoseMmol: 7.2 },
      ],
    });
    expect(r.dataQuality).toBe("poor");
  });
});

/* ── Target ──────────────────────────────────────────────────── */
describe("estimateA1C — target", () => {
  it("on target for good control", () => {
    const r = estimateA1C({ ...baseInput, targetA1C: 8.0 });
    expect(r.onTarget).toBe(true);
  });

  it("off target for high glucose", () => {
    const r = estimateA1C({ ...baseInput, readings: highReadings, targetA1C: 7.0 });
    expect(r.onTarget).toBe(false);
  });

  it("gestational has lower default target", () => {
    const r = estimateA1C({ ...baseInput, diabetesType: "gestational" });
    expect(r.targetA1C).toBe(6.0);
  });
});

/* ── Lab comparison ──────────────────────────────────────────── */
describe("estimateA1C — lab comparison", () => {
  it("compares with lab A1C", () => {
    const r = estimateA1C({ ...baseInput, labA1C: 7.0 });
    expect(r.labComparison).not.toBeNull();
  });

  it("null when no lab A1C", () => {
    const r = estimateA1C(baseInput);
    expect(r.labComparison).toBeNull();
  });

  it("close match message", () => {
    const r = estimateA1C({ ...baseInput, labA1C: r => estimateA1C(baseInput).gmi });
    // Just check it returns something
    const r2 = estimateA1C({ ...baseInput, labA1C: estimateA1C(baseInput).gmi });
    expect(r2.labComparison).toContain("closely matches");
  });
});

/* ── Risk category ───────────────────────────────────────────── */
describe("estimateA1C — risk", () => {
  it("low risk for good control", () => {
    const readings = mkReadings(14, 5.5);
    const r = estimateA1C({ readings, diabetesType: "type1" });
    expect(r.riskCategory).toBe("low");
  });

  it("high risk for poor control", () => {
    const r = estimateA1C({ ...baseInput, readings: highReadings });
    expect(["high", "very-high"]).toContain(r.riskCategory);
  });
});

/* ── Recommendations ─────────────────────────────────────────── */
describe("estimateA1C — recommendations", () => {
  it("positive for on-target", () => {
    const r = estimateA1C({ ...baseInput, targetA1C: 8.0 });
    expect(r.recommendations.some((rec) => rec.includes("Great work"))).toBe(true);
  });

  it("improvement advice for off-target", () => {
    const r = estimateA1C({ ...baseInput, readings: highReadings, targetA1C: 7.0 });
    expect(r.recommendations.some((rec) => rec.includes("above target") || rec.includes("insulin"))).toBe(true);
  });
});
