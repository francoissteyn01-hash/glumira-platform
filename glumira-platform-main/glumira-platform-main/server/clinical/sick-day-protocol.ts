/**
 * GluMira™ — Sick Day Protocol Module
 *
 * Provides structured sick-day management guidance for people
 * with diabetes. Covers monitoring frequency, insulin adjustments,
 * hydration, ketone checking, and when to seek emergency care.
 *
 * Clinical relevance:
 * - Illness increases counter-regulatory hormones → hyperglycemia
 * - Vomiting/diarrhea → dehydration → DKA risk
 * - Reduced food intake → hypoglycemia risk
 * - Type 1: NEVER stop basal insulin during illness
 *
 * NOT a medical device. Educational purposes only.
 */

export interface SickDayInput {
  diabetesType: "type1" | "type2" | "gestational";
  currentGlucoseMmol: number;
  ketoneMmol?: number;        // blood ketone level
  temperature?: number;        // °C
  symptoms: SickDaySymptom[];
  canEat: boolean;
  canDrinkFluids: boolean;
  vomitingCount24h: number;
  onInsulinPump: boolean;
  hoursSinceOnset: number;
  currentMedications: string[];
}

export type SickDaySymptom =
  | "fever"
  | "vomiting"
  | "diarrhea"
  | "nausea"
  | "fatigue"
  | "body-aches"
  | "cough"
  | "sore-throat"
  | "headache"
  | "abdominal-pain"
  | "fruity-breath"
  | "rapid-breathing"
  | "confusion";

export type AlertLevel = "green" | "amber" | "red" | "emergency";

export interface SickDayAction {
  priority: number;
  action: string;
  reason: string;
}

export interface SickDayResult {
  alertLevel: AlertLevel;
  alertMessage: string;
  monitoringFrequency: string;
  glucoseActions: SickDayAction[];
  insulinGuidance: SickDayAction[];
  hydrationGuidance: SickDayAction[];
  nutritionGuidance: SickDayAction[];
  ketoneGuidance: SickDayAction[];
  emergencySigns: string[];
  whenToCallDoctor: string[];
  warnings: string[];
  disclaimer: string;
}

/* ── Alert level classification ──────────────────────────────── */

function classifyAlertLevel(input: SickDayInput): AlertLevel {
  // Emergency signs
  if (input.symptoms.includes("confusion")) return "emergency";
  if (input.symptoms.includes("rapid-breathing")) return "emergency";
  if (input.symptoms.includes("fruity-breath") && input.diabetesType === "type1") return "emergency";
  if (input.ketoneMmol !== undefined && input.ketoneMmol >= 3.0) return "emergency";
  if (input.currentGlucoseMmol > 20) return "emergency";
  if (!input.canDrinkFluids && input.vomitingCount24h >= 3) return "emergency";

  // Red
  if (input.ketoneMmol !== undefined && input.ketoneMmol >= 1.5) return "red";
  if (input.currentGlucoseMmol > 15 && input.diabetesType === "type1") return "red";
  if (input.vomitingCount24h >= 3) return "red";
  if (!input.canDrinkFluids) return "red";
  if (input.currentGlucoseMmol < 3.5) return "red";

  // Amber
  if (input.ketoneMmol !== undefined && input.ketoneMmol >= 0.6) return "amber";
  if (input.currentGlucoseMmol > 13) return "amber";
  if (input.currentGlucoseMmol < 4.0) return "amber";
  if (!input.canEat) return "amber";
  if (input.vomitingCount24h >= 1) return "amber";
  if (input.temperature !== undefined && input.temperature >= 38.5) return "amber";

  return "green";
}

function alertMessage(level: AlertLevel): string {
  switch (level) {
    case "emergency":
      return "SEEK EMERGENCY CARE IMMEDIATELY. Do not wait.";
    case "red":
      return "Contact your diabetes team or doctor NOW. Urgent attention needed.";
    case "amber":
      return "Monitor closely. Contact your diabetes team if no improvement in 2-4 hours.";
    case "green":
      return "Continue monitoring. Follow sick-day guidelines below.";
  }
}

