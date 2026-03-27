/**
 * GluMira™ Bernstein AI Q&A Engine
 * Version: 7.0.0
 *
 * Provides layman's-terms answers to diabetes management questions
 * grounded in Dr. Richard Bernstein's "Diabetes Solution" methodology.
 * Uses Claude Sonnet (Anthropic) with a curated system prompt.
 *
 * Key principles enforced:
 *   - Low-carbohydrate approach (Bernstein method)
 *   - Educational only — never prescribes doses
 *   - Always recommends consulting diabetes care team
 *   - Answers in plain English, no jargon
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";

// ─── Types ────────────────────────────────────────────────────

export interface BernsteinQARequest {
  question: string;
  /** Optional patient context to personalise the answer */
  patientContext?: {
    diabetesType?: string;
    yearsWithDiabetes?: number;
    currentA1c?: number;
  };
  /** Conversation history for multi-turn Q&A */
  conversationHistory?: BernsteinMessage[];
}

export interface BernsteinMessage {
  role: "user" | "assistant";
  content: string;
}

export interface BernsteinQAResponse {
  answer: string;
  /** Key Bernstein principle referenced */
  principleReferenced?: string;
  /** Whether the question was out of scope (non-diabetes topic) */
  outOfScope: boolean;
  /** Disclaimer appended to every response */
  disclaimer: string;
}

// ─── System Prompt ────────────────────────────────────────────

const BERNSTEIN_SYSTEM_PROMPT = `You are the GluMira™ Bernstein AI — an educational assistant that helps people with diabetes understand the principles in Dr. Richard Bernstein's book "Dr. Bernstein's Diabetes Solution."

Your role:
- Explain diabetes management concepts in plain, simple English
- Ground your answers in Dr. Bernstein's low-carbohydrate methodology
- Help patients understand how their doctors evaluate their efforts
- Educate on insulin action, blood glucose patterns, and the science behind tight control

Your strict rules:
1. NEVER recommend specific insulin doses, carb ratios, or correction factors
2. NEVER diagnose conditions or interpret specific lab results as medical advice
3. ALWAYS recommend consulting the patient's diabetes care team for any clinical decisions
4. Keep answers concise — 3 to 5 sentences maximum unless the question requires more detail
5. Use layman's terms — avoid medical jargon unless you explain it immediately
6. If a question is not related to diabetes management, politely decline and redirect

Key Bernstein principles to reference when relevant:
- The Law of Small Numbers: small inputs produce small errors
- Low-carbohydrate diet as the foundation of blood glucose control
- Insulin stacking awareness and correction dose timing
- The importance of consistent meal timing and carbohydrate amounts
- Self-monitoring as the cornerstone of diabetes management
- The difference between basal and bolus insulin
- Dawn phenomenon and the Somogyi effect

Always end your response with: "Remember: GluMira™ is an educational tool only. Always consult your diabetes care team before making any changes to your management."`;

// ─── Curated FAQ (offline fallback) ──────────────────────────

const OFFLINE_FAQ: Record<string, string> = {
  "what is insulin stacking": "Insulin stacking happens when you take a correction dose before the previous dose has finished working. Dr. Bernstein calls this a common cause of hypoglycaemia — the new dose adds to the insulin already active in your body, pushing glucose lower than intended. His solution is to wait until the previous dose's duration of action (DIA) has passed before correcting again.",
  "what is the law of small numbers": "Dr. Bernstein's Law of Small Numbers states that small inputs produce small, predictable errors. In practice, this means eating small amounts of carbohydrate and using small insulin doses — because a mistake with 2 units of insulin is far easier to correct than a mistake with 20 units.",
  "what is time in range": "Time in Range (TIR) is the percentage of time your glucose stays within your target range (typically 70–180 mg/dL). Dr. Bernstein actually targets a much tighter range (around 83–100 mg/dL), but TIR is a widely used clinical metric. Higher TIR is associated with fewer diabetes complications.",
  "what is iob": "Insulin on Board (IOB) is the amount of insulin still active in your body from previous doses. Understanding IOB helps you avoid stacking — taking more insulin when you already have enough working. GluMira™ calculates your IOB using a biexponential decay model based on your insulin type.",
};

