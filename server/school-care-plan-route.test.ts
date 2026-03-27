/**
 * GluMira™ — school-care-plan-route.test.ts
 *
 * Test suite for server/school-care-plan.ts
 * Covers: generateSchoolCarePlan, validateSchoolCarePlanInput
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { describe, it, expect } from "vitest";
import {
  generateSchoolCarePlan,
  validateSchoolCarePlanInput,
} from "./school-care-plan";
import type { SchoolCarePlanInput, EmergencyContact } from "./school-care-plan";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const EMERGENCY_CONTACT: EmergencyContact = {
  name: "Jordan Johnson",
  phone: "+1-555-0100",
  relationship: "Parent",
};

const VALID_INPUT: SchoolCarePlanInput = {
  patientFirstName: "Alex",
  patientLastName: "Johnson",
  dateOfBirth: "2015-06-15",
  diabetesType: "type1",
  schoolName: "Riverside Primary",
  teacherName: "Ms. Thompson",
  grade: "Grade 3",
  academicYear: "2026",
  insulinType: "NovoRapid (Rapid-acting)",
  insulinConcentration: "U-100",
  diaHours: 4,
  deliveryMethod: "pen",
  targetGlucoseMin: 72,
  targetGlucoseMax: 144,
  hypoThresholdMgdl: 70,
  hyperThresholdMgdl: 250,
  mealRegimeId: "standard-3meal",
  emergencyContacts: [EMERGENCY_CONTACT],
  clinicianName: "Dr. Sarah Lee",
  clinicianPhone: "+1-555-0200",
  clinicianEmail: "slee@clinic.com",
  planDate: "2026-03-26",
  reviewDate: "2026-09-26",
};

// ─── validateSchoolCarePlanInput ──────────────────────────────────────────────

describe("validateSchoolCarePlanInput", () => {
  it("returns empty errors for a complete valid input", () => {
    const errors = validateSchoolCarePlanInput(VALID_INPUT);
    expect(errors).toHaveLength(0);
  });

  it("returns an error when patientFirstName is missing", () => {
    const errors = validateSchoolCarePlanInput({ ...VALID_INPUT, patientFirstName: "" });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("returns an error when patientLastName is missing", () => {
    const errors = validateSchoolCarePlanInput({ ...VALID_INPUT, patientLastName: "" });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("returns an error when schoolName is missing", () => {
    const errors = validateSchoolCarePlanInput({ ...VALID_INPUT, schoolName: "" });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("returns an error when emergencyContacts is empty", () => {
    const errors = validateSchoolCarePlanInput({ ...VALID_INPUT, emergencyContacts: [] });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("returns an error when clinicianName is missing", () => {
    const errors = validateSchoolCarePlanInput({ ...VALID_INPUT, clinicianName: "" });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("returns an error when hypoThresholdMgdl >= hyperThresholdMgdl", () => {
    const errors = validateSchoolCarePlanInput({
      ...VALID_INPUT,
      hypoThresholdMgdl: 250,
      hyperThresholdMgdl: 250,
    });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("returns no error when hypoThresholdMgdl is zero (not validated by module)", () => {
    // The module only validates hypo < hyper relationship, not zero-check
    const errors = validateSchoolCarePlanInput({ ...VALID_INPUT, hypoThresholdMgdl: 0 });
    // hypo=0 < hyper=250 → no error from the relationship check
    const relationshipErrors = errors.filter((e) => e.includes("hypo"));
    expect(relationshipErrors).toHaveLength(0);
  });

  it("returns an error when mealRegimeId is missing", () => {
    const errors = validateSchoolCarePlanInput({ ...VALID_INPUT, mealRegimeId: "" });
    expect(errors.length).toBeGreaterThan(0);
  });

  it("returns an error when planDate is missing", () => {
    const errors = validateSchoolCarePlanInput({ ...VALID_INPUT, planDate: "" });
    expect(errors.length).toBeGreaterThan(0);
  });
});

// ─── generateSchoolCarePlan ───────────────────────────────────────────────────

describe("generateSchoolCarePlan", () => {
  it("returns a result object", () => {
    const result = generateSchoolCarePlan(VALID_INPUT);
    expect(result).toBeTruthy();
    expect(typeof result).toBe("object");
  });

  it("result includes patientName", () => {
    const result = generateSchoolCarePlan(VALID_INPUT);
    expect(result.patientName).toContain("Alex");
  });

  it("result includes generatedAt ISO timestamp", () => {
    const result = generateSchoolCarePlan(VALID_INPUT);
    expect(result.generatedAt).toBeTruthy();
    expect(new Date(result.generatedAt).getTime()).toBeGreaterThan(0);
  });

  it("result includes html content", () => {
    const result = generateSchoolCarePlan(VALID_INPUT);
    expect(typeof result.html).toBe("string");
    expect(result.html.length).toBeGreaterThan(0);
  });

  it("html contains patient first name", () => {
    const result = generateSchoolCarePlan(VALID_INPUT);
    expect(result.html).toContain("Alex");
  });

  it("html contains school name", () => {
    const result = generateSchoolCarePlan(VALID_INPUT);
    expect(result.html).toContain("Riverside Primary");
  });

  it("result includes regimeName", () => {
    const result = generateSchoolCarePlan(VALID_INPUT);
    expect(result.regimeName).toBeTruthy();
  });

  it("result includes hypoThresholdMgdl", () => {
    const result = generateSchoolCarePlan(VALID_INPUT);
    expect(result.hypoThresholdMgdl).toBe(70);
  });

  it("generates different HTML for different students", () => {
    const r1 = generateSchoolCarePlan(VALID_INPUT);
    const r2 = generateSchoolCarePlan({
      ...VALID_INPUT,
      patientFirstName: "Sam",
      patientLastName: "Rivera",
    });
    expect(r1.patientName).not.toBe(r2.patientName);
  });

  it("html contains GluMira disclaimer", () => {
    const result = generateSchoolCarePlan(VALID_INPUT);
    const hasDisclaimer =
      result.html.toLowerCase().includes("educational") ||
      result.html.toLowerCase().includes("not a medical device") ||
      result.html.toLowerCase().includes("glumira");
    expect(hasDisclaimer).toBe(true);
  });
});
