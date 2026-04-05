/**
 * GluMira™ V7 — Sick Day Rules Module
 * Monitoring checklist, ketone protocol, fluid calculator,
 * insulin guidance, "The Gastroenteritis Crisis Protocol" vomiting protocol,
 * hospital red flags, and emergency contacts.
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
const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4, fontSize: 14, color: "#4a5568" };
const inputStyle: React.CSSProperties = {
  padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1",
  fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
};
const pill: React.CSSProperties = {
  display: "inline-block", padding: "4px 10px", borderRadius: 999,
  fontSize: 12, fontWeight: 600, marginRight: 6, marginBottom: 6,
};
const emergencyBox: React.CSSProperties = {
  background: "#fef2f2", border: "2px solid #fca5a5", borderRadius: 12,
  padding: 24, marginBottom: 20,
};
const anoukBox: React.CSSProperties = {
  background: "#fffbeb", border: "2px solid #fcd34d", borderRadius: 12,
  padding: 24, marginBottom: 20,
};

/* ── data ──────────────────────────────────────────── */
const MONITORING_CHECKLIST = [
  { check: "Blood glucose", frequency: "Every 2 hours", notes: "Including overnight — set alarms. Target: 4-10 mmol/L (72-180 mg/dL)." },
  { check: "Blood ketones", frequency: "Every 4 hours", notes: "Use blood ketone meter. < 0.6 normal, 0.6-1.5 watch, 1.5-3.0 danger, > 3.0 emergency." },
  { check: "Temperature", frequency: "Every 4-6 hours", notes: "Fever increases insulin resistance. Every 1C rise may need 10-20 % more insulin." },
  { check: "Fluid intake", frequency: "Continuous tracking", notes: "Log every drink. Minimum volumes by age listed in fluid calculator below." },
  { check: "Urine output", frequency: "Each void", notes: "Reduced output is a sign of dehydration. Dark urine = drink more." },
  { check: "Food intake", frequency: "Each attempt", notes: "Log what is eaten/tolerated. Even small amounts matter." },
  { check: "Insulin doses", frequency: "Each dose", notes: "Record all basal and correction doses. Never skip basal." },
  { check: "Symptoms", frequency: "Every 2 hours", notes: "Nausea, vomiting, abdominal pain, breathing rate, drowsiness." },
];

const KETONE_PROTOCOL = [
  { range: "< 0.6 mmol/L", level: "Normal", colour: "#16a34a", bg: "#d1fae5", action: "Continue monitoring every 4 hours. Maintain hydration." },
  { range: "0.6 – 1.5 mmol/L", level: "Raised", colour: "#ea580c", bg: "#ffedd5", action: "Give extra rapid-acting insulin (10 % of TDD). Recheck in 2 hours. Push fluids. Contact diabetes team if not falling." },
  { range: "1.5 – 3.0 mmol/L", level: "High", colour: "#dc2626", bg: "#fee2e2", action: "Give 15-20 % of TDD as rapid insulin. Recheck in 1 hour. If not falling, CALL diabetes team immediately. Push fluids." },
  { range: "> 3.0 mmol/L", level: "EMERGENCY", colour: "#991b1b", bg: "#fecaca", action: "This is DKA territory. Go to hospital immediately. Give 20 % of TDD on the way. Call ambulance if vomiting." },
];

const FLUID_TABLE = [
  { age: "0-1 years", minMl: "30 mL/hour", total24: "~720 mL", examples: "Oral rehydration solution, breast milk" },
  { age: "1-3 years", minMl: "40 mL/hour", total24: "~960 mL", examples: "ORS, diluted juice, water, clear soup" },
  { age: "3-6 years", minMl: "50 mL/hour", total24: "~1,200 mL", examples: "ORS, water, clear soup, ice lollies" },
  { age: "6-12 years", minMl: "60 mL/hour", total24: "~1,440 mL", examples: "Water, ORS, sugar-free squash, clear soup" },
  { age: "12-18 years", minMl: "80 mL/hour", total24: "~1,920 mL", examples: "Water, ORS, sugar-free drinks, clear broth" },
  { age: "Adults (18+)", minMl: "100 mL/hour", total24: "~2,400 mL", examples: "Water, ORS, sugar-free drinks, broth, herbal tea" },
];

