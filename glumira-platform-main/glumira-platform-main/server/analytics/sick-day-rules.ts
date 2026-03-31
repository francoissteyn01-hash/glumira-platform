/**
 * GluMira™ — Sick Day Rules Module
 *
 * Provides evidence-based sick day management guidance for
 * insulin-dependent diabetes. Covers glucose monitoring frequency,
 * ketone checking, fluid intake, and insulin adjustment rules.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type SickDaySeverity = "mild" | "moderate" | "severe" | "emergency";
export type KetoneLevelCategory = "negative" | "trace" | "small" | "moderate" | "large";

export interface SickDayInput {
  currentGlucoseMmol: number;
  ketonesMmol: number | null;
  temperature: number | null;     // °C
  vomiting: boolean;
  diarrhoea: boolean;
  ableToEat: boolean;
  hoursIll: number;
}

export interface SickDayAdvice {
  severity: SickDaySeverity;
  glucoseCheckFrequencyHours: number;
  ketoneCheckFrequencyHours: number;
  fluidTargetMlPerHour: number;
  insulinAdvice: string;
  warnings: string[];
  seekMedicalAttention: boolean;
  recommendations: string[];
}

// ─── Ketone classification ───────────────────────────────────────────────────

export function classifyKetones(mmol: number): KetoneLevelCategory {
  if (mmol < 0.6) return "negative";
  if (mmol < 1.0) return "trace";
  if (mmol < 1.5) return "small";
  if (mmol < 3.0) return "moderate";
  return "large";
}

// ─── Ketone colour ───────────────────────────────────────────────────────────

export function ketoneColour(category: KetoneLevelCategory): string {
  switch (category) {
    case "negative": return "#22c55e";
    case "trace": return "#84cc16";
    case "small": return "#f59e0b";
    case "moderate": return "#f97316";
    case "large": return "#ef4444";
  }
}

// ─── Severity classification ─────────────────────────────────────────────────

export function classifySickDaySeverity(input: SickDayInput): SickDaySeverity {
  const ketoneCategory = input.ketonesMmol !== null
    ? classifyKetones(input.ketonesMmol)
    : "negative";

  // Emergency conditions
  if (ketoneCategory === "large") return "emergency";
  if (input.currentGlucoseMmol > 20) return "emergency";
  if (input.vomiting && !input.ableToEat && input.hoursIll > 6) return "emergency";

  // Severe
  if (ketoneCategory === "moderate") return "severe";
  if (input.currentGlucoseMmol > 15 && input.vomiting) return "severe";
  if (input.hoursIll > 24 && !input.ableToEat) return "severe";

  // Moderate
  if (input.currentGlucoseMmol > 13) return "moderate";
  if (input.vomiting || input.diarrhoea) return "moderate";
  if (ketoneCategory === "small") return "moderate";

  return "mild";
}

// ─── Severity colour ─────────────────────────────────────────────────────────

export function sickDaySeverityColour(severity: SickDaySeverity): string {
  switch (severity) {
    case "mild": return "#22c55e";
    case "moderate": return "#f59e0b";
    case "severe": return "#f97316";
    case "emergency": return "#ef4444";
  }
}

// ─── Generate advice ─────────────────────────────────────────────────────────

export function generateSickDayAdvice(input: SickDayInput): SickDayAdvice {
  const severity = classifySickDaySeverity(input);
  const warnings: string[] = [];
  const recommendations: string[] = [];

  let glucoseCheckFrequencyHours: number;
  let ketoneCheckFrequencyHours: number;
  let fluidTargetMlPerHour: number;
  let insulinAdvice: string;
  let seekMedicalAttention = false;

  switch (severity) {
    case "emergency":
      glucoseCheckFrequencyHours = 1;
      ketoneCheckFrequencyHours = 1;
      fluidTargetMlPerHour = 250;
      insulinAdvice = "DO NOT stop insulin. Give correction dose as per your sick day plan. Seek emergency care immediately.";
      seekMedicalAttention = true;
      warnings.push("EMERGENCY: Seek immediate medical attention.");
      if (input.ketonesMmol !== null && input.ketonesMmol >= 3.0) {
        warnings.push("Large ketones detected — risk of diabetic ketoacidosis (DKA).");
      }
      break;

    case "severe":
      glucoseCheckFrequencyHours = 1;
      ketoneCheckFrequencyHours = 2;
      fluidTargetMlPerHour = 200;
      insulinAdvice = "Never omit basal insulin. Consider 10-20% correction dose increase. Contact your diabetes team.";
      seekMedicalAttention = true;
      warnings.push("Contact your diabetes team or GP urgently.");
      break;

    case "moderate":
      glucoseCheckFrequencyHours = 2;
      ketoneCheckFrequencyHours = 4;
      fluidTargetMlPerHour = 150;
      insulinAdvice = "Continue all insulin. Give correction doses for high readings. If unable to eat, reduce meal-time bolus but keep basal.";
      break;

    default: // mild
      glucoseCheckFrequencyHours = 4;
      ketoneCheckFrequencyHours = 6;
      fluidTargetMlPerHour = 100;
      insulinAdvice = "Continue all insulin as normal. Monitor glucose more frequently.";
  }

  // Fluid recommendations
  if (input.vomiting) {
    recommendations.push("Take small sips of fluid frequently (every 15 minutes) rather than large amounts.");
    recommendations.push("If unable to keep fluids down for more than 2 hours, seek medical attention.");
  } else {
    recommendations.push(`Aim for at least ${fluidTargetMlPerHour}ml of sugar-free fluids per hour.`);
  }

  // Eating recommendations
  if (!input.ableToEat) {
    recommendations.push("Replace meals with sugary fluids (e.g., flat lemonade, juice) to prevent hypoglycaemia.");
    recommendations.push("Keep basal insulin but reduce or omit meal-time bolus.");
  }

  // Temperature
  if (input.temperature !== null && input.temperature >= 38.5) {
    recommendations.push("Fever detected — illness may increase insulin requirements by 20-50%.");
  }

  // General
  recommendations.push("Never stop taking insulin, even if you cannot eat.");
  recommendations.push("Rest and avoid strenuous activity.");

  return {
    severity,
    glucoseCheckFrequencyHours,
    ketoneCheckFrequencyHours,
    fluidTargetMlPerHour,
    insulinAdvice,
    warnings,
    seekMedicalAttention,
    recommendations,
  };
}
