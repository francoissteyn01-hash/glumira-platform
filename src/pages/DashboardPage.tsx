/**
 * GluMira™ V7 — Dashboard Page
 * Integrates IOB Hunter visualisations with Nightscout glucose data.
 * Scandinavian Minimalist design (#f8f9fa bg, #1a2a5e navy, #2ab5c1 teal).
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { API } from "@/lib/api";
import { DISCLAIMER } from "@/lib/constants";
import StackingCurve, { type StackingPoint } from "@/components/charts/StackingCurve";
import GlucoseOverlay, { type GlucosePoint } from "@/components/charts/GlucoseOverlay";
import InsulinActivityCurve, { type DoseCurve } from "@/components/charts/InsulinActivityCurve";
import ActiveInsulinCard, { type PressureClass } from "@/components/widgets/ActiveInsulinCard";
import HiddenIOBWidget from "@/components/widgets/HiddenIOBWidget";
import UnitToggle from "@/components/UnitToggle";
import { useGlucoseUnits } from "@/context/GlucoseUnitsContext";
import { formatGlucose as fmtGlucose } from "@/utils/glucose-units";
import EmotionalDistressTracker from "@/components/EmotionalDistressTracker";
import ExportReportButton from "@/components/ExportReportButton";
import PatternHighlights from "@/components/widgets/PatternHighlights";
import DailySummary from "@/components/widgets/DailySummary";
import RiskWindowCard from "@/components/widgets/RiskWindowCard";
import SensorConfidenceCard from "@/components/widgets/SensorConfidenceCard";
import TimeInRangeDonut from "@/components/widgets/TimeInRangeDonut";
import EventLogTable from "@/components/widgets/EventLogTable";
import AlertNotificationCenter from "@/components/widgets/AlertNotificationCenter";
import PresentationToggle from "@/components/PresentationMode";
import ShareButton from "@/components/ShareButton";
import ThemeToggle from "@/components/ThemeToggle";
import { usePatientName } from "@/hooks/usePatientName";
import QuickActions from "@/components/widgets/QuickActions";

/* ─── Types ───────────────────────────────────────────────────────────────── */

type IOBResult = { totalIOB: number; eventCount: number }
type GlucoseReading = { glucose: number; time: string; trend: string }