const INSULIN_GUIDANCE = [
  { rule: "NEVER stop basal insulin", detail: "Even if not eating. Basal covers hepatic glucose output. Stopping basal is the fastest route to DKA.", priority: "critical" },
  { rule: "Reduce bolus if not eating", detail: "If eating less than 50 % of normal, reduce meal bolus by 50 %. If eating nothing, skip meal bolus but keep correction bolus.", priority: "high" },
  { rule: "Increase basal if BG is high", detail: "If BG consistently above 14 mmol/L (250 mg/dL), consider a temporary basal increase of 10-20 %. On pump: set temp basal +20 %.", priority: "high" },
  { rule: "Give correction doses more frequently", detail: "During illness, give correction doses every 2-3 hours if BG remains high. Use your ISF as normal.", priority: "medium" },
  { rule: "Use rapid insulin for ketone corrections", detail: "Even if BG is not very high, ketones above 1.5 require insulin. Give 10-20 % of TDD as rapid-acting.", priority: "high" },
  { rule: "Do not stack corrections blindly", detail: "Consider active insulin on board (IOB). If you corrected 2 hours ago and BG hasn't changed, wait or contact your team.", priority: "medium" },
];

const RED_FLAGS = [
  "Vomiting that persists for more than 2 hours despite anti-emetics",
  "Unable to keep down any fluids for more than 1 hour",
  "Blood ketones above 3.0 mmol/L that are not falling with insulin",
  "Blood glucose consistently above 20 mmol/L (360 mg/dL) despite corrections",
  "Signs of dehydration: dry mouth, no tears, sunken eyes, reduced urine output",
  "Rapid or deep (Kussmaul) breathing",
  "Fruity/acetone smell on breath",
  "Drowsiness, confusion, or difficulty staying awake",
  "Abdominal pain that is severe or worsening",
  "Chest pain or difficulty breathing",
  "Temperature above 39.5 C (103 F) not responding to paracetamol/ibuprofen",
  "Any seizure activity",
];

