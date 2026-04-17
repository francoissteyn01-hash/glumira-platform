# MenopauseModule + Research Consent — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the MenopauseModule (T1D + menopause insulin resistance modelling at `/modules/menopause`) and add an IRB-aligned anonymous research opt-in to the existing onboarding consent page.

**Architecture:** Part 1 is entirely frontend — a pure TypeScript engine + React page, zero new backend. Part 2 adds a `user_consents` drizzle table, a `consent` tRPC router, extends `ConsentPage.tsx`, and adds a `ResearchInfoPage`. The two parts are independent — do Part 1 first.

**Tech Stack:** React + TypeScript + Vite · Vitest (test runner: `npm run test:run`) · Drizzle ORM (`drizzle/schema.ts`) · tRPC (`server/routes/`) · Supabase (via `ctx.supabase`)

---

## File Map

### Part 1 — MenopauseModule (no DB)

| Action | File |
| --- | --- |
| CREATE | `src/lib/menopause-engine.ts` |
| CREATE | `src/lib/menopause-engine.test.ts` |
| CREATE | `src/pages/MenopauseModule.tsx` |
| MODIFY | `App.tsx` — lazy import + route |
| MODIFY | `src/components/AppSidebar.tsx` — add to `CLINICAL_MODULES` |

### Part 2 — Research Consent

| Action | File |
| --- | --- |
| MODIFY | `drizzle/schema.ts` — add `userConsents` table |
| CREATE | `server/routes/consent.router.ts` |
| MODIFY | `server/router.ts` — register `consentRouter` |
| MODIFY | `src/pages/ConsentPage.tsx` — extend interface + add item |
| CREATE | `src/pages/ResearchInfoPage.tsx` |
| MODIFY | `App.tsx` — add `/research` route |
| MODIFY | `src/pages/SettingsPage.tsx` — Research section + withdraw toggle |

---

## Part 1: MenopauseModule

---

### Task 1: menopause-engine.ts — types and ISF modifier

**Files:**
- Create: `src/lib/menopause-engine.ts`
- Create: `src/lib/menopause-engine.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/menopause-engine.test.ts
import { describe, it, expect } from "vitest";
import { analyseMenopause } from "./menopause-engine";

describe("analyseMenopause", () => {
  it("returns moderate resistance for perimenopause with no HRT", () => {
    const result = analyseMenopause({
      stage: "perimenopause",
      hrtType: "none",
      yearsSinceLastPeriod: 1,
      symptoms: [],
      avgFastingMmol: 7.5,
      avgPostMealMmol: 10.0,
      basalDoseUnits: 20,
      hypoEventsLast7Days: 0,
      unit: "mmol",
    });
    expect(result.isfImpactLow).toBeLessThan(0);
    expect(result.isfImpactHigh).toBeLessThan(0);
    expect(result.resistanceLevel).toBe("moderate");
    expect(result.citations.length).toBeGreaterThan(0);
  });

  it("returns high resistance for postmenopause with no HRT", () => {
    const result = analyseMenopause({
      stage: "postmenopause",
      hrtType: "none",
      yearsSinceLastPeriod: 8,
      symptoms: [],
      avgFastingMmol: 9.0,
      avgPostMealMmol: 13.0,
      basalDoseUnits: 30,
      hypoEventsLast7Days: 0,
      unit: "mmol",
    });
    expect(result.resistanceLevel).toBe("high");
    expect(result.isfImpactLow).toBeLessThanOrEqual(-0.20);
  });

  it("oestrogen-only HRT reduces ISF impact vs no HRT at same stage", () => {
    const base = analyseMenopause({
      stage: "menopause", hrtType: "none", yearsSinceLastPeriod: 2,
      symptoms: [], avgFastingMmol: 8, avgPostMealMmol: 11,
      basalDoseUnits: 24, hypoEventsLast7Days: 0, unit: "mmol",
    });
    const hrt = analyseMenopause({
      stage: "menopause", hrtType: "oestrogen-only", yearsSinceLastPeriod: 2,
      symptoms: [], avgFastingMmol: 8, avgPostMealMmol: 11,
      basalDoseUnits: 24, hypoEventsLast7Days: 0, unit: "mmol",
    });
    expect(hrt.isfImpactLow).toBeGreaterThan(base.isfImpactLow);
  });

  it("flags hot flash correlation note when symptom present", () => {
    const result = analyseMenopause({
      stage: "perimenopause", hrtType: "none", yearsSinceLastPeriod: 1,
      symptoms: ["hot_flashes"], avgFastingMmol: 7, avgPostMealMmol: 10,
      basalDoseUnits: 20, hypoEventsLast7Days: 0, unit: "mmol",
    });
    expect(result.hotFlashCorrelationNote).not.toBeNull();
  });

  it("flags dawn phenomenon when insomnia present", () => {
    const result = analyseMenopause({
      stage: "menopause", hrtType: "none", yearsSinceLastPeriod: 2,
      symptoms: ["insomnia"], avgFastingMmol: 8, avgPostMealMmol: 11,
      basalDoseUnits: 22, hypoEventsLast7Days: 0, unit: "mmol",
    });
    expect(result.dawnPhenomenonFlag).toBe(true);
  });

  it("converts mg/dL inputs before processing", () => {
    const mmol = analyseMenopause({
      stage: "menopause", hrtType: "none", yearsSinceLastPeriod: 2,
      symptoms: [], avgFastingMmol: 8, avgPostMealMmol: 11,
      basalDoseUnits: 22, hypoEventsLast7Days: 0, unit: "mmol",
    });
    const mg = analyseMenopause({
      stage: "menopause", hrtType: "none", yearsSinceLastPeriod: 2,
      symptoms: [], avgFastingMmol: 144, avgPostMealMmol: 198,
      basalDoseUnits: 22, hypoEventsLast7Days: 0, unit: "mg",
    });
    expect(mmol.resistanceLevel).toBe(mg.resistanceLevel);
  });

  it("elevated nocturnal hypo risk when hypo events > 2", () => {
    const result = analyseMenopause({
      stage: "perimenopause", hrtType: "oestrogen-only", yearsSinceLastPeriod: 1,
      symptoms: [], avgFastingMmol: 6, avgPostMealMmol: 8,
      basalDoseUnits: 18, hypoEventsLast7Days: 3, unit: "mmol",
    });
    expect(["elevated", "high"]).toContain(result.nocturnalHypoRisk);
  });
});
```

