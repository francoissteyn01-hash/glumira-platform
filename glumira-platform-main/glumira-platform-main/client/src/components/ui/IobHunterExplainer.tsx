/**
 * GluMira™ IOB Hunter Explainer
 * Version: 7.0.0
 *
 * An animated, step-by-step education panel that explains:
 *  1. What Insulin On Board (IOB) is
 *  2. Why insulin stacking is dangerous
 *  3. How the biexponential model works
 *  4. What the GluMira™ IOB Hunter does
 *
 * Designed for the patient dashboard and onboarding flow.
 * Uses CSS transitions only — no animation library required.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useState } from "react";

// ─── Steps ────────────────────────────────────────────────────

const STEPS = [
  {
    id: 1,
    icon: "💉",
    title: "What is Insulin On Board (IOB)?",
    body: `When you inject rapid-acting insulin, it doesn't all work instantly. A portion of every dose is still active in your body for 3–4 hours after injection. This remaining active insulin is called Insulin On Board (IOB).

Understanding your IOB is critical: if you inject again before the previous dose has finished working, you risk stacking insulin — which can cause a dangerous hypoglycaemic episode.`,
    highlight: "IOB = the insulin still working in your body right now.",
  },
  {
    id: 2,
    icon: "⚠️",
    title: "Why is Insulin Stacking Dangerous?",
    body: `Insulin stacking happens when you correct a high glucose reading without accounting for insulin that is already active from a previous dose.

Example: You inject 4U at 12:00. At 13:30 your glucose is still high, so you inject another 4U. But the first dose is still ~60% active — meaning you now have roughly 6.4U working simultaneously. This can cause a severe low.

This is one of the most common causes of hypoglycaemia in people using rapid-acting insulin.`,
    highlight: "Always check your IOB before correcting.",
  },
  {
    id: 3,
    icon: "📐",
    title: "How Does the Biexponential Model Work?",
    body: `GluMira™ uses a biexponential pharmacokinetic model to calculate IOB — the same approach used in clinical insulin pump research.

The formula models the rise and fall of insulin activity using two exponential terms:

  IOB(t) = Units × (e^(−α·t) − e^(−β·t))

Where α and β are insulin-specific absorption constants, and t is minutes since injection. Each insulin type (NovoRapid, Humalog, Fiasp, Tresiba, etc.) has its own validated constants.

This gives a smooth, physiologically accurate curve — not a simple linear countdown.`,
    highlight: "Each insulin type has its own unique activity curve.",
  },
  {
    id: 4,
    icon: "🔍",
    title: "What Does IOB Hunter™ Do?",
    body: `IOB Hunter™ is GluMira's real-time insulin tracking engine. It:

• Tracks every logged dose with its exact timestamp
• Computes the remaining IOB for each dose using the biexponential model
• Stacks all active doses to show your total IOB right now
• Assigns a risk tier (Low / Moderate / High / Critical) based on total active insulin
• Generates a plain-language narrative explaining your current stacking risk
• Renders a 6-hour IOB timeline chart so you can see when your insulin will peak and clear

IOB Hunter™ runs entirely on your device — no data leaves your session until you choose to save a reading.`,
    highlight: "The science of insulin, made visible.",
  },
] as const;

// ─── Component ────────────────────────────────────────────────

interface Props {
  /** If true, renders as a compact inline card. Default: full panel */
  compact?: boolean;
  /** Called when the user dismisses the explainer */
  onDismiss?: () => void;
}

export function IobHunterExplainer({ compact = false, onDismiss }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];

  const prev = () => setStep((s) => Math.max(0, s - 1));
  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));

  return (
    <div
      className={`bg-white rounded-xl border border-teal-200 shadow-sm overflow-hidden ${
        compact ? "max-w-sm" : "max-w-2xl"
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{current.icon}</span>
          <div>
            <p className="text-xs text-teal-200 font-medium">IOB Hunter™ Education</p>
            <p className="text-sm text-white font-semibold">{current.title}</p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-teal-200 hover:text-white text-lg leading-none"
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>

      {/* Step indicators */}
      <div className="flex gap-1.5 px-5 pt-4">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setStep(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === step
                ? "bg-teal-600 flex-1"
                : i < step
                ? "bg-teal-300 w-6"
                : "bg-gray-200 w-6"
            }`}
            aria-label={`Step ${i + 1}`}
          />
        ))}
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-3">
        <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">
          {current.body}
        </p>

        {/* Highlight callout */}
        <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-3">
          <p className="text-sm font-semibold text-teal-800">{current.highlight}</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-5 pb-5 flex items-center justify-between">
        <button
          onClick={prev}
          disabled={step === 0}
          className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30 transition-colors"
        >
          ← Previous
        </button>

        <span className="text-xs text-gray-400">
          {step + 1} / {STEPS.length}
        </span>

        {step < STEPS.length - 1 ? (
          <button
            onClick={next}
            className="text-xs font-medium text-teal-600 hover:text-teal-800 transition-colors"
          >
            Next →
          </button>
        ) : (
          <button
            onClick={onDismiss}
            className="text-xs font-medium text-teal-600 hover:text-teal-800 transition-colors"
          >
            {onDismiss ? "Got it ✓" : "Done ✓"}
          </button>
        )}
      </div>

      {/* Disclaimer */}
      <div className="border-t border-gray-100 px-5 py-3">
        <p className="text-xs text-gray-400">
          GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice. Always consult your healthcare provider before making any changes to your insulin regimen.
        </p>
      </div>
    </div>
  );
}

export default IobHunterExplainer;
