/**
 * GluMira™ Bernstein QA Engine (Enhanced)
 * Version: 7.0.0
 * Module: AI-BERNSTEIN-QA-V2
 *
 * Enables patients to ask questions about Dr. Richard Bernstein's
 * "Diabetes Solution" and receive answers in plain, layman's terms —
 * personalized with their own glucose/insulin data via the RAG engine.
 *
 * Key design principle (from user knowledge):
 *   "Enable patients to check and search book content by asking questions,
 *    without the pressure of reading the entire book. The AI should read
 *    and interpret the content in layman's terms."
 *
 * Features:
 *   - Chapter-indexed knowledge base covering all key Bernstein principles
 *   - Semantic topic matching to find relevant chapters
 *   - RAG context injection — answers reference the patient's actual data
 *   - Layman's term translation of medical concepts
 *   - Offline FAQ fallback when API is unavailable
 *   - Safety guardrails: never contradicts treating clinician
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { assembleContext, type RawPatientData, type AssembledContext } from "./rag-context-engine";

// ─── Types ───────────────────────────────────────────────────

export interface BernsteinChapter {
  chapter: number;
  title: string;
  keyPrinciples: string[];
  topics: string[];
  laymanSummary: string;
}

export interface BernsteinAnswer {
  answer: string;
  chaptersReferenced: number[];
  principlesApplied: string[];
  personalizedInsight: string | null;
  outOfScope: boolean;
  disclaimer: string;
}

export interface BernsteinQuery {
  question: string;
  patientData?: RawPatientData;
  chatHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

// ─── Knowledge Base ──────────────────────────────────────────
// Indexed by chapter, covering the core principles patients ask about.

export const BERNSTEIN_CHAPTERS: BernsteinChapter[] = [
  {
    chapter: 1,
    title: "Diabetes: The Basics",
    keyPrinciples: ["Blood sugar normalization is the primary goal", "Normal blood sugars prevent complications"],
    topics: ["diabetes basics", "what is diabetes", "blood sugar", "glucose", "type 1", "type 2"],
    laymanSummary: "Diabetes means your body can't regulate blood sugar properly. The goal is to keep blood sugar as close to normal as possible — this prevents the long-term complications that cause real damage.",
  },
  {
    chapter: 3,
    title: "The Laws of Small Numbers",
    keyPrinciples: [
      "Small inputs make small mistakes",
      "Large inputs (carbs or insulin) make large, unpredictable mistakes",
      "Reduce carb intake to reduce insulin doses to reduce variability",
    ],
    topics: ["law of small numbers", "small numbers", "variability", "unpredictable", "big swings", "carb reduction", "dose size"],
    laymanSummary: "The Law of Small Numbers is Bernstein's most important concept: if you eat fewer carbs, you need less insulin. Less insulin means smaller errors. Smaller errors mean more stable blood sugars. It's like steering a small boat vs. a cruise ship — small corrections are easier to make.",
  },
  {
    chapter: 5,
    title: "Monitoring Blood Sugar",
    keyPrinciples: [
      "Test frequently — at least before and after meals",
      "CGM provides continuous visibility",
      "Patterns matter more than individual readings",
    ],
    topics: ["monitoring", "testing", "cgm", "continuous glucose", "fingerstick", "patterns", "time in range", "tir"],
    laymanSummary: "You can't manage what you can't measure. Frequent testing (or CGM) shows you patterns — not just single numbers. Look for trends: are you consistently high after breakfast? That's a pattern you can fix.",
  },
  {
    chapter: 7,
    title: "The Basic Food Groups",
    keyPrinciples: [
      "Protein has minimal effect on blood sugar",
      "Fat has virtually no effect on blood sugar",
      "Carbohydrates have the most direct and rapid effect",
    ],
    topics: ["food", "diet", "carbs", "protein", "fat", "nutrition", "eating", "meal", "food groups"],
    laymanSummary: "Not all food affects blood sugar equally. Carbs hit fastest and hardest. Protein has a slow, small effect. Fat barely moves the needle. This is why Bernstein focuses on reducing carbs — they're the main driver of blood sugar spikes.",
  },
  {
    chapter: 9,
    title: "The Basic Meal Plan",
    keyPrinciples: [
      "6g carbs at breakfast, 12g at lunch, 12g at dinner",
      "Consistency in carb intake makes dosing predictable",
      "Avoid foods that spike blood sugar rapidly",
    ],
    topics: ["meal plan", "how many carbs", "breakfast", "lunch", "dinner", "meal timing", "carb counting", "carb limit"],
    laymanSummary: "Bernstein recommends very low carbs: about 6g at breakfast (when you're most insulin resistant) and 12g each at lunch and dinner. The key is consistency — eating the same amount of carbs at each meal makes your insulin doses predictable.",
  },
  {
    chapter: 11,
    title: "Insulin: The Basics",
    keyPrinciples: [
      "Basal insulin covers background glucose production",
      "Bolus insulin covers meals",
      "Timing of injection matters — inject before eating",
      "Insulin stacking is dangerous",
    ],
    topics: ["insulin", "basal", "bolus", "injection", "timing", "stacking", "iob", "insulin on board", "active insulin", "dose"],
    laymanSummary: "There are two types of insulin: basal (the slow background one) and bolus (the fast mealtime one). The key danger is 'stacking' — taking a correction dose before the previous one has finished working. This is where IOB tracking becomes critical.",
  },
  {
    chapter: 13,
    title: "Using Insulin to Cover Meals",
    keyPrinciples: [
      "Insulin-to-carb ratio (ICR) determines mealtime dose",
      "ISF determines correction dose",
      "Always account for IOB before correcting",
    ],
    topics: ["icr", "insulin to carb", "carb ratio", "correction", "isf", "sensitivity", "bolus calculation", "dose calculation"],
    laymanSummary: "Your ICR tells you how many grams of carbs one unit of insulin covers. Your ISF tells you how much one unit drops your blood sugar. Before taking a correction, always check how much insulin is still active (IOB) — otherwise you risk stacking and going low.",
  },
  {
    chapter: 15,
    title: "Hypoglycemia",
    keyPrinciples: [
      "Treat hypos with glucose tablets — precise and fast",
      "Do NOT over-treat with juice or candy",
      "Prevention through small doses and IOB awareness",
    ],
    topics: ["hypo", "hypoglycemia", "low blood sugar", "going low", "treatment", "glucose tablets", "emergency"],
    laymanSummary: "When blood sugar drops too low, use glucose tablets — they're precise. Don't grab juice or candy because you'll overshoot and spike high. The best treatment is prevention: smaller insulin doses and always knowing your IOB.",
  },
  {
    chapter: 17,
    title: "The Dawn Phenomenon",
    keyPrinciples: [
      "Morning blood sugar rise caused by growth hormone and cortisol",
      "Requires adjusted basal rates or early morning bolus",
      "Breakfast insulin resistance is highest",
    ],
    topics: ["dawn phenomenon", "morning high", "morning spike", "waking up high", "fasting glucose", "cortisol"],
    laymanSummary: "Many people wake up with high blood sugar even without eating — this is the dawn phenomenon. Your body releases hormones in the early morning that push glucose up. This is why breakfast needs the least carbs and sometimes extra insulin coverage.",
  },
  {
    chapter: 19,
    title: "Exercise and Blood Sugar",
    keyPrinciples: [
      "Exercise can lower blood sugar for hours",
      "Intense exercise can temporarily raise blood sugar",
      "Reduce insulin or eat extra carbs before exercise",
    ],
    topics: ["exercise", "workout", "physical activity", "sport", "running", "gym", "activity"],
    laymanSummary: "Exercise usually lowers blood sugar, sometimes for hours afterward. But intense exercise (like sprinting) can temporarily spike it due to adrenaline. The key is testing before, during, and after — and adjusting insulin or carbs accordingly.",
  },
  {
    chapter: 21,
    title: "Sick Days",
    keyPrinciples: [
      "Illness raises blood sugar due to stress hormones",
      "Never skip basal insulin when sick",
      "Test more frequently during illness",
    ],
    topics: ["sick", "illness", "fever", "infection", "sick day", "stress", "ketones"],
    laymanSummary: "When you're sick, stress hormones push blood sugar up — even if you're not eating. Never skip your basal insulin. Test more often. If blood sugar stays very high and you have ketones, contact your doctor immediately.",
  },
];

// ─── Topic Matching ──────────────────────────────────────────

/**
 * Find relevant Bernstein chapters based on the user's question.
 * Uses keyword matching against chapter topics and principles.
 */
