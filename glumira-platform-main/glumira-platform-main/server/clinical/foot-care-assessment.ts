/**
 * GluMira™ — Foot Care Assessment Module
 *
 * Conducts a structured foot care risk assessment based on
 * clinical guidelines and provides personalized care recommendations.
 *
 * Clinical relevance:
 * - Diabetic foot ulcers are a leading cause of amputation
 * - 85% of amputations are preceded by a foot ulcer
 * - Regular assessment and education prevent complications
 *
 * NOT a medical device. Educational purposes only.
 */

export interface FootAssessmentInput {
  hasNeuropathy: boolean;
  hasPVD: boolean;                  // peripheral vascular disease
  previousUlcer: boolean;
  previousAmputation: boolean;
  footDeformity: boolean;
  calluses: boolean;
  skinBreaks: boolean;
  poorCirculation: boolean;
  canFeelMonofilament: boolean;
  dailyFootCheck: boolean;
  appropriateFootwear: boolean;
  smoker: boolean;
  latestA1C: number;
  yearsSinceDiagnosis: number;
}

export interface FootRiskResult {
  riskCategory: "low" | "moderate" | "high" | "very-high";
  riskScore: number;
  riskFactors: string[];
  protectiveFactors: string[];
  examFrequency: string;
  dailyCareChecklist: string[];
  warningSignsToWatch: string[];
  whenToSeekHelp: string[];
  footwearRecommendations: string[];
  referrals: string[];
  disclaimer: string;
}

/* ── Main assessment ─────────────────────────────────────────── */

export function assessFootCare(input: FootAssessmentInput): FootRiskResult {
  let score = 0;
  const riskFactors: string[] = [];
  const protectiveFactors: string[] = [];

  // ── Risk scoring ──
  if (input.hasNeuropathy) { score += 20; riskFactors.push("Peripheral neuropathy — reduced sensation in feet"); }
  if (input.hasPVD) { score += 20; riskFactors.push("Peripheral vascular disease — reduced blood flow"); }
  if (input.previousUlcer) { score += 25; riskFactors.push("Previous foot ulcer — high recurrence risk"); }
  if (input.previousAmputation) { score += 30; riskFactors.push("Previous amputation — very high risk for further complications"); }
  if (input.footDeformity) { score += 10; riskFactors.push("Foot deformity — increased pressure points"); }
  if (input.calluses) { score += 5; riskFactors.push("Calluses — may indicate pressure areas"); }
  if (input.skinBreaks) { score += 15; riskFactors.push("Skin breaks or wounds — immediate attention needed"); }
  if (input.poorCirculation) { score += 10; riskFactors.push("Poor circulation signs"); }
  if (!input.canFeelMonofilament) { score += 15; riskFactors.push("Loss of protective sensation"); }
  if (input.smoker) { score += 10; riskFactors.push("Smoking — impairs circulation and healing"); }
  if (input.latestA1C >= 8) { score += 10; riskFactors.push("A1C ≥ 8% — high glucose impairs wound healing"); }
  if (input.yearsSinceDiagnosis >= 10) { score += 5; riskFactors.push("10+ years diabetes duration"); }

  // Protective factors
  if (input.dailyFootCheck) protectiveFactors.push("Daily foot checks — excellent self-care habit");
  if (input.appropriateFootwear) protectiveFactors.push("Appropriate footwear — reduces injury risk");
  if (input.canFeelMonofilament) protectiveFactors.push("Intact sensation — can detect injuries early");
  if (!input.smoker) protectiveFactors.push("Non-smoker — better circulation and healing");
  if (input.latestA1C < 7) protectiveFactors.push("Good glucose control — supports wound healing");

  score = Math.min(100, score);

  let riskCategory: FootRiskResult["riskCategory"];
  if (score >= 60) riskCategory = "very-high";
  else if (score >= 40) riskCategory = "high";
  else if (score >= 20) riskCategory = "moderate";
  else riskCategory = "low";

  // Exam frequency
  let examFrequency: string;
  if (riskCategory === "very-high") examFrequency = "Every 1-3 months with specialist";
  else if (riskCategory === "high") examFrequency = "Every 3-6 months";
  else if (riskCategory === "moderate") examFrequency = "Every 6-12 months";
  else examFrequency = "Annual comprehensive foot exam";

  // Daily care checklist
  const dailyCareChecklist = [
    "Inspect feet daily — top, bottom, between toes",
    "Wash feet daily with warm (not hot) water",
    "Dry thoroughly, especially between toes",
    "Apply moisturizer to dry areas (not between toes)",
    "Trim toenails straight across, file edges",
    "Never walk barefoot, even indoors",
    "Check shoes for foreign objects before wearing",
    "Wear clean, dry socks without seams",
  ];

  // Warning signs
  const warningSignsToWatch = [
    "New numbness, tingling, or burning in feet",
    "Color changes (red, blue, pale, or dark spots)",
    "Swelling that doesn't go down",
    "Cuts, blisters, or sores that don't heal within 2 days",
    "Ingrown toenails or fungal infections",
    "Unusual warmth in one foot compared to the other",
    "Pain when walking that stops at rest (claudication)",
    "Foul smell from feet or shoes",
  ];

  // When to seek help
  const whenToSeekHelp = [
    "Any open wound or sore on the foot",
    "Signs of infection: redness, warmth, swelling, pus, or fever",
    "Sudden loss of sensation",
    "Foot pain that wakes you at night",
    "Black or blue discoloration",
    "Foot injury that doesn't improve within 24 hours",
  ];

  // Footwear recommendations
  const footwearRecommendations: string[] = [];
  if (riskCategory === "very-high" || riskCategory === "high") {
    footwearRecommendations.push("Custom therapeutic footwear may be needed — ask your podiatrist");
    footwearRecommendations.push("Consider orthotic insoles for pressure redistribution");
  }
  footwearRecommendations.push("Choose shoes with a wide toe box and good arch support");
  footwearRecommendations.push("Break in new shoes gradually — wear for 1-2 hours initially");
  footwearRecommendations.push("Avoid high heels, pointed toes, and open-toed shoes");
  footwearRecommendations.push("Replace worn shoes regularly");

  // Referrals
  const referrals: string[] = [];
  if (riskCategory === "very-high" || riskCategory === "high") {
    referrals.push("Podiatrist for specialist foot care");
  }
  if (input.hasPVD || input.poorCirculation) {
    referrals.push("Vascular specialist for circulation assessment");
  }
  if (input.skinBreaks || input.previousUlcer) {
    referrals.push("Wound care specialist if any active wounds");
  }
  if (referrals.length === 0) {
    referrals.push("Continue routine care with your diabetes team");
  }

  return {
    riskCategory,
    riskScore: score,
    riskFactors,
    protectiveFactors,
    examFrequency,
    dailyCareChecklist,
    warningSignsToWatch,
    whenToSeekHelp,
    footwearRecommendations,
    referrals,
    disclaimer:
      "GluMira™ is an educational platform. The science of insulin, made visible. " +
      "This assessment does not replace a clinical foot examination by a healthcare professional.",
  };
}
