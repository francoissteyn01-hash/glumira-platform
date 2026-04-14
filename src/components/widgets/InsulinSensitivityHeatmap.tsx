/**
 * GluMira™ V7 — Insulin Sensitivity Heatmap
 *
 * 24-cell horizontal heatmap visualising hour-of-day insulin sensitivity
 * (mmol/L per unit) derived from historical correction-bolus events.
 *
 * Source: GET /api/analytics/insulin-sensitivity?days=14
 * Logic:  server/analytics/insulin-sensitivity.ts
 *
 * Cells with insufficient samples (<2) render in muted grey.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { API } from "@/lib/api";

type HourBucket = {
  hour: number;
  isfEstimate: number | null;
  sampleCount: number;
}

type SensitivityResponse = {
  ok: boolean;
  bucketsByHour: HourBucket[];
  totalEvents: number;
  usedEvents: number;
  windowDays: number;
  computedAt: string;
}

/* Heat scale for ISF (mmol/L per unit). Higher = more sensitive (cooler colours). */
function heatColour(isf: number, vmax: number): string {
  if (isf <= 0) return "#cbd5e1"; // negative or zero — grey
  const t = Math.min(1, isf / vmax);
  // Interpolate across a teal → coral palette: low ISF (resistant) = warm, high ISF (sensitive) = cool
  // Reverse it: high ISF = teal, low = coral
  const r = Math.round(245 + (42  - 245) * t);
  const g = Math.round(101 + (181 - 101) * t);
  const b = Math.round(101 + (193 - 101) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function InsulinSensitivityHeatmap() {
  const { session } = useAuth();
  const [data, setData] = useState<SensitivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API}/api/analytics/insulin-sensitivity?days=14`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`API ${r.status}`);
        return r.json() as Promise<SensitivityResponse>;
      })
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e?.message ?? "Failed"); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [session]);

  /* ─── Card chrome ────────────────────────────────────────────────────── */
  const cardStyle: React.CSSProperties = {
    background: "var(--bg-card)",
    borderRadius: 12,
    border: "1px solid var(--border-light)",
    padding: 20,
  };

  const headerRow = (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
      <h3 style={{
        margin: 0, fontSize: 16, fontWeight: 700,
        color: "var(--text-primary)", fontFamily: "'Playfair Display', serif",
      }}>
        Insulin Sensitivity by Hour
      </h3>
      <span style={{
        fontSize: 10, fontWeight: 600, color: "var(--text-faint)",
        fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
      }}>
        14 DAYS
      </span>
    </div>
  );

  if (loading) {
    return (
      <div style={cardStyle} aria-busy="true">
        {headerRow}
        <p style={{ margin: 0, fontSize: 12, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Loading…
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={cardStyle} role="alert">
        {headerRow}
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Unable to load sensitivity data.
        </p>
      </div>
    );
  }

  if (data.usedEvents === 0) {
    return (
      <div style={cardStyle}>
        {headerRow}
        <p style={{ margin: 0, fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Not enough correction-bolus events with paired glucose readings yet.
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Log corrections + keep CGM data flowing for 7+ days to see your hourly pattern.
        </p>
      </div>
    );
  }

  /* ─── Populated ──────────────────────────────────────────────────────── */
  const valid = data.bucketsByHour.filter((b) => b.isfEstimate !== null) as Required<HourBucket>[];
  const vmax = Math.max(...valid.map((b) => b.isfEstimate!), 1);
  const vmin = Math.min(...valid.map((b) => b.isfEstimate!), 0);

  return (
    <div style={cardStyle}>
      {headerRow}

      {/* Heatmap row: 24 cells in a horizontal grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(24, 1fr)",
        gap: 2,
        marginBottom: 8,
      }}>
        {data.bucketsByHour.map((b) => {
          const hasData = b.isfEstimate !== null;
          const bg = hasData ? heatColour(b.isfEstimate!, vmax) : "var(--card-hover, #f1f5f9)";
          const tooltip = hasData
            ? `${String(b.hour).padStart(2, "0")}:00 — ISF ${b.isfEstimate!.toFixed(1)} mmol/L per U  (n=${b.sampleCount})`
            : `${String(b.hour).padStart(2, "0")}:00 — insufficient data`;
          return (
            <div
              key={b.hour}
              title={tooltip}
              aria-label={tooltip}
              style={{
                aspectRatio: "1",
                minHeight: 28,
                background: bg,
                borderRadius: 3,
                opacity: hasData ? 1 : 0.4,
              }}
            />
          );
        })}
      </div>

      {/* Hour-axis labels (every 6 hours) */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(24, 1fr)",
        gap: 2,
        marginBottom: 14,
        fontSize: 9,
        color: "var(--text-faint)",
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {Array.from({ length: 24 }, (_, h) => (
          <span key={h} style={{ textAlign: "center" }}>
            {h % 6 === 0 ? String(h).padStart(2, "0") : ""}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 11, color: "var(--text-secondary)",
        fontFamily: "'DM Sans', system-ui, sans-serif", marginBottom: 8,
      }}>
        <span>Less sensitive ({vmin.toFixed(1)})</span>
        <div style={{
          flex: 1, margin: "0 12px", height: 6, borderRadius: 3,
          background: "linear-gradient(to right, rgb(245,101,101), rgb(42,181,193))",
        }} />
        <span>More sensitive ({vmax.toFixed(1)})</span>
      </div>

      {/* Footer stats */}
      <p style={{
        margin: 0, fontSize: 10, color: "var(--text-faint)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        {data.usedEvents} of {data.totalEvents} corrections used · ISF in mmol/L per unit ·
        {" "}educational only
      </p>
    </div>
  );
}
