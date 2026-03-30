/**
 * GluMira™ V7 — server/analytics/sick-day-rules.ts
 * Sick day management advice stub.
 * GluMira™ is an educational platform, not a medical device.
 */
export interface SickDayInput {
  currentGlucose?: number;
  ketonesPresent?: boolean;
  vomiting?: boolean;
  diagnosisType?: string;
}

export interface SickDayAdvice {
  severity: "mild" | "moderate" | "severe";
  actions: string[];
  monitoringFrequency: string;
  seekEmergencyCare: boolean;
}

export function getSickDayAdvice(input: SickDayInput): SickDayAdvice {
  const glucose = input.currentGlucose ?? 7.0;
  const ketones = input.ketonesPresent ?? false;
  const vomiting = input.vomiting ?? false;

  if (ketones && vomiting) {
    return {
      severity: "severe",
      actions: ["Seek emergency medical care immediately.", "Do not delay."],
      monitoringFrequency: "Continuous until seen by medical team",
      seekEmergencyCare: true,
    };
  }
  if (glucose > 15 || ketones) {
    return {
      severity: "moderate",
      actions: [
        "Check blood glucose every 2 hours.",
        "Check ketones every 4 hours.",
        "Maintain hydration with sugar-free fluids.",
        "Contact your diabetes care team.",
      ],
      monitoringFrequency: "Every 2 hours",
      seekEmergencyCare: false,
    };
  }
  return {
    severity: "mild",
    actions: [
      "Check blood glucose every 4 hours.",
      "Stay hydrated.",
      "Continue insulin as prescribed.",
      "Rest and monitor symptoms.",
    ],
    monitoringFrequency: "Every 4 hours",
    seekEmergencyCare: false,
  };
}
