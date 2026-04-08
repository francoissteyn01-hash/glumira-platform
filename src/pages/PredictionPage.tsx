/**
 * GluMira™ V7 — AI Prediction Dashboard
 * Blocks 52-54: Glucose prediction visualisation with confidence bands.
 * Scandinavian Minimalist design (#f8f9fa bg, #1a2a5e navy, #2ab5c1 teal).
 */

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGlucoseUnits } from "@/context/GlucoseUnitsContext";
import { formatGlucose, displayGlucose, getUnitLabel } from "@/utils/glucose-units";
import { DISCLAIMER } from "@/lib/constants";
import { predictGlucose, type PredictionInput, type GlucosePrediction } from "@/lib/prediction-engine";

/* ─── Design Tokens ──────────────────────────────────────────────────────── */

const NAVY = "#1a2a5e";
const TEAL = "#2ab5c1";
const BG = "#f8f9fa";
const RED = "#e74c3c";
const AMBER = "#f59e0b";
const GREEN = "#27ae60";
const MUTED = "#6b7280";

const ZONE_COLORS = {
  veryHigh: "#e74c3c22",
  high: "#f59e0b22",
  target: "#27ae6022",
  low: "#e74c3c22",
};

/* ─── Trend Arrows ───────────────────────────────────────────────────────── */

const TREND_ARROWS: Record<GlucosePrediction["trend"], { arrow: string; label: string; color: string }> = {
  rising_fast: { arrow: "⇈", label: "Rising Fast", color: RED },
  rising: { arrow: "↑", label: "Rising", color: AMBER },
  stable: { arrow: "→", label: "Stable", color: GREEN },
  falling: { arrow: "↓", label: "Falling", color: AMBER },
  falling_fast: { arrow: "⇊", label: "Falling Fast", color: RED },
};

/* ─── Mock data generator (used when no live data) ───────────────────────── */

