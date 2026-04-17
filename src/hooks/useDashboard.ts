/**
 * GluMira™ V7 — useDashboard hook
 *
 * All data-fetching, state and derived values for DashboardPage.
 * The page component is a thin render-only shell that calls this hook.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { API } from "@/lib/api";
import type { StackingPoint } from "@/components/charts/StackingCurve";
import type { DoseCurve } from "@/components/charts/InsulinActivityCurve";
import type { PressureClass } from "@/components/widgets/ActiveInsulinCard";

/* ─── Public types ─────────────────────────────────────────────────────────── */

export type DateRangeLabel = "Today" | "3D" | "7D" | "14D" | "30D";

export type IOBResult = { totalIOB: number; eventCount: number };

export type GlucoseReading = { glucose: number; time: string; trend: string };

export type ConditionEvent = {
  event_time: string;
  event_type: string;
  intensity: string | null;
};

export type DetectedPattern = {
  id: string;
  category: string;
  type: string;
  confidence: "high" | "moderate" | "low";
  observation: string;
  suggestion: string;
};

/* ─── Constants ────────────────────────────────────────────────────────────── */

const RANGE_DAYS: Record<DateRangeLabel, number> = {
  Today: 1, "3D": 3, "7D": 7, "14D": 14, "30D": 30,
};

const BASAL_TYPES = new Set([
  "levemir", "lantus", "basaglar", "toujeo", "tresiba", "nph",
]);

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function getDateRange(label: DateRangeLabel) {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const days = RANGE_DAYS[label];
  const start = new Date(end.getTime() - days * 24 * 60 * 60_000);
  return { from: start.toISOString(), to: end.toISOString() };
}

function classifyPressure(iob: number, max: number): PressureClass {
  if (max <= 0) return "light";
  const r = iob / max;
  if (r < 0.25) return "light";
  if (r < 0.5)  return "moderate";
  if (r < 0.75) return "strong";
  return "overlap";
}

function trpcUrl(proc: string, input: unknown) {
  return `/trpc/${proc}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`;
}

async function trpcGet(
  url: string,
  headers: Record<string, string>,
  signal: AbortSignal,
): Promise<unknown | null> {
  try {
    const res = await fetch(url, { headers, signal });
    if (signal.aborted) return null;
    const j = await res.json();
    return j?.result?.data?.json ?? null;
  } catch (err) {
    if ((err as { name?: string })?.name === "AbortError") return null;
    return null;
  }
}

/* ─── Hook ─────────────────────────────────────────────────────────────────── */

