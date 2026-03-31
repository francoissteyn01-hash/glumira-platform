/**
 * GluMira™ — Basal Rate Profiler Module
 *
 * Analyzes 24-hour glucose patterns to generate a personalized
 * basal rate profile with time-of-day segments.
 *
 * Uses fasting glucose data (no meals, no boluses) to isolate
 * basal insulin effect from food/bolus effects.
 *
 * NOT a medical device. Educational purposes only.
 */

export interface FastingGlucosePoint {
  timestampUtc: string;
  glucoseMmol: number;
}

export interface BasalProfileInput {
  fastingData: FastingGlucosePoint[];  // ideally from basal rate testing days
  currentTDD: number;
  currentBasalTotal: number;           // total daily basal units
  targetMmol: { low: number; high: number };
  segmentCount: 4 | 6 | 8 | 12;      // how many segments to divide the day into
}

export interface ProfileSegment {
  startTime: string;   // "HH:00"
  endTime: string;     // "HH:00"
  meanGlucose: number;
  trend: "rising" | "falling" | "stable";
  suggestedRateMultiplier: number;  // relative to average
  suggestedRate: number;            // U/hr
  needsMore: boolean;
  needsLess: boolean;
}

export interface BasalProfileResult {
  segments: ProfileSegment[];
  averageRate: number;
  totalBasalUnits: number;
  peakDemandTime: string;
  lowestDemandTime: string;
  dawnPhenomenon: boolean;
  footOnFloor: boolean;
  overallPattern: string;
  recommendations: string[];
  disclaimer: string;
}

/* ── helpers ─────────────────────────────────────────────────── */

function getHour(ts: string): number {
  return new Date(ts).getUTCHours();
}

function formatHour(h: number): string {
  return `${String(h).padStart(2, "0")}:00`;
}

/* ── main profiler ───────────────────────────────────────────── */

