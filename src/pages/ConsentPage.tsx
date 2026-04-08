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

interface ConsentItem {
  id: string;
  label: string;
  mandatory: boolean;
  link?: { text: string; href: string };
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
          <div
            style={{
              fontFamily: T.heading,
              fontSize: 28,
              fontWeight: 700,
              color: T.teal,
              letterSpacing: "-0.5px",
            }}
          >
            GluMira™
          </div>
          <h1
            style={{
              fontFamily: T.heading,
              fontSize: 22,
              fontWeight: 700,
              color: T.white,
              marginTop: 8,
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
              <label
                key={item.id}
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
                  {!item.mandatory && (
                    <span style={{ color: T.muted, fontSize: 12, marginLeft: 6 }}>
                      (if applicable)
                    </span>
                  )}
                </span>
              </label>
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
