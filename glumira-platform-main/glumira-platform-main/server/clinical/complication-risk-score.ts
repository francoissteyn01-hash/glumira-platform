/**
 * GluMira™ — Diabetes Complication Risk Score Module
 *
 * Assesses risk for major diabetes complications based on
 * clinical parameters and provides screening recommendations.
 *
 * Complications assessed:
 * - Retinopathy (eye)
 * - Nephropathy (kidney)
 * - Neuropathy (nerve)
 * - Cardiovascular disease
 * - Foot complications
 *
 * NOT a medical device. Educational purposes only.
 */

export interface ComplicationInput {
  diabetesType: "type1" | "type2";
  yearsSinceDiagnosis: number;
  latestA1C: number;
  averageA1C?: number;
  systolicBP?: number;
  diastolicBP?: number;
  ldlCholesterol?: number;       // mmol/L
  smoker: boolean;
  familyHistoryCVD: boolean;
  existingComplications: string[];
  age: number;
  bmi?: number;
}

export interface ComplicationRisk {
  complication: string;
  riskScore: number;              // 0-100
  riskLevel: "low" | "moderate" | "high" | "very-high";
  keyFactors: string[];
  screeningDue: string;
  preventionTips: string[];
}

export interface ComplicationResult {
  overallRisk: "low" | "moderate" | "high" | "very-high";
  overallScore: number;
  complications: ComplicationRisk[];
  modifiableFactors: string[];
  nonModifiableFactors: string[];
  urgentActions: string[];
  screeningSchedule: { test: string; frequency: string; lastDue: string }[];
  disclaimer: string;
}

/* ── Risk calculation helpers ────────────────────────────────── */

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function calcRetinopathyRisk(input: ComplicationInput): ComplicationRisk {
  let score = 0;
  const factors: string[] = [];

  // Duration is the strongest predictor
  if (input.yearsSinceDiagnosis >= 20) { score += 35; factors.push("20+ years duration"); }
  else if (input.yearsSinceDiagnosis >= 10) { score += 20; factors.push("10+ years duration"); }
  else if (input.yearsSinceDiagnosis >= 5) { score += 10; factors.push("5+ years duration"); }

  // A1C
  if (input.latestA1C >= 9) { score += 25; factors.push("A1C ≥ 9%"); }
  else if (input.latestA1C >= 8) { score += 15; factors.push("A1C ≥ 8%"); }
  else if (input.latestA1C >= 7) { score += 8; factors.push("A1C ≥ 7%"); }

  // BP
  if (input.systolicBP && input.systolicBP >= 140) { score += 15; factors.push("High blood pressure"); }

  // Existing
  if (input.existingComplications.includes("retinopathy")) { score += 20; factors.push("Existing retinopathy"); }

  score = clamp(score, 0, 100);
  const riskLevel = score >= 60 ? "very-high" : score >= 40 ? "high" : score >= 20 ? "moderate" : "low";

  return {
    complication: "Retinopathy",
    riskScore: score,
    riskLevel,
    keyFactors: factors,
    screeningDue: input.yearsSinceDiagnosis >= 5 || input.diabetesType === "type2" ? "Annual dilated eye exam" : "Eye exam within 5 years of diagnosis",
    preventionTips: ["Maintain A1C below 7%", "Control blood pressure", "Annual eye screening"],
  };
}

function calcNephropathyRisk(input: ComplicationInput): ComplicationRisk {
  let score = 0;
  const factors: string[] = [];

  if (input.yearsSinceDiagnosis >= 15) { score += 25; factors.push("15+ years duration"); }
  else if (input.yearsSinceDiagnosis >= 10) { score += 15; factors.push("10+ years duration"); }

  if (input.latestA1C >= 8) { score += 20; factors.push("A1C ≥ 8%"); }
  else if (input.latestA1C >= 7) { score += 10; factors.push("A1C ≥ 7%"); }

  if (input.systolicBP && input.systolicBP >= 140) { score += 20; factors.push("High blood pressure"); }

  if (input.existingComplications.includes("nephropathy")) { score += 25; factors.push("Existing kidney disease"); }

  score = clamp(score, 0, 100);
  const riskLevel = score >= 60 ? "very-high" : score >= 40 ? "high" : score >= 20 ? "moderate" : "low";

  return {
    complication: "Nephropathy",
    riskScore: score,
    riskLevel,
    keyFactors: factors,
    screeningDue: "Annual urine albumin and eGFR test",
    preventionTips: ["Control blood pressure (target <130/80)", "Maintain A1C below 7%", "Stay hydrated", "Annual kidney function tests"],
  };
}

function calcNeuropathyRisk(input: ComplicationInput): ComplicationRisk {
  let score = 0;
  const factors: string[] = [];

  if (input.yearsSinceDiagnosis >= 10) { score += 20; factors.push("10+ years duration"); }
  if (input.latestA1C >= 8) { score += 20; factors.push("A1C ≥ 8%"); }
  else if (input.latestA1C >= 7) { score += 10; factors.push("A1C ≥ 7%"); }
  if (input.smoker) { score += 15; factors.push("Smoking"); }
  if (input.age >= 60) { score += 10; factors.push("Age ≥ 60"); }
  if (input.existingComplications.includes("neuropathy")) { score += 25; factors.push("Existing neuropathy"); }

  score = clamp(score, 0, 100);
  const riskLevel = score >= 60 ? "very-high" : score >= 40 ? "high" : score >= 20 ? "moderate" : "low";

  return {
    complication: "Neuropathy",
    riskScore: score,
    riskLevel,
    keyFactors: factors,
    screeningDue: "Annual foot exam with monofilament testing",
    preventionTips: ["Maintain A1C below 7%", "Stop smoking", "Check feet daily", "Wear proper footwear"],
  };
}

