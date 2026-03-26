import { describe, it, expect } from "vitest";
import { optimizePumpSettings, type PumpSettingsInput, type PumpReading } from "./pump-settings-optimizer";

/* ── helpers ─────────────────────────────────────────────────── */
function mkReadings(startHour: number, count: number, baseGlucose: number, trend: number = 0): PumpReading[] {
  return Array.from({ length: count }, (_, i) => ({
    timestampUtc: new Date(Date.UTC(2026, 2, 15, startHour + Math.floor(i / 2), (i % 2) * 30)).toISOString(),
    glucoseMmol: Math.round((baseGlucose + trend * i / count) * 10) / 10,
  }));
}

const baseInput: PumpSettingsInput = {
  currentBasalSegments: [
    { startHour: 0, endHour: 6, rateUnitsPerHour: 0.8 },
    { startHour: 6, endHour: 12, rateUnitsPerHour: 1.0 },
    { startHour: 12, endHour: 18, rateUnitsPerHour: 0.9 },
    { startHour: 18, endHour: 24, rateUnitsPerHour: 0.85 },
  ],
  currentICR: 10,
  currentISF: 3.0,
  currentDIA: 4.0,
  currentTDD: 35,
  weightKg: 70,
  overnightReadings: mkReadings(22, 8, 6.5),
  preMealReadings: mkReadings(7, 4, 6.0),
  postMealReadings: mkReadings(9, 4, 7.5),
  correctionReadings: mkReadings(14, 4, 8.0, -2),
  hyposLastWeek: 1,
  hypersLastWeek: 2,
};

/* ── Structure ───────────────────────────────────────────────── */
describe("optimizePumpSettings — structure", () => {
  it("returns complete result", () => {
    const r = optimizePumpSettings(baseInput);
    expect(r.disclaimer).toContain("NOT a medical device");
    expect(r.safetyNotes.length).toBeGreaterThan(0);
    expect(r.overallAssessment.length).toBeGreaterThan(0);
  });
});

/* ── Dawn phenomenon ─────────────────────────────────────────── */
describe("optimizePumpSettings — dawn phenomenon", () => {
  it("detects dawn phenomenon", () => {
    const input: PumpSettingsInput = {
      ...baseInput,
      overnightReadings: [
        ...mkReadings(22, 4, 6.0),  // evening: stable at 6.0
        ...mkReadings(3, 4, 8.5),   // early morning: rising to 8.5
      ],
    };
    const r = optimizePumpSettings(input);
    expect(r.basalSuggestions.some((s) => s.segment.includes("03:00"))).toBe(true);
    expect(r.priorities.some((p) => p.includes("dawn"))).toBe(true);
  });
});

/* ── Overnight drop ──────────────────────────────────────────── */
describe("optimizePumpSettings — overnight basal", () => {
  it("suggests reducing basal for overnight drops", () => {
    const input: PumpSettingsInput = {
      ...baseInput,
      overnightReadings: mkReadings(22, 8, 8.0, -3.0),
    };
    const r = optimizePumpSettings(input);
    expect(r.basalSuggestions.some((s) => s.change.startsWith("-"))).toBe(true);
  });

  it("no basal change for stable overnight", () => {
    const r = optimizePumpSettings(baseInput);
    const overnightSuggestions = r.basalSuggestions.filter(
      (s) => s.segment.includes("22:00") || s.segment.includes("03:00")
    );
    expect(overnightSuggestions.length).toBe(0);
  });
});

/* ── Pre-meal basal ──────────────────────────────────────────── */
describe("optimizePumpSettings — daytime basal", () => {
  it("suggests increase for high pre-meal", () => {
    const input: PumpSettingsInput = {
      ...baseInput,
      preMealReadings: mkReadings(7, 4, 9.0),
    };
    const r = optimizePumpSettings(input);
    expect(r.basalSuggestions.some((s) => s.segment.includes("06:00") && s.change.startsWith("+"))).toBe(true);
  });

  it("suggests decrease for low pre-meal", () => {
    const input: PumpSettingsInput = {
      ...baseInput,
      preMealReadings: mkReadings(7, 4, 4.0),
    };
    const r = optimizePumpSettings(input);
    expect(r.basalSuggestions.some((s) => s.segment.includes("06:00") && s.change.startsWith("-"))).toBe(true);
  });
});

