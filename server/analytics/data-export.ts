/**
 * GluMira™ — Data Export Module
 *
 * Exports glucose, insulin, and meal data in various formats
 * for sharing with healthcare providers or importing into other systems.
 *
 * Supported formats: CSV, JSON, AGP-compatible, FHIR-compatible
 *
 * NOT a medical device. Educational purposes only.
 */

export interface ExportReading {
  timestampUtc: string;
  glucoseMmol: number;
  glucoseMgdl: number;
  source: "cgm" | "fingerstick" | "manual";
  mealTag?: string;
}

export interface ExportDose {
  timestampUtc: string;
  units: number;
  type: "basal" | "bolus" | "correction";
  insulinName?: string;
}

export interface ExportMeal {
  timestampUtc: string;
  carbsGrams: number;
  description?: string;
}

export interface ExportInput {
  patientName?: string;
  dateOfBirth?: string;
  diabetesType?: string;
  readings: ExportReading[];
  doses: ExportDose[];
  meals: ExportMeal[];
  targetLowMmol: number;
  targetHighMmol: number;
}

export type ExportFormat = "csv" | "json" | "agp" | "fhir";

export interface ExportResult {
  format: ExportFormat;
  filename: string;
  content: string;
  mimeType: string;
  recordCount: number;
  dateRange: { start: string; end: string };
}

/* ── CSV Export ───────────────────────────────────────────────── */

