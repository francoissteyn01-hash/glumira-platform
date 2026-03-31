/**
 * GluMira™ Phase 2 — Clinician Assistant AI Engine
 * Version: 7.0.0
 * Module: AI-CLINICIAN
 *
 * Provides AI-powered glucose pattern analysis for clinicians.
 * Powered by Claude Sonnet (claude-3-5-sonnet-20241022).
 *
 * Features:
 *   - Glucose pattern analysis (time-in-range, variability, trend detection)
 *   - IOB stacking risk assessment
 *   - Meal regime optimisation suggestions
 *   - Hypo/hyper risk scoring
 *   - Structured clinical summary generation
 *
 * Safety blocks (non-negotiable):
 *   - NEVER suggests specific insulin doses
 *   - NEVER diagnoses conditions
 *   - NEVER contradicts the treating clinician
 *   - ALWAYS includes DISCLAIMER in every response
 *   - ALWAYS recommends consulting the diabetes care team
 *   - Responses are educational only — not clinical advice
 *
 * Rate limiting: 20 AI queries per user per hour (ai_query profile)
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 * AI-generated analysis is for educational purposes only.
 * Always consult a qualified diabetes care team before making any
 * changes to insulin therapy or diabetes management.
 */

// ─── Types ────────────────────────────────────────────────────

export interface GlucoseReading {
  timestamp: string;      // ISO string
  value: number;          // mg/dL
  source?: string;        // "cgm" | "fingerstick" | "nightscout"
  trend?: string;         // Direction arrow
}

export interface InsulinDose {
  timestamp: string;
  amount: number;         // Biological units
  type: "bolus" | "basal";
  insulinName?: string;
}

export interface MealEntry {
  timestamp: string;
  carbsGrams: number;
  regime?: string;
  notes?: string;
}

export interface PatientContext {
  diabetesType: "T1" | "T2" | "T3" | "LADA" | "MODY" | "OTHER";
  dia: number;            // Duration of insulin action (hours)
  isf: number;            // Insulin sensitivity factor (mg/dL per unit)
  icr: number;            // Insulin-to-carb ratio (grams per unit)
  targetLow: number;      // mg/dL
  targetHigh: number;     // mg/dL
  units: "mg/dL" | "mmol/L";
}

export interface AnalysisRequest {
  patientContext: PatientContext;
  glucoseReadings: GlucoseReading[];
  insulinDoses?: InsulinDose[];
  meals?: MealEntry[];
  analysisType: AnalysisType;
  clinicianQuestion?: string;   // Optional free-text question from clinician
  periodHours?: number;         // Analysis window (default: 24h)
}

export type AnalysisType =
  | "pattern_summary"           // Full 24h/7d pattern analysis
  | "tir_report"                // Time-in-range report
  | "iob_stacking_risk"         // IOB stacking risk assessment
  | "hypo_risk"                 // Hypoglycaemia risk scoring
  | "meal_regime_optimisation"  // Meal regime suggestions
  | "variability_analysis"      // Glucose variability (CV, SD, TIR)
  | "clinician_question";       // Answer a specific clinician question

export interface AnalysisResult {
  analysisType: AnalysisType;
  summary: string;              // Plain-text summary for clinician
  structuredData: PatternData;
  safetyFlags: SafetyFlag[];
  disclaimer: string;
  generatedAt: string;
  modelUsed: string;
  tokensUsed?: number;
}

export interface PatternData {
  tir?: TimeInRange;
  variability?: GlucoseVariability;
  iobRisk?: IobStackingRisk;
  hypoRisk?: HypoRiskScore;
  trends?: TrendAnalysis;
}

export interface TimeInRange {
  veryLow: number;      // % < 54 mg/dL
  low: number;          // % 54-69 mg/dL
  inRange: number;      // % 70-180 mg/dL
  high: number;         // % 181-250 mg/dL
  veryHigh: number;     // % > 250 mg/dL
  mean: number;         // mg/dL
  gmi: number;          // Glucose Management Indicator (estimated HbA1c)
}

export interface GlucoseVariability {
  cv: number;           // Coefficient of variation (%)
  sd: number;           // Standard deviation (mg/dL)
  mage: number;         // Mean amplitude of glycaemic excursions
  isHighVariability: boolean;  // CV > 36% = high variability
}

export interface IobStackingRisk {
  score: number;        // 0-100
  level: "low" | "moderate" | "high" | "critical";
  stackingEvents: number;
  description: string;
}

