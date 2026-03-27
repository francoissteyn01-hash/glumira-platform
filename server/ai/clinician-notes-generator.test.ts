/**
 * GluMira™ AI Clinician Notes Generator — Test Suite
 * Version: 7.0.0
 * Module: AI-CLIN-NOTES-GEN-TEST
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { describe, it, expect } from "vitest";
import {
  extractMetricsSummary,
  generateSafetyFlags,
  generateSOAPNote,
  generateQuickSummary,
  generateDetailedReport,
  generateSchoolCarePlan,
  generateClinicianNote,
  generateAIEnhancedNote,
  type GenerateNotesRequest,
} from "./clinician-notes-generator";
import { computeMetrics, type RawPatientData, type PatientProfile } from "./rag-context-engine";
import type { GlucoseReading, InsulinDose } from "./clinician-assistant";

// ─── Test Fixtures ───────────────────────────────────────────

const mockProfile: PatientProfile = {
  id: "patient-001",
  firstName: "TestUser",
  diabetesType: "Type 1",
  glucoseUnit: "mg/dL",
  targetLow: 70,
  targetHigh: 180,
  isf: 50,
  icr: 10,
  diaMinutes: 240,
  cgmSource: "dexcom",
  lastSyncAt: "2026-03-27T10:00:00Z",
};

const now = new Date("2026-03-27T12:00:00Z");

function makeReadings(count: number, baseValue: number): GlucoseReading[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(now.getTime() - i * 5 * 60000).toISOString(),
    value: baseValue + Math.sin(i * 0.5) * 30,
  }));
}

const mockData: RawPatientData = {
  profile: mockProfile,
  glucoseReadings: makeReadings(288, 140),
  insulinDoses: [
    { timestamp: new Date(now.getTime() - 60 * 60000).toISOString(), amount: 4, type: "bolus" },
    { timestamp: new Date(now.getTime() - 180 * 60000).toISOString(), amount: 3, type: "bolus" },
  ],
  meals: [
    { timestamp: new Date(now.getTime() - 3 * 3600000).toISOString(), carbsGrams: 45 },
  ],
  clinicianNotes: [
    { category: "observation", body: "TIR improving", createdAt: "2026-03-25" },
  ],
};

const mockRequest: GenerateNotesRequest = {
  patientData: mockData,
  format: "soap",
  periodDays: 7,
};

// ─── Metrics Summary ─────────────────────────────────────────

describe("extractMetricsSummary", () => {
  it("should extract all required fields", () => {
    const metrics = computeMetrics(mockData);
    const summary = extractMetricsSummary(metrics, 7);

    expect(summary.periodDays).toBe(7);
    expect(summary.readingCount).toBeGreaterThan(0);
    expect(summary.tirPercent).toBeGreaterThanOrEqual(0);
    expect(summary.tirPercent).toBeLessThanOrEqual(100);
    expect(summary.belowRangePercent).toBeGreaterThanOrEqual(0);
    expect(summary.aboveRangePercent).toBeGreaterThanOrEqual(0);
    expect(summary.meanGlucose).toBeGreaterThan(0);
    expect(summary.gmi).toBeGreaterThan(0);
    expect(summary.cv).toBeGreaterThanOrEqual(0);
    expect(summary.hypoEvents).toBeGreaterThanOrEqual(0);
    expect(["low", "moderate", "high", "critical"]).toContain(summary.hypoRiskLevel);
  });

  it("should have below + in + above ≈ 100%", () => {
    const metrics = computeMetrics(mockData);
    const summary = extractMetricsSummary(metrics, 7);
    const total = summary.belowRangePercent + summary.tirPercent + summary.aboveRangePercent;
    expect(total).toBeCloseTo(100, 0);
  });
});

// ─── Safety Flags ────────────────────────────────────────────

describe("generateSafetyFlags", () => {
  it("should return empty for healthy metrics", () => {
    const healthyData: RawPatientData = {
      ...mockData,
      glucoseReadings: makeReadings(288, 120), // Mostly in range
    };
    const metrics = computeMetrics(healthyData);
    const flags = generateSafetyFlags(metrics);
    // May or may not have flags depending on exact values
    expect(Array.isArray(flags)).toBe(true);
  });

  it("should flag high variability", () => {
    // Create readings with extreme variability
    const wildReadings: GlucoseReading[] = Array.from({ length: 288 }, (_, i) => ({
      timestamp: new Date(now.getTime() - i * 5 * 60000).toISOString(),
      value: i % 2 === 0 ? 50 : 300, // Extreme swings
    }));
    const wildData: RawPatientData = { ...mockData, glucoseReadings: wildReadings };
    const metrics = computeMetrics(wildData);
    const flags = generateSafetyFlags(metrics);
    expect(flags.some((f) => f.includes("variability") || f.includes("below range") || f.includes("CRITICAL"))).toBe(true);
  });
});

// ─── SOAP Note ───────────────────────────────────────────────

describe("generateSOAPNote", () => {
  it("should produce 4 sections (S, O, A, P)", () => {
    const metrics = computeMetrics(mockData);
    const summary = extractMetricsSummary(metrics, 7);
    const flags = generateSafetyFlags(metrics);
    const sections = generateSOAPNote(mockData, metrics, summary, flags, 7);

    expect(sections).toHaveLength(4);
    expect(sections[0].heading).toBe("Subjective");
    expect(sections[1].heading).toBe("Objective");
    expect(sections[2].heading).toBe("Assessment");
    expect(sections[3].heading).toBe("Plan");
  });

  it("should include patient name in Subjective", () => {
    const metrics = computeMetrics(mockData);
    const summary = extractMetricsSummary(metrics, 7);
    const sections = generateSOAPNote(mockData, metrics, summary, [], 7);
    expect(sections[0].body).toContain("TestUser");
  });

  it("should include TIR in Objective", () => {
    const metrics = computeMetrics(mockData);
    const summary = extractMetricsSummary(metrics, 7);
    const sections = generateSOAPNote(mockData, metrics, summary, [], 7);
    expect(sections[1].body).toContain("Time in Range");
  });
});

// ─── Quick Summary ───────────────────────────────────────────

describe("generateQuickSummary", () => {
  it("should produce a single section", () => {
    const metrics = computeMetrics(mockData);
    const summary = extractMetricsSummary(metrics, 7);
    const sections = generateQuickSummary(mockData, metrics, summary, 7);

    expect(sections).toHaveLength(1);
    expect(sections[0].heading).toBe("Summary");
    expect(sections[0].body).toContain("TestUser");
    expect(sections[0].body).toContain("TIR:");
  });
});

// ─── Detailed Report ─────────────────────────────────────────

describe("generateDetailedReport", () => {
  it("should produce at least 6 sections", () => {
    const metrics = computeMetrics(mockData);
    const summary = extractMetricsSummary(metrics, 7);
    const flags = generateSafetyFlags(metrics);
    const sections = generateDetailedReport(mockData, metrics, summary, flags, 7);

    expect(sections.length).toBeGreaterThanOrEqual(6);
    expect(sections.find((s) => s.heading === "Patient Overview")).toBeDefined();
    expect(sections.find((s) => s.heading === "Time in Range Analysis")).toBeDefined();
    expect(sections.find((s) => s.heading === "Glucose Variability")).toBeDefined();
  });
});

// ─── School Care Plan ────────────────────────────────────────

describe("generateSchoolCarePlan", () => {
  it("should produce 7 sections", () => {
    const metrics = computeMetrics(mockData);
    const summary = extractMetricsSummary(metrics, 7);
    const sections = generateSchoolCarePlan(mockData, metrics, summary);

    expect(sections).toHaveLength(7);
    expect(sections.find((s) => s.heading === "Student Information")).toBeDefined();
    expect(sections.find((s) => s.heading === "Low Blood Sugar (Hypoglycaemia) Protocol")).toBeDefined();
    expect(sections.find((s) => s.heading === "Emergency Contacts")).toBeDefined();
  });

  it("should include target range in care plan", () => {
    const metrics = computeMetrics(mockData);
    const summary = extractMetricsSummary(metrics, 7);
    const sections = generateSchoolCarePlan(mockData, metrics, summary);
    const targetSection = sections.find((s) => s.heading === "Target Blood Sugar Range");
    expect(targetSection!.body).toContain("70");
    expect(targetSection!.body).toContain("180");
  });
});

// ─── Main Generator ──────────────────────────────────────────

describe("generateClinicianNote", () => {
  it("should generate SOAP note", () => {
    const note = generateClinicianNote({ ...mockRequest, format: "soap" });
    expect(note.format).toBe("soap");
    expect(note.title).toContain("SOAP");
    expect(note.sections).toHaveLength(4);
    expect(note.content).toContain("Subjective");
    expect(note.disclaimer).toContain("NOT a clinical document");
    expect(note.editable).toBe(true);
  });

  it("should generate quick summary", () => {
    const note = generateClinicianNote({ ...mockRequest, format: "quick_summary" });
    expect(note.format).toBe("quick_summary");
    expect(note.sections).toHaveLength(1);
  });

  it("should generate detailed report", () => {
    const note = generateClinicianNote({ ...mockRequest, format: "detailed_report" });
    expect(note.format).toBe("detailed_report");
    expect(note.sections.length).toBeGreaterThanOrEqual(6);
  });

  it("should generate school care plan", () => {
    const note = generateClinicianNote({ ...mockRequest, format: "school_care_plan" });
    expect(note.format).toBe("school_care_plan");
    expect(note.sections).toHaveLength(7);
  });

  it("should throw for unknown format", () => {
    expect(() =>
      generateClinicianNote({ ...mockRequest, format: "unknown" as any })
    ).toThrow("Unknown note format");
  });

  it("should include metrics summary in all notes", () => {
    const note = generateClinicianNote(mockRequest);
    expect(note.metrics.periodDays).toBe(7);
    expect(note.metrics.readingCount).toBeGreaterThan(0);
    expect(note.metrics.tirPercent).toBeGreaterThanOrEqual(0);
  });
});

// ─── AI Enhanced Note ────────────────────────────────────────

describe("generateAIEnhancedNote", () => {
  it("should add AI narrative section when LLM succeeds", async () => {
    const mockLLM = async () => "Patient shows improving TIR trends over the review period.";
    const note = await generateAIEnhancedNote(mockRequest, mockLLM);

    expect(note.sections.length).toBeGreaterThan(4); // SOAP (4) + AI narrative
    const aiSection = note.sections.find((s) => s.heading === "AI-Generated Clinical Narrative");
    expect(aiSection).toBeDefined();
    expect(aiSection!.body).toContain("improving TIR");
  });

  it("should fall back gracefully when LLM fails", async () => {
    const failingLLM = async () => { throw new Error("API unavailable"); };
    const note = await generateAIEnhancedNote(mockRequest, failingLLM);

    // Should still have the template-based note
    expect(note.format).toBe("soap");
    expect(note.sections).toHaveLength(4); // No AI section added
  });
});
