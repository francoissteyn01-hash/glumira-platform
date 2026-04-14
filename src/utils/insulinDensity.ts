/**
 * GluMira™ V7 — Insulin Density Utilities
 *
 * Generates 24-hour IOB curves and heatmap data from InsulinEntry arrays,
 * using the pharmacokinetics engine from @/lib/pharmacokinetics.
 */

import type { InsulinEntry } from "@/lib/pharmacokinetics";
import { calculateCombinedIOB } from "@/lib/pharmacokinetics";

/* ── 24-Hour IOB curve (for the mountain/area chart) ─────────────────────── */

export interface IOBCurvePoint {
  /** Fractional hour (0–24) */
  hours: number;
  /** Formatted time label */
  timeLabel: string;
  /** Total IOB in units */
  totalIOB: number;
  /** Per-entry breakdown */
  breakdown: Record<string, number>;
}

/**
 * Sample combined IOB every 10 minutes across 24 hours.
 * Uses 2 cycles so overnight basal tail from the prior day is included.
 */
export function generate24HourIOBCurve(
  entries: InsulinEntry[],
  cycles = 2,
): IOBCurvePoint[] {
  const points: IOBCurvePoint[] = [];
  const stepMinutes = 10;
  const totalSteps = (24 * 60) / stepMinutes + 1;

  for (let i = 0; i < totalSteps; i++) {
    const minute = i * stepMinutes;
    const hours = minute / 60;
    const { total, breakdown } = calculateCombinedIOB(entries, hours, cycles);

    const h = Math.floor(hours) % 24;
    const m = minute % 60;
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const timeLabel = `${h12}:${String(m).padStart(2, "0")} ${period}`;

    points.push({
      hours: Math.round(hours * 100) / 100,
      timeLabel,
      totalIOB: Math.round(total * 100) / 100,
      breakdown,
    });
  }

  return points;
}

/* ── Heatmap data (hourly buckets per insulin) ───────────────────────────── */

export interface HeatmapRow {
  insulinName: string;
  entryId: string;
  dose: number;
  time: string;
  type: "basal" | "bolus";
  /** IOB value per hour bucket (index 0 = hour 0, index 23 = hour 23) */
  hourlyIOB: number[];
}

export interface HeatmapData {
  rows: HeatmapRow[];
  /** Combined IOB per hour bucket */
  combinedHourly: number[];
  maxIOB: number;
}

/**
 * Generate per-entry hourly IOB breakdown plus combined totals.
 */
export function generateHeatmapData(entries: InsulinEntry[]): HeatmapData {
  const rows: HeatmapRow[] = [];
  const combinedHourly = new Array(24).fill(0);

  for (const entry of entries) {
    const hourlyIOB: number[] = [];
    const [h, m] = entry.time.split(":").map(Number);
    const doseHour = h + m / 60;

    for (let hour = 0; hour < 24; hour++) {
      // Sample at middle of hour
      const t = hour + 0.5;
      const hoursPost = t - doseHour;
      if (hoursPost < 0) {
        hourlyIOB.push(0);
        continue;
      }
      const { total } = calculateCombinedIOB([entry], t, 1);
      hourlyIOB.push(Math.round(total * 100) / 100);
      combinedHourly[hour] += total;
    }

    rows.push({
      insulinName: entry.insulinName,
      entryId: entry.id,
      dose: entry.dose,
      time: entry.time,
      type: entry.type,
      hourlyIOB,
    });
  }

  const maxIOB = Math.max(...combinedHourly, 0.1);

  return {
    rows,
    combinedHourly: combinedHourly.map((v) => Math.round(v * 100) / 100),
    maxIOB: Math.round(maxIOB * 100) / 100,
  };
}
