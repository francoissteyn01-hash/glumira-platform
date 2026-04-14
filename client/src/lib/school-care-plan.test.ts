/**
 * GluMira™ School Care Plan Generator — Test Suite
 * Version: 7.0.0
 * Module: MOD-SCHOOL
 */

import { describe, expect, it } from "vitest";
import {
  generateSchoolCarePlan,
  validateSchoolCarePlanInput,
  type SchoolCarePlanInput,
} from "./school-care-plan";

// ─── Fixtures ─────────────────────────────────────────────────

const BASE_INPUT: SchoolCarePlanInput = {
  patientFirstName: "Amara",
  patientLastName: "Nakamura",
  dateOfBirth: "2016-05-12",
  diabetesType: "type1",
  schoolName: "Springfield Primary School",
  teacherName: "Ms. Brandt",
  grade: "Grade 4",
  academicYear: "2026",
  insulinType: "Rapid-acting (NovoRapid)",
  insulinConcentration: "U-100",
  diaHours: 6,
  deliveryMethod: "pen",
  targetGlucoseMin: 70,
  targetGlucoseMax: 180,
  hypoThresholdMgdl: 70,
  hyperThresholdMgdl: 250,
  mealRegimeId: "pediatric-standard",
  emergencyContacts: [
    { name: "Keiko Nakamura", relationship: "Mother", phone: "+264 81 234 5678" },
    { name: "Taro Nakamura", relationship: "Father", phone: "+264 81 876 5432", altPhone: "+264 61 123 456" },
  ],
  clinicianName: "Dr. S. Visser",
  clinicianPhone: "+264 61 300 000",
  clinicianEmail: "svisser@gluclinic.na",
  planDate: "2026-03-25",
  reviewDate: "2026-09-25",
};

// ─── generateSchoolCarePlan ────────────────────────────────────

describe("generateSchoolCarePlan — output structure", () => {
  it("returns a result object with html, patientName, generatedAt, regimeName, hypoThresholdMgdl", () => {
    const result = generateSchoolCarePlan(BASE_INPUT);
    expect(result).toHaveProperty("html");
    expect(result).toHaveProperty("patientName");
    expect(result).toHaveProperty("generatedAt");
    expect(result).toHaveProperty("regimeName");
    expect(result).toHaveProperty("hypoThresholdMgdl");
  });

  it("patientName is correctly assembled", () => {
    const result = generateSchoolCarePlan(BASE_INPUT);
    expect(result.patientName).toBe("Amara Nakamura");
  });

  it("hypoThresholdMgdl matches input", () => {
    const result = generateSchoolCarePlan(BASE_INPUT);
    expect(result.hypoThresholdMgdl).toBe(70);
  });

  it("customHypoThresholdMgdl overrides default when provided", () => {
    const result = generateSchoolCarePlan({ ...BASE_INPUT, customHypoThresholdMgdl: 63 });
    expect(result.hypoThresholdMgdl).toBe(63);
  });

  it("generatedAt is a valid ISO string", () => {
    const result = generateSchoolCarePlan(BASE_INPUT);
    expect(() => new Date(result.generatedAt)).not.toThrow();
    expect(new Date(result.generatedAt).toISOString()).toBe(result.generatedAt);
  });
});

