/**
 * GluMira™ — useMealLog.ts
 *
 * React hook for fetching and creating meal log entries.
 * Wraps GET/POST /api/meals.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MealEntry {
  id: string;
  userId: string;
  loggedAt: string;       // ISO timestamp
  mealType: MealType;
  carbsGrams: number;
  proteinGrams?: number;
  fatGrams?: number;
  notes?: string;
  photoUrl?: string;
  glycaemicIndex?: number;
  insulinDoseId?: string;
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack" | "other";

export interface CreateMealInput {
  loggedAt?: string;
  mealType: MealType;
  carbsGrams: number;
  proteinGrams?: number;
  fatGrams?: number;
  notes?: string;
  photoUrl?: string;
  glycaemicIndex?: number;
  insulinDoseId?: string;
}

export interface MealLogPage {
  entries: MealEntry[];
  total: number;
  page: number;
  pageSize: number;
}

interface UseMealLogOptions {
  page?: number;
  pageSize?: number;
  mealType?: MealType;
  fromDate?: string;
  toDate?: string;
}

interface UseMealLogResult {
  entries: MealEntry[];
  total: number;
  loading: boolean;
  creating: boolean;
  error: string | null;
  createEntry: (input: CreateMealInput) => Promise<MealEntry | null>;
  refresh: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useMealLog(options: UseMealLogOptions = {}): UseMealLogResult {
  const { page = 1, pageSize = 20, mealType, fromDate, toDate } = options;

  const [entries, setEntries]   = useState<MealEntry[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const qs = new URLSearchParams();
    qs.set("page",     String(page));
    qs.set("pageSize", String(pageSize));
    if (mealType) qs.set("mealType", mealType);
    if (fromDate) qs.set("from",     fromDate);
    if (toDate)   qs.set("to",       toDate);

    fetch(`/api/meals?${qs.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<MealLogPage>;
      })
      .then((data) => {
        setEntries(data.entries);
        setTotal(data.total);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message ?? "Failed to load meal log");
        setLoading(false);
      });
  }, [page, pageSize, mealType, fromDate, toDate, refreshKey]);

  const createEntry = useCallback(async (input: CreateMealInput): Promise<MealEntry | null> => {
    setCreating(true);
    setError(null);

    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const entry = await res.json() as MealEntry;
      refresh();
      return entry;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create meal entry";
      setError(msg);
      return null;
    } finally {
      setCreating(false);
    }
  }, [refresh]);

  return { entries, total, loading, creating, error, createEntry, refresh };
}

export default useMealLog;
