/**
 * GluMira — Dose Adjustment Advisor Module
 *
 * Analyses glucose trends and current insulin regimen to suggest
 * dose adjustments. Covers basal, bolus ICR, and correction factor.
 *
 * GluMira is an informational tool only. Not a medical device.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GlucoseWindow {
  label: string;
  meanMmol: number;
  readings: number;
  percentBelow: number;
  percentAbove: number;
}

export interface CurrentRegimen {
  basalUnits: number;
  icrGrams: number;
  isfMmol: number;
}

export type AdjustmentDirection = "increase" | "decrease" | "no-change";
export type AdjustmentConfidence = "low" | "moderate" | "high";

export interface DoseAdjustment {
  parameter: "basal" | "icr" | "isf";
  direction: AdjustmentDirection;
  suggestedValue: number;
  currentValue: number;
  delta: number;
  reason: string;
  confidence: AdjustmentConfidence;
}

export interface AdjustmentReport {
  adjustments: DoseAdjustment[];
  overallRisk: "low" | "moderate" | "high";
  safetyNotes: string[];
  timestamp: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ─── Basal adjustment ─────────────────────────────────────────────────────────

export function suggestBasalAdjustment(
  fastingWindow: GlucoseWindow,
  current: CurrentRegimen
): DoseAdjustment {
  const target = 5.5;
  const diff = fastingWindow.meanMmol - target;

  if (fastingWindow.percentBelow > 10) {
    const reduction = clamp(current.basalUnits * 0.1, 0.5, 4);
    return {
      parameter: "basal",
      direction: "decrease",
      suggestedValue: round1(current.basalUnits - reduction),
      currentValue: current.basalUnits,
      delta: round1(-reduction),
      reason: `${fastingWindow.percentBelow.toFixed(0)}% of fasting readings below range — reduce basal to prevent hypos`,
      confidence: fastingWindow.readings >= 10 ? "high" : "moderate",
    };
  }

  if (diff > 1.5) {
    const increase = clamp(current.basalUnits * 0.1, 0.5, 4);
    return {
      parameter: "basal",
      direction: "increase",
      suggestedValue: round1(current.basalUnits + increase),
      currentValue: current.basalUnits,
      delta: round1(increase),
      reason: `Fasting mean ${fastingWindow.meanMmol.toFixed(1)} mmol/L is ${diff.toFixed(1)} above target — increase basal`,
      confidence: fastingWindow.readings >= 10 ? "high" : "moderate",
    };
  }

  if (diff > 0.5) {
    const increase = clamp(current.basalUnits * 0.05, 0.5, 2);
    return {
      parameter: "basal",
      direction: "increase",
      suggestedValue: round1(current.basalUnits + increase),
      currentValue: current.basalUnits,
      delta: round1(increase),
      reason: `Fasting mean ${fastingWindow.meanMmol.toFixed(1)} mmol/L slightly above target`,
      confidence: fastingWindow.readings >= 14 ? "moderate" : "low",
    };
  }

  return {
    parameter: "basal",
    direction: "no-change",
    suggestedValue: current.basalUnits,
    currentValue: current.basalUnits,
    delta: 0,
    reason: "Fasting glucose within target range",
    confidence: fastingWindow.readings >= 10 ? "high" : "moderate",
  };
}

// ─── ICR adjustment ───────────────────────────────────────────────────────────

export function suggestIcrAdjustment(
  postMealWindow: GlucoseWindow,
  current: CurrentRegimen
): DoseAdjustment {
  const postTarget = 8.0;
  const diff = postMealWindow.meanMmol - postTarget;

  if (postMealWindow.percentBelow > 15) {
    const newIcr = round1(current.icrGrams + clamp(current.icrGrams * 0.1, 1, 5));
    return {
      parameter: "icr",
      direction: "decrease",
      suggestedValue: newIcr,
      currentValue: current.icrGrams,
      delta: round1(newIcr - current.icrGrams),
      reason: `${postMealWindow.percentBelow.toFixed(0)}% post-meal readings below range — increase ICR (less insulin per gram)`,
      confidence: postMealWindow.readings >= 10 ? "high" : "moderate",
    };
  }

  if (diff > 2.0) {
    const newIcr = round1(current.icrGrams - clamp(current.icrGrams * 0.1, 1, 3));
    return {
      parameter: "icr",
      direction: "increase",
      suggestedValue: Math.max(1, newIcr),
      currentValue: current.icrGrams,
      delta: round1(Math.max(1, newIcr) - current.icrGrams),
      reason: `Post-meal mean ${postMealWindow.meanMmol.toFixed(1)} mmol/L is ${diff.toFixed(1)} above target — decrease ICR (more insulin per gram)`,
      confidence: postMealWindow.readings >= 10 ? "high" : "moderate",
    };
  }

  return {
    parameter: "icr",
    direction: "no-change",
    suggestedValue: current.icrGrams,
    currentValue: current.icrGrams,
    delta: 0,
    reason: "Post-meal glucose within acceptable range",
    confidence: postMealWindow.readings >= 10 ? "high" : "moderate",
  };
}

// ─── ISF adjustment ───────────────────────────────────────────────────────────

export function suggestIsfAdjustment(
  correctionWindow: GlucoseWindow,
  current: CurrentRegimen
): DoseAdjustment {
  const corrTarget = 6.0;
  const diff = correctionWindow.meanMmol - corrTarget;

  if (correctionWindow.percentBelow > 15) {
    const newIsf = round1(current.isfMmol + clamp(current.isfMmol * 0.15, 0.3, 2));
    return {
      parameter: "isf",
      direction: "decrease",
      suggestedValue: newIsf,
      currentValue: current.isfMmol,
      delta: round1(newIsf - current.isfMmol),
      reason: `${correctionWindow.percentBelow.toFixed(0)}% post-correction readings below range — increase ISF (less aggressive corrections)`,
      confidence: correctionWindow.readings >= 5 ? "moderate" : "low",
    };
  }

  if (diff > 2.0) {
    const newIsf = round1(current.isfMmol - clamp(current.isfMmol * 0.1, 0.2, 1));
    return {
      parameter: "isf",
      direction: "increase",
      suggestedValue: Math.max(0.5, newIsf),
      currentValue: current.isfMmol,
      delta: round1(Math.max(0.5, newIsf) - current.isfMmol),
      reason: `Post-correction mean ${correctionWindow.meanMmol.toFixed(1)} mmol/L still elevated — decrease ISF (more aggressive corrections)`,
      confidence: correctionWindow.readings >= 5 ? "moderate" : "low",
    };
  }

  return {
    parameter: "isf",
    direction: "no-change",
    suggestedValue: current.isfMmol,
    currentValue: current.isfMmol,
    delta: 0,
    reason: "Correction doses achieving target",
    confidence: correctionWindow.readings >= 5 ? "high" : "moderate",
  };
}

// ─── Overall risk ─────────────────────────────────────────────────────────────

export function assessOverallRisk(adjustments: DoseAdjustment[]): "low" | "moderate" | "high" {
  const changes = adjustments.filter((a) => a.direction !== "no-change");
  if (changes.length === 0) return "low";
  const hasLargeBasal = changes.some(
    (a) => a.parameter === "basal" && Math.abs(a.delta) > 2
  );
  const hasMultiple = changes.length >= 2;
  if (hasLargeBasal) return "high";
  if (hasMultiple) return "moderate";
  return "low";
}

// ─── Safety notes ─────────────────────────────────────────────────────────────

export function generateSafetyNotes(adjustments: DoseAdjustment[]): string[] {
  const notes: string[] = [];
  const basalAdj = adjustments.find((a) => a.parameter === "basal");
  if (basalAdj && basalAdj.direction === "increase") {
    notes.push("Monitor fasting glucose closely for 3 days after basal increase.");
  }
  if (basalAdj && basalAdj.direction === "decrease") {
    notes.push("Basal reduction suggested — check for nocturnal hypos.");
  }
  const icrAdj = adjustments.find((a) => a.parameter === "icr");
  if (icrAdj && icrAdj.direction === "increase") {
    notes.push("ICR tightened — monitor 2-hour post-meal glucose for hypos.");
  }
  const isfAdj = adjustments.find((a) => a.parameter === "isf");
  if (isfAdj && isfAdj.direction !== "no-change") {
    notes.push("ISF change applied — test with a single correction before relying on new value.");
  }
  if (notes.length === 0) {
    notes.push("No adjustments needed — continue current regimen.");
  }
  return notes;
}

// ─── Main advisor function ────────────────────────────────────────────────────

export function generateAdjustmentReport(
  fastingWindow: GlucoseWindow,
  postMealWindow: GlucoseWindow,
  correctionWindow: GlucoseWindow,
  current: CurrentRegimen
): AdjustmentReport {
  const basalAdj = suggestBasalAdjustment(fastingWindow, current);
  const icrAdj = suggestIcrAdjustment(postMealWindow, current);
  const isfAdj = suggestIsfAdjustment(correctionWindow, current);
  const adjustments = [basalAdj, icrAdj, isfAdj];

  return {
    adjustments,
    overallRisk: assessOverallRisk(adjustments),
    safetyNotes: generateSafetyNotes(adjustments),
    timestamp: new Date().toISOString(),
  };
}
