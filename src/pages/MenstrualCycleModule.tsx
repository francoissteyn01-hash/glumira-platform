/**
 * GluMira™ V7 — Menstrual Cycle Module
 * Wired to: client/src/lib/menstrual-cycle-impact.ts → analyzeCycleImpact()
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { analyzeCycleImpact, getCyclePhases, getCyclePhase, type CycleDay, type CycleImpactResult } from "@/lib/menstrual-cycle-impact";

const SYMPTOMS = ["cramps", "bloating", "fatigue", "headache", "nausea", "mood_swings", "cravings", "insomnia", "breast_tenderness", "back_pain"];
const MOODS = ["good", "neutral", "low", "irritable"] as const;

export default function MenstrualCycleModule() {
  const [cycleLength, setCycleLength] = useState(28);
  const [currentDay, setCurrentDay] = useState(1);
  const [entries, setEntries] = useState<CycleDay[]>([]);
  const [entryForm, setEntryForm] = useState({
    glucoseReadings: "",
    basalDose: "",
    totalBolus: "",
    totalCarbs: "",
    symptoms: [] as string[],
    mood: "neutral" as CycleDay["mood"],
  });
  const [result, setResult] = useState<CycleImpactResult | null>(null);

  const phases = getCyclePhases();
  const currentPhase = getCyclePhase(currentDay, cycleLength);

  const addEntry = () => {
    const readings = entryForm.glucoseReadings.split(",").map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    const entry: CycleDay = {
      date: new Date().toISOString().slice(0, 10),
      cycleDay: currentDay,
      glucoseReadings: readings,
      basalDoseUnits: entryForm.basalDose ? parseFloat(entryForm.basalDose) : undefined,
      totalBolusUnits: entryForm.totalBolus ? parseFloat(entryForm.totalBolus) : undefined,
      totalCarbsGrams: entryForm.totalCarbs ? parseFloat(entryForm.totalCarbs) : undefined,
      symptoms: entryForm.symptoms.length > 0 ? entryForm.symptoms : undefined,
      mood: entryForm.mood,
    };
    const updated = [...entries, entry];
    setEntries(updated);
    setEntryForm({ glucoseReadings: "", basalDose: "", totalBolus: "", totalCarbs: "", symptoms: [], mood: "neutral" });
    setResult(analyzeCycleImpact(updated, cycleLength));
  };

  const toggleSymptom = (s: string) => {
    setEntryForm(f => ({
      ...f,
      symptoms: f.symptoms.includes(s) ? f.symptoms.filter(x => x !== s) : [...f.symptoms, s],
    }));
  };

  const analyzeAll = () => {
    setResult(analyzeCycleImpact(entries, cycleLength));
  };

  const sensitivityColor = (trend: string) => trend === "increased" ? "#16a34a" : trend === "decreased" ? "#dc2626" : "#2563eb";
  const strengthColor = (s: string) => s === "strong" ? "#16a34a" : s === "moderate" ? "#ea580c" : s === "weak" ? "#d97706" : "#9ca3af";

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", padding: 24 }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Link to="/education" style={{ color: "#2ab5c1", fontSize: 14, textDecoration: "none" }}>← Back to Education</Link>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0 24px" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#fae8ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🌿</div>
          <div>
            <h1 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: "#1a2a5e", fontSize: 28 }}>Menstrual Cycle & Glucose</h1>
            <p style={{ margin: 0, color: "#718096", fontSize: 14 }}>Track how your cycle affects insulin sensitivity and glucose patterns</p>
          </div>
        </div>

        {/* Cycle Phase Overview */}
        <div style={cardStyle}>
          <h3 style={cardTitle}>Cycle Phases</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: "#4a5568" }}>Cycle Length:
              <input type="number" min={21} max={40} value={cycleLength} onChange={e => setCycleLength(parseInt(e.target.value) || 28)} style={{ ...inputStyle, width: 70, marginLeft: 8 }} />
            </label>
            <label style={{ fontSize: 13, color: "#4a5568" }}>Current Day:
              <input type="number" min={1} max={cycleLength} value={currentDay} onChange={e => setCurrentDay(parseInt(e.target.value) || 1)} style={{ ...inputStyle, width: 70, marginLeft: 8 }} />
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
            {phases.map(p => {
              const isActive = p.name === currentPhase.name;
              return (
                <div key={p.name} style={{ padding: 12, borderRadius: 12, background: isActive ? "#1a2a5e" : "#f8f9fa", border: `1px solid ${isActive ? "#1a2a5e" : "#e2e8f0"}`, textAlign: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? "#fff" : "#1a2a5e" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: isActive ? "#a5b4fc" : "#718096", marginTop: 4 }}>Days {p.dayRange[0]}-{p.dayRange[1]}</div>
                  <div style={{ fontSize: 11, color: sensitivityColor(p.insulinSensitivityTrend), marginTop: 4, fontWeight: 500 }}>
                    {p.typicalResistanceChangePercent > 0 ? `+${p.typicalResistanceChangePercent}%` : `${p.typicalResistanceChangePercent}%`} resistance
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 12, padding: 12, background: "#e8f4fd", borderRadius: 8, fontSize: 13, color: "#1a2a5e" }}>
            <strong>Current: {currentPhase.name}</strong> — {currentPhase.description}
          </div>
        </div>

        {/* Data Entry */}
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <h3 style={cardTitle}>Log Today's Data (Day {currentDay})</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
            <label style={labelStyle}>Glucose Readings (mmol/L)
              <input placeholder="e.g. 6.2, 7.8, 5.4" value={entryForm.glucoseReadings} onChange={e => setEntryForm(f => ({ ...f, glucoseReadings: e.target.value }))} style={inputStyle} />
            </label>
            <label style={labelStyle}>Basal Dose (U)
              <input type="number" step="0.1" placeholder="Optional" value={entryForm.basalDose} onChange={e => setEntryForm(f => ({ ...f, basalDose: e.target.value }))} style={inputStyle} />
            </label>
            <label style={labelStyle}>Total Bolus (U)
              <input type="number" step="0.1" placeholder="Optional" value={entryForm.totalBolus} onChange={e => setEntryForm(f => ({ ...f, totalBolus: e.target.value }))} style={inputStyle} />
            </label>
            <label style={labelStyle}>Total Carbs (g)
              <input type="number" placeholder="Optional" value={entryForm.totalCarbs} onChange={e => setEntryForm(f => ({ ...f, totalCarbs: e.target.value }))} style={inputStyle} />
            </label>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#4a5568", marginBottom: 6 }}>Symptoms</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SYMPTOMS.map(s => (
                <button key={s} onClick={() => toggleSymptom(s)} style={{ padding: "4px 10px", borderRadius: 16, fontSize: 12, border: `1px solid ${entryForm.symptoms.includes(s) ? "#2ab5c1" : "#d1d5db"}`, background: entryForm.symptoms.includes(s) ? "#e0f7f9" : "#fff", color: entryForm.symptoms.includes(s) ? "#0e7490" : "#4a5568", cursor: "pointer" }}>
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#4a5568" }}>Mood:</span>
            {MOODS.map(m => (
              <button key={m} onClick={() => setEntryForm(f => ({ ...f, mood: m }))} style={{ padding: "4px 12px", borderRadius: 16, fontSize: 12, border: `1px solid ${entryForm.mood === m ? "#2ab5c1" : "#d1d5db"}`, background: entryForm.mood === m ? "#e0f7f9" : "#fff", color: entryForm.mood === m ? "#0e7490" : "#4a5568", cursor: "pointer" }}>
                {m}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button onClick={addEntry} style={btnStyle}>Log & Analyze</button>
            {entries.length > 0 && (
              <button onClick={analyzeAll} style={{ ...btnStyle, background: "#1a2a5e" }}>Re-Analyze All ({entries.length} days)</button>
            )}
          </div>
          {entries.length > 0 && (
            <div style={{ fontSize: 12, color: "#718096", marginTop: 8 }}>{entries.length} day(s) logged this session</div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
            {/* Insulin Adjustment */}
            <div style={{ ...cardStyle, background: "#e8f4fd", borderColor: "#2ab5c1" }}>
              <h3 style={cardTitle}>Insulin Adjustment Recommendation</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div style={statBox}>
                  <div style={statLabel}>Basal Change</div>
                  <div style={{ ...statValue, color: result.insulinAdjustment.basalChangePercent > 0 ? "#dc2626" : result.insulinAdjustment.basalChangePercent < 0 ? "#16a34a" : "#2563eb" }}>
                    {result.insulinAdjustment.basalChangePercent > 0 ? "+" : ""}{result.insulinAdjustment.basalChangePercent}%
                  </div>
                </div>
                <div style={statBox}>
                  <div style={statLabel}>Bolus Change</div>
                  <div style={{ ...statValue, color: result.insulinAdjustment.bolusChangePercent > 0 ? "#dc2626" : result.insulinAdjustment.bolusChangePercent < 0 ? "#16a34a" : "#2563eb" }}>
                    {result.insulinAdjustment.bolusChangePercent > 0 ? "+" : ""}{result.insulinAdjustment.bolusChangePercent}%
                  </div>
                </div>
                <div style={statBox}>
                  <div style={statLabel}>Pattern Strength</div>
                  <div style={{ ...statValue, fontSize: 16, color: strengthColor(result.patternStrength) }}>{result.patternStrength}</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "#1a2a5e", marginTop: 12, lineHeight: 1.6 }}>{result.insulinAdjustment.explanation}</p>
            </div>

            {/* Phase Analysis */}
            {result.phaseAnalysis.length > 0 && (
              <div style={cardStyle}>
                <h3 style={cardTitle}>Phase-by-Phase Analysis</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>{["Phase", "Avg Glucose", "CV%", "Avg Insulin", "Avg Carbs", "Readings"].map(h => <th key={h} style={thStyle}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {result.phaseAnalysis.map(p => (
                      <tr key={p.phase}>
                        <td style={tdStyle}><strong>{p.phase}</strong></td>
                        <td style={tdStyle}>{p.avgGlucose} mmol/L</td>
                        <td style={tdStyle}>{p.glucoseVariability}%</td>
                        <td style={tdStyle}>{p.avgTotalInsulin}U</td>
                        <td style={tdStyle}>{p.avgCarbs}g</td>
                        <td style={tdStyle}>{p.readingCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Next Phase Prediction */}
            <div style={cardStyle}>
              <h3 style={cardTitle}>Next Phase Prediction</h3>
              <p style={{ fontSize: 14, color: "#1a2a5e" }}>
                <strong>{result.predictedNextPhase.name}</strong> starts in ~{result.predictedNextPhase.startsInDays} days.
              </p>
              <p style={{ fontSize: 13, color: "#4a5568" }}>{result.predictedNextPhase.expectedChange}</p>
            </div>

            {/* Symptom Correlations */}
            {result.symptomCorrelations.length > 0 && (
              <div style={cardStyle}>
                <h3 style={cardTitle}>Symptom-Glucose Correlations</h3>
                {result.symptomCorrelations.map((sc, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
                    <span style={{ color: "#1a2a5e", textTransform: "capitalize" }}>{sc.symptom.replace("_", " ")}</span>
                    <span style={{ color: sc.glucoseImpact === "raises" ? "#dc2626" : sc.glucoseImpact === "lowers" ? "#16a34a" : "#718096" }}>
                      {sc.glucoseImpact === "raises" ? "↑" : sc.glucoseImpact === "lowers" ? "↓" : "→"} {sc.avgGlucoseWhenPresent} vs {sc.avgGlucoseWhenAbsent} mmol/L
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Recommendations */}
            <div style={cardStyle}>
              <h3 style={cardTitle}>Recommendations</h3>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.8, color: "#1a2a5e" }}>
                {result.recommendations.map((r, i) => <li key={i}>{r}</li>)}
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
          <p>GluMira™ is an educational platform. Not a medical device. Always consult your diabetes care team.</p>
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
const statValue: React.CSSProperties = { fontSize: 22, fontWeight: 700, color: "#1a2a5e", fontFamily: "'JetBrains Mono', monospace" };
const thStyle: React.CSSProperties = { textAlign: "left", padding: "8px 12px", borderBottom: "2px solid #e2e8f0", color: "#1a2a5e", fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: "8px 12px", borderBottom: "1px solid #f1f5f9", color: "#4a5568" };
const btnStyle: React.CSSProperties = { padding: "10px 28px", background: "#2ab5c1", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" };