- [ ] **Step 2: Run — confirm all fail**

```bash
cd c:/glumira-v7 && npm run test:run -- src/lib/menopause-engine.test.ts
```

Expected: all tests FAIL with "Cannot find module './menopause-engine'"

- [ ] **Step 3: Write the engine**

```ts
// src/lib/menopause-engine.ts
/**
 * GluMira™ — Menopause & T1D Insulin Impact Engine
 *
 * Models ISF sensitivity changes across the menopause transition.
 * Educational estimates only — not dosing advice.
 *
 * Sources:
 * - Mauvais-Jarvis 2015 PMID:26260609 (Nat Rev Endocrinol)
 * - Samaras 1999 PMID:10333937 (Diabetes Care)
 * - NAMS 2022 Menopause Society Position Statement
 */

export type MenopauseStage = "perimenopause" | "menopause" | "postmenopause";
export type HrtType = "none" | "oestrogen-only" | "combined";
export type Symptom =
  | "hot_flashes"
  | "insomnia"
  | "mood_changes"
  | "weight_gain"
  | "brain_fog"
  | "vaginal_dryness";

export interface MenopauseInput {
  stage: MenopauseStage;
  hrtType: HrtType;
  yearsSinceLastPeriod: number;
  symptoms: Symptom[];
  avgFastingMmol: number;
  avgPostMealMmol: number;
  basalDoseUnits: number;
  hypoEventsLast7Days: number;
  currentISF?: number;
  unit: "mmol" | "mg";
}

export interface MenopauseAnalysisResult {
  isfImpactLow: number;
  isfImpactHigh: number;
  resistanceLevel: "low" | "moderate" | "high";
  nocturnalHypoRisk: "low" | "elevated" | "high";
  dawnPhenomenonFlag: boolean;
  hrtInteractionNote: string | null;
  hotFlashCorrelationNote: string | null;
  monitoringPlan: string[];
  doctorTalkingPoints: string[];
  citations: string[];
}

// ISF impact bands per stage (no HRT baseline)
const STAGE_BANDS: Record<MenopauseStage, { low: number; high: number }> = {
  perimenopause:  { low: -0.10, high: -0.25 },
  menopause:      { low: -0.15, high: -0.30 },
  postmenopause:  { low: -0.20, high: -0.35 },
};

// HRT modifiers — applied on top of stage band
const HRT_MODIFIER: Record<HrtType, number> = {
  "none":           0,
  "oestrogen-only": 0.10,  // partial protective — shifts band +10%
  "combined":       0.05,  // progesterone offsets oestrogen benefit
};

const CITATIONS = [
  "Mauvais-Jarvis F. (2015). Nat Rev Endocrinol. PMID:26260609",
  "Samaras K. et al. (1999). Diabetes Care. PMID:10333937",
  "NAMS (2022). Menopause Society Position Statement",
];

export function analyseMenopause(input: MenopauseInput): MenopauseAnalysisResult {
  // Normalise units
  const fastingMmol = input.unit === "mg" ? input.avgFastingMmol / 18.018 : input.avgFastingMmol;
  const postMealMmol = input.unit === "mg" ? input.avgPostMealMmol / 18.018 : input.avgPostMealMmol;

  const band = STAGE_BANDS[input.stage];
  const mod = HRT_MODIFIER[input.hrtType];

  const isfImpactLow  = Math.round((band.low  + mod) * 100) / 100;
  const isfImpactHigh = Math.round((band.high + mod) * 100) / 100;

  // Resistance level from mid-point of band
  const midpoint = (isfImpactLow + isfImpactHigh) / 2;
  const resistanceLevel: MenopauseAnalysisResult["resistanceLevel"] =
    midpoint > -0.12 ? "low" : midpoint > -0.20 ? "moderate" : "high";

  // Nocturnal hypo risk
  const nocturnalHypoRisk: MenopauseAnalysisResult["nocturnalHypoRisk"] =
    input.hypoEventsLast7Days >= 3 ? "high"
    : input.hypoEventsLast7Days >= 1 || fastingMmol < 5.5 ? "elevated"
    : "low";

  const dawnPhenomenonFlag = input.symptoms.includes("insomnia");

  const hrtInteractionNote = input.hrtType === "oestrogen-only"
    ? "Oestrogen-only HRT generally improves insulin sensitivity. Monitor for hypoglycaemia in the first weeks after starting or dose changes. — Samaras 1999"
    : input.hrtType === "combined"
    ? "Combined HRT: progesterone component may offset oestrogen's insulin-sensitising benefit. Glucose variability common — increase monitoring frequency. — Mauvais-Jarvis 2015"
    : null;

  const hotFlashCorrelationNote = input.symptoms.includes("hot_flashes")
    ? "Hot flash events transiently raise cortisol → acute glucose spikes independent of your ISF shift. Log glucose during and after episodes to identify your personal pattern."
    : null;

  const monitoringPlan = buildMonitoringPlan(input, nocturnalHypoRisk, dawnPhenomenonFlag);
  const doctorTalkingPoints = buildDoctorPoints(input, resistanceLevel, hrtInteractionNote, nocturnalHypoRisk);

  return {
    isfImpactLow,
    isfImpactHigh,
    resistanceLevel,
    nocturnalHypoRisk,
    dawnPhenomenonFlag,
    hrtInteractionNote,
    hotFlashCorrelationNote,
    monitoringPlan,
    doctorTalkingPoints,
    citations: CITATIONS,
  };
}

function buildMonitoringPlan(
  input: MenopauseInput,
  hypoRisk: MenopauseAnalysisResult["nocturnalHypoRisk"],
  dawnFlag: boolean
): string[] {
  const plan: string[] = [
    "Check fasting glucose daily — menopause-driven variability peaks in early morning",
    "Log post-meal readings at 1h and 2h for 2 weeks to establish your new baseline",
  ];
  if (hypoRisk !== "low") {
    plan.push("Set CGM alert for nocturnal lows ≤ 3.9 mmol/L (70 mg/dL) — elevated overnight risk during menopause transition");
  }
  if (dawnFlag) {
    plan.push("Monitor 3am glucose to assess dawn phenomenon — insomnia disrupts cortisol rhythm and can raise morning readings");
  }
  if (input.hrtType !== "none") {
    plan.push("Check glucose daily for 4 weeks after any HRT dose change — sensitivity shifts can be rapid");
  }
  return plan.slice(0, 5);
}

function buildDoctorPoints(
  input: MenopauseInput,
  resistance: MenopauseAnalysisResult["resistanceLevel"],
  hrtNote: string | null,
  hypoRisk: MenopauseAnalysisResult["nocturnalHypoRisk"]
): string[] {
  const points: string[] = [
    `My insulin sensitivity appears ${resistance} — ask about reviewing my ISF and carb ratio`,
  ];
  if (input.symptoms.includes("hot_flashes")) {
    points.push("Hot flashes are causing glucose spikes — discuss whether adjusting my correction dose for symptomatic periods is appropriate");
  }
  if (hypoRisk !== "low") {
    points.push("I've had overnight hypos — ask about a small basal reduction before bed and CGM overnight alerts");
  }
  if (hrtNote) {
    points.push("Starting / currently on HRT — discuss the expected insulin sensitivity change and when to re-check my ratios");
  }
  points.push("Request HbA1c + fasting lipid panel — menopause can shift cardiovascular risk independent of glucose control");
  return points.slice(0, 5);
}
```

