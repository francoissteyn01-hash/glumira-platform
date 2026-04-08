/**
 * GluMira™ V7 — Block 68: Post-Surgical Recovery Module
 * Post-surgical glucose pattern management for insulin-dependent patients.
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

const selectStyle: React.CSSProperties = { ...inputStyle, appearance: "auto" as const };

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

const alertCard: React.CSSProperties = { ...card, borderLeft: "4px solid var(--accent-teal)" };
const warningCard: React.CSSProperties = { ...card, borderLeft: "4px solid #f59e0b" };
const dangerCard: React.CSSProperties = { ...card, borderLeft: "4px solid #ef4444" };

/* ─── Constants ──────────────────────────────────────────────────────────── */

const SURGERY_TYPES = [
  "General",
  "Dental",
  "Orthopaedic",
  "Abdominal",
  "Cardiac",
  "Other",
] as const;

const ANAESTHESIA_TYPES = [
  "General",
  "Local",
  "Regional",
  "Sedation",
] as const;

const STEROID_TYPES = [
  "Dexamethasone",
  "Prednisolone",
  "Methylprednisolone",
  "Hydrocortisone",
  "Other",
] as const;

interface RecoveryPhase {
  id: number;
  label: string;
  range: string;
  description: string;
  color: string;
}

const RECOVERY_PHASES: RecoveryPhase[] = [
  {
    id: 1,
    label: "Immediate",
    range: "0-24 hours",
    description: "Monitor glucose every 1-2 hours. Insulin sensitivity may change rapidly due to stress response, fasting, and anaesthesia effects.",
    color: "#ef4444",
  },
  {
    id: 2,
    label: "Early Recovery",
    range: "1-7 days",
    description: "Stress hormones remain elevated. May need 20-50% more insulin. Pain medications can also affect appetite and glucose.",
    color: "#f59e0b",
  },
  {
    id: 3,
    label: "Recovery",
    range: "1-4 weeks",
    description: "Gradually returning to baseline. Reduce insulin increases slowly as activity and eating patterns normalise.",
    color: "var(--accent-teal)",
  },
  {
    id: 4,
    label: "Returned",
    range: "Over 4 weeks",
    description: "Resume normal management. Watch for lasting sensitivity changes, especially if mobility or activity level has changed.",
    color: "#22c55e",
  },
];

interface MedicationFlag {
  name: string;
  effect: string;
  direction: "up" | "down" | "variable";
}

const MEDICATION_FLAGS: MedicationFlag[] = [
  { name: "Corticosteroids (prednisolone, dexamethasone)", effect: "Significant glucose elevation, typically 6-12 hours post-dose", direction: "up" },
  { name: "Opioid pain relief (morphine, codeine, tramadol)", effect: "Reduced appetite may lower glucose; constipation can delay absorption", direction: "variable" },
  { name: "NSAIDs (ibuprofen, diclofenac)", effect: "Minimal direct glucose impact; watch for kidney function in diabetes", direction: "variable" },
  { name: "Antibiotics (general)", effect: "Infection treatment may improve glucose as infection resolves", direction: "variable" },
  { name: "Antiemetics (ondansetron, metoclopramide)", effect: "Improved eating tolerance helps stabilise glucose", direction: "variable" },
  { name: "Beta-blockers", effect: "Can mask hypoglycaemia symptoms (tremor, fast heart rate)", direction: "variable" },
  { name: "Dextrose-containing IV fluids", effect: "Direct glucose source; monitor closely when IV is running", direction: "up" },
];

/* ─── Main component ─────────────────────────────────────────────────────── */

