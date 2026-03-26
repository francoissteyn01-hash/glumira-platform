/**
 * GluMira™ — Sleep Quality Dashboard Page
 *
 * Analyse overnight glucose patterns and sleep quality impact.
 *
 * GluMira is an informational tool only. Not a medical device.
 */

"use client";

import { useState } from "react";
import { useSleepQuality } from "../../../hooks/useSleepQuality";

export default function SleepQualityPage() {
  const { data, loading, error, analyse, scoreColour } = useSleepQuality();
  const [bedtime, setBedtime] = useState("");
  const [wakeTime, setWakeTime] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bedtime || !wakeTime) return;
    analyse({
      bedtime: new Date(bedtime).toISOString(),
      wakeTime: new Date(wakeTime).toISOString(),
    });
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Sleep Quality Analysis</h1>
      <p style={{ color: "#6b7280", marginBottom: 24 }}>
        Analyse how your overnight glucose patterns affect sleep quality.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16, marginBottom: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Bedtime</span>
            <input type="datetime-local" value={bedtime} onChange={(e) => setBedtime(e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db", marginTop: 4 }} />
          </label>
          <label>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Wake Time</span>
            <input type="datetime-local" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db", marginTop: 4 }} />
          </label>
        </div>
        <button type="submit" disabled={loading || !bedtime || !wakeTime}
          style={{
            padding: "10px 20px", borderRadius: 8, border: "none",
            background: loading ? "#9ca3af" : "#2563eb", color: "#fff",
            fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
          }}>
          {loading ? "Analysing..." : "Analyse Sleep Quality"}
        </button>
      </form>

      {error && (
        <div style={{ padding: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {data && (
        <div style={{ display: "grid", gap: 16 }}>
          {/* Score hero */}
          <div style={{ textAlign: "center", padding: 24, background: "#f9fafb", borderRadius: 12 }}>
            <div style={{ fontSize: 48, fontWeight: 800, color: scoreColour(data.stabilityScore) }}>
              {data.stabilityScore}
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: scoreColour(data.stabilityScore) }}>
              {data.qualityLabel}
            </div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Overnight Stability Score</div>
          </div>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { label: "Mean", value: `${data.stats.mean.toFixed(1)} mmol/L` },
              { label: "SD", value: data.stats.sd.toFixed(2) },
              { label: "CV", value: `${data.stats.cv.toFixed(1)}%` },
              { label: "Min", value: `${data.stats.min.toFixed(1)} mmol/L` },
              { label: "Max", value: `${data.stats.max.toFixed(1)} mmol/L` },
              { label: "Readings", value: String(data.stats.readingCount) },
            ].map((item) => (
              <div key={item.label} style={{ padding: 12, background: "#f9fafb", borderRadius: 8, textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{item.value}</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>{item.label}</div>
              </div>
            ))}
          </div>

          {/* TIR bar */}
          <div style={{ padding: 16, background: "#f9fafb", borderRadius: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Overnight Time in Range</div>
            <div style={{ display: "flex", height: 24, borderRadius: 6, overflow: "hidden" }}>
              <div style={{ width: `${data.stats.timeBelowRange}%`, background: "#ef4444" }} />
              <div style={{ width: `${data.stats.timeInRange}%`, background: "#22c55e" }} />
              <div style={{ width: `${data.stats.timeAboveRange}%`, background: "#f59e0b" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#6b7280", marginTop: 4 }}>
              <span>Below: {data.stats.timeBelowRange.toFixed(0)}%</span>
              <span>In range: {data.stats.timeInRange.toFixed(0)}%</span>
              <span>Above: {data.stats.timeAboveRange.toFixed(0)}%</span>
            </div>
          </div>

          {/* Dawn phenomenon */}
          {data.dawnPhenomenon.detected && (
            <div style={{ padding: 16, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8 }}>
              <strong>Dawn Phenomenon Detected</strong>
              <p style={{ fontSize: 14, marginTop: 4 }}>
                {data.dawnPhenomenon.riseMmol?.toFixed(1)} mmol/L rise ({data.dawnPhenomenon.severity})
              </p>
            </div>
          )}

          {/* Events */}
          {data.events.length > 0 && (
            <div style={{ padding: 16, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8 }}>
              <strong>{data.events.length} Nocturnal Event(s)</strong>
              <ul style={{ marginTop: 8, paddingLeft: 20, fontSize: 14 }}>
                {data.events.slice(0, 5).map((e, i) => (
                  <li key={i}>
                    {e.type === "hypo" ? "🔴" : "🟡"} {e.type.toUpperCase()} — {e.mmol.toFixed(1)} mmol/L at{" "}
                    {new Date(e.timestamp).toLocaleTimeString()}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          <div style={{ padding: 16, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8 }}>
            <strong style={{ fontSize: 14 }}>Recommendations</strong>
            <ul style={{ marginTop: 8, paddingLeft: 20, fontSize: 14 }}>
              {data.recommendations.map((r, i) => (
                <li key={i} style={{ marginBottom: 4 }}>{r}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
