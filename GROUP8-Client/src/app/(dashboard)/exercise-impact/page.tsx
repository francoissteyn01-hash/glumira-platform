/**
 * GluMira™ — Exercise Impact Dashboard Page
 *
 * Log exercise sessions and analyse their impact on glucose levels.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

"use client";

import { useState } from "react";
import { useExerciseImpact, type ExerciseSession } from "../../../hooks/useExerciseImpact";

const EXERCISE_TYPES = ["walking", "running", "cycling", "swimming", "weights", "yoga", "other"];
const INTENSITIES: ExerciseSession["intensity"][] = ["low", "moderate", "high"];

export default function ExerciseImpactPage() {
  const { data, loading, error, analyse, riskColour } = useExerciseImpact();
  const [type, setType] = useState("running");
  const [intensity, setIntensity] = useState<ExerciseSession["intensity"]>("moderate");
  const [duration, setDuration] = useState(30);
  const [startTime, setStartTime] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime) return;
    analyse({ type, intensity, durationMinutes: duration, startTime: new Date(startTime).toISOString() });
  };

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Exercise Impact Analysis</h1>
      <p style={{ color: "#6b7280", marginBottom: 24 }}>
        Log an exercise session to see how it affected your glucose levels.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16, marginBottom: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Type</span>
            <select value={type} onChange={(e) => setType(e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db", marginTop: 4 }}>
              {EXERCISE_TYPES.map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </label>

          <label>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Intensity</span>
            <select value={intensity} onChange={(e) => setIntensity(e.target.value as ExerciseSession["intensity"])}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db", marginTop: 4 }}>
              {INTENSITIES.map((i) => (
                <option key={i} value={i}>{i.charAt(0).toUpperCase() + i.slice(1)}</option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Duration (minutes)</span>
            <input type="number" min={5} max={300} value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db", marginTop: 4 }} />
          </label>

          <label>
            <span style={{ fontSize: 14, fontWeight: 500 }}>Start Time</span>
            <input type="datetime-local" value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #d1d5db", marginTop: 4 }} />
          </label>
        </div>

        <button type="submit" disabled={loading || !startTime}
          style={{
            padding: "10px 20px", borderRadius: 8, border: "none",
            background: loading ? "#9ca3af" : "#2563eb", color: "#fff",
            fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
          }}>
          {loading ? "Analysing..." : "Analyse Impact"}
        </button>
      </form>

      {error && (
        <div style={{ padding: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#dc2626", marginBottom: 16 }}>
          {error}
        </div>
      )}

      {data && (
        <div style={{ display: "grid", gap: 16 }}>
          {/* Safety check */}
          <div style={{
            padding: 16, borderRadius: 8,
            background: data.safeToExercise ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${data.safeToExercise ? "#bbf7d0" : "#fecaca"}`,
          }}>
            <strong>{data.safeToExercise ? "Safe to exercise" : "Caution — pre-exercise glucose outside safe range"}</strong>
            <p style={{ fontSize: 14, color: "#6b7280", marginTop: 4 }}>
              Target: {data.preExerciseTarget.min}–{data.preExerciseTarget.max} mmol/L
            </p>
          </div>

          {/* Glucose window */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {[
              { label: "Pre-exercise", value: data.glucoseWindow.preExercise },
              { label: "During", value: data.glucoseWindow.duringExercise },
              { label: "Post-exercise", value: data.glucoseWindow.postExercise },
            ].map((item) => (
              <div key={item.label} style={{ padding: 16, background: "#f9fafb", borderRadius: 8, textAlign: "center" }}>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{item.value.toFixed(1)}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{item.label} (mmol/L)</div>
              </div>
            ))}
          </div>

          {/* Drop and risk */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ padding: 16, background: "#f9fafb", borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 700 }}>
                {data.glucoseWindow.drop > 0 ? "↓" : "↑"} {Math.abs(data.glucoseWindow.drop).toFixed(1)} mmol/L
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                Glucose change ({data.glucoseWindow.dropPercent.toFixed(0)}%)
              </div>
            </div>
            <div style={{ padding: 16, background: "#f9fafb", borderRadius: 8 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: riskColour(data.delayedHypoRisk) }}>
                {data.delayedHypoRisk.toUpperCase()}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Delayed hypo risk</div>
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
