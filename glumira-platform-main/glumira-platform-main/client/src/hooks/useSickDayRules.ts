"use client";

import { useState, useCallback } from "react";

interface SickDayAdvice {
  severity: string;
  glucoseCheckFrequencyHours: number;
  ketoneCheckFrequencyHours: number;
  fluidTargetMlPerHour: number;
  insulinAdvice: string;
  warnings: string[];
  seekMedicalAttention: boolean;
  recommendations: string[];
}

interface SickDayInput {
  currentGlucoseMmol: number;
  ketonesMmol: number | null;
  temperature: number | null;
  vomiting: boolean;
  diarrhoea: boolean;
  ableToEat: boolean;
  hoursIll: number;
}

export function useSickDayRules() {
  const [advice, setAdvice] = useState<SickDayAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAdvice = useCallback(async (input: SickDayInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/sick-day-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAdvice(data);
    } catch (err: any) {
      setError(err.message ?? "Failed to get sick day advice");
    } finally {
      setLoading(false);
    }
  }, []);

  return { advice, loading, error, getAdvice };
}
