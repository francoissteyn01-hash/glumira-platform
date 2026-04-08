/**
 * GluMira™ V7 — Exercise Impact Analysis Engine
 * Pure TypeScript. Educational insight only — not medical advice.
 * Based on published exercise physiology data for diabetes management.
 */

export type ExerciseType = "aerobic" | "anaerobic" | "mixed" | "hiit" | "resistance" | "yoga" | "swimming" | "walking" | "cycling" | "running" | "team_sport";
export type ExerciseIntensity = "light" | "moderate" | "vigorous" | "extreme";
export type ExercisePhase = "pre" | "during" | "post_immediate" | "post_2h" | "post_6h" | "overnight";

export interface ExerciseEntry {
  id: string;
  type: ExerciseType;
  intensity: ExerciseIntensity;
  durationMinutes: number;
  startTime: string;
  glucoseBefore?: number;
  glucoseAfter?: number;
  insulinAdjustment?: string;
  carbsConsumed?: number;
  notes?: string;
}

export interface ExerciseImpact {
  sensitivityMultiplier: number;
  durationOfEffect: number;
  hypoRiskWindow: { startHours: number; endHours: number };
  basalReduction: string;
  bolusReduction: string;
  carbRecommendation: string;
  overnightRisk: string;
  educationalNote: string;
}

/* ─── Internal lookup tables ─────────────────────────────────────────────── */

const TYPE_SENSITIVITY_BASE: Record<ExerciseType, number> = {
  aerobic: 1.35, anaerobic: 1.10, mixed: 1.25, hiit: 1.30,
  resistance: 1.15, yoga: 1.10, swimming: 1.40, walking: 1.20,
  cycling: 1.35, running: 1.40, team_sport: 1.30,
};

const INTENSITY_FACTOR: Record<ExerciseIntensity, number> = {
  light: 0.7, moderate: 1.0, vigorous: 1.3, extreme: 1.6,
};

const TYPE_EFFECT_HOURS_BASE: Record<ExerciseType, number> = {
  aerobic: 12, anaerobic: 6, mixed: 10, hiit: 14,
  resistance: 8, yoga: 4, swimming: 14, walking: 6,
  cycling: 12, running: 14, team_sport: 12,
};

const MET_VALUES: Record<ExerciseType, Record<ExerciseIntensity, number>> = {
  walking:    { light: 2.5, moderate: 3.5, vigorous: 5.0, extreme: 6.5 },
  running:    { light: 6.0, moderate: 8.0, vigorous: 10.5, extreme: 13.0 },
  cycling:    { light: 4.0, moderate: 6.5, vigorous: 10.0, extreme: 14.0 },
  swimming:   { light: 4.5, moderate: 7.0, vigorous: 10.0, extreme: 12.0 },
  yoga:       { light: 2.0, moderate: 3.0, vigorous: 4.0, extreme: 5.0 },
  resistance: { light: 3.0, moderate: 5.0, vigorous: 6.5, extreme: 8.0 },
  hiit:       { light: 5.0, moderate: 8.0, vigorous: 11.0, extreme: 14.0 },
  aerobic:    { light: 3.5, moderate: 5.5, vigorous: 8.0, extreme: 11.0 },
  anaerobic:  { light: 4.0, moderate: 6.0, vigorous: 8.5, extreme: 11.0 },
  mixed:      { light: 3.5, moderate: 5.5, vigorous: 8.0, extreme: 10.5 },
  team_sport: { light: 4.0, moderate: 6.5, vigorous: 9.0, extreme: 12.0 },
};

/* ─── Main Functions ─────────────────────────────────────────────────────── */

/**
 * Calculate the estimated impact of an exercise session on insulin sensitivity
 * and glucose management. Educational insight only.
 */