const ARROWS: Record<string, string> = {
  DoubleUp: "\u21C8", SingleUp: "\u2191", FortyFiveUp: "\u2197",
  Flat: "\u2192", FortyFiveDown: "\u2198", SingleDown: "\u2193",
  DoubleDown: "\u21CA", NONE: "\u2014",
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

type DateRangeLabel = "Today" | "3D" | "7D" | "14D" | "30D";

const RANGE_DAYS: Record<DateRangeLabel, number> = {
  Today: 1, "3D": 3, "7D": 7, "14D": 14, "30D": 30,
};

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
  const { patientName, isCaregiver } = usePatientName();

  // Date range
  const [dateRange, setDateRange] = useState<DateRangeLabel>("Today");

  // IOB Hunter state
  const [stackingData, setStackingData] = useState<StackingPoint[]>([]);
  const [iobResult, setIobResult] = useState<IOBResult | null>(null);
  const [activityCurves, setActivityCurves] = useState<DoseCurve[]>([]);
  const [quietTail, setQuietTail] = useState(0);

  // Condition events for timeline markers
  const [conditionEvents, setConditionEvents] = useState<{ event_time: string; event_type: string; intensity: string | null }[]>([]);
  type DetectedPattern = {
    id: string;
    category: string;
    type: string;
    confidence: "high" | "moderate" | "low";
    observation: string;
    suggestion: string;
  };
  const [detectedPatterns, setDetectedPatterns] = useState<DetectedPattern[]>([]);

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
    const { from, to } = getDateRange(dateRange);

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
        type InsulinEventLite = { id: string; event_time: string; dose_units: number; insulin_type: string };
        const curves: DoseCurve[] = (events as InsulinEventLite[]).map((ev) => {
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
        let tail = 0;
        // Approximate: events from yesterday contribute quiet tail
        for (const ev of events as InsulinEventLite[]) {
          const elapsed = (Date.now() - new Date(ev.event_time).getTime()) / 60_000;
          if (elapsed > 720) { // > 12h
            tail += Number(ev.dose_units) * Math.exp(-Math.LN2 / 720 * elapsed);
          }
        }
        setQuietTail(Math.round(tail * 100) / 100);
      })
      .catch(() => {});

    // Condition events for timeline markers
    fetch(`/trpc/conditionEvent.list?input=${encodeURIComponent(JSON.stringify({ json: { from: `${today}T00:00:00`, to: `${today}T23:59:59`, limit: 50 } }))}`, { headers })
      .then((r) => r.json())
      .then((res) => {
        const data = res?.result?.data?.json;
        if (Array.isArray(data)) setConditionEvents(data);
      })
      .catch(() => {});

    // Pattern analysis
    fetch(`/trpc/patterns.analyse?input=${encodeURIComponent(JSON.stringify({ json: { from: `${today}T00:00:00`, to: `${today}T23:59:59` } }))}`, { headers })
      .then((r) => r.json())
      .then((res) => {
        const data = res?.result?.data?.json;
        if (Array.isArray(data)) setDetectedPatterns(data);
      })
      .catch(() => {});
  }, [session, dateRange]);

  /* ─── Nightscout sync ───────────────────────────────────────────────── */
  async function syncNS() {
    if (!nsUrl || !session) return;
    setSyncing(true);
    try {
      localStorage.setItem("ns_url", nsUrl);
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
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSyncing(false);
    }
  }

  // Run once on mount to auto-sync if a Nightscout URL is already saved.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (nsUrl) syncNS(); }, []);

  /* ─── Derived state ─────────────────────────────────────────────────── */
  const maxIOB = stackingData.reduce((m, p) => Math.max(m, p.totalIOB), 0) || 1;
  const currentIOB = iobResult?.totalIOB ?? 0;
  const currentPressure = classifyPressure(currentIOB, maxIOB);

  const glucoseData: GlucosePoint[] = readings.map((r) => ({
    time: r.time,
    value: r.glucose,
  }));

  /* ─── Render ────────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>

        {/* Header + Unit Toggle + Theme Toggle */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{
              fontFamily: "'Playfair Display', serif", fontSize: "clamp(24px, 6vw, 32px)",
              fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px",
            }}>
              {isCaregiver && patientName ? `${patientName}\u2019s Dashboard` : "Dashboard"}
            </h1>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              {isCaregiver && patientName
                ? `Managing for ${patientName}`
                : `Welcome back${user?.email ? `, ${user.email.split("@")[0]}` : ""}`}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ShareButton />
            <PresentationToggle />
            <ThemeToggle />
            <UnitToggle />
          </div>
        </div>

        {/* Date range selector */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
          {(["Today", "3D", "7D", "14D", "30D"] as const).map((label) => (
            <button type="button" key={label} onClick={() => setDateRange(label)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid var(--border-light)", background: dateRange === label ? "var(--date-btn-active-bg)" : "var(--bg-card)", color: dateRange === label ? "var(--date-btn-active-text)" : "var(--text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* Disclaimer */}
        <div style={{
          borderRadius: 8, background: "var(--disclaimer-bg)", border: "1px solid var(--disclaimer-border)",
          padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "var(--disclaimer-text)",
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
            background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", padding: 20,
          }}>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: 0.5, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Latest Glucose
            </p>
            {latest ? (
              <>
                <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtGlucose(latest.glucose, glucoseUnits)}
                  <span style={{ fontSize: 16, marginLeft: 6, color: "var(--text-secondary)" }}>{ARROWS[latest.trend] ?? "\u2014"}</span>
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>{timeAgo(latest.time)}</p>
              </>
            ) : (
              <p style={{ margin: "4px 0 0", fontSize: 32, fontWeight: 700, color: "var(--border-light)", fontFamily: "'JetBrains Mono', monospace" }}>&mdash;</p>
            )}
          </div>

          {/* Risk Window */}
          <RiskWindowCard pressure={currentPressure} />

          {/* Sensor Confidence */}
          <SensorConfidenceCard readingsCount={readings.length} expectedCount={288} />

          {/* Hidden IOB */}
          <HiddenIOBWidget quietTailIOB={quietTail} />

          {/* Alert Notification Center (live, polled) */}
          <AlertNotificationCenter />
        </div>

        {/* ── IOB Stacking Curve ────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <StackingCurve data={stackingData} glucoseUnits={glucoseUnits} />
          {/* Condition event markers on timeline */}
          {conditionEvents.length > 0 && (
            <div style={{
              display: "flex", gap: 6, flexWrap: "wrap", padding: "8px 4px 0",
            }}>
              {conditionEvents.map((ev, i) => {
                const time = new Date(ev.event_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                const icons: Record<string, string> = {
                  exercise: "\u{1F3C3}", illness: "\u{1F912}", stress: "\u{1F616}",
                  sleep: "\u{1F634}", travel: "\u2708\uFE0F", steroid: "\u{1F48A}",
                  menstrual: "\u{1F319}", exam: "\u{1F4DD}", weather: "\u{1F321}\uFE0F", other: "\u2699\uFE0F",
                };
                const intensityColours: Record<string, string> = {
                  low: "#22c55e", moderate: "#eab308", high: "#f97316", severe: "#ef4444",
                };
                return (
                  <span
                    key={i}
                    title={`${time} — ${ev.event_type}${ev.intensity ? ` (${ev.intensity})` : ""}`}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "4px 10px", borderRadius: 6,
                      background: "var(--card-hover)", border: `1px solid ${ev.intensity ? intensityColours[ev.intensity] ?? "var(--border-light)" : "var(--border-light)"}`,
                      fontSize: 11, color: "var(--text-primary)", fontFamily: "'DM Sans', system-ui, sans-serif",
                    }}
                  >
                    <span>{icons[ev.event_type] ?? "\u2699\uFE0F"}</span>
                    <span style={{ fontWeight: 600 }}>{time}</span>
                    <span style={{ textTransform: "capitalize" }}>{ev.event_type}</span>
                  </span>
                );
              })}
            </div>
          )}
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

        {/* ── Daily Summary ───────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <DailySummary patterns={detectedPatterns} />
        </div>

        {/* ── Pattern Highlights ─────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <PatternHighlights patterns={detectedPatterns} />
        </div>

        {/* ── Time in Range Donut ───────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <TimeInRangeDonut readings={glucoseData.map((g) => ({ value: g.value }))} />
        </div>

        {/* ── What-If Scenario Link ────────────────────────────────── */}
        <div
          onClick={() => window.location.href = "/dashboard/what-if"}
          role="button"
          tabIndex={0}
          style={{ background: "var(--bg-card)", borderRadius: 12, border: "2px solid #f59e0b", padding: 32, textAlign: "center", marginBottom: 20, cursor: "pointer" }}
        >
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}>&#9889; What-If Scenario Engine</p>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0 0", fontFamily: "'DM Sans', system-ui, sans-serif" }}>Adjust doses and times — watch the IOB curve reshape in real time</p>
        </div>

        {/* ── Event Log Table ─────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <EventLogTable entries={[]} />
        </div>

        {/* ── Emotional Distress Tracker ──────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <EmotionalDistressTracker />
        </div>

        {/* ── Nightscout Connection ─────────────────────────────────────── */}
        <div style={{
          background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)",
          padding: 20, marginBottom: 20,
        }}>
          <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Playfair Display', serif" }}>
            Nightscout Connection
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 12 }}>
            <input
              value={nsUrl}
              onChange={(e) => setNsUrl(e.target.value)}
              placeholder="https://yoursite.herokuapp.com"
              style={{
                width: "100%", minHeight: 44, padding: "10px 14px", borderRadius: 8,
                border: "1px solid var(--border-light)", background: "var(--bg-input)", color: "var(--text-primary)",
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
                border: "1px solid var(--border-light)", background: "var(--bg-input)", color: "var(--text-primary)",
                fontSize: 13, fontFamily: "'DM Sans', system-ui, sans-serif", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
          <button type="button"
            onClick={syncNS}
            disabled={syncing || !nsUrl}
            style={{
              minHeight: 40, padding: "0 20px", borderRadius: 8, border: "none",
              background: syncing ? "var(--text-faint)" : "var(--accent-teal)", color: "#ffffff",
              fontSize: 13, fontWeight: 700, cursor: syncing ? "not-allowed" : "pointer",
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            {syncing ? "Connecting\u2026" : "Connect & Sync"}
          </button>
        </div>

        {error && (
          <div style={{
            borderRadius: 8, background: "var(--error-bg)", border: "1px solid var(--error-border)",
            padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "var(--error-text)",
          }}>
            {error}
          </div>
        )}

        {/* ── Recent Readings ───────────────────────────────────────────── */}
        {readings.length > 0 && (
          <div style={{
            background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)",
            overflow: "hidden", marginBottom: 20,
          }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-divider)" }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Playfair Display', serif" }}>
                Recent Readings
              </p>
            </div>
            <div style={{ maxHeight: 240, overflowY: "auto" }}>
              {readings.slice(0, 20).map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 20px", borderBottom: i < 19 ? "1px solid var(--card-hover)" : "none",
                  }}
                >
                  <span style={{
                    fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
                    color: r.glucose < 3.9 ? "#ef4444" : r.glucose > 10 ? "#eab308" : "#22c55e",
                  }}>
                    {fmtGlucose(r.glucose, glucoseUnits)} {ARROWS[r.trend] ?? ""}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                    {timeAgo(r.time)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Footer ─────────────────────────────────────────────────── */}
        {/* ── Footer ─────────────────────────────────────────────────── */}
        <div style={{ borderTop: "1px solid var(--border-divider)", marginTop: 8, padding: "16px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <button type="button" style={{ padding: "8px 20px", borderRadius: 8, border: "2px solid var(--text-primary)", background: "transparent", color: "var(--text-primary)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Compare Days
            </button>
            <ExportReportButton />
          </div>
          <p style={{ fontSize: 11, color: "var(--text-faint)", textAlign: "center", margin: "8px 0 4px", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            {DISCLAIMER}
          </p>
          <p style={{ fontSize: 10, color: "var(--placeholder)", textAlign: "center", margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
            V7 — Powered by IOB Hunter™
          </p>
        </div>

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
