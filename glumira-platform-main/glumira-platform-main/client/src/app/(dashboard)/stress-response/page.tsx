/**
 * GluMira™ — Stress Response Dashboard Page
 *
 * Log stress events and analyse their impact on glucose levels.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useState } from "react";
import { useStressResponse, type StressPeriod } from "../../../hooks/useStressResponse";

const CATEGORIES: StressPeriod["category"][] = ["work", "emotional", "physical", "illness", "other"];

export default function StressResponsePage() {
  const { data, loading, error, analyse, severityColour } = useStressResponse();
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [stressLevel, setStressLevel] = useState<number>(3);
  const [category, setCategory] = useState<StressPeriod["category"]>("work");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !endTime) return;
    analyse({
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      stressLevel: stressLevel as 1 | 2 | 3 | 4 | 5,
      category,
    });
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Stress Response Analysis</h1>
      <p style={{ color: "#6b7280", marginBottom: 24 }}>
        Log a stress event to see how it affected your glucose levels.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16, marginBottom: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Start Time</span>
            <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db", marginTop: 4 }} />
          </label>
          <label>
            <span style={{ fontSize: 14, fontWeight: 500 }}>End Time</span>
            <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db", marginTop: 4 }} />
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Stress Level (1-5)</span>
            <input type="range" min={1} max={5} value={stressLevel}
              onChange={(e) => setStressLevel(Number(e.target.value))}
              style={{ width: "100%", marginTop: 4 }} />
            <div style={{ textAlign: "center", fontSize: 18, fontWeight: 700 }}>{stressLevel}</div>
          </label>
          <label>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as StressPeriod["category"])}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db", marginTop: 4 }}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c!.charAt(0).toUpperCase() + c!.slice(1)}</option>
              ))}
            </select>
          </label>
        </div>

        <button type="submit" disabled={loading || !startTime || !endTime}
          style={{
            padding: "10px 20px", borderRadius: 8, border: "none",
            background: loading ? "#9ca3af" : "#2563eb", color: "#fff",
            fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
          }}>
          {loading ? "Analysing..." : "Analyse Stress Impact"}
        </button>
      </form>

      {error && (
        <div style={{ padding: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {data && (
        <div style={{ display: "grid", gap: 16 }}>
          {/* Impact severity */}
          <div style={{ textAlign: "center", padding: 24, background: "#f9fafb", borderRadius: 12 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: severityColour(data.impactSeverity) }}>
              {data.impactSeverity.toUpperCase()}
            </div>
            <div style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>Glucose Impact Severity</div>
          </div>

          {/* Glucose window */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { label: "Pre-stress", value: data.glucoseWindow.preMean },
              { label: "During stress", value: data.glucoseWindow.duringMean },
              { label: "Post-stress", value: data.glucoseWindow.postMean },
            ].map((item) => (
              <div key={item.label} style={{ padding: 16, background: "#f9fafb", borderRadius: 8, textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{item.value.toFixed(1)}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{item.label} (mmol/L)</div>
              </div>
            ))}
          </div>

          {/* Rise and recovery */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div style={{ padding: 16, background: "#f9fafb", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {data.glucoseWindow.riseFromBaseline > 0 ? "+" : ""}{data.glucoseWindow.riseFromBaseline.toFixed(1)}
              </div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Rise (mmol/L)</div>
            </div>
            <div style={{ padding: 16, background: "#f9fafb", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{data.glucoseWindow.peakDuring.toFixed(1)}</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Peak During</div>
            </div>
            <div style={{ padding: 16, background: "#f9fafb", borderRadius: 8, textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{data.glucoseWindow.recoveryMinutes} min</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>Recovery Time</div>
            </div>
          </div>

          {/* Recommendation */}
          <div style={{ padding: 16, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8 }}>
            <strong style={{ fontSize: 14 }}>Recommendation</strong>
            <p style={{ marginTop: 4, fontSize: 14 }}>{data.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