export function useDashboard() {
  const { session } = useAuth();

  // ── Date range ──────────────────────────────────────────────────────────
  const [dateRange, setDateRange] = useState<DateRangeLabel>("Today");

  // ── IOB Hunter ──────────────────────────────────────────────────────────
  const [stackingData,    setStackingData]    = useState<StackingPoint[]>([]);
  const [iobResult,       setIobResult]       = useState<IOBResult | null>(null);
  const [activityCurves,  setActivityCurves]  = useState<DoseCurve[]>([]);
  const [quietTail,       setQuietTail]       = useState(0);
  const [conditionEvents, setConditionEvents] = useState<ConditionEvent[]>([]);
  const [detectedPatterns,setDetectedPatterns]= useState<DetectedPattern[]>([]);

  // ── Nightscout ──────────────────────────────────────────────────────────
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [nsUrl,    setNsUrl]    = useState(() => localStorage.getItem("ns_url")    ?? "");
  const [nsSecret, setNsSecret] = useState(() => localStorage.getItem("ns_secret") ?? "");
  const [syncing,  setSyncing]  = useState(false);
  const [nsError,  setNsError]  = useState<string | null>(null);

  // ── Fetch IOB + clinical data ────────────────────────────────────────────
  useEffect(() => {
    if (!session) return;
    const controller = new AbortController();
    const { signal } = controller;
    const headers = { Authorization: `Bearer ${session.access_token}` };
    const { from, to } = getDateRange(dateRange);
    const effectStartedAt = Date.now();
    const today = new Date(effectStartedAt).toISOString().slice(0, 10);
    const todayFrom = `${today}T00:00:00`;
    const todayTo   = `${today}T23:59:59`;

    trpcGet(trpcUrl("iobHunter.getStackingCurve", { from, to }), headers, signal).then((data) => {
      if (!signal.aborted && Array.isArray(data)) setStackingData(data);
    });

    trpcGet(trpcUrl("iobHunter.calculateIOB", {}), headers, signal).then((data) => {
      if (!signal.aborted && data) setIobResult(data as IOBResult);
    });

    type InsulinEventLite = { id: string; event_time: string; dose_units: number; insulin_type: string };
    trpcGet(trpcUrl("insulinEvent.getByDateRange", { from: todayFrom, to: todayTo }), headers, signal).then((events) => {
      if (signal.aborted || !Array.isArray(events)) return;
      const list = events as InsulinEventLite[];

      const curves: DoseCurve[] = list.map((ev) => {
        const isBasal = BASAL_TYPES.has(ev.insulin_type);
        const time  = new Date(ev.event_time);
        const label = `${time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ${ev.insulin_type} ${Number(ev.dose_units).toFixed(1)}U`;
        return { id: ev.id, label, type: isBasal ? "basal" as const : "bolus" as const, points: [] };
      });
      setActivityCurves(curves);

      let tail = 0;
      for (const ev of list) {
        const elapsed = (effectStartedAt - new Date(ev.event_time).getTime()) / 60_000;
        if (elapsed > 720) {
          tail += Number(ev.dose_units) * Math.exp(-Math.LN2 / 720 * elapsed);
        }
      }
      setQuietTail(Math.round(tail * 100) / 100);
    });

    trpcGet(trpcUrl("conditionEvent.list", { from: todayFrom, to: todayTo, limit: 50 }), headers, signal).then((data) => {
      if (!signal.aborted && Array.isArray(data)) setConditionEvents(data);
    });

    trpcGet(trpcUrl("patterns.analyse", { from: todayFrom, to: todayTo }), headers, signal).then((data) => {
      if (!signal.aborted && Array.isArray(data)) setDetectedPatterns(data);
    });

    return () => { controller.abort(); };
  }, [session, dateRange]);

  // ── Nightscout sync ──────────────────────────────────────────────────────
  const syncNightscout = useCallback(async () => {
    if (!nsUrl || !session) return;
    setSyncing(true);
    try {
      localStorage.setItem("ns_url",    nsUrl);
      localStorage.setItem("ns_secret", nsSecret);
      const res = await fetch(`${API}/api/nightscout/sync`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: nsUrl, apiSecret: nsSecret, days: 1 }),
      });
      const data = await res.json();
      setReadings(data.readings ?? []);
      setNsError(null);
    } catch (e) {
      setNsError((e as Error).message);
    } finally {
      setSyncing(false);
    }
  }, [nsUrl, nsSecret, session]);

  // Auto-sync on mount if a URL is already saved
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (nsUrl) syncNightscout(); }, []);

  // ── Derived values ────────────────────────────────────────────────────────
  const latest        = readings[0] ?? null;
  const maxIOB        = stackingData.reduce((m, p) => Math.max(m, p.totalIOB), 0) || 1;
  const currentIOB    = iobResult?.totalIOB ?? 0;
  const pressure      = classifyPressure(currentIOB, maxIOB);

  return {
    // Date range
    dateRange, setDateRange,
    // IOB data
    stackingData, iobResult, activityCurves, quietTail,
    conditionEvents, detectedPatterns,
    // Glucose / NS
    readings, latest, nsUrl, setNsUrl, nsSecret, setNsSecret,
    syncing, nsError, syncNightscout,
    // Derived
    currentIOB, pressure,
  };
}
