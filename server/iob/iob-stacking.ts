/**
 * GluMira™ Insulin Stacking Analysis Module
 * Version: 7.0.0
 *
 * Analyses multiple overlapping insulin doses to detect stacking risk.
 * Uses the same biexponential IOB decay model as iob.ts but extends it
 * to handle N concurrent doses and compute:
 *   - Combined IOB at any point in time
 *   - Peak stacking window (time range where combined IOB is highest)
 *   - Stacking risk score (0–100)
 *   - Educational narrative for patient display
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 * This module does NOT recommend insulin doses.
 */

export interface StackingDose {
  /** Unique identifier for this dose */
  id: string;
  /** Units of insulin administered */
  units: number;
  /** ISO timestamp when dose was administered */
  administeredAt: string;
  /** Insulin type — determines DIA and peak timing */
  insulinType: "NovoRapid" | "Humalog" | "Apidra" | "Fiasp" | "Tresiba" | "Lantus";
}

export interface StackingProfile {
  /** Duration of insulin action in minutes */
  diaMinutes: number;
  /** Time to peak activity in minutes */
  peakMinutes: number;
  /** Biexponential decay constants */
  alpha: number;
  beta: number;
}

export interface StackingPoint {
  /** Minutes since the earliest dose */
  minutesElapsed: number;
  /** ISO timestamp */
  timestamp: string;
  /** Combined IOB across all doses (units) */
  combinedIob: number;
  /** IOB breakdown per dose */
  perDose: Record<string, number>;
}

export interface StackingAnalysisResult {
  /** All doses included in this analysis */
  doses: StackingDose[];
  /** Timeline of combined IOB at 5-minute intervals */
  timeline: StackingPoint[];
  /** Peak combined IOB value */
  peakIob: number;
  /** Timestamp of peak combined IOB */
  peakAt: string;
  /** Stacking risk score 0–100 */
  riskScore: number;
  /** Risk tier */
  riskTier: "low" | "moderate" | "high" | "critical";
  /** Educational narrative for patient display */
  narrative: string;
  /** Time window (minutes) where combined IOB exceeds 50% of peak */
  highActivityWindowMinutes: number;
}

// ─── Insulin Profiles ─────────────────────────────────────────

const INSULIN_PROFILES: Record<StackingDose["insulinType"], StackingProfile> = {
  // alpha = slower decay constant (smaller value), beta = faster decay constant (larger value)
  // This ensures e^(-alpha*t) - e^(-beta*t) is positive for t > 0
  NovoRapid: { diaMinutes: 240, peakMinutes: 75, alpha: 0.0116, beta: 0.0173 },
  Humalog:   { diaMinutes: 240, peakMinutes: 75, alpha: 0.0116, beta: 0.0173 },
  Apidra:    { diaMinutes: 210, peakMinutes: 60, alpha: 0.0133, beta: 0.0200 },
  Fiasp:     { diaMinutes: 210, peakMinutes: 45, alpha: 0.0155, beta: 0.0233 },
  Tresiba:   { diaMinutes: 2400, peakMinutes: 600, alpha: 0.0005, beta: 0.0007 },
  Lantus:    { diaMinutes: 1440, peakMinutes: 480, alpha: 0.0007, beta: 0.0010 },
};

// ─── Core IOB Calculation ─────────────────────────────────────

/**
 * Calculate IOB remaining for a single dose at a given time offset.
 * Uses biexponential decay: IOB(t) = U * (e^(-alpha*t) - e^(-beta*t)) / normaliser
 */
function singleDoseIob(units: number, minutesElapsed: number, profile: StackingProfile): number {
  if (minutesElapsed < 0) return units;
  if (minutesElapsed >= profile.diaMinutes) return 0;

  const { alpha, beta } = profile;
  const raw = Math.exp(-alpha * minutesElapsed) - Math.exp(-beta * minutesElapsed);
  const normaliser = Math.exp(-alpha * profile.peakMinutes) - Math.exp(-beta * profile.peakMinutes);
  if (normaliser <= 0) return 0;

  const iobFraction = Math.max(0, raw / normaliser);
  // Taper to 0 at DIA boundary
  const taperStart = profile.diaMinutes * 0.8;
  if (minutesElapsed > taperStart) {
    const taperFraction = 1 - (minutesElapsed - taperStart) / (profile.diaMinutes - taperStart);
    return units * iobFraction * Math.max(0, taperFraction);
  }
  return units * iobFraction;
}

// ─── Stacking Analysis ────────────────────────────────────────

