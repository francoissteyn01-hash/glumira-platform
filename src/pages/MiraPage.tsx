import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePatientName } from "@/hooks/usePatientName";
import { API, apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { DISCLAIMER } from "@/lib/constants";

interface Message { role: "user" | "assistant"; content: string; timestamp: Date }

const SUGGESTED_PROMPTS = [
  "What would Dr. Bernstein say about my numbers today?",
  "How many carbs in 100g basmati rice?",
  "Explain my afternoon stacking pattern",
  "What is the quiet tail of insulin?",
];

/* ── Feedback flow for safe/demo mode ──────────────────────────────────────── */

const FEEDBACK_QUESTIONS = [
  "What did you find most useful about GluMira so far?",
  "What was confusing or could be improved?",
  "What feature would you want us to build next?",
  "On a scale of 1–5, how would you rate your experience? (just type the number)",
  "Anything else you'd like to share?",
];


async function submitFeedback(answers: string[]) {
  const [mostUseful, mostConfusing, featureRequest, ratingStr, otherThoughts] = answers;
  const rating = parseInt(ratingStr, 10);
  try {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionStorage.getItem("glumira_session_id") ?? undefined,
        demo_profile_id: sessionStorage.getItem("glumira_demo_profile") ?? undefined,
        most_useful: mostUseful || undefined,
        most_confusing: mostConfusing || undefined,
        feature_request: featureRequest || undefined,
        rating: rating >= 1 && rating <= 5 ? rating : undefined,
        other_thoughts: otherThoughts || undefined,
      }),
    });
  } catch {}
}

