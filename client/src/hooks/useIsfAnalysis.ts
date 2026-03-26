/**
 * GluMira — useIsfAnalysis hook
 *
 * Sends glucose + dose data to POST /api/analytics/isf-analysis
 * and returns the insulin sensitivity factor assessment.
 *
 * GluMira is an informational tool only. Not a medical device.
 */

"use client";

import { useState, useCallback } from "react";

export interface IsfResult {
  isf: number;
  sensitivity: "very-sensitive" | "sensitive" | "normal" | "resistant" | "very-resistant";
  adjustmentSuggestion: string;
  confidence: "low" | "moderate" | "high";
}

interface UseIsfAnalysisReturn {
  result: IsfResult | null;
  loading: boolean;
  error: string | null;
  analyse: (data: {
    readings: { mmol: number; timestamp: string }[];
    correctionDoses: { units: number; bgBefore: number; bgAfter: number }[];
  }) => Promise<void>;
}

export function useIsfAnalysis(): UseIsfAnalysisReturn {
  const [result, setResult] = useState<IsfResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyse = useCallback(
    async (data: {
      readings: { mmol: number; timestamp: string }[];
      correctionDoses: { units: number; bgBefore: number; bgAfter: number }[];
    }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/analytics/isf-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to analyse ISF");
        }
        const result: IsfResult = await res.json();
        setResult(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { result, loading, error, analyse };
}