describe("generateSchoolCarePlan — HTML content", () => {
  it("HTML contains patient name", () => {
    const result = generateSchoolCarePlan(BASE_INPUT);
    expect(result.html).toContain("Amara Nakamura");
  });

  it("HTML contains school name", () => {
    const result = generateSchoolCarePlan(BASE_INPUT);
    expect(result.html).toContain("Springfield Primary School");
  });

  it("HTML contains hypo threshold value", () => {
    const result = generateSchoolCarePlan(BASE_INPUT);
    expect(result.html).toContain("70 mg/dL");
  });

  it("HTML contains hyper threshold value", () => {
    const result = generateSchoolCarePlan(BASE_INPUT);
    expect(result.html).toContain("250 mg/dL");
  });

  it("HTML contains emergency contact names", () => {
    const result = generateSchoolCarePlan(BASE_INPUT);
    expect(result.html).toContain("Keiko Nakamura");
    expect(result.html).toContain("Taro Nakamura");
  });

  it("HTML contains clinician name and phone", () => {
    const result = generateSchoolCarePlan(BASE_INPUT);
    expect(result.html).toContain("Dr. S. Visser");
    expect(result.html).toContain("+264 61 300 000");
  });

  it("HTML contains the 15-15 rule hypo protocol", () => {
    const result = generateSchoolCarePlan(BASE_INPUT);
    expect(result.html).toContain("15-15 Rule");
    expect(result.html).toContain("15g of fast-acting carbohydrates");
  });

  it("HTML contains teacher education section", () => {
    const result = generateSchoolCarePlan(BASE_INPUT);
    expect(result.html).toContain("Teacher");
    expect(result.html).toContain("Blood Glucose Monitoring");
  });

  it("HTML contains GluMira branding", () => {
    const result = generateSchoolCarePlan(BASE_INPUT);
    expect(result.html).toContain("GluMira");
    expect(result.html).toContain("IOB Hunter");
  });

  it("HTML contains disclaimer", () => {
    const result = generateSchoolCarePlan(BASE_INPUT);
    expect(result.html).toContain("educational platform");
  });

  it("HTML contains signature section", () => {
    const result = generateSchoolCarePlan(BASE_INPUT);
    expect(result.html).toContain("Authorisation");
    expect(result.html).toContain("Parent / Guardian");
  });

  it("HTML contains mmol/L conversion alongside mg/dL", () => {
    const result = generateSchoolCarePlan(BASE_INPUT);
    expect(result.html).toContain("mmol/L");
  });

  it("HTML contains print-ready CSS", () => {
    const result = generateSchoolCarePlan(BASE_INPUT);
    expect(result.html).toContain("@media print");
  });

  it("HTML is a complete document with DOCTYPE", () => {
    const result = generateSchoolCarePlan(BASE_INPUT);
    expect(result.html.trim()).toMatch(/^<!DOCTYPE html>/i);
    expect(result.html).toContain("</html>");
  });
});

describe("generateSchoolCarePlan — meal regime integration", () => {
  it("uses pediatric-standard regime for pediatric patients", () => {
    const result = generateSchoolCarePlan(BASE_INPUT);
    expect(result.regimeName.toLowerCase()).toContain("pediatric");
  });

  it("uses Ramadan regime when specified", () => {
    const result = generateSchoolCarePlan({ ...BASE_INPUT, mealRegimeId: "ramadan" });
    expect(result.regimeName).toContain("Ramadan");
    expect(result.html).toContain("Fasting");
  });

  it("uses standard-3meal regime when specified", () => {
    const result = generateSchoolCarePlan({ ...BASE_INPUT, mealRegimeId: "standard-3meal" });
    expect(result.regimeName.toLowerCase()).toContain("standard");
  });

  it("handles unknown regime ID gracefully (falls back to ID string)", () => {
    const result = generateSchoolCarePlan({ ...BASE_INPUT, mealRegimeId: "unknown-regime" });
    expect(result.regimeName).toBe("unknown-regime");
    expect(result.html).toBeDefined();
  });
});

describe("generateSchoolCarePlan — custom protocols", () => {
  it("uses customHypoProtocol when provided", () => {
    const result = generateSchoolCarePlan({
      ...BASE_INPUT,
      customHypoProtocol: "Give 1 tube of glucose gel immediately.",
    });
    expect(result.html).toContain("Give 1 tube of glucose gel immediately.");
    expect(result.html).not.toContain("15-15 Rule");
  });

  it("uses customHyperProtocol when provided", () => {
    const result = generateSchoolCarePlan({
      ...BASE_INPUT,
      customHyperProtocol: "Contact parents if glucose exceeds 300 mg/dL.",
    });
    expect(result.html).toContain("Contact parents if glucose exceeds 300 mg/dL.");
  });

  it("includes additionalNotes when provided", () => {
    const result = generateSchoolCarePlan({
      ...BASE_INPUT,
      additionalNotes: "Patient carries a glucagon kit in their backpack.",
    });
    expect(result.html).toContain("Patient carries a glucagon kit in their backpack.");
  });
});

