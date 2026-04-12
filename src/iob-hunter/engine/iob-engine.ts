/**
 * GluMira™ V7 — IOB Hunter v7 · Core Engine
 *
 * Pure functions that compute insulin-on-board (IOB) across six decay
 * models. No React, no Supabase, no Chart.js — fully testable in isolation.
 *
 * Canonical rules enforced by this file:
 *   - Tresiba uses `depot_release` with `is_peakless: true` → LINEAR decline, NEVER a peak
 *   - Levemir uses `albumin_bound` → dose-dependent DOA from Plank 2005
 *   - Lantus/Basaglar use `microprecipitate` → near-flat with small peak (clamp data, not marketing)
 *   - Rapid/short/intermediate use `exponential` (Bateman two-compartment)
 *   - Premix uses `mixed_profile` → rapid + long components summed
 *   - Every curve samples backward in time (prior-cycle residual included)
 *   - No hardcoded PK values — profiles passed in as parameters
 *
 * Phase 1 foundation commit. Source: 05.8_IOB-Hunter-V7-PK-Research_v1.1.md
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import type {
  BasalCoverageAnalysis,
  InjectionMarker,
  InsulinDose,
  InsulinProfile,
  IOBCurvePoint,
  PredictiveAlert,
  ReportKPIs,
  StackingAlert,
  Tier,
  TierLimits,
  WhatIfResult,
  WhatIfScenario,
} from "@/iob-hunter/types";

/* ═════════════════════════════════════════════════════════════════════════ */
/*  Utilities                                                               */
/* ═════════════════════════════════════════════════════════════════════════ */

/**
 * Parse an `administered_at` field which may be either an ISO timestamp
 * or a schedule-based "HH:mm" string. Returns fractional hours (0..24).
 */
function parseAdministeredHour(administeredAt: string): number {
  if (/^\d{2}:\d{2}$/.test(administeredAt)) {
    const [h, m] = administeredAt.split(":").map(Number);
    return h + m / 60;
  }
  const d = new Date(administeredAt);
  if (Number.isNaN(d.getTime())) return 0;
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}

/**
 * Newton's method solver for Bateman two-compartment rate constants.
 * Given peak_minutes and duration_minutes, return (ka, ke).
 */
function deriveBatemanRates(peakMinutes: number, durationMinutes: number): { ka: number; ke: number } {
  const tPeak = peakMinutes / 60;
  const tDur = durationMinutes / 60;
  // At t=duration, activity ≈ 2% of peak → ke = ln(50)/tDur ≈ 3.91/tDur
  const ke = 3.91 / tDur;

  // tPeak = ln(ka/ke) / (ka - ke) — solve for ka
  let ka = ke * 3;
  for (let iter = 0; iter < 20; iter++) {
    if (ka <= ke) { ka = ke * 1.5; break; }
    const f = Math.log(ka / ke) / (ka - ke) - tPeak;
    const denom = ka - ke;
    const df = (1 / (ka * denom)) - Math.log(ka / ke) / (denom * denom);
    if (Math.abs(df) < 1e-12) break;
    const step = f / df;
    ka -= step;
    if (ka <= ke * 1.01) ka = ke * 1.5;
    if (Math.abs(step) < 1e-8) break;
  }
  return { ka: Math.max(ka, ke * 1.05), ke };
}

/**
 * Bateman IOB fraction at time t (hours). IOB remaining = 1 - cumulative absorbed.
 */
function batemanFraction(t: number, ka: number, ke: number): number {
  if (t <= 0) return 1;
  const totalArea = 1 / ke - 1 / ka;
  if (totalArea <= 0) return 0;
  const cumArea = (1 - Math.exp(-ke * t)) / ke - (1 - Math.exp(-ka * t)) / ka;
  return Math.max(0, Math.min(1, 1 - cumArea / totalArea));
}

/* ═════════════════════════════════════════════════════════════════════════ */
/*  Function 1: calculateIOB                                               */
/*  Remaining IOB for a single dose using the profile's decay_model.       */
/* ═════════════════════════════════════════════════════════════════════════ */

