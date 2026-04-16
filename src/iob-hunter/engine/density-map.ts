/**
 * GluMira™ V7 — IOB Hunter v7 · Density Map Engine
 *
 * Builds a pressure/density map from an already-computed IOBCurvePoint[]
 * (output of generateStackedCurve). No IOB re-calculation — this is a
 * pure classification + zone-detection layer on top of the curve.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import type { IOBCurvePoint } from "@/iob-hunter/types";

/* ─── Types ──────────────────────────────────────────────────────────────── */

export type PressureLevel = "light" | "moderate" | "overlap" | "strong";

export type DensityPoint = {
  timeHours: number;
  iobTotal: number;
  pressure: PressureLevel;
  perInsulin: Record<string, number>;
};

export type DensityRiskZone = {
  start: number;
  end: number;
  pressure: PressureLevel;
};

export type DensityMap = {
  points: DensityPoint[];
  /** Fractional hour (0–24) where combined IOB is highest. */
  peakTime: number;
  peakIOB: number;
  /** First contiguous block of strong + overlap pressure. */
  highestOverlapWindow: { start: number; end: number };
  riskZones: DensityRiskZone[];
};

/* ─── Internal helpers ───────────────────────────────────────────────────── */

function classifyPressure(iobTotal: number, basalDose: number): PressureLevel {
  if (basalDose <= 0) return "light";
  const ratio = iobTotal / basalDose;
  if (ratio < 0.25) return "light";
  if (ratio < 0.50) return "moderate";
  if (ratio < 0.75) return "strong";
  return "overlap";
}

function identifyRiskZones(points: DensityPoint[]): DensityRiskZone[] {
  const zones: DensityRiskZone[] = [];
  let current: DensityRiskZone | null = null;
  for (const p of points) {
    if (!current || current.pressure !== p.pressure) {
      if (current) zones.push(current);
      current = { start: p.timeHours, end: p.timeHours, pressure: p.pressure };
    } else {
      current.end = p.timeHours;
    }
  }
  if (current) zones.push(current);
  return zones;
}

/* ─── Public API ─────────────────────────────────────────────────────────── */

/**
 * Build a DensityMap from an already-computed IOBCurvePoint[].
 *
 * @param curve         Output of generateStackedCurve (or useIOBHunter).
 * @param typicalBasalDose  Reference dose for pressure ratio — use
 *                          kpis.total_daily_basal from the same hook result.
 */
export function buildDensityMap(
  curve: IOBCurvePoint[],
  typicalBasalDose: number,
): DensityMap {
  if (curve.length === 0) {
    return {
      points: [],
      peakTime: 0,
      peakIOB: 0,
      highestOverlapWindow: { start: 0, end: 0 },
      riskZones: [],
    };
  }

  const points: DensityPoint[] = curve.map((pt) => ({
    timeHours: pt.hours,
    iobTotal: pt.total_iob,
    pressure: classifyPressure(pt.total_iob, typicalBasalDose),
    perInsulin: { ...pt.breakdown },
  }));

  const peakPoint = points.reduce((max, p) =>
    p.iobTotal > max.iobTotal ? p : max,
  );

  const overlapPoints = points.filter(
    (p) => p.pressure === "overlap" || p.pressure === "strong",
  );
  const highestOverlapWindow =
    overlapPoints.length > 0
      ? {
          start: overlapPoints[0].timeHours,
          end: overlapPoints[overlapPoints.length - 1].timeHours,
        }
      : { start: 0, end: 0 };

  return {
    points,
    peakTime: peakPoint.timeHours,
    peakIOB: peakPoint.iobTotal,
    highestOverlapWindow,
    riskZones: identifyRiskZones(points),
  };
}
