/**
 * GluMira™ V7 — Pregnancy Module
 * Wired to: client/src/lib/pregnancy-glucose.ts → assessPregnancyGlucose()
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { assessPregnancyGlucose, type PregnancyGlucoseInput, type PregnancyGlucoseResult } from "@/lib/pregnancy-glucose";

const DIABETES_TYPES = [
  { value: "type1" as const, label: "Type 1" },
  { value: "type2" as const, label: "Type 2" },
  { value: "gestational" as const, label: "Gestational" },
];

export default function PregnancyModule() {
  const [form, setForm] = useState({
    diabetesType: "type1" as "type1" | "type2" | "gestational",
    trimester: 1 as 1 | 2 | 3,
    weeksGestation: 8,
    currentA1c: "",
    onInsulin: true,
    hypoEventsLastWeek: 0,
    fastingReadings: "",
    postMealReadings: "",
  });
  const [result, setResult] = useState<PregnancyGlucoseResult | null>(null);
  const [unit, setUnit] = useState<"mmol" | "mg">("mmol");

  const handleAssess = () => {
    const readings: PregnancyGlucoseInput["recentReadings"] = [];
    const now = new Date().toISOString();

    form.fastingReadings.split(",").map(v => v.trim()).filter(Boolean).forEach(v => {
      const val = parseFloat(v);
      if (!isNaN(val)) readings.push({ timestampUtc: now, glucoseMmol: unit === "mg" ? val / 18.018 : val, tag: "fasting" });
    });
    form.postMealReadings.split(",").map(v => v.trim()).filter(Boolean).forEach(v => {
      const val = parseFloat(v);
      if (!isNaN(val)) readings.push({ timestampUtc: now, glucoseMmol: unit === "mg" ? val / 18.018 : val, tag: "1h-post" });
    });

    const input: PregnancyGlucoseInput = {
      diabetesType: form.diabetesType,
      trimester: form.trimester,
      weeksGestation: form.weeksGestation,
      recentReadings: readings,
      currentA1c: form.currentA1c ? parseFloat(form.currentA1c) : undefined,
      onInsulin: form.onInsulin,
      hypoEventsLastWeek: form.hypoEventsLastWeek,
    };

    setResult(assessPregnancyGlucose(input));
  };

  const fmt = (mmol: number) => unit === "mg" ? `${Math.round(mmol * 18.018)} mg/dL` : `${mmol.toFixed(1)} mmol/L`;

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", padding: "24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <Link to="/education" style={{ color: "#2ab5c1", fontSize: 14, textDecoration: "none" }}>← Back to Education</Link>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0 24px" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#e0f7f9", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🤱</div>
          <div>
            <h1 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: "#1a2a5e", fontSize: 28 }}>Pregnancy Glucose Assessment</h1>
            <p style={{ margin: 0, color: "#718096", fontSize: 14 }}>Educational trimester-specific glucose targets and risk analysis</p>
          </div>
        </div>

        {/* Input Form */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24, marginBottom: 20 }}>
          <h2 style={{ color: "#1a2a5e", fontSize: 18, marginBottom: 16 }}>Patient Information</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <label style={labelStyle}>
              Diabetes Type
              <select value={form.diabetesType} onChange={e => setForm(f => ({ ...f, diabetesType: e.target.value as any }))} style={inputStyle}>
                {DIABETES_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
            <label style={labelStyle}>
              Trimester
              <select value={form.trimester} onChange={e => setForm(f => ({ ...f, trimester: Number(e.target.value) as 1 | 2 | 3 }))} style={inputStyle}>
                <option value={1}>1st (Weeks 1-13)</option>
                <option value={2}>2nd (Weeks 14-27)</option>
                <option value={3}>3rd (Weeks 28-40)</option>
              </select>
            </label>
            <label style={labelStyle}>
              Weeks Gestation
              <input type="number" min={1} max={42} value={form.weeksGestation} onChange={e => setForm(f => ({ ...f, weeksGestation: parseInt(e.target.value) || 1 }))} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Current A1c (%)
              <input type="number" step="0.1" placeholder="e.g. 6.2" value={form.currentA1c} onChange={e => setForm(f => ({ ...f, currentA1c: e.target.value }))} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              Hypo Events (Last Week)
              <input type="number" min={0} max={30} value={form.hypoEventsLastWeek} onChange={e => setForm(f => ({ ...f, hypoEventsLastWeek: parseInt(e.target.value) || 0 }))} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              On Insulin?
              <select value={form.onInsulin ? "yes" : "no"} onChange={e => setForm(f => ({ ...f, onInsulin: e.target.value === "yes" }))} style={inputStyle}>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "16px 0 8px" }}>
            <span style={{ fontSize: 13, color: "#4a5568" }}>Glucose Unit:</span>
            <button onClick={() => setUnit("mmol")} style={{ ...pillStyle, ...(unit === "mmol" ? pillActive : {}) }}>mmol/L</button>
            <button onClick={() => setUnit("mg")} style={{ ...pillStyle, ...(unit === "mg" ? pillActive : {}) }}>mg/dL</button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 8 }}>
            <label style={labelStyle}>
              Fasting Readings (comma-separated)
              <input type="text" placeholder={unit === "mmol" ? "e.g. 5.1, 5.4, 4.9" : "e.g. 92, 97, 88"} value={form.fastingReadings} onChange={e => setForm(f => ({ ...f, fastingReadings: e.target.value }))} style={inputStyle} />
            </label>
            <label style={labelStyle}>
              1h Post-Meal Readings (comma-separated)
              <input type="text" placeholder={unit === "mmol" ? "e.g. 7.2, 8.1, 6.8" : "e.g. 130, 146, 122"} value={form.postMealReadings} onChange={e => setForm(f => ({ ...f, postMealReadings: e.target.value }))} style={inputStyle} />
            </label>
          </div>

          <button onClick={handleAssess} style={{ marginTop: 20, padding: "10px 28px", background: "#2ab5c1", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>
            Assess Glucose Targets
          </button>
        </div>

        {/* Results */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Targets */}
            <div style={cardStyle}>
              <h3 style={cardTitle}>Pregnancy Glucose Targets</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>{["Context", "Low", "High"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {result.targets.map(t => (
                    <tr key={t.context}>
                      <td style={tdStyle}>{t.context}</td>
                      <td style={tdStyle}>{unit === "mg" ? `${t.targetMgdl.low} mg/dL` : `${t.targetMmol.low} mmol/L`}</td>
                      <td style={tdStyle}>{unit === "mg" ? `${t.targetMgdl.high} mg/dL` : `${t.targetMmol.high} mmol/L`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Performance */}
            <div style={cardStyle}>
              <h3 style={cardTitle}>Current Performance</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div style={statBox}>
                  <div style={statLabel}>Fasting Mean</div>
                  <div style={statValue}>{result.currentPerformance.fastingMean !== null ? fmt(result.currentPerformance.fastingMean) : "—"}</div>
                  <div style={{ fontSize: 11, color: result.currentPerformance.fastingInTarget ? "#16a34a" : "#dc2626" }}>
                    {result.currentPerformance.fastingInTarget !== null ? (result.currentPerformance.fastingInTarget ? "In Target" : "Above Target") : ""}
                  </div>
                </div>
                <div style={statBox}>
                  <div style={statLabel}>1h Post-Meal Mean</div>
                  <div style={statValue}>{result.currentPerformance.oneHourPostMean !== null ? fmt(result.currentPerformance.oneHourPostMean) : "—"}</div>
                  <div style={{ fontSize: 11, color: result.currentPerformance.postMealInTarget ? "#16a34a" : "#dc2626" }}>
                    {result.currentPerformance.postMealInTarget !== null ? (result.currentPerformance.postMealInTarget ? "In Target" : "Above Target") : ""}
                  </div>
                </div>
                <div style={statBox}>
                  <div style={statLabel}>A1c Status</div>
                  <div style={{ fontSize: 13, color: "#1a2a5e" }}>{result.a1cStatus ?? "Not provided"}</div>
                </div>
              </div>
            </div>

            {/* Trimester Guidance */}
            <div style={{ ...cardStyle, background: "#e8f4fd", borderColor: "#2ab5c1" }}>
              <h3 style={cardTitle}>Trimester Guidance</h3>
              <p style={{ fontSize: 14, color: "#1a2a5e", lineHeight: 1.6 }}>{result.trimesterGuidance}</p>
            </div>

            {/* Risks */}
            {result.risks.length > 0 && (
              <div style={cardStyle}>
                <h3 style={cardTitle}>Risk Assessment</h3>
                {result.risks.map((r, i) => (
                  <div key={i} style={{ padding: "8px 12px", margin: "6px 0", borderRadius: 8, background: r.severity === "high" ? "#fef2f2" : r.severity === "moderate" ? "#fff7ed" : "#f0fdf4", border: `1px solid ${r.severity === "high" ? "#fca5a5" : r.severity === "moderate" ? "#fed7aa" : "#bbf7d0"}` }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: r.severity === "high" ? "#dc2626" : r.severity === "moderate" ? "#ea580c" : "#16a34a" }}>
                      {r.severity.toUpperCase()}: {r.risk}
                    </div>
                    <div style={{ fontSize: 12, color: "#4a5568", marginTop: 4 }}>{r.explanation}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Monitoring Schedule */}
            <div style={cardStyle}>
              <h3 style={cardTitle}>Monitoring Schedule</h3>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.8, color: "#1a2a5e" }}>
                {result.monitoringSchedule.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>

            {/* Insulin Notes */}
            <div style={cardStyle}>
              <h3 style={cardTitle}>Insulin Notes</h3>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.8, color: "#1a2a5e" }}>
                {result.insulinNotes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </div>

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div style={{ ...cardStyle, background: "#fef2f2", borderColor: "#fca5a5" }}>
                <h3 style={{ ...cardTitle, color: "#dc2626" }}>Warnings</h3>
                {result.warnings.map((w, i) => <p key={i} style={{ fontSize: 13, color: "#991b1b", margin: "4px 0" }}>{w}</p>)}
              </div>
            )}
          </div>
        )}

        <footer style={{ textAlign: "center", fontSize: 11, color: "#718096", marginTop: 32, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
          <p>{result?.disclaimer ?? "GluMira™ is an educational platform. Not a medical device."}</p>
        </footer>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 500, color: "#4a5568" };
const inputStyle: React.CSSProperties = { padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, fontFamily: "'DM Sans', sans-serif" };
const pillStyle: React.CSSProperties = { padding: "4px 12px", border: "1px solid #d1d5db", borderRadius: 20, fontSize: 12, background: "#fff", cursor: "pointer" };
const pillActive: React.CSSProperties = { background: "#2ab5c1", color: "#fff", borderColor: "#2ab5c1" };
const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20 };
const cardTitle: React.CSSProperties = { fontSize: 16, color: "#1a2a5e", marginBottom: 12, fontFamily: "'Playfair Display', serif" };
const thStyle: React.CSSProperties = { textAlign: "left", padding: "8px 12px", borderBottom: "2px solid #e2e8f0", color: "#1a2a5e", fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: "8px 12px", borderBottom: "1px solid #f1f5f9", color: "#4a5568" };
const statBox: React.CSSProperties = { background: "#f8f9fa", padding: 12, borderRadius: 12, textAlign: "center" };
const statLabel: React.CSSProperties = { fontSize: 11, color: "#718096", marginBottom: 4 };
const statValue: React.CSSProperties = { fontSize: 22, fontWeight: 700, color: "#1a2a5e", fontFamily: "'JetBrains Mono', monospace" };