export function calculateIOB(
  doseUnits: number,
  profile: InsulinProfile,
  minutesSinceDose: number,
  patientWeightKg?: number,
): number {
  if (doseUnits <= 0) return 0;
  if (minutesSinceDose < 0) return 0;
  if (minutesSinceDose === 0) return doseUnits;

  // For albumin_bound (Levemir), resolve effective DOA before the boundary check
  const effectiveDuration = profile.decay_model === "albumin_bound"
    ? resolveEffectiveDOA(doseUnits, patientWeightKg ?? 70, profile)
    : profile.duration_minutes;

  if (minutesSinceDose >= effectiveDuration) return 0;

  const t = minutesSinceDose / 60;
  const tDur = effectiveDuration / 60;

  switch (profile.decay_model) {
    /* ─── albumin_bound: Levemir — dose-dependent DOA, flat plateau ── */
    case "albumin_bound": {
      return calculateAlbuminBoundIOB(doseUnits, profile, minutesSinceDose, effectiveDuration);
    }

    /* ─── depot_release: Tresiba / Toujeo — LINEAR decline, peakless ─ */
    case "depot_release": {
      // Tresiba (peakless): pure linear decline — LOCKED canonical rule
      // Toujeo (peakless flag set): same treatment for simplicity
      const fraction = Math.max(0, 1 - minutesSinceDose / effectiveDuration);
      return doseUnits * fraction;
    }

    /* ─── microprecipitate: Lantus / Basaglar — near-flat plateau ──── */
    case "microprecipitate": {
      const plateauEnd = (profile.decay_parameters.plateau_minutes as number) ?? effectiveDuration * 0.85;
      if (minutesSinceDose <= plateauEnd) {
        const onsetPct = minutesSinceDose < profile.onset_minutes
          ? 1 - (minutesSinceDose / profile.onset_minutes) * 0.05
          : 1 - 0.05 - ((minutesSinceDose - profile.onset_minutes) / (plateauEnd - profile.onset_minutes)) * 0.7;
        return doseUnits * Math.max(0, onsetPct);
      }
      const tailRatio = 1 - (minutesSinceDose - plateauEnd) / (effectiveDuration - plateauEnd);
      return doseUnits * Math.max(0, 0.25 * tailRatio);
    }

    /* ─── bilinear: simple rise + fall (legacy rapid approximation) ── */
    case "bilinear": {
      const tPeak = (profile.peak_start_minutes ?? effectiveDuration * 0.3) / 60;
      if (t <= tPeak) return doseUnits;
      const fallFraction = (tDur - t) / (tDur - tPeak);
      return doseUnits * Math.max(0, fallFraction);
    }

    /* ─── mixed_profile: 70/30 premix etc. ──────────────────────────── */
    case "mixed_profile": {
      const rf = (profile.decay_parameters.rapid_fraction as number) ?? 0.3;
      const rapidDur = (profile.decay_parameters.rapid_duration_minutes as number) ?? 300;
      const longDur = (profile.decay_parameters.long_duration_minutes as number) ?? effectiveDuration;

      let rapidIOB = 0;
      if (minutesSinceDose < rapidDur) {
        const { ka, ke } = deriveBatemanRates(60, rapidDur);
        rapidIOB = doseUnits * rf * batemanFraction(minutesSinceDose / 60, ka, ke);
      }
      let longIOB = 0;
      if (minutesSinceDose < longDur) {
        longIOB = doseUnits * (1 - rf) * Math.max(0, 1 - minutesSinceDose / longDur);
      }
      return rapidIOB + longIOB;
    }

    /* ─── exponential: Bateman two-compartment (default) ────────────── */
    case "exponential":
    default: {
      if (profile.is_peakless || profile.peak_start_minutes == null) {
        return doseUnits * Math.max(0, 1 - minutesSinceDose / effectiveDuration);
      }
      const peakMinutes = ((profile.peak_start_minutes ?? 0) + (profile.peak_end_minutes ?? 0)) / 2;
      const { ka, ke } = deriveBatemanRates(peakMinutes, effectiveDuration);
      return doseUnits * batemanFraction(t, ka, ke);
    }
  }
}

/* ═════════════════════════════════════════════════════════════════════════ */
/*  Function 1b: resolveEffectiveDOA                                       */
/*  Levemir dose-dependent DOA from Plank 2005 PMID:15855574              */
/* ═════════════════════════════════════════════════════════════════════════ */

/**
 * For albumin_bound insulins (Levemir), the duration of action depends on
 * the dose in U/kg. This function interpolates from the Plank 2005 table
 * stored in decay_parameters (doa_0_1 through doa_1_6).
 *
 * Returns effective DOA in minutes. Falls back to profile.duration_minutes
 * if the table is missing or weight is unknown.
 */
