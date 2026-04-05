/**
 * GluMira™ V7 — Halal Dietary Module
 * Regional halal food database, carb counts, ingredient permissibility,
 * insulin manufacturing info, Eid meal planning, and Ramadan cross-link.
 */
import { useState } from "react";
import { Link } from "react-router-dom";

/* ── colour tokens ─────────────────────────────────── */
const NAVY = "#1A2A5E";
const TEAL = "#2AB5C1";

/* ── shared inline styles ──────────────────────────── */
const card: React.CSSProperties = {
  background: "#fff", borderRadius: 12, padding: 24,
  marginBottom: 20, border: "1px solid #e2e8f0",
};
const heading2: React.CSSProperties = { color: NAVY, fontSize: 20, fontWeight: 700, marginBottom: 12 };
const heading3: React.CSSProperties = { color: NAVY, fontSize: 16, fontWeight: 600, marginBottom: 8 };
const pill: React.CSSProperties = {
  display: "inline-block", padding: "4px 10px", borderRadius: 999,
  fontSize: 12, fontWeight: 600, marginRight: 6, marginBottom: 6,
};

/* ── data ──────────────────────────────────────────── */
type Cuisine = "Malaysian" | "Arab Gulf" | "South Asian" | "Turkish" | "North African" | "UK";

const HALAL_FOODS: Record<Cuisine, { name: string; carbs: number; serving: string }[]> = {
  Malaysian: [
    { name: "Nasi lemak", carbs: 55, serving: "1 plate" },
    { name: "Roti canai (plain)", carbs: 38, serving: "1 piece" },
    { name: "Mee goreng", carbs: 48, serving: "1 plate" },
    { name: "Satay (6 sticks + peanut sauce)", carbs: 15, serving: "1 serving" },
    { name: "Rendang (beef)", carbs: 6, serving: "1 cup" },
    { name: "Kuih lapis", carbs: 25, serving: "2 pieces" },
    { name: "Teh tarik (sweetened)", carbs: 20, serving: "1 cup" },
  ],
  "Arab Gulf": [
    { name: "Kabsa (chicken + rice)", carbs: 55, serving: "1 plate" },
    { name: "Harees", carbs: 40, serving: "1 bowl" },
    { name: "Machboos", carbs: 50, serving: "1 plate" },
    { name: "Luqaimat (dumplings)", carbs: 35, serving: "6 pieces" },
    { name: "Shawarma (wrap)", carbs: 40, serving: "1 wrap" },
    { name: "Hummus (with bread)", carbs: 30, serving: "1 serving" },
    { name: "Arabic coffee + dates (3)", carbs: 42, serving: "1 serving" },
  ],
  "South Asian": [
    { name: "Chicken biryani", carbs: 50, serving: "1 plate" },
    { name: "Dal with rice", carbs: 55, serving: "1 plate" },
    { name: "Chapati (1)", carbs: 18, serving: "1 piece" },
    { name: "Samosa (1 medium)", carbs: 18, serving: "1 piece" },
    { name: "Naan bread (1)", carbs: 42, serving: "1 piece" },
    { name: "Gulab jamun (2)", carbs: 30, serving: "2 pieces" },
    { name: "Haleem", carbs: 25, serving: "1 bowl" },
    { name: "Paratha (1)", carbs: 28, serving: "1 piece" },
  ],
  Turkish: [
    { name: "Lahmacun", carbs: 32, serving: "1 piece" },
    { name: "Pide (meat)", carbs: 45, serving: "1 portion" },
    { name: "Borek (cheese)", carbs: 28, serving: "1 slice" },
    { name: "Iskender kebab + bread", carbs: 35, serving: "1 serving" },
    { name: "Baklava (1 piece)", carbs: 28, serving: "1 piece" },
    { name: "Simit (sesame ring)", carbs: 48, serving: "1 ring" },
    { name: "Ayran", carbs: 6, serving: "1 glass" },
  ],
  "North African": [
    { name: "Couscous (1 cup cooked)", carbs: 36, serving: "1 cup" },
    { name: "Tagine (chicken + vegetables)", carbs: 20, serving: "1 serving" },
    { name: "Harira soup", carbs: 25, serving: "1 bowl" },
    { name: "Brik (1 piece)", carbs: 22, serving: "1 piece" },
    { name: "Msemen (1)", carbs: 30, serving: "1 piece" },
    { name: "Makroudh (2 pieces)", carbs: 35, serving: "2 pieces" },
    { name: "Mint tea (sweetened)", carbs: 16, serving: "1 glass" },
  ],
  UK: [
    { name: "Halal chicken shop meal (burger + chips)", carbs: 75, serving: "1 meal" },
    { name: "Halal doner kebab (wrap)", carbs: 45, serving: "1 wrap" },
    { name: "Fish and chips (halal oil)", carbs: 65, serving: "1 portion" },
    { name: "Halal pizza (2 slices)", carbs: 50, serving: "2 slices" },
    { name: "Nando's peri-peri (½ chicken + rice)", carbs: 45, serving: "1 meal" },
    { name: "Chapli kebab + naan", carbs: 48, serving: "1 serving" },
    { name: "Mango lassi", carbs: 32, serving: "1 glass" },
  ],
};

