/**
 * GluMira™ V7 — Pattern Language
 * Maps pattern types to plain-language observations and suggestions.
 * Uses approved wording. NEVER suggests dose volume changes.
 */

import type { DetectedPattern } from "./pattern-engine";

interface LanguageEntry {
  observation: string;
  suggestion: string;
}

const LANGUAGE_MAP: Record<string, LanguageEntry> = {
  // Insulin timing
  dose_compression: {
    observation: "Multiple rapid-acting doses given in a compressed window suggests a pattern of dose stacking.",
    suggestion: "Consider reviewing the timing gap between rapid doses to allow each to reach peak activity before the next.",
  },
  late_corrections: {
    observation: "Correction doses given late at night suggests a pattern of delayed adjustments.",
    suggestion: "Earlier identification of high readings may reduce the need for late-night corrections.",
  },
  overlapping_corrections: {
    observation: "Multiple correction doses given before the previous correction has peaked may indicate overlapping insulin activity.",
    suggestion: "Waiting for the full action window of each correction (typically 3\u20134h) before re-correcting may reduce stacking risk.",
  },
  stacked_rapid: {
    observation: "Rapid-acting doses administered within 2 hours of each other suggests insulin stacking.",
    suggestion: "A pharmacology-based timing observation: consider allowing more time between rapid doses for the first dose to peak.",
  },
  basal_overlap: {
    observation: "Basal doses closer than 8 hours apart suggests overlap in background insulin coverage.",
    suggestion: "Review the spacing of basal doses to ensure even 24-hour coverage with minimal overlap windows.",
  },

  // Glucose behaviour
  overnight_drift: {
    observation: "Glucose values drifting significantly overnight suggests a pattern of unstable basal coverage during sleep.",
    suggestion: "Discuss overnight basal timing with your healthcare team.",
  },
  dawn_rise: {
    observation: "Morning glucose consistently higher than overnight levels may indicate dawn phenomenon.",
    suggestion: "A pharmacology-based timing observation: basal insulin timing or type may influence early-morning coverage.",
  },
  post_meal_spike: {
    observation: "Glucose rising more than 4 mmol/L after meals suggests a pattern of significant post-meal spikes.",
    suggestion: "Review pre-bolus timing \u2014 giving rapid insulin 10\u201320 minutes before eating may reduce spike magnitude.",
  },
  delayed_drop: {
    observation: "Glucose remaining elevated for extended periods before dropping sharply suggests delayed insulin action.",
    suggestion: "This pattern may indicate a timing mismatch between carbohydrate absorption and insulin peak.",
  },
  rebound: {
    observation: "Low glucose followed by a significant rebound high suggests over-treatment of lows or hepatic glucose release.",
    suggestion: "Using measured glucose treatment (e.g. 15g rule) may reduce the magnitude of rebound highs.",
  },
  rollercoaster: {
    observation: "Large glucose swings throughout the day suggests a rollercoaster pattern of highs and lows.",
    suggestion: "Reducing variability often starts with consistent timing of meals and insulin doses.",
  },

  // Safety
  repeated_lows: {
    observation: "Multiple low glucose readings detected \u2014 this is a safety-relevant pattern.",
    suggestion: "Discuss the frequency of lows with your healthcare team at your next appointment.",
  },
  rescue_clusters: {
    observation: "Clusters of low intervention treatments suggests recurring hypoglycaemia episodes.",
    suggestion: "Review the timing of meals and insulin relative to activity and sleep.",
  },
  multi_low_band: {
    observation: "Low glucose readings concentrated in a specific time band suggests a predictable risk window.",
    suggestion: "Identifying the consistent time band may help your healthcare team adjust timing.",
  },
  overnight_risk: {
    observation: "Low glucose events during overnight hours represent a higher-risk pattern.",
    suggestion: "Discuss nocturnal hypoglycaemia risk with your healthcare team \u2014 basal timing and bedtime snacks may be relevant.",
  },
  same_time_instability: {
    observation: "High glucose variability at the same time each day suggests an unstable pattern in that window.",
    suggestion: "Tracking what varies (meals, activity, stress) at that time may reveal contributing factors.",
  },

  // Contextual
  illness_resistance: {
    observation: "Illness events correlate with higher glucose readings, suggesting insulin resistance during illness.",
    suggestion: "Sick-day rules typically involve more frequent monitoring \u2014 discuss a plan with your healthcare team.",
  },
  heat_sensitivity: {
    observation: "Weather/heat events correlate with glucose variability, suggesting heat sensitivity.",
    suggestion: "Heat can accelerate insulin absorption \u2014 consider monitoring more frequently in hot conditions.",
  },
  stress_variability: {
    observation: "Stress events correlate with glucose variability, suggesting a stress-glucose connection.",
    suggestion: "Stress hormones can raise glucose \u2014 awareness of this pattern may inform timing decisions.",
  },
  travel_disruption: {
    observation: "Travel events correlate with disrupted glucose patterns, suggesting timezone or routine disruption.",
    suggestion: "Maintaining consistent basal timing during travel may reduce pattern disruption.",
  },
  menstrual_resistance: {
    observation: "Menstrual cycle events correlate with increased glucose levels, suggesting hormonal insulin resistance.",
    suggestion: "Many patients notice a pattern of resistance in the luteal phase \u2014 track this for your healthcare team.",
  },
  alarm_fatigue_deterioration: {
    observation: "Repeated severe sleep disruption events suggest possible alarm fatigue deterioration.",
    suggestion: "Discuss alert thresholds and sleep quality with your healthcare team.",
  },
};

/**
 * Enrich detected patterns with plain-language text.
 * Injects context modifiers into observations.
 */
export function enrichPatterns(patterns: DetectedPattern[]): DetectedPattern[] {
  return patterns.map((p) => {
    const lang = LANGUAGE_MAP[p.type];
    if (!lang) return p;

    let observation = lang.observation;
    // Inject context modifiers
    if (p.context_modifiers.length > 0) {
      observation += " Note: " + p.context_modifiers[0];
    }

    return { ...p, observation, suggestion: lang.suggestion };
  });
}
