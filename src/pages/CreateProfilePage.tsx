/**
 * GluMira™ V7 — Custom Profile Creator (Safe Mode)
 * Multi-step form. Max 2 profiles, saved to localStorage.
 * Mobile first. Scandinavian Minimalist.
 */

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { DISCLAIMER } from "@/lib/constants";

const T = {
  bg: "#f8f9fa", navy: "#1a2a5e", teal: "#2ab5c1", amber: "#f59e0b",
  muted: "#718096", border: "#e2e8f0", font: "'DM Sans', system-ui, sans-serif",
};

const INSULIN_OPTIONS = [
  "Fiasp", "NovoRapid", "Humalog", "Apidra", "Actrapid", "Humulin R",
  "Lantus", "Levemir", "Tresiba", "Toujeo", "Humulin NPH",
  "NovoMix 30", "Humalog Mix 25",
];

const DIETARY_OPTIONS = [
  { value: "", label: "None" },
  { value: "ramadan", label: "Ramadan Fasting" },
  { value: "kosher", label: "Kosher" },
  { value: "halal", label: "Halal" },
  { value: "bernstein", label: "Bernstein Low-Carb" },
];

type Role = "caregiver" | "patient" | "teen" | "clinician";

interface Regimen { insulin: string; type: "basal" | "bolus"; dose: number; time: string }

