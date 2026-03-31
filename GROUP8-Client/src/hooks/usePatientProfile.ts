"use client";

/**
 * GluMira™ — usePatientProfile hook
 *
 * Fetches and updates the authenticated user's patient profile
 * via GET /api/profile and PATCH /api/profile.
 *
 * Features:
 *  - Auto-fetch on mount
 *  - Optimistic update on save
 *  - Abort controller on unmount
 *  - Typed PatientProfile interface
 */

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PatientProfile {
  id: string;
  displayName: string;
  dob: string | null;
  diabetesType: "T1D" | "T2D" | "LADA" | "Other";
  insulinType: string;
  insulinConcentration: 100 | 200 | 300 | 500;
  weightKg: number | null;
  heightCm: number | null;
  glucoseUnits: "mmol/L" | "mg/dL";
  activeMealRegime: string | null;
  notificationsEnabled: boolean;
  hypoAlertThreshold: number;
  hyperAlertThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export type PatientProfilePatch = Partial<Omit<PatientProfile, "id" | "createdAt" | "updatedAt">>;

export interface UsePatientProfileReturn {
  profile: PatientProfile | null;
  loading: boolean;
  error: string | null;
  saving: boolean;
  saveError: string | null;
  refetch: () => void;
  updateProfile: (patch: PatientProfilePatch) => Promise<boolean>;
  clearErrors: () => void;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function usePatientProfile(): UsePatientProfileReturn {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/profile", { signal: controller.signal });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed to load profile (${res.status})`);
      }

      const data: PatientProfile = await res.json();
      setProfile(data);
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Mount ────────────────────────────────────────────────────────────────

  useEffect(() => {
    fetchProfile();
    return () => { abortRef.current?.abort(); };
  }, [fetchProfile]);

  // ─── Update ───────────────────────────────────────────────────────────────

  const updateProfile = useCallback(async (patch: PatientProfilePatch): Promise<boolean> => {
    setSaving(true);
    setSaveError(null);

    // Optimistic update
    const previous = profile;
    if (profile) {
      setProfile({ ...profile, ...patch });
    }

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Save failed (${res.status})`);
      }

      const updated: PatientProfile = await res.json();
      setProfile(updated);
      return true;
    } catch (err) {
      // Roll back optimistic update
      setProfile(previous);
      setSaveError(err instanceof Error ? err.message : "Save failed");
      return false;
    } finally {
      setSaving(false);
    }
  }, [profile]);

  // ─── Clear errors ─────────────────────────────────────────────────────────

  const clearErrors = useCallback(() => {
    setError(null);
    setSaveError(null);
  }, []);

  return {
    profile,
    loading,
    error,
    saving,
    saveError,
    refetch: fetchProfile,
    updateProfile,
    clearErrors,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Convert mmol/L to mg/dL */
export function mmolToMgdl(mmol: number): number {
  return Math.round(mmol * 18.018);
}

/** Convert mg/dL to mmol/L */
export function mgdlToMmol(mgdl: number): number {
  return Math.round((mgdl / 18.018) * 10) / 10;
}

/** Return the display glucose value in the user's preferred unit */
export function formatGlucose(
  mmol: number,
  units: "mmol/L" | "mg/dL",
  decimals = 1
): string {
  if (units === "mg/dL") {
    return `${mmolToMgdl(mmol)} mg/dL`;
  }
  return `${mmol.toFixed(decimals)} mmol/L`;
}

/** Derive age in years from ISO date string */
export function ageFromDob(dob: string): number {
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

/** Compute BMI from weight (kg) and height (cm) */
export function computeBmi(weightKg: number, heightCm: number): number {
  return Math.round((weightKg / Math.pow(heightCm / 100, 2)) * 10) / 10;
}

/** Classify BMI into WHO category */
export function classifyBmi(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy weight";
  if (bmi < 30) return "Overweight";
  return "Obese";
}
