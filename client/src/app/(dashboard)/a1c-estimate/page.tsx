/**
 * GluMira — A1c Estimate Dashboard Page
 *
 * Displays estimated A1c (eA1c) based on glucose readings, with
 * ADAG and IFCC conversions, categorisation, and projection.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useEffect } from "react";
import { useA1cEstimate } from "@/hooks/useA1cEstimate";

function a1cColour(category: string): string {
  switch (category) {
    case "normal": return "text-green-600";
    case "pre-diabetes": return "text-amber-600";
    case "diabetes": return "text-red-600";
    default: return "text-gray-600";
  }
}

export default function A1cEstimatePage() {
  const { data, loading, error, estimate } = useA1cEstimate();

  useEffect(() => {
    estimate([]);
  }, []);

  if (loading) return <div className="p-6 text-gray-500">Estimating A1c...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Estimated A1c</h1>
      <p className="text-gray-600">
        Your estimated A1c based on recent glucose readings, using the ADAG formula.
      </p>

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">eA1c (NGSP)</p>
              <p className={`text-3xl font-bold ${a1cColour(data.category)}`}>
                {data.eA1c.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">IFCC</p>
              <p className="text-2xl font-bold">{data.ifcc.toFixed(0)} mmol/mol</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">Category</p>
              <p className={`text-xl font-bold capitalize ${a1cColour(data.category)}`}>
                {data.category}
              </p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">Confidence</p>
              <p className="text-xl font-bold">{data.confidence}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-3">Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Mean Glucose</p>
                <p className="font-medium">{data.meanGlucose.toFixed(1)} mmol/L</p>
              </div>
              <div>
                <p className="text-gray-500">Reading Count</p>
                <p className="font-medium">{data.readingCount}</p>
              </div>
              {data.projection && (
                <>
                  <div>
                    <p className="text-gray-500">30-Day Projection</p>
                    <p className="font-medium">{data.projection.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Trend</p>
                    <p className="font-medium">{data.trend ?? "Stable"}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}

      <p className="text-xs text-gray-400">
        GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
        eA1c is an estimate and may differ from laboratory HbA1c.
      </p>
    </div>
  );
}
