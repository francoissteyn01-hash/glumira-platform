import { describe, it, expect } from "vitest";
import { checkMedicationInteractions, type Medication } from "./medication-interaction";

/* ── helpers ─────────────────────────────────────────────────── */
const insulin: Medication = { name: "Lantus", category: "insulin" };
const metformin: Medication = { name: "Metformin", category: "metformin" };
const prednisone: Medication = { name: "Prednisone", category: "corticosteroid" };
const atenolol: Medication = { name: "Atenolol", category: "beta-blocker" };
const ciprofloxacin: Medication = { name: "Ciprofloxacin", category: "fluoroquinolone" };
const glipizide: Medication = { name: "Glipizide", category: "sulfonylurea" };
const lisinopril: Medication = { name: "Lisinopril", category: "ace-inhibitor" };
const ibuprofen: Medication = { name: "Ibuprofen", category: "nsaid" };
const atorvastatin: Medication = { name: "Atorvastatin", category: "statin" };
const empagliflozin: Medication = { name: "Empagliflozin", category: "sglt2-inhibitor" };
const furosemide: Medication = { name: "Furosemide", category: "diuretic" };
const olanzapine: Medication = { name: "Olanzapine", category: "antipsychotic" };

/* ── Empty input ─────────────────────────────────────────────── */
describe("checkMedicationInteractions — empty", () => {
  it("handles no medications", () => {
    const r = checkMedicationInteractions([]);
    expect(r.interactions.length).toBe(0);
    expect(r.overallRisk).toBe("none");
  });
});

/* ── Single medication ───────────────────────────────────────── */
describe("checkMedicationInteractions — single", () => {
  it("no interactions for single medication", () => {
    const r = checkMedicationInteractions([insulin]);
    expect(r.interactions.length).toBe(0);
    expect(r.overallRisk).toBe("none");
  });
});

/* ── High severity interactions ──────────────────────────────── */
describe("checkMedicationInteractions — high severity", () => {
  it("detects insulin + corticosteroid interaction", () => {
    const r = checkMedicationInteractions([insulin, prednisone]);
    expect(r.interactions.length).toBe(1);
    expect(r.interactions[0].severity).toBe("high");
    expect(r.interactions[0].glucoseEffect).toBe("raises");
    expect(r.highSeverityCount).toBe(1);
  });

  it("detects sulfonylurea + fluoroquinolone interaction", () => {
    const r = checkMedicationInteractions([glipizide, ciprofloxacin]);
    expect(r.interactions.length).toBe(1);
    expect(r.interactions[0].severity).toBe("high");
    expect(r.interactions[0].glucoseEffect).toBe("lowers");
  });

  it("detects metformin + corticosteroid interaction", () => {
    const r = checkMedicationInteractions([metformin, prednisone]);
    expect(r.interactions.length).toBe(1);
    expect(r.interactions[0].severity).toBe("high");
  });

  it("overall risk is high when high-severity found", () => {
    const r = checkMedicationInteractions([insulin, prednisone]);
    expect(r.overallRisk).toBe("high");
  });
});

/* ── Moderate severity interactions ──────────────────────────── */
describe("checkMedicationInteractions — moderate severity", () => {
  it("detects insulin + beta-blocker interaction", () => {
    const r = checkMedicationInteractions([insulin, atenolol]);
    expect(r.interactions.length).toBe(1);
    expect(r.interactions[0].severity).toBe("moderate");
    expect(r.interactions[0].glucoseEffect).toBe("masks-hypo");
  });

  it("detects sulfonylurea + NSAID interaction", () => {
    const r = checkMedicationInteractions([glipizide, ibuprofen]);
    expect(r.interactions.length).toBe(1);
    expect(r.interactions[0].severity).toBe("moderate");
  });

  it("detects SGLT2 + diuretic interaction", () => {
    const r = checkMedicationInteractions([empagliflozin, furosemide]);
    expect(r.interactions.length).toBe(1);
    expect(r.interactions[0].severity).toBe("moderate");
  });

  it("detects insulin + antipsychotic interaction", () => {
    const r = checkMedicationInteractions([insulin, olanzapine]);
    expect(r.interactions.length).toBe(1);
    expect(r.interactions[0].severity).toBe("moderate");
  });
});

/* ── Low severity interactions ───────────────────────────────── */
describe("checkMedicationInteractions — low severity", () => {
  it("detects insulin + ACE inhibitor interaction", () => {
    const r = checkMedicationInteractions([insulin, lisinopril]);
    expect(r.interactions.length).toBe(1);
    expect(r.interactions[0].severity).toBe("low");
  });

  it("detects insulin + statin interaction", () => {
    const r = checkMedicationInteractions([insulin, atorvastatin]);
    expect(r.interactions.length).toBe(1);
    expect(r.interactions[0].severity).toBe("low");
  });
});

/* ── Multiple interactions ───────────────────────────────────── */
describe("checkMedicationInteractions — multiple", () => {
  it("detects multiple interactions", () => {
    const r = checkMedicationInteractions([insulin, prednisone, atenolol]);
    expect(r.interactions.length).toBe(2);
  });

  it("counts high and moderate separately", () => {
    const r = checkMedicationInteractions([insulin, prednisone, atenolol]);
    expect(r.highSeverityCount).toBe(1);
    expect(r.moderateCount).toBe(1);
  });
});

/* ── Glucose effects ─────────────────────────────────────────── */
describe("checkMedicationInteractions — glucose effects", () => {
  it("identifies glucose-raising drugs", () => {
    const r = checkMedicationInteractions([insulin, prednisone]);
    expect(r.glucoseRaisingDrugs.length).toBeGreaterThan(0);
  });

  it("identifies glucose-lowering drugs", () => {
    const r = checkMedicationInteractions([glipizide, ciprofloxacin]);
    expect(r.glucoseLoweringDrugs.length).toBeGreaterThan(0);
  });

  it("identifies hypo-masking drugs", () => {
    const r = checkMedicationInteractions([insulin, atenolol]);
    expect(r.hypoMaskingDrugs.length).toBeGreaterThan(0);
  });
});

/* ── Warnings and recommendations ────────────────────────────── */
describe("checkMedicationInteractions — output", () => {
  it("generates warnings for high severity", () => {
    const r = checkMedicationInteractions([insulin, prednisone]);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("generates recommendations", () => {
    const r = checkMedicationInteractions([insulin, prednisone]);
    expect(r.recommendations.length).toBeGreaterThan(0);
  });

  it("provides recommendation for low-risk only", () => {
    const r = checkMedicationInteractions([insulin, lisinopril]);
    expect(r.recommendations.length).toBeGreaterThan(0);
    expect(r.recommendations[0]).toContain("Low-risk");
  });
});

/* ── Auto-classification ─────────────────────────────────────── */
describe("checkMedicationInteractions — auto-classify", () => {
  it("auto-classifies drug by name", () => {
    const r = checkMedicationInteractions([
      { name: "Lantus", category: "" },
      { name: "Prednisone", category: "" },
    ]);
    expect(r.interactions.length).toBe(1);
    expect(r.interactions[0].severity).toBe("high");
  });

  it("handles unknown drugs gracefully", () => {
    const r = checkMedicationInteractions([
      { name: "Lantus", category: "" },
      { name: "SomeUnknownDrug", category: "" },
    ]);
    expect(r.interactions.length).toBe(0);
  });
});
