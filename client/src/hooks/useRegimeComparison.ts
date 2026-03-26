/**
 * GluMira™ — useRegimeComparison.ts
 *
 * React hook for fetching insulin regime comparison results.
 * Wraps POST /api/analytics/regime-comparison.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegimeWindow {
  label: string;
  startDate: string;  // ISO date YYYY-MM-DD
  endDate: string;    // ISO date YYYY-MM-DD
}

export interface RegimeOutcome {
  label: string;
  tirPercent: number;
  hypoPercent: number;
  hyperPercent: number;
  gmi: number;
  cv: number;
  readingCount: number;
  winner: boolean;
  outcomeLabel: string;
  tirColour: string;
}

export interface RegimeComparisonResult {
  windows: RegimeOutcome[];
  bestLabel: string | null;
  generatedAt: string;
}

interface UseRegimeComparisonResult {
  data: RegimeComparisonResult | null;
  loading: boolean;
  error: string | null;
  compare: (windows: RegimeWindow[]) => Promise<void>;
  reset: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useRegimeComparison(): UseRegimeComparisonResult {
  const [data, setData]       = useState<RegimeComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const compare = useCallback(async (windows: RegimeWindow[]) => {
    if (windows.length < 2) {
      setError("At least 2 windows are required for comparison.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/analytics/regime-comparison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ windows }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const result = await res.json() as RegimeComparisonResult;
      setData(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Comparison failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, compare, reset };
}

export default useRegimeComparison;