export function findRelevantChapters(question: string): BernsteinChapter[] {
  const q = question.toLowerCase();
  const scored: Array<{ chapter: BernsteinChapter; score: number }> = [];

  for (const ch of BERNSTEIN_CHAPTERS) {
    let score = 0;

    // Topic match (highest weight)
    for (const topic of ch.topics) {
      if (q.includes(topic.toLowerCase())) {
        score += 10;
      }
    }

    // Principle match
    for (const principle of ch.keyPrinciples) {
      const words = principle.toLowerCase().split(/\s+/);
      const matchedWords = words.filter((w) => w.length > 3 && q.includes(w));
      score += matchedWords.length * 3;
    }

    // Title match
    if (q.includes(ch.title.toLowerCase())) {
      score += 15;
    }

    if (score > 0) {
      scored.push({ chapter: ch, score });
    }
  }

  // Sort by score descending, return top 3
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 3).map((s) => s.chapter);
}

// ─── System Prompt Builder ───────────────────────────────────

const BERNSTEIN_SYSTEM_PROMPT = `You are GluMira™ AI, answering questions about Dr. Richard Bernstein's "Diabetes Solution".

YOUR ROLE:
- Explain Bernstein's principles in simple, everyday language (layman's terms)
- Reference specific chapters when relevant
- Use the patient's actual glucose/insulin data to personalize your explanation
- Make complex medical concepts accessible to someone with no medical background

RULES:
- NEVER suggest specific insulin doses
- NEVER diagnose conditions
- NEVER contradict the patient's treating clinician
- If a question is outside Bernstein's scope, say so clearly
- Always recommend consulting the diabetes care team for changes
- End every response with the disclaimer

TONE: Warm, supportive, educational — like a knowledgeable friend explaining things simply.`;

