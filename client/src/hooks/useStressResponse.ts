/**
 * GluMira™ — useStressResponse Hook
 *
 * Wraps POST /api/analytics/stress-response for stress impact analysis.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useState, useCallback } from "react";

export interface StressPeriod {
  startTime: string;
  endTime: string;
  stressLevel: 1 | 2 | 3 | 4 | 5;
  category?: "work" | "emotional" | "physical" | "illness" | "other";
}

export interface StressReport {
  period: StressPeriod;
  glucoseWindow: {
    preMean: number; duringMean: number; postMean: number;
    peakDuring: number; nadirPost: number;
    riseFromBaseline: number; recoveryMinutes: number;
  };
  impactSeverity: "none" | "mild" | "moderate" | "significant";
  recommendation: string;
}

export function useStressResponse() {
  const [data, setData] = useState<StressReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyse = useCallback(async (period: StressPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/stress-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
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

  const severityColour = (s: string): string => {
    switch (s) {
      case "none": return "#22c55e";
      case "mild": return "#84cc16";
      case "moderate": return "#f59e0b";
      case "significant": return "#ef4444";
      default: return "#6b7280";
    }
  };

  return { data, loading, error, analyse, severityColour };
}
