/**
 * GluMira™ — Sleep Quality Analysis Module
 *
 * Analyses overnight glucose patterns to assess sleep quality impact,
 * including nocturnal hypo/hyper events, dawn phenomenon detection,
 * and overnight glucose stability.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GlucoseReading {
  mmol: number;
  timestamp: string;
}

export interface OvernightWindow {
  bedtime: string;   // ISO timestamp
  wakeTime: string;  // ISO timestamp
}

export interface NocturnalEvent {
  type: "hypo" | "hyper";
  mmol: number;
  timestamp: string;
  duration?: number; // minutes
}

export interface OvernightStats {
  mean: number;
  sd: number;
  cv: number;
  min: number;
  max: number;
  readingCount: number;
  timeInRange: number;    // percent 3.9–10.0
  timeBelowRange: number; // percent < 3.9
  timeAboveRange: number; // percent > 10.0
}

export interface DawnPhenomenonResult {
  detected: boolean;
  riseStart?: string;
  riseMmol?: number;
  severity?: "mild" | "moderate" | "significant";
}

export interface SleepQualityReport {
  window: OvernightWindow;
  stats: OvernightStats;
  events: NocturnalEvent[];
  dawnPhenomenon: DawnPhenomenonResult;
  stabilityScore: number;   // 0–100
  qualityLabel: string;
  recommendations: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function filterOvernight(readings: GlucoseReading[], window: OvernightWindow): GlucoseReading[] {
  const bedMs = new Date(window.bedtime).getTime();
  const wakeMs = new Date(window.wakeTime).getTime();
  return readings.filter((r) => {
    const t = new Date(r.timestamp).getTime();
    return t >= bedMs && t <= wakeMs;
  });
}

// ─── Overnight stats ─────────────────────────────────────────────────────────

export function computeOvernightStats(readings: GlucoseReading[]): OvernightStats {
  if (readings.length === 0) {
    return { mean: 0, sd: 0, cv: 0, min: 0, max: 0, readingCount: 0, timeInRange: 0, timeBelowRange: 0, timeAboveRange: 0 };
  }

  const vals = readings.map((r) => r.mmol);
  const mean = round2(vals.reduce((s, v) => s + v, 0) / vals.length);
  const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
  const sd = round2(Math.sqrt(variance));
  const cv = mean > 0 ? round2((sd / mean) * 100) : 0;

  const inRange = vals.filter((v) => v >= 3.9 && v <= 10.0).length;
  const below = vals.filter((v) => v < 3.9).length;
  const above = vals.filter((v) => v > 10.0).length;

  return {
    mean,
    sd,
    cv,
    min: round2(Math.min(...vals)),
    max: round2(Math.max(...vals)),
    readingCount: vals.length,
    timeInRange: round2((inRange / vals.length) * 100),
    timeBelowRange: round2((below / vals.length) * 100),
    timeAboveRange: round2((above / vals.length) * 100),
  };
}

// ─── Nocturnal events ────────────────────────────────────────────────────────

export function detectNocturnalEvents(readings: GlucoseReading[]): NocturnalEvent[] {
  const events: NocturnalEvent[] = [];
  for (const r of readings) {
    if (r.mmol < 3.9) {
      events.push({ type: "hypo", mmol: r.mmol, timestamp: r.timestamp });
    } else if (r.mmol > 13.9) {
      events.push({ type: "hyper", mmol: r.mmol, timestamp: r.timestamp });
    }
  }
  return events;
}

// ─── Dawn phenomenon ─────────────────────────────────────────────────────────

export function detectDawnPhenomenon(
  readings: GlucoseReading[],
  wakeTime: string
): DawnPhenomenonResult {
  if (readings.length < 4) return { detected: false };

  const wakeMs = new Date(wakeTime).getTime();
  // Look at last 2 hours before wake
  const dawnReadings = readings.filter((r) => {
    const t = new Date(r.timestamp).getTime();
    return t >= wakeMs - 2 * 3600000 && t <= wakeMs;
  });

  if (dawnReadings.length < 2) return { detected: false };

  const first = dawnReadings[0].mmol;
  const last = dawnReadings[dawnReadings.length - 1].mmol;
  const rise = round2(last - first);

  if (rise < 1.0) return { detected: false };

  const severity: "mild" | "moderate" | "significant" =
    rise >= 3.0 ? "significant" : rise >= 2.0 ? "moderate" : "mild";

  return {
    detected: true,
    riseStart: dawnReadings[0].timestamp,
    riseMmol: rise,
    severity,
  };
}

// ─── Stability score ─────────────────────────────────────────────────────────

export function computeStabilityScore(stats: OvernightStats): number {
  if (stats.readingCount === 0) return 0;

  // Lower CV = more stable. CV of 0 = 100, CV of 50+ = 0
  const cvScore = Math.max(0, 100 - stats.cv * 2);
  // Higher TIR = better
  const tirScore = stats.timeInRange;
  // Fewer excursions = better
  const rangeScore = Math.max(0, 100 - (stats.max - stats.min) * 10);

  const raw = cvScore * 0.4 + tirScore * 0.4 + rangeScore * 0.2;
  return Math.round(Math.max(0, Math.min(100, raw)));
}

// ─── Quality label ───────────────────────────────────────────────────────────

export function qualityLabel(score: number): string {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 30) return "Poor";
  return "Very Poor";
}

// ─── Recommendations ─────────────────────────────────────────────────────────

export function generateRecommendations(
  stats: OvernightStats,
  events: NocturnalEvent[],
  dawn: DawnPhenomenonResult
): string[] {
  const recs: string[] = [];

  const hypoCount = events.filter((e) => e.type === "hypo").length;
  const hyperCount = events.filter((e) => e.type === "hyper").length;

  if (hypoCount > 0) {
    recs.push(`${hypoCount} nocturnal hypo event(s) detected — consider a bedtime snack or basal rate reduction.`);
  }
  if (hyperCount > 0) {
    recs.push(`${hyperCount} nocturnal hyper event(s) detected — review evening meal carbs and correction bolus.`);
  }
  if (dawn.detected) {
    recs.push(`Dawn phenomenon detected (${dawn.riseMmol?.toFixed(1)} mmol/L rise, ${dawn.severity}) — discuss with clinician.`);
  }
  if (stats.cv > 36) {
    recs.push("High overnight glucose variability — consider adjusting basal insulin timing.");
  }
  if (stats.timeBelowRange > 5) {
    recs.push("Significant time below range overnight — reduce overnight basal or add bedtime snack.");
  }
  if (recs.length === 0) {
    recs.push("Overnight glucose was well-managed. Keep up the good work!");
  }

  return recs;
}

// ─── Full report ─────────────────────────────────────────────────────────────

export function generateSleepQualityReport(
  readings: GlucoseReading[],
  window: OvernightWindow
): SleepQualityReport {
  const overnightReadings = filterOvernight(readings, window);
  const stats = computeOvernightStats(overnightReadings);
  const events = detectNocturnalEvents(overnightReadings);
  const dawnPhenomenon = detectDawnPhenomenon(overnightReadings, window.wakeTime);
  const stabilityScore = computeStabilityScore(stats);
  const label = qualityLabel(stabilityScore);
  const recommendations = generateRecommendations(stats, events, dawnPhenomenon);

  return {
    window,
    stats,
    events,
    dawnPhenomenon,
    stabilityScore,
    qualityLabel: label,
    recommendations,
  };
}
