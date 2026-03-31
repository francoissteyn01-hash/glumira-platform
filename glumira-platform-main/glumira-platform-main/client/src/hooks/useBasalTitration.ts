/**
 * GluMira™ — useBasalTitration hook
 *
 * Wraps POST /api/doses/basal-titration.
 * Returns titration result, loading state, and compute trigger.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useState, useCallback } from "react";

// ─── Types (mirrored from server/doses/basal-titration.ts) ────────────────────

export type RiskTier = "low" | "moderate" | "high" | "very-high";
export type TitrationConfidence = "high" | "moderate" | "low";

export interface BasalTitrationInput {
  fastingGlucoseReadings: number[];  // mmol/L
  currentBasalDose?: number;         // units
  targetFastingMmol?: number;        // default 5.5
}

export interface BasalTitrationResult {
  averageFastingMmol: number;
  pattern: string;
  suggestedAdjustmentUnits: number;
  newBasalDose: number | null;
  riskTier: RiskTier;
  riskLabel: string;
  confidence: TitrationConfidence;
  recommendations: string[];
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseBasalTitrationReturn {
  result: BasalTitrationResult | null;
  loading: boolean;
  error: string | null;
  compute: (input: BasalTitrationInput) => Promise<void>;
}

export function useBasalTitration(): UseBasalTitrationReturn {
  const [result, setResult] = useState<BasalTitrationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compute = useCallback(async (input: BasalTitrationInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/doses/basal-titration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data: BasalTitrationResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to compute titration");
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, compute };
}
