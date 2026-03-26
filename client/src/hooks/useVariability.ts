/**
 * GluMira™ — useVariability.ts
 *
 * React hook for glucose variability metrics.
 * Fetches from GET /api/analytics/variability.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VariabilityData {
  mean: number;
  sd: number;
  cv: number;
  mage: number;
  lbgi: number;
  hbgi: number;
  bgri: number;
  jIndex: number;
  eA1c: number;
  gri: number;
  readingCount: number;
  tirBreakdown: {
    veryLow: number;
    low: number;
    inRange: number;
    high: number;
    veryHigh: number;
  };
  cvStatus: string;
  griZone: "A" | "B" | "C" | "D" | "E";
  periodDays: number;
}

interface UseVariabilityReturn {
  data: VariabilityData | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVariability(
  patientId: string,
  days = 14
): UseVariabilityReturn {
  const [data, setData] = useState<VariabilityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (!patientId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/analytics/variability?patientId=${encodeURIComponent(patientId)}&days=${days}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Failed to load variability data" }));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        return res.json() as Promise<VariabilityData>;
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [patientId, days, tick]);

  return { data, loading, error, refresh };
}
