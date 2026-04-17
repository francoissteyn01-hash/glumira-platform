/**
 * GluMira™ V7 — IOB Hunter v7 · Tier Gate
 *
 * Modal overlay that appears when a visitor or free-tier user attempts
 * a Pro-gated action (save scenario, export PDF, >7d history, 2nd what-if).
 * Canonical: free trial = 14 days. Always. (Rule 28, updated 2026-04-14.)
 *
 * GluMira™ is an educational platform, not a medical device.
 */

export type IOBHunterTierGateProps = {
  /** The feature the user tried to access. */
  feature: "save_scenario" | "export_pdf" | "extended_history" | "extra_what_if" | "ai_insights";
  /** Close callback — restores the user to the page behind the overlay. */
  onClose: () => void;
  /** CTA callback — triggers the signup/upgrade flow. */
  onSignUp: () => void;
}

const FEATURE_COPY: Record<
  IOBHunterTierGateProps["feature"],
  { title: string; subtitle: string }
> = {
  save_scenario: {
    title: "Save this scenario",
    subtitle: "Unlock unlimited what-if scenarios and 30 days of history.",
  },
  export_pdf: {
    title: "Export as PDF",
    subtitle: "Clinical reports and PDF export are a Pro feature.",
  },
  extended_history: {
    title: "Go beyond 7 days",
    subtitle: "Pro gives you 30-day history. Clinical gives you unlimited.",
  },
  extra_what_if: {
    title: "Run another what-if",
    subtitle: "Free includes 1 what-if scenario. Pro includes 5. Clinical is unlimited.",
  },
  ai_insights: {
    title: "Unlock Mira insights",
    subtitle: "AI-powered pattern detection and personalised context is a Pro feature.",
  },
};

export default function IOBHunterTierGate({
  feature,
  onClose,
  onSignUp,
}: IOBHunterTierGateProps) {
  const copy = FEATURE_COPY[feature];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tier-gate-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(7, 13, 26, 0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-card)",
          borderRadius: 16,
          border: "1px solid var(--border-light)",
          padding: "28px 32px",
          maxWidth: 440,
          width: "100%",
          boxShadow: "0 24px 60px rgba(0,0,0,0.35)",
        }}
      >
        <h2
          id="tier-gate-title"
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            color: "var(--text-primary)",
            fontFamily: "'Playfair Display', serif",
          }}
        >
          {copy.title}
        </h2>
        <p
          style={{
            margin: "10px 0 16px",
            fontSize: 14,
            color: "var(--text-secondary)",
            lineHeight: 1.5,
          }}
        >
          {copy.subtitle}
        </p>

        <div
          style={{
            background: "var(--card-hover, #f8fafc)",
            border: "1px solid var(--border-light)",
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 20,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 700,
              color: "#2ab5c1",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            14-day free trial
          </p>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 13,
              color: "var(--text-primary)",
              lineHeight: 1.5,
            }}
          >
            Save your pressure map, unlock 30-day history, AI insights,
            and unlimited what-if analysis. Cancel any time.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={onSignUp}
            style={{
              flex: 1,
              minWidth: 180,
              minHeight: 48,
              padding: "0 20px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #2ab5c1 0%, #1A2A5E 100%)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            Start 14-day free trial →
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              minHeight: 48,
              padding: "0 20px",
              borderRadius: 10,
              border: "1px solid var(--border-light)",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            Maybe later
          </button>
        </div>

        <p
          style={{
            margin: "16px 0 0",
            fontSize: 10,
            color: "var(--text-faint)",
            textAlign: "center",
          }}
        >
          GluMira™ is an educational platform, not a medical device.
        </p>
      </div>
    </div>
  );
}
