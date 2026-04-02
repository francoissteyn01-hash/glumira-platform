/**
 * GluMira™ V7 — Patient Profile Page
 * Scandinavian Minimalist design track.
 * Mobile-first, single column, collapsible card sections.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth, supabase } from "@/hooks/useAuth";
import { DISCLAIMER } from "@/lib/constants";

/* ─── Constants ───────────────────────────────────────────────────────────── */

const DIABETES_TYPES = ["T1D", "T2D", "LADA", "Gestational", "Other"] as const;

const INSULIN_TYPES = [
  { value: "glargine_u100", label: "Glargine U-100 (Lantus/Basaglar)" },
  { value: "glargine_u300", label: "Glargine U-300 (Toujeo)" },
  { value: "degludec",      label: "Degludec (Tresiba)" },
  { value: "detemir",       label: "Detemir (Levemir)" },
  { value: "nph",           label: "NPH (Humulin N/Novolin N)" },
  { value: "aspart",        label: "Aspart (NovoRapid/Fiasp)" },
  { value: "lispro",        label: "Lispro (Humalog/Lyumjev)" },
  { value: "glulisine",     label: "Glulisine (Apidra)" },
  { value: "regular",       label: "Regular (Actrapid/Humulin R)" },
] as const;

const DELIVERY_METHODS = ["MDI (Multiple Daily Injections)", "Insulin Pump", "Insulin Pen", "Inhaled Insulin"] as const;

const DIETARY_APPROACHES = [
  "Standard/Full Carb Count", "Moderate Carb", "Low Carb", "Keto",
  "Bernstein Protocol", "Halal", "Kosher", "Ramadan Fasting",
  "Intermittent Fasting", "Vegetarian", "Vegan", "Mediterranean",
  "High Protein/Low Fat", "Grazing/Snacking",
] as const;

const ALLERGENS = [
  "Gluten", "Dairy", "Eggs", "Nuts", "Peanuts",
  "Soy", "Shellfish", "Fish", "Wheat", "Sesame",
] as const;

const COMORBIDITIES = [
  "Hypertension", "High cholesterol", "Thyroid (hypo)", "Thyroid (hyper)",
  "Kidney disease", "Neuropathy", "Retinopathy", "Depression/Anxiety",
  "PCOS", "Coeliac", "Cardiovascular disease", "Gastroparesis",
  "Eating disorders", "ADHD", "Autism Spectrum Disorder",
] as const;

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface ProfileData {
  first_name: string;
  last_name: string;
  date_of_birth: string;
  diabetes_type: string;
  diagnosis_date: string;
  country: string;
  insulin_types: string[];
  delivery_method: string;
  icr: string;
  isf: string;
  dietary_approach: string;
  allergens: string[];
  meals_per_day: number;
  comorbidities: string[];
  is_caregiver: boolean;
  patient_name: string;
  relationship: string;
  profile_complete?: boolean;
  under_18_flag?: boolean;
}

