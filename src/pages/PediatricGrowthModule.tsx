/**
 * GluMira™ V7 — Block 67: Paediatric Growth Module
 * Growth hormone impact and age-adjusted targets for paediatric patients.
 * Scandinavian Minimalist design — mobile first
 */
import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useKeyboardSave } from "@/hooks/useKeyboardSave";
import { useGlucoseUnits } from "@/context/GlucoseUnitsContext";
import { DISCLAIMER } from "@/lib/constants";
import { apiFetch } from "@/lib/api";

/* ─── Style tokens ───────────────────────────────────────────────────────── */

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--bg-primary)",
  color: "var(--text-primary)",
  fontFamily: "'DM Sans', sans-serif",
};

const container: React.CSSProperties = {
  maxWidth: 640,
  margin: "0 auto",
  padding: "clamp(16px, 4vw, 32px)",
};

const card: React.CSSProperties = {
  background: "var(--bg-card)",
  border: "1px solid var(--border-light)",
  borderRadius: 12,
  padding: 20,
  marginBottom: 16,
};

const heading: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontSize: "1.4rem",
  fontWeight: 700,
  marginBottom: 8,
};

const subheading: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontSize: "1.1rem",
  fontWeight: 600,
  marginBottom: 12,
};

const label: React.CSSProperties = {
  fontSize: "0.82rem",
  color: "var(--text-secondary)",
  marginBottom: 4,
  display: "block",
};

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid var(--border-light)",
  borderRadius: 8,
  fontSize: "0.92rem",
  fontFamily: "'DM Sans', sans-serif",
  background: "var(--bg-card)",
  color: "var(--text-primary)",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "auto" as const,
};

const btnPrimary: React.CSSProperties = {
  background: "var(--accent-teal)",
  color: "#fff",
  border: "none",
  borderRadius: 8,
  padding: "10px 20px",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: "0.95rem",
  width: "100%",
};

const row: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
  marginBottom: 12,
};

const alertCard: React.CSSProperties = {
  ...card,
  borderLeft: "4px solid var(--accent-teal)",
};

const warningCard: React.CSSProperties = {
  ...card,
  borderLeft: "4px solid #f59e0b",
};

/* ─── Percentile data (simplified WHO-like curves) ───────────────────────── */

interface PercentilePoint { age: number; p3: number; p15: number; p50: number; p85: number; p97: number }

const HEIGHT_BOYS: PercentilePoint[] = [
  { age: 0, p3: 46, p15: 48, p50: 50, p85: 52, p97: 54 },
  { age: 1, p3: 69, p15: 72, p50: 75, p85: 78, p97: 81 },
  { age: 2, p3: 80, p15: 83, p50: 87, p85: 91, p97: 94 },
  { age: 4, p3: 94, p15: 98, p50: 102, p85: 106, p97: 110 },
  { age: 6, p3: 106, p15: 111, p50: 116, p85: 121, p97: 126 },
  { age: 8, p3: 117, p15: 122, p50: 128, p85: 134, p97: 139 },
  { age: 10, p3: 126, p15: 132, p50: 138, p85: 145, p97: 151 },
  { age: 12, p3: 135, p15: 142, p50: 149, p85: 157, p97: 164 },
  { age: 14, p3: 148, p15: 155, p50: 163, p85: 171, p97: 178 },
  { age: 16, p3: 159, p15: 165, p50: 173, p85: 180, p97: 186 },
  { age: 18, p3: 163, p15: 168, p50: 176, p85: 183, p97: 189 },
];

const HEIGHT_GIRLS: PercentilePoint[] = [
  { age: 0, p3: 45, p15: 47, p50: 49, p85: 51, p97: 53 },
  { age: 1, p3: 67, p15: 70, p50: 74, p85: 77, p97: 80 },
  { age: 2, p3: 79, p15: 82, p50: 86, p85: 89, p97: 93 },
  { age: 4, p3: 93, p15: 97, p50: 101, p85: 105, p97: 109 },
  { age: 6, p3: 105, p15: 110, p50: 115, p85: 120, p97: 125 },
  { age: 8, p3: 116, p15: 121, p50: 127, p85: 133, p97: 138 },
  { age: 10, p3: 126, p15: 132, p50: 138, p85: 145, p97: 151 },
  { age: 12, p3: 139, p15: 145, p50: 152, p85: 159, p97: 165 },
  { age: 14, p3: 148, p15: 153, p50: 160, p85: 166, p97: 171 },
  { age: 16, p3: 151, p15: 155, p50: 162, p85: 168, p97: 172 },
  { age: 18, p3: 152, p15: 156, p50: 163, p85: 169, p97: 173 },
];

