/**
 * GluMira™ — Medication Interaction Checker Module
 *
 * Checks common medications that affect blood glucose levels.
 * Flags potential interactions and provides educational information.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type GlucoseEffect = "raises" | "lowers" | "variable" | "none";
export type InteractionSeverity = "high" | "moderate" | "low" | "info";

export interface MedicationEntry {
  name: string;
  category: string;
  glucoseEffect: GlucoseEffect;
  severity: InteractionSeverity;
  mechanism: string;
  notes: string;
}

export interface InteractionResult {
  medication: string;
  matched: boolean;
  entry: MedicationEntry | null;
  warning: string | null;
}

export interface InteractionReport {
  medications: string[];
  results: InteractionResult[];
  highSeverityCount: number;
  moderateCount: number;
  recommendations: string[];
}

// ─── Medication Database ─────────────────────────────────────────────────────

export const MEDICATION_DB: MedicationEntry[] = [
  {
    name: "prednisone",
    category: "corticosteroid",
    glucoseEffect: "raises",
    severity: "high",
    mechanism: "Increases hepatic glucose production and insulin resistance",
    notes: "May require significant insulin dose increases during treatment",
  },
  {
    name: "dexamethasone",
    category: "corticosteroid",
    glucoseEffect: "raises",
    severity: "high",
    mechanism: "Potent glucocorticoid that significantly raises blood glucose",
    notes: "Effect can persist for 24-36 hours after dose",
  },
  {
    name: "metformin",
    category: "biguanide",
    glucoseEffect: "lowers",
    severity: "moderate",
    mechanism: "Reduces hepatic glucose output and improves insulin sensitivity",
    notes: "First-line oral therapy for Type 2 diabetes",
  },
  {
    name: "atenolol",
    category: "beta-blocker",
    glucoseEffect: "variable",
    severity: "moderate",
    mechanism: "May mask hypoglycaemia symptoms and impair glucose recovery",
    notes: "Monitor for hidden hypos — tremor and tachycardia may be blunted",
  },
  {
    name: "propranolol",
    category: "beta-blocker",
    glucoseEffect: "variable",
    severity: "moderate",
    mechanism: "Non-selective beta-blocker — masks hypo symptoms more than selective agents",
    notes: "Can prolong hypoglycaemia by blocking glycogenolysis",
  },
  {
    name: "hydrochlorothiazide",
    category: "thiazide-diuretic",
    glucoseEffect: "raises",
    severity: "moderate",
    mechanism: "Impairs insulin secretion and increases insulin resistance",
    notes: "Effect is dose-dependent — lower doses have less impact",
  },
  {
    name: "niacin",
    category: "vitamin",
    glucoseEffect: "raises",
    severity: "low",
    mechanism: "High-dose niacin can increase insulin resistance",
    notes: "Low-dose supplementation is generally safe",
  },
  {
    name: "salbutamol",
    category: "beta2-agonist",
    glucoseEffect: "raises",
    severity: "low",
    mechanism: "Stimulates glycogenolysis and gluconeogenesis",
    notes: "Inhaled doses have minimal systemic effect",
  },
  {
    name: "aspirin",
    category: "NSAID",
    glucoseEffect: "lowers",
    severity: "low",
    mechanism: "High doses may enhance insulin sensitivity",
    notes: "Standard cardioprotective doses have negligible glucose effect",
  },
  {
    name: "paracetamol",
    category: "analgesic",
    glucoseEffect: "none",
    severity: "info",
    mechanism: "Can interfere with some CGM sensor readings",
    notes: "May cause falsely elevated CGM readings for up to 8 hours",
  },
];

// ─── Lookup ──────────────────────────────────────────────────────────────────

export function lookupMedication(name: string): MedicationEntry | null {
  const normalised = name.toLowerCase().trim();
  return MEDICATION_DB.find((m) => m.name === normalised) ?? null;
}

// ─── Check single medication ─────────────────────────────────────────────────

export function checkInteraction(medicationName: string): InteractionResult {
  const entry = lookupMedication(medicationName);
  if (!entry) {
    return {
      medication: medicationName,
      matched: false,
      entry: null,
      warning: null,
    };
  }

  let warning: string;
  switch (entry.severity) {
    case "high":
      warning = `HIGH: ${entry.name} (${entry.category}) — ${entry.mechanism}. ${entry.notes}`;
      break;
    case "moderate":
      warning = `MODERATE: ${entry.name} (${entry.category}) — ${entry.mechanism}. ${entry.notes}`;
      break;
    case "low":
      warning = `LOW: ${entry.name} — ${entry.notes}`;
      break;
    default:
      warning = `INFO: ${entry.name} — ${entry.notes}`;
  }

  return { medication: medicationName, matched: true, entry, warning };
}

// ─── Severity colour ─────────────────────────────────────────────────────────

export function severityColour(severity: InteractionSeverity): string {
  switch (severity) {
    case "high": return "#ef4444";
    case "moderate": return "#f59e0b";
    case "low": return "#3b82f6";
    case "info": return "#6b7280";
  }
}

// ─── Effect label ────────────────────────────────────────────────────────────

export function effectLabel(effect: GlucoseEffect): string {
  switch (effect) {
    case "raises": return "↑ Raises glucose";
    case "lowers": return "↓ Lowers glucose";
    case "variable": return "↕ Variable effect";
    case "none": return "— No direct effect";
  }
}

// ─── Full report ─────────────────────────────────────────────────────────────

export function generateInteractionReport(
  medications: string[]
): InteractionReport {
  const results = medications.map(checkInteraction);
  const highSeverityCount = results.filter(
    (r) => r.entry?.severity === "high"
  ).length;
  const moderateCount = results.filter(
    (r) => r.entry?.severity === "moderate"
  ).length;

  const recommendations: string[] = [];

  if (highSeverityCount > 0) {
    recommendations.push(
      "One or more medications have a HIGH impact on blood glucose. Discuss insulin dose adjustments with your healthcare team."
    );
  }

  if (moderateCount > 0) {
    recommendations.push(
      "Some medications may moderately affect glucose levels. Monitor readings more frequently."
    );
  }

  const unmatched = results.filter((r) => !r.matched);
  if (unmatched.length > 0) {
    recommendations.push(
      `${unmatched.length} medication(s) not found in the database. Consult your pharmacist for glucose interaction information.`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("No significant glucose interactions detected with your current medications.");
  }

  return {
    medications,
    results,
    highSeverityCount,
    moderateCount,
    recommendations,
  };
}