export function calculateExerciseImpact(
  type: ExerciseType,
  intensity: ExerciseIntensity,
  durationMinutes: number,
): ExerciseImpact {
  const baseSensitivity = TYPE_SENSITIVITY_BASE[type];
  const intFactor = INTENSITY_FACTOR[intensity];
  const durationFactor = Math.min(durationMinutes / 45, 2.0); // caps at 90 min equivalent

  // Sensitivity multiplier: base adjusted by intensity and duration
  const rawMultiplier = 1 + (baseSensitivity - 1) * intFactor * durationFactor;
  const sensitivityMultiplier = Math.round(rawMultiplier * 100) / 100;

  // Duration of effect in hours
  const baseHours = TYPE_EFFECT_HOURS_BASE[type];
  const durationOfEffect = Math.round(baseHours * intFactor * Math.min(durationFactor, 1.5));

  // Hypo risk window
  const hypoStart = type === "hiit" || type === "anaerobic" ? 1 : 0.5;
  const hypoEnd = Math.min(durationOfEffect, 24);

  // Basal reduction guidance
  const basalPct = sensitivityMultiplier >= 1.4 ? "30–50%" :
                   sensitivityMultiplier >= 1.25 ? "20–30%" :
                   sensitivityMultiplier >= 1.15 ? "10–20%" : "0–10%";

  // Bolus reduction guidance
  const bolusPct = sensitivityMultiplier >= 1.4 ? "40–60%" :
                   sensitivityMultiplier >= 1.25 ? "25–50%" :
                   sensitivityMultiplier >= 1.15 ? "15–25%" : "0–15%";

  // Carb recommendation
  let carbRec: string;
  if (intensity === "extreme" || (intensity === "vigorous" && durationMinutes >= 60)) {
    carbRec = "May suggest 30–60g carbs per hour during exercise, plus 15–30g fast-acting carbs before starting. Discuss with your clinician before changing treatment.";
  } else if (intensity === "vigorous" || (intensity === "moderate" && durationMinutes >= 45)) {
    carbRec = "May suggest 15–30g fast-acting carbs before exercise and 15–30g per hour if exceeding 45 minutes. Discuss with your clinician before changing treatment.";
  } else if (intensity === "moderate") {
    carbRec = "May suggest 15g fast-acting carbs available as a precaution. Discuss with your clinician before changing treatment.";
  } else {
    carbRec = "Additional carbs may not be needed for light activity, but having 15g fast-acting carbs on hand is prudent. Discuss with your clinician before changing treatment.";
  }

  // Overnight risk
  let overnightRisk: string;
  if (durationOfEffect >= 10 || (intensity === "vigorous" && durationMinutes >= 45)) {
    overnightRisk = "Elevated overnight hypo risk may be present. This suggests a pattern where monitoring at 2–3 AM and considering basal reduction could be beneficial. Educational insight only.";
  } else if (durationOfEffect >= 6) {
    overnightRisk = "Moderate delayed hypo risk may indicate a need for an extra glucose check before bed and a bedtime snack. Educational insight only.";
  } else {
    overnightRisk = "Lower overnight risk suggested, though individual responses vary. A bedtime glucose check is still prudent. Educational insight only.";
  }

  // Educational note based on type
  const typeNotes: Record<ExerciseType, string> = {
    aerobic: "Aerobic exercise typically lowers glucose during and after the session. Sustained aerobic activity may increase insulin sensitivity for 12–24 hours.",
    anaerobic: "Anaerobic exercise (e.g. sprints, heavy lifts) may initially raise glucose due to counter-regulatory hormones, before a delayed drop. This suggests a pattern where post-exercise monitoring is particularly important.",
    mixed: "Mixed exercise combines aerobic and anaerobic elements. Glucose response may be less predictable — this suggests a pattern where frequent monitoring helps establish individual trends.",
    hiit: "HIIT may cause an initial glucose rise from adrenaline, followed by prolonged increased sensitivity. This suggests a pattern where the delayed hypoglycaemia risk may extend 12–24 hours post-session.",
    resistance: "Resistance training may initially raise glucose but suggests a pattern of improved insulin sensitivity lasting 6–12 hours. Counter-regulatory hormone release during heavy sets is normal.",
    yoga: "Yoga typically has a mild glucose-lowering effect. Restorative practices may reduce stress hormones, which suggests a pattern of improved overall glucose stability.",
    swimming: "Swimming is a highly aerobic whole-body exercise. Cold water may increase glucose utilisation further. This suggests a pattern where robust hypoglycaemia precautions are important.",
    walking: "Walking is a low-impact way to lower glucose. Even 15–20 minutes post-meal may indicate a meaningful reduction in glucose excursion. A safe starting exercise for most.",
    cycling: "Cycling at moderate-to-vigorous intensity suggests a pattern of significant glucose reduction both during and after. Duration is a key factor in the magnitude of the effect.",
    running: "Running suggests a pattern of potent glucose lowering and prolonged sensitivity increase. Higher intensities may cause a transient glucose rise before a sustained drop.",
    team_sport: "Team sports involve unpredictable bursts of activity. This suggests a pattern where glucose management can be challenging — extra monitoring and carb availability are key.",
  };

  return {
    sensitivityMultiplier,
    durationOfEffect,
    hypoRiskWindow: { startHours: hypoStart, endHours: hypoEnd },
    basalReduction: `Consider ${basalPct} basal reduction for the next ${durationOfEffect} hours. Discuss with your clinician before changing treatment.`,
    bolusReduction: `Consider ${bolusPct} bolus reduction for the next meal post-exercise. Discuss with your clinician before changing treatment.`,
    carbRecommendation: carbRec,
    overnightRisk,
    educationalNote: typeNotes[type],
  };
}