/**
 * Build the Bernstein QA system prompt with relevant chapter context.
 */
export function buildBernsteinPrompt(
  question: string,
  chapters: BernsteinChapter[],
  patientContext?: AssembledContext
): string {
  const parts: string[] = [BERNSTEIN_SYSTEM_PROMPT];

  // Inject relevant chapter knowledge
  if (chapters.length > 0) {
    parts.push("\nRELEVANT BERNSTEIN CHAPTERS:");
    for (const ch of chapters) {
      parts.push(`\nChapter ${ch.chapter}: ${ch.title}`);
      parts.push(`Key Principles:`);
      ch.keyPrinciples.forEach((p) => parts.push(`  - ${p}`));
      parts.push(`Layman Summary: ${ch.laymanSummary}`);
    }
  }

  // Inject patient context if available
  if (patientContext) {
    parts.push("\n" + patientContext.patientSummary);
    parts.push(patientContext.analyticsBlock);
  }

  return parts.join("\n");
}

// ─── Offline FAQ ─────────────────────────────────────────────

const OFFLINE_FAQ: Array<{ patterns: string[]; answer: string; chapters: number[] }> = [
  {
    patterns: ["law of small numbers", "small numbers"],
    answer: "The Law of Small Numbers is Dr. Bernstein's core principle: if you eat fewer carbs, you need less insulin. Less insulin means smaller dosing errors. Smaller errors mean more stable blood sugars. Think of it like steering — a kayak is easier to control than a cruise ship.",
    chapters: [3],
  },
  {
    patterns: ["iob", "insulin on board", "stacking", "active insulin"],
    answer: "Insulin on Board (IOB) is the amount of insulin still active in your body from previous doses. Taking more insulin before the previous dose has finished working is called 'stacking' — and it's one of the most common causes of dangerous lows. Always check your IOB before correcting a high.",
    chapters: [11, 13],
  },
  {
    patterns: ["dawn phenomenon", "morning high", "waking up high"],
    answer: "The dawn phenomenon is when your blood sugar rises in the early morning — even without eating. It's caused by hormones (cortisol and growth hormone) that your body releases before waking. This is why Bernstein recommends the fewest carbs at breakfast and sometimes extra insulin coverage.",
    chapters: [17],
  },
  {
    patterns: ["how many carbs", "carb limit", "meal plan"],
    answer: "Dr. Bernstein recommends about 6 grams of carbs at breakfast (when insulin resistance is highest), and 12 grams each at lunch and dinner — totaling about 30 grams per day. The key is consistency: eating the same amount at each meal makes your insulin doses predictable.",
    chapters: [9],
  },
  {
    patterns: ["hypo", "low blood sugar", "going low"],
    answer: "When your blood sugar drops too low, use glucose tablets — they're precise and fast-acting. Don't grab juice or candy because you'll likely overshoot and spike high. Bernstein says the best treatment for hypos is prevention: use smaller insulin doses and always know your IOB.",
    chapters: [15],
  },
  {
    patterns: ["exercise", "workout", "physical activity"],
    answer: "Exercise usually lowers blood sugar, sometimes for hours afterward. But intense exercise (like sprinting or heavy lifting) can temporarily spike it due to adrenaline. Test before, during, and after exercise. You may need to reduce insulin or eat extra carbs before working out.",
    chapters: [19],
  },
  {
    patterns: ["icr", "carb ratio", "insulin to carb"],
    answer: "Your Insulin-to-Carb Ratio (ICR) tells you how many grams of carbs one unit of insulin covers. For example, if your ICR is 1:10, one unit covers 10 grams of carbs. This is used to calculate your mealtime bolus dose. Always account for IOB before adding a correction on top.",
    chapters: [13],
  },
  {
    patterns: ["isf", "sensitivity factor", "correction factor"],
    answer: "Your Insulin Sensitivity Factor (ISF) tells you how much one unit of insulin will lower your blood sugar. For example, if your ISF is 50 mg/dL, one unit will drop you by about 50 points. This is used for correction doses — but always subtract your IOB first.",
    chapters: [13],
  },
];

