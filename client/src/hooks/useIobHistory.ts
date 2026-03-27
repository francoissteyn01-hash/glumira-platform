/**
 * GluMira™ — useIobHistory.ts
 *
 * React hook for fetching IOB (Insulin-on-Board) history over a time window.
 * Wraps GET /api/iob/history.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface IobPoint {
  timestamp: string;   // ISO timestamp
  totalIob: number;    // Units
  bolusIob: number;
  basalIob: number;
  correctionIob: number;
}

export interface IobHistoryResult {
  points: IobPoint[];
  peakIob: number;
  peakAt: string | null;
  avgIob: number;
  currentIob: number;
  windowHours: number;
}

interface UseIobHistoryOptions {
  windowHours?: number;   // default: 6
  intervalMins?: number;  // default: 15
}

interface UseIobHistoryResult {
  data: IobHistoryResult | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useIobHistory(options: UseIobHistoryOptions = {}): UseIobHistoryResult {
  const { windowHours = 6, intervalMins = 15 } = options;

  const [data, setData]       = useState<IobHistoryResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const qs = new URLSearchParams();
    qs.set("windowHours",  String(windowHours));
    qs.set("intervalMins", String(intervalMins));

    fetch(`/api/iob/history?${qs.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<IobHistoryResult>;
      })
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message ?? "Failed to load IOB history");
        setLoading(false);
      });
  }, [windowHours, intervalMins, refreshKey]);

  return { data, loading, error, refresh };
}

export default useIobHistory;
