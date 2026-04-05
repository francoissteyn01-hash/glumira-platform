/**
 * GluMira™ V7 — Kosher Dietary Module
 * Shabbat mode, Kashrut food database, Passover carb profiles,
 * Yom Kippur fasting, Kiddush/Seder calculator, and holiday calendar.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import DecimalInput from "@/components/ui/DecimalInput";

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
const KASHRUT_DB: Record<string, { name: string; carbs: number; notes: string }[]> = {
  Ashkenazi: [
    { name: "Gefilte fish (1 piece)", carbs: 7, notes: "Usually contains matzah meal" },
    { name: "Challah (1 slice)", carbs: 28, notes: "Shabbat/holiday bread" },
    { name: "Kugel, noodle (1 cup)", carbs: 38, notes: "High GI — bolus accordingly" },
    { name: "Kugel, potato (1 cup)", carbs: 30, notes: "Moderate GI" },
    { name: "Cholent (1 cup)", carbs: 35, notes: "Slow-cooked — extended glucose rise" },
    { name: "Matzah ball soup (2 balls)", carbs: 22, notes: "Matzah meal base" },
    { name: "Latkes (2 medium)", carbs: 30, notes: "Fried — consider fat delay" },
    { name: "Brisket (150 g)", carbs: 0, notes: "Pure protein" },
  ],
  Sephardi: [
    { name: "Jachnun (1 roll)", carbs: 45, notes: "Dense, slow-release dough" },
    { name: "Malawach (1 piece)", carbs: 38, notes: "Layered flaky bread" },
    { name: "Kibbeh (2 pieces)", carbs: 18, notes: "Bulgur wheat shell" },
    { name: "Couscous (1 cup cooked)", carbs: 36, notes: "Semolina base" },
    { name: "Stuffed grape leaves (4)", carbs: 20, notes: "Rice filling" },
    { name: "Shakshuka (1 serving)", carbs: 12, notes: "Mostly protein + veg" },
    { name: "Burekas (1 large)", carbs: 28, notes: "Phyllo pastry" },
  ],
  Mizrachi: [
    { name: "Kubba (2 pieces)", carbs: 22, notes: "Semolina/bulgur shell" },
    { name: "Sambusak (2 pieces)", carbs: 24, notes: "Stuffed pastry" },
    { name: "Sabich (1 pita)", carbs: 40, notes: "Pita + eggplant + egg" },
    { name: "Tbit (chicken + rice, 1 cup)", carbs: 35, notes: "Slow-cooked Shabbat dish" },
    { name: "Ka'ak (1 ring)", carbs: 32, notes: "Sesame bread ring" },
    { name: "Bamia (okra stew, 1 cup)", carbs: 15, notes: "Low carb, high fibre" },
  ],
};

const PASSOVER_FOODS = [
  { name: "Matzah (1 sheet, hand)", carbs: 27, notes: "Standard shmurah" },
  { name: "Matzah (1 sheet, machine)", carbs: 25, notes: "Slightly thinner" },
  { name: "Matzah meal (¼ cup)", carbs: 24, notes: "Ground matzah" },
  { name: "Matzah ball (1 medium)", carbs: 11, notes: "Made with matzah meal + egg" },
  { name: "Potato starch (1 tbsp)", carbs: 10, notes: "Common Pesach thickener" },
  { name: "Charoset (2 tbsp)", carbs: 14, notes: "Apple, nut, wine mix" },
  { name: "Macaroons, coconut (1)", carbs: 12, notes: "Pesach dessert staple" },
  { name: "Gebrochts-free cake (1 slice)", carbs: 22, notes: "Potato/almond flour base" },
];

const SEDER_PLATE = [
  { item: "Karpas (parsley/celery)", carbs: "<1", note: "Dipped in salt water" },
  { item: "Maror (horseradish)", carbs: "2", note: "Bitter herb" },
  { item: "Charoset (2 tbsp)", carbs: "14", note: "Apple-nut-wine paste" },
  { item: "Zeroa (shank bone)", carbs: "0", note: "Symbolic — not eaten" },
  { item: "Beitzah (roasted egg)", carbs: "1", note: "Symbolic egg" },
  { item: "Chazeret (romaine)", carbs: "<1", note: "Second bitter herb" },
];

const HOLIDAYS = [
  { name: "Rosh Hashanah", insulin: "Extra bolus for honey cake, apple + honey. High-carb meals.", notes: "Round challah ~30 g/slice" },
  { name: "Yom Kippur", insulin: "Pre-fast: carb-load. Reduce basal 20-30 %. Break fast gradually.", notes: "25-hour fast" },
  { name: "Sukkot", insulin: "Standard dosing. Watch for kreplach/stuffed foods.", notes: "7 days, outdoor meals" },
  { name: "Hanukkah", insulin: "Extra for sufganiyot (25 g/donut) and latkes (15 g each). Fat delays.", notes: "8 nights of fried foods" },
  { name: "Purim", insulin: "Hamantaschen ~20 g each. Mishloach manot sweets.", notes: "Alcohol: wine may cause delayed hypo" },
  { name: "Passover", insulin: "Matzah 27 g/sheet. Frequent small carb loads at Seder.", notes: "8 days, no chametz" },
  { name: "Shavuot", insulin: "Cheesecake ~35 g/slice. Dairy meals tend to have delayed absorption.", notes: "Dairy tradition" },
];

/* ── component ─────────────────────────────────────── */
export default function KosherModule() {
  const [open, setOpen] = useState<Record<string, boolean>>({
    shabbat: true, kashrut: false, passover: false, yomkippur: false,
    kiddush: false, calendar: false,
  });
  const toggle = (key: string) => setOpen(o => ({ ...o, [key]: !o[key] }));

  const [kashrutTab, setKashrutTab] = useState<"Ashkenazi" | "Sephardi" | "Mizrachi">("Ashkenazi");

  /* Kiddush wine calc */
  const [wineCups, setWineCups] = useState(4);
  const wineCarbs = wineCups * 4;

  /* Yom Kippur pre-fast */
  const [currentBasalYK, setCurrentBasalYK] = useState("");
  const adjustedBasalYK = currentBasalYK ? (parseFloat(currentBasalYK) * 0.75).toFixed(1) : "—";

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
            Kosher &amp; Diabetes
          </h1>
          <p style={{ margin: "4px 0 0", color: "#718096", fontSize: 15 }}>
            Jewish dietary law considerations for diabetes management
          </p>
        </div>

        {/* ─── 1. Shabbat Mode ────────────────────── */}
        <Section id="shabbat" title="Shabbat Mode — 25-Hour Plan">
          <p style={{ color: "#4a5568", fontSize: 14, marginBottom: 12 }}>
            Shabbat runs from Friday sunset to Saturday nightfall (~25 hours). While fasting is <strong>not</strong> required,
            meal timing changes and technology restrictions may affect diabetes management.
          </p>

          <div style={{ background: "#faf5ff", borderRadius: 8, padding: 16, marginBottom: 16 }}>
            <h3 style={{ ...heading3, color: "#7c3aed" }}>Pikuach Nefesh — Life Preservation Override</h3>
            <p style={{ fontSize: 13, color: "#4a5568", margin: 0, lineHeight: 1.8 }}>
              Jewish law is unequivocal: <strong>pikuach nefesh (preservation of life) overrides virtually every
              other commandment</strong>, including Shabbat restrictions. This means:
            </p>
            <ul style={{ fontSize: 13, color: "#4a5568", lineHeight: 2, margin: "8px 0 0", paddingLeft: 20 }}>
              <li>You <strong>may</strong> use your glucose meter, CGM, or pump on Shabbat</li>
              <li>You <strong>may</strong> call emergency services if needed</li>
              <li>You <strong>may</strong> eat or drink to treat hypoglycaemia</li>
              <li>You <strong>may</strong> administer insulin injections</li>
              <li>You are <strong>obligated</strong> to take life-saving action — this is not merely permitted, it is <strong>required</strong></li>
            </ul>
          </div>

          <h3 style={heading3}>25-Hour Meal Timeline</h3>
          <div style={{ fontSize: 13, color: "#4a5568", lineHeight: 2 }}>
            <p><strong>Friday evening:</strong> Shabbat dinner — usually challah (28 g/slice), chicken, sides. Bolus for full meal.</p>
            <p><strong>Saturday morning:</strong> Kiddush + lunch — may include cholent (35 g/cup). Consider extended bolus for slow-cooked stews.</p>
            <p><strong>Seudah Shlishit:</strong> Third meal (late afternoon) — lighter, often bread-based. Bolus accordingly.</p>
            <p><strong>Motzei Shabbat:</strong> Havdalah — wine (4 g/cup). Minimal carb impact.</p>
          </div>
        </Section>

        {/* ─── 2. Kashrut Database ────────────────── */}
        <Section id="kashrut" title="Kashrut Food Database">
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {(["Ashkenazi", "Sephardi", "Mizrachi"] as const).map(tab => (
              <button type="button"
                key={tab}
                onClick={() => setKashrutTab(tab)}
                style={{
                  padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: kashrutTab === tab ? TEAL : "#f1f5f9",
                  color: kashrutTab === tab ? "#fff" : "#4a5568",
                  fontWeight: 600, fontSize: 13,
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                <th style={{ padding: 8 }}>Food</th>
                <th style={{ padding: 8 }}>Carbs (g)</th>
                <th style={{ padding: 8 }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {KASHRUT_DB[kashrutTab].map((f, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 8 }}>{f.name}</td>
                  <td style={{ padding: 8, fontWeight: 600, color: TEAL }}>{f.carbs}</td>
                  <td style={{ padding: 8, color: "#6b7280" }}>{f.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* ─── 3. Passover ────────────────────────── */}
        <Section id="passover" title="Passover Carb Profiles">
          <p style={{ color: "#4a5568", fontSize: 14, marginBottom: 12 }}>
            During Pesach, chametz (leavened grain) is forbidden. Matzah replaces bread.
            One standard sheet = <strong>27 g carbs</strong>. Matzah is high-GI — expect faster glucose spikes than bread.
          </p>

          <div style={{ background: "#eff6ff", borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 13, color: "#1e40af" }}>
            <strong>Gebrochts note:</strong> Some communities avoid gebrochts (matzah + liquid). This affects cooking —
            no matzah balls, no matzah brei. Alternatives use potato starch and almond flour (different carb counts).
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                <th style={{ padding: 8 }}>Food</th>
                <th style={{ padding: 8 }}>Carbs (g)</th>
                <th style={{ padding: 8 }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {PASSOVER_FOODS.map((f, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 8 }}>{f.name}</td>
                  <td style={{ padding: 8, fontWeight: 600, color: TEAL }}>{f.carbs}</td>
                  <td style={{ padding: 8, color: "#6b7280" }}>{f.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ ...heading3, marginTop: 20 }}>Seder Plate Items</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                <th style={{ padding: 8 }}>Item</th>
                <th style={{ padding: 8 }}>Carbs (g)</th>
                <th style={{ padding: 8 }}>Note</th>
              </tr>
            </thead>
            <tbody>
              {SEDER_PLATE.map((s, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 8 }}>{s.item}</td>
                  <td style={{ padding: 8, fontWeight: 600, color: TEAL }}>{s.carbs}</td>
                  <td style={{ padding: 8, color: "#6b7280" }}>{s.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* ─── 4. Yom Kippur ──────────────────────── */}
        <Section id="yomkippur" title="Yom Kippur Fasting Protocol">
          <p style={{ color: "#4a5568", fontSize: 14, marginBottom: 12 }}>
            Yom Kippur is a 25-hour fast (no food or water). For people with diabetes, preparation and basal adjustment are critical.
            Remember: <strong>pikuach nefesh applies</strong> — you must break the fast if your health is at risk.
          </p>

          <h3 style={heading3}>Pre-Fast Carb Loading Plan</h3>
          <div style={{ background: "#f0fdfa", borderRadius: 8, padding: 16, marginBottom: 16, fontSize: 13, color: "#1e293b", lineHeight: 2 }}>
            <p style={{ margin: 0 }}><strong>Day before (Erev YK):</strong></p>
            <ul style={{ margin: "4px 0", paddingLeft: 20 }}>
              <li>Eat regular meals with emphasis on complex carbs and protein</li>
              <li>Final meal (Seudah Mafseket): 50-60 g complex carbs + protein + healthy fat</li>
              <li>Hydrate well throughout the day</li>
              <li>Avoid very salty foods that increase thirst</li>
            </ul>
          </div>

          <h3 style={heading3}>Basal Reduction Calculator</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <label style={labelStyle}>
              Current daily basal (units)
              <input type="text" inputMode="decimal" pattern="[0-9]*.?[0-9]*" min={0} step={0.5} value={currentBasalYK} onChange={e => setCurrentBasalYK(e.target.value)} style={inputStyle} placeholder="e.g. 22" />
            </label>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              {currentBasalYK && (
                <div style={{ background: "#f0fdfa", borderRadius: 8, padding: 12 }}>
                  <p style={{ margin: 0, fontSize: 14 }}>
                    Suggested YK basal (−25 %): <strong style={{ color: TEAL, fontSize: 18 }}>{adjustedBasalYK} U</strong>
                  </p>
                </div>
              )}
            </div>
          </div>

          <div style={{ background: "#fef2f2", borderRadius: 8, padding: 12, fontSize: 13, color: "#991b1b" }}>
            <strong>Break-fast rules:</strong> Check BG every 2-3 hours. If BG drops below 3.9 mmol/L (70 mg/dL),
            break the fast immediately with 15 g fast-acting carbs. If BG exceeds 16.7 mmol/L (300 mg/dL) or
            ketones are present, break fast and give correction dose. <strong>Pikuach nefesh is not optional.</strong>
          </div>
        </Section>

        {/* ─── 5. Kiddush & Seder Calculator ──────── */}
        <Section id="kiddush" title="Kiddush Wine & Seder Calculator">
          <p style={{ color: "#4a5568", fontSize: 14, marginBottom: 12 }}>
            Kiddush wine contains approximately <strong>4 g of carbs per cup</strong> (86 ml / 3 oz).
            At the Passover Seder, 4 cups are drunk — totalling about 16 g carbs from wine alone.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <label style={labelStyle}>
              Number of cups
              <DecimalInput min={1} max={10} value={wineCups} onChange={(v) => setWineCups(Math.max(1, Math.round(v)))} style={inputStyle} />
            </label>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              <div style={{ background: "#f0fdfa", borderRadius: 8, padding: 12 }}>
                <p style={{ margin: 0, fontSize: 14 }}>
                  Total carbs from wine: <strong style={{ color: TEAL, fontSize: 18 }}>{wineCarbs} g</strong>
                </p>
              </div>
            </div>
          </div>

          <div style={{ background: "#fffbeb", borderRadius: 8, padding: 12, fontSize: 13, color: "#92400e" }}>
            <strong>Alcohol note:</strong> Wine can cause delayed hypoglycaemia (2-12 hours later) due to liver
            inhibition of gluconeogenesis. Consider reducing overnight basal by 10-20 % after Seder.
            Grape juice is a valid halachic alternative with different carb counts (~20 g/cup).
          </div>
        </Section>

        {/* ─── 6. Holiday Calendar ────────────────── */}
        <Section id="calendar" title="Holiday Calendar with Insulin Planning">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                <th style={{ padding: 8 }}>Holiday</th>
                <th style={{ padding: 8 }}>Insulin Considerations</th>
                <th style={{ padding: 8 }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {HOLIDAYS.map((h, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 8, fontWeight: 600, color: NAVY }}>{h.name}</td>
                  <td style={{ padding: 8, color: "#4a5568" }}>{h.insulin}</td>
                  <td style={{ padding: 8 }}><span style={{ ...pill, background: "#ede9fe", color: "#5b21b6" }}>{h.notes}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* ─── Disclaimer ─────────────────────────── */}
        <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, marginTop: 8, border: "1px solid #e2e8f0" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>
            <strong>Disclaimer:</strong> This module provides general educational guidance only.
            <strong> Consult your rabbi and your diabetes care team</strong> before making any changes
            to your observance practices or insulin regimen. GluMira does not provide halachic rulings.
            References to Jewish law are for educational context only.
          </p>
        </div>
      </div>
    </div>
  );
}
