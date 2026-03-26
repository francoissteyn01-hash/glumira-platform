"use client";

import { useState, useCallback } from "react";

interface InteractionResult {
  medication: string;
  matched: boolean;
  entry: {
    name: string;
    category: string;
    glucoseEffect: string;
    severity: string;
    mechanism: string;
    notes: string;
  } | null;
  warning: string | null;
}

interface InteractionReport {
  medications: string[];
  results: InteractionResult[];
  highSeverityCount: number;
  moderateCount: number;
  recommendations: string[];
}

export function useMedicationInteraction() {
  const [report, setReport] = useState<InteractionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkMedications = useCallback(async (medications: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/medication-interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ medications }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      setError(err.message ?? "Failed to check medication interactions");
    } finally {
      setLoading(false);
    }
  }, []);

  return { report, loading, error, checkMedications };
}
