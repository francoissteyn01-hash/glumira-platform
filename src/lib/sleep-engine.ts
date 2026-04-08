/**
 * GluMira™ V7 — Block 40: Sleep Engine
 * Pure TypeScript sleep pattern analysis for overnight glucose education.
 */

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface SleepEntry {
  id: string;
  bedTime: string;
  wakeTime: string;
  quality: "poor" | "fair" | "good" | "excellent";
  interruptions: number;
  glucoseAtBed?: number;
  glucoseAtWake?: number;
  glucoseUnits: "mmol" | "mg";
  notes?: string;
}

export interface SleepAnalysis {
  durationHours: number;
  overnightDrift: number | null;
  driftDirection: "rise" | "drop" | "stable" | null;
  dawnPhenomenon: boolean;
  somogyiEffect: boolean;
  pattern: string;
  recommendation: string;
}

export interface SleepPatternSummary {
  avgDuration: number;
  avgOvernightDrift: number;
  dawnPhenomenonFrequency: number;
  poorSleepCorrelation: string;
  insights: string[];
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */

function toMmol(value: number, units: "mmol" | "mg"): number {
  return units === "mg" ? value / 18.0182 : value;
}

function round(n: number, dp = 1): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

function calcDuration(bed: string, wake: string): number {
  const bedMs = new Date(bed).getTime();
  const wakeMs = new Date(wake).getTime();
  if (isNaN(bedMs) || isNaN(wakeMs)) return 0;
  const diff = (wakeMs - bedMs) / (1000 * 60 * 60);
  return diff > 0 ? round(diff) : round(diff + 24);
}

/* ─── Dawn Phenomenon Detection ─────────────────────────────────────────── */

export function detectDawnPhenomenon(
  glucoseAtBed: number | undefined,
  glucoseAtWake: number | undefined,
  units: "mmol" | "mg"
): { detected: boolean; magnitude: number; explanation: string } {
  if (glucoseAtBed == null || glucoseAtWake == null) {
    return { detected: false, magnitude: 0, explanation: "Insufficient glucose data to assess dawn phenomenon." };
  }

  const bedMmol = toMmol(glucoseAtBed, units);
  const wakeMmol = toMmol(glucoseAtWake, units);
  const rise = round(wakeMmol - bedMmol);

  if (rise > 2) {
    return {
      detected: true,
      magnitude: rise,
      explanation:
        `Your glucose rose by ${rise} mmol/L overnight. This pattern is consistent with the dawn phenomenon — ` +
        `a natural rise in blood glucose caused by hormones released in the early morning hours. ` +
        `Many people with diabetes experience this. Discuss basal insulin timing with your care team.`,
    };
  }

  return {
    detected: false,
    magnitude: Math.max(rise, 0),
    explanation:
      rise > 0
        ? `Your glucose rose by ${rise} mmol/L overnight, which is within a typical range and does not suggest dawn phenomenon.`
        : "No significant overnight glucose rise detected.",
  };
}

/* ─── Somogyi Effect Detection ──────────────────────────────────────────── */

export function detectSomogyiEffect(
  overnightReadings: { value: number; time: string }[]
): { detected: boolean; lowPoint: number | null; explanation: string } {
  if (overnightReadings.length < 3) {
    return {
      detected: false,
      lowPoint: null,
      explanation: "Not enough overnight readings to assess the Somogyi effect. At least three readings are needed.",
    };
  }

  const sorted = [...overnightReadings].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  const first = sorted[0].value;
  const last = sorted[sorted.length - 1].value;
  let minVal = Infinity;
  let minIdx = 0;

  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i].value < minVal) {
      minVal = sorted[i].value;
      minIdx = i;
    }
  }

  // Somogyi: low in middle of night followed by rebound high
  const hasLow = minVal < 4.0; // mmol/L threshold
  const isMiddle = minIdx > 0 && minIdx < sorted.length - 1;
  const hasRebound = last - minVal > 3.0;
  const morningHigher = last > first;

  if (hasLow && isMiddle && hasRebound && morningHigher) {
    return {
      detected: true,
      lowPoint: round(minVal),
      explanation:
        `A potential Somogyi effect was detected. Your glucose dropped to ${round(minVal)} mmol/L during the night ` +
        `and then rebounded to ${round(last)} mmol/L by morning. This rebound high can be caused by the body ` +
        `releasing counter-regulatory hormones in response to an overnight low. ` +
        `If this pattern recurs, your care team may suggest adjusting your evening basal insulin dose.`,
    };
  }

  return {
    detected: false,
    lowPoint: minVal < first ? round(minVal) : null,
    explanation: "No Somogyi pattern detected in the overnight readings provided.",
  };
}

