import { describe, it, expect } from "vitest";
import {
  generateClinicianSummary,
  type PatientProfile,
  type ReportPeriodData,
} from "./clinician-summary";

/* ── helpers ─────────────────────────────────────────────────── */
const baseProfile: PatientProfile = {
  name: "Test Patient",
  dateOfBirth: "1990-06-15",
  diabetesType: "type1",
  diagnosisYear: 2010,
  insulinRegimen: "MDI (Lantus + Novorapid)",
  basalDoseUnits: 22,
  isfMmol: 2.5,
  icrGrams: 10,
  diaHours: 4,
  targetRangeMmol: [4.0, 10.0],
  comorbidities: [],
  medications: ["Lantus", "Novorapid"],
};

const mkReadings = (values: number[]): { timestampUtc: string; glucoseMmol: number }[] =>
  values.map((v, i) => ({
    timestampUtc: new Date(Date.UTC(2026, 2, 1 + Math.floor(i / 6), (i % 6) * 4)).toISOString(),
    glucoseMmol: v,
  }));

const mkDoses = (
  basalCount: number,
  bolusCount: number,
  basalUnits: number = 22,
  bolusUnits: number = 6
): { timestampUtc: string; units: number; type: "basal" | "bolus" }[] => {
  const doses: any[] = [];
  for (let i = 0; i < basalCount; i++) {
    doses.push({
      timestampUtc: new Date(Date.UTC(2026, 2, 1 + i, 22)).toISOString(),
      units: basalUnits,
      type: "basal",
    });
  }
  for (let i = 0; i < bolusCount; i++) {
    doses.push({
      timestampUtc: new Date(Date.UTC(2026, 2, 1 + Math.floor(i / 3), 8 + (i % 3) * 5)).toISOString(),
      units: bolusUnits,
      type: "bolus",
    });
  }
  return doses;
};

const mkMeals = (count: number, carbs: number = 50): { timestampUtc: string; carbsGrams: number }[] =>
  Array.from({ length: count }, (_, i) => ({
    timestampUtc: new Date(Date.UTC(2026, 2, 1 + Math.floor(i / 3), 8 + (i % 3) * 5)).toISOString(),
    carbsGrams: carbs,
  }));

const baseData: ReportPeriodData = {
  startDate: "2026-03-01",
  endDate: "2026-03-15",
  glucoseReadings: mkReadings([6.5, 7.0, 5.5, 8.0, 6.0, 7.5, 6.8, 7.2, 5.8, 6.5, 7.0, 6.2, 8.5, 5.0, 6.5]),
  insulinDoses: mkDoses(14, 42),
  meals: mkMeals(42),
  hypoEvents: 2,
  hyperEvents: 3,
  dkaEvents: 0,
  hospitalizations: 0,
};

/* ── Report structure ────────────────────────────────────────── */
describe("generateClinicianSummary — structure", () => {
  it("generates a complete report", () => {
    const r = generateClinicianSummary(baseProfile, baseData);
    expect(r.reportTitle).toContain("GluMira");
    expect(r.generatedAt).toBeDefined();
    expect(r.disclaimer).toContain("educational platform");
  });

  it("includes patient demographics", () => {
    const r = generateClinicianSummary(baseProfile, baseData);
    expect(r.patient.name).toBe("Test Patient");
    expect(r.patient.age).toBe(35);
    expect(r.patient.diabetesType).toBe("type1");
    expect(r.patient.yearsSinceDiagnosis).toBe(16);
  });

  it("includes period info", () => {
    const r = generateClinicianSummary(baseProfile, baseData);
    expect(r.period.startDate).toBe("2026-03-01");
    expect(r.period.endDate).toBe("2026-03-15");
    expect(r.period.daysIncluded).toBe(14);
  });
});

/* ── Glucose metrics ─────────────────────────────────────────── */
describe("generateClinicianSummary — glucose", () => {
  it("calculates mean glucose", () => {
    const r = generateClinicianSummary(baseProfile, baseData);
    expect(r.glucoseMetrics.meanGlucose).toBeGreaterThan(0);
    expect(r.glucoseMetrics.meanGlucose).toBeLessThan(15);
  });

  it("calculates time in range", () => {
    const r = generateClinicianSummary(baseProfile, baseData);
    expect(r.glucoseMetrics.timeInRange).toBeGreaterThanOrEqual(0);
    expect(r.glucoseMetrics.timeInRange).toBeLessThanOrEqual(100);
  });

  it("TIR + TBR + TAR = 100%", () => {
    const r = generateClinicianSummary(baseProfile, baseData);
    const total = r.glucoseMetrics.timeInRange + r.glucoseMetrics.timeBelowRange + r.glucoseMetrics.timeAboveRange;
    expect(total).toBe(100);
  });

  it("estimates A1c from mean glucose", () => {
    const r = generateClinicianSummary(baseProfile, baseData);
    expect(r.glucoseMetrics.estimatedA1c).toBeGreaterThan(4);
    expect(r.glucoseMetrics.estimatedA1c).toBeLessThan(15);
  });

  it("calculates GMI", () => {
    const r = generateClinicianSummary(baseProfile, baseData);
    expect(r.glucoseMetrics.gmi).toBeGreaterThan(4);
    expect(r.glucoseMetrics.gmi).toBeLessThan(15);
  });

  it("calculates glucose CV", () => {
    const r = generateClinicianSummary(baseProfile, baseData);
    expect(r.glucoseMetrics.glucoseCV).toBeGreaterThanOrEqual(0);
  });

  it("calculates readings per day", () => {
    const r = generateClinicianSummary(baseProfile, baseData);
    expect(r.glucoseMetrics.readingsPerDay).toBeGreaterThan(0);
  });
});

