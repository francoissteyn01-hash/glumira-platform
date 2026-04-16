/**
 * GluMira™ V7 — IOB Hunter Page (v7 + observatory visualization)
 *
 * Wires the rich `IOBTerrainChart` (Master Chart Component, 690 lines —
 * pressure-band shading, per-insulin stacked layers, danger-window
 * brackets, abbreviated dose markers, current-time marker, dynamic
 * subtitle, individual-curves view tab,
 * density bar, 60-second insight panel, what-if panel) into the v7
 * IOB Hunter route.
 *
 * The legacy `IOBTerrainChart` consumes `BasalEntry[]` + `BolusEntry[]`
 * with `pharmacology: InsulinPharmacology` from `@/lib/pharmacokinetics`.
 * The v7 module uses `InsulinDose[]` with `insulin_name` brand-name
 * strings + a separate profile lookup. The adapter below converts
 * v7 → legacy by mapping canonical brand names to legacy profile keys.
 *
 * Observatory design profile per `10_Visual-Design-Philosophy.txt`:
 * deep navy night sky, steel-blue → teal gradient body, amber as the
 * singular warm accent. The traffic-light palette from my earlier
 * IOBHunterChart.tsx is withdrawn — IOBTerrainChart already uses the
 * correct observatory tokens.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useCallback, useMemo, useState } from "react";
import {
  buildDensityMap,
  DensityMapClinical,
  DensityMapKids,
} from "@/iob-hunter";
import { useAuth } from "@/hooks/useAuth";
import { DISCLAIMER } from "@/lib/constants";
import IOBTerrainChart from "@/components/charts/IOBTerrainChart";
import BasalActivityChart from "@/iob-hunter/components/BasalActivityChart";
import {
  INSULIN_PROFILES as LEGACY_INSULIN_PROFILES,
  type InsulinPharmacology,
} from "@/lib/pharmacokinetics";
import {
  DEMO_PATIENT_A_V7,
  IOBHunterReport,
  IOBHunterTierGate,
  IOBHunterVisitorEntry,
  INSULIN_PROFILES as V7_INSULIN_PROFILES,
  computeGraphBounds,
  detectRiskZones,
  generatePerDoseActivityCurves,
  generateSuggestedTotalCurve,
  getDemoPatientADoses,
  suggestEqualSpacedSchedule,
  useIOBHunter,
} from "@/iob-hunter";
import type { InsulinDose } from "@/iob-hunter";

/* ─── v7 brand_name → legacy profile key map ──────────────────────── */
const V7_NAME_TO_LEGACY_KEY: Record<string, string> = {
  "Actrapid":  "regular",
  "Apidra":    "glulisine",
  "Basaglar":  "glargine_u100",
  "Fiasp":     "fiasp",
  "Humalog":   "lispro",
  "Humulin N": "nph",
  "Insulatard": "nph",
  "Lantus":    "glargine_u100",
  "Levemir":   "detemir",
  "Lyumjev":   "lyumjev",
  "NovoRapid": "aspart",
  "Toujeo":    "glargine_u300",
  "Tresiba":   "degludec",
};

/* ─── Adapter: v7 InsulinDose[] → legacy basal/bolus entries ──────── */

type LegacyBasalEntry = {
  insulinName: string;
  dose: number;
  time: string;
  pharmacology: InsulinPharmacology;
}

type LegacyBolusEntry = {
  mealType?: string;
} & LegacyBasalEntry

function v7ToLegacyEntries(doses: InsulinDose[]): {
  basal: LegacyBasalEntry[];
  bolus: LegacyBolusEntry[];
} {
  const basal: LegacyBasalEntry[] = [];
  const bolus: LegacyBolusEntry[] = [];

  for (const d of doses) {
    const legacyKey = V7_NAME_TO_LEGACY_KEY[d.insulin_name];
    if (!legacyKey) continue;
    const pharmacology = (LEGACY_INSULIN_PROFILES as Record<string, InsulinPharmacology>)[legacyKey];
    if (!pharmacology) continue;

    // administered_at is "HH:mm" for v7 demo data
    const time = /^\d{2}:\d{2}$/.test(d.administered_at)
      ? d.administered_at
      : new Date(d.administered_at)
          .toTimeString()
          .slice(0, 5);

    const entry: LegacyBasalEntry = {
      insulinName: d.insulin_name,
      dose: d.dose_units,
      time,
      pharmacology,
    };

    if (d.dose_type === "basal_injection") {
      basal.push(entry);
    } else {
      bolus.push({ ...entry, mealType: undefined });
    }
  }
  return { basal, bolus };
}

