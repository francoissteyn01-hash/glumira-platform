/**
 * GluMira™ useDoses Hook
 * Version: 7.0.0
 *
 * Fetches dose log and active IOB summary from /api/doses.
 * Provides logDose and deleteDose mutations.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────

export interface DoseRecord {
  id: string;
  insulinType: string;
  doseType: "bolus" | "basal" | "correction";
  units: number;
  administeredAt: string;
  notes?: string | null;
}

export interface IobDoseBreakdown {
  doseId: string;
  insulinType: string;
  units: number;
  remainingIob: number;
  administeredAt: string;
  minutesElapsed: number;
}

export interface ActiveIobSummary {
  totalIob: number;
  doses: IobDoseBreakdown[];
  computedAt: string;
}

export interface LogDoseInput {
  insulinType: "NovoRapid" | "Humalog" | "Apidra" | "Fiasp" | "Tresiba" | "Lantus";
  doseType: "bolus" | "basal" | "correction";
  units: number;
  administeredAt?: string;
  notes?: string;
}

export interface UseDosesResult {
  doses: DoseRecord[];
  iobSummary: ActiveIobSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  logDose: (input: LogDoseInput) => Promise<void>;
  deleteDose: (doseId: string) => Promise<void>;
  lastUpdated: Date | null;
}

// ─── Hook ─────────────────────────────────────────────────────

export function useDoses(hours = 24): UseDosesResult {
  const [doses, setDoses] = useState<DoseRecord[]>([]);
  const [iobSummary, setIobSummary] = useState<ActiveIobSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchDoses = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/doses?hours=${hours}`, {
        signal: abortRef.current.signal,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setDoses(data.doses ?? []);
      setIobSummary(data.iobSummary ?? null);
      setLastUpdated(new Date());
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to fetch doses");
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => {
    fetchDoses();
    return () => abortRef.current?.abort();
  }, [fetchDoses]);

  const logDose = useCallback(
    async (input: LogDoseInput) => {
      const res = await fetch("/api/doses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to log dose");
      }
      await fetchDoses();
    },
    [fetchDoses]
  );

  const deleteDose = useCallback(
    async (doseId: string) => {
      const res = await fetch(`/api/doses?id=${doseId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to delete dose");
      }
      await fetchDoses();
    },
    [fetchDoses]
  );

  return {
    doses,
    iobSummary,
    loading,
    error,
    refresh: fetchDoses,
    logDose,
    deleteDose,
    lastUpdated,
  };
}