/**
 * Pre-exercise guidance based on current glucose level.
 * units: "mmol" = mmol/L, "mg" = mg/dL
 */
export function getPreExerciseGuidance(
  currentGlucose: number,
  units: "mmol" | "mg",
  type: ExerciseType,
  intensity: ExerciseIntensity,
): string {
  // Normalise to mmol/L
  const mmol = units === "mg" ? currentGlucose / 18.0182 : currentGlucose;

  const lines: string[] = [];

  if (mmol < 4.0) {
    lines.push(
      "⚠️ Glucose appears below 4.0 mmol/L (72 mg/dL). This may indicate that exercise should be delayed until glucose is treated and above 5.0 mmol/L. Educational insight only — discuss with your clinician before changing treatment."
    );
  } else if (mmol < 5.0) {
    lines.push(
      "Glucose appears to be in the 4.0–5.0 mmol/L (72–90 mg/dL) range. This suggests consuming 15–30g of fast-acting carbs before starting exercise. Educational insight only."
    );
  } else if (mmol < 7.0) {
    lines.push(
      "Glucose appears to be in a suitable range for most exercise types. Having fast-acting carbs available is still suggested as a precaution."
    );
  } else if (mmol < 14.0) {
    lines.push(
      "Glucose appears elevated. Moderate aerobic exercise may help lower glucose, but vigorous exercise could raise it further if insulin is insufficient. Educational insight only."
    );
    if (intensity === "vigorous" || intensity === "extreme") {
      lines.push(
        "With glucose above 7 mmol/L and vigorous/extreme intensity planned, this may indicate a need to check for ketones before starting. Discuss with your clinician before changing treatment."
      );
    }
  } else {
    lines.push(
      "⚠️ Glucose appears above 14 mmol/L (250 mg/dL). This may indicate that ketone testing is needed before exercise. If ketones are elevated, exercise should generally be avoided. Discuss with your clinician before changing treatment."
    );
  }

  const impact = calculateExerciseImpact(type, intensity, 30);
  lines.push("");
  lines.push(`For ${type} at ${intensity} intensity, the estimated sensitivity multiplier is ${impact.sensitivityMultiplier}×.`);
  lines.push(impact.carbRecommendation);

  return lines.join("\n");
}

/**
 * Post-exercise guidance comparing before/after glucose.
 */
