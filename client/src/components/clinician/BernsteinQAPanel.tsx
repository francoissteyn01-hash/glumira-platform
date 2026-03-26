/**
 * GluMira™ Bernstein AI Q&A Panel
 * Version: 7.0.0
 *
 * Chat-style panel for asking diabetes management questions
 * grounded in Dr. Bernstein's methodology.
 *
 * DISCLAIMER: GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────

interface QAMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  principleReferenced?: string;
  timestamp: Date;
}

interface BernsteinQAPanelProps {
  /** Optional patient context passed to the AI */
  patientContext?: {
    diabetesType?: string;
    yearsWithDiabetes?: number;
    currentA1c?: number;
  };
  /** Compact mode — smaller height, no suggested questions */
  compact?: boolean;
}

// ─── Suggested Questions ──────────────────────────────────────

const SUGGESTED_QUESTIONS = [
  "What is insulin stacking and how do I avoid it?",
  "What is the Law of Small Numbers?",
  "What is Time in Range and why does it matter?",
  "What is IOB and how is it calculated?",
  "What is the difference between basal and bolus insulin?",
  "How does the dawn phenomenon affect morning glucose?",
];

// ─── Message Bubble ───────────────────────────────────────────

function MessageBubble({ message }: { message: QAMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
          <span className="text-xs font-bold text-blue-600">G</span>
        </div>
      )}
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-gray-100 text-gray-800 rounded-bl-sm"
        }`}
      >
        <p>{message.content}</p>
        {message.principleReferenced && !isUser && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <span className="text-xs text-gray-500">
              📖 Principle: {message.principleReferenced}
            </span>
          </div>
        )}
        <p className={`text-xs mt-1 ${isUser ? "text-blue-200" : "text-gray-400"}`}>
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────

export function BernsteinQAPanel({ patientContext, compact = false }: BernsteinQAPanelProps) {
  const [messages, setMessages] = useState<QAMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hello! I'm the GluMira™ Bernstein AI. Ask me anything about diabetes management based on Dr. Bernstein's methodology — in plain English, no jargon.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (question: string) => {
      if (!question.trim() || isLoading) return;

      const userMessage: QAMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: question.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        const conversationHistory = messages
          .filter((m) => m.id !== "welcome")
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch("/api/bernstein/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: question.trim(),
            patientContext,
            conversationHistory,
          }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();

        const assistantMessage: QAMessage = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: data.answer,
          principleReferenced: data.principleReferenced,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            content: "I'm temporarily unable to connect. Please try again in a moment.",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [isLoading, messages, patientContext]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const panelHeight = compact ? "h-64" : "h-96";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      {!compact && (
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <span className="text-sm font-bold text-white">G</span>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Bernstein AI</h3>
            <p className="text-xs text-gray-400">Powered by GluMira™ AI · Educational only</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-gray-400">Online</span>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className={`${panelHeight} overflow-y-auto px-4 py-4 flex-1`}>
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-0.5">
              <span className="text-xs font-bold text-blue-600">G</span>
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="inline-block w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {!compact && messages.length <= 1 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-3 py-1.5 hover:bg-blue-100 transition-colors text-left"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-4 pb-4 pt-2 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about Dr. Bernstein's method…"
            disabled={isLoading}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 placeholder:text-gray-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium disabled:opacity-50 transition-colors"
          >
            Ask
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Educational only · Not a medical device · Not a dosing tool
        </p>
      </form>
    </div>
  );
}

export default BernsteinQAPanel;
