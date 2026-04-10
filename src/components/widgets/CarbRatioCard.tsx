/**
 * GluMira™ V7 — Carb Ratio Card
 *
 * Compares the user's configured insulin-to-carb ratio (ICR, from profile)
 * against an observed effective ratio derived from logged meal_bolus events
 * and post-meal glucose excursion.
 *
 * Source: GET /api/analytics/carb-ratio?days=14
 * Logic:  server/analytics/carb-ratio.ts
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { API } from "@/lib/api";

type CarbRatioResponse = {
  ok: boolean;
  configuredIcr: number | null;
  observedGramsPerUnit: number | null;
  meanRise: number | null;
  meanDelta: number | null;
  qualifiedMeals: number;
  totalMeals: number;
  windowDays: number;
  recommendation: "tighten" | "relax" | "balanced" | "insufficient";
  recommendationText: string;
  computedAt: string;
}

const RECO_COLOUR: Record<CarbRatioResponse["recommendation"], string> = {
  tighten:      "#ef4444",
  relax:        "#f59e0b",
  balanced:     "#22c55e",
  insufficient: "#94a3b8",
};

const RECO_LABEL: Record<CarbRatioResponse["recommendation"], string> = {
  tighten:      "Under-dosed",
  relax:        "Over-dosed",
  balanced:     "Balanced",
  insufficient: "—",
};

export default function CarbRatioCard() {
  const { session } = useAuth();
  const [data, setData] = useState<CarbRatioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API}/api/analytics/carb-ratio?days=14`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`API ${r.status}`);
        return r.json() as Promise<CarbRatioResponse>;
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
        Carb Ratio (ICR)
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
          Unable to load carb-ratio data.
        </p>
      </div>
    );
  }

  const recoColour = RECO_COLOUR[data.recommendation];
  const recoLabel  = RECO_LABEL[data.recommendation];

  /* ─── Insufficient ───────────────────────────────────────────────────── */
  if (data.recommendation === "insufficient") {
    return (
      <div style={cardStyle}>
        {headerRow}
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
          <p style={{
            margin: 0, fontSize: 28, fontWeight: 700,
            color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace",
          }}>
            {data.configuredIcr != null ? `1:${data.configuredIcr}` : "—"}
          </p>
          <span style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
            configured
          </span>
        </div>
        <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          {data.recommendationText}
        </p>
        <p style={{ margin: "6px 0 0", fontSize: 10, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          {data.totalMeals} meal-bolus events found · need ≥10g carbs + paired glucose
        </p>
      </div>
    );
  }

  /* ─── Populated ──────────────────────────────────────────────────────── */
  return (
    <div style={cardStyle}>
      {headerRow}

      {/* Headline: configured vs observed */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        gap: 12,
        marginBottom: 14,
      }}>
        <div>
          <p style={{
            margin: 0, fontSize: 10, fontWeight: 600,
            color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 0.4,
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            Configured
          </p>
          <p style={{
            margin: "2px 0 0", fontSize: 24, fontWeight: 700,
            color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace",
          }}>
            {data.configuredIcr != null ? `1:${data.configuredIcr}` : "—"}
          </p>
        </div>

        <span style={{ fontSize: 18, color: "var(--text-faint)" }}>{"\u2192"}</span>

        <div>
          <p style={{
            margin: 0, fontSize: 10, fontWeight: 600,
            color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: 0.4,
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            Observed
          </p>
          <p style={{
            margin: "2px 0 0", fontSize: 24, fontWeight: 700,
            color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace",
          }}>
            1:{data.observedGramsPerUnit?.toFixed(0) ?? "—"}
          </p>
        </div>
      </div>

      {/* Verdict pill */}
      <div style={{
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: 999,
        background: recoColour + "1A",
        color: recoColour,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        textTransform: "uppercase",
        letterSpacing: 0.4,
        marginBottom: 12,
      }}>
        {recoLabel}
      </div>

      {/* Secondary metrics */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
        paddingTop: 12,
        borderTop: "1px solid var(--border-divider, var(--border-light))",
      }}>
        <Metric label="Mean peak rise"  value={`${(data.meanRise  ?? 0).toFixed(1)} mmol/L`} />
        <Metric label="4h return delta" value={`${(data.meanDelta ?? 0) >= 0 ? "+" : ""}${(data.meanDelta ?? 0).toFixed(1)} mmol/L`} />
      </div>

      {/* Recommendation text */}
      <p style={{
        margin: "12px 0 0", fontSize: 12, lineHeight: 1.5,
        color: "var(--text-secondary)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        {data.recommendationText}
      </p>

      <p style={{
        margin: "8px 0 0", fontSize: 10, color: "var(--text-faint)",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}>
        Based on {data.qualifiedMeals} of {data.totalMeals} meal-bolus events · educational only
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
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
        margin: "2px 0 0", fontSize: 14, fontWeight: 700,
        color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace",
      }}>
        {value}
      </p>
    </div>
  );
}
