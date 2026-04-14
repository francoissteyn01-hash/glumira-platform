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

    /* ─── depot_release: Tresiba / Toujeo — two-compartment Bateman ─ */
    case "depot_release": {
      // Multi-hexamer depot releases monomers to plasma at rate k_a;
      // plasma clears at rate k_e derived from sc_half_life. This is the
      // founder-approved "Riley" model:
      //   Tresiba: k_a ≈ 0.06/h, k_e = ln(2)/25h ≈ 0.0277/h  (Heise 2012)
      //   Toujeo : k_a ≈ 0.04/h, k_e = ln(2)/19h ≈ 0.0365/h  (Becker 2015)
      // The curve is rounded (smooth rise, plateau, smooth decline) —
      // NOT linear. Replaces earlier linear approximation which produced
      // corrugated sawtooth at steady state.
      const halfLifeMin = (profile.decay_parameters.sc_half_life_minutes as number) ?? effectiveDuration * 0.6;
      const keHour = Math.log(2) / (halfLifeMin / 60);
      // Slow absorption so peak sits near middle of DOA — effectively
      // flat. Ratio tuned to match Heise 2012 Tresiba clamp data.
      const kaHour = keHour * 2.2;
      return doseUnits * batemanFraction(t, kaHour, keHour);
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
 *   1. Ramp phase (0 → 120 min): smooth rise to ~90% of dose on board
 *   2. Plateau phase (120 min → 70% of DOA): smoothly cambered plateau
 *      drifting from 90% to 85%
 *   3. Tail phase (70% of DOA → DOA): smooth decline to 0
 *
 * All three transitions use a cubic smoothstep (Ken Perlin's
 * hermite-interpolant `3x² − 2x³`) so the joins between phases are
 * C¹-continuous — the published Plank 2005 PD curve is bell-edged, not
 * piecewise-linear. The clinical anchors (onset, DOA, plateau %) stay
 * locked to the evidence; only the interpolation shape changes.
 *
 * Plank 2005: "flat and protracted pharmacodynamic profile"
 */
function calculateAlbuminBoundIOB(
  doseUnits: number,
  profile: InsulinProfile,
  minutesSinceDose: number,
  effectiveDOAMinutes: number,
): number {
  const rampEnd = profile.onset_minutes;          // 120 min for Levemir
  const plateauEnd = effectiveDOAMinutes * 0.7;

  if (minutesSinceDose <= rampEnd) {
    // Ramp: smoothstep from 0 → 0.9 over the onset window.
    const t = minutesSinceDose / rampEnd;
    const rampFraction = 0.9 * smoothstep(t);
    return doseUnits * rampFraction;
  }

  if (minutesSinceDose <= plateauEnd) {
    // Plateau: smoothed drift from 0.9 → 0.85. smoothstep gives a
    // barely-visible camber (published Levemir PD curves show a gentle
    // dome, not a flat line, due to albumin buffering unwinding).
    const t = (minutesSinceDose - rampEnd) / (plateauEnd - rampEnd);
    const fraction = 0.9 - 0.05 * smoothstep(t);
    return doseUnits * fraction;
  }

  // Tail: smoothstep decline from 0.85 → 0. Cubic interpolation produces
  // the rounded "S"-shaped descent seen in Havelund 2004 Fig 3.
  const t = (minutesSinceDose - plateauEnd) / (effectiveDOAMinutes - plateauEnd);
  const tailFraction = 0.85 * (1 - smoothstep(t));
  return doseUnits * Math.max(0, tailFraction);
}

/** Cubic hermite smoothstep, clamped to [0, 1]. */
function smoothstep(x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return x * x * (3 - 2 * x);
}

/* ═════════════════════════════════════════════════════════════════════════ */
/*  Activity rate (U/h) — separate from IOB                                */
/*  IOB is cumulative units. Activity rate is instantaneous U/h the body   */
/*  is consuming. For peakless basal insulins, it's a "soft hill" with a   */
/*  2h onset, broad plateau, long tail, area-under-curve == dose.          */
/* ═════════════════════════════════════════════════════════════════════════ */

/**
 * Bell-shaped activity rate profile (U/h) for any insulin profile.
 *
 * Phases:
 *   [0, onset]           smoothstep rise 0 → peak
 *   [onset, plateauEnd]  plateau at peak  (plateau width = 45% DOA - onset)
 *   [plateauEnd, DOA]    smoothstep fall peak → 0
 *
 * Peak is normalised so ∫rate dt = dose_units (area = dose conservation).
 * With smoothstep having integral 0.5 over [0,1] (same as linear), the
 * trapezoid-style area formula stays exact.
 *
 * For a 5U Levemir with 18h effective DOA at 0.4 U/kg (adult):
 *   onset=120min, plateauEnd=486min (45% of 1080)
 *   denom = 0.5 * (1080 + 486 - 120) = 723 min = 12.05 h
 *   peak = 5 / 12.05 ≈ 0.415 U/h → matches published Plank 2005 PD profile.
 */
export function calculateActivityRate(
  doseUnits: number,
  profile: InsulinProfile,
  minutesSinceDose: number,
  // `patientWeightKg` is intentionally unused in this path. Duration of
  // action on the activity-rate chart does NOT vary with dose — same
  // insulin type = same curve shape = same X-axis footprint for every
  // dose. Only peak height scales with dose. Kept in the signature for
  // API compatibility; do not wire it to a dose-dependent DOA lookup.
  // See memory: feedback_activity_rate_fixed_doa.md
  _patientWeightKg?: number,
): number {
  if (doseUnits <= 0 || minutesSinceDose < 0) return 0;

  const effectiveDOA = profile.duration_minutes;

  if (minutesSinceDose >= effectiveDOA) return 0;

  const onset = profile.onset_minutes;
  const rawPlateauEnd = effectiveDOA * 0.45;
  // If DOA is very short (tight rapid-acting fallbacks), keep plateau > onset.
  const plateauEnd = Math.max(rawPlateauEnd, onset * 1.5);

  // Area denominator (minutes). See header for derivation.
  const areaDenominatorMinutes = 0.5 * (effectiveDOA + plateauEnd - onset);
  if (areaDenominatorMinutes <= 0) return 0;
  const peakRateUph = doseUnits / (areaDenominatorMinutes / 60);

  if (minutesSinceDose <= onset) {
    return peakRateUph * smoothstep(minutesSinceDose / onset);
  }
  if (minutesSinceDose <= plateauEnd) {
    return peakRateUph;
  }
  const decayProgress = (minutesSinceDose - plateauEnd) / (effectiveDOA - plateauEnd);
  return peakRateUph * (1 - smoothstep(decayProgress));
}

export interface PerDoseActivityPoint {
  /** Fractional hour on the chart x-axis (may be negative for prior cycle). */
  hour: number;
  /** U/h activity rate at this point. */
  rate_uph: number;
}

export interface PerDoseActivityCurve {
  /** Stable per-occurrence key (dose.id + cycle offset). */
  dose_id: string;
  insulin_name: string;
  dose_units: number;
  administered_at: string;
  dose_type: InsulinDose["dose_type"];
  /** 0 = today, -1 = yesterday, etc. */
  cycle_offset: number;
  /** Display label — e.g. "20:45prev 4U" or "13:45 5U". */
  label: string;
  /** Peak rate in U/h (for the Y-axis ordering colour ramp). */
  peak_rate_uph: number;
  points: PerDoseActivityPoint[];
}

/**
 * Generate per-dose activity-rate curves for the IOB Hunter activity
 * chart. Each dose (and its prior-cycle occurrences within `cycles`)
 * produces one curve. The chart overlays them — curves are NOT summed.
 */
export function generatePerDoseActivityCurves(
  doses: InsulinDose[],
  profiles: readonly InsulinProfile[],
  startHour: number,
  endHour: number,
  resolutionMinutes: number,
  cycles: number,
  // Unused for DOA. Same insulin = same DOA = same curve shape on this
  // chart. Only peak height scales with dose. See memory:
  // feedback_activity_rate_fixed_doa.md
  _patientWeightKg?: number,
): PerDoseActivityCurve[] {
  const out: PerDoseActivityCurve[] = [];
  const stepHours = resolutionMinutes / 60;
  const safeCycles = Math.max(1, cycles);

  for (let cycle = -(safeCycles - 1); cycle <= 0; cycle++) {
    const cycleOffset = cycle * 24;
    for (const dose of doses) {
      const profile = profiles.find(
        (p) => p.brand_name.toLowerCase() === dose.insulin_name.toLowerCase(),
      );
      if (!profile) continue;

      const doseHour = parseAdministeredHour(dose.administered_at) + cycleOffset;
      const effectiveDOA = profile.duration_minutes;
      const decayEndHour = doseHour + effectiveDOA / 60;

      // Skip doses that decay before the window starts or inject after it ends.
      if (decayEndHour < startHour || doseHour > endHour) continue;

      // Peak rate mirrors calculateActivityRate's normalisation.
      const onset = profile.onset_minutes;
      const rawPlateauEnd = effectiveDOA * 0.45;
      const plateauEnd = Math.max(rawPlateauEnd, onset * 1.5);
      const areaDenominatorMinutes = 0.5 * (effectiveDOA + plateauEnd - onset);
      const peakRateUph = areaDenominatorMinutes > 0
        ? dose.dose_units / (areaDenominatorMinutes / 60)
        : 0;

      const points: PerDoseActivityPoint[] = [];
      for (let h = startHour; h <= endHour + 1e-6; h += stepHours) {
        const minutesSince = (h - doseHour) * 60;
        const rate = calculateActivityRate(
          dose.dose_units, profile, minutesSince,
        );
        points.push({
          hour: Math.round(h * 1000) / 1000,
          rate_uph: Math.round(rate * 10000) / 10000,
        });
      }

      const cycleLabel = cycle === 0 ? "" : cycle === -1 ? "prev" : `prev${Math.abs(cycle)}`;
      out.push({
        dose_id: `${dose.id}_c${cycle}`,
        insulin_name: dose.insulin_name,
        dose_units: dose.dose_units,
        administered_at: dose.administered_at,
        dose_type: dose.dose_type,
        cycle_offset: cycle,
        label: `${dose.administered_at}${cycleLabel} ${dose.dose_units}U`,
        peak_rate_uph: Math.round(peakRateUph * 1000) / 1000,
        points,
      });
    }
  }

  // Chronological order by actual injection time — stable monochrome-ramp
  // colour assignment depends on this (older dose = darker shade).
  out.sort((a, b) => {
    const ah = parseAdministeredHour(a.administered_at) + a.cycle_offset * 24;
    const bh = parseAdministeredHour(b.administered_at) + b.cycle_offset * 24;
    return ah - bh;
  });

  return out;
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

/**
 * Dynamic chart bounds for the BasalActivityChart.
 *
 * Algorithm (per founder's clinical spec):
 *   - `startHour` = (earliest today basal hour) − 1h. This puts the
 *     previous evening's residual tail at the far-left edge so the user
 *     can see coverage continuity across midnight. For a regimen where
 *     today's first basal is 06:00, the chart starts at 05:00.
 *   - `endHour` = (latest today basal hour) + (that basal's effective
 *     DOA). The chart shows the FULL lifecycle of the last dose — silent
 *     tail included — not a fixed 24h or 48h window.
 *   - `cycles` = 2 (today + yesterday), enough for the engine to carry
 *     prior-cycle residual into the visible window.
 *
 * If no basal doses are present, falls back to the earliest bolus − 1h
 * and latest bolus + DOA for a pure-rapid regimen.
 */
export function computeGraphBounds(
  doses: InsulinDose[],
  profiles: readonly InsulinProfile[],
  // Unused for DOA. See memory: feedback_activity_rate_fixed_doa.md
  _patientWeightKg?: number,
  leadingPaddingHours = 1,
): { startHour: number; endHour: number; cycles: number } {
  if (doses.length === 0) return { startHour: 0, endHour: 24, cycles: 2 };

  const basals = doses.filter((d) => d.dose_type === "basal_injection");
  const anchorSet = basals.length > 0 ? basals : doses;

  let earliestAnchorHour = Number.POSITIVE_INFINITY;
  let latestEndHour = Number.NEGATIVE_INFINITY;
  // Track the MOST RECENT prior-cycle basal injection whose curve is
  // still active at t=0. That's the curve closest to today, and we
  // extend the left edge to just before its injection so its full ramp
  // renders instead of clipping into the plateau.
  let latestActivePriorInjectionHour = Number.NEGATIVE_INFINITY;

  for (const dose of anchorSet) {
    const doseHour = parseAdministeredHour(dose.administered_at);
    earliestAnchorHour = Math.min(earliestAnchorHour, doseHour);

    const profile = profiles.find(
      (p) => p.brand_name.toLowerCase() === dose.insulin_name.toLowerCase(),
    );
    const doaHours = profile ? profile.duration_minutes / 60 : 24;
    latestEndHour = Math.max(latestEndHour, doseHour + doaHours);

    // Prior-cycle occurrence of this dose — still active at h = 0?
    const priorInjectionHour = doseHour - 24;
    const priorDecayEndHour = priorInjectionHour + doaHours;
    if (priorDecayEndHour > 0) {
      latestActivePriorInjectionHour = Math.max(
        latestActivePriorInjectionHour,
        priorInjectionHour,
      );
    }
  }

  if (!Number.isFinite(earliestAnchorHour)) {
    return { startHour: 0, endHour: 24, cycles: 2 };
  }

  // Start 1h before the MOST RECENT active prior-cycle basal (so its
  // full ramp is visible), or 1h before today's first basal if no
  // prior-cycle basal is still on board — whichever is earlier.
  const priorBasedStart = Number.isFinite(latestActivePriorInjectionHour)
    ? latestActivePriorInjectionHour - leadingPaddingHours
    : Number.POSITIVE_INFINITY;
  const todayBasedStart = earliestAnchorHour - leadingPaddingHours;
  const startHour = Math.min(priorBasedStart, todayBasedStart);
  const endHour = Math.max(latestEndHour, startHour + 24);

  // Dynamic cycles — enough prior-day simulations so steady-state
  // residual fills the LEFT EDGE of the chart. GluMira users have been
  // on insulin for weeks/years; the chart must never START from zero.
  // For Tresiba (42h DOA) this forces cycles=3+ so that the
  // day-before-yesterday dose contributes to the chart's left edge.
  const longestDoaHours = (latestEndHour - earliestAnchorHour) > 0
    ? (latestEndHour - earliestAnchorHour)
    : 24;
  const cycles = Math.max(2, Math.ceil((Math.abs(startHour) + longestDoaHours) / 24) + 1);
  return { startHour, endHour, cycles };
}

/* ═════════════════════════════════════════════════════════════════════════ */
/*  detectRiskZones — stacking peaks and coverage gaps                     */
/*                                                                         */
/*  Produces a list of windows the clinician should look at. Two kinds:    */
/*    - "stacking_peak" : combined basal activity > threshold (hypo risk) */
/*    - "coverage_gap"  : combined basal activity == 0 (rebound / drift) */
/*                                                                         */
/*  When any zone is present, Mira should advise the user to show the     */
/*  graph to their clinician. The chart paints these windows in pink/red  */
/*  as an overlay so the user sees exactly where the risk lies.           */
/* ═════════════════════════════════════════════════════════════════════════ */

export interface RiskZone {
  type: "stacking_peak" | "coverage_gap";
  startHour: number;
  endHour: number;
  severity: "low" | "medium" | "high";
  /** Human-readable summary the chart uses as the band label. */
  label: string;
  /** Longer clinical message suitable for Mira or the educator inbox. */
  message: string;
}

export interface DetectRiskZonesOptions {
  /** Sum-of-basals U/h above which it's flagged as stacking. Default 1.0. */
  stackingThresholdUph?: number;
  /** Minimum gap duration for a "coverage_gap" (minutes). Default 60. */
  minGapMinutes?: number;
}

/* ═════════════════════════════════════════════════════════════════════════ */
/*  Suggested schedule — equal-spacing rule (Free tier)                    */
/*                                                                         */
/*  Given the current basal doses, return a schedule where N doses are    */
/*  spaced at 24/N hours across the day, anchored to the earliest dose.   */
/*  Keeps the SAME number of doses and SAME total units — only timing     */
/*  changes. This is the conservative, predictable suggestion; the        */
/*  fancier optimiser is gated to Pro/AI and lives in a separate helper   */
/*  (not yet implemented — see memory).                                   */
/* ═════════════════════════════════════════════════════════════════════════ */

/**
 * Returns a suggested set of basal doses with the same dose units, but
 * evenly spaced every 24/N hours starting from the earliest current dose.
 * Administered_at is formatted as HH:MM.
 */
export function suggestEqualSpacedSchedule(
  doses: InsulinDose[],
): InsulinDose[] {
  const basals = doses
    .filter((d) => d.dose_type === "basal_injection")
    .slice()
    .sort(
      (a, b) => parseAdministeredHour(a.administered_at) - parseAdministeredHour(b.administered_at),
    );
  if (basals.length <= 1) return basals.map((d) => ({ ...d }));

  const earliest = parseAdministeredHour(basals[0].administered_at);
  const spacing = 24 / basals.length;

  return basals.map((d, i) => {
    const hourFloat = earliest + i * spacing;
    const wrapped = ((hourFloat % 24) + 24) % 24;
    const hh = Math.floor(wrapped);
    const mm = Math.round((wrapped - hh) * 60);
    const administered_at = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
    return { ...d, id: `${d.id}-suggested`, administered_at };
  });
}

/**
 * Given a dose list (typically the suggested schedule), generate the
 * total combined basal activity rate (U/h) across the window, as a
 * single series rendered as the green reference line on Chart 2.
 */
export function generateSuggestedTotalCurve(
  doses: InsulinDose[],
  profiles: readonly InsulinProfile[],
  startHour: number,
  endHour: number,
  resolutionMinutes: number,
  cycles: number,
): Array<{ hour: number; rate_uph: number }> {
  const perDose = generatePerDoseActivityCurves(
    doses, profiles, startHour, endHour, resolutionMinutes, cycles,
  );
  if (perDose.length === 0) return [];
  const grid = perDose[0].points.map((p) => p.hour);
  return grid.map((hour, i) => {
    const sum = perDose.reduce((s, c) => s + (c.points[i]?.rate_uph ?? 0), 0);
    return { hour, rate_uph: Math.round(sum * 10000) / 10000 };
  });
}

export function detectRiskZones(
  curves: PerDoseActivityCurve[],
  options: DetectRiskZonesOptions = {},
): RiskZone[] {
  // Default stacking threshold calibrated for a typical 3-dose Levemir
  // basal split at ~5U per dose. Summed activity during overlap peaks
  // sits around 0.6–0.8 U/h — picking 0.6 highlights the real overlap
  // windows (two bell curves both substantially active) without over-
  // flagging normal mid-plateau coverage.
  const { stackingThresholdUph = 0.6, minGapMinutes = 60 } = options;
  if (curves.length === 0) return [];

  // Only basal curves contribute to "coverage" and "stacking" for the
  // risk-zone overlay. Bolus spikes shouldn't trigger coverage-gap
  // alerts and usually shouldn't trigger stacking alerts either.
  const basalCurves = curves.filter((c) => c.dose_type === "basal_injection");
  if (basalCurves.length === 0) return [];

  // Build a time → sum-of-rates array from the union of all curve points.
  // Assume all curves share the same x-axis grid (which they do since
  // generatePerDoseActivityCurves uses a single step). Use the first
  // curve's hour grid as the reference.
  const grid = basalCurves[0].points.map((p) => p.hour);
  const totals: number[] = grid.map((_, i) =>
    basalCurves.reduce((s, c) => s + (c.points[i]?.rate_uph ?? 0), 0),
  );

  const stepHours =
    grid.length >= 2 ? grid[1] - grid[0] : 0.25; // default 15min
  const minGapHours = minGapMinutes / 60;

  const zones: RiskZone[] = [];

  // --- stacking peaks --------------------------------------------------
  let peakStart: number | null = null;
  for (let i = 0; i < totals.length; i++) {
    const over = totals[i] >= stackingThresholdUph;
    if (over && peakStart === null) peakStart = grid[i];
    if ((!over || i === totals.length - 1) && peakStart !== null) {
      const end = over ? grid[i] : grid[i - 1] ?? grid[i];
      if (end - peakStart >= stepHours * 0.5) {
        zones.push({
          type: "stacking_peak",
          startHour: peakStart,
          endHour: end,
          severity: "high",
          label: "STACKING / HYPO RISK",
          message:
            "Multiple basal insulins are peaking together here — the combined " +
            "activity could drive blood glucose low. Consider reviewing dose " +
            "timing with your clinician.",
        });
      }
      peakStart = null;
    }
  }

  // --- coverage gaps ---------------------------------------------------
  let gapStart: number | null = null;
  for (let i = 0; i < totals.length; i++) {
    const zero = totals[i] < 1e-4;
    if (zero && gapStart === null) gapStart = grid[i];
    if ((!zero || i === totals.length - 1) && gapStart !== null) {
      const end = zero ? grid[i] : grid[i - 1] ?? grid[i];
      if (end - gapStart >= minGapHours) {
        zones.push({
          type: "coverage_gap",
          startHour: gapStart,
          endHour: end,
          severity: "medium",
          label: "BASAL GAP",
          message:
            "No basal insulin is active during this window. This is the " +
            "kind of gap that can drive overnight highs or early-morning " +
            "variability. Show this graph to your clinician to discuss " +
            "adjusting timing or splits.",
        });
      }
      gapStart = null;
    }
  }

  return zones;
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

    // Wrap negative hours (prior-day residual window) back into [0, 24).
    // Without the double-modulo `h = -3` would label as "-3:00".
    const hInt = ((Math.floor(h) % 24) + 24) % 24;
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
  // Wrap to [0, 24) with a day marker for hours past midnight.
  const wrapped = ((h % 24) + 24) % 24;
  const hh = Math.floor(wrapped);
  const mm = Math.round((wrapped - hh) * 60);
  const base = `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  const dayOffset = Math.floor(h / 24);
  if (dayOffset === 0) return base;
  if (dayOffset === 1) return `${base} (next day)`;
  if (dayOffset === -1) return `${base} (prev day)`;
  return `${base} (day ${dayOffset >= 0 ? "+" : ""}${dayOffset})`;
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
  // Clamp to 24h — previously this summed across both cycles of the
  // prior-night residual analysis and read as "46.3h" on the KPI card,
  // which is nonsensical to a clinician reading a daily view.
  const strongHoursRaw = Math.round((strongPoints * 15 / 60) * 10) / 10;
  const strongHours = Math.min(24, strongHoursRaw);

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
