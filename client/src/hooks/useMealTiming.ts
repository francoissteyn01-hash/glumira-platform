/**
 * GluMira™ — useMealTiming hook
 *
 * Fetches meal timing analysis from POST /api/analytics/meal-timing.
 * Returns patterns, pre-bolus analysis, post-meal excursions, and report.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import { useState, useCallback } from "react";

// ─── Types (mirrored from server/meals/meal-timing.ts) ────────────────────────

export interface MealEvent {
  id: string;
  consumedAt: string;
  carbsGrams: number;
  glycaemicIndex?: number;
  mealType?: "breakfast" | "lunch" | "dinner" | "snack";
}

export interface DoseEvent {
  administeredAt: string;
  units: number;
  insulinType: string;
}

export interface PostMealGlucoseEvent {
  mealId: string;
  glucoseAtMeal: number;
  glucosePeak: number;
  minutesToPeak: number;
}

export interface MealTimingPattern {
  mealType: string;
  averageHour: number;
  count: number;
  averageCarbsGrams: number;
  isLateNight: boolean;
}

export interface MealTimingReport {
  patterns: MealTimingPattern[];
  lateNightEatingDetected: boolean;
  averagePreBolusMinutes: number | null;
  postMealExcursions: { mealId: string; riseGmol: number; minutesToPeak: number }[];
  recommendations: string[];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseMealTimingReturn {
  report: MealTimingReport | null;
  loading: boolean;
  error: string | null;
  analyse: (meals: MealEvent[], doses?: DoseEvent[], postMeal?: PostMealGlucoseEvent[]) => Promise<void>;
}

export function useMealTiming(): UseMealTimingReturn {
  const [report, setReport] = useState<MealTimingReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyse = useCallback(async (
    meals: MealEvent[],
    doses: DoseEvent[] = [],
    postMeal: PostMealGlucoseEvent[] = []
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/meal-timing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meals, doses, postMeal }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data: MealTimingReport = await res.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyse meal timing");
    } finally {
      setLoading(false);
    }
  }, []);

  return { report, loading, error, analyse };
}