const EMPTY_PROFILE: ProfileData = {
  first_name: "", last_name: "", date_of_birth: "", diabetes_type: "",
  diagnosis_date: "", country: "", insulin_types: [], delivery_method: "",
  icr: "", isf: "", dietary_approach: "", allergens: [], meals_per_day: 3,
  comorbidities: [], is_caregiver: false, patient_name: "", relationship: "",
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function completionPercent(p: ProfileData): number {
  const checks = [
    !!p.first_name, !!p.last_name, !!p.date_of_birth, !!p.diabetes_type,
    !!p.country, !!p.dietary_approach, p.insulin_types.length > 0,
    !!p.delivery_method, p.comorbidities.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function isUnder18(dob: string): boolean {
  if (!dob) return false;
  const age = (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  return age < 18;
}

/* ─── Collapsible Card ────────────────────────────────────────────────────── */

function Card({ title, defaultOpen = false, children }: { title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: "#ffffff", borderRadius: 12, border: "1px solid #dee2e6", overflow: "hidden" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", background: "none", border: "none", cursor: "pointer",
          fontFamily: "'Playfair Display', serif", fontSize: "clamp(16px, 5vw, 20px)",
          fontWeight: 700, color: "#1a2a5e", textAlign: "left",
        }}
      >
        {title}
        <span style={{ fontSize: 18, color: "#52667a", transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          &#9662;
        </span>
      </button>
      {open && <div style={{ padding: "0 20px 20px" }}>{children}</div>}
    </div>
  );
}

/* ─── Input Components ────────────────────────────────────────────────────── */

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={inputStyle}
      onFocus={(e) => { e.currentTarget.style.borderColor = "#2ab5c1"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(42,181,193,0.15)"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "#dee2e6"; e.currentTarget.style.boxShadow = "none"; }}
    />
  );
}

function SelectInput({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void; options: readonly string[]; placeholder?: string;
}) {
  return (
    <select
      value={value} onChange={(e) => onChange(e.target.value)}
      style={{ ...inputStyle, appearance: "auto", cursor: "pointer", color: value ? "#1a2a5e" : "#52667a" }}
    >
      <option value="">{placeholder ?? "Select…"}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

function CheckboxGrid({ options, selected, onToggle }: {
  options: readonly string[]; selected: string[]; onToggle: (v: string) => void;
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
      {options.map((opt) => {
        const checked = selected.includes(opt);
        return (
          <label
            key={opt}
            style={{
              display: "flex", alignItems: "center", gap: 8, minHeight: 48,
              padding: "8px 12px", borderRadius: 8, cursor: "pointer",
              border: `1px solid ${checked ? "#2ab5c1" : "#dee2e6"}`,
              background: checked ? "rgba(42,181,193,0.08)" : "#ffffff",
              fontSize: 13, color: "#1a2a5e", fontFamily: "'DM Sans', system-ui, sans-serif",
              transition: "all 0.15s",
            }}
          >
            <input
              type="checkbox" checked={checked} onChange={() => onToggle(opt)}
              style={{ accentColor: "#2ab5c1", width: 18, height: 18, cursor: "pointer" }}
            />
            {opt}
          </label>
        );
      })}
    </div>
  );
}

function MultiSelectPills({ options, selected, onToggle }: {
  options: readonly { value: string; label: string }[]; selected: string[]; onToggle: (v: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((opt) => {
        const checked = selected.includes(opt.value);
        return (
          <button
            key={opt.value} type="button" onClick={() => onToggle(opt.value)}
            style={{
              minHeight: 48, padding: "10px 16px", borderRadius: 8, cursor: "pointer",
              border: `1px solid ${checked ? "#2ab5c1" : "#dee2e6"}`,
              background: checked ? "rgba(42,181,193,0.12)" : "#ffffff",
              color: checked ? "#2ab5c1" : "#52667a",
              fontSize: 13, fontWeight: checked ? 600 : 400,
              fontFamily: "'DM Sans', system-ui, sans-serif",
              transition: "all 0.15s",
            }}
          >
            {checked ? "✓ " : ""}{opt.label}
          </button>
        );
      })}
    </div>
  );
}

/* ─── Progress Bar ────────────────────────────────────────────────────────── */

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "#1a2a5e", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Profile completion
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: percent === 100 ? "#16a34a" : "#2ab5c1", fontFamily: "'JetBrains Mono', monospace" }}>
          {percent}%
        </span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: "#dee2e6", overflow: "hidden" }}>
        <div
          style={{
            width: `${percent}%`, height: "100%", borderRadius: 4,
            background: percent === 100 ? "#16a34a" : "linear-gradient(90deg, #2ab5c1, #1a2a5e)",
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function ProfilePage() {
  const { user, session } = useAuth();
  const [form, setForm] = useState<ProfileData>(EMPTY_PROFILE);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const pct = completionPercent(form);
  const under18 = isUnder18(form.date_of_birth);

  /* ─── Load profile ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!session) return;
    fetch("/api/profile", {
      headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setForm({
            first_name:       data.profile.first_name ?? "",
            last_name:        data.profile.last_name ?? "",
            date_of_birth:    data.profile.date_of_birth ?? "",
            diabetes_type:    data.profile.diabetes_type ?? "",
            diagnosis_date:   data.profile.diagnosis_date ?? "",
            country:          data.profile.country ?? "",
            insulin_types:    data.profile.insulin_types ?? [],
            delivery_method:  data.profile.delivery_method ?? "",
            icr:              data.profile.icr ?? "",
            isf:              data.profile.isf ?? "",
            dietary_approach: data.profile.dietary_approach ?? "",
            allergens:        data.profile.allergens ?? [],
            meals_per_day:    data.profile.meals_per_day ?? 3,
            comorbidities:    data.profile.comorbidities ?? [],
            is_caregiver:     data.profile.is_caregiver ?? false,
            patient_name:     data.profile.patient_name ?? "",
            relationship:     data.profile.relationship ?? "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  /* ─── Save profile ────────────────────────────────────────────────────── */
  const save = useCallback(async () => {
    if (!session) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, [session, form]);

  /* ─── Helpers ─────────────────────────────────────────────────────────── */
  const set = (key: keyof ProfileData) => (val: any) => setForm((f) => ({ ...f, [key]: val }));
  const toggleArray = (key: "insulin_types" | "allergens" | "comorbidities") => (val: string) => {
    setForm((f) => ({
      ...f,
      [key]: (f[key] as string[]).includes(val)
        ? (f[key] as string[]).filter((v) => v !== val)
        : [...(f[key] as string[]), val],
    }));
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8f9fa", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#52667a", fontSize: 14, fontFamily: "'DM Sans', system-ui, sans-serif" }}>Loading profile...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>

        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{
            fontFamily: "'Playfair Display', serif", fontSize: "clamp(24px, 6vw, 32px)",
            fontWeight: 700, color: "#1a2a5e", margin: "0 0 4px",
          }}>
            Patient Profile
          </h1>
          <p style={{ fontSize: 14, color: "#52667a", margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            Complete your profile to personalise your GluMira™ experience.
          </p>
        </div>

        {/* Progress */}
        <ProgressBar percent={pct} />

        {/* Medical disclaimer */}
        <div style={{
          borderRadius: 8, background: "#fffbeb", border: "1px solid #fbbf24",
          padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "#92400e",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          {DISCLAIMER}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── Section 1: Personal ──────────────────────────────────────── */}
          <Card title="Personal Information" defaultOpen={true}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="First name">
                <TextInput value={form.first_name} onChange={set("first_name")} placeholder="First name" />
              </Field>
              <Field label="Last name">
                <TextInput value={form.last_name} onChange={set("last_name")} placeholder="Last name" />
              </Field>
            </div>
            <Field label="Date of birth">
              <TextInput value={form.date_of_birth} onChange={set("date_of_birth")} type="date" />
            </Field>
            {under18 && (
              <div style={{
                borderRadius: 8, background: "rgba(42,181,193,0.08)", border: "1px solid #2ab5c1",
                padding: "10px 14px", marginBottom: 12, fontSize: 13, color: "#1a2a5e",
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}>
                Under-18 detected — eligible for 3-month free tier.
              </div>
            )}
            <Field label="Diabetes type">
              <SelectInput value={form.diabetes_type} onChange={set("diabetes_type")} options={DIABETES_TYPES} placeholder="Select diabetes type" />
            </Field>
            <Field label="Diagnosis date">
              <TextInput value={form.diagnosis_date} onChange={set("diagnosis_date")} type="date" />
            </Field>
            <Field label="Country">
              <TextInput value={form.country} onChange={set("country")} placeholder="e.g. South Africa" />
            </Field>
          </Card>

          {/* ── Section 2: Insulin & Management ─────────────────────────── */}
          <Card title="Insulin & Management">
            <Field label="Insulin type(s) — select all that apply">
              <MultiSelectPills options={INSULIN_TYPES} selected={form.insulin_types} onToggle={toggleArray("insulin_types")} />
            </Field>
            <Field label="Delivery method">
              <SelectInput value={form.delivery_method} onChange={set("delivery_method")} options={DELIVERY_METHODS} placeholder="Select delivery method" />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="ICR (optional)">
                <TextInput value={form.icr} onChange={set("icr")} placeholder="e.g. 10" type="number" />
              </Field>
              <Field label="ISF (optional)">
                <TextInput value={form.isf} onChange={set("isf")} placeholder="e.g. 2.5" type="number" />
              </Field>
            </div>
          </Card>

          {/* ── Section 3: Dietary Profile ──────────────────────────────── */}
          <Card title="Dietary Profile">
            <Field label="Dietary approach">
              <SelectInput value={form.dietary_approach} onChange={set("dietary_approach")} options={DIETARY_APPROACHES} placeholder="Select dietary approach" />
            </Field>
            <Field label="Allergens">
              <CheckboxGrid options={ALLERGENS} selected={form.allergens} onToggle={toggleArray("allergens")} />
            </Field>
            <Field label="Meals per day">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <button
                    key={n} type="button" onClick={() => set("meals_per_day")(n)}
                    style={{
                      minWidth: 48, minHeight: 48, borderRadius: 8, cursor: "pointer",
                      border: `1px solid ${form.meals_per_day === n ? "#2ab5c1" : "#dee2e6"}`,
                      background: form.meals_per_day === n ? "rgba(42,181,193,0.12)" : "#ffffff",
                      color: form.meals_per_day === n ? "#2ab5c1" : "#52667a",
                      fontSize: 15, fontWeight: form.meals_per_day === n ? 700 : 400,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </Field>
          </Card>

          {/* ── Section 4: Comorbidities ────────────────────────────────── */}
          <Card title="Comorbidities">
            <p style={{ fontSize: 13, color: "#52667a", marginBottom: 12, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Select any conditions that apply. This helps GluMira™ personalise educational content.
            </p>
            <CheckboxGrid options={COMORBIDITIES} selected={form.comorbidities} onToggle={toggleArray("comorbidities")} />
          </Card>

          {/* ── Section 5: Caregiver Mode ───────────────────────────────── */}
          <Card title="Caregiver Mode">
            <label style={{
              display: "flex", alignItems: "center", gap: 12, minHeight: 48,
              padding: "10px 14px", borderRadius: 8, cursor: "pointer",
              border: `1px solid ${form.is_caregiver ? "#2ab5c1" : "#dee2e6"}`,
              background: form.is_caregiver ? "rgba(42,181,193,0.08)" : "#ffffff",
              fontSize: 14, color: "#1a2a5e", fontFamily: "'DM Sans', system-ui, sans-serif",
              marginBottom: form.is_caregiver ? 16 : 0,
            }}>
              <input
                type="checkbox" checked={form.is_caregiver}
                onChange={(e) => set("is_caregiver")(e.target.checked)}
                style={{ accentColor: "#2ab5c1", width: 20, height: 20, cursor: "pointer" }}
              />
              I am managing this for someone else
            </label>
            {form.is_caregiver && (
              <>
                <Field label="Patient name">
                  <TextInput value={form.patient_name} onChange={set("patient_name")} placeholder="Full name of the person you're caring for" />
                </Field>
                <Field label="Relationship">
                  <TextInput value={form.relationship} onChange={set("relationship")} placeholder="e.g. Parent, Spouse, Guardian" />
                </Field>
              </>
            )}
          </Card>
        </div>

        {/* ── Save Button & Feedback ─────────────────────────────────────── */}
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          {error && (
            <div style={{ borderRadius: 8, background: "#fef2f2", border: "1px solid #fca5a5", padding: "10px 14px", fontSize: 13, color: "#991b1b" }}>
              {error}
            </div>
          )}
          {saved && (
            <div style={{ borderRadius: 8, background: "#f0fdf4", border: "1px solid #86efac", padding: "10px 14px", fontSize: 13, color: "#166534" }}>
              Profile saved successfully.
            </div>
          )}
          <button
            type="button" onClick={save} disabled={saving}
            style={{
              width: "100%", minHeight: 52, borderRadius: 10, border: "none",
              background: saving ? "#94a3b8" : "#2ab5c1", color: "#ffffff",
              fontSize: 15, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              transition: "background 0.2s",
            }}
          >
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>

        {/* Spacer for mobile bottom nav */}
        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
