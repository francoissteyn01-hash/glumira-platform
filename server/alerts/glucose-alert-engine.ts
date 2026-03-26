/**
 * GluMira™ — glucose-alert-engine.ts
 *
 * Glucose alert engine module.
 * Evaluates glucose readings against thresholds and generates structured alerts.
 * Supports: hypo, hyper, rapid-rise, rapid-fall, nocturnal, and missed-reading alerts.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type AlertSeverity = "info" | "warning" | "critical";
export type AlertType =
  | "hypo"
  | "hyper"
  | "rapid-rise"
  | "rapid-fall"
  | "nocturnal-hypo"
  | "nocturnal-hyper"
  | "missed-reading"
  | "persistent-hyper"
  | "persistent-hypo";

export interface GlucoseReading {
  recordedAt: Date | string;
  glucoseMmol: number;
}

export interface AlertThresholds {
  hypoMmol: number;          // default 3.9
  hyperMmol: number;         // default 10.0
  criticalHypoMmol: number;  // default 3.0
  criticalHyperMmol: number; // default 16.7
  rapidRisePerMin: number;   // mmol/L/min, default 0.1
  rapidFallPerMin: number;   // mmol/L/min, default 0.1
  missedReadingMinutes: number; // default 20
}

export interface GlucoseAlert {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  glucoseMmol: number;
  recordedAt: string;
  actionRequired: boolean;
}

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  hypoMmol: 3.9,
  hyperMmol: 10.0,
  criticalHypoMmol: 3.0,
  criticalHyperMmol: 16.7,
  rapidRisePerMin: 0.1,
  rapidFallPerMin: 0.1,
  missedReadingMinutes: 20,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDate(val: Date | string): Date {
  return val instanceof Date ? val : new Date(val);
}

function isNocturnal(d: Date): boolean {
  const h = d.getHours();
  return h >= 22 || h < 6;
}

// ─── Single Reading Evaluation ────────────────────────────────────────────────

/**
 * Evaluate a single glucose reading against thresholds.
 * Returns an array of alerts (may be empty).
 */
export function evaluateReading(
  reading: GlucoseReading,
  thresholds: AlertThresholds = DEFAULT_THRESHOLDS
): GlucoseAlert[] {
  const alerts: GlucoseAlert[] = [];
  const { glucoseMmol } = reading;
  const at = toDate(reading.recordedAt);
  const nocturnal = isNocturnal(at);
  const ts = at.toISOString();

  if (glucoseMmol <= thresholds.criticalHypoMmol) {
    alerts.push({
      type: nocturnal ? "nocturnal-hypo" : "hypo",
      severity: "critical",
      message: `Critical ${nocturnal ? "nocturnal " : ""}hypoglycaemia: ${glucoseMmol.toFixed(1)} mmol/L`,
      glucoseMmol,
      recordedAt: ts,
      actionRequired: true,
    });
  } else if (glucoseMmol < thresholds.hypoMmol) {
    alerts.push({
      type: nocturnal ? "nocturnal-hypo" : "hypo",
      severity: nocturnal ? "critical" : "warning",
      message: `${nocturnal ? "Nocturnal h" : "H"}ypoglycaemia: ${glucoseMmol.toFixed(1)} mmol/L`,
      glucoseMmol,
      recordedAt: ts,
      actionRequired: nocturnal,
    });
  } else if (glucoseMmol >= thresholds.criticalHyperMmol) {
    alerts.push({
      type: nocturnal ? "nocturnal-hyper" : "hyper",
      severity: "critical",
      message: `Critical ${nocturnal ? "nocturnal " : ""}hyperglycaemia: ${glucoseMmol.toFixed(1)} mmol/L`,
      glucoseMmol,
      recordedAt: ts,
      actionRequired: true,
    });
  } else if (glucoseMmol > thresholds.hyperMmol) {
    alerts.push({
      type: nocturnal ? "nocturnal-hyper" : "hyper",
      severity: "warning",
      message: `${nocturnal ? "Nocturnal h" : "H"}yperglycaemia: ${glucoseMmol.toFixed(1)} mmol/L`,
      glucoseMmol,
      recordedAt: ts,
      actionRequired: false,
    });
  }

  return alerts;
}

// ─── Rate of Change Evaluation ────────────────────────────────────────────────

/**
 * Evaluate rate of change between two consecutive readings.
 */
