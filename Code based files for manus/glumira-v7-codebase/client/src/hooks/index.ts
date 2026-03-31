/**
 * GluMira™ V7 — client/src/hooks/index.ts
 * All React hooks required by uploaded components.
 * Stack: Vite + React (NOT Next.js — "use client" removed)
 * Version: v1.0 · 2026-03-29
 */

// ─────────────────────────────────────────────────────────────────────────────
// useGlucoseExport
// Required by: ExportButton.tsx (04.2.80)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useCallback } from "react";

export type ExportFormat = "csv" | "json";
export type ExportUnit   = "mmol" | "mgdl";

export interface ExportOptions {
  format?:    ExportFormat;
  unit?:      ExportUnit;
  days?:      number;
  startDate?: string;
  endDate?:   string;
}

export interface UseGlucoseExport {
  exporting: boolean;
  error:     string | null;
  triggerExport: (opts?: ExportOptions) => Promise<void>;
}

export function useGlucoseExport(): UseGlucoseExport {
  const [exporting, setExporting] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const triggerExport = useCallback(async (opts: ExportOptions = {}) => {
    setExporting(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (opts.format)    params.set("format", opts.format);
      if (opts.unit)      params.set("unit", opts.unit);
      if (opts.days)      params.set("days", String(opts.days));
      if (opts.startDate) params.set("start", opts.startDate);
      if (opts.endDate)   params.set("end", opts.endDate);

      const token = localStorage.getItem("glumira_token") ?? "";
      const res = await fetch(`/api/glucose/export?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      // Trigger browser download
      const blob     = await res.blob();
      const filename = res.headers.get("Content-Disposition")
        ?.match(/filename="(.+)"/)?.[1] ?? `glumira-export.${opts.format ?? "csv"}`;

      const url = URL.createObjectURL(blob);
      const a   = document.createElement("a");
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }, []);

  return { exporting, error, triggerExport };
}

// ─────────────────────────────────────────────────────────────────────────────
// useTelemetry
// Required by: BetaFeedbackWidget.tsx (04.2.82)
// ─────────────────────────────────────────────────────────────────────────────

export interface TelemetryEventData {
  [key: string]: string | number | boolean | undefined;
}

export interface UseTelemetry {
  trackEvent:    (name: string, data?: TelemetryEventData) => void;
  trackFeedback: (name: string, data?: TelemetryEventData) => void;
  trackPage:     (page: string) => void;
}

export function useTelemetry(): UseTelemetry {
  const fire = useCallback(async (
    eventName: string,
    category: string,
    data?: TelemetryEventData
  ) => {
    try {
      const token = localStorage.getItem("glumira_token") ?? "";
      await fetch("/api/telemetry", {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          event_name:     eventName,
          event_category: category,
          event_data:     data ?? {},
          page_context:   window.location.pathname,
          device_type:    window.innerWidth < 768 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
          session_id:     sessionStorage.getItem("glumira_session_id"),
        }),
      });
    } catch {
      // Telemetry failures are silent — never break the user flow
    }
  }, []);

  return {
    trackEvent:    (name, data) => fire(name, "feature_use", data),
    trackFeedback: (name, data) => fire(name, "feedback", data),
    trackPage:     (page)       => fire("page_view", "navigation", { page }),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// useBasalTitration
// Required by: DoseTitrationPage.tsx (04.1.31)
// ─────────────────────────────────────────────────────────────────────────────

export interface BasalTitrationInput {
  fastingGlucoseReadings: number[];
  currentBasalDose?:      number;
  targetFastingMmol?:     number;
}

export interface BasalTitrationResult {
  riskTier:                 "low" | "moderate" | "high" | "very-high";
  riskLabel:                string;
  pattern:                  string;
  suggestedAdjustmentUnits: number;
  newBasalDose:             number | null;
  confidence:               "high" | "moderate" | "low";
  recommendations:          string[];
}

export interface UseBasalTitration {
  result:   BasalTitrationResult | null;
  loading:  boolean;
  error:    string | null;
  compute:  (input: BasalTitrationInput) => void;
}

export function useBasalTitration(): UseBasalTitration {
  const [result,  setResult]  = useState<BasalTitrationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const compute = useCallback((input: BasalTitrationInput) => {
    setLoading(true);
    setError(null);

    // Client-side calculation (mirrors dose-adjustment-advisor logic)
    setTimeout(() => {
      try {
        const { fastingGlucoseReadings: readings, currentBasalDose = 18, targetFastingMmol = 5.5 } = input;
        const meanFasting = readings.reduce((s, v) => s + v, 0) / readings.length;
        const minFasting  = Math.min(...readings);
        const diff        = meanFasting - targetFastingMmol;

        // Pattern classification
        const hypoCount = readings.filter(v => v < 3.9).length;
        let pattern: string;
        let riskTier: BasalTitrationResult["riskTier"];
        let adjustment = 0;

        if (hypoCount > 0) {
          pattern  = `${hypoCount} hypoglycaemic fasting reading(s) — basal may be too high`;
          riskTier = hypoCount >= 3 ? "very-high" : "high";
          adjustment = -Math.min(Math.round(currentBasalDose * 0.1 * 2) / 2, 4);
        } else if (diff > 2.5) {
          pattern  = `Fasting mean ${meanFasting.toFixed(1)} mmol/L — significantly above target`;
          riskTier = diff > 4.0 ? "very-high" : "high";
          adjustment = Math.min(Math.round(currentBasalDose * 0.1 * 2) / 2, 4);
        } else if (diff > 1.0) {
          pattern  = `Fasting mean ${meanFasting.toFixed(1)} mmol/L — moderately above target`;
          riskTier = "moderate";
          adjustment = Math.round(currentBasalDose * 0.05 * 2) / 2;
        } else if (minFasting < 4.5 && diff < 0) {
          pattern  = `Fasting mean near target but low readings detected`;
          riskTier = "moderate";
          adjustment = -0.5;
        } else {
          pattern  = `Fasting mean ${meanFasting.toFixed(1)} mmol/L — within target range`;
          riskTier = "low";
          adjustment = 0;
        }

        const newBasalDose  = currentBasalDose ? Math.max(0, currentBasalDose + adjustment) : null;
        const riskLabels    = { low: "Low risk", moderate: "Moderate risk", high: "High risk", "very-high": "Very high risk" };
        const recommendations: string[] = [];

        if (adjustment > 0) recommendations.push(`Increase basal by ${adjustment}U and monitor fasting glucose for 3 days.`);
        if (adjustment < 0) recommendations.push(`Reduce basal by ${Math.abs(adjustment)}U — recheck fasting glucose after 3 days.`);
        if (hypoCount > 0)  recommendations.push("Check for missed meals or increased activity before adjusting basal.");
        recommendations.push("Discuss this with your care team before making any changes.");

        setResult({
          riskTier,
          riskLabel:                riskLabels[riskTier],
          pattern,
          suggestedAdjustmentUnits: adjustment,
          newBasalDose:             newBasalDose ? Math.round(newBasalDose * 2) / 2 : null,
          confidence:               readings.length >= 7 ? "high" : readings.length >= 4 ? "moderate" : "low",
          recommendations,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Calculation failed");
      } finally {
        setLoading(false);
      }
    }, 300); // Simulate async
  }, []);

  return { result, loading, error, compute };
}

// ─────────────────────────────────────────────────────────────────────────────
// useAuth — base auth hook
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id:    string;
  email: string;
  role:  string;
}

export interface UseAuth {
  user:    AuthUser | null;
  token:   string | null;
  loading: boolean;
  signIn:  (email: string, password: string) => Promise<void>;
  signOut: () => void;
  error:   string | null;
}

export function useAuth(): UseAuth {
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [token,   setToken]   = useState<string | null>(localStorage.getItem("glumira_token"));
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/signin", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Sign in failed");
      localStorage.setItem("glumira_token", data.token);
      setToken(data.token);
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem("glumira_token");
    setToken(null);
    setUser(null);
  }, []);

  return { user, token, loading, signIn, signOut, error };
}
