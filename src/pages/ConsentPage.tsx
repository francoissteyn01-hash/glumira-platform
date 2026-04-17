/**
 * GluMira™ V7 — ConsentPage.tsx
 * Block 10: Privacy & Consent capture during onboarding.
 * Scandinavian Minimalist. Navy gradient background.
 */

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const T = {
  navy: "#1a2a5e",
  navyDeep: "#0d1b3e",
  teal: "#2ab5c1",
  amber: "#f59e0b",
  white: "#ffffff",
  muted: "#94a3b8",
  heading: "'Playfair Display', Georgia, serif",
  body: "'DM Sans', -apple-system, sans-serif",
};

type ConsentItem = {
  id: string;
  label: string;
  mandatory: boolean;
  link?: { text: string; href: string };
  sublabel?: string;
  badgeText?: string;
}

const CONSENT_ITEMS: ConsentItem[] = [
  {
    id: "educational",
    label: "I understand GluMira™ is an educational platform, not a medical device",
    mandatory: true,
  },
  {
    id: "data_storage",
    label: "I consent to my health data being stored securely in encrypted databases",
    mandatory: true,
  },
  {
    id: "no_medical_advice",
    label: "I understand that GluMira™ does not provide medical advice or treatment recommendations",
    mandatory: true,
  },
  {
    id: "anonymised_data",
    label: "I consent to anonymised data being used for platform improvement",
    mandatory: true,
  },
  {
    id: "privacy_policy",
    label: "I have read and agree to the",
    mandatory: true,
    link: { text: "Privacy Policy", href: "/privacy" },
  },
  {
    id: "terms_of_use",
    label: "I have read and agree to the",
    mandatory: true,
    link: { text: "Terms of Use", href: "/terms" },
  },
  {
    id: "minor_consent",
    label: "I am a parent/guardian providing consent on behalf of a minor",
    mandatory: false,
  },
  {
    id: "research_programme",
    label: "I voluntarily consent to contribute my anonymised glucose and insulin patterns to the GluMira™ Real-World Research Programme",
    mandatory: false,
    sublabel: "Your identity is never shared. Data is aggregated only. You may withdraw at any time from Settings → Research.",
    badgeText: "Optional — does not affect platform access",
    link: { text: "Learn more", href: "/research" },
  },
];

export default function ConsentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const mandatoryIds = CONSENT_ITEMS.filter((c) => c.mandatory).map((c) => c.id);
  const allMandatoryChecked = mandatoryIds.every((id) => checked[id]);

  const toggle = (id: string) =>
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleContinue = async () => {
    if (!allMandatoryChecked || submitting) return;
    setSubmitting(true);

    const timestamp = new Date().toISOString();
    const consentRecord = {
      userId: user?.id ?? "anonymous",
      timestamp,
      consents: Object.entries(checked)
        .filter(([, v]) => v)
        .map(([id]) => id),
    };

    // Persist to localStorage
    localStorage.setItem("glumira_consent", JSON.stringify(consentRecord));
    localStorage.setItem("glumira_consent_ts", timestamp);

    // POST to tRPC endpoint
    try {
      await fetch("/trpc/consent.create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(consentRecord),
      });
    } catch {
      // Consent saved locally; server sync will retry on next session
    }

    navigate("/onboarding/story");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(170deg, ${T.navyDeep} 0%, ${T.navy} 50%, #1e3a6e 100%)`,
        fontFamily: T.body,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 640 }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img
            src="/brand/mira-hero.png"
            alt="Mira — GluMira™ guardian owl"
            style={{
              display: "block",
              width: 80,
              height: 80,
              objectFit: "contain",
              margin: "0 auto 12px",
              mixBlendMode: "screen",
              filter: "drop-shadow(0 4px 18px rgba(42,181,193,0.3))",
            }}
          />
          <div
            style={{
              fontFamily: T.heading,
              fontSize: 28,
              fontWeight: 700,
              color: T.white,
              letterSpacing: "-0.5px",
            }}
          >
            GluMira<span style={{ color: T.teal }}>™</span>
          </div>
          <h1
            style={{
              fontFamily: T.heading,
              fontSize: 22,
              fontWeight: 700,
              color: T.white,
              marginTop: 14,
            }}
          >
            Privacy &amp; Consent
          </h1>
          <p style={{ color: T.muted, fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
            Before we begin, please review and accept the following to continue.
          </p>
        </div>

        {/* Consent card */}
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: "28px 24px",
            backdropFilter: "blur(12px)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {CONSENT_ITEMS.map((item) => (
              <div key={item.id}>
                {item.id === "research_programme" && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12, marginTop: 4 }} />
                )}
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    cursor: "pointer",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!checked[item.id]}
                    onChange={() => toggle(item.id)}
                    style={{
                      width: 20,
                      height: 20,
                      minWidth: 20,
                      marginTop: 2,
                      accentColor: T.teal,
                      cursor: "pointer",
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{ color: T.white, fontSize: 14, lineHeight: 1.55 }}>
                      {item.label}
                      {item.link && (
                        <>
                          {" "}
                          <a
                            href={item.link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: T.teal,
                              textDecoration: "underline",
                              textUnderlineOffset: 2,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.link.text}
                          </a>
                        </>
                      )}
                      {!item.mandatory && !item.badgeText && (
                        <span style={{ color: T.muted, fontSize: 12, marginLeft: 6 }}>
                          (if applicable)
                        </span>
                      )}
                    </span>
                    {item.sublabel && (
                      <div style={{ color: "#64748b", fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
                        {item.sublabel}
                      </div>
                    )}
                    {item.badgeText && (
                      <div style={{
                        display: "inline-block", marginTop: 6,
                        background: "rgba(245,158,11,0.12)",
                        border: "1px solid rgba(245,158,11,0.3)",
                        borderRadius: 4, padding: "2px 8px",
                        fontSize: 11, color: "#f59e0b"
                      }}>
                        {item.badgeText}
                      </div>
                    )}
                  </div>
                </label>
              </div>
            ))}
          </div>

          {/* Continue button */}
          <button
            type="button"
            disabled={!allMandatoryChecked || submitting}
            onClick={handleContinue}
            style={{
              width: "100%",
              marginTop: 28,
              padding: "14px 24px",
              background: allMandatoryChecked
                ? `linear-gradient(135deg, ${T.teal}, #1e9eab)`
                : "rgba(255,255,255,0.08)",
              color: allMandatoryChecked ? T.white : T.muted,
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              fontFamily: T.body,
              cursor: allMandatoryChecked ? "pointer" : "not-allowed",
              transition: "all 0.2s ease",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? "Saving..." : "Continue"}
          </button>
        </div>

        {/* Data deletion notice */}
        <p
          style={{
            textAlign: "center",
            color: T.muted,
            fontSize: 12,
            marginTop: 20,
            lineHeight: 1.5,
          }}
        >
          You can request complete deletion of your data at any time from Settings.
        </p>
      </div>
    </div>
  );
}
