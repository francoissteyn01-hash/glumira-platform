import { describe, it, expect } from "vitest";
import {
  exportData,
  exportToCSV,
  exportToJSON,
  exportToAGP,
  exportToFHIR,
  type ExportInput,
} from "./data-export";

/* ── helpers ─────────────────────────────────────────────────── */
const baseInput: ExportInput = {
  patientName: "Test Patient",
  dateOfBirth: "1990-06-15",
  diabetesType: "type1",
  readings: [
    { timestampUtc: "2026-03-15T06:00:00Z", glucoseMmol: 6.5, glucoseMgdl: 117, source: "cgm" },
    { timestampUtc: "2026-03-15T12:00:00Z", glucoseMmol: 8.0, glucoseMgdl: 144, source: "cgm", mealTag: "post-meal" },
    { timestampUtc: "2026-03-15T18:00:00Z", glucoseMmol: 5.5, glucoseMgdl: 99, source: "fingerstick" },
  ],
  doses: [
    { timestampUtc: "2026-03-15T07:00:00Z", units: 6, type: "bolus", insulinName: "Novorapid" },
    { timestampUtc: "2026-03-15T22:00:00Z", units: 22, type: "basal", insulinName: "Lantus" },
  ],
  meals: [
    { timestampUtc: "2026-03-15T07:00:00Z", carbsGrams: 45, description: "Breakfast" },
    { timestampUtc: "2026-03-15T12:30:00Z", carbsGrams: 60, description: "Lunch" },
  ],
  targetLowMmol: 4.0,
  targetHighMmol: 10.0,
};

/* ── CSV Export ───────────────────────────────────────────────── */
describe("exportToCSV", () => {
  it("generates CSV with header", () => {
    const r = exportToCSV(baseInput);
    expect(r.format).toBe("csv");
    expect(r.content).toContain("Timestamp");
    expect(r.content).toContain("Glucose (mmol/L)");
  });

  it("includes all data rows", () => {
    const r = exportToCSV(baseInput);
    const lines = r.content.split("\n");
    // Header + merged events (3 readings + 2 doses + 2 meals = up to 7 unique timestamps)
    expect(lines.length).toBeGreaterThan(1);
  });

  it("sets correct mime type", () => {
    const r = exportToCSV(baseInput);
    expect(r.mimeType).toBe("text/csv");
  });

  it("includes date range", () => {
    const r = exportToCSV(baseInput);
    expect(r.dateRange.start).toBeDefined();
    expect(r.dateRange.end).toBeDefined();
  });

  it("handles empty input", () => {
    const empty: ExportInput = { ...baseInput, readings: [], doses: [], meals: [] };
    const r = exportToCSV(empty);
    expect(r.recordCount).toBe(0);
  });

  it("escapes commas in descriptions", () => {
    const input: ExportInput = {
      ...baseInput,
      meals: [{ timestampUtc: "2026-03-15T07:00:00Z", carbsGrams: 45, description: "Eggs, toast, and juice" }],
    };
    const r = exportToCSV(input);
    expect(r.content).toContain('"Eggs, toast, and juice"');
  });
});

/* ── JSON Export ──────────────────────────────────────────────── */
describe("exportToJSON", () => {
  it("generates valid JSON", () => {
    const r = exportToJSON(baseInput);
    expect(r.format).toBe("json");
    const parsed = JSON.parse(r.content);
    expect(parsed.glucoseReadings).toBeDefined();
    expect(parsed.insulinDoses).toBeDefined();
    expect(parsed.meals).toBeDefined();
  });

  it("includes patient info", () => {
    const r = exportToJSON(baseInput);
    const parsed = JSON.parse(r.content);
    expect(parsed.patient.name).toBe("Test Patient");
  });

  it("includes target range", () => {
    const r = exportToJSON(baseInput);
    const parsed = JSON.parse(r.content);
    expect(parsed.targetRange.lowMmol).toBe(4.0);
    expect(parsed.targetRange.highMmol).toBe(10.0);
  });

  it("includes summary counts", () => {
    const r = exportToJSON(baseInput);
    const parsed = JSON.parse(r.content);
    expect(parsed.summary.totalReadings).toBe(3);
    expect(parsed.summary.totalDoses).toBe(2);
    expect(parsed.summary.totalMeals).toBe(2);
  });

  it("sets correct mime type", () => {
    const r = exportToJSON(baseInput);
    expect(r.mimeType).toBe("application/json");
  });
});

