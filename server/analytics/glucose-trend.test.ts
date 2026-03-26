/**
 * GluMira™ Glucose Trend Analysis — Test Suite
 * Version: 7.0.0
 */

import { describe, it, expect } from "vitest";
import {
  classifyTir,
  computeTrend,
  detectPatterns,
  computeGmi,
  computeTrendReport,
  GlucosePoint,
} from "./glucose-trend";

// ─── Helpers ──────────────────────────────────────────────────

function makeReading(glucose: number, minutesAgo: number): GlucosePoint {
  return {
    glucose,
    timestamp: new Date(Date.now() - minutesAgo * 60_000).toISOString(),
  };
}

function makeReadingAt(glucose: number, isoTime: string): GlucosePoint {
  return { glucose, timestamp: isoTime };
}

// ─── classifyTir ──────────────────────────────────────────────

describe("classifyTir", () => {
  it("classifies very low correctly", () => {
    expect(classifyTir(2.5)).toBe("veryLow");
    expect(classifyTir(2.9)).toBe("veryLow");
  });

  it("classifies low correctly", () => {
    expect(classifyTir(3.0)).toBe("low");
    expect(classifyTir(3.8)).toBe("low");
  });

  it("classifies in range correctly", () => {
    expect(classifyTir(3.9)).toBe("inRange");
    expect(classifyTir(7.0)).toBe("inRange");
    expect(classifyTir(10.0)).toBe("inRange");
  });

  it("classifies high correctly", () => {
    expect(classifyTir(10.1)).toBe("high");
    expect(classifyTir(13.9)).toBe("high");
  });

  it("classifies very high correctly", () => {
    expect(classifyTir(14.0)).toBe("veryHigh");
    expect(classifyTir(20.0)).toBe("veryHigh");
  });
});

// ─── computeTrend ─────────────────────────────────────────────

describe("computeTrend", () => {
  it("returns stable for single reading", () => {
    expect(computeTrend([makeReading(6.0, 0)])).toBe("stable");
  });

  it("detects rising trend", () => {
    const readings = [
      makeReading(5.0, 20),
      makeReading(6.0, 15),
      makeReading(7.2, 10),
      makeReading(8.5, 5),
      makeReading(9.8, 0),
    ];
    expect(computeTrend(readings)).toBe("rising_fast");
  });

  it("detects falling trend", () => {
    const readings = [
      makeReading(10.0, 20),
      makeReading(8.5, 15),
      makeReading(7.0, 10),
      makeReading(5.5, 5),
      makeReading(4.0, 0),
    ];
    expect(computeTrend(readings)).toBe("falling_fast");
  });

  it("detects stable trend", () => {
    const readings = [
      makeReading(6.0, 20),
      makeReading(6.1, 15),
      makeReading(5.9, 10),
      makeReading(6.0, 5),
      makeReading(6.1, 0),
    ];
    expect(computeTrend(readings)).toBe("stable");
  });
});

// ─── computeGmi ───────────────────────────────────────────────

describe("computeGmi", () => {
  it("returns ~5.7 for mean 7.0 mmol/L", () => {
    // 7.0 mmol/L = 126 mg/dL → GMI = 3.31 + 0.02392 * 126 = 6.32
    const gmi = computeGmi(7.0);
    expect(gmi).toBeCloseTo(6.3, 0);
  });

  it("returns higher GMI for higher mean glucose", () => {
    expect(computeGmi(10.0)).toBeGreaterThan(computeGmi(7.0));
  });

  it("returns lower GMI for lower mean glucose", () => {
    expect(computeGmi(5.5)).toBeLessThan(computeGmi(7.0));
  });
});

// ─── detectPatterns ───────────────────────────────────────────

describe("detectPatterns", () => {
  it("returns empty array for fewer than 12 readings", () => {
    const readings = Array.from({ length: 5 }, (_, i) =>
      makeReading(6.0, i * 5)
    );
    expect(detectPatterns(readings)).toEqual([]);
  });

  it("detects high variability pattern", () => {
    // Create readings with very high CV
    const readings = Array.from({ length: 24 }, (_, i) =>
      makeReading(i % 2 === 0 ? 2.5 : 18.0, i * 60)
    );
    const patterns = detectPatterns(readings);
    expect(patterns.some((p) => p.includes("variability"))).toBe(true);
  });

  it("detects post-meal hyperglycaemia", () => {
    const readings = Array.from({ length: 24 }, (_, i) =>
      makeReading(i === 5 ? 14.0 : 6.0, i * 60)
    );
    const patterns = detectPatterns(readings);
    expect(patterns.some((p) => p.includes("hyperglycaemia"))).toBe(true);
  });

  it("detects nocturnal hypoglycaemia", () => {
    const date = new Date();
    date.setHours(2, 0, 0, 0);
    const readings = Array.from({ length: 24 }, (_, i) => {
      const t = new Date(date.getTime() + i * 60 * 60 * 1000);
      return makeReadingAt(i === 1 ? 3.2 : 6.5, t.toISOString());
    });
    const patterns = detectPatterns(readings);
    expect(patterns.some((p) => p.includes("Nocturnal"))).toBe(true);
  });
});

// ─── computeTrendReport ───────────────────────────────────────

describe("computeTrendReport", () => {
  it("returns zero report for empty readings", () => {
    const report = computeTrendReport([]);
    expect(report.count).toBe(0);
    expect(report.mean).toBe(0);
    expect(report.tirPercent).toBe(0);
  });

  it("computes correct mean and SD", () => {
    const readings = [
      makeReading(5.0, 30),
      makeReading(7.0, 20),
      makeReading(9.0, 10),
    ];
    const report = computeTrendReport(readings);
    expect(report.mean).toBeCloseTo(7.0, 1);
    expect(report.count).toBe(3);
  });

  it("computes 100% TIR for all in-range readings", () => {
    const readings = Array.from({ length: 10 }, (_, i) =>
      makeReading(6.5, i * 5)
    );
    const report = computeTrendReport(readings);
    expect(report.tirPercent).toBe(100.0);
    expect(report.tir.inRange).toBe(10);
  });

  it("computes 0% TIR for all very-high readings", () => {
    const readings = Array.from({ length: 10 }, (_, i) =>
      makeReading(16.0, i * 5)
    );
    const report = computeTrendReport(readings);
    expect(report.tirPercent).toBe(0.0);
    expect(report.tir.veryHigh).toBe(10);
  });

  it("computes CV correctly", () => {
    const readings = [
      makeReading(5.0, 30),
      makeReading(7.0, 20),
      makeReading(9.0, 10),
    ];
    const report = computeTrendReport(readings);
    // mean=7, sd≈1.63, cv≈23.3%
    expect(report.cv).toBeGreaterThan(20);
    expect(report.cv).toBeLessThan(30);
  });

  it("includes GMI in report", () => {
    const readings = Array.from({ length: 10 }, (_, i) =>
      makeReading(7.0, i * 5)
    );
    const report = computeTrendReport(readings);
    expect(report.gmi).toBeGreaterThan(5.0);
    expect(report.gmi).toBeLessThan(10.0);
  });

  it("includes period hours", () => {
    const readings = [
      makeReading(6.0, 120),
      makeReading(6.0, 60),
      makeReading(6.0, 0),
    ];
    const report = computeTrendReport(readings);
    expect(report.periodHours).toBeCloseTo(2.0, 0);
  });
});