- [ ] **Step 4: Run tests — confirm all pass**

```bash
cd c:/glumira-v7 && npm run test:run -- src/lib/menopause-engine.test.ts
```

Expected: 6 tests PASS

- [ ] **Step 5: Commit**

```bash
cd c:/glumira-v7 && git add src/lib/menopause-engine.ts src/lib/menopause-engine.test.ts && git commit -m "feat(engine): menopause ISF impact engine with HRT modifiers + tests"
```

---

### Task 2: MenopauseModule.tsx — page component

**Files:**
- Create: `src/pages/MenopauseModule.tsx`

- [ ] **Step 1: Create the page**

```tsx
// src/pages/MenopauseModule.tsx
/**
 * GluMira™ V7 — Menopause & Glucose Module
 * Route: /modules/menopause
 * Single-scroll, mobile-first (390px). Snapshot → output → optional tracker.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  analyseMenopause,
  type MenopauseStage,
  type HrtType,
  type Symptom,
  type MenopauseAnalysisResult,
} from "@/lib/menopause-engine";

const T = {
  navy:    "#1a2a5e",
  deep:    "#0d1b3e",
  teal:    "#2ab5c1",
  amber:   "#f59e0b",
  white:   "#ffffff",
  muted:   "#64748b",
  bg:      "#f8f9fa",
  border:  "#e2e8f0",
  heading: "'Playfair Display', Georgia, serif",
  body:    "'DM Sans', -apple-system, sans-serif",
};

const card: React.CSSProperties = {
  background: T.white,
  border: `1px solid ${T.border}`,
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
};

const cardTitle: React.CSSProperties = {
  fontWeight: 600,
  color: T.navy,
  marginBottom: 10,
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: ".5px",
};

const STAGES: { value: MenopauseStage; label: string; desc: string }[] = [
  { value: "perimenopause",  label: "Perimenopause",  desc: "Irregular cycles, fluctuating oestrogen. Typically 2–8 years before final period." },
  { value: "menopause",      label: "Menopause",      desc: "12 months since last period. Oestrogen levels fall and stabilise at a lower level." },
  { value: "postmenopause",  label: "Postmenopause",  desc: "More than 12 months since last period. Hormone levels are now stable but low." },
];

const HRT_OPTIONS: { value: HrtType; label: string }[] = [
  { value: "none",            label: "None" },
  { value: "oestrogen-only",  label: "Oestrogen-only" },
  { value: "combined",        label: "Combined (oestrogen + progesterone)" },
];

const SYMPTOM_OPTIONS: { value: Symptom; label: string }[] = [
  { value: "hot_flashes",     label: "Hot flashes" },
  { value: "insomnia",        label: "Insomnia" },
  { value: "mood_changes",    label: "Mood changes" },
  { value: "weight_gain",     label: "Weight gain" },
  { value: "brain_fog",       label: "Brain fog" },
  { value: "vaginal_dryness", label: "Vaginal dryness" },
];

const TRACKER_KEY = "glumira_menopause_tracker";

interface TrackerEntry { date: string; fastingMmol: string; postMealMmol: string; symptoms: Symptom[] }

function loadTrackerEntries(): TrackerEntry[] {
  try { return JSON.parse(localStorage.getItem(TRACKER_KEY) ?? "[]"); } catch { return []; }
}

function saveTrackerEntries(entries: TrackerEntry[]) {
  localStorage.setItem(TRACKER_KEY, JSON.stringify(entries));
}

export default function MenopauseModule() {
  const [stage, setStage]           = useState<MenopauseStage>("perimenopause");
  const [hrtType, setHrtType]       = useState<HrtType>("none");
  const [symptoms, setSymptoms]     = useState<Symptom[]>([]);
  const [fasting, setFasting]       = useState("");
  const [postMeal, setPostMeal]     = useState("");
  const [basalDose, setBasalDose]   = useState("");
  const [hypos, setHypos]           = useState("0");
  const [unit, setUnit]             = useState<"mmol" | "mg">("mmol");
  const [result, setResult]         = useState<MenopauseAnalysisResult | null>(null);
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [trackerEntries, setTrackerEntries] = useState<TrackerEntry[]>(loadTrackerEntries);
  const [trackerForm, setTrackerForm] = useState<TrackerEntry>({
    date: new Date().toISOString().slice(0, 10),
    fastingMmol: "",
    postMealMmol: "",
    symptoms: [],
  });

  const stageDesc = STAGES.find(s => s.value === stage)?.desc ?? "";

  const toggleSymptom = (s: Symptom) =>
    setSymptoms(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const toggleTrackerSymptom = (s: Symptom) =>
    setTrackerForm(f => ({
      ...f,
      symptoms: f.symptoms.includes(s) ? f.symptoms.filter(x => x !== s) : [...f.symptoms, s],
    }));

  const canAnalyse = fasting && postMeal && basalDose;

  const handleAnalyse = () => {
    if (!canAnalyse) return;
    setResult(analyseMenopause({
      stage,
      hrtType,
      yearsSinceLastPeriod: 2,
      symptoms,
      avgFastingMmol: parseFloat(fasting),
      avgPostMealMmol: parseFloat(postMeal),
      basalDoseUnits: parseFloat(basalDose),
      hypoEventsLast7Days: parseInt(hypos, 10),
      unit,
    }));
  };

  const addTrackerEntry = () => {
    if (!trackerForm.fastingMmol || !trackerForm.postMealMmol) return;
    const updated = [...trackerEntries, trackerForm];
    setTrackerEntries(updated);
    saveTrackerEntries(updated);
    setTrackerForm({ date: new Date().toISOString().slice(0, 10), fastingMmol: "", postMealMmol: "", symptoms: [] });
  };

  const resistanceColour = (r: MenopauseAnalysisResult["resistanceLevel"]) =>
    r === "low" ? "#16a34a" : r === "moderate" ? "#d97706" : "#dc2626";

  const hypoColour = (r: MenopauseAnalysisResult["nocturnalHypoRisk"]) =>
    r === "low" ? "#16a34a" : r === "elevated" ? "#d97706" : "#dc2626";

  const weekSummary = trackerEntries.length >= 7 ? (() => {
    const vals = trackerEntries.slice(-7).map(e => parseFloat(e.fastingMmol)).filter(v => !isNaN(v));
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return { avg: avg.toFixed(1), count: vals.length };
  })() : null;

  const inputStyle: React.CSSProperties = {
    border: `1px solid ${T.border}`, borderRadius: 8,
    padding: "9px 12px", color: T.navy, fontSize: 14,
    width: "100%", boxSizing: "border-box", fontFamily: T.body,
  };

  const pill = (active: boolean): React.CSSProperties => ({
    padding: "8px 14px",
    background: active ? T.navy : T.bg,
    color: active ? T.white : T.muted,
    borderRadius: 20,
    fontSize: 13,
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    border: "none",
    fontFamily: T.body,
  });

  const symptomPill = (active: boolean): React.CSSProperties => ({
    padding: "6px 12px",
    background: active ? "#fce7f3" : T.bg,
    color: active ? "#9d174d" : T.muted,
    borderRadius: 16,
    fontSize: 12,
    cursor: "pointer",
    border: "none",
    fontFamily: T.body,
  });

  return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: 24, fontFamily: T.body }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>
        <Link to="/education" style={{ color: T.teal, fontSize: 14, textDecoration: "none" }}>← Back to Education</Link>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "16px 0 24px" }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: "#fce7f3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🌸</div>
          <div>
            <h1 style={{ margin: 0, fontFamily: T.heading, color: T.navy, fontSize: 22 }}>Menopause &amp; Glucose</h1>
            <p style={{ margin: "2px 0 0", color: T.muted, fontSize: 13 }}>T1D insulin resistance modelling across the menopause transition</p>
          </div>
        </div>

        {/* Unit toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {(["mmol", "mg"] as const).map(u => (
            <button key={u} onClick={() => setUnit(u)} style={pill(unit === u)}>
              {u === "mmol" ? "mmol/L" : "mg/dL"}
            </button>
          ))}
        </div>

        {/* Stage selector */}
        <div style={card}>
          <div style={cardTitle}>Where are you now?</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {STAGES.map(s => (
              <button key={s.value} onClick={() => setStage(s.value)} style={pill(stage === s.value)}>{s.label}</button>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{stageDesc}</p>
        </div>

        {/* HRT */}
        <div style={card}>
          <div style={cardTitle}>Hormone therapy (HRT)</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {HRT_OPTIONS.map(h => (
              <button key={h.value} onClick={() => setHrtType(h.value)} style={pill(hrtType === h.value)}>{h.label}</button>
            ))}
          </div>
        </div>

        {/* Glucose & insulin */}
        <div style={card}>
          <div style={cardTitle}>Glucose &amp; insulin</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>Avg fasting ({unit === "mmol" ? "mmol/L" : "mg/dL"})</div>
              <input style={inputStyle} type="number" value={fasting} onChange={e => setFasting(e.target.value)} placeholder={unit === "mmol" ? "e.g. 7.2" : "e.g. 130"} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>Avg post-meal ({unit === "mmol" ? "mmol/L" : "mg/dL"})</div>
              <input style={inputStyle} type="number" value={postMeal} onChange={e => setPostMeal(e.target.value)} placeholder={unit === "mmol" ? "e.g. 10.4" : "e.g. 187"} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>Basal dose (U/day)</div>
              <input style={inputStyle} type="number" value={basalDose} onChange={e => setBasalDose(e.target.value)} placeholder="e.g. 22" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>Hypos last 7 days</div>
              <input style={inputStyle} type="number" value={hypos} onChange={e => setHypos(e.target.value)} min="0" />
            </div>
          </div>
        </div>

        {/* Symptoms */}
        <div style={card}>
          <div style={cardTitle}>Current symptoms</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {SYMPTOM_OPTIONS.map(s => (
              <button key={s.value} onClick={() => toggleSymptom(s.value)} style={symptomPill(symptoms.includes(s.value))}>{s.label}</button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleAnalyse}
          disabled={!canAnalyse}
          style={{
            width: "100%", marginBottom: 20, padding: "15px 24px",
            background: canAnalyse ? `linear-gradient(135deg, ${T.teal}, #1e9eab)` : T.border,
            color: canAnalyse ? T.white : T.muted,
            border: "none", borderRadius: 12, fontSize: 16, fontWeight: 600,
            fontFamily: T.body, cursor: canAnalyse ? "pointer" : "not-allowed",
          }}
        >
          Analyse my pattern
        </button>

        {/* Results */}
        {result && (
          <div style={{ borderTop: `2px solid ${T.border}`, paddingTop: 20 }}>
            <h2 style={{ fontFamily: T.heading, color: T.navy, fontSize: 20, marginBottom: 16 }}>Your insulin picture</h2>

            {/* ISF band */}
            <div style={{ background: `linear-gradient(135deg, ${T.navy}, ${T.deep})`, borderRadius: 12, padding: 16, marginBottom: 10, color: T.white }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Estimated ISF impact</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: T.teal }}>
                {Math.round(result.isfImpactLow * 100)}% to {Math.round(result.isfImpactHigh * 100)}%
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                {STAGES.find(s => s.value === stage)?.label} · {HRT_OPTIONS.find(h => h.value === hrtType)?.label} HRT
              </div>
            </div>

            {/* Risk flags */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
              <div style={{ background: "#fef3c7", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11, color: "#92400e", fontWeight: 600 }}>INSULIN RESISTANCE</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: resistanceColour(result.resistanceLevel), marginTop: 2 }}>
                  {result.resistanceLevel.charAt(0).toUpperCase() + result.resistanceLevel.slice(1)}
                </div>
              </div>
              <div style={{ background: "#fee2e2", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 11, color: "#991b1b", fontWeight: 600 }}>NOCTURNAL HYPO RISK</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: hypoColour(result.nocturnalHypoRisk), marginTop: 2 }}>
                  {result.nocturnalHypoRisk.charAt(0).toUpperCase() + result.nocturnalHypoRisk.slice(1)}
                </div>
              </div>
            </div>

            {/* Conditional notes */}
            {result.hrtInteractionNote && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 13, color: "#166534" }}>
                <strong>HRT note:</strong> {result.hrtInteractionNote}
              </div>
            )}
            {result.hotFlashCorrelationNote && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 13, color: "#92400e" }}>
                <strong>Hot flash correlation:</strong> {result.hotFlashCorrelationNote}
              </div>
            )}
            {result.dawnPhenomenonFlag && (
              <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: 12, marginBottom: 10, fontSize: 13, color: "#9a3412" }}>
                <strong>Dawn phenomenon risk:</strong> Insomnia disrupts cortisol rhythm — elevated morning glucose common. Log 3am and waking readings to separate dawn effect from evening carb timing.
              </div>
            )}

            {/* Doctor talking points */}
            <div style={{ ...card, marginBottom: 10 }}>
              <div style={cardTitle}>Doctor talking points</div>
              <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#374151", lineHeight: 1.8 }}>
                {result.doctorTalkingPoints.map((p, i) => <li key={i}>{p}</li>)}
              </ol>
            </div>

            {/* Monitoring plan */}
            <div style={{ ...card, marginBottom: 10 }}>
              <div style={cardTitle}>Monitoring plan</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#374151", lineHeight: 1.8 }}>
                {result.monitoringPlan.map((p, i) => <li key={i}>{p}</li>)}
              </ul>
            </div>

            {/* Citations */}
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 12, lineHeight: 1.6 }}>
              {result.citations.join(" · ")}
            </div>

            {/* Track this week CTA */}
            <div
              style={{ border: `1px dashed ${T.teal}`, borderRadius: 10, padding: 14, marginBottom: 12, cursor: "pointer" }}
              onClick={() => setTrackerOpen(o => !o)}
            >
              <div style={{ fontSize: 13, color: T.teal, fontWeight: 600 }}>
                {trackerOpen ? "▾" : "▸"} Track this week
              </div>
              <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>
                Log daily glucose + symptoms — see your personal pattern in 7 days ({trackerEntries.length}/7 entries)
              </div>
            </div>

            {/* Tracker panel */}
            {trackerOpen && (
              <div style={card}>
                <div style={cardTitle}>Daily log</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>Date</div>
                    <input style={inputStyle} type="date" value={trackerForm.date} onChange={e => setTrackerForm(f => ({ ...f, date: e.target.value }))} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>Fasting (mmol/L)</div>
                    <input style={inputStyle} type="number" value={trackerForm.fastingMmol} onChange={e => setTrackerForm(f => ({ ...f, fastingMmol: e.target.value }))} placeholder="e.g. 7.0" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: T.muted, marginBottom: 4 }}>Post-meal (mmol/L)</div>
                    <input style={inputStyle} type="number" value={trackerForm.postMealMmol} onChange={e => setTrackerForm(f => ({ ...f, postMealMmol: e.target.value }))} placeholder="e.g. 10.5" />
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>Symptoms today</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {SYMPTOM_OPTIONS.map(s => (
                      <button key={s.value} onClick={() => toggleTrackerSymptom(s.value)} style={symptomPill(trackerForm.symptoms.includes(s.value))}>{s.label}</button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={addTrackerEntry}
                  disabled={!trackerForm.fastingMmol || !trackerForm.postMealMmol}
                  style={{ ...pill(true), width: "100%", padding: "11px 16px" }}
                >
                  Add entry
                </button>

                {/* Week summary */}
                {weekSummary && (
                  <div style={{ marginTop: 14, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: 12, fontSize: 13, color: "#166534" }}>
                    <strong>7-day summary:</strong> avg fasting {weekSummary.avg} mmol/L across {weekSummary.count} readings
                  </div>
                )}

                {/* Recent entries */}
                {trackerEntries.length > 0 && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>Recent entries</div>
                    {trackerEntries.slice(-3).reverse().map((e, i) => (
                      <div key={i} style={{ fontSize: 12, color: "#374151", padding: "4px 0", borderBottom: `1px solid ${T.border}` }}>
                        {e.date} — fasting {e.fastingMmol}, post-meal {e.postMealMmol} mmol/L
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Disclaimer */}
        <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.6, padding: 12, background: T.bg, borderRadius: 8, border: `1px solid ${T.border}`, marginTop: 8 }}>
          Educational platform — not a medical device. All ISF estimates are ranges, not dosing advice. Discuss all insulin adjustments with your endocrinologist.
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
cd c:/glumira-v7 && npx tsc --noEmit 2>&1 | grep -i menopause
```

Expected: no errors related to MenopauseModule

- [ ] **Step 3: Commit**

```bash
cd c:/glumira-v7 && git add src/pages/MenopauseModule.tsx && git commit -m "feat(ui): MenopauseModule page — snapshot + optional tracker"
```

---

### Task 3: Wire routing and sidebar

**Files:**
- Modify: `App.tsx`
- Modify: `src/components/AppSidebar.tsx`

- [ ] **Step 1: Add lazy import to App.tsx**

In `App.tsx`, after the `MenstrualCycleModule` import on line 48, add:

```tsx
const MenopauseModule         = lazy(() => import("@/pages/MenopauseModule"));
```

- [ ] **Step 2: Add route to App.tsx**

In `App.tsx`, after line 252 (`<Route path="/modules/menstrual" ...>`), add:

```tsx
<Route path="/modules/menopause"       element={<MenopauseModule />} />
```

- [ ] **Step 3: Add to AppSidebar CLINICAL_MODULES**

In `src/components/AppSidebar.tsx`, the `CLINICAL_MODULES` array starts at line 56. Add Menopause after Menstrual Cycle:

```ts
const CLINICAL_MODULES = [
  { path: "/modules/adhd",       label: "ADHD" },
  { path: "/modules/autism",     label: "Autism + T1D" },
  { path: "/modules/menstrual",  label: "Menstrual Cycle" },
  { path: "/modules/menopause",  label: "Menopause" },   // ADD THIS LINE
  { path: "/modules/thyroid",    label: "Thyroid" },
];
```

- [ ] **Step 4: Type-check whole app**

```bash
cd c:/glumira-v7 && npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 5: Commit**

```bash
cd c:/glumira-v7 && git add App.tsx src/components/AppSidebar.tsx && git commit -m "feat(routing): add /modules/menopause route + sidebar entry"
```

---

## Part 2: Research Consent

---

### Task 4: DB — user_consents table

**Files:**
- Modify: `drizzle/schema.ts`

- [ ] **Step 1: Add userConsents table to drizzle/schema.ts**

At the end of the tables section (after the last `pgTable` export), add:

```ts
// User consent records (onboarding + research opt-in)
export const userConsents = pgTable("user_consents", {
  id:                          uuid("id").primaryKey().defaultRandom(),
  userId:                      uuid("user_id").notNull(),
  timestamp:                   timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  consents:                    jsonb("consents").notNull().default([]),   // string[] of consent ids
  researchConsent:             boolean("research_consent").notNull().default(false),
  researchConsentTs:           timestamp("research_consent_ts",           { withTimezone: true }),
  researchConsentWithdrawnTs:  timestamp("research_consent_withdrawn_ts", { withTimezone: true }),
});
```

- [ ] **Step 2: Push schema to Supabase**

```bash
cd c:/glumira-v7 && npx drizzle-kit push:pg
```

Expected: "user_consents table created" (or similar confirmation)

- [ ] **Step 3: Commit**

```bash
cd c:/glumira-v7 && git add drizzle/schema.ts && git commit -m "feat(db): add user_consents table with research_consent columns"
```

---

### Task 5: tRPC consent router

**Files:**
- Create: `server/routes/consent.router.ts`
- Modify: `server/router.ts`

- [ ] **Step 1: Create consent.router.ts**

```ts
// server/routes/consent.router.ts
/**
 * GluMira™ V7 — Consent tRPC router
 * Handles onboarding consent capture + research opt-in / withdrawal.
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../trpc";

const consentCreateInput = z.object({
  userId:          z.string(),
  timestamp:       z.string(),
  consents:        z.array(z.string()),
});

const researchUpdateInput = z.object({
  researchConsent: z.boolean(),
});

export const consentRouter = router({
  create: publicProcedure.input(consentCreateInput).mutation(async ({ ctx, input }) => {
    const researchConsent = input.consents.includes("research_programme");
    const now = new Date().toISOString();

    const { error } = await ctx.supabase
      .from("user_consents")
      .upsert({
        user_id:             input.userId,
        timestamp:           input.timestamp,
        consents:            input.consents,
        research_consent:    researchConsent,
        research_consent_ts: researchConsent ? now : null,
      }, { onConflict: "user_id" });

    if (error) throw new Error(error.message);
    return { ok: true };
  }),

  updateResearch: protectedProcedure.input(researchUpdateInput).mutation(async ({ ctx, input }) => {
    const now = new Date().toISOString();
    const { error } = await ctx.supabase
      .from("user_consents")
      .update({
        research_consent:              input.researchConsent,
        research_consent_ts:           input.researchConsent ? now : null,
        research_consent_withdrawn_ts: !input.researchConsent ? now : null,
      })
      .eq("user_id", ctx.user.id);

    if (error) throw new Error(error.message);
    return { ok: true };
  }),

  getResearch: protectedProcedure.query(async ({ ctx }) => {
    const { data } = await ctx.supabase
      .from("user_consents")
      .select("research_consent")
      .eq("user_id", ctx.user.id)
      .single();
    return { researchConsent: data?.research_consent ?? false };
  }),
});
```

- [ ] **Step 2: Register in server/router.ts**

Add import after existing imports:

```ts
import { consentRouter } from "./routes/consent.router";
```

Add to `appRouter`:

```ts
export const appRouter = router({
  health: publicProcedure.query(() => ({ status: "ok", version: "7.0.0", service: "GluMira™ tRPC" })),
  mealLog:          mealLogRouter,
  insulinEvent:     insulinEventRouter,
  iobHunter:        iobHunterRouter,
  conditionEvent:   conditionEventRouter,
  emotionalDistress: emotionalDistressRouter,
  patterns:         patternRouter,
  mira:             miraAIRouter,
  consent:          consentRouter,   // ADD THIS LINE
});
```

- [ ] **Step 3: Type-check**

```bash
cd c:/glumira-v7 && npx tsc --noEmit 2>&1 | grep -i consent
```

Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
cd c:/glumira-v7 && git add server/routes/consent.router.ts server/router.ts && git commit -m "feat(trpc): consent router — create, updateResearch, getResearch"
```

---

### Task 6: ConsentPage — extend interface + add research item

**Files:**
- Modify: `src/pages/ConsentPage.tsx`

- [ ] **Step 1: Extend ConsentItem interface**

Replace the existing `ConsentItem` interface at line 22:

```ts
interface ConsentItem {
  id: string;
  label: string;
  mandatory: boolean;
  link?: { text: string; href: string };
  sublabel?: string;
  badgeText?: string;
}
```

- [ ] **Step 2: Add research item to CONSENT_ITEMS**

At the end of the `CONSENT_ITEMS` array (after the `minor_consent` item, before the closing `]`), add:

```ts
  {
    id: "research_programme",
    label: "I voluntarily consent to contribute my anonymised glucose and insulin patterns to the GluMira™ Real-World Research Programme",
    mandatory: false,
    sublabel: "Your identity is never shared. Data is aggregated only. You may withdraw at any time from Settings → Research.",
    badgeText: "Optional — does not affect platform access",
    link: { text: "Learn more", href: "/research" },
  },
```

- [ ] **Step 3: Update the renderer to handle sublabel and badgeText**

In the `CONSENT_ITEMS.map()` block (around line 165), replace the `<span>` block for item label with:

```tsx
<span style={{ color: T.white, fontSize: 14, lineHeight: 1.55 }}>
  <span style={{ accentColor: item.mandatory ? T.teal : T.amber } as React.CSSProperties} />
  {item.label}
  {item.link && (
    <>
      {" "}
      <a
        href={item.link.href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: T.teal, textDecoration: "underline", textUnderlineOffset: 2 }}
        onClick={e => e.stopPropagation()}
      >
        {item.link.text}
      </a>
    </>
  )}
  {item.sublabel && (
    <div style={{ color: T.muted, fontSize: 12, marginTop: 4, lineHeight: 1.5 }}>
      {item.sublabel}
    </div>
  )}
  {item.badgeText && (
    <div style={{ display: "inline-block", marginTop: 6, background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 4, padding: "2px 8px", fontSize: 11, color: T.amber }}>
      {item.badgeText}
    </div>
  )}
  {!item.mandatory && !item.badgeText && (
    <span style={{ color: T.muted, fontSize: 12, marginLeft: 6 }}>(if applicable)</span>
  )}
</span>
```

- [ ] **Step 4: Add thin divider above research item**

Wrap the research item's `<label>` with a divider. In the map function, just before rendering `item.id === "research_programme"`:

```tsx
{item.id === "research_programme" && (
  <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12, marginTop: 4 }} />
)}
```

Add this as the first child inside the map, before `<label>`.

- [ ] **Step 5: Update handleContinue to use tRPC**

Replace the `fetch("/trpc/consent.create", ...)` call in `handleContinue` with:

```ts
try {
  await fetch("/trpc/consent.create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      "0": {
        json: {
          userId: user?.id ?? "anonymous",
          timestamp,
          consents: Object.entries(checked).filter(([, v]) => v).map(([id]) => id),
        },
      },
    }),
  });
} catch {
  // localStorage fallback already written above
}
```

- [ ] **Step 6: Type-check**

```bash
cd c:/glumira-v7 && npx tsc --noEmit 2>&1 | grep -i consent
```

Expected: 0 errors

- [ ] **Step 7: Commit**

```bash
cd c:/glumira-v7 && git add src/pages/ConsentPage.tsx && git commit -m "feat(consent): extend ConsentItem + add research opt-in with amber styling"
```

---

### Task 7: ResearchInfoPage

**Files:**
- Create: `src/pages/ResearchInfoPage.tsx`
- Modify: `App.tsx`

- [ ] **Step 1: Create ResearchInfoPage.tsx**

```tsx
// src/pages/ResearchInfoPage.tsx
/**
 * GluMira™ V7 — Research Programme Info Page
 * Route: /research
 * Plain-language IRB-aligned description. Reuses privacy/terms styling.
 */
