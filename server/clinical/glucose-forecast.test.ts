import { describe, it, expect } from "vitest";
import { forecastGlucose, type ForecastInput } from "./glucose-forecast";

/* ── helpers ─────────────────────────────────────────────────── */
const baseInput: ForecastInput = {
  currentGlucoseMmol: 7.0,
  currentTrend: 0,
  iob: 0,
  isf: 2.5,
  cobG: 0,
  icr: 10,
  timeSinceLastBolusMin: 60,
  timeSinceLastMealMin: 60,
  exerciseActive: false,
  forecastMinutes: 120,
};

/* ── Structure ───────────────────────────────────────────────── */
describe("forecastGlucose — structure", () => {
  it("returns forecast points", () => {
    const r = forecastGlucose(baseInput);
    expect(r.points.length).toBeGreaterThan(0);
    expect(r.disclaimer).toContain("educational platform");
  });

  it("points are 15 min apart", () => {
    const r = forecastGlucose(baseInput);
    expect(r.points[0].minutesAhead).toBe(15);
    expect(r.points[1].minutesAhead).toBe(30);
  });

  it("correct number of points for 120 min", () => {
    const r = forecastGlucose(baseInput);
    expect(r.points.length).toBe(8); // 120/15
  });
});

/* ── Stable glucose ──────────────────────────────────────────── */
describe("forecastGlucose — stable", () => {
  it("stays near current when no inputs", () => {
    const r = forecastGlucose(baseInput);
    r.points.forEach((p) => {
      expect(p.predictedGlucose).toBeCloseTo(7.0, 0);
    });
  });
});

/* ── Trend effect ────────────────────────────────────────────── */
describe("forecastGlucose — trend", () => {
  it("rising trend increases glucose", () => {
    const r = forecastGlucose({ ...baseInput, currentTrend: 0.1 });
    expect(r.points[0].predictedGlucose).toBeGreaterThan(7.0);
  });

  it("falling trend decreases glucose", () => {
    const r = forecastGlucose({ ...baseInput, currentTrend: -0.1 });
    expect(r.points[0].predictedGlucose).toBeLessThan(7.0);
  });

  it("trend decays over time", () => {
    const r = forecastGlucose({ ...baseInput, currentTrend: 0.2 });
    const earlyRise = r.points[1].predictedGlucose - r.points[0].predictedGlucose;
    const lateRise = r.points[6].predictedGlucose - r.points[5].predictedGlucose;
    expect(lateRise).toBeLessThan(earlyRise);
  });
});

/* ── IOB effect ──────────────────────────────────────────────── */
describe("forecastGlucose — IOB", () => {
  it("IOB lowers glucose", () => {
    const r = forecastGlucose({ ...baseInput, iob: 3, timeSinceLastBolusMin: 30 });
    const lastPoint = r.points[r.points.length - 1];
    expect(lastPoint.predictedGlucose).toBeLessThan(7.0);
  });

  it("IOB decreases over time", () => {
    const r = forecastGlucose({ ...baseInput, iob: 5, timeSinceLastBolusMin: 30 });
    expect(r.points[0].iobRemaining).toBeGreaterThan(r.points[r.points.length - 1].iobRemaining);
  });
});

/* ── COB effect ──────────────────────────────────────────────── */
describe("forecastGlucose — COB", () => {
  it("COB raises glucose", () => {
    const r = forecastGlucose({ ...baseInput, cobG: 40, timeSinceLastMealMin: 30 });
    expect(r.points[0].predictedGlucose).toBeGreaterThan(7.0);
  });

  it("COB decreases over time", () => {
    const r = forecastGlucose({ ...baseInput, cobG: 60, timeSinceLastMealMin: 30 });
    expect(r.points[0].cobRemaining).toBeGreaterThan(r.points[r.points.length - 1].cobRemaining);
  });
});

