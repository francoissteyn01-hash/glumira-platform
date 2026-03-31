/**
 * GluMira — Glucose Prediction Module
 *
 * Predicts short-term glucose trajectory using linear regression
 * and exponential smoothing on recent CGM readings.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GlucoseReading {
  mmol: number;
  timestamp: string;
}

export interface PredictionPoint {
  mmol: number;
  minutesAhead: number;
  confidence: number; // 0-1
}

export interface GlucosePrediction {
  currentMmol: number;
  rateOfChange: number; // mmol/min
  rateLabel: string;
  predictions: PredictionPoint[];
  urgency: "none" | "low" | "moderate" | "high" | "urgent";
  urgencyLabel: string;
  arrow: string;
}

export type TrendArrow = "↑↑" | "↑" | "↗" | "→" | "↘" | "↓" | "↓↓";

// ─── Rate of change helpers ──────────────────────────────────────────────────

export function computeRateOfChange(readings: GlucoseReading[]): number {
  if (readings.length < 2) return 0;

  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Use last 5 readings for smoothed rate
  const recent = sorted.slice(-Math.min(5, sorted.length));
  const n = recent.length;

  // Simple linear regression
  const times = recent.map((r) => new Date(r.timestamp).getTime() / 60000); // minutes
  const values = recent.map((r) => r.mmol);

  const meanT = times.reduce((s, t) => s + t, 0) / n;
  const meanV = values.reduce((s, v) => s + v, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (times[i] - meanT) * (values[i] - meanV);
    den += (times[i] - meanT) ** 2;
  }

  if (den === 0) return 0;
  return Math.round((num / den) * 10000) / 10000; // mmol/min
}

// ─── Trend arrow ─────────────────────────────────────────────────────────────

export function rateToArrow(ratePerMin: number): TrendArrow {
  const ratePerHour = ratePerMin * 60;
  if (ratePerHour > 3.0) return "↑↑";
  if (ratePerHour > 2.0) return "↑";
  if (ratePerHour > 1.0) return "↗";
  if (ratePerHour > -1.0) return "→";
  if (ratePerHour > -2.0) return "↘";
  if (ratePerHour > -3.0) return "↓";
  return "↓↓";
}

export function rateToLabel(ratePerMin: number): string {
  const ratePerHour = ratePerMin * 60;
  const abs = Math.abs(ratePerHour);
  const dir = ratePerHour >= 0 ? "rising" : "falling";
  if (abs < 0.5) return "Stable";
  if (abs < 1.0) return `Slowly ${dir}`;
  if (abs < 2.0) return `${dir.charAt(0).toUpperCase() + dir.slice(1)}`;
  if (abs < 3.0) return `Rapidly ${dir}`;
  return `Very rapidly ${dir}`;
}

// ─── Prediction ──────────────────────────────────────────────────────────────

export function predictGlucose(
  readings: GlucoseReading[],
  horizonMinutes: number[] = [15, 30, 45, 60]
): PredictionPoint[] {
  if (readings.length < 2) {
    return horizonMinutes.map((m) => ({ mmol: 0, minutesAhead: m, confidence: 0 }));
  }

  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const current = sorted[sorted.length - 1].mmol;
  const rate = computeRateOfChange(sorted);

  return horizonMinutes.map((minutes) => {
    // Linear extrapolation with decay factor for longer horizons
    const decayFactor = Math.exp(-minutes / 120); // confidence decays
    const predicted = current + rate * minutes;
    // Clamp to physiological range
    const clamped = Math.max(1.0, Math.min(30.0, predicted));

    return {
      mmol: Math.round(clamped * 10) / 10,
      minutesAhead: minutes,
      confidence: Math.round(decayFactor * 100) / 100,
    };
  });
}

// ─── Urgency assessment ──────────────────────────────────────────────────────

export function assessUrgency(
  currentMmol: number,
  ratePerMin: number
): { urgency: "none" | "low" | "moderate" | "high" | "urgent"; label: string } {
  const predicted15 = currentMmol + ratePerMin * 15;

  // Urgent: predicted hypo < 3.0 or current < 3.0
  if (currentMmol < 3.0 || predicted15 < 3.0) {
    return { urgency: "urgent", label: "Urgent — hypoglycaemia risk" };
  }

  // High: predicted < 3.5 or current > 20
  if (predicted15 < 3.5 || currentMmol > 20.0) {
    return { urgency: "high", label: "High — approaching critical range" };
  }

  // Moderate: predicted < 4.0 or > 15
  if (predicted15 < 4.0 || predicted15 > 15.0) {
    return { urgency: "moderate", label: "Moderate — trending out of range" };
  }

  // Low: current slightly out of range
  if (currentMmol < 4.0 || currentMmol > 10.0) {
    return { urgency: "low", label: "Low — outside target range" };
  }

  return { urgency: "none", label: "In range" };
}

// ─── Main function ───────────────────────────────────────────────────────────

export function generateGlucosePrediction(readings: GlucoseReading[]): GlucosePrediction {
  if (readings.length === 0) {
    return {
      currentMmol: 0,
      rateOfChange: 0,
      rateLabel: "No data",
      predictions: [],
      urgency: "none",
      urgencyLabel: "No data",
      arrow: "→",
    };
  }

  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const currentMmol = sorted[sorted.length - 1].mmol;
  const rate = computeRateOfChange(sorted);
  const predictions = predictGlucose(sorted);
  const { urgency, label: urgencyLabel } = assessUrgency(currentMmol, rate);

  return {
    currentMmol,
    rateOfChange: rate,
    rateLabel: rateToLabel(rate),
    predictions,
    urgency,
    urgencyLabel,
    arrow: rateToArrow(rate),
  };
}