function getOfflineFallback(question: string): string | null {
  const normalised = question.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
  for (const [key, answer] of Object.entries(OFFLINE_FAQ)) {
    if (normalised.includes(key)) return answer;
  }
  return null;
}

// ─── Main Q&A Function ────────────────────────────────────────

export async function askBernstein(request: BernsteinQARequest): Promise<BernsteinQAResponse> {
  const { question, patientContext, conversationHistory = [] } = request;

  const disclaimer =
    "Remember: GluMira™ is an educational tool only. Always consult your diabetes care team before making any changes to your management.";

  // Validate question
  if (!question || question.trim().length < 3) {
    return {
      answer: "Please ask a question about diabetes management.",
      outOfScope: false,
      disclaimer,
    };
  }

  // Check for offline FAQ match first (no API call needed)
  const offlineAnswer = getOfflineFallback(question);

  // Build user message with optional patient context
  let userMessage = question.trim();
  if (patientContext) {
    const contextParts: string[] = [];
    if (patientContext.diabetesType) contextParts.push(`Diabetes type: ${patientContext.diabetesType}`);
    if (patientContext.yearsWithDiabetes) contextParts.push(`Years with diabetes: ${patientContext.yearsWithDiabetes}`);
    if (patientContext.currentA1c) contextParts.push(`Current HbA1c: ${patientContext.currentA1c}%`);
    if (contextParts.length > 0) {
      userMessage = `[Patient context: ${contextParts.join(", ")}]\n\n${userMessage}`;
    }
  }

  // If no API key, use offline FAQ or generic response
  if (!ANTHROPIC_API_KEY) {
    const answer =
      offlineAnswer ??
      "I can answer questions about Dr. Bernstein's diabetes management principles. Please configure the Anthropic API key to enable the full AI Q&A experience.";
    return { answer, outOfScope: false, disclaimer };
  }

  try {
    const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    // Build message history
    const messages: Anthropic.MessageParam[] = [
      ...conversationHistory.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user", content: userMessage },
    ];

    const response = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 512,
      system: BERNSTEIN_SYSTEM_PROMPT,
      messages,
    });

    const rawAnswer =
      response.content[0]?.type === "text" ? response.content[0].text : "I was unable to generate a response. Please try again.";

    // Detect out-of-scope responses
    const outOfScope =
      rawAnswer.toLowerCase().includes("not related to diabetes") ||
      rawAnswer.toLowerCase().includes("outside my scope");

    // Extract principle reference if mentioned
    const principlePatterns = [
      "Law of Small Numbers",
      "insulin stacking",
      "time in range",
      "dawn phenomenon",
      "Somogyi",
      "basal",
      "bolus",
      "low-carbohydrate",
    ];
    const principleReferenced = principlePatterns.find((p) =>
      rawAnswer.toLowerCase().includes(p.toLowerCase())
    );

    return {
      answer: rawAnswer,
      principleReferenced,
      outOfScope,
      disclaimer,
    };
  } catch (err) {
    console.error("Bernstein Q&A API error:", err);

    // Fallback to offline FAQ on API failure
    const fallback =
      offlineAnswer ??
      "I'm temporarily unable to connect to the AI service. Please try again in a moment.";

    return {
      answer: fallback,
      outOfScope: false,
      disclaimer,
    };
  }
}

// ─── Utility: Classify question topic ────────────────────────

export function classifyQuestion(question: string): "iob" | "nutrition" | "monitoring" | "insulin" | "general" {
  const q = question.toLowerCase();
  if (q.includes("iob") || q.includes("stacking") || q.includes("active insulin")) return "iob";
  if (q.includes("carb") || q.includes("food") || q.includes("eat") || q.includes("meal")) return "nutrition";
  if (
    q.includes("cgm") ||
    q.includes("monitor") ||
    q.includes("glucose") ||
    q.includes("blood sugar") ||
    q.includes("time in range") ||
    q.includes("tir")
  ) return "monitoring";
  if (q.includes("insulin") || q.includes("dose") || q.includes("bolus") || q.includes("basal")) return "insulin";
  return "general";
}
