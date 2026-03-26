/**
 * GluMira™ useRealtimeDoses
 * Version: 7.0.0
 *
 * Subscribes to Supabase Realtime INSERT and DELETE events on the doses table
 * for the authenticated user. Keeps local state in sync without polling.
 *
 * Usage:
 *   const { doses, connected } = useRealtimeDoses({ windowHours: 24 });
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────

export interface RealtimeDose {
  id: string;
  user_id: string;
  insulinType: string;
  doseType: "bolus" | "correction" | "basal";
  units: number;
  administeredAt: string;
  notes?: string;
}

interface Options {
  /** Hours of history to show. Default: 24 */
  windowHours?: number;
  /** Called when a new dose is inserted */
  onInsert?: (dose: RealtimeDose) => void;
  /** Called when a dose is deleted */
  onDelete?: (id: string) => void;
}

interface UseRealtimeDosesReturn {
  doses: RealtimeDose[];
  connected: boolean;
  error: string | null;
}

// ─── Supabase client ──────────────────────────────────────────

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Supabase env vars not set");
  return createClient(url, key);
}

// ─── Hook ─────────────────────────────────────────────────────

export function useRealtimeDoses({
  windowHours = 24,
  onInsert,
  onDelete,
}: Options = {}): UseRealtimeDosesReturn {
  const [doses, setDoses] = useState<RealtimeDose[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onInsertRef = useRef(onInsert);
  const onDeleteRef = useRef(onDelete);
  onInsertRef.current = onInsert;
  onDeleteRef.current = onDelete;

  // Initial fetch
  const fetchInitial = useCallback(async () => {
    try {
      const res = await fetch(`/api/doses?hours=${windowHours}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setDoses(data.doses ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load doses");
    }
  }, [windowHours]);

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
      .channel("doses_realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "doses",
        },
        (payload) => {
          const raw = payload.new as Record<string, unknown>;
          const dose: RealtimeDose = {
            id: raw.id as string,
            user_id: raw.user_id as string,
            insulinType: raw.insulin_type as string,
            doseType: raw.dose_type as RealtimeDose["doseType"],
            units: raw.units as number,
            administeredAt: raw.administered_at as string,
            notes: raw.notes as string | undefined,
          };
          setDoses((prev) => [dose, ...prev]);
          onInsertRef.current?.(dose);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "doses",
        },
        (payload) => {
          const id = (payload.old as { id: string }).id;
          setDoses((prev) => prev.filter((d) => d.id !== id));
          onDeleteRef.current?.(id);
        }
      )
      .subscribe((status) => {
        setConnected(status === "SUBSCRIBED");
        if (status === "CHANNEL_ERROR") {
          setError("Realtime channel error — doses");
        }
      });

    return () => {
      supabase.removeChannel(channel);
      setConnected(false);
    };
  }, [windowHours]);

  return { doses, connected, error };
}

export default useRealtimeDoses;
