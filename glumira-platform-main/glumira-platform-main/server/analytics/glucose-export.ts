/**
 * GluMira™ — glucose-export.ts
 *
 * Generates CSV and JSON exports of glucose readings for patient download.
 * Supports date range filtering, unit conversion (mmol/L ↔ mg/dL),
 * and summary statistics header.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import type { GlucosePoint } from "./glucose-trend";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ExportUnit = "mmol" | "mgdl";
export type ExportFormat = "csv" | "json";

export interface GlucoseExportOptions {
  unit?: ExportUnit;
  format?: ExportFormat;
  startDate?: string;   // ISO date string (inclusive)
  endDate?: string;     // ISO date string (inclusive)
  includeStats?: boolean;
}

export interface GlucoseExportStats {
  count: number;
  avgGlucose: number;
  minGlucose: number;
  maxGlucose: number;
  tirPercent: number;
  unit: ExportUnit;
}

export interface GlucoseExportResult {
  content: string;
  filename: string;
  mimeType: string;
  rowCount: number;
  stats?: GlucoseExportStats;
}

// ─── Unit conversion ──────────────────────────────────────────────────────────

const MMOL_TO_MGDL = 18.0182;

export function mmolToMgdl(mmol: number): number {
  return Math.round(mmol * MMOL_TO_MGDL * 10) / 10;
}

export function mgdlToMmol(mgdl: number): number {
  return Math.round((mgdl / MMOL_TO_MGDL) * 100) / 100;
}

// ─── Date filtering ───────────────────────────────────────────────────────────

export function filterByDateRange(
  readings: GlucosePoint[],
  startDate?: string,
  endDate?: string
): GlucosePoint[] {
  return readings.filter((r) => {
    const ts = new Date(r.timestamp).getTime();
    if (startDate && ts < new Date(startDate + "T00:00:00.000Z").getTime()) return false;
    if (endDate   && ts > new Date(endDate   + "T23:59:59.999Z").getTime()) return false;
    return true;
  });
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export function computeExportStats(
  readings: GlucosePoint[],
  unit: ExportUnit
): GlucoseExportStats {
  if (readings.length === 0) {
    return { count: 0, avgGlucose: 0, minGlucose: 0, maxGlucose: 0, tirPercent: 0, unit };
  }

  const values = readings.map((r) =>
    unit === "mgdl" ? mmolToMgdl(r.glucose) : r.glucose
  );

  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  // TIR in mmol/L: 3.9–10.0
  const tirLow  = unit === "mgdl" ? mmolToMgdl(3.9)  : 3.9;
  const tirHigh = unit === "mgdl" ? mmolToMgdl(10.0) : 10.0;
  const inRange = values.filter((v) => v >= tirLow && v <= tirHigh).length;
  const tirPercent = (inRange / values.length) * 100;

  return {
    count:       readings.length,
    avgGlucose:  Math.round(avg * 100) / 100,
    minGlucose:  Math.round(min * 100) / 100,
    maxGlucose:  Math.round(max * 100) / 100,
    tirPercent:  Math.round(tirPercent * 10) / 10,
    unit,
  };
}

// ─── CSV export ───────────────────────────────────────────────────────────────

export function exportToCsv(
  readings: GlucosePoint[],
  unit: ExportUnit,
  stats?: GlucoseExportStats
): string {
  const unitLabel = unit === "mgdl" ? "mg/dL" : "mmol/L";
  const lines: string[] = [];

  // Stats header (optional)
  if (stats) {
    lines.push(`# GluMira™ Glucose Export`);
    lines.push(`# Generated: ${new Date().toISOString()}`);
    lines.push(`# Readings: ${stats.count}`);
    lines.push(`# Average: ${stats.avgGlucose} ${unitLabel}`);
    lines.push(`# TIR: ${stats.tirPercent}%`);
    lines.push(`# GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.`);
    lines.push("");
  }

  // Header row
  lines.push(`timestamp,glucose_${unit === "mgdl" ? "mgdl" : "mmol"}`);

  // Data rows
  for (const r of readings) {
    const value = unit === "mgdl" ? mmolToMgdl(r.glucose) : r.glucose;
    lines.push(`${r.timestamp},${value}`);
  }

  return lines.join("\n");
}

// ─── JSON export ──────────────────────────────────────────────────────────────

export function exportToJson(
  readings: GlucosePoint[],
  unit: ExportUnit,
  stats?: GlucoseExportStats
): string {
  const rows = readings.map((r) => ({
    timestamp: r.timestamp,
    glucose:   unit === "mgdl" ? mmolToMgdl(r.glucose) : r.glucose,
    unit:      unit === "mgdl" ? "mg/dL" : "mmol/L",
  }));

  const payload: Record<string, unknown> = {
    generatedAt: new Date().toISOString(),
    count:       readings.length,
    unit:        unit === "mgdl" ? "mg/dL" : "mmol/L",
    readings:    rows,
    disclaimer:  "GluMira™ is an educational platform. The science of insulin, made visible.",
  };

  if (stats) {
    payload.stats = stats;
  }

  return JSON.stringify(payload, null, 2);
}

// ─── Main export function ─────────────────────────────────────────────────────

/**
 * Generate a glucose data export in the requested format and unit.
 */
export function exportGlucoseData(
  readings: GlucosePoint[],
  options: GlucoseExportOptions = {}
): GlucoseExportResult {
  const unit:   ExportUnit   = options.unit   ?? "mmol";
  const format: ExportFormat = options.format ?? "csv";

  // Filter by date range
  const filtered = filterByDateRange(readings, options.startDate, options.endDate);

  // Compute stats if requested
  const stats = options.includeStats !== false
    ? computeExportStats(filtered, unit)
    : undefined;

  // Generate content
  const dateTag = new Date().toISOString().slice(0, 10);
  let content: string;
  let filename: string;
  let mimeType: string;

  if (format === "json") {
    content  = exportToJson(filtered, unit, stats);
    filename = `glumira-glucose-${dateTag}.json`;
    mimeType = "application/json";
  } else {
    content  = exportToCsv(filtered, unit, stats);
    filename = `glumira-glucose-${dateTag}.csv`;
    mimeType = "text/csv";
  }

  return {
    content,
    filename,
    mimeType,
    rowCount: filtered.length,
    stats,
  };
}
