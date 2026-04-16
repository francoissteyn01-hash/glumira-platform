/**
 * GluMira™ V7 — Insulin Curve Glossary
 *
 * Educator-facing reference data for each insulin's pharmacokinetic profile.
 * All values are sourced from the canonical `insulin-profiles.ts` — this file
 * adds plain-language descriptions, display metadata, and primary citations
 * for use in the educator glossary UI.
 *
 * ENGINE INTEGRITY NOTE:
 * This file is read-only reference data. It does NOT feed the IOB engine.
 * The engine reads exclusively from `src/iob-hunter/engine/insulin-profiles.ts`.
 * Any discrepancy between this file and insulin-profiles.ts is an error in
 * THIS file — insulin-profiles.ts is the single source of truth.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

export type CurveShape = "peakless_plateau" | "bell" | "broad_low_peak" | "rapid_triangle";
export type DecayModelLabel = "Bateman two-compartment" | "Albumin-bound depot" | "Depot release" | "Microprecipitate";
export type InsulinCategory = "ultra-long" | "long" | "intermediate" | "short" | "rapid" | "ultra-rapid";

export type GlossaryEntry = {
  /** Canonical brand name — matches insulin-profiles.ts brand_name exactly. */
  brandName: string;
  genericName: string;
  manufacturer: string;
  category: InsulinCategory;

  /** Curve shape for visual description. */
  curveShape: CurveShape;

  /** Plain-language description of the activity profile. */
  profileDescription: string;

  /** Key PK numbers from insulin-profiles.ts — kept in sync, not derived here. */
  pk: {
    onsetMinutes: number;
    /** Null for peakless insulins. */
    peakStartMinutes: number | null;
    peakEndMinutes: number | null;
    /** Default duration in minutes. For Levemir, this is at 0.4 U/kg. */
    durationMinutes: number;
    ispeakless: boolean;
    /** Human-readable note on duration variability where applicable. */
    durationNote?: string;
  };

  /** The decay model used by the engine. Never simplified to a single formula here. */
  engineDecayModel: DecayModelLabel;

  /**
   * What the engine actually calculates — plain language.
   * Avoids showing IOB(t) = e^{-λt} which is only valid for simple exponentials
   * and is wrong for albumin_bound, depot_release, and microprecipitate models.
   */
  engineCalculationNote: string;

  /** Primary pharmacokinetic source — matches pk_source in insulin-profiles.ts. */
  pkSource: string;
  pkSourceUrl?: string;

  /** Colour from insulin-profiles.ts (for visual consistency). */
  colour: string;

  /** Clinical context — when and why this insulin is typically used. */
  clinicalContext: string;

  /**
   * Plank 2005 relevance note.
   * Plank 2005 (PMID:15855574) is specifically about Levemir dose-dependent DOA.
   * It is NOT a generic decay formula for all insulins.
   */
  plank2005Note?: string;
}

/**
 * Glossary entries — 5 insulins covered in the SUBJ-001 and SUBJ-002 case studies.
 * Extend to all 13 profiles from insulin-profiles.ts over time.
 */
