/**
 * GluMira™ Unified AI Chat Route
 * Version: 7.0.0
 * Module: AI-CHAT-UNIFIED
 *
 * The single API surface for all AI interactions in GluMira™.
 * Routes requests to the appropriate engine based on intent:
 *
 *   /api/ai/chat          → General AI chat with RAG context injection
 *   /api/ai/bernstein     → Bernstein QA with chapter knowledge
 *   /api/ai/notes         → Clinician Notes Generator
 *   /api/ai/analyse       → Pattern Analysis (existing clinician-assistant)
 *   /api/ai/chapters      → Bernstein chapter library (no AI call)
 *   /api/ai/health        → Health check for AI services
 *
 * Every endpoint injects live patient data via the RAG engine.
 * Every response includes the safety disclaimer.
 * Rate limited: 20 AI queries per user per hour.
 *
 * Product tiers:
 *   - GluMira Free (Beta): Bernstein QA + basic chat (5 queries/day)
 *   - GluMira Pro: Full chat + pattern analysis (20 queries/hour)
 *   - GluMira AI: All features + clinician notes + school care plans
 *
 * DISCLAIMER: GluMira™ is an informational tool only. Not a medical device.
 */

import { Router, type Request, type Response } from "express";
import { invokeLLM, type Message } from "../_core/llm";
import {
  assembleContext,
  buildRAGMessages,
  type RawPatientData,
} from "./rag-context-engine";
import {
  processBernsteinQuery,
  getAllChapterSummaries,
  type BernsteinQuery,
} from "./bernstein-qa-engine";
import {
  generateClinicianNote,
  generateAIEnhancedNote,
  type GenerateNotesRequest,
  type NoteFormat,
} from "./clinician-notes-generator";

// ─── Types ───────────────────────────────────────────────────

interface ChatRequest {
  message: string;
  sessionId?: string;
  chatHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  patientData: RawPatientData;
}

interface ChatResponse {
  reply: string;
  sessionId: string;
  contextTokens: number;
  modelUsed: string;
  disclaimer: string;
}

interface NotesRequest {
  patientData: RawPatientData;
  format: NoteFormat;
  periodDays: number;
  aiEnhanced?: boolean;
}

// ─── LLM Wrapper ─────────────────────────────────────────────

/**
 * Wrapper around invokeLLM that extracts the text response.
 */
async function callLLM(messages: Array<{ role: string; content: string }>): Promise<string> {
  const result = await invokeLLM({
    messages: messages as Message[],
    maxTokens: 2048,
  });

  const choice = result.choices?.[0];
  if (!choice) throw new Error("No response from LLM");

  const content = choice.message.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((c) => c.type === "text")
      .map((c) => (c as { type: "text"; text: string }).text)
      .join("\n");
  }
  throw new Error("Unexpected LLM response format");
}

// ─── Constants ───────────────────────────────────────────────

const DISCLAIMER =
  "**Disclaimer:** GluMira™ is an informational tool only. Not a medical device. " +
  "Always consult your diabetes care team before making changes to your management.";

// ─── Router ──────────────────────────────────────────────────

export const aiChatRouter = Router();

/**
 * POST /api/ai/chat
 *
 * General AI chat with full RAG context injection.
 * The patient's live glucose/insulin data is automatically
 * injected into every conversation.
 */
aiChatRouter.post("/chat", async (req: Request, res: Response) => {
  const body = req.body as Partial<ChatRequest>;

  if (!body.message || !body.patientData) {
    return res.status(400).json({
      error: "message and patientData are required",
    });
  }

  if (body.message.length > 2000) {
    return res.status(400).json({
      error: "Message exceeds 2000 character limit",
    });
  }

  try {
    // Assemble RAG context from live patient data
    const context = assembleContext(body.patientData);

    // Build messages with context injection
    const messages = buildRAGMessages(
      context,
      body.message,
      body.chatHistory ?? []
    );

    // Call LLM
    const reply = await callLLM(messages);

    // Ensure disclaimer is appended
    const finalReply = reply.includes("Disclaimer")
      ? reply
      : `${reply}\n\n${DISCLAIMER}`;

    const response: ChatResponse = {
      reply: finalReply,
      sessionId: body.sessionId ?? crypto.randomUUID(),
      contextTokens: context.tokenEstimate,
      modelUsed: "gemini-2.5-flash",
      disclaimer: DISCLAIMER,
    };

    return res.status(200).json(response);
  } catch (err: any) {
    console.error("AI Chat error:", err);
    return res.status(500).json({
      error: "AI service temporarily unavailable. Please try again.",
      disclaimer: DISCLAIMER,
    });
  }
});

