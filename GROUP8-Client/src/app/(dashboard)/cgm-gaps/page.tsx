"use client";

import { useCGMGapAnalysis } from "@/hooks/useCGMGapAnalysis";

export default function CGMGapsPage() {
  const { result, loading, error, analyze } = useCGMGapAnalysis();

  const handleDemo = () => {
    // Generate 24h of CGM data with some gaps
    const readings: any[] = [];
    let ts = new Date(Date.UTC(2026, 2, 15, 0, 0, 0)).getTime();
    for (let i = 0; i < 288; i++) {
      // Skip some readings to create gaps
      if (i === 50 || i === 51 || i === 52 || i === 53) { ts += 5 * 60_000; continue; }
      if (i >= 150 && i <= 165) { ts += 5 * 60_000; continue; }
      readings.push({
        timestampUtc: new Date(ts).toISOString(),
        glucoseMmol: 6.5 + Math.sin(i / 10) * 2,
      });
      ts += 5 * 60_000;
    }
    analyze(readings);
  };

  const qualityColor: Record<string, string> = {
    excellent: "text-green-700 bg-green-50",
    good: "text-blue-700 bg-blue-50",
    fair: "text-amber-700 bg-amber-50",
    poor: "text-red-700 bg-red-50",
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">CGM Gap Analysis</h1>
      <p className="text-gray-600">Analyze your CGM data quality and identify gaps in monitoring.</p>

      <button onClick={handleDemo} disabled={loading}
        className="w-full py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
        {loading ? "Analyzing..." : "Run Demo Analysis (24h CGM Data)"}
      </button>

      {error && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">{error}</div>}

      {result && (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${qualityColor[result.qualityScore]}`}>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold capitalize">{result.qualityScore} Data Quality</span>
              <span className="text-sm">{result.dataCompleteness}% complete</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 text-center text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-teal-600">{result.totalReadings}</p>
              <p className="text-gray-600">Readings</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{result.totalGaps}</p>
              <p className="text-gray-600">Gaps</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-orange-600">{result.totalGapMinutes}m</p>
              <p className="text-gray-600">Total Gap Time</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{result.longestGapMinutes}m</p>
              <p className="text-gray-600">Longest Gap</p>
            </div>
          </div>

          {result.gaps.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-right">Duration</th>
                    <th className="px-3 py-2 text-right">Before</th>
                    <th className="px-3 py-2 text-right">After</th>
                  </tr>
                </thead>
                <tbody>
                  {result.gaps.map((g: any, i: number) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-2 capitalize">{g.gapType.replace("-", " ")}</td>
                      <td className="px-3 py-2 text-right">{g.durationMinutes}m</td>
                      <td className="px-3 py-2 text-right">{g.beforeGap?.toFixed(1) ?? "—"}</td>
                      <td className="px-3 py-2 text-right">{g.afterGap?.toFixed(1) ?? "—"}</td>
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
