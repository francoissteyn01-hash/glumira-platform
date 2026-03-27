/**
 * GluMira — useDoseAdjustmentAdvisor hook
 *
 * Wraps POST /api/doses/adjustment-advisor with loading/error state.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useState, useCallback } from "react";

export interface AdvisorResult {
  control: string;
  icrSuggestion: string | null;
  isfSuggestion: string | null;
  report: string;
  recommendations: string[];
}

interface UseAdvisorReturn {
  result: AdvisorResult | null;
  loading: boolean;
  error: string | null;
  advise: (params: {
    readings: { mmol: number; timestamp: string }[];
    doses: { units: number; administeredAt: string; type: string }[];
    currentIcr: number;
    currentIsf: number;
  }) => Promise<void>;
}

export function useDoseAdjustmentAdvisor(): UseAdvisorReturn {
  const [result, setResult] = useState<AdvisorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const advise = useCallback(
    async (params: {
      readings: { mmol: number; timestamp: string }[];
      doses: { units: number; administeredAt: string; type: string }[];
      currentIcr: number;
      currentIsf: number;
    }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/doses/adjustment-advisor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Failed to get dose advice");
        }
        const data: AdvisorResult = await res.json();
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { result, loading, error, advise };
}