interface FormState {
  step: number;
  role: Role;
  name: string;
  age: number;
  weight: number;
  regimen: Regimen[];
  targetLow: number;
  targetHigh: number;
  unitMgdl: boolean;
  dietary: string;
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${T.border}`,
  fontSize: 14,
  fontFamily: T.font,
  color: T.navy,
  background: "#ffffff",
  outline: "none",
};

const selectStyle: React.CSSProperties = { ...inputStyle, appearance: "auto" as any };

const btnPrimary: React.CSSProperties = {
  padding: "10px 24px", borderRadius: 8, border: "none",
  background: T.teal, color: "#fff", fontSize: 13, fontWeight: 500,
  cursor: "pointer", fontFamily: T.font,
};

const btnSecondary: React.CSSProperties = {
  padding: "10px 24px", borderRadius: 8,
  border: `1px solid ${T.border}`, background: "transparent",
  color: T.navy, fontSize: 13, fontWeight: 500,
  cursor: "pointer", fontFamily: T.font,
};

export default function CreateProfilePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const slot = parseInt(params.get("slot") ?? "1", 10);

  const [form, setForm] = useState<FormState>({
    step: 1,
    role: "patient",
    name: "",
    age: 25,
    weight: 70,
    regimen: [{ insulin: "Lantus", type: "basal", dose: 18, time: "22:00" }],
    targetLow: 4.0,
    targetHigh: 10.0,
    unitMgdl: false,
    dietary: "",
  });

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));
  const nextStep = () => set({ step: Math.min(form.step + 1, 6) });
  const prevStep = () => set({ step: Math.max(form.step - 1, 1) });

  function addRegimen() {
    if (form.regimen.length >= 6) return;
    set({ regimen: [...form.regimen, { insulin: "Fiasp", type: "bolus", dose: 4, time: "12:00" }] });
  }

  function updateRegimen(idx: number, patch: Partial<Regimen>) {
    const next = form.regimen.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    set({ regimen: next });
  }

  function removeRegimen(idx: number) {
    set({ regimen: form.regimen.filter((_, i) => i !== idx) });
  }

  function save() {
    const profile = {
      id: `custom-${slot}`,
      name: form.name || `Custom Profile ${slot}`,
      role: form.role,
      description: `Custom ${form.role} profile${form.dietary ? ` (${form.dietary})` : ""}`,
      avatar: form.role,
      child: {
        age: form.age,
        weight: form.weight,
        diabetesType: "T1D",
        diagnosedMonths: 12,
        regimen: form.regimen.map((r) => ({
          insulin: r.insulin,
          type: r.type,
          dose: r.dose,
          times: [r.time],
          halfLife: r.type === "basal" ? 12 : 1.2,
        })),
        glucoseTarget: {
          low: form.unitMgdl ? form.targetLow / 18 : form.targetLow,
          high: form.unitMgdl ? form.targetHigh / 18 : form.targetHigh,
        },
        units: form.unitMgdl ? "mg/dL" : "mmol/L",
        dietaryModule: form.dietary || undefined,
        sampleGlucose: generateSampleGlucose(form.targetLow, form.targetHigh, form.unitMgdl),
      },
    };
    try {
      localStorage.setItem(`glumira_custom_profile_${slot}`, JSON.stringify(profile));
    } catch {}
    navigate(`/safe-mode/profile/custom-${slot}`);
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.font }}>
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "40px 20px 60px" }}>
        {/* Header */}
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: T.teal, marginBottom: 6 }}>
          Custom Profile {slot}
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.navy, margin: "0 0 24px" }}>
          Create Your Profile
        </h1>

        {/* Progress */}
        <div style={{ display: "flex", gap: 4, marginBottom: 28 }}>
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: s <= form.step ? T.teal : T.border,
              transition: "background 0.2s",
            }} />
          ))}
        </div>

        {/* Step 1: Role */}
        {form.step === 1 && (
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: T.navy, marginBottom: 12 }}>What's your role?</p>
            <div style={{ display: "grid", gap: 8 }}>
              {(["caregiver", "patient", "teen", "clinician"] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => set({ role: r })}
                  style={{
                    ...inputStyle,
                    textAlign: "left",
                    cursor: "pointer",
                    borderColor: form.role === r ? T.teal : T.border,
                    background: form.role === r ? "rgba(42,181,193,0.06)" : "#fff",
                    fontWeight: form.role === r ? 600 : 400,
                  }}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <button onClick={nextStep} style={btnPrimary}>Next</button>
            </div>
          </div>
        )}

        {/* Step 2: Basic info */}
        {form.step === 2 && (
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Basic Information</p>
            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: T.muted, marginBottom: 4, display: "block" }}>Display Name</label>
                <input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Sarah & Lily" style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, color: T.muted, marginBottom: 4, display: "block" }}>Age</label>
                  <input type="number" value={form.age} onChange={(e) => set({ age: parseInt(e.target.value) || 0 })} min={0} max={120} style={inputStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: T.muted, marginBottom: 4, display: "block" }}>Weight (kg, optional)</label>
                  <input type="number" value={form.weight} onChange={(e) => set({ weight: parseInt(e.target.value) || 0 })} min={0} max={300} style={inputStyle} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
              <button onClick={prevStep} style={btnSecondary}>Back</button>
              <button onClick={nextStep} style={btnPrimary}>Next</button>
            </div>
          </div>
        )}

        {/* Step 3: Insulin regimen */}
        {form.step === 3 && (
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Insulin Regimen</p>
            <div style={{ display: "grid", gap: 12 }}>
              {form.regimen.map((r, i) => (
                <div key={i} style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 8, padding: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    <div>
                      <label style={{ fontSize: 11, color: T.muted }}>Insulin</label>
                      <select value={r.insulin} onChange={(e) => updateRegimen(i, { insulin: e.target.value })} style={selectStyle}>
                        {INSULIN_OPTIONS.map((ins) => <option key={ins} value={ins}>{ins}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: T.muted }}>Type</label>
                      <select value={r.type} onChange={(e) => updateRegimen(i, { type: e.target.value as "basal" | "bolus" })} style={selectStyle}>
                        <option value="basal">Basal</option>
                        <option value="bolus">Bolus</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: T.muted }}>Dose (U)</label>
                      <input type="number" value={r.dose} onChange={(e) => updateRegimen(i, { dose: parseFloat(e.target.value) || 0 })} step={0.25} min={0} max={200} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: T.muted }}>Time</label>
                      <input type="time" value={r.time} onChange={(e) => updateRegimen(i, { time: e.target.value })} style={inputStyle} />
                    </div>
                  </div>
                  {form.regimen.length > 1 && (
                    <button onClick={() => removeRegimen(i)} style={{ marginTop: 8, fontSize: 11, color: T.muted, background: "none", border: "none", cursor: "pointer" }}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {form.regimen.length < 6 && (
                <button onClick={addRegimen} style={{ ...btnSecondary, width: "100%", borderStyle: "dashed" }}>
                  + Add Insulin
                </button>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
              <button onClick={prevStep} style={btnSecondary}>Back</button>
              <button onClick={nextStep} style={btnPrimary}>Next</button>
            </div>
          </div>
        )}

        {/* Step 4: Glucose targets */}
        {form.step === 4 && (
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Glucose Targets</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 13, color: T.navy }}>mmol/L</span>
              <label style={{ position: "relative", display: "inline-block", width: 44, height: 24, cursor: "pointer" }}>
                <input type="checkbox" checked={form.unitMgdl} onChange={(e) => set({ unitMgdl: e.target.checked, targetLow: e.target.checked ? 72 : 4.0, targetHigh: e.target.checked ? 180 : 10.0 })} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ position: "absolute", inset: 0, borderRadius: 12, background: form.unitMgdl ? T.teal : T.border, transition: "background 0.2s" }}>
                  <span style={{ position: "absolute", top: 3, left: form.unitMgdl ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
                </span>
              </label>
              <span style={{ fontSize: 13, color: T.navy }}>mg/dL</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: T.muted, marginBottom: 4, display: "block" }}>Low Target</label>
                <input type="number" value={form.targetLow} onChange={(e) => set({ targetLow: parseFloat(e.target.value) || 0 })} step={form.unitMgdl ? 1 : 0.1} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: T.muted, marginBottom: 4, display: "block" }}>High Target</label>
                <input type="number" value={form.targetHigh} onChange={(e) => set({ targetHigh: parseFloat(e.target.value) || 0 })} step={form.unitMgdl ? 1 : 0.1} style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
              <button onClick={prevStep} style={btnSecondary}>Back</button>
              <button onClick={nextStep} style={btnPrimary}>Next</button>
            </div>
          </div>
        )}

        {/* Step 5: Dietary module */}
        {form.step === 5 && (
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Dietary Approach</p>
            <div style={{ display: "grid", gap: 8 }}>
              {DIETARY_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => set({ dietary: d.value })}
                  style={{
                    ...inputStyle,
                    textAlign: "left",
                    cursor: "pointer",
                    borderColor: form.dietary === d.value ? T.teal : T.border,
                    background: form.dietary === d.value ? "rgba(42,181,193,0.06)" : "#fff",
                    fontWeight: form.dietary === d.value ? 600 : 400,
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
              <button onClick={prevStep} style={btnSecondary}>Back</button>
              <button onClick={nextStep} style={btnPrimary}>Next</button>
            </div>
          </div>
        )}

        {/* Step 6: Confirm */}
        {form.step === 6 && (
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: T.navy, marginBottom: 12 }}>Ready to Explore</p>
            <div style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 12px", fontSize: 13, color: T.navy }}>
                <span style={{ color: T.muted }}>Name</span><span>{form.name || `Custom Profile ${slot}`}</span>
                <span style={{ color: T.muted }}>Role</span><span style={{ textTransform: "capitalize" }}>{form.role}</span>
                <span style={{ color: T.muted }}>Age</span><span>{form.age}</span>
                <span style={{ color: T.muted }}>Insulins</span><span>{form.regimen.map((r) => `${r.insulin} ${r.dose}U`).join(", ")}</span>
                <span style={{ color: T.muted }}>Target</span><span>{form.targetLow}–{form.targetHigh} {form.unitMgdl ? "mg/dL" : "mmol/L"}</span>
                {form.dietary && <><span style={{ color: T.muted }}>Diet</span><span style={{ textTransform: "capitalize" }}>{form.dietary}</span></>}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={prevStep} style={btnSecondary}>Back</button>
              <button onClick={save} style={btnPrimary}>Start Exploring</button>
            </div>
          </div>
        )}

        <p style={{ fontSize: 10, color: "rgba(113,128,150,0.5)", textAlign: "center", marginTop: 32, lineHeight: 1.5 }}>
          {DISCLAIMER}
        </p>
      </div>
    </div>
  );
}

function generateSampleGlucose(low: number, high: number, mgdl: boolean) {
  const base = mgdl ? (low + high) / 2 / 18 : (low + high) / 2;
  const variance = mgdl ? (high - low) / 4 / 18 : (high - low) / 4;
  const times = ["00:00", "03:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
  return times.map((time) => ({
    time,
    value: Math.round((base + (Math.random() - 0.5) * 2 * variance) * 10) / 10,
  }));
}
