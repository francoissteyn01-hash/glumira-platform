/**
 * GluMira™ V7 — AI Bolus Advisory Page
 * Blocks 55-56: Educational bolus calculator with mandatory disclaimers.
 * Scandinavian Minimalist design (#f8f9fa bg, #1a2a5e navy, #2ab5c1 teal).
 *
 * Founding statement: "AI explains. It does not prescribe."
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useGlucoseUnits } from "@/context/GlucoseUnitsContext";
import { formatGlucose, getUnitLabel } from "@/utils/glucose-units";
import { DISCLAIMER } from "@/lib/constants";
import { generateBolusAdvisory, type BolusAdvisory } from "@/lib/prediction-engine";

/* ─── Design Tokens ──────────────────────────────────────────────────────── */

const NAVY = "#1a2a5e";
const TEAL = "#2ab5c1";
const BG = "#f8f9fa";
const RED = "#e74c3c";
const AMBER = "#f59e0b";
const GREEN = "#27ae60";
const MUTED = "#6b7280";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  Main Page                                                                */
/* ═══════════════════════════════════════════════════════════════════════════ */

export default function BolusAdvisorPage() {
  const { user, session } = useAuth();
  const { units } = useGlucoseUnits();

  // Input state
  const [currentGlucose, setCurrentGlucose] = useState("");
  const [targetGlucose, setTargetGlucose] = useState(units === "mg" ? "100" : "5.5");
  const [carbsPlanned, setCarbsPlanned] = useState("");
  const [isf, setIsf] = useState(units === "mg" ? "50" : "2.8");
  const [icr, setIcr] = useState("10");
  const [currentIOB, setCurrentIOB] = useState("0.0");
  const [result, setResult] = useState<BolusAdvisory | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset defaults when units change
  useEffect(() => {
    setTargetGlucose(units === "mg" ? "100" : "5.5");
    setIsf(units === "mg" ? "50" : "2.8");
    setResult(null);
  }, [units]);

  // Fetch IOB from dashboard data (simulated)
  useEffect(() => {
    if (!session) return;
    const headers = { Authorization: `Bearer ${session.access_token}` };
    fetch(`/trpc/iobHunter.calculateIOB?input=${encodeURIComponent(JSON.stringify({ json: {} }))}`, { headers })
      .then((r) => r.json())
      .then((res) => {
        const data = res?.result?.data?.json;
        if (data?.totalIOB != null) setCurrentIOB(String(data.totalIOB));
      })
      .catch(() => { /* IOB fetch failed — user can enter manually */ });
  }, [session]);

  function handleCalculate() {
    setError(null);
    setResult(null);

    const glucose = parseFloat(currentGlucose);
    const target = parseFloat(targetGlucose);
    const carbs = parseFloat(carbsPlanned) || 0;
    const isfVal = parseFloat(isf);
    const icrVal = parseFloat(icr);
    const iob = parseFloat(currentIOB) || 0;

    if (isNaN(glucose) || glucose <= 0) {
      setError("Please enter a valid current glucose reading.");
      return;
    }
    if (isNaN(target) || target <= 0) {
      setError("Please enter a valid target glucose.");
      return;
    }
    if (isNaN(isfVal) || isfVal <= 0) {
      setError("Please enter a valid Insulin Sensitivity Factor (ISF).");
      return;
    }
    if (isNaN(icrVal) || icrVal <= 0) {
      setError("Please enter a valid Insulin-to-Carb Ratio (ICR).");
      return;
    }

    try {
      const advisory = generateBolusAdvisory(glucose, target, carbs, isfVal, icrVal, iob, units);
      setResult(advisory);
    } catch (err) {
      setError("Calculation failed. Please check your inputs.");
    }
  }

  /* ─── Styles ─────────────────────────────────────────────────────────── */

  const pageStyle: React.CSSProperties = {
    maxWidth: 960,
    margin: "0 auto",
    padding: "2rem 1.5rem",
    fontFamily: "'Inter', system-ui, sans-serif",
    color: NAVY,
    background: BG,
    minHeight: "100vh",
  };

  const cardStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: 12,
    padding: "1.25rem 1.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
  };

  const inputGroupStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };

  const inputStyle: React.CSSProperties = {
    padding: "0.6rem 0.75rem",
    borderRadius: 8,
    border: "1px solid #d1d5db",
    fontSize: "1rem",
    fontFamily: "'JetBrains Mono', monospace",
    color: NAVY,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "0.75rem 2rem",
    borderRadius: 8,
    border: "none",
    background: TEAL,
    color: "#fff",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    width: "100%",
    transition: "background 0.2s",
  };

  const disclaimerBoxStyle: React.CSSProperties = {
    background: "#fef2f2",
    border: `2px solid ${RED}`,
    borderRadius: 12,
    padding: "1.25rem 1.5rem",
    margin: "1.5rem 0",
  };

  return (
    <div style={pageStyle}>
      {/* Header */}
      <header style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0, color: NAVY }}>
          Bolus Advisor
        </h1>
        <p style={{ color: MUTED, margin: "0.25rem 0 0", fontSize: "0.9rem" }}>
          Educational insulin calculation tool — AI explains, it does not prescribe
        </p>
      </header>

      {/* MANDATORY DISCLAIMER — cannot be dismissed */}
      <div style={disclaimerBoxStyle}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: RED }}>
          &#9888; Important Disclaimer
        </p>
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: "#991b1b", lineHeight: 1.6 }}>
          This is an educational calculation only. GluMira&#8482; does NOT prescribe insulin doses.
          This calculation uses YOUR entered ISF and ICR values and published pharmacological models.
          It is NOT a medical recommendation. ALWAYS consult your healthcare team before adjusting insulin.
          You are responsible for all dosing decisions.
        </p>
      </div>

      {/* Input Form */}
      <div style={{ ...cardStyle, margin: "1.5rem 0" }}>
        <h2 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 600 }}>Enter Your Values</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {/* Current Glucose */}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Current Glucose ({getUnitLabel(units)})</label>
            <input
              type="number"
              step={units === "mg" ? "1" : "0.1"}
              min="0"
              placeholder={units === "mg" ? "120" : "6.7"}
              value={currentGlucose}
              onChange={(e) => setCurrentGlucose(e.target.value)}
              style={inputStyle}
              aria-label="Current glucose reading"
            />
          </div>

          {/* Target Glucose */}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Target Glucose ({getUnitLabel(units)})</label>
            <input
              type="number"
              step={units === "mg" ? "1" : "0.1"}
              min="0"
              value={targetGlucose}
              onChange={(e) => setTargetGlucose(e.target.value)}
              style={inputStyle}
              aria-label="Target glucose"
            />
          </div>

          {/* Planned Carbs */}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Planned Carbs (g)</label>
            <input
              type="number"
              step="1"
              min="0"
              placeholder="45"
              value={carbsPlanned}
              onChange={(e) => setCarbsPlanned(e.target.value)}
              style={inputStyle}
              aria-label="Planned carbohydrates in grams"
            />
          </div>

          {/* ISF */}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>ISF ({getUnitLabel(units)}/U)</label>
            <input
              type="number"
              step={units === "mg" ? "1" : "0.1"}
              min="0"
              value={isf}
              onChange={(e) => setIsf(e.target.value)}
              style={inputStyle}
              aria-label="Insulin Sensitivity Factor"
            />
            <span style={{ fontSize: "0.7rem", color: MUTED }}>How much 1U lowers your glucose</span>
          </div>

          {/* ICR */}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>ICR (g/U)</label>
            <input
              type="number"
              step="1"
              min="0"
              value={icr}
              onChange={(e) => setIcr(e.target.value)}
              style={inputStyle}
              aria-label="Insulin-to-Carb Ratio"
            />
            <span style={{ fontSize: "0.7rem", color: MUTED }}>Grams of carbs covered by 1U</span>
          </div>

          {/* Current IOB */}
          <div style={inputGroupStyle}>
            <label style={labelStyle}>Active IOB (U)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              value={currentIOB}
              onChange={(e) => setCurrentIOB(e.target.value)}
              style={inputStyle}
              aria-label="Current insulin on board"
            />
            <span style={{ fontSize: "0.7rem", color: MUTED }}>Auto-fetched from dashboard if available</span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p style={{ margin: "1rem 0 0", color: RED, fontSize: "0.85rem", fontWeight: 600 }}>{error}</p>
        )}

        {/* Calculate Button */}
        <button
          onClick={handleCalculate}
          style={{ ...buttonStyle, marginTop: "1.25rem" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#229aa5")}
          onMouseLeave={(e) => (e.currentTarget.style.background = TEAL)}
          aria-label="Calculate bolus advisory"
        >
          Calculate Advisory
        </button>
      </div>

      {/* Result Card */}
      {result && (
        <div style={{ ...cardStyle, margin: "1.5rem 0", borderTop: `3px solid ${TEAL}` }}>
          <h2 style={{ margin: "0 0 1rem", fontSize: "1rem", fontWeight: 600 }}>Advisory Result</h2>

          {/* Main value */}
          <div style={{ textAlign: "center", margin: "1rem 0" }}>
            <p style={{ margin: 0, fontSize: "0.8rem", color: MUTED, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Educational Suggestion
            </p>
            <p style={{
              margin: "0.5rem 0 0.25rem",
              fontSize: "3.5rem",
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: result.suggestedBolus !== null ? NAVY : MUTED,
              lineHeight: 1,
            }}>
              {result.suggestedBolus !== null ? `${result.suggestedBolus.toFixed(2)}U` : "—"}
            </p>
            {result.suggestedBolus === null && (
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.85rem", color: RED, fontWeight: 600 }}>
                No bolus suggested — see safety flags below
              </p>
            )}
          </div>

          {/* Confidence meter */}
          <div style={{ margin: "1.25rem 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: MUTED }}>Confidence</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                {result.confidence}%
              </span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "#e5e7eb", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${result.confidence}%`,
                borderRadius: 4,
                background: result.confidence >= 70 ? GREEN : result.confidence >= 40 ? AMBER : RED,
                transition: "width 0.3s ease",
              }} />
            </div>
          </div>

          {/* Breakdown */}
          <div style={{ background: "#f9fafb", borderRadius: 8, padding: "1rem", margin: "1rem 0" }}>
            <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", fontWeight: 600, color: MUTED }}>Calculation Breakdown</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "0.35rem 1rem", fontFamily: "'JetBrains Mono', monospace", fontSize: "0.9rem" }}>
              <span>Correction dose</span>
              <span style={{ textAlign: "right" }}>{result.correctionContribution >= 0 ? "+" : ""}{result.correctionContribution.toFixed(2)}U</span>
              <span>Carb coverage</span>
              <span style={{ textAlign: "right" }}>+{result.carbContribution.toFixed(2)}U</span>
              <span>Active IOB</span>
              <span style={{ textAlign: "right", color: RED }}>-{result.iobContribution.toFixed(2)}U</span>
              <div style={{ gridColumn: "1 / -1", borderTop: "1px solid #d1d5db", margin: "0.25rem 0" }} />
              <span style={{ fontWeight: 700 }}>Result</span>
              <span style={{ textAlign: "right", fontWeight: 700 }}>
                {result.suggestedBolus !== null ? `${result.suggestedBolus.toFixed(2)}U` : "0.00U"}
              </span>
            </div>
          </div>

          {/* Reasoning */}
          <div style={{ margin: "1rem 0" }}>
            <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", fontWeight: 600, color: MUTED }}>Reasoning</h3>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.85rem", lineHeight: 1.7, color: NAVY }}>
              {result.reasoning.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          {/* Safety Flags */}
          {result.safetyFlags.length > 0 && (
            <div style={{ background: "#fef2f2", borderRadius: 8, padding: "1rem", margin: "1rem 0", border: `1px solid ${RED}33` }}>
              <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", fontWeight: 700, color: RED }}>
                &#9888; Safety Flags
              </h3>
              <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.85rem", lineHeight: 1.7, color: "#991b1b" }}>
                {result.safetyFlags.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Result disclaimer */}
          <div style={{
            background: "#fffbeb",
            borderRadius: 8,
            padding: "0.75rem 1rem",
            margin: "1rem 0 0",
            borderLeft: `3px solid ${AMBER}`,
          }}>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#92400e", lineHeight: 1.5 }}>
              {result.disclaimer}
            </p>
          </div>
        </div>
      )}

      {/* Educational Note */}
      <div style={{ ...cardStyle, margin: "1.5rem 0", background: "#f0fdf4", borderColor: "#bbf7d0" }}>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.95rem", fontWeight: 600, color: "#166534" }}>
          Understanding the Math
        </h3>
        <div style={{ fontSize: "0.85rem", color: "#166534", lineHeight: 1.7 }}>
          <p style={{ margin: "0 0 0.5rem" }}>
            <strong>Correction dose</strong> = (Current Glucose - Target Glucose) / ISF
          </p>
          <p style={{ margin: "0 0 0.5rem" }}>
            <strong>Carb coverage</strong> = Planned Carbs / ICR
          </p>
          <p style={{ margin: "0 0 0.5rem" }}>
            <strong>Active IOB</strong> is subtracted to avoid insulin stacking — taking more insulin when previous
            doses are still active can cause dangerous lows.
          </p>
          <p style={{ margin: 0 }}>
            <strong>ISF</strong> (Insulin Sensitivity Factor) is how much 1 unit of insulin lowers your glucose.{" "}
            <strong>ICR</strong> (Insulin-to-Carb Ratio) is how many grams of carbs 1 unit covers.
            Both values should be determined with your healthcare team.
          </p>
        </div>
      </div>

      {/* Repeated mandatory disclaimer at bottom */}
      <div style={disclaimerBoxStyle}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "0.95rem", color: RED }}>
          &#9888; Mandatory Reminder
        </p>
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.85rem", color: "#991b1b", lineHeight: 1.6 }}>
          This is an educational calculation only. GluMira&#8482; does NOT prescribe insulin doses.
          This calculation uses YOUR entered ISF and ICR values and published pharmacological models.
          It is NOT a medical recommendation. ALWAYS consult your healthcare team before adjusting insulin.
          You are responsible for all dosing decisions.
        </p>
      </div>

      {/* Footer */}
      <footer style={{ marginTop: "2rem", paddingTop: "1rem", borderTop: "1px solid #e5e7eb" }}>
        <p style={{ margin: 0, fontSize: "0.75rem", color: MUTED, lineHeight: 1.5, textAlign: "center" }}>
          {DISCLAIMER}
        </p>
      </footer>
    </div>
  );
}
