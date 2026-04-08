/**
 * GluMira™ V7 — Exercise Module Page
 * Exercise tracking and impact analysis for diabetes management.
 * Scandinavian Minimalist design track. Mobile-first, single column.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useKeyboardSave } from "@/hooks/useKeyboardSave";
import { useGlucoseUnits } from "@/context/GlucoseUnitsContext";
import { DISCLAIMER } from "@/lib/constants";
import {
  calculateExerciseImpact,
  getPreExerciseGuidance,
  getExerciseHypoRiskLevel,
  estimateCaloriesBurned,
  type ExerciseType,
  type ExerciseIntensity,
  type ExerciseEntry,
  type ExerciseImpact,
} from "@/lib/exercise-engine";

/* ─── Constants ──────────────────────────────────────────────────────────── */

const EXERCISE_TYPES: { value: ExerciseType; label: string; icon: string }[] = [
  { value: "walking",    label: "Walking",    icon: "\uD83D\uDEB6" },
  { value: "running",    label: "Running",    icon: "\uD83C\uDFC3" },
  { value: "cycling",    label: "Cycling",    icon: "\uD83D\uDEB4" },
  { value: "swimming",   label: "Swimming",   icon: "\uD83C\uDFCA" },
  { value: "resistance", label: "Weights",    icon: "\uD83C\uDFCB\uFE0F" },
  { value: "yoga",       label: "Yoga",       icon: "\uD83E\uDDD8" },
  { value: "hiit",       label: "HIIT",       icon: "\u26A1" },
  { value: "aerobic",    label: "Aerobic",    icon: "\uD83D\uDCAA" },
  { value: "anaerobic",  label: "Anaerobic",  icon: "\uD83D\uDD25" },
  { value: "mixed",      label: "Mixed",      icon: "\uD83C\uDFAF" },
  { value: "team_sport", label: "Team Sport", icon: "\u26BD" },
];

const INTENSITIES: { value: ExerciseIntensity; label: string; color: string; bg: string }[] = [
  { value: "light",    label: "Light",    color: "#16a34a", bg: "rgba(22,163,74,0.10)" },
  { value: "moderate", label: "Moderate", color: "#ca8a04", bg: "rgba(202,138,4,0.10)" },
  { value: "vigorous", label: "Vigorous", color: "#ea580c", bg: "rgba(234,88,12,0.10)" },
  { value: "extreme",  label: "Extreme",  color: "#dc2626", bg: "rgba(220,38,38,0.10)" },
];

const QUICK_DURATIONS = [15, 30, 45, 60, 90, 120];

const RISK_CONFIG: Record<string, { label: string; color: string; bg: string; width: string }> = {
  low:       { label: "Low",       color: "#16a34a", bg: "rgba(22,163,74,0.15)",  width: "25%" },
  moderate:  { label: "Moderate",  color: "#ca8a04", bg: "rgba(202,138,4,0.15)",  width: "50%" },
  high:      { label: "High",     color: "#ea580c", bg: "rgba(234,88,12,0.15)",  width: "75%" },
  very_high: { label: "Very High", color: "#dc2626", bg: "rgba(220,38,38,0.15)", width: "100%" },
};

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface ExerciseForm {
  type: ExerciseType | "";
  intensity: ExerciseIntensity | "";
  durationMinutes: string;
  glucoseBefore: string;
  glucoseAfter: string;
  insulinOnBoard: string;
  notes: string;
}

function nowLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const EMPTY_FORM: ExerciseForm = {
  type: "",
  intensity: "",
  durationMinutes: "",
  glucoseBefore: "",
  glucoseAfter: "",
  insulinOnBoard: "",
  notes: "",
};