export function resolveEffectiveDOA(
  doseUnits: number,
  patientWeightKg: number,
  profile: InsulinProfile,
): number {
  if (!profile.decay_parameters.dose_dependent_doa) return profile.duration_minutes;
  if (patientWeightKg <= 0) return profile.duration_minutes;

  // Plank 2005 anchors (U/kg → DOA in minutes)
  const raw: Array<[number, number]> = [
    [0.1, profile.decay_parameters.doa_0_1 as number],
    [0.2, profile.decay_parameters.doa_0_2 as number],
    [0.4, profile.decay_parameters.doa_0_4 as number],
    [0.8, profile.decay_parameters.doa_0_8 as number],
    [1.6, profile.decay_parameters.doa_1_6 as number],
  ];
  const anchors = raw.filter(([, doa]) => doa != null && typeof doa === "number") as Array<[number, number]>;

  if (anchors.length === 0) return profile.duration_minutes;

  const uPerKg = doseUnits / patientWeightKg;

  // Below minimum anchor: use lowest value
  if (uPerKg <= anchors[0][0]) return anchors[0][1];
  // Above maximum anchor: use highest value
  if (uPerKg >= anchors[anchors.length - 1][0]) return anchors[anchors.length - 1][1];

  // Linear interpolation between the two nearest anchors
  for (let i = 0; i < anchors.length - 1; i++) {
    const [x0, y0] = anchors[i];
    const [x1, y1] = anchors[i + 1];
    if (uPerKg >= x0 && uPerKg <= x1) {
      const ratio = (uPerKg - x0) / (x1 - x0);
      return y0 + ratio * (y1 - y0);
    }
  }

  return profile.duration_minutes;
}

/* ═════════════════════════════════════════════════════════════════════════ */
/*  Function 1c: calculateAlbuminBoundIOB                                  */
/*  Levemir-specific: flat plateau shape per Plank 2005                    */
/* ═════════════════════════════════════════════════════════════════════════ */

/**
 * Shape for albumin-bound insulins (Levemir):
 *   1. Ramp phase (0 → 120 min): linear rise to ~90% of dose on board
 *   2. Plateau phase (120 min → 70% of DOA): flat at ~90%, slight linear decline
 *   3. Tail phase (70% of DOA → DOA): linear decline to 0
 *
 * Plank 2005: "flat and protracted pharmacodynamic profile"
 */
function calculateAlbuminBoundIOB(
  doseUnits: number,
  profile: InsulinProfile,
  minutesSinceDose: number,
  effectiveDOAMinutes: number,
): number {
  const rampEnd = profile.onset_minutes; // 120 min for Levemir
  const plateauEnd = effectiveDOAMinutes * 0.7;

  if (minutesSinceDose <= rampEnd) {
    // Ramp: 0 → 90% of dose over onset period (free fraction ~10% absorbed immediately)
    const rampFraction = 0.9 * (minutesSinceDose / rampEnd);
    return doseUnits * rampFraction;
  }

  if (minutesSinceDose <= plateauEnd) {
    // Plateau: flat at ~90%, slight decline to ~85%
    const plateauProgress = (minutesSinceDose - rampEnd) / (plateauEnd - rampEnd);
    const fraction = 0.9 - 0.05 * plateauProgress;
    return doseUnits * fraction;
  }

  // Tail: linear decline from 85% → 0
  const tailProgress = (minutesSinceDose - plateauEnd) / (effectiveDOAMinutes - plateauEnd);
  return doseUnits * Math.max(0, 0.85 * (1 - tailProgress));
}

/* ═════════════════════════════════════════════════════════════════════════ */
/*  Function 1d: getRegimenGraphWindow                                     */
/*  DOA-driven graph window — the graph does not start at zero            */
/* ═════════════════════════════════════════════════════════════════════════ */

/**
 * Returns the appropriate number of backward cycles to capture the full
 * residual tail of every insulin in the regimen.
 *
 * - Tresiba → 4 cycles (96h back → captures 42h+ residual)
 * - Levemir → 1-2 cycles (depends on dose-dependent DOA)
 * - Lantus → 2 cycles (48h)
 * - Rapids only → 1 cycle (24h)
 */
