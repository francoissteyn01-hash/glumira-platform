/**
 * GluMira™ V7 — Dashboard Page
 * Thin render shell — all data-fetching and state lives in useDashboard.
 * Scandinavian Minimalist design (#f8f9fa bg, #1a2a5e navy, #2ab5c1 teal).
 */

import { useAuth } from "@/hooks/useAuth";
import { DISCLAIMER } from "@/lib/constants";
import { useDashboard } from "@/hooks/useDashboard";
import StackingCurve from "@/components/charts/StackingCurve";
import GlucoseOverlay, { type GlucosePoint } from "@/components/charts/GlucoseOverlay";
import InsulinActivityCurve from "@/components/charts/InsulinActivityCurve";
import ActiveInsulinCard from "@/components/widgets/ActiveInsulinCard";
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

const ARROWS: Record<string, string> = {
  DoubleUp: "\u21C8", SingleUp: "\u2191", FortyFiveUp: "\u2197",
  Flat: "\u2192", FortyFiveDown: "\u2198", SingleDown: "\u2193",
  DoubleDown: "\u21CA", NONE: "\u2014",
};

const DATE_RANGE_OPTIONS = ["Today", "3D", "7D", "14D", "30D"] as const;

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

const CONDITION_ICONS: Record<string, string> = {
  exercise: "\u{1F3C3}", illness: "\u{1F912}", stress: "\u{1F616}",
  sleep: "\u{1F634}", travel: "\u2708\uFE0F", steroid: "\u{1F48A}",
  menstrual: "\u{1F319}", exam: "\u{1F4DD}", weather: "\u{1F321}\uFE0F", other: "\u2699\uFE0F",
};

