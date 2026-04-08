/**
 * GluMira™ V7 — Comorbidity Flag Engine (Block 35)
 * Unified comorbidity risk/flag system combining signals from existing
 * modules (ADHD, Thyroid, Autism, Menstrual, Pregnancy) with additional
 * comorbidity types into a single actionable profile.
 */

/* ─── Types ─────────────────────────────────────────────────────────────── */

export type ComorbidityType =
  | "thyroid"
  | "adhd"
  | "autism"
  | "celiac"
  | "gastroparesis"
  | "pcos"
  | "eating_disorder"
  | "depression"
  | "anxiety"
  | "steroid_use"
  | "puberty"
  | "pregnancy"
  | "menstrual";

export interface ComorbidityFlag {
  type: ComorbidityType;
  active: boolean;
  severity: "mild" | "moderate" | "severe";
  insulinImpact: string;
  glucoseImpact: string;
  recommendation: string;
}

export interface ComorbidityProfile {
  activeFlags: ComorbidityFlag[];
  overallRiskLevel: "low" | "moderate" | "high" | "complex";
  combinedInsulinAdjustment: string;
  priorityAlerts: string[];
  educationalNote: string;
}

export interface InteractionWarning {
  flagA: ComorbidityType;
  flagB: ComorbidityType;
  warning: string;
  severity: "informational" | "important" | "critical";
}

/* ─── Impact database ───────────────────────────────────────────────────── */

interface ImpactEntry {
  insulinImpact: string;
  glucoseImpact: string;
  recommendations: Record<"mild" | "moderate" | "severe", string>;
}

