/**
 * GluMira™ V7 — IOB Aggregator
 *
 * Multi-dose IOB curve generation with prior-cycle residual.
 * Takes an array of doses and computes the combined IOB curve
 * across a time range at 15-minute resolution.
 *
 * CRITICAL: Basal insulins NEVER start at 0. Prior-cycle residual
 * is computed for a minimum of 2 prior injection cycles.
 */

import {
  type InsulinDose,
  type IOBTimepoint,
  type PressureClass,
  FORMULARY,
  BASAL_NAMES,
  getIOB,
  classifyPressure,
} from "./iob-hunter";

const STEP_HOURS = 0.25; // 15-minute resolution

/**
 * Expand doses to include prior-cycle residual injections.
 *
 * For basal insulins given once daily, we simulate at least 2 prior days
 * so the curve never starts at 0. For twice-daily basals, we go back
 * far enough to capture residual from prior cycles.
 */
function expandWithPriorCycles(doses: InsulinDose[]): InsulinDose[] {
  const expanded: InsulinDose[] = [...doses];

  for (const d of doses) {
    const pk = FORMULARY[d.insulin];
    if (!pk) continue;

    // Only add prior cycles for basal and mixed insulins
    if (pk.category !== "basal" && pk.category !== "mixed") continue;

    // Add 2 prior daily cycles (yesterday and day before)
    for (let dayOffset = 1; dayOffset <= 2; dayOffset++) {
      expanded.push({
        ...d,
        id: `${d.id}_prior_${dayOffset}`,
        hour: d.hour - 24 * dayOffset,
      });
    }

    // For ultra-long (Tresiba DOA=42h), add a 3rd prior cycle
    if (pk.doa > 36) {
      expanded.push({
        ...d,
        id: `${d.id}_prior_3`,
        hour: d.hour - 72,
      });
    }
  }

  return expanded;
}

/**
 * Generate the combined IOB curve across a 24-hour display window.
 *
 * @param doses Array of insulin doses with fractional hour times
 * @param windowStart Start hour (default 0 = midnight)
 * @param windowEnd End hour (default 24 = next midnight)
 * @returns Array of IOBTimepoint at 15-minute intervals
 */
export function generateCombinedCurve(
  doses: InsulinDose[],
  windowStart = 0,
  windowEnd = 24,
): IOBTimepoint[] {
  const expandedDoses = expandWithPriorCycles(doses);
  const points: IOBTimepoint[] = [];

  // First pass: compute raw IOB at each timepoint
  const rawPoints: { hour: number; totalIOB: number; basalIOB: number; bolusIOB: number; perInsulin: { insulin: string; iob: number }[] }[] = [];

  for (let h = windowStart; h <= windowEnd; h += STEP_HOURS) {
    let basalIOB = 0;
    let bolusIOB = 0;
    const perInsulin: { insulin: string; iob: number }[] = [];

    for (const d of expandedDoses) {
      const elapsed = h - d.hour;
      const iob = getIOB(d.insulin, d.dose, elapsed);

      if (iob > 0.001) {
        const isBasal = BASAL_NAMES.includes(d.insulin) || FORMULARY[d.insulin]?.category === "mixed";
        if (isBasal) basalIOB += iob; else bolusIOB += iob;

        // Aggregate per-insulin (combine same insulin from different doses)
        const existing = perInsulin.find((p) => p.insulin === d.insulin);
        if (existing) existing.iob += iob;
        else perInsulin.push({ insulin: d.insulin, iob });
      }
    }

    rawPoints.push({
      hour: Math.round(h * 100) / 100,
      totalIOB: basalIOB + bolusIOB,
      basalIOB,
      bolusIOB,
      perInsulin,
    });
  }

  // Find max IOB for pressure classification
  const maxIOB = rawPoints.reduce((m, p) => Math.max(m, p.totalIOB), 0) || 1;

  // Second pass: classify pressure and round values
  for (const raw of rawPoints) {
    points.push({
      hour: raw.hour,
      totalIOB: Math.round(raw.totalIOB * 100) / 100,
      basalIOB: Math.round(raw.basalIOB * 100) / 100,
      bolusIOB: Math.round(raw.bolusIOB * 100) / 100,
      pressure: classifyPressure(raw.totalIOB, maxIOB),
      perInsulin: raw.perInsulin.map((p) => ({
        insulin: p.insulin,
        iob: Math.round(p.iob * 100) / 100,
      })),
    });
  }

  return points;
}

