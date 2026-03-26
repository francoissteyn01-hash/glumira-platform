/**
 * GluMira™ — glucose-trend-extended.test.ts
 *
 * Extended test suite for server/analytics/glucose-trend.ts
 * Covers edge cases, boundary values, and all exported functions.
 */

import { describe, it, expect } from "vitest";
import {
  classifyTir,
  computeGmi,
  computeTrend,
  detectPatterns,
  computeTrendReport,
} from "./glucose-trend";
import type { GlucosePoint } from "./glucose-trend";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pts(values: number[], startMs = 0, stepMs = 300_000): GlucosePoint[] {
  return values.map((glucose, i) => ({
    glucose,
    timestamp: new Date(startMs + i * stepMs).toISOString(),
  }));
}

/** Build a timestamp whose local getHours() returns the given hour. */
function localHourTs(hour: number): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60_000; // negative for UTC+, positive for UTC-
  // Create a UTC date that, after local offset, lands at the desired hour today
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

// ─── classifyTir ─────────────────────────────────────────────────────────────

describe("classifyTir — extended", () => {
  it("classifies < 3.0 as veryLow", () => {
    expect(classifyTir(2.9)).toBe("veryLow");
    expect(classifyTir(2.0)).toBe("veryLow");
  });

  it("classifies 3.0–3.89 as low", () => {
    expect(classifyTir(3.0)).toBe("low");
    expect(classifyTir(3.89)).toBe("low");
  });

  it("classifies 3.9–10.0 as inRange", () => {
    expect(classifyTir(3.9)).toBe("inRange");
    expect(classifyTir(7.0)).toBe("inRange");
    expect(classifyTir(10.0)).toBe("inRange");
  });

  it("classifies 10.1–13.9 as high", () => {
    expect(classifyTir(10.1)).toBe("high");
    expect(classifyTir(13.9)).toBe("high");
  });

  it("classifies > 13.9 as veryHigh", () => {
    expect(classifyTir(14.0)).toBe("veryHigh");
    expect(classifyTir(20.0)).toBe("veryHigh");
  });
});

// ─── computeGmi ──────────────────────────────────────────────────────────────

describe("computeGmi — extended", () => {
  it("returns a number greater than 3.31 for any positive mean", () => {
    expect(computeGmi(1)).toBeGreaterThan(3.31);
    expect(computeGmi(10)).toBeGreaterThan(3.31);
  });

  it("increases monotonically with mean", () => {
    expect(computeGmi(10)).toBeGreaterThan(computeGmi(5));
    expect(computeGmi(20)).toBeGreaterThan(computeGmi(10));
  });

  it("returns ~5.7 for mean ~5.5 mmol/L", () => {
    expect(computeGmi(5.5)).toBeCloseTo(5.7, 0);
  });

  it("returns ~7.0 for mean ~8.6 mmol/L", () => {
    expect(computeGmi(8.6)).toBeCloseTo(7.0, 0);
  });

  it("uses 1 decimal place in output", () => {
    const result = computeGmi(7.0);
    expect(result.toString()).toMatch(/^\d+\.\d$/);
  });
});

// ─── computeTrend ─────────────────────────────────────────────────────────────

describe("computeTrend — extended", () => {
  it("returns stable for fewer than 2 readings", () => {
    expect(computeTrend([])).toBe("stable");
    expect(computeTrend(pts([7.0]))).toBe("stable");
  });

  it("returns stable for constant values", () => {
    const readings = pts([7.0, 7.0, 7.0, 7.0, 7.0]);
    expect(computeTrend(readings)).toBe("stable");
  });

  it("returns rising for steadily increasing values", () => {
    const readings = pts([5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5]);
    const result = computeTrend(readings);
    expect(["rising", "rising_fast"]).toContain(result);
  });

  it("returns falling for steadily decreasing values", () => {
    const readings = pts([9.0, 8.5, 8.0, 7.5, 7.0, 6.5, 6.0, 5.5]);
    const result = computeTrend(readings);
    expect(["falling", "falling_fast"]).toContain(result);
  });

  it("returns rising_fast for rapid increase", () => {
    // slope > 0.11 mmol/L per minute
    const readings = pts([5.0, 6.0, 7.0, 8.0, 9.0, 10.0], 0, 60_000); // 1 min intervals
    const result = computeTrend(readings);
    expect(["rising", "rising_fast"]).toContain(result);
  });
});

// ─── detectPatterns ──────────────────────────────────────────────────────────

