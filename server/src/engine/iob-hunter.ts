/**
 * GluMira™ V7 — IOB Hunter™ Pharmacokinetic Engine
 *
 * Core calculations:
 *   - Pure exponential decay: IOB(t) = dose × e^(−λt)
 *   - Gaussian peak modifier for peaked insulins
 *   - Stacking score (sum of all active IOB at a point in time)
 *   - Pressure classification (Light / Moderate / Strong / Overlap)
 *
 * The 13-insulin ZA-NAM formulary is locked — PK parameters are NOT user-editable.
 * GluMira™ is an educational platform, not a medical device.
 */

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

export interface InsulinProfile {
  id: string;
  name: string;
  type:
    | "ultra_rapid"
    | "rapid"
    | "short"
    | "intermediate"
    | "long"
    | "ultra_long"
    | "mixed";
  group: "peaked" | "peakless";
  onset_minutes: number;
  peak_minutes: number | null; // null for peakless
  duration_minutes: number;
  half_life_minutes: number;
  peak_sigma: number | null; // Gaussian peak width, null for peakless
}

export interface InsulinEvent {
  id: string;
  event_time: string; // ISO 8601
  insulin_type: string; // matches InsulinProfile.id
  dose_units: number;
}

export interface IOBPoint {
  time: string; // ISO 8601
  iob: number;
}

export interface StackingPoint {
  time: string; // ISO 8601
  totalIOB: number;
  pressure: PressureClass;
}

export type PressureClass = "light" | "moderate" | "strong" | "overlap";

/* ═══════════════════════════════════════════════════════════════════════════
   13-INSULIN ZA-NAM FORMULARY  (locked PK parameters)
   ═══════════════════════════════════════════════════════════════════════════ */

export const FORMULARY: InsulinProfile[] = [
  // ── Ultra-rapid ────────────────────────────────────────────────────────
  {
    id: "fiasp",
    name: "Fiasp (faster aspart)",
    type: "ultra_rapid",
    group: "peaked",
    onset_minutes: 2.5,
    peak_minutes: 75, // mid-point of 60-90
    duration_minutes: 240, // mid-point of 180-300
    half_life_minutes: 90,
    peak_sigma: 20,
  },

  // ── Rapid ──────────────────────────────────────────────────────────────
  {
    id: "novorapid",
    name: "NovoRapid (aspart)",
    type: "rapid",
    group: "peaked",
    onset_minutes: 15,
    peak_minutes: 120, // mid-point of 60-180
    duration_minutes: 240, // mid-point of 180-300
    half_life_minutes: 90,
    peak_sigma: 40,
  },
  {
    id: "humalog",
    name: "Humalog (lispro)",
    type: "rapid",
    group: "peaked",
    onset_minutes: 15,
    peak_minutes: 105, // mid-point of 60-150
    duration_minutes: 240,
    half_life_minutes: 90,
    peak_sigma: 35,
  },
  {
    id: "apidra",
    name: "Apidra (glulisine)",
    type: "rapid",
    group: "peaked",
    onset_minutes: 15,
    peak_minutes: 90, // mid-point of 60-120
    duration_minutes: 240,
    half_life_minutes: 90,
    peak_sigma: 30,
  },

  // ── Short-acting ───────────────────────────────────────────────────────
  {
    id: "actrapid",
    name: "Actrapid (regular / soluble)",
    type: "short",
    group: "peaked",
    onset_minutes: 30,
    peak_minutes: 180, // mid-point of 120-240
    duration_minutes: 420, // mid-point of 360-480
    half_life_minutes: 180,
    peak_sigma: 50,
  },

  // ── Intermediate ───────────────────────────────────────────────────────
  {
    id: "nph",
    name: "NPH (isophane)",
    type: "intermediate",
    group: "peaked",
    onset_minutes: 90,
    peak_minutes: 480, // mid-point of 240-720
    duration_minutes: 900, // mid-point of 720-1080
    half_life_minutes: 360,
    peak_sigma: 120,
  },

  // ── Long-acting (peakless) ─────────────────────────────────────────────
  {
    id: "levemir",
    name: "Levemir (detemir)",
    type: "long",
    group: "peakless",
    onset_minutes: 60,
    peak_minutes: null,
    duration_minutes: 1440, // 24 h
    half_life_minutes: 720, // 12 h
    peak_sigma: null,
  },
  {
    id: "lantus",
    name: "Lantus (glargine U-100)",
    type: "long",
    group: "peakless",
    onset_minutes: 90,
    peak_minutes: null,
    duration_minutes: 1440,
    half_life_minutes: 720,
    peak_sigma: null,
  },
  {
    id: "basaglar",
    name: "Basaglar (glargine U-100 biosimilar)",
    type: "long",
    group: "peakless",
    onset_minutes: 90,
    peak_minutes: null,
    duration_minutes: 1440,
    half_life_minutes: 720,
    peak_sigma: null,
  },
  {
    id: "toujeo",
    name: "Toujeo (glargine U-300)",
    type: "long",
    group: "peakless",
    onset_minutes: 360, // 6 h slow onset
    peak_minutes: null,
    duration_minutes: 2160, // 36 h
    half_life_minutes: 1080, // 18 h
    peak_sigma: null,
  },

  // ── Ultra-long (peakless) ──────────────────────────────────────────────
  {
    id: "tresiba",
    name: "Tresiba (degludec)",
    type: "ultra_long",
    group: "peakless",
    onset_minutes: 60,
    peak_minutes: null,
    duration_minutes: 2520, // 42 h
    half_life_minutes: 1500, // 25 h
    peak_sigma: null,
  },

  // ── Mixed ──────────────────────────────────────────────────────────────
  {
    id: "novomix30",
    name: "NovoMix 30 (30% aspart / 70% protamine aspart)",
    type: "mixed",
    group: "peaked",
    onset_minutes: 15,
    peak_minutes: 120,
    duration_minutes: 1440,
    half_life_minutes: 480,
    peak_sigma: 90,
  },
  {
    id: "ryzodeg",
    name: "Ryzodeg (70% degludec / 30% aspart)",
    type: "mixed",
    group: "peaked",
    onset_minutes: 15,
    peak_minutes: 120,
    duration_minutes: 2520,
    half_life_minutes: 1200,
    peak_sigma: 90,
  },
];

