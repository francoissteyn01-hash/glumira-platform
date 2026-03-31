/**
 * GluMira — useGlucosePrediction hook
 *
 * Wraps POST /api/glucose/prediction with loading/error state.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useState, useCallback } from "react";

export interface PredictionPoint {
  mmol: number;
  minutesAhead: number;
  confidence: number;
}

export interface GlucosePrediction {
  currentMmol: number;
  rateOfChange: number;
  rateLabel: string;
  predictions: PredictionPoint[];
  urgency: string;
  urgencyLabel: string;
  arrow: string;
}

interface UsePredictionReturn {
  prediction: GlucosePrediction | null;
  loading: boolean;
  error: string | null;
  predict: (readings: { mmol: number; timestamp: string }[]) => Promise<void>;
}

export function useGlucosePrediction(): UsePredictionReturn {
  const [prediction, setPrediction] = useState<GlucosePrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predict = useCallback(async (readings: { mmol: number; timestamp: string }[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/glucose/prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readings }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to predict glucose");
      }
      const data: GlucosePrediction = await res.json();
      setPrediction(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  return { prediction, loading, error, predict };
}