function generateMockInput(currentTime: string): PredictionInput {
  const now = new Date(currentTime).getTime();
  const readings = [];
  let val = 6.5;
  for (let i = 8; i >= 0; i--) {
    val += (Math.random() - 0.48) * 0.4;
    val = Math.max(3.5, Math.min(15, val));
    readings.push({
      value: Math.round(val * 10) / 10,
      time: new Date(now - i * 15 * 60_000).toISOString(),
      units: "mmol" as const,
    });
  }

  return {
    recentReadings: readings,
    activeIOB: 1.2,
    recentCarbs: [{ grams: 45, time: new Date(now - 90 * 60_000).toISOString() }],
    recentExercise: [],
    basalRate: 0.8,
    currentTime,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  SVG Chart Component                                                      */
/* ═══════════════════════════════════════════════════════════════════════════ */

interface ChartProps {
  pastReadings: { value: number; time: string }[];
  predictions: GlucosePrediction["predictions"];
  units: "mmol" | "mg";
}

function PredictionChart({ pastReadings, predictions, units }: ChartProps) {
  const W = 880;
  const H = 320;
  const PAD = { top: 24, right: 24, bottom: 40, left: 52 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  // Combine all values for Y range
  const allValues = [
    ...pastReadings.map((r) => r.value),
    ...predictions.map((p) => p.value),
  ];
  const yMin = Math.max(1, Math.min(...allValues) - 1);
  const yMax = Math.max(...allValues) + 1;

  // Time range: 4h past to 4h future
  const allTimes = [
    ...pastReadings.map((r) => new Date(r.time).getTime()),
    ...predictions.map((p) => new Date(p.time).getTime()),
  ];
  const tMin = Math.min(...allTimes);
  const tMax = Math.max(...allTimes);

  const xScale = (t: number) => PAD.left + ((t - tMin) / (tMax - tMin)) * plotW;
  const yScale = (v: number) => PAD.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  // Zone boundaries (mmol/L)
  const zones = [
    { min: 0, max: 3.9, color: ZONE_COLORS.low },
    { min: 3.9, max: 10, color: ZONE_COLORS.target },
    { min: 10, max: 13.9, color: ZONE_COLORS.high },
    { min: 13.9, max: 30, color: ZONE_COLORS.veryHigh },
  ];

  // Past readings path
  const pastPath = pastReadings
    .map((r, i) => {
      const x = xScale(new Date(r.time).getTime());
      const y = yScale(r.value);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  // Prediction path
  const lastPast = pastReadings[pastReadings.length - 1];
  const predPoints = [
    ...(lastPast ? [{ value: lastPast.value, time: lastPast.time, confidence: 1 }] : []),
    ...predictions,
  ];
  const predPath = predPoints
    .map((p, i) => {
      const x = xScale(new Date(p.time).getTime());
      const y = yScale(p.value);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  // Confidence band
  const bandUpper = predPoints.map((p) => {
    const spread = (1 - p.confidence) * 2.5;
    return { x: xScale(new Date(p.time).getTime()), y: yScale(Math.min(yMax, p.value + spread)) };
  });
  const bandLower = predPoints.map((p) => {
    const spread = (1 - p.confidence) * 2.5;
    return { x: xScale(new Date(p.time).getTime()), y: yScale(Math.max(yMin, p.value - spread)) };
  });
  const bandPath =
    bandUpper.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") +
    " " +
    [...bandLower].reverse().map((p, i) => `${i === 0 ? "L" : "L"}${p.x},${p.y}`).join(" ") +
    " Z";

  // Time labels
  const timeLabels: { x: number; label: string }[] = [];
  const step = (tMax - tMin) / 8;
  for (let i = 0; i <= 8; i++) {
    const t = tMin + step * i;
    const d = new Date(t);
    timeLabels.push({
      x: xScale(t),
      label: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  }

  // Y-axis labels
  const yLabels: { y: number; label: string }[] = [];
  const yStep = (yMax - yMin) / 5;
  for (let i = 0; i <= 5; i++) {
    const v = yMin + yStep * i;
    yLabels.push({
      y: yScale(v),
      label: units === "mg" ? `${Math.round(v * 18)}` : v.toFixed(1),
    });
  }

  // "Now" line
  const nowX = lastPast ? xScale(new Date(lastPast.time).getTime()) : W / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W, height: "auto" }}>
      {/* Zones */}
      {zones.map((z, i) => {
        const top = yScale(Math.min(yMax, z.max));
        const bottom = yScale(Math.max(yMin, z.min));
        if (bottom <= top) return null;
        return <rect key={i} x={PAD.left} y={top} width={plotW} height={bottom - top} fill={z.color} />;
      })}

      {/* Grid lines */}
      {yLabels.map((l, i) => (
        <line key={i} x1={PAD.left} y1={l.y} x2={W - PAD.right} y2={l.y} stroke="#e5e7eb" strokeWidth={0.5} />
      ))}

      {/* Now line */}
      <line x1={nowX} y1={PAD.top} x2={nowX} y2={H - PAD.bottom} stroke={NAVY} strokeWidth={1} strokeDasharray="4 4" opacity={0.4} />
      <text x={nowX} y={PAD.top - 6} textAnchor="middle" fontSize={10} fill={NAVY} fontFamily="Inter, sans-serif">Now</text>

      {/* Confidence band */}
      <path d={bandPath} fill={TEAL} opacity={0.12} />

      {/* Past readings */}
      <path d={pastPath} fill="none" stroke={NAVY} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {pastReadings.map((r, i) => (
        <circle key={i} cx={xScale(new Date(r.time).getTime())} cy={yScale(r.value)} r={3} fill={NAVY} />
      ))}

      {/* Prediction line */}
      <path d={predPath} fill="none" stroke={TEAL} strokeWidth={2} strokeDasharray="6 4" strokeLinecap="round" />
      {predictions.map((p, i) => (
        <circle key={i} cx={xScale(new Date(p.time).getTime())} cy={yScale(p.value)} r={3.5} fill={TEAL} stroke="#fff" strokeWidth={1.5} />
      ))}

      {/* Axes */}
      {timeLabels.map((l, i) => (
        <text key={i} x={l.x} y={H - PAD.bottom + 18} textAnchor="middle" fontSize={10} fill={MUTED} fontFamily="Inter, sans-serif">{l.label}</text>
      ))}
      {yLabels.map((l, i) => (
        <text key={i} x={PAD.left - 8} y={l.y + 4} textAnchor="end" fontSize={10} fill={MUTED} fontFamily="Inter, sans-serif">{l.label}</text>
      ))}
      <text x={4} y={H / 2} textAnchor="middle" fontSize={10} fill={MUTED} fontFamily="Inter, sans-serif" transform={`rotate(-90, 10, ${H / 2})`}>
        {getUnitLabel(units)}
      </text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Page                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function PredictionPage() {
  const { user, session } = useAuth();
  const { units } = useGlucoseUnits();
  const [prediction, setPrediction] = useState<GlucosePrediction | null>(null);
  const [input, setInput] = useState<PredictionInput | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch data and run prediction
  useEffect(() => {
    const currentTime = new Date().toISOString();

    // In production, this would fetch from Nightscout / API
    // For now, generate mock data to demonstrate the engine
    const mockInput = generateMockInput(currentTime);
    setInput(mockInput);

    try {
      const result = predictGlucose(mockInput);
      setPrediction(result);
    } catch (err) {
      console.error("[PredictionPage] Prediction failed:", err);
    } finally {
      setLoading(false);
    }
  }, [session]);

  const latestReading = input?.recentReadings[input.recentReadings.length - 1];
  const trendInfo = prediction ? TREND_ARROWS[prediction.trend] : null;

  /* ─── Styles ─────────────────────────────────────────────────────────── */

  const pageStyle: React.CSSProperties = {
    maxWidth: 960,
    margin: "0 auto",
    padding: "2rem 1.5rem",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: NAVY,
    background: BG,
    minHeight: "100vh",
  };

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 12,
    padding: "1.25rem 1.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
  };

  const disclaimerStyle: React.CSSProperties = {
    ...cardStyle,
    background: "#fffbeb",
    borderColor: AMBER,
    borderLeftWidth: 4,
    padding: "1rem 1.25rem",
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <p style={{ color: MUTED, textAlign: "center", marginTop: "4rem" }}>Loading prediction engine...</p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* Header */}
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0, color: NAVY }}>
          AI Glucose Predictions
        </h1>
        <p style={{ color: MUTED, margin: "0.25rem 0 0", fontSize: "0.9rem" }}>
          Pattern-based educational estimates — not medical advice
        </p>
      </header>

      {/* Disclaimer Banner */}
      <div style={disclaimerStyle}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.25rem", lineHeight: 1 }}>&#9888;</span>
          <div>
            <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem", color: "#92400e" }}>
              Educational Estimates Only
            </p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: "#92400e", lineHeight: 1.5 }}>
              These predictions are educational estimates based on pattern analysis. They are NOT medical advice.
              Always verify with glucose testing. AI explains. It does not prescribe.
            </p>
          </div>
        </div>
      </div>

      {/* Current Glucose + Trend */}
      <div style={{ display: "flex", gap: "1.5rem", margin: "1.5rem 0", flexWrap: "wrap" }}>
        {/* Current Glucose */}
        <div style={{ ...cardStyle, flex: "1 1 240px", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "0.8rem", color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Current Glucose
          </p>
          {latestReading ? (
            <>
              <p style={{
                margin: "0.5rem 0 0.25rem",
                fontSize: "3rem",
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                color: NAVY,
                lineHeight: 1,
              }}>
                {formatGlucose(latestReading.value, units)}
              </p>
              <p style={{ margin: 0, fontSize: "0.85rem", color: MUTED }}>{getUnitLabel(units)}</p>
            </>
          ) : (
            <p style={{ margin: "1rem 0", color: MUTED }}>No data</p>
          )}
        </div>

        {/* Trend Badge */}
        {trendInfo && (
          <div style={{ ...cardStyle, flex: "1 1 160px", textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <p style={{ margin: 0, fontSize: "0.8rem", color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Trend
            </p>
            <p style={{ margin: "0.5rem 0 0", fontSize: "2.5rem", lineHeight: 1, color: trendInfo.color }}>
              {trendInfo.arrow}
            </p>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.9rem", fontWeight: 600, color: trendInfo.color }}>
              {trendInfo.label}
            </p>
          </div>
        )}

        {/* Hypo Risk */}
        {prediction && (
          <div style={{ ...cardStyle, flex: "1 1 200px" }}>
            <p style={{ margin: 0, fontSize: "0.8rem", color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Hypo Risk
            </p>
            <div style={{ margin: "0.75rem 0" }}>
              {/* Risk bar */}
              <div style={{ height: 8, borderRadius: 4, background: "#e5e7eb", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${prediction.hypoRisk.probability * 100}%`,
                  borderRadius: 4,
                  background: prediction.hypoRisk.severity === "high" ? RED
                    : prediction.hypoRisk.severity === "moderate" ? AMBER : GREEN,
                  transition: "width 0.3s ease",
                }} />
              </div>
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.9rem", fontWeight: 600 }}>
                {Math.round(prediction.hypoRisk.probability * 100)}% probability
              </p>
              {prediction.hypoRisk.timeToHypo !== null && (
                <p style={{ margin: "0.15rem 0 0", fontSize: "0.8rem", color: MUTED }}>
                  Est. {prediction.hypoRisk.timeToHypo} min to low
                </p>
              )}
              <p style={{
                margin: "0.25rem 0 0",
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                color: prediction.hypoRisk.severity === "high" ? RED
                  : prediction.hypoRisk.severity === "moderate" ? AMBER : GREEN,
              }}>
                {prediction.hypoRisk.severity} severity
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Prediction Chart */}
      {prediction && input && (
        <div style={{ ...cardStyle, margin: "1.5rem 0" }}>
          <h2 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 600 }}>Glucose Forecast</h2>
          <PredictionChart
            pastReadings={input.recentReadings.map((r) => ({ value: r.value, time: r.time }))}
            predictions={prediction.predictions}
            units={units}
          />
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.8rem", color: MUTED }}>
              <span style={{ width: 20, height: 3, background: NAVY, display: "inline-block", borderRadius: 2 }} /> Actual
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.8rem", color: MUTED }}>
              <span style={{ width: 20, height: 3, background: TEAL, display: "inline-block", borderRadius: 2, borderTop: "1px dashed " + TEAL }} /> Predicted
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.8rem", color: MUTED }}>
              <span style={{ width: 14, height: 14, background: TEAL, opacity: 0.12, display: "inline-block", borderRadius: 2 }} /> Confidence
            </span>
          </div>
        </div>
      )}

      {/* Prediction Cards */}
      {prediction && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", margin: "1.5rem 0" }}>
          {prediction.predictions.map((p, i) => (
            <div key={i} style={{
              ...cardStyle,
              textAlign: "center",
              borderTop: `3px solid ${p.value < 3.9 ? RED : p.value > 10 ? AMBER : TEAL}`,
            }}>
              <p style={{ margin: 0, fontSize: "0.75rem", color: MUTED, textTransform: "uppercase" }}>
                +{i + 1}h Prediction
              </p>
              <p style={{
                margin: "0.5rem 0 0.25rem",
                fontSize: "2rem",
                fontWeight: 700,
                fontFamily: "'JetBrains Mono', monospace",
                color: p.value < 3.9 ? RED : p.value > 10 ? AMBER : NAVY,
              }}>
                {formatGlucose(p.value, units)}
              </p>
              <p style={{ margin: 0, fontSize: "0.8rem", color: MUTED }}>{getUnitLabel(units)}</p>
              <div style={{ marginTop: "0.5rem" }}>
                <div style={{ height: 4, borderRadius: 2, background: "#e5e7eb", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${p.confidence * 100}%`,
                    background: TEAL,
                    borderRadius: 2,
                  }} />
                </div>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: MUTED }}>
                  {Math.round(p.confidence * 100)}% confidence
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confidence Note */}
      {prediction && (
        <div style={{ ...cardStyle, margin: "1.5rem 0" }}>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.9rem", fontWeight: 600 }}>Data Confidence</h3>
          <p style={{ margin: 0, fontSize: "0.85rem", color: MUTED, lineHeight: 1.6 }}>
            {prediction.confidenceNote}
          </p>
        </div>
      )}

      {/* Educational Note */}
      {prediction && (
        <div style={{ ...cardStyle, margin: "1.5rem 0", background: "#f0fdf4", borderColor: "#bbf7d0" }}>
          <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.9rem", fontWeight: 600, color: "#166534" }}>
            Educational Note
          </h3>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#166534", lineHeight: 1.6 }}>
            {prediction.educationalNote}
          </p>
        </div>
      )}

      {/* Footer Disclaimer */}
      <footer style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
        <p style={{ margin: 0, fontSize: "0.75rem", color: MUTED, lineHeight: 1.5, textAlign: "center" }}>
          {DISCLAIMER}
        </p>
      </footer>
    </div>
  );
}
