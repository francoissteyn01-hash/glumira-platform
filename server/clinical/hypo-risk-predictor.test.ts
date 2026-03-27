import { describe, it, expect } from "vitest";
import { predictHypoRisk, type HypoRiskInput } from "./hypo-risk-predictor";

/* ── helpers ─────────────────────────────────────────────────── */
const baseInput: HypoRiskInput = {
  recentReadings: [],
  currentGlucoseMmol: 7.0,
  glucoseTrend: "stable",
  iob: 1,
  lastMealHoursAgo: 2,
  exerciseActive: false,
  alcoholConsumed: false,
  sleepingSoon: false,
  hypoUnawareness: false,
  recentHyposThisWeek: 0,
};

/* ── Structure ───────────────────────────────────────────────── */
describe("predictHypoRisk — structure", () => {
  it("returns complete result", () => {
    const r = predictHypoRisk(baseInput);
    expect(r.riskLevel).toBeDefined();
    expect(r.riskScore).toBeDefined();
    expect(r.disclaimer).toContain("educational platform");
  });
});

/* ── Risk levels ─────────────────────────────────────────────── */
describe("predictHypoRisk — risk levels", () => {
  it("minimal risk for stable normal glucose", () => {
    const r = predictHypoRisk(baseInput);
    expect(r.riskLevel).toBe("minimal");
  });

  it("very-high risk for active hypo", () => {
    const input: HypoRiskInput = {
      ...baseInput,
      currentGlucoseMmol: 3.5,
      glucoseTrend: "falling-fast",
      iob: 6,
    };
    const r = predictHypoRisk(input);
    expect(r.riskLevel).toBe("very-high");
  });

  it("high risk for falling glucose with IOB", () => {
    const input: HypoRiskInput = {
      ...baseInput,
      currentGlucoseMmol: 5.0,
      glucoseTrend: "falling",
      iob: 4,
    };
    const r = predictHypoRisk(input);
    expect(["moderate", "high", "very-high"]).toContain(r.riskLevel);
  });

  it("moderate risk for exercise with lower glucose", () => {
    const input: HypoRiskInput = {
      ...baseInput,
      currentGlucoseMmol: 5.5,
      exerciseActive: true,
      exerciseIntensity: "moderate",
    };
    const r = predictHypoRisk(input);
    expect(["low", "moderate", "high"]).toContain(r.riskLevel);
  });
});

/* ── Risk factors ────────────────────────────────────────────── */
describe("predictHypoRisk — risk factors", () => {
  it("identifies low glucose as factor", () => {
    const input = { ...baseInput, currentGlucoseMmol: 3.8 };
    const r = predictHypoRisk(input);
    expect(r.riskFactors.some((f) => f.factor.includes("Low glucose"))).toBe(true);
  });

  it("identifies falling trend as factor", () => {
    const input = { ...baseInput, glucoseTrend: "falling-fast" as const };
    const r = predictHypoRisk(input);
    expect(r.riskFactors.some((f) => f.factor.includes("Rapidly falling"))).toBe(true);
  });

  it("identifies high IOB as factor", () => {
    const input = { ...baseInput, iob: 8 };
    const r = predictHypoRisk(input);
    expect(r.riskFactors.some((f) => f.factor.includes("insulin on board"))).toBe(true);
  });

  it("identifies exercise as factor", () => {
    const input = { ...baseInput, exerciseActive: true, exerciseIntensity: "vigorous" as const };
    const r = predictHypoRisk(input);
    expect(r.riskFactors.some((f) => f.factor.includes("exercise"))).toBe(true);
  });

  it("identifies alcohol as factor", () => {
    const input = { ...baseInput, alcoholConsumed: true, alcoholUnits: 4 };
    const r = predictHypoRisk(input);
    expect(r.riskFactors.some((f) => f.factor.includes("Alcohol"))).toBe(true);
  });

  it("identifies sleep as factor", () => {
    const input = { ...baseInput, sleepingSoon: true };
    const r = predictHypoRisk(input);
    expect(r.riskFactors.some((f) => f.factor.includes("Sleeping"))).toBe(true);
  });

  it("identifies hypo unawareness as factor", () => {
    const input = { ...baseInput, hypoUnawareness: true };
    const r = predictHypoRisk(input);
    expect(r.riskFactors.some((f) => f.factor.includes("unawareness"))).toBe(true);
  });

  it("identifies fasting as factor", () => {
    const input = { ...baseInput, lastMealHoursAgo: 6 };
    const r = predictHypoRisk(input);
    expect(r.riskFactors.some((f) => f.factor.includes("fasting"))).toBe(true);
  });
});

