/**
 * GluMira — Glucose Report Generator Module
 *
 * Generates structured glucose reports for patients and clinicians.
 * Computes period summaries, trend analysis, and actionable insights.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GlucoseReading {
  mmol: number;
  timestamp: string;
}

export interface ReportPeriod {
  label: string;
  startDate: string;
  endDate: string;
  readingCount: number;
  mean: number;
  median: number;
  stdDev: number;
  cv: number;
  tirPercent: number;
  belowRangePercent: number;
  aboveRangePercent: number;
  gmi: number;
  lowestReading: number;
  highestReading: number;
}

export interface TrendComparison {
  metric: string;
  previous: number;
  current: number;
  delta: number;
  direction: "improving" | "stable" | "worsening";
}

export interface GlucoseReport {
  generatedAt: string;
  patientId: string;
  periods: ReportPeriod[];
  trends: TrendComparison[];
  insights: string[];
  overallStatus: "excellent" | "good" | "needs-attention" | "concerning";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

// ─── Period computation ──────────────────────────────────────────────────────

export function computeReportPeriod(
  label: string,
  readings: GlucoseReading[],
  targetLow: number = 3.9,
  targetHigh: number = 10.0
): ReportPeriod {
  if (readings.length === 0) {
    return {
      label,
      startDate: "",
      endDate: "",
      readingCount: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      cv: 0,
      tirPercent: 0,
      belowRangePercent: 0,
      aboveRangePercent: 0,
      gmi: 0,
      lowestReading: 0,
      highestReading: 0,
    };
  }

  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const values = sorted.map((r) => r.mmol);
  const m = mean(values);
  const sd = stdDev(values);
  const inRange = values.filter((v) => v >= targetLow && v <= targetHigh).length;
  const below = values.filter((v) => v < targetLow).length;
  const above = values.filter((v) => v > targetHigh).length;
  const total = values.length;

  // GMI = 3.31 + 0.02392 × mean_mg_dl
  const meanMgdl = m * 18.0182;
  const gmi = 3.31 + 0.02392 * meanMgdl;

  return {
    label,
    startDate: sorted[0].timestamp,
    endDate: sorted[sorted.length - 1].timestamp,
    readingCount: total,
    mean: round2(m),
    median: round2(median(values)),
    stdDev: round2(sd),
    cv: m > 0 ? round2((sd / m) * 100) : 0,
    tirPercent: round2((inRange / total) * 100),
    belowRangePercent: round2((below / total) * 100),
    aboveRangePercent: round2((above / total) * 100),
    gmi: round2(gmi),
    lowestReading: round2(Math.min(...values)),
    highestReading: round2(Math.max(...values)),
  };
}

// ─── Trend comparison ────────────────────────────────────────────────────────

export function comparePeriods(
  previous: ReportPeriod,
  current: ReportPeriod
): TrendComparison[] {
  const metrics: { metric: string; prev: number; curr: number; lowerIsBetter: boolean }[] = [
    { metric: "Mean Glucose", prev: previous.mean, curr: current.mean, lowerIsBetter: true },
    { metric: "CV%", prev: previous.cv, curr: current.cv, lowerIsBetter: true },
    { metric: "TIR%", prev: previous.tirPercent, curr: current.tirPercent, lowerIsBetter: false },
    { metric: "GMI", prev: previous.gmi, curr: current.gmi, lowerIsBetter: true },
    { metric: "Below Range%", prev: previous.belowRangePercent, curr: current.belowRangePercent, lowerIsBetter: true },
  ];

  return metrics.map(({ metric, prev, curr, lowerIsBetter }) => {
    const delta = round2(curr - prev);
    const threshold = 1; // 1 unit threshold for "stable"
    let direction: "improving" | "stable" | "worsening";

    if (Math.abs(delta) < threshold) {
      direction = "stable";
    } else if (lowerIsBetter) {
      direction = delta < 0 ? "improving" : "worsening";
    } else {
      direction = delta > 0 ? "improving" : "worsening";
    }

    return { metric, previous: prev, current: curr, delta, direction };
  });
}

// ─── Insights ────────────────────────────────────────────────────────────────

export function generateInsights(period: ReportPeriod, trends: TrendComparison[]): string[] {
  const insights: string[] = [];

  if (period.tirPercent >= 70) {
    insights.push(`Time in range is ${period.tirPercent}% — meeting the recommended target of ≥70%`);
  } else {
    insights.push(`Time in range is ${period.tirPercent}% — below the recommended target of 70%`);
  }

  if (period.cv > 36) {
    insights.push(`Glucose variability (CV ${period.cv}%) is high — target is below 36%`);
  }

  if (period.belowRangePercent > 4) {
    insights.push(`Below-range time is ${period.belowRangePercent}% — exceeds the 4% safety threshold`);
  }

  if (period.gmi > 7.0) {
    insights.push(`Estimated A1c (GMI) is ${period.gmi}% — above the 7.0% target`);
  }

  const improving = trends.filter((t) => t.direction === "improving");
  if (improving.length > 0) {
    insights.push(`Improving trends: ${improving.map((t) => t.metric).join(", ")}`);
  }

  const worsening = trends.filter((t) => t.direction === "worsening");
  if (worsening.length > 0) {
    insights.push(`Areas needing attention: ${worsening.map((t) => t.metric).join(", ")}`);
  }

  return insights;
}

// ─── Overall status ──────────────────────────────────────────────────────────

export function classifyOverallStatus(
  period: ReportPeriod
): "excellent" | "good" | "needs-attention" | "concerning" {
  const score =
    (period.tirPercent >= 70 ? 2 : period.tirPercent >= 50 ? 1 : 0) +
    (period.cv <= 36 ? 2 : period.cv <= 42 ? 1 : 0) +
    (period.belowRangePercent <= 4 ? 2 : period.belowRangePercent <= 8 ? 1 : 0) +
    (period.gmi <= 7.0 ? 2 : period.gmi <= 8.0 ? 1 : 0);

  if (score >= 7) return "excellent";
  if (score >= 5) return "good";
  if (score >= 3) return "needs-attention";
  return "concerning";
}

// ─── Status label + colour ───────────────────────────────────────────────────

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    excellent: "Excellent glucose management",
    good: "Good glucose management",
    "needs-attention": "Some areas need attention",
    concerning: "Glucose management needs review",
  };
  return labels[status] ?? "Unknown";
}

export function statusColour(status: string): string {
  const colours: Record<string, string> = {
    excellent: "green",
    good: "blue",
    "needs-attention": "amber",
    concerning: "red",
  };
  return colours[status] ?? "gray";
}

// ─── Main report generator ───────────────────────────────────────────────────

export function generateGlucoseReport(
  patientId: string,
  currentReadings: GlucoseReading[],
  previousReadings: GlucoseReading[] = []
): GlucoseReport {
  const currentPeriod = computeReportPeriod("Current Period", currentReadings);
  const previousPeriod = computeReportPeriod("Previous Period", previousReadings);

  const periods = [currentPeriod];
  if (previousReadings.length > 0) periods.push(previousPeriod);

  const trends =
    previousReadings.length > 0 ? comparePeriods(previousPeriod, currentPeriod) : [];
  const insights = generateInsights(currentPeriod, trends);
  const overallStatus = classifyOverallStatus(currentPeriod);

  return {
    generatedAt: new Date().toISOString(),
    patientId,
    periods,
    trends,
    insights,
    overallStatus,
  };
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
