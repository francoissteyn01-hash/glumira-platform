/**
 * GluMira — useNightscoutSync hook
 *
 * Wraps POST /api/integrations/nightscout/sync with loading/error state.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useState, useCallback } from "react";

export interface SyncResult {
  status: "success" | "partial" | "error";
  readingsImported: number;
  dosesImported: number;
  lastSyncAt: string;
  errors: string[];
}

interface UseNightscoutSyncReturn {
  result: SyncResult | null;
  loading: boolean;
  error: string | null;
  sync: (params: { url: string; apiSecret?: string; days?: number }) => Promise<void>;
  testConnection: (url: string) => Promise<boolean>;
}

export function useNightscoutSync(): UseNightscoutSyncReturn {
  const [result, setResult] = useState<SyncResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(
    async (params: { url: string; apiSecret?: string; days?: number }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/integrations/nightscout/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Sync failed");
        }
        const data: SyncResult = await res.json();
        setResult(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const testConnection = useCallback(async (url: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/integrations/nightscout/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  return { result, loading, error, sync, testConnection };
}
