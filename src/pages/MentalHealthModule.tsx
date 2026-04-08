/**
 * GluMira V7 — Mental Health / Diabetes Distress Module (Block 41 + 69)
 * Scandinavian Minimalist design — mobile first
 *
 * SAFETY: This page is educational only. It does not diagnose.
 */
import { useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useKeyboardSave } from "@/hooks/useKeyboardSave";
import { useGlucoseUnits } from "@/context/GlucoseUnitsContext";
import { DISCLAIMER } from "@/lib/constants";
import {
  calculateDistressScore,
  analyzeMoodGlucoseCorrelation,
  detectBurnoutPattern,
  getCrisisResources,
  type MoodEntry,
  type DistressScore,
} from "@/lib/mental-health-engine";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SAFETY_DISCLAIMER =
  "This is not a clinical mental health assessment. If you are experiencing a mental health crisis, please contact your healthcare provider or emergency services.";

type MoodOption = { value: MoodEntry["mood"]; label: string; color: string };

const MOOD_OPTIONS: MoodOption[] = [
  { value: "great", label: "Great", color: "#22c55e" },
  { value: "good", label: "Good", color: "#86efac" },
  { value: "okay", label: "Okay", color: "#fbbf24" },
  { value: "low", label: "Low", color: "#fb923c" },
  { value: "very_low", label: "Very Low", color: "#ef4444" },
];

type SleepOption = { value: NonNullable<MoodEntry["sleepQuality"]>; label: string };

const SLEEP_OPTIONS: SleepOption[] = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

function distressColor(level: DistressScore["level"]): string {
  switch (level) {
    case "low":
      return "#22c55e";
    case "mild":
      return "#eab308";
    case "moderate":
      return "#f97316";
    case "high":
    case "severe":
      return "#ef4444";
  }
}