/* ─── Sleep Recommendation ──────────────────────────────────────────────── */

export function getSleepRecommendation(analysis: SleepAnalysis): string {
  const parts: string[] = [];

  if (analysis.durationHours < 6) {
    parts.push(
      "Short sleep duration (under 6 hours) is associated with increased insulin resistance and higher morning glucose. " +
      "Prioritising sleep is one of the most effective non-insulin tools for glucose management."
    );
  } else if (analysis.durationHours < 7) {
    parts.push(
      "Aim for 7-9 hours of sleep when possible. Even modest sleep extension can improve insulin sensitivity the following day."
    );
  } else {
    parts.push(
      "Your sleep duration is within the recommended 7-9 hour range, which supports healthy glucose regulation."
    );
  }

  if (analysis.dawnPhenomenon) {
    parts.push(
      "The dawn phenomenon pattern detected suggests your body is releasing glucose-raising hormones in the early hours. " +
      "Some people find that adjusting the timing or dose of their evening basal insulin helps manage this rise. " +
      "Always discuss changes with your healthcare team."
    );
  }

  if (analysis.somogyiEffect) {
    parts.push(
      "A possible Somogyi rebound was identified. This occurs when overnight lows trigger a counter-regulatory hormone response, " +
      "leading to high morning glucose. Reducing your evening basal insulin — rather than increasing it — may help. " +
      "Confirm with your care team before making changes."
    );
  }

  if (analysis.driftDirection === "drop" && analysis.overnightDrift !== null && analysis.overnightDrift < -2) {
    parts.push(
      "Your glucose dropped significantly overnight. If this pattern persists, it may indicate too much basal insulin during sleep hours."
    );
  }

  if (parts.length === 0) {
    parts.push(
      "Your overnight glucose and sleep duration look stable. Continue monitoring to build a clearer picture of your patterns over time."
    );
  }

  return parts.join(" ");
}

/* ─── Analyse Single Entry ──────────────────────────────────────────────── */

export function analyzeSleepEntry(entry: SleepEntry): SleepAnalysis {
  const durationHours = calcDuration(entry.bedTime, entry.wakeTime);

  let overnightDrift: number | null = null;
  let driftDirection: "rise" | "drop" | "stable" | null = null;

  if (entry.glucoseAtBed != null && entry.glucoseAtWake != null) {
    const bedMmol = toMmol(entry.glucoseAtBed, entry.glucoseUnits);
    const wakeMmol = toMmol(entry.glucoseAtWake, entry.glucoseUnits);
    overnightDrift = round(wakeMmol - bedMmol);
    driftDirection = overnightDrift > 1 ? "rise" : overnightDrift < -1 ? "drop" : "stable";
  }

  const dawn = detectDawnPhenomenon(entry.glucoseAtBed, entry.glucoseAtWake, entry.glucoseUnits);
  const dawnPhenomenon = dawn.detected;

  // Somogyi requires intermediate readings — not available from a single entry, default to false
  const somogyiEffect = false;

  // Build pattern description
  const patternParts: string[] = [];
  patternParts.push(`${durationHours} hours of ${entry.quality} quality sleep`);
  if (entry.interruptions > 0) {
    patternParts.push(`with ${entry.interruptions} interruption${entry.interruptions > 1 ? "s" : ""}`);
  }
  if (driftDirection === "rise" && overnightDrift !== null) {
    patternParts.push(`and a ${overnightDrift} mmol/L overnight rise`);
  } else if (driftDirection === "drop" && overnightDrift !== null) {
    patternParts.push(`and a ${Math.abs(overnightDrift)} mmol/L overnight drop`);
  } else if (driftDirection === "stable") {
    patternParts.push("with stable overnight glucose");
  }
  if (dawnPhenomenon) {
    patternParts.push("— dawn phenomenon suspected");
  }
  const pattern = patternParts.join(" ");

  const analysis: SleepAnalysis = {
    durationHours,
    overnightDrift,
    driftDirection,
    dawnPhenomenon,
    somogyiEffect,
    pattern,
    recommendation: "",
  };

  analysis.recommendation = getSleepRecommendation(analysis);

  return analysis;
}

