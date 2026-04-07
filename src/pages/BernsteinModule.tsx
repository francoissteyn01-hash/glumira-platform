/**
 * GluMira™ V7 — Bernstein Low-Carb Module
 * Dr. Bernstein's approach for T1D: Law of Small Numbers,
 * allowed foods, meal templates, protein conversion, micro-dosing, and transition guide.
 */
import { useState } from "react";
import { Link } from "react-router-dom";

/* ── colour tokens ─────────────────────────────────── */
const NAVY = "#1A2A5E";
const TEAL = "#2AB5C1";

/* ── shared inline styles ──────────────────────────── */
const card: React.CSSProperties = {
  background: "var(--bg-card)", borderRadius: 12, padding: 24,
  marginBottom: 20, border: "1px solid var(--border)",
};
const heading2: React.CSSProperties = { color: NAVY, fontSize: 20, fontWeight: 700, marginBottom: 12 };
const heading3: React.CSSProperties = { color: NAVY, fontSize: 16, fontWeight: 600, marginBottom: 8 };
const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4, fontSize: 14, color: "#4a5568" };
const inputStyle: React.CSSProperties = {
  padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1",
  fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
};
const pill: React.CSSProperties = {
  display: "inline-block", padding: "4px 10px", borderRadius: 999,
  fontSize: 12, fontWeight: 600, marginRight: 6, marginBottom: 6,
};

/* ── data ──────────────────────────────────────────── */
const SMALL_NUMBERS = [
  { principle: "Small carb inputs", detail: "Eating 6-12 g carbs per meal means a dosing error of even 50 % only causes a small BG change. A 50 % error on a 60 g carb meal could swing BG by 150 mg/dL." },
  { principle: "Small insulin doses", detail: "Smaller doses are more predictable. A 1 U dose has less absorption variability than a 10 U dose. Injection site, depth, and temperature affect large doses more." },
  { principle: "Small BG excursions", detail: "Keeping BG in a narrow range (83-100 mg/dL / 4.6-5.6 mmol/L target) minimises both acute symptoms and long-term complications." },
  { principle: "Predictable outcomes", detail: "When both food and insulin inputs are small, the result is far more predictable. The goal is 'boring' — flat, stable BG lines." },
];

type FoodCategory = "Proteins" | "Vegetables" | "Dairy" | "Fats" | "Avoid";

const ALLOWED_FOODS: Record<FoodCategory, { name: string; carbs: number; serving: string }[]> = {
  Proteins: [
    { name: "Beef steak (150 g)", carbs: 0, serving: "150 g" },
    { name: "Chicken breast (150 g)", carbs: 0, serving: "150 g" },
    { name: "Salmon fillet (150 g)", carbs: 0, serving: "150 g" },
    { name: "Eggs (2 large)", carbs: 1, serving: "2 eggs" },
    { name: "Pork chop (150 g)", carbs: 0, serving: "150 g" },
    { name: "Tuna (canned, 100 g)", carbs: 0, serving: "100 g" },
    { name: "Prawns (100 g)", carbs: 0, serving: "100 g" },
    { name: "Turkey breast (150 g)", carbs: 0, serving: "150 g" },
  ],
  Vegetables: [
    { name: "Broccoli (1 cup)", carbs: 6, serving: "1 cup" },
    { name: "Spinach (2 cups raw)", carbs: 2, serving: "2 cups" },
    { name: "Cauliflower (1 cup)", carbs: 5, serving: "1 cup" },
    { name: "Green beans (1 cup)", carbs: 7, serving: "1 cup" },
    { name: "Asparagus (6 spears)", carbs: 4, serving: "6 spears" },
    { name: "Courgette / zucchini (1 cup)", carbs: 4, serving: "1 cup" },
    { name: "Mushrooms (1 cup)", carbs: 2, serving: "1 cup" },
    { name: "Lettuce (2 cups)", carbs: 2, serving: "2 cups" },
    { name: "Celery (3 sticks)", carbs: 3, serving: "3 sticks" },
    { name: "Cucumber (½ medium)", carbs: 2, serving: "½ medium" },
  ],
  Dairy: [
    { name: "Cheddar cheese (30 g)", carbs: 0, serving: "30 g" },
    { name: "Cream cheese (2 tbsp)", carbs: 1, serving: "2 tbsp" },
    { name: "Heavy cream (2 tbsp)", carbs: 1, serving: "2 tbsp" },
    { name: "Butter (1 tbsp)", carbs: 0, serving: "1 tbsp" },
    { name: "Sour cream (2 tbsp)", carbs: 1, serving: "2 tbsp" },
    { name: "Brie (30 g)", carbs: 0, serving: "30 g" },
    { name: "Parmesan (2 tbsp grated)", carbs: 0, serving: "2 tbsp" },
  ],
  Fats: [
    { name: "Olive oil (1 tbsp)", carbs: 0, serving: "1 tbsp" },
    { name: "Avocado (½)", carbs: 2, serving: "½ fruit" },
    { name: "Almonds (15)", carbs: 3, serving: "15 nuts" },
    { name: "Walnuts (7 halves)", carbs: 2, serving: "7 halves" },
    { name: "Macadamia nuts (10)", carbs: 2, serving: "10 nuts" },
    { name: "Coconut oil (1 tbsp)", carbs: 0, serving: "1 tbsp" },
  ],
  Avoid: [
    { name: "Bread (1 slice)", carbs: 15, serving: "—" },
    { name: "Rice (1 cup cooked)", carbs: 45, serving: "—" },
    { name: "Pasta (1 cup cooked)", carbs: 43, serving: "—" },
    { name: "Potato (1 medium)", carbs: 37, serving: "—" },
    { name: "Banana (1 medium)", carbs: 27, serving: "—" },
    { name: "Orange juice (1 cup)", carbs: 26, serving: "—" },
    { name: "Cereal (1 cup)", carbs: 30, serving: "—" },
    { name: "Sugar (1 tbsp)", carbs: 12, serving: "—" },
  ],
};

