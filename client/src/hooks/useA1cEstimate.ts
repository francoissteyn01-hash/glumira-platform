/**
 * GluMira — useA1cEstimate hook
 *
 * Wraps POST /api/analytics/a1c-estimate with loading/error state.
 *
 * GluMira is an informational tool only. Not a medical device.
 */

"use client";

import { useState, useCallback } from "react";

export interface A1cResult {
  eA1cPercent: number;
  eA1cMmolMol: number;
  meanGlucoseMmol: number;
  meanGlucoseMgdl: number;
  method: string;
  readingCount: number;
  daysCovered: number;
  confidence: string;
  category: string;
  categoryLabel: string;
  categoryColour: string;
  // Projection fields (optional)
  projected30d?: number;
  projected90d?: number;
  trend?: string;
  trendLabel?: string;
}

interface UseA1cEstimateReturn {
  result: A1cResult | null;
  loading: boolean;
  error: string | null;
  estimate: (params: {
    readings: { mmol: number; timestamp: string }[];
    olderReadings?: { mmol: number; timestamp: string }[];
  }) => Promise<void>;
}

export function useA1cEstimate(): UseA1cEstimateReturn {
  const [result, setResult] = useState<A1cResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimate = useCallback(
    async (params: {
      readings: { mmol: number; timestamp: string }[];
      olderReadings?: { mmol: number; timestamp: string }[];
    }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/analytics/a1c-estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to estimate A1c");
        }
        const data: A1cResult = await res.json();
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { result, loading, error, estimate };
}
