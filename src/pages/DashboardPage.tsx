/**
 * GluMira™ V7 — Dashboard Page
 * Integrates IOB Hunter visualisations with Nightscout glucose data.
 * Scandinavian Minimalist design (#f8f9fa bg, #1a2a5e navy, #2ab5c1 teal).
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DISCLAIMER } from "@/lib/constants";
import StackingCurve, { type StackingPoint } from "@/components/charts/StackingCurve";
import GlucoseOverlay, { type GlucosePoint } from "@/components/charts/GlucoseOverlay";
import InsulinActivityCurve, { type DoseCurve } from "@/components/charts/InsulinActivityCurve";
import BasalHeatmap from "@/components/charts/BasalHeatmap";
import ActiveInsulinCard, { type PressureClass } from "@/components/widgets/ActiveInsulinCard";
import HiddenIOBWidget from "@/components/widgets/HiddenIOBWidget";
import UnitToggle from "@/components/UnitToggle";
import { useGlucoseUnits } from "@/context/GlucoseUnitsContext";
import { formatGlucose as fmtGlucose, getUnitLabel } from "@/utils/glucose-units";

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface IOBResult { totalIOB: number; eventCount: number }
interface GlucoseReading { glucose: number; time: string; trend: string }

const ARROWS: Record<string, string> = {
  DoubleUp: "\u21C8", SingleUp: "\u2191", FortyFiveUp: "\u2197",
  Flat: "\u2192", FortyFiveDown: "\u2198", SingleDown: "\u2193",
  DoubleDown: "\u21CA", NONE: "\u2014",
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60_000);
  return { from: start.toISOString(), to: end.toISOString() };
}

function classifyPressure(iob: number, max: number): PressureClass {
  if (max <= 0) return "light";
  const r = iob / max;
  if (r < 0.25) return "light";
  if (r < 0.5) return "moderate";
  if (r < 0.75) return "strong";
  return "overlap";
}

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user, session } = useAuth();

  // IOB Hunter state
  const [stackingData, setStackingData] = useState<StackingPoint[]>([]);
  const [iobResult, setIobResult] = useState<IOBResult | null>(null);
  const [activityCurves, setActivityCurves] = useState<DoseCurve[]>([]);
  const [quietTail, setQuietTail] = useState(0);

  // Glucose / Nightscout state
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [nsUrl, setNsUrl] = useState(() => localStorage.getItem("ns_url") ?? "");
  const [nsSecret, setNsSecret] = useState(() => localStorage.getItem("ns_secret") ?? "");
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { units: glucoseUnits } = useGlucoseUnits();

  const latest = readings[0] ?? null;

  /* ─── Fetch IOB data ────────────────────────────────────────────────── */
  useEffect(() => {
    if (!session) return;
    const headers = { Authorization: `Bearer ${session.access_token}` };
    const { from, to } = todayRange();

    // Stacking curve
    fetch(`/trpc/iobHunter.getStackingCurve?input=${encodeURIComponent(JSON.stringify({ json: { from, to } }))}`, { headers })
      .then((r) => r.json())
      .then((res) => {
        const data = res?.result?.data?.json;
        if (Array.isArray(data)) setStackingData(data);
      })
      .catch(() => {});

    // Current IOB
    fetch(`/trpc/iobHunter.calculateIOB?input=${encodeURIComponent(JSON.stringify({ json: {} }))}`, { headers })
      .then((r) => r.json())
      .then((res) => {
        const data = res?.result?.data?.json;
        if (data) setIobResult(data);
      })
      .catch(() => {});

    // Insulin events for activity curves
    const today = new Date().toISOString().slice(0, 10);
    fetch(`/trpc/insulinEvent.getByDateRange?input=${encodeURIComponent(JSON.stringify({ json: { from: `${today}T00:00:00`, to: `${today}T23:59:59` } }))}`, { headers })
      .then((r) => r.json())
      .then((res) => {
        const events = res?.result?.data?.json;
        if (!Array.isArray(events)) return;

        // Build DoseCurve[] per event
        const BASAL_TYPES = new Set(["levemir", "lantus", "basaglar", "toujeo", "tresiba", "nph"]);
        const curves: DoseCurve[] = events.map((ev: any) => {
          const isBasal = BASAL_TYPES.has(ev.insulin_type);
          const time = new Date(ev.event_time);
          const label = `${time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ${ev.insulin_type} ${Number(ev.dose_units).toFixed(1)}U`;
          return {
            id: ev.id,
            label,
            type: isBasal ? "basal" as const : "bolus" as const,
            points: [], // populated below by engine call
          };
        });

        // For now, set curves with empty points — the StackingCurve is the main vis
        setActivityCurves(curves);

        // Compute quiet tail: IOB from events > 12h ago
        const twelveHoursAgo = Date.now() - 12 * 60 * 60_000;
        let tail = 0;
        // Approximate: events from yesterday contribute quiet tail
        for (const ev of events) {
          const elapsed = (Date.now() - new Date(ev.event_time).getTime()) / 60_000;
          if (elapsed > 720) { // > 12h
            tail += Number(ev.dose_units) * Math.exp(-Math.LN2 / 720 * elapsed);
          }
        }
        setQuietTail(Math.round(tail * 100) / 100);
      })
      .catch(() => {});
  }, [session]);

  /* ─── Nightscout sync ───────────────────────────────────────────────── */
  async function syncNS() {
    if (!nsUrl || !session) return;
    setSyncing(true);
    try {
      localStorage.setItem("ns_url", nsUrl);
      localStorage.setItem("ns_secret", nsSecret);
      const res = await fetch("/api/nightscout/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: nsUrl, apiSecret: nsSecret, days: 1 }),
      });
      const data = await res.json();
      setReadings(data.readings ?? []);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => { if (nsUrl) syncNS(); }, []);

  /* ─── Derived state ─────────────────────────────────────────────────── */
  const maxIOB = stackingData.reduce((m, p) => Math.max(m, p.totalIOB), 0) || 1;
  const currentIOB = iobResult?.totalIOB ?? 0;
  const currentPressure = classifyPressure(currentIOB, maxIOB);

  const glucoseData: GlucosePoint[] = readings.map((r) => ({
    time: r.time,
    value: r.glucose,
  }));

  const tirPercent = readings.length > 0
    ? Math.round((readings.filter((r) => r.glucose >= 3.9 && r.glucose <= 10).length / readings.length) * 100)
    : null;

  /* ─── Render ────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>

        {/* Header + Unit Toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{
              fontFamily: "'Playfair Display', serif", fontSize: "clamp(24px, 6vw, 32px)",
              fontWeight: 700, color: "#1a2a5e", margin: "0 0 4px",
            }}>
              Dashboard
            </h1>
            <p style={{ fontSize: 14, color: "#52667a", margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""}
            </p>
          </div>
          <UnitToggle />
        </div>

        {/* Disclaimer */}
        <div style={{
          borderRadius: 8, background: "#fffbeb", border: "1px solid #fbbf24",
          padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "#92400e",
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}>
          {DISCLAIMER}
        </div>

        {/* ── Top Cards (2×2 grid) ──────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 20 }}>
          {/* Active Insulin */}
          <ActiveInsulinCard totalIOB={currentIOB} pressure={currentPressure} />

          {/* Current Glucose */}
          <div style={{
            background: "#ffffff", borderRadius: 12, border: "1px solid #dee2e6", padding: 20,
          }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#52667a", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Latest Glucose
            </p>
            {latest ? (
              <>
                <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 700, color: "#1a2a5e", fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtGlucose(latest.glucose, glucoseUnits)}
                  <span style={{ fontSize: 16, marginLeft: 6, color: "#52667a" }}>{ARROWS[latest.trend] ?? "\u2014"}</span>
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "#94a3b8", fontFamily: "'DM Sans', system-ui, sans-serif" }}>{timeAgo(latest.time)}</p>
              </>
            ) : (
              <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 700, color: "#dee2e6", fontFamily: "'JetBrains Mono', monospace" }}>&mdash;</p>
            )}
          </div>

          {/* Hidden IOB */}
          <HiddenIOBWidget quietTailIOB={quietTail} />

          {/* Stats card */}
          <div style={{
            background: "#ffffff", borderRadius: 12, border: "1px solid #dee2e6", padding: 20,
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#52667a", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  Time in Range
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 700, color: "#1a2a5e", fontFamily: "'JetBrains Mono', monospace" }}>
                  {tirPercent != null ? `${tirPercent}%` : "\u2014"}
                </p>
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "#52667a", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  Events Today
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 24, fontWeight: 700, color: "#1a2a5e", fontFamily: "'JetBrains Mono', monospace" }}>
                  {iobResult?.eventCount ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── IOB Stacking Curve ────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <StackingCurve data={stackingData} glucoseUnits={glucoseUnits} />
        </div>

        {/* ── Glucose Overlay ───────────────────────────────────────────── */}
        {glucoseData.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <GlucoseOverlay data={glucoseData} units={glucoseUnits} />
          </div>
        )}

        {/* ── Insulin Activity Curves ───────────────────────────────────── */}
        {activityCurves.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <InsulinActivityCurve curves={activityCurves} />
          </div>
        )}

        {/* ── Nightscout Connection ─────────────────────────────────────── */}
        <div style={{
          background: "#ffffff", borderRadius: 12, border: "1px solid #dee2e6",
          padding: 20, marginBottom: 20,
        }}>
          <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "#1a2a5e", fontFamily: "'Playfair Display', serif" }}>
            Nightscout Connection
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <input
              value={nsUrl}
              onChange={(e) => setNsUrl(e.target.value)}
              placeholder="https://yoursite.herokuapp.com"
              style={{
                width: "100%", minHeight: 44, padding: "10px 14px", borderRadius: 8,
                border: "1px solid #dee2e6", background: "#f8f9fa", color: "#1a2a5e",
                fontSize: 13, fontFamily: "'DM Sans', system-ui, sans-serif", outline: "none", boxSizing: "border-box",
              }}
            />
            <input
              type="password"
              value={nsSecret}
              onChange={(e) => setNsSecret(e.target.value)}
              placeholder="API Secret (optional)"
              style={{
                width: "100%", minHeight: 44, padding: "10px 14px", borderRadius: 8,
                border: "1px solid #dee2e6", background: "#f8f9fa", color: "#1a2a5e",
                fontSize: 13, fontFamily: "'DM Sans', system-ui, sans-serif", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
          <button
            onClick={syncNS}
            disabled={syncing || !nsUrl}
            style={{
              minHeight: 40, padding: "0 20px", borderRadius: 8, border: "none",
              background: syncing ? "#94a3b8" : "#2ab5c1", color: "#ffffff",
              fontSize: 13, fontWeight: 700, cursor: syncing ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            {syncing ? "Connecting\u2026" : "Connect & Sync"}
          </button>
        </div>

        {error && (
          <div style={{
            borderRadius: 8, background: "#fef2f2", border: "1px solid #fca5a5",
            padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#991b1b",
          }}>
            {error}
          </div>
        )}

        {/* ── Recent Readings ───────────────────────────────────────────── */}
        {readings.length > 0 && (
          <div style={{
            background: "#ffffff", borderRadius: 12, border: "1px solid #dee2e6",
            overflow: "hidden", marginBottom: 20,
          }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #e9ecef" }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#1a2a5e", fontFamily: "'Playfair Display', serif" }}>
                Recent Readings
              </p>
            </div>
            <div style={{ maxHeight: 240, overflowY: "auto" }}>
              {readings.slice(0, 20).map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 20px", borderBottom: i < 19 ? "1px solid #f1f3f5" : "none",
                  }}
                >
                  <span style={{
                    fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
                    color: r.glucose < 3.9 ? "#ef4444" : r.glucose > 10 ? "#eab308" : "#22c55e",
                  }}>
                    {fmtGlucose(r.glucose, glucoseUnits)} {ARROWS[r.trend] ?? ""}
                  </span>
                  <span style={{ fontSize: 12, color: "#94a3b8", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                    {timeAgo(r.time)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spacer for mobile bottom nav */}
        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