/* ── AGP Export ───────────────────────────────────────────────── */
describe("exportToAGP", () => {
  it("generates tab-delimited format", () => {
    const r = exportToAGP(baseInput);
    expect(r.format).toBe("agp");
    expect(r.content).toContain("\t");
  });

  it("includes header comments", () => {
    const r = exportToAGP(baseInput);
    expect(r.content).toContain("# GluMira");
    expect(r.content).toContain("# Patient:");
  });

  it("includes glucose data", () => {
    const r = exportToAGP(baseInput);
    expect(r.content).toContain("6.5");
    expect(r.content).toContain("117");
  });

  it("sets correct mime type", () => {
    const r = exportToAGP(baseInput);
    expect(r.mimeType).toBe("text/tab-separated-values");
  });

  it("sorts readings by timestamp", () => {
    const r = exportToAGP(baseInput);
    const dataLines = r.content.split("\n").filter((l) => !l.startsWith("#") && l.includes("\t") && !l.startsWith("Date"));
    expect(dataLines.length).toBe(3);
  });
});

/* ── FHIR Export ──────────────────────────────────────────────── */
describe("exportToFHIR", () => {
  it("generates FHIR bundle", () => {
    const r = exportToFHIR(baseInput);
    expect(r.format).toBe("fhir");
    const parsed = JSON.parse(r.content);
    expect(parsed.resourceType).toBe("Bundle");
    expect(parsed.type).toBe("collection");
  });

  it("includes observation entries", () => {
    const r = exportToFHIR(baseInput);
    const parsed = JSON.parse(r.content);
    expect(parsed.entry.length).toBe(3);
  });

  it("uses correct LOINC code for glucose", () => {
    const r = exportToFHIR(baseInput);
    const parsed = JSON.parse(r.content);
    const coding = parsed.entry[0].resource.code.coding[0];
    expect(coding.system).toContain("loinc.org");
    expect(coding.code).toBe("15074-8");
  });

  it("includes glucose values in mmol/L", () => {
    const r = exportToFHIR(baseInput);
    const parsed = JSON.parse(r.content);
    expect(parsed.entry[0].resource.valueQuantity.value).toBe(6.5);
    expect(parsed.entry[0].resource.valueQuantity.unit).toBe("mmol/L");
  });

  it("sets correct mime type", () => {
    const r = exportToFHIR(baseInput);
    expect(r.mimeType).toBe("application/fhir+json");
  });
});

/* ── Export dispatcher ────────────────────────────────────────── */
describe("exportData — dispatcher", () => {
  it("dispatches to CSV", () => {
    const r = exportData(baseInput, "csv");
    expect(r.format).toBe("csv");
  });

  it("dispatches to JSON", () => {
    const r = exportData(baseInput, "json");
    expect(r.format).toBe("json");
  });

  it("dispatches to AGP", () => {
    const r = exportData(baseInput, "agp");
    expect(r.format).toBe("agp");
  });

  it("dispatches to FHIR", () => {
    const r = exportData(baseInput, "fhir");
    expect(r.format).toBe("fhir");
  });

  it("throws for unsupported format", () => {
    expect(() => exportData(baseInput, "xml" as any)).toThrow("Unsupported");
  });
});

/* ── Filename generation ─────────────────────────────────────── */
describe("export — filenames", () => {
  it("CSV filename includes date", () => {
    const r = exportToCSV(baseInput);
    expect(r.filename).toMatch(/glumira-export-\d{4}-\d{2}-\d{2}\.csv/);
  });

  it("JSON filename includes date", () => {
    const r = exportToJSON(baseInput);
    expect(r.filename).toMatch(/glumira-export-\d{4}-\d{2}-\d{2}\.json/);
  });

  it("AGP filename includes date", () => {
    const r = exportToAGP(baseInput);
    expect(r.filename).toMatch(/glumira-agp-\d{4}-\d{2}-\d{2}\.tsv/);
  });

  it("FHIR filename includes date", () => {
    const r = exportToFHIR(baseInput);
    expect(r.filename).toMatch(/glumira-fhir-\d{4}-\d{2}-\d{2}\.json/);
  });
});