/* ── Insulin metrics ─────────────────────────────────────────── */
describe("generateClinicianSummary — insulin", () => {
  it("calculates total daily dose", () => {
    const r = generateClinicianSummary(baseProfile, baseData);
    expect(r.insulinMetrics.totalDailyDose).toBeGreaterThan(0);
  });

  it("basal + bolus percentages = 100%", () => {
    const r = generateClinicianSummary(baseProfile, baseData);
    expect(r.insulinMetrics.basalPercentage + r.insulinMetrics.bolusPercentage).toBe(100);
  });

  it("calculates average bolus per meal", () => {
    const r = generateClinicianSummary(baseProfile, baseData);
    expect(r.insulinMetrics.avgBolusPerMeal).toBeGreaterThan(0);
  });

  it("calculates average carbs per day", () => {
    const r = generateClinicianSummary(baseProfile, baseData);
    expect(r.insulinMetrics.avgCarbsPerDay).toBeGreaterThan(0);
  });
});

/* ── Safety events ───────────────────────────────────────────── */
describe("generateClinicianSummary — safety", () => {
  it("tracks hypo events", () => {
    const r = generateClinicianSummary(baseProfile, baseData);
    expect(r.safetyEvents.hypoEvents).toBe(2);
  });

  it("calculates hypo frequency per week", () => {
    const r = generateClinicianSummary(baseProfile, baseData);
    expect(r.safetyEvents.hypoFrequencyPerWeek).toBeGreaterThan(0);
  });

  it("tracks DKA events", () => {
    const data: ReportPeriodData = { ...baseData, dkaEvents: 1 };
    const r = generateClinicianSummary(baseProfile, data);
    expect(r.safetyEvents.dkaEvents).toBe(1);
  });
});

/* ── Clinical flags ──────────────────────────────────────────── */
describe("generateClinicianSummary — flags", () => {
  it("flags low time in range", () => {
    // All readings high → low TIR
    const data: ReportPeriodData = {
      ...baseData,
      glucoseReadings: mkReadings([12.0, 13.0, 14.0, 15.0, 11.0, 12.5, 13.5, 14.5]),
    };
    const r = generateClinicianSummary(baseProfile, data);
    expect(r.clinicalFlags.some((f) => f.flag.includes("Time in range"))).toBe(true);
  });

  it("flags high time below range", () => {
    const data: ReportPeriodData = {
      ...baseData,
      glucoseReadings: mkReadings([3.0, 3.5, 3.2, 3.8, 6.0, 7.0, 3.1, 3.4, 3.6, 3.9]),
    };
    const r = generateClinicianSummary(baseProfile, data);
    expect(r.clinicalFlags.some((f) => f.flag.includes("below range"))).toBe(true);
  });

  it("flags DKA events as critical", () => {
    const data: ReportPeriodData = { ...baseData, dkaEvents: 2 };
    const r = generateClinicianSummary(baseProfile, data);
    const dkaFlag = r.clinicalFlags.find((f) => f.flag.includes("DKA"));
    expect(dkaFlag).toBeDefined();
    expect(dkaFlag!.severity).toBe("critical");
  });

  it("flags high A1c", () => {
    const data: ReportPeriodData = {
      ...baseData,
      glucoseReadings: mkReadings([12.0, 13.0, 11.0, 14.0, 12.5, 13.5]),
    };
    const r = generateClinicianSummary(baseProfile, data);
    expect(r.clinicalFlags.some((f) => f.flag.includes("A1c"))).toBe(true);
  });

  it("flags frequent hypos", () => {
    const data: ReportPeriodData = { ...baseData, hypoEvents: 10 };
    const r = generateClinicianSummary(baseProfile, data);
    expect(r.clinicalFlags.some((f) => f.flag.includes("hypoglycemia"))).toBe(true);
  });
});

/* ── Action items ────────────────────────────────────────────── */
describe("generateClinicianSummary — actions", () => {
  it("generates action items from critical flags", () => {
    const data: ReportPeriodData = { ...baseData, dkaEvents: 1 };
    const r = generateClinicianSummary(baseProfile, data);
    expect(r.actionItems.length).toBeGreaterThan(0);
  });

  it("provides routine follow-up when no issues", () => {
    // Good readings — enough per day to avoid low-monitoring flag (need ≥4/day over 14 days = 56+)
    const goodVals: number[] = [];
    for (let i = 0; i < 70; i++) goodVals.push(6.0 + (i % 5) * 0.3);
    const data: ReportPeriodData = {
      ...baseData,
      glucoseReadings: goodVals.map((v, i) => ({
        timestampUtc: new Date(Date.UTC(2026, 2, 1 + Math.floor(i / 5), (i % 5) * 4)).toISOString(),
        glucoseMmol: v,
      })),
      hypoEvents: 0,
      hyperEvents: 0,
    };
    const r = generateClinicianSummary(baseProfile, data);
    expect(r.actionItems.some((a) => a.includes("routine"))).toBe(true);
  });
});

/* ── Empty data handling ─────────────────────────────────────── */
describe("generateClinicianSummary — empty data", () => {
  it("handles zero readings gracefully", () => {
    const data: ReportPeriodData = {
      ...baseData,
      glucoseReadings: [],
      insulinDoses: [],
      meals: [],
    };
    const r = generateClinicianSummary(baseProfile, data);
    expect(r.glucoseMetrics.meanGlucose).toBe(0);
    expect(r.glucoseMetrics.timeInRange).toBe(0);
  });
});
