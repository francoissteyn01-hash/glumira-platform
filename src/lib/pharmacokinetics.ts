/**
 * GluMira™ V7 — Pharmacokinetic Engine (LEGACY)
 *
 * @deprecated Active consumers: ReportPage.tsx only.
 * New features must use the cited v7 engine in src/iob-hunter/engine/iob-engine.ts
 * which implements Plank 2005 (Levemir dose-dependent DOA), albumin-bound kinetics,
 * and 6 decay models with peer-reviewed references.
 *
 * Two-compartment absorption model for insulin-on-board (IOB).
 * Uses the Bateman function: C(t) = dose × (ka/(ka-ke)) × (e^(-ke×t) - e^(-ka×t))
 * IOB is the integral of remaining activity from t to infinity.
 *
 * Model types:
 *   - Depot-release (Tresiba, Toujeo): ka ≈ 0.08/h — slow absorption, flat profile
 *   - Microprecipitate (Lantus, Basaglar): ka ≈ 0.12/h — steady-state, near-flat
 *   - Gaussian peaked (Levemir, NPH): ka ≈ 0.18–0.25/h — peaked curve
 *   - Rapid-acting (NovoRapid, Humalog): ka ≈ 0.8–1.0/h — tall, narrow peak
 *   - Ultra-rapid (Fiasp, Lyumjev): ka ≈ 1.2–1.5/h — fastest rise
 *
 * All public functions use HOURS. Internal math uses hours natively.
 */

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Types                                                                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

export type InsulinPharmacology = {
  name: string;
  onsetMinutes: number;
  peakMinutes: number;
  durationMinutes: number;
  category: "ultra-rapid" | "rapid" | "short" | "intermediate" | "long" | "ultra-long";
}

export type InsulinEntry = {
  id: string;
  insulinName: string;
  dose: number;
  time: string;         // HH:mm
  type: "basal" | "bolus";
  pharmacology: InsulinPharmacology;
  mealType?: string;
}

export type IOBDataPoint = {
  minute: number;
  totalIOB: number;
}

export type PressureClass = "light" | "moderate" | "strong" | "overlap";

