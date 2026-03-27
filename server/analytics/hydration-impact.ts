/**
 * GluMira™ — Hydration Impact Analysis Module
 *
 * Analyses how hydration levels correlate with glucose readings.
 * Dehydration is known to concentrate blood glucose, producing
 * artificially elevated readings.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HydrationEntry {
  ml: number;
  timestamp: string;
}

export interface GlucoseReading {
  mmol: number;
  timestamp: string;
}

export interface HourlyHydration {
  hour: number;
  totalMl: number;
  entryCount: number;
}

export interface HydrationCorrelation {
  hydrationLevel: "well-hydrated" | "adequate" | "low" | "dehydrated";
  meanGlucose: number;
  readingCount: number;
}

export interface HydrationReport {
  dailyTotalMl: number;
  dailyTarget: number;
  percentOfTarget: number;
  hydrationStatus: "well-hydrated" | "adequate" | "low" | "dehydrated";
  hourlyBreakdown: HourlyHydration[];
  correlations: HydrationCorrelation[];
  recommendations: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const DEFAULT_DAILY_TARGET_ML = 2500;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function mean(vals: number[]): number {
  if (vals.length === 0) return 0;
  return round2(vals.reduce((s, v) => s + v, 0) / vals.length);
}

function getHour(ts: string): number {
  return new Date(ts).getHours();
}

// ─── Classify hydration ──────────────────────────────────────────────────────

export function classifyHydration(
  totalMl: number,
  targetMl: number = DEFAULT_DAILY_TARGET_ML
): "well-hydrated" | "adequate" | "low" | "dehydrated" {
  const pct = totalMl / targetMl;
  if (pct >= 0.9) return "well-hydrated";
  if (pct >= 0.6) return "adequate";
  if (pct >= 0.3) return "low";
  return "dehydrated";
}

// ─── Hydration colour ────────────────────────────────────────────────────────

export function hydrationColour(
  status: "well-hydrated" | "adequate" | "low" | "dehydrated"
): string {
  switch (status) {
    case "well-hydrated": return "#22c55e";
    case "adequate": return "#3b82f6";
    case "low": return "#f59e0b";
    case "dehydrated": return "#ef4444";
  }
}

// ─── Hourly breakdown ────────────────────────────────────────────────────────

export function computeHourlyHydration(
  entries: HydrationEntry[]
): HourlyHydration[] {
  const map = new Map<number, { totalMl: number; count: number }>();

  for (const e of entries) {
    const h = getHour(e.timestamp);
    const cur = map.get(h) ?? { totalMl: 0, count: 0 };
    cur.totalMl += e.ml;
    cur.count += 1;
    map.set(h, cur);
  }

  return Array.from(map.entries())
    .map(([hour, data]) => ({
      hour,
      totalMl: round2(data.totalMl),
      entryCount: data.count,
    }))
    .sort((a, b) => a.hour - b.hour);
}

// ─── Correlation ─────────────────────────────────────────────────────────────

export function computeHydrationCorrelation(
  hydrationEntries: HydrationEntry[],
  glucoseReadings: GlucoseReading[],
  windowHours: number = 2
): HydrationCorrelation[] {
  const buckets: Record<string, number[]> = {
    "well-hydrated": [],
    adequate: [],
    low: [],
    dehydrated: [],
  };

  for (const reading of glucoseReadings) {
    const readingTime = new Date(reading.timestamp).getTime();
    const windowStart = readingTime - windowHours * 3600000;

    const recentMl = hydrationEntries
      .filter((e) => {
        const t = new Date(e.timestamp).getTime();
        return t >= windowStart && t <= readingTime;
      })
      .reduce((sum, e) => sum + e.ml, 0);

    // Extrapolate to daily rate: recentMl in windowHours → daily
    const dailyRate = (recentMl / windowHours) * 24;
    const status = classifyHydration(dailyRate);
    buckets[status].push(reading.mmol);
  }

  return (Object.entries(buckets) as [string, number[]][])
    .filter(([, vals]) => vals.length > 0)
    .map(([level, vals]) => ({
      hydrationLevel: level as HydrationCorrelation["hydrationLevel"],
      meanGlucose: mean(vals),
      readingCount: vals.length,
    }));
}

// ─── Recommendations ─────────────────────────────────────────────────────────

export function generateHydrationRecommendations(
  status: "well-hydrated" | "adequate" | "low" | "dehydrated",
  percentOfTarget: number
): string[] {
  const recs: string[] = [];

  if (status === "dehydrated") {
    recs.push("Critically low hydration — dehydration may cause artificially elevated glucose readings.");
    recs.push("Aim to drink at least 250ml every hour during waking hours.");
  } else if (status === "low") {
    recs.push("Hydration is below target. Consider increasing water intake to improve reading accuracy.");
  } else if (status === "adequate") {
    recs.push("Hydration is adequate but could be improved. Try to reach your daily target.");
  } else {
    recs.push("Hydration is on target. Good work maintaining fluid intake.");
  }

  if (percentOfTarget < 50) {
    recs.push("Set regular reminders to drink water throughout the day.");
  }

  return recs;
}

// ─── Full report ─────────────────────────────────────────────────────────────

export function generateHydrationReport(
  hydrationEntries: HydrationEntry[],
  glucoseReadings: GlucoseReading[],
  targetMl: number = DEFAULT_DAILY_TARGET_ML
): HydrationReport {
  const dailyTotalMl = round2(hydrationEntries.reduce((s, e) => s + e.ml, 0));
  const percentOfTarget = round2((dailyTotalMl / targetMl) * 100);
  const hydrationStatus = classifyHydration(dailyTotalMl, targetMl);
  const hourlyBreakdown = computeHourlyHydration(hydrationEntries);
  const correlations = computeHydrationCorrelation(hydrationEntries, glucoseReadings);
  const recommendations = generateHydrationRecommendations(hydrationStatus, percentOfTarget);

  return {
    dailyTotalMl,
    dailyTarget: targetMl,
    percentOfTarget,
    hydrationStatus,
    hourlyBreakdown,
    correlations,
    recommendations,
  };
}