export interface HypoRiskScore {
  score: number;        // 0-100
  level: "low" | "moderate" | "high" | "critical";
  hypoEvents: number;
  nearHypoEvents: number;
  description: string;
}

export interface TrendAnalysis {
  overallTrend: "improving" | "stable" | "worsening";
  postMealSpikes: number;
  overnightPattern: "stable" | "rising" | "falling" | "variable";
  dawnPhenomenon: boolean;
  somogyi: boolean;
}

export interface SafetyFlag {
  code: string;
  severity: "info" | "warning" | "critical";
  message: string;
}

// ─── Statistical Calculations ─────────────────────────────────

/**
 * Calculate Time-in-Range from glucose readings.
 */
export function calculateTIR(
  readings: GlucoseReading[],
  targetLow = 70,
  targetHigh = 180
): TimeInRange {
  if (readings.length === 0) {
    return { veryLow: 0, low: 0, inRange: 0, high: 0, veryHigh: 0, mean: 0, gmi: 0 };
  }

  const values = readings.map((r) => r.value);
  const n = values.length;

  const veryLow = (values.filter((v) => v < 54).length / n) * 100;
  const low = (values.filter((v) => v >= 54 && v < targetLow).length / n) * 100;
  const inRange = (values.filter((v) => v >= targetLow && v <= targetHigh).length / n) * 100;
  const high = (values.filter((v) => v > targetHigh && v <= 250).length / n) * 100;
  const veryHigh = (values.filter((v) => v > 250).length / n) * 100;
  const mean = values.reduce((a, b) => a + b, 0) / n;

  // GMI = 3.31 + 0.02392 × mean glucose (mg/dL) — Bergenstal et al. 2018
  const gmi = 3.31 + 0.02392 * mean;

  return {
    veryLow: Math.round(veryLow * 10) / 10,
    low: Math.round(low * 10) / 10,
    inRange: Math.round(inRange * 10) / 10,
    high: Math.round(high * 10) / 10,
    veryHigh: Math.round(veryHigh * 10) / 10,
    mean: Math.round(mean * 10) / 10,
    gmi: Math.round(gmi * 100) / 100,
  };
}

/**
 * Calculate glucose variability metrics.
 */
export function calculateVariability(readings: GlucoseReading[]): GlucoseVariability {
  if (readings.length < 2) {
    return { cv: 0, sd: 0, mage: 0, isHighVariability: false };
  }

  const values = readings.map((r) => r.value);
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1);
  const sd = Math.sqrt(variance);
  const cv = (sd / mean) * 100;

  // MAGE: Mean Amplitude of Glycaemic Excursions (simplified)
  const excursions: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const diff = Math.abs(values[i] - values[i - 1]);
    if (diff > sd) excursions.push(diff);
  }
  const mage = excursions.length > 0
    ? excursions.reduce((a, b) => a + b, 0) / excursions.length
    : 0;

  return {
    cv: Math.round(cv * 10) / 10,
    sd: Math.round(sd * 10) / 10,
    mage: Math.round(mage * 10) / 10,
    isHighVariability: cv > 36,
  };
}

/**
 * Score hypo risk from 0-100.
 */
export function scoreHypoRisk(
  readings: GlucoseReading[],
  targetLow = 70
): HypoRiskScore {
  const hypoEvents = readings.filter((r) => r.value < 54).length;
  const nearHypoEvents = readings.filter(
    (r) => r.value >= 54 && r.value < targetLow
  ).length;

  const rawScore = Math.min(100, hypoEvents * 20 + nearHypoEvents * 5);

  let level: HypoRiskScore["level"];
  if (rawScore >= 75) level = "critical";
  else if (rawScore >= 50) level = "high";
  else if (rawScore >= 25) level = "moderate";
  else level = "low";

  const descriptions: Record<HypoRiskScore["level"], string> = {
    low: "Low hypoglycaemia risk. Continue current management.",
    moderate: "Moderate hypoglycaemia risk. Review overnight basal rates and pre-meal targets.",
    high: "High hypoglycaemia risk. Clinician review recommended.",
    critical: "Critical hypoglycaemia risk. Urgent clinician review required.",
  };

  return {
    score: rawScore,
    level,
    hypoEvents,
    nearHypoEvents,
    description: descriptions[level],
  };
}

// ─── Safety Flags ─────────────────────────────────────────────

