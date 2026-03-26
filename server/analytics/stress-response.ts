/**
 * GluMira™ — Stress Response Analysis Module
 *
 * Analyses glucose patterns during reported stress periods to identify
 * stress-induced hyperglycaemia, recovery patterns, and coping strategies.
 *
 * GluMira is an informational tool only. Not a medical device.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GlucoseReading {
  mmol: number;
  timestamp: string;
}

export interface StressPeriod {
  startTime: string;
  endTime: string;
  stressLevel: 1 | 2 | 3 | 4 | 5;  // 1 = mild, 5 = extreme
  category?: "work" | "emotional" | "physical" | "illness" | "other";
}

export interface StressGlucoseWindow {
  preMean: number;
  duringMean: number;
  postMean: number;
  peakDuring: number;
  nadirPost: number;
  riseFromBaseline: number;
  recoveryMinutes: number;
}

export interface StressCorrelation {
  stressLevel: number;
  avgGlucoseRise: number;
  avgRecoveryMinutes: number;
  sampleSize: number;
}

export interface StressReport {
  period: StressPeriod;
  glucoseWindow: StressGlucoseWindow;
  impactSeverity: "none" | "mild" | "moderate" | "significant";
  recommendation: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function mean(vals: number[]): number {
  if (vals.length === 0) return 0;
  return round2(vals.reduce((s, v) => s + v, 0) / vals.length);
}

function filterByTimeRange(
  readings: GlucoseReading[],
  start: string,
  end: string
): GlucoseReading[] {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  return readings.filter((r) => {
    const t = new Date(r.timestamp).getTime();
    return t >= startMs && t <= endMs;
  });
}

// ─── Pre-stress baseline ─────────────────────────────────────────────────────

export function computePreStressBaseline(
  readings: GlucoseReading[],
  stressStart: string,
  windowHours: number = 2
): number {
  const startMs = new Date(stressStart).getTime();
  const preStart = new Date(startMs - windowHours * 3600000).toISOString();
  const preReadings = filterByTimeRange(readings, preStart, stressStart);
  return mean(preReadings.map((r) => r.mmol));
}

// ─── Stress glucose window ───────────────────────────────────────────────────

export function computeStressGlucoseWindow(
  readings: GlucoseReading[],
  period: StressPeriod
): StressGlucoseWindow {
  const startMs = new Date(period.startTime).getTime();
  const endMs = new Date(period.endTime).getTime();
  const durationMs = endMs - startMs;

  // Pre: 2 hours before stress
  const preStart = new Date(startMs - 2 * 3600000).toISOString();
  const preReadings = filterByTimeRange(readings, preStart, period.startTime);
  const preMean = mean(preReadings.map((r) => r.mmol));

  // During stress
  const duringReadings = filterByTimeRange(readings, period.startTime, period.endTime);
  const duringVals = duringReadings.map((r) => r.mmol);
  const duringMean = mean(duringVals);
  const peakDuring = duringVals.length > 0 ? round2(Math.max(...duringVals)) : 0;

  // Post: same duration as stress period, after end
  const postEnd = new Date(endMs + durationMs).toISOString();
  const postReadings = filterByTimeRange(readings, period.endTime, postEnd);
  const postVals = postReadings.map((r) => r.mmol);
  const postMean = mean(postVals);
  const nadirPost = postVals.length > 0 ? round2(Math.min(...postVals)) : 0;

  const riseFromBaseline = round2(duringMean - preMean);

  // Recovery: time from stress end until glucose returns to within 0.5 of preMean
  let recoveryMinutes = 0;
  if (postReadings.length > 0 && preMean > 0) {
    const recoveredReading = postReadings.find((r) => Math.abs(r.mmol - preMean) <= 0.5);
    if (recoveredReading) {
      recoveryMinutes = Math.round(
        (new Date(recoveredReading.timestamp).getTime() - endMs) / 60000
      );
    } else {
      recoveryMinutes = Math.round(durationMs / 60000); // didn't recover in window
    }
  }

  return {
    preMean,
    duringMean,
    postMean,
    peakDuring,
    nadirPost,
    riseFromBaseline,
    recoveryMinutes,
  };
}

// ─── Impact severity ─────────────────────────────────────────────────────────

export function classifyImpactSeverity(
  riseFromBaseline: number
): "none" | "mild" | "moderate" | "significant" {
  if (riseFromBaseline < 0.5) return "none";
  if (riseFromBaseline < 1.5) return "mild";
  if (riseFromBaseline < 3.0) return "moderate";
  return "significant";
}

// ─── Severity colour ─────────────────────────────────────────────────────────

export function severityColour(
  severity: "none" | "mild" | "moderate" | "significant"
): string {
  switch (severity) {
    case "none": return "#22c55e";
    case "mild": return "#84cc16";
    case "moderate": return "#f59e0b";
    case "significant": return "#ef4444";
  }
}

// ─── Recommendation ──────────────────────────────────────────────────────────

export function generateStressRecommendation(
  severity: "none" | "mild" | "moderate" | "significant",
  period: StressPeriod,
  recoveryMinutes: number
): string {
  if (severity === "none") {
    return "Stress had minimal impact on glucose. Continue current management.";
  }

  const parts: string[] = [];

  if (severity === "significant") {
    parts.push("Significant stress-induced glucose rise detected.");
    parts.push("Consider discussing stress management strategies with your clinician.");
  } else if (severity === "moderate") {
    parts.push("Moderate glucose rise during stress period.");
  } else {
    parts.push("Mild glucose elevation during stress.");
  }

  if (recoveryMinutes > 120) {
    parts.push("Recovery took over 2 hours — monitor closely after stressful events.");
  }

  if (period.stressLevel >= 4) {
    parts.push("High stress level reported — breathing exercises or short walks may help.");
  }

  if (period.category === "work") {
    parts.push("Work-related stress pattern — consider scheduled breaks.");
  } else if (period.category === "illness") {
    parts.push("Illness-related stress — follow sick-day management guidelines.");
  }

  return parts.join(" ");
}

// ─── Correlation across periods ──────────────────────────────────────────────

export function computeStressCorrelation(
  readings: GlucoseReading[],
  periods: StressPeriod[]
): StressCorrelation[] {
  const byLevel = new Map<number, { rises: number[]; recoveries: number[] }>();

  for (const p of periods) {
    const window = computeStressGlucoseWindow(readings, p);
    const level = p.stressLevel;
    if (!byLevel.has(level)) byLevel.set(level, { rises: [], recoveries: [] });
    const bucket = byLevel.get(level)!;
    bucket.rises.push(window.riseFromBaseline);
    bucket.recoveries.push(window.recoveryMinutes);
  }

  const results: StressCorrelation[] = [];
  for (const [level, data] of byLevel.entries()) {
    results.push({
      stressLevel: level,
      avgGlucoseRise: round2(mean(data.rises)),
      avgRecoveryMinutes: Math.round(mean(data.recoveries)),
      sampleSize: data.rises.length,
    });
  }

  return results.sort((a, b) => a.stressLevel - b.stressLevel);
}

// ─── Full report ─────────────────────────────────────────────────────────────

export function generateStressReport(
  readings: GlucoseReading[],
  period: StressPeriod
): StressReport {
  const glucoseWindow = computeStressGlucoseWindow(readings, period);
  const impactSeverity = classifyImpactSeverity(glucoseWindow.riseFromBaseline);
  const recommendation = generateStressRecommendation(
    impactSeverity,
    period,
    glucoseWindow.recoveryMinutes
  );

  return { period, glucoseWindow, impactSeverity, recommendation };
}
