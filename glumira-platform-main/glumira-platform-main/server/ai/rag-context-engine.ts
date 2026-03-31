/**
 * GluMira™ RAG Context-Injection Engine
 * Version: 7.0.0
 * Module: AI-RAG-CTX
 *
 * The missing link between live patient data and the AI assistant.
 *
 * This engine assembles a rich, structured context window from:
 *   1. Patient profile (diabetes type, ISF, ICR, DIA, targets)
 *   2. Recent glucose readings (last 24h / 7d from Dexcom Share or Nightscout)
 *   3. Recent insulin doses (bolus + basal)
 *   4. Recent meals (carbs, regime)
 *   5. Computed analytics (TIR, variability, IOB, hypo risk)
 *   6. Active clinician notes
 *   7. Onboarding status
 *
 * The assembled context is injected into every AI prompt as a structured
 * preamble, giving the LLM full situational awareness of the patient's
 * current state — without the patient needing to describe it.
 *
 * This is what makes GluMira™ AI different from a generic chatbot.
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import {
  calculateTIR,
  calculateVariability,
  scoreHypoRisk,
  type GlucoseReading,
  type InsulinDose,
  type MealEntry,
  type PatientContext,
  type TimeInRange,
  type GlucoseVariability,
  type HypoRiskScore,
} from "./clinician-assistant";

// ─── Types ───────────────────────────────────────────────────

export interface PatientProfile {
  id: string;
  firstName: string;
  diabetesType: string;
  glucoseUnit: "mg/dL" | "mmol/L";
  targetLow: number;
  targetHigh: number;
  isf: number;
  icr: number;
  diaMinutes: number;
  cgmSource: "dexcom" | "nightscout" | "manual";
  lastSyncAt: string | null;
}

export interface ClinicianNoteSnippet {
  category: string;
  body: string;
  createdAt: string;
}

export interface RawPatientData {
  profile: PatientProfile;
  glucoseReadings: GlucoseReading[];
  insulinDoses: InsulinDose[];
  meals: MealEntry[];
  clinicianNotes: ClinicianNoteSnippet[];
}

export interface ComputedMetrics {
  tir: TimeInRange;
  variability: GlucoseVariability;
  hypoRisk: HypoRiskScore;
  currentGlucose: GlucoseReading | null;
  glucoseTrend: string;
  activeIOB: number;
  readingCount24h: number;
  readingCount7d: number;
  lastDoseAt: string | null;
  lastMealAt: string | null;
}

export interface AssembledContext {
  systemPreamble: string;
  patientSummary: string;
  analyticsBlock: string;
  clinicianNotesBlock: string;
  safetyBlock: string;
  fullContext: string;
  metrics: ComputedMetrics;
  tokenEstimate: number;
}

// ─── Constants ───────────────────────────────────────────────

const SAFETY_PREAMBLE = `SAFETY RULES (NON-NEGOTIABLE):
1. You are GluMira™ AI — an educational diabetes education assistant.
2. You are NOT a medical device. You are NOT a doctor.
3. NEVER suggest specific insulin doses or dose changes.
4. NEVER diagnose any condition.
5. NEVER contradict the patient's treating clinician.
6. ALWAYS recommend consulting the diabetes care team for any changes.
7. If asked about emergencies (severe hypo, DKA), tell the user to call emergency services immediately.
8. Every response MUST end with the disclaimer.
9. Interpret Dr. Bernstein's principles in layman's terms when relevant.
10. Use the patient's actual data to personalize explanations.`;

const DISCLAIMER =
  "**Disclaimer:** GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice. " +
  "Always consult your diabetes care team before making changes to your management.";

// ─── IOB Calculation ─────────────────────────────────────────

/**
 * Calculate current active Insulin on Board using exponential decay.
 * Uses the patient's DIA (Duration of Insulin Action) setting.
 */
