/**
 * GluMira™ — BolusCalculatorForm.tsx
 *
 * Bolus calculator form component.
 * Accepts carbs, current glucose, target, ICR, ISF, and active IOB.
 * Displays calculated meal dose, correction dose, and total suggested dose.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useState } from "react";
import { useBolusCalculator } from "@/hooks/useBolusCalculator";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ConfidenceBadge({ confidence }: { confidence: "high" | "medium" | "low" }) {
  const colours: Record<string, string> = {
    high:   "bg-green-100 text-green-800",
    medium: "bg-amber-100 text-amber-800",
    low:    "bg-red-100 text-red-800",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colours[confidence]}`}>
      {confidence.charAt(0).toUpperCase() + confidence.slice(1)} confidence
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BolusCalculatorForm() {
  const { result, loading, error, calculate, reset } = useBolusCalculator();

  const [form, setForm] = useState({
    carbsGrams: "",
    currentGlucose: "",
    targetGlucose: "5.5",
    icr: "",
    isf: "",
    activeIob: "0",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await calculate({
      carbsGrams:     Number(form.carbsGrams),
      currentGlucose: Number(form.currentGlucose),
      targetGlucose:  Number(form.targetGlucose),
      icr:            Number(form.icr),
      isf:            Number(form.isf),
      activeIob:      Number(form.activeIob),
    });
  };

  return (
    <div className="space-y-6">
      {/* Disclaimer */}
      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
        GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice. Always confirm doses with your clinician.
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Carbs (g)</label>
            <input
              type="number"
              name="carbsGrams"
              min="0"
              max="300"
              step="1"
              value={form.carbsGrams}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 45"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Glucose (mmol/L)</label>
            <input
              type="number"
              name="currentGlucose"
              min="1"
              max="30"
              step="0.1"
              value={form.currentGlucose}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 7.2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Glucose (mmol/L)</label>
            <input
              type="number"
              name="targetGlucose"
              min="4"
              max="10"
              step="0.1"
              value={form.targetGlucose}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ICR (g carbs per unit)</label>
            <input
              type="number"
              name="icr"
              min="1"
              max="100"
              step="0.5"
              value={form.icr}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ISF (mmol/L per unit)</label>
            <input
              type="number"
              name="isf"
              min="0.5"
              max="20"
              step="0.1"
              value={form.isf}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. 2.5"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Active IOB (units)</label>
            <input
              type="number"
              name="activeIob"
              min="0"
              max="50"
              step="0.1"
              value={form.activeIob}
              onChange={handleChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Calculating…" : "Calculate Bolus"}
          </button>
          {result && (
            <button
              type="button"
              onClick={reset}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
          )}
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Bolus Recommendation</h3>
            <ConfidenceBadge confidence={result.confidence} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-md bg-gray-50 p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Meal Dose</p>
              <p className="text-2xl font-bold text-gray-900">{result.mealDose.toFixed(1)}U</p>
            </div>
            <div className="rounded-md bg-gray-50 p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">Correction Dose</p>
              <p className="text-2xl font-bold text-gray-900">{result.correctionDose.toFixed(1)}U</p>
            </div>
            <div className="rounded-md bg-gray-50 p-3 text-center">
              <p className="text-xs text-gray-500 mb-1">IOB Offset</p>
              <p className="text-2xl font-bold text-red-600">-{result.iobOffset.toFixed(1)}U</p>
            </div>
            <div className="rounded-md bg-blue-50 p-3 text-center border border-blue-200">
              <p className="text-xs text-blue-600 mb-1 font-medium">Suggested Total</p>
              <p className="text-2xl font-bold text-blue-700">{result.suggestedDose.toFixed(1)}U</p>
            </div>
          </div>

          {result.bolusDelay > 0 && (
            <p className="text-xs text-gray-600">
              Pre-bolus delay: <span className="font-medium">{result.bolusDelay} min</span> before eating
            </p>
          )}

          {result.warnings.length > 0 && (
            <ul className="space-y-1">
              {result.warnings.map((w, i) => (
                <li key={i} className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                  ⚠ {w}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
