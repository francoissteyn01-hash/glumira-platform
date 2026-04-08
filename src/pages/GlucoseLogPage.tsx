/**
 * GluMira™ V7 — Glucose Log Page
 * Scandinavian Minimalist design track.
 * Mobile-first, single column. Manual fingerstick and CGM reading entry.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useKeyboardSave } from "@/hooks/useKeyboardSave";
import { useGlucoseUnits } from "@/context/GlucoseUnitsContext";
import { formatGlucose, getUnitLabel, convertToMmol } from "@/utils/glucose-units";
import type { GlucoseUnit } from "@/utils/glucose-units";

/* ─── Constants ───────────────────────────────────────────────────────────── */

const SOURCES = [
  { value: "fingerstick", label: "Fingerstick" },
  { value: "cgm",         label: "CGM" },
  { value: "csv",         label: "CSV Import" },
  { value: "flash_scan",  label: "Flash Scan" },
  { value: "lab_a1c",     label: "Lab \u2014 Last A1c" },
] as const;

const CONTEXT_TAGS = [
  "Pre-meal",
  "Post-meal (1h)",
  "Post-meal (2h)",
  "Fasting",
  "Bedtime",
  "Overnight",
  "Pre-exercise",
  "Post-exercise",
  "Hypo treatment check",
  "Random",
] as const;

const LOG_REASONS = [
  { value: "sensor_calibration",  label: "Sensor Calibration" },
  { value: "sensor_replacement",  label: "Sensor Replacement" },
  { value: "hypo_verification",   label: "Hypo Event Verification" },
  { value: "csv_import",          label: "Import CSV" },
  { value: "basal_testing",       label: "Basal Testing" },
  { value: "other",               label: "Other (Just curious)" },
] as const;

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface GlucoseForm {
  source: string;
  glucose_value: string;
  glucose_units: GlucoseUnit;
  reading_time: string;
  context_tag: string;
  log_reason: string;
  notes: string;
}

interface RecentReading {
  id: string;
  reading_time: string;
  glucose_value_mmol: number;
  glucose_units: GlucoseUnit;
  source: string;
  context_tag: string | null;
  notes: string | null;
}

function nowLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const EMPTY_FORM: GlucoseForm = {
  source: "fingerstick",
  glucose_value: "",
  glucose_units: "mmol",
  reading_time: nowLocal(),
  context_tag: "",
  log_reason: "",
  notes: "",
};

/* ─── Styles ──────────────────────────────────────────────────────────────── */

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

/* ─── Field wrapper ───────────────────────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

/* ─── Range classification ────────────────────────────────────────────────── */

function classifyReading(mmolValue: number): { color: string; label: string } {
  if (mmolValue < 3.9) return { color: "#ef4444", label: "LOW" };
  if (mmolValue <= 10.0) return { color: "#22c55e", label: "In Range" };
  if (mmolValue <= 13.9) return { color: "#eab308", label: "HIGH" };
  return { color: "#ef4444", label: "VERY HIGH" };
}