const IMPACT_DB: Record<ComorbidityType, ImpactEntry> = {
  thyroid: {
    insulinImpact:
      "Hypothyroidism increases insulin resistance; hyperthyroidism increases insulin sensitivity. Both shift insulin requirements.",
    glucoseImpact:
      "Glucose variability increases during thyroid instability. Delayed gastric emptying may occur with hypothyroidism.",
    recommendations: {
      mild: "Monitor TSH every 6 months. Note any unexplained glucose pattern shifts and discuss with your endocrinologist.",
      moderate:
        "TSH is outside the optimal range. Expect 10–20% change in total daily insulin. Recheck in 6–8 weeks after medication adjustment.",
      severe:
        "Significant thyroid dysfunction detected. Insulin requirements may shift by up to 30%. Urgent endocrinology review recommended.",
    },
  },
  adhd: {
    insulinImpact:
      "Stimulant medications can suppress appetite, leading to missed meals and subsequent insulin stacking or hypoglycaemia.",
    glucoseImpact:
      "Impulsive eating during medication gaps may cause glucose spikes. Executive-function challenges affect consistent dosing.",
    recommendations: {
      mild: "Use structured reminders for glucose checks and meal timing, especially during stimulant peak hours.",
      moderate:
        "Consider aligning bolus timing with stimulant onset and offset. Work with your care team on a meal schedule that matches medication windows.",
      severe:
        "Multiple missed doses or severe glucose variability linked to ADHD management. A coordinated plan between psychiatry and endocrinology is strongly recommended.",
    },
  },
  autism: {
    insulinImpact:
      "Sensory preferences and food rigidity may limit carbohydrate variety, affecting insulin-to-carb ratio predictability.",
    glucoseImpact:
      "Restricted diets can lead to very consistent or very inconsistent glucose patterns, depending on food acceptance.",
    recommendations: {
      mild: "Document preferred foods and pre-calculate carb counts to reduce daily cognitive load.",
      moderate:
        "Work with a dietitian familiar with both T1D and autism to build a meal plan around accepted foods while maintaining nutritional balance.",
      severe:
        "Significant dietary restriction is affecting glucose management. Occupational therapy and dietitian co-management recommended.",
    },
  },
  celiac: {
    insulinImpact:
      "Untreated celiac disease impairs nutrient absorption, causing unpredictable insulin action. A strict gluten-free diet restores predictability.",
    glucoseImpact:
      "Malabsorption leads to erratic post-meal glucose readings. Gluten-free substitutes often have different glycaemic indexes.",
    recommendations: {
      mild: "Maintain strict gluten-free diet. Re-learn carb counts for gluten-free alternatives, as they often differ from gluten-containing equivalents.",
      moderate:
        "Ongoing symptoms suggest possible cross-contamination or incomplete adherence. Review dietary practices and re-test tTG-IgA.",
      severe:
        "Active celiac disease is significantly disrupting glucose control. Gastroenterology referral recommended alongside tighter dietary review.",
    },
  },
  gastroparesis: {
    insulinImpact:
      "Delayed gastric emptying causes a mismatch between insulin action and glucose absorption, increasing hypo and hyper risk.",
    glucoseImpact:
      "Post-meal glucose rise is delayed and unpredictable. Late glucose spikes 3–5 hours post-meal are common.",
    recommendations: {
      mild: "Consider splitting bolus doses (e.g. 60/40 over 2 hours) for meals. Smaller, more frequent meals may help.",
      moderate:
        "Extended or dual-wave bolus strategies are likely needed. Work with your care team to adjust pre-bolus timing on a per-meal basis.",
      severe:
        "Severe gastroparesis requires significant insulin timing adjustments. Prokinetic medication review and specialised dietitian input are recommended.",
    },
  },
  pcos: {
    insulinImpact:
      "Insulin resistance is a hallmark of PCOS and compounds T1D insulin requirements, particularly in the luteal phase.",
    glucoseImpact:
      "Higher baseline glucose and increased variability, especially around menstruation. Hormonal fluctuations add an additional layer of unpredictability.",
    recommendations: {
      mild: "Track cycle phases alongside glucose trends to identify patterns. A modest basal increase during the luteal phase may be needed.",
      moderate:
        "Insulin resistance may require 15–25% more insulin during the luteal phase. Coordinate with gynaecology and endocrinology.",
      severe:
        "Significant hormonal disruption is compounding glucose management. Comprehensive endocrine review recommended.",
    },
  },
  eating_disorder: {
    insulinImpact:
      "Insulin restriction (diabulimia) is a serious risk. Irregular eating patterns make dose timing unreliable.",
    glucoseImpact:
      "Persistent hyperglycaemia from insulin omission or chaotic glucose patterns from binge-purge cycles. High DKA risk.",
    recommendations: {
      mild: "Open, non-judgemental conversation about the relationship between insulin, food, and body image is encouraged. Screen regularly.",
      moderate:
        "Specialist eating-disorder support familiar with T1D is recommended. Ensure the care team is aware and coordinating.",
      severe:
        "Immediate specialist referral. Insulin omission and disordered eating in T1D carry life-threatening DKA risk. Multidisciplinary care is essential.",
    },
  },
  depression: {
    insulinImpact:
      "Reduced motivation can lead to missed insulin doses, skipped glucose checks, and poor self-management consistency.",
    glucoseImpact:
      "Elevated HbA1c is common during depressive episodes due to reduced self-care. Some antidepressants affect appetite and weight.",
    recommendations: {
      mild: "Simplify routines where possible. Automated reminders and reduced decision points can help maintain management during low periods.",
      moderate:
        "Consider whether mental-health support could improve diabetes outcomes. Therapy and medication review may help stabilise glucose patterns.",
      severe:
        "Depression is significantly impacting diabetes self-management. Coordinated psychiatric and endocrinology support is strongly recommended.",
    },
  },
  anxiety: {
    insulinImpact:
      "Anxiety about hypoglycaemia may lead to chronic under-dosing. Stress hormones (cortisol, adrenaline) increase insulin resistance.",
    glucoseImpact:
      "Running glucose intentionally high to avoid lows, leading to sustained hyperglycaemia. Stress-induced glucose spikes.",
    recommendations: {
      mild: "Validate fears around hypoglycaemia. Education on hypo symptoms and treatment can reduce anxiety-driven avoidance.",
      moderate:
        "Consider CGM with alerts to reduce hypo anxiety. Cognitive-behavioural strategies may help reframe glucose-management fears.",
      severe:
        "Severe anxiety is resulting in persistent hyperglycaemia from avoidance behaviours. Psychological support specialising in chronic illness is recommended.",
    },
  },
  steroid_use: {
    insulinImpact:
      "Corticosteroids dramatically increase insulin resistance, often requiring 40–100% more insulin, particularly in the afternoon and evening.",
    glucoseImpact:
      "Pronounced post-lunch and afternoon hyperglycaemia. Effect peaks 4–8 hours after oral steroid dose.",
    recommendations: {
      mild: "Low-dose or topical steroid use. Monitor for afternoon glucose rises and adjust bolus if patterns emerge.",
      moderate:
        "Moderate-dose steroid course. Increase basal insulin by 20–40% and bolus ratios for lunch and dinner. Revert when course ends.",
      severe:
        "High-dose or prolonged steroid therapy. Insulin requirements may double. Close monitoring and a temporary steroid-specific insulin plan are essential.",
    },
  },
  puberty: {
    insulinImpact:
      "Growth hormone surges increase insulin resistance by 30–50%, particularly overnight and in the early morning (dawn phenomenon).",
    glucoseImpact:
      "Rising HbA1c during puberty is common even with good adherence. Overnight and fasting glucose may climb significantly.",
    recommendations: {
      mild: "Early puberty. Watch for gradual increases in overnight and fasting glucose. Small basal adjustments may be needed.",
      moderate:
        "Mid-puberty. Expect 20–40% increase in total daily insulin. Frequent ratio reviews (every 4–6 weeks) are recommended.",
      severe:
        "Peak puberty with significant insulin resistance. Insulin requirements may increase up to 50%. Intensive management and regular clinic visits are advised.",
    },
  },
  pregnancy: {
    insulinImpact:
      "Insulin requirements change dramatically: reduced in the first trimester, then rising steeply in the second and third trimesters (up to 2–3× baseline).",
    glucoseImpact:
      "Tight glucose targets (3.5–7.8 mmol/L) are essential for foetal health. Increased hypo risk in the first trimester.",
    recommendations: {
      mild: "Early pregnancy or pre-conception planning. Begin tightening glucose targets and increase monitoring frequency.",
      moderate:
        "Active pregnancy with changing insulin needs. Weekly ratio reviews and close collaboration with the obstetric-diabetes team are essential.",
      severe:
        "Significant glucose instability during pregnancy. Intensive management with real-time CGM and frequent specialist contact is strongly recommended.",
    },
  },
  menstrual: {
    insulinImpact:
      "Progesterone in the luteal phase increases insulin resistance. Insulin sensitivity returns at the onset of menstruation.",
    glucoseImpact:
      "Pre-menstrual glucose rises of 1–3 mmol/L are common. Some individuals also experience increased hypo risk during menstruation.",
    recommendations: {
      mild: "Track cycle phases alongside glucose data to identify your personal pattern. Small basal adjustments may suffice.",
      moderate:
        "Clear cyclical pattern detected. Consider a 10–20% basal increase during the luteal phase and revert at menstruation onset.",
      severe:
        "Severe hormonal glucose disruption across the cycle. Work with your care team to build a phase-specific insulin plan.",
    },
  },
};