/**
 * Generate safety flags from analysis data.
 * Safety flags are educational — they do not constitute clinical advice.
 */
export function generateSafetyFlags(
  tir: TimeInRange,
  variability: GlucoseVariability,
  hypoRisk: HypoRiskScore
): SafetyFlag[] {
  const flags: SafetyFlag[] = [];

  if (tir.veryLow > 1) {
    flags.push({
      code: "SF-01",
      severity: "critical",
      message: `Time below 54 mg/dL is ${tir.veryLow}% (target: <1%). Clinician review required.`,
    });
  }

  if (tir.low > 4) {
    flags.push({
      code: "SF-02",
      severity: "warning",
      message: `Time in low range (54-70 mg/dL) is ${tir.low}% (target: <4%).`,
    });
  }

  if (tir.inRange < 70) {
    flags.push({
      code: "SF-03",
      severity: "warning",
      message: `Time in range is ${tir.inRange}% (target: ≥70%).`,
    });
  }

  if (variability.isHighVariability) {
    flags.push({
      code: "SF-04",
      severity: "warning",
      message: `High glucose variability detected (CV: ${variability.cv}%, target: <36%).`,
    });
  }

  if (hypoRisk.level === "critical") {
    flags.push({
      code: "SF-05",
      severity: "critical",
      message: `Critical hypoglycaemia risk score: ${hypoRisk.score}/100. Urgent review required.`,
    });
  }

  return flags;
}

// ─── Prompt Builder ───────────────────────────────────────────

const SYSTEM_PROMPT = `You are the GluMira™ Clinician Assistant — an AI tool that helps diabetes care clinicians understand glucose patterns from continuous glucose monitor (CGM) data.

CRITICAL SAFETY RULES (never violate):
1. NEVER suggest specific insulin doses, dose adjustments, or insulin titration
2. NEVER diagnose any medical condition
3. NEVER contradict the treating clinician's decisions
4. ALWAYS include the disclaimer: "GluMira™ is an educational platform. The science of insulin, made visible. Always consult your diabetes care team."
5. ALWAYS recommend consulting the diabetes care team for any clinical decisions
6. Responses are educational pattern summaries only — not clinical advice

Your role:
- Identify patterns in glucose data (time-in-range, variability, trends)
- Flag potential concerns for clinician review (not for patient action)
- Summarise data in clear, professional clinical language
- Support the clinician's decision-making — never replace it

Format: Use structured sections with clear headings. Be concise and clinical.`;

/**
 * Build the user prompt for Claude from the analysis request and computed data.
 */
export function buildAnalysisPrompt(
  request: AnalysisRequest,
  tir: TimeInRange,
  variability: GlucoseVariability,
  hypoRisk: HypoRiskScore
): string {
  const { patientContext, analysisType, clinicianQuestion, periodHours = 24 } = request;

  const tirSection = `
TIME IN RANGE (${periodHours}h window):
  Very Low (<54 mg/dL):  ${tir.veryLow}%
  Low (54-${patientContext.targetLow} mg/dL): ${tir.low}%
  In Range (${patientContext.targetLow}-${patientContext.targetHigh} mg/dL): ${tir.inRange}%
  High (${patientContext.targetHigh}-250 mg/dL): ${tir.high}%
  Very High (>250 mg/dL): ${tir.veryHigh}%
  Mean Glucose: ${tir.mean} mg/dL
  GMI (est. HbA1c): ${tir.gmi}%`;

  const variabilitySection = `
VARIABILITY:
  CV: ${variability.cv}% (${variability.isHighVariability ? "HIGH — target <36%" : "within target"})
  SD: ${variability.sd} mg/dL
  MAGE: ${variability.mage} mg/dL`;

  const hypoSection = `
HYPO RISK:
  Score: ${hypoRisk.score}/100 (${hypoRisk.level.toUpperCase()})
  Hypo events (<54): ${hypoRisk.hypoEvents}
  Near-hypo events: ${hypoRisk.nearHypoEvents}`;

  const patientSection = `
PATIENT CONTEXT:
  Diabetes type: ${patientContext.diabetesType}
  DIA: ${patientContext.dia}h
  ISF: ${patientContext.isf} mg/dL/unit
  ICR: ${patientContext.icr}g/unit
  Target range: ${patientContext.targetLow}-${patientContext.targetHigh} mg/dL`;

  const questionSection = clinicianQuestion
    ? `\nCLINICIAN QUESTION:\n  ${clinicianQuestion}`
    : "";

  const taskSection = `
ANALYSIS REQUESTED: ${analysisType.replace(/_/g, " ").toUpperCase()}

Please provide a structured clinical pattern summary based on the data above.
Include: key findings, patterns of concern, and observations for clinician review.
Do NOT suggest dose changes. Do NOT diagnose. Always include the DISCLAIMER.`;

  return [patientSection, tirSection, variabilitySection, hypoSection, questionSection, taskSection].join("\n");
}