/* ─── Analyse Multiple Entries (Pattern Summary) ────────────────────────── */

export function analyzeSleepPatterns(entries: SleepEntry[], days: number): SleepPatternSummary {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const recent = entries.filter((e) => new Date(e.bedTime).getTime() >= cutoff);

  if (recent.length === 0) {
    return {
      avgDuration: 0,
      avgOvernightDrift: 0,
      dawnPhenomenonFrequency: 0,
      poorSleepCorrelation: "No sleep data available for the selected period.",
      insights: ["Start logging your sleep to uncover patterns between rest and glucose control."],
    };
  }

  const analyses = recent.map(analyzeSleepEntry);

  const avgDuration = round(analyses.reduce((s, a) => s + a.durationHours, 0) / analyses.length);

  const drifts = analyses.filter((a) => a.overnightDrift !== null).map((a) => a.overnightDrift as number);
  const avgOvernightDrift = drifts.length > 0 ? round(drifts.reduce((s, d) => s + d, 0) / drifts.length) : 0;

  const dawnCount = analyses.filter((a) => a.dawnPhenomenon).length;
  const dawnPhenomenonFrequency = recent.length > 0 ? round((dawnCount / recent.length) * 100, 0) : 0;

  // Poor sleep correlation
  const poorEntries = recent.filter((e) => e.quality === "poor");
  const goodEntries = recent.filter((e) => e.quality === "good" || e.quality === "excellent");

  let poorSleepCorrelation = "Not enough data to determine a correlation between sleep quality and morning glucose.";

  if (poorEntries.length >= 2 && goodEntries.length >= 2) {
    const poorAvgWake = poorEntries
      .filter((e) => e.glucoseAtWake != null)
      .map((e) => toMmol(e.glucoseAtWake!, e.glucoseUnits));
    const goodAvgWake = goodEntries
      .filter((e) => e.glucoseAtWake != null)
      .map((e) => toMmol(e.glucoseAtWake!, e.glucoseUnits));

    if (poorAvgWake.length > 0 && goodAvgWake.length > 0) {
      const poorMean = poorAvgWake.reduce((s, v) => s + v, 0) / poorAvgWake.length;
      const goodMean = goodAvgWake.reduce((s, v) => s + v, 0) / goodAvgWake.length;
      const diff = round(poorMean - goodMean);
      const pctDiff = goodMean > 0 ? round((diff / goodMean) * 100, 0) : 0;

      if (diff > 0) {
        poorSleepCorrelation = `Poor sleep associated with ${pctDiff}% higher morning glucose (${round(poorMean)} vs ${round(goodMean)} mmol/L).`;
      } else if (diff < 0) {
        poorSleepCorrelation = `No negative correlation found — morning glucose was similar regardless of sleep quality.`;
      } else {
        poorSleepCorrelation = `Morning glucose was similar on poor and good sleep nights.`;
      }
    }
  }

  // Insights
  const insights: string[] = [];

  if (avgDuration < 6.5) {
    insights.push("Your average sleep duration is below 6.5 hours. Research shows that short sleep increases insulin resistance by up to 25%.");
  }
  if (dawnPhenomenonFrequency > 50) {
    insights.push(`Dawn phenomenon was detected on ${dawnPhenomenonFrequency}% of nights. This is a common pattern worth discussing with your care team.`);
  }
  if (avgOvernightDrift > 2) {
    insights.push(`Your average overnight glucose rise is ${avgOvernightDrift} mmol/L. Consider reviewing your evening basal insulin timing.`);
  }
  if (avgOvernightDrift < -2) {
    insights.push(`Your glucose drops an average of ${Math.abs(avgOvernightDrift)} mmol/L overnight. Your evening basal dose may be too high.`);
  }

  const highInterrupt = recent.filter((e) => e.interruptions >= 3).length;
  if (highInterrupt > recent.length * 0.3) {
    insights.push("Frequent sleep interruptions (3+) were reported on many nights. Fragmented sleep can impair glucose regulation.");
  }

  if (insights.length === 0) {
    insights.push("Your sleep patterns appear consistent. Keep logging to track trends over time.");
  }

  return {
    avgDuration,
    avgOvernightDrift,
    dawnPhenomenonFrequency,
    poorSleepCorrelation,
    insights,
  };
}