/* ─── Interaction matrix ────────────────────────────────────────────────── */

interface InteractionRule {
  pair: [ComorbidityType, ComorbidityType];
  warning: string;
  severity: "informational" | "important" | "critical";
}

const INTERACTION_RULES: InteractionRule[] = [
  {
    pair: ["thyroid", "pregnancy"],
    warning:
      "Thyroid dysfunction during pregnancy compounds insulin resistance and increases risk of pre-eclampsia. Close co-management by endocrinology and obstetrics is essential.",
    severity: "critical",
  },
  {
    pair: ["thyroid", "celiac"],
    warning:
      "Thyroid and celiac disease share autoimmune origins with T1D (autoimmune triad). Screen annually for both conditions.",
    severity: "important",
  },
  {
    pair: ["pregnancy", "gastroparesis"],
    warning:
      "Gastroparesis worsens during pregnancy. Insulin timing becomes extremely unpredictable — specialist dietitian and obstetric-diabetes input required.",
    severity: "critical",
  },
  {
    pair: ["eating_disorder", "pregnancy"],
    warning:
      "Active eating disorder during pregnancy with T1D is a high-risk combination. Multidisciplinary support including perinatal mental health is essential.",
    severity: "critical",
  },
  {
    pair: ["depression", "eating_disorder"],
    warning:
      "Depression and disordered eating together significantly increase insulin omission risk. Screen for diabulimia and ensure mental-health support is in place.",
    severity: "critical",
  },
  {
    pair: ["adhd", "eating_disorder"],
    warning:
      "ADHD impulsivity and eating-disorder behaviours can compound each other, leading to chaotic glucose patterns. Coordinated psychiatric care recommended.",
    severity: "important",
  },
  {
    pair: ["steroid_use", "pregnancy"],
    warning:
      "Steroid use during pregnancy amplifies insulin resistance already elevated by pregnancy hormones. Expect very high insulin requirements.",
    severity: "critical",
  },
  {
    pair: ["puberty", "adhd"],
    warning:
      "Puberty hormones and ADHD medication effects on appetite create a challenging combination for consistent glucose management. Structured routines are key.",
    severity: "important",
  },
  {
    pair: ["pcos", "menstrual"],
    warning:
      "PCOS amplifies menstrual-cycle insulin resistance patterns. Cycle-phase tracking and phase-specific insulin plans are recommended.",
    severity: "important",
  },
  {
    pair: ["anxiety", "depression"],
    warning:
      "Co-occurring anxiety and depression can significantly impair diabetes self-management. Integrated mental-health and diabetes support recommended.",
    severity: "important",
  },
  {
    pair: ["gastroparesis", "celiac"],
    warning:
      "Both conditions disrupt nutrient absorption and timing. Insulin dosing becomes highly unpredictable — specialist dietitian review essential.",
    severity: "important",
  },
  {
    pair: ["steroid_use", "puberty"],
    warning:
      "Steroids during puberty create compounded insulin resistance. Total daily insulin may need to increase by 60–100%.",
    severity: "critical",
  },
  {
    pair: ["pcos", "pregnancy"],
    warning:
      "PCOS with pregnancy in T1D means significant insulin resistance from multiple sources. Very close monitoring required.",
    severity: "critical",
  },
  {
    pair: ["autism", "eating_disorder"],
    warning:
      "Distinguish between autism-related food rigidity and eating-disorder behaviours — management strategies differ significantly.",
    severity: "important",
  },
  {
    pair: ["adhd", "depression"],
    warning:
      "ADHD and depression together increase risk of missed doses and disengagement from self-care. Simplify routines and consider coordinated treatment.",
    severity: "important",
  },
];

