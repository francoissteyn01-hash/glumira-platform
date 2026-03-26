/**
 * GluMira — Pattern Recognition Dashboard Page
 *
 * Displays the full pattern recognition analysis for the patient's
 * recent glucose readings.
 *
 * GluMira is an informational tool only. Not a medical device.
 */

"use client";

import { useEffect, useState } from "react";
import { usePatternRecognition } from "@/hooks/usePatternRecognition";
import { PatternRecognitionCard } from "@/components/PatternRecognitionCard";

export default function PatternRecognitionPage() {
  const { report, loading, error, analyse } = usePatternRecognition();
  const [days, setDays] = useState(14);

  useEffect(() => {
    // In production this would fetch readings from the glucose API
    // For now, trigger with an empty array to show the empty state
    analyse([]);
  }, [analyse, days]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pattern Recognition</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Automated detection of glucose patterns
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white"
        >
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={30}>30 days</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-40 bg-gray-100 rounded-xl" />
          <div className="h-24 bg-gray-100 rounded-xl" />
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : report ? (
        <PatternRecognitionCard report={report} />
      ) : null}

      {/* Disclaimer */}
      <p className="text-xs text-gray-300 text-center">
        GluMira is an informational tool only. Not a medical device.
      </p>
    </div>
  );
}
