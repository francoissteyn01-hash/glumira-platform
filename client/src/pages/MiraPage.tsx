/**
 * GluMira™ V7 — client/src/pages/MiraPage.tsx
 * Mira AI — powered by Claude (Anthropic) via /api/mira
 */

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { cn } from "../lib/utils";
import { DISCLAIMER } from "../lib/constants";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const FEEDBACK_QUESTIONS = [
  "What did you find most useful?",
  "What was confusing?",
  "What feature would you want next?",
  "Rate GluMira™ from 1-5 (just type the number):",
  "Anything else you'd like to share?",
] as const;

export default function MiraPage() {
  const [params] = useSearchParams();
  const isSafeMode = params.get("safe") === "1" || !!localStorage.getItem("glumira-safe-mode");

  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Mira, your GluMira™ education assistant 👋\n\nI can help you understand diabetes management concepts, explain your glucose trends, and answer questions about your medications.\n\n⚠️ I'm an educational tool — always check with your healthcare team before making changes.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [feedbackStep, setFeedbackStep] = useState(0);
  const [feedbackData, setFeedbackData] = useState<Record<string, string>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await apiFetch<{ reply: string }>("/api/mira/chat", {
        method: "POST",
        body: JSON.stringify({
          message: text,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const assistantMsg: Message = {
        role: "assistant",
        content: res.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't reach the server. Please try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function startFeedback() {
    setFeedbackMode(true);
    setFeedbackStep(0);
    setFeedbackData({});
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: "I'd love to hear your feedback! Let's go through a few quick questions.\n\n" + FEEDBACK_QUESTIONS[0],
        timestamp: new Date(),
      },
    ]);
  }

  async function handleFeedbackAnswer(answer: string) {
    const keys = ["most_useful", "most_confusing", "feature_request", "rating", "other_thoughts"];
    const key = keys[feedbackStep];
    const newData = { ...feedbackData, [key]: answer };
    setFeedbackData(newData);

    setMessages((prev) => [
      ...prev,
      { role: "user", content: answer, timestamp: new Date() },
    ]);

    if (feedbackStep < FEEDBACK_QUESTIONS.length - 1) {
      const nextStep = feedbackStep + 1;
      setFeedbackStep(nextStep);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: FEEDBACK_QUESTIONS[nextStep], timestamp: new Date() },
      ]);
    } else {
      // Submit feedback
      setFeedbackMode(false);
      try {
        const ratingNum = parseInt(newData.rating ?? "0", 10);
        await apiFetch("/api/feedback", {
          method: "POST",
          body: JSON.stringify({
            session_id: `safe-${Date.now()}`,
            demo_profile_id: params.get("profile") ?? undefined,
            most_useful: newData.most_useful,
            most_confusing: newData.most_confusing,
            feature_request: newData.feature_request,
            rating: ratingNum >= 1 && ratingNum <= 5 ? ratingNum : undefined,
            other_thoughts: newData.other_thoughts,
          }),
        });
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Thank you for your feedback! It helps us improve GluMira™ for everyone. 💙", timestamp: new Date() },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Thanks for sharing! (I couldn't save it right now, but we appreciate your thoughts.)", timestamp: new Date() },
        ]);
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#f8f9fa] flex flex-col">

      {/* Header */}
      <div className="border-b border-gray-200 dark:border-[#e2e8f0] bg-white dark:bg-white px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#2ab5c1] flex items-center justify-center text-[#1a2a5e] font-bold text-sm">
          M
        </div>
        <div>
          <p className="font-semibold text-gray-900 dark:text-[#1a2a5e] text-sm">Mira AI</p>
          <p className="text-xs text-[#718096]">Educational assistant · Not medical advice</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap",
                msg.role === "user"
                  ? "bg-[#2ab5c1] text-[#1a2a5e] rounded-br-sm"
                  : "bg-white dark:bg-[#f0f4f8] border border-gray-200 dark:border-[#e2e8f0] text-gray-800 dark:text-[#4a5568] rounded-bl-sm"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-[#f0f4f8] border border-gray-200 dark:border-[#e2e8f0] rounded-2xl rounded-bl-sm px-4 py-3">
              <span className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Disclaimer */}
      <div className="px-4 py-1 max-w-2xl mx-auto w-full">
        <p className="text-xs text-[#718096] text-center">{DISCLAIMER}</p>
      </div>

      {/* Feedback chip (safe mode only) */}
      {isSafeMode && !feedbackMode && (
        <div className="px-4 py-1 max-w-2xl mx-auto w-full flex justify-center">
          <button
            onClick={startFeedback}
            className="rounded-full border border-[#2ab5c1] bg-[#2ab5c1]/10 text-[#1a2a5e] px-4 py-1.5 text-xs font-medium hover:bg-[#2ab5c1]/20 transition-colors"
          >
            Give Feedback
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-[#e2e8f0] bg-white dark:bg-white px-4 py-3 max-w-2xl mx-auto w-full">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                if (feedbackMode) {
                  e.preventDefault();
                  if (input.trim()) {
                    handleFeedbackAnswer(input.trim());
                    setInput("");
                  }
                } else {
                  sendMessage();
                }
              }
            }}
            placeholder={feedbackMode ? "Type your answer…" : "Ask Mira a question…"}
            className="flex-1 rounded-xl border border-gray-200 dark:border-[#e2e8f0] bg-gray-50 dark:bg-[#f8f9fa] px-4 py-2.5 text-sm text-gray-900 dark:text-[#1a2a5e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2ab5c1]"
          />
          <button
            onClick={() => {
              if (feedbackMode && input.trim()) {
                handleFeedbackAnswer(input.trim());
                setInput("");
              } else {
                sendMessage();
              }
            }}
            disabled={loading || !input.trim()}
            className="rounded-xl bg-[#2ab5c1] hover:bg-[#229aaa] disabled:opacity-40 text-[#1a2a5e] px-4 py-2.5 text-sm font-medium transition-colors"
          >
            Send
          </button>
        </div>
      </div>

    </div>
  );
}
