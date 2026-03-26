/**
 * GluMira™ — Circadian Sensitivity Test Suite
 *
 * Tests block sensitivity, dawn phenomenon detection, recommendations,
 * and full circadian profile generation.
 *
 * GluMira is an informational tool only. Not a medical device.
 */

import { describe, it, expect } from "vitest";
import {
  classifySensitivity,
  sensitivityColour,
  computeBlockSensitivity,
  detectDawnPhenomenon,
  generateCircadianRecommendations,
  generateCircadianProfile,
  BLOCK_DEFINITIONS,
  type GlucoseReading,
  type BlockSensitivity,
} from "./circadian-sensitivity";

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Sandbox is UTC-4 (America/New_York DST). We add +4h so getHours() returns the intended local hour.

function makeReadings(
  values: number[],
  localHour: number,
  intervalMin: number = 5
): GlucoseReading[] {
  const utcHour = localHour + 4; // offset for UTC-4
  const base = new Date(`2026-03-25T${String(utcHour % 24).padStart(2, "0")}:00:00Z`).getTime();
  return values.map((mmol, i) => ({
    mmol,
    timestamp: new Date(base + i * intervalMin * 60000).toISOString(),
  }));
}

// ─── classifySensitivity ─────────────────────────────────────────────────────

describe("classifySensitivity", () => {
  it("returns high for very low mean + very low CV", () => {
    // score = 3.0*0.6 + 3.0*0.4 = 1.8 + 1.2 = 3.0 < 5.0
    expect(classifySensitivity(3.0, 3.0)).toBe("high");
  });

  it("returns normal for moderate values", () => {
    // score = 4.5*0.6 + 10*0.4 = 2.7 + 4.0 = 6.7 < 8.0
    expect(classifySensitivity(4.5, 10)).toBe("normal");
  });

  it("returns low for elevated mean + CV", () => {
    // score = 7.0*0.6 + 15*0.4 = 4.2 + 6.0 = 10.2 < 12.0
    expect(classifySensitivity(7.0, 15)).toBe("low");
  });

  it("returns very-low for high mean + high CV", () => {
    // score = 14.0*0.6 + 40*0.4 = 8.4 + 16.0 = 24.4 >= 12.0
    expect(classifySensitivity(14.0, 40)).toBe("very-low");
  });
});

// ─── sensitivityColour ──────────────────────────────────────────────────────

describe("sensitivityColour", () => {
  it("returns green for high", () => expect(sensitivityColour("high")).toBe("#22c55e"));
  it("returns blue for normal", () => expect(sensitivityColour("normal")).toBe("#3b82f6"));
  it("returns amber for low", () => expect(sensitivityColour("low")).toBe("#f59e0b"));
  it("returns red for very-low", () => expect(sensitivityColour("very-low")).toBe("#ef4444"));
});

// ─── BLOCK_DEFINITIONS ──────────────────────────────────────────────────────

describe("BLOCK_DEFINITIONS", () => {
  it("has 5 blocks", () => {
    expect(Object.keys(BLOCK_DEFINITIONS)).toHaveLength(5);
  });

  it("dawn is 4-7", () => expect(BLOCK_DEFINITIONS.dawn).toEqual([4, 7]));
  it("night wraps midnight 22-4", () => expect(BLOCK_DEFINITIONS.night).toEqual([22, 4]));
});

// ─── computeBlockSensitivity ─────────────────────────────────────────────────

describe("computeBlockSensitivity", () => {
  it("computes morning block from readings at 8am local", () => {
    const readings = makeReadings([6.0, 6.5, 7.0, 6.5, 6.0], 8);
    const block = computeBlockSensitivity(readings, "morning");
    expect(block.block).toBe("morning");
    expect(block.readingCount).toBe(5);
    expect(block.meanGlucose).toBeCloseTo(6.4, 1);
  });

  it("returns 0 for empty readings", () => {
    const block = computeBlockSensitivity([], "afternoon");
    expect(block.readingCount).toBe(0);
    expect(block.meanGlucose).toBe(0);
  });

  it("handles night block wrapping midnight", () => {
    const late = makeReadings([7.0, 7.5], 23);
    const early = makeReadings([6.5, 6.0], 2);
    const block = computeBlockSensitivity([...late, ...early], "night");
    expect(block.readingCount).toBe(4);
  });

  it("assigns sensitivity rating", () => {
    const readings = makeReadings(Array(10).fill(5.0), 8);
    const block = computeBlockSensitivity(readings, "morning");
    expect(["high", "normal"]).toContain(block.sensitivityRating);
  });
});

// ─── detectDawnPhenomenon ────────────────────────────────────────────────────

