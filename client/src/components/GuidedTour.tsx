/**
 * GluMira™ V7 — Guided Tour
 * Step-by-step overlay on first visit to dashboard.
 * Shows once per profile (saved to localStorage). Respects prefers-reduced-motion.
 */

import { useState, useEffect, useCallback } from "react";

interface TourStep {
  title: string;
  description: string;
  targetId?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Your Dashboard",
    description: "This is your overview — glucose trends, active insulin, and today's doses at a glance.",
    targetId: "tour-dashboard",
  },
  {
    title: "IOB Curve",
    description: "The insulin activity graph shows how much insulin is still working in the body, based on IOB Hunter™ pharmacokinetics.",
    targetId: "tour-iob-curve",
  },
  {
    title: "Stacking & Pressure",
    description: "When multiple doses overlap, danger zones appear. Watch for amber and red pressure indicators.",
    targetId: "tour-stacking",
  },
  {
    title: "Education",
    description: "100 topics across 10 modules — from diabetes basics to advanced insulin science.",
    targetId: "tour-education",
  },
  {
    title: "Ask Mira",
    description: "Mira is your AI companion who explains everything in plain language. Ask her anything about diabetes management.",
    targetId: "tour-mira",
  },
  {
    title: "Specialist Modules",
    description: "Dietary (Ramadan, Kosher, Halal, Bernstein), clinical (pregnancy, paediatric), and lifecycle modules.",
    targetId: "tour-modules",
  },
  {
    title: "Give Feedback",
    description: "Help shape GluMira™ — tell us what works, what's confusing, and what you'd like next.",
    targetId: "tour-feedback",
  },
];

function getStorageKey(profileId: string) {
  return `glumira-tour-done-${profileId}`;
}

export default function GuidedTour({ profileId }: { profileId: string }) {
  const [step, setStep] = useState(-1); // -1 = not started / dismissed
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    try {
      if (!localStorage.getItem(getStorageKey(profileId))) {
        setStep(0);
      }
    } catch {}
  }, [profileId]);

  const dismiss = useCallback(() => {
    setStep(-1);
    try {
      localStorage.setItem(getStorageKey(profileId), "1");
    } catch {}
  }, [profileId]);

  const next = useCallback(() => {
    if (step >= TOUR_STEPS.length - 1) {
      dismiss();
    } else {
      setStep((s) => s + 1);
    }
  }, [step, dismiss]);

  if (step < 0) return null;

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;
  const transition = prefersReducedMotion ? "" : "transition-all duration-200";

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 z-[998]" onClick={dismiss} />

      {/* Tooltip — mobile: bottom sheet, desktop: centered card */}
      <div
        className={`fixed z-[999] ${transition}
          bottom-0 left-0 right-0 sm:bottom-auto sm:left-1/2 sm:top-1/2
          sm:-translate-x-1/2 sm:-translate-y-1/2
        `}
      >
        <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl border border-[#e2e8f0] p-6 max-w-sm mx-auto sm:mx-0 w-full">
          {/* Step indicator */}
          <div className="flex items-center gap-1 mb-3">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full flex-1 ${
                  i <= step ? "bg-[#2ab5c1]" : "bg-[#e2e8f0]"
                } ${transition}`}
              />
            ))}
          </div>

          <p className="text-[10px] text-[#a0aec0] uppercase tracking-wider mb-1">
            Step {step + 1} of {TOUR_STEPS.length}
          </p>
          <h3 className="text-base font-semibold text-[#1a2a5e] mb-2">
            {current.title}
          </h3>
          <p className="text-xs text-[#718096] leading-relaxed mb-4">
            {current.description}
          </p>

          <div className="flex items-center justify-between">
            <button
              onClick={dismiss}
              className="text-xs text-[#718096] hover:text-[#1a2a5e] transition-colors"
            >
              Skip
            </button>
            <button
              onClick={next}
              className={`rounded-lg bg-[#2ab5c1] hover:bg-[#229aaa] text-[#1a2a5e] px-4 py-2 text-xs font-medium ${transition}`}
            >
              {isLast ? "Get Started" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
