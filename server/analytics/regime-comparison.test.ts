/**
 * GluMira™ — regime-comparison.test.ts
 *
 * Test suite for server/analytics/regime-comparison.ts
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { describe, it, expect } from "vitest";
import {
  computeRegimeOutcome,
  compareRegimes,
  regimeOutcomeLabel,
  regimeTirColour,
} from "./regime-comparison";
import type { GlucosePoint } from "./glucose-trend";
import type { RegimeWindow } from "./regime-comparison";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pts(values: number[], baseDate = "2026-03-01"): GlucosePoint[] {
  return values.map((glucose, i) => ({
    glucose,
    timestamp: new Date(
      new Date(baseDate).getTime() + i * 5 * 60 * 1000
    ).toISOString(),
  }));
}

const WINDOW_A: RegimeWindow = {
  regimeId: "bernstein",
  regimeName: "Bernstein Low-Carb",
  startDate: "2026-03-01",
  endDate: "2026-03-07",
};

const WINDOW_B: RegimeWindow = {
  regimeId: "standard-3meal",
  regimeName: "Standard 3-Meal",
  startDate: "2026-03-08",
  endDate: "2026-03-14",
};

// ─── computeRegimeOutcome ─────────────────────────────────────────────────────

describe("computeRegimeOutcome", () => {
  it("returns zero outcome for empty readings", () => {
    const outcome = computeRegimeOutcome([], WINDOW_A);
    expect(outcome.count).toBe(0);
    expect(outcome.tirPercent).toBe(0);
    expect(outcome.mean).toBe(0);
  });

  it("computes 100% TIR for all in-range readings", () => {
    const readings = pts(Array(20).fill(7.0));
    const outcome = computeRegimeOutcome(readings, WINDOW_A);
    expect(outcome.tirPercent).toBe(100);
  });

  it("computes 0% TIR for all high readings", () => {
    const readings = pts(Array(20).fill(15.0));
    const outcome = computeRegimeOutcome(readings, WINDOW_A);
    expect(outcome.tirPercent).toBe(0);
    expect(outcome.hyperPercent).toBe(100);
  });

  it("computes 0% TIR for all low readings", () => {
    const readings = pts(Array(20).fill(3.0));
    const outcome = computeRegimeOutcome(readings, WINDOW_A);
    expect(outcome.tirPercent).toBe(0);
    expect(outcome.hypoPercent).toBe(100);
  });

  it("computes correct mean", () => {
    const readings = pts([6.0, 8.0, 10.0]);
    const outcome = computeRegimeOutcome(readings, WINDOW_A);
    expect(outcome.mean).toBeCloseTo(8.0, 1);
  });

  it("computes GMI from mean glucose", () => {
    const readings = pts(Array(10).fill(7.0));
    const outcome = computeRegimeOutcome(readings, WINDOW_A);
    // GMI = 3.31 + 0.02392 × (7.0 × 18.0182) ≈ 6.32
    expect(outcome.gmi).toBeCloseTo(6.32, 1);
  });

  it("computes CV = 0 for constant readings", () => {
    const readings = pts(Array(10).fill(7.0));
    const outcome = computeRegimeOutcome(readings, WINDOW_A);
    expect(outcome.cv).toBe(0);
  });

  it("computes positive CV for variable readings", () => {
    const readings = pts([4.0, 7.0, 10.0, 13.0, 4.0, 7.0, 10.0]);
    const outcome = computeRegimeOutcome(readings, WINDOW_A);
    expect(outcome.cv).toBeGreaterThan(0);
  });

  it("stores regimeId and regimeName", () => {
    const outcome = computeRegimeOutcome(pts([7.0]), WINDOW_A);
    expect(outcome.regimeId).toBe("bernstein");
    expect(outcome.regimeName).toBe("Bernstein Low-Carb");
  });

  it("counts daysTracked correctly", () => {
    const outcome = computeRegimeOutcome(pts([7.0]), WINDOW_A);
    // 2026-03-01 to 2026-03-07 = 7 days
    expect(outcome.daysTracked).toBe(7);
  });
});

// ─── compareRegimes ───────────────────────────────────────────────────────────

describe("compareRegimes", () => {
  it("returns empty regimes array for no windows", () => {
    const result = compareRegimes([], []);
    expect(result.regimes).toHaveLength(0);
    expect(result.bestTirRegime).toBeNull();
  });

  it("returns null winners when no readings exist", () => {
    const result = compareRegimes([], [WINDOW_A, WINDOW_B]);
    expect(result.bestTirRegime).toBeNull();
    expect(result.lowestHypoRegime).toBeNull();
    expect(result.lowestCvRegime).toBeNull();
  });

  it("identifies bestTirRegime correctly", () => {
    // Window A (March 1–7): all in-range
    const readingsA = pts(Array(50).fill(7.0), "2026-03-01");
    // Window B (March 8–14): all high
    const readingsB = pts(Array(50).fill(15.0), "2026-03-08");
    const all = [...readingsA, ...readingsB];
    const result = compareRegimes(all, [WINDOW_A, WINDOW_B]);
    expect(result.bestTirRegime).toBe("bernstein");
  });

  it("identifies lowestHypoRegime correctly", () => {
    // Window A: all in-range (0% hypo)
    const readingsA = pts(Array(50).fill(7.0), "2026-03-01");
    // Window B: all hypo
    const readingsB = pts(Array(50).fill(3.0), "2026-03-08");
    const all = [...readingsA, ...readingsB];
    const result = compareRegimes(all, [WINDOW_A, WINDOW_B]);
    expect(result.lowestHypoRegime).toBe("bernstein");
  });

  it("identifies lowestCvRegime correctly", () => {
    // Window A: constant (CV = 0)
    const readingsA = pts(Array(50).fill(7.0), "2026-03-01");
    // Window B: variable
    const readingsB = pts(
      Array(50).fill(0).map((_, i) => (i % 2 === 0 ? 5.0 : 12.0)),
      "2026-03-08"
    );
    const all = [...readingsA, ...readingsB];
    const result = compareRegimes(all, [WINDOW_A, WINDOW_B]);
    expect(result.lowestCvRegime).toBe("bernstein");
  });

  it("filters readings to the correct window date range", () => {
    // Only Window A readings
    const readingsA = pts(Array(20).fill(7.0), "2026-03-01");
    const result = compareRegimes(readingsA, [WINDOW_A, WINDOW_B]);
    expect(result.regimes[0].count).toBe(20);
    expect(result.regimes[1].count).toBe(0);
  });

  it("includes generatedAt ISO timestamp", () => {
    const result = compareRegimes([], []);
    expect(result.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// ─── regimeOutcomeLabel ───────────────────────────────────────────────────────

describe("regimeOutcomeLabel", () => {
  it("returns No data for count = 0", () => {
    const outcome = computeRegimeOutcome([], WINDOW_A);
    expect(regimeOutcomeLabel(outcome)).toBe("No data");
  });

  it("returns Excellent control for TIR >= 70%", () => {
    const outcome = computeRegimeOutcome(pts(Array(10).fill(7.0)), WINDOW_A);
    expect(regimeOutcomeLabel(outcome)).toBe("Excellent control");
  });

  it("returns Needs improvement for TIR < 30%", () => {
    const outcome = computeRegimeOutcome(pts(Array(10).fill(15.0)), WINDOW_A);
    expect(regimeOutcomeLabel(outcome)).toBe("Needs improvement");
  });
});

// ─── regimeTirColour ─────────────────────────────────────────────────────────

describe("regimeTirColour", () => {
  it("returns emerald for >= 70%", () => {
    expect(regimeTirColour(70)).toContain("emerald");
    expect(regimeTirColour(100)).toContain("emerald");
  });

  it("returns amber for 50–69%", () => {
    expect(regimeTirColour(50)).toContain("amber");
    expect(regimeTirColour(69)).toContain("amber");
  });

  it("returns red for < 50%", () => {
    expect(regimeTirColour(49)).toContain("red");
    expect(regimeTirColour(0)).toContain("red");
  });
});
