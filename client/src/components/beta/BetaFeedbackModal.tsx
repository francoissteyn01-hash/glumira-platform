/**
 * GluMira™ Beta Feedback Modal
 * Version: 7.0.0
 * Component: BetaFeedbackModal
 *
 * Collects structured feedback from beta participants.
 * Features:
 *   - Star rating (1-5)
 *   - Category selector (IOB chart, glucose timeline, school care plan, general, bug)
 *   - Free-text comment (5-2000 chars)
 *   - Submits to /api/beta/feedback
 *   - Success/error state handling
 *   - Accessible (keyboard navigable, ARIA labels)
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────

type FeedbackCategory =
  | "iob_chart"
  | "glucose_timeline"
  | "school_care_plan"
  | "general"
  | "bug";

interface FeedbackFormState {
  category: FeedbackCategory | "";
  rating: number;
  comment: string;
}

interface BetaFeedbackModalProps {
  participantId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// ─── Category Options ─────────────────────────────────────────

const CATEGORIES: { value: FeedbackCategory; label: string; description: string }[] = [
  { value: "iob_chart", label: "IOB Chart", description: "Insulin on Board visualisation" },
  { value: "glucose_timeline", label: "Glucose Timeline", description: "CGM glucose chart" },
  { value: "school_care_plan", label: "School Care Plan", description: "Generated care plan document" },
  { value: "general", label: "General", description: "Overall experience" },
  { value: "bug", label: "Bug Report", description: "Something isn't working" },
];

// ─── Star Rating ──────────────────────────────────────────────

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
}

function StarRating({ value, onChange }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? "s" : ""} — ${labels[star]}`}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="text-3xl transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded"
          >
            <span
              style={{
                color: star <= (hovered || value) ? "#F59E0B" : "#D1D5DB",
              }}
            >
              ★
            </span>
          </button>
        ))}
      </div>
      {(hovered || value) > 0 && (
        <p className="text-xs text-gray-500 mt-1">{labels[hovered || value]}</p>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────

export function BetaFeedbackModal({
  participantId,
  isOpen,
  onClose,
  onSuccess,
}: BetaFeedbackModalProps) {
  const [form, setForm] = useState<FeedbackFormState>({
    category: "",
    rating: 0,
    comment: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const firstFocusRef = useRef<HTMLButtonElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  // Focus trap — focus first element when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => firstFocusRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const validate = useCallback((): string[] => {
    const errors: string[] = [];
    if (!form.category) errors.push("Please select a feedback category.");
    if (form.rating === 0) errors.push("Please select a star rating.");
    if (form.comment.trim().length < 5) errors.push("Comment must be at least 5 characters.");
    if (form.comment.length > 2000) errors.push("Comment must be under 2000 characters.");
    return errors;
  }, [form]);

  const handleSubmit = useCallback(async () => {
    const errors = validate();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/beta/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          category: form.category,
          rating: form.rating,
          comment: form.comment.trim(),
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${response.status}`);
      }

      setSubmitState("success");
      onSuccess?.();
    } catch (err) {
      setSubmitState("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to submit feedback. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [form, participantId, validate, onSuccess]);

  const handleClose = useCallback(() => {
    setForm({ category: "", rating: 0, comment: "" });
    setSubmitState("idle");
    setValidationErrors([]);
    setErrorMessage(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 id="feedback-modal-title" className="text-lg font-bold text-gray-900">
              Beta Feedback
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">Participant: {participantId}</p>
          </div>
          <button
            ref={firstFocusRef}
            onClick={handleClose}
            aria-label="Close feedback modal"
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            ✕
          </button>
        </div>

        {/* Success State */}
        {submitState === "success" ? (
          <div className="px-6 py-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Thank you!</h3>
            <p className="text-sm text-gray-500 mb-6">
              Your feedback has been recorded. It will directly shape GluMira™.
            </p>
            <button
              onClick={handleClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5">
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                {validationErrors.map((e, i) => (
                  <p key={i} className="text-xs text-red-700">{e}</p>
                ))}
              </div>
            )}

            {/* Error State */}
            {submitState === "error" && errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs text-red-700">{errorMessage}</p>
              </div>
            )}

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What are you giving feedback on?
              </label>
              <div className="grid grid-cols-1 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, category: cat.value }))}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-colors ${
                      form.category === cat.value
                        ? "border-blue-500 bg-blue-50 text-blue-800"
                        : "border-gray-200 hover:border-gray-300 text-gray-700"
                    }`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{cat.label}</p>
                      <p className="text-xs text-gray-400">{cat.description}</p>
                    </div>
                    {form.category === cat.value && (
                      <span className="text-blue-600 text-sm">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Star Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                How would you rate this?
              </label>
              <StarRating
                value={form.rating}
                onChange={(r) => setForm((f) => ({ ...f, rating: r }))}
              />
            </div>

            {/* Comment */}
            <div>
              <label
                htmlFor="feedback-comment"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Tell us more
              </label>
              <textarea
                id="feedback-comment"
                ref={commentRef}
                value={form.comment}
                onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
                placeholder="What's working well? What could be improved?"
                rows={4}
                maxLength={2000}
                className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              <p className="text-xs text-gray-400 text-right mt-1">
                {form.comment.length}/2000
              </p>
            </div>

            {/* Submit */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {isSubmitting ? "Submitting…" : "Submit Feedback"}
            </button>

            <p className="text-xs text-gray-400 text-center">
              GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BetaFeedbackModal;
