/**
 * GluMira™ V7 — Block 47: Organisation Portal
 * Multi-patient school and organisation dashboard.
 * Scandinavian Minimalist design (#f8f9fa bg, #1a2a5e navy, #2ab5c1 teal).
 */

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DISCLAIMER } from "@/lib/constants";

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface OrgInfo {
  name: string;
  type: "School" | "Clinic" | "Care Home";
  totalPatients: number;
}

type GlucoseStatus = "green" | "yellow" | "red";

interface OrgPatient {
  id: string;
  name: string;
  glucoseStatus: GlucoseStatus;
  lastReadingTime: string;
  activeAlerts: number;
}

interface OrgAlert {
  id: string;
  patientId: string;
  patientName: string;
  message: string;
  severity: "low" | "medium" | "high";
  timestamp: string;
}

/* ─── Styles ──────────────────────────────────────────────────────────────── */

const layout: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--bg-primary)",
  maxWidth: 960,
  margin: "0 auto",
  padding: "clamp(16px, 4vw, 32px)",
};

const card: React.CSSProperties = {
  background: "var(--bg-card)",
  borderRadius: 12,
  border: "1px solid var(--border-light)",
  padding: 20,
  marginBottom: 16,
};

const heading: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  color: "#1a2a5e",
  margin: 0,
};

const body: React.CSSProperties = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
  color: "var(--text-primary)",
};

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  color: "var(--text-primary)",
};

const labelStyle: React.CSSProperties = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
  color: "var(--text-secondary)",
  fontSize: 13,
  marginBottom: 4,
};

const btnPrimary: React.CSSProperties = {
  ...body,
  padding: "10px 22px",
  borderRadius: 8,
  background: "#1a2a5e",
  color: "#fff",
  fontWeight: 600,
  fontSize: 14,
  border: "none",
  cursor: "pointer",
};

const btnOutline: React.CSSProperties = {
  ...body,
  padding: "8px 18px",
  borderRadius: 8,
  background: "transparent",
  color: "#1a2a5e",
  fontWeight: 600,
  fontSize: 13,
  border: "1px solid var(--border-light)",
  cursor: "pointer",
};

const statusDot = (status: GlucoseStatus): React.CSSProperties => ({
  display: "inline-block",
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: status === "green" ? "#22c55e" : status === "yellow" ? "#eab308" : "#ef4444",
  marginRight: 6,
  verticalAlign: "middle",
});

const severityBadge = (severity: string): React.CSSProperties => ({
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 6,
  fontSize: 11,
  fontFamily: "'DM Sans', system-ui, sans-serif",
  fontWeight: 600,
  background:
    severity === "high" ? "#fee2e2" : severity === "medium" ? "#fef3c7" : "#ecfdf5",
  color:
    severity === "high" ? "#991b1b" : severity === "medium" ? "#92400e" : "#065f46",
});

/* ─── Mock data ───────────────────────────────────────────────────────────── */

const MOCK_ORG: OrgInfo = {
  name: "Westfield Primary School",
  type: "School",
  totalPatients: 8,
};

const MOCK_PATIENTS: OrgPatient[] = [
  { id: "P-2001", name: "Emma T.", glucoseStatus: "green", lastReadingTime: new Date(Date.now() - 300_000).toISOString(), activeAlerts: 0 },
  { id: "P-2002", name: "Liam K.", glucoseStatus: "yellow", lastReadingTime: new Date(Date.now() - 600_000).toISOString(), activeAlerts: 1 },
  { id: "P-2003", name: "Sophia R.", glucoseStatus: "green", lastReadingTime: new Date(Date.now() - 900_000).toISOString(), activeAlerts: 0 },
  { id: "P-2004", name: "Noah B.", glucoseStatus: "red", lastReadingTime: new Date(Date.now() - 120_000).toISOString(), activeAlerts: 2 },
  { id: "P-2005", name: "Olivia M.", glucoseStatus: "green", lastReadingTime: new Date(Date.now() - 1_800_000).toISOString(), activeAlerts: 0 },
  { id: "P-2006", name: "James W.", glucoseStatus: "yellow", lastReadingTime: new Date(Date.now() - 2_400_000).toISOString(), activeAlerts: 1 },
  { id: "P-2007", name: "Isla C.", glucoseStatus: "green", lastReadingTime: new Date(Date.now() - 3_600_000).toISOString(), activeAlerts: 0 },
  { id: "P-2008", name: "Harry D.", glucoseStatus: "green", lastReadingTime: new Date(Date.now() - 7_200_000).toISOString(), activeAlerts: 0 },
];

