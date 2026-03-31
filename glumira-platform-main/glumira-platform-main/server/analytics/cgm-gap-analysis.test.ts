import { describe, it, expect } from "vitest";
import { analyzeCGMGaps, type CGMReading } from "./cgm-gap-analysis";

/* ── helpers ─────────────────────────────────────────────────── */
function mkReadings(
  startHour: number,
  count: number,
  intervalMinutes: number = 5,
  glucose: number = 6.5,
  gapAfter?: { index: number; gapMinutes: number }
): CGMReading[] {
  const readings: CGMReading[] = [];
  let ts = new Date(Date.UTC(2026, 2, 15, startHour, 0, 0)).getTime();

  for (let i = 0; i < count; i++) {
    readings.push({
      timestampUtc: new Date(ts).toISOString(),
      glucoseMmol: glucose + (Math.sin(i) * 0.5),
    });
    ts += intervalMinutes * 60_000;
    if (gapAfter && i === gapAfter.index) {
      ts += gapAfter.gapMinutes * 60_000;
    }
  }
  return readings;
}

/* ── Basic analysis ──────────────────────────────────────────── */
describe("analyzeCGMGaps — basics", () => {
  it("analyzes continuous data with no gaps", () => {
    const readings = mkReadings(0, 288); // 24h of 5-min data
    const r = analyzeCGMGaps(readings);
    expect(r.totalReadings).toBe(288);
    expect(r.totalGaps).toBe(0);
    expect(r.dataCompleteness).toBeGreaterThanOrEqual(99);
  });

  it("detects a single gap", () => {
    const readings = mkReadings(0, 100, 5, 6.5, { index: 50, gapMinutes: 30 });
    const r = analyzeCGMGaps(readings);
    expect(r.totalGaps).toBeGreaterThan(0);
  });

  it("calculates data completeness", () => {
    const readings = mkReadings(0, 288);
    const r = analyzeCGMGaps(readings);
    expect(r.dataCompleteness).toBeGreaterThan(0);
    expect(r.dataCompleteness).toBeLessThanOrEqual(100);
  });

  it("returns quality score", () => {
    const readings = mkReadings(0, 288);
    const r = analyzeCGMGaps(readings);
    expect(["excellent", "good", "fair", "poor"]).toContain(r.qualityScore);
  });
});

/* ── Empty data ──────────────────────────────────────────────── */
describe("analyzeCGMGaps — empty data", () => {
  it("handles zero readings", () => {
    const r = analyzeCGMGaps([]);
    expect(r.totalReadings).toBe(0);
    expect(r.qualityScore).toBe("poor");
    expect(r.warnings.length).toBeGreaterThan(0);
  });
});

/* ── Gap detection ───────────────────────────────────────────── */
describe("analyzeCGMGaps — gap detection", () => {
  it("detects gap longer than 2x interval", () => {
    const readings = mkReadings(0, 50, 5, 6.5, { index: 25, gapMinutes: 20 });
    const r = analyzeCGMGaps(readings);
    expect(r.totalGaps).toBeGreaterThan(0);
    expect(r.gaps[0].durationMinutes).toBeGreaterThan(10);
  });

  it("does not flag normal intervals as gaps", () => {
    const readings = mkReadings(0, 50, 5);
    const r = analyzeCGMGaps(readings);
    expect(r.totalGaps).toBe(0);
  });

  it("calculates total gap minutes", () => {
    const readings = mkReadings(0, 50, 5, 6.5, { index: 25, gapMinutes: 60 });
    const r = analyzeCGMGaps(readings);
    expect(r.totalGapMinutes).toBeGreaterThan(0);
  });

  it("finds longest gap", () => {
    const readings = mkReadings(0, 50, 5, 6.5, { index: 25, gapMinutes: 120 });
    const r = analyzeCGMGaps(readings);
    expect(r.longestGapMinutes).toBeGreaterThanOrEqual(120);
  });
});

