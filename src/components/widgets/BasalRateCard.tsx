/**
 * GluMira™ V7 — Basal Rate Card
 *
 * Wraps the existing BasalEvalGauge with live data from
 * GET /api/analytics/basal-evaluation.
 *
 * Source: GET /api/analytics/basal-evaluation?days=14
 * Logic:  server/analytics/basal-evaluation.ts
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { API } from "@/lib/api";
import BasalEvalGauge from "@/components/charts/BasalEvalGauge";

type ObservationType = "positive" | "warning" | "alert";

type Observation = {
  type: ObservationType;
  text: string;
}

type BasalEvalResponse = {
  ok: boolean;
  score: number;
  meanDrift: number | null;
  validNights: number;
  hypoNights: number;
  hyperNights: number;
  observations: Observation[];
  windowDays: number;
  computedAt: string;
}

export default function BasalRateCard() {
  const { session } = useAuth();
  const [data, setData] = useState<BasalEvalResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`${API}/api/analytics/basal-evaluation?days=14`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`API ${r.status}`);
        return r.json() as Promise<BasalEvalResponse>;
      })
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e?.message ?? "Failed"); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [session]);

  /* ─── Card chrome (header + footer wraps the gauge) ──────────────────── */
  const cardStyle: React.CSSProperties = {
    background: "var(--bg-card)",
    borderRadius: 12,
    border: "1px solid var(--border-light)",
    padding: 0,
    overflow: "hidden",
  };

  const headerStyle: React.CSSProperties = {
    padding: "16px 20px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
  };

  const titleStyle: React.CSSProperties = {
    margin: 0, fontSize: 16, fontWeight: 700,
    color: "var(--text-primary)", fontFamily: "'Playfair Display', serif",
  };

  const tagStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, color: "var(--text-faint)",
    fontFamily: "'JetBrains Mono', monospace", letterSpacing: 0.5,
  };

  const footerStyle: React.CSSProperties = {
    padding: "8px 20px 16px",
    fontSize: 10, color: "var(--text-faint)",
    fontFamily: "'DM Sans', system-ui, sans-serif",
  };

  if (loading) {
    return (
      <div style={cardStyle} aria-busy="true">
        <div style={headerStyle}>
          <h3 style={titleStyle}>Basal Rate</h3>
          <span style={tagStyle}>14 NIGHTS</span>
        </div>
        <p style={{ padding: "16px 20px", margin: 0, fontSize: 12, color: "var(--text-faint)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Loading…
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={cardStyle} role="alert">
        <div style={headerStyle}>
          <h3 style={titleStyle}>Basal Rate</h3>
          <span style={tagStyle}>14 NIGHTS</span>
        </div>
        <p style={{ padding: "16px 20px", margin: 0, fontSize: 13, color: "var(--text-secondary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
          Unable to load basal evaluation data.
        </p>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>Basal Rate</h3>
        <span style={tagStyle}>14 NIGHTS</span>
      </div>

      {/* The gauge supplies its own card chrome via inline styles, so we
          let it render edge-to-edge inside our wrapper. */}
      <BasalEvalGauge
        score={data.score}
        observations={data.observations}
      />

      <p style={footerStyle}>
        {data.validNights} valid nights · {data.hypoNights} hypo · {data.hyperNights} hyper
        {data.meanDrift != null && <> · drift {data.meanDrift >= 0 ? "+" : ""}{data.meanDrift.toFixed(1)} mmol/L</>}
      </p>
    </div>
  );
}
