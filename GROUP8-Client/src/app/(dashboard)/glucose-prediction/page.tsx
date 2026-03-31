/**
 * GluMira — Glucose Prediction Dashboard Page
 *
 * Displays real-time glucose prediction with rate-of-change arrows,
 * predicted values at 15/30/60 min, and urgency assessment.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useEffect, useState } from "react";

interface PredictionResult {
  currentGlucose: number;
  rateOfChange: number;
  arrow: string;
  predictions: { minutes: number; value: number }[];
  urgency: string;
}

function urgencyColour(u: string): string {
  switch (u) {
    case "none": return "text-green-600";
    case "low": return "text-blue-600";
    case "moderate": return "text-amber-600";
    case "high": return "text-red-600";
    case "critical": return "text-red-800";
    default: return "text-gray-600";
  }
}

function urgencyBg(u: string): string {
  switch (u) {
    case "none": return "bg-green-50";
    case "low": return "bg-blue-50";
    case "moderate": return "bg-amber-50";
    case "high": return "bg-red-50";
    case "critical": return "bg-red-100";
    default: return "bg-gray-50";
  }
}

function arrowSymbol(arrow: string): string {
  switch (arrow) {
    case "rising-fast": return "\u2191\u2191";
    case "rising": return "\u2191";
    case "rising-slow": return "\u2197";
    case "stable": return "\u2192";
    case "falling-slow": return "\u2198";
    case "falling": return "\u2193";
    case "falling-fast": return "\u2193\u2193";
    default: return "?";
  }
}

export default function GlucosePredictionPage() {
  const [data, setData] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/glucose/prediction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ readings: [] }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setData(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6 text-gray-500">Predicting glucose...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Glucose Prediction</h1>
      <p className="text-gray-600">
        Predicted glucose values based on current rate of change, with urgency assessment.
      </p>

      {/* Current reading hero */}
      <div className={`rounded-lg border p-6 text-center ${urgencyBg(data.urgency)}`}>
        <p className="text-sm text-gray-600">Current Glucose</p>
        <p className="text-5xl font-bold mt-1">
          {data.currentGlucose.toFixed(1)}
          <span className="text-3xl ml-2">{arrowSymbol(data.arrow)}</span>
        </p>
        <p className="text-sm text-gray-500 mt-1">mmol/L</p>
        <p className={`text-sm font-medium mt-2 capitalize ${urgencyColour(data.urgency)}`}>
          Urgency: {data.urgency}
        </p>
      </div>

      {/* Predictions table */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="text-lg font-semibold mb-4">Predicted Values</h2>
        <div className="grid grid-cols-3 gap-4">
          {data.predictions.map((p) => (
            <div key={p.minutes} className="text-center border rounded-lg p-4">
              <p className="text-sm text-gray-500">+{p.minutes} min</p>
              <p className="text-2xl font-bold mt-1">{p.value.toFixed(1)}</p>
              <p className="text-xs text-gray-400">mmol/L</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border p-4">
        <p className="text-sm text-gray-600">
          Rate of change: <span className="font-medium">{data.rateOfChange > 0 ? "+" : ""}{data.rateOfChange.toFixed(2)} mmol/L/min</span>
        </p>
      </div>

      <p className="text-xs text-gray-400">
        GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
        Predictions are estimates based on recent trends and may not reflect actual future values.
      </p>
    </div>
  );
}