/* ═══════════════════════════════════════════════════════════════════════════
   60-SECOND INTERPRETATION GENERATOR
   ═══════════════════════════════════════════════════════════════════════════ */

function formatHour(h: number): string {
  const hr = Math.floor(((h % 24) + 24) % 24);
  const mn = Math.round(((h % 1) + 1) % 1 * 60);
  return `${String(hr).padStart(2, "0")}:${String(mn).padStart(2, "0")}`;
}

export interface Interpretation {
  lines: string[];
  peakTime: number;
  peakIOB: number;
  dangerWindows: { start: number; end: number }[];
}

/**
 * Auto-generate plain-language interpretation from the IOB curve.
 */
export function generateInterpretation(
  points: IOBTimepoint[],
  doses: InsulinDose[],
): Interpretation {
  const lines: string[] = [];

  // Find peak
  const peak = points.reduce((best, p) => p.totalIOB > best.totalIOB ? p : best, points[0]);
  lines.push(
    `Peak insulin pressure occurs at ${formatHour(peak.hour)} (${peak.totalIOB.toFixed(1)}U active).`
  );

  // Danger windows (overlap pressure)
  const dangerWindows: { start: number; end: number }[] = [];
  let dangerStart: number | null = null;
  for (const p of points) {
    if (p.pressure === "overlap" && dangerStart === null) {
      dangerStart = p.hour;
    } else if (p.pressure !== "overlap" && dangerStart !== null) {
      dangerWindows.push({ start: dangerStart, end: p.hour });
      dangerStart = null;
    }
  }
  if (dangerStart !== null) {
    dangerWindows.push({ start: dangerStart, end: points[points.length - 1].hour });
  }
  for (const dw of dangerWindows) {
    lines.push(
      `Danger window: ${formatHour(dw.start)} to ${formatHour(dw.end)} (OVERLAP pressure).`
    );
  }

  // Basal percentage at peak
  if (peak.totalIOB > 0) {
    const basalPct = Math.round((peak.basalIOB / peak.totalIOB) * 100);
    lines.push(
      `Basal insulin accounts for ${basalPct}% of total IOB at peak.`
    );
  }

  // Last bolus clearance
  const bolusDoses = doses.filter((d) => {
    const pk = FORMULARY[d.insulin];
    return pk && pk.category === "bolus";
  });
  if (bolusDoses.length > 0) {
    const lastBolus = bolusDoses.reduce((latest, d) => d.hour > latest.hour ? d : latest, bolusDoses[0]);
    const pk = FORMULARY[lastBolus.insulin];
    if (pk) {
      const clearTime = lastBolus.hour + pk.doa;
      lines.push(
        `Last bolus clears by approximately ${formatHour(clearTime)}.`
      );
    }
  }

  // Overnight fasting check (22:00 to 06:00)
  const overnightPoints = points.filter((p) => p.hour >= 22 || p.hour <= 6);
  if (overnightPoints.length > 0) {
    const avgOvernight = overnightPoints.reduce((s, p) => s + p.totalIOB, 0) / overnightPoints.length;
    if (avgOvernight > 0.5) {
      lines.push(
        `Between 22:00 and 06:00, an average of ${avgOvernight.toFixed(1)}U of insulin remains active during fasting hours.`
      );
    }
  }

  return { lines, peakTime: peak.hour, peakIOB: peak.totalIOB, dangerWindows };
}