const CUISINES: Cuisine[] = ["Malaysian", "Arab Gulf", "South Asian", "Turkish", "North African", "UK"];

const INGREDIENT_CHECKER = [
  { ingredient: "Pork gelatin", status: "haram", notes: "Found in some gummy vitamins, capsules, marshmallows. Check labels carefully." },
  { ingredient: "Bovine gelatin (halal-certified)", status: "halal", notes: "Must be from halal-slaughtered cattle. Look for halal certification." },
  { ingredient: "Fish gelatin", status: "halal", notes: "Generally accepted by all schools of thought." },
  { ingredient: "Alcohol in flavourings", status: "disputed", notes: "Trace amounts in vanilla extract — most scholars permit if evaporated in cooking." },
  { ingredient: "Rennet (animal)", status: "disputed", notes: "Microbial or vegetable rennet is preferred. Check cheese sources." },
  { ingredient: "E120 (carmine/cochineal)", status: "disputed", notes: "Insect-derived red dye. Hanafi school may permit; others may not." },
  { ingredient: "L-cysteine (E920)", status: "check source", notes: "Can be from human hair, duck feathers, or synthetic. Check manufacturer." },
  { ingredient: "Insulin (modern recombinant)", status: "halal", notes: "Synthetic human insulin — no animal-derived ingredients in final product." },
];

const INSULIN_INFO = [
  { question: "Is modern insulin derived from pork?", answer: "No. Since the 1980s, insulin has been produced using recombinant DNA technology. Human insulin analogues (Humalog, NovoRapid, Lantus, etc.) are made by bacteria or yeast, not from animals." },
  { question: "Was insulin historically from animals?", answer: "Yes. Before 1982, insulin was extracted from porcine (pig) or bovine (cow) pancreases. Animal-derived insulin is now extremely rare in clinical use." },
  { question: "Are any current insulins animal-derived?", answer: "Hypurin (bovine and porcine) is still available in some countries but is rarely prescribed. All major modern insulin brands are biosynthetic." },
  { question: "Do insulin pen cartridges contain gelatin?", answer: "No. Modern insulin pen cartridges and vials do not contain gelatin or other animal-derived excipients." },
  { question: "What about GLP-1 agonists (e.g., semaglutide)?", answer: "GLP-1 receptor agonists are also produced via recombinant DNA technology and do not contain animal-derived ingredients." },
  { question: "Is there a halal certification for insulin?", answer: "Some manufacturers have obtained halal certification for their products. The Malaysian JAKIM has certified several insulin brands. Consult your local halal authority." },
];

const EID_ADHA_MEALS = [
  { name: "Grilled lamb chops (3)", carbs: 0, protein: 35, tip: "Pure protein — minimal bolus" },
  { name: "Lamb kebab (3 skewers)", carbs: 5, protein: 28, tip: "Small carb from marinade" },
  { name: "Rice pilaf (1 cup)", carbs: 42, protein: 5, tip: "Bolus normally" },
  { name: "Grilled vegetables", carbs: 10, protein: 3, tip: "Low impact" },
  { name: "Fattoush salad", carbs: 12, protein: 3, tip: "From pita chips" },
];

const EID_FITR_MEALS = [
  { name: "Sheer khurma", carbs: 45, tip: "High sugar — bolus 10-15 min before" },
  { name: "Sevai (vermicelli)", carbs: 40, tip: "Sweet milk-based — watch for delayed rise" },
  { name: "Maamoul (2 pieces)", carbs: 35, tip: "Date/nut filled cookies" },
  { name: "Kahk (2 pieces)", carbs: 28, tip: "Egyptian butter cookies" },
  { name: "Festive biryani", carbs: 50, tip: "High fat delays absorption — consider split bolus" },
];

