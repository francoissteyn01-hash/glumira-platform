/**
 * GluMira™ useNightscoutData Hook
 * Version: 7.0.0
 *
 * React hook for fetching and polling Nightscout CGM data via the
 * GluMira sync API (/api/nightscout/sync).
 *
 * Features:
 *   - Initial fetch on mount
 *   - Configurable polling interval (default: 5 minutes)
 *   - Stale-while-revalidate pattern
 *   - Error state with retry
 *   - Time range filtering
 *   - Automatic cleanup on unmount
 */

import { useState, useEffect, useCallback, useRef } from "react";
import type { CGMReading, TimeRange } from "../components/charts/NightscoutCGMChart";

interface UseNightscoutDataOptions {
  patientId: string;
  timeRange?: TimeRange;
  pollIntervalMs?: number;
  enabled?: boolean;
}

interface UseNightscoutDataResult {
  readings: CGMReading[];
  isLoading: boolean;
  isPolling: boolean;
  error: string | null;
  lastFetched: Date | null;
  refetch: () => void;
}

const TIME_RANGE_HOURS: Record<TimeRange, number> = {
  "24h": 24,
  "7d": 168,
  "14d": 336,
  "30d": 720,
};

const DEFAULT_POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useNightscoutData({
  patientId,
  timeRange = "24h",
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  enabled = true,
}: UseNightscoutDataOptions): UseNightscoutDataResult {
  const [readings, setReadings] = useState<CGMReading[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const fetchReadings = useCallback(
    async (isBackgroundPoll = false) => {
      if (!enabled || !patientId) return;

      // Cancel any in-flight request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      if (!isBackgroundPoll) {
        setIsLoading(true);
      } else {
        setIsPolling(true);
      }
      setError(null);

      try {
        const hours = TIME_RANGE_HOURS[timeRange];
        const params = new URLSearchParams({
          patientId,
          hours: String(hours),
        });

        const response = await fetch(`/api/nightscout/sync?${params}`, {
          signal: abortControllerRef.current.signal,
          headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${response.status}`);
        }

        const data = await response.json();
        const newReadings: CGMReading[] = (data.readings ?? []).map((r: any) => ({
          time: r.dateString ?? r.time,
          glucose: r.sgv ?? r.glucose,
          trend: r.direction ?? r.trend,
          iob: r.iob,
          source: "nightscout" as const,
        }));

        if (isMountedRef.current) {
          setReadings(newReadings);
          setLastFetched(new Date());
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        if (isMountedRef.current) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch Nightscout data"
          );
        }
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
          setIsPolling(false);
        }
      }
    },
    [patientId, timeRange, enabled]
  );

  // Initial fetch
  useEffect(() => {
    isMountedRef.current = true;
    fetchReadings(false);

    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, [fetchReadings]);

  // Polling
  useEffect(() => {
    if (!enabled || pollIntervalMs <= 0) return;

    const startPolling = () => {
      pollTimerRef.current = setTimeout(async () => {
        await fetchReadings(true);
        if (isMountedRef.current) startPolling();
      }, pollIntervalMs);
    };

    startPolling();

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [enabled, pollIntervalMs, fetchReadings]);

  const refetch = useCallback(() => {
    fetchReadings(false);
  }, [fetchReadings]);

  return { readings, isLoading, isPolling, error, lastFetched, refetch };
}
