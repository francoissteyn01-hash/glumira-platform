import { describe, it, expect } from "vitest";
import {
  generatePatientReport,
  type PatientReportInput,
  type TaggedReading,
} from "./glucose-report-v2";

/* ── helpers ─────────────────────────────────────────────────── */
function mkReadings(
  values: number[],
  tags?: ("pre-meal" | "post-meal" | "fasting" | "bedtime" | "none")[]
): TaggedReading[] {
  return values.map((v, i) => ({
    timestampUtc: new Date(Date.UTC(2026, 2, 1 + Math.floor(i / 6), (i % 6) * 4)).toISOString(),
    glucoseMmol: v,
    mealTag: tags?.[i] ?? "none",
  }));
}

const goodValues = [6.5, 7.0, 5.5, 8.0, 6.0, 7.5, 6.8, 7.2, 5.8, 6.5, 7.0, 6.2, 8.5, 5.0, 6.5,
  6.3, 7.1, 5.9, 6.7, 7.3, 6.0, 6.5, 7.0, 6.8];

const baseInput: PatientReportInput = {
  readings: mkReadings(goodValues),
  targetLow: 4.0,
  targetHigh: 10.0,
};

/* ── Report structure ────────────────────────────────────────── */
describe("generatePatientReport — structure", () => {
  it("generates a complete report", () => {
    const r = generatePatientReport(baseInput);
    expect(r.title).toContain("GluMira");
    expect(r.generatedAt).toBeDefined();
    expect(r.disclaimer).toContain("NOT a medical device");
  });

  it("includes summary stats", () => {
    const r = generatePatientReport(baseInput);
    expect(r.summary.totalReadings).toBe(goodValues.length);
    expect(r.summary.meanGlucose).toBeGreaterThan(0);
  });

  it("includes insights", () => {
    const r = generatePatientReport(baseInput);
    expect(r.insights.length).toBeGreaterThan(0);
  });

  it("includes encouragement", () => {
    const r = generatePatientReport(baseInput);
    expect(r.encouragement.length).toBeGreaterThan(0);
  });
});

/* ── Summary metrics ─────────────────────────────────────────── */
describe("generatePatientReport — summary", () => {
  it("calculates mean glucose", () => {
    const r = generatePatientReport(baseInput);
    expect(r.summary.meanGlucose).toBeGreaterThan(5);
    expect(r.summary.meanGlucose).toBeLessThan(10);
  });

  it("calculates median glucose", () => {
    const r = generatePatientReport(baseInput);
    expect(r.summary.medianGlucose).toBeGreaterThan(5);
    expect(r.summary.medianGlucose).toBeLessThan(10);
  });

  it("TIR + TBR + TAR = 100%", () => {
    const r = generatePatientReport(baseInput);
    const total = r.summary.timeInRange + r.summary.timeBelowRange + r.summary.timeAboveRange;
    expect(total).toBe(100);
  });

  it("100% TIR for all-in-range readings", () => {
    const input: PatientReportInput = {
      readings: mkReadings([6.0, 7.0, 8.0, 5.0, 9.0]),
      targetLow: 4.0,
      targetHigh: 10.0,
    };
    const r = generatePatientReport(input);
    expect(r.summary.timeInRange).toBe(100);
  });

  it("estimates A1c", () => {
    const r = generatePatientReport(baseInput);
    expect(r.summary.estimatedA1c).toBeGreaterThan(4);
    expect(r.summary.estimatedA1c).toBeLessThan(15);
  });

  it("calculates std dev", () => {
    const r = generatePatientReport(baseInput);
    expect(r.summary.stdDev).toBeGreaterThan(0);
  });

  it("calculates CV", () => {
    const r = generatePatientReport(baseInput);
    expect(r.summary.cv).toBeGreaterThan(0);
  });

  it("finds min and max", () => {
    const r = generatePatientReport(baseInput);
    expect(r.summary.min).toBe(5.0);
    expect(r.summary.max).toBe(8.5);
  });
});

/* ── Daily breakdown ─────────────────────────────────────────── */
describe("generatePatientReport — daily", () => {
  it("groups readings by date", () => {
    const r = generatePatientReport(baseInput);
    expect(r.dailyBreakdown.length).toBeGreaterThan(0);
  });

  it("each day has correct reading count", () => {
    const r = generatePatientReport(baseInput);
    const totalFromDaily = r.dailyBreakdown.reduce((a, d) => a + d.readingCount, 0);
    expect(totalFromDaily).toBe(goodValues.length);
  });

  it("daily TIR is between 0-100", () => {
    const r = generatePatientReport(baseInput);
    r.dailyBreakdown.forEach((d) => {
      expect(d.timeInRange).toBeGreaterThanOrEqual(0);
      expect(d.timeInRange).toBeLessThanOrEqual(100);
    });
  });
});