/** Lookup map for O(1) access by id */
export const FORMULARY_MAP: Record<string, InsulinProfile> = Object.fromEntries(
  FORMULARY.map((p) => [p.id, p])
);

/* ═══════════════════════════════════════════════════════════════════════════
   CORE CALCULATIONS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Pure exponential decay.
 * IOB(t) = dose × e^(−λt)  where λ = ln(2) / halfLife
 *
 * Returns 0 when t < 0 (before dose) or when the result falls below a
 * negligible threshold (< 0.001 U).
 */
export function calculateIOB(
  dose: number,
  minutesSinceDose: number,
  halfLifeMinutes: number
): number {
  if (minutesSinceDose < 0 || dose <= 0) return 0;
  const lambda = Math.LN2 / halfLifeMinutes;
  const iob = dose * Math.exp(-lambda * minutesSinceDose);
  return iob < 0.001 ? 0 : iob;
}

/**
 * Gaussian peak modifier.
 * Scales IOB by a bell curve centred at `peakMinutes` with width `sigma`.
 * The modifier is normalised so that at t = peakMinutes the value = 1.0.
 *
 *   modifier(t) = e^( −(t − peak)² / (2σ²) )
 *   result      = iob × modifier(t)
 */
export function applyGaussianPeak(
  iob: number,
  minutesSinceDose: number,
  peakMinutes: number,
  sigma: number
): number {
  const diff = minutesSinceDose - peakMinutes;
  const modifier = Math.exp(-(diff * diff) / (2 * sigma * sigma));
  return iob * modifier;
}

/**
 * Combined active IOB for a single dose at a given elapsed time.
 *
 * Peaked insulins  → exponential decay × Gaussian peak
 * Peakless insulins → pure exponential decay (flat activity profile)
 *
 * Returns 0 before onset or after duration.
 */
export function getActiveIOB(
  dose: number,
  minutesSinceDose: number,
  profile: InsulinProfile
): number {
  if (minutesSinceDose < profile.onset_minutes) return 0;
  if (minutesSinceDose > profile.duration_minutes) return 0;

  const baseIOB = calculateIOB(dose, minutesSinceDose, profile.half_life_minutes);

  if (profile.group === "peakless") {
    return baseIOB;
  }

  // Peaked: apply Gaussian modifier
  return applyGaussianPeak(
    baseIOB,
    minutesSinceDose,
    profile.peak_minutes!,
    profile.peak_sigma!
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STACKING & CURVES
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Sum of active IOB from all events at a single point in time.
 */
export function calculateStackingScore(
  events: InsulinEvent[],
  atTime: Date
): number {
  let total = 0;
  const atMs = atTime.getTime();

  for (const ev of events) {
    const profile = FORMULARY_MAP[ev.insulin_type];
    if (!profile) continue;

    const elapsed = (atMs - new Date(ev.event_time).getTime()) / 60_000;
    total += getActiveIOB(ev.dose_units, elapsed, profile);
  }

  return total;
}

/**
 * Generate an IOB curve for a single insulin event at 5-minute intervals.
 */
export function generateIOBCurve(
  events: InsulinEvent[],
  startTime: Date,
  endTime: Date
): IOBPoint[] {
  const STEP_MS = 5 * 60_000; // 5 minutes
  const points: IOBPoint[] = [];
  let t = startTime.getTime();
  const end = endTime.getTime();

  while (t <= end) {
    const dt = new Date(t);
    let iob = 0;
    for (const ev of events) {
      const profile = FORMULARY_MAP[ev.insulin_type];
      if (!profile) continue;
      const elapsed = (t - new Date(ev.event_time).getTime()) / 60_000;
      iob += getActiveIOB(ev.dose_units, elapsed, profile);
    }
    points.push({ time: dt.toISOString(), iob: Math.round(iob * 1000) / 1000 });
    t += STEP_MS;
  }

  return points;
}

/**
 * Generate a stacking curve with pressure classification at each point.
 */
export function generateStackingCurve(
  events: InsulinEvent[],
  startTime: Date,
  endTime: Date
): StackingPoint[] {
  const raw = generateIOBCurve(events, startTime, endTime);
  const maxIOB = raw.reduce((m, p) => Math.max(m, p.iob), 0) || 1;

  return raw.map((p) => ({
    time: p.time,
    totalIOB: p.iob,
    pressure: classifyPressure(p.iob, maxIOB),
  }));
}

/**
 * Classify insulin pressure based on the ratio of current IOB to the
 * maximum IOB observed in the window.
 *
 *   Light    < 25%
 *   Moderate   25-50%
 *   Strong     50-75%
 *   Overlap  > 75%
 */
export function classifyPressure(
  stackingScore: number,
  maxScore: number
): PressureClass {
  if (maxScore <= 0) return "light";
  const ratio = stackingScore / maxScore;
  if (ratio < 0.25) return "light";
  if (ratio < 0.5) return "moderate";
  if (ratio < 0.75) return "strong";
  return "overlap";
}