/* ─── Styles ─────────────────────────────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  width: "100%", minHeight: 48, padding: "12px 14px", borderRadius: 8,
  border: "1px solid var(--border-light)", background: "var(--bg-card)", color: "var(--text-primary)",
  fontSize: 14, fontFamily: "'DM Sans', system-ui, sans-serif",
  outline: "none", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-primary)",
  marginBottom: 6, fontFamily: "'DM Sans', system-ui, sans-serif",
};

const focusIn = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = "var(--accent-teal)";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(42,181,193,0.15)";
};
const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = "var(--border-light)";
  e.currentTarget.style.boxShadow = "none";
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--bg-card)", borderRadius: 12,
  border: "1px solid var(--border-light)", padding: 20, marginBottom: 16,
};

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function ExerciseModule() {
  const { session } = useAuth();
  const { units } = useGlucoseUnits();
  const [form, setForm] = useState<ExerciseForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentExercises, setRecentExercises] = useState<ExerciseEntry[]>([]);

  /* ─── Derived state ────────────────────────────────────────────────── */
  const hasType = form.type !== "";
  const hasIntensity = form.intensity !== "";
  const hasDuration = form.durationMinutes !== "" && parseFloat(form.durationMinutes) > 0;
  const canAnalyse = hasType && hasIntensity && hasDuration;

  const impact: ExerciseImpact | null = canAnalyse
    ? calculateExerciseImpact(form.type as ExerciseType, form.intensity as ExerciseIntensity, parseFloat(form.durationMinutes))
    : null;

  const hypoRisk = canAnalyse
    ? getExerciseHypoRiskLevel(
        form.type as ExerciseType,
        form.intensity as ExerciseIntensity,
        parseFloat(form.durationMinutes),
        form.insulinOnBoard ? parseFloat(form.insulinOnBoard) : 0,
      )
    : null;

  const preGuidance = canAnalyse && form.glucoseBefore
    ? getPreExerciseGuidance(
        parseFloat(form.glucoseBefore),
        units,
        form.type as ExerciseType,
        form.intensity as ExerciseIntensity,
      )
    : null;

  /* ─── Load recent exercises ────────────────────────────────────────── */
  useEffect(() => {
    if (!session) return;
    fetch(`/trpc/exercise.recent?input=${encodeURIComponent(JSON.stringify({ json: { limit: 10 } }))}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res?.result?.data?.json) {
          setRecentExercises(res.result.data.json);
        }
      })
      .catch(() => {});
  }, [session, toast]);

  /* ─── Helpers ──────────────────────────────────────────────────────── */
  const set = (key: keyof ExerciseForm) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  /* ─── Save ─────────────────────────────────────────────────────────── */
  const save = useCallback(async () => {
    if (!session) return;
    if (!form.type) { setError("Please select an exercise type."); return; }
    if (!form.intensity) { setError("Please select an intensity level."); return; }
    if (!form.durationMinutes || parseFloat(form.durationMinutes) <= 0) {
      setError("Please enter a valid duration."); return;
    }

    setSaving(true);
    setError(null);
    setToast(null);

    try {
      const res = await fetch("/trpc/exercise.create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          json: {
            type: form.type,
            intensity: form.intensity,
            durationMinutes: parseFloat(form.durationMinutes),
            startTime: new Date().toISOString(),
            glucoseBefore: form.glucoseBefore ? parseFloat(form.glucoseBefore) : null,
            glucoseAfter: form.glucoseAfter ? parseFloat(form.glucoseAfter) : null,
            glucoseUnits: units,
            insulinOnBoard: form.insulinOnBoard ? parseFloat(form.insulinOnBoard) : null,
            notes: form.notes || null,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Save failed");

      setToast("Exercise logged");
      setTimeout(() => setToast(null), 3000);
      setForm({ ...EMPTY_FORM });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, [session, form, units]);

  useKeyboardSave(save);

  const unitLabel = units === "mmol" ? "mmol/L" : "mg/dL";

  /* ─── Render ───────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: "clamp(24px, 6vw, 32px)",
            fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px",
          }}>
            Exercise Module
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            Track exercise and analyse its impact on glucose management.
          </p>
        </div>

        {/* ── Exercise Type ────────────────────────────────────────────── */}
        <div style={cardStyle}>
          <label style={labelStyle}>Exercise Type</label>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
            gap: 8,
          }}>
            {EXERCISE_TYPES.map((et) => {
              const selected = form.type === et.value;
              return (
                <button
                  key={et.value}
                  type="button"
                  onClick={() => set("type")(et.value)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: 4, padding: "10px 4px", borderRadius: 8, cursor: "pointer",
                    border: `1.5px solid ${selected ? "var(--accent-teal)" : "var(--border-light)"}`,
                    background: selected ? "rgba(42,181,193,0.08)" : "var(--bg-card)",
                    color: selected ? "var(--accent-teal)" : "var(--text-primary)",
                    fontSize: 12, fontFamily: "'DM Sans', system-ui, sans-serif", fontWeight: selected ? 600 : 400,
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ fontSize: 22 }}>{et.icon}</span>
                  <span>{et.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Intensity ────────────────────────────────────────────────── */}
        <div style={cardStyle}>
          <label style={labelStyle}>Intensity</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {INTENSITIES.map((int) => {
              const selected = form.intensity === int.value;
              return (
                <button
                  key={int.value}
                  type="button"
                  onClick={() => set("intensity")(int.value)}
                  style={{
                    padding: "10px 4px", borderRadius: 8, cursor: "pointer",
                    border: `1.5px solid ${selected ? int.color : "var(--border-light)"}`,
                    background: selected ? int.bg : "var(--bg-card)",
                    color: selected ? int.color : "var(--text-secondary)",
                    fontSize: 13, fontWeight: selected ? 700 : 500,
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                    transition: "all 0.15s",
                  }}
                >
                  {int.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Duration ─────────────────────────────────────────────────── */}
        <div style={cardStyle}>
          <Field label="Duration (minutes)">
            <input
              type="text" inputMode="numeric" pattern="[0-9]*"
              value={form.durationMinutes}
              onChange={(e) => set("durationMinutes")(e.target.value)}
              placeholder="e.g. 45"
              style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
              onFocus={focusIn} onBlur={focusOut}
            />
          </Field>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {QUICK_DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => set("durationMinutes")(String(d))}
                style={{
                  padding: "6px 14px", borderRadius: 6, cursor: "pointer",
                  border: `1px solid ${form.durationMinutes === String(d) ? "var(--accent-teal)" : "var(--border-light)"}`,
                  background: form.durationMinutes === String(d) ? "rgba(42,181,193,0.08)" : "var(--bg-card)",
                  color: form.durationMinutes === String(d) ? "var(--accent-teal)" : "var(--text-secondary)",
                  fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500,
                }}
              >
                {d} min
              </button>
            ))}
          </div>
        </div>

        {/* ── Glucose Inputs ───────────────────────────────────────────── */}
        <div style={cardStyle}>
          <Field label={`Pre-exercise glucose (${unitLabel})`}>
            <input
              type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*"
              value={form.glucoseBefore}
              onChange={(e) => set("glucoseBefore")(e.target.value)}
              placeholder={units === "mmol" ? "e.g. 7.2" : "e.g. 130"}
              style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
              onFocus={focusIn} onBlur={focusOut}
            />
          </Field>
          <Field label={`Post-exercise glucose (${unitLabel})`}>
            <input
              type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*"
              value={form.glucoseAfter}
              onChange={(e) => set("glucoseAfter")(e.target.value)}
              placeholder={units === "mmol" ? "e.g. 5.8" : "e.g. 104"}
              style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
              onFocus={focusIn} onBlur={focusOut}
            />
          </Field>
          <Field label="Insulin on board (units, optional)">
            <input
              type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*"
              value={form.insulinOnBoard}
              onChange={(e) => set("insulinOnBoard")(e.target.value)}
              placeholder="e.g. 2.5"
              style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
              onFocus={focusIn} onBlur={focusOut}
            />
          </Field>
        </div>

        {/* ── Impact Analysis Card ─────────────────────────────────────── */}
        {impact && (
          <div style={{ ...cardStyle, borderColor: "var(--accent-teal)" }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700,
              color: "var(--text-primary)", margin: "0 0 14px",
            }}>
              Impact Analysis
            </h2>

            {/* Hypo Risk Indicator */}
            {hypoRisk && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                    Hypo Risk Level
                  </span>
                  <span style={{
                    fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20,
                    color: RISK_CONFIG[hypoRisk].color,
                    background: RISK_CONFIG[hypoRisk].bg,
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}>
                    {RISK_CONFIG[hypoRisk].label}
                  </span>
                </div>
                <div style={{
                  width: "100%", height: 6, borderRadius: 3,
                  background: "var(--border-light)", overflow: "hidden",
                }}>
                  <div style={{
                    width: RISK_CONFIG[hypoRisk].width, height: "100%", borderRadius: 3,
                    background: RISK_CONFIG[hypoRisk].color,
                    transition: "width 0.3s ease",
                  }} />
                </div>
              </div>
            )}

            {/* Metrics grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div style={{ padding: 12, borderRadius: 8, background: "rgba(42,181,193,0.06)", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "var(--accent-teal)", fontFamily: "'JetBrains Mono', monospace" }}>
                  {impact.sensitivityMultiplier}x
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 2 }}>
                  Sensitivity Increase
                </div>
              </div>
              <div style={{ padding: 12, borderRadius: 8, background: "rgba(42,181,193,0.06)", textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "var(--accent-teal)", fontFamily: "'JetBrains Mono', monospace" }}>
                  {impact.durationOfEffect}h
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 2 }}>
                  Effect Duration
                </div>
              </div>
              <div style={{ padding: 12, borderRadius: 8, background: "rgba(42,181,193,0.06)", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-teal)", fontFamily: "'JetBrains Mono', monospace" }}>
                  {impact.hypoRiskWindow.startHours}–{impact.hypoRiskWindow.endHours}h
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 2 }}>
                  Hypo Risk Window
                </div>
              </div>
              <div style={{ padding: 12, borderRadius: 8, background: "rgba(42,181,193,0.06)", textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent-teal)", fontFamily: "'JetBrains Mono', monospace" }}>
                  ~{canAnalyse
                    ? estimateCaloriesBurned(form.type as ExerciseType, form.intensity as ExerciseIntensity, parseFloat(form.durationMinutes))
                    : 0} kcal
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 2 }}>
                  Est. Calories
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { title: "Basal Adjustment", text: impact.basalReduction },
                { title: "Bolus Adjustment", text: impact.bolusReduction },
                { title: "Carb Recommendation", text: impact.carbRecommendation },
                { title: "Overnight Risk", text: impact.overnightRisk },
              ].map((item) => (
                <div key={item.title} style={{ padding: "10px 12px", borderRadius: 8, background: "var(--bg-primary)", border: "1px solid var(--border-light)" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'DM Sans', system-ui, sans-serif", marginBottom: 3 }}>
                    {item.title}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: 1.5 }}>
                    {item.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Educational note */}
            <div style={{
              marginTop: 14, padding: "10px 12px", borderRadius: 8,
              background: "rgba(42,181,193,0.06)", borderLeft: "3px solid var(--accent-teal)",
            }}>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: 1.5 }}>
                {impact.educationalNote}
              </div>
            </div>
          </div>
        )}

        {/* ── Pre-Exercise Guidance ────────────────────────────────────── */}
        {preGuidance && (
          <div style={cardStyle}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif", fontSize: 16, fontWeight: 700,
              color: "var(--text-primary)", margin: "0 0 10px",
            }}>
              Pre-Exercise Guidance
            </h2>
            <div style={{ fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: 1.6, whiteSpace: "pre-line" }}>
              {preGuidance}
            </div>
          </div>
        )}

        {/* ── Notes ────────────────────────────────────────────────────── */}
        <div style={cardStyle}>
          <Field label="Notes">
            <textarea
              value={form.notes} onChange={(e) => set("notes")(e.target.value)}
              placeholder="e.g. felt low energy at 30 min mark, reduced pace"
              rows={3}
              style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
              onFocus={focusIn as any} onBlur={focusOut as any}
            />
          </Field>
        </div>

        {/* ── Save Button & Feedback ───────────────────────────────────── */}
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
            type="button" onClick={save} disabled={saving}
            style={{
              width: "100%", minHeight: 52, borderRadius: 10, border: "none",
              background: saving ? "#94a3b8" : "#16a34a", color: "#ffffff",
              fontSize: 15, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              transition: "background 0.2s",
            }}
          >
            {saving ? "Saving..." : "Save Exercise"}
          </button>
        </div>

        {/* ── Recent Exercises ─────────────────────────────────────────── */}
        {recentExercises.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700,
              color: "var(--text-primary)", margin: "0 0 14px",
            }}>
              Recent Exercises
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentExercises.map((entry) => {
                const entryImpact = calculateExerciseImpact(entry.type, entry.intensity, entry.durationMinutes);
                const entryRisk = getExerciseHypoRiskLevel(entry.type, entry.intensity, entry.durationMinutes, 0);
                const typeInfo = EXERCISE_TYPES.find((t) => t.value === entry.type);
                const riskCfg = RISK_CONFIG[entryRisk];
                const startDate = new Date(entry.startTime);
                const timeStr = startDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })
                  + " " + startDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

                return (
                  <div key={entry.id} style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 20 }}>{typeInfo?.icon ?? "🏃"}</span>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                            {typeInfo?.label ?? entry.type} — {entry.intensity}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                            {timeStr} · {entry.durationMinutes} min
                          </div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12,
                        color: riskCfg.color, background: riskCfg.bg,
                        fontFamily: "'DM Sans', system-ui, sans-serif",
                      }}>
                        {riskCfg.label}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-secondary)", fontFamily: "'JetBrains Mono', monospace" }}>
                      <span>{entryImpact.sensitivityMultiplier}x sensitivity</span>
                      <span>{entryImpact.durationOfEffect}h effect</span>
                      {entry.glucoseBefore != null && entry.glucoseAfter != null && (
                        <span>{entry.glucoseBefore} → {entry.glucoseAfter} {unitLabel}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Disclaimer ───────────────────────────────────────────────── */}
        <div style={{
          marginTop: 28, padding: "14px 16px", borderRadius: 10,
          background: "var(--bg-card)", border: "1px solid var(--border-light)",
          fontSize: 12, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif",
          lineHeight: 1.5, textAlign: "center",
        }}>
          {DISCLAIMER}
        </div>

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