/**
 * Try to answer from the offline FAQ when the API is unavailable.
 */
export function getOfflineAnswer(question: string): { answer: string; chapters: number[] } | null {
  const q = question.toLowerCase();
  for (const faq of OFFLINE_FAQ) {
    if (faq.patterns.some((p) => q.includes(p))) {
      return { answer: faq.answer, chapters: faq.chapters };
    }
  }
  return null;
}

// ─── Scope Detection ─────────────────────────────────────────

const OUT_OF_SCOPE_PATTERNS = [
  /prescri(be|ption)/i,
  /diagnos(e|is)/i,
  /should i (take|stop|change|increase|decrease)/i,
  /what dose should/i,
  /am i (diabetic|sick|dying)/i,
  /cure for diabetes/i,
  /weight loss (drug|medication|pill)/i,
  /ozempic|mounjaro|wegovy/i,
];

/**
 * Check if a question is outside the scope of Bernstein QA.
 */
export function isOutOfScope(question: string): boolean {
  return OUT_OF_SCOPE_PATTERNS.some((p) => p.test(question));
}

// ─── Main Query Function ─────────────────────────────────────

const DISCLAIMER =
  "**Disclaimer:** This information is based on Dr. Bernstein's educational principles. " +
  "GluMira™ is an educational platform only — not a medical device. " +
  "Always consult your diabetes care team before making changes to your management.";

/**
 * Process a Bernstein QA query with RAG context injection.
 * This is the main entry point for the Bernstein QA feature.
 */