export function getRegimenGraphWindow(
  doses: InsulinDose[],
  profiles: readonly InsulinProfile[],
): { cycles: number; longestDOAHours: number } {
  let maxDOAMinutes = 0;
  for (const dose of doses) {
    const profile = profiles.find((p) => p.brand_name.toLowerCase() === dose.insulin_name.toLowerCase());
    if (!profile) continue;
    maxDOAMinutes = Math.max(maxDOAMinutes, profile.duration_minutes);
  }
  const longestDOAHours = maxDOAMinutes / 60;
  // Each cycle is 24h. We need enough cycles to capture the full DOA.
  const cycles = Math.max(1, Math.ceil(longestDOAHours / 24) + 1);
  return { cycles, longestDOAHours };
}

/* ═════════════════════════════════════════════════════════════════════════ */
/*  Function 2: calculateTotalIOB                                          */
/*  Sum of IOB from all active doses at a given timepoint.                 */
/* ═════════════════════════════════════════════════════════════════════════ */

export function calculateTotalIOB(
  doses: InsulinDose[],
  profiles: readonly InsulinProfile[],
  atHour: number,
  cycles = 2,
  patientWeightKg?: number,
): number {
  let total = 0;
  const safeCycles = Math.max(1, cycles);

  for (let cycle = -(safeCycles - 1); cycle <= 0; cycle++) {
    const cycleOffset = cycle * 24;
    for (const dose of doses) {
      const profile = profiles.find((p) => p.brand_name.toLowerCase() === dose.insulin_name.toLowerCase());
      if (!profile) continue;
      const doseHour = parseAdministeredHour(dose.administered_at) + cycleOffset;
      const minutesSince = (atHour - doseHour) * 60;
      total += calculateIOB(dose.dose_units, profile, minutesSince, patientWeightKg);
    }
  }
  return Math.round(total * 1000) / 1000;
}

/* ═════════════════════════════════════════════════════════════════════════ */
/*  Function 3: generateDecayCurve                                         */
/*  Single-dose curve from t=0 to t=duration at given resolution.          */
/* ═════════════════════════════════════════════════════════════════════════ */

export function generateDecayCurve(
  doseUnits: number,
  profile: InsulinProfile,
  resolutionMinutes = 15,
): Array<{ minutes: number; iob: number }> {
  const points: Array<{ minutes: number; iob: number }> = [];
  for (let m = 0; m <= profile.duration_minutes; m += resolutionMinutes) {
    points.push({ minutes: m, iob: calculateIOB(doseUnits, profile, m) });
  }
  return points;
}

/* ═════════════════════════════════════════════════════════════════════════ */
/*  Function 4: generateStackedCurve                                       */
/*  24h combined IOB curve with prior-cycle residual baseline (locked rule)*/
/* ═════════════════════════════════════════════════════════════════════════ */

export function generateStackedCurve(
  doses: InsulinDose[],
  profiles: readonly InsulinProfile[],
  startHour = 0,
  endHour = 24,
  resolutionMinutes = 15,
  cycles = 2,
  patientWeightKg?: number,
): IOBCurvePoint[] {
  const points: IOBCurvePoint[] = [];
  const stepHours = resolutionMinutes / 60;

  for (let h = startHour; h <= endHour; h += stepHours) {
    const breakdown: Record<string, number> = {};
    let total = 0;
    const safeCycles = Math.max(1, cycles);

    for (let cycle = -(safeCycles - 1); cycle <= 0; cycle++) {
      const cycleOffset = cycle * 24;
      for (const dose of doses) {
        const profile = profiles.find((p) => p.brand_name.toLowerCase() === dose.insulin_name.toLowerCase());
        if (!profile) continue;
        const doseHour = parseAdministeredHour(dose.administered_at) + cycleOffset;
        const minutesSince = (h - doseHour) * 60;
        const iob = calculateIOB(dose.dose_units, profile, minutesSince, patientWeightKg);
        if (iob > 0.001) {
          const key = cycle === 0 ? dose.id : `${dose.id}_c${cycle}`;
          breakdown[key] = (breakdown[key] ?? 0) + iob;
          total += iob;
        }
      }
    }

    const hInt = Math.floor(h) % 24;
    const mInt = Math.round((h - Math.floor(h)) * 60);
    const timeLabel = `${String(hInt).padStart(2, "0")}:${String(mInt).padStart(2, "0")}`;

    points.push({
      hours: Math.round(h * 100) / 100,
      time_label: timeLabel,
      total_iob: Math.round(total * 100) / 100,
      breakdown,
    });
  }

  return points;
}

