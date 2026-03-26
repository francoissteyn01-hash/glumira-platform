/**
 * GluMira — useGlucoseReport React Hook
 *
 * Wraps POST /api/reports/glucose-report to generate structured
 * glucose reports with period summaries, trends, and insights.
 *
 * GluMira is an informational tool only. Not a medical device.
 */

"use client";

import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface GlucoseReading {
  mmol: number;
  timestamp: string;
}

interface ReportPeriod {
  label: string;
  startDate: string;
  endDate: string;
  readingCount: number;
  mean: number;
  median: number;
  stdDev: number;
  cv: number;
  tirPercent: number;
  belowRangePercent: number;
  aboveRangePercent: number;
  gmi: number;
  lowestReading: number;
  highestReading: number;
}

interface TrendComparison {
  metric: string;
  previous: number;
  current: number;
  delta: number;
  direction: "improving" | "stable" | "worsening";
}

interface GlucoseReport {
  generatedAt: string;
  patientId: string;
  periods: ReportPeriod[];
  trends: TrendComparison[];
  insights: string[];
  overallStatus: "excellent" | "good" | "needs-attention" | "concerning";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGlucoseReport() {
  const [report, setReport] = useState<GlucoseReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(
    async (currentReadings: GlucoseReading[], previousReadings?: GlucoseReading[]) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/reports/glucose-report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentReadings, previousReadings }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setReport(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const statusColour = (status: string): string => {
    const colours: Record<string, string> = {
      excellent: "text-green-600",
      good: "text-blue-600",
      "needs-attention": "text-amber-600",
      concerning: "text-red-600",
    };
    return colours[status] ?? "text-gray-500";
  };

  const trendArrow = (direction: string): string => {
    const arrows: Record<string, string> = {
      improving: "↑",
      stable: "→",
      worsening: "↓",
    };
    return arrows[direction] ?? "?";
  };

  return { report, loading, error, generate, statusColour, trendArrow };
}
