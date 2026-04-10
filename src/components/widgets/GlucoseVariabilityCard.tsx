/**
 * GluMira™ V7 — Glucose Variability Card
 *
 * Displays 7-day coefficient of variation (CV%) with stability label,
 * SD, mean, reading count, and TIR delta vs 14-day baseline.
 *
 * Source: GET /api/analytics/summary  (server/routes/analytics.route.ts)
 *         Computed by server/analytics/analytics-summary.ts
 *
 * Stability thresholds (ADA / international consensus):
 *   CV ≤ 33%   → Stable    (target)
 *   33–36%     → Moderate
 *   CV > 36%   → Unstable
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { API } from "@/lib/api";
import { useGlucoseUnits } from "@/context/GlucoseUnitsContext";
import { formatGlucose, getUnitLabel } from "@/utils/glucose-units";

type PeriodSummary = {
  days: number; count: number; mean: number; sd: number; cv: number;
  min: number; max: number;
  tirPercent: number; belowPercent: number; abovePercent: number;
  gmi: number; patterns: string[];
}

type AnalyticsSummary = {
  sevenDay: PeriodSummary;
  fourteenDay: PeriodSummary;
  tirDelta: number;
  gmiDelta: number;
  computedAt: string;
}

type SummaryResponse = {
  ok: boolean;
  summary: AnalyticsSummary;
  disclaimer: string;
}

type Stability = { label: "Stable" | "Moderate" | "Unstable"; colour: string };

function classifyStability(cv: number): Stability {
  if (cv <= 33) return { label: "Stable",   colour: "#22c55e" };
  if (cv <= 36) return { label: "Moderate", colour: "#f59e0b" };
  return         { label: "Unstable", colour: "#ef4444" };
}

export default function GlucoseVariabilityCard() {
  const { session } = useAuth();
  const { units } = useGlucoseUnits();
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API}/api/analytics/summary`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`API ${r.status}`);
        return r.json() as Promise<SummaryResponse>;
      })
      .then((data) => {
        if (cancelled) return;
        setSummary(data.summary);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e?.message ?? "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [session]);

  /* ─── Card chrome (shared across all states) ─────────────────────────── */
  const cardStyle: React.CSSProperties = {
    background: "var(--bg-card)",
    borderRadius: 12,
    border: "1px solid var(--border-light)",
    padding: 20,
  };

  const titleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-secondary)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: "'DM Sans', system-ui, sans-serif",
  };

  /* ─── Loading ────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={cardStyle} aria-busy="true" aria-label="Loading glucose variability">
        <p style={titleStyle}>Glucose Variability</p>
        <p style={{
          margin: "4px 0 0", fontSize: 32, fontWeight: 700,
          color: "var(--border-light)", fontFamily: "'JetBrains Mono', monospace",
        }}>
          &mdash;
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Loading…
        </p>
      </div>
    );
  }

  /* ─── Error ──────────────────────────────────────────────────────────── */
  if (error || !summary) {
    return (
      <div style={cardStyle} role="alert">
        <p style={titleStyle}>Glucose Variability</p>
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Unable to load variability data.
        </p>
      </div>
    );
  }

  const seven = summary.sevenDay;

  /* ─── Empty (no readings yet) ────────────────────────────────────────── */
  if (seven.count === 0) {
    return (
      <div style={cardStyle}>
        <p style={titleStyle}>Glucose Variability</p>
        <p style={{
          margin: "4px 0 0", fontSize: 32, fontWeight: 700,
          color: "var(--border-light)", fontFamily: "'JetBrains Mono', monospace",
        }}>
          &mdash;
        </p>
        <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Not enough readings in the last 7 days
        </p>
      </div>
    );
  }

  /* ─── Populated ──────────────────────────────────────────────────────── */
  const stability = classifyStability(seven.cv);
  const tirDelta = summary.tirDelta;
  const tirArrow = tirDelta > 0.1 ? "\u2191" : tirDelta < -0.1 ? "\u2193" : "\u2192";
  const tirDeltaColour = tirDelta > 0.1 ? "#22c55e" : tirDelta < -0.1 ? "#ef4444" : "var(--text-secondary)";
  const unitLabel = getUnitLabel(units);

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <p style={titleStyle}>Glucose Variability</p>
        <span style={{
          fontSize: 10, fontWeight: 600, color: "var(--text-faint)",
          fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
        }}>
          7 DAYS
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
        <p style={{
          margin: 0, fontSize: 32, fontWeight: 700,
          color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace",
        }}>
          {seven.cv.toFixed(1)}<span style={{ fontSize: 16, marginLeft: 2 }}>%</span>
        </p>
        <span style={{
          padding: "3px 10px",
          borderRadius: 999,
          background: stability.colour + "1A", // ~10% alpha
          color: stability.colour,
          fontSize: 11,
          fontWeight: 700,
          fontFamily: "'DM Sans', system-ui, sans-serif",
          textTransform: "uppercase",
          letterSpacing: 0.4,
        }}>
          {stability.label}
        </span>
      </div>

      <p style={{
        margin: "2px 0 12px", fontSize: 11, color: "var(--text-faint)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        CV — coefficient of variation
      </p>

      {/* ── Secondary metrics ─────────────────────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
        paddingTop: 12,
        borderTop: "1px solid var(--border-divider, var(--border-light))",
      }}>
        <Metric label={`SD (${unitLabel})`}    value={formatGlucose(seven.sd, units)} />
        <Metric label={`Mean (${unitLabel})`}  value={formatGlucose(seven.mean, units)} />
        <Metric label="Time in Range"          value={`${seven.tirPercent.toFixed(0)}%`} />
        <Metric
          label="vs 14d TIR"
          value={`${tirArrow} ${tirDelta >= 0 ? "+" : ""}${tirDelta.toFixed(1)}%`}
          valueColour={tirDeltaColour}
        />
      </div>

      <p style={{
        margin: "12px 0 0", fontSize: 10, color: "var(--text-faint)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        {seven.count} readings · 7 day window
      </p>
    </div>
  );
}

/* ─── Internal sub-component ───────────────────────────────────────────── */
function Metric({ label, value, valueColour }: { label: string; value: string; valueColour?: string }) {
  return (
    <div>
      <p style={{
        margin: 0, fontSize: 10, fontWeight: 600,
        color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 0.4,
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        {label}
      </p>
      <p style={{
        margin: "2px 0 0", fontSize: 15, fontWeight: 700,
        color: valueColour ?? "var(--text-primary)",
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {value}
      </p>
    </div>
  );
}