/* ═════════════════════════════════════════════════════════════════════════ */
/*  Function 5: detectStacking                                             */
/*  Find windows where ≥2 doses are simultaneously above threshold.        */
/* ═════════════════════════════════════════════════════════════════════════ */

export function detectStacking(
  doses: InsulinDose[],
  profiles: readonly InsulinProfile[],
  threshold = 0.5,
  curve?: IOBCurvePoint[],
): StackingAlert[] {
  const alerts: StackingAlert[] = [];
  const sampled = curve ?? generateStackedCurve(doses, profiles);
  if (sampled.length === 0) return alerts;

  const maxIOB = sampled.reduce((m, p) => Math.max(m, p.total_iob), 0);
  if (maxIOB <= 0) return alerts;
  const thresholdIOB = maxIOB * threshold;

  let windowStart: number | null = null;
  let windowPeak = 0;
  let windowContributors = new Set<string>();

  for (const point of sampled) {
    if (point.total_iob >= thresholdIOB) {
      // Count how many doses are contributing meaningfully
      const contributors = Object.keys(point.breakdown).filter(
        (k) => point.breakdown[k] > 0.1,
      );
      if (contributors.length >= 2) {
        if (windowStart === null) windowStart = point.hours;
        if (point.total_iob > windowPeak) windowPeak = point.total_iob;
        contributors.forEach((c) => windowContributors.add(c));
      }
    } else if (windowStart !== null) {
      alerts.push({
        type: "stacking_risk",
        severity: windowPeak > maxIOB * 0.8 ? "critical" : "warning",
        start_hour: windowStart,
        end_hour: point.hours,
        peak_iob: Math.round(windowPeak * 100) / 100,
        contributing_doses: Array.from(windowContributors),
        message: `${windowContributors.size} doses overlap between ${formatHour(windowStart)}–${formatHour(point.hours)}, peak ${windowPeak.toFixed(1)}U`,
      });
      windowStart = null;
      windowPeak = 0;
      windowContributors = new Set();
    }
  }

  // Close final window if still open
  if (windowStart !== null) {
    alerts.push({
      type: "stacking_risk",
      severity: windowPeak > maxIOB * 0.8 ? "critical" : "warning",
      start_hour: windowStart,
      end_hour: sampled[sampled.length - 1].hours,
      peak_iob: Math.round(windowPeak * 100) / 100,
      contributing_doses: Array.from(windowContributors),
      message: `${windowContributors.size} doses overlap, peak ${windowPeak.toFixed(1)}U`,
    });
  }

  return alerts;
}

