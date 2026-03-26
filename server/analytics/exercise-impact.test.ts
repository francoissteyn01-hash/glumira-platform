/**
 * GluMira™ — Exercise Impact Test Suite
 *
 * Tests pre-exercise safety, glucose window computation, delayed hypo
 * risk assessment, recommendation generation, and full analysis.
 *
 * GluMira is an informational tool only. Not a medical device.
 */

import { describe, it, expect } from "vitest";
import {
  isSafeToExercise,
  preExerciseTarget,
  computeGlucoseWindow,
  assessDelayedHypoRisk,
  generateRecommendation,
  analyseExerciseImpact,
  type ExerciseSession,
  type GlucoseReading,
  type ExerciseGlucoseWindow,
} from "./exercise-impact";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSession(overrides: Partial<ExerciseSession> = {}): ExerciseSession {
  return {
    type: "running",
    intensity: "moderate",
    durationMinutes: 30,
    startTime: "2026-03-25T10:00:00Z",
    ...overrides,
  };
}

function makeReadingsAround(
  startTime: string,
  durationMin: number,
  preMmol: number,
  duringMmol: number,
  postMmol: number
): GlucoseReading[] {
  const startMs = new Date(startTime).getTime();
  const readings: GlucoseReading[] = [];

  // Pre-exercise: -30 to 0 min
  for (let m = -30; m < 0; m += 5) {
    readings.push({ mmol: preMmol, timestamp: new Date(startMs + m * 60000).toISOString() });
  }
  // During exercise
  for (let m = 0; m < durationMin; m += 5) {
    readings.push({ mmol: duringMmol, timestamp: new Date(startMs + m * 60000).toISOString() });
  }
  // Post-exercise: 0 to +60 min after end
  const endMs = startMs + durationMin * 60000;
  for (let m = 0; m <= 60; m += 5) {
    readings.push({ mmol: postMmol, timestamp: new Date(endMs + m * 60000).toISOString() });
  }

  return readings;
}

// ─── isSafeToExercise ────────────────────────────────────────────────────────

describe("isSafeToExercise", () => {
  it("returns true for 7.0 mmol/L", () => {
    expect(isSafeToExercise(7.0)).toBe(true);
  });

  it("returns true at lower boundary (5.0)", () => {
    expect(isSafeToExercise(5.0)).toBe(true);
  });

  it("returns true at upper boundary (13.9)", () => {
    expect(isSafeToExercise(13.9)).toBe(true);
  });

  it("returns false for 4.5 mmol/L (too low)", () => {
    expect(isSafeToExercise(4.5)).toBe(false);
  });

  it("returns false for 14.5 mmol/L (too high)", () => {
    expect(isSafeToExercise(14.5)).toBe(false);
  });
});

// ─── preExerciseTarget ───────────────────────────────────────────────────────

describe("preExerciseTarget", () => {
  it("returns 5.0-13.9 for low intensity", () => {
    expect(preExerciseTarget("low")).toEqual({ min: 5.0, max: 13.9 });
  });

  it("returns 7.0-13.9 for moderate intensity", () => {
    expect(preExerciseTarget("moderate")).toEqual({ min: 7.0, max: 13.9 });
  });

  it("returns 8.0-13.9 for high intensity", () => {
    expect(preExerciseTarget("high")).toEqual({ min: 8.0, max: 13.9 });
  });
});

// ─── computeGlucoseWindow ───────────────────────────────────────────────────

describe("computeGlucoseWindow", () => {
  it("computes correct averages for stable glucose", () => {
    const session = makeSession();
    const readings = makeReadingsAround("2026-03-25T10:00:00Z", 30, 8.0, 7.0, 6.0);
    const window = computeGlucoseWindow(session, readings);
    expect(window.preExercise).toBeCloseTo(8.0, 0);
    expect(window.duringExercise).toBeCloseTo(7.0, 0);
    expect(window.postExercise).toBeCloseTo(6.0, 0);
    expect(window.drop).toBeCloseTo(2.0, 0);
  });

  it("computes drop percent correctly", () => {
    const session = makeSession();
    const readings = makeReadingsAround("2026-03-25T10:00:00Z", 30, 10.0, 8.0, 5.0);
    const window = computeGlucoseWindow(session, readings);
    expect(window.dropPercent).toBeGreaterThan(45);
    expect(window.dropPercent).toBeLessThan(55);
  });

  it("handles no readings gracefully", () => {
    const session = makeSession();
    const window = computeGlucoseWindow(session, []);
    expect(window.preExercise).toBe(0);
    expect(window.duringExercise).toBe(0);
    expect(window.postExercise).toBe(0);
    expect(window.drop).toBe(0);
  });

  it("handles negative drop (glucose rise)", () => {
    const session = makeSession();
    const readings = makeReadingsAround("2026-03-25T10:00:00Z", 30, 6.0, 7.0, 8.0);
    const window = computeGlucoseWindow(session, readings);
    expect(window.drop).toBeCloseTo(-2.0, 0);
  });
});