/* ─── Helper: normalise severity ────────────────────────────────────────── */

function normaliseSeverity(
  s: string | undefined
): "mild" | "moderate" | "severe" {
  if (s === "moderate" || s === "severe") return s;
  return "mild";
}

/* ─── Public API ────────────────────────────────────────────────────────── */

/**
 * Returns the full impact details for a single comorbidity type at a given
 * severity level.
 */
export function getComorbidityImpact(
  type: ComorbidityType,
  severity: "mild" | "moderate" | "severe" = "moderate"
): ComorbidityFlag {
  const entry = IMPACT_DB[type];
  return {
    type,
    active: true,
    severity,
    insulinImpact: entry.insulinImpact,
    glucoseImpact: entry.glucoseImpact,
    recommendation: entry.recommendations[severity],
  };
}

/**
 * Detects interaction warnings between active comorbidity flags.
 */
export function detectInteractions(
  flags: ComorbidityFlag[]
): InteractionWarning[] {
  const activeTypes = new Set(flags.filter((f) => f.active).map((f) => f.type));
  const warnings: InteractionWarning[] = [];

  for (const rule of INTERACTION_RULES) {
    if (activeTypes.has(rule.pair[0]) && activeTypes.has(rule.pair[1])) {
      warnings.push({
        flagA: rule.pair[0],
        flagB: rule.pair[1],
        warning: rule.warning,
        severity: rule.severity,
      });
    }
  }

  return warnings.sort((a, b) => {
    const order = { critical: 0, important: 1, informational: 2 };
    return order[a.severity] - order[b.severity];
  });
}

