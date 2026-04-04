/**
 * GluMira™ V7 — Safe Mode Entry Page
 * 5 demo profiles + 2 custom profile slots.
 * Scandinavian Minimalist. Mobile first.
 */

import { useNavigate } from "react-router-dom";
import { DEMO_PROFILES, type DemoProfile } from "@/data/demo-profiles";
import { DISCLAIMER } from "@/lib/constants";

const T = {
  bg: "#f8f9fa",
  navy: "#1a2a5e",
  teal: "#2ab5c1",
  amber: "#f59e0b",
  muted: "#718096",
  border: "#e2e8f0",
  font: "'DM Sans', system-ui, sans-serif",
};

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  caregiver: { bg: "rgba(42,181,193,0.08)", text: T.teal, border: "rgba(42,181,193,0.3)" },
  patient:   { bg: "rgba(26,42,94,0.06)",   text: T.navy, border: "rgba(26,42,94,0.2)" },
  clinician: { bg: "rgba(245,158,11,0.06)", text: T.amber, border: "rgba(245,158,11,0.3)" },
};

function getCustomProfiles(): { slot1: any | null; slot2: any | null } {
  try {
    const s1 = localStorage.getItem("glumira_custom_profile_1");
    const s2 = localStorage.getItem("glumira_custom_profile_2");
    return { slot1: s1 ? JSON.parse(s1) : null, slot2: s2 ? JSON.parse(s2) : null };
  } catch { return { slot1: null, slot2: null }; }
}

function ProfileCard({ profile, onClick }: { profile: DemoProfile; onClick: () => void }) {
  const rc = ROLE_COLORS[profile.role] ?? ROLE_COLORS.patient;
  return (
    <div
      onClick={onClick}
      style={{
        background: "#ffffff",
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        padding: "20px 20px 16px",
        cursor: "pointer",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = T.teal;
        e.currentTarget.style.boxShadow = "0 2px 12px rgba(42,181,193,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = T.border;
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            padding: "3px 8px",
            borderRadius: 4,
            background: rc.bg,
            color: rc.text,
            border: `1px solid ${rc.border}`,
          }}
        >
          {profile.role}
        </span>
      </div>
      <p style={{ fontSize: 15, fontWeight: 600, color: T.navy, margin: "0 0 6px", fontFamily: T.font }}>
        {profile.name}
      </p>
      <p style={{ fontSize: 13, color: T.muted, margin: "0 0 14px", lineHeight: 1.5, fontFamily: T.font }}>
        {profile.description}
      </p>
      <button
        style={{
          width: "100%",
          padding: "9px 0",
          borderRadius: 8,
          border: `1px solid ${T.teal}`,
          background: "rgba(42,181,193,0.06)",
          color: T.teal,
          fontSize: 13,
          fontWeight: 500,
          cursor: "pointer",
          fontFamily: T.font,
          transition: "background 0.2s",
        }}
      >
        Explore
      </button>
    </div>
  );
}

export default function SafeModePage() {
  const navigate = useNavigate();
  const { slot1, slot2 } = getCustomProfiles();

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.font }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px 60px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: T.teal, marginBottom: 8 }}>
            Safe Mode
          </p>
          <h1 style={{ fontSize: "clamp(24px, 6vw, 32px)", fontWeight: 700, color: T.navy, margin: "0 0 10px", letterSpacing: "-0.02em" }}>
            Explore GluMira™
          </h1>
          <p style={{ fontSize: 15, color: T.muted, maxWidth: 440, margin: "0 auto", lineHeight: 1.6 }}>
            No real data needed. Pick a demo profile or create your own.
          </p>
        </div>

        {/* Demo profiles grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {DEMO_PROFILES.map((p) => (
            <ProfileCard key={p.id} profile={p} onClick={() => navigate(`/safe-mode/profile/${p.id}`)} />
          ))}
        </div>

        {/* Custom profiles section */}
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 28, marginBottom: 32 }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: T.navy, marginBottom: 4 }}>
            Or create your own
          </p>
          <p style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>
            Max 2 custom profiles. Saved locally on this device.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {/* Slot 1 */}
            {slot1 ? (
              <button
                onClick={() => navigate(`/safe-mode/profile/custom-1`)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: `1px solid ${T.teal}`,
                  background: "rgba(42,181,193,0.06)",
                  color: T.teal,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: T.font,
                }}
              >
                {slot1.name ?? "Custom Profile 1"} — Explore
              </button>
            ) : (
              <button
                onClick={() => navigate("/safe-mode/create?slot=1")}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: `1px dashed ${T.border}`,
                  background: "transparent",
                  color: T.navy,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: T.font,
                }}
              >
                + Create Profile 1
              </button>
            )}
            {/* Slot 2 */}
            {slot2 ? (
              <button
                onClick={() => navigate(`/safe-mode/profile/custom-2`)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: `1px solid ${T.teal}`,
                  background: "rgba(42,181,193,0.06)",
                  color: T.teal,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: T.font,
                }}
              >
                {slot2.name ?? "Custom Profile 2"} — Explore
              </button>
            ) : (
              <button
                onClick={() => navigate("/safe-mode/create?slot=2")}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: `1px dashed ${T.border}`,
                  background: "transparent",
                  color: T.navy,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  fontFamily: T.font,
                }}
              >
                + Create Profile 2
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
          <p style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>
            Safe sandbox. No real patient data stored. All demo data is fictional.
          </p>
          <p style={{ fontSize: 10, color: "rgba(113,128,150,0.6)", lineHeight: 1.5 }}>
            {DISCLAIMER}
          </p>
        </div>
      </div>
    </div>
  );
}