import { Link } from "react-router-dom";

const T = {
  navy:    "#1a2a5e",
  teal:    "#2ab5c1",
  muted:   "#64748b",
  border:  "#e2e8f0",
  bg:      "#f8f9fa",
  heading: "'Playfair Display', Georgia, serif",
  body:    "'DM Sans', -apple-system, sans-serif",
};

export default function ResearchInfoPage() {
  return (
    <div style={{ minHeight: "100vh", background: T.bg, padding: "40px 24px", fontFamily: T.body }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <Link to="/" style={{ color: T.teal, fontSize: 14, textDecoration: "none" }}>← Back</Link>

        <h1 style={{ fontFamily: T.heading, color: T.navy, fontSize: 28, margin: "20px 0 8px" }}>
          GluMira™ Real-World Research Programme
        </h1>
        <p style={{ color: T.muted, fontSize: 14, marginBottom: 32 }}>
          Voluntary · Anonymous · Withdrawable at any time
        </p>

        {[
          {
            title: "What data is collected",
            body: "Anonymised glucose patterns, insulin dose ranges, and module inputs (e.g. menopause stage, diet type). No names, emails, locations, or any identifying information is ever collected for research purposes.",
          },
          {
            title: "How it is used",
            body: "Data is aggregated across participants to identify real-world patterns in T1D management. Findings may be used to improve GluMira's algorithms, published in academic journals (aggregate only), or shared with research partners under strict anonymisation agreements. No individual data is ever shared.",
          },
          {
            title: "Who has access",
            body: "GluMira's internal research team only. Third parties receive aggregated, de-identified statistical summaries — never raw data.",
          },
          {
            title: "Your rights",
            body: "Participation is entirely voluntary and has no effect on your access to GluMira's features. You may withdraw at any time from Settings → Research. Withdrawal stops future data collection immediately. Previously collected data remains in aggregated form (it cannot be individually identified or removed from aggregate summaries).",
          },
          {
            title: "Legal basis",
            body: "Data processing is based on explicit informed consent under GDPR Article 9(2)(a) for special category health data used for research purposes, with appropriate anonymisation safeguards.",
          },
        ].map(section => (
          <div
            key={section.title}
            style={{ background: "#fff", border: `1px solid ${T.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}
          >
            <h3 style={{ fontFamily: T.heading, color: T.navy, fontSize: 17, margin: "0 0 10px" }}>{section.title}</h3>
            <p style={{ color: "#374151", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{section.body}</p>
          </div>
        ))}

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <Link
            to="/app-settings"
            style={{ display: "inline-block", background: T.teal, color: "#fff", padding: "12px 28px", borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: "none" }}
          >
            Manage research preferences in Settings
          </Link>
        </div>

        <p style={{ textAlign: "center", color: T.muted, fontSize: 12, marginTop: 24, lineHeight: 1.6 }}>
          Questions? Contact us at privacy@glumira.ai
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add lazy import + route to App.tsx**

After the `ResearchInfoPage` comment block (after the `ConsentPage` import area), add:

```tsx
const ResearchInfoPage = lazy(() => import("@/pages/ResearchInfoPage"));
```

Add route after the `/onboarding/consent` route:

```tsx
<Route path="/research" element={<ResearchInfoPage />} />
```

Also add `/research` to the `CHROMELESS` array (line 153) so the app sidebar is hidden:

```ts
const CHROMELESS = ["/", "/v2", "/auth", "/auth/callback", "/dev", "/tutorial", "/onboarding/region", "/onboarding/consent", "/privacy", "/terms", "/launch", "/demo", "/pricing", "/science", "/research"];
```

- [ ] **Step 3: Type-check**

```bash
cd c:/glumira-v7 && npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 4: Commit**

```bash
cd c:/glumira-v7 && git add src/pages/ResearchInfoPage.tsx App.tsx && git commit -m "feat(pages): ResearchInfoPage at /research — IRB-aligned plain-language info"
```

---

### Task 8: SettingsPage — Research toggle

**Files:**
- Modify: `src/pages/SettingsPage.tsx`

- [ ] **Step 1: Inspect SettingsPage structure**

```bash
grep -n "section\|Section\|useState\|useEffect\|export default" c:/glumira-v7/src/pages/SettingsPage.tsx | head -30
```

Note the pattern used for existing settings sections before continuing.

- [ ] **Step 2: Add research consent state**

Near the top of the `SettingsPage` component function (with other `useState` hooks), add:

```tsx
const [researchConsent, setResearchConsent] = useState(false);
const [researchLoading, setResearchLoading] = useState(false);
```

- [ ] **Step 3: Load current research consent on mount**

Add a `useEffect` after existing ones:

```tsx
useEffect(() => {
  const stored = localStorage.getItem("glumira_consent");
  if (stored) {
    try {
      const record = JSON.parse(stored);
      setResearchConsent(Array.isArray(record.consents) && record.consents.includes("research_programme"));
    } catch { /* ignore */ }
  }
}, []);
```

- [ ] **Step 4: Add toggle handler**

```tsx
const handleResearchToggle = async (enabled: boolean) => {
  setResearchLoading(true);
  setResearchConsent(enabled);

  // Update localStorage
  try {
    const stored = localStorage.getItem("glumira_consent");
    const record = stored ? JSON.parse(stored) : { consents: [] };
    record.consents = enabled
      ? [...new Set([...record.consents, "research_programme"])]
      : record.consents.filter((c: string) => c !== "research_programme");
    localStorage.setItem("glumira_consent", JSON.stringify(record));
  } catch { /* ignore */ }

  // Sync to server
  try {
    await fetch("/trpc/consent.updateResearch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ "0": { json: { researchConsent: enabled } } }),
    });
  } catch { /* server sync best-effort */ }

  setResearchLoading(false);
};
```

- [ ] **Step 5: Add Research section to the page JSX**

Find where the last settings section ends in the JSX return (typically before the closing `</div>`). Add a Research section in the same style as existing sections:

```tsx
{/* Research Programme */}
<div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}>
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <div>
      <div style={{ fontWeight: 600, color: "#1a2a5e", fontSize: 15, marginBottom: 4 }}>Research Programme</div>
      <div style={{ color: "#64748b", fontSize: 13, lineHeight: 1.5 }}>
        Contribute anonymised glucose patterns to GluMira™ research.{" "}
        <a href="/research" style={{ color: "#2ab5c1" }}>Learn more</a>
      </div>
    </div>
    <button
      onClick={() => handleResearchToggle(!researchConsent)}
      disabled={researchLoading}
      style={{
        width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
        background: researchConsent ? "#2ab5c1" : "#e2e8f0",
        position: "relative", transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: researchConsent ? 25 : 3,
        width: 20, height: 20, borderRadius: 10,
        background: "#fff", transition: "left 0.2s",
      }} />
    </button>
  </div>
</div>
```

- [ ] **Step 6: Type-check**

```bash
cd c:/glumira-v7 && npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 7: Commit**

```bash
cd c:/glumira-v7 && git add src/pages/SettingsPage.tsx && git commit -m "feat(settings): Research Programme toggle — opt-in/out with localStorage + server sync"
```

---

### Task 9: Final verification + git push

- [ ] **Step 1: Run all tests**

```bash
cd c:/glumira-v7 && npm run test:run
```

Expected: all existing tests pass + 6 new menopause-engine tests pass

- [ ] **Step 2: Full type-check**

```bash
cd c:/glumira-v7 && npx tsc --noEmit
```

Expected: 0 errors

- [ ] **Step 3: Verify routes exist**

```bash
grep -n "menopause\|/research" c:/glumira-v7/App.tsx
```

Expected: `/modules/menopause` and `/research` routes present

- [ ] **Step 4: Push**

```bash
cd c:/glumira-v7 && git push
```

---

## Self-Review Checklist

**Spec coverage:**

| Requirement | Task |
| --- | --- |
| `src/lib/menopause-engine.ts` | Task 1 |
| `src/pages/MenopauseModule.tsx` | Task 2 |
| App.tsx routing + AppSidebar | Task 3 |
| `drizzle/schema.ts` user_consents | Task 4 |
| `consent.create` tRPC handler | Task 5 |
| `consent.updateResearch` tRPC handler | Task 5 |
| ConsentItem interface extension | Task 6 |
| Research item + amber styling | Task 6 |
| `src/pages/ResearchInfoPage.tsx` | Task 7 |
| `/research` route + CHROMELESS | Task 7 |
| Settings Research toggle | Task 8 |
| tsc passes | Task 9 |
| All tests pass | Task 9 |

All spec requirements covered. No placeholders. Types consistent across tasks (`MenopauseInput`, `MenopauseAnalysisResult`, `consentRouter`, `userConsents`).
