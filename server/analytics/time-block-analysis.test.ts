/**
 * GluMira — Time-Block Analysis Test Suite
 *
 * Tests classifyReading, computeBlockStats, generateTimeBlockReport,
 * blockTirColour, blockCvLabel, and DEFAULT_TIME_BLOCKS.
 */

import { describe, it, expect } from "vitest";
import {
  classifyReading,
  computeBlockStats,
  generateTimeBlockReport,
  blockTirColour,
  blockCvLabel,
  DEFAULT_TIME_BLOCKS,
  type GlucoseReading,
  type TimeBlock,
} from "./time-block-analysis";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReading(hour: number, mmol: number): GlucoseReading {
  // Sandbox is UTC-4; add 4 hours so local getHours() == intended hour
  const d = new Date("2026-03-25T00:00:00.000Z");
  d.setUTCHours(hour + 4, 0, 0, 0);
  return { mmol, timestamp: d.toISOString() };
}

// Use UTC-based blocks for test determinism
const UTC_BLOCKS: TimeBlock[] = [
  { label: "Overnight", startHour: 0, endHour: 6 },
  { label: "Fasting", startHour: 6, endHour: 9 },
  { label: "Post-Breakfast", startHour: 9, endHour: 12 },
  { label: "Post-Lunch", startHour: 12, endHour: 17 },
  { label: "Post-Dinner", startHour: 17, endHour: 21 },
  { label: "Late Evening", startHour: 21, endHour: 24 },
];

// ─── DEFAULT_TIME_BLOCKS ─────────────────────────────────────────────────────

describe("DEFAULT_TIME_BLOCKS", () => {
  it("has 6 blocks", () => {
    expect(DEFAULT_TIME_BLOCKS).toHaveLength(6);
  });

  it("covers all 24 hours", () => {
    const hours = new Set<number>();
    for (const block of DEFAULT_TIME_BLOCKS) {
      for (let h = block.startHour; h < block.endHour; h++) {
        hours.add(h);
      }
    }
    expect(hours.size).toBe(24);
  });
});

// ─── classifyReading ─────────────────────────────────────────────────────────

describe("classifyReading", () => {
  it("classifies 3am as Overnight", () => {
    const r = makeReading(3, 5.0);
    expect(classifyReading(r, UTC_BLOCKS)).toBe("Overnight");
  });

  it("classifies 7am as Fasting", () => {
    const r = makeReading(7, 5.5);
    expect(classifyReading(r, UTC_BLOCKS)).toBe("Fasting");
  });

  it("classifies 10am as Post-Breakfast", () => {
    const r = makeReading(10, 8.0);
    expect(classifyReading(r, UTC_BLOCKS)).toBe("Post-Breakfast");
  });

  it("classifies 14pm as Post-Lunch", () => {
    const r = makeReading(14, 7.0);
    expect(classifyReading(r, UTC_BLOCKS)).toBe("Post-Lunch");
  });

  it("classifies 19pm as Post-Dinner", () => {
    const r = makeReading(19, 9.0);
    expect(classifyReading(r, UTC_BLOCKS)).toBe("Post-Dinner");
  });

  it("classifies 22pm as Late Evening", () => {
    const r = makeReading(22, 6.0);
    expect(classifyReading(r, UTC_BLOCKS)).toBe("Late Evening");
  });

  it("handles midnight-wrapping blocks", () => {
    const wrapBlock: TimeBlock[] = [
      { label: "Night", startHour: 22, endHour: 6 },
      { label: "Day", startHour: 6, endHour: 22 },
    ];
    expect(classifyReading(makeReading(23, 5.0), wrapBlock)).toBe("Night");
    expect(classifyReading(makeReading(2, 5.0), wrapBlock)).toBe("Night");
    expect(classifyReading(makeReading(12, 5.0), wrapBlock)).toBe("Day");
  });
});

// ─── computeBlockStats ───────────────────────────────────────────────────────