export function evaluateRateOfChange(
  prev: GlucoseReading,
  curr: GlucoseReading,
  thresholds: AlertThresholds = DEFAULT_THRESHOLDS
): GlucoseAlert | null {
  const prevTime = toDate(prev.recordedAt).getTime();
  const currTime = toDate(curr.recordedAt).getTime();
  const minutesDiff = (currTime - prevTime) / 60000;

  if (minutesDiff <= 0 || minutesDiff > 30) return null; // ignore stale pairs

  const ratePerMin = (curr.glucoseMmol - prev.glucoseMmol) / minutesDiff;
  const ts = toDate(curr.recordedAt).toISOString();

  if (ratePerMin >= thresholds.rapidRisePerMin) {
    return {
      type: "rapid-rise",
      severity: ratePerMin >= thresholds.rapidRisePerMin * 1.5 ? "critical" : "warning",
      message: `Rapid rise: +${(ratePerMin * 5).toFixed(1)} mmol/L per 5 min`,
      glucoseMmol: curr.glucoseMmol,
      recordedAt: ts,
      actionRequired: ratePerMin >= thresholds.rapidRisePerMin * 1.5,
    };
  }

  if (ratePerMin <= -thresholds.rapidFallPerMin) {
    return {
      type: "rapid-fall",
      severity: Math.abs(ratePerMin) >= thresholds.rapidFallPerMin * 1.5 ? "critical" : "warning",
      message: `Rapid fall: ${(ratePerMin * 5).toFixed(1)} mmol/L per 5 min`,
      glucoseMmol: curr.glucoseMmol,
      recordedAt: ts,
      actionRequired: Math.abs(ratePerMin) >= thresholds.rapidFallPerMin * 1.5,
    };
  }

  return null;
}

// ─── Missed Reading Detection ─────────────────────────────────────────────────

/**
 * Detect if a reading is overdue (gap > missedReadingMinutes).
 */
export function detectMissedReading(
  lastReading: GlucoseReading,
  nowMs: number = Date.now(),
  thresholds: AlertThresholds = DEFAULT_THRESHOLDS
): GlucoseAlert | null {
  const lastMs = toDate(lastReading.recordedAt).getTime();
  const gapMinutes = (nowMs - lastMs) / 60000;

  if (gapMinutes < thresholds.missedReadingMinutes) return null;

  return {
    type: "missed-reading",
    severity: gapMinutes > 60 ? "critical" : "warning",
    message: `No glucose reading for ${Math.round(gapMinutes)} minutes`,
    glucoseMmol: lastReading.glucoseMmol,
    recordedAt: toDate(lastReading.recordedAt).toISOString(),
    actionRequired: gapMinutes > 60,
  };
}

// ─── Persistent Hypo/Hyper Detection ─────────────────────────────────────────

/**
 * Detect persistent hypo or hyper (N consecutive readings outside range).
 */
export function detectPersistentExcursion(
  readings: GlucoseReading[],
  consecutiveCount = 3,
  thresholds: AlertThresholds = DEFAULT_THRESHOLDS
): GlucoseAlert | null {
  if (readings.length < consecutiveCount) return null;

  const last = readings.slice(-consecutiveCount);
  const allHypo = last.every((r) => r.glucoseMmol < thresholds.hypoMmol);
  const allHyper = last.every((r) => r.glucoseMmol > thresholds.hyperMmol);

  if (!allHypo && !allHyper) return null;

  const latest = last[last.length - 1];
  const ts = toDate(latest.recordedAt).toISOString();

  if (allHypo) {
    return {
      type: "persistent-hypo",
      severity: "critical",
      message: `Persistent hypoglycaemia: ${consecutiveCount} consecutive readings below ${thresholds.hypoMmol} mmol/L`,
      glucoseMmol: latest.glucoseMmol,
      recordedAt: ts,
      actionRequired: true,
    };
  }

  return {
    type: "persistent-hyper",
    severity: "warning",
    message: `Persistent hyperglycaemia: ${consecutiveCount} consecutive readings above ${thresholds.hyperMmol} mmol/L`,
    glucoseMmol: latest.glucoseMmol,
    recordedAt: ts,
    actionRequired: false,
  };
}

// ─── Full Alert Evaluation ────────────────────────────────────────────────────

/**
 * Evaluate a stream of readings and return all alerts.
 */
export function evaluateReadingStream(
  readings: GlucoseReading[],
  thresholds: AlertThresholds = DEFAULT_THRESHOLDS
): GlucoseAlert[] {
  if (readings.length === 0) return [];

  const alerts: GlucoseAlert[] = [];

  for (let i = 0; i < readings.length; i++) {
    alerts.push(...evaluateReading(readings[i], thresholds));

    if (i > 0) {
      const roc = evaluateRateOfChange(readings[i - 1], readings[i], thresholds);
      if (roc) alerts.push(roc);
    }
  }

  const persistent = detectPersistentExcursion(readings, 3, thresholds);
  if (persistent) alerts.push(persistent);

  return alerts;
}
