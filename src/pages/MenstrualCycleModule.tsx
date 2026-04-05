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
  const [openPhaseNutrition, setOpenPhaseNutrition] = useState<number | null>(null);
  const [showCravings, setShowCravings] = useState(false);
  const [showContraception, setShowContraception] = useState(false);

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
              <input type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" min={21} max={40} value={cycleLength} onChange={e => setCycleLength(parseInt(e.target.value) || 28)} style={{ ...inputStyle, width: 70, marginLeft: 8 }} />
            </label>
            <label style={{ fontSize: 13, color: "#4a5568" }}>Current Day:
              <input type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" min={1} max={cycleLength} value={currentDay} onChange={e => setCurrentDay(parseInt(e.target.value) || 1)} style={{ ...inputStyle, width: 70, marginLeft: 8 }} />
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
              <input type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" step="0.1" placeholder="Optional" value={entryForm.basalDose} onChange={e => setEntryForm(f => ({ ...f, basalDose: e.target.value }))} style={inputStyle} />
            </label>
            <label style={labelStyle}>Total Bolus (U)
              <input type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" step="0.1" placeholder="Optional" value={entryForm.totalBolus} onChange={e => setEntryForm(f => ({ ...f, totalBolus: e.target.value }))} style={inputStyle} />
            </label>
            <label style={labelStyle}>Total Carbs (g)
              <input type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" placeholder="Optional" value={entryForm.totalCarbs} onChange={e => setEntryForm(f => ({ ...f, totalCarbs: e.target.value }))} style={inputStyle} />
            </label>
          </div>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#4a5568", marginBottom: 6 }}>Symptoms</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {SYMPTOMS.map(s => (
                <button type="button" key={s} onClick={() => toggleSymptom(s)} style={{ padding: "4px 10px", borderRadius: 16, fontSize: 12, border: `1px solid ${entryForm.symptoms.includes(s) ? "#2ab5c1" : "#d1d5db"}`, background: entryForm.symptoms.includes(s) ? "#e0f7f9" : "#fff", color: entryForm.symptoms.includes(s) ? "#0e7490" : "#4a5568", cursor: "pointer" }}>
                  {s.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#4a5568" }}>Mood:</span>
            {MOODS.map(m => (
              <button type="button" key={m} onClick={() => setEntryForm(f => ({ ...f, mood: m }))} style={{ padding: "4px 12px", borderRadius: 16, fontSize: 12, border: `1px solid ${entryForm.mood === m ? "#2ab5c1" : "#d1d5db"}`, background: entryForm.mood === m ? "#e0f7f9" : "#fff", color: entryForm.mood === m ? "#0e7490" : "#4a5568", cursor: "pointer" }}>
                {m}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button type="button" onClick={addEntry} style={btnStyle}>Log & Analyze</button>
            {entries.length > 0 && (
              <button type="button" onClick={analyzeAll} style={{ ...btnStyle, background: "#1a2a5e" }}>Re-Analyze All ({entries.length} days)</button>
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

        {/* Phase-Specific Nutrition */}
        <div style={{ ...cardStyle, marginTop: 20 }}>
          <h3 style={cardTitle}>Phase-Specific Nutrition</h3>
          {[
            {
              id: 1,
              title: "Follicular Phase (Day 1-13)",
              content: (
                <div style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.8 }}>
                  <p>Insulin sensitivity is generally <strong>improving</strong> during this phase. Energy levels increase as oestrogen rises.</p>
                  <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                    <li><strong>Iron recovery foods:</strong> Replenish iron lost during menstruation — red meat (100g = ~2.5mg iron, 0g carbs), spinach (1 cup cooked = ~6mg iron, ~7g carbs), lentils (1 cup = ~6.6mg iron, ~40g carbs), fortified cereals</li>
                    <li><strong>Moderate carbs:</strong> Insulin sensitivity is returning to baseline — standard carb ratios should work well. Good time to re-calibrate your ICR if needed</li>
                    <li><strong>Energy increasing:</strong> As oestrogen rises, energy and motivation increase. Good time for more active exercise — but watch for post-exercise hypos as sensitivity is higher</li>
                    <li><strong>Vitamin C:</strong> Pair iron-rich foods with vitamin C (citrus, capsicum, tomatoes) to boost iron absorption</li>
                    <li><strong>Hydration:</strong> Replenish fluids lost during menstruation — aim for 2L+ per day</li>
                  </ul>
                </div>
              ),
            },
            {
              id: 2,
              title: "Ovulation (Day ~14)",
              content: (
                <div style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.8 }}>
                  <div style={{ padding: 12, background: "#f0fdf4", borderRadius: 8, border: "1px solid #bbf7d0", marginBottom: 12 }}>
                    <strong style={{ color: "#16a34a" }}>Peak insulin sensitivity</strong> — you may need <strong>less insulin</strong> around ovulation. Watch for unexpected hypos.
                  </div>
                  <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                    <li><strong>Lighter meals:</strong> Some women experience reduced appetite at ovulation. Listen to your body — smaller meals with adequate protein are fine</li>
                    <li><strong>Insulin adjustment:</strong> Consider reducing bolus by 10-15% if you notice a pattern of lows around ovulation. Track this over 2-3 cycles to confirm</li>
                    <li><strong>Exercise caution:</strong> Peak sensitivity + exercise = higher hypo risk. Reduce pre-exercise bolus or add 15g carbs before activity</li>
                    <li><strong>This phase is brief</strong> (1-2 days) — be ready for insulin resistance to begin climbing as you enter the luteal phase</li>
                  </ul>
                </div>
              ),
            },
            {
              id: 3,
              title: "Luteal Phase (Day 15-28)",
              content: (
                <div style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.8 }}>
                  <div style={{ padding: 12, background: "#fff7ed", borderRadius: 8, border: "1px solid #fed7aa", marginBottom: 12 }}>
                    <strong style={{ color: "#ea580c" }}>Insulin resistance increases 15-20%</strong> during the luteal phase due to rising progesterone. You may need to adjust basal and bolus doses upward.
                  </div>
                  <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                    <li><strong>Magnesium-rich foods:</strong> Help with PMS symptoms AND insulin sensitivity — dark chocolate 70%+ (~13g carbs per 30g), almonds (~3g carbs per 30g), bananas (~27g carbs), cashews, pumpkin seeds</li>
                    <li><strong>Craving management:</strong> Progesterone drives carb and sugar cravings. Plan for them rather than fighting them — pre-counted treat portions prevent binge-and-spike cycles</li>
                    <li><strong>Complex carbs:</strong> Choose whole grains, sweet potato, oats over refined carbs — slower glucose release during a period of higher resistance</li>
                    <li><strong>Increase basal:</strong> Consider +10-15% basal from ~Day 21 onwards. Some pump users set a "luteal" profile</li>
                    <li><strong>Fibre:</strong> Increase fibre intake (vegetables, legumes, whole grains) to slow glucose absorption and help with bloating</li>
                    <li><strong>Reduce caffeine:</strong> Caffeine can worsen PMS symptoms and increase BG variability</li>
                  </ul>
                </div>
              ),
            },
            {
              id: 4,
              title: "Menstruation (Day 1-5)",
              content: (
                <div style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.8 }}>
                  <p>Progesterone drops sharply, and insulin sensitivity begins to improve. Focus on comfort and replenishment.</p>
                  <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                    <li><strong>Anti-inflammatory foods:</strong> Salmon (omega-3, 0g carbs), turmeric (add to soups/smoothies, ~2g carbs per tsp), ginger tea (0g carbs), berries (antioxidants, ~12g carbs per cup)</li>
                    <li><strong>Iron replenishment:</strong> Iron stores drop during menstruation. Prioritise iron-rich meals — steak, dark leafy greens, eggs, fortified cereals. Pair with vitamin C for absorption</li>
                    <li><strong>Comfort food swaps:</strong> Instead of high-carb comfort foods, try: soup (broth-based = ~10g carbs), baked sweet potato (~26g carbs) with butter, warm oatmeal (~27g per 1/2 cup dry) with cinnamon</li>
                    <li><strong>Insulin adjustment:</strong> Reduce basal back to standard rates as progesterone drops — usually by Day 2-3 of menstruation. Watch for hypos as sensitivity returns</li>
                    <li><strong>Heat + rest:</strong> Heating pads for cramps do not affect BG. Rest when needed — sleep deprivation from pain increases insulin resistance</li>
                  </ul>
                </div>
              ),
            },
          ].map(item => (
            <div key={item.id} style={{ marginBottom: 8 }}>
              <button type="button"
                onClick={() => setOpenPhaseNutrition(openPhaseNutrition === item.id ? null : item.id)}
                style={{ width: "100%", textAlign: "left", padding: "12px 16px", background: openPhaseNutrition === item.id ? "#fae8ff" : "#f8f9fa", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#1a2a5e", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                {item.title}
                <span style={{ fontSize: 18, transform: openPhaseNutrition === item.id ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>&#9662;</span>
              </button>
              {openPhaseNutrition === item.id && (
                <div style={{ padding: "12px 16px", border: "1px solid #e2e8f0", borderTop: "none", borderRadius: "0 0 8px 8px" }}>
                  {item.content}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Craving Management */}
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <button type="button"
            onClick={() => setShowCravings(!showCravings)}
            style={{ width: "100%", textAlign: "left", padding: 0, background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <h3 style={{ ...cardTitle, margin: 0 }}>Craving Management for T1D</h3>
            <span style={{ fontSize: 18, color: "#1a2a5e", transform: showCravings ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>&#9662;</span>
          </button>
          {showCravings && (
            <div style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.8, marginTop: 12 }}>
              <p>Hormonal cravings are real and fighting them entirely leads to binge cycles. Instead, plan T1D-safe alternatives:</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, margin: "12px 0" }}>
                <div style={{ ...statBox, background: "#fae8ff" }}>
                  <div style={statLabel}>Dark Chocolate 70%+</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#1a2a5e", fontFamily: "'JetBrains Mono', monospace" }}>~13g carbs</div>
                  <div style={{ fontSize: 11, color: "#718096", marginTop: 4 }}>per 30g serving</div>
                </div>
                <div style={{ ...statBox, background: "#e0f7f9" }}>
                  <div style={statLabel}>Frozen Yoghurt</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#1a2a5e", fontFamily: "'JetBrains Mono', monospace" }}>~17g carbs</div>
                  <div style={{ fontSize: 11, color: "#718096", marginTop: 4 }}>per 1/2 cup serving</div>
                </div>
                <div style={{ ...statBox, background: "#f0fdf4" }}>
                  <div style={statLabel}>Cheese (30g)</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#1a2a5e", fontFamily: "'JetBrains Mono', monospace" }}>~0.5g carbs</div>
                  <div style={{ fontSize: 11, color: "#718096", marginTop: 4 }}>Virtually zero-carb comfort</div>
                </div>
              </div>
              <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                <li><strong>Pre-portion treats:</strong> Divide chocolate bars or snacks into single servings with carb counts written on each bag</li>
                <li><strong>Protein pairing:</strong> Eating protein with a craving food slows glucose spike — e.g., chocolate + almonds, yoghurt + berries</li>
                <li><strong>Sugar-free options:</strong> Sugar-free jelly (~1g carbs), diet hot chocolate (~3g carbs), sugar-free ice lollies (~2g carbs)</li>
                <li><strong>Salty cravings:</strong> Cheese (~0.5g carbs per 30g), olives (~0.5g carbs per 5), pickles (~1g carbs), salted nuts (~4g carbs per 30g)</li>
                <li><strong>Plan, don't restrict:</strong> Allow yourself a pre-counted treat daily during the luteal phase. Bolus accurately and enjoy it guilt-free</li>
              </ul>
            </div>
          )}
        </div>

        {/* Hormonal Contraception Impact */}
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <button type="button"
            onClick={() => setShowContraception(!showContraception)}
            style={{ width: "100%", textAlign: "left", padding: 0, background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <h3 style={{ ...cardTitle, margin: 0 }}>Hormonal Contraception & Insulin Impact</h3>
            <span style={{ fontSize: 18, color: "#1a2a5e", transform: showContraception ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>&#9662;</span>
          </button>
          {showContraception && (
            <div style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.8, marginTop: 12 }}>
              <p>Hormonal contraception can affect insulin sensitivity. Understanding these effects helps with dose adjustments:</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "12px 0" }}>
                <div style={{ padding: 16, background: "#fef2f2", borderRadius: 12, border: "1px solid #fca5a5" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#dc2626", marginBottom: 8 }}>Combined Pill (Oestrogen + Progesterone)</div>
                  <ul style={{ paddingLeft: 16, margin: 0 }}>
                    <li>May increase insulin resistance by <strong>5-10%</strong></li>
                    <li>Effect is consistent throughout the month (no cyclical variation)</li>
                    <li>May need to increase TDD by 5-10% when starting</li>
                    <li>Pill-free week may cause a temporary dip in BG — watch for hypos</li>
                    <li>Higher oestrogen formulations have a greater impact</li>
                  </ul>
                </div>
                <div style={{ padding: 16, background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#16a34a", marginBottom: 8 }}>Progesterone-Only (Mini Pill / Implant / IUS)</div>
                  <ul style={{ paddingLeft: 16, margin: 0 }}>
                    <li>Generally has <strong>less impact</strong> on insulin resistance</li>
                    <li>Some women report minimal to no change in insulin needs</li>
                    <li>Mirena IUS (local progesterone) has very little systemic effect on BG</li>
                    <li>Implant (Nexplanon) effects vary — monitor for first 3 months</li>
                    <li>May reduce or eliminate cyclical BG patterns (fewer highs/lows)</li>
                  </ul>
                </div>
              </div>
              <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                <li><strong>When starting any new contraception:</strong> Monitor BG closely for the first 2-3 months. Log patterns and discuss insulin adjustments with your diabetes team</li>
                <li><strong>Copper IUD (non-hormonal):</strong> No effect on insulin or BG — but may increase menstrual bleeding (more iron loss)</li>
                <li><strong>Depo-Provera injection:</strong> Can cause weight gain and increased insulin resistance in some women — monitor closely</li>
                <li><strong>Switching methods:</strong> Allow 4-6 weeks for insulin needs to stabilise after changing contraception</li>
              </ul>
            </div>
          )}
        </div>

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
