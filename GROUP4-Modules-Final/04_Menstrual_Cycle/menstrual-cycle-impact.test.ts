import { describe, it, expect } from "vitest";
import {
  analyzeCycleImpact,
  getCyclePhases,
  getCyclePhase,
  type CycleDay,
} from "./menstrual-cycle-impact";

/* ── helpers ─────────────────────────────────────────────────── */
const mkDay = (
  cycleDay: number,
  glucoseReadings: number[],
  opts: Partial<CycleDay> = {}
): CycleDay => ({
  date: `2026-03-${String(cycleDay).padStart(2, "0")}`,
  cycleDay,
  glucoseReadings,
  ...opts,
});

/* ── Phase classification ────────────────────────────────────── */
describe("getCyclePhase", () => {
  it("classifies day 1 as Menstruation", () => {
    expect(getCyclePhase(1).name).toBe("Menstruation");
  });

  it("classifies day 3 as Menstruation", () => {
    expect(getCyclePhase(3).name).toBe("Menstruation");
  });

  it("classifies day 8 as Follicular", () => {
    expect(getCyclePhase(8).name).toBe("Follicular");
  });

  it("classifies day 14 as Ovulation", () => {
    expect(getCyclePhase(14).name).toBe("Ovulation");
  });

  it("classifies day 20 as Early Luteal", () => {
    expect(getCyclePhase(20).name).toBe("Early Luteal");
  });

  it("classifies day 25 as Late Luteal", () => {
    expect(getCyclePhase(25).name).toBe("Late Luteal");
  });

  it("returns all 5 phases", () => {
    expect(getCyclePhases()).toHaveLength(5);
  });

  it("handles non-standard cycle length (35 days)", () => {
    // Day 30 of 35-day cycle ≈ day 24 of 28-day cycle → Late Luteal
    const phase = getCyclePhase(30, 35);
    expect(phase.name).toBe("Late Luteal");
  });
});

/* ── Empty data ──────────────────────────────────────────────── */
describe("analyzeCycleImpact — empty", () => {
  it("returns insufficient data with no readings", () => {
    const r = analyzeCycleImpact([]);
    expect(r.patternStrength).toBe("insufficient-data");
    expect(r.recommendations.length).toBeGreaterThan(0);
  });
});

/* ── Menstruation phase ──────────────────────────────────────── */
describe("analyzeCycleImpact — menstruation", () => {
  it("identifies menstruation phase", () => {
    const days = [mkDay(1, [6.5, 7.0]), mkDay(2, [6.8, 7.2]), mkDay(3, [6.0, 6.5])];
    const r = analyzeCycleImpact(days);
    expect(r.currentPhase.name).toBe("Menstruation");
    expect(r.currentCycleDay).toBe(3);
  });

  it("no significant insulin adjustment during menstruation", () => {
    const days = [mkDay(1, [6.5]), mkDay(2, [6.8]), mkDay(3, [6.0])];
    const r = analyzeCycleImpact(days);
    expect(r.insulinAdjustment.basalChangePercent).toBe(0);
  });
});

/* ── Follicular phase ────────────────────────────────────────── */
describe("analyzeCycleImpact — follicular", () => {
  it("recommends reduced insulin in follicular phase", () => {
    const days = [mkDay(8, [5.5, 6.0]), mkDay(9, [5.8, 6.2]), mkDay(10, [5.5])];
    const r = analyzeCycleImpact(days);
    expect(r.insulinAdjustment.basalChangePercent).toBeLessThan(0);
  });
});

/* ── Ovulation phase ─────────────────────────────────────────── */
describe("analyzeCycleImpact — ovulation", () => {
  it("warns about hypo risk during ovulation", () => {
    const days = [mkDay(14, [5.0, 5.5]), mkDay(15, [4.8, 5.2])];
    const r = analyzeCycleImpact(days);
    expect(r.warnings.some((w) => w.includes("hypo risk"))).toBe(true);
  });

  it("has negative resistance change at ovulation", () => {
    expect(getCyclePhase(14).typicalResistanceChangePercent).toBeLessThan(0);
  });
});

/* ── Luteal phase ────────────────────────────────────────────── */
describe("analyzeCycleImpact — luteal", () => {
  it("recommends increased insulin in late luteal", () => {
    const days = [mkDay(24, [8.0, 8.5]), mkDay(25, [8.2, 9.0]), mkDay(26, [8.5])];
    const r = analyzeCycleImpact(days);
    expect(r.insulinAdjustment.basalChangePercent).toBeGreaterThan(0);
  });

  it("warns about pre-menstrual resistance in late luteal", () => {
    const days = [mkDay(24, [8.0]), mkDay(25, [8.5]), mkDay(26, [9.0])];
    const r = analyzeCycleImpact(days);
    expect(r.warnings.some((w) => w.includes("Late luteal"))).toBe(true);
  });

  it("early luteal has moderate resistance increase", () => {
    const days = [mkDay(18, [7.0, 7.5]), mkDay(19, [7.2, 7.8])];
    const r = analyzeCycleImpact(days);
    expect(r.insulinAdjustment.basalChangePercent).toBeGreaterThan(0);
    expect(r.insulinAdjustment.basalChangePercent).toBeLessThanOrEqual(10);
  });
});

