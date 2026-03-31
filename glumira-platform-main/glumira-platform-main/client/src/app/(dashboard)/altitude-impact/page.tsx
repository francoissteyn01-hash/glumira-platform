"use client";

import { useAltitudeImpact } from "@/hooks/useAltitudeImpact";

export default function AltitudeImpactPage() {
  const { result, loading, error, analyze } = useAltitudeImpact();

  const handleDemo = () => {
    analyze(
      [
        { timestampUtc: "2026-03-26T06:00:00Z", altitudeMeters: 1000, glucoseMmol: 6.5 },
        { timestampUtc: "2026-03-26T10:00:00Z", altitudeMeters: 2500, glucoseMmol: 5.8 },
        { timestampUtc: "2026-03-26T14:00:00Z", altitudeMeters: 3500, glucoseMmol: 5.2 },
      ],
      500
    );
  };

  const riskColor: Record<string, string> = {
    low: "text-green-700 bg-green-50",
    moderate: "text-amber-700 bg-amber-50",
    high: "text-red-700 bg-red-50",
    "very-high": "text-red-900 bg-red-100",
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Altitude Impact Analysis</h1>
      <p className="text-gray-600">Understand how elevation changes affect your glucose management.</p>

      <button onClick={handleDemo} disabled={loading}
        className="w-full py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
        {loading ? "Analyzing..." : "Run Demo Analysis (Sea Level → 3,500m)"}
      </button>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      {result && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-teal-600">{result.currentAltitude}m</p>
              <p className="text-gray-600">Current Altitude</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-teal-600">{result.direction}</p>
              <p className="text-gray-600">Direction</p>
            </div>
            <div className={`p-3 rounded-lg ${riskColor[result.currentZone.hypoRiskLevel]}`}>
              <p className="text-2xl font-bold capitalize">{result.currentZone.hypoRiskLevel}</p>
              <p>Hypo Risk</p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800">{result.currentZone.name}</h3>
            <p className="text-sm text-blue-700 mt-1">{result.insulinAdjustment.explanation}</p>
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