/* ── component ─────────────────────────────────────── */
export default function SickDayModule() {
  const [open, setOpen] = useState<Record<string, boolean>>({
    checklist: true, ketones: false, fluids: false,
    insulin: false, anouk: false, hospital: false, contacts: false,
  });
  const toggle = (key: string) => setOpen(o => ({ ...o, [key]: !o[key] }));

  /* Monitoring checklist state */
  const [checked, setChecked] = useState<boolean[]>(new Array(MONITORING_CHECKLIST.length).fill(false));

  /* Fluid calc */
  const [ageGroup, setAgeGroup] = useState("Adults (18+)");
  const selectedFluid = FLUID_TABLE.find(f => f.age === ageGroup);

  /* Emergency contacts */
  const [contacts, setContacts] = useState([
    { name: "Diabetes nurse specialist", phone: "", notes: "Weekday hours" },
    { name: "Hospital diabetes team", phone: "", notes: "Out of hours" },
    { name: "GP / Primary care", phone: "", notes: "" },
    { name: "Emergency services", phone: "999 / 112 / 911", notes: "For life-threatening emergencies" },
  ]);
  const updateContact = (index: number, field: "name" | "phone" | "notes", value: string) => {
    setContacts(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const Section = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => (
    <div style={card}>
      <button
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
            Sick Day Rules
          </h1>
          <p style={{ margin: "4px 0 0", color: "#718096", fontSize: 15 }}>
            Essential protocols for managing diabetes during illness — never skip this
          </p>
        </div>

        {/* ─── 1. Monitoring Checklist ────────────── */}
        <Section id="checklist" title="Sick Day Monitoring Checklist">
          <p style={{ color: "#4a5568", fontSize: 14, marginBottom: 12 }}>
            When unwell, <strong>increase monitoring frequency</strong>. Tick each item as you complete it.
            This checklist resets — use it as a recurring reminder.
          </p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                <th style={{ padding: 8, width: 30 }}></th>
                <th style={{ padding: 8 }}>Check</th>
                <th style={{ padding: 8 }}>Frequency</th>
                <th style={{ padding: 8 }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {MONITORING_CHECKLIST.map((item, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: checked[i] ? "#f0fdf4" : "transparent" }}>
                  <td style={{ padding: 8 }}>
                    <input
                      type="checkbox"
                      checked={checked[i]}
                      onChange={() => {
                        const next = [...checked];
                        next[i] = !next[i];
                        setChecked(next);
                      }}
                    />
                  </td>
                  <td style={{ padding: 8, fontWeight: 600, color: NAVY }}>{item.check}</td>
                  <td style={{ padding: 8 }}><span style={{ ...pill, background: "#ede9fe", color: "#5b21b6" }}>{item.frequency}</span></td>
                  <td style={{ padding: 8, color: "#6b7280" }}>{item.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: 12, fontSize: 13, color: "#6b7280" }}>
            Completed: {checked.filter(Boolean).length} / {checked.length}
            {checked.every(Boolean) && (
              <span style={{ marginLeft: 12, color: "#16a34a", fontWeight: 600 }}>All checks complete — repeat in 2 hours</span>
            )}
          </div>
        </Section>

        {/* ─── 2. Ketone Monitoring Protocol ──────── */}
        <Section id="ketones" title="Ketone Monitoring Protocol">
          <p style={{ color: "#4a5568", fontSize: 14, marginBottom: 12 }}>
            <strong>Blood ketone testing is preferred</strong> over urine testing during illness.
            Blood ketones (beta-hydroxybutyrate) give a real-time reading. Urine ketones are delayed by 2-4 hours.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ background: "#d1fae5", borderRadius: 8, padding: 12, fontSize: 13 }}>
              <strong>Blood ketones (preferred):</strong>
              <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
                <li>Real-time measurement</li>
                <li>Measures beta-hydroxybutyrate</li>
                <li>Accurate during dehydration</li>
                <li>Clear numeric thresholds</li>
              </ul>
            </div>
            <div style={{ background: "#fef9c3", borderRadius: 8, padding: 12, fontSize: 13 }}>
              <strong>Urine ketones (backup):</strong>
              <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
                <li>2-4 hour delay behind blood</li>
                <li>Measures acetoacetate</li>
                <li>Unreliable if dehydrated</li>
                <li>Use only if no blood meter</li>
              </ul>
            </div>
          </div>

          <h3 style={heading3}>Action by ketone level</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {KETONE_PROTOCOL.map((k, i) => (
              <div key={i} style={{ background: k.bg, borderRadius: 8, padding: 16, borderLeft: `4px solid ${k.colour}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <strong style={{ color: k.colour, fontSize: 15 }}>{k.range}</strong>
                  <span style={{ ...pill, background: k.colour, color: "#fff" }}>{k.level}</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: "#1e293b", lineHeight: 1.7 }}>{k.action}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* ─── 3. Fluid Intake Calculator ─────────── */}
        <Section id="fluids" title="Fluid Intake Calculator">
          <p style={{ color: "#4a5568", fontSize: 14, marginBottom: 12 }}>
            Dehydration accelerates DKA. <strong>Maintaining fluid intake is as important as insulin</strong> during illness.
          </p>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              Age group
              <select value={ageGroup} onChange={e => setAgeGroup(e.target.value)} style={inputStyle}>
                {FLUID_TABLE.map(f => (
                  <option key={f.age} value={f.age}>{f.age}</option>
                ))}
              </select>
            </label>
          </div>
          {selectedFluid && (
            <div style={{ background: "#f0fdfa", borderRadius: 8, padding: 16, marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, fontSize: 14 }}>
                <div>
                  <p style={{ margin: 0, color: "#6b7280", fontSize: 12 }}>Minimum per hour</p>
                  <p style={{ margin: 0, fontWeight: 700, color: TEAL, fontSize: 22 }}>{selectedFluid.minMl}</p>
                </div>
                <div>
                  <p style={{ margin: 0, color: "#6b7280", fontSize: 12 }}>Target over 24 hours</p>
                  <p style={{ margin: 0, fontWeight: 700, color: NAVY, fontSize: 22 }}>{selectedFluid.total24}</p>
                </div>
              </div>
              <p style={{ margin: "12px 0 0", fontSize: 13, color: "#4a5568" }}>
                <strong>Suitable fluids:</strong> {selectedFluid.examples}
              </p>
            </div>
          )}
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                <th style={{ padding: 8 }}>Age</th>
                <th style={{ padding: 8 }}>Min/hour</th>
                <th style={{ padding: 8 }}>24h total</th>
              </tr>
            </thead>
            <tbody>
              {FLUID_TABLE.map((f, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f1f5f9", background: f.age === ageGroup ? "#f0fdfa" : "transparent" }}>
                  <td style={{ padding: 8, fontWeight: f.age === ageGroup ? 700 : 400 }}>{f.age}</td>
                  <td style={{ padding: 8 }}>{f.minMl}</td>
                  <td style={{ padding: 8 }}>{f.total24}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        {/* ─── 4. Insulin Adjustment Guidance ─────── */}
        <Section id="insulin" title="Insulin Adjustment During Illness">
          {INSULIN_GUIDANCE.map((g, i) => {
            const bg = g.priority === "critical" ? "#fef2f2" : g.priority === "high" ? "#fffbeb" : "#f8fafc";
            const border = g.priority === "critical" ? "#dc2626" : g.priority === "high" ? "#f59e0b" : "#94a3b8";
            return (
              <div key={i} style={{ background: bg, borderRadius: 8, padding: 16, marginBottom: 8, borderLeft: `4px solid ${border}` }}>
                <p style={{ margin: 0, fontWeight: 700, color: NAVY, fontSize: 14 }}>{g.rule}</p>
                <p style={{ margin: "6px 0 0", fontSize: 13, color: "#4a5568", lineHeight: 1.7 }}>{g.detail}</p>
              </div>
            );
          })}
        </Section>

        {/* ─── 5. The Gastroenteritis Crisis Protocol ──────────────── */}
        <div style={anoukBox}>
          <button
            onClick={() => toggle("anouk")}
            style={{
              all: "unset", cursor: "pointer", width: "100%", display: "flex",
              justifyContent: "space-between", alignItems: "center",
            }}
          >
            <h2 style={{ ...heading2, color: "#92400e", marginBottom: 0 }}>
              Vomiting Protocol — "The Gastroenteritis Crisis Protocol"
            </h2>
            <span style={{ color: "#92400e", fontSize: 22, fontWeight: 700 }}>{open.anouk ? "−" : "+"}</span>
          </button>
          {open.anouk && (
            <div style={{ marginTop: 16, fontSize: 14, color: "#1e293b" }}>
              <p style={{ marginBottom: 12, color: "#92400e", fontWeight: 600 }}>
                This is a core GluMira scenario. When a person with T1D is vomiting and cannot keep food
                down, they are at high risk of DKA — even if blood glucose is not very high.
              </p>

              <h3 style={{ ...heading3, color: "#92400e" }}>Step-by-step protocol:</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ background: "#fff", borderRadius: 8, padding: 16 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: NAVY }}>1. Cannot keep food down</p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#4a5568", lineHeight: 1.7 }}>
                    Try <strong>small frequent sips</strong> rather than large drinks. Small frequent sips &gt; large drinks.
                    Options: glucose gel squeezed onto the inside of the cheek, flat cola (defizzed) in teaspoon-sized sips,
                    ice chips, or frozen juice cubes sucked slowly.
                  </p>
                </div>

                <div style={{ background: "#fff", borderRadius: 8, padding: 16 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: NAVY }}>2. Monitor ketones every 1-2 hours</p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#4a5568", lineHeight: 1.7 }}>
                    Use blood ketone meter. If ketones are rising despite insulin corrections, this is a
                    dangerous trajectory. Do not wait for them to reach 3.0.
                  </p>
                </div>

                <div style={{ background: "#fff", borderRadius: 8, padding: 16, border: "2px solid #dc2626" }}>
                  <p style={{ margin: 0, fontWeight: 700, color: "#dc2626", fontSize: 15 }}>
                    3. Ketones rising + vomiting = EMERGENCY
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#1e293b", lineHeight: 1.7 }}>
                    If ketones are above 1.5 mmol/L AND the person cannot keep fluids down, <strong>go to
                    hospital immediately</strong>. They need IV fluids and IV insulin. Do not wait.
                    This combination is the classic presentation of evolving DKA.
                  </p>
                </div>

                <div style={{ background: "#fff", borderRadius: 8, padding: 16 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: NAVY }}>4. If keeping some fluids down</p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#4a5568", lineHeight: 1.7 }}>
                    Continue small sips (5 ml every 5 minutes = 60 ml/hour). Use a syringe or teaspoon for accuracy.
                    If BG is low, use sugary fluids (flat cola, juice). If BG is high, use sugar-free fluids and
                    give correction insulin. Continue basal insulin — <strong>never stop basal</strong>.
                  </p>
                </div>

                <div style={{ background: "#fff", borderRadius: 8, padding: 16 }}>
                  <p style={{ margin: 0, fontWeight: 700, color: NAVY }}>5. Anti-emetics</p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#4a5568", lineHeight: 1.7 }}>
                    Ask your doctor about ondansetron (Zofran) — available as a dissolving tablet that can be
                    absorbed even while vomiting. Having a prescription ready before illness strikes is wise planning.
                  </p>
                </div>
              </div>

              <div style={{ background: "#fef2f2", borderRadius: 8, padding: 16, marginTop: 16, fontSize: 13, color: "#991b1b" }}>
                <strong>Remember:</strong> The combination of vomiting + rising ketones + inability to keep fluids
                down is a medical emergency in T1D. Hospital is not "overreacting" — it is the correct response.
                DKA can develop within hours and is life-threatening.
              </div>
            </div>
          )}
        </div>

        {/* ─── 6. When to Go to Hospital ──────────── */}
        <div style={emergencyBox}>
          <button
            onClick={() => toggle("hospital")}
            style={{
              all: "unset", cursor: "pointer", width: "100%", display: "flex",
              justifyContent: "space-between", alignItems: "center",
            }}
          >
            <h2 style={{ ...heading2, color: "#dc2626", marginBottom: 0 }}>
              When to Go to Hospital — Red-Flag Checklist
            </h2>
            <span style={{ color: "#dc2626", fontSize: 22, fontWeight: 700 }}>{open.hospital ? "−" : "+"}</span>
          </button>
          {open.hospital && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 14, color: "#991b1b", marginBottom: 12, fontWeight: 600 }}>
                Go to A&amp;E / Emergency Room if ANY of the following are present:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {RED_FLAGS.map((flag, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, color: "#1e293b" }}>
                    <span style={{ color: "#dc2626", fontWeight: 700, fontSize: 16, lineHeight: 1.2, flexShrink: 0 }}>!</span>
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "#fff", borderRadius: 8, padding: 16, marginTop: 16, fontSize: 13, color: "#1e293b" }}>
                <strong>What to bring to hospital:</strong>
                <ul style={{ margin: "8px 0 0", paddingLeft: 20, lineHeight: 2 }}>
                  <li>Insulin pens/pump supplies</li>
                  <li>Blood glucose meter + strips</li>
                  <li>Ketone meter + strips</li>
                  <li>List of current insulin doses and most recent readings</li>
                  <li>This app — show the sick day log to the medical team</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* ─── 7. Emergency Contacts ──────────────── */}
        <Section id="contacts" title="Emergency Contacts">
          <p style={{ color: "#4a5568", fontSize: 14, marginBottom: 12 }}>
            Fill these in <strong>before</strong> you get sick. Having the numbers ready saves critical time during illness.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {contacts.map((c, i) => (
              <div key={i} style={{ background: "#f8fafc", borderRadius: 8, padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <label style={labelStyle}>
                  Contact
                  <input type="text" value={c.name} onChange={e => updateContact(i, "name", e.target.value)} style={inputStyle} />
                </label>
                <label style={labelStyle}>
                  Phone number
                  <input type="tel" value={c.phone} onChange={e => updateContact(i, "phone", e.target.value)} style={inputStyle} placeholder="Enter number" />
                </label>
                <label style={labelStyle}>
                  Notes
                  <input type="text" value={c.notes} onChange={e => updateContact(i, "notes", e.target.value)} style={inputStyle} />
                </label>
              </div>
            ))}
          </div>
          <button
            onClick={() => setContacts(prev => [...prev, { name: "", phone: "", notes: "" }])}
            style={{
              marginTop: 12, padding: "8px 16px", borderRadius: 8, border: `1px dashed ${TEAL}`,
              background: "transparent", color: TEAL, fontWeight: 600, fontSize: 13, cursor: "pointer",
            }}
          >
            + Add another contact
          </button>
        </Section>

        {/* ─── Disclaimer ─────────────────────────── */}
        <div style={{ background: "#f8fafc", borderRadius: 12, padding: 20, marginTop: 8, border: "1px solid #e2e8f0" }}>
          <p style={{ margin: 0, fontSize: 13, color: "#64748b", lineHeight: 1.7 }}>
            <strong>Disclaimer:</strong> These sick day rules are general guidelines based on established
            diabetes education resources. They do not replace individual medical advice from your
            diabetes care team. <strong>Always contact your diabetes nurse specialist or doctor</strong> if
            you are unsure how to manage illness. If in doubt, seek emergency medical attention.
            GluMira is an educational tool, not a substitute for professional medical judgement.
          </p>
        </div>
      </div>
    </div>
  );
}
