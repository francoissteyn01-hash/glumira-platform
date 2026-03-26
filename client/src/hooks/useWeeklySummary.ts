/**
 * GluMira™ — useWeeklySummary hook
 *
 * Fetches the weekly summary for the current user from GET /api/analytics/weekly-summary.
 * Returns current week vs previous week delta data.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WeeklyGlucoseMetrics {
  meanMmol: number;
  tirPercent: number;
  hypoPercent: number;
  hyperPercent: number;
  cv: number;
  readingCount: number;
}

export interface WeeklyDoseMetrics {
  totalDoses: number;
  totalUnits: number;
  averageDailyUnits: number;
  bolusCount: number;
  basalCount: number;
  correctionCount: number;
}

export interface WeeklyMealMetrics {
  totalMeals: number;
  averageDailyCarbsGrams: number;
  averageMealCarbsGrams: number;
}

export interface WeeklyDelta<T> {
  current: T;
  previous: T | null;
  deltaPercent: number | null;
  trend: "up" | "down" | "stable" | "no-data";
}

export interface WeeklySummary {
  weekStartDate: string;
  weekEndDate: string;
  glucose: WeeklyDelta<WeeklyGlucoseMetrics>;
  doses: WeeklyDelta<WeeklyDoseMetrics>;
  meals: WeeklyDelta<WeeklyMealMetrics>;
  highlights: string[];
  score: number;
  scoreLabel: "excellent" | "good" | "fair" | "needs-attention";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseWeeklySummaryReturn {
  summary: WeeklySummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useWeeklySummary(): UseWeeklySummaryReturn {
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/weekly-summary");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data: WeeklySummary = await res.json();
      setSummary(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load weekly summary");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return { summary, loading, error, refresh: fetchSummary };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function scoreLabelColour(label: WeeklySummary["scoreLabel"]): string {
  switch (label) {
    case "excellent": return "text-green-600";
    case "good":      return "text-blue-600";
    case "fair":      return "text-amber-600";
    default:          return "text-red-600";
  }
}

export function trendArrow(trend: WeeklyDelta<unknown>["trend"]): string {
  switch (trend) {
    case "up":      return "↑";
    case "down":    return "↓";
    case "stable":  return "→";
    default:        return "—";
  }
}
