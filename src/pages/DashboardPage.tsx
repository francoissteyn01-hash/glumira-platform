/**
 * GluMira™ V7 — Dashboard Page
 * Profile-driven layout: widgets shown based on who you are.
 * Everything hidden can be revealed via "Show more". Nothing deleted.
 * Scandinavian Minimalist interior (#f8f9fa bg).
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DISCLAIMER } from "@/lib/constants";
import { useDashboard } from "@/hooks/useDashboard";
import StackingCurve from "@/components/charts/StackingCurve";
import GlucoseOverlay, { type GlucosePoint } from "@/components/charts/GlucoseOverlay";
import InsulinActivityCurve from "@/components/charts/InsulinActivityCurve";
import HiddenIOBWidget from "@/components/widgets/HiddenIOBWidget";
import { useGlucoseUnits } from "@/context/GlucoseUnitsContext";
import { formatGlucose as fmtGlucose } from "@/utils/glucose-units";
import PatternHighlights from "@/components/widgets/PatternHighlights";
import DailySummary from "@/components/widgets/DailySummary";
import RiskWindowCard from "@/components/widgets/RiskWindowCard";
import TimeInRangeDonut from "@/components/widgets/TimeInRangeDonut";
import AlertNotificationCenter from "@/components/widgets/AlertNotificationCenter";
import ThemeToggle from "@/components/ThemeToggle";
import { useDisplayName } from "@/hooks/useDisplayName";
import ExportReportButton from "@/components/ExportReportButton";
import { API } from "@/lib/api";

const ARROWS: Record<string, string> = {
  DoubleUp: "\u21C8", SingleUp: "\u2191", FortyFiveUp: "\u2197",
  Flat: "\u2192", FortyFiveDown: "\u2198", SingleDown: "\u2193",
  DoubleDown: "\u21CA", NONE: "\u2014",
};

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

type ProfileSnapshot = {
  first_name?: string;
  gender?: string;
  is_caregiver?: boolean;
  diabetes_type?: string;
  insulin_types?: string[];
  has_cgm?: boolean;
  profile_complete?: boolean;
  special_conditions?: string[];
};

const QUICK_ACTIONS = [
  { icon: "💉", label: "Log Insulin", route: "/log/insulin" },
  { icon: "🍽️", label: "Log Meal", route: "/log/meal" },
  { icon: "🩸", label: "Log Glucose", route: "/glucose" },
  { icon: "🦉", label: "Ask Mira", route: "/mira" },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user, session } = useAuth();
  const { displayName: displayName, isCaregiver } = useDisplayName();
  const { units: glucoseUnits } = useGlucoseUnits();
  const [showMore, setShowMore] = useState(false);
  const [profile, setProfile] = useState<ProfileSnapshot | null>(null);

  const {
    dateRange, setDateRange,
    stackingData, activityCurves, quietTail,
    conditionEvents, detectedPatterns,
    readings, latest, nsUrl, setNsUrl, nsSecret, setNsSecret,
    syncing, nsError, syncNightscout,
    currentIOB, pressure,
  } = useDashboard();

  const glucoseData: GlucosePoint[] = readings.map((r) => ({ time: r.time, value: r.glucose }));

  // Load profile for widget filtering
  useEffect(() => {
    if (!session) return;
    fetch(`${API}/api/profile`, { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then((r) => r.json())
      .then((d) => { if (d?.profile) setProfile(d.profile); })
      .catch(() => {});
  }, [session]);

  // Profile completeness — name + insulin type = minimum viable profile
  const profileComplete = !!(profile?.first_name && profile?.insulin_types?.length);
  const isMale = profile?.gender === "male" || profile?.gender === "M";
  const hasConditions = (profile?.special_conditions ?? []).length > 0;

  // Glucose colour
  const glucoseColour = !latest ? "var(--text-muted)"
    : latest.glucose < 3.9 ? "#ef4444"
    : latest.glucose > 10.0 ? "#eab308"
    : "#22c55e";

  const greeting = isCaregiver && displayName
    ? `${displayName}\u2019s Dashboard`
    : displayName
      ? `Hi ${displayName}`
      : "Dashboard";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "clamp(16px, 4vw, 28px)" }}>

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/brand/mira-hero.png" alt="Mira" style={{ width: 40, height: 40, objectFit: "contain", mixBlendMode: "multiply" }} />
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(20px, 5vw, 28px)", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                {greeting}
              </h1>
              {isCaregiver && displayName && (
                <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                  Managing for {displayName}
                </p>
              )}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ThemeToggle />
          </div>
        </div>

        {/* ── Profile completion nudge ─────────────────────────────────── */}
        {!profileComplete && profile !== null && (
          <div style={{
            background: "linear-gradient(135deg, var(--bg-card) 0%, rgba(42,181,193,0.06) 100%)",
            borderRadius: 14, border: "1.5px solid var(--accent-teal)", padding: "18px 20px",
            marginBottom: 20, display: "flex", alignItems: "flex-start", gap: 14,
          }}>
            <img src="/brand/mira-hero.png" alt="Mira" style={{ width: 48, height: 48, objectFit: "contain", flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 15, color: "var(--text-primary)", fontFamily: "'Playfair Display', serif" }}>
                Your dashboard waits for you
              </p>
              <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: 1.5 }}>
                Tell Mira about yourself and she will tailor everything — only the widgets that matter to you, in the right order for your situation.
              </p>
              <Link to="/profile"
                style={{
                  display: "inline-block", padding: "8px 18px", borderRadius: 8,
                  background: "var(--accent-teal)", color: "#fff", fontSize: 13, fontWeight: 700,
                  fontFamily: "'DM Sans', system-ui, sans-serif", textDecoration: "none",
                }}>
                Complete my profile
              </Link>
            </div>
          </div>
        )}

        {/* ── Live glucose hero card ───────────────────────────────────── */}
        <div style={{
          background: "var(--bg-card)", borderRadius: 16, border: "1px solid var(--border)",
          padding: "20px 24px", marginBottom: 16, display: "flex",
          alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        }}>
          <div>
            <p style={{ margin: "0 0 2px", fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-muted)", fontFamily: "'DM Sans', system-ui, sans-serif", textTransform: "uppercase" }}>
              {latest ? timeAgo(latest.time) : "No recent reading"}
            </p>
            <p style={{ margin: 0, fontSize: "clamp(36px,8vw,52px)", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: glucoseColour, lineHeight: 1 }}>
              {latest ? fmtGlucose(latest.glucose, glucoseUnits) : "\u2014"}
              <span style={{ fontSize: 22, marginLeft: 8, color: glucoseColour }}>{latest ? (ARROWS[latest.trend] ?? "") : ""}</span>
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              {glucoseUnits}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <RiskWindowCard pressure={pressure} />
            <HiddenIOBWidget quietTailIOB={quietTail} />
          </div>
        </div>

        {/* ── Alert notifications ──────────────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <AlertNotificationCenter />
        </div>

        {/* ── Quick actions (48px touch targets) ──────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 20 }}>
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.label} to={a.route}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                minHeight: 64, borderRadius: 12, background: "var(--bg-card)",
                border: "1px solid var(--border)", gap: 6, textDecoration: "none",
                color: "var(--text-primary)", fontSize: 11, fontWeight: 600,
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}>
              <span style={{ fontSize: 22 }}>{a.icon}</span>
              <span>{a.label}</span>
            </Link>
          ))}
        </div>

        {/* ── Date range selector ──────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {(["Today", "3D", "7D", "14D", "30D"] as const).map((r) => (
            <button
              key={r} type="button"
              onClick={() => setDateRange(r)}
              style={{
                padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${dateRange === r ? "var(--accent-teal)" : "var(--border)"}`,
                background: dateRange === r ? "rgba(42,181,193,0.1)" : "var(--bg-card)",
                color: dateRange === r ? "var(--accent-teal)" : "var(--text-secondary)",
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}>
              {r}
            </button>
          ))}
        </div>

        {/* ── IOB stacking curve ───────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <StackingCurve data={stackingData} glucoseUnits={glucoseUnits} />
        </div>

        {/* ── Glucose overlay ──────────────────────────────────────────── */}
        {glucoseData.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <GlucoseOverlay data={glucoseData} units={glucoseUnits} />
          </div>
        )}

        {/* ── Insulin activity curve ───────────────────────────────────── */}
        {activityCurves.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <InsulinActivityCurve curves={activityCurves} />
          </div>
        )}

        {/* ── Time in range ────────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <TimeInRangeDonut readings={glucoseData.map((g) => ({ value: g.value }))} />
        </div>

        {/* ── Daily summary (profile-filtered) ────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <DailySummary patterns={detectedPatterns} />
        </div>

        {/* ── Core CTAs: IOB Hunter + What-If ─────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          <Link to="/iob-hunter"
            style={{
              display: "block", borderRadius: 14, border: "2px solid var(--accent-teal)",
              padding: "20px 18px", textDecoration: "none", background: "var(--bg-card)",
            }}>
            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              🎯 IOB Hunter™
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: 1.4 }}>
              24-hour insulin pressure map
            </p>
          </Link>
          <Link to="/dashboard/what-if"
            style={{
              display: "block", borderRadius: 14, border: "2px solid var(--accent-amber)",
              padding: "20px 18px", textDecoration: "none", background: "var(--bg-card)",
            }}>
            <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              ⚡ What-If Engine
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif", lineHeight: 1.4 }}>
              Reshape the IOB curve in real time
            </p>
          </Link>
        </div>

        {/* ── Pattern highlights ────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <PatternHighlights patterns={detectedPatterns} />
        </div>

        {/* ── MiraAi chat nudge ────────────────────────────────────────── */}
        <div style={{
          background: "linear-gradient(135deg, var(--bg-card) 0%, rgba(42,181,193,0.05) 100%)",
          borderRadius: 14, border: "1px solid var(--border)", padding: "16px 20px",
          marginBottom: 20, display: "flex", alignItems: "center", gap: 14,
        }}>
          <img src="/brand/mira-hero.png" alt="MiraAi" style={{ width: 40, height: 40, objectFit: "contain" }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              Ask MiraAi
            </p>
            <p style={{ margin: 0, fontSize: 12, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
              {isCaregiver ? `"Gatiep's insulin is stacking — what does that mean?"` : `"Why is my glucose high after this meal?"`}
            </p>
          </div>
          <Link to="/mira"
            style={{
              padding: "8px 16px", borderRadius: 8, background: "var(--accent-teal)",
              color: "#fff", fontSize: 13, fontWeight: 700, fontFamily: "'DM Sans', system-ui, sans-serif",
              textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0,
            }}>
            Chat
          </Link>
        </div>

        {/* ── Show more toggle ─────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          style={{
            width: "100%", padding: "12px", borderRadius: 10, cursor: "pointer",
            border: "1px dashed var(--border)", background: "transparent",
            color: "var(--text-muted)", fontSize: 13, fontWeight: 600,
            fontFamily: "'DM Sans', system-ui, sans-serif", marginBottom: 20,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
          {showMore ? "▲ Show less" : "▼ Show more — Nightscout, condition log, advanced widgets"}
        </button>

        {/* ── More section (hidden by default) ─────────────────────────── */}
        {showMore && (
          <div style={{ marginBottom: 20 }}>

            {/* Condition events */}
            {conditionEvents.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                {conditionEvents.map((ev, i) => {
                  const time = new Date(ev.event_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  return (
                    <span key={i} style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "4px 10px", borderRadius: 6,
                      background: "var(--card-hover)", border: "1px solid var(--border-light)",
                      fontSize: 11, color: "var(--text-primary)", fontFamily: "'DM Sans', system-ui, sans-serif",
                    }}>
                      <span style={{ fontWeight: 600 }}>{time}</span>
                      <span style={{ textTransform: "capitalize" }}>{ev.event_type}</span>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Nightscout connection */}
            <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", padding: 20, marginBottom: 16 }}>
              <p style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Playfair Display', serif" }}>
                Nightscout Connection
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                <input value={nsUrl} onChange={(e) => setNsUrl(e.target.value)}
                  placeholder="https://yoursite.herokuapp.com"
                  style={{ minHeight: 44, padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 13, fontFamily: "'DM Sans', system-ui, sans-serif", outline: "none", width: "100%", boxSizing: "border-box" }} />
                <input type="password" value={nsSecret} onChange={(e) => setNsSecret(e.target.value)}
                  placeholder="API Secret (optional)"
                  style={{ minHeight: 44, padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-input)", color: "var(--text-primary)", fontSize: 13, fontFamily: "'DM Sans', system-ui, sans-serif", outline: "none", width: "100%", boxSizing: "border-box" }} />
              </div>
              <button type="button" onClick={syncNightscout} disabled={syncing || !nsUrl}
                style={{ minHeight: 44, padding: "0 20px", borderRadius: 8, border: "none", background: syncing ? "var(--text-faint)" : "var(--accent-teal)", color: "#fff", fontSize: 13, fontWeight: 700, cursor: syncing ? "not-allowed" : "pointer", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
                {syncing ? "Connecting\u2026" : "Connect & Sync"}
              </button>
              {nsError && (
                <div style={{ borderRadius: 8, background: "var(--error-bg)", border: "1px solid var(--error-border)", padding: "10px 14px", marginTop: 12, fontSize: 13, color: "var(--error-text)" }}>
                  {nsError}
                </div>
              )}
            </div>

            {/* Recent readings */}
            {readings.length > 0 && (
              <div style={{ background: "var(--bg-card)", borderRadius: 12, border: "1px solid var(--border)", overflow: "hidden", marginBottom: 16 }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Playfair Display', serif" }}>Recent Readings</p>
                </div>
                <div style={{ maxHeight: 220, overflowY: "auto" }}>
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

            {/* Export */}
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <ExportReportButton />
            </div>
          </div>
        )}

        {/* ── Footer disclaimer ─────────────────────────────────────────── */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 8 }}>
          <p style={{ fontSize: 11, color: "var(--text-faint)", textAlign: "center", margin: "0 0 4px", fontFamily: "'DM Sans', system-ui, sans-serif" }}>{DISCLAIMER}</p>
          <p style={{ fontSize: 10, color: "var(--placeholder)", textAlign: "center", margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>GluMira™ V7 — IOB Hunter™</p>
        </div>

        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}