const INTENSITY_COLOURS: Record<string, string> = {
  low: "#22c55e", moderate: "#eab308", high: "#f97316", severe: "#ef4444",
};

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user } = useAuth();
  const { patientName, isCaregiver } = usePatientName();
  const { units: glucoseUnits } = useGlucoseUnits();

  const {
    dateRange, setDateRange,
    stackingData, activityCurves, quietTail,
    conditionEvents, detectedPatterns,
    readings, latest, nsUrl, setNsUrl, nsSecret, setNsSecret,
    syncing, nsError, syncNightscout,
    currentIOB, pressure,
  } = useDashboard();

  const glucoseData: GlucosePoint[] = readings.map((r) => ({ time: r.time, value: r.glucose }));

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(24px, 6vw, 32px)", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px" }}>
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
          {DATE_RANGE_OPTIONS.map((label) => (
            <button type="button" key={label} onClick={() => setDateRange(label)} style={{
              padding: "6px 14px", borderRadius: 6, border: "1px solid var(--border-light)",
              background: dateRange === label ? "var(--date-btn-active-bg)" : "var(--bg-card)",
              color: dateRange === label ? "var(--date-btn-active-text)" : "var(--text-secondary)",
              fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif",
            }}>
              {label}
            </button>
          ))}
        </div>

        <QuickActions />

        {/* Disclaimer */}
        <div style={{ borderRadius: 8, background: "var(--disclaimer-bg)", border: "1px solid var(--disclaimer-border)", padding: "10px 14px", marginBottom: 20, fontSize: 12, color: "var(--disclaimer-text)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          {DISCLAIMER}
        </div>

        {/* Top cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 20 }}>
          <ActiveInsulinCard totalIOB={currentIOB} pressure={pressure} />

          <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", padding: 20 }}>
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

          <RiskWindowCard pressure={pressure} />
          <SensorConfidenceCard readingsCount={readings.length} expectedCount={288} />
          <HiddenIOBWidget quietTailIOB={quietTail} />
          <AlertNotificationCenter />
        </div>

        {/* IOB Stacking Curve */}
        <div style={{ marginBottom: 20 }}>
          <StackingCurve data={stackingData} glucoseUnits={glucoseUnits} />
          {conditionEvents.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", padding: "8px 4px 0" }}>
              {conditionEvents.map((ev, i) => {
                const time = new Date(ev.event_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                return (
                  <span
                    key={i}
                    title={`${time} — ${ev.event_type}${ev.intensity ? ` (${ev.intensity})` : ""}`}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "4px 10px", borderRadius: 6,
                      background: "var(--card-hover)",
                      border: `1px solid ${ev.intensity ? INTENSITY_COLOURS[ev.intensity] ?? "var(--border-light)" : "var(--border-light)"}`,
                      fontSize: 11, color: "var(--text-primary)", fontFamily: "'DM Sans', system-ui, sans-serif",
                    }}
                  >
                    <span>{CONDITION_ICONS[ev.event_type] ?? "\u2699\uFE0F"}</span>
                    <span style={{ fontWeight: 600 }}>{time}</span>
                    <span style={{ textTransform: "capitalize" }}>{ev.event_type}</span>
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {glucoseData.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <GlucoseOverlay data={glucoseData} units={glucoseUnits} />
          </div>
        )}

        {activityCurves.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <InsulinActivityCurve curves={activityCurves} />
          </div>
        )}

        <div style={{ marginBottom: 20 }}><DailySummary patterns={detectedPatterns} /></div>
        <div style={{ marginBottom: 20 }}><PatternHighlights patterns={detectedPatterns} /></div>
        <div style={{ marginBottom: 20 }}>
          <TimeInRangeDonut readings={glucoseData.map((g) => ({ value: g.value }))} />
        </div>

        {/* IOB Hunter link */}
        <div
          onClick={() => { window.location.href = "/iob-hunter"; }}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") window.location.href = "/iob-hunter"; }}
          role="button" tabIndex={0} aria-label="Open IOB Hunter insulin density map"
          style={{ background: "var(--bg-card)", borderRadius: 12, border: "2px solid var(--accent-teal)", padding: 32, textAlign: "center", marginBottom: 20, cursor: "pointer" }}
        >
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}>&#127919; IOB Hunter&trade;</p>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0 0", fontFamily: "'DM Sans', system-ui, sans-serif" }}>24-hour insulin pressure map &mdash; spot stacking risk before it happens</p>
        </div>

        {/* What-If link */}
        <div
          onClick={() => { window.location.href = "/dashboard/what-if"; }}
          role="button" tabIndex={0}
          style={{ background: "var(--bg-card)", borderRadius: 12, border: "2px solid #f59e0b", padding: 32, textAlign: "center", marginBottom: 20, cursor: "pointer" }}
        >
          <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}>&#9889; What-If Scenario Engine</p>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0 0", fontFamily: "'DM Sans', system-ui, sans-serif" }}>Adjust doses and times — watch the IOB curve reshape in real time</p>
        </div>

        <div style={{ marginBottom: 20 }}><EventLogTable entries={[]} /></div>
        <div style={{ marginBottom: 20 }}><EmotionalDistressTracker /></div>

        {/* Nightscout Connection */}
        <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", padding: 20, marginBottom: 20 }}>
          <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Playfair Display', serif" }}>
            Nightscout Connection
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 12 }}>
            <input
              value={nsUrl}
              onChange={(e) => setNsUrl(e.target.value)}
              placeholder="https://yoursite.herokuapp.com"
              style={{ width: "100%", minHeight: 44, padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 13, fontFamily: "'DM Sans', system-ui, sans-serif", outline: "none", boxSizing: "border-box" }}
            />
            <input
              type="password"
              value={nsSecret}
              onChange={(e) => setNsSecret(e.target.value)}
              placeholder="API Secret (optional)"
              style={{ width: "100%", minHeight: 44, padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border-light)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 13, fontFamily: "'DM Sans', system-ui, sans-serif", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <button type="button" onClick={syncNightscout} disabled={syncing || !nsUrl} style={{ minHeight: 40, padding: "0 20px", borderRadius: 8, border: "none", background: syncing ? "var(--text-faint)" : "var(--accent-teal)", color: "#ffffff", fontSize: 13, fontWeight: 700, cursor: syncing ? "not-allowed" : "pointer", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            {syncing ? "Connecting\u2026" : "Connect & Sync"}
          </button>
        </div>

        {nsError && (
          <div style={{ borderRadius: 8, background: "var(--error-bg)", border: "1px solid var(--error-border)", padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "var(--error-text)" }}>
            {nsError}
          </div>
        )}

        {/* Recent Readings */}
        {readings.length > 0 && (
          <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border-light)", overflow: "hidden", marginBottom: 20 }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border-divider)" }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Playfair Display', serif" }}>Recent Readings</p>
            </div>
            <div style={{ maxHeight: 240, overflowY: "auto" }}>
              {readings.slice(0, 20).map((r, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", borderBottom: i < 19 ? "1px solid var(--card-hover)" : "none" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: r.glucose < 3.9 ? "#ef4444" : r.glucose > 10 ? "#eab308" : "#22c55e" }}>
                    {fmtGlucose(r.glucose, glucoseUnits)} {ARROWS[r.trend] ?? ""}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>{timeAgo(r.time)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ borderTop: "1px solid var(--border-divider)", marginTop: 8, padding: "16px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <button type="button" style={{ padding: "8px 20px", borderRadius: 8, border: "2px solid var(--text-primary)", background: "transparent", color: "var(--text-primary)", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Compare Days
            </button>
            <ExportReportButton />
          </div>
          <p style={{ fontSize: 11, color: "var(--text-faint)", textAlign: "center", margin: "8px 0 4px", fontFamily: "'DM Sans', system-ui, sans-serif" }}>{DISCLAIMER}</p>
          <p style={{ fontSize: 10, color: "var(--placeholder)", textAlign: "center", margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>V7 — Powered by IOB Hunter™</p>
        </div>

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
