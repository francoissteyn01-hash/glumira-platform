/**
 * GluMira™ V7 — IOB Hunter v7 · Visitor Entry / Conversion Funnel
 *
 * The unauthenticated demo experience. Two data tracks:
 *   - demoDoses: pre-loaded Patient A regimen (read-only template)
 *   - visitorDoses: what the visitor types in via "Enter my insulin"
 *
 * Buttons:
 *   [Demo data] [Enter my insulin] [Reset to zero] [What-if mode]
 *
 * Conversion flow (per spec):
 *   1. Visitor lands → sees demo Patient A pressure map → impressive
 *   2. Taps "Enter my insulin" → form appears
 *   3. Adds their real regimen dose by dose → graph builds LIVE
 *      (the "Observatory moment")
 *   4. What-if toggle works on their own entered data
 *   5. Attempts to save / access >7d history / run 2nd what-if /
 *      export PDF → signup gate appears (IOBHunterTierGate)
 *   6. Signup → visitor doses become their first saved dose log
 *
 * Visitor data safety:
 *   - demoDoses[] is the template (Patient A) — resets return here
 *   - visitorDoses[] lives in React state + localStorage
 *   - NO Supabase calls for visitors — everything client-side until signup
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  InsulinDose,
  RegionCode,
} from "@/iob-hunter/types";
import {
  listAllRegionalNames,
  listRegionalNames,
  resolveInsulinName,
} from "@/iob-hunter/engine/insulin-regions";

/* ─── localStorage keys ──────────────────────────────────────────────── */
const LS_KEY_VISITOR_DOSES = "glumira.iob-hunter.visitor-doses";
const LS_KEY_VISITOR_REGION = "glumira.iob-hunter.visitor-region";

/* ─── Mode ───────────────────────────────────────────────────────────── */
export type VisitorMode = "demo" | "visitor" | "empty";

export type IOBHunterVisitorEntryProps = {
  /** Pre-loaded demo regimen (Patient A). Shown when mode === "demo". */
  demoDoses: InsulinDose[];
  /** Called whenever the active dose list changes (chart updates). */
  onActiveDosesChange: (doses: InsulinDose[]) => void;
  /** Called when the user hits a signup gate (save / PDF / 2nd what-if / >7d). */
  onSignupGate?: (feature: "save_scenario" | "export_pdf" | "extended_history" | "extra_what_if") => void;
  /** Optional region for ordering the insulin dropdown (defaults to "NA"). */
  defaultRegion?: RegionCode;
}

