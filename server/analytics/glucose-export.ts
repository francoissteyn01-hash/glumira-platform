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
  content: string;
  mimeType: string;
  filename: string;
  rowCount: number;
}

const MMOL_TO_MGDL = 18.0182;

export function exportGlucoseData(
  readings: Array<{ glucose: number; timestamp: string } | { glucose_mmol: number; recorded_at: string }>,
  options: ExportOptions,
): ExportResult {
  // Normalise input — accept both shapes
  const normalised = readings.map((r: any) => ({
    glucose_mmol: r.glucose_mmol ?? r.glucose ?? 0,
    recorded_at: r.recorded_at ?? r.timestamp ?? "",
  }));

  const rows = normalised.map((r) => ({
    glucose: options.unit === "mgdl" ? Math.round(r.glucose_mmol * MMOL_TO_MGDL) : r.glucose_mmol,
    unit: options.unit === "mgdl" ? "mg/dL" : "mmol/L",
    recorded_at: r.recorded_at,
  }));

  if (options.format === "json") {
    const jsonStr = JSON.stringify(rows, null, 2);
    return {
      data: jsonStr,
      content: jsonStr,
      mimeType: "application/json",
      filename: `glumira-glucose-export-${Date.now()}.json`,
      rowCount: rows.length,
    };
  }

  // CSV
  const header = "glucose,unit,recorded_at";
  const csv = [header, ...rows.map((r) => `${r.glucose},${r.unit},${r.recorded_at}`)].join("\n");
  return {
    data: csv,
    content: csv,
    mimeType: "text/csv",
    filename: `glumira-glucose-export-${Date.now()}.csv`,
    rowCount: rows.length,
  };
}
