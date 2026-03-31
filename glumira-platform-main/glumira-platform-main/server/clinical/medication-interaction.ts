/**
 * GluMira™ — Medication Interaction Checker Module
 *
 * Checks for known interactions between diabetes medications and
 * other commonly prescribed drugs that affect glucose levels.
 *
 * Clinical relevance:
 * - Steroids can dramatically raise blood glucose
 * - Beta-blockers can mask hypoglycemia symptoms
 * - Some antibiotics interact with sulfonylureas
 * - ACE inhibitors may improve insulin sensitivity
 *
 * NOT a medical device. Educational purposes only.
 */

export interface Medication {
  name: string;
  category: string;
  dosage?: string;
}

export interface Interaction {
  drug1: string;
  drug2: string;
  severity: "high" | "moderate" | "low" | "info";
  glucoseEffect: "raises" | "lowers" | "masks-hypo" | "variable" | "none";
  description: string;
  recommendation: string;
}

export interface InteractionResult {
  medications: Medication[];
  interactions: Interaction[];
  highSeverityCount: number;
  moderateCount: number;
  glucoseRaisingDrugs: string[];
  glucoseLoweringDrugs: string[];
  hypoMaskingDrugs: string[];
  overallRisk: "high" | "moderate" | "low" | "none";
  warnings: string[];
  recommendations: string[];
}

/* ── Known interaction database ──────────────────────────────── */

interface InteractionRule {
  category1: string;
  category2: string;
  severity: Interaction["severity"];
  glucoseEffect: Interaction["glucoseEffect"];
  description: string;
  recommendation: string;
}

const INTERACTION_RULES: InteractionRule[] = [
  {
    category1: "insulin",
    category2: "corticosteroid",
    severity: "high",
    glucoseEffect: "raises",
    description: "Corticosteroids significantly raise blood glucose by increasing insulin resistance and hepatic glucose output.",
    recommendation: "Insulin doses may need to increase by 20-50% during steroid therapy. Monitor glucose every 2-4 hours.",
  },
  {
    category1: "insulin",
    category2: "beta-blocker",
    severity: "moderate",
    glucoseEffect: "masks-hypo",
    description: "Beta-blockers can mask tachycardia and tremor symptoms of hypoglycemia, making lows harder to detect.",
    recommendation: "Rely on CGM alerts rather than symptoms. Educate patient on non-adrenergic hypo signs (confusion, hunger).",
  },
  {
    category1: "sulfonylurea",
    category2: "fluoroquinolone",
    severity: "high",
    glucoseEffect: "lowers",
    description: "Fluoroquinolone antibiotics can enhance the hypoglycemic effect of sulfonylureas.",
    recommendation: "Monitor glucose closely during antibiotic course. Consider temporary dose reduction of sulfonylurea.",
  },
  {
    category1: "insulin",
    category2: "ace-inhibitor",
    severity: "low",
    glucoseEffect: "lowers",
    description: "ACE inhibitors may improve insulin sensitivity and slightly lower glucose levels.",
    recommendation: "Generally beneficial. Monitor for increased hypo frequency when starting ACE inhibitor.",
  },
  {
    category1: "metformin",
    category2: "alcohol",
    severity: "high",
    glucoseEffect: "lowers",
    description: "Alcohol combined with metformin increases risk of lactic acidosis and hypoglycemia.",
    recommendation: "Limit alcohol intake. Never drink on an empty stomach. Monitor glucose for 12-24 hours after drinking.",
  },
  {
    category1: "insulin",
    category2: "thiazide-diuretic",
    severity: "moderate",
    glucoseEffect: "raises",
    description: "Thiazide diuretics can raise blood glucose by reducing insulin secretion and increasing insulin resistance.",
    recommendation: "Monitor glucose when starting thiazide. May need insulin dose adjustment.",
  },
  {
    category1: "sulfonylurea",
    category2: "nsaid",
    severity: "moderate",
    glucoseEffect: "lowers",
    description: "NSAIDs can displace sulfonylureas from protein binding, increasing their hypoglycemic effect.",
    recommendation: "Monitor glucose when starting or stopping NSAIDs. Use paracetamol as alternative when possible.",
  },
  {
    category1: "insulin",
    category2: "ssri",
    severity: "low",
    glucoseEffect: "variable",
    description: "SSRIs can affect appetite and glucose metabolism. Some patients experience improved insulin sensitivity.",
    recommendation: "Monitor glucose patterns when starting SSRI. Adjust insulin if consistent changes observed.",
  },
  {
    category1: "metformin",
    category2: "corticosteroid",
    severity: "high",
    glucoseEffect: "raises",
    description: "Corticosteroids may overwhelm metformin's glucose-lowering effect, causing significant hyperglycemia.",
    recommendation: "May need temporary addition of insulin during steroid course. Monitor glucose 4 times daily.",
  },
  {
    category1: "sglt2-inhibitor",
    category2: "diuretic",
    severity: "moderate",
    glucoseEffect: "none",
    description: "Both SGLT2 inhibitors and diuretics cause fluid loss, increasing dehydration and DKA risk.",
    recommendation: "Ensure adequate hydration. Monitor for signs of dehydration and ketones.",
  },
  {
    category1: "insulin",
    category2: "statin",
    severity: "low",
    glucoseEffect: "raises",
    description: "Statins may slightly increase blood glucose and A1c in some patients.",
    recommendation: "Cardiovascular benefit outweighs small glucose effect. Monitor A1c trends.",
  },
  {
    category1: "insulin",
    category2: "antipsychotic",
    severity: "moderate",
    glucoseEffect: "raises",
    description: "Atypical antipsychotics (especially olanzapine, clozapine) can cause significant weight gain and insulin resistance.",
    recommendation: "Monitor glucose closely when starting antipsychotic. Insulin doses may need significant increase.",
  },
];