// ─── AI Engine ────────────────────────────────────────────────

const DISCLAIMER =
  "GluMira™ is an educational platform. The science of insulin, made visible. " +
  "AI-generated analysis is for educational purposes only. " +
  "Always consult a qualified diabetes care team before making any changes to insulin therapy.";

/**
 * Run AI pattern analysis using Claude Sonnet.
 * Requires ANTHROPIC_API_KEY environment variable.
 */
export async function runPatternAnalysis(
  request: AnalysisRequest
): Promise<AnalysisResult> {
  const { glucoseReadings, patientContext } = request;

  // Compute statistics
  const tir = calculateTIR(glucoseReadings, patientContext.targetLow, patientContext.targetHigh);
  const variability = calculateVariability(glucoseReadings);
  const hypoRisk = scoreHypoRisk(glucoseReadings, patientContext.targetLow);
  const safetyFlags = generateSafetyFlags(tir, variability, hypoRisk);

  const userPrompt = buildAnalysisPrompt(request, tir, variability, hypoRisk);

  // Call Claude Sonnet
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Claude API error ${response.status}: ${error}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
    usage: { input_tokens: number; output_tokens: number };
    model: string;
  };

  const summary = data.content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n");

  return {
    analysisType: request.analysisType,
    summary,
    structuredData: { tir, variability, hypoRisk },
    safetyFlags,
    disclaimer: DISCLAIMER,
    generatedAt: new Date().toISOString(),
    modelUsed: data.model,
    tokensUsed: data.usage.input_tokens + data.usage.output_tokens,
  };
}

// ─── Express Route ────────────────────────────────────────────

import { Router, type Request, type Response } from "express";

export const clinicianAssistantRouter = Router();

/**
 * POST /api/ai/analyse
 *
 * Runs AI pattern analysis on patient glucose data.
 * Rate-limited: 20 queries per user per hour.
 * Requires authentication.
 */
clinicianAssistantRouter.post("/analyse", async (req: Request, res: Response) => {
  const body = req.body as Partial<AnalysisRequest>;

  if (!body.patientContext || !body.glucoseReadings || !body.analysisType) {
    return res.status(400).json({
      error: "patientContext, glucoseReadings, and analysisType are required",
    });
  }

  if (!Array.isArray(body.glucoseReadings) || body.glucoseReadings.length === 0) {
    return res.status(400).json({ error: "glucoseReadings must be a non-empty array" });
  }

  if (body.glucoseReadings.length > 2016) {
    // Max 7 days at 5-min intervals
    return res.status(400).json({ error: "glucoseReadings exceeds maximum of 2016 entries (7 days)" });
  }

  try {
    const result = await runPatternAnalysis(body as AnalysisRequest);
    return res.status(200).json(result);
  } catch (err: any) {
    if (err.message?.includes("ANTHROPIC_API_KEY")) {
      return res.status(503).json({
        error: "AI analysis service unavailable — API key not configured",
      });
    }
    return res.status(500).json({ error: err.message ?? "Analysis failed" });
  }
});

/**
 * GET /api/ai/tir
 *
 * Compute Time-in-Range without AI (pure statistics, no API call).
 * Useful for dashboard widgets.
 */
clinicianAssistantRouter.get("/tir", (req: Request, res: Response) => {
  const { readings, targetLow, targetHigh } = req.query;

  if (!readings) {
    return res.status(400).json({ error: "readings query parameter is required (JSON array)" });
  }

  try {
    const parsed = JSON.parse(readings as string) as GlucoseReading[];
    const tir = calculateTIR(
      parsed,
      targetLow ? Number(targetLow) : 70,
      targetHigh ? Number(targetHigh) : 180
    );
    const variability = calculateVariability(parsed);
    return res.status(200).json({ tir, variability });
  } catch (err: any) {
    return res.status(400).json({ error: "Invalid readings JSON" });
  }
});
