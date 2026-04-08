/**
 * GluMira™ V7 — Block 43: Environmental Module
 * Track environmental conditions and understand their impact on insulin
 * sensitivity, absorption, storage, and activity planning.
 */
import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useKeyboardSave } from "@/hooks/useKeyboardSave";
import { DISCLAIMER } from "@/lib/constants";
import {
  analyzeEnvironmentalImpact,
  getInsulinStorageGuidance,
  type EnvironmentalFactors,
} from "@/lib/environmental-engine";

/* ── colour tokens ─────────────────────────────────── */
const NAVY = "#1A2A5E";
const TEAL = "#2AB5C1";
const AMBER = "#D97706";
const RED = "#DC2626";

/* ── shared inline styles ──────────────────────────── */
const card: React.CSSProperties = {
  background: "var(--bg-card)", borderRadius: 12, padding: 24,
  marginBottom: 20, border: "1px solid var(--border)",
};
const heading2: React.CSSProperties = { color: NAVY, fontSize: 20, fontWeight: 700, marginBottom: 12 };
const heading3: React.CSSProperties = { color: NAVY, fontSize: 16, fontWeight: 600, marginBottom: 8 };
const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 4, fontSize: 14, color: "#4a5568" };
const inputStyle: React.CSSProperties = {
  padding: "8px 12px", borderRadius: 8, border: "1px solid #cbd5e1",
  fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
};
const chipBase: React.CSSProperties = {
  display: "inline-block", padding: "6px 14px", borderRadius: 999,
  fontSize: 13, fontWeight: 600, cursor: "pointer", marginRight: 8, marginBottom: 8,
  border: "2px solid transparent", transition: "all 0.15s ease",
};
const btnPrimary: React.CSSProperties = {
  background: TEAL, color: "#fff", border: "none", borderRadius: 10,
  padding: "12px 32px", fontSize: 15, fontWeight: 700, cursor: "pointer",
  width: "100%", marginTop: 8,
};

/* ── temperature chips ─────────────────────────────── */
const TEMP_CHIPS = [
  { label: "Cold <5 °C", value: 2 },
  { label: "Cool 5-15 °C", value: 10 },
  { label: "Mild 15-25 °C", value: 20 },
  { label: "Warm 25-35 °C", value: 30 },
  { label: "Hot >35 °C", value: 38 },
] as const;

/* ── altitude presets ──────────────────────────────── */
const ALT_PRESETS = [
  { label: "Sea Level", value: 0 },
  { label: "Mountain 1 500 m", value: 1500 },
  { label: "High Altitude 2 500 m", value: 2500 },
  { label: "Very High 3 500 m+", value: 3500 },
] as const;

/* ── helper: warning colour ────────────────────────── */
function warningColour(temp: number | undefined): string {
  if (temp === undefined) return "#4a5568";
  if (temp > 35 || temp < 0) return RED;
  if (temp > 25 || temp < 5) return AMBER;
  return "#4a5568";
}

/* ── storage-bar indicator ─────────────────────────── */
function StorageBar({ temp }: { temp: number | undefined }) {
  const zones = [
    { label: "Freeze", lo: -20, hi: 0, colour: "#3B82F6", danger: true },
    { label: "Fridge 2-8 °C", lo: 0, hi: 8, colour: "#10B981", danger: false },
    { label: "Room ≤25 °C", lo: 8, hi: 25, colour: "#F59E0B", danger: false },
    { label: "Warm >25 °C", lo: 25, hi: 40, colour: "#EF4444", danger: true },
    { label: "Extreme >40 °C", lo: 40, hi: 55, colour: "#7F1D1D", danger: true },
  ];
  const totalRange = 75; // -20 to 55
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 28, position: "relative" }}>
        {zones.map((z) => {
          const width = ((z.hi - z.lo) / totalRange) * 100;
          return (
            <div
              key={z.label}
              style={{
                width: `${width}%`, background: z.colour, opacity: 0.75,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 600, color: "#fff", whiteSpace: "nowrap",
                overflow: "hidden", padding: "0 2px",
              }}
              title={z.label}
            >
              {z.label}
            </div>
          );
        })}
        {temp !== undefined && temp >= -20 && temp <= 55 && (
          <div
            style={{
              position: "absolute", top: 0, bottom: 0, width: 3, background: "#000",
              left: `${((temp + 20) / totalRange) * 100}%`, transition: "left 0.3s ease",
              borderRadius: 2,
            }}
            title={`Current: ${temp} °C`}
          />
        )}
      </div>
      {temp !== undefined && (
        <p style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
          Current temperature: <strong>{temp} °C</strong>
        </p>
      )}
    </div>
  );
}

/* ================================================================ */
/*  Component                                                        */
/* ================================================================ */

