/**
 * GluMira™ V7 — server/analytics/insulin-sensitivity.ts
 *
 * Estimates per-hour insulin sensitivity (ISF, mmol/L per unit) by examining
 * historical correction-bolus events and the glucose response that followed.
 *
 * Algorithm (educational, NOT a medical recommendation):
 *   For each correction event in the last N days:
 *     1. Locate the closest glucose reading within 15 min BEFORE the event   → G_start
 *     2. Locate the closest glucose reading 150–210 min AFTER the event       → G_end
 *     3. If both exist and dose_units > 0:
 *          drop      = G_start - G_end          (mmol/L)
 *          isfPoint  = drop / dose_units        (mmol/L per unit)
 *     4. Bucket by hour-of-day (0..23) and average.
 *
 * Buckets with fewer than `MIN_SAMPLES` observations return null
 * so the UI can render them as "insufficient data".
 *
 * GluMira™ is an educational platform, not a medical device.
 * Version: v1.0 · 2026-04-10
 */

export type InsulinEvent = {
  event_time: string;          // ISO timestamp
  event_type: string;
  is_correction: boolean | null;
  dose_units: number;
}

export type GlucosePoint = {
  value_mmol: number;
  recorded_at: string;         // ISO timestamp
}

export type HourBucket = {
  hour: number;                // 0..23
  isfEstimate: number | null;  // mmol/L per unit (null if insufficient data)
  sampleCount: number;
}

export type SensitivityResult = {
  bucketsByHour: HourBucket[]; // length 24, sorted by hour
  totalEvents: number;
  usedEvents: number;
  windowDays: number;
  computedAt: string;
  disclaimer: string;
}

const PRE_WINDOW_MIN  = 15;    // look back up to 15min for G_start
const POST_MIN_MIN    = 150;   // look forward 150-210min for G_end
const POST_MAX_MIN    = 210;
const MIN_SAMPLES     = 2;     // hide buckets with <2 samples

/** Binary search for the index of the first reading at or after `t`. */
function lowerBound(readings: GlucosePoint[], tMs: number): number {
  let lo = 0, hi = readings.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (new Date(readings[mid].recorded_at).getTime() < tMs) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

/**
 * Find the reading closest to `tMs` that lies within [tMs - lookbackMs, tMs].
 * Returns null if none.
 */
function findReadingBefore(readings: GlucosePoint[], tMs: number, lookbackMs: number): GlucosePoint | null {
  const idx = lowerBound(readings, tMs);
  // Look at idx - 1 (the last reading strictly before tMs) and walk back if needed
  for (let i = idx - 1; i >= 0; i--) {
    const rt = new Date(readings[i].recorded_at).getTime();
    if (rt < tMs - lookbackMs) return null;
    if (rt <= tMs) return readings[i];
  }
  // Edge case: lowerBound landed exactly on tMs
  if (idx < readings.length) {
    const rt = new Date(readings[idx].recorded_at).getTime();
    if (rt === tMs) return readings[idx];
  }
  return null;
}

/**
 * Find the reading closest to the midpoint of [tMs + minMs, tMs + maxMs].
 * Returns null if no reading falls inside the window.
 */
function findReadingAfter(readings: GlucosePoint[], tMs: number, minMs: number, maxMs: number): GlucosePoint | null {
  const lo = lowerBound(readings, tMs + minMs);
  const hi = lowerBound(readings, tMs + maxMs);
  if (lo >= hi) return null;
  // Pick the reading closest to the midpoint of the window
  const target = tMs + (minMs + maxMs) / 2;
  let best = readings[lo];
  let bestDist = Math.abs(new Date(best.recorded_at).getTime() - target);
  for (let i = lo + 1; i < hi; i++) {
    const d = Math.abs(new Date(readings[i].recorded_at).getTime() - target);
    if (d < bestDist) { best = readings[i]; bestDist = d; }
  }
  return best;
}

export function computeInsulinSensitivity(
  insulinEvents: InsulinEvent[],
  glucoseReadings: GlucosePoint[],
  windowDays: number,
): SensitivityResult {
  // Filter to corrections (or any bolus where is_correction is true)
  const corrections = insulinEvents.filter(
    (e) => (e.is_correction === true || e.event_type === "correction") && e.dose_units > 0,
  );

  // Sort glucose readings by time (caller may already sort, but be safe)
  const sorted = [...glucoseReadings].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
  );

  // Per-hour accumulators
  const sums   = new Array<number>(24).fill(0);
  const counts = new Array<number>(24).fill(0);
  let used = 0;

  for (const ev of corrections) {
    const tMs = new Date(ev.event_time).getTime();
    const gStart = findReadingBefore(sorted, tMs, PRE_WINDOW_MIN  * 60_000);
    const gEnd   = findReadingAfter (sorted, tMs, POST_MIN_MIN    * 60_000, POST_MAX_MIN * 60_000);
    if (!gStart || !gEnd) continue;

    const drop = gStart.value_mmol - gEnd.value_mmol;
    if (!Number.isFinite(drop)) continue;

    const isfPoint = drop / ev.dose_units;
    // Reject obviously absurd values (e.g. carb-spike masking)
    if (isfPoint < -10 || isfPoint > 20) continue;

    const hour = new Date(ev.event_time).getHours();
    sums[hour]   += isfPoint;
    counts[hour] += 1;
    used += 1;
  }

  const bucketsByHour: HourBucket[] = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    sampleCount: counts[h],
    isfEstimate:
      counts[h] >= MIN_SAMPLES ? Math.round((sums[h] / counts[h]) * 100) / 100 : null,
  }));

  return {
    bucketsByHour,
    totalEvents: corrections.length,
    usedEvents: used,
    windowDays,
    computedAt: new Date().toISOString(),
    disclaimer: "GluMira™ is an educational platform, not a medical device.",
  };
}
