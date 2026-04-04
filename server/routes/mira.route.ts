/**
 * GluMira™ V7 — server/routes/mira.route.ts
 * Mira AI education assistant — powered by Anthropic Claude
 *
 * GluMira™ is an educational platform, not a medical device.
 * Mira is not a clinician and does not provide medical advice.
 */

import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { MIRA_SYSTEM_PROMPT } from "../config/mira-system-prompt";
import { matchTopics, TopicMatch } from "../lib/mira-topic-matcher";

export const miraRouter = Router();

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Default conversation starters shown in the UI */
const CONVERSATION_STARTERS = [
  "My child was just diagnosed — where do I start?",
  "Can you explain what insulin on board means?",
  "What should I pack in my school diabetes kit?",
  "My teenager is struggling emotionally — how can I help?",
  "What's the difference between hypo and hyper?",
  "Explain the dawn phenomenon to me",
  "How do I handle a sick day with Type 1?",
  "What's the IOB Hunter and how does it work?",
  "My toddler's numbers are all over the place after meals",
  "I'm 15 and scared about telling my friends",
];

/**
 * POST /api/mira/chat
 * Body: { message: string, history?: ChatMessage[] }
 * Returns: { reply, suggestedTopics, suggestedQuestions, usage }
 */
miraRouter.post("/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body as {
      message: string;
      history?: ChatMessage[];
    };

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ error: "message is required" });
    }

    if (message.length > 2000) {
      return res.status(400).json({ error: "Message too long (max 2000 chars)" });
    }

    // Match education topics from the user message
    const suggestedTopics: TopicMatch[] = matchTopics(message);

    // Build message history — keep last 10 turns to stay within context
    const recentHistory = history.slice(-10);

    const messages: ChatMessage[] = [
      ...recentHistory,
      { role: "user", content: message.trim() },
    ];

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: MIRA_SYSTEM_PROMPT,
      messages,
    });

    const reply =
      response.content[0]?.type === "text"
        ? response.content[0].text
        : "Sorry, I couldn't generate a response. Please try again.";

    // Generate follow-up suggested questions based on matched topics
    const suggestedQuestions = buildSuggestedQuestions(suggestedTopics, message);

    return res.json({
      reply,
      suggestedTopics,
      suggestedQuestions,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    });
  } catch (err: any) {
    console.error("[mira] POST /chat", err.message);

    if (err?.status === 401) {
      return res.status(500).json({ error: "AI service not configured" });
    }
    if (err?.status === 429) {
      return res.status(429).json({ error: "Rate limit reached, please wait a moment" });
    }

    return res.status(500).json({ error: "Mira is unavailable right now" });
  }
});

/**
 * GET /api/mira/suggestions
 * Returns conversation starters and popular topics for the UI.
 */
miraRouter.get("/suggestions", (_req, res) => {
  return res.json({
    conversationStarters: CONVERSATION_STARTERS,
    popularTopics: [
      { id: 7, title: "Hypo vs Hyper — knowing the difference and what to do", group: "A" },
      { id: 51, title: "What is Insulin On Board and why does it matter?", group: "F" },
      { id: 61, title: "Carb counting basics", group: "G" },
      { id: 72, title: "DKA warning signs", group: "H" },
      { id: 81, title: "Diabetes burnout", group: "I" },
      { id: 93, title: "CGM basics — Dexcom, Libre, and others", group: "J" },
    ],
  });
});

/**
 * GET /api/mira/health
 * Quick check that the Anthropic key is configured.
 */
miraRouter.get("/health", (_req, res) => {
  const configured = Boolean(process.env.ANTHROPIC_API_KEY);
  return res.json({
    status: configured ? "ok" : "unconfigured",
    model: "claude-sonnet-4-20250514",
  });
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build 2-3 follow-up questions based on matched topics */
function buildSuggestedQuestions(
  topics: TopicMatch[],
  _originalMessage: string,
): string[] {
  const questions: string[] = [];

  for (const topic of topics) {
    switch (topic.group) {
      case "A":
        questions.push(`Tell me more about Topic ${topic.id}: ${topic.title}`);
        break;
      case "B":
        questions.push(`How do I handle this with a young child? (Topic ${topic.id})`);
        break;
      case "C":
        questions.push(`What should I tell the school about this? (Topic ${topic.id})`);
        break;
      case "D":
        questions.push(`How does this change during puberty? (Topic ${topic.id})`);
        break;
      case "E":
        questions.push(`What should teens know about this? (Topic ${topic.id})`);
        break;
      case "F":
        questions.push(`Can you show me how the IOB Hunter helps with this? (Topic ${topic.id})`);
        break;
      case "G":
        questions.push(`What are some practical meal tips for this? (Topic ${topic.id})`);
        break;
      case "H":
        questions.push(`What's the emergency plan for this? (Topic ${topic.id})`);
        break;
      case "I":
        questions.push(`How can I get emotional support for this? (Topic ${topic.id})`);
        break;
      case "J":
        questions.push(`Explain the clinical side of this simply (Topic ${topic.id})`);
        break;
      default:
        questions.push(`Tell me more about Topic ${topic.id}: ${topic.title}`);
    }
  }

  // If no topics matched, offer general starters
  if (questions.length === 0) {
    questions.push(
      "What topics can you help me with?",
      "Can you explain insulin on board?",
      "What should I know about hypos?",
    );
  }

  return questions.slice(0, 3);
}
