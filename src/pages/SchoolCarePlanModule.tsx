/**
 * GluMira™ V7 — School Care Plan Module
 * Wired to: client/src/lib/school-care-plan.ts → generateSchoolCarePlan()
 * Wired to: client/src/lib/meal-regimes.ts → getAllMealRegimes()
 */
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { generateSchoolCarePlan, validateSchoolCarePlanInput, type SchoolCarePlanInput, type EmergencyContact } from "@/lib/school-care-plan";
import { getAllMealRegimes } from "@/lib/meal-regimes";

const REGIMES = getAllMealRegimes();

const EMPTY_CONTACT: EmergencyContact = { name: "", relationship: "", phone: "", altPhone: "" };

export default function SchoolCarePlanModule() {
  const [form, setForm] = useState<Partial<SchoolCarePlanInput>>({
    patientFirstName: "",
    patientLastName: "",
    dateOfBirth: "",
    diabetesType: "type1",
    schoolName: "",
    teacherName: "",
    grade: "",
    academicYear: "2026",
    insulinType: "Rapid-acting (NovoRapid)",
    insulinConcentration: "U-100",
    diaHours: 4,
    deliveryMethod: "pen",
    targetGlucoseMin: 70,
    targetGlucoseMax: 180,
    hypoThresholdMgdl: 70,
    hyperThresholdMgdl: 250,
    mealRegimeId: "full-carb-count",
    emergencyContacts: [{ ...EMPTY_CONTACT }],
    clinicianName: "",
    clinicianPhone: "",
    clinicianEmail: "",
    planDate: new Date().toISOString().slice(0, 10),
    reviewDate: "",
    additionalNotes: "",
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const update = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));

  const updateContact = (idx: number, key: keyof EmergencyContact, value: string) => {
    const contacts = [...(form.emergencyContacts ?? [])];
    contacts[idx] = { ...contacts[idx], [key]: value };
    setForm(f => ({ ...f, emergencyContacts: contacts }));
  };

  const addContact = () => {
    if ((form.emergencyContacts?.length ?? 0) < 4) {
      setForm(f => ({ ...f, emergencyContacts: [...(f.emergencyContacts ?? []), { ...EMPTY_CONTACT }] }));
    }
  };

  const removeContact = (idx: number) => {
    const contacts = (form.emergencyContacts ?? []).filter((_, i) => i !== idx);
    setForm(f => ({ ...f, emergencyContacts: contacts }));
  };

  const handleGenerate = () => {
    const validationErrors = validateSchoolCarePlanInput(form);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);
    try {
      const result = generateSchoolCarePlan(form as SchoolCarePlanInput);
      setGeneratedHtml(result.html);
    } catch (err: any) {
      setErrors([err.message ?? "Generation failed"]);
    }
  };

  const handlePrint = () => {
    if (!previewRef.current?.contentWindow) return;
    previewRef.current.contentWindow.print();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa", padding: 24 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Link to="/education" style={{ color: "#2ab5c1", fontSize: 14, textDecoration: "none" }}>← Back to Education</Link>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0 24px" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🏫</div>
          <div>
            <h1 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: "#1a2a5e", fontSize: 28 }}>School Care Plan Generator</h1>
            <p style={{ margin: 0, color: "#718096", fontSize: 14 }}>Generate a printable diabetes care plan for school staff</p>
          </div>
        </div>

        {errors.length > 0 && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <h4 style={{ color: "#dc2626", margin: "0 0 8px", fontSize: 14 }}>Please fix the following:</h4>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#991b1b" }}>
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: generatedHtml ? "1fr 1fr" : "1fr", gap: 20 }}>
          {/* Form Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Patient Info */}
            <div style={cardStyle}>
              <h3 style={cardTitle}>Child Information</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={labelStyle}>First Name<input value={form.patientFirstName} onChange={e => update("patientFirstName", e.target.value)} style={inputStyle} /></label>
                <label style={labelStyle}>Last Name<input value={form.patientLastName} onChange={e => update("patientLastName", e.target.value)} style={inputStyle} /></label>
                <label style={labelStyle}>Date of Birth<input type="date" value={form.dateOfBirth} onChange={e => update("dateOfBirth", e.target.value)} style={inputStyle} /></label>
                <label style={labelStyle}>Diabetes Type
                  <select value={form.diabetesType} onChange={e => update("diabetesType", e.target.value)} style={inputStyle}>
                    <option value="type1">Type 1</option><option value="type2">Type 2</option><option value="other">Other</option>
                  </select>
                </label>
                <label style={labelStyle}>School Name<input value={form.schoolName} onChange={e => update("schoolName", e.target.value)} style={inputStyle} /></label>
                <label style={labelStyle}>Teacher Name<input value={form.teacherName} onChange={e => update("teacherName", e.target.value)} style={inputStyle} /></label>
                <label style={labelStyle}>Grade / Class<input value={form.grade} onChange={e => update("grade", e.target.value)} style={inputStyle} /></label>
                <label style={labelStyle}>Academic Year<input value={form.academicYear} onChange={e => update("academicYear", e.target.value)} style={inputStyle} /></label>
              </div>
            </div>

            {/* Insulin & Targets */}
            <div style={cardStyle}>
              <h3 style={cardTitle}>Insulin & Glucose Targets</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={labelStyle}>Insulin Type<input value={form.insulinType} onChange={e => update("insulinType", e.target.value)} style={inputStyle} /></label>
                <label style={labelStyle}>Concentration
                  <select value={form.insulinConcentration} onChange={e => update("insulinConcentration", e.target.value)} style={inputStyle}>
                    <option value="U-100">U-100</option><option value="U-200">U-200</option><option value="U-500">U-500</option>
                  </select>
                </label>
                <label style={labelStyle}>Delivery Method
                  <select value={form.deliveryMethod} onChange={e => update("deliveryMethod", e.target.value)} style={inputStyle}>
                    <option value="pen">Insulin Pen</option><option value="pump">Insulin Pump</option><option value="syringe">Syringe</option>
                  </select>
                </label>
                <label style={labelStyle}>Duration of Action (hours)<input type="number" min={2} max={8} value={form.diaHours} onChange={e => update("diaHours", parseInt(e.target.value) || 4)} style={inputStyle} /></label>
                <label style={labelStyle}>Target Low (mg/dL)<input type="number" value={form.targetGlucoseMin} onChange={e => update("targetGlucoseMin", parseInt(e.target.value) || 70)} style={inputStyle} /></label>
                <label style={labelStyle}>Target High (mg/dL)<input type="number" value={form.targetGlucoseMax} onChange={e => update("targetGlucoseMax", parseInt(e.target.value) || 180)} style={inputStyle} /></label>
                <label style={labelStyle}>Hypo Threshold (mg/dL)<input type="number" value={form.hypoThresholdMgdl} onChange={e => update("hypoThresholdMgdl", parseInt(e.target.value) || 70)} style={inputStyle} /></label>
                <label style={labelStyle}>Hyper Threshold (mg/dL)<input type="number" value={form.hyperThresholdMgdl} onChange={e => update("hyperThresholdMgdl", parseInt(e.target.value) || 250)} style={inputStyle} /></label>
              </div>
            </div>

            {/* Meal Regime */}
            <div style={cardStyle}>
              <h3 style={cardTitle}>Meal Regime</h3>
              <select value={form.mealRegimeId} onChange={e => update("mealRegimeId", e.target.value)} style={{ ...inputStyle, width: "100%" }}>
                {REGIMES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            {/* Emergency Contacts */}
            <div style={cardStyle}>
              <h3 style={cardTitle}>Emergency Contacts</h3>
              {(form.emergencyContacts ?? []).map((c, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, marginBottom: 8 }}>
                  <input placeholder="Name" value={c.name} onChange={e => updateContact(i, "name", e.target.value)} style={inputStyle} />
                  <input placeholder="Relationship" value={c.relationship} onChange={e => updateContact(i, "relationship", e.target.value)} style={inputStyle} />
                  <input placeholder="Phone" value={c.phone} onChange={e => updateContact(i, "phone", e.target.value)} style={inputStyle} />
                  {i > 0 && <button onClick={() => removeContact(i)} style={{ border: "none", background: "#fef2f2", color: "#dc2626", borderRadius: 8, cursor: "pointer", padding: "0 8px" }}>✕</button>}
                </div>
              ))}
              {(form.emergencyContacts?.length ?? 0) < 4 && (
                <button onClick={addContact} style={{ fontSize: 13, color: "#2ab5c1", background: "none", border: "none", cursor: "pointer" }}>+ Add Contact</button>
              )}
            </div>

            {/* Clinician */}
            <div style={cardStyle}>
              <h3 style={cardTitle}>Clinician Details</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={labelStyle}>Name<input value={form.clinicianName} onChange={e => update("clinicianName", e.target.value)} style={inputStyle} /></label>
                <label style={labelStyle}>Phone<input value={form.clinicianPhone} onChange={e => update("clinicianPhone", e.target.value)} style={inputStyle} /></label>
                <label style={labelStyle}>Email<input value={form.clinicianEmail} onChange={e => update("clinicianEmail", e.target.value)} style={inputStyle} /></label>
                <label style={labelStyle}>Plan Date<input type="date" value={form.planDate} onChange={e => update("planDate", e.target.value)} style={inputStyle} /></label>
                <label style={labelStyle}>Review Date<input type="date" value={form.reviewDate} onChange={e => update("reviewDate", e.target.value)} style={inputStyle} /></label>
              </div>
              <label style={{ ...labelStyle, marginTop: 12 }}>Additional Notes
                <textarea rows={3} value={form.additionalNotes} onChange={e => update("additionalNotes", e.target.value)} style={{ ...inputStyle, resize: "vertical" }} />
              </label>
            </div>

            <button onClick={handleGenerate} style={btnStyle}>Generate Care Plan</button>
          </div>

          {/* Preview Column */}
          {generatedHtml && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ color: "#1a2a5e", fontSize: 16, margin: 0 }}>Document Preview</h3>
                <button onClick={handlePrint} style={{ ...btnStyle, marginTop: 0, padding: "8px 20px", fontSize: 13 }}>Print / Save PDF</button>
              </div>
              <iframe
                ref={previewRef}
                srcDoc={generatedHtml}
                style={{ width: "100%", height: "calc(100vh - 200px)", border: "1px solid #e2e8f0", borderRadius: 12, background: "#fff" }}
                title="School Care Plan Preview"
              />
            </div>
          )}
        </div>

        <footer style={{ textAlign: "center", fontSize: 11, color: "#718096", marginTop: 32, paddingTop: 16, borderTop: "1px solid #e2e8f0" }}>
          <p>GluMira™ is an educational platform. Not a medical device. Always follow your diabetes care team's guidance.</p>
        </footer>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4, fontSize: 13, fontWeight: 500, color: "#4a5568" };
const inputStyle: React.CSSProperties = { padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 };
const cardStyle: React.CSSProperties = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20 };
const cardTitle: React.CSSProperties = { fontSize: 16, color: "#1a2a5e", marginBottom: 12, fontFamily: "'Playfair Display', serif" };
const btnStyle: React.CSSProperties = { marginTop: 20, padding: "10px 28px", background: "#2ab5c1", color: "#fff", border: "none", borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: "pointer" };
