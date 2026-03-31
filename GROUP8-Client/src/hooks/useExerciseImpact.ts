/**
 * GluMira™ — useExerciseImpact Hook
 *
 * Wraps POST /api/analytics/exercise-impact for the exercise
 * impact analysis module.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExerciseSession {
  type: string;
  intensity: "low" | "moderate" | "high";
  durationMinutes: number;
  startTime: string;
}

export interface ExerciseGlucoseWindow {
  preExercise: number;
  duringExercise: number;
  postExercise: number;
  drop: number;
  dropPercent: number;
}

export interface ExerciseImpactResult {
  session: ExerciseSession;
  glucoseWindow: ExerciseGlucoseWindow;
  delayedHypoRisk: "low" | "moderate" | "high";
  recommendation: string;
  safeToExercise: boolean;
  preExerciseTarget: { min: number; max: number };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useExerciseImpact() {
  const [data, setData] = useState<ExerciseImpactResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyse = useCallback(async (session: ExerciseSession) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/exercise-impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(session),
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

  const riskColour = (risk: "low" | "moderate" | "high"): string => {
    switch (risk) {
      case "low": return "#22c55e";
      case "moderate": return "#f59e0b";
      case "high": return "#ef4444";
    }
  };

  return { data, loading, error, analyse, riskColour };
}