/* ─── Growth chart SVG ───────────────────────────────────────────────────── */

function GrowthChart({ gender, ageYears, heightCm }: { gender: string; ageYears: number; heightCm: number }) {
  const data = gender === "female" ? HEIGHT_GIRLS : HEIGHT_BOYS;
  const W = 560;
  const H = 320;
  const PAD = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const minAge = 0;
  const maxAge = 18;
  const minH = 40;
  const maxH = 200;

  const scaleX = (age: number) => PAD.left + ((age - minAge) / (maxAge - minAge)) * plotW;
  const scaleY = (h: number) => PAD.top + plotH - ((h - minH) / (maxH - minH)) * plotH;

  const makePath = (key: keyof PercentilePoint) =>
    data.map((d, i) => `${i === 0 ? "M" : "L"} ${scaleX(d.age).toFixed(1)} ${scaleY(d[key] as number).toFixed(1)}`).join(" ");

  const percentiles: { key: keyof PercentilePoint; label: string; dash: string; opacity: number }[] = [
    { key: "p3", label: "3rd", dash: "4 2", opacity: 0.3 },
    { key: "p15", label: "15th", dash: "4 2", opacity: 0.4 },
    { key: "p50", label: "50th", dash: "0", opacity: 0.8 },
    { key: "p85", label: "85th", dash: "4 2", opacity: 0.4 },
    { key: "p97", label: "97th", dash: "4 2", opacity: 0.3 },
  ];

  const childX = scaleX(ageYears);
  const childY = scaleY(heightCm);
  const showChild = ageYears >= 0 && ageYears <= 18 && heightCm >= minH && heightCm <= maxH;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
      {/* Grid lines */}
      {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18].map((a) => (
        <line key={`gx-${a}`} x1={scaleX(a)} y1={PAD.top} x2={scaleX(a)} y2={PAD.top + plotH}
          stroke="var(--border-light)" strokeWidth={0.5} />
      ))}
      {[60, 80, 100, 120, 140, 160, 180].map((h) => (
        <line key={`gy-${h}`} x1={PAD.left} y1={scaleY(h)} x2={PAD.left + plotW} y2={scaleY(h)}
          stroke="var(--border-light)" strokeWidth={0.5} />
      ))}

      {/* Axes labels */}
      {[0, 4, 8, 12, 16].map((a) => (
        <text key={`al-${a}`} x={scaleX(a)} y={H - 8} textAnchor="middle"
          style={{ fontSize: 10, fill: "var(--text-faint)", fontFamily: "'JetBrains Mono', monospace" }}>
          {a}y
        </text>
      ))}
      {[60, 100, 140, 180].map((h) => (
        <text key={`hl-${h}`} x={PAD.left - 8} y={scaleY(h) + 3} textAnchor="end"
          style={{ fontSize: 10, fill: "var(--text-faint)", fontFamily: "'JetBrains Mono', monospace" }}>
          {h}
        </text>
      ))}
      <text x={W / 2} y={H - 0} textAnchor="middle"
        style={{ fontSize: 11, fill: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif" }}>
        Age (years)
      </text>
      <text x={12} y={H / 2} textAnchor="middle" transform={`rotate(-90, 12, ${H / 2})`}
        style={{ fontSize: 11, fill: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif" }}>
        Height (cm)
      </text>

      {/* Percentile curves */}
      {percentiles.map((p) => (
        <g key={p.key}>
          <path d={makePath(p.key)} fill="none" stroke="var(--accent-teal)" strokeWidth={p.key === "p50" ? 2 : 1}
            strokeDasharray={p.dash} opacity={p.opacity} />
          <text x={W - PAD.right + 4} y={scaleY(data[data.length - 1][p.key] as number) + 3}
            style={{ fontSize: 8, fill: "var(--text-faint)", fontFamily: "'JetBrains Mono', monospace" }}>
            {p.label}
          </text>
        </g>
      ))}

      {/* Child's data point */}
      {showChild && (
        <>
          <circle cx={childX} cy={childY} r={6} fill="var(--accent-teal)" stroke="#fff" strokeWidth={2} />
          <text x={childX + 10} y={childY - 8}
            style={{ fontSize: 10, fill: "var(--accent-teal)", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
            {heightCm} cm
          </text>
        </>
      )}
    </svg>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */

export default function PediatricGrowthModule() {
  const { session } = useAuth();
  const { units } = useGlucoseUnits();

  // Form state
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("male");
  const [tannerStage, setTannerStage] = useState("I");
  const [prevHeightCm, setPrevHeightCm] = useState("");
  const [prevHeightDate, setPrevHeightDate] = useState("");
  const [totalDailyDose, setTotalDailyDose] = useState("");

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Derived
  const ageYears = dob
    ? (Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    : 0;
  const ageDisplay = ageYears > 0 ? `${Math.floor(ageYears)}y ${Math.floor((ageYears % 1) * 12)}m` : "—";

  const heightNum = parseFloat(heightCm) || 0;
  const weightNum = parseFloat(weightKg) || 0;
  const tddNum = parseFloat(totalDailyDose) || 0;
  const unitsPerKg = weightNum > 0 && tddNum > 0 ? (tddNum / weightNum).toFixed(2) : null;

  // Growth velocity
  const prevH = parseFloat(prevHeightCm) || 0;
  let growthVelocity: number | null = null;
  let growthVelocityAnnual: number | null = null;
  if (prevH > 0 && heightNum > 0 && prevHeightDate) {
    const months = (Date.now() - new Date(prevHeightDate).getTime()) / (30.44 * 24 * 60 * 60 * 1000);
    if (months > 0) {
      growthVelocity = (heightNum - prevH) / months;
      growthVelocityAnnual = growthVelocity * 12;
    }
  }

  const isPuberty = ["III", "IV", "V"].includes(tannerStage);

  // mmol to mg/dl helper
  const glucoseDisplay = (mmol: number) => {
    if (units === "mg") return `${Math.round(mmol * 18)} mg/dL`;
    return `${mmol.toFixed(1)} mmol/L`;
  };

  // Save handler
  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await apiFetch("/trpc/growth.create", {
        method: "POST",
        body: JSON.stringify({
          heightCm: heightNum,
          weightKg: weightNum,
          dob,
          gender,
          tannerStage,
          totalDailyDose: tddNum || undefined,
          prevHeightCm: prevH || undefined,
          prevHeightDate: prevHeightDate || undefined,
        }),
      });
      setSaveMsg("Saved successfully");
    } catch (err: any) {
      setSaveMsg(err?.message ?? "Save failed");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  }, [saving, heightNum, weightNum, dob, gender, tannerStage, tddNum, prevH, prevHeightDate]);

  useKeyboardSave(handleSave);

  return (
    <div style={page}>
      <div style={container}>
        {/* Header */}
        <header style={{ marginBottom: 24 }}>
          <Link to="/" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textDecoration: "none" }}>
            &larr; Back
          </Link>
          <h1 style={{ ...heading, fontSize: "1.6rem", marginTop: 8 }}>Paediatric Growth</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Growth tracking, age-adjusted targets, and puberty impact on diabetes.
          </p>
        </header>

        {/* Growth data entry */}
        <div style={card}>
          <h2 style={subheading}>Growth Data</h2>
          <div style={row}>
            <div>
              <label style={label}>Height (cm)</label>
              <input style={inputStyle} type="number" step="0.1" placeholder="120" value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)} />
            </div>
            <div>
              <label style={label}>Weight (kg)</label>
              <input style={inputStyle} type="number" step="0.1" placeholder="30" value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)} />
            </div>
          </div>
          <div style={row}>
            <div>
              <label style={label}>Date of birth</label>
              <input style={inputStyle} type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </div>
            <div>
              <label style={label}>Gender</label>
              <select style={selectStyle} value={gender} onChange={(e) => setGender(e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>
          <div style={row}>
            <div>
              <label style={label}>Tanner Stage</label>
              <select style={selectStyle} value={tannerStage} onChange={(e) => setTannerStage(e.target.value)}>
                <option value="I">I — Prepubertal</option>
                <option value="II">II — Early puberty</option>
                <option value="III">III — Mid-puberty</option>
                <option value="IV">IV — Late puberty</option>
                <option value="V">V — Adult</option>
              </select>
            </div>
            <div>
              <label style={label}>Age</label>
              <div style={{ ...mono, fontSize: "1.1rem", padding: "8px 0", color: "var(--accent-teal)" }}>
                {ageDisplay}
              </div>
            </div>
          </div>
        </div>

        {/* Growth chart */}
        {heightNum > 0 && ageYears > 0 && (
          <div style={card}>
            <h2 style={subheading}>Growth Chart — Height Percentiles</h2>
            <GrowthChart gender={gender} ageYears={ageYears} heightCm={heightNum} />
          </div>
        )}

        {/* Age-adjusted glucose targets */}
        <div style={card}>
          <h2 style={subheading}>Age-Adjusted Glucose Targets</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                <th style={{ textAlign: "left", padding: "8px 4px", color: "var(--text-secondary)", fontWeight: 500 }}>Age Group</th>
                <th style={{ textAlign: "left", padding: "8px 4px", color: "var(--text-secondary)", fontWeight: 500 }}>Target Range</th>
                <th style={{ textAlign: "left", padding: "8px 4px", color: "var(--text-secondary)", fontWeight: 500 }}>A1C Target</th>
              </tr>
            </thead>
            <tbody>
              {[
                { group: "Under 6 years", low: 6.1, high: 11.1, a1c: "< 8.5%", note: "Wider range, safety first" },
                { group: "6-12 years", low: 4.0, high: 10.0, a1c: "< 8.0%", note: "Balancing safety and control" },
                { group: "13-18 years", low: 3.9, high: 10.0, a1c: "< 7.5%", note: "Approaching adult targets" },
              ].map((r, i) => {
                const isActive = ageYears > 0 && (
                  (r.group === "Under 6 years" && ageYears < 6) ||
                  (r.group === "6-12 years" && ageYears >= 6 && ageYears < 13) ||
                  (r.group === "13-18 years" && ageYears >= 13)
                );
                return (
                  <tr key={i} style={{
                    borderBottom: "1px solid var(--border-light)",
                    background: isActive ? "rgba(42,181,193,0.08)" : "transparent",
                  }}>
                    <td style={{ padding: "8px 4px", fontWeight: isActive ? 700 : 400 }}>
                      {r.group} {isActive && <span style={{ color: "var(--accent-teal)", fontSize: "0.75rem" }}>current</span>}
                    </td>
                    <td style={{ padding: "8px 4px", ...mono }}>
                      {glucoseDisplay(r.low)} — {glucoseDisplay(r.high)}
                    </td>
                    <td style={{ padding: "8px 4px", ...mono }}>{r.a1c}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p style={{ fontSize: "0.78rem", color: "var(--text-faint)", marginTop: 8 }}>
            {(() => {
              const active = ageYears < 6 ? "Under 6" : ageYears < 13 ? "6-12" : "13-18";
              return ageYears > 0
                ? `Note for ${active} age group: Targets are individualised. These are general guidelines.`
                : "Enter date of birth to highlight the applicable age group.";
            })()}
          </p>
        </div>

        {/* Growth hormone impact */}
        <div style={isPuberty ? warningCard : alertCard}>
          <h2 style={subheading}>Growth Hormone Impact</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: "0.9rem" }}>
            <div style={{ padding: 12, background: isPuberty ? "rgba(245,158,11,0.08)" : "rgba(42,181,193,0.06)", borderRadius: 8 }}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Puberty and Insulin Resistance</p>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                Growth hormone surges during puberty increase insulin resistance. Insulin doses may need to
                increase 20-50% during growth spurts.
                {isPuberty && (
                  <strong style={{ display: "block", marginTop: 8, color: "#d97706" }}>
                    Tanner stage {tannerStage} indicates active puberty. Monitor closely for rising insulin needs.
                  </strong>
                )}
              </p>
            </div>
            <div style={{ padding: 12, background: "rgba(42,181,193,0.06)", borderRadius: 8 }}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Dawn Phenomenon in Teens</p>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                Teenage dawn phenomenon is often more pronounced due to growth hormone peaks in
                early morning hours. Consider overnight basal adjustments or later evening long-acting insulin timing.
              </p>
            </div>
          </div>
        </div>

        {/* Growth velocity tracker */}
        <div style={card}>
          <h2 style={subheading}>Growth Velocity Tracker</h2>
          <p style={{ ...label, marginBottom: 12 }}>Enter a previous height measurement to calculate growth rate.</p>
          <div style={row}>
            <div>
              <label style={label}>Previous height (cm)</label>
              <input style={inputStyle} type="number" step="0.1" placeholder="115" value={prevHeightCm}
                onChange={(e) => setPrevHeightCm(e.target.value)} />
            </div>
            <div>
              <label style={label}>Date of that measurement</label>
              <input style={inputStyle} type="date" value={prevHeightDate}
                onChange={(e) => setPrevHeightDate(e.target.value)} />
            </div>
          </div>
          {growthVelocity !== null && growthVelocityAnnual !== null && (
            <div style={{ padding: 12, background: "rgba(42,181,193,0.06)", borderRadius: 8, marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.88rem" }}>Growth rate</span>
                <span style={{ ...mono, fontSize: "1rem", color: "var(--accent-teal)", fontWeight: 600 }}>
                  {growthVelocity.toFixed(2)} cm/month
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                <span style={{ fontSize: "0.88rem" }}>Annualised</span>
                <span style={{ ...mono, fontSize: "1rem", color: "var(--accent-teal)", fontWeight: 600 }}>
                  {growthVelocityAnnual.toFixed(1)} cm/year
                </span>
              </div>
              {growthVelocityAnnual > 8 && (
                <p style={{ fontSize: "0.82rem", color: "#d97706", marginTop: 8, fontWeight: 600 }}>
                  Accelerated growth detected. This may indicate a pubertal growth spurt. Monitor insulin needs closely.
                </p>
              )}
              {growthVelocityAnnual > 0 && growthVelocityAnnual < 4 && ageYears < 16 && (
                <p style={{ fontSize: "0.82rem", color: "#d97706", marginTop: 8, fontWeight: 600 }}>
                  Growth velocity is below expected range. Consider endocrine review if persistent.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Insulin dose per kg */}
        <div style={card}>
          <h2 style={subheading}>Insulin Dose per kg</h2>
          <div style={row}>
            <div>
              <label style={label}>Total daily dose (units)</label>
              <input style={inputStyle} type="number" step="0.5" placeholder="20" value={totalDailyDose}
                onChange={(e) => setTotalDailyDose(e.target.value)} />
            </div>
            <div>
              <label style={label}>Weight (kg)</label>
              <div style={{ ...mono, fontSize: "1rem", padding: "8px 0" }}>
                {weightNum > 0 ? `${weightNum} kg` : "—"}
              </div>
            </div>
          </div>
          {unitsPerKg !== null && (
            <div style={{ padding: 12, background: "rgba(42,181,193,0.06)", borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.88rem" }}>Units/kg/day</span>
                <span style={{ ...mono, fontSize: "1.2rem", color: "var(--accent-teal)", fontWeight: 700 }}>
                  {unitsPerKg} U/kg/day
                </span>
              </div>
              <p style={{ fontSize: "0.82rem", color: "var(--text-faint)", marginTop: 8 }}>
                Reference: Typical range is 0.5-1.0 U/kg/day.
                {isPuberty && " During puberty, doses of 1.0-1.5 U/kg/day are common."}
                {parseFloat(unitsPerKg) > 1.5 && (
                  <strong style={{ display: "block", color: "#d97706", marginTop: 4 }}>
                    Current dose exceeds typical puberty range. Review with diabetes team.
                  </strong>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Save button */}
        <button style={{ ...btnPrimary, marginBottom: 16 }} onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Growth Data"}
        </button>
        {saveMsg && (
          <p style={{
            textAlign: "center",
            fontSize: "0.85rem",
            color: saveMsg.includes("success") ? "var(--accent-teal)" : "#ef4444",
            marginBottom: 16,
          }}>
            {saveMsg}
          </p>
        )}

        {/* Disclaimer */}
        <p style={{ fontSize: "0.75rem", color: "var(--text-faint)", textAlign: "center", paddingBottom: 32 }}>
          {DISCLAIMER}
        </p>
      </div>
    </div>
  );
}