export function calculateActiveIOB(
  doses: InsulinDose[],
  diaMinutes: number,
  now: Date = new Date()
): number {
  if (doses.length === 0 || diaMinutes <= 0) return 0;

  const nowMs = now.getTime();
  let totalIOB = 0;

  for (const dose of doses) {
    if (dose.type !== "bolus") continue; // Only bolus contributes to active IOB

    const doseMs = new Date(dose.timestamp).getTime();
    const elapsedMinutes = (nowMs - doseMs) / 60000;

    if (elapsedMinutes < 0 || elapsedMinutes > diaMinutes) continue;

    // Exponential decay model (Scheiner/Walsh)
    const fraction = elapsedMinutes / diaMinutes;
    const remaining = 1 - fraction * fraction * (3 - 2 * fraction); // S-curve
    totalIOB += dose.amount * remaining;
  }

  return Math.round(totalIOB * 100) / 100;
}

/**
 * Determine glucose trend from the last 3 readings.
 */
export function determineGlucoseTrend(readings: GlucoseReading[]): string {
  if (readings.length < 3) return "insufficient_data";

  const sorted = [...readings].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const latest = sorted[0].value;
  const prev1 = sorted[1].value;
  const prev2 = sorted[2].value;

  const delta1 = latest - prev1;
  const delta2 = prev1 - prev2;
  const avgDelta = (delta1 + delta2) / 2;

  if (avgDelta > 15) return "rising_fast";
  if (avgDelta > 5) return "rising";
  if (avgDelta > -5) return "stable";
  if (avgDelta > -15) return "falling";
  return "falling_fast";
}

// ─── Context Assembly ────────────────────────────────────────

/**
 * Compute all derived metrics from raw patient data.
 */
export function computeMetrics(data: RawPatientData): ComputedMetrics {
  const { profile, glucoseReadings, insulinDoses, meals } = data;

  const now = new Date();
  const h24ago = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const d7ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const readings24h = glucoseReadings.filter(
    (r) => new Date(r.timestamp) >= h24ago
  );
  const readings7d = glucoseReadings.filter(
    (r) => new Date(r.timestamp) >= d7ago
  );

  // Use 7d readings for TIR/variability if available, else 24h
  const analysisReadings = readings7d.length >= 12 ? readings7d : readings24h;

  const tir = calculateTIR(analysisReadings, profile.targetLow, profile.targetHigh);
  const variability = calculateVariability(analysisReadings);
  const hypoRisk = scoreHypoRisk(analysisReadings, profile.targetLow);

  // Current glucose (most recent reading)
  const sorted = [...glucoseReadings].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const currentGlucose = sorted[0] ?? null;
  const glucoseTrend = determineGlucoseTrend(sorted.slice(0, 5));

  // Active IOB
  const recentDoses = insulinDoses.filter(
    (d) => new Date(d.timestamp) >= new Date(now.getTime() - profile.diaMinutes * 60000)
  );
  const activeIOB = calculateActiveIOB(recentDoses, profile.diaMinutes, now);

  // Last dose and meal timestamps
  const sortedDoses = [...insulinDoses].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const sortedMeals = [...meals].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return {
    tir,
    variability,
    hypoRisk,
    currentGlucose,
    glucoseTrend,
    activeIOB,
    readingCount24h: readings24h.length,
    readingCount7d: readings7d.length,
    lastDoseAt: sortedDoses[0]?.timestamp ?? null,
    lastMealAt: sortedMeals[0]?.timestamp ?? null,
  };
}

/**
 * Build the patient summary block for the AI context window.
 */
export function buildPatientSummary(profile: PatientProfile, metrics: ComputedMetrics): string {
  const lines = [
    `PATIENT CONTEXT:`,
    `  Name: ${profile.firstName}`,
    `  Diabetes Type: ${profile.diabetesType}`,
    `  Glucose Unit: ${profile.glucoseUnit}`,
    `  Target Range: ${profile.targetLow}–${profile.targetHigh} ${profile.glucoseUnit}`,
    `  ISF: ${profile.isf} ${profile.glucoseUnit}/unit`,
    `  ICR: 1:${profile.icr} (${profile.icr}g carbs per unit)`,
    `  DIA: ${profile.diaMinutes} minutes (${(profile.diaMinutes / 60).toFixed(1)} hours)`,
    `  CGM Source: ${profile.cgmSource}`,
    `  Last Sync: ${profile.lastSyncAt ?? "never"}`,
  ];

  if (metrics.currentGlucose) {
    lines.push(
      `  Current Glucose: ${metrics.currentGlucose.value} ${profile.glucoseUnit} (${metrics.glucoseTrend.replace(/_/g, " ")})` +
      ` at ${metrics.currentGlucose.timestamp}`
    );
  }

  lines.push(`  Active IOB: ${metrics.activeIOB} units`);

  return lines.join("\n");
}