const MOCK_ALERTS: OrgAlert[] = [
  { id: "oa1", patientId: "P-2004", patientName: "Noah B.", message: "Low glucose — 3.0 mmol/L", severity: "high", timestamp: new Date(Date.now() - 120_000).toISOString() },
  { id: "oa2", patientId: "P-2004", patientName: "Noah B.", message: "Rapid glucose drop detected", severity: "high", timestamp: new Date(Date.now() - 180_000).toISOString() },
  { id: "oa3", patientId: "P-2002", patientName: "Liam K.", message: "Glucose trending high — 14.2 mmol/L", severity: "medium", timestamp: new Date(Date.now() - 600_000).toISOString() },
  { id: "oa4", patientId: "P-2006", patientName: "James W.", message: "Missed bolus suspected — elevated post-lunch", severity: "medium", timestamp: new Date(Date.now() - 2_400_000).toISOString() },
  { id: "oa5", patientId: "P-2008", patientName: "Harry D.", message: "Sensor signal lost for 30 minutes", severity: "low", timestamp: new Date(Date.now() - 7_200_000).toISOString() },
];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function OrganisationPortal() {
  const { user } = useAuth();
  const [patients, setPatients] = useState<OrgPatient[]>(MOCK_PATIENTS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatientId, setNewPatientId] = useState("");
  const [generatingReports, setGeneratingReports] = useState(false);
  const [generatingCarePlans, setGeneratingCarePlans] = useState(false);

  const handleAddPatient = () => {
    if (!newPatientId.trim()) return;
    const newPatient: OrgPatient = {
      id: newPatientId.trim(),
      name: `Patient ${newPatientId.trim()}`,
      glucoseStatus: "green",
      lastReadingTime: new Date().toISOString(),
      activeAlerts: 0,
    };
    setPatients((prev) => [...prev, newPatient]);
    setNewPatientId("");
    setShowAddModal(false);
  };

  const handleRemovePatient = (id: string) => {
    setPatients((prev) => prev.filter((p) => p.id !== id));
  };

  const handleBulkReports = async () => {
    setGeneratingReports(true);
    await new Promise((r) => setTimeout(r, 1500));
    setGeneratingReports(false);
  };

  const handleBulkCarePlans = async () => {
    setGeneratingCarePlans(true);
    await new Promise((r) => setTimeout(r, 1500));
    setGeneratingCarePlans(false);
  };

  /* ─── Render ──────────────────────────────────────────────────────────── */
  return (
    <div style={layout}>
      {/* ── Header ── */}
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ ...heading, fontSize: 28 }}>Organisation Dashboard</h1>
        <p style={{ ...body, color: "var(--text-secondary)", marginTop: 4 }}>
          Multi-patient management for schools and care facilities
        </p>
      </header>

      {/* ── Organisation Info Card ── */}
      <div style={card}>
        <h2 style={{ ...heading, fontSize: 20, marginBottom: 12 }}>Organisation Details</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div>
            <p style={labelStyle}>Name</p>
            <p style={{ ...mono, fontSize: 15, margin: 0 }}>{MOCK_ORG.name}</p>
          </div>
          <div>
            <p style={labelStyle}>Type</p>
            <p style={{ ...mono, fontSize: 15, margin: 0 }}>{MOCK_ORG.type}</p>
          </div>
          <div>
            <p style={labelStyle}>Total Patients</p>
            <p style={{ ...mono, fontSize: 22, fontWeight: 700, margin: 0, color: "var(--accent-teal)" }}>
              {patients.length}
            </p>
          </div>
        </div>
      </div>

      {/* ── Patient Grid ── */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h2 style={{ ...heading, fontSize: 20 }}>Patients</h2>
          <button onClick={() => setShowAddModal(true)} style={btnOutline}>
            + Add Patient
          </button>
        </div>

        {/* Add patient inline form */}
        {showAddModal && (
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              marginBottom: 16,
              padding: 14,
              borderRadius: 8,
              border: "1px solid var(--accent-teal)",
              background: "rgba(42,181,193,0.04)",
            }}
          >
            <input
              type="text"
              placeholder="Enter Patient ID…"
              value={newPatientId}
              onChange={(e) => setNewPatientId(e.target.value)}
              style={{
                ...body,
                flex: 1,
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid var(--border-light)",
                background: "var(--bg-card)",
                outline: "none",
              }}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddPatient(); }}
            />
            <button onClick={handleAddPatient} style={{ ...btnPrimary, padding: "8px 16px", fontSize: 13 }}>
              Add
            </button>
            <button
              onClick={() => { setShowAddModal(false); setNewPatientId(""); }}
              style={{ ...btnOutline, padding: "8px 16px" }}
            >
              Cancel
            </button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
          {patients.map((p) => (
            <div
              key={p.id}
              style={{
                background: "var(--bg-primary)",
                borderRadius: 10,
                border: "1px solid var(--border-light)",
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ ...body, fontWeight: 600, fontSize: 15, margin: 0 }}>
                  <span style={statusDot(p.glucoseStatus)} />
                  {p.name}
                </p>
                <button
                  onClick={() => handleRemovePatient(p.id)}
                  title="Remove patient"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-faint)",
                    fontSize: 16,
                    lineHeight: 1,
                    padding: 2,
                  }}
                >
                  ×
                </button>
              </div>
              <p style={{ ...mono, fontSize: 12, color: "var(--text-faint)", margin: 0 }}>{p.id}</p>
              <p style={{ ...body, fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>
                Last reading: {timeAgo(p.lastReadingTime)}
              </p>
              {p.activeAlerts > 0 && (
                <p style={{ ...body, fontSize: 12, color: "#ef4444", fontWeight: 600, margin: 0 }}>
                  {p.activeAlerts} active alert{p.activeAlerts > 1 ? "s" : ""}
                </p>
              )}
              <a
                href={`/clinician?patient=${p.id}`}
                style={{
                  ...body,
                  display: "block",
                  textAlign: "center",
                  padding: "6px 0",
                  borderRadius: 6,
                  border: "1px solid var(--border-light)",
                  fontSize: 13,
                  color: "#1a2a5e",
                  fontWeight: 600,
                  textDecoration: "none",
                  marginTop: "auto",
                }}
              >
                View Details
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* ── Alerts Panel ── */}
      <div style={card}>
        <h2 style={{ ...heading, fontSize: 20, marginBottom: 12 }}>Aggregated Alerts</h2>
        {MOCK_ALERTS.length === 0 && (
          <p style={{ ...body, color: "var(--text-faint)", fontSize: 14 }}>No active alerts across patients.</p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {MOCK_ALERTS.map((alert) => (
            <div
              key={alert.id}
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 12,
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid var(--border-light)",
                background: "var(--bg-primary)",
              }}
            >
              <div style={{ flex: 1 }}>
                <p style={{ ...body, fontSize: 14, margin: 0 }}>
                  <strong>{alert.patientName}</strong> — {alert.message}
                </p>
                <p style={{ ...body, color: "var(--text-faint)", fontSize: 12, margin: "4px 0 0" }}>
                  {timeAgo(alert.timestamp)}
                </p>
              </div>
              <span style={severityBadge(alert.severity)}>{alert.severity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bulk Actions ── */}
      <div style={{ ...card, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <h2 style={{ ...heading, fontSize: 18, marginBottom: 4 }}>Bulk Actions</h2>
          <p style={{ ...body, color: "var(--text-secondary)", fontSize: 13, margin: 0 }}>
            Generate reports or care plans for all patients at once.
          </p>
        </div>
        <button onClick={handleBulkCarePlans} disabled={generatingCarePlans} style={btnOutline}>
          {generatingCarePlans ? "Generating…" : "Generate School Care Plans"}
        </button>
        <button onClick={handleBulkReports} disabled={generatingReports} style={btnPrimary}>
          {generatingReports ? "Generating…" : "Generate All Reports"}
        </button>
      </div>

      {/* ── Disclaimer Banner ── */}
      <div
        style={{
          ...card,
          background: "rgba(42,181,193,0.06)",
          borderColor: "var(--accent-teal)",
        }}
      >
        <p style={{ ...body, fontSize: 14, fontWeight: 600, margin: "0 0 6px", color: "#1a2a5e" }}>
          Educational Platform Disclaimer
        </p>
        <p style={{ ...body, fontSize: 13, margin: 0, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          {DISCLAIMER}
        </p>
      </div>

      {/* ── Access Control Note ── */}
      <div style={{ ...card, background: "var(--bg-primary)", textAlign: "center" }}>
        <p style={{ ...body, fontSize: 13, color: "var(--text-faint)", margin: 0 }}>
          Organisation view is read-only. Patient data is shared only with authorised staff.
          GluMira™ does not make treatment recommendations.
        </p>
      </div>
    </div>
  );
}