/* ── Drug category classifier ────────────────────────────────── */

const DRUG_CATEGORIES: Record<string, string[]> = {
  insulin: ["insulin", "lantus", "levemir", "tresiba", "novorapid", "humalog", "fiasp", "apidra", "novolog", "humulin", "actrapid"],
  metformin: ["metformin", "glucophage"],
  sulfonylurea: ["glipizide", "glyburide", "glimepiride", "gliclazide", "glibenclamide"],
  "sglt2-inhibitor": ["empagliflozin", "dapagliflozin", "canagliflozin", "jardiance", "forxiga", "invokana"],
  corticosteroid: ["prednisone", "prednisolone", "dexamethasone", "hydrocortisone", "methylprednisolone", "cortisone"],
  "beta-blocker": ["atenolol", "metoprolol", "propranolol", "bisoprolol", "carvedilol", "nadolol"],
  "ace-inhibitor": ["enalapril", "lisinopril", "ramipril", "perindopril", "captopril"],
  "thiazide-diuretic": ["hydrochlorothiazide", "chlorthalidone", "indapamide"],
  diuretic: ["furosemide", "bumetanide", "hydrochlorothiazide", "chlorthalidone", "indapamide", "spironolactone"],
  fluoroquinolone: ["ciprofloxacin", "levofloxacin", "moxifloxacin", "ofloxacin"],
  nsaid: ["ibuprofen", "naproxen", "diclofenac", "celecoxib", "aspirin"],
  ssri: ["fluoxetine", "sertraline", "paroxetine", "citalopram", "escitalopram"],
  statin: ["atorvastatin", "rosuvastatin", "simvastatin", "pravastatin", "lovastatin"],
  antipsychotic: ["olanzapine", "clozapine", "quetiapine", "risperidone", "aripiprazole"],
  alcohol: ["alcohol", "ethanol"],
};

function classifyDrug(name: string): string {
  const lower = name.toLowerCase().trim();
  for (const [category, drugs] of Object.entries(DRUG_CATEGORIES)) {
    if (drugs.some((d) => lower.includes(d))) return category;
  }
  return "unknown";
}

/* ── Main checker ────────────────────────────────────────────── */

export function checkMedicationInteractions(medications: Medication[]): InteractionResult {
  if (medications.length === 0) {
    return {
      medications: [],
      interactions: [],
      highSeverityCount: 0,
      moderateCount: 0,
      glucoseRaisingDrugs: [],
      glucoseLoweringDrugs: [],
      hypoMaskingDrugs: [],
      overallRisk: "none",
      warnings: [],
      recommendations: ["No medications provided for interaction checking."],
    };
  }

  // Classify all medications
  const classified = medications.map((m) => ({
    ...m,
    category: m.category || classifyDrug(m.name),
  }));

  // Find interactions
  const interactions: Interaction[] = [];

  for (let i = 0; i < classified.length; i++) {
    for (let j = i + 1; j < classified.length; j++) {
      const cat1 = classified[i].category;
      const cat2 = classified[j].category;

      for (const rule of INTERACTION_RULES) {
        if (
          (cat1 === rule.category1 && cat2 === rule.category2) ||
          (cat1 === rule.category2 && cat2 === rule.category1)
        ) {
          interactions.push({
            drug1: classified[i].name,
            drug2: classified[j].name,
            severity: rule.severity,
            glucoseEffect: rule.glucoseEffect,
            description: rule.description,
            recommendation: rule.recommendation,
          });
        }
      }
    }
  }

  const highSeverityCount = interactions.filter((i) => i.severity === "high").length;
  const moderateCount = interactions.filter((i) => i.severity === "moderate").length;

  const glucoseRaisingDrugs = [
    ...new Set(
      interactions
        .filter((i) => i.glucoseEffect === "raises")
        .flatMap((i) => [i.drug1, i.drug2])
    ),
  ];

  const glucoseLoweringDrugs = [
    ...new Set(
      interactions
        .filter((i) => i.glucoseEffect === "lowers")
        .flatMap((i) => [i.drug1, i.drug2])
    ),
  ];

  const hypoMaskingDrugs = [
    ...new Set(
      interactions
        .filter((i) => i.glucoseEffect === "masks-hypo")
        .flatMap((i) => [i.drug1, i.drug2])
    ),
  ];

  // Overall risk
  let overallRisk: InteractionResult["overallRisk"] = "none";
  if (highSeverityCount > 0) overallRisk = "high";
  else if (moderateCount > 0) overallRisk = "moderate";
  else if (interactions.length > 0) overallRisk = "low";

  // Warnings
  const warnings: string[] = [];
  if (highSeverityCount > 0) {
    warnings.push(`${highSeverityCount} high-severity interaction(s) detected — discuss with your healthcare team.`);
  }
  if (glucoseRaisingDrugs.length > 0) {
    warnings.push(`Medications that may raise glucose: ${glucoseRaisingDrugs.join(", ")}.`);
  }
  if (hypoMaskingDrugs.length > 0) {
    warnings.push("Some medications may mask hypoglycemia symptoms — rely on CGM alerts.");
  }

  // Recommendations
  const recommendations: string[] = [];
  interactions.forEach((i) => {
    if (i.severity === "high" || i.severity === "moderate") {
      recommendations.push(i.recommendation);
    }
  });
  if (recommendations.length === 0 && interactions.length > 0) {
    recommendations.push("Low-risk interactions detected. Continue monitoring as usual.");
  }

  return {
    medications: classified,
    interactions,
    highSeverityCount,
    moderateCount,
    glucoseRaisingDrugs,
    glucoseLoweringDrugs,
    hypoMaskingDrugs,
    overallRisk,
    warnings,
    recommendations,
  };
}
