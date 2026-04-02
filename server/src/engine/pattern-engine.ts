/**
 * GluMira™ V7 — Pattern Intelligence Engine
 * Analyses 7-day rolling windows to detect 25+ patterns across
 * insulin timing, glucose behaviour, safety, and contextual categories.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { FORMULARY_MAP } from "./iob-hunter";

/* ═══════════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════════ */

export interface DetectedPattern {
  id: string;
  category: "insulin_timing" | "glucose_behaviour" | "safety" | "contextual";
  type: string;
  confidence: "high" | "moderate" | "low";
  time_band: string;
  occurrences: number;
  observation: string;
  suggestion: string;
  context_modifiers: string[];
}

export interface InsulinEvent {
  event_time: string;
  event_type: string;
  insulin_type: string;
  dose_units: number;
}

export interface GlucoseReading {
  time: string;
  value: number; // mmol/L
}

export interface MealLog {
  meal_time: string;
  event_type: string;
  glucose_value: number | null;
  carbs_g: number | null;
}

export interface ConditionEvent {
  event_time: string;
  event_type: string;
  intensity: string | null;
}

export interface UserProfile {
  comorbidities: string[];
  special_conditions: string[];
  dietary_approach: string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   TIME BANDS
   ═══════════════════════════════════════════════════════════════════════════ */

export const TIME_BANDS: Record<string, { start: number; end: number; label: string }> = {
  EARLY_MORNING: { start: 0, end: 6, label: "Early Morning" },
  MORNING:       { start: 6, end: 9, label: "Morning" },
  MID_MORNING:   { start: 9, end: 12, label: "Mid-Morning" },
  AFTERNOON:     { start: 12, end: 17, label: "Afternoon" },
  EVENING:       { start: 17, end: 21, label: "Evening" },
  NIGHT:         { start: 21, end: 24, label: "Night" },
};

function getTimeBand(iso: string): string {
  const h = new Date(iso).getHours();
  for (const [key, band] of Object.entries(TIME_BANDS)) {
    if (h >= band.start && h < band.end) return key;
  }
  return "NIGHT";
}

function confidence(n: number): "high" | "moderate" | "low" {
  if (n >= 5) return "high";
  if (n >= 3) return "moderate";
  return "low";
}

let idCounter = 0;
function nextId(): string { return `pat_${++idCounter}`; }

/* ═══════════════════════════════════════════════════════════════════════════
   ANALYSIS
   ═══════════════════════════════════════════════════════════════════════════ */

export function analysePatterns(
  insulinEvents: InsulinEvent[],
  glucoseReadings: GlucoseReading[],
  mealLogs: MealLog[],
  conditionEvents: ConditionEvent[],
  profile: UserProfile
): DetectedPattern[] {
  idCounter = 0;
  const patterns: DetectedPattern[] = [];
  const modifiers = buildContextModifiers(profile);

  // ── Insulin Timing ─────────────────────────────────────────────────
  detectDoseCompression(insulinEvents, patterns, modifiers);
  detectLateCorrections(insulinEvents, patterns, modifiers);
  detectOverlappingCorrections(insulinEvents, patterns, modifiers);
  detectStackedRapid(insulinEvents, patterns, modifiers);
  detectBasalOverlap(insulinEvents, patterns, modifiers);

  // ── Glucose Behaviour ──────────────────────────────────────────────
  detectOvernightDrift(glucoseReadings, patterns, modifiers);
  detectDawnRise(glucoseReadings, patterns, modifiers);
  detectPostMealSpike(glucoseReadings, mealLogs, patterns, modifiers);
  detectDelayedDrop(glucoseReadings, patterns, modifiers);
  detectRebound(glucoseReadings, patterns, modifiers);
  detectRollercoaster(glucoseReadings, patterns, modifiers);

  // ── Safety ─────────────────────────────────────────────────────────
  detectRepeatedLows(glucoseReadings, patterns, modifiers);
  detectRescueClusters(mealLogs, patterns, modifiers);
  detectMultiLowBand(glucoseReadings, patterns, modifiers);
  detectOvernightRisk(glucoseReadings, insulinEvents, patterns, modifiers);
  detectSameTimeInstability(glucoseReadings, patterns, modifiers);

  // ── Contextual ─────────────────────────────────────────────────────
  detectContextualPatterns(conditionEvents, glucoseReadings, patterns, modifiers);

  return patterns;
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONTEXT MODIFIERS
   ═══════════════════════════════════════════════════════════════════════════ */

function buildContextModifiers(profile: UserProfile): string[] {
  const mods: string[] = [];
  if (profile.special_conditions?.includes("Puberty"))
    mods.push("Patient flagged puberty — may amplify dawn phenomenon and insulin resistance.");
  if (profile.special_conditions?.includes("Pregnancy"))
    mods.push("Patient flagged pregnancy — insulin requirements change rapidly across trimesters.");
  if (profile.special_conditions?.includes("Honeymoon phase"))
    mods.push("Patient in honeymoon phase — residual beta-cell function may cause unpredictable lows.");
  if (profile.special_conditions?.includes("Steroid exposure"))
    mods.push("Steroid exposure flagged — expect increased insulin resistance, particularly afternoon.");
  if (profile.special_conditions?.includes("Shift work"))
    mods.push("Shift work flagged — circadian disruption may affect basal timing patterns.");
  if (profile.comorbidities?.includes("Gastroparesis"))
    mods.push("Gastroparesis noted — delayed gastric emptying may cause late post-meal spikes.");
  if (profile.comorbidities?.includes("ADHD"))
    mods.push("ADHD noted — dose timing consistency may be affected.");
  if (profile.dietary_approach === "Bernstein Protocol")
    mods.push("Bernstein Protocol — low carb intake (≤30g/day) reduces bolus stacking risk.");
  return mods;
}

/* ═══════════════════════════════════════════════════════════════════════════
   INSULIN TIMING DETECTORS
   ═══════════════════════════════════════════════════════════════════════════ */

function isRapid(type: string): boolean {
  const p = FORMULARY_MAP[type];
  return !!p && (p.type === "ultra_rapid" || p.type === "rapid");
}

function detectDoseCompression(events: InsulinEvent[], out: DetectedPattern[], mods: string[]) {
  const rapids = events.filter((e) => isRapid(e.insulin_type)).sort((a, b) => a.event_time.localeCompare(b.event_time));
  let count = 0;
  let band = "";
  for (let i = 1; i < rapids.length; i++) {
    const gap = (new Date(rapids[i].event_time).getTime() - new Date(rapids[i - 1].event_time).getTime()) / 60_000;
    if (gap > 0 && gap < 90) { count++; band = getTimeBand(rapids[i].event_time); }
  }
  if (count >= 2) out.push({ id: nextId(), category: "insulin_timing", type: "dose_compression", confidence: confidence(count), time_band: band, occurrences: count, observation: "", suggestion: "", context_modifiers: mods });
}

function detectLateCorrections(events: InsulinEvent[], out: DetectedPattern[], mods: string[]) {
  const corrections = events.filter((e) => e.event_type === "correction");
  const late = corrections.filter((e) => { const h = new Date(e.event_time).getHours(); return h >= 21 || h < 2; });
  if (late.length >= 2) out.push({ id: nextId(), category: "insulin_timing", type: "late_corrections", confidence: confidence(late.length), time_band: "NIGHT", occurrences: late.length, observation: "", suggestion: "", context_modifiers: mods });
}

function detectOverlappingCorrections(events: InsulinEvent[], out: DetectedPattern[], mods: string[]) {
  const corrections = events.filter((e) => e.event_type === "correction").sort((a, b) => a.event_time.localeCompare(b.event_time));
  let count = 0;
  for (let i = 1; i < corrections.length; i++) {
    const gap = (new Date(corrections[i].event_time).getTime() - new Date(corrections[i - 1].event_time).getTime()) / 60_000;
    if (gap > 0 && gap < 180) count++;
  }
  if (count >= 2) out.push({ id: nextId(), category: "insulin_timing", type: "overlapping_corrections", confidence: confidence(count), time_band: getTimeBand(corrections[0]?.event_time ?? ""), occurrences: count, observation: "", suggestion: "", context_modifiers: mods });
}

function detectStackedRapid(events: InsulinEvent[], out: DetectedPattern[], mods: string[]) {
  const rapids = events.filter((e) => isRapid(e.insulin_type)).sort((a, b) => a.event_time.localeCompare(b.event_time));
  let count = 0;
  for (let i = 1; i < rapids.length; i++) {
    const gap = (new Date(rapids[i].event_time).getTime() - new Date(rapids[i - 1].event_time).getTime()) / 60_000;
    if (gap > 0 && gap < 120) count++;
  }
  if (count >= 2) out.push({ id: nextId(), category: "insulin_timing", type: "stacked_rapid", confidence: confidence(count), time_band: getTimeBand(rapids[0]?.event_time ?? ""), occurrences: count, observation: "", suggestion: "", context_modifiers: mods });
}

function detectBasalOverlap(events: InsulinEvent[], out: DetectedPattern[], mods: string[]) {
  const basals = events.filter((e) => { const p = FORMULARY_MAP[e.insulin_type]; return p && (p.type === "long" || p.type === "ultra_long" || p.type === "intermediate"); });
  // Group by day, check for doses closer than 8h
  const sorted = basals.sort((a, b) => a.event_time.localeCompare(b.event_time));
  let count = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = (new Date(sorted[i].event_time).getTime() - new Date(sorted[i - 1].event_time).getTime()) / 3_600_000;
    if (gap > 0 && gap < 8) count++;
  }
  if (count >= 2) out.push({ id: nextId(), category: "insulin_timing", type: "basal_overlap", confidence: confidence(count), time_band: getTimeBand(sorted[0]?.event_time ?? ""), occurrences: count, observation: "", suggestion: "", context_modifiers: mods });
}

/* ═══════════════════════════════════════════════════════════════════════════
   GLUCOSE BEHAVIOUR DETECTORS
   ═══════════════════════════════════════════════════════════════════════════ */

function readingsByBand(readings: GlucoseReading[], band: string): GlucoseReading[] {
  return readings.filter((r) => getTimeBand(r.time) === band);
}

function detectOvernightDrift(readings: GlucoseReading[], out: DetectedPattern[], mods: string[]) {
  const overnight = readingsByBand(readings, "EARLY_MORNING");
  if (overnight.length < 2) return;
  let drifts = 0;
  for (let i = 1; i < overnight.length; i++) {
    if (Math.abs(overnight[i].value - overnight[i - 1].value) > 2) drifts++;
  }
  if (drifts >= 2) out.push({ id: nextId(), category: "glucose_behaviour", type: "overnight_drift", confidence: confidence(drifts), time_band: "EARLY_MORNING", occurrences: drifts, observation: "", suggestion: "", context_modifiers: mods });
}

function detectDawnRise(readings: GlucoseReading[], out: DetectedPattern[], mods: string[]) {
  const morning = readingsByBand(readings, "MORNING");
  const earlyAm = readingsByBand(readings, "EARLY_MORNING");
  if (morning.length === 0 || earlyAm.length === 0) return;
  const avgMorn = morning.reduce((s, r) => s + r.value, 0) / morning.length;
  const avgEarly = earlyAm.reduce((s, r) => s + r.value, 0) / earlyAm.length;
  if (avgMorn - avgEarly > 1.5) {
    out.push({ id: nextId(), category: "glucose_behaviour", type: "dawn_rise", confidence: avgMorn - avgEarly > 3 ? "high" : "moderate", time_band: "MORNING", occurrences: morning.length, observation: "", suggestion: "", context_modifiers: mods });
  }
}

function detectPostMealSpike(readings: GlucoseReading[], meals: MealLog[], out: DetectedPattern[], mods: string[]) {
  let count = 0;
  for (const meal of meals) {
    if (!meal.glucose_value) continue;
    const mealTime = new Date(meal.meal_time).getTime();
    const postReadings = readings.filter((r) => {
      const t = new Date(r.time).getTime();
      return t > mealTime && t < mealTime + 3 * 3_600_000;
    });
    for (const r of postReadings) {
      if (r.value - meal.glucose_value > 4) { count++; break; }
    }
  }
  if (count >= 2) out.push({ id: nextId(), category: "glucose_behaviour", type: "post_meal_spike", confidence: confidence(count), time_band: "AFTERNOON", occurrences: count, observation: "", suggestion: "", context_modifiers: mods });
}

function detectDelayedDrop(readings: GlucoseReading[], out: DetectedPattern[], mods: string[]) {
  let count = 0;
  for (let i = 2; i < readings.length; i++) {
    if (readings[i - 2].value > 10 && readings[i - 1].value > 10 && readings[i].value < 5) count++;
  }
  if (count >= 2) out.push({ id: nextId(), category: "glucose_behaviour", type: "delayed_drop", confidence: confidence(count), time_band: getTimeBand(readings[0]?.time ?? ""), occurrences: count, observation: "", suggestion: "", context_modifiers: mods });
}

function detectRebound(readings: GlucoseReading[], out: DetectedPattern[], mods: string[]) {
  let count = 0;
  for (let i = 2; i < readings.length; i++) {
    if (readings[i - 2].value < 4 && readings[i].value > 12) count++;
  }
  if (count >= 2) out.push({ id: nextId(), category: "glucose_behaviour", type: "rebound", confidence: confidence(count), time_band: getTimeBand(readings[0]?.time ?? ""), occurrences: count, observation: "", suggestion: "", context_modifiers: mods });
}

function detectRollercoaster(readings: GlucoseReading[], out: DetectedPattern[], mods: string[]) {
  let swings = 0;
  for (let i = 1; i < readings.length; i++) {
    if (Math.abs(readings[i].value - readings[i - 1].value) > 5) swings++;
  }
  if (swings >= 3) out.push({ id: nextId(), category: "glucose_behaviour", type: "rollercoaster", confidence: confidence(swings), time_band: "AFTERNOON", occurrences: swings, observation: "", suggestion: "", context_modifiers: mods });
}

/* ═══════════════════════════════════════════════════════════════════════════
   SAFETY DETECTORS
   ═══════════════════════════════════════════════════════════════════════════ */

function detectRepeatedLows(readings: GlucoseReading[], out: DetectedPattern[], mods: string[]) {
  const lows = readings.filter((r) => r.value < 3.9);
  if (lows.length >= 2) out.push({ id: nextId(), category: "safety", type: "repeated_lows", confidence: confidence(lows.length), time_band: getTimeBand(lows[0]?.time ?? ""), occurrences: lows.length, observation: "", suggestion: "", context_modifiers: mods });
}

function detectRescueClusters(meals: MealLog[], out: DetectedPattern[], mods: string[]) {
  const rescues = meals.filter((m) => m.event_type === "low_intervention");
  if (rescues.length >= 3) out.push({ id: nextId(), category: "safety", type: "rescue_clusters", confidence: confidence(rescues.length), time_band: getTimeBand(rescues[0]?.meal_time ?? ""), occurrences: rescues.length, observation: "", suggestion: "", context_modifiers: mods });
}

function detectMultiLowBand(readings: GlucoseReading[], out: DetectedPattern[], mods: string[]) {
  const bandCounts: Record<string, number> = {};
  for (const r of readings.filter((r) => r.value < 3.9)) {
    const b = getTimeBand(r.time);
    bandCounts[b] = (bandCounts[b] ?? 0) + 1;
  }
  for (const [band, count] of Object.entries(bandCounts)) {
    if (count >= 3) out.push({ id: nextId(), category: "safety", type: "multi_low_band", confidence: confidence(count), time_band: band, occurrences: count, observation: "", suggestion: "", context_modifiers: mods });
  }
}

function detectOvernightRisk(readings: GlucoseReading[], events: InsulinEvent[], out: DetectedPattern[], mods: string[]) {
  const nightLows = readings.filter((r) => r.value < 3.9 && (getTimeBand(r.time) === "EARLY_MORNING" || getTimeBand(r.time) === "NIGHT"));
  if (nightLows.length >= 2) out.push({ id: nextId(), category: "safety", type: "overnight_risk", confidence: confidence(nightLows.length), time_band: "EARLY_MORNING", occurrences: nightLows.length, observation: "", suggestion: "", context_modifiers: mods });
}

function detectSameTimeInstability(readings: GlucoseReading[], out: DetectedPattern[], mods: string[]) {
  const byBand: Record<string, number[]> = {};
  for (const r of readings) {
    const b = getTimeBand(r.time);
    (byBand[b] ??= []).push(r.value);
  }
  for (const [band, vals] of Object.entries(byBand)) {
    if (vals.length < 3) continue;
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    const variance = vals.reduce((s, v) => s + (v - avg) ** 2, 0) / vals.length;
    if (Math.sqrt(variance) > 3) {
      out.push({ id: nextId(), category: "safety", type: "same_time_instability", confidence: "moderate", time_band: band, occurrences: vals.length, observation: "", suggestion: "", context_modifiers: mods });
    }
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   CONTEXTUAL DETECTORS
   ═══════════════════════════════════════════════════════════════════════════ */

function detectContextualPatterns(conditions: ConditionEvent[], readings: GlucoseReading[], out: DetectedPattern[], mods: string[]) {
  const typeCounts: Record<string, number> = {};
  for (const c of conditions) typeCounts[c.event_type] = (typeCounts[c.event_type] ?? 0) + 1;

  const contextMap: Record<string, string> = {
    illness: "illness_resistance",
    stress: "stress_variability",
    travel: "travel_disruption",
    menstrual: "menstrual_resistance",
  };

  for (const [evType, patType] of Object.entries(contextMap)) {
    const count = typeCounts[evType] ?? 0;
    if (count >= 2) {
      out.push({ id: nextId(), category: "contextual", type: patType, confidence: confidence(count), time_band: "AFTERNOON", occurrences: count, observation: "", suggestion: "", context_modifiers: mods });
    }
  }

  // Heat sensitivity from weather events
  if ((typeCounts["weather"] ?? 0) >= 2) {
    out.push({ id: nextId(), category: "contextual", type: "heat_sensitivity", confidence: confidence(typeCounts["weather"]), time_band: "AFTERNOON", occurrences: typeCounts["weather"], observation: "", suggestion: "", context_modifiers: mods });
  }

  // Alarm fatigue from sleep + distress
  const sleepEvents = conditions.filter((c) => c.event_type === "sleep" && c.intensity === "severe");
  if (sleepEvents.length >= 3) {
    out.push({ id: nextId(), category: "contextual", type: "alarm_fatigue_deterioration", confidence: confidence(sleepEvents.length), time_band: "EARLY_MORNING", occurrences: sleepEvents.length, observation: "", suggestion: "", context_modifiers: mods });
  }
}
