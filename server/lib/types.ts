/**
 * GluMira™ V7 — Insulin & IOB type definitions (server)
 */

export interface InsulinProfile {
  id: string;
  brand_name: string;
  generic_name: string;
  manufacturer: string | null;
  category: 'rapid_acting' | 'short_acting' | 'intermediate_acting' | 'long_acting' | 'ultra_long_acting' | 'mixed' | 'concentrated';
  onset_minutes: number;
  peak_start_minutes: number | null;
  peak_end_minutes: number | null;
  duration_minutes: number;
  is_peakless: boolean;
  mechanism_notes: string | null;
  pk_source: string;
  decay_model: 'exponential' | 'bilinear' | 'flat_depot' | 'mixed_profile';
  decay_parameters: any;
  is_active: boolean;
  created_at: string;
}

export interface InsulinDose {
  id: string;
  profile_id: string;
  insulin_name: string;
  dose_units: number;
  administered_at: string;
  dose_type: 'bolus' | 'correction' | 'basal_injection' | 'pump_delivery';
  carbs_grams: number | null;
  notes: string | null;
  source: 'manual' | 'csv_import' | 'pump_sync' | 'demo_seed';
  created_at: string;
}

export interface PatientSettings {
  dia_hours: number;
  isf_mmol: number | null;
  icr: number | null;
  target_low_mmol: number;
  target_high_mmol: number;
}

export interface IOBResult {
  totalIOB: number;
  byInsulin: Record<string, number>;
  byDose: Record<string, number>;
}

export interface DecayCurvePoint {
  time: Date;
  iob: number;
}

export interface StackedCurvePoint {
  time: Date;
  totalIOB: number;
  byInsulin: Record<string, number>;
}

export interface StackingAlert {
  doseId: string;
  stackedOnDoseIds: string[];
  totalIOBAtTime: number;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  message: string;
}

export interface PredictiveAlert {
  type: 'low' | 'high';
  timeToEvent: number;
  predictedBG: number;
  currentIOB: number;
}
