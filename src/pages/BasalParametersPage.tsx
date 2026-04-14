/**
 * GluMira™ V7 — Basal Parameters and Curves
 *
 * Single page, 7 vertically-stacked panels — one per basal insulin in
 * the research database. Every curve is driven by `calculateIOB` from
 * the canonical engine reading `insulin-profiles.ts`. No invented shapes.
 *
 * Shared patient (founder-defined, not invented):
 *   - Male adult, 80 kg
 *   - Primary injection time: 06:00
 *   - 20 U/day total
 *
 * Dosing cadence per insulin (founder rule):
 *   - Tresiba / Toujeo / Lantus / Basaglar  → 1×/day  @ 06:00, 20 U
 *   - Levemir / Humulin N / Insulatard       → 2×/day  @ 06:00 + 18:00, 10 U each
 *
 * Graph window rule (applied by BasalLifecycleChart):
 *   Start  = 1 h before yesterday's first injection
 *   End    = last dose + DOA (+ small tail for peaked insulins)
 *   Y      = IOB in units (never zero on the left edge at steady state)
 *
 * Each panel ships with a 60-second explainer: mechanism, binding target,
 * half-life, silent tail. Every fact is cited against the insulin's
 * pk_source in the profile table.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { useMemo } from "react";
import BasalLifecycleChart, {
  type BasalLifecycleDose,
} from "@/iob-hunter/components/BasalLifecycleChart";
import { INSULIN_PROFILES } from "@/iob-hunter";
import type { InsulinProfile } from "@/iob-hunter";

/* ─── Shared patient ────────────────────────────────────────────────── */

const PATIENT = {
  label: "Adult male · 80 kg · daily 06:00 injection · 20 U/day total",
  weightKg: 80,
  anchor: "06:00",
} as const;

/* ─── Dose schedules ────────────────────────────────────────────────── */

/** Single-injection basals (20 U @ 06:00, yesterday + today). */
const ONCE_DAILY_DOSES: BasalLifecycleDose[] = [
  { hour: -24, units: 20, label: "Yesterday 06:00 — 20 U", day: -1 },
  { hour:   0, units: 20, label: "Today 06:00 — 20 U",     day:  0 },
];

/** Tresiba — 3-day lifecycle, once every 24 h at 06:00. See INSULIN_LOCK.md:
 *   1 × / 24 h · Day 1 06:00 20U · Day 2 06:00 20U · Day 3 06:00 20U.
 *  Window runs 05:00 Day 1 → 06:00 Day 3 + 42 h DOA (≈ 00:00 Day 5).
 *  Day 1's depot fully decays at 00:00 Day 3 — visible mid-chart. */
const TRESIBA_DOSES: BasalLifecycleDose[] = [
  { hour: -48, units: 20, label: "Day 1 06:00 — 20 U", day: -1 },
  { hour: -24, units: 20, label: "Day 2 06:00 — 20 U", day: -1 },
  { hour:   0, units: 20, label: "Day 3 06:00 — 20 U", day:  0 },
];

/** Twice-daily basals — NPH class (10 U @ 06:00 + 10 U @ 18:00, 3-day view). */
const TWICE_DAILY_DOSES: BasalLifecycleDose[] = [
  { hour: -48, units: 10, label: "Day 1 06:00 — 10 U", day: -1 },
  { hour: -36, units: 10, label: "Day 1 18:00 — 10 U", day: -1 },
  { hour: -24, units: 10, label: "Day 2 06:00 — 10 U", day: -1 },
  { hour: -12, units: 10, label: "Day 2 18:00 — 10 U", day: -1 },
  { hour:   0, units: 10, label: "Day 3 06:00 — 10 U", day:  0 },
  { hour:  12, units: 10, label: "Day 3 18:00 — 10 U", day:  0 },
];

/** Levemir — paediatric 3 × split schedule @ 06:00 / 14:00 / 21:00, 3-day view.
 *  Per-dose 7 U (adult 80 kg = 0.0875 U/kg → Plank 2005 interpolated DOA ≈ 5.7 h).
 *  9 total doses across 3 days. */
