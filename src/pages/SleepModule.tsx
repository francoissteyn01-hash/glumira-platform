import React, { useState, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useKeyboardSave } from "@/hooks/useKeyboardSave";
import { useGlucoseUnits } from "@/context/GlucoseUnitsContext";
import { DISCLAIMER } from "@/lib/constants";
import { apiFetch } from "@/lib/api";
import {
  analyzeSleepEntry,
  analyzeSleepPatterns,
  detectDawnPhenomenon,
  type SleepEntry,
  type SleepAnalysis,
} from "@/lib/sleep-engine";

/* ─── Quality config ────────────────────────────────────────────────────── */

const QUALITY_OPTIONS: { value: SleepEntry["quality"]; label: string; color: string; bg: string }[] = [
  { value: "poor", label: "Poor", color: "#dc2626", bg: "#fef2f2" },
  { value: "fair", label: "Fair", color: "#d97706", bg: "#fffbeb" },
  { value: "good", label: "Good", color: "#16a34a", bg: "#f0fdf4" },
  { value: "excellent", label: "Excellent", color: "#2563eb", bg: "#eff6ff" },
];

/* ─── Styles ────────────────────────────────────────────────────────────── */

const layout: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--bg-primary)",
};

const container: React.CSSProperties = {
  maxWidth: 640,
  margin: "0 auto",
  padding: "clamp(16px, 4vw, 32px)",
  display: "flex",
  flexDirection: "column",
  gap: 24,
};

const card: React.CSSProperties = {
  background: "var(--bg-card)",
  borderRadius: 12,
  border: "1px solid var(--border-light)",
  padding: 20,
};

const heading: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontSize: 24,
  fontWeight: 700,
  color: "var(--text-primary)",
  margin: 0,
};

const subheading: React.CSSProperties = {
  fontFamily: "'Playfair Display', serif",
  fontSize: 17,
  fontWeight: 600,
  color: "var(--text-primary)",
  margin: "0 0 12px 0",
};

const label: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 12,
  fontWeight: 500,
  color: "#6b7280",
  display: "block",
  marginBottom: 4,
};