describe("detectDawnPhenomenon", () => {
  it("returns true when dawn mean is 1+ mmol above night", () => {
    const nightBlock: BlockSensitivity = {
      block: "night", hourRange: [22, 4], meanGlucose: 5.5,
      cv: 10, readingCount: 10, sensitivityRating: "normal",
    };
    const dawnBlock: BlockSensitivity = {
      block: "dawn", hourRange: [4, 7], meanGlucose: 7.0,
      cv: 15, readingCount: 10, sensitivityRating: "normal",
    };
    expect(detectDawnPhenomenon(nightBlock, dawnBlock)).toBe(true);
  });

  it("returns false when rise is < 1 mmol", () => {
    const nightBlock: BlockSensitivity = {
      block: "night", hourRange: [22, 4], meanGlucose: 6.0,
      cv: 10, readingCount: 10, sensitivityRating: "normal",
    };
    const dawnBlock: BlockSensitivity = {
      block: "dawn", hourRange: [4, 7], meanGlucose: 6.5,
      cv: 15, readingCount: 10, sensitivityRating: "normal",
    };
    expect(detectDawnPhenomenon(nightBlock, dawnBlock)).toBe(false);
  });

  it("returns false with insufficient data", () => {
    const nightBlock: BlockSensitivity = {
      block: "night", hourRange: [22, 4], meanGlucose: 5.0,
      cv: 10, readingCount: 2, sensitivityRating: "normal",
    };
    const dawnBlock: BlockSensitivity = {
      block: "dawn", hourRange: [4, 7], meanGlucose: 8.0,
      cv: 15, readingCount: 2, sensitivityRating: "low",
    };
    expect(detectDawnPhenomenon(nightBlock, dawnBlock)).toBe(false);
  });
});

// ─── generateCircadianRecommendations ────────────────────────────────────────

describe("generateCircadianRecommendations", () => {
  it("recommends basal adjustment for dawn phenomenon", () => {
    const blocks: BlockSensitivity[] = [
      { block: "dawn", hourRange: [4, 7], meanGlucose: 7.0, cv: 15, readingCount: 10, sensitivityRating: "normal" },
    ];
    const recs = generateCircadianRecommendations(blocks, true);
    expect(recs[0]).toContain("Dawn phenomenon");
  });

  it("warns about very-low sensitivity blocks", () => {
    const blocks: BlockSensitivity[] = [
      { block: "evening", hourRange: [17, 22], meanGlucose: 12.0, cv: 40, readingCount: 10, sensitivityRating: "very-low" },
    ];
    const recs = generateCircadianRecommendations(blocks, false);
    expect(recs.some((r) => r.includes("Very low sensitivity"))).toBe(true);
  });

  it("warns about high CV blocks", () => {
    const blocks: BlockSensitivity[] = [
      { block: "afternoon", hourRange: [12, 17], meanGlucose: 7.0, cv: 42, readingCount: 10, sensitivityRating: "normal" },
    ];
    const recs = generateCircadianRecommendations(blocks, false);
    expect(recs.some((r) => r.includes("High variability"))).toBe(true);
  });

  it("returns stable message when everything is fine", () => {
    const blocks: BlockSensitivity[] = [
      { block: "morning", hourRange: [7, 12], meanGlucose: 6.0, cv: 15, readingCount: 10, sensitivityRating: "normal" },
    ];
    const recs = generateCircadianRecommendations(blocks, false);
    expect(recs[0]).toContain("stable");
  });
});

// ─── generateCircadianProfile ────────────────────────────────────────────────

describe("generateCircadianProfile", () => {
  it("generates a full profile with 5 blocks", () => {
    // Create readings across all time blocks
    const readings: GlucoseReading[] = [
      ...makeReadings(Array(5).fill(7.5), 5),   // dawn
      ...makeReadings(Array(5).fill(6.0), 9),   // morning
      ...makeReadings(Array(5).fill(7.0), 14),  // afternoon
      ...makeReadings(Array(5).fill(8.0), 19),  // evening
      ...makeReadings(Array(5).fill(6.5), 23),  // night
    ];
    const profile = generateCircadianProfile(readings);
    expect(profile.blocks).toHaveLength(5);
    expect(profile.recommendations.length).toBeGreaterThan(0);
  });

  it("identifies most and least sensitive blocks", () => {
    const readings: GlucoseReading[] = [
      ...makeReadings(Array(5).fill(5.0), 9),   // morning — lowest mean
      ...makeReadings(Array(5).fill(12.0), 19),  // evening — highest mean
    ];
    const profile = generateCircadianProfile(readings);
    expect(profile.mostSensitiveBlock).toBe("morning");
    expect(profile.leastSensitiveBlock).toBe("evening");
  });

  it("detects dawn phenomenon in profile", () => {
    const readings: GlucoseReading[] = [
      ...makeReadings(Array(5).fill(5.5), 23),  // night
      ...makeReadings(Array(5).fill(7.5), 5),   // dawn — 2.0 rise
    ];
    const profile = generateCircadianProfile(readings);
    expect(profile.dawnPhenomenonLikely).toBe(true);
  });

  it("handles empty readings", () => {
    const profile = generateCircadianProfile([]);
    expect(profile.blocks).toHaveLength(5);
    expect(profile.blocks.every((b) => b.readingCount === 0)).toBe(true);
  });
});
