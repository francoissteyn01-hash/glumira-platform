/**
 * GluMira™ V7 — server/analytics/basal-evaluation.ts
 *
 * Scores overnight basal-rate stability on a 0–10 scale by examining glucose
 * readings during the fasting window 02:00–06:00, where a well-tuned basal
 * should hold glucose roughly flat in the absence of food/correction boluses.
 *
 * Algorithm (educational, NOT a medical recommendation):
 *   1. Group readings into "nights" (each 02:00–06:00 window in the last N days)
 *   2. For each night with ≥3 readings:
 *        drift     = lastValue - firstValue              (mmol/L over ~4h)
 *        anyHypo   = min(values) < 3.9
 *        anyHyper  = max(values) > 12.0
 *   3. Aggregate:
 *        meanDrift  = mean of nightly drift
 *        hypoNights, hyperNights, validNights
 *   4. Score (0–10):
 *        start at 10
 *        − 2 × min(|meanDrift|, 2.0)              (drift penalty, capped)
 *        − 1.5 × hypoFraction                     (hypo penalty)
 *        − 1.0 × hyperFraction                    (hyper penalty)
 *        clamp 0–10
 *   5. Observations are generated from the same signals.
 *
 * GluMira™ is an educational platform, not a medical device.
 * Version: v1.0 · 2026-04-10
 */

export type GlucosePoint = {
  value_mmol: number;
  recorded_at: string;
}

export type ObservationType = "positive" | "warning" | "alert";

export type Observation = {
  type: ObservationType;
  text: string;
}

export type BasalEvaluationResult = {
  score: number;                  // 0–10
  meanDrift: number | null;       // mmol/L (positive = rising, negative = falling)
  validNights: number;
  hypoNights: number;
  hyperNights: number;
  observations: Observation[];
  windowDays: number;
  computedAt: string;
  disclaimer: string;
}

const FAST_START_HOUR = 2;   // 02:00
const FAST_END_HOUR   = 6;   // 06:00
const MIN_READINGS_PER_NIGHT = 3;
const HYPO_THRESHOLD  = 3.9;
const HYPER_THRESHOLD = 12.0;

type NightStat = {
  drift: number;
  anyHypo: boolean;
  anyHyper: boolean;
}

function bucketByNight(readings: GlucosePoint[]): Map<string, GlucosePoint[]> {
  const nights = new Map<string, GlucosePoint[]>();
  for (const r of readings) {
    const d = new Date(r.recorded_at);
    const h = d.getHours();
    if (h < FAST_START_HOUR || h >= FAST_END_HOUR) continue;
    // "Night key" = the calendar date the fasting window belongs to
    const yyyy = d.getFullYear();
    const mm   = String(d.getMonth() + 1).padStart(2, "0");
    const dd   = String(d.getDate()).padStart(2, "0");
    const key  = `${yyyy}-${mm}-${dd}`;
    let arr = nights.get(key);
    if (!arr) { arr = []; nights.set(key, arr); }
    arr.push(r);
  }
  return nights;
}

function summariseNight(readings: GlucosePoint[]): NightStat | null {
  if (readings.length < MIN_READINGS_PER_NIGHT) return null;
  const sorted = [...readings].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
  );
  const first = sorted[0].value_mmol;
  const last  = sorted[sorted.length - 1].value_mmol;
  const min   = Math.min(...sorted.map((r) => r.value_mmol));
  const max   = Math.max(...sorted.map((r) => r.value_mmol));
  return {
    drift:    last - first,
    anyHypo:  min < HYPO_THRESHOLD,
    anyHyper: max > HYPER_THRESHOLD,
  };
}

export function computeBasalEvaluation(
  readings: GlucosePoint[],
  windowDays: number,
): BasalEvaluationResult {
  const nights = bucketByNight(readings);
  const stats: NightStat[] = [];
  for (const [, nightReadings] of nights) {
    const s = summariseNight(nightReadings);
    if (s) stats.push(s);
  }

  if (stats.length === 0) {
    return {
      score: 0,
      meanDrift: null,
      validNights: 0,
      hypoNights: 0,
      hyperNights: 0,
      observations: [{
        type: "warning",
        text: "Not enough overnight glucose data (need ≥3 readings between 02:00 and 06:00).",
      }],
      windowDays,
      computedAt: new Date().toISOString(),
      disclaimer: "GluMira™ is an educational platform, not a medical device.",
    };
  }

  const meanDrift   = stats.reduce((s, x) => s + x.drift, 0) / stats.length;
  const hypoNights  = stats.filter((s) => s.anyHypo).length;
  const hyperNights = stats.filter((s) => s.anyHyper).length;
  const hypoFrac    = hypoNights  / stats.length;
  const hyperFrac   = hyperNights / stats.length;

  const driftPenalty = 2 * Math.min(Math.abs(meanDrift), 2.0);
  const hypoPenalty  = 1.5 * hypoFrac * 10; // scale to score units
  const hyperPenalty = 1.0 * hyperFrac * 10;

  let score = 10 - driftPenalty - hypoPenalty - hyperPenalty;
  if (!Number.isFinite(score)) score = 0;
  score = Math.max(0, Math.min(10, Math.round(score * 10) / 10));

  const observations: Observation[] = [];

  // Drift observation
  if (Math.abs(meanDrift) < 0.5) {
    observations.push({ type: "positive", text: `Overnight glucose stays flat (drift ${meanDrift.toFixed(1)} mmol/L)` });
  } else if (meanDrift > 0.5) {
    observations.push({
      type: meanDrift > 1.5 ? "alert" : "warning",
      text: `Glucose rises overnight by ${meanDrift.toFixed(1)} mmol/L on average — basal may be under-dosed`,
    });
  } else {
    observations.push({
      type: meanDrift < -1.5 ? "alert" : "warning",
      text: `Glucose falls overnight by ${Math.abs(meanDrift).toFixed(1)} mmol/L on average — basal may be over-dosed`,
    });
  }

  // Hypo observation
  if (hypoNights === 0) {
    observations.push({ type: "positive", text: "No nocturnal hypoglycaemia detected" });
  } else {
    observations.push({
      type: hypoFrac > 0.2 ? "alert" : "warning",
      text: `Nocturnal hypos on ${hypoNights} of ${stats.length} nights`,
    });
  }

  // Hyper observation
  if (hyperNights > 0) {
    observations.push({
      type: hyperFrac > 0.3 ? "alert" : "warning",
      text: `Overnight glucose >12 mmol/L on ${hyperNights} of ${stats.length} nights`,
    });
  }

  return {
    score,
    meanDrift: Math.round(meanDrift * 100) / 100,
    validNights: stats.length,
    hypoNights,
    hyperNights,
    observations,
    windowDays,
    computedAt: new Date().toISOString(),
    disclaimer: "GluMira™ is an educational platform, not a medical device.",
  };
}
