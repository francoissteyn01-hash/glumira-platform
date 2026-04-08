/**
 * GluMira™ V7 — Block 31: CGM Live 5-Minute Monitor Page
 * Real-time bedside glucose monitor polling Nightscout every 5 minutes.
 */

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGlucoseUnits } from "@/context/GlucoseUnitsContext";
import { formatGlucose, getUnitLabel } from "@/utils/glucose-units";
import { DISCLAIMER } from "@/lib/constants";
import { API } from "@/lib/api";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface GlucoseEntry {
  sgv: number;        // mg/dL from Nightscout
  mmol: number;       // mmol/L (converted)
  direction: string;
  dateString: string;
  date: number;       // epoch ms
}

type ConnectionStatus = "connected" | "disconnected" | "stale";
type AlertLevel = "LOW" | "HIGH" | "URGENT" | null;

/* ─── Constants ──────────────────────────────────────────────────────────── */

const POLL_INTERVAL = 5 * 60 * 1000; // 5 minutes
const STALE_THRESHOLD = 10 * 60 * 1000; // 10 minutes
const HISTORY_COUNT = 36; // 3h of 5-min readings
const MGDL_TO_MMOL = 18.0182;

const TREND_ARROWS: Record<string, string> = {
  DoubleUp: "⇈",
  SingleUp: "↑",
  FortyFiveUp: "↗",
  Flat: "→",
  FortyFiveDown: "↘",
  SingleDown: "↓",
  DoubleDown: "⇊",
  "NOT COMPUTABLE": "?",
  "RATE OUT OF RANGE": "⚠",
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function toMmol(mgdl: number): number {
  return Math.round((mgdl / MGDL_TO_MMOL) * 100) / 100;
}

function getRangeColor(mmol: number): string {
  if (mmol < 3.9) return "#e53e3e";
  if (mmol <= 10.0) return "#38a169";
  if (mmol <= 13.9) return "#d69e2e";
  return "#e53e3e";
}

function getAlertLevel(mmol: number): AlertLevel {
  if (mmol < 3.0) return "URGENT";
  if (mmol < 3.9) return "LOW";
  if (mmol > 13.9) return "HIGH";
  return null;
}

function timeSince(epochMs: number): string {
  const diff = Math.max(0, Date.now() - epochMs);
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m ago`;
}

function playHypoBeep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = 880;
    gain.gain.value = 0.3;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.stop(ctx.currentTime + 0.5);
    setTimeout(() => ctx.close(), 600);
  } catch {
    // Web Audio not available
  }
}

/* ─── Sparkline Component ────────────────────────────────────────────────── */

function Sparkline({ readings, units }: { readings: GlucoseEntry[]; units: "mmol" | "mg" }) {
  if (readings.length < 2) {
    return (
      <div style={{ color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 14, textAlign: "center", padding: 20 }}>
        Waiting for data...
      </div>
    );
  }

  const W = 880;
  const H = 160;
  const pad = 16;
  const values = readings.map((r) => r.mmol);
  const min = Math.min(...values) - 0.5;
  const max = Math.max(...values) + 0.5;
  const rangeY = max - min || 1;

  const points = readings.map((r, i) => {
    const x = pad + ((W - 2 * pad) / (readings.length - 1)) * i;
    const y = H - pad - ((r.mmol - min) / rangeY) * (H - 2 * pad);
    return { x, y, mmol: r.mmol };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Range bands (mmol): low < 3.9, target 3.9-10.0, high 10.0-13.9, very high >13.9
  const bands = [
    { lo: 3.9, hi: 10.0, color: "rgba(56,161,105,0.08)" },
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={160} style={{ display: "block" }}>
      {/* target band */}
      {bands.map((b, i) => {
        const yTop = H - pad - ((Math.min(b.hi, max) - min) / rangeY) * (H - 2 * pad);
        const yBot = H - pad - ((Math.max(b.lo, min) - min) / rangeY) * (H - 2 * pad);
        return <rect key={i} x={pad} y={yTop} width={W - 2 * pad} height={yBot - yTop} fill={b.color} rx={4} />;
      })}
      {/* line */}
      <polyline points={polyline} fill="none" stroke="var(--accent-teal)" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {/* dots colour-coded */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill={getRangeColor(p.mmol)} />
      ))}
    </svg>
  );
}

/* ─── Countdown Ring ─────────────────────────────────────────────────────── */

function CountdownRing({ remaining, total }: { remaining: number; total: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const progress = Math.max(0, Math.min(1, remaining / total));
  const offset = circ * (1 - progress);
  const secs = Math.ceil(remaining / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <svg width={44} height={44} viewBox="0 0 44 44">
        <circle cx={22} cy={22} r={r} fill="none" stroke="var(--border-light)" strokeWidth={3} />
        <circle
          cx={22} cy={22} r={r} fill="none" stroke="var(--accent-teal)" strokeWidth={3}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 22 22)"
          style={{ transition: "stroke-dashoffset 1s linear" }}
        />
      </svg>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--text-secondary)" }}>
        {m}:{String(s).padStart(2, "0")}
      </span>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export default function CGMLiveMonitorPage() {
  const { user } = useAuth();
  const { units } = useGlucoseUnits();

  // State
  const [readings, setReadings] = useState<GlucoseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected");
  const [timeSinceStr, setTimeSinceStr] = useState("--");
  const [paused, setPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("cgm_sound") === "true");
  const [nsUrl, setNsUrl] = useState(() => localStorage.getItem("ns_url") ?? "");
  const [nsUrlInput, setNsUrlInput] = useState(() => localStorage.getItem("ns_url") ?? "");
  const [showConfig, setShowConfig] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [remaining, setRemaining] = useState(POLL_INTERVAL);

  const containerRef = useRef<HTMLDivElement>(null);
  const lastFetchRef = useRef(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevHypoRef = useRef(false);

  // Derived
  const current = readings[0] ?? null;
  const previous = readings[1] ?? null;
  const delta = current && previous ? Math.round((current.mmol - previous.mmol) * 10) / 10 : null;
  const alert = current ? getAlertLevel(current.mmol) : null;
  const last3h = readings.slice(0, HISTORY_COUNT).reverse();

  const avg3h = last3h.length > 0 ? last3h.reduce((s, r) => s + r.mmol, 0) / last3h.length : 0;
  const min3h = last3h.length > 0 ? Math.min(...last3h.map((r) => r.mmol)) : 0;
  const max3h = last3h.length > 0 ? Math.max(...last3h.map((r) => r.mmol)) : 0;

  /* ── Fetch ───────────────────────────────────────────────────────────── */

  async function fetchReadings() {
    try {
      setError(null);
      const res = await fetch(`${API}/api/nightscout/sync`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: nsUrl || undefined }),
      });
      if (!res.ok) throw new Error(`Sync failed (${res.status})`);
      const data = await res.json();

      // Expect data.entries as an array of Nightscout SGV entries sorted newest first
      const entries: GlucoseEntry[] = (data.entries ?? data ?? []).map((e: any) => ({
        sgv: e.sgv,
        mmol: toMmol(e.sgv),
        direction: e.direction ?? "Flat",
        dateString: e.dateString ?? new Date(e.date).toISOString(),
        date: e.date ?? new Date(e.dateString).getTime(),
      }));

      setReadings(entries);
      setConnectionStatus("connected");
      lastFetchRef.current = Date.now();
      setRemaining(POLL_INTERVAL);

      // Hypo sound alert
      if (entries.length > 0 && entries[0].mmol < 3.9) {
        if (soundEnabled && !prevHypoRef.current) playHypoBeep();
        prevHypoRef.current = true;
      } else {
        prevHypoRef.current = false;
      }
    } catch (err: any) {
      setError(err.message ?? "Failed to fetch readings");
      setConnectionStatus("disconnected");
    } finally {
      setLoading(false);
    }
  }

  /* ── Effects ─────────────────────────────────────────────────────────── */

  // Initial fetch + polling
  useEffect(() => {
    fetchReadings();

    if (!paused) {
      pollRef.current = setInterval(() => fetchReadings(), POLL_INTERVAL);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, nsUrl]);

  // 1-second tick for timeSince + countdown + stale check
  useEffect(() => {
    timerRef.current = setInterval(() => {
      if (current) setTimeSinceStr(timeSince(current.date));

      // Countdown
      const elapsed = Date.now() - lastFetchRef.current;
      setRemaining(Math.max(0, POLL_INTERVAL - elapsed));

      // Stale detection
      if (current && Date.now() - current.date > STALE_THRESHOLD) {
        setConnectionStatus("stale");
      }
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [current]);

  // Sound preference
  useEffect(() => {
    localStorage.setItem("cgm_sound", String(soundEnabled));
  }, [soundEnabled]);

  // Fullscreen change listener
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  /* ── Handlers ────────────────────────────────────────────────────────── */

  function saveNsUrl() {
    const trimmed = nsUrlInput.trim().replace(/\/+$/, "");
    localStorage.setItem("ns_url", trimmed);
    setNsUrl(trimmed);
    setShowConfig(false);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  /* ── Styles ──────────────────────────────────────────────────────────── */

  const s = {
    page: {
      minHeight: "100vh",
      background: "var(--bg-primary)",
      fontFamily: "'DM Sans', system-ui, sans-serif",
      color: "var(--text-primary)",
    } as React.CSSProperties,
    inner: {
      maxWidth: 960,
      margin: "0 auto",
      padding: "clamp(16px, 4vw, 32px)",
    } as React.CSSProperties,
    card: {
      background: "var(--bg-card)",
      border: "1px solid var(--border-light)",
      borderRadius: 12,
      padding: 20,
    } as React.CSSProperties,
    heading: {
      fontFamily: "'Playfair Display', serif",
      fontSize: "clamp(22px, 4vw, 30px)",
      fontWeight: 700,
      margin: 0,
    } as React.CSSProperties,
    mono: {
      fontFamily: "'JetBrains Mono', monospace",
    } as React.CSSProperties,
  };

  const pulseKeyframes = `@keyframes pulse-red { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }`;
  const isLowPulse = current && current.mmol < 3.9;
  const rangeColor = current ? getRangeColor(current.mmol) : "var(--border-light)";

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div ref={containerRef} style={s.page}>
      <style>{pulseKeyframes}</style>
      <div style={s.inner}>

        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
          <h1 style={s.heading}>CGM Live Monitor</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            {/* Connection status */}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)" }}>
              <span style={{
                width: 8, height: 8, borderRadius: "50%", display: "inline-block",
                background: connectionStatus === "connected" ? "#38a169" : connectionStatus === "stale" ? "#d69e2e" : "#e53e3e",
              }} />
              {connectionStatus === "connected" ? "Connected" : connectionStatus === "stale" ? "Stale (>10min)" : "Disconnected"}
            </span>
            <CountdownRing remaining={remaining} total={POLL_INTERVAL} />
          </div>
        </div>

        {/* Alert badge */}
        {alert && (
          <div style={{
            marginBottom: 16, padding: "8px 16px", borderRadius: 8, fontWeight: 700, fontSize: 14,
            textAlign: "center", letterSpacing: 1,
            background: alert === "URGENT" ? "#e53e3e" : alert === "LOW" ? "#e53e3e" : "#d69e2e",
            color: "#fff",
            animation: alert === "URGENT" ? "pulse-red 1s ease-in-out infinite" : undefined,
          }}>
            {alert === "URGENT" ? "⚠ URGENT LOW" : alert === "LOW" ? "⚠ LOW GLUCOSE" : "⚠ HIGH GLUCOSE"}
          </div>
        )}

        {/* Main glucose display */}
        <div style={{
          ...s.card,
          textAlign: "center",
          marginBottom: 20,
          borderColor: rangeColor,
          borderWidth: 2,
          animation: isLowPulse ? "pulse-red 1.2s ease-in-out infinite" : undefined,
        }}>
          {loading && !current ? (
            <div style={{ padding: 40, color: "var(--text-faint)" }}>Loading...</div>
          ) : error && !current ? (
            <div style={{ padding: 40, color: "#e53e3e" }}>{error}</div>
          ) : current ? (
            <>
              <div style={{
                ...s.mono,
                fontSize: "clamp(48px, 12vw, 80px)",
                fontWeight: 700,
                lineHeight: 1.1,
                color: rangeColor,
              }}>
                {formatGlucose(current.mmol, units)}
                <span style={{ fontSize: "clamp(28px, 6vw, 48px)", marginLeft: 8 }}>
                  {TREND_ARROWS[current.direction] ?? "?"}
                </span>
              </div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", marginTop: 4 }}>
                {getUnitLabel(units)}
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 12, fontSize: 14 }}>
                <span style={{ color: "var(--text-faint)" }}>{timeSinceStr}</span>
                {delta !== null && (
                  <span style={{ ...s.mono, color: delta > 0 ? "#d69e2e" : delta < 0 ? "#3182ce" : "var(--text-secondary)" }}>
                    {delta > 0 ? "+" : ""}{formatGlucose(Math.abs(delta) + (units === "mg" ? 0 : 0), units === "mmol" ? "mmol" : "mg")}
                    {/* Show raw delta in correct unit */}
                    {delta > 0 ? " ↑" : delta < 0 ? " ↓" : " →"}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div style={{ padding: 40, color: "var(--text-faint)" }}>No data</div>
          )}
        </div>

        {/* Stats bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
          {[
            { label: "Current", value: current ? formatGlucose(current.mmol, units) : "--" },
            { label: "Avg (3h)", value: avg3h ? formatGlucose(avg3h, units) : "--" },
            { label: "Min (3h)", value: min3h ? formatGlucose(min3h, units) : "--" },
            { label: "Max (3h)", value: max3h ? formatGlucose(max3h, units) : "--" },
          ].map((stat) => (
            <div key={stat.label} style={{ ...s.card, textAlign: "center", padding: 14 }}>
              <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
                {stat.label}
              </div>
              <div style={{ ...s.mono, fontSize: 22, fontWeight: 700 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{getUnitLabel(units)}</div>
            </div>
          ))}
        </div>

        {/* Sparkline chart */}
        <div style={{ ...s.card, marginBottom: 20 }}>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8, fontWeight: 600 }}>
            Last 3 Hours
          </div>
          <Sparkline readings={last3h} units={units} />
        </div>

        {/* Controls row */}
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20, alignItems: "center",
        }}>
          {/* Pause/Resume */}
          <button
            onClick={() => setPaused((p) => !p)}
            style={{
              ...s.mono, fontSize: 13, padding: "8px 16px", borderRadius: 8,
              border: "1px solid var(--border-light)", background: "var(--bg-card)",
              color: "var(--text-primary)", cursor: "pointer",
            }}
          >
            {paused ? "▶ Resume" : "⏸ Pause"}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            style={{
              ...s.mono, fontSize: 13, padding: "8px 16px", borderRadius: 8,
              border: "1px solid var(--border-light)", background: "var(--bg-card)",
              color: "var(--text-primary)", cursor: "pointer",
            }}
          >
            {isFullscreen ? "⊡ Exit Fullscreen" : "⊞ Fullscreen"}
          </button>

          {/* Sound toggle */}
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              style={{ accentColor: "var(--accent-teal)" }}
            />
            Hypo sound alert
          </label>

          {/* Config toggle */}
          <button
            onClick={() => setShowConfig((v) => !v)}
            style={{
              ...s.mono, fontSize: 13, padding: "8px 16px", borderRadius: 8,
              border: "1px solid var(--border-light)", background: "var(--bg-card)",
              color: "var(--text-secondary)", cursor: "pointer", marginLeft: "auto",
            }}
          >
            ⚙ Nightscout
          </button>
        </div>

        {/* Nightscout URL config (collapsible) */}
        {showConfig && (
          <div style={{ ...s.card, marginBottom: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Nightscout URL</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="url"
                placeholder="https://your-site.herokuapp.com"
                value={nsUrlInput}
                onChange={(e) => setNsUrlInput(e.target.value)}
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 14,
                  border: "1px solid var(--border-light)", background: "var(--bg-primary)",
                  color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace",
                }}
              />
              <button
                onClick={saveNsUrl}
                style={{
                  padding: "8px 20px", borderRadius: 8, border: "none",
                  background: "var(--accent-teal)", color: "#fff", fontWeight: 600,
                  fontSize: 14, cursor: "pointer",
                }}
              >
                Save
              </button>
            </div>
            <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 6 }}>
              Stored locally. Used for Nightscout API sync.
            </div>
          </div>
        )}

        {/* Error banner */}
        {error && current && (
          <div style={{
            ...s.card, marginBottom: 20, borderColor: "#e53e3e",
            fontSize: 13, color: "#e53e3e",
          }}>
            Sync error: {error} — showing last known data.
          </div>
        )}

        {/* Disclaimer */}
        <div style={{
          marginTop: 32, padding: 16, borderRadius: 8,
          background: "var(--bg-card)", border: "1px solid var(--border-light)",
          fontSize: 12, color: "var(--text-faint)", lineHeight: 1.6, textAlign: "center",
        }}>
          {DISCLAIMER}
        </div>
      </div>
    </div>
  );
}
