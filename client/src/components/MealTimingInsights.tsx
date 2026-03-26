/**
 * GluMira™ — MealTimingInsights component
 *
 * Displays meal timing patterns, pre-bolus analysis, and post-meal excursions.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import type { MealTimingReport, MealTimingPattern } from "@/hooks/useMealTiming";

// ─── Pattern row ──────────────────────────────────────────────────────────────

function PatternRow({ pattern }: { pattern: MealTimingPattern }) {
  const hour = Math.floor(pattern.averageHour);
  const min = Math.round((pattern.averageHour - hour) * 60);
  const timeStr = `${String(hour).padStart(2, "0")}:${String(min).padStart(2, "0")}`;

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 capitalize w-20">
          {pattern.mealType}
        </span>
        <span className="text-xs text-gray-400">{pattern.count}×</span>
        {pattern.isLateNight && (
          <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
            Late night
          </span>
        )}
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-900">{timeStr}</p>
        <p className="text-xs text-gray-400">{pattern.averageCarbsGrams}g carbs avg</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  report: MealTimingReport;
}

export function MealTimingInsights({ report }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Meal Timing Insights</h2>
        {report.lateNightEatingDetected && (
          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
            Late-night eating detected
          </span>
        )}
      </div>

      {/* Patterns */}
      {report.patterns.length > 0 ? (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Meal Patterns</p>
          <div className="divide-y divide-gray-100">
            {report.patterns.map((p, i) => (
              <PatternRow key={`${p.mealType}-${i}`} pattern={p} />
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400">No meal patterns detected</p>
      )}

      {/* Pre-bolus timing */}
      {report.averagePreBolusMinutes !== null && (
        <div className="bg-blue-50 rounded-lg p-3">
          <p className="text-xs font-medium text-blue-700">Average Pre-Bolus Timing</p>
          <p className="text-xl font-bold text-blue-900 mt-0.5">
            {report.averagePreBolusMinutes} min
          </p>
          <p className="text-xs text-blue-500 mt-0.5">
            {report.averagePreBolusMinutes < 10
              ? "Consider bolusing earlier to reduce post-meal spikes"
              : "Good pre-bolus timing"}
          </p>
        </div>
      )}

      {/* Post-meal excursions */}
      {report.postMealExcursions.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">Post-Meal Excursions</p>
          <div className="space-y-1.5">
            {report.postMealExcursions.slice(0, 5).map((exc, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Meal {exc.mealId.slice(-4)}</span>
                <div className="flex items-center gap-3">
                  <span className={`font-medium ${exc.riseGmol > 5 ? "text-red-600" : "text-amber-600"}`}>
                    +{exc.riseGmol.toFixed(1)} mmol/L
                  </span>
                  <span className="text-gray-400 text-xs">{exc.minutesToPeak} min</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">Recommendations</p>
          <ul className="space-y-1">
            {report.recommendations.map((rec, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-blue-400 mt-0.5 shrink-0">•</span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-300">
        GluMira™ is an informational tool only. Not a medical device.
      </p>
    </div>
  );
}
