/**
 * GluMira — Insulin Stacking Analysis Test Suite
 *
 * Tests computeIobAtTime, detectStackingWindows, classifyStackingRisk,
 * stackingRiskLabel, stackingRiskColour, averageTimeBetweenDoses,
 * generateRecommendations, and analyseInsulinStacking.
 */

import { describe, it, expect } from "vitest";
import {
  computeIobAtTime,
  detectStackingWindows,
  classifyStackingRisk,
  stackingRiskLabel,
  stackingRiskColour,
  averageTimeBetweenDoses,
  generateRecommendations,
  analyseInsulinStacking,
  type DoseEntry,
  type StackingWindow,
} from "./insulin-stacking";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDose(units: number, minutesAgo: number, type: "bolus" | "correction" = "bolus"): DoseEntry {
  return {
    units,
    administeredAt: new Date(Date.now() - minutesAgo * 60000).toISOString(),
    type,
  };
}

// ─── computeIobAtTime ────────────────────────────────────────────────────────

describe("computeIobAtTime", () => {
  it("returns full dose at time of administration", () => {
    const dose = makeDose(10, 0);
    const iob = computeIobAtTime(dose, new Date(dose.administeredAt));
    expect(iob).toBe(10);
  });

  it("returns 0 after DIA has elapsed", () => {
    const dose = makeDose(10, 400); // 400 min ago > 300 min DIA
    const iob = computeIobAtTime(dose, new Date());
    expect(iob).toBe(0);
  });

  it("returns 0 before dose was given", () => {
    const dose = makeDose(10, -60); // 60 min in the future
    const iob = computeIobAtTime(dose, new Date());
    expect(iob).toBe(0);
  });

  it("returns partial IOB during decay phase", () => {
    const dose = makeDose(10, 150); // 150 min ago, past peak
    const iob = computeIobAtTime(dose, new Date());
    expect(iob).toBeGreaterThan(0);
    expect(iob).toBeLessThan(10);
  });

  it("returns partial IOB during ramp-up phase", () => {
    const dose = makeDose(10, 30); // 30 min ago, before peak
    const iob = computeIobAtTime(dose, new Date());
    expect(iob).toBeGreaterThan(0);
    expect(iob).toBeLessThan(10);
  });
});

// ─── detectStackingWindows ───────────────────────────────────────────────────

