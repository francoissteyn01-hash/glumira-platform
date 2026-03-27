/**
 * GluMira — usePatternRecognition hook
 *
 * Sends glucose readings to POST /api/analytics/patterns and returns
 * the pattern recognition report.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useState, useCallback } from "react";

export type PatternType =
  | "dawn-phenomenon"
  | "somogyi-effect"
  | "meal-spike"
  | "exercise-hypo"
  | "stress-hyper"
  | "nocturnal-hypo"
  | "post-lunch-dip"
  | "fasting-hyper"
  | "roller-coaster";

export interface DetectedPattern {
  type: PatternType;
  label: string;
  description: string;
  severity: "info" | "warning" | "critical";
  affectedReadings: number;
  confidence: "low" | "moderate" | "high";
}

export interface PatternRecognitionReport {
  patterns: DetectedPattern[];
  dominantPattern: PatternType | null;
  patternCount: number;
  recommendations: string[];
  severitySummary: "clear" | "info" | "warning" | "critical";
}

interface UsePatternRecognitionReturn {
  report: PatternRecognitionReport | null;
  loading: boolean;
  error: string | null;
  analyse: (readings: { mmol: number; timestamp: string }[]) => Promise<void>;
}

export function usePatternRecognition(): UsePatternRecognitionReturn {
  const [report, setReport] = useState<PatternRecognitionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyse = useCallback(async (readings: { mmol: number; timestamp: string }[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/patterns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readings }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to analyse patterns");
      }
      const data: PatternRecognitionReport = await res.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  return { report, loading, error, analyse };
}
