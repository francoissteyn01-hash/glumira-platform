/**
 * GluMira™ — useCarbCounter.ts
 *
 * React hook for the carb counter tool.
 * Wraps the carb-counter server module via API.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FoodItem {
  name: string;
  portionGrams: number;
}

export interface CarbCountResult {
  totalCarbs: number;
  items: Array<{
    name: string;
    portionGrams: number;
    carbsGrams: number;
    glycaemicIndex: number;
    glycaemicLoad: string;
  }>;
  glycaemicLoad: string;
  recommendedDose?: number;
}

interface UseCarbCounterReturn {
  result: CarbCountResult | null;
  loading: boolean;
  error: string | null;
  countCarbs: (items: FoodItem[], icr?: number) => Promise<void>;
  reset: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCarbCounter(): UseCarbCounterReturn {
  const [result, setResult] = useState<CarbCountResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countCarbs = useCallback(async (items: FoodItem[], icr?: number) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/meals/carb-count", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, icr }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Carb count failed" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data: CarbCountResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, countCarbs, reset };
}