// ─── assessDelayedHypoRisk ──────────────────────────────────────────────────

describe("assessDelayedHypoRisk", () => {
  it("returns low for short low-intensity with normal glucose", () => {
    const session = makeSession({ intensity: "low", durationMinutes: 20 });
    expect(assessDelayedHypoRisk(session, 7.5)).toBe("low");
  });

  it("returns moderate for moderate intensity 45 min with borderline glucose", () => {
    const session = makeSession({ intensity: "moderate", durationMinutes: 45 });
    expect(assessDelayedHypoRisk(session, 5.5)).toBe("moderate");
  });

  it("returns high for high intensity 90 min with low glucose", () => {
    const session = makeSession({ intensity: "high", durationMinutes: 90 });
    expect(assessDelayedHypoRisk(session, 4.5)).toBe("high");
  });

  it("returns high for high intensity 75 min with very low glucose", () => {
    const session = makeSession({ intensity: "high", durationMinutes: 75 });
    expect(assessDelayedHypoRisk(session, 3.5)).toBe("high");
  });
});

// ─── generateRecommendation ─────────────────────────────────────────────────

describe("generateRecommendation", () => {
  it("suggests carb snack for low pre-exercise glucose", () => {
    const session = makeSession();
    const window: ExerciseGlucoseWindow = {
      preExercise: 4.5, duringExercise: 4.0, postExercise: 3.5, drop: 1.0, dropPercent: 22,
    };
    const rec = generateRecommendation(session, window, "moderate");
    expect(rec).toContain("carb snack");
  });

  it("warns about large glucose drop", () => {
    const session = makeSession();
    const window: ExerciseGlucoseWindow = {
      preExercise: 10.0, duringExercise: 7.0, postExercise: 6.0, drop: 4.0, dropPercent: 40,
    };
    const rec = generateRecommendation(session, window, "low");
    expect(rec).toContain("dropped");
    expect(rec).toContain("bolus");
  });

  it("warns about high delayed hypo risk", () => {
    const session = makeSession();
    const window: ExerciseGlucoseWindow = {
      preExercise: 8.0, duringExercise: 6.0, postExercise: 5.0, drop: 3.0, dropPercent: 37.5,
    };
    const rec = generateRecommendation(session, window, "high");
    expect(rec).toContain("delayed hypo");
    expect(rec).toContain("bedtime snack");
  });

  it("suggests basal reduction for prolonged high-intensity", () => {
    const session = makeSession({ intensity: "high", durationMinutes: 60 });
    const window: ExerciseGlucoseWindow = {
      preExercise: 9.0, duringExercise: 7.0, postExercise: 6.5, drop: 2.5, dropPercent: 27.8,
    };
    const rec = generateRecommendation(session, window, "moderate");
    expect(rec).toContain("basal reduction");
  });

  it("returns positive message for well-managed session", () => {
    const session = makeSession({ intensity: "low", durationMinutes: 20 });
    const window: ExerciseGlucoseWindow = {
      preExercise: 7.0, duringExercise: 6.5, postExercise: 6.0, drop: 1.0, dropPercent: 14.3,
    };
    const rec = generateRecommendation(session, window, "low");
    expect(rec).toContain("well-managed");
  });
});

// ─── analyseExerciseImpact ──────────────────────────────────────────────────

describe("analyseExerciseImpact", () => {
  it("returns a complete result", () => {
    const session = makeSession();
    const readings = makeReadingsAround("2026-03-25T10:00:00Z", 30, 8.0, 7.0, 6.0);
    const result = analyseExerciseImpact(session, readings);
    expect(result.session).toEqual(session);
    expect(result.glucoseWindow.preExercise).toBeCloseTo(8.0, 0);
    expect(result.safeToExercise).toBe(true);
    expect(result.preExerciseTarget).toEqual({ min: 7.0, max: 13.9 });
    expect(typeof result.recommendation).toBe("string");
  });

  it("flags unsafe to exercise for low pre-exercise glucose", () => {
    const session = makeSession();
    const readings = makeReadingsAround("2026-03-25T10:00:00Z", 30, 4.0, 3.5, 3.0);
    const result = analyseExerciseImpact(session, readings);
    expect(result.safeToExercise).toBe(false);
  });

  it("returns high delayed hypo risk for intense long session", () => {
    const session = makeSession({ intensity: "high", durationMinutes: 90 });
    const readings = makeReadingsAround("2026-03-25T10:00:00Z", 90, 9.0, 6.0, 4.0);
    const result = analyseExerciseImpact(session, readings);
    expect(result.delayedHypoRisk).toBe("high");
  });
});
