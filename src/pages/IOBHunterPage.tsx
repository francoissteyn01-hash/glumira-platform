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
import { useAuth } from "@/hooks/useAuth";
import { DISCLAIMER } from "@/lib/constants";
import IOBTerrainChart from "@/components/charts/IOBTerrainChart";
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
  getDemoPatientADoses,
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

  /* ─── Active dose list (v7 shape, used by report + adapter) ─── */
  const [activeDoses, setActiveDoses] = useState<InsulinDose[]>(() =>
    getDemoPatientADoses(),
  );

  /* ─── Tier gate overlay state ────────────────────────────────── */
  const [gateFeature, setGateFeature] = useState<TierGateFeature | null>(null);

  /* ─── v7 engine drives the report (KPIs, basal, stacking) ───── */
  const { kpis, stackingAlerts, basalAnalysis } = useIOBHunter(activeDoses);

  /* ─── Legacy adapter for IOBTerrainChart ─────────────────────── */
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
  const handleVisitorDosesChange = useCallback((doses: InsulinDose[]) => {
    setActiveDoses(doses);
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

        {/* ─── Master visualization (the bird's-eye view) ────── */}
        <IOBTerrainChart
          profile={profileForChart}
          basalEntries={legacyEntries.basal}
          bolusEntries={legacyEntries.bolus}
          cycles={2}
          showInsight={true}
          showDensityBar={true}
          showWhatIf={true}
          tier={isAuthenticated ? "pro" : "free"}
        />

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
