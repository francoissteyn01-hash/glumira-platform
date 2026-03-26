/**
 * GluMira — Glucose Data Quality Module
 *
 * Assesses the quality and completeness of glucose data to ensure
 * reliable analytics. Detects gaps, sensor noise, compression artefacts,
 * and insufficient data periods.
 *
 * GluMira is an informational tool only. Not a medical device.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GlucoseReading {
  mmol: number;
  timestamp: string;
}

export interface DataGap {
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export interface DataQualityReport {
  totalReadings: number;
  expectedReadings: number;
  completenessPercent: number;
  gaps: DataGap[];
  longestGapMinutes: number;
  avgReadingsPerDay: number;
  noiseScore: number;
  qualityGrade: string;
  isReliable: boolean;
  warnings: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function minutesBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / 60000;
}

// ─── Gap detection ───────────────────────────────────────────────────────────

/**
 * Detect gaps in glucose data where readings are missing for more than
 * the specified threshold (default: 15 minutes for CGM data).
 */
export function detectGaps(
  readings: GlucoseReading[],
  gapThresholdMinutes: number = 15
): DataGap[] {
  if (readings.length < 2) return [];

  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const gaps: DataGap[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const duration = minutesBetween(sorted[i - 1].timestamp, sorted[i].timestamp);
    if (duration > gapThresholdMinutes) {
      gaps.push({
        startTime: sorted[i - 1].timestamp,
        endTime: sorted[i].timestamp,
        durationMinutes: round2(duration),
      });
    }
  }

  return gaps;
}

// ─── Noise detection ─────────────────────────────────────────────────────────

/**
 * Compute a noise score (0-100) based on consecutive reading differences.
 * High noise suggests sensor issues or compression artefacts.
 */
export function computeNoiseScore(readings: GlucoseReading[]): number {
  if (readings.length < 3) return 0;

  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let directionChanges = 0;
  for (let i = 2; i < sorted.length; i++) {
    const prev = sorted[i - 1].mmol - sorted[i - 2].mmol;
    const curr = sorted[i].mmol - sorted[i - 1].mmol;
    if ((prev > 0 && curr < 0) || (prev < 0 && curr > 0)) {
      directionChanges++;
    }
  }

  // Normalise: if every pair changes direction, score = 100
  const maxChanges = sorted.length - 2;
  return maxChanges > 0 ? round2((directionChanges / maxChanges) * 100) : 0;
}

// ─── Completeness ────────────────────────────────────────────────────────────

/**
 * Compute expected readings based on the time span and a 5-minute interval.
 */
export function computeExpectedReadings(
  readings: GlucoseReading[],
  intervalMinutes: number = 5
): number {
  if (readings.length < 2) return readings.length;

  const sorted = [...readings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const spanMinutes = minutesBetween(
    sorted[0].timestamp,
    sorted[sorted.length - 1].timestamp
  );

  return Math.floor(spanMinutes / intervalMinutes) + 1;
}

// ─── Quality grade ───────────────────────────────────────────────────────────

/**
 * Assign a quality grade based on completeness and noise.
 */
export function qualityGrade(completenessPercent: number, noiseScore: number): string {
  if (completenessPercent >= 90 && noiseScore <= 30) return "A";
  if (completenessPercent >= 80 && noiseScore <= 50) return "B";
  if (completenessPercent >= 70 && noiseScore <= 60) return "C";
  if (completenessPercent >= 50) return "D";
  return "F";
}

/**
 * Whether the data is reliable enough for clinical analytics.
 */
export function isDataReliable(completenessPercent: number, noiseScore: number): boolean {
  return completenessPercent >= 70 && noiseScore <= 60;
}

// ─── Full report ─────────────────────────────────────────────────────────────

/**
 * Generate a comprehensive data quality report.
 */
export function generateDataQualityReport(
  readings: GlucoseReading[],
  intervalMinutes: number = 5,
  gapThresholdMinutes: number = 15
): DataQualityReport {
  const gaps = detectGaps(readings, gapThresholdMinutes);
  const noiseScore = computeNoiseScore(readings);
  const expectedReadings = computeExpectedReadings(readings, intervalMinutes);
  const completenessPercent =
    expectedReadings > 0 ? round2((readings.length / expectedReadings) * 100) : 0;
  const grade = qualityGrade(completenessPercent, noiseScore);
  const reliable = isDataReliable(completenessPercent, noiseScore);

  // Average readings per day
  let avgReadingsPerDay = 0;
  if (readings.length >= 2) {
    const sorted = [...readings].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const spanDays =
      minutesBetween(sorted[0].timestamp, sorted[sorted.length - 1].timestamp) / 1440;
    avgReadingsPerDay = spanDays > 0 ? round2(readings.length / spanDays) : readings.length;
  }

  const longestGapMinutes =
    gaps.length > 0 ? Math.max(...gaps.map((g) => g.durationMinutes)) : 0;

  // Warnings
  const warnings: string[] = [];
  if (completenessPercent < 70) warnings.push("Low data completeness — analytics may be unreliable");
  if (noiseScore > 60) warnings.push("High sensor noise detected — consider recalibrating");
  if (longestGapMinutes > 120) warnings.push(`Longest gap: ${longestGapMinutes.toFixed(0)} minutes`);
  if (readings.length < 288) warnings.push("Less than 1 day of data — insufficient for trend analysis");

  return {
    totalReadings: readings.length,
    expectedReadings,
    completenessPercent,
    gaps,
    longestGapMinutes,
    avgReadingsPerDay,
    noiseScore,
    qualityGrade: grade,
    isReliable: reliable,
    warnings,
  };
}
