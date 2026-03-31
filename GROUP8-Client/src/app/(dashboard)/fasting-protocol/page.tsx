"use client";

import { useState } from "react";
import { useFastingProtocol } from "@/hooks/useFastingProtocol";

export default function FastingProtocolPage() {
  const { result, loading, error, generate } = useFastingProtocol();
  const [form, setForm] = useState({
    fastingType: "intermittent-16-8",
    fastingStartHour: "20",
    fastingDurationHours: "16",
    diabetesType: "type2",
    currentBasalUnits: "20",
    currentBolusPerMeal: "6",
    mealsPerDay: "3",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generate({
      ...form,
      fastingStartHour: Number(form.fastingStartHour),
      fastingDurationHours: Number(form.fastingDurationHours),
      currentBasalUnits: Number(form.currentBasalUnits),
      currentBolusPerMeal: Number(form.currentBolusPerMeal),
      mealsPerDay: Number(form.mealsPerDay),
      recentGlucoseReadings: [6.5, 7.0, 6.8, 7.2, 6.0],
    });
  };

  const riskBg: Record<string, string> = {
    low: "bg-green-100 text-green-800",
    moderate: "bg-amber-100 text-amber-800",
    high: "bg-red-100 text-red-800",
    "very-high": "bg-red-200 text-red-900",
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Fasting Protocol Planner</h1>
      <p className="text-gray-600">Get personalized guidance for managing diabetes during fasting.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fasting Type</label>
            <select value={form.fastingType} onChange={(e) => setForm({ ...form, fastingType: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2">
              <option value="intermittent-16-8">16:8 Intermittent</option>
              <option value="intermittent-18-6">18:6 Intermittent</option>
              <option value="intermittent-20-4">20:4 Intermittent</option>
              <option value="omad">OMAD (One Meal)</option>
              <option value="ramadan">Ramadan</option>
              <option value="medical-prep">Medical Prep</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Diabetes Type</label>
            <select value={form.diabetesType} onChange={(e) => setForm({ ...form, diabetesType: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2">
              <option value="type1">Type 1</option>
              <option value="type2">Type 2</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fasting Duration (hours)</label>
            <input type="number" value={form.fastingDurationHours}
              onChange={(e) => setForm({ ...form, fastingDurationHours: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Basal Dose (units)</label>
            <input type="number" value={form.currentBasalUnits}
              onChange={(e) => setForm({ ...form, currentBasalUnits: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2" />
          </div>
        </div>
        <button type="submit" disabled={loading}
          className="w-full py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
          {loading ? "Generating..." : "Generate Protocol"}
        </button>
      </form>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      {result && (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${riskBg[result.riskLevel]}`}>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold capitalize">{result.riskLevel} Risk</span>
              <span className="text-sm">{result.approved ? "Approved with guidance" : "NOT RECOMMENDED"}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-bold text-teal-600">Fasting: {result.fastingWindow.start}:00 - {result.fastingWindow.end}:00</p>
              <p className="text-gray-600">{result.fastingWindow.durationHours}h window</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-bold text-teal-600">Eating: {result.eatingWindow.start}:00 - {result.eatingWindow.end}:00</p>
              <p className="text-gray-600">{result.eatingWindow.durationHours}h window</p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800">Basal: {result.basalAdjustment.newDose}u ({result.basalAdjustment.changePercent}%)</h3>
            <p className="text-sm text-blue-700 mt-1">{result.basalAdjustment.explanation}</p>
          </div>

          {result.warnings.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">Warnings</h3>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {result.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}

          <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
            <h3 className="font-semibold text-teal-800 mb-2">Recommendations</h3>
            <ul className="list-disc list-inside text-sm text-teal-700 space-y-1">
              {result.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
