/**
 * GluMira™ useRealtimeGlucose
 * Version: 7.0.0
 *
 * Subscribes to Supabase Realtime INSERT events on the glucose_readings table
 * for the authenticated user. Prepends new readings to the local state and
 * triggers an optional callback.
 *
 * Usage:
 *   const { readings, latest, connected } = useRealtimeGlucose({ limit: 288 });
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────

export interface GlucoseReading {
  id: string;
  user_id: string;
  glucose: number;         // mmol/L
  unit: "mmol/L" | "mg/dL";
  source: "manual" | "nightscout" | "cgm" | "import";
  recorded_at: string;     // ISO string
  notes?: string;
}

interface Options {
  /** Maximum readings to keep in state (FIFO). Default: 288 (24h at 5-min intervals) */
  limit?: number;
  /** Called when a new reading arrives */
  onNewReading?: (reading: GlucoseReading) => void;
}

interface UseRealtimeGlucoseReturn {
  readings: GlucoseReading[];
  latest: GlucoseReading | null;
  connected: boolean;
  error: string | null;
}

// ─── Supabase client (singleton) ─────────────────────────────

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key);
}

// ─── Hook ─────────────────────────────────────────────────────

export function useRealtimeGlucose({
  limit = 288,
  onNewReading,
}: Options = {}): UseRealtimeGlucoseReturn {
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onNewReadingRef = useRef(onNewReading);
  onNewReadingRef.current = onNewReading;

  // Initial fetch
  const fetchInitial = useCallback(async () => {
    try {
      const res = await fetch(`/api/readings?limit=${limit}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setReadings(data.readings ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load readings");
    }
  }, [limit]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  // Realtime subscription
  useEffect(() => {
    let supabase: ReturnType<typeof getSupabaseClient>;
    try {
      supabase = getSupabaseClient();
    } catch {
      setError("Supabase not configured — realtime unavailable");
      return;
    }

    const channel = supabase
      .channel("glucose_readings_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "glucose_readings",
        },
        (payload) => {
          const reading = payload.new as GlucoseReading;
          setReadings((prev) => {
            const updated = [reading, ...prev];
            return updated.slice(0, limit);
          });
          onNewReadingRef.current?.(reading);
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
        if (status === "CHANNEL_ERROR") {
          setError("Realtime channel error");
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setConnected(false);
    };
  }, [limit]);

  return {
    readings,
    latest: readings[0] ?? null,
    connected,
    error,
  };
}

export default useRealtimeGlucose;
