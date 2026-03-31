/**
 * GluMira™ RAG Context-Injection Engine — Test Suite
 * Version: 7.0.0
 * Module: AI-RAG-CTX-TEST
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { describe, it, expect } from "vitest";
import {
  calculateActiveIOB,
  determineGlucoseTrend,
  computeMetrics,
  buildPatientSummary,
  buildAnalyticsBlock,
  buildClinicianNotesBlock,
  assembleContext,
  buildRAGMessages,
  type PatientProfile,
  type RawPatientData,
  type ClinicianNoteSnippet,
} from "./rag-context-engine";
import type { GlucoseReading, InsulinDose, MealEntry } from "./clinician-assistant";

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

function makeReadings(count: number, baseValue: number, baseTime: Date): GlucoseReading[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(baseTime.getTime() - i * 5 * 60000).toISOString(),
    value: baseValue + Math.sin(i * 0.5) * 30,
  }));
}

function makeDoses(count: number, baseTime: Date): InsulinDose[] {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(baseTime.getTime() - i * 120 * 60000).toISOString(),
    amount: 3 + (i % 3),
    type: "bolus" as const,
    insulinName: "NovoRapid",
  }));
}

const mockNotes: ClinicianNoteSnippet[] = [
  { category: "observation", body: "TIR improving over last 2 weeks", createdAt: "2026-03-25" },
  { category: "adjustment", body: "Consider reducing breakfast ICR from 1:10 to 1:12", createdAt: "2026-03-20" },
];

const now = new Date("2026-03-27T12:00:00Z");

const mockData: RawPatientData = {
  profile: mockProfile,
  glucoseReadings: makeReadings(288, 140, now), // 24h of 5-min readings
  insulinDoses: makeDoses(4, now),
  meals: [
    { timestamp: new Date(now.getTime() - 3 * 3600000).toISOString(), carbsGrams: 45 },
    { timestamp: new Date(now.getTime() - 8 * 3600000).toISOString(), carbsGrams: 30 },
  ],
  clinicianNotes: mockNotes,
};

// ─── IOB Calculation ─────────────────────────────────────────

describe("calculateActiveIOB", () => {
  it("should return 0 for empty doses", () => {
    expect(calculateActiveIOB([], 240, now)).toBe(0);
  });

  it("should return 0 for DIA <= 0", () => {
    expect(calculateActiveIOB(makeDoses(1, now), 0, now)).toBe(0);
  });

  it("should return full dose amount for dose just administered", () => {
    const dose: InsulinDose = {
      timestamp: now.toISOString(),
      amount: 5,
      type: "bolus",
    };
    const iob = calculateActiveIOB([dose], 240, now);
    expect(iob).toBeCloseTo(5, 0); // Should be ~5 units (just injected)
  });

  it("should return 0 for dose older than DIA", () => {
    const oldDose: InsulinDose = {
      timestamp: new Date(now.getTime() - 300 * 60000).toISOString(), // 5 hours ago
      amount: 5,
      type: "bolus",
    };
    const iob = calculateActiveIOB([oldDose], 240, now);
    expect(iob).toBe(0);
  });

  it("should return partial IOB for dose at halfway through DIA", () => {
    const halfwayDose: InsulinDose = {
      timestamp: new Date(now.getTime() - 120 * 60000).toISOString(), // 2 hours ago (half of 4h DIA)
      amount: 10,
      type: "bolus",
    };
    const iob = calculateActiveIOB([halfwayDose], 240, now);
    expect(iob).toBeGreaterThan(0);
    expect(iob).toBeLessThan(10);
  });

  it("should ignore basal doses", () => {
    const basalDose: InsulinDose = {
      timestamp: now.toISOString(),
      amount: 20,
      type: "basal",
    };
    const iob = calculateActiveIOB([basalDose], 240, now);
    expect(iob).toBe(0);
  });

  it("should sum IOB from multiple active doses", () => {
    const doses: InsulinDose[] = [
      { timestamp: now.toISOString(), amount: 3, type: "bolus" },
      { timestamp: new Date(now.getTime() - 60 * 60000).toISOString(), amount: 4, type: "bolus" },
    ];
    const iob = calculateActiveIOB(doses, 240, now);
    expect(iob).toBeGreaterThan(3); // At least the fresh dose
    expect(iob).toBeLessThan(7); // Less than total (second dose partially decayed)
  });
});

// ─── Glucose Trend ───────────────────────────────────────────

describe("determineGlucoseTrend", () => {
  it("should return insufficient_data for < 3 readings", () => {
    expect(determineGlucoseTrend([])).toBe("insufficient_data");
    expect(determineGlucoseTrend([{ timestamp: now.toISOString(), value: 120 }])).toBe("insufficient_data");
  });

  it("should detect stable trend", () => {
    const readings: GlucoseReading[] = [
      { timestamp: new Date(now.getTime() - 0).toISOString(), value: 120 },
      { timestamp: new Date(now.getTime() - 300000).toISOString(), value: 118 },
      { timestamp: new Date(now.getTime() - 600000).toISOString(), value: 121 },
    ];
    expect(determineGlucoseTrend(readings)).toBe("stable");
  });

  it("should detect rising trend", () => {
    const readings: GlucoseReading[] = [
      { timestamp: new Date(now.getTime() - 0).toISOString(), value: 160 },
      { timestamp: new Date(now.getTime() - 300000).toISOString(), value: 150 },
      { timestamp: new Date(now.getTime() - 600000).toISOString(), value: 140 },
    ];
    expect(determineGlucoseTrend(readings)).toBe("rising");
  });

  it("should detect falling_fast trend", () => {
    const readings: GlucoseReading[] = [
      { timestamp: new Date(now.getTime() - 0).toISOString(), value: 80 },
      { timestamp: new Date(now.getTime() - 300000).toISOString(), value: 100 },
      { timestamp: new Date(now.getTime() - 600000).toISOString(), value: 120 },
    ];
    expect(determineGlucoseTrend(readings)).toBe("falling_fast");
  });

  it("should detect rising_fast trend", () => {
    const readings: GlucoseReading[] = [
      { timestamp: new Date(now.getTime() - 0).toISOString(), value: 200 },
      { timestamp: new Date(now.getTime() - 300000).toISOString(), value: 175 },
      { timestamp: new Date(now.getTime() - 600000).toISOString(), value: 150 },
    ];
    expect(determineGlucoseTrend(readings)).toBe("rising_fast");
  });
});

// ─── Compute Metrics ─────────────────────────────────────────

describe("computeMetrics", () => {
  it("should compute all metrics from raw data", () => {
    const metrics = computeMetrics(mockData);

    expect(metrics.tir).toBeDefined();
    expect(metrics.tir.inRange).toBeGreaterThanOrEqual(0);
    expect(metrics.tir.inRange).toBeLessThanOrEqual(100);

    expect(metrics.variability).toBeDefined();
    expect(metrics.variability.cv).toBeGreaterThanOrEqual(0);

    expect(metrics.hypoRisk).toBeDefined();
    expect(metrics.hypoRisk.score).toBeGreaterThanOrEqual(0);
    expect(metrics.hypoRisk.score).toBeLessThanOrEqual(100);

    expect(metrics.currentGlucose).not.toBeNull();
    expect(metrics.glucoseTrend).toBeDefined();
    expect(metrics.activeIOB).toBeGreaterThanOrEqual(0);
    expect(metrics.readingCount24h).toBeGreaterThan(0);
  });

  it("should handle empty readings gracefully", () => {
    const emptyData: RawPatientData = {
      ...mockData,
      glucoseReadings: [],
      insulinDoses: [],
      meals: [],
    };
    const metrics = computeMetrics(emptyData);
    expect(metrics.currentGlucose).toBeNull();
    expect(metrics.activeIOB).toBe(0);
    expect(metrics.readingCount24h).toBe(0);
  });
});

// ─── Context Blocks ──────────────────────────────────────────

describe("buildPatientSummary", () => {
  it("should include patient profile fields", () => {
    const metrics = computeMetrics(mockData);
    const summary = buildPatientSummary(mockProfile, metrics);

    expect(summary).toContain("TestUser");
    expect(summary).toContain("Type 1");
    expect(summary).toContain("mg/dL");
    expect(summary).toContain("70");
    expect(summary).toContain("180");
    expect(summary).toContain("ISF: 50");
    expect(summary).toContain("ICR: 1:10");
    expect(summary).toContain("DIA: 240");
    expect(summary).toContain("dexcom");
  });

  it("should include current glucose when available", () => {
    const metrics = computeMetrics(mockData);
    const summary = buildPatientSummary(mockProfile, metrics);
    expect(summary).toContain("Current Glucose:");
    expect(summary).toContain("Active IOB:");
  });
});

describe("buildAnalyticsBlock", () => {
  it("should include all TIR and variability metrics", () => {
    const metrics = computeMetrics(mockData);
    const block = buildAnalyticsBlock(metrics);

    expect(block).toContain("Time in Range:");
    expect(block).toContain("Time Below Range:");
    expect(block).toContain("Time Above Range:");
    expect(block).toContain("Mean Glucose:");
    expect(block).toContain("GMI");
    expect(block).toContain("Coefficient of Variation:");
    expect(block).toContain("Hypo Risk Score:");
  });
});

describe("buildClinicianNotesBlock", () => {
  it("should format notes with categories", () => {
    const block = buildClinicianNotesBlock(mockNotes);
    expect(block).toContain("OBSERVATION");
    expect(block).toContain("ADJUSTMENT");
    expect(block).toContain("TIR improving");
    expect(block).toContain("2 active");
  });

  it("should handle empty notes", () => {
    const block = buildClinicianNotesBlock([]);
    expect(block).toContain("None on file");
  });
});

// ─── Full Assembly ───────────────────────────────────────────

describe("assembleContext", () => {
  it("should produce a complete context with all blocks", () => {
    const ctx = assembleContext(mockData);

    expect(ctx.systemPreamble).toContain("GluMira™ AI");
    expect(ctx.patientSummary).toContain("TestUser");
    expect(ctx.analyticsBlock).toContain("Time in Range:");
    expect(ctx.clinicianNotesBlock).toContain("OBSERVATION");
    expect(ctx.safetyBlock).toContain("NEVER suggest specific insulin doses");
    expect(ctx.fullContext).toContain("LIVE PATIENT DATA");
    expect(ctx.fullContext).toContain("Disclaimer");
    expect(ctx.tokenEstimate).toBeGreaterThan(0);
    expect(ctx.metrics).toBeDefined();
  });

  it("should keep token estimate under 2000 for typical patient", () => {
    const ctx = assembleContext(mockData);
    // Context should be compact enough to leave room for conversation
    expect(ctx.tokenEstimate).toBeLessThan(2000);
  });
});

// ─── RAG Messages ────────────────────────────────────────────

describe("buildRAGMessages", () => {
  it("should build messages with system context + user message", () => {
    const ctx = assembleContext(mockData);
    const messages = buildRAGMessages(ctx, "What is my current TIR?");

    expect(messages).toHaveLength(2);
    expect(messages[0].role).toBe("system");
    expect(messages[0].content).toContain("GluMira™ AI");
    expect(messages[1].role).toBe("user");
    expect(messages[1].content).toBe("What is my current TIR?");
  });

  it("should include chat history between system and user", () => {
    const ctx = assembleContext(mockData);
    const history = [
      { role: "user" as const, content: "Hello" },
      { role: "assistant" as const, content: "Hi! How can I help?" },
    ];
    const messages = buildRAGMessages(ctx, "What is IOB?", history);

    expect(messages).toHaveLength(4); // system + 2 history + user
    expect(messages[1].role).toBe("user");
    expect(messages[1].content).toBe("Hello");
    expect(messages[2].role).toBe("assistant");
    expect(messages[3].role).toBe("user");
    expect(messages[3].content).toBe("What is IOB?");
  });

  it("should limit chat history to 10 turns", () => {
    const ctx = assembleContext(mockData);
    const longHistory = Array.from({ length: 20 }, (_, i) => ({
      role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
      content: `Message ${i}`,
    }));
    const messages = buildRAGMessages(ctx, "Latest question", longHistory);

    // system + 10 history + user = 12
    expect(messages).toHaveLength(12);
  });
});
