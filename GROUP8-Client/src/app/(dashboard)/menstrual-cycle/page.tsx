"use client";

import { useState } from "react";
import { useMenstrualCycleImpact } from "@/hooks/useMenstrualCycleImpact";

export default function MenstrualCyclePage() {
  const { result, loading, error, analyze } = useMenstrualCycleImpact();
  const [cycleDay, setCycleDay] = useState("14");

  const handleAnalyze = () => {
    const day = Number(cycleDay);
    const sampleDays = Array.from({ length: day }, (_, i) => ({
      date: `2026-03-${String(i + 1).padStart(2, "0")}`,
      cycleDay: i + 1,
      glucoseReadings: [5.5 + Math.random() * 3, 6.0 + Math.random() * 2.5],
      basalDoseUnits: 20 + (i > 16 ? 3 : 0),
      totalBolusUnits: 12 + (i > 16 ? 2 : 0),
      totalCarbsGrams: 180 + Math.round(Math.random() * 40),
      symptoms: i < 5 ? ["cramps"] : i > 20 ? ["bloating", "fatigue"] : [],
    }));
    analyze(sampleDays, 28);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Menstrual Cycle Impact</h1>
      <p className="text-gray-600">Track how your cycle phases affect insulin sensitivity and glucose patterns.</p>

      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Current Cycle Day</label>
          <input type="number" min="1" max="35" value={cycleDay}
            onChange={(e) => setCycleDay(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2" />
        </div>
        <button onClick={handleAnalyze} disabled={loading}
          className="py-2 px-6 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50">
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      {result && (
        <div className="space-y-4">
          <div className="p-4 bg-pink-50 border border-pink-200 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-pink-800 text-lg">{result.currentPhase.name}</h3>
                <p className="text-sm text-pink-600">Day {result.currentCycleDay} of {result.cycleLength}</p>
              </div>
              <span className="px-3 py-1 bg-pink-200 text-pink-800 rounded-full text-sm font-medium capitalize">
                {result.patternStrength} pattern
              </span>
            </div>
            <p className="text-sm text-pink-700 mt-2">{result.currentPhase.description}</p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800">Insulin Adjustment</h3>
            <p className="text-sm text-blue-700 mt-1">{result.insulinAdjustment.explanation}</p>
            <div className="flex gap-4 mt-2 text-sm">
              <span className="font-medium">Basal: {result.insulinAdjustment.basalChangePercent > 0 ? "+" : ""}{result.insulinAdjustment.basalChangePercent}%</span>
              <span className="font-medium">Bolus: {result.insulinAdjustment.bolusChangePercent > 0 ? "+" : ""}{result.insulinAdjustment.bolusChangePercent}%</span>
            </div>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="font-semibold text-purple-800">Next Phase</h3>
            <p className="text-sm text-purple-700 mt-1">
              <strong>{result.predictedNextPhase.name}</strong> in ~{result.predictedNextPhase.startsInDays} days
            </p>
            <p className="text-sm text-purple-600 mt-1">{result.predictedNextPhase.expectedChange}</p>
          </div>

          {result.phaseAnalysis.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Phase</th>
                    <th className="px-3 py-2 text-right">Avg Glucose</th>
                    <th className="px-3 py-2 text-right">CV%</th>
                    <th className="px-3 py-2 text-right">Readings</th>
                  </tr>
                </thead>
                <tbody>
                  {result.phaseAnalysis.map((p: any) => (
                    <tr key={p.phase} className="border-t border-gray-100">
                      <td className="px-3 py-2 font-medium">{p.phase}</td>
                      <td className="px-3 py-2 text-right">{p.avgGlucose} mmol/L</td>
                      <td className="px-3 py-2 text-right">{p.glucoseVariability}%</td>
                      <td className="px-3 py-2 text-right">{p.readingCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
