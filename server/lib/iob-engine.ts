// iob-engine.ts

interface InsulinProfile {
  id: string; brand_name: string; generic_name: string; manufacturer: string | null;
  category: string; onset_minutes: number; peak_start_minutes: number | null;
  peak_end_minutes: number | null; duration_minutes: number; is_peakless: boolean;
  mechanism_notes: string | null; pk_source: string;
  decay_model: 'exponential' | 'bilinear' | 'flat_depot' | 'mixed_profile';
  decay_parameters: any; is_active: boolean; created_at: string;
}
interface InsulinDose {
  id: string; profile_id: string; insulin_name: string; dose_units: number;
  administered_at: string; dose_type: 'bolus' | 'correction' | 'basal_injection' | 'pump_delivery';
  carbs_grams: number | null; notes: string | null;
  source: 'manual' | 'csv_import' | 'pump_sync' | 'demo_seed'; created_at: string;
}
interface PatientSettings {
  dia_hours: number; isf_mmol: number | null; icr: number | null;
  target_low_mmol: number; target_high_mmol: number;
}
interface IOBResult { totalIOB: number; byInsulin: Record<string, number>; byDose: Record<string, number>; }
interface DecayCurvePoint { time: Date; iob: number; }
interface StackedCurvePoint { time: Date; totalIOB: number; byInsulin: Record<string, number>; }
interface StackingAlert { doseId: string; stackedOnDoseIds: string[]; totalIOBAtTime: number; severity: 'INFO' | 'WARNING' | 'CRITICAL'; message: string; }
interface PredictiveAlert { type: 'low' | 'high'; timeToEvent: number; predictedBG: number; currentIOB: number; }

export type { InsulinProfile, InsulinDose, PatientSettings, IOBResult, DecayCurvePoint, StackedCurvePoint, StackingAlert, PredictiveAlert };

/**
 * Calculates IOB for a single dose at a specific time point.
 */
export function calculateIOB(dose: InsulinDose, profile: InsulinProfile, minutesSinceDose: number): number {
  const { decay_model, decay_parameters, duration_minutes } = profile;
  if (minutesSinceDose > duration_minutes || !profile.is_active) return 0;

  switch (decay_model) {
    case 'exponential': {
      const { half_life_minutes } = decay_parameters;
      const decayFactor = Math.exp(-Math.LN2 * minutesSinceDose / half_life_minutes);
      return dose.dose_units * decayFactor;
    }
    case 'bilinear': {
      const { slope_1_pct_per_min, inflection_minutes, slope_2_pct_per_min } = decay_parameters;
      if (minutesSinceDose < inflection_minutes) {
        return dose.dose_units * (1 - slope_1_pct_per_min * minutesSinceDose);
      } else {
        const iobAtInflection = dose.dose_units * (1 - slope_1_pct_per_min * inflection_minutes);
        const timePast = minutesSinceDose - inflection_minutes;
        return Math.max(0, iobAtInflection * (1 - slope_2_pct_per_min * timePast));
      }
    }
    case 'flat_depot':
      return dose.dose_units * Math.max(0, 1 - minutesSinceDose / duration_minutes);
    case 'mixed_profile': {
      const { rapid_pct, rapid_params, basal_pct, basal_params } = decay_parameters;
      const rapidDose = dose.dose_units * rapid_pct;
      const basalDose = dose.dose_units * basal_pct;

      // Assume rapid is exponential, basal is bilinear (or flat for ultra_long)
      const rapidIOB = rapidDose * (rapid_params.half_life_minutes ? Math.exp(-Math.LN2 * minutesSinceDose / rapid_params.half_life_minutes) : 0);
      let basalIOB = 0;
      if (basal_params.slope_1_pct_per_min) {
        // Bilinear
        const { slope_1_pct_per_min, inflection_minutes, slope_2_pct_per_min } = basal_params;
        if (minutesSinceDose < inflection_minutes) {
          basalIOB = basalDose * (1 - slope_1_pct_per_min * minutesSinceDose);
        } else {
          const iobAtInflection = basalDose * (1 - slope_1_pct_per_min * inflection_minutes);
          const timePast = minutesSinceDose - inflection_minutes;
          basalIOB = Math.max(0, iobAtInflection * (1 - slope_2_pct_per_min * timePast));
        }
      } else {
        // If steady_rate, flat
        const { steady_rate_pct_per_hour } = basal_params;
        const ratePerMinute = steady_rate_pct_per_hour / 60;
        basalIOB = basalDose * Math.max(0, 1 - ratePerMinute * minutesSinceDose / 100);
      }
      return rapidIOB + basalIOB;
    }
    default:
      return 0;
  }
}

/**
 * Calculates total IOB across all active doses at a given time.
 */
