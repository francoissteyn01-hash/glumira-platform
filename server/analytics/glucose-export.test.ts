/**
 * GluMira™ — glucose-export.test.ts
 *
 * Test suite for server/analytics/glucose-export.ts
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { describe, it, expect } from "vitest";
import {
  mmolToMgdl,
  mgdlToMmol,
  filterByDateRange,
  computeExportStats,
  exportToCsv,
  exportToJson,
  exportGlucoseData,
} from "./glucose-export";
import type { GlucosePoint } from "./glucose-trend";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeReading(glucose: number, isoDate: string): GlucosePoint {
  return { glucose, timestamp: isoDate };
}

const READINGS: GlucosePoint[] = [
  makeReading(5.0, "2026-03-20T08:00:00.000Z"),
  makeReading(6.5, "2026-03-21T08:00:00.000Z"),
  makeReading(8.0, "2026-03-22T08:00:00.000Z"),
  makeReading(3.5, "2026-03-23T08:00:00.000Z"), // hypo
  makeReading(11.0,"2026-03-24T08:00:00.000Z"), // hyper
  makeReading(7.0, "2026-03-25T08:00:00.000Z"),
  makeReading(6.0, "2026-03-26T08:00:00.000Z"),
];

// ─── mmolToMgdl ───────────────────────────────────────────────────────────────

describe("mmolToMgdl", () => {
  it("converts 5.0 mmol/L to ~90 mg/dL", () => {
    expect(mmolToMgdl(5.0)).toBeCloseTo(90.1, 0);
  });

  it("converts 10.0 mmol/L to ~180 mg/dL", () => {
    expect(mmolToMgdl(10.0)).toBeCloseTo(180.2, 0);
  });

  it("returns 0 for 0 input", () => {
    expect(mmolToMgdl(0)).toBe(0);
  });
});

// ─── mgdlToMmol ───────────────────────────────────────────────────────────────

describe("mgdlToMmol", () => {
  it("converts 180 mg/dL to ~10.0 mmol/L", () => {
    expect(mgdlToMmol(180)).toBeCloseTo(9.99, 1);
  });

  it("converts 90 mg/dL to ~5.0 mmol/L", () => {
    expect(mgdlToMmol(90)).toBeCloseTo(4.99, 1);
  });

  it("round-trips mmol → mgdl → mmol within 0.1 mmol", () => {
    const original = 6.5;
    const converted = mgdlToMmol(mmolToMgdl(original));
    expect(Math.abs(converted - original)).toBeLessThan(0.1);
  });
});

// ─── filterByDateRange ────────────────────────────────────────────────────────

describe("filterByDateRange", () => {
  it("returns all readings when no range is specified", () => {
    const result = filterByDateRange(READINGS);
    expect(result).toHaveLength(READINGS.length);
  });

  it("filters by startDate", () => {
    const result = filterByDateRange(READINGS, "2026-03-23");
    expect(result.every((r) => r.timestamp >= "2026-03-23")).toBe(true);
  });

  it("filters by endDate", () => {
    const result = filterByDateRange(READINGS, undefined, "2026-03-22");
    expect(result.every((r) => r.timestamp <= "2026-03-22T23:59:59.999Z")).toBe(true);
  });

  it("filters by both startDate and endDate", () => {
    const result = filterByDateRange(READINGS, "2026-03-21", "2026-03-23");
    expect(result.length).toBe(3);
  });

  it("returns empty array when range excludes all readings", () => {
    const result = filterByDateRange(READINGS, "2030-01-01", "2030-12-31");
    expect(result).toHaveLength(0);
  });
});

// ─── computeExportStats ───────────────────────────────────────────────────────

describe("computeExportStats", () => {
  it("returns zeros for empty readings", () => {
    const stats = computeExportStats([], "mmol");
    expect(stats.count).toBe(0);
    expect(stats.avgGlucose).toBe(0);
  });

  it("counts readings correctly", () => {
    const stats = computeExportStats(READINGS, "mmol");
    expect(stats.count).toBe(7);
  });

  it("calculates TIR correctly (5 of 7 in range)", () => {
    // 5.0, 6.5, 8.0, 7.0, 6.0 are in range; 3.5 hypo, 11.0 hyper
    const stats = computeExportStats(READINGS, "mmol");
    expect(stats.tirPercent).toBeCloseTo(71.4, 0);
  });

  it("returns unit as mmol when requested", () => {
    const stats = computeExportStats(READINGS, "mmol");
    expect(stats.unit).toBe("mmol");
  });

  it("returns unit as mgdl when requested", () => {
    const stats = computeExportStats(READINGS, "mgdl");
    expect(stats.unit).toBe("mgdl");
  });

  it("avg glucose in mgdl is ~18x higher than mmol", () => {
    const mmolStats = computeExportStats(READINGS, "mmol");
    const mgdlStats = computeExportStats(READINGS, "mgdl");
    expect(mgdlStats.avgGlucose).toBeGreaterThan(mmolStats.avgGlucose * 15);
  });
});

// ─── exportToCsv ─────────────────────────────────────────────────────────────

describe("exportToCsv", () => {
  it("returns a non-empty string", () => {
    const csv = exportToCsv(READINGS, "mmol");
    expect(csv.length).toBeGreaterThan(0);
  });

  it("includes a header row with timestamp and glucose columns", () => {
    const csv = exportToCsv(READINGS, "mmol");
    expect(csv).toContain("timestamp");
    expect(csv).toContain("glucose_mmol");
  });

  it("includes correct number of data rows", () => {
    const csv = exportToCsv(READINGS, "mmol");
    const dataLines = csv.split("\n").filter((l) => !l.startsWith("#") && l.trim() && !l.startsWith("timestamp"));
    expect(dataLines).toHaveLength(READINGS.length);
  });

  it("includes stats header when stats provided", () => {
    const stats = computeExportStats(READINGS, "mmol");
    const csv = exportToCsv(READINGS, "mmol", stats);
    expect(csv).toContain("GluMira");
  });

  it("uses mgdl column name for mgdl unit", () => {
    const csv = exportToCsv(READINGS, "mgdl");
    expect(csv).toContain("glucose_mgdl");
  });
});

// ─── exportToJson ─────────────────────────────────────────────────────────────

describe("exportToJson", () => {
  it("returns valid JSON", () => {
    const json = exportToJson(READINGS, "mmol");
    expect(() => JSON.parse(json)).not.toThrow();
  });

  it("includes readings array", () => {
    const parsed = JSON.parse(exportToJson(READINGS, "mmol"));
    expect(Array.isArray(parsed.readings)).toBe(true);
    expect(parsed.readings).toHaveLength(READINGS.length);
  });

  it("includes disclaimer", () => {
    const parsed = JSON.parse(exportToJson(READINGS, "mmol"));
    expect(parsed.disclaimer.toLowerCase()).toContain("not a medical device");
  });

  it("includes stats when provided", () => {
    const stats = computeExportStats(READINGS, "mmol");
    const parsed = JSON.parse(exportToJson(READINGS, "mmol", stats));
    expect(parsed.stats).toBeTruthy();
    expect(parsed.stats.count).toBe(7);
  });
});

// ─── exportGlucoseData ────────────────────────────────────────────────────────

describe("exportGlucoseData", () => {
  it("returns a result object with content and filename", () => {
    const result = exportGlucoseData(READINGS);
    expect(result.content).toBeTruthy();
    expect(result.filename).toBeTruthy();
  });

  it("defaults to CSV format", () => {
    const result = exportGlucoseData(READINGS);
    expect(result.mimeType).toBe("text/csv");
    expect(result.filename).toMatch(/\.csv$/);
  });

  it("returns JSON format when requested", () => {
    const result = exportGlucoseData(READINGS, { format: "json" });
    expect(result.mimeType).toBe("application/json");
    expect(result.filename).toMatch(/\.json$/);
  });

  it("rowCount matches filtered readings", () => {
    const result = exportGlucoseData(READINGS, {
      startDate: "2026-03-21",
      endDate:   "2026-03-23",
    });
    expect(result.rowCount).toBe(3);
  });

  it("includes stats by default", () => {
    const result = exportGlucoseData(READINGS);
    expect(result.stats).toBeTruthy();
    expect(result.stats!.count).toBe(7);
  });

  it("handles empty readings gracefully", () => {
    const result = exportGlucoseData([]);
    expect(result.rowCount).toBe(0);
    expect(result.content).toBeTruthy();
  });
});
