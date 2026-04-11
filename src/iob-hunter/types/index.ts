/**
 * GluMira™ V7 — IOB Hunter v7 · Types
 *
 * All TypeScript interfaces for the IOB Hunter v7 module. Every consumer
 * (engine, components, hooks) imports from here. No implementations.
 *
 * Per canonical rule: all enums and string-literal unions are ALPHABETICAL.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

/* ─── Region codes (ISO 3166-1 alpha-2 or zone, alphabetical) ────────────── */
export type RegionCode = "AF" | "AP" | "EU" | "LA" | "ME" | "NA" | "UK";

/* ─── Insulin category (alphabetical) ────────────────────────────────────── */
export type InsulinCategory =
  | "intermediate"
  | "long"
  | "rapid"
  | "short"
  | "ultra-long"
  | "ultra-rapid";

/* ─── Decay model (alphabetical, all lower_snake) ────────────────────────── */
export type DecayModel =
  | "bilinear"        // linear rise then linear fall (simple rapid)
  | "exponential"     // Bateman two-compartment (standard rapid/short/int.)
  | "flat_depot"      // Tresiba/Toujeo — linear decline, NO peak
  | "microprecipitate" // Lantus/Basaglar — near-flat with slow onset
  | "mixed_profile";  // premix (e.g. Humulin 70/30) — rapid + long components

/* ─── Insulin status per region (alphabetical) ───────────────────────────── */
export type RegionalStatus =
  | "approved"
  | "biosimilar"
  | "discontinued"
  | "not_available";

/* ─── Dose event type (alphabetical) ─────────────────────────────────────── */
export type DoseType =
  | "basal_injection"
  | "bolus"
  | "correction"
  | "pump_delivery";

/* ─── Alert severity (alphabetical) ──────────────────────────────────────── */
export type AlertSeverity = "critical" | "info" | "warning";

/* ─── Alert type (alphabetical) ──────────────────────────────────────────── */
export type IOBAlertType =
  | "basal_overlap"
  | "predictive_high"
  | "predictive_low"
  | "stacking_risk"
  | "tresiba_sneak";

/* ─── Canonical insulin profile ──────────────────────────────────────────── */
export type InsulinProfile = {
  /** Canonical brand name, e.g. "Fiasp", "Levemir", "Tresiba". */
  brand_name: string;
  /** Generic / INN, e.g. "faster aspart", "detemir", "degludec". */
  generic_name: string;
  manufacturer: string;
  category: InsulinCategory;
  /** Minutes from injection to detectable action. */
  onset_minutes: number;
  /**
   * Window of maximum action. Both null for peakless insulins
   * (Tresiba = flat_depot = no peak, ever).
   */
  peak_start_minutes: number | null;
  peak_end_minutes: number | null;
  /** Total duration of action (DIA) in minutes. */
  duration_minutes: number;
  /** True for Tresiba and other flat-depot insulins. */
  is_peakless: boolean;
  /** Which decay model this insulin uses in the engine. */
  decay_model: DecayModel;
  /** Parameters specific to the decay model, e.g. { half_life_minutes: 90 }. */
  decay_parameters: Record<string, number | string | boolean | null>;
  mechanism_notes: string | null;
  /** PK data source citation — FDA label, EMA, PMID, etc. */
  pk_source: string;
  /** Is this insulin currently available for new prescriptions. */
  is_active: boolean;
  /** Vivid graph colour for this insulin's line. NOT from the brand palette. */
  colour: string;
}

/* ─── Regional name mapping ──────────────────────────────────────────────── */
export type InsulinRegionalName = {
  /** The canonical brand_name from InsulinProfile. */
  canonical_name: string;
  /** The locally-used name, e.g. "NovoLog" in the US for NovoRapid. */
  regional_name: string;
  region: RegionCode;
  manufacturer: string;
  status: RegionalStatus;
  concentration: string; // e.g. "U-100", "U-200", "U-300"
  is_biosimilar: boolean;
  /** If a biosimilar, the originator's canonical_name. */
  biosimilar_of: string | null;
  notes: string | null;
}

/* ─── Dose event (a single injection or pump delivery) ───────────────────── */
export type InsulinDose = {
  id: string;
  /** Canonical brand_name or any resolvable regional alias. */
  insulin_name: string;
  dose_units: number;
  /** ISO timestamp OR "HH:mm" for schedule-based demo data. */
  administered_at: string;
  dose_type: DoseType;
  notes?: string | null;
}

/* ─── Single point on a 24h curve ────────────────────────────────────────── */
export type IOBCurvePoint = {
  /** Fractional hour 0..24. */
  hours: number;
  /** Formatted time label for display (e.g. "14:30"). */
  time_label: string;
  /** Combined IOB across all doses at this timepoint, in units. */
  total_iob: number;
  /** Per-dose breakdown: key = dose id (optionally suffixed with cycle). */
  breakdown: Record<string, number>;
}

/* ─── Stacking detection result ──────────────────────────────────────────── */
export type StackingAlert = {
  type: IOBAlertType;
  severity: AlertSeverity;
  start_hour: number;
  end_hour: number;
  peak_iob: number;
  contributing_doses: string[];
  message: string;
}

/* ─── Predictive alert result (hypo/hyper forecast) ──────────────────────── */
export type PredictiveAlert = {
  type: "predictive_high" | "predictive_low";
  severity: AlertSeverity;
  at_hour: number;
  predicted_bg: number;
  message: string;
}

/* ─── What-if scenario ───────────────────────────────────────────────────── */
export type WhatIfScenario = {
  id?: string;
  name: string;
  modified_doses: InsulinDose[];
  created_at?: string;
}

export type WhatIfResult = {
  original_curve: IOBCurvePoint[];
  modified_curve: IOBCurvePoint[];
  peak_delta: number;
  overlap_hours_delta: number;
}

/* ─── Basal coverage analysis ────────────────────────────────────────────── */
export type BasalCoverageAnalysis = {
  total_basal_units: number;
  split_description: string;
  floor_integrity: "continuous" | "gapped" | "overlapping";
  trough_hour: number | null;
  trough_value: number | null;
  overlap_windows: Array<{ start_hour: number; end_hour: number }>;
  findings: string[];
}

/* ─── Clinical report KPIs ───────────────────────────────────────────────── */
export type ReportKPIs = {
  peak_iob: number;
  peak_hour: number;
  trough_iob: number;
  trough_hour: number;
  hours_strong_or_overlap: number;
  total_daily_basal: number;
  total_daily_bolus: number;
}

/* ─── Injection marker (for chart rendering) ─────────────────────────────── */
export type InjectionMarker = {
  dose_id: string;
  hour: number;
  label: string;
  colour: string;
  dose_type: DoseType;
}

/* ─── Subscription tier ──────────────────────────────────────────────────── */
export type Tier = "clinical" | "enterprise" | "free" | "pro";

export type TierLimits = {
  historicalDays: number;
  whatIfScenarios: number;
  aiInsights: boolean;
  clinicalReport: boolean;
  exportPdf: boolean;
  predictiveAlerts: boolean;
  maxProfiles: number;
}