function formatHour(h: number): string {
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/* ═════════════════════════════════════════════════════════════════════════ */
/*  Function 6: predictiveLowAlert                                         */
/* ═════════════════════════════════════════════════════════════════════════ */

export function predictiveLowAlert(
  currentIOB: number,
  currentBG: number,
  isf: number,
  targetLow = 3.9,
): PredictiveAlert | null {
  if (currentIOB <= 0 || isf <= 0) return null;
  const predictedDrop = currentIOB * isf;
  const predictedBG = currentBG - predictedDrop;
  if (predictedBG < targetLow) {
    return {
      type: "predictive_low",
      severity: predictedBG < 3.0 ? "critical" : "warning",
      at_hour: 0, // caller provides window
      predicted_bg: Math.round(predictedBG * 10) / 10,
      message: `IOB ${currentIOB.toFixed(1)}U at ISF ${isf} will take BG to ${predictedBG.toFixed(1)} mmol/L — below ${targetLow}`,
    };
  }
  return null;
}

/* ═════════════════════════════════════════════════════════════════════════ */
/*  Function 7: predictiveHighAlert                                        */
/* ═════════════════════════════════════════════════════════════════════════ */

export function predictiveHighAlert(
  currentBG: number,
  carbsRemaining: number,
  icr: number,
  isf: number,
  currentIOB: number,
  targetHigh = 10.0,
): PredictiveAlert | null {
  if (carbsRemaining <= 0 || icr <= 0 || isf <= 0) return null;
  // Carbs → rise in BG assuming 1U covers `icr` grams and drops by `isf`
  const carbRise = (carbsRemaining / icr) * isf;
  const iobDrop = currentIOB * isf;
  const predictedBG = currentBG + carbRise - iobDrop;
  if (predictedBG > targetHigh) {
    return {
      type: "predictive_high",
      severity: predictedBG > 14 ? "critical" : "warning",
      at_hour: 0,
      predicted_bg: Math.round(predictedBG * 10) / 10,
      message: `${carbsRemaining}g carbs uncovered will take BG to ${predictedBG.toFixed(1)} mmol/L — above ${targetHigh}`,
    };
  }
  return null;
}

/* ═════════════════════════════════════════════════════════════════════════ */
/*  Function 8: applyWhatIfScenario                                        */
/* ═════════════════════════════════════════════════════════════════════════ */

export function applyWhatIfScenario(
  actualDoses: InsulinDose[],
  scenario: WhatIfScenario,
  profiles: readonly InsulinProfile[],
  startHour = 0,
  endHour = 24,
): WhatIfResult {
  const originalCurve = generateStackedCurve(actualDoses, profiles, startHour, endHour);
  const modifiedCurve = generateStackedCurve(scenario.modified_doses, profiles, startHour, endHour);

  const originalPeak = originalCurve.reduce((m, p) => Math.max(m, p.total_iob), 0);
  const modifiedPeak = modifiedCurve.reduce((m, p) => Math.max(m, p.total_iob), 0);

  const threshold = 0.5 * originalPeak;
  const originalOverlapHours =
    originalCurve.filter((p) => p.total_iob >= threshold).length * (15 / 60);
  const modifiedOverlapHours =
    modifiedCurve.filter((p) => p.total_iob >= threshold).length * (15 / 60);

  return {
    original_curve: originalCurve,
    modified_curve: modifiedCurve,
    peak_delta: Math.round((modifiedPeak - originalPeak) * 100) / 100,
    overlap_hours_delta: Math.round((modifiedOverlapHours - originalOverlapHours) * 10) / 10,
  };
}

/* ═════════════════════════════════════════════════════════════════════════ */
/*  Function 9: analyzeBasalCoverage                                       */
/* ═════════════════════════════════════════════════════════════════════════ */

export function analyzeBasalCoverage(
  basalDoses: InsulinDose[],
  profiles: readonly InsulinProfile[],
  troughThreshold = 0.15,
): BasalCoverageAnalysis {
  const totalUnits = basalDoses.reduce((s, d) => s + d.dose_units, 0);
  const curve = generateStackedCurve(basalDoses, profiles);

  let troughValue = Infinity;
  let troughHour: number | null = null;
  for (const p of curve) {
    if (p.total_iob < troughValue) {
      troughValue = p.total_iob;
      troughHour = p.hours;
    }
  }

  const minFloor = basalDoses.length > 0 ? totalUnits * troughThreshold : 0;
  let floorIntegrity: BasalCoverageAnalysis["floor_integrity"] = "continuous";
  const findings: string[] = [];

  if (troughValue < minFloor) {
    floorIntegrity = "gapped";
    findings.push(
      `Basal trough at ${troughHour != null ? formatHour(troughHour) : "?"} drops to ${troughValue.toFixed(1)}U — below floor threshold ${minFloor.toFixed(1)}U`,
    );
  }

  // Detect overlap windows (> 80% of peak)
  const peak = curve.reduce((m, p) => Math.max(m, p.total_iob), 0);
  const overlapWindows: Array<{ start_hour: number; end_hour: number }> = [];
  let windowStart: number | null = null;
  for (const p of curve) {
    if (p.total_iob > peak * 0.8) {
      if (windowStart === null) windowStart = p.hours;
    } else if (windowStart !== null) {
      overlapWindows.push({ start_hour: windowStart, end_hour: p.hours });
      windowStart = null;
    }
  }
  if (windowStart !== null) {
    overlapWindows.push({ start_hour: windowStart, end_hour: 24 });
  }
  if (overlapWindows.length > 0) {
    if (floorIntegrity === "continuous") floorIntegrity = "overlapping";
    findings.push(`${overlapWindows.length} basal overlap window(s) detected`);
  }

  return {
    total_basal_units: Math.round(totalUnits * 10) / 10,
    split_description: `${basalDoses.length}-dose basal split, ${totalUnits.toFixed(1)}U/day total`,
    floor_integrity: floorIntegrity,
    trough_hour: troughHour,
    trough_value: Math.round(troughValue * 100) / 100,
    overlap_windows: overlapWindows,
    findings,
  };
}

/* ═════════════════════════════════════════════════════════════════════════ */
/*  Function 10: calculateReportKPIs                                       */
/* ═════════════════════════════════════════════════════════════════════════ */

export function calculateReportKPIs(
  doses: InsulinDose[],
  profiles: readonly InsulinProfile[],
  overlapThreshold = 0.5,
  curve?: IOBCurvePoint[],
): ReportKPIs {
  const sampled = curve ?? generateStackedCurve(doses, profiles);
  const peak = sampled.reduce(
    (acc, p) => (p.total_iob > acc.total_iob ? p : acc),
    sampled[0] ?? { hours: 0, total_iob: 0, time_label: "", breakdown: {} },
  );
  const trough = sampled.reduce(
    (acc, p) => (p.total_iob < acc.total_iob ? p : acc),
    sampled[0] ?? { hours: 0, total_iob: 0, time_label: "", breakdown: {} },
  );
  const peakIOB = peak?.total_iob ?? 0;
  const strongThreshold = peakIOB * overlapThreshold;
  const strongPoints = sampled.filter((p) => p.total_iob >= strongThreshold).length;
  const strongHours = Math.round((strongPoints * 15 / 60) * 10) / 10;

  const basalDoses = doses.filter((d) => d.dose_type === "basal_injection");
  const bolusDoses = doses.filter((d) => d.dose_type === "bolus" || d.dose_type === "correction");

  return {
    peak_iob: Math.round(peakIOB * 100) / 100,
    peak_hour: peak?.hours ?? 0,
    trough_iob: Math.round((trough?.total_iob ?? 0) * 100) / 100,
    trough_hour: trough?.hours ?? 0,
    hours_strong_or_overlap: strongHours,
    total_daily_basal: Math.round(basalDoses.reduce((s, d) => s + d.dose_units, 0) * 10) / 10,
    total_daily_bolus: Math.round(bolusDoses.reduce((s, d) => s + d.dose_units, 0) * 10) / 10,
  };
}

/* ═════════════════════════════════════════════════════════════════════════ */
/*  Function 11: generateInjectionMarkers                                  */
/* ═════════════════════════════════════════════════════════════════════════ */

export function generateInjectionMarkers(
  doses: InsulinDose[],
  profiles: readonly InsulinProfile[],
): InjectionMarker[] {
  return doses.map((dose) => {
    const profile = profiles.find((p) => p.brand_name.toLowerCase() === dose.insulin_name.toLowerCase());
    const hour = parseAdministeredHour(dose.administered_at);
    return {
      dose_id: dose.id,
      hour,
      label: `${dose.insulin_name} ${dose.dose_units}U @ ${formatHour(hour)}`,
      colour: profile?.colour ?? "#6B7280",
      dose_type: dose.dose_type,
    };
  });
}

/* ═════════════════════════════════════════════════════════════════════════ */
/*  Function 12: getHistoryWindow                                          */
/* ═════════════════════════════════════════════════════════════════════════ */

export const TIER_CONFIG: Record<Tier, TierLimits> = {
  clinical: {
    historicalDays: Infinity,
    whatIfScenarios: Infinity,
    aiInsights: true,
    clinicalReport: true,
    exportPdf: true,
    predictiveAlerts: true,
    maxProfiles: 50,
  },
  enterprise: {
    historicalDays: Infinity,
    whatIfScenarios: Infinity,
    aiInsights: true,
    clinicalReport: true,
    exportPdf: true,
    predictiveAlerts: true,
    maxProfiles: Infinity,
  },
  free: {
    historicalDays: 7,
    whatIfScenarios: 1,
    aiInsights: false,
    clinicalReport: false,
    exportPdf: false,
    predictiveAlerts: false,
    maxProfiles: 1,
  },
  pro: {
    historicalDays: 30,
    whatIfScenarios: 5,
    aiInsights: true,
    clinicalReport: false,
    exportPdf: true,
    predictiveAlerts: true,
    maxProfiles: 3,
  },
};

export function getHistoryWindow(tier: Tier): { days: number; since: Date } {
  const limits = TIER_CONFIG[tier];
  const days = Number.isFinite(limits.historicalDays) ? limits.historicalDays : 365;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return { days, since };
}