/**
 * Calculates an overall risk level from the set of active flags.
 */
export function getOverallRiskLevel(
  flags: ComorbidityFlag[]
): "low" | "moderate" | "high" | "complex" {
  const active = flags.filter((f) => f.active);
  if (active.length === 0) return "low";

  const severeCount = active.filter((f) => f.severity === "severe").length;
  const moderateCount = active.filter((f) => f.severity === "moderate").length;
  const interactions = detectInteractions(active);
  const criticalInteractions = interactions.filter(
    (i) => i.severity === "critical"
  ).length;

  if (
    severeCount >= 2 ||
    criticalInteractions >= 2 ||
    active.length >= 5
  ) {
    return "complex";
  }
  if (
    severeCount >= 1 ||
    criticalInteractions >= 1 ||
    (moderateCount >= 2 && active.length >= 3)
  ) {
    return "high";
  }
  if (moderateCount >= 1 || active.length >= 2) {
    return "moderate";
  }
  return "low";
}

/**
 * Builds a complete comorbidity profile from a list of flag inputs.
 */
export function buildComorbidityProfile(
  flags: { type: ComorbidityType; active: boolean; severity?: string }[]
): ComorbidityProfile {
  const activeInputs = flags.filter((f) => f.active);

  const activeFlags: ComorbidityFlag[] = activeInputs.map((f) => {
    const severity = normaliseSeverity(f.severity);
    return getComorbidityImpact(f.type, severity);
  });

  const overallRiskLevel = getOverallRiskLevel(activeFlags);
  const interactions = detectInteractions(activeFlags);

  // Build combined insulin adjustment summary
  let combinedInsulinAdjustment: string;
  if (activeFlags.length === 0) {
    combinedInsulinAdjustment =
      "No active comorbidity flags. Standard insulin regimen applies.";
  } else if (activeFlags.length === 1) {
    combinedInsulinAdjustment = activeFlags[0].insulinImpact;
  } else {
    const types = activeFlags.map((f) => f.type).join(", ");
    combinedInsulinAdjustment =
      `Multiple active comorbidities (${types}) are affecting insulin requirements. ` +
      `Each condition influences insulin sensitivity independently, and interactions between them may compound the effect. ` +
      `Work closely with your healthcare team to establish individualised adjustments.`;
  }

  // Build priority alerts from critical/important interactions and severe flags
  const priorityAlerts: string[] = [];

  for (const interaction of interactions) {
    if (
      interaction.severity === "critical" ||
      interaction.severity === "important"
    ) {
      priorityAlerts.push(interaction.warning);
    }
  }

  for (const flag of activeFlags) {
    if (flag.severity === "severe") {
      priorityAlerts.push(
        `${flag.type.replace(/_/g, " ")} (severe): ${flag.recommendation}`
      );
    }
  }

  // Educational note
  const educationalNote =
    activeFlags.length === 0
      ? "No comorbidity flags are currently active. GluMira™ will continue to monitor and flag any changes."
      : `You have ${activeFlags.length} active comorbidity flag${activeFlags.length > 1 ? "s" : ""}. ` +
        `Comorbidities can change how your body responds to insulin and food. ` +
        `Understanding these interactions helps you and your healthcare team make more informed decisions. ` +
        `GluMira™ is an educational platform — always discuss changes with your care team before adjusting your regimen.`;

  return {
    activeFlags,
    overallRiskLevel,
    combinedInsulinAdjustment,
    priorityAlerts,
    educationalNote,
  };
}
