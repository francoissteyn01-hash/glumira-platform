/**
 * GluMira — useHypoRisk hook
 *
 * Sends glucose readings to POST /api/analytics/hypo-risk and returns
 * the hypoglycaemia risk assessment.
 *
 * GluMira is an informational tool only. Not a medical device.
 */

"use client";

import { useState, useCallback } from "react";

export interface HypoRiskResult {
  lbgi: number;
  hypoFrequency: number;
  nocturnalRate: number;
  iobContribution: number;
  compositeScore: number;
  riskLevel: "low" | "moderate" | "high" | "very-high";
  riskLabel: string;
  riskColour: string;
}

interface UseHypoRiskReturn {
  result: HypoRiskResult | null;
  loading: boolean;
  error: string | null;
  assess: (readings: { mmol: number; timestamp: string }[]) => Promise<void>;
}

export function useHypoRisk(): UseHypoRiskReturn {
  const [result, setResult] = useState<HypoRiskResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assess = useCallback(async (readings: { mmol: number; timestamp: string }[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/hypo-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readings }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to assess hypo risk");
      }
      const data: HypoRiskResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, assess };
}
