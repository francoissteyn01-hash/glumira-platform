/**
 * GluMira™ V7 — Custom Profile Creator
 * Mobile first. Scandinavian Minimalist.
 * Max 2 profiles, saved to localStorage.
 */

import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { DemoProfile, InsulinRegimen } from "../data/demo-profiles";
import { DISCLAIMER } from "../lib/constants";

const INSULINS = [
  "Fiasp", "NovoRapid", "Humalog", "Apidra", "Actrapid",
  "NPH", "Levemir", "Lantus", "Basaglar", "Toujeo",
  "Tresiba", "NovoMix 30", "Ryzodeg",
] as const;

const HALF_LIVES: Record<string, number> = {
  Fiasp: 1.1, NovoRapid: 1.2, Humalog: 1.2, Apidra: 1.0, Actrapid: 1.5,
  NPH: 8, Levemir: 6, Lantus: 12, Basaglar: 12, Toujeo: 18,
  Tresiba: 25, "NovoMix 30": 4, Ryzodeg: 6,
};

const INSULIN_TYPES: Record<string, "basal" | "bolus"> = {
  Fiasp: "bolus", NovoRapid: "bolus", Humalog: "bolus", Apidra: "bolus", Actrapid: "bolus",
  NPH: "basal", Levemir: "basal", Lantus: "basal", Basaglar: "basal", Toujeo: "basal",
  Tresiba: "basal", "NovoMix 30": "bolus", Ryzodeg: "bolus",
};

const DIETARY_OPTIONS = [
  { value: "", label: "None" },
  { value: "ramadan", label: "Ramadan Fasting" },
  { value: "kosher", label: "Kosher" },
  { value: "halal", label: "Halal" },
  { value: "bernstein", label: "Bernstein Low-Carb" },
] as const;

const ROLES = [
  { value: "caregiver", label: "Caregiver" },
  { value: "patient", label: "Patient" },
  { value: "patient", label: "Teen" },
  { value: "clinician", label: "Clinician" },
] as const;

interface RegimenEntry {
  insulin: string;
  dose: number;
  times: string[];
}