/* ── Meal tag analysis ───────────────────────────────────────── */
describe("generatePatientReport — meal tags", () => {
  it("analyzes tagged readings", () => {
    const tags: ("pre-meal" | "post-meal" | "fasting" | "none")[] = [
      "fasting", "pre-meal", "post-meal", "pre-meal", "post-meal", "fasting",
    ];
    const input: PatientReportInput = {
      readings: mkReadings([5.5, 6.0, 9.0, 5.8, 8.5, 5.2], tags),
      targetLow: 4.0,
      targetHigh: 10.0,
    };
    const r = generatePatientReport(input);
    expect(r.mealTagAnalysis.length).toBeGreaterThan(0);
    expect(r.mealTagAnalysis.some((m) => m.tag === "fasting")).toBe(true);
    expect(r.mealTagAnalysis.some((m) => m.tag === "post-meal")).toBe(true);
  });

  it("excludes 'none' tag from analysis", () => {
    const r = generatePatientReport(baseInput);
    expect(r.mealTagAnalysis.every((m) => m.tag !== "none")).toBe(true);
  });
});

/* ── Trend analysis ──────────────────────────────────────────── */
describe("generatePatientReport — trends", () => {
  it("generates trend segments for sufficient data", () => {
    const r = generatePatientReport(baseInput);
    expect(r.trendAnalysis.length).toBe(2);
  });

  it("detects improving trend", () => {
    // First half high, second half lower
    const vals = [10, 11, 12, 10, 11, 12, 6, 6.5, 7, 6, 6.5, 7, 6, 6.5, 7, 6, 6.5, 7, 6, 6.5, 7, 6, 6.5, 7];
    const input: PatientReportInput = {
      readings: mkReadings(vals),
      targetLow: 4.0,
      targetHigh: 10.0,
    };
    const r = generatePatientReport(input);
    expect(r.trendAnalysis.length).toBe(2);
    expect(r.trendAnalysis[1].direction).toBe("improving");
  });

  it("no trends for too few days", () => {
    const input: PatientReportInput = {
      readings: mkReadings([6.0, 7.0, 8.0]),
      targetLow: 4.0,
      targetHigh: 10.0,
    };
    const r = generatePatientReport(input);
    expect(r.trendAnalysis.length).toBe(0);
  });
});

/* ── Insights ────────────────────────────────────────────────── */
describe("generatePatientReport — insights", () => {
  it("congratulates good TIR", () => {
    const r = generatePatientReport(baseInput);
    expect(r.insights.some((i) => i.includes("Well done") || i.includes("meets"))).toBe(true);
  });

  it("flags high below-range", () => {
    const vals = [3.0, 3.5, 3.2, 3.8, 6.0, 7.0, 3.1, 3.4, 3.6, 3.9, 6.0, 7.0];
    const input: PatientReportInput = {
      readings: mkReadings(vals),
      targetLow: 4.0,
      targetHigh: 10.0,
    };
    const r = generatePatientReport(input);
    expect(r.insights.some((i) => i.includes("below target"))).toBe(true);
  });

  it("flags high above-range", () => {
    const vals = [12, 13, 14, 15, 11, 12, 13, 14, 15, 11, 6, 7];
    const input: PatientReportInput = {
      readings: mkReadings(vals),
      targetLow: 4.0,
      targetHigh: 10.0,
    };
    const r = generatePatientReport(input);
    expect(r.insights.some((i) => i.includes("above target"))).toBe(true);
  });
});

/* ── Encouragement ───────────────────────────────────────────── */
describe("generatePatientReport — encouragement", () => {
  it("outstanding for 80%+ TIR", () => {
    const vals = [6.0, 7.0, 6.5, 7.5, 6.0, 7.0, 6.5, 7.5, 6.0, 7.0];
    const input: PatientReportInput = {
      readings: mkReadings(vals),
      targetLow: 4.0,
      targetHigh: 10.0,
    };
    const r = generatePatientReport(input);
    expect(r.encouragement).toContain("Outstanding");
  });

  it("encouraging for lower TIR", () => {
    const vals = [12, 13, 14, 15, 3, 2, 11, 12, 6, 7];
    const input: PatientReportInput = {
      readings: mkReadings(vals),
      targetLow: 4.0,
      targetHigh: 10.0,
    };
    const r = generatePatientReport(input);
    expect(r.encouragement.length).toBeGreaterThan(0);
  });
});

/* ── Empty data ──────────────────────────────────────────────── */
describe("generatePatientReport — empty data", () => {
  it("handles zero readings", () => {
    const input: PatientReportInput = {
      readings: [],
      targetLow: 4.0,
      targetHigh: 10.0,
    };
    const r = generatePatientReport(input);
    expect(r.summary.totalReadings).toBe(0);
    expect(r.summary.meanGlucose).toBe(0);
    expect(r.summary.timeInRange).toBe(0);
  });
});
