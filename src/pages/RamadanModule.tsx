/**
 * GluMira™ V7 — Ramadan Dietary Module
 * Suhoor & Iftar planning, fasting insulin adjustments,
 * Tarawih activity impact, exemption guidance, and emergency protocols.
 */
import { useState } from "react";
import { Link } from "react-router-dom";

/* ── colour tokens ─────────────────────────────────── */
const NAVY = "#1A2A5E";
const TEAL = "#2AB5C1";

/* ── shared inline styles ──────────────────────────── */
const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 12,
  padding: 24,
  marginBottom: 20,
  border: "1px solid #e2e8f0",
};
const heading2: React.CSSProperties = { color: NAVY, fontSize: 20, fontWeight: 700, marginBottom: 12 };
const heading3: React.CSSProperties = { color: NAVY, fontSize: 16, fontWeight: 600, marginBottom: 8 };
const label: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4, fontSize: 14, color: "#4a5568" };
const input: React.CSSProperties = {
  padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1",
  fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
};
const btn: React.CSSProperties = {
  padding: "10px 20px", borderRadius: 8, border: "none",
  background: TEAL, color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
};
const pill: React.CSSProperties = {
  display: "inline-block", padding: "4px 10px", borderRadius: 999,
  fontSize: 12, fontWeight: 600, marginRight: 6, marginBottom: 6,
};
const emergencyBox: React.CSSProperties = {
  background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12,
  padding: 20, marginBottom: 20,
};

/* ── data ──────────────────────────────────────────── */
const SUHOOR_FOODS = [
  { name: "Whole-grain oats (50 g dry)", carbs: 30, protein: 6, fat: 3, gi: "low" },
  { name: "Boiled eggs (2)", carbs: 1, protein: 12, fat: 10, gi: "—" },
  { name: "Full-fat yoghurt (150 g)", carbs: 7, protein: 8, fat: 5, gi: "low" },
  { name: "Wholemeal bread (1 slice)", carbs: 18, protein: 4, fat: 1, gi: "med" },
  { name: "Peanut butter (1 tbsp)", carbs: 3, protein: 4, fat: 8, gi: "low" },
  { name: "Dates (2 Medjool)", carbs: 36, protein: 1, fat: 0, gi: "med" },
  { name: "Cheese (30 g)", carbs: 0, protein: 7, fat: 9, gi: "—" },
  { name: "Avocado (½)", carbs: 6, protein: 2, fat: 15, gi: "low" },
];

const IFTAR_FOODS = [
  { name: "Dates (3 Medjool)", carbs: 54, protein: 2, fat: 0 },
  { name: "Lentil soup (250 ml)", carbs: 20, protein: 10, fat: 3 },
  { name: "Grilled chicken (150 g)", carbs: 0, protein: 35, fat: 6 },
  { name: "Basmati rice (150 g cooked)", carbs: 40, protein: 4, fat: 0 },
  { name: "Fattoush salad (large bowl)", carbs: 12, protein: 3, fat: 8 },
  { name: "Samosa (1 medium)", carbs: 18, protein: 4, fat: 8 },
];

const EXEMPTION_CRITERIA = [
  { category: "Pregnancy / breastfeeding", ruling: "Exempt — obligatory to break fast if risk to mother or child.", ref: "Quran 2:184" },
  { category: "Acute illness", ruling: "Exempt — fast may be made up later when recovered.", ref: "Quran 2:185" },
  { category: "Chronic illness (incl. T1D)", ruling: "Many scholars consider diabetes a valid exemption. Fidyah may apply.", ref: "Islamic Fiqh Council, 2009" },
  { category: "Paediatric (pre-puberty)", ruling: "Not obligatory. Children are not required to fast.", ref: "Hadith consensus" },
  { category: "Elderly / frail", ruling: "Exempt — fidyah (feeding one poor person per day) applies.", ref: "Quran 2:184" },
  { category: "Travel", ruling: "Traveller may break fast and make up later.", ref: "Quran 2:184" },
];