const input: React.CSSProperties = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: 14,
  width: "100%",
  border: "1px solid var(--border-light)",
  borderRadius: 8,
  padding: "8px 12px",
  color: "var(--text-primary)",
  background: "var(--bg-card)",
  outline: "none",
  boxSizing: "border-box",
};

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
};

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function SleepModule() {
  const { user } = useAuth();
  const { units } = useGlucoseUnits();

  /* ── Form state ──────────────────────────────────────────────────────── */
  const [bedTime, setBedTime] = useState("");
  const [wakeTime, setWakeTime] = useState("");
  const [quality, setQuality] = useState<SleepEntry["quality"]>("good");
  const [interruptions, setInterruptions] = useState(0);
  const [glucoseBed, setGlucoseBed] = useState("");
  const [glucoseWake, setGlucoseWake] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  /* ── Sleep log (recent 7) ────────────────────────────────────────────── */
  const [sleepLog, setSleepLog] = useState<(SleepEntry & { _analysis?: SleepAnalysis })[]>([]);

  /* ── Build current entry ─────────────────────────────────────────────── */
  const currentEntry: SleepEntry | null = useMemo(() => {
    if (!bedTime || !wakeTime) return null;
    return {
      id: crypto.randomUUID?.() ?? Date.now().toString(),
      bedTime,
      wakeTime,
      quality,
      interruptions,
      glucoseAtBed: glucoseBed ? parseFloat(glucoseBed) : undefined,
      glucoseAtWake: glucoseWake ? parseFloat(glucoseWake) : undefined,
      glucoseUnits: units as "mmol" | "mg",
      notes: notes || undefined,
    };
  }, [bedTime, wakeTime, quality, interruptions, glucoseBed, glucoseWake, units, notes]);

  /* ── Live analysis ───────────────────────────────────────────────────── */
  const analysis = useMemo(() => (currentEntry ? analyzeSleepEntry(currentEntry) : null), [currentEntry]);

  const dawn = useMemo(
    () =>
      detectDawnPhenomenon(
        glucoseBed ? parseFloat(glucoseBed) : undefined,
        glucoseWake ? parseFloat(glucoseWake) : undefined,
        units as "mmol" | "mg"
      ),
    [glucoseBed, glucoseWake, units]
  );

  /* ── Pattern summary (last 7 entries + current) ──────────────────────── */
  const patternSummary = useMemo(() => {
    const all = currentEntry ? [...sleepLog, currentEntry] : sleepLog;
    return all.length > 0 ? analyzeSleepPatterns(all, 30) : null;
  }, [sleepLog, currentEntry]);

  /* ── Save handler ────────────────────────────────────────────────────── */
  const handleSave = useCallback(async () => {
    if (!currentEntry || saving) return;
    setSaving(true);
    setSaveMsg("");
    try {
      await apiFetch("/trpc/sleep.create", {
        method: "POST",
        body: JSON.stringify(currentEntry),
      });
      const entryWithAnalysis = { ...currentEntry, _analysis: analysis ?? undefined };
      setSleepLog((prev) => [entryWithAnalysis, ...prev].slice(0, 7));
      setSaveMsg("Saved successfully.");
      // Reset form
      setBedTime("");
      setWakeTime("");
      setQuality("good");
      setInterruptions(0);
      setGlucoseBed("");
      setGlucoseWake("");
      setNotes("");
    } catch (err: any) {
      setSaveMsg(err?.message ?? "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [currentEntry, saving, analysis]);

  useKeyboardSave(handleSave);

  /* ── Drift display helpers ───────────────────────────────────────────── */
  const driftArrow = analysis?.driftDirection === "rise" ? "↑" : analysis?.driftDirection === "drop" ? "↓" : "→";
  const driftColor =
    analysis?.driftDirection === "rise"
      ? "#d97706"
      : analysis?.driftDirection === "drop"
      ? "#2563eb"
      : "#16a34a";

  const unitLabel = units === "mmol" ? "mmol/L" : "mg/dL";

  return (
    <div style={layout}>
      <div style={container}>
        {/* ── Header ─────────────────────────────────────────────────── */}
        <div>
          <h1 style={heading}>Sleep &amp; Overnight Patterns</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#6b7280", marginTop: 4 }}>
            Track your sleep and understand how it affects your overnight glucose.
          </p>
        </div>

        {/* ── Sleep Entry Form ───────────────────────────────────────── */}
        <div style={card}>
          <h2 style={subheading}>Log Sleep</h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={label}>Bed time</label>
              <input
                type="datetime-local"
                value={bedTime}
                onChange={(e) => setBedTime(e.target.value)}
                style={input}
              />
            </div>
            <div>
              <label style={label}>Wake time</label>
              <input
                type="datetime-local"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                style={input}
              />
            </div>
          </div>

          {/* Quality buttons */}
          <div style={{ marginTop: 16 }}>
            <label style={label}>Sleep quality</label>
            <div style={{ display: "flex", gap: 8 }}>
              {QUALITY_OPTIONS.map((q) => {
                const active = quality === q.value;
                return (
                  <button
                    key={q.value}
                    type="button"
                    onClick={() => setQuality(q.value)}
                    style={{
                      flex: 1,
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      padding: "8px 4px",
                      borderRadius: 8,
                      border: `1.5px solid ${active ? q.color : "var(--border-light)"}`,
                      background: active ? q.bg : "transparent",
                      color: active ? q.color : "#6b7280",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {q.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interruptions */}
          <div style={{ marginTop: 16 }}>
            <label style={label}>Interruptions</label>
            <input
              type="number"
              min={0}
              max={10}
              value={interruptions}
              onChange={(e) => setInterruptions(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
              style={{ ...input, maxWidth: 100 }}
            />
          </div>

          {/* Glucose inputs */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
            <div>
              <label style={label}>Glucose at bedtime ({unitLabel})</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder={units === "mmol" ? "e.g. 7.2" : "e.g. 130"}
                value={glucoseBed}
                onChange={(e) => setGlucoseBed(e.target.value)}
                style={{ ...input, ...mono }}
              />
            </div>
            <div>
              <label style={label}>Glucose at wake ({unitLabel})</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder={units === "mmol" ? "e.g. 8.1" : "e.g. 146"}
                value={glucoseWake}
                onChange={(e) => setGlucoseWake(e.target.value)}
                style={{ ...input, ...mono }}
              />
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginTop: 16 }}>
            <label style={label}>Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              style={{ ...input, resize: "vertical" }}
            />
          </div>
        </div>

        {/* ── Overnight Analysis Card ────────────────────────────────── */}
        {analysis && (
          <div style={card}>
            <h2 style={subheading}>Overnight Analysis</h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "center" }}>
              <div style={{ background: "var(--bg-primary)", borderRadius: 8, padding: 12 }}>
                <p style={{ ...label, marginBottom: 2 }}>Duration</p>
                <p style={{ ...mono, fontSize: 22, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  {analysis.durationHours}h
                </p>
              </div>
              <div style={{ background: "var(--bg-primary)", borderRadius: 8, padding: 12 }}>
                <p style={{ ...label, marginBottom: 2 }}>Overnight drift</p>
                <p style={{ ...mono, fontSize: 22, fontWeight: 700, color: driftColor, margin: 0 }}>
                  {analysis.overnightDrift !== null ? (
                    <>
                      {driftArrow} {analysis.overnightDrift > 0 ? "+" : ""}
                      {analysis.overnightDrift}
                    </>
                  ) : (
                    "--"
                  )}
                </p>
                {analysis.overnightDrift !== null && (
                  <p style={{ fontSize: 10, color: "#9ca3af", margin: 0 }}>mmol/L</p>
                )}
              </div>
              <div style={{ background: "var(--bg-primary)", borderRadius: 8, padding: 12 }}>
                <p style={{ ...label, marginBottom: 2 }}>Quality</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600, color: "var(--text-primary)", margin: 0, textTransform: "capitalize" }}>
                  {quality}
                </p>
              </div>
            </div>

            {/* Dawn phenomenon warning */}
            {dawn.detected && (
              <div
                style={{
                  marginTop: 16,
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: 10,
                  padding: 14,
                }}
              >
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#92400e", margin: "0 0 4px 0" }}>
                  Dawn Phenomenon Suspected
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#a16207", margin: 0, lineHeight: 1.5 }}>
                  {dawn.explanation}
                </p>
              </div>
            )}

            {/* Somogyi effect — shown only if detected from external data (placeholder for future CGM integration) */}
            {analysis.somogyiEffect && (
              <div
                style={{
                  marginTop: 16,
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 10,
                  padding: 14,
                }}
              >
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#991b1b", margin: "0 0 4px 0" }}>
                  Somogyi Effect Suspected
                </p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#b91c1c", margin: 0, lineHeight: 1.5 }}>
                  Your overnight readings suggest a low followed by a rebound high. This pattern may indicate
                  that your evening basal insulin dose is too high, causing an overnight low that triggers a
                  hormone-driven glucose spike. Discuss with your care team before adjusting doses.
                </p>
              </div>
            )}

            {/* Pattern description */}
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6b7280", marginTop: 16, lineHeight: 1.6 }}>
              {analysis.pattern}
            </p>
          </div>
        )}

        {/* ── Recommendation Card ────────────────────────────────────── */}
        {analysis && (
          <div style={{ ...card, background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <h2 style={{ ...subheading, color: "#166534" }}>Recommendation</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#15803d", margin: 0, lineHeight: 1.6 }}>
              {analysis.recommendation}
            </p>
          </div>
        )}

        {/* ── Pattern Summary ────────────────────────────────────────── */}
        {patternSummary && sleepLog.length > 0 && (
          <div style={card}>
            <h2 style={subheading}>Pattern Summary</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div style={{ background: "var(--bg-primary)", borderRadius: 8, padding: 10, textAlign: "center" }}>
                <p style={{ ...label, marginBottom: 2 }}>Avg duration</p>
                <p style={{ ...mono, fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  {patternSummary.avgDuration}h
                </p>
              </div>
              <div style={{ background: "var(--bg-primary)", borderRadius: 8, padding: 10, textAlign: "center" }}>
                <p style={{ ...label, marginBottom: 2 }}>Dawn phenomenon</p>
                <p style={{ ...mono, fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  {patternSummary.dawnPhenomenonFrequency}%
                </p>
              </div>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#6b7280", margin: "0 0 10px 0", lineHeight: 1.5 }}>
              {patternSummary.poorSleepCorrelation}
            </p>
            {patternSummary.insights.map((insight, i) => (
              <p
                key={i}
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: "#374151",
                  margin: "0 0 6px 0",
                  lineHeight: 1.5,
                  paddingLeft: 12,
                  borderLeft: "3px solid var(--border-light)",
                }}
              >
                {insight}
              </p>
            ))}
          </div>
        )}

        {/* ── Recent Sleep Log ───────────────────────────────────────── */}
        {sleepLog.length > 0 && (
          <div style={card}>
            <h2 style={subheading}>Recent Sleep Log</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sleepLog.map((entry) => {
                const a = entry._analysis ?? analyzeSleepEntry(entry);
                const bedDate = new Date(entry.bedTime);
                const dateStr = bedDate.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
                return (
                  <div
                    key={entry.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 12px",
                      background: "var(--bg-primary)",
                      borderRadius: 8,
                      border: "1px solid var(--border-light)",
                    }}
                  >
                    <div>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>
                        {dateStr}
                      </p>
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#6b7280", margin: "2px 0 0 0" }}>
                        {a.durationHours}h · {entry.quality}
                        {a.overnightDrift !== null && ` · drift ${a.overnightDrift > 0 ? "+" : ""}${a.overnightDrift}`}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {a.dawnPhenomenon && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 99,
                            background: "#fffbeb",
                            color: "#92400e",
                            border: "1px solid #fde68a",
                          }}
                        >
                          Dawn
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Save Button ────────────────────────────────────────────── */}
        <button
          type="button"
          disabled={!currentEntry || saving}
          onClick={handleSave}
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 15,
            fontWeight: 600,
            width: "100%",
            padding: "14px 0",
            borderRadius: 10,
            border: "none",
            background: currentEntry && !saving ? "var(--text-primary)" : "#d1d5db",
            color: currentEntry && !saving ? "#fff" : "#9ca3af",
            cursor: currentEntry && !saving ? "pointer" : "not-allowed",
            transition: "all 0.15s",
          }}
        >
          {saving ? "Saving..." : "Save Sleep Entry"}
        </button>

        {saveMsg && (
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: saveMsg.includes("success") ? "#16a34a" : "#dc2626",
              textAlign: "center",
              margin: 0,
            }}
          >
            {saveMsg}
          </p>
        )}

        {/* ── Disclaimer ─────────────────────────────────────────────── */}
        <div
          style={{
            background: "#f3f4f6",
            borderRadius: 12,
            padding: 16,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: "#6b7280",
            lineHeight: 1.6,
          }}
        >
          <p style={{ fontWeight: 600, color: "#4b5563", margin: "0 0 4px 0" }}>Disclaimer</p>
          <p style={{ margin: 0 }}>{DISCLAIMER}</p>
        </div>
      </div>
    </div>
  );
}
