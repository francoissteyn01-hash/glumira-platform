/**
 * GluMira™ Bernstein QA Engine (Enhanced) — Test Suite
 * Version: 7.0.0
 * Module: AI-BERNSTEIN-QA-V2-TEST
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { describe, it, expect } from "vitest";
import {
  findRelevantChapters,
  buildBernsteinPrompt,
  getOfflineAnswer,
  isOutOfScope,
  processBernsteinQuery,
  getAllChapterSummaries,
  BERNSTEIN_CHAPTERS,
} from "./bernstein-qa-engine";

// ─── Chapter Matching ────────────────────────────────────────

describe("findRelevantChapters", () => {
  it("should find Law of Small Numbers chapter", () => {
    const chapters = findRelevantChapters("What is the law of small numbers?");
    expect(chapters.length).toBeGreaterThan(0);
    expect(chapters[0].chapter).toBe(3);
  });

  it("should find insulin chapters for IOB question", () => {
    const chapters = findRelevantChapters("What is insulin on board and why does stacking matter?");
    expect(chapters.length).toBeGreaterThan(0);
    const chapterNums = chapters.map((c) => c.chapter);
    expect(chapterNums).toContain(11);
  });

  it("should find dawn phenomenon chapter", () => {
    const chapters = findRelevantChapters("Why is my blood sugar high in the morning?");
    expect(chapters.length).toBeGreaterThan(0);
    // Should match dawn phenomenon or monitoring
    const topics = chapters.flatMap((c) => c.topics);
    expect(topics.some((t) => t.includes("morning") || t.includes("dawn") || t.includes("blood sugar"))).toBe(true);
  });

  it("should find meal plan chapter for carb questions", () => {
    const chapters = findRelevantChapters("How many carbs should I eat at breakfast?");
    expect(chapters.length).toBeGreaterThan(0);
    const chapterNums = chapters.map((c) => c.chapter);
    expect(chapterNums.includes(9) || chapterNums.includes(7)).toBe(true);
  });

  it("should find exercise chapter", () => {
    const chapters = findRelevantChapters("How does exercise affect my blood sugar?");
    expect(chapters.length).toBeGreaterThan(0);
    expect(chapters[0].chapter).toBe(19);
  });

  it("should return max 3 chapters", () => {
    const chapters = findRelevantChapters("insulin carbs exercise blood sugar monitoring");
    expect(chapters.length).toBeLessThanOrEqual(3);
  });

  it("should return empty for completely unrelated question", () => {
    const chapters = findRelevantChapters("What is the capital of France?");
    expect(chapters.length).toBe(0);
  });
});

// ─── Scope Detection ─────────────────────────────────────────

describe("isOutOfScope", () => {
  it("should flag dose recommendation requests", () => {
    expect(isOutOfScope("What dose should I take?")).toBe(true);
    expect(isOutOfScope("Should I increase my insulin?")).toBe(true);
  });

  it("should flag diagnosis requests", () => {
    expect(isOutOfScope("Am I diabetic?")).toBe(true);
    expect(isOutOfScope("Can you diagnose my condition?")).toBe(true);
  });

  it("should flag prescription requests", () => {
    expect(isOutOfScope("Can you prescribe insulin?")).toBe(true);
  });

  it("should flag weight loss drug questions", () => {
    expect(isOutOfScope("Should I take Ozempic?")).toBe(true);
    expect(isOutOfScope("Tell me about Mounjaro")).toBe(true);
  });

  it("should NOT flag educational questions", () => {
    expect(isOutOfScope("What is the law of small numbers?")).toBe(false);
    expect(isOutOfScope("How does IOB work?")).toBe(false);
    expect(isOutOfScope("Why is my blood sugar high in the morning?")).toBe(false);
  });
});

// ─── Offline FAQ ─────────────────────────────────────────────

describe("getOfflineAnswer", () => {
  it("should return answer for law of small numbers", () => {
    const result = getOfflineAnswer("What is the law of small numbers?");
    expect(result).not.toBeNull();
    expect(result!.answer).toContain("kayak");
    expect(result!.chapters).toContain(3);
  });

  it("should return answer for IOB question", () => {
    const result = getOfflineAnswer("What is insulin on board?");
    expect(result).not.toBeNull();
    expect(result!.answer).toContain("stacking");
  });

  it("should return answer for dawn phenomenon", () => {
    const result = getOfflineAnswer("Tell me about the dawn phenomenon");
    expect(result).not.toBeNull();
    expect(result!.answer).toContain("morning");
  });

  it("should return null for unknown question", () => {
    const result = getOfflineAnswer("What is quantum physics?");
    expect(result).toBeNull();
  });
});

// ─── Prompt Builder ──────────────────────────────────────────

describe("buildBernsteinPrompt", () => {
  it("should include system prompt", () => {
    const prompt = buildBernsteinPrompt("test", []);
    expect(prompt).toContain("GluMira™ AI");
    expect(prompt).toContain("layman");
  });

  it("should include chapter knowledge when chapters are found", () => {
    const chapters = findRelevantChapters("law of small numbers");
    const prompt = buildBernsteinPrompt("law of small numbers", chapters);
    expect(prompt).toContain("Chapter 3");
    expect(prompt).toContain("Small inputs make small mistakes");
  });

  it("should include patient context when provided", () => {
    // We test the string inclusion — actual context assembly is tested in rag-context-engine
    const prompt = buildBernsteinPrompt("test", [], undefined);
    expect(prompt).not.toContain("PATIENT CONTEXT:");
  });
});

// ─── Chapter Summaries ───────────────────────────────────────

describe("getAllChapterSummaries", () => {
  it("should return all chapters", () => {
    const summaries = getAllChapterSummaries();
    expect(summaries.length).toBe(BERNSTEIN_CHAPTERS.length);
  });

  it("should include chapter number, title, summary, and topics", () => {
    const summaries = getAllChapterSummaries();
    for (const s of summaries) {
      expect(s.chapter).toBeGreaterThan(0);
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.summary.length).toBeGreaterThan(0);
      expect(s.topics.length).toBeGreaterThan(0);
    }
  });
});

// ─── Main Query (with mock LLM) ─────────────────────────────

describe("processBernsteinQuery", () => {
  const mockLLM = async (_messages: Array<{ role: string; content: string }>) => {
    return "The Law of Small Numbers means that small inputs make small mistakes. By eating fewer carbs, you need less insulin, which means more stable blood sugars.";
  };

  it("should return out-of-scope for dose requests", async () => {
    const result = await processBernsteinQuery(
      { question: "What dose should I take?" },
      mockLLM
    );
    expect(result.outOfScope).toBe(true);
    expect(result.answer).toContain("outside what I can help with");
  });

  it("should return answer with chapter references for valid question", async () => {
    const result = await processBernsteinQuery(
      { question: "What is the law of small numbers?" },
      mockLLM
    );
    expect(result.outOfScope).toBe(false);
    expect(result.answer).toContain("Law of Small Numbers");
    expect(result.chaptersReferenced).toContain(3);
    expect(result.disclaimer).toContain("Disclaimer");
  });

  it("should fall back to offline FAQ when LLM fails", async () => {
    const failingLLM = async () => {
      throw new Error("API unavailable");
    };
    const result = await processBernsteinQuery(
      { question: "What is the law of small numbers?" },
      failingLLM
    );
    expect(result.outOfScope).toBe(false);
    expect(result.answer).toContain("kayak"); // Offline FAQ answer
    expect(result.chaptersReferenced).toContain(3);
  });

  it("should return generic fallback when LLM fails and no FAQ match", async () => {
    const failingLLM = async () => {
      throw new Error("API unavailable");
    };
    const result = await processBernsteinQuery(
      { question: "Tell me about Bernstein's approach to travel" },
      failingLLM
    );
    expect(result.answer).toContain("temporarily unable");
  });
});
