/**
 * GluMira™ V7 — Settings Page
 * Auto-save on every change. No Save buttons.
 */

import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth, supabase } from "@/hooks/useAuth";
import UnitToggle from "@/components/UnitToggle";
import NightscoutSetup from "@/components/NightscoutSetup";
import ThemeToggle from "@/components/ThemeToggle";
import { useAutoSave, SavedIndicator } from "@/hooks/useAutoSave";

const NAVY = "var(--text-primary)";
const TEAL = "var(--accent-teal)";
const BORDER = "var(--border)";
const MUTED = "var(--text-muted)";

export default function SettingsPage() {
  const { user } = useAuth();
  const [nsUrl, setNsUrl] = useState(() => localStorage.getItem("ns_url") ?? "");
  const [nsSecret, setNsSecret] = useState(() => localStorage.getItem("ns_secret") ?? "");
  const [pwNew, setPwNew] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);

  // Auto-save Nightscout settings
  const saveNs = useCallback((vals: { url: string; secret: string }) => {
    localStorage.setItem("ns_url", vals.url);
    localStorage.setItem("ns_secret", vals.secret);
  }, []);
  const { status: nsStatus, save: triggerSaveNs } = useAutoSave(saveNs);

  const onNsUrlChange = (v: string) => {
    setNsUrl(v);
    triggerSaveNs({ url: v, secret: nsSecret });
  };
  const onNsSecretChange = (v: string) => {
    setNsSecret(v);
    triggerSaveNs({ url: nsUrl, secret: v });
  };

  async function changePw() {
    setPwMsg(null);
    const { error } = await supabase.auth.updateUser({ password: pwNew });
    if (error) setPwMsg(error.message);
    else { setPwMsg("Password updated."); setPwNew(""); }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "32px 20px 60px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: NAVY, marginBottom: 24 }}>Settings</h1>

        <Section title="Account">
          <p style={{ fontSize: 11, color: MUTED, marginBottom: 4 }}>Email</p>
          <p style={{ fontSize: 14, color: NAVY, margin: 0 }}>{user?.email ?? "\u2014"}</p>
        </Section>

        <Section title="Change Password">
          <input
            id="pw-new"
            type="password"
            value={pwNew}
            onChange={(e) => setPwNew(e.target.value)}
            placeholder="New password (min 8 chars)"
            style={inputStyle}
          />
          {pwMsg && (
            <p style={{ fontSize: 12, color: pwMsg.includes("updated") ? "#10b981" : "#ef4444", marginTop: 6 }} role="status">
              {pwMsg}
            </p>
          )}
          <button type="button"
            onClick={changePw}
            disabled={pwNew.length < 8}
            style={{
              marginTop: 10, padding: "9px 18px", borderRadius: 8, border: "none",
              background: TEAL, color: "#fff", fontSize: 13, fontWeight: 600,
              cursor: pwNew.length < 8 ? "default" : "pointer",
              opacity: pwNew.length < 8 ? 0.4 : 1,
              fontFamily: "inherit",
            }}
          >
            Update password
          </button>
        </Section>

        <Section title="Nightscout" indicator={<SavedIndicator status={nsStatus} />}>
          <label style={labelStyle}>Nightscout URL</label>
          <input
            id="ns-url"
            value={nsUrl}
            onChange={(e) => onNsUrlChange(e.target.value)}
            placeholder="https://yoursite.herokuapp.com"
            style={inputStyle}
          />
          <label style={{ ...labelStyle, marginTop: 12 }}>API Secret</label>
          <input
            id="ns-secret"
            type="password"
            value={nsSecret}
            onChange={(e) => onNsSecretChange(e.target.value)}
            placeholder="API Secret (optional)"
            style={inputStyle}
          />
        </Section>

        <NightscoutSetup />

        <Section title="Night Mode">
          <p style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}>
            Designed for caregivers at 2am who don&apos;t want to wake sleeping companions.
          </p>
          <ThemeToggle showLabel />
        </Section>

        <Section title="Glucose Units">
          <p style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}>
            Choose how glucose values are displayed across GluMira&trade;
          </p>
          <UnitToggle />
        </Section>

        <Section title="Caregivers">
          <p style={{ fontSize: 12, color: MUTED, marginBottom: 8 }}>
            Allow parents, guardians, or clinicians to view or edit this profile.
          </p>
          <Link to="/settings/caregivers" style={{ fontSize: 13, color: TEAL, textDecoration: "underline" }}>
            Manage Caregivers &rarr;
          </Link>
        </Section>

        <Section title="Data">
          <Link to="/import/handwritten" style={{ fontSize: 13, color: TEAL, textDecoration: "underline" }}>
            Import Handwritten Notes &rarr;
          </Link>
        </Section>

        <Section title="Legal">
          <p style={{ fontSize: 12, color: MUTED, lineHeight: 1.6, margin: 0 }}>
            GluMira&trade; is an educational platform, not a registered medical device. Powered by IOB Hunter&trade;
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({
  title, children, indicator,
}: { title: string; children: React.ReactNode; indicator?: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--bg-card)",
      border: `1px solid ${BORDER}`,
      borderRadius: 12,
      padding: "20px 22px",
      marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: NAVY, margin: 0 }}>{title}</h2>
        {indicator}
      </div>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${BORDER}`,
  background: "var(--bg-input)",
  fontSize: 14,
  color: NAVY,
  outline: "none",
  fontFamily: "'DM Sans', system-ui, sans-serif",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 500,
  color: MUTED,
  marginBottom: 5,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
