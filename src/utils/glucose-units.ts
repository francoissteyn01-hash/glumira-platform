/**
 * GluMira™ V7 — Glucose unit conversion utilities
 * All internal storage is in mmol/L. Convert on display only.
 */

export type GlucoseUnit = "mmol" | "mg";

const FACTOR = 18.0182;

/** Convert mg/dL → mmol/L */
export function convertToMmol(mgValue: number): number {
  return Math.round((mgValue / FACTOR) * 100) / 100;
}

/** Convert mmol/L → mg/dL */
export function convertToMg(mmolValue: number): number {
  return Math.round(mmolValue * FACTOR);
}

/** Convert a mmol/L value to the requested display unit */
export function displayGlucose(mmolValue: number, units: GlucoseUnit): number {
  return units === "mg" ? convertToMg(mmolValue) : Math.round(mmolValue * 10) / 10;
}

/** Format a glucose value (in mmol/L internally) for display in the chosen unit */
export function formatGlucose(mmolValue: number, units: GlucoseUnit): string {
  if (units === "mg") return `${convertToMg(mmolValue)}`;
  return (Math.round(mmolValue * 10) / 10).toFixed(1);
}

/** Return the full unit label */
export function getUnitLabel(units: GlucoseUnit): string {
  return units === "mmol" ? "mmol/L" : "mg/dL";
}

/** Convenience: mmol/L → mg/dL (integer) */
export function mmolToMgdl(mmol: number): number {
  return Math.round(mmol * FACTOR);
}

/** Convenience: mg/dL → mmol/L (1 d.p.) */
export function mgdlToMmol(mgdl: number): number {
  return Math.round((mgdl / FACTOR) * 10) / 10;
}
