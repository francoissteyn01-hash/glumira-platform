/**
 * GluMira™ V7 — client/src/lib/utils.ts
 * Shared frontend utilities
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format mmol/L or mg/dL */
export function formatGlucose(
  value: number,
  unit: "mmol" | "mgdl" = "mmol"
): string {
  if (unit === "mmol") return `${value.toFixed(1)} mmol/L`;
  return `${Math.round(value)} mg/dL`;
}

/** Convert mmol/L → mg/dL */
export function mmolToMgdl(mmol: number): number {
  return Math.round(mmol * 18.018);
}

/** Convert mg/dL → mmol/L */
export function mgdlToMmol(mgdl: number): number {
  return parseFloat((mgdl / 18.018).toFixed(1));
}

/** Glucose status colour token */
export function glucoseStatus(
  mmol: number
): "low" | "normal" | "high" | "critical" {
  if (mmol < 3.9) return "low";
  if (mmol <= 10.0) return "normal";
  if (mmol <= 13.9) return "high";
  return "critical";
}

/** Format relative time (e.g. "5 min ago") */
export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString();
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