export function getPostExerciseGuidance(
  glucoseBefore: number,
  glucoseAfter: number,
  units: "mmol" | "mg",
  type: ExerciseType,
  intensity: ExerciseIntensity,
  durationMinutes: number,
): string {
  const factor = units === "mg" ? 18.0182 : 1;
  const beforeMmol = units === "mg" ? glucoseBefore / factor : glucoseBefore;
  const afterMmol = units === "mg" ? glucoseAfter / factor : glucoseAfter;
  const delta = afterMmol - beforeMmol;
  const deltaDisplay = units === "mg"
    ? `${Math.round(glucoseAfter - glucoseBefore)} mg/dL`
    : `${delta.toFixed(1)} mmol/L`;

  const impact = calculateExerciseImpact(type, intensity, durationMinutes);
  const lines: string[] = [];

  if (delta < -3) {
    lines.push(
      `Glucose dropped significantly (${deltaDisplay}). This suggests a pattern of strong glucose response to ${type} exercise. This may indicate a need for additional carbs or reduced insulin for future similar sessions. Discuss with your clinician before changing treatment.`
    );
  } else if (delta < -1) {
    lines.push(
      `Glucose decreased by ${deltaDisplay}. This suggests a moderate and expected response to ${type} at ${intensity} intensity.`
    );
  } else if (delta < 1) {
    lines.push(
      `Glucose remained relatively stable (${deltaDisplay}). This suggests a pattern of good preparation and fuelling for this exercise session.`
    );
  } else if (delta < 3) {
    lines.push(
      `Glucose rose modestly (${deltaDisplay}). This may indicate a counter-regulatory hormone response, common with ${type === "hiit" || type === "anaerobic" || type === "resistance" ? "high-intensity or anaerobic" : "this type of"} exercise. Educational insight only.`
    );
  } else {
    lines.push(
      `Glucose rose significantly (+${deltaDisplay}). This suggests a pattern that may indicate insufficient insulin or strong stress hormone response. Discuss with your clinician before changing treatment.`
    );
  }

  lines.push("");
  lines.push(`Estimated sensitivity increase: ${impact.sensitivityMultiplier}× for approximately ${impact.durationOfEffect} hours.`);
  lines.push(`Hypo risk window: ${impact.hypoRiskWindow.startHours}–${impact.hypoRiskWindow.endHours} hours post-exercise.`);
  lines.push(impact.basalReduction);
  lines.push(impact.bolusReduction);
  lines.push("");
  lines.push(impact.overnightRisk);

  return lines.join("\n");
}

/**
 * Estimate calories burned. Uses MET-based calculation.
 * Default weight 70 kg if not provided.
 */
export function estimateCaloriesBurned(
  type: ExerciseType,
  intensity: ExerciseIntensity,
  durationMinutes: number,
  weightKg: number = 70,
): number {
  const met = MET_VALUES[type][intensity];
  // Calories = MET × weight(kg) × duration(hours)
  const hours = durationMinutes / 60;
  return Math.round(met * weightKg * hours);
}

/**
 * Assess hypo risk level for an exercise session.
 * insulinOnBoard in units (e.g. 3.5 units IOB).
 */
export function getExerciseHypoRiskLevel(
  type: ExerciseType,
  intensity: ExerciseIntensity,
  durationMinutes: number,
  insulinOnBoard: number,
): "low" | "moderate" | "high" | "very_high" {
  const impact = calculateExerciseImpact(type, intensity, durationMinutes);
  const sensitivityScore = impact.sensitivityMultiplier;

  // IOB risk factor: higher IOB = higher risk
  const iobFactor = insulinOnBoard <= 0.5 ? 0
    : insulinOnBoard <= 2 ? 1
    : insulinOnBoard <= 5 ? 2
    : 3;

  // Duration factor
  const durFactor = durationMinutes <= 20 ? 0
    : durationMinutes <= 45 ? 1
    : durationMinutes <= 90 ? 2
    : 3;

  // Intensity factor
  const intFactor = intensity === "light" ? 0
    : intensity === "moderate" ? 1
    : intensity === "vigorous" ? 2
    : 3;

  // Types with highest hypo risk
  const typeRiskBonus = ["swimming", "running", "cycling", "aerobic"].includes(type) ? 1 : 0;

  const totalScore = iobFactor + durFactor + intFactor + typeRiskBonus
    + (sensitivityScore >= 1.4 ? 2 : sensitivityScore >= 1.25 ? 1 : 0);

  if (totalScore <= 2) return "low";
  if (totalScore <= 5) return "moderate";
  if (totalScore <= 8) return "high";
  return "very_high";
}