function parseToMmol(raw: string, unit: GlucoseUnit): number | null {
  const v = parseFloat(raw);
  if (isNaN(v) || v <= 0) return null;
  return unit === "mg" ? convertToMmol(v) : v;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function GlucoseLogPage() {
  const { session } = useAuth();
  const { units: globalUnits } = useGlucoseUnits();
  const [form, setForm] = useState<GlucoseForm>({ ...EMPTY_FORM, glucose_units: globalUnits });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recentReadings, setRecentReadings] = useState<RecentReading[]>([]);

  // Sync form glucose_units when global toggle changes
  useEffect(() => {
    setForm((f) => ({ ...f, glucose_units: globalUnits }));
  }, [globalUnits]);

  /* ─── Load today's readings ────────────────────────────────────────── */
  const loadRecent = useCallback(() => {
    if (!session) return;
    const today = new Date().toISOString().slice(0, 10);
    fetch(`/trpc/glucoseLog.getByDate?input=${encodeURIComponent(JSON.stringify({ json: { date: today } }))}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res?.result?.data?.json) {
          setRecentReadings((res.result.data.json as RecentReading[]).slice(0, 10));
        }
      })
      .catch(() => {});
  }, [session]);

  useEffect(() => { loadRecent(); }, [loadRecent]);

  /* ─── Form helpers ─────────────────────────────────────────────────── */
  const set = (key: keyof GlucoseForm) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  const mmolValue = parseToMmol(form.glucose_value, form.glucose_units);
  const rangeInfo = mmolValue !== null ? classifyReading(mmolValue) : null;

  /* ─── Save ──────────────────────────────────────────────────────────── */
  const save = useCallback(async () => {
    if (!session) return;
    const parsed = parseToMmol(form.glucose_value, form.glucose_units);
    if (parsed === null) { setError("Please enter a valid glucose reading."); return; }

    setSaving(true);
    setError(null);
    setToast(null);

    try {
      const res = await fetch("/trpc/glucoseLog.create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          json: {
            reading_time: new Date(form.reading_time).toISOString(),
            source: form.source,
            glucose_value_mmol: parsed,
            glucose_units: form.glucose_units,
            context_tag: form.context_tag || null,
            log_reason: form.log_reason || null,
            notes: form.notes || null,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Save failed");

      setToast("Reading saved");
      setTimeout(() => setToast(null), 3000);
      setForm({ ...EMPTY_FORM, reading_time: nowLocal(), glucose_units: form.glucose_units });
      loadRecent();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, [session, form, loadRecent]);

  useKeyboardSave(save);

  /* ─── Render ────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: "clamp(24px, 6vw, 32px)",
            fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px",
          }}>
            Glucose Log
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            Record fingerstick, CGM, flash scan, CSV, and lab glucose readings.
          </p>
        </div>

        {/* ── Source & Timestamp ────────────────────────────────────────── */}
        <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", padding: 20, marginBottom: 16 }}>
          <Field label="Source">
            <select
              value={form.source} onChange={(e) => set("source")(e.target.value)}
              style={{ ...inputStyle, appearance: "auto", cursor: "pointer" }}
              onFocus={focusIn as any} onBlur={focusOut as any}
            >
              {SOURCES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Time">
            <input
              type="datetime-local" value={form.reading_time}
              onChange={(e) => set("reading_time")(e.target.value)}
              style={inputStyle} onFocus={focusIn} onBlur={focusOut}
            />
          </Field>
        </div>

        {/* ── Mira note: CGM timing guidance ───────────────────────────── */}
        {form.source === "fingerstick" && (
          <div style={{
            background: "rgba(42,181,193,0.06)", borderRadius: 12, border: "1px solid rgba(42,181,193,0.25)",
            padding: "16px 20px", marginBottom: 16, display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>&#x1F989;</span>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--accent-teal)", margin: "0 0 4px", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                Note from Mira
              </p>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.55, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                If you are not using a CGM, see the timing options below &mdash; structured fingerstick logging
                (pre-meal, post-meal, fasting, bedtime) will upgrade your blood sugar trend dramatically and show
                your doctor or clinician the effectiveness of your regime.
              </p>
            </div>
          </div>
        )}

        {/* ── Why are you logging? ────────────────────────────────────── */}
        <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", padding: 20, marginBottom: 16 }}>
          <Field label="Why are you logging?">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {LOG_REASONS.map((reason) => {
                const active = form.log_reason === reason.value;
                return (
                  <button
                    key={reason.value} type="button"
                    onClick={() => set("log_reason")(active ? "" : reason.value)}
                    style={{
                      padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                      fontFamily: "'DM Sans', system-ui, sans-serif", cursor: "pointer",
                      border: `1px solid ${active ? "var(--accent-teal)" : "var(--border-light)"}`,
                      background: active ? "rgba(42,181,193,0.10)" : "var(--bg-primary)",
                      color: active ? "var(--accent-teal)" : "var(--text-secondary)",
                      transition: "all 0.15s",
                    }}
                  >
                    {reason.label}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        {/* ── CSV Import (when CSV source or Import CSV reason selected) ── */}
        {(form.source === "csv" || form.log_reason === "csv_import") && (
          <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", padding: 20, marginBottom: 16 }}>
            <Field label="Import CSV file">
              <label style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                minHeight: 80, borderRadius: 8, border: "2px dashed var(--border-light)",
                background: "var(--bg-primary)", cursor: "pointer",
                fontSize: 14, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif",
              }}>
                &#x1F4C4; Tap to select CSV file
                <input
                  type="file" accept=".csv,.txt" style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    set("notes")(`CSV import: ${file.name}`);
                  }}
                />
              </label>
              <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 8, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                Accepts CSV exports from Clarity, LibreView, xDrip+, Nightscout, and most CGM apps.
              </p>
            </Field>
          </div>
        )}

        {/* ── Glucose Value & Unit ─────────────────────────────────────── */}
        <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", padding: 20, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
            <Field label="Glucose reading">
              <input
                type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" step="any" min="0"
                value={form.glucose_value} onChange={(e) => set("glucose_value")(e.target.value)}
                placeholder={form.glucose_units === "mmol" ? "e.g. 5.4" : "e.g. 97"}
                style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
                onFocus={focusIn} onBlur={focusOut}
              />
            </Field>
            <Field label="Unit">
              <select
                value={form.glucose_units} onChange={(e) => set("glucose_units")(e.target.value)}
                style={{ ...inputStyle, appearance: "auto", cursor: "pointer", minWidth: 90 }}
                onFocus={focusIn as any} onBlur={focusOut as any}
              >
                <option value="mmol">mmol/L</option>
                <option value="mg">mg/dL</option>
              </select>
            </Field>
          </div>

          {/* Colour-coded range indicator */}
          {rangeInfo && (
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
              borderRadius: 8, background: `${rangeInfo.color}10`, border: `1px solid ${rangeInfo.color}40`,
              marginTop: 4,
            }}>
              <div style={{
                width: 12, height: 12, borderRadius: "50%", background: rangeInfo.color, flexShrink: 0,
              }} />
              <span style={{
                fontSize: 14, fontWeight: 700, color: rangeInfo.color,
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {form.glucose_value} {getUnitLabel(form.glucose_units)}
              </span>
              <span style={{
                fontSize: 12, fontWeight: 600, color: rangeInfo.color,
                fontFamily: "'DM Sans', system-ui, sans-serif", marginLeft: "auto",
              }}>
                {rangeInfo.label}
              </span>
            </div>
          )}
        </div>

        {/* ── Context Tag ──────────────────────────────────────────────── */}
        <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", padding: 20, marginBottom: 16 }}>
          <Field label="Context">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {CONTEXT_TAGS.map((tag) => {
                const active = form.context_tag === tag;
                return (
                  <button
                    key={tag} type="button"
                    onClick={() => set("context_tag")(active ? "" : tag)}
                    style={{
                      padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 500,
                      fontFamily: "'DM Sans', system-ui, sans-serif", cursor: "pointer",
                      border: `1px solid ${active ? "var(--accent-teal)" : "var(--border-light)"}`,
                      background: active ? "rgba(42,181,193,0.10)" : "var(--bg-primary)",
                      color: active ? "var(--accent-teal)" : "var(--text-secondary)",
                      transition: "all 0.15s",
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        {/* ── Notes ────────────────────────────────────────────────────── */}
        <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", padding: 20, marginBottom: 16 }}>
          <Field label="Notes">
            <textarea
              value={form.notes} onChange={(e) => set("notes")(e.target.value)}
              placeholder="e.g. feeling shaky, post-correction recheck, sensor warm-up"
              rows={3}
              style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
              onFocus={focusIn as any} onBlur={focusOut as any}
            />
          </Field>
        </div>

        {/* ── Save Button & Feedback ────────────────────────────────────── */}
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
            {saving ? "Saving..." : "Save Reading"}
          </button>
        </div>

        {/* ── Recent Readings ──────────────────────────────────────────── */}
        {recentReadings.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h2 style={{
              fontFamily: "'Playfair Display', serif", fontSize: 18,
              fontWeight: 700, color: "var(--text-primary)", margin: "0 0 12px",
            }}>
              Today's Readings
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentReadings.map((r) => {
                const range = classifyReading(r.glucose_value_mmol);
                const displayVal = formatGlucose(r.glucose_value_mmol, form.glucose_units);
                const time = new Date(r.reading_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                return (
                  <div key={r.id} style={{
                    background: "var(--bg-card)", borderRadius: 10, border: "1px solid var(--border-light)",
                    padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: "50%", background: range.color, flexShrink: 0,
                    }} />
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 15, fontWeight: 600,
                      color: "var(--text-primary)", minWidth: 70,
                    }}>
                      {displayVal}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                      {getUnitLabel(form.glucose_units)}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: range.color,
                      fontFamily: "'DM Sans', system-ui, sans-serif",
                    }}>
                      {range.label}
                    </span>
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                      {time}
                    </span>
                    {r.context_tag && (
                      <span style={{
                        fontSize: 11, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif",
                        padding: "2px 8px", borderRadius: 4, background: "var(--bg-primary)",
                        border: "1px solid var(--border-light)",
                      }}>
                        {r.context_tag}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif", textTransform: "capitalize" }}>
                      {r.source.replace("_", " ")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Disclaimer ───────────────────────────────────────────────── */}
        <div style={{
          marginTop: 32, padding: "14px 16px", borderRadius: 8,
          background: "var(--bg-primary)", border: "1px solid var(--border-light)",
          fontSize: 11, lineHeight: 1.5, color: "var(--text-faint)",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          GluMira™ is an educational tool only and does not provide medical advice, diagnosis, or treatment.
          Always consult your diabetes care team before making changes to your insulin regimen.
          Glucose readings displayed here are for personal tracking purposes and should not replace
          laboratory results used for clinical decision-making.
        </div>

        {/* Spacer for mobile bottom nav */}
        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
