/**
 * GluMira™ — CGM Gap Analysis Module
 *
 * Detects and analyzes gaps in continuous glucose monitoring data.
 * Identifies patterns in sensor disconnections, compression lows,
 * and data quality issues.
 *
 * Clinical relevance:
 * - Gaps in CGM data can mask hypo/hyper events
 * - Compression lows create false low readings
 * - Sensor warm-up periods create predictable gaps
 * - Data completeness affects TIR accuracy
 *
 * NOT a medical device. Educational purposes only.
 */

export interface CGMReading {
  timestampUtc: string;
  glucoseMmol: number;
  sensorId?: string;
}

export interface GapEvent {
  startTimestamp: string;
  endTimestamp: string;
  durationMinutes: number;
  gapType: "sensor-change" | "signal-loss" | "compression-low" | "warm-up" | "unknown";
  beforeGap: number | null;  // glucose before gap
  afterGap: number | null;   // glucose after gap
}

export interface GapPattern {
  timeOfDay: string;         // e.g. "02:00-06:00"
  frequency: number;         // count
  avgDurationMinutes: number;
  likelyType: string;
}

export interface CGMGapResult {
  totalReadings: number;
  expectedReadings: number;
  dataCompleteness: number;  // %
  totalGaps: number;
  totalGapMinutes: number;
  longestGapMinutes: number;
  gaps: GapEvent[];
  patterns: GapPattern[];
  sensorChanges: number;
  compressionLows: number;
  qualityScore: "excellent" | "good" | "fair" | "poor";
  warnings: string[];
  recommendations: string[];
}

