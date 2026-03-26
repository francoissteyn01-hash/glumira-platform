/**
 * GluMira™ — useAuditLog.ts
 *
 * React hook for fetching the admin audit log.
 * Admin-only — returns 403 for non-admin users.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuditAction =
  | "user.login"
  | "user.logout"
  | "user.signup"
  | "user.password_reset"
  | "patient.create"
  | "patient.read"
  | "patient.update"
  | "patient.delete"
  | "glucose.create"
  | "glucose.read"
  | "glucose.delete"
  | "insulin.create"
  | "insulin.read"
  | "insulin.delete"
  | "meal.create"
  | "meal.read"
  | "iob.calculate"
  | "care_plan.generate"
  | "phi.encrypt"
  | "phi.decrypt"
  | "phi.key_rotation"
  | "gdpr.erase"
  | "security.rate_limit_exceeded"
  | "security.csrf_failure"
  | "security.auth_failure";

export interface AuditEntry {
  id?: string;
  eventTime: string;
  userId: string;
  patientId?: string;
  action: AuditAction;
  tableName?: string;
  recordId?: string;
  ipAddress?: string;
  userAgent?: string;
  riskScore: number;
  metadata?: Record<string, unknown>;
  hmacSha256: string;
  prevHmac: string;
}

interface UseAuditLogResult {
  entries: AuditEntry[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

// ─── Risk colour helper ───────────────────────────────────────────────────────

export function riskColour(score: number): string {
  if (score >= 76) return "text-red-600";
  if (score >= 51) return "text-amber-500";
  if (score >= 26) return "text-blue-600";
  return "text-slate-500";
}

export function riskLabel(score: number): string {
  if (score >= 76) return "High";
  if (score >= 51) return "Medium";
  if (score >= 26) return "Low";
  return "Info";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuditLog(limit = 100): UseAuditLogResult {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/api/admin/audit?limit=${limit}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<{ ok: boolean; entries: AuditEntry[] }>;
      })
      .then(({ entries: e }) => {
        setEntries(e);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message ?? "Failed to load audit log");
        setLoading(false);
      });
  }, [refreshKey, limit]);

  return { entries, loading, error, refresh };
}

export default useAuditLog;