function calcCVDRisk(input: ComplicationInput): ComplicationRisk {
  let score = 0;
  const factors: string[] = [];

  if (input.diabetesType === "type2") { score += 10; factors.push("Type 2 diabetes"); }
  if (input.age >= 55) { score += 10; factors.push("Age ≥ 55"); }
  if (input.latestA1C >= 8) { score += 15; factors.push("A1C ≥ 8%"); }
  if (input.systolicBP && input.systolicBP >= 140) { score += 15; factors.push("High blood pressure"); }
  if (input.ldlCholesterol && input.ldlCholesterol >= 3.0) { score += 15; factors.push("High LDL cholesterol"); }
  if (input.smoker) { score += 20; factors.push("Smoking"); }
  if (input.familyHistoryCVD) { score += 10; factors.push("Family history of CVD"); }
  if (input.bmi && input.bmi >= 30) { score += 10; factors.push("BMI ≥ 30"); }

  score = clamp(score, 0, 100);
  const riskLevel = score >= 60 ? "very-high" : score >= 40 ? "high" : score >= 20 ? "moderate" : "low";

  return {
    complication: "Cardiovascular Disease",
    riskScore: score,
    riskLevel,
    keyFactors: factors,
    screeningDue: "Annual lipid panel and blood pressure check",
    preventionTips: ["Stop smoking", "Control blood pressure and cholesterol", "Exercise regularly", "Maintain healthy weight"],
  };
}

function calcFootRisk(input: ComplicationInput): ComplicationRisk {
  let score = 0;
  const factors: string[] = [];

  if (input.yearsSinceDiagnosis >= 10) { score += 15; factors.push("10+ years duration"); }
  if (input.latestA1C >= 8) { score += 15; factors.push("A1C ≥ 8%"); }
  if (input.smoker) { score += 15; factors.push("Smoking"); }
  if (input.existingComplications.includes("neuropathy")) { score += 25; factors.push("Existing neuropathy"); }
  if (input.existingComplications.includes("pvd")) { score += 20; factors.push("Peripheral vascular disease"); }

  score = clamp(score, 0, 100);
  const riskLevel = score >= 60 ? "very-high" : score >= 40 ? "high" : score >= 20 ? "moderate" : "low";

  return {
    complication: "Foot Complications",
    riskScore: score,
    riskLevel,
    keyFactors: factors,
    screeningDue: "Annual comprehensive foot exam",
    preventionTips: ["Check feet daily", "Wear proper shoes", "Keep feet clean and dry", "See podiatrist regularly"],
  };
}

/* ── Main function ───────────────────────────────────────────── */

export function assessComplicationRisk(input: ComplicationInput): ComplicationResult {
  const complications = [
    calcRetinopathyRisk(input),
    calcNephropathyRisk(input),
    calcNeuropathyRisk(input),
    calcCVDRisk(input),
    calcFootRisk(input),
  ];

  const overallScore = Math.round(complications.reduce((sum, c) => sum + c.riskScore, 0) / complications.length);
  const overallRisk = overallScore >= 60 ? "very-high" : overallScore >= 40 ? "high" : overallScore >= 20 ? "moderate" : "low";

  // Modifiable factors
  const modifiableFactors: string[] = [];
  if (input.latestA1C >= 7) modifiableFactors.push("A1C — improve glucose control");
  if (input.systolicBP && input.systolicBP >= 130) modifiableFactors.push("Blood pressure — target <130/80");
  if (input.smoker) modifiableFactors.push("Smoking — cessation dramatically reduces risk");
  if (input.ldlCholesterol && input.ldlCholesterol >= 2.6) modifiableFactors.push("LDL cholesterol — target <2.6 mmol/L");
  if (input.bmi && input.bmi >= 25) modifiableFactors.push("Weight — target BMI <25");

  // Non-modifiable
  const nonModifiableFactors: string[] = [];
  nonModifiableFactors.push(`Diabetes duration: ${input.yearsSinceDiagnosis} years`);
  nonModifiableFactors.push(`Age: ${input.age}`);
  if (input.familyHistoryCVD) nonModifiableFactors.push("Family history of cardiovascular disease");

  // Urgent actions
  const urgentActions: string[] = [];
  const veryHighComplications = complications.filter((c) => c.riskLevel === "very-high");
  if (veryHighComplications.length > 0) {
    urgentActions.push(`Very high risk for: ${veryHighComplications.map((c) => c.complication).join(", ")}. Schedule urgent review with your care team.`);
  }
  if (input.latestA1C >= 10) {
    urgentActions.push("A1C is critically elevated. Immediate medical review recommended.");
  }

  // Screening schedule
  const screeningSchedule = [
    { test: "Dilated eye exam", frequency: "Annual", lastDue: "Check with ophthalmologist" },
    { test: "Urine albumin + eGFR", frequency: "Annual", lastDue: "Check with GP" },
    { test: "Foot exam", frequency: "Annual", lastDue: "Check with podiatrist" },
    { test: "Lipid panel", frequency: "Annual", lastDue: "Check with GP" },
    { test: "Blood pressure", frequency: "Every visit", lastDue: "Check at next appointment" },
    { test: "HbA1c", frequency: "Every 3-6 months", lastDue: "Check with GP" },
  ];

  return {
    overallRisk,
    overallScore,
    complications,
    modifiableFactors,
    nonModifiableFactors,
    urgentActions,
    screeningSchedule,
    disclaimer:
      "GluMira™ is an educational platform. The science of insulin, made visible. " +
      "Risk scores are estimates and should not replace clinical assessment.",
  };
}
