"use client";

import { useAlcoholImpact } from "@/hooks/useAlcoholImpact";

export default function AlcoholImpactPage() {
  const { result, loading, error, analyze } = useAlcoholImpact();

  const handleDemo = () => {
    analyze({
      drinks: [
        { type: "beer", volumeMl: 330, alcoholPercent: 5, timestampUtc: new Date().toISOString() },
        { type: "wine", volumeMl: 150, alcoholPercent: 13, timestampUtc: new Date().toISOString() },
      ],
      diabetesType: "type1",
      currentGlucoseMmol: 7.2,
      basalDoseUnits: 22,
      lastMealHoursAgo: 1.5,
      weightKg: 75,
      isFemale: false,
    });
  };

  const riskBg: Record<string, string> = {
    low: "bg-green-100 text-green-800",
    moderate: "bg-amber-100 text-amber-800",
    high: "bg-red-100 text-red-800",
    "very-high": "bg-red-200 text-red-900",
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Alcohol Impact Advisor</h1>
      <p className="text-gray-600">Understand how alcohol affects your glucose and get safety guidance.</p>

      <button onClick={handleDemo} disabled={loading}
        className="w-full py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
        {loading ? "Analyzing..." : "Run Demo (1 Beer + 1 Wine)"}
      </button>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      {result && (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${riskBg[result.riskLevel]}`}>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold capitalize">{result.riskLevel} Risk</span>
              <span className="text-sm">{result.totalStandardDrinks} standard drinks</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-teal-600">{result.totalCarbsFromDrinks}g</p>
              <p className="text-gray-600">Carbs from Drinks</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-teal-600">{result.estimatedBAC}%</p>
              <p className="text-gray-600">Est. BAC</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{result.hypoRiskWindow.peakRiskHoursFromNow}h</p>
              <p className="text-gray-600">Peak Hypo Risk</p>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800">Glucose Expectation</h3>
            <p className="text-sm text-blue-700 mt-1">{result.glucoseExpectation.explanation}</p>
          </div>

          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="font-semibold text-purple-800">Insulin Guidance</h3>
            <p className="text-sm text-purple-700 mt-1">{result.insulinGuidance.explanation}</p>
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
