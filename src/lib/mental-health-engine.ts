/**
 * GluMira V7 — Mental Health / Diabetes Distress Engine (Block 41 + 69)
 *
 * SAFETY: This module provides educational pattern observations only.
 * It does NOT diagnose any mental health condition.
 * All outputs recommend professional help for moderate+ distress.
 */

export interface MoodEntry {
  id: string;
  timestamp: string;
  mood: "great" | "good" | "okay" | "low" | "very_low";
  stressLevel: 1 | 2 | 3 | 4 | 5;
  diabetesBurnout: boolean;
  glucoseValue?: number;
  glucoseUnits?: "mmol" | "mg";
  sleepQuality?: "poor" | "fair" | "good" | "excellent";
  notes?: string;
}

export interface DistressScore {
  score: number;
  level: "low" | "mild" | "moderate" | "high" | "severe";
  factors: string[];
  recommendation: string;
  seekHelpFlag: boolean;
}

export interface MoodGlucoseCorrelation {
  correlation: "positive" | "negative" | "none" | "insufficient_data";
  description: string;
  avgGlucoseByMood: Record<string, number>;
  insight: string;
}

export interface BurnoutPattern {
  detected: boolean;
  severity: string;
  guidance: string;
}

export interface CrisisResource {
  name: string;
  contact: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const MOOD_WEIGHTS: Record<MoodEntry["mood"], number> = {
  great: 0,
  good: 5,
  okay: 15,
  low: 30,
  very_low: 45,
};

const SLEEP_WEIGHTS: Record<NonNullable<MoodEntry["sleepQuality"]>, number> = {
  excellent: 0,
  good: 2,
  fair: 6,
  poor: 12,
};

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function levelFromScore(score: number): DistressScore["level"] {
  if (score <= 25) return "low";
  if (score <= 50) return "mild";
  if (score <= 70) return "moderate";
  if (score <= 85) return "high";
  return "severe";
}

function filterByDays(entries: MoodEntry[], days: number): MoodEntry[] {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return entries.filter((e) => new Date(e.timestamp).getTime() >= cutoff);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Calculate a diabetes-distress score from recent mood entries.
 * This is a pattern observation tool, NOT a clinical assessment.
 */
export function calculateDistressScore(
  entries: MoodEntry[],
  days: number,
): DistressScore {
  const recent = filterByDays(entries, days);

  if (recent.length === 0) {
    return {
      score: 0,
      level: "low",
      factors: [],
      recommendation:
        "Start logging your mood to observe patterns over time. This is not a clinical assessment.",
      seekHelpFlag: false,
    };
  }

  const factors: string[] = [];

  // Average mood weight
  const avgMood =
    recent.reduce((sum, e) => sum + MOOD_WEIGHTS[e.mood], 0) / recent.length;

  // Average stress contribution (stress 1-5 mapped to 0-20)
  const avgStress =
    recent.reduce((sum, e) => sum + (e.stressLevel - 1) * 5, 0) / recent.length;

  // Burnout prevalence (0-15)
  const burnoutRatio = recent.filter((e) => e.diabetesBurnout).length / recent.length;
  const burnoutScore = burnoutRatio * 15;

  // Sleep impact (0-12)
  const sleepEntries = recent.filter((e) => e.sleepQuality != null);
  const avgSleep =
    sleepEntries.length > 0
      ? sleepEntries.reduce(
          (sum, e) => sum + SLEEP_WEIGHTS[e.sleepQuality!],
          0,
        ) / sleepEntries.length
      : 0;

  // Trend penalty: are recent entries worse than earlier ones?
  let trendPenalty = 0;
  if (recent.length >= 4) {
    const half = Math.floor(recent.length / 2);
    const sorted = [...recent].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
    const olderAvg =
      sorted.slice(0, half).reduce((s, e) => s + MOOD_WEIGHTS[e.mood], 0) / half;
    const newerAvg =
      sorted.slice(half).reduce((s, e) => s + MOOD_WEIGHTS[e.mood], 0) /
      (sorted.length - half);
    if (newerAvg > olderAvg + 5) {
      trendPenalty = 8;
      factors.push("Mood appears to be trending downward over the observed period");
    }
  }

  // Build factors list
  if (avgMood >= 25) factors.push("Consistently low mood reported");
  if (avgStress >= 12) factors.push("Elevated self-reported stress levels");
  if (burnoutRatio >= 0.5) factors.push("Frequent diabetes burnout reported");
  if (avgSleep >= 8) factors.push("Poor sleep quality reported");

  const rawScore = avgMood + avgStress + burnoutScore + avgSleep + trendPenalty;
  const score = clamp(Math.round(rawScore), 0, 100);
  const level = levelFromScore(score);
  const seekHelpFlag = score >= 70 || burnoutRatio >= 0.8;

  let recommendation: string;
  switch (level) {
    case "low":
      recommendation =
        "Your observed patterns suggest low diabetes-related distress. Continue monitoring and maintaining healthy habits.";
      break;
    case "mild":
      recommendation =
        "Some mild distress patterns have been observed. Consider speaking with your diabetes educator about coping strategies.";
      break;
    case "moderate":
      recommendation =
        "Moderate distress patterns observed. We recommend speaking with a diabetes educator or counsellor. This is not a diagnosis — a professional can help you explore what you are experiencing.";
      break;
    case "high":
      recommendation =
        "Significant distress patterns observed. Please consider reaching out to a mental health professional or your diabetes care team soon. You do not have to manage this alone.";
      break;
    case "severe":
      recommendation =
        "Severe distress patterns observed. Please reach out to a mental health professional, your healthcare provider, or a crisis service. You deserve support.";
      break;
  }

  return { score, level, factors, recommendation, seekHelpFlag };
}

/**
 * Analyse the relationship between self-reported mood and glucose values.
 * Returns a pattern observation, not a clinical finding.
 */
export function analyzeMoodGlucoseCorrelation(
  entries: MoodEntry[],
): MoodGlucoseCorrelation {
  const withGlucose = entries.filter(
    (e) => e.glucoseValue != null && e.glucoseValue > 0,
  );

  if (withGlucose.length < 5) {
    return {
      correlation: "insufficient_data",
      description:
        "Not enough paired mood and glucose entries to observe a pattern yet.",
      avgGlucoseByMood: {},
      insight:
        "Log at least 5 entries with both mood and glucose values to see patterns.",
    };
  }

  // Normalise all to mg/dL for comparison
  const normalised = withGlucose.map((e) => ({
    mood: e.mood,
    glucose:
      e.glucoseUnits === "mmol"
        ? (e.glucoseValue ?? 0) * 18.0182
        : (e.glucoseValue ?? 0),
  }));

  // Group by mood
  const groups: Record<string, number[]> = {};
  for (const n of normalised) {
    if (!groups[n.mood]) groups[n.mood] = [];
    groups[n.mood].push(n.glucose);
  }

  const avgGlucoseByMood: Record<string, number> = {};
  for (const [mood, vals] of Object.entries(groups)) {
    avgGlucoseByMood[mood] = Math.round(
      vals.reduce((a, b) => a + b, 0) / vals.length,
    );
  }

  // Simple monotonic check across mood ordering
  const moodOrder: MoodEntry["mood"][] = [
    "great",
    "good",
    "okay",
    "low",
    "very_low",
  ];
  const available = moodOrder.filter((m) => avgGlucoseByMood[m] != null);

  let rising = 0;
  let falling = 0;
  for (let i = 1; i < available.length; i++) {
    const diff =
      avgGlucoseByMood[available[i]] - avgGlucoseByMood[available[i - 1]];
    if (diff > 5) rising++;
    else if (diff < -5) falling++;
  }

  let correlation: MoodGlucoseCorrelation["correlation"];
  let description: string;
  let insight: string;

  if (available.length < 3) {
    correlation = "insufficient_data";
    description = "Not enough mood categories represented to detect a pattern.";
    insight = "Try logging a wider range of moods alongside glucose values.";
  } else if (rising > falling && rising >= 2) {
    correlation = "positive";
    description =
      "Lower mood entries tend to coincide with higher glucose readings in your logs.";
    insight =
      "This pattern is commonly observed. High glucose can affect mood, and stress can raise glucose. Discuss this pattern with your care team.";
  } else if (falling > rising && falling >= 2) {
    correlation = "negative";
    description =
      "Lower mood entries tend to coincide with lower glucose readings in your logs.";
    insight =
      "Hypoglycaemia can significantly affect mood and energy. If you notice this, discuss adjustment strategies with your care team.";
  } else {
    correlation = "none";
    description =
      "No clear pattern observed between mood and glucose in your logs so far.";
    insight =
      "Many factors influence both mood and glucose. Keep logging to see if patterns emerge over time.";
  }

  return { correlation, description, avgGlucoseByMood, insight };
}

/**
 * Detect diabetes burnout patterns from logged entries.
 */
export function detectBurnoutPattern(entries: MoodEntry[]): BurnoutPattern {
  if (entries.length < 3) {
    return {
      detected: false,
      severity: "none",
      guidance:
        "Continue logging to allow pattern detection. At least 3 entries are needed.",
    };
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const burnoutCount = sorted.filter((e) => e.diabetesBurnout).length;
  const burnoutRatio = burnoutCount / sorted.length;

  // Check for consecutive burnout
  let maxConsecutive = 0;
  let current = 0;
  for (const e of sorted) {
    if (e.diabetesBurnout) {
      current++;
      maxConsecutive = Math.max(maxConsecutive, current);
    } else {
      current = 0;
    }
  }

  // Check for consistently low mood alongside burnout
  const lowMoodBurnout = sorted.filter(
    (e) =>
      e.diabetesBurnout && (e.mood === "low" || e.mood === "very_low"),
  ).length;

  if (burnoutRatio < 0.2 && maxConsecutive < 2) {
    return {
      detected: false,
      severity: "none",
      guidance:
        "No burnout pattern detected at this time. Diabetes management fatigue is normal — keep checking in with yourself.",
    };
  }

  let severity: string;
  let guidance: string;

  if (burnoutRatio >= 0.7 || maxConsecutive >= 5) {
    severity = "high";
    guidance =
      "A persistent burnout pattern has been observed. Diabetes burnout is real and valid. Please consider speaking with a mental health professional who understands chronic illness, or contact your diabetes care team. You do not have to manage everything alone.";
  } else if (burnoutRatio >= 0.4 || maxConsecutive >= 3 || lowMoodBurnout >= 3) {
    severity = "moderate";
    guidance =
      "A moderate burnout pattern has been observed. This is common among people managing diabetes. Consider discussing coping strategies with your diabetes educator or a counsellor. Small breaks in routine — while maintaining safety — can help.";
  } else {
    severity = "mild";
    guidance =
      "Some early signs of diabetes management fatigue have been observed. This is very common. Consider simplifying your routine where safe to do so, and speak with your care team if it persists.";
  }

  return { detected: true, severity, guidance };
}

/**
 * Return educational guidance based on a distress score.
 * Never diagnoses — frames everything as pattern observation.
 */
export function getDistressRecommendation(score: DistressScore): string {
  const lines: string[] = [
    "This is an educational pattern observation, not a clinical assessment or diagnosis.",
    "",
    score.recommendation,
  ];

  if (score.factors.length > 0) {
    lines.push("", "Observed patterns:");
    for (const f of score.factors) {
      lines.push(`  - ${f}`);
    }
  }

  if (score.level === "moderate" || score.level === "high" || score.level === "severe") {
    lines.push(
      "",
      "We recommend speaking with a healthcare professional who can provide personalised support.",
    );
  }

  if (score.seekHelpFlag) {
    lines.push(
      "",
      "If you are in crisis, please contact emergency services or a mental health professional immediately.",
    );
    const resources = getCrisisResources();
    for (const r of resources) {
      lines.push(`  ${r.name}: ${r.contact}`);
    }
  }

  return lines.join("\n");
}

/**
 * Return crisis helplines and resources.
 */
export function getCrisisResources(): CrisisResource[] {
  return [
    {
      name: "Emergency Services",
      contact: "Call 000 (AU) / 911 (US) / 999 (UK) / 112 (EU)",
      description: "For immediate danger or medical emergency.",
    },
    {
      name: "Lifeline (Australia)",
      contact: "13 11 14",
      description: "24/7 crisis support and suicide prevention.",
    },
    {
      name: "988 Suicide & Crisis Lifeline (US)",
      contact: "Call or text 988",
      description: "24/7 free and confidential support.",
    },
    {
      name: "Samaritans (UK & Ireland)",
      contact: "116 123",
      description: "24/7 emotional support for anyone in distress.",
    },
    {
      name: "Crisis Text Line",
      contact: "Text HOME to 741741 (US) / 85258 (UK) / 0477 13 11 14 (AU)",
      description: "Free 24/7 text-based crisis support.",
    },
    {
      name: "Beyond Blue (Australia)",
      contact: "1300 22 4636",
      description: "Mental health support and information.",
    },
    {
      name: "If you are in crisis, please contact emergency services or a mental health professional immediately.",
      contact: "",
      description: "",
    },
  ];
}
