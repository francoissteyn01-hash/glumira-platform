/**
 * GluMira™ V7 — Block 45: Clinician Portal
 * Read-only clinician view for reviewing patient patterns.
 * Scandinavian Minimalist design (#f8f9fa bg, #1a2a5e navy, #2ab5c1 teal).
 */

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DISCLAIMER } from "@/lib/constants";

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface Patient {
  id: string;
  name: string;
  diabetesType: string;
  insulinRegimen: string;
  lastActive: string;
}

interface PatternSummary {
  observations: string[];
  tdd: number;
  basalPercent: number;
  bolusPercent: number;
  timeInRange: number;
  hypoFrequency: number;
  averageGlucose: number;
}

interface IOBOverview {
  currentIOB: number;
  worstPressureClass: string;
  dangerWindowsCount: number;
}

interface AlertEvent {
  id: string;
  type: "hypo" | "pattern_flag" | "missed_bolus" | "sensor_gap";
  message: string;
  timestamp: string;
  severity: "low" | "medium" | "high";
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

const label: React.CSSProperties = {
  fontFamily: "'DM Sans', system-ui, sans-serif",
  color: "var(--text-secondary)",
  fontSize: 13,
  marginBottom: 4,
};

const badge = (severity: string): React.CSSProperties => ({
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

const MOCK_PATIENTS: Patient[] = [
  { id: "P-1001", name: "Patient A", diabetesType: "Type 1", insulinRegimen: "MDI (Basal-Bolus)", lastActive: new Date(Date.now() - 3_600_000).toISOString() },
  { id: "P-1002", name: "Patient B", diabetesType: "Type 2", insulinRegimen: "Basal Only", lastActive: new Date(Date.now() - 7_200_000).toISOString() },
  { id: "P-1003", name: "Patient C", diabetesType: "Type 1", insulinRegimen: "Pump (CIQ)", lastActive: new Date(Date.now() - 86_400_000).toISOString() },
];

const MOCK_PATTERN: PatternSummary = {
  observations: [
    "Recurring dawn phenomenon — glucose rises 06:00–08:00 on 5 of 7 days",
    "Post-lunch spikes exceeding 10 mmol/L on 4 of 7 days",
    "Nocturnal hypo trend between 02:00–04:00 (2 events this week)",
    "Weekend basal needs appear lower than weekday",
  ],
  tdd: 42.5,
  basalPercent: 48,
  bolusPercent: 52,
  timeInRange: 68,
  hypoFrequency: 2.1,
  averageGlucose: 8.4,
};

const MOCK_IOB: IOBOverview = {
  currentIOB: 3.2,
  worstPressureClass: "Strong",
  dangerWindowsCount: 2,
};

const MOCK_ALERTS: AlertEvent[] = [
  { id: "a1", type: "hypo", message: "Hypoglycaemia detected — 3.1 mmol/L at 03:12", timestamp: new Date(Date.now() - 28_800_000).toISOString(), severity: "high" },
  { id: "a2", type: "pattern_flag", message: "Dawn phenomenon flagged — 5 consecutive mornings", timestamp: new Date(Date.now() - 43_200_000).toISOString(), severity: "medium" },
  { id: "a3", type: "hypo", message: "Mild low — 3.8 mmol/L at 15:40", timestamp: new Date(Date.now() - 172_800_000).toISOString(), severity: "medium" },
  { id: "a4", type: "pattern_flag", message: "Elevated post-prandial average at lunch", timestamp: new Date(Date.now() - 259_200_000).toISOString(), severity: "low" },
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
export default function ClinicianPortal() {
  const { user } = useAuth();
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  /* In production this would call /trpc/clinician.getPatients */
  const filteredPatients = MOCK_PATIENTS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const selectedPatient = MOCK_PATIENTS.find((p) => p.id === selectedPatientId);

  const handleSelectPatient = (id: string) => {
    setLoading(true);
    setSelectedPatientId(id);
    /* Simulate fetch latency */
    setTimeout(() => setLoading(false), 400);
  };

  /* ─── Render ──────────────────────────────────────────────────────────── */
  return (
    <div style={layout}>
      {/* ── Header ── */}
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ ...heading, fontSize: 28 }}>Clinician Portal</h1>
        <p style={{ ...body, color: "var(--text-secondary)", marginTop: 4 }}>
          Read-only patient pattern review
        </p>
      </header>

      {/* ── Patient Selector ── */}
      <div style={card}>
        <p style={label}>Search or select a patient</p>
        <input
          type="text"
          placeholder="Search by name or ID…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            ...body,
            width: "100%",
            padding: "10px 14px",
            borderRadius: 8,
            border: "1px solid var(--border-light)",
            background: "var(--bg-primary)",
            marginBottom: 10,
            boxSizing: "border-box",
            outline: "none",
          }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {filteredPatients.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPatient(p.id)}
              style={{
                ...body,
                padding: "8px 16px",
                borderRadius: 8,
                border: selectedPatientId === p.id ? "2px solid var(--accent-teal)" : "1px solid var(--border-light)",
                background: selectedPatientId === p.id ? "rgba(42,181,193,0.08)" : "var(--bg-card)",
                cursor: "pointer",
                fontWeight: selectedPatientId === p.id ? 600 : 400,
                color: "var(--text-primary)",
              }}
            >
              {p.name} ({p.id})
            </button>
          ))}
          {filteredPatients.length === 0 && (
            <p style={{ ...body, color: "var(--text-faint)", fontSize: 14 }}>No patients match your search.</p>
          )}
        </div>
      </div>

      {loading && (
        <p style={{ ...body, color: "var(--text-faint)", textAlign: "center", padding: 24 }}>
          Loading patient data…
        </p>
      )}

      {selectedPatient && !loading && (
        <>
          {/* ── Patient Summary Card ── */}
          <div style={card}>
            <h2 style={{ ...heading, fontSize: 20, marginBottom: 12 }}>Patient Summary</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <p style={label}>Name / ID</p>
                <p style={{ ...mono, fontSize: 15, margin: 0 }}>{selectedPatient.name} — {selectedPatient.id}</p>
              </div>
              <div>
                <p style={label}>Diabetes Type</p>
                <p style={{ ...mono, fontSize: 15, margin: 0 }}>{selectedPatient.diabetesType}</p>
              </div>
              <div>
                <p style={label}>Insulin Regimen</p>
                <p style={{ ...mono, fontSize: 15, margin: 0 }}>{selectedPatient.insulinRegimen}</p>
              </div>
              <div>
                <p style={label}>Last Active</p>
                <p style={{ ...mono, fontSize: 15, margin: 0 }}>{timeAgo(selectedPatient.lastActive)}</p>
              </div>
            </div>
          </div>

          {/* ── Pattern Summary Panel ── */}
          <div style={card}>
            <h2 style={{ ...heading, fontSize: 20, marginBottom: 12 }}>Pattern Summary</h2>

            <p style={{ ...label, marginBottom: 8 }}>Key Observations</p>
            <ul style={{ ...body, fontSize: 14, paddingLeft: 20, margin: "0 0 16px 0" }}>
              {MOCK_PATTERN.observations.map((obs, i) => (
                <li key={i} style={{ marginBottom: 6 }}>{obs}</li>
              ))}
            </ul>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
              {[
                { title: "TDD", value: `${MOCK_PATTERN.tdd} U` },
                { title: "Basal %", value: `${MOCK_PATTERN.basalPercent}%` },
                { title: "Bolus %", value: `${MOCK_PATTERN.bolusPercent}%` },
                { title: "Time in Range", value: `${MOCK_PATTERN.timeInRange}%` },
                { title: "Hypo Frequency", value: `${MOCK_PATTERN.hypoFrequency} / week` },
                { title: "Avg Glucose", value: `${MOCK_PATTERN.averageGlucose} mmol/L` },
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    background: "var(--bg-primary)",
                    borderRadius: 8,
                    padding: "12px 14px",
                    border: "1px solid var(--border-light)",
                  }}
                >
                  <p style={{ ...label, margin: 0 }}>{item.title}</p>
                  <p style={{ ...mono, fontSize: 18, fontWeight: 600, margin: "4px 0 0" }}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── IOB Overview Card ── */}
          <div style={card}>
            <h2 style={{ ...heading, fontSize: 20, marginBottom: 12 }}>IOB Overview</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div style={{ background: "var(--bg-primary)", borderRadius: 8, padding: "12px 14px", border: "1px solid var(--border-light)" }}>
                <p style={{ ...label, margin: 0 }}>Current IOB</p>
                <p style={{ ...mono, fontSize: 22, fontWeight: 700, margin: "4px 0 0", color: "var(--accent-teal)" }}>
                  {MOCK_IOB.currentIOB} U
                </p>
              </div>
              <div style={{ background: "var(--bg-primary)", borderRadius: 8, padding: "12px 14px", border: "1px solid var(--border-light)" }}>
                <p style={{ ...label, margin: 0 }}>Worst Pressure Class</p>
                <p style={{ ...mono, fontSize: 18, fontWeight: 600, margin: "4px 0 0" }}>{MOCK_IOB.worstPressureClass}</p>
              </div>
              <div style={{ background: "var(--bg-primary)", borderRadius: 8, padding: "12px 14px", border: "1px solid var(--border-light)" }}>
                <p style={{ ...label, margin: 0 }}>Danger Windows</p>
                <p style={{ ...mono, fontSize: 18, fontWeight: 600, margin: "4px 0 0" }}>{MOCK_IOB.dangerWindowsCount}</p>
              </div>
            </div>
          </div>

          {/* ── Glucose Chart Preview ── */}
          <div
            style={{
              ...card,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 140,
              cursor: "pointer",
              transition: "border-color 0.2s",
            }}
            onClick={() => window.location.assign("/glucose-chart")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter") window.location.assign("/glucose-chart"); }}
          >
            <div style={{ textAlign: "center" }}>
              <p style={{ ...heading, fontSize: 16, color: "var(--accent-teal)" }}>
                24-hour glucose overlay
              </p>
              <p style={{ ...body, color: "var(--text-faint)", fontSize: 13, marginTop: 4 }}>
                Click to expand
              </p>
            </div>
          </div>

          {/* ── Report Generation ── */}
          <div style={{ ...card, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ ...heading, fontSize: 18, marginBottom: 4 }}>Clinical Report</h2>
              <p style={{ ...body, color: "var(--text-secondary)", fontSize: 13, margin: 0 }}>
                Generate a comprehensive PDF report for this patient.
              </p>
            </div>
            <a
              href="/report"
              style={{
                ...body,
                display: "inline-block",
                padding: "10px 22px",
                borderRadius: 8,
                background: "#1a2a5e",
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
            >
              Generate Clinical Report
            </a>
          </div>

          {/* ── Recent Alerts ── */}
          <div style={card}>
            <h2 style={{ ...heading, fontSize: 20, marginBottom: 12 }}>Recent Alerts</h2>
            {MOCK_ALERTS.length === 0 && (
              <p style={{ ...body, color: "var(--text-faint)", fontSize: 14 }}>No recent alerts.</p>
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
                    <p style={{ ...body, fontSize: 14, margin: 0 }}>{alert.message}</p>
                    <p style={{ ...body, color: "var(--text-faint)", fontSize: 12, margin: "4px 0 0" }}>
                      {timeAgo(alert.timestamp)}
                    </p>
                  </div>
                  <span style={badge(alert.severity)}>{alert.severity}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

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
          {DISCLAIMER} Clinical decisions should be based on comprehensive clinical assessment.
        </p>
      </div>

      {/* ── Access Control Note ── */}
      <div style={{ ...card, background: "var(--bg-primary)", textAlign: "center" }}>
        <p style={{ ...body, fontSize: 13, color: "var(--text-faint)", margin: 0 }}>
          This portal is read-only. GluMira™ does not make treatment recommendations.
        </p>
      </div>
    </div>
  );
}
