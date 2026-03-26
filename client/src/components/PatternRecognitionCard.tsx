/**
 * GluMira — PatternRecognitionCard component
 *
 * Displays detected glucose patterns with severity badges,
 * confidence indicators, and actionable recommendations.
 *
 * GluMira is an informational tool only. Not a medical device.
 */

"use client";

import type { PatternRecognitionReport, DetectedPattern } from "@/hooks/usePatternRecognition";

const SEVERITY_COLOURS: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-300",
  warning: "bg-amber-100 text-amber-800 border-amber-300",
  info: "bg-blue-100 text-blue-800 border-blue-300",
};

const CONFIDENCE_LABEL: Record<string, string> = {
  high: "High confidence",
  moderate: "Moderate confidence",
  low: "Low confidence",
};

const SUMMARY_COLOURS: Record<string, string> = {
  clear: "bg-green-50 border-green-200 text-green-700",
  info: "bg-blue-50 border-blue-200 text-blue-700",
  warning: "bg-amber-50 border-amber-200 text-amber-700",
  critical: "bg-red-50 border-red-200 text-red-700",
};

function PatternBadge({ pattern }: { pattern: DetectedPattern }) {
  return (
    <div className={`rounded-lg border p-3 ${SEVERITY_COLOURS[pattern.severity]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-sm">{pattern.label}</span>
        <span className="text-xs opacity-70">{CONFIDENCE_LABEL[pattern.confidence]}</span>
      </div>
      <p className="text-xs leading-relaxed">{pattern.description}</p>
      <p className="text-xs mt-1 opacity-60">
        {pattern.affectedReadings} reading{pattern.affectedReadings !== 1 ? "s" : ""} affected
      </p>
    </div>
  );
}

interface Props {
  report: PatternRecognitionReport;
}

export function PatternRecognitionCard({ report }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Pattern Recognition</h3>
        <span
          className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
            SUMMARY_COLOURS[report.severitySummary]
          }`}
        >
          {report.severitySummary === "clear"
            ? "All Clear"
            : `${report.patternCount} pattern${report.patternCount !== 1 ? "s" : ""} detected`}
        </span>
      </div>

      {/* Patterns */}
      {report.patterns.length > 0 ? (
        <div className="space-y-2">
          {report.patterns.map((p, i) => (
            <PatternBadge key={`${p.type}-${i}`} pattern={p} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center py-4">
          No concerning patterns detected in your recent readings.
        </p>
      )}

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="border-t border-gray-100 pt-3">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Recommendations
          </h4>
          <ul className="space-y-1.5">
            {report.recommendations.map((rec, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                <span className="text-blue-400 mt-0.5">&#8226;</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[10px] text-gray-300 text-center">
        GluMira is an informational tool only. Not a medical device.
      </p>
    </div>
  );
}