export function calculateTotalIOB(
  allActiveDoses: InsulinDose[],
  profiles: InsulinProfile[],
  atTime: Date
): IOBResult {
  let totalIOB = 0;
  const byInsulin: Record<string, number> = {};
  const byDose: Record<string, number> = {};

  for (const dose of allActiveDoses) {
    const profile = profiles.find(p => p.brand_name === dose.insulin_name && p.is_active);
    if (!profile) continue;

    const administered = new Date(dose.administered_at);
    const minutesSince = (atTime.getTime() - administered.getTime()) / (1000 * 60);
    if (minutesSince > profile.duration_minutes) continue;

    const iob = calculateIOB(dose, profile, minutesSince);
    totalIOB += iob;
    byInsulin[dose.insulin_name] = (byInsulin[dose.insulin_name] || 0) + iob;
    byDose[dose.id] = iob;
  }
  return { totalIOB, byInsulin, byDose };
}

/**
 * Generates full decay curve for a single dose.
 */
export function generateDecayCurve(
  dose: InsulinDose,
  profile: InsulinProfile,
  resolutionMinutes = 5
): DecayCurvePoint[] {
  const points: DecayCurvePoint[] = [];
  const administered = new Date(dose.administered_at);
  for (let min = 0; min <= profile.duration_minutes; min += resolutionMinutes) {
    const time = new Date(administered.getTime() + min * 60000);
    const iob = calculateIOB(dose, profile, min);
    points.push({ time, iob });
  }
  return points;
}

/**
 * Generates composite IOB curve across active doses.
 */
export function generateStackedCurve(
  allActiveDoses: InsulinDose[],
  profiles: InsulinProfile[],
  startTime: Date,
  endTime: Date,
  resolutionMinutes = 5
): StackedCurvePoint[] {
  const points: StackedCurvePoint[] = [];
  for (let offset = 0; ; offset += resolutionMinutes) {
    const time = new Date(startTime.getTime() + offset * 60000);
    if (time > endTime) break;
    const { totalIOB, byInsulin } = calculateTotalIOB(allActiveDoses, profiles, time);
    points.push({ time, totalIOB, byInsulin });
  }
  return points;
}

/**
 * Detects insulin stacking based on remaining IOB at bolus times.
 */
export function detectStacking(
  allDoses: InsulinDose[],
  profiles: InsulinProfile[],
  settings: PatientSettings
): StackingAlert[] {
  const alerts: StackingAlert[] = [];
  const boluses = allDoses
    .filter(d => ['bolus', 'correction'].includes(d.dose_type))
    .sort((a, b) => new Date(a.administered_at).getTime() - new Date(b.administered_at).getTime());

  for (let i = 1; i < boluses.length; i++) {
    const dose = boluses[i];
    const doseTime = new Date(dose.administered_at);

    const priorBoluses = boluses.slice(0, i).filter(p => {
      const pTime = new Date(p.administered_at);
      const profile = profiles.find(k => p.insulin_name === k.brand_name);
      return profile && (doseTime.getTime() - pTime.getTime()) / (1000 * 60) < profile.duration_minutes;
    });

    if (!priorBoluses.length) continue;

    let totalPriorIOB = 0;
    for (const p of priorBoluses) {
      const profile = profiles.find(k => p.insulin_name === k.brand_name);
      if (!profile) continue;
      const minutesSince = (doseTime.getTime() - new Date(p.administered_at).getTime()) / (1000 * 60);
      totalPriorIOB += calculateIOB(p, profile, minutesSince);
    }

    let severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO';
    if (totalPriorIOB > 2.0) severity = 'CRITICAL';
    else if (totalPriorIOB > 1.0) severity = 'WARNING';

    const message = `IOB suggests possible stacking at ${doseTime.toISOString()}. Remaining ${totalPriorIOB.toFixed(1)} units from prior boluses.`;
    alerts.push({
      doseId: dose.id,
      stackedOnDoseIds: priorBoluses.map(p => p.id),
      totalIOBAtTime: totalPriorIOB,
      severity,
      message,
    });
  }
  return alerts;
}

/**
 * Predictive low BG alert based on IOB curve.
 */
export function predictiveLowAlert(
  totalIOBCurve: StackedCurvePoint[],
  currentBG: number,
  isf: number,
  targetLow: number
): PredictiveAlert | null {
  for (const point of totalIOBCurve) {
    const predicted = currentBG - (point.totalIOB * isf);
    if (predicted < targetLow) {
      return {
        type: 'low',
        timeToEvent: (point.time.getTime() - Date.now()) / (1000 * 60),
        predictedBG: predicted,
        currentIOB: point.totalIOB,
      };
    }
  }
  return null;
}

/**
 * Predictive high BG alert based on IOB curve and carbs.
 */
export function predictiveHighAlert(
  totalIOBCurve: StackedCurvePoint[],
  currentBG: number,
  carbsOnBoard: number,
  icr: number,
  isf: number,
  targetHigh: number
): PredictiveAlert | null {
  const estimatedCarbImpact = (carbsOnBoard / icr) * isf;
  for (const point of totalIOBCurve) {
    const predicted = currentBG + estimatedCarbImpact - (point.totalIOB * isf);
    if (predicted > targetHigh) {
      return {
        type: 'high',
        timeToEvent: (point.time.getTime() - Date.now()) / (1000 * 60),
        predictedBG: predicted,
        currentIOB: point.totalIOB,
      };
    }
  }
  return null;
}
