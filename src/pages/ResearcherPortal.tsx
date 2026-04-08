/**
 * GluMira™ V7 — Block 46: Researcher Portal
 * Anonymised data export and cohort analysis for researchers.
 * Scandinavian Minimalist design (#f8f9fa bg, #1a2a5e navy, #2ab5c1 teal).
 */

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DISCLAIMER } from "@/lib/constants";

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface CohortFilters {
  diabetesType: string;
  ageMin: number;
  ageMax: number;
  insulinType: string;
  region: string;
}

interface CohortStats {
  participants: number;
  averageTDD: number;
  averageTIR: number;
  averageA1C: number;
}

interface PatternFrequency {
  pattern: string;
  frequency: number;
  percentOfCohort: number;
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

const selectStyle: React.CSSProperties = {
  ...body,
  width: "100%",
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid var(--border-light)",
  background: "var(--bg-primary)",
  outline: "none",
  boxSizing: "border-box" as const,
};

const inputStyle: React.CSSProperties = {
  ...body,
  width: "100%",
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid var(--border-light)",
  background: "var(--bg-primary)",
  outline: "none",
  boxSizing: "border-box" as const,
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

const btnTeal: React.CSSProperties = {
  ...btnPrimary,
  background: "var(--accent-teal)",
};

/* ─── Mock data ───────────────────────────────────────────────────────────── */

const MOCK_STATS: CohortStats = {
  participants: 1247,
  averageTDD: 38.6,
  averageTIR: 62,
  averageA1C: 7.2,
};

const MOCK_PATTERNS: PatternFrequency[] = [
  { pattern: "Dawn phenomenon", frequency: 487, percentOfCohort: 39.1 },
  { pattern: "Post-prandial spike (lunch)", frequency: 412, percentOfCohort: 33.0 },
  { pattern: "Nocturnal hypoglycaemia", frequency: 298, percentOfCohort: 23.9 },
  { pattern: "Exercise-induced low", frequency: 251, percentOfCohort: 20.1 },
  { pattern: "Weekend basal mismatch", frequency: 189, percentOfCohort: 15.2 },
  { pattern: "Stress hyperglycaemia", frequency: 156, percentOfCohort: 12.5 },
  { pattern: "Missed bolus pattern", frequency: 134, percentOfCohort: 10.7 },
];

/* ═══════════════════════════════════════════════════════════════════════════ */
export default function ResearcherPortal() {
  const { user } = useAuth();

  const [filters, setFilters] = useState<CohortFilters>({
    diabetesType: "all",
    ageMin: 0,
    ageMax: 100,
    insulinType: "all",
    region: "all",
  });

  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dataTypes, setDataTypes] = useState({
    glucose: true,
    insulin: true,
    patterns: true,
    demographics: true,
  });
  const [exporting, setExporting] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  const toggleDataType = (key: keyof typeof dataTypes) => {
    setDataTypes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExport = async () => {
    setExporting(true);
    setExportDone(false);
    /* In production: POST /trpc/researcher.exportCohort */
    await new Promise((r) => setTimeout(r, 1200));
    setExporting(false);
    setExportDone(true);
  };

  const updateFilter = <K extends keyof CohortFilters>(key: K, val: CohortFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: val }));
  };

  /* ─── Render ──────────────────────────────────────────────────────────── */
  return (
    <div style={layout}>
      {/* ── Header ── */}
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ ...heading, fontSize: 28 }}>Researcher Portal</h1>
        <p style={{ ...body, color: "var(--text-secondary)", marginTop: 4 }}>
          Anonymised cohort data and pattern analysis
        </p>
      </header>

      {/* ── Cohort Builder ── */}
      <div style={card}>
        <h2 style={{ ...heading, fontSize: 20, marginBottom: 14 }}>Cohort Builder</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <p style={labelStyle}>Diabetes Type</p>
            <select
              value={filters.diabetesType}
              onChange={(e) => updateFilter("diabetesType", e.target.value)}
              style={selectStyle}
            >
              <option value="all">All Types</option>
              <option value="type1">Type 1</option>
              <option value="type2">Type 2</option>
              <option value="gestational">Gestational</option>
              <option value="lada">LADA</option>
              <option value="mody">MODY</option>
            </select>
          </div>

          <div>
            <p style={labelStyle}>Insulin Type</p>
            <select
              value={filters.insulinType}
              onChange={(e) => updateFilter("insulinType", e.target.value)}
              style={selectStyle}
            >
              <option value="all">All Insulin Types</option>
              <option value="mdi">MDI (Basal-Bolus)</option>
              <option value="pump">Insulin Pump</option>
              <option value="basal_only">Basal Only</option>
              <option value="premixed">Pre-mixed</option>
            </select>
          </div>

          <div>
            <p style={labelStyle}>Age Range</p>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="number"
                min={0}
                max={120}
                value={filters.ageMin}
                onChange={(e) => updateFilter("ageMin", Number(e.target.value))}
                style={{ ...inputStyle, width: "50%" }}
                placeholder="Min"
              />
              <span style={{ ...body, color: "var(--text-faint)" }}>to</span>
              <input
                type="number"
                min={0}
                max={120}
                value={filters.ageMax}
                onChange={(e) => updateFilter("ageMax", Number(e.target.value))}
                style={{ ...inputStyle, width: "50%" }}
                placeholder="Max"
              />
            </div>
          </div>

          <div>
            <p style={labelStyle}>Region</p>
            <select
              value={filters.region}
              onChange={(e) => updateFilter("region", e.target.value)}
              style={selectStyle}
            >
              <option value="all">All Regions</option>
              <option value="uk">United Kingdom</option>
              <option value="eu">Europe</option>
              <option value="na">North America</option>
              <option value="apac">Asia-Pacific</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Cohort Stats ── */}
      <div style={card}>
        <h2 style={{ ...heading, fontSize: 20, marginBottom: 14 }}>Cohort Statistics</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { title: "Participants", value: MOCK_STATS.participants.toLocaleString() },
            { title: "Avg TDD", value: `${MOCK_STATS.averageTDD} U` },
            { title: "Avg TIR", value: `${MOCK_STATS.averageTIR}%` },
            { title: "Avg A1C (est.)", value: `${MOCK_STATS.averageA1C}%` },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                background: "var(--bg-primary)",
                borderRadius: 8,
                padding: "12px 14px",
                border: "1px solid var(--border-light)",
                textAlign: "center",
              }}
            >
              <p style={{ ...labelStyle, margin: 0, textAlign: "center" }}>{item.title}</p>
              <p style={{ ...mono, fontSize: 20, fontWeight: 700, margin: "6px 0 0" }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Data Export Panel ── */}
      <div style={card}>
        <h2 style={{ ...heading, fontSize: 20, marginBottom: 14 }}>Data Export</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          <div>
            <p style={labelStyle}>Export Format</p>
            <div style={{ display: "flex", gap: 8 }}>
              {(["csv", "json"] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setExportFormat(fmt)}
                  style={{
                    ...body,
                    padding: "8px 18px",
                    borderRadius: 8,
                    border: exportFormat === fmt ? "2px solid var(--accent-teal)" : "1px solid var(--border-light)",
                    background: exportFormat === fmt ? "rgba(42,181,193,0.08)" : "var(--bg-card)",
                    cursor: "pointer",
                    fontWeight: exportFormat === fmt ? 600 : 400,
                    color: "var(--text-primary)",
                    textTransform: "uppercase",
                    fontSize: 13,
                  }}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={labelStyle}>Date Range</p>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                style={{ ...inputStyle, width: "50%" }}
              />
              <span style={{ ...body, color: "var(--text-faint)" }}>to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                style={{ ...inputStyle, width: "50%" }}
              />
            </div>
          </div>
        </div>

        <p style={labelStyle}>Data Types to Include</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
          {(Object.keys(dataTypes) as (keyof typeof dataTypes)[]).map((key) => (
            <label
              key={key}
              style={{
                ...body,
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 14,
                cursor: "pointer",
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid var(--border-light)",
                background: dataTypes[key] ? "rgba(42,181,193,0.08)" : "var(--bg-primary)",
              }}
            >
              <input
                type="checkbox"
                checked={dataTypes[key]}
                onChange={() => toggleDataType(key)}
                style={{ accentColor: "#2ab5c1" }}
              />
              {key.charAt(0).toUpperCase() + key.slice(1)}
              {key === "demographics" && (
                <span style={{ color: "var(--text-faint)", fontSize: 11 }}>(anonymised)</span>
              )}
            </label>
          ))}
        </div>

        <button onClick={handleExport} disabled={exporting} style={btnTeal}>
          {exporting ? "Exporting…" : "Export Anonymised Data"}
        </button>

        {exportDone && (
          <p style={{ ...body, color: "var(--accent-teal)", fontSize: 13, marginTop: 10 }}>
            Export complete. Your download will begin shortly.
          </p>
        )}
      </div>

      {/* ── Anonymisation Notice ── */}
      <div
        style={{
          ...card,
          background: "rgba(42,181,193,0.06)",
          borderColor: "var(--accent-teal)",
        }}
      >
        <p style={{ ...body, fontSize: 14, fontWeight: 600, margin: "0 0 4px", color: "#1a2a5e" }}>
          Anonymisation Notice
        </p>
        <p style={{ ...body, fontSize: 13, margin: 0, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          All exported data is fully anonymised. No personally identifiable information is included.
          Patient IDs are replaced with randomised hashes before export.
        </p>
      </div>

      {/* ── Pattern Frequency Table ── */}
      <div style={card}>
        <h2 style={{ ...heading, fontSize: 20, marginBottom: 14 }}>Pattern Frequency</h2>
        <p style={{ ...body, color: "var(--text-secondary)", fontSize: 13, marginBottom: 14 }}>
          Most common patterns across the selected cohort.
        </p>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              ...body,
              fontSize: 14,
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "2px solid var(--border-light)",
                  textAlign: "left",
                }}
              >
                <th style={{ padding: "8px 12px", color: "var(--text-secondary)", fontWeight: 600 }}>Pattern</th>
                <th style={{ padding: "8px 12px", color: "var(--text-secondary)", fontWeight: 600, textAlign: "right" }}>Count</th>
                <th style={{ padding: "8px 12px", color: "var(--text-secondary)", fontWeight: 600, textAlign: "right" }}>% of Cohort</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_PATTERNS.map((row) => (
                <tr key={row.pattern} style={{ borderBottom: "1px solid var(--border-light)" }}>
                  <td style={{ padding: "10px 12px" }}>{row.pattern}</td>
                  <td style={{ ...mono, padding: "10px 12px", textAlign: "right", fontSize: 14 }}>
                    {row.frequency.toLocaleString()}
                  </td>
                  <td style={{ ...mono, padding: "10px 12px", textAlign: "right", fontSize: 14 }}>
                    {row.percentOfCohort.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Research Disclaimer ── */}
      <div style={{ ...card, background: "var(--bg-primary)", textAlign: "center" }}>
        <p style={{ ...body, fontSize: 13, color: "var(--text-faint)", margin: 0 }}>
          For research purposes only. Not for individual clinical decision-making.
        </p>
      </div>
    </div>
  );
}
