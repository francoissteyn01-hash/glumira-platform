/**
 * GluMira™ V7 — Emotional Distress Tracker
 * Collapsible daily card for stress, sleep, burnout, and caregiver notes.
 * Designed for doctor visit prep.
 */

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

/* ─── Styles ──────────────────────────────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  width: "100%", minHeight: 44, padding: "10px 14px", borderRadius: 8,
  border: "1px solid #dee2e6", background: "#ffffff", color: "#1a2a5e",
  fontSize: 14, fontFamily: "'DM Sans', system-ui, sans-serif",
  outline: "none", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 600, color: "#1a2a5e",
  marginBottom: 6, fontFamily: "'DM Sans', system-ui, sans-serif",
};

const DISTRESS_LABELS = ["", "Calm", "Mild", "Moderate", "High", "Overwhelmed"];
const DISTRESS_COLOURS = ["", "#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444"];

/* ═══════════════════════════════════════════════════════════════════════════ */

interface Props {
  defaultOpen?: boolean;
}

export default function EmotionalDistressTracker({ defaultOpen = false }: Props) {
  const { session } = useAuth();
  const [open, setOpen] = useState(defaultOpen);

  const [distress, setDistress] = useState(3);
  const [sleepHours, setSleepHours] = useState("");
  const [overnightAlarms, setOvernightAlarms] = useState("0");
  const [burnout, setBurnout] = useState(false);
  const [anxiety, setAnxiety] = useState(false);
  const [caregiverNotes, setCaregiverNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  const save = useCallback(async () => {
    if (!session) return;
    setSaving(true);
    setError(null);
    setToast(null);
    try {
      const res = await fetch("/trpc/emotionalDistress.create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          json: {
            log_date: today,
            distress_level: distress,
            sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
            overnight_alarms: overnightAlarms ? parseInt(overnightAlarms, 10) : 0,
            burnout_flag: burnout,
            anxiety_flag: anxiety,
            caregiver_notes: caregiverNotes || null,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Save failed");
      setToast("Saved for doctor visit");
      setTimeout(() => setToast(null), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, [session, today, distress, sleepHours, overnightAlarms, burnout, anxiety, caregiverNotes]);

  return (
    <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #dee2e6", overflow: "hidden" }}>
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", background: "none", border: "none", cursor: "pointer",
          fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700,
          color: "#1a2a5e", textAlign: "left",
        }}
      >
        <span>How are you feeling today?</span>
        <span style={{ fontSize: 14, color: "#52667a", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          &#9662;
        </span>
      </button>

      {open && (
        <div style={{ padding: "0 20px 20px" }}>

          {/* Distress slider */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>
              Stress level: <span style={{ color: DISTRESS_COLOURS[distress], fontWeight: 700 }}>{DISTRESS_LABELS[distress]}</span>
            </label>
            <input
              type="range" min="1" max="5" step="1"
              value={distress}
              onChange={(e) => setDistress(parseInt(e.target.value, 10))}
              style={{ width: "100%", accentColor: DISTRESS_COLOURS[distress], cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              <span>Calm</span><span>Mild</span><span>Moderate</span><span>High</span><span>Overwhelmed</span>
            </div>
          </div>

          {/* Sleep & Alarms */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Sleep (hours)</label>
              <input
                type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" step="0.5" min="0" max="24"
                value={sleepHours} onChange={(e) => setSleepHours(e.target.value)}
                placeholder="e.g. 6.5"
                style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>
            <div>
              <label style={labelStyle}>Overnight alarms</label>
              <input
                type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" step="1" min="0"
                value={overnightAlarms} onChange={(e) => setOvernightAlarms(e.target.value)}
                style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>
          </div>

          {/* Burnout / Anxiety toggles */}
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <label style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
              borderRadius: 8, cursor: "pointer",
              border: `2px solid ${burnout ? "#ef4444" : "#dee2e6"}`,
              background: burnout ? "rgba(239,68,68,0.06)" : "#ffffff",
              fontSize: 13, color: "#1a2a5e", fontFamily: "'DM Sans', system-ui, sans-serif",
              transition: "all 0.15s",
            }}>
              <input
                type="checkbox" checked={burnout} onChange={(e) => setBurnout(e.target.checked)}
                style={{ accentColor: "#ef4444", width: 18, height: 18, cursor: "pointer" }}
              />
              I feel overwhelmed
            </label>
            <label style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
              borderRadius: 8, cursor: "pointer",
              border: `2px solid ${anxiety ? "#f97316" : "#dee2e6"}`,
              background: anxiety ? "rgba(249,115,22,0.06)" : "#ffffff",
              fontSize: 13, color: "#1a2a5e", fontFamily: "'DM Sans', system-ui, sans-serif",
              transition: "all 0.15s",
            }}>
              <input
                type="checkbox" checked={anxiety} onChange={(e) => setAnxiety(e.target.checked)}
                style={{ accentColor: "#f97316", width: 18, height: 18, cursor: "pointer" }}
              />
              Anxiety present
            </label>
          </div>

          {/* Caregiver notes */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Caregiver notes (for doctor visit)</label>
            <textarea
              value={caregiverNotes} onChange={(e) => setCaregiverNotes(e.target.value)}
              placeholder="Observations, concerns, or questions to raise with the healthcare team"
              rows={4}
              style={{ ...inputStyle, resize: "vertical", minHeight: 90 }}
            />
          </div>

          {/* Feedback */}
          {error && (
            <div style={{ borderRadius: 8, background: "#fef2f2", border: "1px solid #fca5a5", padding: "10px 14px", fontSize: 13, color: "#991b1b", marginBottom: 12 }}>
              {error}
            </div>
          )}
          {toast && (
            <div style={{ borderRadius: 8, background: "#f0fdf4", border: "1px solid #86efac", padding: "10px 14px", fontSize: 13, color: "#166534", marginBottom: 12 }}>
              {toast}
            </div>
          )}

          {/* Save CTA */}
          <button
            type="button" onClick={save} disabled={saving}
            style={{
              width: "100%", minHeight: 48, borderRadius: 10, border: "none",
              background: saving ? "#94a3b8" : "#2ab5c1", color: "#ffffff",
              fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              transition: "background 0.2s",
            }}
          >
            {saving ? "Saving..." : "Save for doctor visit"}
          </button>
        </div>
      )}
    </div>
  );
}