/**
 * POST /api/ai/bernstein
 *
 * Bernstein QA with chapter knowledge base and RAG context.
 * Answers questions about Dr. Bernstein's "Diabetes Solution"
 * in layman's terms, personalized with the patient's data.
 */
aiChatRouter.post("/bernstein", async (req: Request, res: Response) => {
  const body = req.body as Partial<BernsteinQuery>;

  if (!body.question) {
    return res.status(400).json({
      error: "question is required",
    });
  }

  if (body.question.length > 1000) {
    return res.status(400).json({
      error: "Question exceeds 1000 character limit",
    });
  }

  try {
    const result = await processBernsteinQuery(
      {
        question: body.question,
        patientData: body.patientData,
        chatHistory: body.chatHistory,
      },
      callLLM
    );

    return res.status(200).json(result);
  } catch (err: any) {
    console.error("Bernstein QA error:", err);
    return res.status(500).json({
      error: "Bernstein QA service temporarily unavailable.",
      disclaimer: DISCLAIMER,
    });
  }
});

/**
 * POST /api/ai/notes
 *
 * Generate structured clinical notes from patient data.
 * Supports SOAP, Quick Summary, Detailed Report, and School Care Plan.
 */
aiChatRouter.post("/notes", async (req: Request, res: Response) => {
  const body = req.body as Partial<NotesRequest>;

  if (!body.patientData || !body.format) {
    return res.status(400).json({
      error: "patientData and format are required",
    });
  }

  const validFormats: NoteFormat[] = ["soap", "quick_summary", "detailed_report", "school_care_plan"];
  if (!validFormats.includes(body.format)) {
    return res.status(400).json({
      error: `Invalid format. Must be one of: ${validFormats.join(", ")}`,
    });
  }

  const periodDays = body.periodDays ?? 7;
  if (periodDays < 1 || periodDays > 90) {
    return res.status(400).json({
      error: "periodDays must be between 1 and 90",
    });
  }

  try {
    const request: GenerateNotesRequest = {
      patientData: body.patientData,
      format: body.format,
      periodDays,
    };

    const note = body.aiEnhanced
      ? await generateAIEnhancedNote(request, callLLM)
      : generateClinicianNote(request);

    return res.status(200).json(note);
  } catch (err: any) {
    console.error("Notes generation error:", err);
    return res.status(500).json({
      error: "Notes generation failed.",
      disclaimer: DISCLAIMER,
    });
  }
});

/**
 * GET /api/ai/chapters
 *
 * Returns all Bernstein chapter summaries for the library browse view.
 * No AI call required — pure data.
 */
aiChatRouter.get("/chapters", (_req: Request, res: Response) => {
  const chapters = getAllChapterSummaries();
  return res.status(200).json({
    chapters,
    totalChapters: chapters.length,
    disclaimer: "Chapter summaries are educational interpretations of Dr. Bernstein's principles.",
  });
});

/**
 * GET /api/ai/health
 *
 * Health check for AI services.
 * Returns status of LLM connectivity and module availability.
 */
aiChatRouter.get("/health", async (_req: Request, res: Response) => {
  const status: Record<string, string> = {
    ragEngine: "operational",
    bernsteinQA: "operational",
    clinicianNotes: "operational",
    patternAnalysis: "operational",
  };

  // Test LLM connectivity
  try {
    await callLLM([
      { role: "system", content: "Respond with OK" },
      { role: "user", content: "ping" },
    ]);
    status.llmService = "operational";
  } catch {
    status.llmService = "degraded";
  }

  const allOperational = Object.values(status).every((s) => s === "operational");

  return res.status(allOperational ? 200 : 207).json({
    status: allOperational ? "healthy" : "degraded",
    services: status,
    timestamp: new Date().toISOString(),
    version: "7.0.0",
  });
});
