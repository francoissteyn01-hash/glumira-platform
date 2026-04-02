/**
 * GluMira™ V7 — Insulin Log Page
 * Scandinavian Minimalist design track.
 * Mobile-first, single column. Decimal precision on dose units.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

/* ─── Constants ───────────────────────────────────────────────────────────── */

const EVENT_TYPES = [
  { value: "basal",       label: "Basal" },
  { value: "meal_bolus",  label: "Meal Bolus" },
  { value: "correction",  label: "Correction" },
  { value: "pre_bolus",   label: "Pre-Bolus" },
  { value: "snack_cover", label: "Snack Cover" },
] as const;

const INSULIN_LABELS: Record<string, string> = {
  glargine_u100: "Glargine U-100 (Lantus/Basaglar)",
  glargine_u300: "Glargine U-300 (Toujeo)",
  degludec: "Degludec (Tresiba)",
  detemir: "Detemir (Levemir)",
  nph: "NPH (Humulin N/Novolin N)",
  aspart: "Aspart (NovoRapid/Fiasp)",
  lispro: "Lispro (Humalog/Lyumjev)",
  glulisine: "Glulisine (Apidra)",
  regular: "Regular (Actrapid/Humulin R)",
};

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface InsulinForm {
  event_time: string;
  event_type: string;
  insulin_type: string;
  dose_units: string;
  food_linked_id: string;
  is_correction: boolean;
  notes: string;
}

interface MealEntry {
  id: string;
  meal_time: string;
  event_type: string;
  food_description: string | null;
}

function nowLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const EMPTY_FORM: InsulinForm = {
  event_time: nowLocal(),
  event_type: "meal_bolus",
  insulin_type: "",
  dose_units: "",
  food_linked_id: "",
  is_correction: false,
  notes: "",
};

