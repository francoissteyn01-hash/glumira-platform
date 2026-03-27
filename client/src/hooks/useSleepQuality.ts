/**
 * GluMira™ — useSleepQuality Hook
 *
 * Wraps POST /api/analytics/sleep-quality for overnight glucose analysis.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useState, useCallback } from "react";

export interface OvernightWindow {
  bedtime: string;
  wakeTime: string;
}

export interface SleepQualityReport {
  window: OvernightWindow;
  stats: {
    mean: number; sd: number; cv: number; min: number; max: number;
    readingCount: number; timeInRange: number; timeBelowRange: number; timeAboveRange: number;
  };
  events: { type: "hypo" | "hyper"; mmol: number; timestamp: string }[];
  dawnPhenomenon: { detected: boolean; riseMmol?: number; severity?: string };
  stabilityScore: number;
  qualityLabel: string;
  recommendations: string[];
}

export function useSleepQuality() {
  const [data, setData] = useState<SleepQualityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyse = useCallback(async (window: OvernightWindow) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/sleep-quality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(window),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const scoreColour = (score: number): string => {
    if (score >= 85) return "#22c55e";
    if (score >= 70) return "#84cc16";
    if (score >= 50) return "#f59e0b";
    if (score >= 30) return "#f97316";
    return "#ef4444";
  };

  return { data, loading, error, analyse, scoreColour };
}
