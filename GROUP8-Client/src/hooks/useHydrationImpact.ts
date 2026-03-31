"use client";

import { useState, useCallback } from "react";

interface HydrationReport {
  dailyTotalMl: number;
  dailyTarget: number;
  percentOfTarget: number;
  hydrationStatus: "well-hydrated" | "adequate" | "low" | "dehydrated";
  hourlyBreakdown: { hour: number; totalMl: number; entryCount: number }[];
  correlations: { hydrationLevel: string; meanGlucose: number; readingCount: number }[];
  recommendations: string[];
}

export function useHydrationImpact() {
  const [report, setReport] = useState<HydrationReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/hydration-impact");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch hydration report");
    } finally {
      setLoading(false);
    }
  }, []);

  return { report, loading, error, fetchReport };
}