/* ─── Styles ──────────────────────────────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  width: "100%", minHeight: 48, padding: "12px 14px", borderRadius: 8,
  border: "1px solid #dee2e6", background: "#ffffff", color: "#1a2a5e",
  fontSize: 14, fontFamily: "'DM Sans', system-ui, sans-serif",
  outline: "none", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 600, color: "#1a2a5e",
  marginBottom: 6, fontFamily: "'DM Sans', system-ui, sans-serif",
};

const focusIn = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = "#2ab5c1";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(42,181,193,0.15)";
};
const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = "#dee2e6";
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

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function InsulinLogPage() {
  const { session } = useAuth();
  const [form, setForm] = useState<InsulinForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileInsulins, setProfileInsulins] = useState<{ value: string; label: string }[]>([]);
  const [todaysMeals, setTodaysMeals] = useState<MealEntry[]>([]);

  /* ─── Load profile insulins ─────────────────────────────────────────── */
  useEffect(() => {
    if (!session) return;
    fetch("/api/profile", {
      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.profile?.insulin_types?.length) {
          setProfileInsulins(
            (data.profile.insulin_types as string[]).map((v) => ({
              value: v,
              label: INSULIN_LABELS[v] ?? v,
            }))
          );
        }
      })
      .catch(() => {});
  }, [session]);

  /* ─── Load today's meals for linking ────────────────────────────────── */
  useEffect(() => {
    if (!session) return;
    const today = new Date().toISOString().slice(0, 10);
    fetch(`/trpc/mealLog.getByDate?input=${encodeURIComponent(JSON.stringify({ json: { date: today } }))}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((res) => {
        if (res?.result?.data?.json) {
          setTodaysMeals(res.result.data.json);
        }
      })
      .catch(() => {});
  }, [session]);

  /* ─── Helpers ───────────────────────────────────────────────────────── */
  const set = (key: keyof InsulinForm) => (val: any) => setForm((f) => ({ ...f, [key]: val }));

  /* ─── Save ──────────────────────────────────────────────────────────── */
  const save = useCallback(async () => {
    if (!session) return;
    if (!form.insulin_type) { setError("Please select an insulin type."); return; }
    if (!form.dose_units || parseFloat(form.dose_units) <= 0) { setError("Please enter a valid dose."); return; }

    setSaving(true);
    setError(null);
    setToast(null);

    try {
      const res = await fetch("/trpc/insulinEvent.create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          json: {
            event_time: new Date(form.event_time).toISOString(),
            event_type: form.event_type,
            insulin_type: form.insulin_type,
            dose_units: parseFloat(form.dose_units),
            food_linked_id: form.food_linked_id || null,
            is_correction: form.is_correction,
            notes: form.notes || null,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Save failed");

      setToast("Dose saved");
      setTimeout(() => setToast(null), 3000);
      setForm({ ...EMPTY_FORM, event_time: nowLocal() });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, [session, form]);

  /* ─── Meal label helper ─────────────────────────────────────────────── */
  function mealLabel(m: MealEntry): string {
    const time = new Date(m.meal_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const desc = m.food_description ? ` — ${m.food_description.slice(0, 40)}` : "";
    return `${time} ${m.event_type}${desc}`;
  }

  /* ─── Render ────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: "clamp(24px, 6vw, 32px)",
            fontWeight: 700, color: "#1a2a5e", margin: "0 0 4px",
          }}>
            Insulin Log
          </h1>
          <p style={{ fontSize: 14, color: "#52667a", margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            Record every insulin dose with full decimal precision.
          </p>
        </div>

        {/* ── Time & Event Type ─────────────────────────────────────────── */}
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #dee2e6", padding: 20, marginBottom: 16 }}>
          <Field label="Time">
            <input
              type="datetime-local" value={form.event_time}
              onChange={(e) => set("event_time")(e.target.value)}
              style={inputStyle} onFocus={focusIn} onBlur={focusOut}
            />
          </Field>
          <Field label="Event type">
            <select
              value={form.event_type} onChange={(e) => set("event_type")(e.target.value)}
              style={{ ...inputStyle, appearance: "auto", cursor: "pointer" }}
              onFocus={focusIn as any} onBlur={focusOut as any}
            >
              {EVENT_TYPES.map((et) => (
                <option key={et.value} value={et.value}>{et.label}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* ── Insulin & Dose ────────────────────────────────────────────── */}
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #dee2e6", padding: 20, marginBottom: 16 }}>
          <Field label="Insulin type">
            <select
              value={form.insulin_type} onChange={(e) => set("insulin_type")(e.target.value)}
              style={{ ...inputStyle, appearance: "auto", cursor: "pointer", color: form.insulin_type ? "#1a2a5e" : "#52667a" }}
              onFocus={focusIn as any} onBlur={focusOut as any}
            >
              <option value="">Select insulin…</option>
              {profileInsulins.map((ins) => (
                <option key={ins.value} value={ins.value}>{ins.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Dose (units)">
            <input
              type="number" step="any" min="0.25"
              value={form.dose_units} onChange={(e) => set("dose_units")(e.target.value)}
              placeholder="e.g. 0.25, 1.5, 5.50"
              style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
              onFocus={focusIn} onBlur={focusOut}
            />
          </Field>
        </div>

        {/* ── Link to Meal (optional) ───────────────────────────────────── */}
        {todaysMeals.length > 0 && (
          <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #dee2e6", padding: 20, marginBottom: 16 }}>
            <Field label="Link to meal entry (optional)">
              <select
                value={form.food_linked_id} onChange={(e) => set("food_linked_id")(e.target.value)}
                style={{ ...inputStyle, appearance: "auto", cursor: "pointer", color: form.food_linked_id ? "#1a2a5e" : "#52667a" }}
                onFocus={focusIn as any} onBlur={focusOut as any}
              >
                <option value="">No linked meal</option>
                {todaysMeals.map((m) => (
                  <option key={m.id} value={m.id}>{mealLabel(m)}</option>
                ))}
              </select>
            </Field>
          </div>
        )}

        {/* ── Correction Toggle & Notes ─────────────────────────────────── */}
        <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #dee2e6", padding: 20, marginBottom: 16 }}>
          <label style={{
            display: "flex", alignItems: "center", gap: 12, minHeight: 48,
            padding: "10px 14px", borderRadius: 8, cursor: "pointer",
            border: `1px solid ${form.is_correction ? "#2ab5c1" : "#dee2e6"}`,
            background: form.is_correction ? "rgba(42,181,193,0.08)" : "#ffffff",
            fontSize: 14, color: "#1a2a5e", fontFamily: "'DM Sans', system-ui, sans-serif",
            marginBottom: 16,
          }}>
            <input
              type="checkbox" checked={form.is_correction}
              onChange={(e) => set("is_correction")(e.target.checked)}
              style={{ accentColor: "#2ab5c1", width: 20, height: 20, cursor: "pointer" }}
            />
            This is a correction dose
          </label>
          <Field label="Notes">
            <textarea
              value={form.notes} onChange={(e) => set("notes")(e.target.value)}
              placeholder="e.g. pre-bolus 15 min before meal, stacking concern"
              rows={3}
              style={{ ...inputStyle, resize: "vertical", minHeight: 80 }}
              onFocus={focusIn as any} onBlur={focusOut as any}
            />
          </Field>
        </div>

        {/* ── Save Button & Feedback ────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {error && (
            <div style={{ borderRadius: 8, background: "#fef2f2", border: "1px solid #fca5a5", padding: "10px 14px", fontSize: 13, color: "#991b1b" }}>
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
            {saving ? "Saving..." : "Save Dose"}
          </button>
        </div>

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
