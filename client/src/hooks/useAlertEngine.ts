/**
 * GluMira™ — useAlertEngine hook
 *
 * Evaluates a stream of glucose readings against the alert engine.
 * Returns active alerts, loading state, and an evaluate trigger.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import { useState, useCallback } from "react";

// ─── Types (mirrored from server/alerts/glucose-alert-engine.ts) ──────────────

export type AlertSeverity = "info" | "warning" | "critical";
export type AlertType =
  | "hypo"
  | "hyper"
  | "rapid-rise"
  | "rapid-fall"
  | "nocturnal-hypo"
  | "nocturnal-hyper"
  | "missed-reading"
  | "persistent-hypo"
  | "persistent-hyper";

export interface GlucoseAlert {
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  glucoseMmol: number;
  recordedAt: string;
  actionRequired: boolean;
}

export interface AlertEngineResult {
  alerts: GlucoseAlert[];
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  requiresImmediateAction: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseAlertEngineReturn {
  result: AlertEngineResult | null;
  loading: boolean;
  error: string | null;
  evaluate: (readings: { mmol: number; timestamp: string }[]) => Promise<void>;
}

export function useAlertEngine(): UseAlertEngineReturn {
  const [result, setResult] = useState<AlertEngineResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluate = useCallback(async (readings: { mmol: number; timestamp: string }[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/alerts/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readings }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const data: AlertEngineResult = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to evaluate alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, evaluate };
}
