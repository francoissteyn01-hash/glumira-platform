/**
 * GluMira — Insulin Stacking Dashboard Page
 *
 * Displays insulin stacking analysis with IOB overlap detection,
 * stacking risk assessment, and dose spacing recommendations.
 *
 * GluMira is an informational tool only. Not a medical device.
 */

"use client";

import { useEffect, useState } from "react";

interface StackingResult {
  stackingDetected: boolean;
  riskLevel: string;
  totalIob: number;
  overlapCount: number;
  recommendation: string;
}

function riskColour(level: string): string {
  switch (level) {
    case "low": return "text-green-600";
    case "moderate": return "text-amber-600";
    case "high": return "text-red-600";
    case "critical": return "text-red-800";
    default: return "text-gray-600";
  }
}

function riskBg(level: string): string {
  switch (level) {
    case "low": return "bg-green-50 border-green-200";
    case "moderate": return "bg-amber-50 border-amber-200";
    case "high": return "bg-red-50 border-red-200";
    case "critical": return "bg-red-100 border-red-300";
    default: return "bg-gray-50 border-gray-200";
  }
}

export default function InsulinStackingPage() {
  const [data, setData] = useState<StackingResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/analytics/insulin-stacking");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setData(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6 text-gray-500">Analysing insulin stacking...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Insulin Stacking Analysis</h1>
      <p className="text-gray-600">
        Detects overlapping insulin doses that may cause hypoglycaemia due to IOB accumulation.
      </p>

      <div className={`rounded-lg border p-6 ${riskBg(data.riskLevel)}`}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Stacking Detected</p>
            <p className={`text-2xl font-bold ${data.stackingDetected ? "text-red-600" : "text-green-600"}`}>
              {data.stackingDetected ? "Yes" : "No"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Risk Level</p>
            <p className={`text-2xl font-bold capitalize ${riskColour(data.riskLevel)}`}>
              {data.riskLevel}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total IOB</p>
            <p className="text-2xl font-bold">{data.totalIob.toFixed(1)} U</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Overlaps</p>
            <p className="text-2xl font-bold">{data.overlapCount}</p>
          </div>
        </div>
      </div>

      {data.recommendation && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-800">Recommendation</p>
          <p className="text-sm text-blue-700 mt-1">{data.recommendation}</p>
        </div>
      )}

      <p className="text-xs text-gray-400">
        GluMira is an informational tool only. Not a medical device.
      </p>
    </div>
  );
}