export default function CreateProfilePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const slot = parseInt(params.get("slot") ?? "1", 10);
  const storageKey = `glumira-custom-profile-${slot}`;

  // Load existing profile if editing
  const existing = useMemo(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as DemoProfile) : null;
    } catch { return null; }
  }, [storageKey]);

  const [step, setStep] = useState(1);
  const [role, setRole] = useState<string>(existing?.role ?? "caregiver");
  const [age, setAge] = useState(existing?.child?.age ?? 10);
  const [weight, setWeight] = useState(existing?.child?.weight ?? 0);
  const [regimen, setRegimen] = useState<RegimenEntry[]>(
    existing?.child?.regimen.map((r) => ({ insulin: r.insulin, dose: r.dose, times: r.times })) ?? [
      { insulin: "Tresiba", dose: 8, times: ["20:00"] },
      { insulin: "NovoRapid", dose: 2, times: ["07:00", "12:00", "18:00"] },
    ]
  );
  const [targetLow, setTargetLow] = useState(existing?.child?.glucoseTarget.low ?? 4.0);
  const [targetHigh, setTargetHigh] = useState(existing?.child?.glucoseTarget.high ?? 10.0);
  const [units, setUnits] = useState<"mmol/L" | "mg/dL">(existing?.child?.units ?? "mmol/L");
  const [dietary, setDietary] = useState(existing?.child?.dietaryModule ?? "");

  function addRegimenEntry() {
    setRegimen((prev) => [...prev, { insulin: "NovoRapid", dose: 1, times: ["08:00"] }]);
  }

  function removeRegimenEntry(index: number) {
    setRegimen((prev) => prev.filter((_, i) => i !== index));
  }

  function updateRegimen(index: number, field: keyof RegimenEntry, value: any) {
    setRegimen((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function save() {
    const profile: DemoProfile = {
      id: `custom-${slot}`,
      name: `Custom Profile ${slot}`,
      role: role as "caregiver" | "patient" | "clinician",
      description: `Custom ${role} profile — Age ${age}`,
      avatar: role === "clinician" ? "clinician" : role === "caregiver" ? "parent" : "patient",
      child: role !== "clinician" ? {
        age,
        weight: weight || 0,
        diabetesType: "T1D",
        diagnosedMonths: 12,
        regimen: regimen.map((r) => ({
          insulin: r.insulin,
          type: INSULIN_TYPES[r.insulin] ?? "bolus",
          dose: r.dose,
          times: r.times,
          halfLife: HALF_LIVES[r.insulin] ?? 1.2,
        })),
        glucoseTarget: { low: targetLow, high: targetHigh },
        units,
        dietaryModule: dietary || undefined,
        sampleGlucose: generateSampleGlucose(targetLow, targetHigh),
      } : undefined,
      patients: role === "clinician" ? [
        { name: "Patient 1", condition: "Custom patient" },
      ] : undefined,
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(profile));
    } catch {}

    navigate(`/safe-mode/profile/custom-${slot}`);
  }

  const totalSteps = role === "clinician" ? 2 : 6;

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl font-bold text-[#1a2a5e]">Create Profile {slot}</h1>
          <p className="text-xs text-[#718096] mt-1">Step {step} of {totalSteps}</p>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full flex-1 transition-colors ${
                i < step ? "bg-[#2ab5c1]" : "bg-[#e2e8f0]"
              }`}
            />
          ))}
        </div>

        {/* Steps */}
        <div className="rounded-xl border border-[#e2e8f0] bg-white p-5 space-y-4">

          {step === 1 && (
            <>
              <h2 className="text-sm font-semibold text-[#1a2a5e]">Role</h2>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.label}
                    onClick={() => setRole(r.value)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                      role === r.value
                        ? "border-[#2ab5c1] bg-[#2ab5c1]/10 text-[#1a2a5e]"
                        : "border-[#e2e8f0] text-[#718096] hover:border-[#2ab5c1]"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-sm font-semibold text-[#1a2a5e]">Details</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-[#718096] uppercase tracking-wide">Age</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={age}
                    onChange={(e) => setAge(parseInt(e.target.value) || 1)}
                    className="mt-1 w-full rounded-lg border border-[#e2e8f0] bg-[#f8f9fa] px-3 py-2 text-sm text-[#1a2a5e] focus:outline-none focus:ring-2 focus:ring-[#2ab5c1]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#718096] uppercase tracking-wide">Weight (kg) — optional</label>
                  <input
                    type="number"
                    min={0}
                    max={200}
                    value={weight || ""}
                    onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
                    className="mt-1 w-full rounded-lg border border-[#e2e8f0] bg-[#f8f9fa] px-3 py-2 text-sm text-[#1a2a5e] focus:outline-none focus:ring-2 focus:ring-[#2ab5c1]"
                    placeholder="Optional"
                  />
                </div>
                <p className="text-[10px] text-[#a0aec0]">Diabetes type: T1D</p>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-sm font-semibold text-[#1a2a5e]">Insulin Regimen</h2>
              <p className="text-[10px] text-[#718096]">13 IOB Hunter™ insulins. Dose in 0.25U increments.</p>
              <div className="space-y-3">
                {regimen.map((entry, i) => (
                  <div key={i} className="rounded-lg border border-[#e2e8f0] p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <select
                        value={entry.insulin}
                        onChange={(e) => updateRegimen(i, "insulin", e.target.value)}
                        className="flex-1 rounded-lg border border-[#e2e8f0] bg-[#f8f9fa] px-2 py-1.5 text-xs text-[#1a2a5e] focus:outline-none focus:ring-2 focus:ring-[#2ab5c1]"
                      >
                        {INSULINS.map((ins) => (
                          <option key={ins} value={ins}>{ins}</option>
                        ))}
                      </select>
                      {regimen.length > 1 && (
                        <button
                          onClick={() => removeRegimenEntry(i)}
                          className="text-[10px] text-red-400 hover:text-red-600"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[9px] text-[#a0aec0]">Dose (U)</label>
                        <input
                          type="number"
                          min={0.25}
                          step={0.25}
                          value={entry.dose}
                          onChange={(e) => updateRegimen(i, "dose", parseFloat(e.target.value) || 0.25)}
                          className="mt-0.5 w-full rounded-lg border border-[#e2e8f0] bg-[#f8f9fa] px-2 py-1.5 text-xs text-[#1a2a5e] focus:outline-none focus:ring-2 focus:ring-[#2ab5c1]"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[9px] text-[#a0aec0]">Times (comma-separated)</label>
                        <input
                          value={entry.times.join(", ")}
                          onChange={(e) =>
                            updateRegimen(i, "times", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))
                          }
                          placeholder="07:00, 12:00"
                          className="mt-0.5 w-full rounded-lg border border-[#e2e8f0] bg-[#f8f9fa] px-2 py-1.5 text-xs text-[#1a2a5e] focus:outline-none focus:ring-2 focus:ring-[#2ab5c1]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addRegimenEntry}
                  className="w-full rounded-lg border border-dashed border-[#e2e8f0] py-2 text-xs text-[#718096] hover:text-[#1a2a5e] hover:border-[#2ab5c1] transition-colors"
                >
                  + Add insulin
                </button>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h2 className="text-sm font-semibold text-[#1a2a5e]">Glucose Targets</h2>
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => setUnits("mmol/L")}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                    units === "mmol/L" ? "border-[#2ab5c1] bg-[#2ab5c1]/10 text-[#1a2a5e]" : "border-[#e2e8f0] text-[#718096]"
                  }`}
                >
                  mmol/L
                </button>
                <button
                  onClick={() => setUnits("mg/dL")}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                    units === "mg/dL" ? "border-[#2ab5c1] bg-[#2ab5c1]/10 text-[#1a2a5e]" : "border-[#e2e8f0] text-[#718096]"
                  }`}
                >
                  mg/dL
                </button>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-[10px] text-[#718096] uppercase tracking-wide">Low</label>
                  <input
                    type="number"
                    step={0.1}
                    value={targetLow}
                    onChange={(e) => setTargetLow(parseFloat(e.target.value) || 3.9)}
                    className="mt-1 w-full rounded-lg border border-[#e2e8f0] bg-[#f8f9fa] px-3 py-2 text-sm text-[#1a2a5e] focus:outline-none focus:ring-2 focus:ring-[#2ab5c1]"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-[#718096] uppercase tracking-wide">High</label>
                  <input
                    type="number"
                    step={0.1}
                    value={targetHigh}
                    onChange={(e) => setTargetHigh(parseFloat(e.target.value) || 10.0)}
                    className="mt-1 w-full rounded-lg border border-[#e2e8f0] bg-[#f8f9fa] px-3 py-2 text-sm text-[#1a2a5e] focus:outline-none focus:ring-2 focus:ring-[#2ab5c1]"
                  />
                </div>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h2 className="text-sm font-semibold text-[#1a2a5e]">Dietary Module</h2>
              <div className="grid grid-cols-1 gap-2">
                {DIETARY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDietary(opt.value)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium text-left transition-colors ${
                      dietary === opt.value
                        ? "border-[#2ab5c1] bg-[#2ab5c1]/10 text-[#1a2a5e]"
                        : "border-[#e2e8f0] text-[#718096] hover:border-[#2ab5c1]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}

          {step === 6 && (
            <div className="text-center space-y-3 py-4">
              <h2 className="text-base font-semibold text-[#1a2a5e]">Ready to explore!</h2>
              <p className="text-xs text-[#718096]">
                Your custom profile will be saved locally. You can edit it anytime.
              </p>
            </div>
          )}

          {/* Clinician shortcut — skip to save after role */}
          {step === 2 && role === "clinician" && (
            <div className="text-center pt-2">
              <p className="text-[10px] text-[#a0aec0]">Clinician profiles use pre-set patient data.</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : navigate("/safe-mode")}
            className="text-xs text-[#718096] hover:text-[#1a2a5e] transition-colors"
          >
            {step > 1 ? "Back" : "Cancel"}
          </button>
          {step < totalSteps ? (
            <button
              onClick={() => {
                if (role === "clinician" && step === 1) {
                  save();
                } else {
                  setStep(step + 1);
                }
              }}
              className="rounded-lg bg-[#2ab5c1] hover:bg-[#229aaa] text-[#1a2a5e] px-5 py-2 text-xs font-medium transition-colors"
            >
              {role === "clinician" && step === 1 ? "Create & Explore" : "Next"}
            </button>
          ) : (
            <button
              onClick={save}
              className="rounded-lg bg-[#2ab5c1] hover:bg-[#229aaa] text-[#1a2a5e] px-5 py-2 text-xs font-medium transition-colors"
            >
              Start Exploring
            </button>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-[#a0aec0] text-center">{DISCLAIMER}</p>

      </div>
    </div>
  );
}

/** Generate plausible sample glucose readings around the target range */
function generateSampleGlucose(low: number, high: number) {
  const mid = (low + high) / 2;
  const spread = (high - low) / 2;
  const times = ["00:00", "03:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];
  return times.map((time) => ({
    time,
    value: Math.round((mid + (Math.random() - 0.5) * spread * 2.5) * 10) / 10,
  }));
}