describe("generateSchoolCarePlan — insulin delivery methods", () => {
  it("mentions pump connection requirement for pump users", () => {
    const result = generateSchoolCarePlan({ ...BASE_INPUT, deliveryMethod: "pump" });
    expect(result.html).toContain("pump must remain connected");
  });

  it("mentions pen administration for pen users", () => {
    const result = generateSchoolCarePlan({ ...BASE_INPUT, deliveryMethod: "pen" });
    expect(result.html).toContain("Insulin Pen");
  });

  it("mentions syringe for syringe users", () => {
    const result = generateSchoolCarePlan({ ...BASE_INPUT, deliveryMethod: "syringe" });
    expect(result.html).toContain("Insulin Syringe");
  });
});

describe("generateSchoolCarePlan — validation errors", () => {
  it("throws INVALID_INPUT when patient name is missing", () => {
    expect(() =>
      generateSchoolCarePlan({ ...BASE_INPUT, patientFirstName: "" })
    ).toThrow("INVALID_INPUT");
  });

  it("throws INVALID_INPUT when emergency contacts are empty", () => {
    expect(() =>
      generateSchoolCarePlan({ ...BASE_INPUT, emergencyContacts: [] })
    ).toThrow("INVALID_INPUT");
  });

  it("throws INVALID_INPUT when clinician name is missing", () => {
    expect(() =>
      generateSchoolCarePlan({ ...BASE_INPUT, clinicianName: "" })
    ).toThrow("INVALID_INPUT");
  });

  it("throws INVALID_INPUT when hypo >= hyper threshold", () => {
    expect(() =>
      generateSchoolCarePlan({ ...BASE_INPUT, hypoThresholdMgdl: 250, hyperThresholdMgdl: 250 })
    ).toThrow("INVALID_INPUT");
  });
});

// ─── validateSchoolCarePlanInput ──────────────────────────────

describe("validateSchoolCarePlanInput", () => {
  it("returns empty array for valid input", () => {
    const errors = validateSchoolCarePlanInput(BASE_INPUT);
    expect(errors).toHaveLength(0);
  });

  it("returns error for missing patientFirstName", () => {
    const errors = validateSchoolCarePlanInput({ ...BASE_INPUT, patientFirstName: undefined });
    expect(errors).toContain("patientFirstName is required");
  });

  it("returns error for missing schoolName", () => {
    const errors = validateSchoolCarePlanInput({ ...BASE_INPUT, schoolName: undefined });
    expect(errors).toContain("schoolName is required");
  });

  it("returns error for missing mealRegimeId", () => {
    const errors = validateSchoolCarePlanInput({ ...BASE_INPUT, mealRegimeId: undefined });
    expect(errors).toContain("mealRegimeId is required");
  });

  it("returns error for missing emergency contacts", () => {
    const errors = validateSchoolCarePlanInput({ ...BASE_INPUT, emergencyContacts: [] });
    expect(errors.some(e => e.includes("emergency contact"))).toBe(true);
  });

  it("returns error when hypo >= hyper threshold", () => {
    const errors = validateSchoolCarePlanInput({
      ...BASE_INPUT,
      hypoThresholdMgdl: 180,
      hyperThresholdMgdl: 180,
    });
    expect(errors.some(e => e.includes("hypoThresholdMgdl"))).toBe(true);
  });

  it("returns multiple errors for multiple missing fields", () => {
    const errors = validateSchoolCarePlanInput({});
    expect(errors.length).toBeGreaterThan(3);
  });
});
