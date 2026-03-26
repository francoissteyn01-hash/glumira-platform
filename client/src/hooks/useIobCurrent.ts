/**
 * GluMira™ useIobCurrent Hook
 * Version: 7.0.0
 *
 * Polls /api/iob/current every 60 seconds to provide a live
 * IOB value for the dashboard sidebar badge and header indicator.
 *
 * Returns:
 *  - iob: number | null — total active insulin on board (units)
 *  - riskTier: "safe" | "caution" | "danger" | null
 *  - doseCount: number — number of active doses contributing
 *  - loading: boolean
 *  - error: string | null
 *  - refresh: () => void — manual trigger
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────

export type IobRiskTier = "safe" | "caution" | "danger";

export interface IobCurrentState {
  iob: number | null;
  riskTier: IobRiskTier | null;
  doseCount: number;
  computedAt: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

interface IobCurrentResponse {
  totalIob: number;
  riskTier: IobRiskTier;
  doseCount: number;
  computedAt: string;
}

// ─── Hook ─────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 60_000; // 60 seconds

export function useIobCurrent(): IobCurrentState {
  const [iob, setIob] = useState<number | null>(null);
  const [riskTier, setRiskTier] = useState<IobRiskTier | null>(null);
  const [doseCount, setDoseCount] = useState(0);
  const [computedAt, setComputedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchIob = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/iob/current", { signal: controller.signal });
      if (!res.ok) {
        if (res.status === 401) { setIob(null); setLoading(false); return; }
        throw new Error(`HTTP ${res.status}`);
      }
      const data: IobCurrentResponse = await res.json();
      setIob(data.totalIob);
      setRiskTier(data.riskTier);
      setDoseCount(data.doseCount);
      setComputedAt(data.computedAt);
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to fetch IOB");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + polling
  useEffect(() => {
    fetchIob();
    timerRef.current = setInterval(fetchIob, POLL_INTERVAL_MS);
    return () => {
      abortRef.current?.abort();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchIob]);

  return {
    iob,
    riskTier,
    doseCount,
    computedAt,
    loading,
    error,
    refresh: fetchIob,
  };
}

// ─── Colour helper (for badge rendering) ─────────────────────

export function iobRiskColour(tier: IobRiskTier | null): string {
  switch (tier) {
    case "danger":  return "bg-red-500 text-white";
    case "caution": return "bg-amber-400 text-white";
    case "safe":    return "bg-green-500 text-white";
    default:        return "bg-gray-200 text-gray-600";
  }
}
