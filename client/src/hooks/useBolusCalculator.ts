/**
 * GluMira™ — useBolusCalculator.ts
 *
 * React hook for the bolus calculator.
 * Wraps the bolus-calculator server module via API call.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BolusInputForm {
  carbsGrams: number;
  currentGlucose: number;
  targetGlucose: number;
  icr: number;
  isf: number;
  activeIob: number;
  glycaemicIndex?: number;
}

export interface BolusResultData {
  mealDose: number;
  correctionDose: number;
  iobOffset: number;
  totalDose: number;
  suggestedDose: number;
  bolusDelay: number;
  confidence: "high" | "medium" | "low";
  warnings: string[];
}

interface UseBolusCalculatorReturn {
  result: BolusResultData | null;
  loading: boolean;
  error: string | null;
  calculate: (input: BolusInputForm) => Promise<void>;
  reset: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBolusCalculator(): UseBolusCalculatorReturn {
  const [result, setResult] = useState<BolusResultData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = useCallback(async (input: BolusInputForm) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/doses/bolus-calculator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Calculation failed" }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data: BolusResultData = await res.json();
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

  return { result, loading, error, calculate, reset };
}