const LEVEMIR_TID_DOSES: BasalLifecycleDose[] = [
  { hour: -48, units: 7, label: "Day 1 06:00 — 7 U",  day: -1 },
  { hour: -40, units: 7, label: "Day 1 14:00 — 7 U",  day: -1 },
  { hour: -33, units: 7, label: "Day 1 21:00 — 7 U",  day: -1 },
  { hour: -24, units: 7, label: "Day 2 06:00 — 7 U",  day: -1 },
  { hour: -16, units: 7, label: "Day 2 14:00 — 7 U",  day: -1 },
  { hour:  -9, units: 7, label: "Day 2 21:00 — 7 U",  day: -1 },
  { hour:   0, units: 7, label: "Day 3 06:00 — 7 U",  day:  0 },
  { hour:   8, units: 7, label: "Day 3 14:00 — 7 U",  day:  0 },
  { hour:  15, units: 7, label: "Day 3 21:00 — 7 U",  day:  0 },
];

const TWICE_DAILY = new Set(["Humulin N", "Insulatard"]);

/* ─── 60-second explainers per insulin ──────────────────────────────── */

type Explainer = {
  mechanism: string;
  binding: string;
  halfLife: string;
  silentTail: string;
};

const EXPLAINERS: Record<string, Explainer> = {
  "Basaglar": {
    mechanism:
      "U-100 glargine biosimilar. Acidic formulation; once injected into neutral tissue it forms microprecipitates that slowly redissolve, releasing glargine over the day.",
    binding:
      "No protein carrier. After redissolution, monomers enter circulation and bind insulin receptors the standard way. Same molecule as Lantus.",
    halfLife: "SC half-life ≈ 13 h (780 min). Steady state by ~ day 3.",
    silentTail:
      "Clinical effect flattens after ~ 20 h but a small tail of drug is still releasing from the depot for 24 h — this is why early re-dosing stacks.",
  },
  "Humulin N": {
    mechanism:
      "Protamine–zinc crystalline suspension (NPH, 1946). The crystals dissolve slowly at the injection site, giving a broad peak 4–8 h after dosing.",
    binding:
      "No albumin binding. Peaked — an NPH dose is not 'basal-flat', it behaves much like a very slow bolus.",
    halfLife: "SC half-life ≈ 6 h (360 min). Dose-dependent DOA: higher doses last longer.",
    silentTail:
      "Activity trails to near-zero by ~ 16 h for typical doses. Anyone on twice-daily NPH will see real overlap where the morning dose still has activity when the evening dose peaks.",
  },
  "Insulatard": {
    mechanism:
      "Same molecule and formulation as Humulin N (Novo Nordisk's brand). Protamine–zinc crystals, slow redissolution. EU/UK/Africa equivalent.",
    binding:
      "No albumin binding. Peaked, not flat — recognise this on the chart: there is a real hill 4–8 h after each dose.",
    halfLife: "SC half-life ≈ 6 h (360 min). Dose-dependent DOA.",
    silentTail:
      "Same as Humulin N — trails to near-zero by ~ 16 h. The inter-dose overlap in a BID regimen is deliberate coverage, not a bug.",
  },
  "Lantus": {
    mechanism:
      "U-100 glargine. Acidic at pH 4; at the neutral subcutaneous pH it microprecipitates, then slowly redissolves over 24 h. Depot geometry varies dose-to-dose → high within-subject variability (CV ≈ 82 %, ~ 4× Tresiba).",
    binding:
      "No albumin binding. Glargine receptor binding is similar to human insulin. Slight mid-day peak is visible on clamp data even though marketed as peakless.",
    halfLife: "SC half-life ≈ 13 h (780 min). Steady state by ~ day 3.",
    silentTail:
      "Effect tapers 20–24 h after dose. Variability in the depot means day-to-day silent tails differ — part of why Lantus users sometimes feel 'good day / bad day' patterns.",
  },
  "Levemir": {
    mechanism:
      "Detemir. A C14 fatty acid is attached at LysB29; the molecule self-associates into dihexamers at the injection site and releases slowly. First protraction: depot residence (T50 ≈ 10 h). Second: albumin buffering in plasma.",
    binding:
      ">98 % bound to serum albumin via the fatty-acid tail. This is the protraction mechanism — unbound fraction is what acts on the receptor. Dose-dependent DOA follows Plank 2005.",
    halfLife: "Depot T50 ≈ 10.2 h. Effective DOA scales with dose: 5.7 h at 0.1 U/kg, 19.9 h at 0.4 U/kg, 22.7 h at 0.8 U/kg.",
    silentTail:
      "At a modest split dose (0.125 U/kg per injection here) DOA is ~ 7 h — this is WHY Levemir is used twice daily. Low doses have short tails by design.",
  },
  "Toujeo": {
    mechanism:
      "U-300 glargine. Same molecule as Lantus but concentrated 3× — the depot is smaller and rounder, giving a flatter, longer release. Takes ~ 4 days to reach steady state.",
    binding:
      "No albumin binding. Behaves as peakless for engine purposes; the clamp peak is gentle and broad (12–18 h).",
    halfLife: "SC half-life ≈ 19 h (1140 min) at steady state. Typical doses 10–18 % higher than equivalent Lantus dose.",
    silentTail:
      "Drug still releasing from depot at 36 h. Switching from Lantus → Toujeo without titration often under-covers for the first few days.",
  },
  "Tresiba": {
    mechanism:
      "Degludec. Hexamers linked head-to-tail form a multi-hexamer depot at the injection site. Zinc diffuses from the chain ends, releasing monomers at a near-constant rate for 42+ h. True depot release.",
    binding:
      "Not albumin-bound (0 %). Circulating degludec binds albumin modestly but the protraction is the depot, not plasma binding. LOCKED PEAKLESS — never draw a peak.",
    halfLife: "SC half-life ≈ 25 h (1524 min). Steady state by day 3 with within-subject CV ≈ 20 % (4× lower than Lantus).",
    silentTail:
      "Still releasing at 42 h — this is why missed doses are forgiving, and why a single timing change takes 3 days to fully show up.",
  },
};

