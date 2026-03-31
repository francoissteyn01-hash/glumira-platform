/**
 * GluMira™ useReadings Hook
 * Version: 7.0.0
 *
 * Fetches glucose readings from /api/readings with optional polling.
 * Returns readings, stats, loading state, and a manual refresh function.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────

export interface GlucoseReading {
  id: string;
  glucose: number;
  unit: "mmol/L" | "mg/dL";
  source: "manual" | "nightscout" | "cgm";
  recorded_at: string;
  notes?: string | null;
}

export interface ReadingsStats {
  count: number;
  mean: number;
  min: number;
  max: number;
  inRange: number;
  tir: number; // Time In Range %
}

export interface UseReadingsOptions {
  hours?: number;
  limit?: number;
  pollIntervalMs?: number; // 0 = no polling
}

export interface UseReadingsResult {
  readings: GlucoseReading[];
  stats: ReadingsStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  lastUpdated: Date | null;
}

// ─── Hook ─────────────────────────────────────────────────────

export function useReadings(options: UseReadingsOptions = {}): UseReadingsResult {
  const { hours = 24, limit = 288, pollIntervalMs = 0 } = options;

  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [stats, setStats] = useState<ReadingsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const fetchReadings = useCallback(async () => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const url = `/api/readings?hours=${hours}&limit=${limit}`;
      const res = await fetch(url, { signal: abortRef.current.signal });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const data = await res.json();
      setReadings(data.readings ?? []);
      setStats(data.stats ?? null);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to fetch readings");
    } finally {
      setLoading(false);
    }
  }, [hours, limit]);

  // Initial fetch
  useEffect(() => {
    fetchReadings();
    return () => abortRef.current?.abort();
  }, [fetchReadings]);

  // Polling
  useEffect(() => {
    if (!pollIntervalMs || pollIntervalMs <= 0) return;
    const interval = setInterval(fetchReadings, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchReadings, pollIntervalMs]);

  return {
    readings,
    stats,
    loading,
    error,
    refresh: fetchReadings,
    lastUpdated,
  };
}

// ─── Helper: glucose classification ──────────────────────────

export function classifyGlucose(
  glucose: number
): "very_low" | "low" | "in_range" | "high" | "very_high" {
  if (glucose < 3.0) return "very_low";
  if (glucose < 3.9) return "low";
  if (glucose <= 10.0) return "in_range";
  if (glucose <= 13.9) return "high";
  return "very_high";
}

export function glucoseColour(glucose: number): string {
  const cls = classifyGlucose(glucose);
  switch (cls) {
    case "very_low":
      return "#DC2626"; // red-600
    case "low":
      return "#F97316"; // orange-500
    case "in_range":
      return "#16A34A"; // green-600
    case "high":
      return "#CA8A04"; // yellow-600
    case "very_high":
      return "#9333EA"; // purple-600
  }
}