export const INSULIN_CURVE_GLOSSARY: Record<string, GlossaryEntry> = {

  // ── Tresiba (Degludec) ──────────────────────────────────────────────────
  Tresiba: {
    brandName: "Tresiba",
    genericName: "insulin degludec",
    manufacturer: "Novo Nordisk",
    category: "ultra-long",
    curveShape: "peakless_plateau",
    profileDescription:
      "True peakless basal. Degludec forms multi-hexamer chains at the injection site; zinc diffuses slowly from the chain ends, releasing monomers at a near-constant rate for 42+ hours. The activity curve is genuinely flat — no peak, no trough. Steady state reached after 3 days of once-daily dosing.",
    pk: {
      onsetMinutes: 60,
      peakStartMinutes: null,
      peakEndMinutes: null,
      durationMinutes: 2520,       // 42h conservative
      ispeakless: true,
      durationNote: "Practical DOA >42h at steady state. Once-daily dosing only.",
    },
    engineDecayModel: "Depot release",
    engineCalculationNote:
      "Bateman two-compartment: slow absorption from multi-hexamer depot (kₐ ≈ 0.06/h), plasma clearance via 25.4h half-life (kₑ = ln2/25.4h). Produces a smooth, nearly horizontal curve with no peak.",
    pkSource: "Heise 2012 PMID:22642570 · Jonassen 2012 PMID:22271189 · FDA NDA 203314",
    pkSourceUrl: "https://pubmed.ncbi.nlm.nih.gov/22642570/",
    colour: "#1976D2",
    clinicalContext:
      "Preferred once-daily basal for stable adults where predictability and low CV (20%) matter. Cadence is locked at 1×/24h — never split into two doses.",
  },

  // ── Levemir (Detemir) ───────────────────────────────────────────────────
  Levemir: {
    brandName: "Levemir",
    genericName: "insulin detemir",
    manufacturer: "Novo Nordisk",
    category: "long",
    curveShape: "peakless_plateau",
    profileDescription:
      "Peakless long-acting basal with a flat plateau shape, not a bell curve. A C14 fatty acid chain causes >98% of detemir to bind to albumin in the blood, creating a large circulating reservoir that slowly releases free insulin. This albumin buffering produces a protracted, flat activity profile. Duration of action is dose-dependent (Plank 2005): 5.7h at 0.1 U/kg up to 23.2h at 1.6 U/kg.",
    pk: {
      onsetMinutes: 120,
      peakStartMinutes: null,       // Explicitly peakless — flat plateau
      peakEndMinutes: null,
      durationMinutes: 1200,        // 20h at 0.4 U/kg adult reference dose
      ispeakless: true,
      durationNote: "Dose-dependent: 5.7h (0.1 U/kg) → 23.2h (1.6 U/kg). Value above is at 0.4 U/kg. Engine interpolates from Plank 2005 Table 1.",
    },
    engineDecayModel: "Albumin-bound depot",
    engineCalculationNote:
      "Three-phase albumin-bound model: ramp (0→120 min, 0%→90% on board), plateau (120 min → 70% of DOA, drifting 90%→85%), tail (70%→100% DOA, 85%→0%). Effective DOA is resolved per-dose via Plank 2005 Table 1 using the patient's U/kg ratio.",
    pkSource: "Plank 2005 PMID:15855574 · Havelund 2004 PMID:15359587",
    pkSourceUrl: "https://pubmed.ncbi.nlm.nih.gov/15855574/",
    colour: "#5B8FD4",
    clinicalContext:
      "Typically BID (2×/12h) in adults, TID split in paediatric patients. The flat plateau makes trough depth predictable. Dose-dependent DOA means low doses (e.g. 0.1 U/kg) clear by 6h — important for paediatric regimen design.",
    plank2005Note:
      "Plank 2005 (PMID:15855574) is the foundational study for Levemir's dose-dependent duration of action. It is not a general-purpose decay formula for other insulins.",
  },

  // ── Fiasp (Faster Aspart) ───────────────────────────────────────────────
  Fiasp: {
    brandName: "Fiasp",
    genericName: "faster aspart",
    manufacturer: "Novo Nordisk",
    category: "ultra-rapid",
    curveShape: "rapid_triangle",
    profileDescription:
      "Ultra-rapid bolus with the fastest blood appearance of any commercial insulin. Niacinamide (~35% more monomers available, ~27% more endothelial permeability) combined with L-arginine stabilisation produces insulin in blood within 2.5 minutes of injection. Peak activity at 60–90 minutes. Total duration 5 hours.",
    pk: {
      onsetMinutes: 3,
      peakStartMinutes: 60,
      peakEndMinutes: 90,
      durationMinutes: 300,
      ispeakless: false,
    },
    engineDecayModel: "Bateman two-compartment",
    engineCalculationNote:
      "Exponential Bateman model: absorption rate (kₐ) and elimination rate (kₑ) derived via Newton's method from the midpoint peak time and DOA. Produces a right-skewed curve with rapid rise and slightly longer tail.",
    pkSource: "PMC7007438 Heise 2017 · PMC6373292 Buckley 2018 · FDA NDA 208751",
    pkSourceUrl: "https://pubmed.ncbi.nlm.nih.gov/29073999/",
    colour: "#E84040",
    clinicalContext:
      "Best matched to fast-absorbing meals. The 2.5-minute blood appearance allows dosing at meal start rather than 15–20 minutes prior. 5h DOA means significant tail at 3–4h — relevant for stacking risk.",
  },

  // ── Humulin R ───────────────────────────────────────────────────────────
  "Humulin N": {
    brandName: "Humulin N",
    genericName: "NPH isophane insulin",
    manufacturer: "Eli Lilly",
    category: "intermediate",
    curveShape: "bell",
    profileDescription:
      "Intermediate-acting basal with a broad Gaussian peak. Protamine-zinc crystalline suspension (NPH, 1946) dissolves slowly at the injection site. Peak activity 4–8h post-dose. Duration 16h typical, up to 24h at high doses. The variability (CV ~50–80%) makes it less predictable than modern long-acting analogs but it remains the most affordable basal option globally.",
    pk: {
      onsetMinutes: 90,
      peakStartMinutes: 240,
      peakEndMinutes: 480,
      durationMinutes: 960,         // 16h typical
      ispeakless: false,
      durationNote: "Duration dose-dependent: 12–24h. Typically split BID (2×/12h).",
    },
    engineDecayModel: "Bateman two-compartment",
    engineCalculationNote:
      "Exponential Bateman model using midpoint of peak window (360 min) and DOA. Produces the characteristic broad bell curve seen in published NPH clamp data.",
    pkSource: "FDA NDA 018781 (2022 revision)",
    pkSourceUrl: "https://www.accessdata.fda.gov/scripts/cder/daf/index.cfm?event=overview.process&ApplNo=018781",
    colour: "#9575CD",
    clinicalContext:
      "Most affordable basal option for low-resource settings. Standard BID split. High within-subject variability — the key reason modern analogs (Tresiba, Levemir) were developed. Still widely used in Africa, South Asia, and parts of MENA.",
  },

  // ── Actrapid ────────────────────────────────────────────────────────────
  Actrapid: {
    brandName: "Actrapid",
    genericName: "regular human insulin",
    manufacturer: "Novo Nordisk",
    category: "short",
    curveShape: "bell",
    profileDescription:
      "Short-acting soluble human insulin. Zinc hexamers dissociate to dimers then monomers before absorption — this dissociation step is rate-limiting and produces the characteristic slow onset (30–60 min) compared to rapid analogs. Peak 2–4h. Extended tail 6–8h (dose-dependent up to 14h at high doses). The long tail is the primary source of overnight-low risk in SUBJ-001 case study.",
    pk: {
      onsetMinutes: 30,
      peakStartMinutes: 120,
      peakEndMinutes: 240,
      durationMinutes: 480,         // 8h typical
      ispeakless: false,
      durationNote: "Dose-dependent up to 14h at high doses. IM route: onset 12 min, duration ~5h.",
    },
    engineDecayModel: "Bateman two-compartment",
    engineCalculationNote:
      "Exponential Bateman model using midpoint peak (180 min) and DOA (480 min). SC half-life 86 min. The long tail beyond 6h is captured by the Bateman curve naturally at low doses — no artificial tail extension needed.",
    pkSource: "FDA NDA 018780 · EMA/H/C/424",
    pkSourceUrl: "https://www.ema.europa.eu/en/medicines/human/EPAR/actrapid",
    colour: "#C27200",
    clinicalContext:
      "EU/UK equivalent of Humulin R. Standard pre-meal short-acting in low-resource and public health settings. Must be given 30 min before meals to match carb absorption. The 6–8h tail creates predictable overnight hypo risk — shown explicitly in SUBJ-001 case study.",
  },
};

/** Ordered list of keys for display in the glossary UI. */
export const GLOSSARY_DISPLAY_ORDER = ["Tresiba", "Levemir", "Fiasp", "Humulin N", "Actrapid"] as const;

/** Curve shape descriptions for use in UI labels. */
export const CURVE_SHAPE_LABELS: Record<CurveShape, string> = {
  peakless_plateau: "Flat plateau — no peak",
  bell: "Bell curve — defined peak",
  broad_low_peak: "Broad, low peak",
  rapid_triangle: "Sharp rapid triangle",
};
