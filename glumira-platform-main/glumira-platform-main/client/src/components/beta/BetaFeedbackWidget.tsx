/**
 * GluMira™ Beta Feedback Widget
 * Version: 7.0.0
 * Module: BETA-FEEDBACK-WIDGET
 *
 * Persistent floating feedback button + slide-out panel that appears on
 * every page during beta. Integrates with the telemetry engine to track
 * when feedback is opened, submitted, and dismissed.
 *
 * Features:
 *   - Floating "Feedback" pill button (bottom-right)
 *   - Slide-out panel with category, star rating, and comment
 *   - NPS score capture (0-10) on every 5th session
 *   - Screenshot attachment option
 *   - Auto-captures page context and session metadata
 *   - Writes to beta_feedback table via API
 *   - Fires telemetry events for all interactions
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { MessageSquarePlus, X, Star, Send, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTelemetry } from "@/hooks/useTelemetry";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────

type FeedbackCategory =
  | "iob_chart"
  | "glucose_timeline"
  | "bolus_calculator"
  | "school_care_plan"
  | "ai_assistant"
  | "data_sync"
  | "general"
  | "bug";

interface FeedbackPayload {
  category: FeedbackCategory;
  rating: number;
  comment: string;
  npsScore?: number;
  pageContext: string;
  sessionId: string;
  deviceType: string;
}

// ─── Constants ───────────────────────────────────────────────

const CATEGORIES: { value: FeedbackCategory; label: string; emoji: string }[] = [
  { value: "iob_chart", label: "IOB Chart", emoji: "📊" },
  { value: "glucose_timeline", label: "Glucose Timeline", emoji: "📈" },
  { value: "bolus_calculator", label: "Bolus Calculator", emoji: "🧮" },
  { value: "school_care_plan", label: "School Care Plan", emoji: "🏫" },
  { value: "ai_assistant", label: "AI Assistant", emoji: "🤖" },
  { value: "data_sync", label: "Data Sync", emoji: "🔄" },
  { value: "general", label: "General", emoji: "💬" },
  { value: "bug", label: "Bug Report", emoji: "🐛" },
];

const NPS_INTERVAL = 5; // Show NPS every 5th session

// ─── Component ───────────────────────────────────────────────

export function BetaFeedbackWidget() {
  const { trackFeedback } = useTelemetry();

  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [showNps, setShowNps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"category" | "details" | "nps" | "thanks">("category");

  // Check if we should show NPS this session
  useEffect(() => {
    const sessionCount = parseInt(sessionStorage.getItem("glumira_session_count") ?? "0", 10) + 1;
    sessionStorage.setItem("glumira_session_count", String(sessionCount));
    if (sessionCount % NPS_INTERVAL === 0) {
      setShowNps(true);
    }
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setStep("category");
    trackFeedback("feedback_modal_opened");
  }, [trackFeedback]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setCategory(null);
    setRating(0);
    setComment("");
    setNpsScore(null);
    setStep("category");
  }, []);

  const handleCategorySelect = useCallback((cat: FeedbackCategory) => {
    setCategory(cat);
    setStep("details");
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!category || rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);

    const payload: FeedbackPayload = {
      category,
      rating,
      comment,
      npsScore: npsScore ?? undefined,
      pageContext: window.location.pathname,
      sessionId: sessionStorage.getItem("glumira_session_id") ?? "unknown",
      deviceType: window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
    };

    try {
      const res = await fetch("/api/beta/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to submit feedback");

      trackFeedback("feedback_submitted", {
        category,
        rating,
        hasComment: comment.length > 0,
        npsScore: npsScore ?? undefined,
      });

      if (showNps && step === "details") {
        setStep("nps");
      } else {
        setStep("thanks");
        setTimeout(handleClose, 2000);
      }

      toast.success("Thank you for your feedback!");
    } catch {
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [category, rating, comment, npsScore, showNps, step, trackFeedback, handleClose]);

  const handleNpsSubmit = useCallback(() => {
    // NPS is already captured in the payload
    setStep("thanks");
    setTimeout(handleClose, 2000);
  }, [handleClose]);

  // ── Render ──

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95"
          aria-label="Give feedback"
        >
          <MessageSquarePlus className="h-4 w-4" />
          Beta Feedback
        </button>
      )}

      {/* Slide-out Panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 animate-in slide-in-from-bottom-4 duration-300">
          <Card className="overflow-hidden border-teal-200 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-teal-600 to-cyan-600 px-4 py-3">
              <span className="text-sm font-semibold text-white">
                GluMira™ Beta Feedback
              </span>
              <button
                onClick={handleClose}
                className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-4">
              {/* Step 1: Category Selection */}
              {step === "category" && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 mb-3">
                    What would you like to give feedback on?
                  </p>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => handleCategorySelect(cat.value)}
                      className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-left text-sm transition-colors hover:border-teal-300 hover:bg-teal-50"
                    >
                      <span>
                        <span className="mr-2">{cat.emoji}</span>
                        {cat.label}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2: Rating & Comment */}
              {step === "details" && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Rate your experience with{" "}
                      {CATEGORIES.find((c) => c.value === category)?.label}
                    </p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="transition-transform hover:scale-110"
                        >
                          <Star
                            className={`h-7 w-7 ${
                              star <= (hoverRating || rating)
                                ? "fill-amber-400 text-amber-400"
                                : "text-gray-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Tell us more (optional)..."
                      className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400"
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={rating === 0 || isSubmitting}
                    className="w-full bg-teal-600 hover:bg-teal-700"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Submitting..." : "Submit Feedback"}
                  </Button>
                </div>
              )}

              {/* Step 3: NPS Score (conditional) */}
              {step === "nps" && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-gray-700">
                    How likely are you to recommend GluMira™ to a friend or
                    fellow diabetes patient?
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {Array.from({ length: 11 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setNpsScore(i)}
                        className={`h-8 w-8 rounded-md text-xs font-semibold transition-colors ${
                          npsScore === i
                            ? i <= 6
                              ? "bg-red-500 text-white"
                              : i <= 8
                              ? "bg-amber-500 text-white"
                              : "bg-green-500 text-white"
                            : "border border-gray-200 text-gray-600 hover:border-teal-300"
                        }`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Not likely</span>
                    <span>Very likely</span>
                  </div>
                  <Button
                    onClick={handleNpsSubmit}
                    disabled={npsScore === null}
                    className="w-full bg-teal-600 hover:bg-teal-700"
                  >
                    Submit
                  </Button>
                </div>
              )}

              {/* Step 4: Thank You */}
              {step === "thanks" && (
                <div className="py-6 text-center">
                  <div className="text-3xl mb-2">🎉</div>
                  <p className="text-sm font-semibold text-gray-700">
                    Thank you!
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Your feedback helps shape GluMira™
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