/* ── Risk score ──────────────────────────────────────────────── */
describe("predictHypoRisk — scoring", () => {
  it("score is 0-100", () => {
    const r = predictHypoRisk(baseInput);
    expect(r.riskScore).toBeGreaterThanOrEqual(0);
    expect(r.riskScore).toBeLessThanOrEqual(100);
  });

  it("more factors = higher score", () => {
    const low = predictHypoRisk(baseInput);
    const high = predictHypoRisk({
      ...baseInput,
      currentGlucoseMmol: 4.5,
      glucoseTrend: "falling",
      iob: 6,
      exerciseActive: true,
      exerciseIntensity: "vigorous",
    });
    expect(high.riskScore).toBeGreaterThan(low.riskScore);
  });

  it("capped at 100", () => {
    const input: HypoRiskInput = {
      ...baseInput,
      currentGlucoseMmol: 3.5,
      glucoseTrend: "falling-fast",
      iob: 10,
      lastMealHoursAgo: 8,
      exerciseActive: true,
      exerciseIntensity: "vigorous",
      alcoholConsumed: true,
      alcoholUnits: 5,
      sleepingSoon: true,
      hypoUnawareness: true,
      recentHyposThisWeek: 5,
    };
    const r = predictHypoRisk(input);
    expect(r.riskScore).toBe(100);
  });
});

/* ── Predicted time to hypo ──────────────────────────────────── */
describe("predictHypoRisk — prediction", () => {
  it("NOW for active hypo", () => {
    const input = { ...baseInput, currentGlucoseMmol: 3.5 };
    const r = predictHypoRisk(input);
    expect(r.predictedTimeToHypo).toContain("NOW");
  });

  it("within 30 min for fast fall + low", () => {
    const input: HypoRiskInput = { ...baseInput, currentGlucoseMmol: 5.5, glucoseTrend: "falling-fast" };
    const r = predictHypoRisk(input);
    expect(r.predictedTimeToHypo).toContain("30 minutes");
  });

  it("null for low risk", () => {
    const r = predictHypoRisk(baseInput);
    expect(r.predictedTimeToHypo).toBeNull();
  });
});

/* ── Immediate actions ───────────────────────────────────────── */
describe("predictHypoRisk — immediate actions", () => {
  it("treat now for hypo", () => {
    const input = { ...baseInput, currentGlucoseMmol: 3.5 };
    const r = predictHypoRisk(input);
    expect(r.immediateActions.some((a) => a.includes("TREAT NOW"))).toBe(true);
  });

  it("eat carbs for falling fast + low", () => {
    const input: HypoRiskInput = { ...baseInput, currentGlucoseMmol: 5.5, glucoseTrend: "falling-fast" };
    const r = predictHypoRisk(input);
    expect(r.immediateActions.some((a) => a.includes("carbs"))).toBe(true);
  });
});

/* ── Preventive actions ──────────────────────────────────────── */
describe("predictHypoRisk — preventive actions", () => {
  it("bedtime snack when sleeping soon + lower glucose", () => {
    const input: HypoRiskInput = { ...baseInput, sleepingSoon: true, currentGlucoseMmol: 5.5 };
    const r = predictHypoRisk(input);
    expect(r.preventiveActions.some((a) => a.includes("bedtime snack"))).toBe(true);
  });

  it("alcohol warning", () => {
    const input: HypoRiskInput = { ...baseInput, alcoholConsumed: true };
    const r = predictHypoRisk(input);
    expect(r.preventiveActions.some((a) => a.includes("CGM") || a.includes("snack"))).toBe(true);
  });
});

/* ── Warnings ────────────────────────────────────────────────── */
describe("predictHypoRisk — warnings", () => {
  it("very-high warning", () => {
    const input: HypoRiskInput = {
      ...baseInput,
      currentGlucoseMmol: 3.5,
      glucoseTrend: "falling-fast",
      iob: 6,
    };
    const r = predictHypoRisk(input);
    expect(r.warnings.some((w) => w.includes("VERY HIGH"))).toBe(true);
  });

  it("no warnings for minimal risk", () => {
    const r = predictHypoRisk(baseInput);
    expect(r.warnings.length).toBe(0);
  });
});
