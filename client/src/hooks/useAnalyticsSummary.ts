/**
 * GluMira™ — useAnalyticsSummary.ts
 *
 * React hook for fetching the 7-day vs 14-day analytics summary.
 * Wraps GET /api/analytics/summary.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { useState, useEffect, useCallback } from "react";
import type { AnalyticsSummary } from "@/server/analytics/analytics-summary";

interface UseAnalyticsSummaryResult {
  summary: AnalyticsSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAnalyticsSummary(): UseAnalyticsSummaryResult {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch("/api/analytics/summary")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<{ ok: boolean; summary: AnalyticsSummary }>;
      })
      .then(({ summary: s }) => {
        setSummary(s);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message ?? "Failed to load analytics");
        setLoading(false);
      });
  }, [refreshKey]);

  return { summary, loading, error, refresh };
}

export default useAnalyticsSummary;
