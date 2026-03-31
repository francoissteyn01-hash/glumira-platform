/**
 * GluMira™ — useGlucoseTrend hook
 *
 * Fetches glucose trend analytics from GET /api/glucose/trend?days=<n>
 * Returns TIR breakdown, GMI, CV, trend direction, pattern flags, and a
 * human-readable report summary.
 *
 * Usage:
 *   const { trend, loading, error, refresh } = useGlucoseTrend(14);
 */

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TrendDirection = "rising" | "falling" | "stable" | "insufficient_data";
export type TirClassification = "excellent" | "good" | "needs_improvement" | "poor";

export interface TirBreakdown {
  veryLow: number;   // < 3.0 mmol/L  (%)
  low: number;       // 3.0–3.9 mmol/L (%)
  inRange: number;   // 3.9–10.0 mmol/L (%)
  high: number;      // 10.0–13.9 mmol/L (%)
  veryHigh: number;  // ≥ 14.0 mmol/L (%)
}

export interface PatternFlags {
  morningHyperglycaemia: boolean;
  nocturnalHypoglycaemia: boolean;
  postMealSpikes: boolean;
  highVariability: boolean;
  frequentHypos: boolean;
}

export interface GlucoseTrend {
  days: number;
  readingCount: number;
  mean: number;
  median: number;
  stdDev: number;
  cv: number;             // coefficient of variation (%)
  gmi: number;            // glucose management indicator (%)
  tirBreakdown: TirBreakdown;
  tirClassification: TirClassification;
  trendDirection: TrendDirection;
  trendSlope: number;     // mmol/L per hour
  patternFlags: PatternFlags;
  reportSummary: string;
  generatedAt: string;    // ISO timestamp
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Colour for TIR in-range % display */
export function tirColour(inRange: number): string {
  if (inRange >= 70) return "text-emerald-600";
  if (inRange >= 50) return "text-amber-500";
  return "text-red-600";
}

/** Colour for CV display */
export function cvColour(cv: number): string {
  if (cv < 33) return "text-emerald-600";
  if (cv < 40) return "text-amber-500";
  return "text-red-600";
}

/** Arrow for trend direction */
export function trendArrow(direction: TrendDirection): string {
  switch (direction) {
    case "rising":  return "↑";
    case "falling": return "↓";
    case "stable":  return "→";
    default:        return "—";
  }
}

/** Label for TIR classification */
export function tirLabel(classification: TirClassification): string {
  switch (classification) {
    case "excellent":        return "Excellent";
    case "good":             return "Good";
    case "needs_improvement": return "Needs improvement";
    case "poor":             return "Poor";
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseGlucoseTrendResult {
  trend: GlucoseTrend | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useGlucoseTrend(days: 7 | 14 | 30 | 90 = 14): UseGlucoseTrendResult {
  const [trend, setTrend] = useState<GlucoseTrend | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);
    setError(null);

    fetch(`/api/glucose/trend?days=${days}`, { signal: ctrl.signal })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<GlucoseTrend>;
      })
      .then((data) => {
        setTrend(data);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err.message ?? "Failed to load trend data");
        setLoading(false);
      });

    return () => ctrl.abort();
  }, [days, refreshKey]);

  return { trend, loading, error, refresh };
}

// ─── Default export for convenience ───────────────────────────────────────────
export default useGlucoseTrend;