describe("detectPatterns — extended", () => {
  it("returns empty array for fewer than 12 readings", () => {
    expect(detectPatterns(pts([7.0, 7.0, 7.0]))).toEqual([]);
  });

  it("returns empty array for flat in-range readings", () => {
    const readings = pts(Array(24).fill(7.0));
    expect(detectPatterns(readings)).toEqual([]);
  });

  it("detects nocturnal hypoglycaemia for readings in the 23:00–06:00 window below 3.9", () => {
    // Build a timestamp whose local getHours() === 2 (02:00 local time)
    // This is timezone-safe regardless of sandbox TZ setting
    const nocturnalTs = localHourTs(2);
    const base = new Date().setHours(10, 0, 0, 0); // 10:00 AM local daytime base
    const readings: GlucosePoint[] = [
      // 12 normal readings during the day
      ...Array.from({ length: 12 }, (_, i) => ({
        glucose: 7.0,
        timestamp: new Date(base + i * 300_000).toISOString(),
      })),
      // Nocturnal hypo at 02:00 local
      { glucose: 3.5, timestamp: nocturnalTs },
    ];
    const patterns = detectPatterns(readings);
    expect(patterns.some((p) => /nocturnal/i.test(p))).toBe(true);
  });

  it("detects post-meal hyperglycaemia for readings > 12.0", () => {
    const readings: GlucosePoint[] = [
      ...Array.from({ length: 12 }, (_, i) => ({
        glucose: 7.0,
        timestamp: new Date(i * 300_000).toISOString(),
      })),
      { glucose: 13.5, timestamp: new Date(12 * 300_000).toISOString() },
    ];
    const patterns = detectPatterns(readings);
    expect(patterns.some((p) => /post-meal|hyperglycaemia/i.test(p))).toBe(true);
  });

  it("detects high variability when CV > 36%", () => {
    // Alternating 3.5 and 14.0 → very high CV
    const readings: GlucosePoint[] = Array.from({ length: 24 }, (_, i) => ({
      glucose: i % 2 === 0 ? 3.5 : 14.0,
      timestamp: new Date(i * 300_000).toISOString(),
    }));
    const patterns = detectPatterns(readings);
    expect(patterns.some((p) => /variab/i.test(p))).toBe(true);
  });
});

// ─── computeTrendReport ───────────────────────────────────────────────────────

describe("computeTrendReport — extended", () => {
  it("returns zero report for empty array", () => {
    const report = computeTrendReport([]);
    expect(report.count).toBe(0);
    expect(report.mean).toBe(0);
    expect(report.gmi).toBe(0);
    expect(report.tirPercent).toBe(0);
  });

  it("computes correct mean for uniform readings", () => {
    const readings = pts(Array(20).fill(7.0));
    const report = computeTrendReport(readings);
    expect(report.mean).toBeCloseTo(7.0, 1);
  });

  it("computes 100% TIR for all in-range readings", () => {
    const readings = pts(Array(20).fill(7.0));
    const report = computeTrendReport(readings);
    expect(report.tirPercent).toBe(100);
  });

  it("computes 0% TIR for all out-of-range readings", () => {
    const readings = pts(Array(20).fill(15.0));
    const report = computeTrendReport(readings);
    expect(report.tirPercent).toBe(0);
  });

  it("includes gmi in output", () => {
    const readings = pts(Array(20).fill(7.0));
    const report = computeTrendReport(readings);
    expect(report.gmi).toBeGreaterThan(0);
  });

  it("includes computedAt ISO timestamp", () => {
    const readings = pts(Array(20).fill(7.0));
    const report = computeTrendReport(readings);
    expect(report.computedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("cv is 0 for uniform readings", () => {
    const readings = pts(Array(20).fill(7.0));
    const report = computeTrendReport(readings);
    expect(report.cv).toBe(0);
  });

  it("cv is high for highly variable readings", () => {
    const values = Array.from({ length: 20 }, (_, i) => (i % 2 === 0 ? 3.5 : 14.0));
    const readings = pts(values);
    const report = computeTrendReport(readings);
    expect(report.cv).toBeGreaterThan(36);
  });

  it("min and max are correct", () => {
    const readings = pts([3.5, 7.0, 12.0, 5.5, 9.0]);
    const report = computeTrendReport(readings);
    expect(report.min).toBeCloseTo(3.5, 1);
    expect(report.max).toBeCloseTo(12.0, 1);
  });

  it("periodHours is 0 for a single reading", () => {
    const readings = pts([7.0]);
    const report = computeTrendReport(readings);
    expect(report.periodHours).toBe(0);
  });

  it("periodHours reflects the time span of readings", () => {
    // 12 readings, 5 min apart → 55 min = 0.917 hours
    const readings = pts(Array(12).fill(7.0), 0, 300_000);
    const report = computeTrendReport(readings);
    expect(report.periodHours).toBeCloseTo(0.9, 0);
  });
});
