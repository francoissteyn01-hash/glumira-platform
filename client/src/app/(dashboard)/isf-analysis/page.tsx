/**
 * GluMira — ISF Analysis Dashboard Page
 *
 * Displays insulin sensitivity factor analysis with time-of-day
 * breakdown and adjustment suggestions.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useEffect } from "react";
import { useIsfAnalysis } from "@/hooks/useIsfAnalysis";

function sensitivityColour(level: string): string {
  switch (level) {
    case "very-sensitive": return "text-blue-600";
    case "sensitive": return "text-green-600";
    case "normal": return "text-gray-700";
    case "resistant": return "text-amber-600";
    case "very-resistant": return "text-red-600";
    default: return "text-gray-600";
  }
}

export default function IsfAnalysisPage() {
  const { data, loading, error, analyse } = useIsfAnalysis();

  useEffect(() => {
    analyse([]);
  }, []);

  if (loading) return <div className="p-6 text-gray-500">Analysing insulin sensitivity...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Insulin Sensitivity Factor</h1>
      <p className="text-gray-600">
        Analyse how much 1 unit of insulin lowers your glucose, with time-of-day variations.
      </p>

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">Overall ISF</p>
              <p className="text-3xl font-bold">{data.overallIsf.toFixed(1)} mmol/L/U</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">Sensitivity</p>
              <p className={`text-xl font-bold capitalize ${sensitivityColour(data.sensitivity)}`}>
                {data.sensitivity}
              </p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">Confidence</p>
              <p className="text-xl font-bold">{data.confidence}</p>
            </div>
          </div>

          {data.suggestion && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800">Suggestion</p>
              <p className="text-sm text-blue-700 mt-1">{data.suggestion}</p>
            </div>
          )}

          {data.byTimeOfDay && data.byTimeOfDay.length > 0 && (
            <div className="bg-white rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">By Time of Day</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="pb-2">Period</th>
                      <th className="pb-2">ISF</th>
                      <th className="pb-2">Sensitivity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byTimeOfDay.map((row: any) => (
                      <tr key={row.period} className="border-b">
                        <td className="py-2 font-medium">{row.period}</td>
                        <td className="py-2">{row.isf.toFixed(1)} mmol/L/U</td>
                        <td className={`py-2 capitalize ${sensitivityColour(row.sensitivity)}`}>
                          {row.sensitivity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      <p className="text-xs text-gray-400">
        GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
      </p>
    </div>
  );
}
