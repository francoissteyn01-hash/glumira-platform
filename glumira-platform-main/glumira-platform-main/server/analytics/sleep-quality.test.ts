/**
 * GluMira™ — Sleep Quality Test Suite
 *
 * Tests overnight stats, nocturnal events, dawn phenomenon detection,
 * stability scoring, quality labels, recommendations, and full report.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { describe, it, expect } from "vitest";
import {
  computeOvernightStats,
  detectNocturnalEvents,
  detectDawnPhenomenon,
  computeStabilityScore,
  qualityLabel,
  generateRecommendations,
  generateSleepQualityReport,
  type GlucoseReading,
  type OvernightWindow,
} from "./sleep-quality";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeOvernightReadings(
  values: number[],
  bedtime: string = "2026-03-25T22:00:00Z",
  intervalMin: number = 5
): GlucoseReading[] {
  const base = new Date(bedtime).getTime();
  return values.map((mmol, i) => ({
    mmol,
    timestamp: new Date(base + i * intervalMin * 60000).toISOString(),
  }));
}

const DEFAULT_WINDOW: OvernightWindow = {
  bedtime: "2026-03-25T22:00:00Z",
  wakeTime: "2026-03-26T06:00:00Z",
};

// ─── computeOvernightStats ───────────────────────────────────────────────────

describe("computeOvernightStats", () => {
  it("returns zeros for empty readings", () => {
    const stats = computeOvernightStats([]);
    expect(stats.mean).toBe(0);
    expect(stats.readingCount).toBe(0);
  });

  it("computes correct mean for stable readings", () => {
    const readings = makeOvernightReadings([6.0, 6.0, 6.0, 6.0, 6.0]);
    const stats = computeOvernightStats(readings);
    expect(stats.mean).toBe(6.0);
    expect(stats.sd).toBe(0);
    expect(stats.cv).toBe(0);
  });

  it("computes correct min and max", () => {
    const readings = makeOvernightReadings([4.0, 5.0, 6.0, 7.0, 8.0]);
    const stats = computeOvernightStats(readings);
    expect(stats.min).toBe(4.0);
    expect(stats.max).toBe(8.0);
  });

  it("computes TIR correctly", () => {
    const readings = makeOvernightReadings([3.5, 5.0, 6.0, 7.0, 11.0]);
    const stats = computeOvernightStats(readings);
    expect(stats.timeInRange).toBe(60); // 3 of 5 in range
    expect(stats.timeBelowRange).toBe(20); // 1 of 5
    expect(stats.timeAboveRange).toBe(20); // 1 of 5
  });

  it("computes 100% TIR for all in-range readings", () => {
    const readings = makeOvernightReadings([5.0, 6.0, 7.0, 8.0, 9.0]);
    const stats = computeOvernightStats(readings);
    expect(stats.timeInRange).toBe(100);
  });
});

// ─── detectNocturnalEvents ───────────────────────────────────────────────────

describe("detectNocturnalEvents", () => {
  it("returns empty for in-range readings", () => {
    const readings = makeOvernightReadings([5.0, 6.0, 7.0]);
    expect(detectNocturnalEvents(readings)).toEqual([]);
  });

  it("detects hypo events", () => {
    const readings = makeOvernightReadings([5.0, 3.5, 3.2, 5.0]);
    const events = detectNocturnalEvents(readings);
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe("hypo");
    expect(events[1].type).toBe("hypo");
  });

  it("detects hyper events", () => {
    const readings = makeOvernightReadings([5.0, 14.5, 15.0, 5.0]);
    const events = detectNocturnalEvents(readings);
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe("hyper");
  });

  it("detects both hypo and hyper events", () => {
    const readings = makeOvernightReadings([3.0, 5.0, 14.5]);
    const events = detectNocturnalEvents(readings);
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe("hypo");
    expect(events[1].type).toBe("hyper");
  });
});

// ─── detectDawnPhenomenon ────────────────────────────────────────────────────

describe("detectDawnPhenomenon", () => {
  it("returns not detected for fewer than 4 readings", () => {
    const readings = makeOvernightReadings([5.0, 6.0, 7.0]);
    expect(detectDawnPhenomenon(readings, DEFAULT_WINDOW.wakeTime).detected).toBe(false);
  });

  it("returns not detected for flat glucose", () => {
    // 96 readings over 8 hours (5-min intervals), all 6.0
    const readings = makeOvernightReadings(Array(96).fill(6.0));
    expect(detectDawnPhenomenon(readings, DEFAULT_WINDOW.wakeTime).detected).toBe(false);
  });

  it("detects mild dawn phenomenon", () => {
    // Create readings where last 2 hours before wake show 1.5 mmol/L rise
    const values = Array(72).fill(6.0); // first 6 hours stable
    // Last 2 hours: gradual rise from 6.0 to 7.5
    for (let i = 0; i < 24; i++) {
      values.push(6.0 + (i / 24) * 1.5);
    }
    const readings = makeOvernightReadings(values);
    const result = detectDawnPhenomenon(readings, DEFAULT_WINDOW.wakeTime);
    expect(result.detected).toBe(true);
    expect(result.severity).toBe("mild");
  });

  it("detects significant dawn phenomenon", () => {
    const values = Array(72).fill(6.0);
    for (let i = 0; i < 24; i++) {
      values.push(6.0 + (i / 24) * 4.0);
    }
    const readings = makeOvernightReadings(values);
    const result = detectDawnPhenomenon(readings, DEFAULT_WINDOW.wakeTime);
    expect(result.detected).toBe(true);
    expect(result.severity).toBe("significant");
  });
});

// ─── computeStabilityScore ───────────────────────────────────────────────────

describe("computeStabilityScore", () => {
  it("returns 0 for empty stats", () => {
    const stats = computeOvernightStats([]);
    expect(computeStabilityScore(stats)).toBe(0);
  });

  it("returns high score for stable in-range readings", () => {
    const readings = makeOvernightReadings([6.0, 6.0, 6.0, 6.0, 6.0]);
    const stats = computeOvernightStats(readings);
    const score = computeStabilityScore(stats);
    expect(score).toBeGreaterThanOrEqual(85);
  });

  it("returns low score for highly variable readings", () => {
    const readings = makeOvernightReadings([3.0, 15.0, 3.0, 15.0, 3.0]);
    const stats = computeOvernightStats(readings);
    const score = computeStabilityScore(stats);
    expect(score).toBeLessThan(50);
  });
});

// ─── qualityLabel ────────────────────────────────────────────────────────────

describe("qualityLabel", () => {
  it("returns Excellent for 85+", () => expect(qualityLabel(90)).toBe("Excellent"));
  it("returns Good for 70-84", () => expect(qualityLabel(75)).toBe("Good"));
  it("returns Fair for 50-69", () => expect(qualityLabel(55)).toBe("Fair"));
  it("returns Poor for 30-49", () => expect(qualityLabel(35)).toBe("Poor"));
  it("returns Very Poor for <30", () => expect(qualityLabel(20)).toBe("Very Poor"));
});

// ─── generateRecommendations ─────────────────────────────────────────────────

describe("generateRecommendations", () => {
  it("returns positive message for clean night", () => {
    const stats = computeOvernightStats(makeOvernightReadings([6.0, 6.0, 6.0]));
    const recs = generateRecommendations(stats, [], { detected: false });
    expect(recs).toHaveLength(1);
    expect(recs[0]).toContain("well-managed");
  });

  it("warns about nocturnal hypos", () => {
    const stats = computeOvernightStats(makeOvernightReadings([3.5, 3.2, 5.0]));
    const events = detectNocturnalEvents(makeOvernightReadings([3.5, 3.2, 5.0]));
    const recs = generateRecommendations(stats, events, { detected: false });
    expect(recs.some((r) => r.includes("hypo"))).toBe(true);
  });

  it("warns about dawn phenomenon", () => {
    const stats = computeOvernightStats(makeOvernightReadings([6.0, 6.0, 6.0]));
    const dawn = { detected: true, riseMmol: 2.5, severity: "moderate" as const };
    const recs = generateRecommendations(stats, [], dawn);
    expect(recs.some((r) => r.includes("Dawn phenomenon"))).toBe(true);
  });

  it("warns about high CV", () => {
    const readings = makeOvernightReadings([3.0, 12.0, 3.0, 12.0]);
    const stats = computeOvernightStats(readings);
    const recs = generateRecommendations(stats, [], { detected: false });
    expect(recs.some((r) => r.includes("variability"))).toBe(true);
  });
});

// ─── generateSleepQualityReport ──────────────────────────────────────────────

describe("generateSleepQualityReport", () => {
  it("generates a full report for stable overnight glucose", () => {
    const values = Array(96).fill(6.5); // 8 hours of stable readings
    const readings = makeOvernightReadings(values);
    const report = generateSleepQualityReport(readings, DEFAULT_WINDOW);
    expect(report.stats.readingCount).toBe(96);
    expect(report.stats.timeInRange).toBe(100);
    expect(report.events).toHaveLength(0);
    expect(report.qualityLabel).toBe("Excellent");
    expect(report.stabilityScore).toBeGreaterThanOrEqual(85);
  });

  it("generates report with nocturnal events", () => {
    const values = Array(96).fill(6.5);
    values[20] = 3.2; // hypo
    values[50] = 14.5; // hyper
    const readings = makeOvernightReadings(values);
    const report = generateSleepQualityReport(readings, DEFAULT_WINDOW);
    expect(report.events.length).toBeGreaterThanOrEqual(2);
  });

  it("handles empty readings", () => {
    const report = generateSleepQualityReport([], DEFAULT_WINDOW);
    expect(report.stats.readingCount).toBe(0);
    expect(report.qualityLabel).toBe("Very Poor");
    expect(report.stabilityScore).toBe(0);
  });
});
