"use client";

import { useState, useCallback } from "react";

export function useCGMGapAnalysis() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (readings: any[], intervalMinutes: number = 5) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/cgm-gap-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readings, intervalMinutes }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? "Failed to analyze CGM gaps");
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, analyze };
}