export default function MiraPage() {
  const { session } = useAuth();
  const { patientName, isCaregiver } = usePatientName();
  const greeting = isCaregiver && patientName
    ? `Hi! I'm Mira, ${patientName}\u2019s GluMira\u2122 education assistant \u{1F44B}\n\nI can help you understand ${patientName}\u2019s diabetes management.\n\n\u26A0\uFE0F I'm an educational tool \u2014 always check with your healthcare team before making changes.`
    : "Hi! I'm Mira, your GluMira\u2122 education assistant \u{1F44B}\n\nI can help you understand diabetes management concepts.\n\n\u26A0\uFE0F I'm an educational tool \u2014 always check with your healthcare team before making changes.";
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: greeting, timestamp: new Date() }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [bernstein, setBernstein] = useState(false);
  const [profileBadge, setProfileBadge] = useState("");
  const [feedbackStep, setFeedbackStep] = useState(-1); // -1 = not started
  const [feedbackAnswers, setFeedbackAnswers] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Load profile context for badge
  useEffect(() => {
    if (!session) return;
    fetch(`${API}/api/profile`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((r) => r.json())
      .then((d) => {
        const p = d?.profile;
        if (!p) return;
        const parts: string[] = [];
        if (p.dietary_approach) parts.push(p.dietary_approach);
        if (p.insulin_types?.length) parts.push(`${p.insulin_types.length} insulins`);
        if (p.special_conditions?.length) parts.push(p.special_conditions.slice(0, 2).join(", "));
        setProfileBadge(parts.join(" \u00B7 "));
      })
      .catch(() => {});
  }, [session]);

  function startFeedback() {
    setFeedbackStep(0);
    setFeedbackAnswers([]);
    setMessages((p) => [...p, {
      role: "assistant",
      content: `I'd love to hear your thoughts! Let me ask you a few quick questions.\n\n${FEEDBACK_QUESTIONS[0]}`,
      timestamp: new Date(),
    }]);
  }

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setMessages((p) => [...p, { role: "user", content: msg, timestamp: new Date() }]);
    setInput("");

    // Handle feedback flow
    if (feedbackStep >= 0 && feedbackStep < FEEDBACK_QUESTIONS.length) {
      const newAnswers = [...feedbackAnswers, msg];
      setFeedbackAnswers(newAnswers);
      const nextStep = feedbackStep + 1;

      if (nextStep < FEEDBACK_QUESTIONS.length) {
        setFeedbackStep(nextStep);
        setMessages((p) => [...p, {
          role: "assistant",
          content: FEEDBACK_QUESTIONS[nextStep],
          timestamp: new Date(),
        }]);
      } else {
        setFeedbackStep(-1);
        await submitFeedback(newAnswers);
        setMessages((p) => [...p, {
          role: "assistant",
          content: "Thank you so much for your feedback! It directly shapes what we build next. You can continue chatting or explore more of GluMira.",
          timestamp: new Date(),
        }]);
      }
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch<{ reply: string }>("/api/mira/chat", {
        method: "POST",
        body: JSON.stringify({ message: msg, history: messages.map((m) => ({ role: m.role, content: m.content })), bernsteinMode: bernstein }),
      });
      setMessages((p) => [...p, { role: "assistant", content: res.reply, timestamp: new Date() }]);
    } catch {
      setMessages((p) => [...p, { role: "assistant", content: "Sorry, I couldn't reach the server. Please try again.", timestamp: new Date() }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900 px-4 py-3">
        <div className="flex items-center justify-between max-w-2xl mx-auto w-full">
          <div className="flex items-center gap-3">
            <div style={{ width: 36, height: 36 }} />
            <div>
              <p className="font-semibold text-white text-sm">Mira AI</p>
              <p className="text-xs text-gray-300">Educational assistant · Not medical advice</p>
            </div>
          </div>
          {/* Bernstein Mode toggle */}
          <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300">
            <input type="checkbox" checked={bernstein} onChange={(e) => setBernstein(e.target.checked)} style={{ accentColor: "#f59e0b", width: 16, height: 16 }} />
            Bernstein Mode
          </label>
        </div>
        {/* Profile context badge */}
        {profileBadge && (
          <div className="max-w-2xl mx-auto w-full mt-2">
            <span className="text-[10px] text-gray-400 bg-gray-800 rounded px-2 py-0.5">Mira knows: {profileBadge}</span>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
        {messages.map((m, i) => (
          <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[80%] rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap", m.role === "user" ? "bg-brand-600 text-white rounded-br-sm" : "bg-gray-800 border border-gray-700 text-gray-200 rounded-bl-sm")}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-sm px-4 py-3">
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

      {/* Suggested prompts */}
      {messages.length <= 2 && (
        <div className="px-4 pb-2 max-w-2xl mx-auto w-full">
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPTS.map((p, i) => (
              <button type="button" key={i} onClick={() => send(p)} className="text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-700 transition-colors">
                {p}
              </button>
            ))}
            {feedbackStep < 0 && (
              <button type="button" onClick={startFeedback} className="text-xs bg-amber-900/30 border border-amber-700/50 text-amber-400 rounded-lg px-3 py-1.5 hover:bg-amber-900/50 transition-colors">
                Give Feedback
              </button>
            )}
          </div>
        </div>
      )}
      {/* Persistent feedback chip */}
      {messages.length > 2 && feedbackStep < 0 && (
        <div className="px-4 pb-1 max-w-2xl mx-auto w-full">
          <button type="button" onClick={startFeedback} className="text-xs bg-amber-900/30 border border-amber-700/50 text-amber-400 rounded-lg px-3 py-1.5 hover:bg-amber-900/50 transition-colors">
            Give Feedback
          </button>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center px-4 pb-1 max-w-2xl mx-auto w-full">{DISCLAIMER}</p>

      {/* Input */}
      <div className="border-t border-gray-800 bg-gray-900 px-4 py-3 max-w-2xl mx-auto w-full">
        <div className="flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()} placeholder="Ask Mira a question…" className="flex-1 rounded-xl border border-gray-700 bg-gray-950 px-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          <button type="button" onClick={() => send()} disabled={loading || !input.trim()} className="rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white px-4 py-2.5 text-sm font-medium transition-colors">Send</button>
        </div>
      </div>
    </div>
  );
}
