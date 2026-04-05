/**
 * GluMira™ V7 — Guided Tour
 * Step-by-step overlay on first safe-mode dashboard visit.
 * Mobile: bottom sheet tooltip. Desktop: positioned near element.
 * Shows once per profile (localStorage). Respects prefers-reduced-motion.
 */

import { useState, useEffect, useMemo, useCallback } from "react";

interface TourStep {
  title: string;
  description: string;
  target?: string; // CSS selector
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Your Dashboard",
    description: "This is your command centre. Glucose trends, insulin activity, and pattern alerts — all in one view.",
  },
  {
    title: "IOB Curve",
    description: "The insulin activity graph shows how much insulin is active in the body right now and when it peaks.",
  },
  {
    title: "Stacking & Pressure",
    description: "When doses overlap, the stacking indicator highlights danger zones in amber. This is where GluMira shines.",
  },
  {
    title: "Education",
    description: "100 topics covering insulin science, carb counting, sick days, and more — all written for real people.",
  },
  {
    title: "Ask Mira",
    description: "Mira is your AI education companion. Ask her anything about diabetes management — she explains, never prescribes.",
  },
  {
    title: "Specialist Modules",
    description: "Pregnancy, ADHD, Ramadan, Bernstein, Sick Day — 11 specialist modules tailored to your life.",
  },
  {
    title: "Give Feedback",
    description: "This is a beta. Your feedback shapes GluMira. Tell us what works, what doesn't, and what you need next.",
  },
];

interface Props {
  profileId: string;
  onComplete?: () => void;
}

export default function GuidedTour({ profileId, onComplete }: Props) {
  const storageKey = `glumira_tour_done_${profileId}`;
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  const reducedMotion = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useEffect(() => {
    try {
      if (!localStorage.getItem(storageKey)) {
        setVisible(true);
      }
    } catch { /* localStorage unavailable */ }
  }, [storageKey]);

  const finish = useCallback(() => {
    setVisible(false);
    try { localStorage.setItem(storageKey, "1"); } catch {}
    onComplete?.();
  }, [storageKey, onComplete]);

  const next = useCallback(() => {
    if (step >= TOUR_STEPS.length - 1) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  }, [step, finish]);

  if (!visible) return null;

  const current = TOUR_STEPS[step];
  const isLast = step === TOUR_STEPS.length - 1;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 9999,
    background: "rgba(15,27,61,0.6)",
    backdropFilter: "blur(2px)",
    display: "flex",
    alignItems: isMobile ? "flex-end" : "center",
    justifyContent: "center",
    transition: reducedMotion ? "none" : "opacity 0.3s ease",
  };

  const cardStyle: React.CSSProperties = {
    background: "#ffffff",
    borderRadius: isMobile ? "16px 16px 0 0" : 16,
    padding: isMobile ? "24px 20px 32px" : "28px 32px",
    maxWidth: 420,
    width: isMobile ? "100%" : "90%",
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
    animation: reducedMotion ? "none" : "fadeIn 0.3s ease",
  };

  const F = "'DM Sans', system-ui, sans-serif";

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        {/* Step indicator */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
          {TOUR_STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 20 : 8,
                height: 4,
                borderRadius: 2,
                background: i === step ? "#2ab5c1" : "#e2e8f0",
                transition: reducedMotion ? "none" : "width 0.2s ease, background 0.2s ease",
              }}
            />
          ))}
        </div>

        {/* Content */}
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#2ab5c1", marginBottom: 6, fontFamily: F }}>
          Step {step + 1} of {TOUR_STEPS.length}
        </p>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1a2a5e", margin: "0 0 8px", fontFamily: F }}>
          {current.title}
        </h3>
        <p style={{ fontSize: 14, color: "#718096", lineHeight: 1.6, margin: "0 0 20px", fontFamily: F }}>
          {current.description}
        </p>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button type="button"
            onClick={finish}
            style={{
              background: "none",
              border: "none",
              color: "#718096",
              fontSize: 13,
              cursor: "pointer",
              fontFamily: F,
              padding: "6px 0",
            }}
          >
            Skip tour
          </button>
          <button type="button"
            onClick={next}
            style={{
              padding: "9px 24px",
              borderRadius: 8,
              border: "none",
              background: "#2ab5c1",
              color: "#ffffff",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: F,
              transition: "background 0.2s",
            }}
          >
            {isLast ? "Get Started" : "Next"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
