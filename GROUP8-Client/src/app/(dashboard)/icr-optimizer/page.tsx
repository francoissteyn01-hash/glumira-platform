/**
 * GluMira — ICR Optimizer Dashboard Page
 *
 * Allows patients to review their carb-to-insulin ratio analysis
 * with per-meal-time breakdown and adjustment suggestions.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useState } from "react";
import { useIcrOptimizer } from "@/hooks/useIcrOptimizer";

export default function IcrOptimizerPage() {
  const { data, loading, error, analyse, directionLabel, directionColour } = useIcrOptimizer();
  const [currentIcr, setCurrentIcr] = useState(10);
  const [days, setDays] = useState(14);

  const handleAnalyse = async () => {
    // In production, meals would be fetched from the API
    // For now, trigger with empty array to show the UI
    await analyse([], currentIcr);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">ICR Optimizer</h1>
      <p className="text-gray-600">
        Analyse your meal data to find the optimal insulin-to-carb ratio for each meal period.
      </p>

      {/* Input controls */}
      <div className="bg-white rounded-lg border p-4 flex items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Current ICR (g/U)</label>
          <input
            type="number"
            value={currentIcr}
            onChange={(e) => setCurrentIcr(Number(e.target.value))}
            className="w-24 border rounded px-3 py-2 text-sm"
            min={1}
            max={50}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Analysis Period</label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
        </div>
        <button
          onClick={handleAnalyse}
          disabled={loading}
          className="bg-teal-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
        >
          {loading ? "Analysing..." : "Analyse"}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
      )}

      {data && (
        <>
          {/* Overall result */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Overall Analysis</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Current ICR</p>
                <p className="text-xl font-bold">{data.overall.currentIcr} g/U</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Effective ICR</p>
                <p className="text-xl font-bold">{data.overall.effectiveIcr} g/U</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Suggested ICR</p>
                <p className="text-xl font-bold">{data.overall.suggestedIcr} g/U</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Direction</p>
                <p className={`text-xl font-bold ${directionColour(data.overall.direction)}`}>
                  {data.overall.direction}
                </p>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600">{directionLabel(data.overall.direction)}</p>
            <p className="text-xs text-gray-400 mt-1">
              Based on {data.overall.mealCount} meals | Confidence: {data.overall.confidence}
            </p>
          </div>

          {/* Per-meal-time breakdown */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">By Meal Period</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2">Period</th>
                    <th className="pb-2">Suggested ICR</th>
                    <th className="pb-2">Meals</th>
                    <th className="pb-2">Avg Excursion</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byMealTime.map((mt) => (
                    <tr key={mt.period} className="border-b">
                      <td className="py-2 capitalize font-medium">{mt.period}</td>
                      <td className="py-2">{mt.suggestedIcr} g/U</td>
                      <td className="py-2">{mt.mealCount}</td>
                      <td className="py-2">
                        {mt.avgExcursion > 0 ? "+" : ""}
                        {mt.avgExcursion.toFixed(1)} mmol/L
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <p className="text-xs text-gray-400">
        GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
        Always consult your diabetes care team before adjusting insulin doses.
      </p>
    </div>
  );
}