export function analyseStacking(doses: StackingDose[], nowIso?: string): StackingAnalysisResult {
  if (doses.length === 0) {
    return {
      doses: [],
      timeline: [],
      peakIob: 0,
      peakAt: nowIso ?? new Date().toISOString(),
      riskScore: 0,
      riskTier: "low",
      narrative: "No doses to analyse.",
      highActivityWindowMinutes: 0,
    };
  }

  const now = nowIso ? new Date(nowIso) : new Date();
  const earliestDose = doses.reduce((min, d) =>
    new Date(d.administeredAt) < new Date(min.administeredAt) ? d : min
  );
  const startTime = new Date(earliestDose.administeredAt);

  // Build timeline at 5-minute resolution for 8 hours
  const RESOLUTION_MINUTES = 5;
  const HORIZON_MINUTES = 480;
  const timeline: StackingPoint[] = [];

  for (let t = 0; t <= HORIZON_MINUTES; t += RESOLUTION_MINUTES) {
    const pointTime = new Date(startTime.getTime() + t * 60_000);
    const perDose: Record<string, number> = {};
    let combinedIob = 0;

    for (const dose of doses) {
      const doseTime = new Date(dose.administeredAt);
      const minutesSinceDose = (pointTime.getTime() - doseTime.getTime()) / 60_000;
      const profile = INSULIN_PROFILES[dose.insulinType];
      const iob = singleDoseIob(dose.units, minutesSinceDose, profile);
      perDose[dose.id] = Math.round(iob * 1000) / 1000;
      combinedIob += iob;
    }

    timeline.push({
      minutesElapsed: t,
      timestamp: pointTime.toISOString(),
      combinedIob: Math.round(combinedIob * 1000) / 1000,
      perDose,
    });
  }

  // Find peak
  const peakPoint = timeline.reduce((max, p) => (p.combinedIob > max.combinedIob ? p : max));
  const peakIob = peakPoint.combinedIob;
  const peakAt = peakPoint.timestamp;

  // High activity window (time above 50% of peak)
  const threshold = peakIob * 0.5;
  const highActivityPoints = timeline.filter((p) => p.combinedIob >= threshold);
  const highActivityWindowMinutes =
    highActivityPoints.length > 0
      ? (highActivityPoints.length - 1) * RESOLUTION_MINUTES
      : 0;

  // Risk score: based on peak IOB relative to typical single-dose IOB
  // Heuristic: 1U = low, 3U = moderate, 5U = high, 8U+ = critical
  const riskScore = Math.min(100, Math.round((peakIob / 8) * 100));
  const riskTier: StackingAnalysisResult["riskTier"] =
    riskScore < 20 ? "low" : riskScore < 45 ? "moderate" : riskScore < 70 ? "high" : "critical";

  // Educational narrative
  const activeDoseCount = doses.filter((d) => {
    const profile = INSULIN_PROFILES[d.insulinType];
    const minutesSince = (now.getTime() - new Date(d.administeredAt).getTime()) / 60_000;
    return minutesSince < profile.diaMinutes;
  }).length;

  const narrative = buildNarrative(doses, peakIob, riskTier, activeDoseCount, highActivityWindowMinutes);

  return {
    doses,
    timeline,
    peakIob: Math.round(peakIob * 100) / 100,
    peakAt,
    riskScore,
    riskTier,
    narrative,
    highActivityWindowMinutes,
  };
}

// ─── Narrative Builder ────────────────────────────────────────

function buildNarrative(
  doses: StackingDose[],
  peakIob: number,
  riskTier: StackingAnalysisResult["riskTier"],
  activeDoseCount: number,
  highActivityWindowMinutes: number
): string {
  const totalUnits = doses.reduce((sum, d) => sum + d.units, 0);
  const doseWord = doses.length === 1 ? "dose" : "doses";

  const tierMessages: Record<StackingAnalysisResult["riskTier"], string> = {
    low: `Your ${doses.length} ${doseWord} (${totalUnits}U total) show minimal stacking. Combined IOB peaks at ${peakIob.toFixed(1)}U — within a typical single-dose range. No educational concern at this time.`,
    moderate: `You have ${activeDoseCount} active ${doseWord} overlapping. Combined IOB peaks at ${peakIob.toFixed(1)}U over a ${highActivityWindowMinutes}-minute window. This is a moderate stacking pattern. GluMira™ recommends reviewing your dose timing with your diabetes care team.`,
    high: `Significant stacking detected across ${doses.length} ${doseWord}. Combined IOB reaches ${peakIob.toFixed(1)}U — this level of overlap can make glucose patterns harder to interpret. This is for educational awareness only. Please consult your diabetes care team.`,
    critical: `High stacking pattern detected. ${doses.length} ${doseWord} produce a combined IOB peak of ${peakIob.toFixed(1)}U sustained over ${highActivityWindowMinutes} minutes. GluMira™ is providing this information for educational purposes only. This is NOT a dosing recommendation. Always consult your diabetes care team before making any changes.`,
  };

  return tierMessages[riskTier];
}

// ─── Utility: Current IOB for a single dose ───────────────────

export function currentIobForDose(dose: StackingDose, nowIso?: string): number {
  const now = nowIso ? new Date(nowIso) : new Date();
  const minutesSince = (now.getTime() - new Date(dose.administeredAt).getTime()) / 60_000;
  const profile = INSULIN_PROFILES[dose.insulinType];
  return Math.round(singleDoseIob(dose.units, minutesSince, profile) * 1000) / 1000;
}

export { INSULIN_PROFILES };