export type DangerWindow = {
  startMinute: number;
  endMinute: number;
  peakIOB: number;
  pressure: PressureClass;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Built-in Insulin Profiles                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

export const INSULIN_PROFILES: Record<string, InsulinPharmacology> = {
  fiasp:         { name: "Fiasp",                          onsetMinutes: 2.5, peakMinutes: 60,  durationMinutes: 300,  category: "ultra-rapid" },
  lyumjev:       { name: "Lyumjev",                        onsetMinutes: 5,   peakMinutes: 60,  durationMinutes: 300,  category: "ultra-rapid" },
  aspart:        { name: "NovoRapid (Aspart)",             onsetMinutes: 10,  peakMinutes: 75,  durationMinutes: 300,  category: "rapid" },
  lispro:        { name: "Humalog (Lispro)",               onsetMinutes: 10,  peakMinutes: 75,  durationMinutes: 300,  category: "rapid" },
  glulisine:     { name: "Apidra (Glulisine)",             onsetMinutes: 10,  peakMinutes: 60,  durationMinutes: 270,  category: "rapid" },
  regular:       { name: "Regular (Actrapid)",             onsetMinutes: 30,  peakMinutes: 150, durationMinutes: 480,  category: "short" },
  nph:           { name: "NPH (Humulin N)",                onsetMinutes: 90,  peakMinutes: 300, durationMinutes: 960,  category: "intermediate" },
  glargine_u100: { name: "Lantus/Basaglar (Glargine U-100)", onsetMinutes: 120, peakMinutes: 480,  durationMinutes: 1440, category: "long" },
  detemir:       { name: "Levemir (Detemir)",              onsetMinutes: 120, peakMinutes: 420,  durationMinutes: 1200, category: "long" },
  glargine_u300: { name: "Toujeo (Glargine U-300)",        onsetMinutes: 360, peakMinutes: 720,  durationMinutes: 2160, category: "ultra-long" },
  degludec:      { name: "Tresiba (Degludec)",             onsetMinutes: 120, peakMinutes: 720,  durationMinutes: 2520, category: "ultra-long" },
};

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Two-Compartment Absorption Model                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Derive absorption rate constant (ka) and elimination rate constant (ke)
 * from the pharmacology parameters. These drive the Bateman function.
 *
 * ka controls how fast insulin absorbs from the depot (injection site).
 * ke controls how fast insulin is eliminated from plasma.
 * tPeak = ln(ka/ke) / (ka - ke)  — the theoretical peak time.
 *
 * We solve for ka and ke given peakMinutes and durationMinutes.
 */
function deriveRateConstants(pharm: InsulinPharmacology): { ka: number; ke: number } {
  const tPeak = pharm.peakMinutes / 60; // hours
  const tDur = pharm.durationMinutes / 60; // hours

  // ke: elimination rate — at t=duration, IOB should be ~2% of peak
  // From e^(-ke × tDur) ≈ 0.02 → ke ≈ ln(50) / tDur ≈ 3.91 / tDur
  const ke = 3.91 / tDur;

  // ka: absorption rate — derived from peak time constraint
  // For the Bateman function, tPeak = ln(ka/ke) / (ka - ke)
  // We solve iteratively (Newton's method) for ka given ke and tPeak
  let ka = ke * 3; // initial guess: ka >> ke
  for (let iter = 0; iter < 20; iter++) {
    if (ka <= ke) { ka = ke * 1.5; break; }
    const f = Math.log(ka / ke) / (ka - ke) - tPeak;
    // Derivative: d/dka [ln(ka/ke)/(ka-ke)] = [1/ka(ka-ke) - ln(ka/ke)/(ka-ke)²]
    const denom = ka - ke;
    const df = (1 / (ka * denom)) - Math.log(ka / ke) / (denom * denom);
    if (Math.abs(df) < 1e-12) break;
    const step = f / df;
    ka -= step;
    if (ka <= ke * 1.01) ka = ke * 1.5; // keep ka > ke
    if (Math.abs(step) < 1e-8) break;
  }

  return { ka: Math.max(ka, ke * 1.05), ke };
}

/**
 * Bateman function activity curve (rate of insulin action at time t).
 * Activity(t) = K × (e^(-ke×t) - e^(-ka×t))
 * Normalised so peak activity = 1.
 *
 * NOTE: exported so it can be used by future analysis tooling that needs
 * the instantaneous activity rate rather than the cumulative IOB fraction.
 * Currently only `iobFraction` is called by the rest of the file.
 */
export function batemanActivity(t: number, ka: number, ke: number): number {
  if (t <= 0) return 0;
  const raw = Math.exp(-ke * t) - Math.exp(-ka * t);
  // Normalise by peak value
  const tPeak = (ka !== ke) ? Math.log(ka / ke) / (ka - ke) : 0;
  const peakVal = Math.exp(-ke * tPeak) - Math.exp(-ka * tPeak);
  if (peakVal <= 0) return 0;
  return Math.max(0, raw / peakVal);
}

/**
 * IOB remaining fraction at time t.
 * IOB(t) = integral from t to ∞ of activity(s) ds  /  integral from 0 to ∞
 * For the Bateman function: IOB(t) = 1 - [cumulative absorbed fraction at t]
 *
 * Analytical: ∫₀ᵗ (e^(-ke×s) - e^(-ka×s)) ds = (1/ke)(1-e^(-ke×t)) - (1/ka)(1-e^(-ka×t))
 * Total area: (1/ke - 1/ka)
 */
function iobFraction(t: number, ka: number, ke: number): number {
  if (t <= 0) return 1;
  const totalArea = 1 / ke - 1 / ka;
  if (totalArea <= 0) return 0;
  const cumArea = (1 - Math.exp(-ke * t)) / ke - (1 - Math.exp(-ka * t)) / ka;
  const fraction = 1 - cumArea / totalArea;
  return Math.max(0, Math.min(1, fraction));
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Core Function 1: calculateIOB                                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Calculate remaining IOB for a single dose using two-compartment model.
 *
 * @param dose           Dose in units
 * @param hoursPostDose  Hours since injection
 * @param pharmacology   Insulin pharmacokinetic profile
 * @returns              Remaining IOB in units
 */
export function calculateIOB(
  dose: number,
  hoursPostDose: number,
  pharmacology: InsulinPharmacology,
): number {
  if (dose <= 0 || hoursPostDose < 0) return 0;

  const tDur = pharmacology.durationMinutes / 60;
  if (hoursPostDose >= tDur) return 0;
  if (hoursPostDose <= 0) return dose;

  const { ka, ke } = deriveRateConstants(pharmacology);
  return dose * iobFraction(hoursPostDose, ka, ke);
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Core Function 2: calculateCombinedIOB                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Combined IOB from all entries at a timepoint, including prior-day cycles.
 *
 * `cycles` controls how many days of regimen contribution are summed:
 *   cycles=1 → today only
 *   cycles=2 → today + yesterday's tail (default — Levemir/Tresiba persist
 *              well past 24h, so the prior day's basal contributes to today)
 *   cycles=3 → today + previous 2 days
 *
 * Bug fix (2026-04-11): the previous implementation iterated cycles
 * 0..N-1 forward in time, so cycle≥1 represented FUTURE doses with
 * `hoursPostDose < 0` and contributed nothing. The prior-day tail was
 * never computed, so the demo data worked around it by adding duplicate
 * `prev-pm`/`prev-night` Levemir entries — which double-counted at 14:00
 * and 21:00 and produced a Levemir curve with two stacked peaks at the
 * same hour. Removing the duplicates AND iterating cycles backward in
 * time is the correct fix on both sides.
 */
export function calculateCombinedIOB(
  entries: InsulinEntry[],
  timepoint: number,
  cycles: number,
): { total: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};
  let total = 0;
  const safeCycles = Math.max(1, cycles);

  // Iterate from -(cycles-1) up to and including 0 so each cycle
  // represents a prior day whose dose tail can still be active today.
  for (let cycle = -(safeCycles - 1); cycle <= 0; cycle++) {
    const cycleOffsetHours = cycle * 24;
    for (const entry of entries) {
      const [h, m] = entry.time.split(":").map(Number);
      const doseHour = h + m / 60 + cycleOffsetHours;
      const hoursPostDose = timepoint - doseHour;
      const iob = calculateIOB(entry.dose, hoursPostDose, entry.pharmacology);
      if (iob > 0.001) {
        const key = cycle === 0 ? entry.id : `${entry.id}_c${cycle}`;
        breakdown[key] = (breakdown[key] ?? 0) + iob;
        total += iob;
      }
    }
  }

  return { total: Math.round(total * 1000) / 1000, breakdown };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Core Function 3: getPressureClassification                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function getPressureClassification(
  combinedIOB: number,
  peakIOB: number,
): PressureClass {
  if (peakIOB <= 0) return "light";
  const ratio = combinedIOB / peakIOB;
  if (ratio < 0.25) return "light";
  if (ratio < 0.5) return "moderate";
  if (ratio < 0.75) return "strong";
  return "overlap";
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Core Function 4: findDangerWindows                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

export function findDangerWindows(
  data: IOBDataPoint[],
  peakIOB: number,
  threshold: number = 0.75,
): DangerWindow[] {
  if (peakIOB <= 0 || data.length === 0) return [];
  const dangerThreshold = peakIOB * threshold;
  const MIN_DURATION = 15;
  const windows: DangerWindow[] = [];
  let windowStart: number | null = null;
  let windowPeak = 0;

  for (const pt of data) {
    if (pt.totalIOB >= dangerThreshold) {
      if (windowStart === null) windowStart = pt.minute;
      windowPeak = Math.max(windowPeak, pt.totalIOB);
    } else if (windowStart !== null) {
      if (pt.minute - windowStart >= MIN_DURATION) {
        windows.push({ startMinute: windowStart, endMinute: pt.minute, peakIOB: Math.round(windowPeak * 1000) / 1000, pressure: getPressureClassification(windowPeak, peakIOB) });
      }
      windowStart = null;
      windowPeak = 0;
    }
  }

  if (windowStart !== null && data.length > 0) {
    const last = data[data.length - 1];
    if (last.minute - windowStart >= MIN_DURATION) {
      windows.push({ startMinute: windowStart, endMinute: last.minute, peakIOB: Math.round(windowPeak * 1000) / 1000, pressure: getPressureClassification(windowPeak, peakIOB) });
    }
  }

  return windows;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Per-entry IOB curve (for individual mountain shapes + heatmap rows)      */
/* ═══════════════════════════════════════════════════════════════════════════ */

export type EntryIOBPoint = {
  minute: number;
  iob: number;
}

/**
 * Compute IOB curve for a single entry across the full timeline.
 * Used for individual mountain shapes and heatmap rows.
 */
export function computeEntryCurve(
  entry: InsulinEntry,
  totalMinutes: number,
  cycles: number,
  step: number = 5,
): EntryIOBPoint[] {
  const points: EntryIOBPoint[] = [];
  const numPoints = Math.ceil(totalMinutes / step) + 1;

  for (let i = 0; i < numPoints; i++) {
    const minute = i * step;
    let iob = 0;
    for (let c = 0; c < cycles; c++) {
      const [h, m] = entry.time.split(":").map(Number);
      const doseMinute = h * 60 + m + c * 1440;
      const hoursPost = (minute - doseMinute) / 60;
      iob += calculateIOB(entry.dose, hoursPost, entry.pharmacology);
    }
    points.push({ minute, iob: Math.round(iob * 1000) / 1000 });
  }

  return points;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Terrain Timeline                                                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

export type TerrainPoint = {
  minute: number;
  hour: number;
  label: string;
  basalIOB: number;
  bolusIOB: number;
  totalIOB: number;
  overlap: number;
  pressure: PressureClass;
}

export function buildTerrainTimeline(
  entries: InsulinEntry[],
  cycles: number = 2,
  step: number = 5,
): { points: TerrainPoint[]; peakIOB: number; dangerWindows: DangerWindow[]; worstPressure: PressureClass } {
  const safeCycles = Math.max(2, cycles);
  const totalMinutes = safeCycles * 1440;
  const numPoints = Math.ceil(totalMinutes / step) + 1;

  const basalEntries = entries.filter((e) => e.type === "basal");
  const bolusEntries = entries.filter((e) => e.type === "bolus");

  const points: TerrainPoint[] = [];
  let peakIOB = 0;

  for (let i = 0; i < numPoints; i++) {
    const minute = i * step;
    const hour = minute / 60;
    let basalIOB = 0;
    let bolusIOB = 0;

    // Iterate from cycle=-1 (yesterday) so prior-day Levemir/Tresiba tail
    // is part of Day 1 from minute=0 — enforces the "NEVER start at 0 IOB"
    // rule from the Three Owls system prompt. Without this, IOBTerrainChart
    // showed a flat baseline at midnight that should have had a tail.
    for (let cycle = -1; cycle < safeCycles; cycle++) {
      const offset = cycle * 1440;
      for (const e of basalEntries) {
        const [h, m] = e.time.split(":").map(Number);
        basalIOB += calculateIOB(e.dose, (minute - (h * 60 + m + offset)) / 60, e.pharmacology);
      }
      for (const e of bolusEntries) {
        const [h, m] = e.time.split(":").map(Number);
        bolusIOB += calculateIOB(e.dose, (minute - (h * 60 + m + offset)) / 60, e.pharmacology);
      }
    }

    const totalIOB = basalIOB + bolusIOB;
    peakIOB = Math.max(peakIOB, totalIOB);
    const dayNum = Math.floor(minute / 1440) + 1;
    const dm = ((minute % 1440) + 1440) % 1440;
    const hh = String(Math.floor(dm / 60)).padStart(2, "0");
    const mm = String(dm % 60).padStart(2, "0");

    points.push({
      minute, hour,
      label: dayNum > 1 ? `D${dayNum} ${hh}:${mm}` : `${hh}:${mm}`,
      basalIOB: Math.round(basalIOB * 1000) / 1000,
      bolusIOB: Math.round(bolusIOB * 1000) / 1000,
      totalIOB: Math.round(totalIOB * 1000) / 1000,
      overlap: Math.round(Math.min(basalIOB, bolusIOB) * 1000) / 1000,
      pressure: "light",
    });
  }

  for (const pt of points) pt.pressure = getPressureClassification(pt.totalIOB, peakIOB);

  const dangerWindows = findDangerWindows(points.map((p) => ({ minute: p.minute, totalIOB: p.totalIOB })), peakIOB);

  const order: PressureClass[] = ["light", "moderate", "strong", "overlap"];
  let worstPressure: PressureClass = "light";
  for (const pt of points) {
    if (order.indexOf(pt.pressure) > order.indexOf(worstPressure)) worstPressure = pt.pressure;
  }

  return { points, peakIOB, dangerWindows, worstPressure };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Basal Evaluation Score                                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

export type BasalEvaluation = {
  score: number;
  observations: Array<{ type: "positive" | "warning" | "alert"; text: string }>;
}

export function evaluateBasalProfile(
  entries: InsulinEntry[],
  dangerWindows: DangerWindow[],
  points: TerrainPoint[],
): BasalEvaluation {
  const basalEntries = entries.filter((e) => e.type === "basal");
  const observations: BasalEvaluation["observations"] = [];
  let score = 10;

  // 1. Coverage evenness (±3 points)
  const basalPoints = points.filter((_, i) => i % 12 === 0); // sample every hour
  if (basalPoints.length > 0) {
    const basalValues = basalPoints.map((p) => p.basalIOB);
    const mean = basalValues.reduce((a, b) => a + b, 0) / basalValues.length;
    const cv = mean > 0 ? Math.sqrt(basalValues.reduce((s, v) => s + (v - mean) ** 2, 0) / basalValues.length) / mean : 0;
    if (cv < 0.15) {
      observations.push({ type: "positive", text: "Smooth 24-hour basal coverage — even distribution" });
    } else if (cv < 0.35) {
      score -= 1;
      observations.push({ type: "warning", text: "Moderate variation in basal coverage — consider timing adjustment" });
    } else {
      score -= 3;
      observations.push({ type: "alert", text: "Wide swings in basal coverage — significant trough-to-peak ratio" });
    }
  }

  // 2. Overlap/danger windows (±3 points)
  if (dangerWindows.length === 0) {
    observations.push({ type: "positive", text: "No overlap or danger windows detected" });
  } else {
    score -= Math.min(3, dangerWindows.length);
    observations.push({ type: "alert", text: `${dangerWindows.length} danger window${dangerWindows.length > 1 ? "s" : ""} detected — insulin stacking present` });
  }

  // 3. Trough-to-peak ratio (±2 points)
  if (basalEntries.length > 0 && points.length > 0) {
    const basalVals = points.map((p) => p.basalIOB).filter((v) => v > 0);
    if (basalVals.length > 2) {
      const min = Math.min(...basalVals);
      const max = Math.max(...basalVals);
      const ratio = min > 0 ? max / min : Infinity;
      if (ratio < 1.5) {
        observations.push({ type: "positive", text: "Consistent trough-to-peak ratio" });
      } else {
        score -= ratio > 3 ? 2 : 1;
        observations.push({ type: "warning", text: `Trough-to-peak ratio of ${ratio.toFixed(1)}:1 — timing spread may help` });
      }
    }
  }

  // 4. Dose spacing (±2 points)
  if (basalEntries.length >= 2) {
    const times = basalEntries.map((e) => { const [h, m] = e.time.split(":").map(Number); return h * 60 + m; }).sort((a, b) => a - b);
    const gaps = times.map((t, i) => i > 0 ? t - times[i - 1] : 1440 - times[times.length - 1] + t);
    const idealGap = 1440 / basalEntries.length;
    const maxDeviation = Math.max(...gaps.map((g) => Math.abs(g - idealGap) / idealGap));
    if (maxDeviation < 0.2) {
      observations.push({ type: "positive", text: "Well-spaced basal doses" });
    } else {
      score -= maxDeviation > 0.5 ? 1 : 0.5;
      observations.push({ type: "warning", text: "Uneven basal dose spacing — consider redistributing times" });
    }
  }

  return { score: Math.max(0, Math.min(10, Math.round(score * 10) / 10)), observations };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Insight Generation                                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

export type InsightContent = {
  basalCoverage: string;
  dangerText?: string;
  bolusStacking: string;
  keyObservation: string;
  disclaimer: string;
  peakPressure?: string;
  stackingRisk?: string;
  basalContribution?: string;
  lastBolusClear?: string;
  overnightNote?: string;
}

export function generateInsight(
  entries: InsulinEntry[],
  dangerWindows: DangerWindow[],
  peakTotalIOB: number,
  worstPressure: PressureClass,
): InsightContent {
  const basalEntries = entries.filter((e) => e.type === "basal");
  const bolusEntries = entries.filter((e) => e.type === "bolus");
  const totalDoses = entries.length;

  // Basal coverage description
  let basalCoverage: string;
  if (basalEntries.length === 0) {
    basalCoverage = "No basal insulin detected. Bolus-only coverage.";
  } else {
    const cats = new Set(basalEntries.map((e) => e.pharmacology.category));
    if (cats.has("ultra-long")) {
      basalCoverage = `${basalEntries.length} basal dose${basalEntries.length > 1 ? "s" : ""} of depot-release insulin providing continuous coverage — never drops to zero. Multi-day half-life means steady-state builds over 3–5 days.`;
    } else if (cats.has("long")) {
      basalCoverage = `${basalEntries.length} basal dose${basalEntries.length > 1 ? "s" : ""} of microprecipitate insulin providing smooth steady-state coverage. Near-peakless profile with gradual onset.`;
    } else {
      basalCoverage = `${basalEntries.length} basal dose${basalEntries.length > 1 ? "s" : ""} of peaked intermediate-acting insulin. Overlapping peaked curves maintain coverage — watch for trough periods between doses.`;
    }
  }

  // Danger windows
  let dangerText: string | undefined;
  if (dangerWindows.length > 0) {
    const fmt = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    const descs = dangerWindows.map((w) => `${fmt(w.startMinute)}–${fmt(w.endMinute)} (peak ${w.peakIOB.toFixed(1)}U, ${w.pressure})`);
    dangerText = `${dangerWindows.length} danger window${dangerWindows.length > 1 ? "s" : ""}: ${descs.join(" • ")}. Have fast-acting glucose within reach during these periods.`;
  }

  // Bolus stacking
  let bolusStacking: string;
  if (bolusEntries.length === 0) {
    bolusStacking = "No bolus doses logged. Basal-only pressure.";
  } else if (worstPressure === "light" || worstPressure === "moderate") {
    bolusStacking = `${bolusEntries.length} bolus dose${bolusEntries.length > 1 ? "s" : ""} with well-separated peaks. No significant stacking with basal coverage.`;
  } else {
    bolusStacking = `${bolusEntries.length} bolus dose${bolusEntries.length > 1 ? "s" : ""} detected. Meal bolus adds to basal pressure reaching ${worstPressure} classification at peak (${peakTotalIOB.toFixed(1)}U combined). Monitor glucose closely post-meal.`;
  }

  // Key observation
  const tdd = entries.reduce((s, e) => s + e.dose, 0);
  const basalPct = basalEntries.reduce((s, e) => s + e.dose, 0) / (tdd || 1) * 100;
  let keyObservation: string;
  if (worstPressure === "overlap") {
    keyObservation = `A timing question — at current TDD of ${tdd.toFixed(1)}U, the pressure map shows significant stacking. Consider whether dose timing can be adjusted to reduce overlap. Discuss with your care team.`;
  } else if (worstPressure === "strong") {
    keyObservation = `At this TDD of ${tdd.toFixed(1)}U (basal ${basalPct.toFixed(0)}%), the pressure map shows periods of elevated IOB. The terrain suggests timing adjustments may smooth the profile. Discuss with your care team.`;
  } else {
    keyObservation = `${totalDoses} dose${totalDoses !== 1 ? "s" : ""}, TDD ${tdd.toFixed(1)}U (basal ${basalPct.toFixed(0)}%). The pressure map shows well-managed insulin activity with no immediate timing concerns.`;
  }

  // Peak pressure detail
  const peakPoint = entries.length > 0 ? (() => {
    // Find the minute of peak IOB from a quick scan
    const totalMin = 2 * 1440;
    let bestMin = 0; let bestIOB = 0;
    for (let min = 0; min <= totalMin; min += 15) {
      let iobSum = 0;
      for (let c = 0; c < 2; c++) {
        for (const e of entries) {
          const [h, m] = e.time.split(":").map(Number);
          iobSum += calculateIOB(e.dose, (min - (h * 60 + m + c * 1440)) / 60, e.pharmacology);
        }
      }
      if (iobSum > bestIOB) { bestIOB = iobSum; bestMin = min; }
    }
    return { minute: bestMin % 1440, iob: bestIOB };
  })() : null;

  const peakPressure = peakPoint
    ? `Peak insulin pressure: ${worstPressure.toUpperCase()} at ${String(Math.floor(peakPoint.minute / 60)).padStart(2, "0")}:${String(peakPoint.minute % 60).padStart(2, "0")} (${peakPoint.iob.toFixed(1)}U active)`
    : undefined;

  // Stacking risk — find overlapping pairs
  let stackingRisk: string | undefined;
  if (dangerWindows.length > 0 && entries.length >= 2) {
    const fmt = (m: number) => `${String(Math.floor((m % 1440) / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
    // Identify which entries contribute most during danger windows
    const dw = dangerWindows[0];
    const midMin = Math.floor((dw.startMinute + dw.endMinute) / 2);
    const contributors: { name: string; iob: number }[] = [];
    for (const e of entries) {
      const [h, m] = e.time.split(":").map(Number);
      const doseMin = h * 60 + m;
      const iob = calculateIOB(e.dose, (midMin - doseMin) / 60, e.pharmacology);
      if (iob > 0.05) contributors.push({ name: `${e.insulinName} (${e.time})`, iob });
    }
    contributors.sort((a, b) => b.iob - a.iob);
    if (contributors.length >= 2) {
      stackingRisk = `Stacking risk: ${contributors[0].name} and ${contributors[1].name} overlap between ${fmt(dw.startMinute)}–${fmt(dw.endMinute)}`;
    }
  }

  // Basal contribution at peak
  const basalContribution = peakPoint && peakTotalIOB > 0
    ? (() => {
        let basalAtPeak = 0;
        for (let c = 0; c < 2; c++) {
          for (const e of basalEntries) {
            const [h, m] = e.time.split(":").map(Number);
            basalAtPeak += calculateIOB(e.dose, (peakPoint.minute - (h * 60 + m + c * 1440)) / 60, e.pharmacology);
          }
        }
        const pct = (basalAtPeak / peakPoint.iob * 100);
        return `Basal contribution: ${basalAtPeak.toFixed(1)}U (${pct.toFixed(0)}% of total) at peak`;
      })()
    : undefined;

  // Last bolus clear time
  let lastBolusClear: string | undefined;
  if (bolusEntries.length > 0) {
    let latestClear = 0;
    for (const e of bolusEntries) {
      const [h, m] = e.time.split(":").map(Number);
      const clearMin = h * 60 + m + e.pharmacology.durationMinutes;
      if (clearMin > latestClear) latestClear = clearMin;
    }
    const clearDay = latestClear >= 1440 ? latestClear - 1440 : latestClear;
    lastBolusClear = `Last bolus fully clears by approximately ${String(Math.floor(clearDay / 60)).padStart(2, "0")}:${String(clearDay % 60).padStart(2, "0")}`;
  }

  // Overnight note
  let overnightNote: string | undefined;
  {
    // Check IOB between 00:00–06:00
    let maxOvernightIOB = 0;
    for (let min = 0; min <= 360; min += 15) {
      let iobSum = 0;
      for (let c = 0; c < 2; c++) {
        for (const e of entries) {
          const [h, m] = e.time.split(":").map(Number);
          iobSum += calculateIOB(e.dose, (min - (h * 60 + m + c * 1440)) / 60, e.pharmacology);
        }
      }
      maxOvernightIOB = Math.max(maxOvernightIOB, iobSum);
    }
    if (maxOvernightIOB > 0.5) {
      overnightNote = `Between 00:00 and 06:00, up to ${maxOvernightIOB.toFixed(1)}U remains active against 6 hours of likely fasting`;
    }
  }

  return {
    basalCoverage,
    dangerText,
    bolusStacking,
    keyObservation,
    peakPressure,
    stackingRisk,
    basalContribution,
    lastBolusClear,
    overnightNote,
    disclaimer: "Educational only — based on published pharmacological data. Not a prescription. Discuss all changes with your care team. GluMira™ is not a medical device.",
  };
}

/**
 * Generate kids-friendly insight text.
 */
export function generateKidsInsight(
  entries: InsulinEntry[],
  dangerWindows: DangerWindow[],
  worstPressure: PressureClass,
  patientName?: string,
): InsightContent {
  const name = patientName || "your child";
  const basalEntries = entries.filter((e) => e.type === "basal");
  const bolusEntries = entries.filter((e) => e.type === "bolus");

  let basalCoverage: string;
  if (basalEntries.length === 0) {
    basalCoverage = "No background insulin waves right now.";
  } else {
    basalCoverage = `The big, slow wave is ${name}'s background insulin — it works all day and night like a gentle ocean current, keeping things steady even while sleeping.`;
  }

  let dangerText: string | undefined;
  if (dangerWindows.length > 0) {
    dangerText = `Watch here! The waves overlap ${dangerWindows.length} time${dangerWindows.length > 1 ? "s" : ""} — that means extra insulin is working at once. Keep a snack nearby during the red zones.`;
  }

  let bolusStacking: string;
  if (bolusEntries.length === 0) {
    bolusStacking = "No meal-time insulin mountains today.";
  } else {
    bolusStacking = `The pointy mountains are ${name}'s meal-time insulin — each one rises fast, does its job, and slowly goes away. ${worstPressure === "light" ? "They're nicely spaced apart!" : "Some mountains are close together — watch for extra-strong insulin waves."}`;
  }

  return {
    basalCoverage,
    dangerText,
    bolusStacking,
    keyObservation: worstPressure === "light" || worstPressure === "moderate"
      ? `${name}'s insulin pattern looks good today! The waves are spread out nicely.`
      : `Some insulin waves are piling up — that's a timing question to talk about with your doctor.`,
    disclaimer: "This is for learning only — always talk to your doctor before making changes.",
  };
}

/**
 * Generate mountain-themed insight text (Kids "Mountains" mode).
 * Same data, framed as a landscape: mountains, hills, valleys, weather.
 * NO scary language — nature metaphors only.
 */
export function generateMountainInsight(
  entries: InsulinEntry[],
  dangerWindows: DangerWindow[],
  worstPressure: PressureClass,
  patientName?: string,
): InsightContent {
  const name = patientName || "your child";
  const basalEntries = entries.filter((e) => e.type === "basal");
  const bolusEntries = entries.filter((e) => e.type === "bolus");

  const fmt = (m: number) => `${String(Math.floor((m % 1440) / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

  // Basal = rolling hills
  let basalCoverage: string;
  if (basalEntries.length === 0) {
    basalCoverage = "No rolling hills right now — only peaks from meal-time insulin.";
  } else {
    const names = [...new Set(basalEntries.map((e) => e.insulinName))];
    basalCoverage = `${name}'s ${names.join(" and ")} make${names.length === 1 ? "s" : ""} the wide rolling hills. They stretch all day and night like a gentle mountain range — always there, keeping things steady even while you sleep.`;
  }

  // Danger = stormy sky
  let dangerText: string | undefined;
  if (dangerWindows.length > 0) {
    const windows = dangerWindows.map((w) => `${fmt(w.startMinute)} and ${fmt(w.endMinute)}`);
    dangerText = `Between ${windows.join(", and between ")} the mountains are really big — that means lots of insulin is working. Make sure you've eaten enough!`;
  }

  // Bolus = tall pointy peaks
  let bolusStacking: string;
  if (bolusEntries.length === 0) {
    bolusStacking = "No tall peaks today — just the rolling hills from background insulin.";
  } else {
    const names = [...new Set(bolusEntries.map((e) => e.insulinName))];
    bolusStacking = `${name}'s ${names.join(" and ")} make${names.length === 1 ? "s" : ""} the tall pointy mountains. Each one shoots up fast when medicine is given, then slowly gets smaller. ${worstPressure === "light" ? "They're nicely spaced apart — like separate mountain peaks!" : "Some peaks are close together, so the mountains overlap a bit."}`;
  }

  // Find quiet valleys
  let quietNote = "";
  if (entries.length > 0) {
    // Simple: find the lowest-IOB stretch
    const allTimes = entries.map((e) => {
      const [h, m] = e.time.split(":").map(Number);
      return h * 60 + m;
    }).sort((a, b) => a - b);
    if (allTimes.length >= 2) {
      let longestGap = 0; let gapStart = 0; let gapEnd = 0;
      for (let i = 1; i < allTimes.length; i++) {
        const gap = allTimes[i] - allTimes[i - 1];
        if (gap > longestGap) { longestGap = gap; gapStart = allTimes[i - 1]; gapEnd = allTimes[i]; }
      }
      // Wrap-around gap
      const wrapGap = 1440 - allTimes[allTimes.length - 1] + allTimes[0];
      if (wrapGap > longestGap) { gapStart = allTimes[allTimes.length - 1]; gapEnd = allTimes[0]; }
      quietNote = ` The mountains are quiet between ${fmt(gapStart)} and ${fmt(gapEnd)} — your insulin is resting in a peaceful valley.`;
    }
  }

  // Overnight note for basal
  let overnightNote = "";
  if (basalEntries.length > 0) {
    overnightNote = " While you sleep, the hills are still there. Your long-acting insulin keeps working like a gentle hill all night.";
  }

  return {
    basalCoverage,
    dangerText,
    bolusStacking,
    keyObservation: worstPressure === "light" || worstPressure === "moderate"
      ? `Your biggest mountain is when your insulin is working the hardest.${quietNote}${overnightNote}`
      : `Some mountains are really big right now — that's a timing question to talk about with your doctor.${quietNote}${overnightNote}`,
    disclaimer: "This is for learning only — always talk to your doctor before making changes.",
  };
}