export default function PostSurgicalModule() {
  const { session } = useAuth();
  const { units } = useGlucoseUnits();

  // Surgery details form
  const [surgeryType, setSurgeryType] = useState<string>("General");
  const [surgeryDate, setSurgeryDate] = useState("");
  const [anaesthesiaType, setAnaesthesiaType] = useState<string>("General");
  const [fastingHours, setFastingHours] = useState("");
  const [steroidGiven, setSteroidGiven] = useState(false);
  const [steroidType, setSteroidType] = useState<string>("Dexamethasone");
  const [currentMedications, setCurrentMedications] = useState("");

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Derived: recovery phase
  const daysSinceSurgery = surgeryDate
    ? Math.max(0, (Date.now() - new Date(surgeryDate).getTime()) / (24 * 60 * 60 * 1000))
    : -1;

  const currentPhaseId =
    daysSinceSurgery < 0 ? 0 :
    daysSinceSurgery <= 1 ? 1 :
    daysSinceSurgery <= 7 ? 2 :
    daysSinceSurgery <= 28 ? 3 : 4;

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
      await apiFetch("/trpc/postSurgical.create", {
        method: "POST",
        body: JSON.stringify({
          surgeryType,
          surgeryDate,
          anaesthesiaType,
          fastingHours: parseFloat(fastingHours) || 0,
          steroidGiven,
          steroidType: steroidGiven ? steroidType : undefined,
          currentMedications,
        }),
      });
      setSaveMsg("Saved successfully");
    } catch (err: any) {
      setSaveMsg(err?.message ?? "Save failed");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 3000);
    }
  }, [saving, surgeryType, surgeryDate, anaesthesiaType, fastingHours, steroidGiven, steroidType, currentMedications]);

  useKeyboardSave(handleSave);

  return (
    <div style={page}>
      <div style={container}>
        {/* Header */}
        <header style={{ marginBottom: 24 }}>
          <Link to="/" style={{ fontSize: "0.85rem", color: "var(--text-secondary)", textDecoration: "none" }}>
            &larr; Back
          </Link>
          <h1 style={{ ...heading, fontSize: "1.6rem", marginTop: 8 }}>Post-Surgical Recovery</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Manage glucose patterns during surgical recovery.
          </p>
        </header>

        {/* Surgery details form */}
        <div style={card}>
          <h2 style={subheading}>Surgery Details</h2>
          <div style={row}>
            <div>
              <label style={label}>Surgery type</label>
              <select style={selectStyle} value={surgeryType} onChange={(e) => setSurgeryType(e.target.value)}>
                {SURGERY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Surgery date</label>
              <input style={inputStyle} type="date" value={surgeryDate} onChange={(e) => setSurgeryDate(e.target.value)} />
            </div>
          </div>
          <div style={row}>
            <div>
              <label style={label}>Anaesthesia type</label>
              <select style={selectStyle} value={anaesthesiaType} onChange={(e) => setAnaesthesiaType(e.target.value)}>
                {ANAESTHESIA_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={label}>Fasting duration (hours)</label>
              <input style={inputStyle} type="number" step="0.5" placeholder="8" value={fastingHours}
                onChange={(e) => setFastingHours(e.target.value)} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ ...label, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={steroidGiven}
                onChange={(e) => setSteroidGiven(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: "var(--accent-teal)" }}
              />
              Steroid given (peri-operative)
            </label>
          </div>
          {steroidGiven && (
            <div style={{ marginBottom: 12 }}>
              <label style={label}>Steroid type</label>
              <select style={selectStyle} value={steroidType} onChange={(e) => setSteroidType(e.target.value)}>
                {STEROID_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          )}
          <div>
            <label style={label}>Current medications that may affect glucose</label>
            <textarea
              style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
              placeholder="List any medications currently being taken..."
              value={currentMedications}
              onChange={(e) => setCurrentMedications(e.target.value)}
            />
          </div>
        </div>

        {/* Recovery phase indicator */}
        <div style={card}>
          <h2 style={subheading}>Recovery Phase</h2>
          {daysSinceSurgery >= 0 && (
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: 12 }}>
              <span style={mono}>{Math.floor(daysSinceSurgery)}</span> days since surgery
            </p>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {RECOVERY_PHASES.map((phase) => {
              const isActive = phase.id === currentPhaseId;
              return (
                <div
                  key={phase.id}
                  style={{
                    padding: 14,
                    borderRadius: 8,
                    border: isActive ? `2px solid ${phase.color}` : "1px solid var(--border-light)",
                    background: isActive ? `${phase.color}10` : "transparent",
                    opacity: isActive ? 1 : 0.6,
                    transition: "all 0.3s ease",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: "0.92rem" }}>
                      Phase {phase.id}: {phase.label}
                    </span>
                    <span style={{ ...mono, fontSize: "0.78rem", color: phase.color }}>{phase.range}</span>
                  </div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: 0 }}>
                    {phase.description}
                  </p>
                </div>
              );
            })}
          </div>
          {daysSinceSurgery < 0 && (
            <p style={{ fontSize: "0.82rem", color: "var(--text-faint)", marginTop: 12 }}>
              Enter a surgery date above to see your current recovery phase.
            </p>
          )}
        </div>

        {/* Steroid impact card */}
        {steroidGiven && (
          <div style={dangerCard}>
            <h2 style={subheading}>Steroid Impact on Glucose</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "0.88rem" }}>
              <div style={{ padding: 12, background: "rgba(239,68,68,0.06)", borderRadius: 8 }}>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>Timing of glucose rise</p>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>
                  Steroids typically raise glucose 6-12 hours after dose. {steroidType} may cause
                  particularly pronounced rises in the afternoon and evening.
                </p>
              </div>
              <div style={{ padding: 12, background: "rgba(239,68,68,0.06)", borderRadius: 8 }}>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>Insulin adjustment</p>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>
                  May need 50-100% increase in insulin for meals following steroid doses. Bolus
                  insulin adjustments are usually more effective than basal increases for steroid-induced rises.
                </p>
              </div>
              <div style={{ padding: 12, background: "rgba(239,68,68,0.06)", borderRadius: 8 }}>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>Tapering</p>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", margin: 0 }}>
                  Effect diminishes as steroid is tapered. Reduce insulin increases proportionally
                  to steroid dose reductions to avoid hypoglycaemia.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Medication interaction flags */}
        <div style={card}>
          <h2 style={subheading}>Medication Interaction Flags</h2>
          <p style={{ ...label, marginBottom: 12 }}>Common post-surgical medications and their glucose impact.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {MEDICATION_FLAGS.map((med, i) => (
              <div
                key={i}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  border: "1px solid var(--border-light)",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <span style={{
                  flexShrink: 0,
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                  color: "#fff",
                  background:
                    med.direction === "up" ? "#ef4444" :
                    med.direction === "down" ? "#3b82f6" : "#9ca3af",
                }}>
                  {med.direction === "up" ? "\u2191" : med.direction === "down" ? "\u2193" : "\u2194"}
                </span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.85rem", marginBottom: 2 }}>{med.name}</p>
                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0 }}>{med.effect}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fasting protocol card */}
        <div style={alertCard}>
          <h2 style={subheading}>Fasting Protocol — Insulin-Dependent Patients</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: "0.88rem" }}>
            <div style={{ padding: 12, background: "rgba(42,181,193,0.06)", borderRadius: 8 }}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Pre-surgical fasting</p>
              <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                <li>Continue basal insulin at usual dose (or reduce by 20% if using NPH)</li>
                <li>Omit bolus insulin if not eating</li>
                <li>Monitor glucose every 2 hours during fast</li>
                <li>If glucose drops below {glucoseDisplay(5.0)}, treat with clear fluids containing glucose if permitted, or IV dextrose</li>
                <li>Schedule surgery for early morning when possible to minimise fasting duration</li>
              </ul>
            </div>
            <div style={{ padding: 12, background: "rgba(42,181,193,0.06)", borderRadius: 8 }}>
              <p style={{ fontWeight: 600, marginBottom: 4 }}>Post-surgical fasting</p>
              <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                <li>Continue basal insulin; adjust based on glucose readings</li>
                <li>Begin bolus insulin when oral intake resumes</li>
                <li>Start with reduced bolus doses (50-75% of usual) until eating normally</li>
                <li>Monitor glucose every 1-2 hours until stable eating pattern established</li>
                <li>IV insulin infusion may be needed if glucose remains above {glucoseDisplay(12.0)}</li>
              </ul>
            </div>
            {fastingHours && parseFloat(fastingHours) > 12 && (
              <div style={{ padding: 10, background: "rgba(245,158,11,0.1)", borderRadius: 8, fontSize: "0.82rem", color: "#d97706", fontWeight: 600 }}>
                Extended fasting duration ({fastingHours} hours) noted. Increased risk of hypoglycaemia — basal insulin reduction may be needed.
              </div>
            )}
          </div>
        </div>

        {/* Glucose target adjustment card */}
        <div style={card}>
          <h2 style={subheading}>Post-Surgical Glucose Targets</h2>
          <div style={{ padding: 16, background: "rgba(42,181,193,0.06)", borderRadius: 8, textAlign: "center" }}>
            <p style={{ ...label, marginBottom: 8 }}>Acute recovery target range (relaxed)</p>
            <p style={{ ...mono, fontSize: "1.6rem", color: "var(--accent-teal)", fontWeight: 700, marginBottom: 4 }}>
              {glucoseDisplay(6.0)} — {glucoseDisplay(12.0)}
            </p>
            <p style={{ fontSize: "0.82rem", color: "var(--text-faint)" }}>
              Slightly wider than usual targets to prioritise safety during recovery
            </p>
          </div>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ padding: 12, border: "1px solid var(--border-light)", borderRadius: 8, textAlign: "center" }}>
              <p style={label}>Hypo threshold</p>
              <p style={{ ...mono, fontSize: "1.1rem", color: "#ef4444", fontWeight: 600 }}>
                {"<"} {glucoseDisplay(4.0)}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-faint)", marginTop: 4 }}>Treat immediately</p>
            </div>
            <div style={{ padding: 12, border: "1px solid var(--border-light)", borderRadius: 8, textAlign: "center" }}>
              <p style={label}>Urgent high</p>
              <p style={{ ...mono, fontSize: "1.1rem", color: "#ef4444", fontWeight: 600 }}>
                {">"} {glucoseDisplay(15.0)}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-faint)", marginTop: 4 }}>Check ketones, correct</p>
            </div>
          </div>
          <p style={{ fontSize: "0.78rem", color: "var(--text-faint)", marginTop: 12 }}>
            Return to pre-surgical targets once eating normally, pain is controlled, and steroids are discontinued.
          </p>
        </div>

        {/* Save button */}
        <button style={{ ...btnPrimary, marginBottom: 16 }} onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Surgery Details"}
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
