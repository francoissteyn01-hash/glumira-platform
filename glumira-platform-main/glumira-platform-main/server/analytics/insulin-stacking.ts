/**
 * GluMira — Insulin Stacking Analysis Module
 *
 * Detects and quantifies insulin stacking risk by analysing dose timing,
 * overlapping IOB curves, and correction-on-correction patterns.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DoseEntry {
  units: number;
  administeredAt: string;
  type: "bolus" | "correction" | "basal";
  insulinType?: string;
}

export interface StackingWindow {
  startTime: string;
  endTime: string;
  doses: DoseEntry[];
  totalUnits: number;
  overlapMinutes: number;
  peakIob: number;
  riskLevel: "none" | "low" | "moderate" | "high" | "critical";
}

export interface StackingAnalysis {
  windows: StackingWindow[];
  totalStackingEvents: number;
  maxOverlapUnits: number;
  averageTimeBetweenDoses: number;
  riskSummary: string;
  overallRisk: "none" | "low" | "moderate" | "high" | "critical";
  recommendations: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_DIA_HOURS = 5;
const DEFAULT_PEAK_MINUTES = 75;
const STACKING_THRESHOLD_MINUTES = 120; // doses within 2h overlap significantly

// ─── IOB Decay ────────────────────────────────────────────────────────────────

export function computeIobAtTime(
  dose: DoseEntry,
  atTime: Date,
  diaHours: number = DEFAULT_DIA_HOURS,
  peakMin: number = DEFAULT_PEAK_MINUTES
): number {
  const doseTime = new Date(dose.administeredAt).getTime();
  const elapsed = (atTime.getTime() - doseTime) / 60000; // minutes
  const totalMin = diaHours * 60;

  if (elapsed < 0 || elapsed > totalMin) return 0;

  if (elapsed <= peakMin) {
    return dose.units * (1 - elapsed / (2 * peakMin));
  }

  const remaining = totalMin - peakMin;
  const fraction = (elapsed - peakMin) / remaining;
  return dose.units * 0.5 * (1 - fraction);
}

// ─── Stacking detection ──────────────────────────────────────────────────────

export function detectStackingWindows(
  doses: DoseEntry[],
  windowMinutes: number = STACKING_THRESHOLD_MINUTES
): StackingWindow[] {
  if (doses.length < 2) return [];

  const sorted = [...doses]
    .filter((d) => d.type !== "basal")
    .sort((a, b) => new Date(a.administeredAt).getTime() - new Date(b.administeredAt).getTime());

  const windows: StackingWindow[] = [];
  let i = 0;

  while (i < sorted.length) {
    const windowStart = new Date(sorted[i].administeredAt);
    const windowEnd = new Date(windowStart.getTime() + windowMinutes * 60000);
    const windowDoses: DoseEntry[] = [sorted[i]];

    let j = i + 1;
    while (j < sorted.length && new Date(sorted[j].administeredAt) <= windowEnd) {
      windowDoses.push(sorted[j]);
      j++;
    }

    if (windowDoses.length >= 2) {
      const totalUnits = windowDoses.reduce((s, d) => s + d.units, 0);
      const firstTime = new Date(windowDoses[0].administeredAt).getTime();
      const lastTime = new Date(windowDoses[windowDoses.length - 1].administeredAt).getTime();
      const overlapMinutes = Math.round((lastTime - firstTime) / 60000);

      // Compute peak IOB at midpoint
      const midpoint = new Date(firstTime + (lastTime - firstTime) / 2);
      const peakIob = windowDoses.reduce((s, d) => s + computeIobAtTime(d, midpoint), 0);

      const riskLevel = classifyStackingRisk(totalUnits, overlapMinutes, windowDoses.length);

      windows.push({
        startTime: windowDoses[0].administeredAt,
        endTime: windowDoses[windowDoses.length - 1].administeredAt,
        doses: windowDoses,
        totalUnits: Math.round(totalUnits * 10) / 10,
        overlapMinutes,
        peakIob: Math.round(peakIob * 10) / 10,
        riskLevel,
      });
    }

    i = j > i + 1 ? j : i + 1;
  }

  return windows;
}

// ─── Risk classification ─────────────────────────────────────────────────────

export function classifyStackingRisk(
  totalUnits: number,
  overlapMinutes: number,
  doseCount: number
): "none" | "low" | "moderate" | "high" | "critical" {
  if (doseCount < 2) return "none";

  const score =
    (totalUnits > 15 ? 3 : totalUnits > 10 ? 2 : totalUnits > 5 ? 1 : 0) +
    (overlapMinutes < 30 ? 3 : overlapMinutes < 60 ? 2 : overlapMinutes < 90 ? 1 : 0) +
    (doseCount > 3 ? 2 : doseCount > 2 ? 1 : 0);

  if (score >= 6) return "critical";
  if (score >= 4) return "high";
  if (score >= 2) return "moderate";
  if (score >= 1) return "low";
  return "none";
}

// ─── Risk label + colour ─────────────────────────────────────────────────────

export function stackingRiskLabel(risk: string): string {
  const labels: Record<string, string> = {
    none: "No stacking risk",
    low: "Low stacking risk",
    moderate: "Moderate stacking risk",
    high: "High stacking risk — review doses",
    critical: "Critical stacking risk — immediate review needed",
  };
  return labels[risk] ?? "Unknown";
}

export function stackingRiskColour(risk: string): string {
  const colours: Record<string, string> = {
    none: "green",
    low: "blue",
    moderate: "amber",
    high: "orange",
    critical: "red",
  };
  return colours[risk] ?? "gray";
}

// ─── Time between doses ──────────────────────────────────────────────────────

export function averageTimeBetweenDoses(doses: DoseEntry[]): number {
  const nonBasal = doses
    .filter((d) => d.type !== "basal")
    .sort((a, b) => new Date(a.administeredAt).getTime() - new Date(b.administeredAt).getTime());

  if (nonBasal.length < 2) return 0;

  let totalMin = 0;
  for (let i = 1; i < nonBasal.length; i++) {
    totalMin +=
      (new Date(nonBasal[i].administeredAt).getTime() -
        new Date(nonBasal[i - 1].administeredAt).getTime()) /
      60000;
  }

  return Math.round(totalMin / (nonBasal.length - 1));
}

// ─── Recommendations ─────────────────────────────────────────────────────────

export function generateRecommendations(windows: StackingWindow[]): string[] {
  const recs: string[] = [];

  const hasHigh = windows.some((w) => w.riskLevel === "high" || w.riskLevel === "critical");
  const hasModerate = windows.some((w) => w.riskLevel === "moderate");
  const shortGaps = windows.filter((w) => w.overlapMinutes < 60);

  if (hasHigh) {
    recs.push("Consider waiting at least 2 hours between correction doses to allow IOB to peak");
  }
  if (shortGaps.length > 0) {
    recs.push(
      `${shortGaps.length} dose window(s) had less than 60 minutes between doses — review timing`
    );
  }
  if (hasModerate) {
    recs.push("Use a bolus calculator that accounts for active IOB before dosing");
  }
  if (windows.length === 0) {
    recs.push("No stacking events detected — good dose spacing");
  }

  return recs;
}

// ─── Main analysis function ──────────────────────────────────────────────────

export function analyseInsulinStacking(doses: DoseEntry[]): StackingAnalysis {
  const windows = detectStackingWindows(doses);
  const avgTime = averageTimeBetweenDoses(doses);
  const recommendations = generateRecommendations(windows);

  const maxOverlap = windows.reduce((max, w) => Math.max(max, w.totalUnits), 0);
  const overallRisk =
    windows.length === 0
      ? "none"
      : windows.reduce(
          (worst, w) => {
            const order = ["none", "low", "moderate", "high", "critical"];
            return order.indexOf(w.riskLevel) > order.indexOf(worst) ? w.riskLevel : worst;
          },
          "none" as "none" | "low" | "moderate" | "high" | "critical"
        );

  return {
    windows,
    totalStackingEvents: windows.length,
    maxOverlapUnits: Math.round(maxOverlap * 10) / 10,
    averageTimeBetweenDoses: avgTime,
    riskSummary: stackingRiskLabel(overallRisk),
    overallRisk,
    recommendations,
  };
}