const BASAL_REDUCTION_TABLE = [
  { therapy: "MDI — Glargine/Degludec", guidance: "Reduce basal by 20–30 % on fasting days. Take at Iftar time." },
  { therapy: "MDI — NPH / Isophane", guidance: "Reduce by 30–50 %. Switch timing to Iftar if possible." },
  { therapy: "Pump (CSII)", guidance: "Set a temporary basal rate −20 % from Suhoor to Iftar. Adjust daily." },
  { therapy: "Hybrid closed loop", guidance: "Use the system's activity/fasting mode if available. Monitor closely." },
];

const EID_MEALS = [
  { name: "Sheer khurma (vermicelli pudding)", carbs: 45 },
  { name: "Ma'amoul (date cookie, 1 pc)", carbs: 22 },
  { name: "Kunafa (1 slice)", carbs: 55 },
  { name: "Turkish delight (2 pieces)", carbs: 20 },
  { name: "Biryani (1 cup)", carbs: 50 },
  { name: "Baklava (1 piece)", carbs: 28 },
];

/* ── component ─────────────────────────────────────── */
export default function RamadanModule() {
  /* accordion state */
  const [open, setOpen] = useState<Record<string, boolean>>({
    suhoor: true, iftar: false, insulin: false, tarawih: false,
    exemption: false, emergency: false, eid: false,
  });
  const toggle = (key: string) => setOpen(o => ({ ...o, [key]: !o[key] }));

  /* suhoor planner */
  const [suhoorSelected, setSuhoorSelected] = useState<boolean[]>(new Array(SUHOOR_FOODS.length).fill(false));
  const suhoorTotals = SUHOOR_FOODS.reduce(
    (acc, f, i) => {
      if (!suhoorSelected[i]) return acc;
      return { carbs: acc.carbs + f.carbs, protein: acc.protein + f.protein, fat: acc.fat + f.fat };
    },
    { carbs: 0, protein: 0, fat: 0 },
  );

  /* iftar planner */
  const [iftarSelected, setIftarSelected] = useState<boolean[]>(new Array(IFTAR_FOODS.length).fill(false));
  const iftarTotals = IFTAR_FOODS.reduce(
    (acc, f, i) => {
      if (!iftarSelected[i]) return acc;
      return { carbs: acc.carbs + f.carbs, protein: acc.protein + f.protein, fat: acc.fat + f.fat };
    },
    { carbs: 0, protein: 0, fat: 0 },
  );

  /* insulin calc */
  const [currentBasal, setCurrentBasal] = useState("");
  const [reductionPct, setReductionPct] = useState(25);
  const adjustedBasal = currentBasal ? (parseFloat(currentBasal) * (1 - reductionPct / 100)).toFixed(1) : "—";

  /* tarawih */
  const [preTarawihBG, setPreTarawihBG] = useState("");
  const estimatedDrop = preTarawihBG ? (parseFloat(preTarawihBG) * 0.2).toFixed(1) : "—";
  const estimatedPost = preTarawihBG ? (parseFloat(preTarawihBG) * 0.8).toFixed(1) : "—";

  /* helpers */
  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div style={card}>
      <button type="button"
        onClick={() => toggle(id)}
        style={{
          all: "unset", cursor: "pointer", width: "100%", display: "flex",
          justifyContent: "space-between", alignItems: "center",
        }}
      >
        <h2 style={{ ...heading2, marginBottom: 0 }}>{title}</h2>
        <span style={{ color: TEAL, fontSize: 22, fontWeight: 700 }}>{open[id] ? "−" : "+"}</span>
      </button>
      {open[id] && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#ffffff", padding: 24 }}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        {/* nav */}
        <Link to="/education" style={{ color: TEAL, fontSize: 14, textDecoration: "none" }}>
          &larr; Back to Education
        </Link>

        {/* header */}
        <div style={{ margin: "16px 0 28px" }}>
          <h1 style={{ margin: 0, fontFamily: "'Inter', sans-serif", color: NAVY, fontSize: 30, fontWeight: 800 }}>
            Ramadan &amp; Diabetes
          </h1>
          <p style={{ margin: "4px 0 0", color: "#718096", fontSize: 15 }}>
            Safe fasting guidance for people living with diabetes during Ramadan
          </p>
        </div>

        {/* ─── 1. Suhoor ──────────────────────────── */}
        <Section id="suhoor" title="Suhoor Planner (Pre-Dawn Meal)">
          <p style={{ color: "#4a5568", fontSize: 14, marginBottom: 12 }}>
            Focus on <strong>slow-release carbohydrates</strong>, protein, and healthy fats to sustain energy through the fast.
            Aim for a low-GI meal eaten as close to Fajr as possible.
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                <th style={{ padding: 6 }}></th>
                <th style={{ padding: 6 }}>Food</th>
                <th style={{ padding: 6 }}>Carbs (g)</th>
                <th style={{ padding: 6 }}>Protein (g)</th>
                <th style={{ padding: 6 }}>Fat (g)</th>
                <th style={{ padding: 6 }}>GI</th>
              </tr>
            </thead>
            <tbody>
              {SUHOOR_FOODS.map((f, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 6 }}>
                    <input
                      type="checkbox"
                      checked={suhoorSelected[i]}
                      onChange={() => {
                        const next = [...suhoorSelected];
                        next[i] = !next[i];
                        setSuhoorSelected(next);
                      }}
                    />
                  </td>
                  <td style={{ padding: 6 }}>{f.name}</td>
                  <td style={{ padding: 6 }}>{f.carbs}</td>
                  <td style={{ padding: 6 }}>{f.protein}</td>
                  <td style={{ padding: 6 }}>{f.fat}</td>
                  <td style={{ padding: 6 }}><span style={{ ...pill, background: f.gi === "low" ? "#d1fae5" : f.gi === "med" ? "#fef9c3" : "#f3f4f6", color: "#1e293b" }}>{f.gi}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {suhoorSelected.some(Boolean) && (
            <div style={{ marginTop: 12, padding: 12, background: "#f0fdfa", borderRadius: 8 }}>
              <h3 style={heading3}>Suhoor Totals</h3>
              <p style={{ fontSize: 14, color: "#1e293b", margin: 0 }}>
                Carbs: <strong>{suhoorTotals.carbs} g</strong> &nbsp;|&nbsp;
                Protein: <strong>{suhoorTotals.protein} g</strong> &nbsp;|&nbsp;
                Fat: <strong>{suhoorTotals.fat} g</strong> &nbsp;|&nbsp;
                Est. kcal: <strong>{suhoorTotals.carbs * 4 + suhoorTotals.protein * 4 + suhoorTotals.fat * 9}</strong>
              </p>
            </div>
          )}
        </Section>

        {/* ─── 2. Iftar ───────────────────────────── */}
        <Section id="iftar" title="Iftar Planner (Sunset Meal)">
          <p style={{ color: "#4a5568", fontSize: 14, marginBottom: 12 }}>
            Break your fast <strong>gradually</strong>. Start with dates and water, then light soup, then the main meal
            after 15-20 minutes. This prevents rapid glucose spikes.
          </p>
          <div style={{ background: "#eff6ff", borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 13, color: "#1e40af" }}>
            <strong>Gradual refeeding order:</strong> 1) 1-3 dates + water &rarr; 2) Soup/salad (wait 15 min) &rarr; 3) Main meal with protein + complex carbs
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                <th style={{ padding: 6 }}></th>
                <th style={{ padding: 6 }}>Food</th>
                <th style={{ padding: 6 }}>Carbs (g)</th>
                <th style={{ padding: 6 }}>Protein (g)</th>
                <th style={{ padding: 6 }}>Fat (g)</th>
              </tr>
            </thead>
            <tbody>
              {IFTAR_FOODS.map((f, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 6 }}>
                    <input
                      type="checkbox"
                      checked={iftarSelected[i]}
                      onChange={() => {
                        const next = [...iftarSelected];
                        next[i] = !next[i];
                        setIftarSelected(next);
                      }}
                    />
                  </td>
                  <td style={{ padding: 6 }}>{f.name}</td>
                  <td style={{ padding: 6 }}>{f.carbs}</td>
                  <td style={{ padding: 6 }}>{f.protein}</td>
                  <td style={{ padding: 6 }}>{f.fat}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {iftarSelected.some(Boolean) && (
            <div style={{ marginTop: 12, padding: 12, background: "#f0fdfa", borderRadius: 8 }}>
              <h3 style={heading3}>Iftar Totals</h3>
              <p style={{ fontSize: 14, color: "#1e293b", margin: 0 }}>
                Carbs: <strong>{iftarTotals.carbs} g</strong> &nbsp;|&nbsp;
                Protein: <strong>{iftarTotals.protein} g</strong> &nbsp;|&nbsp;
                Fat: <strong>{iftarTotals.fat} g</strong>
              </p>
            </div>
          )}
        </Section>

        {/* ─── 3. Insulin adjustment ──────────────── */}
        <Section id="insulin" title="Fasting Insulin Adjustment Calculator">
          <p style={{ color: "#4a5568", fontSize: 14, marginBottom: 12 }}>
            Most people need to <strong>reduce basal insulin by 20-30 %</strong> during Ramadan fasting.
            Bolus insulin moves to Suhoor and Iftar only.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <label style={label}>
              Current daily basal (units)
              <input type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" min={0} step={0.5} value={currentBasal} onChange={e => setCurrentBasal(e.target.value)} style={input} placeholder="e.g. 20" />
            </label>
            <label style={label}>
              Reduction %
              <input type="range" min={10} max={50} value={reductionPct} onChange={e => setReductionPct(parseInt(e.target.value))} style={{ width: "100%" }} />
              <span style={{ fontSize: 13, color: TEAL, fontWeight: 600 }}>{reductionPct} %</span>
            </label>
          </div>

          {currentBasal && (
            <div style={{ background: "#f0fdfa", borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 15 }}>
                Suggested Ramadan basal: <strong style={{ color: TEAL, fontSize: 20 }}>{adjustedBasal} U</strong>
              </p>
            </div>
          )}

          <h3 style={heading3}>Therapy-specific guidance</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <tbody>
              {BASAL_REDUCTION_TABLE.map((r, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 8, fontWeight: 600, color: NAVY, width: "35%" }}>{r.therapy}</td>
                  <td style={{ padding: 8, color: "#4a5568" }}>{r.guidance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* ─── 4. Tarawih ─────────────────────────── */}
        <Section id="tarawih" title="Tarawih Prayer — Activity Impact">
          <p style={{ color: "#4a5568", fontSize: 14, marginBottom: 12 }}>
            Tarawih prayers involve standing, bowing, and prostration for 1-2 hours.
            This counts as <strong>light-to-moderate exercise</strong> and can reduce blood glucose by approximately <strong>20 %</strong>.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <label style={label}>
              Pre-Tarawih BG (mmol/L)
              <input type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" min={0} step={0.1} value={preTarawihBG} onChange={e => setPreTarawihBG(e.target.value)} style={input} placeholder="e.g. 8.5" />
            </label>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              {preTarawihBG && (
                <div style={{ background: "#f0fdfa", borderRadius: 8, padding: 12 }}>
                  <p style={{ margin: 0, fontSize: 13 }}>Estimated drop: <strong>{estimatedDrop} mmol/L</strong></p>
                  <p style={{ margin: "4px 0 0", fontSize: 13 }}>Post-Tarawih BG: <strong style={{ color: TEAL }}>{estimatedPost} mmol/L</strong></p>
                </div>
              )}
            </div>
          </div>
          <div style={{ background: "#fffbeb", borderRadius: 8, padding: 12, fontSize: 13, color: "#92400e" }}>
            <strong>Tip:</strong> If pre-Tarawih BG is below 7 mmol/L, consider a 15 g carb snack before prayers.
            If below 5 mmol/L, have a larger snack (20-30 g) and recheck before starting.
          </div>
        </Section>

        {/* ─── 5. Exemption checker ───────────────── */}
        <Section id="exemption" title="Fasting Exemption Checker">
          <p style={{ color: "#4a5568", fontSize: 14, marginBottom: 12 }}>
            Islam explicitly exempts certain people from fasting. <strong>Preserving life and health is a priority in Islamic law.</strong>
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                <th style={{ padding: 8 }}>Category</th>
                <th style={{ padding: 8 }}>Ruling</th>
                <th style={{ padding: 8 }}>Reference</th>
              </tr>
            </thead>
            <tbody>
              {EXEMPTION_CRITERIA.map((e, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 8, fontWeight: 600, color: NAVY }}>{e.category}</td>
                  <td style={{ padding: 8, color: "#4a5568" }}>{e.ruling}</td>
                  <td style={{ padding: 8 }}><span style={{ ...pill, background: "#ede9fe", color: "#5b21b6" }}>{e.ref}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* ─── 6. Emergency protocol ──────────────── */}
        <div style={emergencyBox}>
          <button type="button"
            onClick={() => toggle("emergency")}
            style={{
              all: "unset", cursor: "pointer", width: "100%", display: "flex",
              justifyContent: "space-between", alignItems: "center",
            }}
          >
            <h2 style={{ ...heading2, color: "#dc2626", marginBottom: 0 }}>
              "Break Your Fast Safely" — Emergency Protocol
            </h2>
            <span style={{ color: "#dc2626", fontSize: 22, fontWeight: 700 }}>{open.emergency ? "−" : "+"}</span>
          </button>
          {open.emergency && (
            <div style={{ marginTop: 16, fontSize: 14, color: "#1e293b" }}>
              <p style={{ fontWeight: 600, color: "#dc2626", marginBottom: 8 }}>
                You MUST break your fast immediately if:
              </p>
              <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 2 }}>
                <li>Blood glucose falls below <strong>3.9 mmol/L (70 mg/dL)</strong> at any time</li>
                <li>Blood glucose rises above <strong>16.7 mmol/L (300 mg/dL)</strong></li>
                <li>You feel symptoms of hypoglycaemia (shaking, sweating, confusion)</li>
                <li>You feel symptoms of DKA (nausea, vomiting, abdominal pain, fruity breath)</li>
                <li>You become unwell for any reason</li>
              </ol>
              <div style={{ background: "#fff", borderRadius: 8, padding: 16, marginTop: 12 }}>
                <h3 style={{ ...heading3, color: "#dc2626" }}>Hypo during fast — steps:</h3>
                <ol style={{ margin: 0, paddingLeft: 20, lineHeight: 2, fontSize: 13 }}>
                  <li>Stop fasting immediately — this is <strong>not optional</strong></li>
                  <li>Take 15 g fast-acting glucose (3-4 glucose tablets, 150 ml juice)</li>
                  <li>Wait 15 minutes, recheck BG</li>
                  <li>If still below 4 mmol/L, repeat step 2</li>
                  <li>Once above 4 mmol/L, eat a snack with complex carbs + protein</li>
                  <li>Do <strong>not</strong> resume fasting that day</li>
                  <li>Contact your diabetes team before fasting the next day</li>
                </ol>
              </div>
              <p style={{ marginTop: 12, fontSize: 13, color: "#6b7280" }}>
                Islamic scholars unanimously agree: preserving life overrides the obligation to fast.
                You are not sinning by breaking your fast for medical reasons.
              </p>
            </div>
          )}
        </div>

        {/* ─── 7. Eid celebration ─────────────────── */}
        <Section id="eid" title="Eid Celebration Meal Planning">
          <p style={{ color: "#4a5568", fontSize: 14, marginBottom: 12 }}>
            Eid meals tend to be high in carbohydrates and sweets. Plan bolus doses carefully and consider extended/dual-wave boluses for high-fat meals.
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                <th style={{ padding: 8 }}>Food</th>
                <th style={{ padding: 8 }}>Carbs (g)</th>
              </tr>
            </thead>
            <tbody>
              {EID_MEALS.map((m, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 8 }}>{m.name}</td>
                  <td style={{ padding: 8, fontWeight: 600, color: TEAL }}>{m.carbs}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ background: "#eff6ff", borderRadius: 8, padding: 12, marginTop: 12, fontSize: 13, color: "#1e40af" }}>
            <strong>Tip:</strong> For high-fat Eid sweets (baklava, kunafa), consider splitting your bolus: 60 % upfront and 40 % extended over 2-3 hours to match the delayed glucose rise.
          </div>
        </Section>

        {/* ─── Disclaimer ─────────────────────────── */}
        <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, marginTop: 8, border: "1px solid #e2e8f0" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>
            <strong>Disclaimer:</strong> This module provides general educational guidance only.
            Every person's diabetes is different. <strong>Consult your imam and your diabetes care team</strong> before
            making any changes to your fasting practice or insulin regimen. GluMira does not provide
            religious rulings (fatwa). References to Islamic sources are for educational context only.
          </p>
        </div>
      </div>
    </div>
  );
}