export async function processBernsteinQuery(
  query: BernsteinQuery,
  invokeLLM: (messages: Array<{ role: string; content: string }>) => Promise<string>
): Promise<BernsteinAnswer> {
  const { question, patientData, chatHistory } = query;

  // Check scope
  if (isOutOfScope(question)) {
    return {
      answer: "That question is outside what I can help with. I can explain Dr. Bernstein's educational principles about diabetes management, but I cannot provide medical advice, diagnoses, or specific dose recommendations. Please consult your diabetes care team for personalized medical guidance.",
      chaptersReferenced: [],
      principlesApplied: [],
      personalizedInsight: null,
      outOfScope: true,
      disclaimer: DISCLAIMER,
    };
  }

  // Find relevant chapters
  const chapters = findRelevantChapters(question);

  // Build patient context if available
  let patientContext: AssembledContext | undefined;
  if (patientData) {
    patientContext = assembleContext(patientData);
  }

  // Build system prompt with chapter knowledge + patient data
  const systemPrompt = buildBernsteinPrompt(question, chapters, patientContext);

  // Build messages
  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  // Add chat history (max 6 turns for Bernstein QA)
  if (chatHistory) {
    const recent = chatHistory.slice(-6);
    for (const msg of recent) {
      messages.push({ role: msg.role, content: msg.content });
    }
  }

  messages.push({ role: "user", content: question });

  try {
    const rawAnswer = await invokeLLM(messages);

    // Extract referenced principles
    const principlesApplied: string[] = [];
    for (const ch of chapters) {
      for (const principle of ch.keyPrinciples) {
        if (rawAnswer.toLowerCase().includes(principle.toLowerCase().split(" ").slice(0, 3).join(" "))) {
          principlesApplied.push(principle);
        }
      }
    }

    // Generate personalized insight if patient data is available
    let personalizedInsight: string | null = null;
    if (patientContext) {
      const { metrics } = patientContext;
      if (metrics.tir.inRange < 70) {
        personalizedInsight = `Based on your data, your Time in Range is ${metrics.tir.inRange}% — the Law of Small Numbers could help improve this.`;
      } else if (metrics.variability.isHighVariability) {
        personalizedInsight = `Your glucose variability (CV: ${metrics.variability.cv}%) is high. Bernstein's approach of consistent carb intake could help stabilize this.`;
      } else if (metrics.hypoRisk.level === "high" || metrics.hypoRisk.level === "critical") {
        personalizedInsight = `Your hypo risk score is ${metrics.hypoRisk.score}/100. Bernstein emphasizes prevention through smaller doses and IOB awareness.`;
      }
    }

    return {
      answer: rawAnswer,
      chaptersReferenced: chapters.map((c) => c.chapter),
      principlesApplied,
      personalizedInsight,
      outOfScope: false,
      disclaimer: DISCLAIMER,
    };
  } catch (err) {
    // Fallback to offline FAQ
    const offline = getOfflineAnswer(question);
    if (offline) {
      return {
        answer: offline.answer,
        chaptersReferenced: offline.chapters,
        principlesApplied: [],
        personalizedInsight: null,
        outOfScope: false,
        disclaimer: DISCLAIMER,
      };
    }

    return {
      answer: "I'm temporarily unable to connect to the AI service. Please try again in a moment. In the meantime, you can browse the chapter summaries in the Bernstein Library section.",
      chaptersReferenced: [],
      principlesApplied: [],
      personalizedInsight: null,
      outOfScope: false,
      disclaimer: DISCLAIMER,
    };
  }
}

/**
 * Get all chapter summaries for the Bernstein Library browse view.
 */
export function getAllChapterSummaries(): Array<{
  chapter: number;
  title: string;
  summary: string;
  topics: string[];
}> {
  return BERNSTEIN_CHAPTERS.map((ch) => ({
    chapter: ch.chapter,
    title: ch.title,
    summary: ch.laymanSummary,
    topics: ch.topics,
  }));
}
