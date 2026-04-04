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
  const [openTrimesterMeal, setOpenTrimesterMeal] = useState<number | null>(null);
  const [showPreeclampsia, setShowPreeclampsia] = useState(false);
  const [showPostpartum, setShowPostpartum] = useState(false);
  const [showBreastfeedingCalc, setShowBreastfeedingCalc] = useState(false);

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

        {/* Trimester Meal Plans */}
        <div style={{ ...cardStyle, marginTop: 20 }}>
          <h3 style={cardTitle}>Trimester Meal Plans</h3>
          {[
            {
              id: 1,
              title: "T1 — Weeks 1-12: First Trimester Nutrition",
              content: (
                <div style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.8 }}>
                  <p><strong>Nausea-Safe Foods:</strong> Focus on bland, easy-to-digest foods during this period of heightened nausea. Ginger tea is a natural anti-nausea remedy — sip throughout the day.</p>
                  <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                    <li><strong>Small, frequent meals</strong> — aim for 5-6 mini meals instead of 3 large ones to stabilise blood glucose and reduce nausea</li>
                    <li><strong>Anti-hypo snacks:</strong> Keep plain crackers, dry toast, and rice cakes on hand — quick carbs for low episodes (~15g each)</li>
                    <li><strong>Ginger tea:</strong> 1-2 cups/day helps with nausea; virtually zero carbs</li>
                    <li><strong>Plain crackers:</strong> ~5g carbs per cracker — good rescue snack and nausea settler</li>
                    <li><strong>Hydration:</strong> Small sips of water throughout the day; dehydration worsens nausea and affects BG readings</li>
                  </ul>
                </div>
              ),
            },
            {
              id: 2,
              title: "T2 — Weeks 13-26: Second Trimester Nutrition",
              content: (
                <div style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.8 }}>
                  <p><strong>Increased Calorie Needs:</strong> You need approximately <strong>+300 kcal/day</strong> above pre-pregnancy intake during this trimester.</p>
                  <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                    <li><strong>Iron-rich foods:</strong> Spinach (1 cup cooked = ~6mg iron, ~7g carbs), lentils (1 cup = ~6.6mg iron, ~40g carbs), red meat (lean beef = ~2.5mg iron per 100g, 0g carbs)</li>
                    <li><strong>Gestational diabetes monitoring:</strong> Insulin resistance naturally increases in T2 — monitor post-meal spikes closely. May need to increase bolus ratios by 10-20%</li>
                    <li><strong>Protein targets:</strong> Aim for 25g+ protein per meal to support fetal growth and slow glucose absorption</li>
                    <li><strong>Calcium:</strong> 1000mg/day — dairy, fortified plant milks, sardines</li>
                  </ul>
                </div>
              ),
            },
            {
              id: 3,
              title: "T3 — Weeks 27-40: Third Trimester Nutrition",
              content: (
                <div style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.8 }}>
                  <p><strong>Preparation Meals:</strong> Focus on nutrient-dense, easy-to-prepare meals as energy dips. Batch cook and freeze where possible.</p>
                  <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                    <li><strong>Insulin resistance peaks</strong> in T3 — total daily dose may increase 50-100% compared to pre-pregnancy</li>
                    <li><strong>Smaller, more frequent meals</strong> as stomach capacity decreases — aim for 6 small meals</li>
                    <li><strong>Omega-3 rich foods:</strong> Salmon, walnuts, chia seeds for brain development</li>
                  </ul>
                  <div style={{ marginTop: 12, padding: 12, background: "#fff7ed", borderRadius: 8, border: "1px solid #fed7aa" }}>
                    <strong style={{ color: "#ea580c" }}>Labour Bag Insulin Kit Checklist:</strong>
                    <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                      <li>Rapid-acting insulin (e.g., NovoRapid/Humalog) + spare pen/vial</li>
                      <li>Glucose tablets (at least 10 tablets / 40g fast carbs)</li>
                      <li>Glucagon emergency kit (check expiry date)</li>
                      <li>Blood glucose meter + spare test strips + lancets</li>
                      <li>Continuous glucose monitor (CGM) sensors if used</li>
                      <li>Juice boxes (3-4) for rapid hypo treatment</li>
                      <li>Written insulin dose plan from your diabetes team</li>
                    </ul>
                  </div>
                </div>
              ),
            },
          ].map(item => (
            <div key={item.id} style={{ marginBottom: 8 }}>
              <button
                onClick={() => setOpenTrimesterMeal(openTrimesterMeal === item.id ? null : item.id)}
                style={{ width: "100%", textAlign: "left", padding: "12px 16px", background: openTrimesterMeal === item.id ? "#e0f7f9" : "#f8f9fa", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#1a2a5e", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                {item.title}
                <span style={{ fontSize: 18, transform: openTrimesterMeal === item.id ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>&#9662;</span>
              </button>
              {openTrimesterMeal === item.id && (
                <div style={{ padding: "12px 16px", border: "1px solid #e2e8f0", borderTop: "none", borderRadius: "0 0 8px 8px" }}>
                  {item.content}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pre-eclampsia Nutrition */}
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <button
            onClick={() => setShowPreeclampsia(!showPreeclampsia)}
            style={{ width: "100%", textAlign: "left", padding: 0, background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <h3 style={{ ...cardTitle, margin: 0 }}>Pre-eclampsia Nutrition</h3>
            <span style={{ fontSize: 18, color: "#1a2a5e", transform: showPreeclampsia ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>&#9662;</span>
          </button>
          {showPreeclampsia && (
            <div style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.8, marginTop: 12 }}>
              <p>Pre-eclampsia risk increases with diabetes. Nutritional strategies to help reduce risk:</p>
              <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                <li><strong>Calcium-rich foods:</strong> Aim for 1200-1500mg/day — low-fat yoghurt (~200mg per serving, ~12g carbs), cheese (~200mg per 30g, ~1g carbs), fortified almond milk (~300mg per cup, ~1g carbs), broccoli, kale</li>
                <li><strong>Reduce sodium:</strong> Target &lt;2300mg/day. Avoid processed foods, canned soups, deli meats. Use herbs and spices for flavouring instead of salt</li>
                <li><strong>Monitor protein intake:</strong> Adequate protein (75-100g/day) supports healthy blood pressure. Include lean meats, eggs, legumes, and tofu at each meal</li>
                <li><strong>Potassium-rich foods:</strong> Bananas (~27g carbs each — bolus accordingly), sweet potatoes, avocados help counterbalance sodium</li>
                <li><strong>Magnesium:</strong> Dark leafy greens, pumpkin seeds, dark chocolate (70%+) — supports healthy blood pressure</li>
              </ul>
              <div style={{ padding: 10, background: "#fef2f2", borderRadius: 8, border: "1px solid #fca5a5", marginTop: 8 }}>
                <strong style={{ color: "#dc2626" }}>Warning signs to report immediately:</strong> severe headache, visual disturbances, sudden swelling (face/hands), upper abdominal pain, protein in urine
              </div>
            </div>
          )}
        </div>

        {/* Post-partum */}
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <button
            onClick={() => setShowPostpartum(!showPostpartum)}
            style={{ width: "100%", textAlign: "left", padding: 0, background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <h3 style={{ ...cardTitle, margin: 0 }}>Post-partum Insulin & Nutrition</h3>
            <span style={{ fontSize: 18, color: "#1a2a5e", transform: showPostpartum ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>&#9662;</span>
          </button>
          {showPostpartum && (
            <div style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.8, marginTop: 12 }}>
              <div style={{ padding: 12, background: "#fff7ed", borderRadius: 8, border: "1px solid #fed7aa", marginBottom: 12 }}>
                <strong style={{ color: "#ea580c" }}>Critical:</strong> Insulin needs drop <strong>50-60% immediately after delivery</strong>. Many women return to pre-pregnancy doses or even less in the first 24-48 hours. Monitor BG every 1-2 hours post-delivery.
              </div>
              <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                <li><strong>Immediate post-delivery:</strong> Reduce basal insulin by 50% right after placenta delivery. The placental hormones causing insulin resistance are gone within hours</li>
                <li><strong>First 1-2 weeks:</strong> Insulin sensitivity fluctuates significantly — test frequently (8-10 times/day or use CGM)</li>
                <li><strong>Breastfeeding adds ~500 kcal/day</strong> to your energy needs — do not skip meals or restrict calories while breastfeeding</li>
                <li><strong>Sleep deprivation</strong> increases insulin resistance and cortisol — accept help, nap when baby naps</li>
                <li><strong>Meal prep in advance:</strong> Stock freezer with balanced meals before delivery — you will not have energy to cook</li>
                <li><strong>Hydration:</strong> Breastfeeding requires extra fluids — aim for 2.5-3L water/day</li>
              </ul>
            </div>
          )}
        </div>

        {/* Breastfeeding Carb Calculator */}
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <button
            onClick={() => setShowBreastfeedingCalc(!showBreastfeedingCalc)}
            style={{ width: "100%", textAlign: "left", padding: 0, background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <h3 style={{ ...cardTitle, margin: 0 }}>Breastfeeding Carb Calculator</h3>
            <span style={{ fontSize: 18, color: "#1a2a5e", transform: showBreastfeedingCalc ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>&#9662;</span>
          </button>
          {showBreastfeedingCalc && (
            <div style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.8, marginTop: 12 }}>
              <p>Breastfeeding significantly affects carbohydrate needs and insulin dosing for T1D mothers:</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                <div style={{ ...statBox, background: "#e8f4fd" }}>
                  <div style={statLabel}>Extra Carbs Needed</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#1a2a5e", fontFamily: "'JetBrains Mono', monospace" }}>+50-60g/day</div>
                  <div style={{ fontSize: 11, color: "#718096", marginTop: 4 }}>Spread across meals and snacks</div>
                </div>
                <div style={{ ...statBox, background: "#f0fdf4" }}>
                  <div style={statLabel}>Bolus Reduction</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "#16a34a", fontFamily: "'JetBrains Mono', monospace" }}>~20% less</div>
                  <div style={{ fontSize: 11, color: "#718096", marginTop: 4 }}>Reduce bolus doses by approximately 20%</div>
                </div>
              </div>
              <ul style={{ paddingLeft: 20, margin: "12px 0" }}>
                <li><strong>Before each feed:</strong> Have a 15-20g carb snack to prevent hypos during breastfeeding (e.g., apple, small banana, oat bar)</li>
                <li><strong>Night feeds:</strong> Highest hypo risk — keep glucose tabs and a snack at your bedside</li>
                <li><strong>Each breastfeeding session</strong> uses ~20g of glucose from your body — factor this into bolus calculations</li>
                <li><strong>If BG drops below 4.0 mmol/L (72 mg/dL) while feeding:</strong> treat the hypo first, then continue feeding once stable</li>
                <li><strong>Gradually increase bolus</strong> back to normal as you wean — insulin needs rise as breastfeeding decreases</li>
              </ul>
              <div style={{ padding: 12, background: "#e8f4fd", borderRadius: 8, border: "1px solid #93c5fd" }}>
                <strong>Quick Reference:</strong> If your pre-pregnancy bolus ratio was 1:10, try 1:12 while breastfeeding (i.e., 1 unit per 12g carbs instead of 10g)
              </div>
            </div>
          )}
        </div>

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