function parseTs(ts: string): number {
  return new Date(ts).getTime();
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getHour(ts: string): number {
  return new Date(ts).getUTCHours();
}

function classifyGap(
  durationMinutes: number,
  beforeGlucose: number | null,
  afterGlucose: number | null,
  hour: number
): GapEvent["gapType"] {
  // Sensor warm-up is typically 1-2 hours
  if (durationMinutes >= 55 && durationMinutes <= 130) return "warm-up";

  // Compression lows: gap preceded by very low reading during sleep hours
  if (beforeGlucose !== null && beforeGlucose < 3.5 && hour >= 0 && hour <= 6) {
    return "compression-low";
  }

  // Long gaps suggest sensor change
  if (durationMinutes >= 120) return "sensor-change";

  // Short signal losses
  if (durationMinutes < 30) return "signal-loss";

  return "unknown";
}

export function analyzeCGMGaps(
  readings: CGMReading[],
  expectedIntervalMinutes: number = 5
): CGMGapResult {
  if (readings.length === 0) {
    return {
      totalReadings: 0,
      expectedReadings: 0,
      dataCompleteness: 0,
      totalGaps: 0,
      totalGapMinutes: 0,
      longestGapMinutes: 0,
      gaps: [],
      patterns: [],
      sensorChanges: 0,
      compressionLows: 0,
      qualityScore: "poor",
      warnings: ["No CGM data provided."],
      recommendations: ["Ensure CGM sensor is properly connected and transmitting."],
    };
  }

  const sorted = [...readings].sort(
    (a, b) => parseTs(a.timestampUtc) - parseTs(b.timestampUtc)
  );

  // Calculate expected readings
  const totalSpanMs = parseTs(sorted[sorted.length - 1].timestampUtc) - parseTs(sorted[0].timestampUtc);
  const totalSpanMinutes = totalSpanMs / 60_000;
  const expectedReadings = Math.floor(totalSpanMinutes / expectedIntervalMinutes) + 1;
  const dataCompleteness = expectedReadings > 0
    ? Math.round((sorted.length / expectedReadings) * 100)
    : 0;

  // Detect gaps
  const gapThreshold = expectedIntervalMinutes * 2; // Gap if > 2x expected interval
  const gaps: GapEvent[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const diffMs = parseTs(sorted[i].timestampUtc) - parseTs(sorted[i - 1].timestampUtc);
    const diffMinutes = Math.round(diffMs / 60_000);

    if (diffMinutes > gapThreshold) {
      const hour = getHour(sorted[i - 1].timestampUtc);
      const gapType = classifyGap(
        diffMinutes,
        sorted[i - 1].glucoseMmol,
        sorted[i].glucoseMmol,
        hour
      );

      gaps.push({
        startTimestamp: sorted[i - 1].timestampUtc,
        endTimestamp: sorted[i].timestampUtc,
        durationMinutes: diffMinutes,
        gapType,
        beforeGap: sorted[i - 1].glucoseMmol,
        afterGap: sorted[i].glucoseMmol,
      });
    }
  }

  const totalGapMinutes = gaps.reduce((a, g) => a + g.durationMinutes, 0);
  const longestGapMinutes = gaps.length > 0 ? Math.max(...gaps.map((g) => g.durationMinutes)) : 0;

  // Detect patterns by time of day
  const timeSlots = [
    { label: "00:00-06:00", start: 0, end: 6 },
    { label: "06:00-12:00", start: 6, end: 12 },
    { label: "12:00-18:00", start: 12, end: 18 },
    { label: "18:00-24:00", start: 18, end: 24 },
  ];

  const patterns: GapPattern[] = timeSlots
    .map((slot) => {
      const slotGaps = gaps.filter((g) => {
        const h = getHour(g.startTimestamp);
        return h >= slot.start && h < slot.end;
      });
      if (slotGaps.length === 0) return null;

      const avgDuration = Math.round(
        slotGaps.reduce((a, g) => a + g.durationMinutes, 0) / slotGaps.length
      );

      // Determine likely type
      const types = slotGaps.map((g) => g.gapType);
      const typeCounts = new Map<string, number>();
      types.forEach((t) => typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1));
      const likelyType = [...typeCounts.entries()].sort((a, b) => b[1] - a[1])[0][0];

      return {
        timeOfDay: slot.label,
        frequency: slotGaps.length,
        avgDurationMinutes: avgDuration,
        likelyType,
      };
    })
    .filter((p): p is GapPattern => p !== null);

  // Counts
  const sensorChanges = gaps.filter((g) => g.gapType === "sensor-change" || g.gapType === "warm-up").length;
  const compressionLows = gaps.filter((g) => g.gapType === "compression-low").length;

  // Quality score
  let qualityScore: CGMGapResult["qualityScore"] = "excellent";
  if (dataCompleteness < 70) qualityScore = "poor";
  else if (dataCompleteness < 85) qualityScore = "fair";
  else if (dataCompleteness < 95) qualityScore = "good";

  // Warnings
  const warnings: string[] = [];

  if (dataCompleteness < 70) {
    warnings.push(`Data completeness is only ${dataCompleteness}% — reports may not accurately reflect glucose patterns.`);
  }

  if (longestGapMinutes > 180) {
    warnings.push(`Longest gap is ${formatDuration(longestGapMinutes)} — significant events may have been missed.`);
  }

  if (compressionLows > 0) {
    warnings.push(`${compressionLows} potential compression low events detected — these may appear as false lows.`);
  }

  const nightGaps = patterns.find((p) => p.timeOfDay === "00:00-06:00");
  if (nightGaps && nightGaps.frequency > 2) {
    warnings.push("Frequent overnight gaps detected — nocturnal hypos may be going undetected.");
  }

  // Recommendations
  const recommendations: string[] = [];

  if (dataCompleteness < 90) {
    recommendations.push("Keep your phone/receiver within range of the CGM transmitter to reduce signal loss gaps.");
  }

  if (compressionLows > 0) {
    recommendations.push("Try sleeping on your back or opposite side to reduce compression lows from lying on the sensor.");
  }

  if (sensorChanges > 2) {
    recommendations.push("Multiple sensor changes detected. Ensure proper sensor insertion and site preparation.");
  }

  if (longestGapMinutes > 60) {
    recommendations.push("For gaps over 1 hour, consider fingerstick testing to fill in critical glucose data.");
  }

  recommendations.push("Aim for 95%+ data completeness for the most accurate glucose reports.");

  return {
    totalReadings: sorted.length,
    expectedReadings,
    dataCompleteness,
    totalGaps: gaps.length,
    totalGapMinutes,
    longestGapMinutes,
    gaps,
    patterns,
    sensorChanges,
    compressionLows,
    qualityScore,
    warnings,
    recommendations,
  };
}