describe("computeBlockStats", () => {
  it("returns zeroes for empty readings", () => {
    const stats = computeBlockStats("Test", []);
    expect(stats.readingCount).toBe(0);
    expect(stats.mean).toBe(0);
    expect(stats.tirPercent).toBe(0);
  });

  it("computes correct mean", () => {
    const readings = [makeReading(7, 5.0), makeReading(8, 7.0)];
    const stats = computeBlockStats("Fasting", readings);
    expect(stats.mean).toBe(6.0);
  });

  it("computes correct median for odd count", () => {
    const readings = [makeReading(7, 4.0), makeReading(8, 6.0), makeReading(8, 8.0)];
    const stats = computeBlockStats("Test", readings);
    expect(stats.median).toBe(6.0);
  });

  it("computes correct median for even count", () => {
    const readings = [
      makeReading(7, 4.0),
      makeReading(7, 6.0),
      makeReading(8, 8.0),
      makeReading(8, 10.0),
    ];
    const stats = computeBlockStats("Test", readings);
    expect(stats.median).toBe(7.0);
  });

  it("computes min and max", () => {
    const readings = [makeReading(7, 3.5), makeReading(8, 12.0), makeReading(8, 7.0)];
    const stats = computeBlockStats("Test", readings);
    expect(stats.min).toBe(3.5);
    expect(stats.max).toBe(12.0);
  });

  it("computes TIR correctly", () => {
    const readings = [
      makeReading(7, 5.0), // in range
      makeReading(7, 7.0), // in range
      makeReading(8, 3.0), // below
      makeReading(8, 12.0), // above
    ];
    const stats = computeBlockStats("Test", readings);
    expect(stats.tirPercent).toBe(50);
    expect(stats.belowPercent).toBe(25);
    expect(stats.abovePercent).toBe(25);
  });

  it("computes 100% TIR for all in-range", () => {
    const readings = [makeReading(7, 5.0), makeReading(7, 6.0), makeReading(8, 8.0)];
    const stats = computeBlockStats("Test", readings);
    expect(stats.tirPercent).toBe(100);
    expect(stats.belowPercent).toBe(0);
    expect(stats.abovePercent).toBe(0);
  });

  it("computes CV as percentage", () => {
    const readings = [makeReading(7, 5.0), makeReading(8, 5.0)];
    const stats = computeBlockStats("Test", readings);
    expect(stats.cv).toBe(0); // identical values → 0 CV
  });
});

// ─── generateTimeBlockReport ─────────────────────────────────────────────────

describe("generateTimeBlockReport", () => {
  it("returns 6 blocks for default config", () => {
    const report = generateTimeBlockReport([], UTC_BLOCKS);
    expect(report.blocks).toHaveLength(6);
  });

  it("identifies worst and best blocks", () => {
    const readings = [
      // Fasting: all in range
      makeReading(7, 5.5),
      makeReading(8, 6.0),
      // Post-Lunch: all high
      makeReading(13, 14.0),
      makeReading(14, 15.0),
    ];
    const report = generateTimeBlockReport(readings, UTC_BLOCKS);
    expect(report.bestBlock).toBe("Fasting");
    expect(report.worstBlock).toBe("Post-Lunch");
  });

  it("computes overall mean", () => {
    const readings = [makeReading(7, 6.0), makeReading(14, 8.0)];
    const report = generateTimeBlockReport(readings, UTC_BLOCKS);
    expect(report.overallMean).toBe(7.0);
  });

  it("returns N/A for worst/best when no readings", () => {
    const report = generateTimeBlockReport([], UTC_BLOCKS);
    expect(report.worstBlock).toBe("N/A");
    expect(report.bestBlock).toBe("N/A");
  });

  it("groups readings into correct blocks", () => {
    const readings = [
      makeReading(3, 5.0),  // Overnight
      makeReading(3, 5.5),  // Overnight
      makeReading(10, 8.0), // Post-Breakfast
    ];
    const report = generateTimeBlockReport(readings, UTC_BLOCKS);
    const overnight = report.blocks.find((b) => b.label === "Overnight")!;
    const postBf = report.blocks.find((b) => b.label === "Post-Breakfast")!;
    expect(overnight.readingCount).toBe(2);
    expect(postBf.readingCount).toBe(1);
  });

  it("uses custom thresholds", () => {
    const readings = [makeReading(7, 5.0), makeReading(8, 6.0)];
    // With tight thresholds: 5.0-5.5 in range
    const report = generateTimeBlockReport(readings, UTC_BLOCKS, 4.5, 5.5);
    const fasting = report.blocks.find((b) => b.label === "Fasting")!;
    expect(fasting.tirPercent).toBe(50); // only 5.0 is in [4.5, 5.5]
  });
});

// ─── blockTirColour ──────────────────────────────────────────────────────────

describe("blockTirColour", () => {
  it("returns green for >= 70%", () => {
    expect(blockTirColour(70)).toBe("green");
    expect(blockTirColour(95)).toBe("green");
  });

  it("returns amber for 50-69%", () => {
    expect(blockTirColour(50)).toBe("amber");
    expect(blockTirColour(69)).toBe("amber");
  });

  it("returns red for < 50%", () => {
    expect(blockTirColour(49)).toBe("red");
    expect(blockTirColour(0)).toBe("red");
  });
});

// ─── blockCvLabel ────────────────────────────────────────────────────────────

describe("blockCvLabel", () => {
  it("returns Stable for CV <= 36", () => {
    expect(blockCvLabel(30)).toBe("Stable");
    expect(blockCvLabel(36)).toBe("Stable");
  });

  it("returns Moderate variability for CV 37-50", () => {
    expect(blockCvLabel(40)).toBe("Moderate variability");
    expect(blockCvLabel(50)).toBe("Moderate variability");
  });

  it("returns High variability for CV > 50", () => {
    expect(blockCvLabel(51)).toBe("High variability");
    expect(blockCvLabel(80)).toBe("High variability");
  });
});
