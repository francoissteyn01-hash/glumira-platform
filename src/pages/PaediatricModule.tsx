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
  const [openAgeBand, setOpenAgeBand] = useState<number | null>(null);
  const [showGrowthSpurt, setShowGrowthSpurt] = useState(false);
  const [showPuberty, setShowPuberty] = useState(false);

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
            <label style={labelStyle}>Age (years)<input type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" min={0} max={25} value={form.ageYears} onChange={e => setForm(f => ({ ...f, ageYears: parseInt(e.target.value) || 0 }))} style={inputStyle} /></label>
            <label style={labelStyle}>Weight (kg)<input type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" min={1} max={150} step="0.1" value={form.weightKg} onChange={e => setForm(f => ({ ...f, weightKg: parseFloat(e.target.value) || 1 }))} style={inputStyle} /></label>
            <label style={labelStyle}>Diabetes Type
              <select value={form.diabetesType} onChange={e => setForm(f => ({ ...f, diabetesType: e.target.value as any }))} style={inputStyle}>
                <option value="type1">Type 1</option><option value="type2">Type 2</option>
              </select>
            </label>
            <label style={labelStyle}>Years Since Diagnosis<input type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" min={0} max={25} value={form.yearsSinceDiagnosis} onChange={e => setForm(f => ({ ...f, yearsSinceDiagnosis: parseInt(e.target.value) || 0 }))} style={inputStyle} /></label>
            <label style={labelStyle}>Puberty Stage
              <select value={form.pubertyStage} onChange={e => setForm(f => ({ ...f, pubertyStage: e.target.value as any }))} style={inputStyle}>
                {PUBERTY_STAGES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
            <label style={labelStyle}>Hypos / Week<input type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" min={0} max={20} value={form.recentHyposPerWeek} onChange={e => setForm(f => ({ ...f, recentHyposPerWeek: parseInt(e.target.value) || 0 }))} style={inputStyle} /></label>
            <label style={labelStyle}>Meals / Day<input type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" min={1} max={8} value={form.mealsPerDay} onChange={e => setForm(f => ({ ...f, mealsPerDay: parseInt(e.target.value) || 3 }))} style={inputStyle} /></label>
            <label style={labelStyle}>Avg Carbs / Meal (g)<input type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" min={0} max={200} value={form.avgCarbsPerMeal} onChange={e => setForm(f => ({ ...f, avgCarbsPerMeal: parseInt(e.target.value) || 0 }))} style={inputStyle} /></label>
            <label style={labelStyle}>Current A1c (%)
              <input type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" step="0.1" placeholder="Optional" value={form.currentA1c} onChange={e => setForm(f => ({ ...f, currentA1c: e.target.value }))} style={inputStyle} />
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
          <button type="button" onClick={handleCalculate} style={btnStyle}>Calculate Dose Estimates</button>
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

        {/* Age-Banded Meal Plans */}
        <div style={{ ...cardStyle, marginTop: 20 }}>
          <h3 style={cardTitle}>Age-Banded Meal Plans</h3>
          {[
            {
              id: 1,
              title: "0-2 Years: Infant Feeding & Insulin",
              content: (
                <div style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.8 }}>
                  <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                    <li><strong>Breast/bottle feeding insulin timing:</strong> Bolus after feeds (not before) since intake volume is unpredictable. Give insulin once you know how much the baby consumed</li>
                    <li><strong>Formula carb counts:</strong> Standard formula = ~7g carbs per 100ml. Breast milk = ~7g carbs per 100ml. Always check specific brand labels</li>
                    <li><strong>Feeding frequency:</strong> Newborns feed 8-12 times/day — micro-dosing insulin (0.5U pens or diluted insulin) may be needed</li>
                    <li><strong>Introducing solids (6+ months):</strong> Start with low-carb purees (avocado, meat), then slowly introduce carbs. Count every gram — small bodies react to tiny amounts</li>
                    <li><strong>Hypo treatment:</strong> Tiny doses — 5g fast carbs (e.g., 50ml juice) for infants under 10kg</li>
                    <li><strong>Night monitoring:</strong> CGM is strongly recommended — nocturnal hypos are the highest risk in this age group</li>
                  </ul>
                </div>
              ),
            },
            {
              id: 2,
              title: "2-5 Years: Toddler Nutrition",
              content: (
                <div style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.8 }}>
                  <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                    <li><strong>Toddler portions:</strong> Approximately 1/4 of an adult portion. A toddler meal = ~15-20g carbs typically</li>
                    <li><strong>Picky eater strategies:</strong> Bolus after eating (not before!) since toddlers frequently refuse food mid-meal. Use the "eat first, dose after" approach</li>
                    <li><strong>Consistent carb snacks:</strong> Keep reliable favourites on hand — small banana (~15g), half a sandwich (~15g), apple slices (~10g)</li>
                    <li><strong>Food refusal plan:</strong> If child refuses food after bolus — offer juice or yoghurt drink to cover the insulin already given</li>
                  </ul>
                  <div style={{ padding: 12, background: "#fef3c7", borderRadius: 8, border: "1px solid #fcd34d", marginTop: 8 }}>
                    <strong style={{ color: "#92400e" }}>Birthday Party Survival Guide:</strong>
                    <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                      <li>Average slice of birthday cake = ~30g carbs — pre-bolus 10-15 min before eating</li>
                      <li>Party bags/lollies: count carbs before eating, keep a reference card</li>
                      <li>Bring a "safe" snack as backup if the child refuses party food after bolusing</li>
                      <li>High activity at parties can cause delayed hypos — check BG 2-3 hours after</li>
                    </ul>
                  </div>
                </div>
              ),
            },
            {
              id: 3,
              title: "5-10 Years: School-Age Nutrition",
              content: (
                <div style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.8 }}>
                  <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                    <li><strong>School lunch planning:</strong> Pack lunches with pre-counted carbs. Label containers with carb counts. Provide the school with a carb list for common lunch items</li>
                    <li><strong>After-school snack protocols:</strong> Children are often low after a school day — have a 15-25g carb snack ready (crackers + cheese, fruit + peanut butter). Check BG on arrival home</li>
                    <li><strong>Sports day nutrition:</strong> Add +15g carbs pre-activity (e.g., a small muesli bar). Reduce bolus by 20-50% for the meal before sport. Carry fast-acting carbs (juice box) on the sideline</li>
                    <li><strong>School hypo kit:</strong> Glucose tabs, juice boxes, and glucagon should be at school at all times. Ensure teacher knows the signs of hypos</li>
                    <li><strong>Sleepover prep:</strong> Send a carb guide, pre-counted snacks, and emergency contact info. Brief the host parent on hypo signs and treatment</li>
                  </ul>
                </div>
              ),
            },
            {
              id: 4,
              title: "10-13 Years: Pre-teen Independence",
              content: (
                <div style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.8 }}>
                  <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                    <li><strong>Growing portions:</strong> Meal sizes increase significantly — a typical lunch may be 40-60g carbs now. Re-count portions regularly as appetites grow</li>
                    <li><strong>Building independence:</strong> Teach carb counting with common foods. Use apps or visual portion guides. Let them bolus with supervision</li>
                    <li><strong>Sports nutrition:</strong> Organised sports become more intense. Pre-match meal: 1-2 hours before, 30-45g carbs + protein. During: 15g carbs every 30-45 min of intense activity. Post: protein + carbs within 30 min</li>
                    <li><strong>Lunchbox autonomy:</strong> Start letting them choose/pack their own lunch with carb guidelines — builds lifelong self-management skills</li>
                    <li><strong>Screen-time snacking:</strong> Mindless eating while gaming/watching can cause BG spikes — set portioned snacks rather than open packets</li>
                  </ul>
                </div>
              ),
            },
            {
              id: 5,
              title: "13-18 Years: Teen Eating Patterns",
              content: (
                <div style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.8 }}>
                  <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                    <li><strong>Teen eating patterns:</strong> Irregular meals are common. Encourage regular mealtimes but accept flexibility. Teach "estimate and correct" approach for spontaneous eating</li>
                    <li><strong>Social eating:</strong> Fast food carb guide — McDonald's Big Mac ~46g, large fries ~65g, pizza slice ~30g, bubble tea ~50-70g. Encourage pre-checking menus for carb counts</li>
                    <li><strong>Exam stress:</strong> Cortisol raises BG — may need +10-15% basal during exam periods. Keep study snacks low-GI (nuts, cheese, dark chocolate)</li>
                  </ul>
                  <div style={{ padding: 12, background: "#fef2f2", borderRadius: 8, border: "1px solid #fca5a5", marginTop: 8 }}>
                    <strong style={{ color: "#dc2626" }}>Alcohol Awareness (16+):</strong>
                    <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                      <li><strong>Alcohol blocks liver glucose production</strong> = significantly increased hypo risk for up to 24 hours after drinking</li>
                      <li>Never bolus for alcohol carbs the same way as food — alcohol can cause severe delayed hypos</li>
                      <li>Always eat carbs while drinking — do NOT drink on an empty stomach</li>
                      <li>Reduce overnight basal by 20-30% after drinking, or set a lower temp basal on pump</li>
                      <li>Wear medical ID. Tell friends how to spot and treat a hypo (vs. assuming "drunk")</li>
                      <li>Check BG before bed, set alarms for overnight checks, keep snacks by bed</li>
                    </ul>
                  </div>
                </div>
              ),
            },
          ].map(item => (
            <div key={item.id} style={{ marginBottom: 8 }}>
              <button type="button"
                onClick={() => setOpenAgeBand(openAgeBand === item.id ? null : item.id)}
                style={{ width: "100%", textAlign: "left", padding: "12px 16px", background: openAgeBand === item.id ? "#fef3c7" : "#f8f9fa", border: "1px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#1a2a5e", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                {item.title}
                <span style={{ fontSize: 18, transform: openAgeBand === item.id ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>&#9662;</span>
              </button>
              {openAgeBand === item.id && (
                <div style={{ padding: "12px 16px", border: "1px solid #e2e8f0", borderTop: "none", borderRadius: "0 0 8px 8px" }}>
                  {item.content}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Growth Spurt Alert */}
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <button type="button"
            onClick={() => setShowGrowthSpurt(!showGrowthSpurt)}
            style={{ width: "100%", textAlign: "left", padding: 0, background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <h3 style={{ ...cardTitle, margin: 0 }}>Growth Spurt Alert</h3>
            <span style={{ fontSize: 18, color: "#1a2a5e", transform: showGrowthSpurt ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>&#9662;</span>
          </button>
          {showGrowthSpurt && (
            <div style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.8, marginTop: 12 }}>
              <div style={{ padding: 12, background: "#fff7ed", borderRadius: 8, border: "1px solid #fed7aa", marginBottom: 12 }}>
                <strong style={{ color: "#ea580c" }}>Key Point:</strong> Rapid growth causes temporary insulin resistance. Your child may need <strong>20-30% more insulin</strong> during a growth spurt.
              </div>
              <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                <li><strong>Signs of a growth spurt:</strong> Increased appetite, persistent high BG readings despite correct carb counting, needing new shoes/clothes frequently, sleeping more</li>
                <li><strong>Typical timing:</strong> Growth spurts are common at ages 2-3, 6-8, and throughout puberty. They can last 2-6 weeks</li>
                <li><strong>Insulin adjustment:</strong> Increase basal by 10-15% first. If post-meal spikes persist, increase bolus ratios. Review every 3-5 days during the spurt</li>
                <li><strong>Nutrition during growth:</strong> Increased protein needs (meat, eggs, dairy, legumes). Extra calcium for bone growth. Do not restrict calories — growing children need fuel</li>
                <li><strong>After the spurt:</strong> BG may suddenly drop as growth slows — be ready to reduce insulin back. Watch for increased hypos as the signal that the spurt has ended</li>
              </ul>
            </div>
          )}
        </div>

        {/* Puberty Section */}
        <div style={{ ...cardStyle, marginTop: 16 }}>
          <button type="button"
            onClick={() => setShowPuberty(!showPuberty)}
            style={{ width: "100%", textAlign: "left", padding: 0, background: "none", border: "none", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
          >
            <h3 style={{ ...cardTitle, margin: 0 }}>Puberty & Insulin Resistance</h3>
            <span style={{ fontSize: 18, color: "#1a2a5e", transform: showPuberty ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>&#9662;</span>
          </button>
          {showPuberty && (
            <div style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.8, marginTop: 12 }}>
              <p>Puberty is one of the most challenging periods for diabetes management. Hormonal changes cause significant insulin resistance.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "12px 0" }}>
                <div style={{ ...statBox, background: "#fef2f2" }}>
                  <div style={statLabel}>Insulin Need Increase</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#dc2626", fontFamily: "'JetBrains Mono', monospace" }}>+30-50%</div>
                  <div style={{ fontSize: 11, color: "#718096", marginTop: 4 }}>Above pre-puberty doses</div>
                </div>
                <div style={{ ...statBox, background: "#fff7ed" }}>
                  <div style={statLabel}>Peak Resistance Time</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#ea580c", fontFamily: "'JetBrains Mono', monospace" }}>4-7 AM</div>
                  <div style={{ fontSize: 11, color: "#718096", marginTop: 4 }}>Dawn phenomenon window</div>
                </div>
              </div>
              <ul style={{ paddingLeft: 20, margin: "8px 0" }}>
                <li><strong>Dawn phenomenon:</strong> Growth hormone surges overnight (especially during puberty) cause morning insulin resistance. BG often rises 4-7 AM even without food. Solutions: increase overnight basal, or use a pump with higher early-morning rates</li>
                <li><strong>Girls:</strong> Puberty typically starts ages 8-13. Expect insulin resistance to begin rising with breast development. Menstrual cycles add another layer of hormonal variability (see Menstrual Cycle module)</li>
                <li><strong>Boys:</strong> Puberty typically starts ages 9-14. Testosterone increases muscle mass which can eventually improve sensitivity, but during active puberty, resistance dominates</li>
                <li><strong>Emotional impact:</strong> Hormonal mood swings + diabetes management burnout is common. Be supportive, not controlling. Consider diabetes peer groups or psychology support</li>
                <li><strong>A1c may worsen:</strong> A temporary A1c increase of 0.5-1% is common during puberty despite best efforts. Focus on TIR (time in range) rather than perfection</li>
                <li><strong>Post-puberty:</strong> Insulin needs often decrease 10-20% once puberty completes. Watch for increased hypos as hormones stabilise</li>
              </ul>
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
const inputStyle: React.CSSProperties = { padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 };
const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20 };
const cardTitle: React.CSSProperties = { fontSize: 16, color: "#1a2a5e", marginBottom: 12, fontFamily: "'Playfair Display', serif" };
const statBox: React.CSSProperties = { background: "#f8f9fa", padding: 12, borderRadius: 12, textAlign: "center" };
const statLabel: React.CSSProperties = { fontSize: 11, color: "#718096", marginBottom: 4 };
const statValue: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: "#1a2a5e", fontFamily: "'JetBrains Mono', monospace" };
const btnStyle: React.CSSProperties = { marginTop: 20, padding: "10px 28px", background: "#2ab5c1", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" };
