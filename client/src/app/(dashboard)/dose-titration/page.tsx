/**
 * GluMira™ — Dose Titration Dashboard Page
 *
 * Displays basal titration recommendations based on fasting glucose patterns.
 * Includes risk tier, suggested adjustment, and fasting pattern classification.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import { useState } from "react";
import { useBasalTitration } from "@/hooks/useBasalTitration";

export default function DoseTitrationPage() {
  const { result, loading, error, compute } = useBasalTitration();
  const [fastingReadings, setFastingReadings] = useState<string>("5.8, 6.2, 7.1, 6.8, 5.9");
  const [currentBasal, setCurrentBasal] = useState<string>("18");
  const [targetFasting, setTargetFasting] = useState<string>("5.5");

  const handleCompute = () => {
    const readings = fastingReadings
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n));
    const basal = parseFloat(currentBasal);
    const target = parseFloat(targetFasting);

    if (readings.length < 3) {
      alert("Please enter at least 3 fasting readings");
      return;
    }

    compute({
      fastingGlucoseReadings: readings,
      currentBasalDose: isNaN(basal) ? undefined : basal,
      targetFastingMmol: isNaN(target) ? 5.5 : target,
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Basal Dose Titration</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Analyse fasting glucose patterns to guide basal insulin adjustment
        </p>
      </div>

      {/* Input form */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fasting glucose readings (mmol/L, comma-separated)
          </label>
          <input
            type="text"
            value={fastingReadings}
            onChange={(e) => setFastingReadings(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 5.8, 6.2, 7.1, 6.8"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current basal dose (U)
            </label>
            <input
              type="number"
              value={currentBasal}
              onChange={(e) => setCurrentBasal(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              step="0.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target fasting glucose (mmol/L)
            </label>
            <input
              type="number"
              value={targetFasting}
              onChange={(e) => setTargetFasting(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="3.5"
              max="10"
              step="0.1"
            />
          </div>
        </div>
        <button
          onClick={handleCompute}
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? "Analysing…" : "Analyse Titration"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Risk tier */}
          <div className={`rounded-xl border p-4 ${
            result.riskTier === "high" || result.riskTier === "very-high"
              ? "bg-red-50 border-red-200"
              : result.riskTier === "moderate"
              ? "bg-amber-50 border-amber-200"
              : "bg-green-50 border-green-200"
          }`}>
            <p className="text-xs font-medium text-gray-500">Titration Risk</p>
            <p className="text-lg font-bold text-gray-900 mt-0.5">{result.riskLabel}</p>
            <p className="text-sm text-gray-600 mt-1">{result.pattern}</p>
          </div>

          {/* Suggested adjustment */}
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500">Suggested Adjustment</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-2xl font-bold ${
                result.suggestedAdjustmentUnits > 0 ? "text-blue-600" :
                result.suggestedAdjustmentUnits < 0 ? "text-red-600" : "text-gray-500"
              }`}>
                {result.suggestedAdjustmentUnits > 0 ? "+" : ""}
                {result.suggestedAdjustmentUnits} U
              </span>
              {result.newBasalDose !== null && (
                <span className="text-sm text-gray-500">
                  → {result.newBasalDose} U/day
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Confidence: {result.confidence}
            </p>
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-medium text-gray-500 mb-2">Recommendations</p>
              <ul className="space-y-1.5">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5 shrink-0">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-gray-300 text-center">
        GluMira™ is an informational tool only. Not a medical device.
        Always consult your diabetes care team before adjusting insulin doses.
      </p>
    </div>
  );
}
