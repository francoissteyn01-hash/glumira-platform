/**
 * GluMira™ — useGlucoseExport.ts
 *
 * React hook for triggering a glucose data export download.
 * Wraps GET /api/glucose/export and triggers a browser download.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import { useState, useCallback } from "react";
import type { ExportFormat, ExportUnit } from "@/server/analytics/glucose-export";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GlucoseExportParams {
  format?: ExportFormat;
  unit?: ExportUnit;
  days?: number;
  startDate?: string;
  endDate?: string;
}

interface UseGlucoseExportResult {
  exporting: boolean;
  error: string | null;
  triggerExport: (params?: GlucoseExportParams) => Promise<void>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGlucoseExport(): UseGlucoseExportResult {
  const [exporting, setExporting] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const triggerExport = useCallback(async (params: GlucoseExportParams = {}) => {
    setExporting(true);
    setError(null);

    try {
      const qs = new URLSearchParams();
      if (params.format)    qs.set("format",    params.format);
      if (params.unit)      qs.set("unit",       params.unit);
      if (params.days)      qs.set("days",       String(params.days));
      if (params.startDate) qs.set("start",      params.startDate);
      if (params.endDate)   qs.set("end",        params.endDate);

      const res = await fetch(`/api/glucose/export?${qs.toString()}`);

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      // Extract filename from Content-Disposition header
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] ?? `glumira-glucose-export.${params.format ?? "csv"}`;

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Export failed";
      setError(msg);
    } finally {
      setExporting(false);
    }
  }, []);

  return { exporting, error, triggerExport };
}

export default useGlucoseExport;
