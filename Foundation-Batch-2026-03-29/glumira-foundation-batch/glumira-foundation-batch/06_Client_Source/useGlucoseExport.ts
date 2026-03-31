/**
 * GluMira™ V7 — client/src/hooks/useGlucoseExport.ts
 *
 * Hook: useGlucoseExport
 * Triggers a browser download of glucose data from the Express export endpoint.
 * Used by: ExportButton (04.2.80)
 *
 * NOTE: "use client" directive removed — this is Vite+React, not Next.js.
 * Architecture: /client/src/ → Vite + React (Drive Auditor v2.0, 2026-03-28)
 *
 * GluMira™ is an educational platform, not a medical device.
 * Version: v1.0 · 2026-03-29
 */

import { useState, useCallback } from "react";
import type { ExportFormat, ExportUnit } from "../../../server/analytics/glucose-export";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ExportOptions {
  format?:    ExportFormat;
  unit?:      ExportUnit;
  days?:      number;
  startDate?: string;
  endDate?:   string;
}

export interface UseGlucoseExportReturn {
  exporting: boolean;
  error:     string | null;
  triggerExport: (options?: ExportOptions) => Promise<void>;
  clearError: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useGlucoseExport(): UseGlucoseExportReturn {
  const [exporting, setExporting] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const triggerExport = useCallback(async (options: ExportOptions = {}) => {
    setExporting(true);
    setError(null);

    try {
      const {
        format    = "csv",
        unit      = "mmol",
        days      = 14,
        startDate,
        endDate,
      } = options;

      // Build query string
      const params = new URLSearchParams({
        format,
        unit,
        days: String(days),
        ...(startDate ? { start: startDate } : {}),
        ...(endDate   ? { end:   endDate   } : {}),
      });

      // Get auth token from localStorage (Supabase pattern)
      const token = getAuthToken();
      if (!token) {
        throw new Error("Not authenticated — please sign in");
      }

      const res = await fetch(`/api/glucose/export?${params.toString()}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Export failed: HTTP ${res.status}`);
      }

      // Extract filename from Content-Disposition header
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] ?? `glumira-glucose.${format}`;

      // Trigger browser download
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      const message = err instanceof Error ? err.message : "Export failed";
      setError(message);
      console.error("[useGlucoseExport]", err);
    } finally {
      setExporting(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { exporting, error, triggerExport, clearError };
}

// ── Auth helper ───────────────────────────────────────────────────────────────

/**
 * Retrieve Supabase access token from localStorage.
 * Supabase stores session as JSON under 'sb-<project>-auth-token'.
 */
function getAuthToken(): string | null {
  try {
    // Try env-prefixed key first (set in main.tsx or auth provider)
    const directToken = localStorage.getItem("glumira_access_token");
    if (directToken) return directToken;

    // Fall back to scanning for Supabase session key
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.includes("auth-token")) {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          return parsed?.access_token ?? null;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}
