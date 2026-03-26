/**
 * GluMira — useIcrOptimizer React Hook
 *
 * Wraps POST /api/analytics/icr-optimizer to analyse meal events
 * and suggest ICR adjustments per meal period.
 *
 * GluMira is an informational tool only. Not a medical device.
 */

"use client";

import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface MealEvent {
  carbsGrams: number;
  bolusUnits: number;
  preMealGlucose: number;
  postMealGlucose: number;
  timestamp: string;
}

interface IcrAnalysis {
  currentIcr: number;
  effectiveIcr: number;
  suggestedIcr: number;
  direction: "tighten" | "loosen" | "no-change";
  confidence: "high" | "moderate" | "low";
  postMealMean: number;
  postMealTarget: number;
  excursionMean: number;
  mealCount: number;
}

interface MealTimeIcr {
  period: "breakfast" | "lunch" | "dinner" | "snack";
  suggestedIcr: number;
  mealCount: number;
  avgExcursion: number;
}

interface IcrOptimizerResult {
  overall: IcrAnalysis;
  byMealTime: MealTimeIcr[];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useIcrOptimizer() {
  const [data, setData] = useState<IcrOptimizerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyse = useCallback(async (meals: MealEvent[], currentIcr: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/icr-optimizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meals, currentIcr }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const directionLabel = (dir: string): string => {
    const labels: Record<string, string> = {
      tighten: "Decrease ratio (more insulin per gram)",
      loosen: "Increase ratio (less insulin per gram)",
      "no-change": "Current ratio is appropriate",
    };
    return labels[dir] ?? "Unknown";
  };

  const directionColour = (dir: string): string => {
    const colours: Record<string, string> = {
      tighten: "text-amber-600",
      loosen: "text-blue-600",
      "no-change": "text-green-600",
    };
    return colours[dir] ?? "text-gray-500";
  };

  return { data, loading, error, analyse, directionLabel, directionColour };
}