/* ── component ─────────────────────────────────────── */
export default function HalalModule() {
  const [open, setOpen] = useState<Record<string, boolean>>({
    database: true, ingredients: false, insulin: false,
    eidAdha: false, eidFitr: false,
  });
  const toggle = (key: string) => setOpen(o => ({ ...o, [key]: !o[key] }));

  const [selectedCuisine, setSelectedCuisine] = useState<Cuisine>("South Asian");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFoods = HALAL_FOODS[selectedCuisine].filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColor = (s: string) => {
    if (s === "halal") return { bg: "#d1fae5", color: "#065f46" };
    if (s === "haram") return { bg: "#fecaca", color: "#991b1b" };
    return { bg: "#fef9c3", color: "#854d0e" };
  };

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
        <Link to="/education" style={{ color: TEAL, fontSize: 14, textDecoration: "none" }}>
          &larr; Back to Education
        </Link>

        <div style={{ margin: "16px 0 28px" }}>
          <h1 style={{ margin: 0, fontFamily: "'Inter', sans-serif", color: NAVY, fontSize: 30, fontWeight: 800 }}>
            Halal &amp; Diabetes
          </h1>
          <p style={{ margin: "4px 0 0", color: "#718096", fontSize: 15 }}>
            Halal food guidance, carb counts, and medication permissibility for diabetes management
          </p>
        </div>

        {/* ─── 1. Food Database ───────────────────── */}
        <Section id="database" title="Halal Food Database — 6 Regional Cuisines">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
            {CUISINES.map(c => (
              <button type="button"
                key={c}
                onClick={() => setSelectedCuisine(c)}
                style={{
                  padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: selectedCuisine === c ? TEAL : "#f1f5f9",
                  color: selectedCuisine === c ? "#fff" : "#4a5568",
                  fontWeight: 600, fontSize: 13,
                }}
              >
                {c}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Search foods..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1",
              fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box", marginBottom: 12,
            }}
          />

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                <th style={{ padding: 8 }}>Dish</th>
                <th style={{ padding: 8 }}>Carbs (g)</th>
                <th style={{ padding: 8 }}>Serving</th>
              </tr>
            </thead>
            <tbody>
              {filteredFoods.map((f, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 8 }}>{f.name}</td>
                  <td style={{ padding: 8, fontWeight: 600, color: TEAL }}>{f.carbs}</td>
                  <td style={{ padding: 8, color: "#6b7280" }}>{f.serving}</td>
                </tr>
              ))}
              {filteredFoods.length === 0 && (
                <tr><td colSpan={3} style={{ padding: 16, textAlign: "center", color: "#9ca3af" }}>No matching foods found</td></tr>
              )}
            </tbody>
          </table>
        </Section>

        {/* ─── 2. Ingredient Checker ──────────────── */}
        <Section id="ingredients" title="Ingredient Permissibility Checker">
          <p style={{ color: "#4a5568", fontSize: 14, marginBottom: 12 }}>
            Common ingredients that people with diabetes may encounter in foods and medications.
            Always check with your local halal authority for definitive rulings.
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                <th style={{ padding: 8 }}>Ingredient</th>
                <th style={{ padding: 8 }}>Status</th>
                <th style={{ padding: 8 }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {INGREDIENT_CHECKER.map((item, i) => {
                const sc = statusColor(item.status);
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: 8, fontWeight: 600 }}>{item.ingredient}</td>
                    <td style={{ padding: 8 }}>
                      <span style={{ ...pill, background: sc.bg, color: sc.color }}>{item.status}</span>
                    </td>
                    <td style={{ padding: 8, color: "#6b7280" }}>{item.notes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Section>

        {/* ─── 3. Is My Insulin Halal? ────────────── */}
        <Section id="insulin" title='"Is My Insulin Halal?" — Manufacturing Facts'>
          <p style={{ color: "#4a5568", fontSize: 14, marginBottom: 12 }}>
            This is one of the most common questions from Muslim patients. Here are the facts
            about modern insulin manufacturing.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {INSULIN_INFO.map((item, i) => (
              <div key={i} style={{ background: "#f8fafc", borderRadius: 8, padding: 16 }}>
                <p style={{ margin: 0, fontWeight: 600, color: NAVY, fontSize: 14 }}>{item.question}</p>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "#4a5568", lineHeight: 1.7 }}>{item.answer}</p>
              </div>
            ))}
          </div>
          <div style={{ background: "#d1fae5", borderRadius: 8, padding: 16, marginTop: 16, fontSize: 13, color: "#065f46" }}>
            <strong>Summary:</strong> All commonly prescribed modern insulins (Humalog, NovoRapid, Apidra,
            Lantus, Levemir, Tresiba, Toujeo, Fiasp) are produced biosynthetically and do not contain
            porcine or other animal-derived ingredients. They are considered halal by major Islamic
            scholarly bodies including the Islamic Organization for Medical Sciences.
          </div>
        </Section>

        {/* ─── 4. Eid al-Adha ─────────────────────── */}
        <Section id="eidAdha" title="Eid al-Adha Meal Planning">
          <p style={{ color: "#4a5568", fontSize: 14, marginBottom: 12 }}>
            Eid al-Adha centres around the qurbani sacrifice — meals are typically <strong>high in protein</strong> with
            moderate carbohydrates. The main challenge is managing portion sizes over multiple days of celebration.
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                <th style={{ padding: 8 }}>Food</th>
                <th style={{ padding: 8 }}>Carbs (g)</th>
                <th style={{ padding: 8 }}>Protein (g)</th>
                <th style={{ padding: 8 }}>Tip</th>
              </tr>
            </thead>
            <tbody>
              {EID_ADHA_MEALS.map((m, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 8 }}>{m.name}</td>
                  <td style={{ padding: 8, fontWeight: 600, color: TEAL }}>{m.carbs}</td>
                  <td style={{ padding: 8 }}>{m.protein}</td>
                  <td style={{ padding: 8, color: "#6b7280" }}>{m.tip}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ background: "#eff6ff", borderRadius: 8, padding: 12, marginTop: 12, fontSize: 13, color: "#1e40af" }}>
            <strong>Note:</strong> High-protein meals (especially large portions of red meat) will cause a delayed
            glucose rise over 3-5 hours. About 58 % of protein can convert to glucose. Consider a small
            extended bolus if eating more than 40 g protein in one sitting.
          </div>
        </Section>

        {/* ─── 5. Eid al-Fitr ─────────────────────── */}
        <Section id="eidFitr" title="Eid al-Fitr Meal Planning">
          <p style={{ color: "#4a5568", fontSize: 14, marginBottom: 12 }}>
            Eid al-Fitr marks the end of Ramadan. The transition from fasting to normal eating requires
            careful insulin adjustment. <strong>Return to pre-Ramadan basal doses</strong> on the morning of Eid.
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                <th style={{ padding: 8 }}>Food</th>
                <th style={{ padding: 8 }}>Carbs (g)</th>
                <th style={{ padding: 8 }}>Tip</th>
              </tr>
            </thead>
            <tbody>
              {EID_FITR_MEALS.map((m, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 8 }}>{m.name}</td>
                  <td style={{ padding: 8, fontWeight: 600, color: TEAL }}>{m.carbs}</td>
                  <td style={{ padding: 8, color: "#6b7280" }}>{m.tip}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ background: "#fffbeb", borderRadius: 8, padding: 12, marginTop: 12, fontSize: 13, color: "#92400e" }}>
            <strong>Post-Ramadan transition:</strong> Your insulin sensitivity may have changed during Ramadan.
            Monitor BG more frequently for the first 3-5 days after Eid. Your ICR and ISF may need
            re-calibration.
          </div>
        </Section>

        {/* ─── Cross-link to Ramadan ──────────────── */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h3 style={{ ...heading3, marginBottom: 4 }}>Ramadan Fasting Module</h3>
              <p style={{ margin: 0, fontSize: 13, color: "#6b7280" }}>
                Detailed Suhoor/Iftar planning, fasting insulin adjustments, and Tarawih activity guidance
              </p>
            </div>
            <Link to="/ramadan" style={{
              padding: "8px 16px", borderRadius: 8, background: TEAL,
              color: "#fff", textDecoration: "none", fontSize: 13, fontWeight: 600,
            }}>
              Open Module &rarr;
            </Link>
          </div>
        </div>

        {/* ─── Disclaimer ─────────────────────────── */}
        <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, marginTop: 8, border: "1px solid #e2e8f0" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>
            <strong>Disclaimer:</strong> This module provides general educational guidance only.
            <strong> Consult your local halal authority and your diabetes care team</strong> before making
            dietary decisions based on this information. GluMira does not issue halal certifications
            or religious rulings. Carb counts are approximate and may vary by recipe and preparation method.
          </p>
        </div>
      </div>
    </div>
  );
}
