"use client";

import { useState, useCallback } from "react";

export function useDataExport() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportData = useCallback(async (input: any, format: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics/data-export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, format }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message ?? "Failed to export data");
    } finally {
      setLoading(false);
    }
  }, []);

  const download = useCallback(() => {
    if (!result) return;
    const blob = new Blob([result.content], { type: result.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);
  }, [result]);

  return { result, loading, error, exportData, download };
}