const FOOD_CATEGORIES: FoodCategory[] = ["Proteins", "Vegetables", "Dairy", "Fats", "Avoid"];

const MEAL_TEMPLATES = [
  {
    meal: "Breakfast (6 g carbs)",
    options: [
      { name: "2 eggs scrambled in butter + 1 cup spinach", carbs: 3, protein: 14, fat: 16 },
      { name: "2 eggs + 30 g cheese + mushrooms", carbs: 3, protein: 19, fat: 18 },
      { name: "Smoked salmon + cream cheese + cucumber", carbs: 4, protein: 18, fat: 12 },
      { name: "2-egg omelette + asparagus (4 spears)", carbs: 4, protein: 14, fat: 14 },
    ],
  },
  {
    meal: "Lunch (12 g carbs)",
    options: [
      { name: "Chicken breast + large green salad + olive oil", carbs: 6, protein: 35, fat: 18 },
      { name: "Tuna salad (mayo) + celery + lettuce cups", carbs: 5, protein: 28, fat: 16 },
      { name: "Beef burger patty (no bun) + side salad + cheese", carbs: 4, protein: 30, fat: 22 },
      { name: "Grilled salmon + steamed broccoli + butter", carbs: 6, protein: 32, fat: 20 },
    ],
  },
  {
    meal: "Dinner (12 g carbs)",
    options: [
      { name: "Steak + cauliflower mash + green beans", carbs: 11, protein: 40, fat: 22 },
      { name: "Roast chicken thigh + courgette + mushrooms", carbs: 8, protein: 32, fat: 18 },
      { name: "Pork chop + braised cabbage + butter", carbs: 7, protein: 35, fat: 20 },
      { name: "Prawns + stir-fried pak choi + sesame oil", carbs: 6, protein: 24, fat: 14 },
    ],
  },
];

const TRANSITION_STEPS = [
  { week: "Week 1-2", target: "< 100 g/day", action: "Eliminate sugary drinks, juice, sweets, and desserts. Replace bread with low-carb wraps or lettuce." },
  { week: "Week 3-4", target: "< 60 g/day", action: "Remove rice, pasta, and potatoes. Replace with cauliflower rice/mash. Increase protein and fat." },
  { week: "Week 5-6", target: "< 40 g/day", action: "Limit fruit to small portions of berries. Remove remaining grains. Focus on meat + vegetables." },
  { week: "Week 7-8", target: "~30 g/day", action: "Fine-tune to Bernstein targets: 6 g breakfast, 12 g lunch, 12 g dinner. Adjust insulin ratios." },
  { week: "Ongoing", target: "30 g/day", action: "Maintain. Review ICR and ISF every 2 weeks. Monitor A1c at 3 months. Expect A1c in 4.5-5.5 % range." },
];