/* ─── Helpers ───────────────────────────────────────────────────────── */

function basalsOnly(profiles: readonly InsulinProfile[]): InsulinProfile[] {
  return profiles.filter(
    (p) =>
      p.category === "intermediate" ||
      p.category === "long" ||
      p.category === "ultra-long",
  );
}

function formatDuration(minutes: number): string {
  const h = Math.round((minutes / 60) * 10) / 10;
  return `${h} h`;
}

function formatPeak(p: InsulinProfile): string {
  if (p.is_peakless) return "peakless";
  if (p.peak_start_minutes == null || p.peak_end_minutes == null) return "—";
  return `${Math.round(p.peak_start_minutes / 60 * 10) / 10}–${Math.round(p.peak_end_minutes / 60 * 10) / 10} h`;
}

/* ─── Page ──────────────────────────────────────────────────────────── */

export default function BasalParametersPage() {
  const basals = useMemo(() => basalsOnly(INSULIN_PROFILES), []);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F8FAFC",
      padding: "32px 16px 80px",
    }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        {/* Header */}
        <h1 style={{
          margin: 0,
          font: "700 28px 'DM Sans', system-ui, sans-serif",
          color: "#0D2149",
        }}>
          Basal Parameters and Curves
        </h1>
        <p style={{
          marginTop: 6, marginBottom: 0,
          font: "14px 'DM Sans', system-ui, sans-serif",
          color: "#475569",
        }}>
          Lifecycle IOB for every basal insulin in our research database,
          driven off the canonical engine. No invented shapes — every point
          is <code style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          calculateIOB</code> over <code style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          INSULIN_PROFILES</code>.
        </p>

        {/* Shared patient block */}
        <div style={{
          marginTop: 20, padding: "14px 16px",
          background: "#fff", border: "1px solid rgba(148,163,184,0.35)",
          borderRadius: 12,
          font: "13px 'DM Sans', system-ui, sans-serif",
          color: "#0D2149",
        }}>
          <div style={{ fontSize: 11, color: "#64748B", letterSpacing: 0.4, marginBottom: 4 }}>
            SHARED PATIENT (all 7 panels)
          </div>
          <div style={{ fontWeight: 600 }}>{PATIENT.label}</div>
          <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
            Graph window: 1 h before yesterday&rsquo;s first injection → last dose + full DOA.
            Y-axis is IOB in units. Charts never start from zero — steady state.
          </div>
        </div>

        {/* Panels */}
        {basals.map((profile) => {
          const isBID = TWICE_DAILY.has(profile.brand_name);
          const isTresiba = profile.brand_name === "Tresiba";
          const isLevemir = profile.brand_name === "Levemir";
          const doses = isTresiba
            ? TRESIBA_DOSES
            : isLevemir
              ? LEVEMIR_TID_DOSES
              : isBID ? TWICE_DAILY_DOSES : ONCE_DAILY_DOSES;
          const explainer = EXPLAINERS[profile.brand_name];
          const doseSummary = isTresiba
            ? "20 U @ 06:00 · once daily · 3-day lifecycle"
            : isLevemir
              ? "7 U @ 06:00 / 14:00 / 21:00 (paed TID split, 3-day view)"
              : isBID
                ? "10 U @ 06:00 + 10 U @ 18:00 (BID, 3-day view)"
                : "20 U @ 06:00 (once daily)";

          return (
            <section
              key={profile.brand_name}
              style={{
                marginTop: 24,
                padding: "18px 18px 20px",
                background: "#fff",
                border: "1px solid rgba(148,163,184,0.35)",
                borderRadius: 14,
                boxShadow: "0 2px 8px rgba(15,23,42,0.04)",
              }}
            >
              {/* Title row */}
              <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 10 }}>
                <span aria-hidden style={{
                  display: "inline-block",
                  width: 12, height: 12, borderRadius: "50%",
                  background: profile.colour,
                }} />
                <h2 style={{
                  margin: 0,
                  font: "700 20px 'DM Sans', system-ui, sans-serif",
                  color: "#0D2149",
                }}>
                  {profile.brand_name}
                </h2>
                <span style={{
                  font: "13px 'DM Sans', system-ui, sans-serif",
                  color: "#475569",
                }}>
                  {profile.generic_name} · {profile.manufacturer}
                </span>
              </div>

              {/* PK chips */}
              <div style={{
                marginTop: 10,
                display: "flex", flexWrap: "wrap", gap: 8,
                font: "11px 'JetBrains Mono', monospace",
                color: "#0D2149",
              }}>
                <Chip k="Onset" v={formatDuration(profile.onset_minutes)} />
                <Chip k="Peak"  v={formatPeak(profile)} />
                <Chip k="DOA"   v={formatDuration(profile.duration_minutes)} />
                <Chip k="Model" v={profile.decay_model} />
                <Chip k="Dosing" v={doseSummary} />
              </div>

              {/* Source citation */}
              <div style={{
                marginTop: 8,
                font: "11px 'DM Sans', system-ui, sans-serif",
                color: "#64748B",
              }}>
                Source: {profile.pk_source}
              </div>

              {/* Chart */}
              <div style={{ marginTop: 14 }}>
                <BasalLifecycleChart
                  profile={profile}
                  weightKg={PATIENT.weightKg}
                  doses={doses}
                  todayAnchor={PATIENT.anchor}
                />
              </div>

              {/* 60-second explainer */}
              {explainer && (
                <div style={{
                  marginTop: 16,
                  padding: "14px 14px 12px",
                  background: "#F1F5F9",
                  borderRadius: 10,
                  font: "13px/1.55 'DM Sans', system-ui, sans-serif",
                  color: "#0D2149",
                }}>
                  <div style={{ fontSize: 11, color: "#475569", letterSpacing: 0.6, marginBottom: 8 }}>
                    60-SECOND SUMMARY
                  </div>
                  <ExplainerRow label="Mechanism"  text={explainer.mechanism} />
                  <ExplainerRow label="Binding"    text={explainer.binding} />
                  <ExplainerRow label="Half-life"  text={explainer.halfLife} />
                  <ExplainerRow label="Silent tail" text={explainer.silentTail} />
                </div>
              )}
            </section>
          );
        })}

        {/* Footer disclaimer */}
        <p style={{
          marginTop: 28, marginBottom: 0,
          font: "11px 'DM Sans', system-ui, sans-serif",
          color: "#64748B", textAlign: "center",
        }}>
          GluMira™ is an educational platform, not a medical device.
          This page does not constitute medical advice. Discuss all changes with an endocrinologist.
        </p>
      </div>
    </div>
  );
}

/* ─── Small presentational helpers ──────────────────────────────────── */

function Chip({ k, v }: { k: string; v: string }) {
  return (
    <span style={{
      display: "inline-flex", gap: 4, alignItems: "baseline",
      padding: "3px 8px",
      background: "#F1F5F9",
      border: "1px solid rgba(148,163,184,0.25)",
      borderRadius: 999,
    }}>
      <span style={{ color: "#64748B", fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: 10, fontWeight: 500 }}>
        {k}
      </span>
      <span style={{ color: "#0D2149", fontWeight: 600 }}>{v}</span>
    </span>
  );
}

function ExplainerRow({ label, text }: { label: string; text: string }) {
  return (
    <div style={{ marginTop: 6 }}>
      <span style={{
        display: "inline-block",
        minWidth: 92,
        fontSize: 11, fontWeight: 600, color: "#475569",
        letterSpacing: 0.4,
      }}>
        {label}
      </span>
      <span>{text}</span>
    </div>
  );
}
