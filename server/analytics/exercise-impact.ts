/**
 * GluMira™ — Exercise Impact Analysis Module
 *
 * Analyses how physical activity affects glucose levels, including
 * post-exercise glucose drop, delayed hypo risk, and optimal
 * pre-exercise glucose targets.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExerciseSession {
  type: string;            // e.g. "walking", "running", "cycling", "swimming", "weights"
  intensity: "low" | "moderate" | "high";
  durationMinutes: number;
  startTime: string;       // ISO timestamp
}

export interface GlucoseReading {
  mmol: number;
  timestamp: string;
}

export interface ExerciseGlucoseWindow {
  preExercise: number;     // avg glucose 30 min before
  duringExercise: number;  // avg glucose during
  postExercise: number;    // avg glucose 60 min after
  drop: number;            // preExercise - postExercise
  dropPercent: number;
}

export interface ExerciseImpactResult {
  session: ExerciseSession;
  glucoseWindow: ExerciseGlucoseWindow;
  delayedHypoRisk: "low" | "moderate" | "high";
  recommendation: string;
  safeToExercise: boolean;
  preExerciseTarget: { min: number; max: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function avgMmol(readings: GlucoseReading[]): number {
  if (readings.length === 0) return 0;
  return round2(readings.reduce((s, r) => s + r.mmol, 0) / readings.length);
}

function filterByWindow(
  readings: GlucoseReading[],
  startMs: number,
  endMs: number
): GlucoseReading[] {
  return readings.filter((r) => {
    const t = new Date(r.timestamp).getTime();
    return t >= startMs && t <= endMs;
  });
}

// ─── Pre-exercise safety ─────────────────────────────────────────────────────

/**
 * Determine if it is safe to exercise based on current glucose.
 * General guideline: 5.0–13.9 mmol/L is the safe zone.
 */
export function isSafeToExercise(currentGlucose: number): boolean {
  return currentGlucose >= 5.0 && currentGlucose <= 13.9;
}

/**
 * Get the recommended pre-exercise glucose target range.
 */
export function preExerciseTarget(intensity: "low" | "moderate" | "high"): { min: number; max: number } {
  switch (intensity) {
    case "low":      return { min: 5.0, max: 13.9 };
    case "moderate":  return { min: 7.0, max: 13.9 };
    case "high":     return { min: 8.0, max: 13.9 };
  }
}

// ─── Glucose window computation ──────────────────────────────────────────────

/**
 * Compute the glucose window around an exercise session.
 */
export function computeGlucoseWindow(
  session: ExerciseSession,
  readings: GlucoseReading[]
): ExerciseGlucoseWindow {
  const startMs = new Date(session.startTime).getTime();
  const endMs = startMs + session.durationMinutes * 60000;

  const preReadings = filterByWindow(readings, startMs - 30 * 60000, startMs);
  const duringReadings = filterByWindow(readings, startMs, endMs);
  const postReadings = filterByWindow(readings, endMs, endMs + 60 * 60000);

  const pre = avgMmol(preReadings);
  const during = avgMmol(duringReadings);
  const post = avgMmol(postReadings);
  const drop = round2(pre - post);
  const dropPercent = pre > 0 ? round2((drop / pre) * 100) : 0;

  return {
    preExercise: pre,
    duringExercise: during,
    postExercise: post,
    drop,
    dropPercent,
  };
}

// ─── Delayed hypo risk ───────────────────────────────────────────────────────

/**
 * Assess delayed hypoglycaemia risk based on exercise intensity,
 * duration, and post-exercise glucose level.
 */
export function assessDelayedHypoRisk(
  session: ExerciseSession,
  postExerciseGlucose: number
): "low" | "moderate" | "high" {
  const intensityScore = session.intensity === "high" ? 3 : session.intensity === "moderate" ? 2 : 1;
  const durationScore = session.durationMinutes > 60 ? 3 : session.durationMinutes > 30 ? 2 : 1;
  const glucoseScore = postExerciseGlucose < 5.0 ? 3 : postExerciseGlucose < 7.0 ? 2 : 1;

  const total = intensityScore + durationScore + glucoseScore;
  if (total >= 7) return "high";
  if (total >= 5) return "moderate";
  return "low";
}

// ─── Recommendation ──────────────────────────────────────────────────────────

/**
 * Generate an exercise recommendation based on the analysis.
 */
export function generateRecommendation(
  session: ExerciseSession,
  window: ExerciseGlucoseWindow,
  delayedRisk: "low" | "moderate" | "high"
): string {
  const parts: string[] = [];

  if (window.preExercise < 5.0) {
    parts.push("Consider a 15-20g carb snack before exercise.");
  }

  if (window.drop > 3.0) {
    parts.push(`Glucose dropped ${window.drop.toFixed(1)} mmol/L — consider reducing bolus before exercise.`);
  }

  if (delayedRisk === "high") {
    parts.push("High delayed hypo risk — monitor glucose closely for 6-8 hours post-exercise and consider a bedtime snack.");
  } else if (delayedRisk === "moderate") {
    parts.push("Moderate delayed hypo risk — check glucose before bed.");
  }

  if (session.intensity === "high" && session.durationMinutes > 45) {
    parts.push("For prolonged high-intensity exercise, consider temporary basal reduction.");
  }

  if (parts.length === 0) {
    parts.push("Exercise session looks well-managed. Keep up the good work!");
  }

  return parts.join(" ");
}

// ─── Full analysis ───────────────────────────────────────────────────────────

/**
 * Perform a complete exercise impact analysis.
 */
export function analyseExerciseImpact(
  session: ExerciseSession,
  readings: GlucoseReading[]
): ExerciseImpactResult {
  const glucoseWindow = computeGlucoseWindow(session, readings);
  const delayedHypoRisk = assessDelayedHypoRisk(session, glucoseWindow.postExercise);
  const recommendation = generateRecommendation(session, glucoseWindow, delayedHypoRisk);
  const safeToExercise = isSafeToExercise(glucoseWindow.preExercise);
  const target = preExerciseTarget(session.intensity);

  return {
    session,
    glucoseWindow,
    delayedHypoRisk,
    recommendation,
    safeToExercise,
    preExerciseTarget: target,
  };
}