function distressBg(level: DistressScore["level"]): string {
  switch (level) {
    case "low":
      return "#f0fdf4";
    case "mild":
      return "#fefce8";
    case "moderate":
      return "#fff7ed";
    case "high":
    case "severe":
      return "#fef2f2";
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const card: React.CSSProperties = {
  borderRadius: 12,
  border: "1px solid var(--border-light, #e5e7eb)",
  padding: 20,
  marginBottom: 16,
  background: "var(--bg-card, #fff)",
};

const label: React.CSSProperties = {
  display: "block",
  fontSize: 14,
  fontWeight: 500,
  marginBottom: 8,
  color: "var(--text-secondary, #6b7280)",
};

const pillBtn = (
  active: boolean,
  accent: string = "var(--accent, #2563eb)",
): React.CSSProperties => ({
  padding: "8px 16px",
  borderRadius: 8,
  border: active ? `2px solid ${accent}` : "1px solid var(--border-light, #e5e7eb)",
  background: active ? accent + "18" : "transparent",
  color: active ? accent : "var(--text-primary, #111827)",
  fontWeight: active ? 600 : 400,
  fontSize: 14,
  cursor: "pointer",
  transition: "all 0.15s ease",
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MentalHealthModule() {
  const { session } = useAuth();
  const { units: globalUnits } = useGlucoseUnits();

  // --- Form state ---
  const [mood, setMood] = useState<MoodEntry["mood"] | null>(null);
  const [stressLevel, setStressLevel] = useState<MoodEntry["stressLevel"]>(3);
  const [burnout, setBurnout] = useState(false);
  const [glucoseValue, setGlucoseValue] = useState("");
  const [sleepQuality, setSleepQuality] = useState<MoodEntry["sleepQuality"] | null>(
    null,
  );
  const [notes, setNotes] = useState("");

  // --- History state ---
  const [history, setHistory] = useState<MoodEntry[]>([]);

  // --- UI state ---
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Computed ---
  const currentEntry: MoodEntry | null = useMemo(() => {
    if (!mood) return null;
    return {
      id: "preview",
      timestamp: new Date().toISOString(),
      mood,
      stressLevel,
      diabetesBurnout: burnout,
      glucoseValue: glucoseValue ? parseFloat(glucoseValue) : undefined,
      glucoseUnits: globalUnits === "mmol" ? "mmol" : "mg",
      sleepQuality: sleepQuality ?? undefined,
      notes: notes || undefined,
    };
  }, [mood, stressLevel, burnout, glucoseValue, globalUnits, sleepQuality, notes]);

  const allEntries = useMemo(() => {
    const list = [...history];
    if (currentEntry) list.push(currentEntry);
    return list;
  }, [history, currentEntry]);

  const distressScore = useMemo(
    () => calculateDistressScore(allEntries, 7),
    [allEntries],
  );

  const burnoutPattern = useMemo(
    () => detectBurnoutPattern(allEntries),
    [allEntries],
  );

  const correlation = useMemo(
    () => analyzeMoodGlucoseCorrelation(allEntries),
    [allEntries],
  );

  const crisisResources = useMemo(() => getCrisisResources(), []);

  // --- Save handler ---
  const save = useCallback(async () => {
    if (!session || !mood) return;
    setSaving(true);
    setError(null);
    setToast(null);
    try {
      const entry: Omit<MoodEntry, "id"> = {
        timestamp: new Date().toISOString(),
        mood,
        stressLevel,
        diabetesBurnout: burnout,
        glucoseValue: glucoseValue ? parseFloat(glucoseValue) : undefined,
        glucoseUnits: globalUnits === "mmol" ? "mmol" : "mg",
        sleepQuality: sleepQuality ?? undefined,
        notes: notes || undefined,
      };

      const res = await fetch("/trpc/mentalHealth.create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ json: entry }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message ?? "Save failed");

      const saved: MoodEntry = {
        id: data?.result?.data?.json?.id ?? crypto.randomUUID(),
        ...entry,
      };
      setHistory((prev) => [saved, ...prev].slice(0, 50));
      setToast("Mood entry logged");
      setTimeout(() => setToast(null), 3000);

      // Reset form
      setMood(null);
      setStressLevel(3);
      setBurnout(false);
      setGlucoseValue("");
      setSleepQuality(null);
      setNotes("");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }, [session, mood, stressLevel, burnout, glucoseValue, globalUnits, sleepQuality, notes]);

  useKeyboardSave(save);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary, #fafafa)" }}>
      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "clamp(16px, 4vw, 32px)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <Link
            to="/"
            style={{
              fontSize: 14,
              color: "var(--text-secondary, #6b7280)",
              textDecoration: "none",
            }}
          >
            &larr; Back
          </Link>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "-0.02em",
              marginTop: 8,
              color: "var(--text-primary, #111827)",
            }}
          >
            Mood &amp; Diabetes Distress
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-secondary, #6b7280)", marginTop: 4 }}>
            Track how you are feeling alongside your diabetes management.
          </p>
        </div>

        {/* Safety disclaimer */}
        <div
          style={{
            ...card,
            background: "#eff6ff",
            borderColor: "#bfdbfe",
          }}
        >
          <p style={{ fontSize: 13, color: "#1e40af", margin: 0, lineHeight: 1.5 }}>
            {SAFETY_DISCLAIMER}
          </p>
        </div>

        {/* Toast / error */}
        {toast && (
          <div
            style={{
              ...card,
              background: "#f0fdf4",
              borderColor: "#86efac",
              textAlign: "center",
              color: "#166534",
              fontWeight: 500,
            }}
          >
            {toast}
          </div>
        )}
        {error && (
          <div
            style={{
              ...card,
              background: "#fef2f2",
              borderColor: "#fca5a5",
              textAlign: "center",
              color: "#991b1b",
              fontWeight: 500,
            }}
          >
            {error}
          </div>
        )}

        {/* Mood selector */}
        <div style={card}>
          <span style={label}>How are you feeling?</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {MOOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMood(opt.value)}
                style={{
                  ...pillBtn(mood === opt.value, opt.color),
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  minWidth: 64,
                }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background:
                      mood === opt.value ? opt.color : opt.color + "40",
                    display: "block",
                    transition: "background 0.15s ease",
                  }}
                />
                <span style={{ fontSize: 12 }}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Stress level */}
        <div style={card}>
          <span style={label}>Stress level</span>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary, #6b7280)" }}>
              1
            </span>
            <div
              style={{
                flex: 1,
                height: 8,
                borderRadius: 4,
                background: "var(--border-light, #e5e7eb)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  height: "100%",
                  width: `${((stressLevel - 1) / 4) * 100}%`,
                  background:
                    stressLevel <= 2
                      ? "#22c55e"
                      : stressLevel <= 3
                      ? "#eab308"
                      : stressLevel <= 4
                      ? "#f97316"
                      : "#ef4444",
                  borderRadius: 4,
                  transition: "width 0.2s ease, background 0.2s ease",
                }}
              />
            </div>
            <span style={{ fontSize: 13, color: "var(--text-secondary, #6b7280)" }}>
              5
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
            {([1, 2, 3, 4, 5] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setStressLevel(v)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  border:
                    stressLevel === v
                      ? "2px solid var(--accent, #2563eb)"
                      : "1px solid var(--border-light, #e5e7eb)",
                  background: stressLevel === v ? "var(--accent, #2563eb)" + "18" : "transparent",
                  color:
                    stressLevel === v
                      ? "var(--accent, #2563eb)"
                      : "var(--text-primary, #111827)",
                  fontWeight: stressLevel === v ? 700 : 400,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Burnout toggle */}
        <div style={card}>
          <span style={label}>
            Are you feeling overwhelmed by diabetes management today?
          </span>
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={() => setBurnout(true)}
              style={pillBtn(burnout, "#f97316")}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => setBurnout(false)}
              style={pillBtn(!burnout, "#22c55e")}
            >
              No
            </button>
          </div>
        </div>

        {/* Glucose (optional) */}
        <div style={card}>
          <span style={label}>
            Current glucose ({globalUnits === "mmol" ? "mmol/L" : "mg/dL"}) — optional
          </span>
          <input
            type="number"
            inputMode="decimal"
            step="any"
            placeholder={globalUnits === "mmol" ? "e.g. 7.2" : "e.g. 130"}
            value={glucoseValue}
            onChange={(e) => setGlucoseValue(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid var(--border-light, #e5e7eb)",
              fontSize: 14,
              background: "var(--bg-primary, #fafafa)",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Sleep quality */}
        <div style={card}>
          <span style={label}>Sleep quality — optional</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SLEEP_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  setSleepQuality(sleepQuality === opt.value ? null : opt.value)
                }
                style={pillBtn(sleepQuality === opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div style={card}>
          <span style={label}>Notes — optional</span>
          <textarea
            rows={3}
            placeholder="How are you feeling today? Any particular thoughts?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid var(--border-light, #e5e7eb)",
              fontSize: 14,
              resize: "vertical",
              fontFamily: "inherit",
              background: "var(--bg-primary, #fafafa)",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={save}
          disabled={!mood || saving}
          style={{
            width: "100%",
            padding: "14px 0",
            borderRadius: 10,
            border: "none",
            background:
              !mood || saving
                ? "var(--border-light, #e5e7eb)"
                : "var(--accent, #2563eb)",
            color: !mood || saving ? "#9ca3af" : "#fff",
            fontSize: 16,
            fontWeight: 600,
            cursor: !mood || saving ? "not-allowed" : "pointer",
            marginBottom: 24,
            transition: "background 0.15s ease",
          }}
        >
          {saving ? "Saving..." : "Log mood entry"}
        </button>

        {/* Distress score card */}
        {mood && (
          <div
            style={{
              ...card,
              background: distressBg(distressScore.level),
              borderColor: distressColor(distressScore.level),
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary, #111827)" }}>
                Observed Distress Pattern
              </span>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  color: distressColor(distressScore.level),
                }}
              >
                {distressScore.score}
              </span>
            </div>
            <div
              style={{
                height: 6,
                borderRadius: 3,
                background: "#e5e7eb",
                marginBottom: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${distressScore.score}%`,
                  background: distressColor(distressScore.level),
                  borderRadius: 3,
                  transition: "width 0.3s ease",
                }}
              />
            </div>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-secondary, #6b7280)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {distressScore.recommendation}
            </p>
            {distressScore.factors.length > 0 && (
              <ul
                style={{
                  margin: "10px 0 0",
                  paddingLeft: 18,
                  fontSize: 13,
                  color: "var(--text-secondary, #6b7280)",
                }}
              >
                {distressScore.factors.map((f, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    {f}
                  </li>
                ))}
              </ul>
            )}
            <p
              style={{
                fontSize: 11,
                color: "var(--text-secondary, #6b7280)",
                marginTop: 10,
                marginBottom: 0,
                fontStyle: "italic",
              }}
            >
              This is a pattern observation, not a clinical assessment.
            </p>
          </div>
        )}

        {/* Seek help banner */}
        {distressScore.seekHelpFlag && (
          <div
            style={{
              ...card,
              background: "#fef2f2",
              borderColor: "#f87171",
              borderWidth: 2,
            }}
          >
            <h3
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: "#991b1b",
                margin: "0 0 12px",
              }}
            >
              You are not alone
            </h3>
            <p
              style={{
                fontSize: 14,
                color: "#7f1d1d",
                margin: "0 0 12px",
                lineHeight: 1.5,
              }}
            >
              If you are in crisis, please contact emergency services or a mental
              health professional immediately.
            </p>
            {crisisResources
              .filter((r) => r.contact !== "")
              .map((r, i) => (
                <div
                  key={i}
                  style={{
                    padding: "8px 0",
                    borderBottom:
                      i < crisisResources.filter((x) => x.contact).length - 1
                        ? "1px solid #fecaca"
                        : "none",
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#991b1b" }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: 14, color: "#7f1d1d" }}>{r.contact}</div>
                  {r.description && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "#9ca3af",
                        marginTop: 2,
                      }}
                    >
                      {r.description}
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}

        {/* Burnout pattern */}
        {burnoutPattern.detected && (
          <div
            style={{
              ...card,
              background: "#fff7ed",
              borderColor: "#fdba74",
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#9a3412",
              }}
            >
              Burnout Pattern Observed ({burnoutPattern.severity})
            </span>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-secondary, #6b7280)",
                margin: "8px 0 0",
                lineHeight: 1.5,
              }}
            >
              {burnoutPattern.guidance}
            </p>
          </div>
        )}

        {/* Mood-glucose correlation */}
        {correlation.correlation !== "insufficient_data" && (
          <div style={card}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-primary, #111827)",
              }}
            >
              Mood &amp; Glucose Pattern
            </span>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-secondary, #6b7280)",
                margin: "8px 0 4px",
                lineHeight: 1.5,
              }}
            >
              {correlation.description}
            </p>
            <p
              style={{
                fontSize: 13,
                color: "var(--text-secondary, #6b7280)",
                margin: "0 0 8px",
                lineHeight: 1.5,
              }}
            >
              {correlation.insight}
            </p>
            {Object.keys(correlation.avgGlucoseByMood).length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.entries(correlation.avgGlucoseByMood).map(
                  ([m, avg]) => (
                    <div
                      key={m}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 8,
                        background: "var(--bg-primary, #fafafa)",
                        border: "1px solid var(--border-light, #e5e7eb)",
                        fontSize: 12,
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontWeight: 600, textTransform: "capitalize" }}>
                        {m.replace("_", " ")}
                      </div>
                      <div style={{ color: "var(--text-secondary, #6b7280)" }}>
                        {avg} mg/dL
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        )}

        {/* Mood history timeline */}
        {history.length > 0 && (
          <div style={card}>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--text-primary, #111827)",
                display: "block",
                marginBottom: 12,
              }}
            >
              Recent entries
            </span>
            {history.slice(0, 7).map((entry, i) => {
              const opt = MOOD_OPTIONS.find((o) => o.value === entry.mood);
              return (
                <div
                  key={entry.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom:
                      i < Math.min(history.length, 7) - 1
                        ? "1px solid var(--border-light, #e5e7eb)"
                        : "none",
                  }}
                >
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      background: opt?.color ?? "#9ca3af",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: "var(--text-primary, #111827)",
                        textTransform: "capitalize",
                      }}
                    >
                      {entry.mood.replace("_", " ")}
                      {entry.diabetesBurnout && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "#f97316",
                            marginLeft: 6,
                            fontWeight: 400,
                          }}
                        >
                          burnout
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-secondary, #6b7280)",
                      }}
                    >
                      Stress: {entry.stressLevel}/5
                      {entry.glucoseValue != null &&
                        ` | Glucose: ${entry.glucoseValue} ${entry.glucoseUnits === "mmol" ? "mmol/L" : "mg/dL"}`}
                      {entry.sleepQuality && ` | Sleep: ${entry.sleepQuality}`}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--text-secondary, #6b7280)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDate(entry.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Disclaimers */}
        <div
          style={{
            fontSize: 12,
            color: "var(--text-secondary, #6b7280)",
            lineHeight: 1.6,
            marginTop: 24,
            marginBottom: 32,
          }}
        >
          <p style={{ margin: "0 0 8px" }}>{DISCLAIMER}</p>
          <p style={{ margin: 0 }}>{SAFETY_DISCLAIMER}</p>
        </div>
      </div>
    </div>
  );
}
