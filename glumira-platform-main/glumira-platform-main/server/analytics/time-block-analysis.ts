/**
 * GluMira — Time-Block Analysis Module
 *
 * Segments glucose readings into configurable time blocks (e.g., overnight,
 * fasting, post-breakfast, post-lunch, post-dinner) and computes per-block
 * statistics for pattern identification.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GlucoseReading {
  mmol: number;
  timestamp: string;
}

export interface TimeBlock {
  label: string;
  startHour: number; // 0-23
  endHour: number;   // 0-23 (wraps at midnight)
}

export interface BlockStats {
  label: string;
  readingCount: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  cv: number;
  tirPercent: number;
  belowPercent: number;
  abovePercent: number;
}

export interface TimeBlockReport {
  blocks: BlockStats[];
  worstBlock: string;
  bestBlock: string;
  overallMean: number;
  overallCv: number;
}

// ─── Default Blocks ──────────────────────────────────────────────────────────

export const DEFAULT_TIME_BLOCKS: TimeBlock[] = [
  { label: "Overnight", startHour: 0, endHour: 6 },
  { label: "Fasting / Pre-Breakfast", startHour: 6, endHour: 9 },
  { label: "Post-Breakfast", startHour: 9, endHour: 12 },
  { label: "Post-Lunch", startHour: 12, endHour: 17 },
  { label: "Post-Dinner", startHour: 17, endHour: 21 },
  { label: "Late Evening", startHour: 21, endHour: 24 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function stdDev(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance = values.reduce((s, v) => s + (v - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

// ─── Block classification ────────────────────────────────────────────────────

/**
 * Determine which block a reading falls into based on its hour.
 */
export function classifyReading(
  reading: GlucoseReading,
  blocks: TimeBlock[] = DEFAULT_TIME_BLOCKS
): string | null {
  const hour = new Date(reading.timestamp).getHours();
  for (const block of blocks) {
    if (block.startHour <= block.endHour) {
      // Normal range (e.g., 6-9)
      if (hour >= block.startHour && hour < block.endHour) return block.label;
    } else {
      // Wraps midnight (e.g., 22-6)
      if (hour >= block.startHour || hour < block.endHour) return block.label;
    }
  }
  return null;
}

// ─── Per-block statistics ────────────────────────────────────────────────────

/**
 * Compute statistics for a single block's readings.
 */
export function computeBlockStats(
  label: string,
  readings: GlucoseReading[],
  lowThreshold: number = 3.9,
  highThreshold: number = 10.0
): BlockStats {
  if (readings.length === 0) {
    return {
      label,
      readingCount: 0,
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      stdDev: 0,
      cv: 0,
      tirPercent: 0,
      belowPercent: 0,
      abovePercent: 0,
    };
  }

  const values = readings.map((r) => r.mmol);
  const avg = mean(values);
  const sd = stdDev(values, avg);
  const inRange = values.filter((v) => v >= lowThreshold && v <= highThreshold).length;
  const below = values.filter((v) => v < lowThreshold).length;
  const above = values.filter((v) => v > highThreshold).length;

  return {
    label,
    readingCount: readings.length,
    mean: round2(avg),
    median: round2(median(values)),
    min: round2(Math.min(...values)),
    max: round2(Math.max(...values)),
    stdDev: round2(sd),
    cv: avg > 0 ? round2((sd / avg) * 100) : 0,
    tirPercent: round2((inRange / readings.length) * 100),
    belowPercent: round2((below / readings.length) * 100),
    abovePercent: round2((above / readings.length) * 100),
  };
}

// ─── Full report ─────────────────────────────────────────────────────────────

/**
 * Generate a full time-block report from glucose readings.
 */
export function generateTimeBlockReport(
  readings: GlucoseReading[],
  blocks: TimeBlock[] = DEFAULT_TIME_BLOCKS,
  lowThreshold: number = 3.9,
  highThreshold: number = 10.0
): TimeBlockReport {
  // Group readings by block
  const grouped: Record<string, GlucoseReading[]> = {};
  for (const block of blocks) {
    grouped[block.label] = [];
  }

  for (const reading of readings) {
    const label = classifyReading(reading, blocks);
    if (label && grouped[label]) {
      grouped[label].push(reading);
    }
  }

  // Compute stats per block
  const blockStats = blocks.map((block) =>
    computeBlockStats(block.label, grouped[block.label], lowThreshold, highThreshold)
  );

  // Find worst and best blocks (by TIR)
  const withReadings = blockStats.filter((b) => b.readingCount > 0);
  const worstBlock = withReadings.length > 0
    ? withReadings.reduce((w, b) => (b.tirPercent < w.tirPercent ? b : w)).label
    : "N/A";
  const bestBlock = withReadings.length > 0
    ? withReadings.reduce((w, b) => (b.tirPercent > w.tirPercent ? b : w)).label
    : "N/A";

  // Overall stats
  const allValues = readings.map((r) => r.mmol);
  const overallMean = allValues.length > 0 ? round2(mean(allValues)) : 0;
  const overallSd = allValues.length > 0 ? stdDev(allValues, mean(allValues)) : 0;
  const overallCv = overallMean > 0 ? round2((overallSd / overallMean) * 100) : 0;

  return {
    blocks: blockStats,
    worstBlock,
    bestBlock,
    overallMean,
    overallCv,
  };
}

// ─── Block label + colour helpers ────────────────────────────────────────────

export function blockTirColour(tirPercent: number): string {
  if (tirPercent >= 70) return "green";
  if (tirPercent >= 50) return "amber";
  return "red";
}

export function blockCvLabel(cv: number): string {
  if (cv <= 36) return "Stable";
  if (cv <= 50) return "Moderate variability";
  return "High variability";
}
