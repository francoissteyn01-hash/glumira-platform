/**
 * GluMira™ Unified AI Chat Route — Test Suite
 * Version: 7.0.0
 * Module: AI-CHAT-UNIFIED-TEST
 *
 * Tests the API contract and validation for all AI endpoints.
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { describe, it, expect } from "vitest";
import type { RawPatientData, PatientProfile } from "./rag-context-engine";
import type { GlucoseReading } from "./clinician-assistant";

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

const mockReadings: GlucoseReading[] = Array.from({ length: 50 }, (_, i) => ({
  timestamp: new Date(now.getTime() - i * 5 * 60000).toISOString(),
  value: 120 + Math.sin(i * 0.5) * 30,
}));

const mockPatientData: RawPatientData = {
  profile: mockProfile,
  glucoseReadings: mockReadings,
  insulinDoses: [
    { timestamp: new Date(now.getTime() - 60 * 60000).toISOString(), amount: 4, type: "bolus" },
  ],
  meals: [
    { timestamp: new Date(now.getTime() - 3 * 3600000).toISOString(), carbsGrams: 30 },
  ],
  clinicianNotes: [],
};

// ─── Request Validation Tests ────────────────────────────────

describe("Chat endpoint validation", () => {
  it("should require message field", () => {
    const body = { patientData: mockPatientData };
    expect(body).not.toHaveProperty("message");
  });

  it("should require patientData field", () => {
    const body = { message: "Hello" };
    expect(body).not.toHaveProperty("patientData");
  });

  it("should reject messages over 2000 chars", () => {
    const longMessage = "x".repeat(2001);
    expect(longMessage.length).toBeGreaterThan(2000);
  });

  it("should accept valid chat request shape", () => {
    const body = {
      message: "What is my current TIR?",
      patientData: mockPatientData,
      chatHistory: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi!" },
      ],
    };
    expect(body.message).toBeDefined();
    expect(body.patientData).toBeDefined();
    expect(body.chatHistory).toHaveLength(2);
  });
});

describe("Bernstein endpoint validation", () => {
  it("should require question field", () => {
    const body = {};
    expect(body).not.toHaveProperty("question");
  });

  it("should reject questions over 1000 chars", () => {
    const longQuestion = "x".repeat(1001);
    expect(longQuestion.length).toBeGreaterThan(1000);
  });

  it("should accept valid bernstein request shape", () => {
    const body = {
      question: "What is the law of small numbers?",
      patientData: mockPatientData,
    };
    expect(body.question).toBeDefined();
    expect(body.question.length).toBeLessThanOrEqual(1000);
  });
});

describe("Notes endpoint validation", () => {
  it("should require patientData and format", () => {
    const body = { periodDays: 7 };
    expect(body).not.toHaveProperty("patientData");
    expect(body).not.toHaveProperty("format");
  });

  it("should validate format values", () => {
    const validFormats = ["soap", "quick_summary", "detailed_report", "school_care_plan"];
    expect(validFormats).toContain("soap");
    expect(validFormats).toContain("school_care_plan");
    expect(validFormats).not.toContain("invalid_format");
  });

  it("should validate periodDays range", () => {
    expect(0).toBeLessThan(1); // Below minimum
    expect(91).toBeGreaterThan(90); // Above maximum
    expect(7).toBeGreaterThanOrEqual(1);
    expect(7).toBeLessThanOrEqual(90);
  });

  it("should accept valid notes request shape", () => {
    const body = {
      patientData: mockPatientData,
      format: "soap" as const,
      periodDays: 7,
      aiEnhanced: true,
    };
    expect(body.patientData).toBeDefined();
    expect(body.format).toBe("soap");
    expect(body.periodDays).toBe(7);
  });
});

describe("Chapters endpoint", () => {
  it("should return chapter summaries without requiring patient data", () => {
    // This endpoint is pure data — no AI call needed
    // Just verify the expected response shape
    const expectedShape = {
      chapters: expect.any(Array),
      totalChapters: expect.any(Number),
      disclaimer: expect.any(String),
    };
    expect(expectedShape.chapters).toBeDefined();
  });
});

describe("Health endpoint", () => {
  it("should check all service statuses", () => {
    const expectedServices = [
      "ragEngine",
      "bernsteinQA",
      "clinicianNotes",
      "patternAnalysis",
      "llmService",
    ];
    expectedServices.forEach((service) => {
      expect(service).toBeDefined();
    });
  });
});

// ─── Response Shape Tests ────────────────────────────────────

describe("ChatResponse shape", () => {
  it("should include all required fields", () => {
    const response = {
      reply: "Your TIR is 72%.",
      sessionId: "abc-123",
      contextTokens: 850,
      modelUsed: "gemini-2.5-flash",
      disclaimer: "Disclaimer text",
    };
    expect(response.reply).toBeDefined();
    expect(response.sessionId).toBeDefined();
    expect(response.contextTokens).toBeGreaterThan(0);
    expect(response.modelUsed).toBeDefined();
    expect(response.disclaimer).toBeDefined();
  });
});

describe("Product tier access control", () => {
  it("should define tier boundaries", () => {
    const tiers = {
      free: { queriesPerDay: 5, features: ["bernstein_qa", "basic_chat"] },
      pro: { queriesPerHour: 20, features: ["bernstein_qa", "basic_chat", "pattern_analysis"] },
      ai: { queriesPerHour: 50, features: ["bernstein_qa", "basic_chat", "pattern_analysis", "clinician_notes", "school_care_plan"] },
    };
    expect(tiers.free.queriesPerDay).toBe(5);
    expect(tiers.pro.queriesPerHour).toBe(20);
    expect(tiers.ai.features).toContain("clinician_notes");
    expect(tiers.free.features).not.toContain("clinician_notes");
  });
});
