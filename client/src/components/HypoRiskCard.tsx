/**
 * GluMira™ — HypoRiskCard component
 *
 * Compact summary card showing hypoglycaemia risk assessment.
 * Displays LBGI, hypo frequency, nocturnal rate, and composite score.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type HypoRiskTier = "low" | "moderate" | "high" | "very-high";

export interface HypoRiskResult {
  lbgi: number;
  hypoFrequencyPerDay: number;
  nocturnalHypoPercent: number;
  iobContributionScore: number;
  compositeScore: number;
  tier: HypoRiskTier;
  tierLabel: string;
  recommendations: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tierColour(tier: HypoRiskTier): string {
  switch (tier) {
    case "very-high": return "text-red-700 bg-red-50 border-red-200";
    case "high":      return "text-orange-700 bg-orange-50 border-orange-200";
    case "moderate":  return "text-amber-700 bg-amber-50 border-amber-200";
    default:          return "text-green-700 bg-green-50 border-green-200";
  }
}

function scoreBarColour(tier: HypoRiskTier): string {
  switch (tier) {
    case "very-high": return "bg-red-500";
    case "high":      return "bg-orange-500";
    case "moderate":  return "bg-amber-400";
    default:          return "bg-green-500";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  result: HypoRiskResult;
}

export function HypoRiskCard({ result }: Props) {
  const colourClass = tierColour(result.tier);
  const barColour = scoreBarColour(result.tier);

  return (
    <div className={`rounded-xl border p-5 space-y-4 ${colourClass}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium opacity-70">Hypo Risk Assessment</p>
          <p className="text-lg font-bold mt-0.5">{result.tierLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-60">Composite Score</p>
          <p className="text-2xl font-bold">{result.compositeScore}</p>
          <p className="text-xs opacity-50">/ 100</p>
        </div>
      </div>

      {/* Score bar */}
      <div className="w-full bg-white bg-opacity-50 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${barColour}`}
          style={{ width: `${Math.min(result.compositeScore, 100)}%` }}
        />
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-xs opacity-60">LBGI</p>
          <p className="text-base font-bold">{result.lbgi}</p>
        </div>
        <div>
          <p className="text-xs opacity-60">Hypo/day</p>
          <p className="text-base font-bold">{result.hypoFrequencyPerDay}</p>
        </div>
        <div>
          <p className="text-xs opacity-60">Nocturnal</p>
          <p className="text-base font-bold">{result.nocturnalHypoPercent}%</p>
        </div>
      </div>

      {/* Top recommendation */}
      {result.recommendations.length > 0 && (
        <p className="text-sm opacity-80 italic border-t border-current border-opacity-20 pt-3">
          {result.recommendations[0]}
        </p>
      )}

      <p className="text-xs opacity-40">
        GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
      </p>
    </div>
  );
}