/* ─── Tier detection ──────────────────────────────────────────────── */
type TierGateFeature = React.ComponentProps<typeof IOBHunterTierGate>["feature"];

export default function IOBHunterPage() {
  const { session } = useAuth();
  const isAuthenticated = session != null;

  /* ─── Dual-state dose model for authenticated What-if workflow ─
   *
   * `actualDoses` — IMMUTABLE source of truth. For unauthenticated users
   *   this is the Patient A demo; once Supabase wiring lands, it'll be
   *   the user's real saved regimen. Never mutated by what-if edits.
   *
   * `workingDoses` — mutable deep clone. What the user edits in what-if
   *   mode (drag timings, tweak units, swap insulins). Reset on demand.
   *
   * `mode` — `"actual"` or `"whatif"`. Drives which set the chart reads.
   *
   * `activeDoses` — derived: the doses currently visible. All existing
   *   downstream code (hook, report, adapters) uses this name unchanged.
   */
  const [actualDoses, setActualDoses] = useState<InsulinDose[]>(() =>
    getDemoPatientADoses(),
  );
  const [workingDoses, setWorkingDoses] = useState<InsulinDose[]>(() =>
    getDemoPatientADoses(),
  );
  const [mode, setMode] = useState<"actual" | "whatif">("actual");
  const activeDoses = useMemo(
    () => (mode === "actual" ? actualDoses : workingDoses),
    [mode, actualDoses, workingDoses],
  );

  /* ─── Density map view toggle ────────────────────────────────── */
  const [densityView, setDensityView] = useState<"clinical" | "kids">("clinical");

  /* ─── Tier gate overlay state ────────────────────────────────── */
  const [gateFeature, setGateFeature] = useState<TierGateFeature | null>(null);

  /* ─── v7 engine drives EVERYTHING (chart + report) ────────────── */
  // CRITICAL: pass patient weight so albumin-bound insulins (Levemir) get
  // the correct dose-dependent DOA from Plank 2005. Without this the
  // engine falls back to 70kg, which silently collapses Levemir DOA to
  // ~5.7h for any sub-7U dose and the curve drops to zero between
  // basal injections instead of showing the sustained baseline.
  // Auto-window: the hook computes startHour/endHour/cycles from the
  // regimen + patient weight. For a Levemir-only basal (~12h DOA) this
  // gives ~30h of chart instead of the old hardcoded 48h — eliminating
  // the wasted right-hand whitespace and rendering the full silent tail.
  // Override explicitly only if you want a different zoom.
  const { curve, kpis, stackingAlerts, basalAnalysis, maxIOB } = useIOBHunter(
    activeDoses,
    {
      resolutionMinutes: 5,
      patientWeightKg: DEMO_PATIENT_A_V7.weight_kg,
    },
  );

  /* ─── Density map — derived from the existing curve ──────────── */
  const densityMap = useMemo(
    () => buildDensityMap(curve || [], kpis?.total_daily_basal ?? 1),
    [curve, kpis],
  );

  /* ─── Per-dose activity curves for the BasalActivityChart ────────
   *
   * The new chart overlays one bell-shaped curve per dose (U/h activity
   * rate), NOT a combined IOB line. Uses the same weight-aware engine
   * so Levemir DOA comes from Plank 2005 interpolation.
   */
  // BasalActivityChart shows BASAL curves only — one hill per Levemir/etc
  // injection. Boluses (Fiasp, Actrapid) are NOT plotted here; they have
  // their own visualisation pathway.
  const basalDoses = useMemo(
    () => activeDoses.filter((d) => d.dose_type === "basal_injection"),
    [activeDoses],
  );
  const activityBounds = useMemo(
    () => computeGraphBounds(basalDoses, V7_INSULIN_PROFILES, DEMO_PATIENT_A_V7.weight_kg),
    [basalDoses],
  );
  const activityCurves = useMemo(
    () => generatePerDoseActivityCurves(
      basalDoses, V7_INSULIN_PROFILES,
      activityBounds.startHour, activityBounds.endHour,
      15, activityBounds.cycles,
      DEMO_PATIENT_A_V7.weight_kg,
    ),
    [basalDoses, activityBounds],
  );
  const riskZones = useMemo(() => detectRiskZones(activityCurves), [activityCurves]);

  /* ─── Comparison curves for What-if mode ────────────────────────
   *  When the user is in what-if mode, render the `actualDoses`
   *  curves underneath as a faded "before" layer so the delta
   *  between original and edited is visually obvious. In actual
   *  mode this is undefined and the chart renders normally. */
  const actualBasalDoses = useMemo(
    () => actualDoses.filter((d) => d.dose_type === "basal_injection"),
    [actualDoses],
  );
  const actualActivityCurves = useMemo(
    () => generatePerDoseActivityCurves(
      actualBasalDoses, V7_INSULIN_PROFILES,
      activityBounds.startHour, activityBounds.endHour,
      15, activityBounds.cycles,
      DEMO_PATIENT_A_V7.weight_kg,
    ),
    [actualBasalDoses, activityBounds],
  );
  const comparisonCurves = useMemo(
    () => (mode === "whatif" ? actualActivityCurves : undefined),
    [mode, actualActivityCurves],
  );

  /* Chart 1 uses the full basal-day window so curves are never clipped.
   * (Earlier attempt cropped to the stacking band — that cut off the
   * 06:30 ramp and 21:00 tail. User flagged as clipped info.) */
  const chart1Bounds = activityBounds;

  /* Chart 2 — Tresiba demo: a single 16U dose at 17:00 rendered using
   * the same gold-standard BasalActivityChart pipeline. Shows the 42h
   * ultra-long-acting profile on its own x-axis so users can see what
   * one Tresiba dose looks like versus the 3-dose Levemir regimen above.
   */
  const tresibaDoses = useMemo<InsulinDose[]>(() => [
    {
      id: "demo-tresiba",
      insulin_name: "Tresiba",
      dose_units: 16,
      administered_at: "17:00",
      dose_type: "basal_injection",
    },
  ], []);
  const chart2Bounds = useMemo(
    () => computeGraphBounds(tresibaDoses, V7_INSULIN_PROFILES, DEMO_PATIENT_A_V7.weight_kg),
    [tresibaDoses],
  );
  const tresibaCurves = useMemo(
    () => generatePerDoseActivityCurves(
      tresibaDoses, V7_INSULIN_PROFILES,
      chart2Bounds.startHour, chart2Bounds.endHour,
      15, chart2Bounds.cycles,
      DEMO_PATIENT_A_V7.weight_kg,
    ),
    [tresibaDoses, chart2Bounds],
  );
  const tresibaRiskZones = useMemo(() => detectRiskZones(tresibaCurves), [tresibaCurves]);

  /* Kept the suggested-schedule helpers exported; not rendered here
   * while Chart 2 is the Tresiba comparison. Resurrect with a toggle
   * when the regimen-suggestion feature comes back. */
  const suggestedLine = useMemo(() => {
    const suggestedDoses = suggestEqualSpacedSchedule(basalDoses);
    return generateSuggestedTotalCurve(
      suggestedDoses, V7_INSULIN_PROFILES,
      activityBounds.startHour, activityBounds.endHour,
      15, activityBounds.cycles,
    );
  }, [basalDoses, activityBounds]);
  void suggestedLine;  // Retained for upcoming Suggested-timing toggle.

  /* ─── v7 data for the chart (bypasses legacy engine) ─────────── */
  const v7ChartData = useMemo(() => ({
    curve,
    doses: activeDoses.map((d) => ({
      id: d.id,
      insulin_name: d.insulin_name,
      dose_units: d.dose_units,
      administered_at: d.administered_at,
      dose_type: d.dose_type,
    })),
    maxIOB,
  }), [curve, activeDoses, maxIOB]);

  /* ─── Legacy adapter kept as fallback only ───────────────────── */
  const legacyEntries = useMemo(() => v7ToLegacyEntries(activeDoses), [activeDoses]);

  const profileForChart = useMemo(
    () => ({
      name: DEMO_PATIENT_A_V7.name,
      country: "ZA",
      glucoseUnit: "mmol/L" as const,
    }),
    [],
  );

  /* ─── Handlers ────────────────────────────────────────────────── */
  // Visitor entry updates both sides — visitors have no what-if split.
  // Their "actual" IS whatever they've typed into the entry form.
  const handleVisitorDosesChange = useCallback((doses: InsulinDose[]) => {
    setActualDoses(doses);
    setWorkingDoses(doses);
  }, []);

  // What-if mode — immutable actual, mutable working clone.
  const enterWhatIf = useCallback(() => {
    setWorkingDoses(structuredClone(actualDoses));
    setMode("whatif");
  }, [actualDoses]);

  const exitWhatIf = useCallback(() => {
    setMode("actual");
  }, []);

  const resetWhatIf = useCallback(() => {
    setWorkingDoses(structuredClone(actualDoses));
    // Stay in what-if mode — this is a "throw away my edits" button.
  }, [actualDoses]);

  // Save triggers the tier gate (free: 1 saved scenario, pro: 5, clinical: ∞).
  // Supabase wiring lands with the persistence layer — for now it surfaces
  // the signup/upgrade gate so the conversion funnel runs.
  const saveScenario = useCallback(() => {
    setGateFeature("save_scenario");
  }, []);

  const handleTierGate = useCallback(
    (
      feature:
        | "save_scenario"
        | "extra_what_if"
        | "export_pdf"
        | "extended_history"
        | "ai_insights",
    ) => {
      setGateFeature(feature);
    },
    [],
  );

  const closeTierGate = useCallback(() => setGateFeature(null), []);
  const handleSignUp = useCallback(() => {
    window.location.href = "/auth";
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "clamp(16px, 4vw, 32px)",
        }}
      >
        {/* ─── Header ─────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(24px, 6vw, 32px)",
              fontWeight: 700,
              color: "var(--text-primary)",
              margin: "0 0 4px",
            }}
          >
            IOB Hunter™
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-secondary)",
              margin: 0,
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            The science of insulin, made visible — 24-hour pressure map grounded
            in published pharmacokinetic data.
          </p>
        </div>

        {/* ─── Disclaimer ─────────────────────────────────────── */}
        <div
          style={{
            borderRadius: 8,
            background: "var(--disclaimer-bg)",
            border: "1px solid var(--disclaimer-border)",
            padding: "10px 14px",
            marginBottom: 20,
            fontSize: 12,
            color: "var(--disclaimer-text)",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}
        >
          {DISCLAIMER}
        </div>

        {/* ─── Patient header card ────────────────────────────── */}
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: 12,
            border: "1px solid var(--border-light)",
            padding: "16px 20px",
            marginBottom: 16,
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
            {isAuthenticated ? "Your regimen" : "Demo regimen"}
          </p>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text-primary)",
              fontFamily: "'Playfair Display', serif",
            }}
          >
            {DEMO_PATIENT_A_V7.name}
          </p>
          <p
            style={{
              margin: "2px 0 0",
              fontSize: 13,
              color: "var(--text-secondary)",
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            {DEMO_PATIENT_A_V7.therapy} · {DEMO_PATIENT_A_V7.diet}
          </p>
        </div>

        {/* ─── My-data / What-if toggle (authenticated users) ───
         *  Visitors get their mode toggle via IOBHunterVisitorEntry
         *  (Demo data ↔ Enter my insulin). Authenticated users get
         *  the actual/whatif split here — `actualDoses` stays immutable,
         *  `workingDoses` is the mutable clone that's edited in what-if.
         */}
        {isAuthenticated && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
              padding: "10px 14px",
              background: "var(--bg-card)",
              border: "1px solid var(--border-light)",
              borderRadius: 12,
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}
          >
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={exitWhatIf}
                aria-pressed={mode === "actual"}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.35)",
                  background: mode === "actual" ? "#0D2149" : "#F1F5F9",
                  color: mode === "actual" ? "#fff" : "#0D2149",
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer",
                  letterSpacing: 0.3,
                }}
              >
                ● My data
              </button>
              <button
                type="button"
                onClick={mode === "whatif" ? undefined : enterWhatIf}
                aria-pressed={mode === "whatif"}
                style={{
                  padding: "6px 14px",
                  borderRadius: 999,
                  border: "1px solid rgba(148,163,184,0.35)",
                  background: mode === "whatif" ? "#2E9E5A" : "#F1F5F9",
                  color: mode === "whatif" ? "#fff" : "#0D2149",
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: mode === "whatif" ? "default" : "pointer",
                  letterSpacing: 0.3,
                }}
              >
                ○ What-if
              </button>
            </div>
            {mode === "whatif" && (
              <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
                <button
                  type="button"
                  onClick={resetWhatIf}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: "1px solid rgba(148,163,184,0.45)",
                    background: "#fff",
                    color: "#0D2149",
                    fontWeight: 500,
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  ⟲ Reset
                </button>
                <button
                  type="button"
                  onClick={exitWhatIf}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: "1px solid rgba(148,163,184,0.45)",
                    background: "#fff",
                    color: "#0D2149",
                    fontWeight: 500,
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  Return to my data
                </button>
                <button
                  type="button"
                  onClick={saveScenario}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: "1px solid #2E9E5A",
                    background: "#2E9E5A",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  Save scenario
                </button>
              </div>
            )}
            <span
              style={{
                fontSize: 11,
                color: "var(--text-secondary)",
                marginLeft: mode === "whatif" ? 0 : "auto",
              }}
            >
              {mode === "actual"
                ? "Viewing your actual regimen — tap What-if to explore timing changes"
                : "Editing a copy — your real data is safe"}
            </span>
          </div>
        )}

        {/* ─── Master visualization — two-chart responsive grid ────
         *  Laptop: Chart 1 | Chart 2 side by side, KPI row below.
         *  Mobile: Chart 1 → KPI row → Chart 2 stacked.
         *  See index.css for `.iob-chart-grid` media query.
         */}
        <div className="iob-chart-grid">
          <div className="iob-chart-1">
            <BasalActivityChart
              curves={activityCurves}
              comparisonCurves={comparisonCurves}
              riskZones={riskZones}
              startHour={chart1Bounds.startHour}
              endHour={chart1Bounds.endHour}
              title={
                mode === "whatif"
                  ? "Basal activity — what-if (original faded behind)"
                  : "Basal activity — current regimen"
              }
            />
          </div>

          <div className="iob-kpi-row">
            <KpiCardRow kpis={kpis} label="Current regimen" />
          </div>

          <div className="iob-chart-2">
            <BasalActivityChart
              curves={tresibaCurves}
              riskZones={tresibaRiskZones}
              startHour={chart2Bounds.startHour}
              endHour={chart2Bounds.endHour}
              title="Tresiba 16U at 17:00 — 42h ultra-long profile"
            />
          </div>

          <div className="iob-kpi-row">
            <TresibaKpiRow curves={tresibaCurves} />
          </div>
        </div>

        {/* ─── Visitor entry (unauthenticated only) ──────────── */}
        {!isAuthenticated && (
          <IOBHunterVisitorEntry
            demoDoses={getDemoPatientADoses()}
            onActiveDosesChange={handleVisitorDosesChange}
            onSignupGate={handleTierGate}
            defaultRegion="NA"
          />
        )}

        {/* ─── Clinical report (v7 engine) ───────────────────── */}
        <IOBHunterReport
          doses={activeDoses}
          profiles={V7_INSULIN_PROFILES}
          kpis={kpis}
          basalAnalysis={basalAnalysis}
          stackingAlerts={stackingAlerts}
        />

        {/* ─── Density Map section ──────────────────────────────── */}
        <div style={{ marginTop: 32, marginBottom: 48 }}>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
            <button
              onClick={() => setDensityView("clinical")}
              style={{
                padding: "0.5rem 1rem",
                background: densityView === "clinical" ? "#1a2a5e" : "#f0f2f7",
                color: densityView === "clinical" ? "#fff" : "#666",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontWeight: densityView === "clinical" ? 600 : 400,
              }}
            >
              Clinical View
            </button>
            <button
              onClick={() => setDensityView("kids")}
              style={{
                padding: "0.5rem 1rem",
                background: densityView === "kids" ? "#1a2a5e" : "#f0f2f7",
                color: densityView === "kids" ? "#fff" : "#666",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
                fontFamily: "'DM Sans', system-ui, sans-serif",
                fontWeight: densityView === "kids" ? 600 : 400,
              }}
            >
              Kids View
            </button>
          </div>

          {densityView === "clinical" ? (
            <DensityMapClinical densityMap={densityMap} />
          ) : (
            <DensityMapKids densityMap={densityMap} />
          )}
        </div>

        {/* Spacer for mobile bottom nav */}
        <div style={{ height: 80 }} />
      </div>

      {/* ─── Tier gate overlay ─────────────────────────────────── */}
      {gateFeature && (
        <IOBHunterTierGate
          feature={gateFeature}
          onClose={closeTierGate}
          onSignUp={handleSignUp}
        />
      )}
    </div>
  );
}

