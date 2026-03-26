/**
 * GluMira™ — Circadian Insulin Sensitivity Module
 *
 * Analyses how insulin sensitivity varies across time-of-day blocks
 * (dawn, morning, afternoon, evening, night) to help optimise
 * basal rates and bolus timing.
 *
 * GluMira is an informational tool only. Not a medical device.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GlucoseReading {
  mmol: number;
  timestamp: string;
}

export type TimeBlock = "dawn" | "morning" | "afternoon" | "evening" | "night";

export interface BlockSensitivity {
  block: TimeBlock;
  hourRange: [number, number];
  meanGlucose: number;
  cv: number;
  readingCount: number;
  sensitivityRating: "high" | "normal" | "low" | "very-low";
}

export interface CircadianProfile {
  blocks: BlockSensitivity[];
  mostSensitiveBlock: TimeBlock;
  leastSensitiveBlock: TimeBlock;
  dawnPhenomenonLikely: boolean;
  recommendations: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const BLOCK_DEFINITIONS: Record<TimeBlock, [number, number]> = {
  dawn: [4, 7],
  morning: [7, 12],
  afternoon: [12, 17],
  evening: [17, 22],
  night: [22, 4],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function mean(vals: number[]): number {
  if (vals.length === 0) return 0;
  return round2(vals.reduce((s, v) => s + v, 0) / vals.length);
}

function cv(vals: number[]): number {
  if (vals.length < 2) return 0;
  const m = mean(vals);
  if (m === 0) return 0;
  const variance = vals.reduce((s, v) => s + (v - m) ** 2, 0) / vals.length;
  return round2((Math.sqrt(variance) / m) * 100);
}

function getHour(ts: string): number {
  return new Date(ts).getHours();
}

function inBlock(hour: number, block: TimeBlock): boolean {
  const [start, end] = BLOCK_DEFINITIONS[block];
  if (start < end) {
    return hour >= start && hour < end;
  }
  // Wraps midnight (night: 22-4)
  return hour >= start || hour < end;
}

// ─── Classify sensitivity ────────────────────────────────────────────────────

export function classifySensitivity(
  meanGlucose: number,
  cvPercent: number
): "high" | "normal" | "low" | "very-low" {
  // Lower mean + lower CV = higher sensitivity
  const score = meanGlucose * 0.6 + cvPercent * 0.4;
  if (score < 5.0) return "high";
  if (score < 8.0) return "normal";
  if (score < 12.0) return "low";
  return "very-low";
}

// ─── Sensitivity colour ──────────────────────────────────────────────────────

export function sensitivityColour(
  rating: "high" | "normal" | "low" | "very-low"
): string {
  switch (rating) {
    case "high": return "#22c55e";
    case "normal": return "#3b82f6";
    case "low": return "#f59e0b";
    case "very-low": return "#ef4444";
  }
}

// ─── Compute block sensitivity ───────────────────────────────────────────────

export function computeBlockSensitivity(
  readings: GlucoseReading[],
  block: TimeBlock
): BlockSensitivity {
  const blockReadings = readings.filter((r) => inBlock(getHour(r.timestamp), block));
  const vals = blockReadings.map((r) => r.mmol);
  const meanGlucose = mean(vals);
  const cvPercent = cv(vals);
  const sensitivityRating = classifySensitivity(meanGlucose, cvPercent);

  return {
    block,
    hourRange: BLOCK_DEFINITIONS[block],
    meanGlucose,
    cv: cvPercent,
    readingCount: vals.length,
    sensitivityRating,
  };
}

// ─── Detect dawn phenomenon ──────────────────────────────────────────────────

export function detectDawnPhenomenon(
  nightBlock: BlockSensitivity,
  dawnBlock: BlockSensitivity
): boolean {
  if (nightBlock.readingCount < 3 || dawnBlock.readingCount < 3) return false;
  const rise = dawnBlock.meanGlucose - nightBlock.meanGlucose;
  return rise >= 1.0;
}

// ─── Generate recommendations ────────────────────────────────────────────────

export function generateCircadianRecommendations(
  blocks: BlockSensitivity[],
  dawnPhenomenon: boolean
): string[] {
  const recs: string[] = [];

  if (dawnPhenomenon) {
    recs.push("Dawn phenomenon detected — consider adjusting early-morning basal rate.");
  }

  const veryLow = blocks.filter((b) => b.sensitivityRating === "very-low");
  for (const b of veryLow) {
    recs.push(`Very low sensitivity during ${b.block} block (${b.hourRange[0]}:00–${b.hourRange[1]}:00). Consider higher bolus ratios.`);
  }

  const highCv = blocks.filter((b) => b.cv > 36);
  for (const b of highCv) {
    recs.push(`High variability (CV ${b.cv}%) during ${b.block}. Review meal timing and carb consistency.`);
  }

  if (recs.length === 0) {
    recs.push("Circadian sensitivity profile looks stable. Continue current management.");
  }

  return recs;
}

// ─── Full profile ────────────────────────────────────────────────────────────

export function generateCircadianProfile(
  readings: GlucoseReading[]
): CircadianProfile {
  const blockNames: TimeBlock[] = ["dawn", "morning", "afternoon", "evening", "night"];
  const blocks = blockNames.map((b) => computeBlockSensitivity(readings, b));

  const withData = blocks.filter((b) => b.readingCount > 0);

  let mostSensitiveBlock: TimeBlock = "morning";
  let leastSensitiveBlock: TimeBlock = "morning";

  if (withData.length > 0) {
    const sorted = [...withData].sort((a, b) => a.meanGlucose - b.meanGlucose);
    mostSensitiveBlock = sorted[0].block;
    leastSensitiveBlock = sorted[sorted.length - 1].block;
  }

  const nightBlock = blocks.find((b) => b.block === "night")!;
  const dawnBlock = blocks.find((b) => b.block === "dawn")!;
  const dawnPhenomenonLikely = detectDawnPhenomenon(nightBlock, dawnBlock);

  const recommendations = generateCircadianRecommendations(blocks, dawnPhenomenonLikely);

  return {
    blocks,
    mostSensitiveBlock,
    leastSensitiveBlock,
    dawnPhenomenonLikely,
    recommendations,
  };
}