export default function EnvironmentalModule() {
  const { user } = useAuth();

  /* ── form state ──────────────────────────────────── */
  const [temperature, setTemperature] = useState<number | undefined>(undefined);
  const [humidity, setHumidity] = useState<number | undefined>(undefined);
  const [altitude, setAltitude] = useState<number | undefined>(undefined);
  const [travelDirection, setTravelDirection] = useState<"east" | "west" | "none">("none");
  const [timeZoneShift, setTimeZoneShift] = useState<number>(0);
  const [season, setSeason] = useState<"spring" | "summer" | "autumn" | "winter" | undefined>(undefined);
  const [uvIndex, setUvIndex] = useState<number | undefined>(undefined);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  /* ── derived analysis (live-updating) ────────────── */
  const factors: EnvironmentalFactors = {
    temperature, humidity, altitude, travelDirection, timeZoneShift, season, uvIndex,
  };
  const impact = analyzeEnvironmentalImpact(factors);
  const storageGuidance = temperature !== undefined ? getInsulinStorageGuidance(temperature) : null;

  /* ── save handler ────────────────────────────────── */
  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/trpc/environmental.create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          factors,
          impact,
          storageGuidance,
          savedAt: new Date().toISOString(),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to save environmental data. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [saving, user, factors, impact, storageGuidance]);

  useKeyboardSave(handleSave);

  /* ── chip helper ─────────────────────────────────── */
  const chipStyle = (active: boolean): React.CSSProperties => ({
    ...chipBase,
    background: active ? TEAL : "#f1f5f9",
    color: active ? "#fff" : "#475569",
    borderColor: active ? TEAL : "#e2e8f0",
  });

  /* ── render ──────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", maxWidth: 640, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ color: NAVY, fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
          Environmental Conditions
        </h1>
        <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.6 }}>
          Track how temperature, altitude, humidity, and travel affect your insulin.
        </p>
      </header>

      {/* ── Temperature ──────────────────────────── */}
      <section style={card}>
        <h2 style={heading2}>Temperature</h2>
        <div style={{ marginBottom: 10 }}>
          {TEMP_CHIPS.map((c) => (
            <span
              key={c.label}
              role="button"
              tabIndex={0}
              style={chipStyle(temperature === c.value)}
              onClick={() => setTemperature(c.value)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setTemperature(c.value); }}
            >
              {c.label}
            </span>
          ))}
        </div>
        <label style={labelStyle}>
          Or enter exact temperature ( °C)
          <input
            type="number"
            style={inputStyle}
            placeholder="e.g. 28"
            value={temperature ?? ""}
            onChange={(e) => setTemperature(e.target.value === "" ? undefined : Number(e.target.value))}
          />
        </label>
      </section>

      {/* ── Humidity ─────────────────────────────── */}
      <section style={card}>
        <h2 style={heading2}>Humidity</h2>
        <label style={labelStyle}>
          Relative humidity (%)
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={humidity ?? 50}
            onChange={(e) => setHumidity(Number(e.target.value))}
            style={{ width: "100%", accentColor: TEAL }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8" }}>
            <span>0 %</span>
            <span style={{ fontWeight: 700, color: "#334155" }}>{humidity ?? 50} %</span>
            <span>100 %</span>
          </div>
        </label>
      </section>

      {/* ── Altitude ─────────────────────────────── */}
      <section style={card}>
        <h2 style={heading2}>Altitude</h2>
        <div style={{ marginBottom: 10 }}>
          {ALT_PRESETS.map((p) => (
            <span
              key={p.label}
              role="button"
              tabIndex={0}
              style={chipStyle(altitude === p.value)}
              onClick={() => setAltitude(p.value)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setAltitude(p.value); }}
            >
              {p.label}
            </span>
          ))}
        </div>
        <label style={labelStyle}>
          Or enter altitude (metres)
          <input
            type="number"
            style={inputStyle}
            placeholder="e.g. 1800"
            value={altitude ?? ""}
            onChange={(e) => setAltitude(e.target.value === "" ? undefined : Number(e.target.value))}
          />
        </label>
      </section>

      {/* ── Season & UV ──────────────────────────── */}
      <section style={card}>
        <h2 style={heading2}>Season &amp; UV</h2>
        <label style={{ ...labelStyle, marginBottom: 12 }}>
          Season
          <select
            style={{ ...inputStyle, appearance: "auto" }}
            value={season ?? ""}
            onChange={(e) => setSeason(e.target.value === "" ? undefined : e.target.value as EnvironmentalFactors["season"])}
          >
            <option value="">— select —</option>
            <option value="spring">Spring</option>
            <option value="summer">Summer</option>
            <option value="autumn">Autumn</option>
            <option value="winter">Winter</option>
          </select>
        </label>
        <label style={labelStyle}>
          UV Index (0-11+)
          <input
            type="number"
            min={0}
            max={15}
            style={inputStyle}
            placeholder="e.g. 7"
            value={uvIndex ?? ""}
            onChange={(e) => setUvIndex(e.target.value === "" ? undefined : Number(e.target.value))}
          />
        </label>
      </section>

      {/* ── Travel ───────────────────────────────── */}
      <section style={card}>
        <h2 style={heading2}>Travel &amp; Timezone</h2>
        <label style={{ ...labelStyle, marginBottom: 12 }}>
          Travel direction
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            {(["none", "east", "west"] as const).map((d) => (
              <span
                key={d}
                role="button"
                tabIndex={0}
                style={chipStyle(travelDirection === d)}
                onClick={() => setTravelDirection(d)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setTravelDirection(d); }}
              >
                {d === "none" ? "None" : d.charAt(0).toUpperCase() + d.slice(1)}
              </span>
            ))}
          </div>
        </label>
        {travelDirection !== "none" && (
          <label style={{ ...labelStyle, marginBottom: 12 }}>
            Timezone shift (hours)
            <input
              type="number"
              min={0}
              max={12}
              style={inputStyle}
              value={timeZoneShift}
              onChange={(e) => setTimeZoneShift(Number(e.target.value))}
            />
          </label>
        )}
        {travelDirection !== "none" && timeZoneShift > 0 && (
          <div
            style={{
              background: "#EFF6FF", borderRadius: 10, padding: 16, marginTop: 8,
              border: "1px solid #BFDBFE",
            }}
          >
            <h3 style={{ ...heading3, color: "#1E40AF", marginBottom: 6 }}>Basal Timing Advice</h3>
            <p style={{ fontSize: 13, color: "#1E3A5F", lineHeight: 1.6, margin: 0 }}>
              {impact.educationalNote}
            </p>
          </div>
        )}
      </section>

      {/* ── Impact Analysis Card ─────────────────── */}
      <section
        style={{
          ...card,
          border: `2px solid ${temperature !== undefined && (temperature > 35 || temperature < 0) ? RED : temperature !== undefined && (temperature > 25 || temperature < 5) ? AMBER : "var(--border)"}`,
        }}
      >
        <h2 style={heading2}>Impact Analysis</h2>

        <div style={{ marginBottom: 14 }}>
          <h3 style={heading3}>Insulin Sensitivity</h3>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "#334155", margin: 0 }}>
            {impact.insulinSensitivityChange}
          </p>
        </div>

        {impact.insulinStorageWarning && (
          <div
            style={{
              background: temperature !== undefined && (temperature > 35 || temperature < 0) ? "#FEF2F2" : "#FFFBEB",
              borderRadius: 8, padding: 14, marginBottom: 14,
              borderLeft: `4px solid ${warningColour(temperature)}`,
            }}
          >
            <h3 style={{ ...heading3, color: warningColour(temperature) }}>Storage Warning</h3>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: "#334155", margin: 0 }}>
              {impact.insulinStorageWarning}
            </p>
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <h3 style={heading3}>Absorption</h3>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "#334155", margin: 0 }}>
            {impact.absorptionNote}
          </p>
        </div>

        {impact.hydrationWarning && (
          <div style={{ background: "#F0FDF4", borderRadius: 8, padding: 14, marginBottom: 14, borderLeft: "4px solid #22C55E" }}>
            <h3 style={{ ...heading3, color: "#15803D" }}>Hydration</h3>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: "#334155", margin: 0 }}>
              {impact.hydrationWarning}
            </p>
          </div>
        )}

        <div>
          <h3 style={heading3}>Activity Adjustment</h3>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "#334155", margin: 0 }}>
            {impact.activityAdjustment}
          </p>
        </div>
      </section>

      {/* ── Insulin Storage Card ─────────────────── */}
      <section style={card}>
        <h2 style={heading2}>Insulin Storage Guide</h2>
        <StorageBar temp={temperature} />
        {storageGuidance && (
          <p style={{ fontSize: 13, lineHeight: 1.6, color: "#334155", marginTop: 12 }}>
            {storageGuidance}
          </p>
        )}
        {!storageGuidance && (
          <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 12 }}>
            Enter a temperature above to see personalised storage guidance.
          </p>
        )}
      </section>

      {/* ── Save ─────────────────────────────────── */}
      <button
        type="button"
        style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? "Saving..." : saved ? "Saved" : "Save Environmental Data"}
      </button>
      <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 6 }}>
        Ctrl+S / Cmd+S to quick-save
      </p>

      {/* ── Disclaimer ───────────────────────────── */}
      <footer style={{ marginTop: 32, padding: "16px 0", borderTop: "1px solid var(--border)" }}>
        <p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
          {DISCLAIMER}
        </p>
      </footer>
    </div>
  );
}
