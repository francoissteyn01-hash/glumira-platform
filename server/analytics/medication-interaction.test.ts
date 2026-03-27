/**
 * GluMira™ — Medication Interaction Test Suite
 *
 * Tests medication lookup, interaction checking, severity colours,
 * effect labels, and full report generation.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { describe, it, expect } from "vitest";
import {
  lookupMedication,
  checkInteraction,
  severityColour,
  effectLabel,
  generateInteractionReport,
  MEDICATION_DB,
} from "./medication-interaction";

// ─── MEDICATION_DB ───────────────────────────────────────────────────────────

describe("MEDICATION_DB", () => {
  it("contains at least 10 entries", () => {
    expect(MEDICATION_DB.length).toBeGreaterThanOrEqual(10);
  });

  it("every entry has required fields", () => {
    for (const m of MEDICATION_DB) {
      expect(m.name).toBeTruthy();
      expect(m.category).toBeTruthy();
      expect(["raises", "lowers", "variable", "none"]).toContain(m.glucoseEffect);
      expect(["high", "moderate", "low", "info"]).toContain(m.severity);
      expect(m.mechanism).toBeTruthy();
      expect(m.notes).toBeTruthy();
    }
  });

  it("has unique medication names", () => {
    const names = MEDICATION_DB.map((m) => m.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

// ─── lookupMedication ────────────────────────────────────────────────────────

describe("lookupMedication", () => {
  it("finds prednisone", () => {
    const result = lookupMedication("prednisone");
    expect(result).not.toBeNull();
    expect(result!.category).toBe("corticosteroid");
  });

  it("is case-insensitive", () => {
    expect(lookupMedication("Prednisone")).not.toBeNull();
    expect(lookupMedication("PREDNISONE")).not.toBeNull();
  });

  it("trims whitespace", () => {
    expect(lookupMedication("  prednisone  ")).not.toBeNull();
  });

  it("returns null for unknown medication", () => {
    expect(lookupMedication("unknownmed123")).toBeNull();
  });
});

// ─── checkInteraction ────────────────────────────────────────────────────────

describe("checkInteraction", () => {
  it("returns matched=true for known medication", () => {
    const result = checkInteraction("prednisone");
    expect(result.matched).toBe(true);
    expect(result.entry).not.toBeNull();
    expect(result.warning).toContain("HIGH");
  });

  it("returns matched=false for unknown medication", () => {
    const result = checkInteraction("unknownmed");
    expect(result.matched).toBe(false);
    expect(result.entry).toBeNull();
    expect(result.warning).toBeNull();
  });

  it("generates MODERATE warning for beta-blockers", () => {
    const result = checkInteraction("atenolol");
    expect(result.warning).toContain("MODERATE");
  });

  it("generates LOW warning for low-severity meds", () => {
    const result = checkInteraction("niacin");
    expect(result.warning).toContain("LOW");
  });

  it("generates INFO warning for info-level meds", () => {
    const result = checkInteraction("paracetamol");
    expect(result.warning).toContain("INFO");
  });
});

// ─── severityColour ──────────────────────────────────────────────────────────

describe("severityColour", () => {
  it("red for high", () => expect(severityColour("high")).toBe("#ef4444"));
  it("amber for moderate", () => expect(severityColour("moderate")).toBe("#f59e0b"));
  it("blue for low", () => expect(severityColour("low")).toBe("#3b82f6"));
  it("grey for info", () => expect(severityColour("info")).toBe("#6b7280"));
});

// ─── effectLabel ─────────────────────────────────────────────────────────────

describe("effectLabel", () => {
  it("raises label", () => expect(effectLabel("raises")).toContain("Raises"));
  it("lowers label", () => expect(effectLabel("lowers")).toContain("Lowers"));
  it("variable label", () => expect(effectLabel("variable")).toContain("Variable"));
  it("none label", () => expect(effectLabel("none")).toContain("No direct"));
});

// ─── generateInteractionReport ───────────────────────────────────────────────

describe("generateInteractionReport", () => {
  it("generates report for multiple medications", () => {
    const report = generateInteractionReport(["prednisone", "metformin", "aspirin"]);
    expect(report.medications.length).toBe(3);
    expect(report.results.length).toBe(3);
    expect(report.highSeverityCount).toBe(1);
    expect(report.moderateCount).toBe(1);
  });

  it("flags unmatched medications in recommendations", () => {
    const report = generateInteractionReport(["unknownmed", "prednisone"]);
    expect(report.recommendations.some((r) => r.includes("not found"))).toBe(true);
  });

  it("returns clean report when no interactions", () => {
    const report = generateInteractionReport([]);
    expect(report.highSeverityCount).toBe(0);
    expect(report.moderateCount).toBe(0);
    expect(report.recommendations.some((r) => r.includes("No significant"))).toBe(true);
  });

  it("recommends dose discussion for high-severity meds", () => {
    const report = generateInteractionReport(["dexamethasone"]);
    expect(report.recommendations.some((r) => r.includes("HIGH impact"))).toBe(true);
  });

  it("recommends monitoring for moderate-severity meds", () => {
    const report = generateInteractionReport(["atenolol"]);
    expect(report.recommendations.some((r) => r.includes("Monitor"))).toBe(true);
  });
});