/* ── component ─────────────────────────────────────── */
export default function BernsteinModule() {
  const [open, setOpen] = useState<Record<string, boolean>>({
    overview: true, law: false, foods: false, meals: false,
    protein: false, micro: false, transition: false,
  });
  const toggle = (key: string) => setOpen(o => ({ ...o, [key]: !o[key] }));

  const [foodTab, setFoodTab] = useState<FoodCategory>("Proteins");

  /* Protein-to-glucose calc */
  const [proteinGrams, setProteinGrams] = useState("");
  const glucoseFromProtein = proteinGrams ? (parseFloat(proteinGrams) * 0.58).toFixed(1) : "—";
  const equivalentCarbs = proteinGrams ? (parseFloat(proteinGrams) * 0.58 / 4).toFixed(1) : "—";

  /* Micro-dosing */
  const [targetDose, setTargetDose] = useState("");
  const [increment, setIncrement] = useState("0.5");
  const roundedDose = targetDose && increment
    ? (Math.round(parseFloat(targetDose) / parseFloat(increment)) * parseFloat(increment)).toFixed(2)
    : "—";

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
    <div style={{ minHeight: "100vh", background: "var(--bg-card)", padding: 24 }}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <Link to="/education" style={{ color: TEAL, fontSize: 14, textDecoration: "none" }}>
          &larr; Back to Education
        </Link>

        <div style={{ margin: "16px 0 28px" }}>
          <h1 style={{ margin: 0, fontFamily: "'Inter', sans-serif", color: NAVY, fontSize: 30, fontWeight: 800 }}>
            Bernstein Low-Carb Protocol
          </h1>
          <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: 15 }}>
            Dr. Richard K. Bernstein's approach to tight glucose control through carbohydrate restriction
          </p>
        </div>

        {/* ─── 1. Overview ────────────────────────── */}
        <Section id="overview" title="Overview">
          <p style={{ color: "#4a5568", fontSize: 14, lineHeight: 1.8, marginBottom: 12 }}>
            Dr. Richard Bernstein — himself a Type 1 diabetic since 1946 — developed a low-carbohydrate
            approach that aims for <strong>truly normal blood sugars</strong> (83-100 mg/dL / 4.6-5.6 mmol/L).
            His protocol limits total daily carbohydrate intake to approximately <strong>30 grams</strong>:
            6 g at breakfast, 12 g at lunch, and 12 g at dinner.
          </p>
          <div style={{ background: "#f0fdfa", borderRadius: 8, padding: 16, fontSize: 13, lineHeight: 1.8, color: "#1e293b" }}>
            <strong>Core principles:</strong>
            <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
              <li>Carbohydrates are the primary driver of BG variability</li>
              <li>Normal BGs are achievable with T1D through strict carb control</li>
              <li>Small inputs lead to small, predictable outcomes (Law of Small Numbers)</li>
              <li>Protein and fat satisfy hunger — you are not "starving"</li>
              <li>Complications are preventable with sustained normoglycaemia</li>
            </ul>
          </div>
        </Section>

        {/* ─── 2. Law of Small Numbers ────────────── */}
        <Section id="law" title='The "Law of Small Numbers"'>
          <p style={{ color: "#4a5568", fontSize: 14, marginBottom: 16 }}>
            This is the foundational concept. In any biological system, <strong>small inputs produce small
            errors</strong>. Large inputs amplify errors. Applied to diabetes:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {SMALL_NUMBERS.map((s, i) => (
              <div key={i} style={{ background: "#f8fafc", borderRadius: 8, padding: 16, borderLeft: `3px solid ${TEAL}` }}>
                <p style={{ margin: 0, fontWeight: 700, color: NAVY, fontSize: 14 }}>{s.principle}</p>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "#4a5568", lineHeight: 1.7 }}>{s.detail}</p>
              </div>
            ))}
          </div>
          <div style={{ background: "#eff6ff", borderRadius: 8, padding: 16, marginTop: 16, fontSize: 13, color: "#1e40af" }}>
            <strong>Example:</strong> If you eat 60 g carbs and estimate your ICR is 1:10 (needing 6 U), but
            your true ICR is 1:8 (needing 7.5 U), you are 1.5 U short — causing a ~75 mg/dL rise.
            If you eat 12 g carbs and dose 1.2 U but needed 1.5 U, you are only 0.3 U short — causing a ~15 mg/dL rise.
          </div>
        </Section>

        {/* ─── 3. Foods Database ──────────────────── */}
        <Section id="foods" title="Allowed Foods Database">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {FOOD_CATEGORIES.map(cat => (
              <button type="button"
                key={cat}
                onClick={() => setFoodTab(cat)}
                style={{
                  padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: foodTab === cat ? (cat === "Avoid" ? "#dc2626" : TEAL) : "#f1f5f9",
                  color: foodTab === cat ? "#fff" : (cat === "Avoid" ? "#dc2626" : "#4a5568"),
                  fontWeight: 600, fontSize: 13,
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {foodTab === "Avoid" && (
            <div style={{ background: "var(--error-bg)", borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 13, color: "var(--error-text)" }}>
              <strong>These foods are excluded</strong> from the Bernstein protocol due to high carbohydrate content.
              Each one exceeds the 12 g carb limit for a single meal.
            </div>
          )}

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left" }}>
                <th style={{ padding: 8 }}>Food</th>
                <th style={{ padding: 8 }}>Carbs (g)</th>
                <th style={{ padding: 8 }}>Serving</th>
              </tr>
            </thead>
            <tbody>
              {ALLOWED_FOODS[foodTab].map((f, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 8 }}>{f.name}</td>
                  <td style={{ padding: 8, fontWeight: 600, color: foodTab === "Avoid" ? "#dc2626" : TEAL }}>{f.carbs}</td>
                  <td style={{ padding: 8, color: "#6b7280" }}>{f.serving}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* ─── 4. Meal Templates ──────────────────── */}
        <Section id="meals" title="Meal Templates">
          <p style={{ color: "#4a5568", fontSize: 14, marginBottom: 16 }}>
            Each meal is designed to stay within Bernstein's carb targets while providing adequate
            protein, fat, and satiety. Mix and match options freely.
          </p>
          {MEAL_TEMPLATES.map((meal, mi) => (
            <div key={mi} style={{ marginBottom: 20 }}>
              <h3 style={heading3}>{meal.meal}</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {meal.options.map((opt, oi) => (
                  <div key={oi} style={{ background: "#f8fafc", borderRadius: 8, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "#1e293b", flex: 1, minWidth: 200 }}>{opt.name}</span>
                    <div style={{ display: "flex", gap: 12, fontSize: 12 }}>
                      <span style={{ ...pill, background: "#d1fae5", color: "#065f46" }}>C: {opt.carbs} g</span>
                      <span style={{ ...pill, background: "#dbeafe", color: "#1e40af" }}>P: {opt.protein} g</span>
                      <span style={{ ...pill, background: "#fef9c3", color: "#854d0e" }}>F: {opt.fat} g</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </Section>

        {/* ─── 5. Protein-to-Glucose Calculator ───── */}
        <Section id="protein" title="Protein-to-Glucose Conversion Calculator">
          <p style={{ color: "#4a5568", fontSize: 14, marginBottom: 12 }}>
            Approximately <strong>58 % of dietary protein</strong> can be converted to glucose via gluconeogenesis,
            but this process is slow — occurring over <strong>3-5 hours</strong> after the meal.
            This is important on a low-carb diet where protein intake is relatively higher.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <label style={labelStyle}>
              Protein consumed (grams)
              <input type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" min={0} step={1} value={proteinGrams} onChange={e => setProteinGrams(e.target.value)} style={inputStyle} placeholder="e.g. 40" />
            </label>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              {proteinGrams && (
                <div style={{ background: "#f0fdfa", borderRadius: 8, padding: 12 }}>
                  <p style={{ margin: 0, fontSize: 13 }}>Glucose produced: <strong>{glucoseFromProtein} g</strong> (over 3-5 hours)</p>
                  <p style={{ margin: "4px 0 0", fontSize: 13 }}>Equivalent carb bolus: <strong style={{ color: TEAL, fontSize: 16 }}>{equivalentCarbs} g</strong></p>
                </div>
              )}
            </div>
          </div>
          <div style={{ background: "var(--disclaimer-bg)", borderRadius: 8, padding: 12, fontSize: 13, color: "var(--disclaimer-text)" }}>
            <strong>Dosing tip:</strong> If eating more than 30 g protein in a meal, consider a small extended
            bolus to cover the delayed glucose rise. On a pump, use a square/extended bolus over 3-4 hours.
            On MDI, you may add a small dose of regular insulin with the meal.
          </div>
        </Section>

        {/* ─── 6. Micro-Dosing Guide ──────────────── */}
        <Section id="micro" title="Insulin Micro-Dosing Guide">
          <p style={{ color: "#4a5568", fontSize: 14, marginBottom: 12 }}>
            The Bernstein protocol often requires <strong>very small insulin doses</strong> (0.25 U - 2 U per meal).
            Precision matters — a 0.5 U error on a 1 U dose is a 50 % error.
          </p>

          <h3 style={heading3}>Dose Rounding Calculator</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
            <label style={labelStyle}>
              Calculated dose (U)
              <input type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" min={0} step={0.1} value={targetDose} onChange={e => setTargetDose(e.target.value)} style={inputStyle} placeholder="e.g. 1.3" />
            </label>
            <label style={labelStyle}>
              Pen/pump increment
              <select value={increment} onChange={e => setIncrement(e.target.value)} style={inputStyle}>
                <option value="0.25">0.25 U (pump)</option>
                <option value="0.5">0.5 U (half-unit pen)</option>
                <option value="1">1.0 U (standard pen)</option>
              </select>
            </label>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              {targetDose && (
                <div style={{ background: "#f0fdfa", borderRadius: 8, padding: 12 }}>
                  <p style={{ margin: 0, fontSize: 14 }}>
                    Deliverable dose: <strong style={{ color: TEAL, fontSize: 18 }}>{roundedDose} U</strong>
                  </p>
                </div>
              )}
            </div>
          </div>

          <h3 style={heading3}>Tools for micro-dosing</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, color: "#4a5568" }}>
            <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12 }}>
              <strong>Half-unit pens:</strong> NovoPen Echo, HumaPen Luxura HD — deliver in 0.5 U increments.
              Essential for low-carb dosing on MDI.
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12 }}>
              <strong>Insulin pumps:</strong> Most deliver 0.025-0.05 U increments. Ideal for Bernstein protocol.
              Use extended bolus for protein coverage.
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12 }}>
              <strong>Diluted insulin:</strong> U-10 (1:10 dilution) can be prescribed for those needing doses
              under 0.5 U. Requires pharmacy preparation and careful labelling.
            </div>
          </div>
        </Section>

        {/* ─── 7. Transition Guide ────────────────── */}
        <Section id="transition" title="Transition Guide — Reducing Carbs Safely">
          <p style={{ color: "#4a5568", fontSize: 14, marginBottom: 16 }}>
            <strong>Do not switch to 30 g/day overnight.</strong> Gradual reduction over 6-8 weeks prevents
            severe hypos as insulin requirements drop. Reduce insulin <em>before</em> reducing carbs at each step.
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left" }}>
                <th style={{ padding: 8 }}>Period</th>
                <th style={{ padding: 8 }}>Target</th>
                <th style={{ padding: 8 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {TRANSITION_STEPS.map((s, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 8, fontWeight: 600, color: NAVY, whiteSpace: "nowrap" }}>{s.week}</td>
                  <td style={{ padding: 8 }}><span style={{ ...pill, background: "#d1fae5", color: "#065f46" }}>{s.target}</span></td>
                  <td style={{ padding: 8, color: "#4a5568" }}>{s.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ background: "var(--error-bg)", borderRadius: 8, padding: 12, marginTop: 12, fontSize: 13, color: "var(--error-text)" }}>
            <strong>Critical safety note:</strong> As you reduce carbs, your TDD will drop significantly
            (often by 50-70 %). Reduce basal and bolus insulin <em>proactively</em>. Monitor BG at least
            6-8 times daily during transition. Have fast-acting glucose readily available at all times.
          </div>
        </Section>

        {/* ─── Disclaimer ─────────────────────────── */}
        <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, marginTop: 8, border: "1px solid var(--border)" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>
            <strong>Disclaimer:</strong> This module is an educational reference based on the published
            work of Dr. Richard K. Bernstein. It does not constitute medical advice.
            <strong> Discuss any significant dietary changes with your endocrinologist</strong> before
            implementation. A low-carbohydrate diet requires careful insulin adjustment and close
            monitoring, especially during the transition period. GluMira does not endorse any single
            dietary approach over another.
          </p>
        </div>
      </div>
    </div>
  );
}