/* ── Main protocol ───────────────────────────────────────────── */

export function generateSickDayProtocol(input: SickDayInput): SickDayResult {
  const alertLevel = classifyAlertLevel(input);

  // Monitoring frequency
  let monitoringFrequency = "Every 4 hours";
  if (alertLevel === "emergency" || alertLevel === "red") monitoringFrequency = "Every 1-2 hours";
  else if (alertLevel === "amber") monitoringFrequency = "Every 2-3 hours";

  // Glucose actions
  const glucoseActions: SickDayAction[] = [];

  if (input.currentGlucoseMmol > 15) {
    glucoseActions.push({
      priority: 1,
      action: "Check blood ketones immediately",
      reason: "High glucose during illness increases DKA risk, especially in Type 1.",
    });
  }

  if (input.currentGlucoseMmol < 4.0) {
    glucoseActions.push({
      priority: 1,
      action: "Treat hypoglycemia with 15g fast-acting carbs (glucose tablets, juice)",
      reason: "Low glucose during illness needs immediate treatment.",
    });
  }

  glucoseActions.push({
    priority: 2,
    action: `Monitor glucose ${monitoringFrequency.toLowerCase()}`,
    reason: "Illness causes unpredictable glucose changes. Frequent monitoring is essential.",
  });

  // Insulin guidance
  const insulinGuidance: SickDayAction[] = [];

  if (input.diabetesType === "type1") {
    insulinGuidance.push({
      priority: 1,
      action: "NEVER stop basal insulin, even if not eating",
      reason: "Basal insulin prevents DKA. Stopping it is dangerous during illness.",
    });

    if (input.currentGlucoseMmol > 13) {
      insulinGuidance.push({
        priority: 1,
        action: "Consider correction dose of rapid-acting insulin",
        reason: "Illness hormones raise glucose. Extra correction may be needed.",
      });
    }

    if (input.onInsulinPump) {
      insulinGuidance.push({
        priority: 2,
        action: "Consider temporary basal increase of 20-50%",
        reason: "Illness increases insulin resistance. Pump basal may need temporary increase.",
      });
      insulinGuidance.push({
        priority: 3,
        action: "If glucose stays high, consider switching to injections",
        reason: "Pump site may not be absorbing well during illness. Injections are more reliable.",
      });
    }
  }

  if (input.diabetesType === "type2") {
    insulinGuidance.push({
      priority: 2,
      action: "Continue all diabetes medications unless advised otherwise by your doctor",
      reason: "Most medications should be continued during illness.",
    });

    if (input.currentMedications.some((m) => m.toLowerCase().includes("metformin")) && input.vomitingCount24h >= 2) {
      insulinGuidance.push({
        priority: 1,
        action: "STOP metformin if vomiting or dehydrated",
        reason: "Metformin + dehydration increases lactic acidosis risk.",
      });
    }

    if (input.currentMedications.some((m) =>
      ["empagliflozin", "dapagliflozin", "canagliflozin", "jardiance", "forxiga"].some((s) => m.toLowerCase().includes(s))
    )) {
      insulinGuidance.push({
        priority: 1,
        action: "STOP SGLT2 inhibitor during acute illness",
        reason: "SGLT2 inhibitors increase DKA risk during illness, even with normal glucose.",
      });
    }
  }

  // Hydration guidance
  const hydrationGuidance: SickDayAction[] = [];

  hydrationGuidance.push({
    priority: 1,
    action: "Drink at least 200ml of fluid every hour",
    reason: "Dehydration worsens hyperglycemia and increases DKA risk.",
  });

  if (input.currentGlucoseMmol > 10) {
    hydrationGuidance.push({
      priority: 1,
      action: "Choose sugar-free fluids: water, diet drinks, sugar-free jelly",
      reason: "High glucose — avoid adding more sugar from drinks.",
    });
  } else {
    hydrationGuidance.push({
      priority: 1,
      action: "Alternate sugar-free and sugary fluids to maintain glucose",
      reason: "Normal/low glucose — some sugar from fluids helps prevent hypos.",
    });
  }

  if (input.vomitingCount24h > 0) {
    hydrationGuidance.push({
      priority: 2,
      action: "Take small, frequent sips rather than large amounts",
      reason: "Small sips are better tolerated when nauseous or vomiting.",
    });
  }

  // Nutrition guidance
  const nutritionGuidance: SickDayAction[] = [];

  if (input.canEat) {
    nutritionGuidance.push({
      priority: 2,
      action: "Eat small, regular meals. Choose easy-to-digest carbs (toast, crackers, soup)",
      reason: "Regular carb intake helps prevent hypoglycemia and provides energy for recovery.",
    });
  } else {
    nutritionGuidance.push({
      priority: 1,
      action: "If unable to eat solid food, try liquid carbs: juice, milk, smoothies",
      reason: "Some carb intake is needed to prevent hypoglycemia, especially if on insulin.",
    });
  }

  // Ketone guidance
  const ketoneGuidance: SickDayAction[] = [];

  if (input.diabetesType === "type1" || input.currentGlucoseMmol > 13) {
    ketoneGuidance.push({
      priority: 1,
      action: "Check blood ketones every 2-4 hours during illness",
      reason: "Ketone monitoring is critical to catch DKA early.",
    });
  }

  if (input.ketoneMmol !== undefined) {
    if (input.ketoneMmol < 0.6) {
      ketoneGuidance.push({
        priority: 3,
        action: "Ketones normal — continue monitoring",
        reason: "Below 0.6 mmol/L is normal. Recheck in 2-4 hours.",
      });
    } else if (input.ketoneMmol < 1.5) {
      ketoneGuidance.push({
        priority: 1,
        action: "Moderate ketones — give correction insulin and increase fluids",
        reason: "0.6-1.5 mmol/L needs active management to prevent progression.",
      });
    } else if (input.ketoneMmol < 3.0) {
      ketoneGuidance.push({
        priority: 1,
        action: "High ketones — contact diabetes team immediately",
        reason: "1.5-3.0 mmol/L indicates significant ketosis. Medical guidance needed.",
      });
    } else {
      ketoneGuidance.push({
        priority: 1,
        action: "DANGEROUS ketone level — go to emergency department NOW",
        reason: "Above 3.0 mmol/L is a medical emergency (DKA).",
      });
    }
  }

  // Emergency signs
  const emergencySigns = [
    "Persistent vomiting (unable to keep fluids down for 4+ hours)",
    "Blood ketones above 3.0 mmol/L",
    "Confusion, drowsiness, or difficulty staying awake",
    "Rapid or laboured breathing",
    "Fruity smell on breath",
    "Severe abdominal pain",
    "Blood glucose below 3.0 mmol/L that won't come up",
    "Blood glucose above 20 mmol/L that won't come down",
  ];

  // When to call doctor
  const whenToCallDoctor = [
    "Illness lasting more than 24 hours with no improvement",
    "Unable to eat or drink for more than 6 hours",
    "Blood ketones between 1.5-3.0 mmol/L",
    "Glucose consistently above 15 mmol/L despite correction",
    "Vomiting more than twice in 24 hours",
    "Temperature above 39°C",
    "Unsure about insulin dose adjustments",
  ];

  // Warnings
  const warnings: string[] = [];
  if (alertLevel === "emergency") {
    warnings.push("EMERGENCY: One or more danger signs detected. Seek immediate medical care.");
  }
  if (alertLevel === "red") {
    warnings.push("URGENT: Contact your healthcare team now. Do not wait for improvement.");
  }

  return {
    alertLevel,
    alertMessage: alertMessage(alertLevel),
    monitoringFrequency,
    glucoseActions,
    insulinGuidance,
    hydrationGuidance,
    nutritionGuidance,
    ketoneGuidance,
    emergencySigns,
    whenToCallDoctor,
    warnings,
    disclaimer:
      "GluMira™ is an educational platform. The science of insulin, made visible. " +
      "Always follow your personal sick-day plan from your healthcare team. " +
      "When in doubt, seek medical attention immediately.",
  };
}