export function generateBasalProfile(input: BasalProfileInput): BasalProfileResult {
  const { fastingData, currentBasalTotal, targetMmol, segmentCount } = input;
  const hoursPerSegment = 24 / segmentCount;
  const averageRate = Math.round((currentBasalTotal / 24) * 100) / 100;

  // Group readings by segment
  const segmentData: Map<number, number[]> = new Map();
  for (let i = 0; i < segmentCount; i++) {
    segmentData.set(i, []);
  }

  fastingData.forEach((p) => {
    const hour = getHour(p.timestampUtc);
    const segIndex = Math.floor(hour / hoursPerSegment) % segmentCount;
    segmentData.get(segIndex)!.push(p.glucoseMmol);
  });

  // Build segments
  const segments: ProfileSegment[] = [];
  let peakMultiplier = 0;
  let peakSegment = 0;
  let lowestMultiplier = Infinity;
  let lowestSegment = 0;

  for (let i = 0; i < segmentCount; i++) {
    const startHour = i * hoursPerSegment;
    const endHour = (i + 1) * hoursPerSegment;
    const values = segmentData.get(i) ?? [];

    const meanGlucose = values.length > 0
      ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
      : 0;

    // Determine trend within segment
    let trend: "rising" | "falling" | "stable" = "stable";
    if (values.length >= 2) {
      const firstHalf = values.slice(0, Math.ceil(values.length / 2));
      const secondHalf = values.slice(Math.ceil(values.length / 2));
      const firstMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      const diff = secondMean - firstMean;
      if (diff > 0.5) trend = "rising";
      else if (diff < -0.5) trend = "falling";
    }

    // Calculate rate multiplier
    const targetMid = (targetMmol.low + targetMmol.high) / 2;
    let multiplier = 1.0;

    if (meanGlucose > 0) {
      if (meanGlucose > targetMmol.high) {
        multiplier = 1.0 + (meanGlucose - targetMid) / targetMid * 0.5;
      } else if (meanGlucose < targetMmol.low) {
        multiplier = 1.0 - (targetMid - meanGlucose) / targetMid * 0.5;
      } else if (trend === "rising") {
        multiplier = 1.05;
      } else if (trend === "falling") {
        multiplier = 0.95;
      }
    }

    multiplier = Math.round(Math.max(0.5, Math.min(2.0, multiplier)) * 100) / 100;
    const suggestedRate = Math.round(averageRate * multiplier * 100) / 100;

    if (multiplier > peakMultiplier) {
      peakMultiplier = multiplier;
      peakSegment = i;
    }
    if (multiplier < lowestMultiplier) {
      lowestMultiplier = multiplier;
      lowestSegment = i;
    }

    segments.push({
      startTime: formatHour(startHour),
      endTime: formatHour(endHour % 24),
      meanGlucose,
      trend,
      suggestedRateMultiplier: multiplier,
      suggestedRate,
      needsMore: meanGlucose > targetMmol.high || trend === "rising",
      needsLess: meanGlucose < targetMmol.low || trend === "falling",
    });
  }

  // Total suggested basal
  const totalBasalUnits = Math.round(
    segments.reduce((a, s) => a + s.suggestedRate * hoursPerSegment, 0) * 10
  ) / 10;

  // Pattern detection — dawn phenomenon
  // Compare late-night vs early-morning segment means (cross-segment rise)
  const lateNightSegments = segments.filter((s) => {
    const h = parseInt(s.startTime);
    return h >= 0 && h < 4;
  });
  const earlyMorningSegments = segments.filter((s) => {
    const h = parseInt(s.startTime);
    return h >= 3 && h < 8;
  });
  const lateNightMean = lateNightSegments.length > 0
    ? lateNightSegments.reduce((a, s) => a + s.meanGlucose, 0) / lateNightSegments.length
    : 0;
  const earlyMorningMean = earlyMorningSegments.length > 0
    ? earlyMorningSegments.reduce((a, s) => a + s.meanGlucose, 0) / earlyMorningSegments.length
    : 0;
  const dawnPhenomenon = lateNightMean > 0 && earlyMorningMean > 0 && (earlyMorningMean - lateNightMean) >= 1.0;

  const wakeSegments = segments.filter((s) => {
    const h = parseInt(s.startTime);
    return h >= 6 && h < 9;
  });
  const footOnFloor = wakeSegments.some((s) => s.suggestedRateMultiplier > 1.1);

  // Overall pattern
  let overallPattern = "Relatively flat basal needs throughout the day.";
  if (dawnPhenomenon && footOnFloor) {
    overallPattern = "Dawn phenomenon with foot-on-floor effect — higher basal needed from 3am through morning.";
  } else if (dawnPhenomenon) {
    overallPattern = "Dawn phenomenon detected — higher basal needed in early morning hours.";
  } else if (footOnFloor) {
    overallPattern = "Foot-on-floor effect — glucose rises upon waking, higher morning basal needed.";
  }

  // Recommendations
  const recommendations: string[] = [];

  if (dawnPhenomenon) {
    recommendations.push("Increase basal rate starting 2-3 hours before the glucose rise begins (typically 3-4am).");
  }

  if (footOnFloor) {
    recommendations.push("Consider a higher basal rate from 6-9am to counteract the foot-on-floor effect.");
  }

  const highSegments = segments.filter((s) => s.needsMore);
  if (highSegments.length > 0) {
    recommendations.push(`${highSegments.length} time periods show glucose above target — consider increasing basal during these times.`);
  }

  const lowSegments = segments.filter((s) => s.needsLess);
  if (lowSegments.length > 0) {
    recommendations.push(`${lowSegments.length} time periods show glucose below target — consider reducing basal during these times.`);
  }

  recommendations.push("Validate basal rates with formal basal testing (skip meals and monitor glucose for 6-8 hours).");

  return {
    segments,
    averageRate,
    totalBasalUnits,
    peakDemandTime: formatHour(peakSegment * hoursPerSegment),
    lowestDemandTime: formatHour(lowestSegment * hoursPerSegment),
    dawnPhenomenon,
    footOnFloor,
    overallPattern,
    recommendations,
    disclaimer:
      "GluMira™ is an educational platform. The science of insulin, made visible. " +
      "Basal rate changes must be approved by your diabetes team.",
  };
}
