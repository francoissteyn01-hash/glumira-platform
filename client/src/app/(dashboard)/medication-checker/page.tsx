"use client";

import { useState } from "react";
import { useMedicationInteraction } from "@/hooks/useMedicationInteraction";

export default function MedicationCheckerPage() {
  const { report, loading, error, checkMedications } = useMedicationInteraction();
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const meds = input
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (meds.length > 0) checkMedications(meds);
  };

  const severityBg: Record<string, string> = {
    high: "bg-red-100 text-red-800 border-red-300",
    moderate: "bg-amber-100 text-amber-800 border-amber-300",
    low: "bg-blue-100 text-blue-800 border-blue-300",
    info: "bg-gray-100 text-gray-700 border-gray-300",
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Medication Interaction Checker</h1>
      <p className="text-gray-600">
        Enter your current medications (comma-separated) to check for potential
        glucose interactions.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. prednisone, atenolol, metformin"
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
        >
          {loading ? "Checking..." : "Check"}
        </button>
      </form>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {report && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-red-50 rounded-lg text-center">
              <p className="text-3xl font-bold text-red-600">{report.highSeverityCount}</p>
              <p className="text-sm text-red-700">High Severity</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-lg text-center">
              <p className="text-3xl font-bold text-amber-600">{report.moderateCount}</p>
              <p className="text-sm text-amber-700">Moderate</p>
            </div>
          </div>

          <div className="space-y-3">
            {report.results.map((r, i) => (
              <div
                key={i}
                className={`p-4 rounded-lg border ${
                  r.entry ? severityBg[r.entry.severity] : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold capitalize">{r.medication}</span>
                  {r.entry && (
                    <span className="text-xs px-2 py-1 rounded-full bg-white/60">
                      {r.entry.glucoseEffect === "raises" && "↑ Raises glucose"}
                      {r.entry.glucoseEffect === "lowers" && "↓ Lowers glucose"}
                      {r.entry.glucoseEffect === "variable" && "↕ Variable"}
                      {r.entry.glucoseEffect === "none" && "— No direct effect"}
                    </span>
                  )}
                </div>
                {r.warning && <p className="mt-2 text-sm">{r.warning}</p>}
                {!r.matched && (
                  <p className="mt-1 text-sm text-gray-500">
                    Not found in database — consult your pharmacist.
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
            <h3 className="font-semibold text-teal-800 mb-2">Recommendations</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-teal-700">
              {report.recommendations.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-gray-400 text-center">
            GluMira™ is an informational tool only. Not a medical device.
            Always consult your healthcare team before making medication changes.
          </p>
        </div>
      )}
    </div>
  );
}