/**
 * Build the analytics block for the AI context window.
 */
export function buildAnalyticsBlock(metrics: ComputedMetrics): string {
  const { tir, variability, hypoRisk } = metrics;

  return `ANALYTICS (computed from ${metrics.readingCount7d} readings over 7 days):
  Time in Range: ${tir.inRange}%
  Time Below Range: ${tir.low}% (very low: ${tir.veryLow}%)
  Time Above Range: ${tir.high}% (very high: ${tir.veryHigh}%)
  Mean Glucose: ${tir.mean} mg/dL
  GMI (estimated A1C): ${tir.gmi}%
  Coefficient of Variation: ${variability.cv}% ${variability.isHighVariability ? "[HIGH VARIABILITY]" : ""}
  Standard Deviation: ${variability.sd} mg/dL
  MAGE: ${variability.mage} mg/dL
  Hypo Risk Score: ${hypoRisk.score}/100 (${hypoRisk.level})
  Hypo Events: ${hypoRisk.hypoEvents}
  Readings (24h): ${metrics.readingCount24h}
  Readings (7d): ${metrics.readingCount7d}`;
}

/**
 * Build the clinician notes block.
 */
export function buildClinicianNotesBlock(notes: ClinicianNoteSnippet[]): string {
  if (notes.length === 0) return "CLINICIAN NOTES: None on file.";

  const noteLines = notes.map(
    (n, i) => `  ${i + 1}. [${n.category.toUpperCase()}] ${n.body} (${n.createdAt})`
  );

  return `CLINICIAN NOTES (${notes.length} active):\n${noteLines.join("\n")}`;
}

/**
 * Assemble the complete AI context from raw patient data.
 * This is the main entry point for the RAG engine.
 */
export function assembleContext(data: RawPatientData): AssembledContext {
  const metrics = computeMetrics(data);
  const patientSummary = buildPatientSummary(data.profile, metrics);
  const analyticsBlock = buildAnalyticsBlock(metrics);
  const clinicianNotesBlock = buildClinicianNotesBlock(data.clinicianNotes);

  const systemPreamble = `You are GluMira™ AI, a diabetes education assistant powered by IOB Hunter™.
You have access to this patient's real-time glucose data, insulin history, and clinical analytics.
Use this data to provide personalized, evidence-based educational responses.
Reference Dr. Richard Bernstein's "Diabetes Solution" principles when relevant, explained in layman's terms.

${SAFETY_PREAMBLE}`;

  const fullContext = [
    systemPreamble,
    "",
    "─── LIVE PATIENT DATA ───",
    patientSummary,
    "",
    analyticsBlock,
    "",
    clinicianNotesBlock,
    "",
    `DISCLAIMER: ${DISCLAIMER}`,
  ].join("\n");

  // Rough token estimate (1 token ≈ 4 chars)
  const tokenEstimate = Math.ceil(fullContext.length / 4);

  return {
    systemPreamble,
    patientSummary,
    analyticsBlock,
    clinicianNotesBlock,
    safetyBlock: SAFETY_PREAMBLE,
    fullContext,
    metrics,
    tokenEstimate,
  };
}

/**
 * Build messages array for the LLM call, injecting RAG context
 * as the system message and appending the user's question.
 */
export function buildRAGMessages(
  context: AssembledContext,
  userMessage: string,
  chatHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Array<{ role: string; content: string }> {
  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: context.fullContext },
  ];

  // Inject recent chat history (max 10 turns to stay within token budget)
  const recentHistory = chatHistory.slice(-10);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // Add the current user message
  messages.push({ role: "user", content: userMessage });

  return messages;
}
