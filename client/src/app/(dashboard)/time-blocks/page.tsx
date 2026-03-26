/**
 * GluMira — Time-Block Analysis Dashboard Page
 *
 * Displays glucose statistics segmented by time of day (overnight,
 * fasting, post-breakfast, post-lunch, post-dinner, late evening).
 *
 * GluMira is an informational tool only. Not a medical device.
 */

"use client";

import { useEffect, useState } from "react";

interface BlockStats {
  label: string;
  readingCount: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  cv: number;
  tirPercent: number;
  belowPercent: number;
  abovePercent: number;
}

interface TimeBlockReport {
  blocks: BlockStats[];
  worstBlock: string;
  bestBlock: string;
  overallMean: number;
  overallCv: number;
}

function tirColour(tir: number): string {
  if (tir >= 70) return "text-green-600";
  if (tir >= 50) return "text-amber-600";
  return "text-red-600";
}

function tirBg(tir: number): string {
  if (tir >= 70) return "bg-green-50";
  if (tir >= 50) return "bg-amber-50";
  return "bg-red-50";
}

export default function TimeBlocksPage() {
  const [report, setReport] = useState<TimeBlockReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/analytics/time-blocks");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setReport(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6 text-gray-500">Loading time-block analysis...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!report) return null;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Time-Block Analysis</h1>
      <p className="text-gray-600">
        Glucose statistics segmented by time of day. Identifies your strongest and weakest periods.
      </p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Overall Mean</p>
          <p className="text-2xl font-bold">{report.overallMean.toFixed(1)} mmol/L</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Overall CV</p>
          <p className="text-2xl font-bold">{report.overallCv.toFixed(1)}%</p>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <p className="text-sm text-green-700">Best Period</p>
          <p className="text-lg font-bold text-green-800">{report.bestBlock}</p>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <p className="text-sm text-red-700">Needs Attention</p>
          <p className="text-lg font-bold text-red-800">{report.worstBlock}</p>
        </div>
      </div>

      {/* Block table */}
      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-gray-600">
              <th className="px-4 py-3">Period</th>
              <th className="px-4 py-3">Readings</th>
              <th className="px-4 py-3">Mean</th>
              <th className="px-4 py-3">Median</th>
              <th className="px-4 py-3">Min</th>
              <th className="px-4 py-3">Max</th>
              <th className="px-4 py-3">CV%</th>
              <th className="px-4 py-3">TIR%</th>
              <th className="px-4 py-3">Below%</th>
              <th className="px-4 py-3">Above%</th>
            </tr>
          </thead>
          <tbody>
            {report.blocks.map((b) => (
              <tr key={b.label} className={`border-b ${tirBg(b.tirPercent)}`}>
                <td className="px-4 py-3 font-medium">{b.label}</td>
                <td className="px-4 py-3">{b.readingCount}</td>
                <td className="px-4 py-3">{b.mean.toFixed(1)}</td>
                <td className="px-4 py-3">{b.median.toFixed(1)}</td>
                <td className="px-4 py-3">{b.min.toFixed(1)}</td>
                <td className="px-4 py-3">{b.max.toFixed(1)}</td>
                <td className="px-4 py-3">{b.cv.toFixed(1)}</td>
                <td className={`px-4 py-3 font-bold ${tirColour(b.tirPercent)}`}>
                  {b.tirPercent.toFixed(0)}%
                </td>
                <td className="px-4 py-3 text-red-600">{b.belowPercent.toFixed(0)}%</td>
                <td className="px-4 py-3 text-amber-600">{b.abovePercent.toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        GluMira is an informational tool only. Not a medical device.
      </p>
    </div>
  );
}