/* ── ICR optimization ────────────────────────────────────────── */
describe("optimizePumpSettings — ICR", () => {
  it("tightens ICR for high post-meal", () => {
    const input: PumpSettingsInput = {
      ...baseInput,
      postMealReadings: mkReadings(9, 4, 12.0),
    };
    const r = optimizePumpSettings(input);
    expect(r.settingSuggestions.some((s) => s.setting.includes("ICR"))).toBe(true);
  });

  it("loosens ICR for low post-meal", () => {
    const input: PumpSettingsInput = {
      ...baseInput,
      postMealReadings: mkReadings(9, 4, 4.5),
    };
    const r = optimizePumpSettings(input);
    expect(r.settingSuggestions.some((s) => s.setting.includes("ICR"))).toBe(true);
  });

  it("no ICR change for good post-meal", () => {
    const r = optimizePumpSettings(baseInput);
    expect(r.settingSuggestions.filter((s) => s.setting.includes("ICR")).length).toBe(0);
  });
});

/* ── ISF optimization ────────────────────────────────────────── */
describe("optimizePumpSettings — ISF", () => {
  it("tightens ISF for ineffective corrections", () => {
    const input: PumpSettingsInput = {
      ...baseInput,
      correctionReadings: mkReadings(14, 4, 10.0, -0.3),
    };
    const r = optimizePumpSettings(input);
    expect(r.settingSuggestions.some((s) => s.setting.includes("ISF"))).toBe(true);
  });

  it("loosens ISF for aggressive corrections", () => {
    const input: PumpSettingsInput = {
      ...baseInput,
      correctionReadings: mkReadings(14, 4, 10.0, -6.0),
    };
    const r = optimizePumpSettings(input);
    expect(r.settingSuggestions.some((s) => s.setting.includes("ISF"))).toBe(true);
  });
});

/* ── DIA check ───────────────────────────────────────────────── */
describe("optimizePumpSettings — DIA", () => {
  it("flags DIA below 3 hours", () => {
    const input: PumpSettingsInput = { ...baseInput, currentDIA: 2.5 };
    const r = optimizePumpSettings(input);
    expect(r.settingSuggestions.some((s) => s.setting.includes("DIA"))).toBe(true);
  });

  it("flags DIA above 5.5 hours", () => {
    const input: PumpSettingsInput = { ...baseInput, currentDIA: 6.0 };
    const r = optimizePumpSettings(input);
    expect(r.settingSuggestions.some((s) => s.setting.includes("DIA"))).toBe(true);
  });

  it("no DIA flag for normal range", () => {
    const r = optimizePumpSettings(baseInput);
    expect(r.settingSuggestions.filter((s) => s.setting.includes("DIA")).length).toBe(0);
  });
});

/* ── Safety ──────────────────────────────────────────────────── */
describe("optimizePumpSettings — safety", () => {
  it("always includes safety notes", () => {
    const r = optimizePumpSettings(baseInput);
    expect(r.safetyNotes.some((n) => n.includes("one setting at a time"))).toBe(true);
  });

  it("prioritizes hypo reduction", () => {
    const input: PumpSettingsInput = { ...baseInput, hyposLastWeek: 5 };
    const r = optimizePumpSettings(input);
    expect(r.priorities[0]).toContain("hypoglycemia");
  });
});

/* ── Empty data ──────────────────────────────────────────────── */
describe("optimizePumpSettings — minimal data", () => {
  it("handles no overnight data", () => {
    const input: PumpSettingsInput = { ...baseInput, overnightReadings: [] };
    const r = optimizePumpSettings(input);
    expect(r.basalSuggestions.filter((s) => s.segment.includes("03:00") || s.segment.includes("22:00")).length).toBe(0);
  });

  it("handles no post-meal data", () => {
    const input: PumpSettingsInput = { ...baseInput, postMealReadings: [] };
    const r = optimizePumpSettings(input);
    expect(r.settingSuggestions.filter((s) => s.setting.includes("ICR")).length).toBe(0);
  });

  it("handles no correction data", () => {
    const input: PumpSettingsInput = { ...baseInput, correctionReadings: [] };
    const r = optimizePumpSettings(input);
    expect(r.settingSuggestions.filter((s) => s.setting.includes("ISF")).length).toBe(0);
  });
});