/* ─── KPI row ────────────────────────────────────────────────────────
 *  Four cards that double as chart-boundary anchors:
 *    PEAK PRESSURE · PEAK WINDOW · LOWEST PRESSURE · STRONG / OVERLAP
 *  Sits between Chart 1 (left) and Chart 2 (right) on laptop, inline
 *  stack on mobile. STRONG/OVERLAP is clamped to ≤ 24h at the engine.
 */
type KpiRowProps = {
  kpis: {
    peak_iob: number;
    peak_hour: number;
    trough_iob: number;
    trough_hour: number;
    hours_strong_or_overlap: number;
  };
  label?: string;
};

function fmtHourShort(h: number): string {
  const wrapped = ((h % 24) + 24) % 24;
  const hh = Math.floor(wrapped);
  const mm = Math.round((wrapped - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function KpiCardRow({ kpis, label }: KpiRowProps) {
  const cards = [
    { label: "PEAK PRESSURE",  value: `${kpis.peak_iob.toFixed(1)}U` },
    { label: "PEAK WINDOW",    value: fmtHourShort(kpis.peak_hour) },
    { label: "LOWEST PRESSURE", value: `${kpis.trough_iob.toFixed(1)}U @ ${fmtHourShort(kpis.trough_hour)}` },
    { label: "STRONG / OVERLAP", value: `${kpis.hours_strong_or_overlap.toFixed(1)}h` },
  ];
  return (
    <>
      {label && (
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
          color: "#64748B", marginBottom: 8,
          fontFamily: "'DM Sans', system-ui, sans-serif",
          textTransform: "uppercase",
        }}>
          {label}
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
        }}
      >
      {cards.map((c) => (
        <div
          key={c.label}
          style={{
            background: "#fff",
            border: "1px solid rgba(148,163,184,0.35)",
            borderRadius: 10,
            padding: "14px 16px",
          }}
        >
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: 0.6,
            color: "#64748B",
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            {c.label}
          </div>
          <div style={{
            marginTop: 6,
            fontSize: 20, fontWeight: 700,
            fontFamily: "'JetBrains Mono', monospace",
            color: "#0D2149",
          }}>
            {c.value}
          </div>
        </div>
      ))}
      </div>
    </>
  );
}

/* ─── Tresiba single-dose KPI row ──────────────────────────────────
 *  Lightweight summary derived directly from the per-dose activity
 *  curve — no need for the summed-IOB engine since Tresiba Chart 2
 *  shows a single insulin. Keeps the gold-standard "KPI row below
 *  every chart" rule honoured with numbers that actually match the
 *  curve on screen.
 */
function TresibaKpiRow({ curves }: { curves: Array<{ peak_rate_uph: number; dose_units: number; administered_at: string; points: Array<{ hour: number; rate_uph: number }> }> }) {
  const c = curves[0];
  if (!c) return null;

  let peakHour = 0;
  let peakRate = 0;
  for (const p of c.points) {
    if (p.rate_uph > peakRate) { peakRate = p.rate_uph; peakHour = p.hour; }
  }

  // DOA = time from injection to when rate returns to ~0 (below 0.01 U/h).
  const injectionHour = Number(c.administered_at.slice(0, 2)) + Number(c.administered_at.slice(3)) / 60;
  let endHour = injectionHour;
  for (const p of c.points) {
    if (p.rate_uph >= 0.01) endHour = p.hour;
  }
  const doaHours = Math.max(0, endHour - injectionHour);

  const cards = [
    { label: "DOSE",          value: `${c.dose_units}U` },
    { label: "INJECTED",      value: c.administered_at },
    { label: "PEAK RATE",     value: `${peakRate.toFixed(2)} U/h @ ${fmtHourShort(peakHour)}` },
    { label: "DURATION",      value: `${doaHours.toFixed(1)}h` },
  ];
  return (
    <>
      <div style={{
        fontSize: 11, fontWeight: 600, letterSpacing: 0.5,
        color: "#64748B", marginBottom: 8,
        fontFamily: "'DM Sans', system-ui, sans-serif",
        textTransform: "uppercase",
      }}>
        Tresiba 16U · 17:00 · ultra-long-acting basal
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
        }}
      >
        {cards.map((c) => (
          <div
            key={c.label}
            style={{
              background: "#fff",
              border: "1px solid rgba(148,163,184,0.35)",
              borderRadius: 10,
              padding: "14px 16px",
            }}
          >
            <div style={{
              fontSize: 10, fontWeight: 600, letterSpacing: 0.6,
              color: "#64748B",
              fontFamily: "'DM Sans', system-ui, sans-serif",
            }}>
              {c.label}
            </div>
            <div style={{
              marginTop: 6,
              fontSize: 20, fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              color: "#0D2149",
            }}>
              {c.value}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