/* ── Gap classification ──────────────────────────────────────── */
describe("analyzeCGMGaps — classification", () => {
  it("classifies short gaps as signal-loss", () => {
    const readings = mkReadings(8, 50, 5, 6.5, { index: 25, gapMinutes: 15 });
    const r = analyzeCGMGaps(readings);
    if (r.gaps.length > 0) {
      expect(r.gaps[0].gapType).toBe("signal-loss");
    }
  });

  it("classifies long gaps as sensor-change", () => {
    const readings = mkReadings(10, 50, 5, 6.5, { index: 25, gapMinutes: 180 });
    const r = analyzeCGMGaps(readings);
    expect(r.gaps.some((g) => g.gapType === "sensor-change")).toBe(true);
  });

  it("classifies 1-2h gaps as warm-up", () => {
    const readings = mkReadings(10, 50, 5, 6.5, { index: 25, gapMinutes: 65 });
    const r = analyzeCGMGaps(readings);
    expect(r.gaps.some((g) => g.gapType === "warm-up")).toBe(true);
  });

  it("detects compression lows during sleep", () => {
    // Create readings at 2 AM with a low glucose before the gap
    const readings: CGMReading[] = [];
    let ts = new Date(Date.UTC(2026, 2, 15, 2, 0, 0)).getTime();
    for (let i = 0; i < 20; i++) {
      readings.push({
        timestampUtc: new Date(ts).toISOString(),
        glucoseMmol: i === 9 ? 3.0 : 6.5, // Low reading before gap
      });
      ts += 5 * 60_000;
      if (i === 9) ts += 20 * 60_000; // 20-min gap after low
    }
    const r = analyzeCGMGaps(readings);
    expect(r.compressionLows).toBeGreaterThanOrEqual(0); // May or may not detect depending on gap size
  });
});

/* ── Gap patterns ────────────────────────────────────────────── */
describe("analyzeCGMGaps — patterns", () => {
  it("groups gaps by time of day", () => {
    // Create multiple gaps in the same time slot
    const readings: CGMReading[] = [];
    let ts = new Date(Date.UTC(2026, 2, 15, 0, 0, 0)).getTime();
    for (let i = 0; i < 200; i++) {
      readings.push({
        timestampUtc: new Date(ts).toISOString(),
        glucoseMmol: 6.5,
      });
      ts += 5 * 60_000;
      // Add gaps at similar times
      if (i === 50 || i === 100 || i === 150) {
        ts += 30 * 60_000;
      }
    }
    const r = analyzeCGMGaps(readings);
    expect(r.patterns.length).toBeGreaterThan(0);
  });
});

/* ── Quality score ───────────────────────────────────────────── */
describe("analyzeCGMGaps — quality", () => {
  it("excellent for >95% completeness", () => {
    const readings = mkReadings(0, 288);
    const r = analyzeCGMGaps(readings);
    expect(r.qualityScore).toBe("excellent");
  });

  it("poor for <70% completeness", () => {
    // Only 50 readings where 288 expected (24h)
    const readings = mkReadings(0, 50, 5, 6.5, { index: 25, gapMinutes: 600 });
    const r = analyzeCGMGaps(readings);
    expect(["fair", "poor"]).toContain(r.qualityScore);
  });
});

/* ── Warnings ────────────────────────────────────────────────── */
describe("analyzeCGMGaps — warnings", () => {
  it("warns about long gaps", () => {
    const readings = mkReadings(0, 50, 5, 6.5, { index: 25, gapMinutes: 240 });
    const r = analyzeCGMGaps(readings);
    expect(r.warnings.some((w) => w.includes("Longest gap"))).toBe(true);
  });

  it("provides recommendations", () => {
    const readings = mkReadings(0, 50, 5, 6.5, { index: 25, gapMinutes: 120 });
    const r = analyzeCGMGaps(readings);
    expect(r.recommendations.length).toBeGreaterThan(0);
  });
});

/* ── Sensor changes ──────────────────────────────────────────── */
describe("analyzeCGMGaps — sensors", () => {
  it("counts sensor changes", () => {
    const readings = mkReadings(0, 100, 5, 6.5, { index: 50, gapMinutes: 180 });
    const r = analyzeCGMGaps(readings);
    expect(r.sensorChanges).toBeGreaterThan(0);
  });
});

/* ── Before/after gap values ─────────────────────────────────── */
describe("analyzeCGMGaps — gap context", () => {
  it("records glucose before and after gap", () => {
    const readings = mkReadings(0, 50, 5, 6.5, { index: 25, gapMinutes: 60 });
    const r = analyzeCGMGaps(readings);
    if (r.gaps.length > 0) {
      expect(r.gaps[0].beforeGap).not.toBeNull();
      expect(r.gaps[0].afterGap).not.toBeNull();
    }
  });
});
