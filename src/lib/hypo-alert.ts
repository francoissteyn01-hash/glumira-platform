/**
 * GluMira™ V7 — Hypo Alert Engine (Block 18)
 * Pure TypeScript module for hypoglycaemia detection, classification,
 * pattern analysis, and educational action guidance.
 *
 * Educational insight only — discuss with your clinician.
 */

/* ─── Types ──────────────────────────────────────────────────────────────── */

export interface HypoAlert {
  id: string;
  timestamp: string;
  glucoseValue: number;
  glucoseUnits: "mmol" | "mg";
  severity: "mild" | "moderate" | "severe";
  mealContext?: string;
  message: string;
  action: string;
}

export interface HypoThreshold {
  mildMmol: number;
  moderateMmol: number;
  severeMmol: number;
}

export interface HypoPatternResult {
  hypoCount: number;
  windowHours: number;
  events: { value: number; time: string; severity: "mild" | "moderate" | "severe" }[];
  isRecurring: boolean;
  summary: string;
}

/* ─── Constants ──────────────────────────────────────────────────────────── */

const DEFAULT_THRESHOLDS: HypoThreshold = {
  mildMmol: 3.9,
  moderateMmol: 3.0,
  severeMmol: 2.5,
};

const MMOL_TO_MG = 18.0182;

const EDUCATIONAL_FOOTER =
  "Educational insight only — discuss with your clinician.";

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function toMmol(value: number, units: "mmol" | "mg"): number {
  return units === "mg" ? value / MMOL_TO_MG : value;
}

function generateId(): string {
  return `hypo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/* ─── Core API ───────────────────────────────────────────────────────────── */

/**
 * Classify a glucose reading as a hypo severity level.
 * Returns `null` if the value is not hypoglycaemic.
 */
export function classifyHypo(
  glucose: number,
  units: "mmol" | "mg",
  thresholds: HypoThreshold = DEFAULT_THRESHOLDS,
): "mild" | "moderate" | "severe" | null {
  const mmol = toMmol(glucose, units);
  if (mmol < thresholds.severeMmol) return "severe";
  if (mmol < thresholds.moderateMmol) return "moderate";
  if (mmol < thresholds.mildMmol) return "mild";
  return null;
}

/**
 * Return step-by-step educational action guidance for a given severity.
 */
export function getHypoActionGuidance(severity: "mild" | "moderate" | "severe"): string {
  switch (severity) {
    case "mild":
      return (
        "Check glucose. If below 3.9 mmol/L, treat with 15g fast-acting carbs. " +
        "Recheck in 15 minutes."
      );
    case "moderate":
      return (
        "Treat immediately with 15-20g fast-acting glucose. " +
        "Do not leave the person alone. Recheck in 15 minutes."
      );
    case "severe":
      return (
        "This is a medical emergency. If unconscious, do NOT give food or drink. " +
        "Call emergency services. Administer glucagon if available."
      );
  }
}

/**
 * Create a full HypoAlert object with message and action guidance.
 */
export function generateHypoAlert(
  glucose: number,
  units: "mmol" | "mg",
  timestamp: string,
  context?: string,
  thresholds?: HypoThreshold,
): HypoAlert | null {
  const severity = classifyHypo(glucose, units, thresholds);
  if (!severity) return null;

  const unitLabel = units === "mmol" ? "mmol/L" : "mg/dL";
  const displayVal = units === "mmol"
    ? (Math.round(glucose * 10) / 10).toFixed(1)
    : String(Math.round(glucose));

  const severityLabel = severity.charAt(0).toUpperCase() + severity.slice(1);
  const message = `${severityLabel} hypoglycaemia detected: ${displayVal} ${unitLabel} at ${new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. ${EDUCATIONAL_FOOTER}`;

  return {
    id: generateId(),
    timestamp,
    glucoseValue: glucose,
    glucoseUnits: units,
    severity,
    mealContext: context,
    message,
    action: getHypoActionGuidance(severity),
  };
}

/**
 * Analyse a window of glucose readings for recurring hypo patterns.
 */
export function checkHypoPattern(
  readings: { value: number; time: string }[],
  windowHours: number,
  units: "mmol" | "mg" = "mmol",
  thresholds: HypoThreshold = DEFAULT_THRESHOLDS,
): HypoPatternResult {
  const now = Date.now();
  const cutoff = now - windowHours * 60 * 60_000;

  const events: HypoPatternResult["events"] = [];

  for (const r of readings) {
    const t = new Date(r.time).getTime();
    if (t < cutoff) continue;
    const severity = classifyHypo(r.value, units, thresholds);
    if (severity) {
      events.push({ value: r.value, time: r.time, severity });
    }
  }

  const isRecurring = events.length >= 2;

  let summary: string;
  if (events.length === 0) {
    summary = `No hypoglycaemic events detected in the past ${windowHours} hours.`;
  } else if (events.length === 1) {
    summary = `1 hypoglycaemic event detected in the past ${windowHours} hours.`;
  } else {
    const severeCt = events.filter((e) => e.severity === "severe").length;
    summary =
      `${events.length} hypoglycaemic events detected in the past ${windowHours} hours` +
      (severeCt > 0 ? ` (${severeCt} severe)` : "") +
      `. Recurring pattern identified — discuss with your clinician.`;
  }

  return {
    hypoCount: events.length,
    windowHours,
    events,
    isRecurring,
    summary,
  };
}
