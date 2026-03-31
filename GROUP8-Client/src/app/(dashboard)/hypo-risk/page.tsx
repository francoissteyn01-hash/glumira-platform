/**
 * GluMira — Hypo Risk Dashboard Page
 *
 * Displays hypoglycaemia risk scoring with LBGI, hypo frequency,
 * nocturnal rate, IOB contribution, and composite score.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useEffect } from "react";
import { useHypoRisk } from "@/hooks/useHypoRisk";
import { HypoRiskCard } from "@/components/HypoRiskCard";

function riskColour(level: string): string {
  switch (level) {
    case "low": return "text-green-600";
    case "moderate": return "text-amber-600";
    case "high": return "text-red-600";
    case "very-high": return "text-red-800";
    default: return "text-gray-600";
  }
}

export default function HypoRiskPage() {
  const { data, loading, error, analyse } = useHypoRisk();

  useEffect(() => {
    analyse([]);
  }, []);

  if (loading) return <div className="p-6 text-gray-500">Calculating hypo risk...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Hypoglycaemia Risk</h1>
      <p className="text-gray-600">
        Composite risk scoring based on LBGI, hypo frequency, nocturnal patterns, and IOB contribution.
      </p>

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">Composite Score</p>
              <p className={`text-3xl font-bold ${riskColour(data.riskLevel)}`}>
                {data.compositeScore.toFixed(1)}
              </p>
              <p className={`text-sm font-medium capitalize ${riskColour(data.riskLevel)}`}>
                {data.riskLevel} risk
              </p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">LBGI</p>
              <p className="text-2xl font-bold">{data.lbgi.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">Hypo Frequency</p>
              <p className="text-2xl font-bold">{data.hypoFrequency}/wk</p>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm text-gray-500">Nocturnal Rate</p>
              <p className="text-2xl font-bold">{(data.nocturnalRate * 100).toFixed(0)}%</p>
            </div>
          </div>

          <HypoRiskCard data={data} />
        </>
      )}

      <p className="text-xs text-gray-400">
        GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
      </p>
    </div>
  );
}