function escapeCSV(val: string | number | undefined): string {
  if (val === undefined || val === null) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportToCSV(input: ExportInput): ExportResult {
  const lines: string[] = [];

  // Header
  lines.push("Timestamp,Glucose (mmol/L),Glucose (mg/dL),Source,Meal Tag,Insulin (units),Insulin Type,Carbs (g),Meal Description");

  // Merge all events by timestamp
  const events = new Map<string, {
    glucose?: ExportReading;
    dose?: ExportDose;
    meal?: ExportMeal;
  }>();

  input.readings.forEach((r) => {
    if (!events.has(r.timestampUtc)) events.set(r.timestampUtc, {});
    events.get(r.timestampUtc)!.glucose = r;
  });

  input.doses.forEach((d) => {
    if (!events.has(d.timestampUtc)) events.set(d.timestampUtc, {});
    events.get(d.timestampUtc)!.dose = d;
  });

  input.meals.forEach((m) => {
    if (!events.has(m.timestampUtc)) events.set(m.timestampUtc, {});
    events.get(m.timestampUtc)!.meal = m;
  });

  // Sort by timestamp
  const sorted = [...events.entries()].sort(([a], [b]) => a.localeCompare(b));

  sorted.forEach(([ts, ev]) => {
    lines.push([
      escapeCSV(ts),
      escapeCSV(ev.glucose?.glucoseMmol),
      escapeCSV(ev.glucose?.glucoseMgdl),
      escapeCSV(ev.glucose?.source),
      escapeCSV(ev.glucose?.mealTag),
      escapeCSV(ev.dose?.units),
      escapeCSV(ev.dose?.type),
      escapeCSV(ev.meal?.carbsGrams),
      escapeCSV(ev.meal?.description),
    ].join(","));
  });

  const timestamps = sorted.map(([ts]) => ts);

  return {
    format: "csv",
    filename: `glumira-export-${new Date().toISOString().slice(0, 10)}.csv`,
    content: lines.join("\n"),
    mimeType: "text/csv",
    recordCount: sorted.length,
    dateRange: {
      start: timestamps[0] ?? "",
      end: timestamps[timestamps.length - 1] ?? "",
    },
  };
}

/* ── JSON Export ──────────────────────────────────────────────── */

export function exportToJSON(input: ExportInput): ExportResult {
  const timestamps = [
    ...input.readings.map((r) => r.timestampUtc),
    ...input.doses.map((d) => d.timestampUtc),
    ...input.meals.map((m) => m.timestampUtc),
  ].sort();

  const data = {
    exportedAt: new Date().toISOString(),
    patient: {
      name: input.patientName ?? "Anonymous",
      dateOfBirth: input.dateOfBirth ?? "",
      diabetesType: input.diabetesType ?? "",
    },
    targetRange: {
      lowMmol: input.targetLowMmol,
      highMmol: input.targetHighMmol,
    },
    glucoseReadings: input.readings,
    insulinDoses: input.doses,
    meals: input.meals,
    summary: {
      totalReadings: input.readings.length,
      totalDoses: input.doses.length,
      totalMeals: input.meals.length,
    },
  };

  return {
    format: "json",
    filename: `glumira-export-${new Date().toISOString().slice(0, 10)}.json`,
    content: JSON.stringify(data, null, 2),
    mimeType: "application/json",
    recordCount: input.readings.length + input.doses.length + input.meals.length,
    dateRange: {
      start: timestamps[0] ?? "",
      end: timestamps[timestamps.length - 1] ?? "",
    },
  };
}

/* ── AGP-compatible Export ────────────────────────────────────── */

export function exportToAGP(input: ExportInput): ExportResult {
  // AGP (Ambulatory Glucose Profile) format — simplified tab-delimited
  const lines: string[] = [];
  lines.push("# GluMira™ AGP-Compatible Export");
  lines.push(`# Patient: ${input.patientName ?? "Anonymous"}`);
  lines.push(`# Target Range: ${input.targetLowMmol}-${input.targetHighMmol} mmol/L`);
  lines.push(`# Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("Date\tTime\tGlucose (mmol/L)\tGlucose (mg/dL)");

  const sorted = [...input.readings].sort(
    (a, b) => a.timestampUtc.localeCompare(b.timestampUtc)
  );

  sorted.forEach((r) => {
    const dt = new Date(r.timestampUtc);
    const date = dt.toISOString().slice(0, 10);
    const time = dt.toISOString().slice(11, 16);
    lines.push(`${date}\t${time}\t${r.glucoseMmol}\t${r.glucoseMgdl}`);
  });

  return {
    format: "agp",
    filename: `glumira-agp-${new Date().toISOString().slice(0, 10)}.tsv`,
    content: lines.join("\n"),
    mimeType: "text/tab-separated-values",
    recordCount: sorted.length,
    dateRange: {
      start: sorted[0]?.timestampUtc ?? "",
      end: sorted[sorted.length - 1]?.timestampUtc ?? "",
    },
  };
}

/* ── FHIR-compatible Export ───────────────────────────────────── */

export function exportToFHIR(input: ExportInput): ExportResult {
  // Simplified FHIR R4 Observation bundle
  const entries = input.readings.map((r, i) => ({
    resource: {
      resourceType: "Observation",
      id: `glucose-${i}`,
      status: "final",
      category: [{
        coding: [{
          system: "http://terminology.hl7.org/CodeSystem/observation-category",
          code: "laboratory",
        }],
      }],
      code: {
        coding: [{
          system: "http://loinc.org",
          code: "15074-8",
          display: "Glucose [Moles/volume] in Blood",
        }],
      },
      effectiveDateTime: r.timestampUtc,
      valueQuantity: {
        value: r.glucoseMmol,
        unit: "mmol/L",
        system: "http://unitsofmeasure.org",
        code: "mmol/L",
      },
    },
  }));

  const bundle = {
    resourceType: "Bundle",
    type: "collection",
    timestamp: new Date().toISOString(),
    entry: entries,
  };

  const timestamps = input.readings.map((r) => r.timestampUtc).sort();

  return {
    format: "fhir",
    filename: `glumira-fhir-${new Date().toISOString().slice(0, 10)}.json`,
    content: JSON.stringify(bundle, null, 2),
    mimeType: "application/fhir+json",
    recordCount: entries.length,
    dateRange: {
      start: timestamps[0] ?? "",
      end: timestamps[timestamps.length - 1] ?? "",
    },
  };
}

/* ── Main export dispatcher ──────────────────────────────────── */

export function exportData(input: ExportInput, format: ExportFormat): ExportResult {
  switch (format) {
    case "csv": return exportToCSV(input);
    case "json": return exportToJSON(input);
    case "agp": return exportToAGP(input);
    case "fhir": return exportToFHIR(input);
    default: throw new Error(`Unsupported export format: ${format}`);
  }
}
