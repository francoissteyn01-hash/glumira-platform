/**
 * GluMira™ V7 — server/analytics/glucose-export.ts
 * Glucose data export (CSV / JSON).
 * GluMira™ is an educational platform, not a medical device.
 */

export interface ExportOptions {
  format: "csv" | "json";
  unit: "mmol" | "mgdl";
  includeStats: boolean;
}

export interface ExportResult {
  data: string;
  mimeType: string;
  filename: string;
}

const MMOL_TO_MGDL = 18.0182;

export function exportGlucoseData(
  readings: Array<{ glucose_mmol: number; recorded_at: string }>,
  options: ExportOptions,
): ExportResult {
  const rows = readings.map((r) => ({
    glucose: options.unit === "mgdl" ? Math.round(r.glucose_mmol * MMOL_TO_MGDL) : r.glucose_mmol,
    unit: options.unit === "mgdl" ? "mg/dL" : "mmol/L",
    recorded_at: r.recorded_at,
  }));

  if (options.format === "json") {
    return {
      data: JSON.stringify(rows, null, 2),
      mimeType: "application/json",
      filename: `glumira-glucose-export-${Date.now()}.json`,
    };
  }

  // CSV
  const header = "glucose,unit,recorded_at";
  const csv = [header, ...rows.map((r) => `${r.glucose},${r.unit},${r.recorded_at}`)].join("\n");
  return {
    data: csv,
    mimeType: "text/csv",
    filename: `glumira-glucose-export-${Date.now()}.csv`,
  };
}
