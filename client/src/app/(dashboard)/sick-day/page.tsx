"use client";

import { useState } from "react";
import { useSickDayRules } from "@/hooks/useSickDayRules";

export default function SickDayPage() {
  const { advice, loading, error, getAdvice } = useSickDayRules();
  const [form, setForm] = useState({
    currentGlucoseMmol: "",
    ketonesMmol: "",
    temperature: "",
    vomiting: false,
    diarrhoea: false,
    ableToEat: true,
    hoursIll: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    getAdvice({
      currentGlucoseMmol: Number(form.currentGlucoseMmol),
      ketonesMmol: form.ketonesMmol ? Number(form.ketonesMmol) : null,
      temperature: form.temperature ? Number(form.temperature) : null,
      vomiting: form.vomiting,
      diarrhoea: form.diarrhoea,
      ableToEat: form.ableToEat,
      hoursIll: Number(form.hoursIll) || 0,
    });
  };

  const severityBg: Record<string, string> = {
    mild: "bg-green-100 text-green-800 border-green-300",
    moderate: "bg-amber-100 text-amber-800 border-amber-300",
    severe: "bg-orange-100 text-orange-800 border-orange-300",
    emergency: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Sick Day Management</h1>
      <p className="text-gray-600">
        Enter your current symptoms to receive evidence-based sick day guidance.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Glucose (mmol/L) *</label>
            <input type="number" step="0.1" required value={form.currentGlucoseMmol}
              onChange={(e) => setForm({ ...form, currentGlucoseMmol: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ketones (mmol/L)</label>
            <input type="number" step="0.1" value={form.ketonesMmol}
              onChange={(e) => setForm({ ...form, ketonesMmol: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperature (°C)</label>
            <input type="number" step="0.1" value={form.temperature}
              onChange={(e) => setForm({ ...form, temperature: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hours Ill</label>
            <input type="number" value={form.hoursIll}
              onChange={(e) => setForm({ ...form, hoursIll: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          </div>
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.vomiting}
              onChange={(e) => setForm({ ...form, vomiting: e.target.checked })} />
            <span className="text-sm">Vomiting</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.diarrhoea}
              onChange={(e) => setForm({ ...form, diarrhoea: e.target.checked })} />
            <span className="text-sm">Diarrhoea</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.ableToEat}
              onChange={(e) => setForm({ ...form, ableToEat: e.target.checked })} />
            <span className="text-sm">Able to Eat</span>
          </label>
        </div>

        <button type="submit" disabled={loading || !form.currentGlucoseMmol}
          className="w-full py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
          {loading ? "Assessing..." : "Get Sick Day Advice"}
        </button>
      </form>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      {advice && (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg border-2 ${severityBg[advice.severity]}`}>
            <p className="text-lg font-bold capitalize">{advice.severity} Severity</p>
            {advice.seekMedicalAttention && (
              <p className="mt-1 font-semibold">Seek medical attention immediately.</p>
            )}
          </div>

          {advice.warnings.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">Warnings</h3>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {advice.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-teal-600">{advice.glucoseCheckFrequencyHours}h</p>
              <p className="text-gray-600">Glucose Checks</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-teal-600">{advice.ketoneCheckFrequencyHours}h</p>
              <p className="text-gray-600">Ketone Checks</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-teal-600">{advice.fluidTargetMlPerHour}ml</p>
              <p className="text-gray-600">Fluids/Hour</p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-1">Insulin Advice</h3>
            <p className="text-sm text-blue-700">{advice.insulinAdvice}</p>
          </div>

          <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
            <h3 className="font-semibold text-teal-800 mb-2">Recommendations</h3>
            <ul className="list-disc list-inside text-sm text-teal-700 space-y-1">
              {advice.recommendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>

          <p className="text-xs text-gray-400 text-center">
            GluMira™ is an informational tool only. Not a medical device.
            Always follow your diabetes team's sick day plan.
          </p>
        </div>
      )}
    </div>
  );
}
