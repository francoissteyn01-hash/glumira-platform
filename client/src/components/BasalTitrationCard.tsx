/**
 * GluMira™ — BasalTitrationCard component
 *
 * Compact summary card showing basal titration result.
 * Used on the patient dashboard and dose-titration page.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import type { BasalTitrationResult } from "@/hooks/useBasalTitration";

// ─── Risk colour ──────────────────────────────────────────────────────────────

function riskColour(tier: string): string {
  switch (tier) {
    case "very-high": return "text-red-700 bg-red-50 border-red-200";
    case "high":      return "text-orange-700 bg-orange-50 border-orange-200";
    case "moderate":  return "text-amber-700 bg-amber-50 border-amber-200";
    default:          return "text-green-700 bg-green-50 border-green-200";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  result: BasalTitrationResult;
  onViewDetails?: () => void;
}

export function BasalTitrationCard({ result, onViewDetails }: Props) {
  const colourClass = riskColour(result.riskTier);
  const adjustSign = result.suggestedAdjustmentUnits > 0 ? "+" : "";

  return (
    <div className={`rounded-xl border p-4 ${colourClass}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium opacity-70">Basal Titration</p>
          <p className="text-base font-bold mt-0.5">{result.riskLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-60">Suggested change</p>
          <p className="text-xl font-bold">
            {adjustSign}{result.suggestedAdjustmentUnits} U
          </p>
        </div>
      </div>

      {/* Pattern */}
      <p className="text-sm mt-2 opacity-80">{result.pattern}</p>

      {/* Metrics row */}
      <div className="flex items-center gap-4 mt-3 text-xs opacity-70">
        <span>Avg fasting: <strong>{result.averageFastingMmol} mmol/L</strong></span>
        {result.newBasalDose !== null && (
          <span>New dose: <strong>{result.newBasalDose} U/day</strong></span>
        )}
        <span>Confidence: <strong className="capitalize">{result.confidence}</strong></span>
      </div>

      {/* Top recommendation */}
      {result.recommendations.length > 0 && (
        <p className="text-xs mt-2 opacity-70 italic">{result.recommendations[0]}</p>
      )}

      {/* View details link */}
      {onViewDetails && (
        <button
          onClick={onViewDetails}
          className="text-xs font-medium underline mt-3 opacity-80 hover:opacity-100"
        >
          View full analysis →
        </button>
      )}

      <p className="text-xs mt-3 opacity-40">
        GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
      </p>
    </div>
  );
}
