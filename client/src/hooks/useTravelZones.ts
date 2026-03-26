"use client";

import { useState, useCallback } from "react";

interface TravelAdvice {
  direction: string;
  hoursDifference: number;
  risk: string;
  basalAdjustment: {
    adjustmentType: string;
    unitsChange: number;
    newDoseTime: number;
    explanation: string;
  };
  monitoringFrequencyHours: number;
  mealTimingAdvice: string;
  warnings: string[];
  recommendations: string[];
}

interface TravelInput {
  originTimezoneOffset: number;
  destinationTimezoneOffset: number;
  departureHour: number;
  flightDurationHours: number;
  basalDoseTime: number;
  basalDoseUnits: number;
}

export function useTravelZones() {
  const [advice, setAdvice] = useState<TravelAdvice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAdvice = useCallback(async (input: TravelInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/travel-zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAdvice(data);
    } catch (err: any) {
      setError(err.message ?? "Failed to get travel advice");
    } finally {
      setLoading(false);
    }
  }, []);

  return { advice, loading, error, getAdvice };
}