/* ─── Safe localStorage read/write ───────────────────────────────────── */
function readVisitorDoses(): InsulinDose[] {
  try {
    const raw = localStorage.getItem(LS_KEY_VISITOR_DOSES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeVisitorDoses(doses: InsulinDose[]): void {
  try {
    localStorage.setItem(LS_KEY_VISITOR_DOSES, JSON.stringify(doses));
  } catch {
    /* quota / SSR — ignore */
  }
}

function readVisitorRegion(fallback: RegionCode): RegionCode {
  try {
    const raw = localStorage.getItem(LS_KEY_VISITOR_REGION);
    if (!raw) return fallback;
    return raw as RegionCode;
  } catch {
    return fallback;
  }
}

/* ─── Component ──────────────────────────────────────────────────────── */

export default function IOBHunterVisitorEntry({
  demoDoses,
  onActiveDosesChange,
  onSignupGate,
  defaultRegion = "NA",
}: IOBHunterVisitorEntryProps) {
  const [mode, setMode] = useState<VisitorMode>("demo");
  const [visitorDoses, setVisitorDoses] = useState<InsulinDose[]>(() =>
    readVisitorDoses(),
  );
  const [region, setRegion] = useState<RegionCode>(() =>
    readVisitorRegion(defaultRegion),
  );

  /* ─── Form state for the "Enter my insulin" input row ────────────── */
  const [formInsulin, setFormInsulin] = useState<string>("");
  const [formDose, setFormDose] = useState<string>("");
  const [formTime, setFormTime] = useState<string>("08:00");
  const [formError, setFormError] = useState<string | null>(null);

  /* ─── Hydrate form default insulin from region on mount ──────────── */
  useEffect(() => {
    if (!formInsulin) {
      const regionalNames = listRegionalNames(region);
      if (regionalNames.length > 0) {
        setFormInsulin(regionalNames[0].regional_name);
      }
    }
  }, [region, formInsulin]);

  /* ─── Notify parent whenever active doses change ─────────────────── */
  useEffect(() => {
    if (mode === "demo") {
      onActiveDosesChange(demoDoses);
    } else if (mode === "visitor") {
      onActiveDosesChange(visitorDoses);
    } else {
      onActiveDosesChange([]);
    }
  }, [mode, demoDoses, visitorDoses, onActiveDosesChange]);

  /* ─── Insulin dropdown options (region-aware) ────────────────────── */
  const insulinOptions = useMemo(() => {
    const regional = listRegionalNames(region).map((r) => r.regional_name);
    const rest = listAllRegionalNames().filter((n) => !regional.includes(n));
    return [...regional, ...rest];
  }, [region]);

  /* ─── Handlers ───────────────────────────────────────────────────── */

  const switchToDemo = useCallback(() => {
    setMode("demo");
  }, []);

  const switchToVisitor = useCallback(() => {
    setMode("visitor");
  }, []);

  const resetToZero = useCallback(() => {
    setVisitorDoses([]);
    writeVisitorDoses([]);
    setMode("empty");
  }, []);

  const addDose = useCallback(() => {
    setFormError(null);
    const canonicalName = resolveInsulinName(formInsulin, region);
    if (!canonicalName) {
      setFormError(`"${formInsulin}" isn't recognised. Try a brand name like Fiasp, Levemir, or Humalog.`);
      return;
    }
    const units = Number(formDose);
    if (!Number.isFinite(units) || units <= 0) {
      setFormError("Dose must be a positive number.");
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(formTime)) {
      setFormError("Time must be in HH:mm format.");
      return;
    }

    const newDose: InsulinDose = {
      id: `visitor-${Date.now()}`,
      insulin_name: canonicalName,
      dose_units: units,
      administered_at: formTime,
      dose_type: "bolus", // visitors pick basal via a type toggle in a follow-up
    };

    setVisitorDoses((prev) => {
      const next = [...prev, newDose];
      writeVisitorDoses(next);
      return next;
    });
    setMode("visitor");
    setFormDose("");
    setFormError(null);
  }, [formInsulin, formDose, formTime, region]);

  const removeVisitorDose = useCallback((id: string) => {
    setVisitorDoses((prev) => {
      const next = prev.filter((d) => d.id !== id);
      writeVisitorDoses(next);
      return next;
    });
  }, []);

  const handleSaveAttempt = useCallback(() => {
    onSignupGate?.("save_scenario");
  }, [onSignupGate]);

  const activeDoses = mode === "demo" ? demoDoses : visitorDoses;

  /* ─── Render ──────────────────────────────────────────────────────── */

  return (
    <section
      aria-label="Visitor entry"
      style={{
        background: "var(--bg-card)",
        borderRadius: 12,
        border: "1px solid var(--border-light)",
        padding: "clamp(16px, 4vw, 20px)",
        marginTop: 16,
      }}
    >
      {/* ─── Mode + region switcher ────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          onClick={switchToDemo}
          style={{
            ...pillBtn,
            background: mode === "demo" ? "var(--accent-teal, #2ab5c1)" : "var(--card-hover, #f1f5f9)",
            color: mode === "demo" ? "#fff" : "var(--text-primary)",
            borderColor: mode === "demo" ? "var(--accent-teal, #2ab5c1)" : "var(--border-light)",
          }}
        >
          Demo data
        </button>
        <button
          type="button"
          onClick={switchToVisitor}
          style={{
            ...pillBtn,
            background: mode === "visitor" ? "var(--accent-teal, #2ab5c1)" : "var(--card-hover, #f1f5f9)",
            color: mode === "visitor" ? "#fff" : "var(--text-primary)",
            borderColor: mode === "visitor" ? "var(--accent-teal, #2ab5c1)" : "var(--border-light)",
          }}
        >
          Enter my insulin
        </button>
        <button
          type="button"
          onClick={resetToZero}
          style={pillBtn}
          aria-label="Reset to zero — clear all visitor doses"
        >
          Reset to zero
        </button>

        <div style={{ flex: 1 }} />

        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontSize: 11,
            color: "var(--text-faint)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          Region
          <select
            value={region}
            onChange={(e) => {
              const next = e.target.value as RegionCode;
              setRegion(next);
              try { localStorage.setItem(LS_KEY_VISITOR_REGION, next); } catch { /* ignore */ }
            }}
            aria-label="Region"
            style={{ ...inputStyle, minWidth: 72, minHeight: 32 }}
          >
            <option value="AF">AF</option>
            <option value="AP">AP</option>
            <option value="EU">EU</option>
            <option value="LA">LA</option>
            <option value="ME">ME</option>
            <option value="NA">NA</option>
            <option value="UK">UK</option>
          </select>
        </label>
      </div>

      {/* ─── Headline prompt (observatory moment) ──────────────────── */}
      {mode === "demo" && (
        <p
          style={{
            margin: "0 0 14px",
            fontSize: 13,
            color: "var(--text-secondary)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            lineHeight: 1.5,
          }}
        >
          This is Patient A — an anonymised 9-year-old T1D demo regimen. Tap{" "}
          <strong>Enter my insulin</strong> to build your own pressure map and
          watch the curve appear as you add each dose.
        </p>
      )}

      {mode === "empty" && (
        <p
          style={{
            margin: "0 0 14px",
            fontSize: 13,
            color: "var(--text-secondary)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
            lineHeight: 1.5,
          }}
        >
          Blank canvas. Start adding doses below — your pressure map will build
          live as you go.
        </p>
      )}

      {/* ─── Dose entry form (visitor mode) ───────────────────────── */}
      {(mode === "visitor" || mode === "empty") && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            padding: "14px 16px",
            background: "var(--card-hover, #f8fafc)",
            borderRadius: 10,
            border: "1px solid var(--border-light)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr auto",
              gap: 8,
            }}
          >
            <select
              value={formInsulin}
              onChange={(e) => setFormInsulin(e.target.value)}
              aria-label="Insulin"
              style={inputStyle}
            >
              {insulinOptions.map((name) => {
                const canonical = resolveInsulinName(name, region);
                const label =
                  canonical && canonical !== name ? `${name} (${canonical})` : name;
                return (
                  <option key={name} value={name}>
                    {label}
                  </option>
                );
              })}
            </select>

            <input
              type="number"
              inputMode="decimal"
              step="0.25"
              min="0"
              placeholder="Dose (U)"
              value={formDose}
              onChange={(e) => setFormDose(e.target.value)}
              aria-label="Dose units"
              style={{ ...inputStyle, textAlign: "right" }}
            />

            <input
              type="time"
              value={formTime}
              onChange={(e) => setFormTime(e.target.value)}
              aria-label="Time"
              style={inputStyle}
            />

            <button
              type="button"
              onClick={addDose}
              style={{
                ...pillBtn,
                background: "var(--accent-teal, #2ab5c1)",
                color: "#fff",
                borderColor: "var(--accent-teal, #2ab5c1)",
                minWidth: 60,
              }}
            >
              + Add
            </button>
          </div>

          {formError && (
            <p
              role="alert"
              style={{
                margin: 0,
                fontSize: 12,
                color: "#EF4444",
                fontFamily: "'DM Sans', system-ui, sans-serif",
              }}
            >
              {formError}
            </p>
          )}

          {/* ─── Visitor's added doses ──────────────────────────── */}
          {visitorDoses.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                marginTop: 4,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-faint)",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              >
                Added doses ({visitorDoses.length})
              </p>
              {visitorDoses.map((d) => (
                <div
                  key={d.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 0",
                    fontSize: 12,
                    color: "var(--text-primary)",
                    fontFamily: "'DM Sans', system-ui, sans-serif",
                  }}
                >
                  <span>
                    {d.insulin_name} {d.dose_units}U @ {d.administered_at}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeVisitorDose(d.id)}
                    aria-label={`Remove ${d.insulin_name}`}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#EF4444",
                      fontSize: 14,
                      cursor: "pointer",
                      padding: "0 8px",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Signup gate CTA ────────────────────────────────────────── */}
      {(mode === "visitor" || mode === "empty") && activeDoses.length > 0 && (
        <div
          style={{
            marginTop: 16,
            padding: "14px 16px",
            borderRadius: 10,
            background: "linear-gradient(135deg, rgba(42,181,193,0.08) 0%, rgba(26,42,94,0.04) 100%)",
            border: "1px solid var(--border-light)",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "var(--text-primary)",
              fontFamily: "'DM Sans', system-ui, sans-serif",
              lineHeight: 1.5,
            }}
          >
            <strong>Save your pressure map</strong> and unlock 30-day history,
            AI insights, and unlimited what-if analysis.
          </p>
          <button
            type="button"
            onClick={handleSaveAttempt}
            style={{
              marginTop: 10,
              minHeight: 44,
              padding: "0 20px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #2ab5c1 0%, #1A2A5E 100%)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            Start 30-day free trial →
          </button>
        </div>
      )}
    </section>
  );
}

/* ─── Shared inline styles ───────────────────────────────────────────── */

const pillBtn: React.CSSProperties = {
  minHeight: 38,
  padding: "0 16px",
  borderRadius: 999,
  border: "1px solid var(--border-light)",
  background: "var(--card-hover, #f1f5f9)",
  color: "var(--text-primary)",
  fontSize: 13,
  fontWeight: 600,
  fontFamily: "'DM Sans', system-ui, sans-serif",
  cursor: "pointer",
};

const inputStyle: React.CSSProperties = {
  minHeight: 38,
  padding: "0 10px",
  borderRadius: 6,
  border: "1px solid var(--border-light)",
  background: "var(--bg-card)",
  color: "var(--text-primary)",
  fontSize: 13,
  fontFamily: "'DM Sans', system-ui, sans-serif",
};