/* ── Phase prediction ────────────────────────────────────────── */
describe("analyzeCycleImpact — prediction", () => {
  it("predicts next phase correctly", () => {
    const days = [mkDay(14, [5.5]), mkDay(15, [5.8])];
    const r = analyzeCycleImpact(days);
    expect(r.predictedNextPhase.name).toBe("Early Luteal");
    expect(r.predictedNextPhase.startsInDays).toBeGreaterThan(0);
  });

  it("wraps around from Late Luteal to Menstruation", () => {
    const days = [mkDay(27, [8.0]), mkDay(28, [8.5])];
    const r = analyzeCycleImpact(days);
    expect(r.predictedNextPhase.name).toBe("Menstruation");
  });
});

/* ── Pattern strength ────────────────────────────────────────── */
describe("analyzeCycleImpact — pattern strength", () => {
  it("weak with 5-9 days of data", () => {
    const days = Array.from({ length: 5 }, (_, i) => mkDay(i + 1, [6.5]));
    const r = analyzeCycleImpact(days);
    expect(r.patternStrength).toBe("weak");
  });

  it("moderate with 10-19 days of data", () => {
    const days = Array.from({ length: 12 }, (_, i) => mkDay(i + 1, [6.5]));
    const r = analyzeCycleImpact(days);
    expect(r.patternStrength).toBe("moderate");
  });

  it("strong with 20+ days of data", () => {
    const days = Array.from({ length: 22 }, (_, i) => mkDay(i + 1, [6.5]));
    const r = analyzeCycleImpact(days);
    expect(r.patternStrength).toBe("strong");
  });
});

/* ── Symptom correlations ────────────────────────────────────── */
describe("analyzeCycleImpact — symptoms", () => {
  it("correlates symptoms with glucose", () => {
    const days = [
      mkDay(1, [8.0, 8.5], { symptoms: ["cramps"] }),
      mkDay(2, [8.2, 9.0], { symptoms: ["cramps", "fatigue"] }),
      mkDay(8, [5.5, 6.0], {}),
      mkDay(9, [5.8, 6.2], {}),
    ];
    const r = analyzeCycleImpact(days);
    const crampsCorr = r.symptomCorrelations.find((c) => c.symptom === "cramps");
    expect(crampsCorr).toBeDefined();
    expect(crampsCorr!.avgGlucoseWhenPresent).toBeGreaterThan(crampsCorr!.avgGlucoseWhenAbsent);
    expect(crampsCorr!.glucoseImpact).toBe("raises");
  });

  it("detects neutral symptom impact", () => {
    const days = [
      mkDay(1, [6.5], { symptoms: ["bloating"] }),
      mkDay(2, [6.5], {}),
      mkDay(3, [6.5], { symptoms: ["bloating"] }),
      mkDay(4, [6.5], {}),
    ];
    const r = analyzeCycleImpact(days);
    const bloating = r.symptomCorrelations.find((c) => c.symptom === "bloating");
    expect(bloating).toBeDefined();
    expect(bloating!.glucoseImpact).toBe("neutral");
  });
});

/* ── Phase analysis breakdown ────────────────────────────────── */
describe("analyzeCycleImpact — phase analysis", () => {
  it("groups readings by phase", () => {
    const days = [
      mkDay(1, [6.5, 7.0]),   // Menstruation
      mkDay(8, [5.5, 6.0]),   // Follicular
      mkDay(14, [5.0, 5.5]),  // Ovulation
      mkDay(20, [7.5, 8.0]),  // Early Luteal
      mkDay(25, [8.0, 8.5]),  // Late Luteal
    ];
    const r = analyzeCycleImpact(days);
    expect(r.phaseAnalysis.length).toBe(5);
  });

  it("calculates average glucose per phase", () => {
    const days = [
      mkDay(1, [6.0, 7.0]),  // avg 6.5
      mkDay(2, [6.5, 7.5]),  // avg 7.0
    ];
    const r = analyzeCycleImpact(days);
    const menstruation = r.phaseAnalysis.find((p) => p.phase === "Menstruation");
    expect(menstruation).toBeDefined();
    expect(menstruation!.avgGlucose).toBeCloseTo(6.75, 0);
  });

  it("tracks insulin totals per phase", () => {
    const days = [
      mkDay(1, [6.5], { basalDoseUnits: 20, totalBolusUnits: 10 }),
      mkDay(2, [7.0], { basalDoseUnits: 22, totalBolusUnits: 12 }),
    ];
    const r = analyzeCycleImpact(days);
    const menstruation = r.phaseAnalysis.find((p) => p.phase === "Menstruation");
    expect(menstruation!.avgTotalInsulin).toBeGreaterThan(0);
  });
});

/* ── Glucose variability warning ─────────────────────────────── */
describe("analyzeCycleImpact — variability", () => {
  it("warns about high variability in a phase", () => {
    const days = [
      mkDay(25, [3.0, 15.0, 4.0, 14.0]),  // Very high CV in late luteal
      mkDay(26, [3.5, 14.5, 4.5, 13.5]),
    ];
    const r = analyzeCycleImpact(days);
    expect(r.warnings.some((w) => w.includes("variability"))).toBe(true);
  });
});