/* ── Exercise effect ─────────────────────────────────────────── */
describe("forecastGlucose — exercise", () => {
  it("exercise lowers glucose", () => {
    const r = forecastGlucose({ ...baseInput, exerciseActive: true, exerciseIntensity: "moderate" });
    const lastPoint = r.points[r.points.length - 1];
    expect(lastPoint.predictedGlucose).toBeLessThan(7.0);
  });

  it("vigorous lowers more than light", () => {
    const light = forecastGlucose({ ...baseInput, exerciseActive: true, exerciseIntensity: "light" });
    const vigorous = forecastGlucose({ ...baseInput, exerciseActive: true, exerciseIntensity: "vigorous" });
    const lastLight = light.points[light.points.length - 1].predictedGlucose;
    const lastVigorous = vigorous.points[vigorous.points.length - 1].predictedGlucose;
    expect(lastVigorous).toBeLessThan(lastLight);
  });
});

/* ── Peak and nadir ──────────────────────────────────────────── */
describe("forecastGlucose — peak/nadir", () => {
  it("identifies peak glucose", () => {
    const r = forecastGlucose({ ...baseInput, cobG: 60, timeSinceLastMealMin: 15 });
    expect(r.peakGlucose).toBeGreaterThan(7.0);
  });

  it("identifies nadir glucose", () => {
    const r = forecastGlucose({ ...baseInput, iob: 5, timeSinceLastBolusMin: 15 });
    expect(r.nadirGlucose).toBeLessThan(7.0);
  });
});

/* ── Hypo risk ───────────────────────────────────────────────── */
describe("forecastGlucose — hypo risk", () => {
  it("detects hypo risk", () => {
    const r = forecastGlucose({
      ...baseInput,
      currentGlucoseMmol: 5.0,
      iob: 4,
      timeSinceLastBolusMin: 15,
    });
    expect(r.hypoRisk).toBe(true);
    expect(r.warnings.some((w) => w.includes("Hypoglycemia"))).toBe(true);
  });

  it("no hypo risk for stable normal", () => {
    const r = forecastGlucose(baseInput);
    expect(r.hypoRisk).toBe(false);
  });
});

/* ── Hyper risk ──────────────────────────────────────────────── */
describe("forecastGlucose — hyper risk", () => {
  it("detects hyper risk", () => {
    const r = forecastGlucose({
      ...baseInput,
      currentGlucoseMmol: 12.0,
      cobG: 80,
      timeSinceLastMealMin: 10,
    });
    expect(r.hyperRisk).toBe(true);
  });

  it("no hyper risk for normal", () => {
    const r = forecastGlucose(baseInput);
    expect(r.hyperRisk).toBe(false);
  });
});

/* ── Confidence ──────────────────────────────────────────────── */
describe("forecastGlucose — confidence", () => {
  it("high confidence for near-term", () => {
    const r = forecastGlucose(baseInput);
    expect(r.points[0].confidence).toBe("high");
  });

  it("low confidence for far-term", () => {
    const r = forecastGlucose({ ...baseInput, forecastMinutes: 240 });
    const lastPoint = r.points[r.points.length - 1];
    expect(lastPoint.confidence).toBe("low");
  });
});

/* ── Predicted range ─────────────────────────────────────────── */
describe("forecastGlucose — range", () => {
  it("range includes all points", () => {
    const r = forecastGlucose({ ...baseInput, cobG: 40, iob: 2, timeSinceLastMealMin: 15, timeSinceLastBolusMin: 15 });
    r.points.forEach((p) => {
      expect(p.predictedGlucose).toBeGreaterThanOrEqual(r.predictedRange.low);
      expect(p.predictedGlucose).toBeLessThanOrEqual(r.predictedRange.high);
    });
  });
});

/* ── Notes ───────────────────────────────────────────────────── */
describe("forecastGlucose — notes", () => {
  it("notes IOB", () => {
    const r = forecastGlucose({ ...baseInput, iob: 3 });
    expect(r.notes.some((n) => n.includes("insulin"))).toBe(true);
  });

  it("notes COB", () => {
    const r = forecastGlucose({ ...baseInput, cobG: 40 });
    expect(r.notes.some((n) => n.includes("carbs"))).toBe(true);
  });

  it("notes exercise", () => {
    const r = forecastGlucose({ ...baseInput, exerciseActive: true, exerciseIntensity: "moderate" });
    expect(r.notes.some((n) => n.includes("Exercise"))).toBe(true);
  });
});
