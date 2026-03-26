"use client";

/**
 * GluMira™ — Patient Profile Edit Page
 * /dashboard/profile
 *
 * Allows the authenticated user to view and update their patient profile:
 *  - Display name
 *  - Date of birth
 *  - Diabetes type (T1D / T2D / LADA / Other)
 *  - Insulin type (NovoRapid / Humalog / Fiasp / Apidra / Tresiba / Lantus / Other)
 *  - Insulin concentration (100 / 200 / 300 / 500 U/mL)
 *  - Weight (kg) and height (cm)
 *  - Glucose units preference (mmol/L / mg/dL)
 *  - Active meal regime
 *  - Notification preferences
 *
 * Uses /api/profile GET + PATCH routes.
 * All PHI fields are encrypted server-side before storage.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Types ─────────────────────────────────────────────────────

interface PatientProfile {
  id: string;
  displayName: string;
  dob: string | null;
  diabetesType: "T1D" | "T2D" | "LADA" | "Other";
  insulinType: string;
  insulinConcentration: 100 | 200 | 300 | 500;
  weightKg: number | null;
  heightCm: number | null;
  glucoseUnits: "mmol/L" | "mg/dL";
  activeMealRegime: string | null;
  notificationsEnabled: boolean;
  hypoAlertThreshold: number;
  hyperAlertThreshold: number;
  createdAt: string;
}

interface ProfileFormState {
  displayName: string;
  dob: string;
  diabetesType: "T1D" | "T2D" | "LADA" | "Other";
  insulinType: string;
  insulinConcentration: number;
  weightKg: string;
  heightCm: string;
  glucoseUnits: "mmol/L" | "mg/dL";
  activeMealRegime: string;
  notificationsEnabled: boolean;
  hypoAlertThreshold: string;
  hyperAlertThreshold: string;
}

// ─── Constants ─────────────────────────────────────────────────

const DIABETES_TYPES = ["T1D", "T2D", "LADA", "Other"] as const;

const INSULIN_TYPES = [
  "NovoRapid",
  "Humalog",
  "Fiasp",
  "Apidra",
  "Novolog",
  "Tresiba",
  "Lantus",
  "Levemir",
  "Toujeo",
  "Basaglar",
  "Other",
];

const CONCENTRATIONS = [100, 200, 300, 500] as const;

const MEAL_REGIMES = [
  "standard",
  "low-carb",
  "very-low-carb",
  "moderate-carb",
  "high-carb",
  "school-day",
  "sport-day",
  "sick-day",
  "ramadan",
  "pregnancy",
];

// ─── Helpers ───────────────────────────────────────────────────

function bmiLabel(weightKg: number, heightCm: number): string {
  const bmi = weightKg / Math.pow(heightCm / 100, 2);
  if (bmi < 18.5) return `BMI ${bmi.toFixed(1)} — Underweight`;
  if (bmi < 25) return `BMI ${bmi.toFixed(1)} — Healthy`;
  if (bmi < 30) return `BMI ${bmi.toFixed(1)} — Overweight`;
  return `BMI ${bmi.toFixed(1)} — Obese`;
}

// ─── Component ─────────────────────────────────────────────────

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [form, setForm] = useState<ProfileFormState>({
    displayName: "",
    dob: "",
    diabetesType: "T1D",
    insulinType: "NovoRapid",
    insulinConcentration: 100,
    weightKg: "",
    heightCm: "",
    glucoseUnits: "mmol/L",
    activeMealRegime: "standard",
    notificationsEnabled: true,
    hypoAlertThreshold: "3.9",
    hyperAlertThreshold: "13.9",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "insulin" | "alerts">("personal");

  // ─── Fetch profile ──────────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) {
        if (res.status === 401) { router.push("/login"); return; }
        throw new Error(`Failed to load profile (${res.status})`);
      }
      const data: PatientProfile = await res.json();
      setProfile(data);
      setForm({
        displayName: data.displayName ?? "",
        dob: data.dob ?? "",
        diabetesType: data.diabetesType ?? "T1D",
        insulinType: data.insulinType ?? "NovoRapid",
        insulinConcentration: data.insulinConcentration ?? 100,
        weightKg: data.weightKg != null ? String(data.weightKg) : "",
        heightCm: data.heightCm != null ? String(data.heightCm) : "",
        glucoseUnits: data.glucoseUnits ?? "mmol/L",
        activeMealRegime: data.activeMealRegime ?? "standard",
        notificationsEnabled: data.notificationsEnabled ?? true,
        hypoAlertThreshold: String(data.hypoAlertThreshold ?? 3.9),
        hyperAlertThreshold: String(data.hyperAlertThreshold ?? 13.9),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // ─── Save profile ───────────────────────────────────────────

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        displayName: form.displayName.trim(),
        dob: form.dob || null,
        diabetesType: form.diabetesType,
        insulinType: form.insulinType,
        insulinConcentration: Number(form.insulinConcentration),
        weightKg: form.weightKg ? Number(form.weightKg) : null,
        heightCm: form.heightCm ? Number(form.heightCm) : null,
        glucoseUnits: form.glucoseUnits,
        activeMealRegime: form.activeMealRegime || null,
        notificationsEnabled: form.notificationsEnabled,
        hypoAlertThreshold: Number(form.hypoAlertThreshold),
        hyperAlertThreshold: Number(form.hyperAlertThreshold),
      };

      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Save failed (${res.status})`);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      await fetchProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const set = (field: keyof ProfileFormState, value: string | boolean | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // ─── BMI display ────────────────────────────────────────────

  const bmi = form.weightKg && form.heightCm
    ? bmiLabel(Number(form.weightKg), Number(form.heightCm))
    : null;

  // ─── Render ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading profile…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Patient Profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Update your personal details and preferences. All PHI is encrypted at rest.
        </p>
        {profile && (
          <p className="text-xs text-slate-400 mt-1">
            Profile created {new Date(profile.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1">
        {(["personal", "insulin", "alerts"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab === "personal" ? "Personal" : tab === "insulin" ? "Insulin" : "Alerts"}
          </button>
        ))}
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          ✓ Profile saved successfully
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">

        {/* ── Personal Tab ─────────────────────────────────── */}
        {activeTab === "personal" && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={form.displayName}
                onChange={e => set("displayName", e.target.value)}
                required
                maxLength={80}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Emma Johnson"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={form.dob}
                onChange={e => set("dob", e.target.value)}
                max={new Date().toISOString().split("T")[0]}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Diabetes Type
              </label>
              <select
                value={form.diabetesType}
                onChange={e => set("diabetesType", e.target.value as "T1D" | "T2D" | "LADA" | "Other")}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {DIABETES_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={form.weightKg}
                  onChange={e => set("weightKg", e.target.value)}
                  min={10} max={300} step={0.1}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 65.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={form.heightCm}
                  onChange={e => set("heightCm", e.target.value)}
                  min={50} max={250} step={0.5}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 168"
                />
              </div>
            </div>
            {bmi && (
              <p className="text-xs text-slate-500 -mt-2">{bmi}</p>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Glucose Units
              </label>
              <div className="flex gap-3">
                {(["mmol/L", "mg/dL"] as const).map(unit => (
                  <label key={unit} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="glucoseUnits"
                      value={unit}
                      checked={form.glucoseUnits === unit}
                      onChange={() => set("glucoseUnits", unit)}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-slate-700">{unit}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Active Meal Regime
              </label>
              <select
                value={form.activeMealRegime}
                onChange={e => set("activeMealRegime", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {MEAL_REGIMES.map(r => (
                  <option key={r} value={r}>
                    {r.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* ── Insulin Tab ───────────────────────────────────── */}
        {activeTab === "insulin" && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Insulin Type
              </label>
              <select
                value={form.insulinType}
                onChange={e => set("insulinType", e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {INSULIN_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Insulin Concentration (U/mL)
              </label>
              <select
                value={form.insulinConcentration}
                onChange={e => set("insulinConcentration", Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CONCENTRATIONS.map(c => (
                  <option key={c} value={c}>U-{c}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Most patients use U-100. U-200/300/500 are high-concentration pens — confirm with your diabetes care team.
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs font-medium text-blue-800 mb-1">IOB Hunter™ Calculation Note</p>
              <p className="text-xs text-blue-700">
                Your insulin type and concentration are used by the IOB Hunter™ engine to calculate
                Insulin-on-Board using a biexponential decay model. Changes take effect on your next
                dose entry. Historical IOB values are not recalculated.
              </p>
            </div>
          </>
        )}

        {/* ── Alerts Tab ────────────────────────────────────── */}
        {activeTab === "alerts" && (
          <>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <p className="text-sm font-medium text-slate-700">Push Notifications</p>
                <p className="text-xs text-slate-500 mt-0.5">Hypo and hyper alerts via browser push</p>
              </div>
              <button
                type="button"
                onClick={() => set("notificationsEnabled", !form.notificationsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.notificationsEnabled ? "bg-blue-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    form.notificationsEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Hypo Alert Threshold ({form.glucoseUnits})
              </label>
              <input
                type="number"
                value={form.hypoAlertThreshold}
                onChange={e => set("hypoAlertThreshold", e.target.value)}
                min={form.glucoseUnits === "mmol/L" ? 2.0 : 36}
                max={form.glucoseUnits === "mmol/L" ? 5.0 : 90}
                step={form.glucoseUnits === "mmol/L" ? 0.1 : 1}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Alert fires when glucose drops below this value. Recommended: {form.glucoseUnits === "mmol/L" ? "3.9 mmol/L" : "70 mg/dL"}.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Hyper Alert Threshold ({form.glucoseUnits})
              </label>
              <input
                type="number"
                value={form.hyperAlertThreshold}
                onChange={e => set("hyperAlertThreshold", e.target.value)}
                min={form.glucoseUnits === "mmol/L" ? 8.0 : 144}
                max={form.glucoseUnits === "mmol/L" ? 25.0 : 450}
                step={form.glucoseUnits === "mmol/L" ? 0.1 : 1}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Alert fires when glucose rises above this value. Recommended: {form.glucoseUnits === "mmol/L" ? "13.9 mmol/L" : "250 mg/dL"}.
              </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-medium text-amber-800 mb-1">⚠ Disclaimer</p>
              <p className="text-xs text-amber-700">
                GluMira™ alert thresholds are for informational purposes only. They do not replace
                clinical CGM alarms or medical advice. Always follow the guidance of your diabetes
                care team for alert settings.
              </p>
            </div>
          </>
        )}

        {/* Save button */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            ← Back to Dashboard
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="mt-10 p-4 border border-red-200 rounded-lg">
        <h3 className="text-sm font-semibold text-red-700 mb-2">Danger Zone</h3>
        <p className="text-xs text-slate-500 mb-3">
          Permanently delete all your data from GluMira™. This action cannot be undone and will
          erase all glucose readings, doses, meals, clinician notes, and your patient profile.
          Your account will be deactivated.
        </p>
        <button
          type="button"
          onClick={() => {
            if (confirm("Are you absolutely sure? This will permanently delete ALL your data and cannot be undone.")) {
              fetch("/api/gdpr/erase", { method: "DELETE" })
                .then(() => router.push("/login"))
                .catch(() => setError("GDPR erase failed — please contact support."));
            }
          }}
          className="px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
        >
          Delete All My Data (GDPR Erase)
        </button>
      </div>
    </div>
  );
}
