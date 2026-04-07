/**
 * GluMira™ V7 — Condition Log Page
 * Quick-tap event buttons + intensity selector + notes.
 * Scandinavian Minimalist design track.
 */

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useKeyboardSave } from "@/hooks/useKeyboardSave";

/* ─── Constants ───────────────────────────────────────────────────────────── */

const EVENT_TYPES = [
  { value: "exercise",  label: "Exercise",   icon: "\u{1F3C3}" },
  { value: "illness",   label: "Illness",    icon: "\u{1F912}" },
  { value: "stress",    label: "Stress",     icon: "\u{1F616}" },
  { value: "sleep",     label: "Poor Sleep", icon: "\u{1F634}" },
  { value: "travel",    label: "Travel",     icon: "\u2708\uFE0F" },
  { value: "steroid",   label: "Steroid",    icon: "\u{1F48A}" },
  { value: "menstrual", label: "Menstrual",  icon: "\u{1F319}" },
  { value: "exam",      label: "Exam/Test",  icon: "\u{1F4DD}" },
  { value: "weather",   label: "Weather",    icon: "\u{1F321}\uFE0F" },
  { value: "other",     label: "Other",      icon: "\u2699\uFE0F" },
] as const;

const INTENSITIES = ["low", "moderate", "high", "severe"] as const;

const INTENSITY_COLOURS: Record<string, string> = {
  low: "#22c55e",
  moderate: "#eab308",
  high: "#f97316",
  severe: "#ef4444",
};

/* ─── Styles ──────────────────────────────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  width: "100%", minHeight: 48, padding: "12px 14px", borderRadius: 8,
  border: "1px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-primary)",
  fontSize: 14, fontFamily: "'DM Sans', system-ui, sans-serif",
  outline: "none", boxSizing: "border-box",
};

const focusIn = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = "var(--accent-teal)";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(42,181,193,0.15)";
};
const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = "var(--border-light)";
  e.currentTarget.style.boxShadow = "none";
};

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function ConditionLogPage() {
  const { session } = useAuth();
  const [eventType, setEventType] = useState("");
  const [intensity, setIntensity] = useState("");
  const [durationMin, setDurationMin] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async () => {
    if (!session || !eventType) return;
    setSaving(true);
    setError(null);
    setToast(null);
    try {
      const res = await fetch("/trpc/conditionEvent.create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          json: {
            event_time: new Date().toISOString(),
            event_type: eventType,
            intensity: intensity || null,
            duration_minutes: durationMin ? parseInt(durationMin, 10) : null,
            notes: notes || null,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Save failed");
      setToast("Event logged");
      setTimeout(() => setToast(null), 3000);
      setEventType("");
      setIntensity("");
      setDurationMin("");
      setNotes("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, [session, eventType, intensity, durationMin, notes]);

  useKeyboardSave(save);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: "clamp(24px, 6vw, 32px)",
            fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px",
          }}>
            Condition Log
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            Log events that may affect your insulin sensitivity.
          </p>
        </div>

        {/* ── Quick-tap event buttons ───────────────────────────────────── */}
        <div style={{
          background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)",
          padding: 20, marginBottom: 16,
        }}>
          <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            What happened?
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))", gap: 8 }}>
            {EVENT_TYPES.map((et) => {
              const active = eventType === et.value;
              return (
                <button
                  key={et.value}
                  type="button"
                  onClick={() => setEventType(et.value)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    padding: "12px 8px", borderRadius: 10, cursor: "pointer",
                    border: `2px solid ${active ? "var(--accent-teal)" : "var(--border-light)"}`,
                    background: active ? "rgba(42,181,193,0.08)" : "var(--bg-card)",
                    fontSize: 12, fontWeight: active ? 700 : 500, color: "var(--text-primary)",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: 22 }}>{et.icon}</span>
                  {et.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Intensity selector ────────────────────────────────────────── */}
        {eventType && (
          <div style={{
            background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)",
            padding: 20, marginBottom: 16,
          }}>
            <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Intensity
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {INTENSITIES.map((int) => {
                const active = intensity === int;
                return (
                  <button
                    key={int}
                    type="button"
                    onClick={() => setIntensity(int)}
                    style={{
                      padding: "10px 20px", borderRadius: 8, cursor: "pointer",
                      border: `2px solid ${active ? INTENSITY_COLOURS[int] : "var(--border-light)"}`,
                      background: active ? `${INTENSITY_COLOURS[int]}18` : "var(--bg-card)",
                      color: active ? INTENSITY_COLOURS[int] : "var(--text-secondary)",
                      fontSize: 13, fontWeight: active ? 700 : 500,
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                      textTransform: "capitalize",
                      transition: "all 0.15s",
                    }}
                  >
                    {int}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Duration & Notes ──────────────────────────────────────────── */}
        {eventType && (
          <div style={{
            background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)",
            padding: 20, marginBottom: 16,
          }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                Duration (minutes, optional)
              </label>
              <input
                type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" step="any" min="0"
                value={durationMin} onChange={(e) => setDurationMin(e.target.value)}
                placeholder="e.g. 45"
                style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
                onFocus={focusIn} onBlur={focusOut}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                Notes
              </label>
              <textarea
                value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional context — intensity, symptoms, timing"
                rows={3}
                style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
                onFocus={focusIn as any} onBlur={focusOut as any}
              />
            </div>
          </div>
        )}

        {/* ── Save & Feedback ───────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {error && (
            <div style={{ borderRadius: 8, background: "var(--error-bg)", border: "1px solid var(--error-border)", padding: "10px 14px", fontSize: 13, color: "var(--error-text)" }}>
              {error}
            </div>
          )}
          {toast && (
            <div style={{ borderRadius: 8, background: "#f0fdf4", border: "1px solid #86efac", padding: "10px 14px", fontSize: 13, color: "#166534" }}>
              {toast}
            </div>
          )}
          <button
            type="button" onClick={save} disabled={saving || !eventType}
            style={{
              width: "100%", minHeight: 52, borderRadius: 10, border: "none",
              background: saving || !eventType ? "#94a3b8" : "#16a34a", color: "#ffffff",
              fontSize: 15, fontWeight: 700, cursor: saving || !eventType ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              transition: "background 0.2s",
            }}
          >
            {saving ? "Saving..." : "Log Event"}
          </button>
        </div>

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
