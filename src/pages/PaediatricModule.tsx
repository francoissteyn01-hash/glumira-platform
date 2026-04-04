/**
 * GluMira™ V7 — Paediatric Module
 * Wired to: client/src/lib/pediatric-dose.ts → calculatePediatricDose()
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { calculatePediatricDose, type PediatricInput, type PediatricDoseResult } from "@/lib/pediatric-dose";

const PUBERTY_STAGES = [
  { value: "pre-puberty", label: "Pre-puberty" },
  { value: "early-puberty", label: "Early puberty" },
  { value: "mid-puberty", label: "Mid-puberty" },
  { value: "late-puberty", label: "Late puberty" },
  { value: "post-puberty", label: "Post-puberty" },
] as const;

export default function PaediatricModule() {
  const [form, setForm] = useState({
    ageYears: 8,
    weightKg: 28,
    diabetesType: "type1" as "type1" | "type2",
    yearsSinceDiagnosis: 2,
    inHoneymoonPhase: false,
    pubertyStage: "pre-puberty" as PediatricInput["pubertyStage"],
    currentTDD: "",
    currentA1c: "",
    recentHyposPerWeek: 1,
    usePump: false,
    mealsPerDay: 3,
    avgCarbsPerMeal: 40,
  });
  const [result, setResult] = useState<PediatricDoseResult | null>(null);

  const handleCalculate = () => {
    const input: PediatricInput = {
      ageYears: form.ageYears,
      weightKg: form.weightKg,
      diabetesType: form.diabetesType,
      yearsSinceDiagnosis: form.yearsSinceDiagnosis,
      inHoneymoonPhase: form.inHoneymoonPhase,
      pubertyStage: form.pubertyStage,
      currentTDD: form.currentTDD ? parseFloat(form.currentTDD) : undefined,
      currentA1c: form.currentA1c ? parseFloat(form.currentA1c) : undefined,
      recentHyposPerWeek: form.recentHyposPerWeek,
      usePump: form.usePump,
      mealsPerDay: form.mealsPerDay,
      avgCarbsPerMeal: form.avgCarbsPerMeal,
    };
    setResult(calculatePediatricDose(input));
  };

  const statusColor = (s: string) => s === "pass" ? "#16a34a" : s === "warning" ? "#ea580c" : "#dc2626";
  const statusBg = (s: string) => s === "pass" ? "#f0fdf4" : s === "warning" ? "#fff7ed" : "#fef2f2";

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", padding: 24 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <Link to="/education" style={{ color: "#2ab5c1", fontSize: 14, textDecoration: "none" }}>← Back to Education</Link>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0 24px" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👶</div>
          <div>
            <h1 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: "#1a2a5e", fontSize: 28 }}>Paediatric Dose Calculator</h1>
            <p style={{ margin: 0, color: "#718096", fontSize: 14 }}>Age-appropriate insulin dose estimation for children and adolescents</p>
          </div>
        </div>

        {/* Form */}
        <div style={cardStyle}>
          <h2 style={{ color: "#1a2a5e", fontSize: 18, marginBottom: 16 }}>Patient Details</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <label style={labelStyle}>Age (years)<input type="number" min={0} max={25} value={form.ageYears} onChange={e => setForm(f => ({ ...f, ageYears: parseInt(e.target.value) || 0 }))} style={inputStyle} /></label>
            <label style={labelStyle}>Weight (kg)<input type="number" min={1} max={150} step="0.1" value={form.weightKg} onChange={e => setForm(f => ({ ...f, weightKg: parseFloat(e.target.value) || 1 }))} style={inputStyle} /></label>
            <label style={labelStyle}>Diabetes Type
              <select value={form.diabetesType} onChange={e => setForm(f => ({ ...f, diabetesType: e.target.value as any }))} style={inputStyle}>
                <option value="type1">Type 1</option><option value="type2">Type 2</option>
              </select>
            </label>
            <label style={labelStyle}>Years Since Diagnosis<input type="number" min={0} max={25} value={form.yearsSinceDiagnosis} onChange={e => setForm(f => ({ ...f, yearsSinceDiagnosis: parseInt(e.target.value) || 0 }))} style={inputStyle} /></label>
            <label style={labelStyle}>Puberty Stage
              <select value={form.pubertyStage} onChange={e => setForm(f => ({ ...f, pubertyStage: e.target.value as any }))} style={inputStyle}>
                {PUBERTY_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
            <label style={labelStyle}>Hypos / Week<input type="number" min={0} max={20} value={form.recentHyposPerWeek} onChange={e => setForm(f => ({ ...f, recentHyposPerWeek: parseInt(e.target.value) || 0 }))} style={inputStyle} /></label>
            <label style={labelStyle}>Meals / Day<input type="number" min={1} max={8} value={form.mealsPerDay} onChange={e => setForm(f => ({ ...f, mealsPerDay: parseInt(e.target.value) || 3 }))} style={inputStyle} /></label>
            <label style={labelStyle}>Avg Carbs / Meal (g)<input type="number" min={0} max={200} value={form.avgCarbsPerMeal} onChange={e => setForm(f => ({ ...f, avgCarbsPerMeal: parseInt(e.target.value) || 0 }))} style={inputStyle} /></label>
            <label style={labelStyle}>Current A1c (%)
              <input type="number" step="0.1" placeholder="Optional" value={form.currentA1c} onChange={e => setForm(f => ({ ...f, currentA1c: e.target.value }))} style={inputStyle} />
            </label>
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#4a5568", cursor: "pointer" }}>
              <input type="checkbox" checked={form.inHoneymoonPhase} onChange={e => setForm(f => ({ ...f, inHoneymoonPhase: e.target.checked }))} /> Honeymoon Phase
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#4a5568", cursor: "pointer" }}>
              <input type="checkbox" checked={form.usePump} onChange={e => setForm(f => ({ ...f, usePump: e.target.checked }))} /> Insulin Pump
            </label>
          </div>
          <button onClick={handleCalculate} style={btnStyle}>Calculate Dose Estimates</button>
        </div>

        {/* Results */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
            <div style={cardStyle}>
              <h3 style={cardTitle}>Dose Estimates — {result.ageGroup}</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                {[
                  { label: "Estimated TDD", value: `${result.estimatedTDD}U` },
                  { label: "TDD / kg", value: `${result.tddPerKg} U/kg` },
                  { label: "Basal", value: `${result.basalDose}U (${result.basalPercent}%)` },
                  { label: "Bolus / Meal", value: `${result.bolusPerMeal}U` },
                ].map(m => (
                  <div key={m.label} style={statBox}>
                    <div style={statLabel}>{m.label}</div>
                    <div style={statValue}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                <div style={statBox}>
                  <div style={statLabel}>ICR (Insulin-to-Carb Ratio)</div>
                  <div style={statValue}>1:{result.icr}</div>
                  <div style={{ fontSize: 11, color: "#718096" }}>1 unit per {result.icr}g carbs</div>
                </div>
                <div style={statBox}>
                  <div style={statLabel}>ISF (Correction Factor)</div>
                  <div style={statValue}>{result.isf} mmol/L</div>
                  <div style={{ fontSize: 11, color: "#718096" }}>({result.isfMgdl} mg/dL per unit)</div>
                </div>
              </div>
            </div>

            {result.adjustments.length > 0 && (
              <div style={cardStyle}>
                <h3 style={cardTitle}>Active Adjustments</h3>
                {result.adjustments.map((a, i) => (
                  <div key={i} style={{ padding: "8px 12px", margin: "6px 0", borderRadius: 8, background: "#fff7ed", border: "1px solid #fed7aa" }}>
                    <span style={{ fontWeight: 600, color: "#ea580c", fontSize: 13 }}>{a.factor}</span>
                    <span style={{ color: "#4a5568", fontSize: 13 }}> — {a.effect} ({a.magnitude})</span>
                  </div>
                ))}
              </div>
            )}

            <div style={cardStyle}>
              <h3 style={cardTitle}>Safety Checks</h3>
              {result.safetyChecks.map((c, i) => (
                <div key={i} style={{ padding: "8px 12px", margin: "6px 0", borderRadius: 8, background: statusBg(c.status), border: `1px solid ${statusColor(c.status)}33` }}>
                  <span style={{ fontWeight: 600, color: statusColor(c.status), fontSize: 13 }}>{c.status.toUpperCase()}: {c.check}</span>
                  <div style={{ fontSize: 12, color: "#4a5568", marginTop: 2 }}>{c.message}</div>
                </div>
              ))}
            </div>

            <div style={cardStyle}>
              <h3 style={cardTitle}>Clinical Guidance</h3>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.8, color: "#1a2a5e" }}>
                {result.guidance.map((g, i) => <li key={i}>{g}</li>)}
              </ul>
            </div>

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
const inputStyle: React.CSSProperties = { padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 };
const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20 };
const cardTitle: React.CSSProperties = { fontSize: 16, color: "#1a2a5e", marginBottom: 12, fontFamily: "'Playfair Display', serif" };
const statBox: React.CSSProperties = { background: "#f8f9fa", padding: 12, borderRadius: 12, textAlign: "center" };
const statLabel: React.CSSProperties = { fontSize: 11, color: "#718096", marginBottom: 4 };
const statValue: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: "#1a2a5e", fontFamily: "'JetBrains Mono', monospace" };
const btnStyle: React.CSSProperties = { marginTop: 20, padding: "10px 28px", background: "#2ab5c1", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" };