describe("detectStackingWindows", () => {
  it("returns empty for single dose", () => {
    expect(detectStackingWindows([makeDose(5, 60)])).toHaveLength(0);
  });

  it("returns empty for no doses", () => {
    expect(detectStackingWindows([])).toHaveLength(0);
  });

  it("detects stacking when doses are close together", () => {
    const doses = [makeDose(5, 90), makeDose(4, 30)]; // 60 min apart
    const windows = detectStackingWindows(doses);
    expect(windows.length).toBeGreaterThanOrEqual(1);
    expect(windows[0].doses).toHaveLength(2);
    expect(windows[0].totalUnits).toBe(9);
  });

  it("does not detect stacking for well-spaced doses", () => {
    const doses = [makeDose(5, 300), makeDose(4, 30)]; // 270 min apart
    const windows = detectStackingWindows(doses);
    expect(windows).toHaveLength(0);
  });

  it("excludes basal doses", () => {
    const doses: DoseEntry[] = [
      makeDose(5, 90),
      { units: 20, administeredAt: new Date(Date.now() - 60 * 60000).toISOString(), type: "basal" },
      makeDose(4, 30),
    ];
    const windows = detectStackingWindows(doses);
    // Should only consider the 2 bolus doses
    if (windows.length > 0) {
      const allTypes = windows[0].doses.map((d) => d.type);
      expect(allTypes).not.toContain("basal");
    }
  });

  it("detects multiple stacking windows", () => {
    const doses = [
      makeDose(5, 240),
      makeDose(4, 200), // window 1: 40 min apart
      makeDose(6, 60),
      makeDose(3, 20), // window 2: 40 min apart
    ];
    const windows = detectStackingWindows(doses);
    expect(windows.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── classifyStackingRisk ────────────────────────────────────────────────────

describe("classifyStackingRisk", () => {
  it("returns none for single dose", () => {
    expect(classifyStackingRisk(5, 60, 1)).toBe("none");
  });

  it("returns low for small overlap", () => {
    const risk = classifyStackingRisk(4, 100, 2);
    expect(["none", "low"]).toContain(risk);
  });

  it("returns moderate for medium overlap", () => {
    const risk = classifyStackingRisk(8, 50, 2);
    expect(["moderate", "high"]).toContain(risk);
  });

  it("returns high or critical for large rapid stacking", () => {
    const risk = classifyStackingRisk(18, 20, 4);
    expect(["high", "critical"]).toContain(risk);
  });

  it("increases risk with more doses", () => {
    const risk2 = classifyStackingRisk(10, 60, 2);
    const risk4 = classifyStackingRisk(10, 60, 4);
    const order = ["none", "low", "moderate", "high", "critical"];
    expect(order.indexOf(risk4)).toBeGreaterThanOrEqual(order.indexOf(risk2));
  });
});

// ─── stackingRiskLabel ───────────────────────────────────────────────────────

describe("stackingRiskLabel", () => {
  it("returns correct label for each risk level", () => {
    expect(stackingRiskLabel("none")).toContain("No stacking");
    expect(stackingRiskLabel("low")).toContain("Low");
    expect(stackingRiskLabel("moderate")).toContain("Moderate");
    expect(stackingRiskLabel("high")).toContain("High");
    expect(stackingRiskLabel("critical")).toContain("Critical");
  });

  it("returns Unknown for invalid risk", () => {
    expect(stackingRiskLabel("invalid")).toBe("Unknown");
  });
});

// ─── stackingRiskColour ──────────────────────────────────────────────────────

describe("stackingRiskColour", () => {
  it("returns green for none", () => {
    expect(stackingRiskColour("none")).toBe("green");
  });

  it("returns red for critical", () => {
    expect(stackingRiskColour("critical")).toBe("red");
  });

  it("returns gray for unknown", () => {
    expect(stackingRiskColour("unknown")).toBe("gray");
  });
});

// ─── averageTimeBetweenDoses ─────────────────────────────────────────────────

describe("averageTimeBetweenDoses", () => {
  it("returns 0 for single dose", () => {
    expect(averageTimeBetweenDoses([makeDose(5, 60)])).toBe(0);
  });

  it("returns 0 for empty array", () => {
    expect(averageTimeBetweenDoses([])).toBe(0);
  });

  it("computes correct average for two doses", () => {
    const doses = [makeDose(5, 120), makeDose(4, 60)]; // 60 min apart
    const avg = averageTimeBetweenDoses(doses);
    expect(avg).toBeCloseTo(60, 0);
  });

  it("excludes basal doses from calculation", () => {
    const doses: DoseEntry[] = [
      makeDose(5, 120),
      { units: 20, administeredAt: new Date(Date.now() - 90 * 60000).toISOString(), type: "basal" },
      makeDose(4, 60),
    ];
    const avg = averageTimeBetweenDoses(doses);
    expect(avg).toBeCloseTo(60, 0);
  });
});

// ─── generateRecommendations ─────────────────────────────────────────────────

describe("generateRecommendations", () => {
  it("returns positive message for no windows", () => {
    const recs = generateRecommendations([]);
    expect(recs.length).toBeGreaterThanOrEqual(1);
    expect(recs[0]).toContain("No stacking");
  });

  it("recommends waiting for high-risk windows", () => {
    const windows: StackingWindow[] = [
      {
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        doses: [makeDose(10, 30), makeDose(8, 10)],
        totalUnits: 18,
        overlapMinutes: 20,
        peakIob: 15,
        riskLevel: "high",
      },
    ];
    const recs = generateRecommendations(windows);
    expect(recs.some((r) => r.includes("waiting"))).toBe(true);
  });

  it("flags short gaps", () => {
    const windows: StackingWindow[] = [
      {
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        doses: [makeDose(5, 50), makeDose(4, 10)],
        totalUnits: 9,
        overlapMinutes: 40,
        peakIob: 7,
        riskLevel: "moderate",
      },
    ];
    const recs = generateRecommendations(windows);
    expect(recs.some((r) => r.includes("less than 60 minutes"))).toBe(true);
  });
});

// ─── analyseInsulinStacking ──────────────────────────────────────────────────

describe("analyseInsulinStacking", () => {
  it("returns clean analysis for no doses", () => {
    const result = analyseInsulinStacking([]);
    expect(result.totalStackingEvents).toBe(0);
    expect(result.overallRisk).toBe("none");
    expect(result.recommendations.length).toBeGreaterThanOrEqual(1);
  });

  it("returns clean analysis for well-spaced doses", () => {
    const doses = [makeDose(5, 300), makeDose(4, 30)];
    const result = analyseInsulinStacking(doses);
    expect(result.totalStackingEvents).toBe(0);
    expect(result.overallRisk).toBe("none");
  });

  it("detects stacking for close doses", () => {
    const doses = [makeDose(8, 60), makeDose(6, 20)];
    const result = analyseInsulinStacking(doses);
    expect(result.totalStackingEvents).toBeGreaterThanOrEqual(1);
    expect(result.overallRisk).not.toBe("none");
  });

  it("computes maxOverlapUnits correctly", () => {
    const doses = [makeDose(10, 60), makeDose(8, 20)];
    const result = analyseInsulinStacking(doses);
    expect(result.maxOverlapUnits).toBe(18);
  });

  it("includes average time between doses", () => {
    const doses = [makeDose(5, 120), makeDose(4, 60), makeDose(3, 20)];
    const result = analyseInsulinStacking(doses);
    expect(result.averageTimeBetweenDoses).toBeGreaterThan(0);
  });

  it("riskSummary matches overallRisk", () => {
    const doses = [makeDose(15, 40), makeDose(10, 10)];
    const result = analyseInsulinStacking(doses);
    expect(result.riskSummary).toBe(stackingRiskLabel(result.overallRisk));
  });
});
