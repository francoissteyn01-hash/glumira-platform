/**
 * GluMira™ V7 — Meal Log Page
 * Scandinavian Minimalist design track.
 * Mobile-first, single column. Full decimal precision on all numeric inputs.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { API } from "@/lib/api";
import { useGlucoseUnits } from "@/context/GlucoseUnitsContext";
import { useKeyboardSave } from "@/hooks/useKeyboardSave";
import DoseReferencePanel from "@/components/DoseReferencePanel";

/* ─── Constants ───────────────────────────────────────────────────────────── */

const EVENT_TYPES = [
  { value: "meal",             label: "Meal" },
  { value: "snack",            label: "Snack" },
  { value: "meal_bolus",       label: "Meal Bolus" },
  { value: "correction",       label: "Correction" },
  { value: "basal",            label: "Basal" },
  { value: "low_intervention", label: "Low Intervention" },
] as const;

const LOW_TREATMENT_TYPES = [
  { value: "dextab_quarter", label: "Dextab — Quarter" },
  { value: "dextab_half",    label: "Dextab — Half" },
  { value: "dextab_full",    label: "Dextab — Full" },
  { value: "juice",          label: "Juice" },
  { value: "coke",           label: "Coke" },
  { value: "jelly_beans",    label: "Jelly Beans" },
  { value: "glucose_gel",    label: "Glucose Gel" },
  { value: "honey",          label: "Honey" },
] as const;

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface MealLogForm {
  meal_time: string;
  event_type: string;
  insulin_type: string;
  units: string;
  glucose_value: string;
  glucose_units: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
  fibre_g: string;
  food_description: string;
  low_treatment_type: string;
  low_treatment_grams: string;
  comment: string;
}

function nowLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const EMPTY_FORM: MealLogForm = {
  meal_time: nowLocal(),
  event_type: "meal",
  insulin_type: "",
  units: "",
  glucose_value: "",
  glucose_units: "mmol",
  protein_g: "",
  carbs_g: "",
  fat_g: "",
  fibre_g: "",
  food_description: "",
  low_treatment_type: "",
  low_treatment_grams: "",
  comment: "",
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

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function MealLogPage() {
  const { session } = useAuth();
  const { units: globalUnits } = useGlucoseUnits();
  const [form, setForm] = useState<MealLogForm>({ ...EMPTY_FORM, glucose_units: globalUnits });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileInsulins, setProfileInsulins] = useState<{ value: string; label: string }[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Sync form glucose_units when global toggle changes
  useEffect(() => {
    setForm((f) => ({ ...f, glucose_units: globalUnits }));
  }, [globalUnits]);

  /* ─── Load user's insulin types from profile ────────────────────────── */
  useEffect(() => {
    if (!session) return;
    fetch(`${API}/api/profile`, {
      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.profile?.insulin_types?.length) {
          // Map insulin type slugs to display labels
          const LABELS: Record<string, string> = {
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
          setProfileInsulins(
            (data.profile.insulin_types as string[]).map((v) => ({ value: v, label: LABELS[v] ?? v }))
          );
        }
      })
      .catch(() => {});
  }, [session]);

  /* ─── Form helpers ──────────────────────────────────────────────────── */
  const set = (key: keyof MealLogForm) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  const isLowIntervention = form.event_type === "low_intervention";
  const showInsulin = ["basal", "meal_bolus", "correction"].includes(form.event_type);

  /* ─── Save ──────────────────────────────────────────────────────────── */
  const save = useCallback(async () => {
    if (!session) return;
    setSaving(true);
    setError(null);
    setToast(null);

    const parseNum = (v: string) => (v === "" ? null : parseFloat(v));

    try {
      const res = await fetch("/trpc/mealLog.create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          json: {
            meal_time: new Date(form.meal_time).toISOString(),
            event_type: form.event_type,
            insulin_type: form.insulin_type || null,
            units: parseNum(form.units),
            glucose_value: parseNum(form.glucose_value),
            glucose_units: form.glucose_units,
            protein_g: parseNum(form.protein_g),
            carbs_g: parseNum(form.carbs_g),
            fat_g: parseNum(form.fat_g),
            fibre_g: parseNum(form.fibre_g),
            food_description: form.food_description || null,
            low_treatment_type: form.low_treatment_type || null,
            low_treatment_grams: parseNum(form.low_treatment_grams),
            comment: form.comment || null,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Save failed");

      setToast("Entry saved");
      setTimeout(() => setToast(null), 3000);
      // Reset form but keep time fresh
      setForm({ ...EMPTY_FORM, meal_time: nowLocal() });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, [session, form]);

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
            Meal &amp; Event Log
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            Log meals, insulin doses, and low interventions with full decimal precision.
          </p>
        </div>

        {/* ── Time & Event Type ─────────────────────────────────────────── */}
        <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", padding: 20, marginBottom: 16 }}>
          <Field label="Time">
            <input
              type="datetime-local" value={form.meal_time}
              onChange={(e) => set("meal_time")(e.target.value)}
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

        {/* ── Insulin (conditional) ─────────────────────────────────────── */}
        {showInsulin && (
          <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", padding: 20, marginBottom: 16 }}>
            <Field label="Insulin type">
              <select
                value={form.insulin_type} onChange={(e) => set("insulin_type")(e.target.value)}
                style={{ ...inputStyle, appearance: "auto", cursor: "pointer", color: form.insulin_type ? "var(--text-primary)" : "var(--text-secondary)" }}
                onFocus={focusIn as any} onBlur={focusOut as any}
              >
                <option value="">Select insulin…</option>
                {profileInsulins.map((ins) => (
                  <option key={ins.value} value={ins.value}>{ins.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Units">
              <input
                type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" step="any" min="0"
                value={form.units} onChange={(e) => set("units")(e.target.value)}
                placeholder="e.g. 0.25, 1.5, 5.50"
                style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
                onFocus={focusIn} onBlur={focusOut}
              />
            </Field>
          </div>
        )}

        {/* ── Glucose ───────────────────────────────────────────────────── */}
        <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", padding: 20, marginBottom: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12 }}>
            <Field label="Glucose (optional)">
              <input
                type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" step="any" min="0"
                value={form.glucose_value} onChange={(e) => set("glucose_value")(e.target.value)}
                placeholder="e.g. 5.4"
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
        </div>

        {/* ── Macros & Food ─────────────────────────────────────────────── */}
        {!isLowIntervention && (
          <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", padding: 20, marginBottom: 16 }}>
            <Field label="Food description">
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="text" value={form.food_description}
                  onChange={(e) => set("food_description")(e.target.value)}
                  placeholder="e.g. 2 slices toast with peanut butter"
                  style={{ ...inputStyle, flex: 1 }} onFocus={focusIn} onBlur={focusOut}
                />
                <label style={{ minWidth: 48, minHeight: 48, borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 20, flexShrink: 0 }}>
                  {photoUploading ? "\u23F3" : "\u{1F4F7}"}
                  <input
                    type="file" accept="image/*" capture="environment"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !session) return;
                      setPhotoUploading(true);
                      try {
                        // Preview
                        const reader = new FileReader();
                        reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
                        reader.readAsDataURL(file);
                        // Upload to Supabase Storage
                        const path = `${session.user.id}/${Date.now()}-${file.name}`;
                        const { data } = await fetch(`${API}/api/profile`, { headers: { Authorization: `Bearer ${session.access_token}` } }).then(() => ({ data: null }));
                        // Store photo_url in form (actual upload would go to Supabase Storage)
                        set("photo_url" as any)(path);
                      } catch {} finally { setPhotoUploading(false); }
                    }}
                  />
                </label>
              </div>
              {photoPreview && (
                <img src={photoPreview} alt="Meal photo" loading="lazy" style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8, marginTop: 8, border: "1px solid #dee2e6" }} />
              )}
              <DoseReferencePanel foodDescription={form.food_description} mealType={form.event_type} />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Carbs (g)">
                <input
                  type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" step="any" min="0"
                  value={form.carbs_g} onChange={(e) => set("carbs_g")(e.target.value)}
                  placeholder="e.g. 2.2"
                  style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
                  onFocus={focusIn} onBlur={focusOut}
                />
              </Field>
              <Field label="Protein (g)">
                <input
                  type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" step="any" min="0"
                  value={form.protein_g} onChange={(e) => set("protein_g")(e.target.value)}
                  placeholder="e.g. 2.2"
                  style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
                  onFocus={focusIn} onBlur={focusOut}
                />
              </Field>
              <Field label="Fat (g)">
                <input
                  type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" step="any" min="0"
                  value={form.fat_g} onChange={(e) => set("fat_g")(e.target.value)}
                  placeholder="e.g. 8.5"
                  style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
                  onFocus={focusIn} onBlur={focusOut}
                />
              </Field>
              <Field label="Fibre (g)">
                <input
                  type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" step="any" min="0"
                  value={form.fibre_g} onChange={(e) => set("fibre_g")(e.target.value)}
                  placeholder="e.g. 3.1"
                  style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
                  onFocus={focusIn} onBlur={focusOut}
                />
              </Field>
            </div>
          </div>
        )}

        {/* ── Low Intervention (conditional) ────────────────────────────── */}
        {isLowIntervention && (
          <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid var(--error-border)", padding: 20, marginBottom: 16 }}>
            <div style={{
              fontSize: 12, fontWeight: 700, color: "var(--error-text)", textTransform: "uppercase",
              letterSpacing: 1, marginBottom: 14, fontFamily: "'DM Sans', system-ui, sans-serif",
            }}>
              Low Treatment
            </div>
            <Field label="Treatment type">
              <select
                value={form.low_treatment_type} onChange={(e) => set("low_treatment_type")(e.target.value)}
                style={{ ...inputStyle, appearance: "auto", cursor: "pointer", color: form.low_treatment_type ? "var(--text-primary)" : "var(--text-secondary)" }}
                onFocus={focusIn as any} onBlur={focusOut as any}
              >
                <option value="">Select treatment…</option>
                {LOW_TREATMENT_TYPES.map((lt) => (
                  <option key={lt.value} value={lt.value}>{lt.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Grams consumed">
              <input
                type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" step="any" min="0"
                value={form.low_treatment_grams} onChange={(e) => set("low_treatment_grams")(e.target.value)}
                placeholder="e.g. 4"
                style={{ ...inputStyle, fontFamily: "'JetBrains Mono', monospace" }}
                onFocus={focusIn} onBlur={focusOut}
              />
            </Field>
          </div>
        )}

        {/* ── Comment ───────────────────────────────────────────────────── */}
        <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", padding: 20, marginBottom: 16 }}>
          <Field label="Comment">
            <textarea
              value={form.comment} onChange={(e) => set("comment")(e.target.value)}
              placeholder="Note unusual factors — stress, illness, exercise, missed doses"
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
            {saving ? "Saving..." : "Save Entry"}
          </button>
        </div>

        {/* Mira flow suggestion */}
        <div style={{
          marginTop: 20, padding: 16, borderRadius: 12,
          background: "linear-gradient(135deg, #0A2A5E08, #22AABB12)",
          border: "1px solid #22AABB30",
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <span style={{ fontSize: 28 }}>🦉</span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "#1a2a5e" }}>
              Want Mira to plan your meals?
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
              Get carb-matched meal suggestions based on your insulin regime and dietary preferences.
            </p>
          </div>
          <a href="/meals/plan" style={{
            padding: "8px 16px", borderRadius: 8, background: "#22AABB",
            color: "white", fontSize: 12, fontWeight: 600, textDecoration: "none",
            whiteSpace: "nowrap",
          }}>
            Meal Planner →
          </a>
        </div>

        {/* Spacer for mobile bottom nav */}
        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
