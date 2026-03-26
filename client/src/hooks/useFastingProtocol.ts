"use client";

import { useState, useCallback } from "react";

export function useFastingProtocol() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (input: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/clinical/fasting-protocol", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? "Failed to generate fasting protocol");
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, generate };
}
