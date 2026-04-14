/**
 * GluMira™ V7 — IOB Hunter v7 · Canonical Insulin Profiles
 *
 * Phase 1 foundation commit. Every PK value is cited from a primary source
 * (FDA label, EMA SmPC, or peer-reviewed PK study with PMID). No hardcoded
 * values in the engine — everything the engine needs is read from this table.
 *
 * Canonical rules enforced:
 *   - ALPHABETICAL ORDER by brand_name (Actrapid first, Tresiba last)
 *   - Tresiba: `is_peakless: true, decay_model: 'depot_release'` — NEVER draw spikes
 *   - Levemir: `decay_model: 'albumin_bound'` — dose-dependent DOA from Plank 2005
 *   - Lantus/Basaglar: `is_peakless: false` — small broad peak per clamp data, NOT marketing
 *   - Every profile has `pk_source` citation
 *   - Colours are VIVID per-insulin (not brand palette)
 *
 * Source document: 05.8_IOB-Hunter-V7-PK-Research_v1.1.md (founder-approved 2026-04-12)
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import type { InsulinProfile } from "@/iob-hunter/types";

/**
 * Master profile list — alphabetical by brand_name.
 * Biosimilars and regional aliases are in `insulin-regions.ts`, not here.
 */
export const INSULIN_PROFILES: readonly InsulinProfile[] = [
  // ── 1. Actrapid ──────────────────────────────────────────────────────
  // pk_source: FDA NDA 018780 Humulin R (2015) · Novo Nordisk Actrapid SmPC EMA/H/C/424
  {
    brand_name: "Actrapid",
    generic_name: "regular human insulin",
    manufacturer: "Novo Nordisk",
    category: "short",
    onset_minutes: 30,
    peak_start_minutes: 120,
    peak_end_minutes: 240,
    duration_minutes: 480,       // 8h typical; dose-dependent up to 14h
    is_peakless: false,
    decay_model: "exponential",
    decay_parameters: {
      sc_half_life_minutes: 86,
      iv_half_life_minutes: 17,
      dose_dependent_doa: true,
      im_onset_minutes: 12,      // founder-critical: IM route is faster
      im_duration_minutes: 300,  // ~5h IM vs ~8h SC
    },
    mechanism_notes: "Soluble zinc-hexamer. Hexamers dissociate to dimers then monomers before absorption. Dissociation is rate-limiting.",
    pk_source: "FDA NDA 018780 · EMA/H/C/424",
    is_active: true,
    colour: "#C27200",
  },

  // ── 2. Apidra ────────────────────────────────────────────────────────
  // pk_source: FDA NDA 021629 Apidra (2007)
  {
    brand_name: "Apidra",
    generic_name: "insulin glulisine",
    manufacturer: "Sanofi",
    category: "rapid",
    onset_minutes: 10,
    peak_start_minutes: 45,
    peak_end_minutes: 75,
    duration_minutes: 240,       // 4h — shortest of all rapids
    is_peakless: false,
    decay_model: "exponential",
    decay_parameters: {
      sc_half_life_minutes: 42,  // fastest of all rapids
      iv_half_life_minutes: 13,
      volume_distribution_L: 13,
      no_zinc_stabilization: true,
    },
    mechanism_notes: "Asp3→Lys + Lys29→Glu prevents hexamer self-association. No zinc — monomers available immediately.",
    pk_source: "FDA NDA 021629",
    is_active: true,
    colour: "#FF6B9D",
  },

  // ── 3. Basaglar ──────────────────────────────────────────────────────
  // pk_source: FDA NDA 205692 · ELEMENT 5 PMC6349279
  // Biosimilar of Lantus — same molecule, same mechanism, same PK
  // Founder resolution 4.3: is_peakless: false — lab result, not marketing
  {
    brand_name: "Basaglar",
    generic_name: "insulin glargine U-100 (biosimilar)",
    manufacturer: "Eli Lilly",
    category: "long",
    onset_minutes: 90,
    peak_start_minutes: 240,     // 4h — broad, low peak per clamp data
    peak_end_minutes: 720,       // 12h
    duration_minutes: 1440,
    is_peakless: false,          // FOUNDER RESOLUTION 4.3: lab data, never marketing
    decay_model: "microprecipitate",
    decay_parameters: {
      sc_half_life_minutes: 780, // 13h terminal
      plateau_minutes: 1200,
      steady_state_days: 3,
      cv_within_subject_pct: 82, // 4× higher than Tresiba
    },
    mechanism_notes: "Microprecipitates at subcutaneous pH — slow, near-constant release. Identical to Lantus.",
    pk_source: "FDA NDA 205692 · ELEMENT 5 PMC6349279",
    is_active: true,
    colour: "#4DB6AC",
  },

  // ── 4. Fiasp ─────────────────────────────────────────────────────────
  // pk_source: PMC7007438 Heise 2017 · PMC6373292 Buckley 2018 · FDA NDA 208751
  {
    brand_name: "Fiasp",
    generic_name: "faster aspart",
    manufacturer: "Novo Nordisk",
    category: "ultra-rapid",
    onset_minutes: 3,            // 2.5 min in blood, 20-30 min glucose effect
    peak_start_minutes: 60,
    peak_end_minutes: 90,
    duration_minutes: 300,
    is_peakless: false,
    decay_model: "exponential",
    decay_parameters: {
      sc_half_life_minutes: 57,
      niacinamide_accelerated: true,
      arginine_stabilized: true,
      blood_appearance_minutes: 2.5,
      cmax_minutes: 63,
      early_exposure_multiplier_vs_novorapid: 2.0,
    },
    mechanism_notes: "Aspart + niacinamide (~35% more monomers, ~27% more endothelial permeability) + L-arginine for stability.",
    pk_source: "PMC7007438 Heise 2017 · PMC6373292 Buckley 2018 · FDA NDA 208751",
    is_active: true,
    colour: "#E84040",
  },

  // ── 5. Humalog ───────────────────────────────────────────────────────
  // pk_source: FDA NDA 020563 · PMC7716902 Leohr 2020
  {
    brand_name: "Humalog",
    generic_name: "insulin lispro",
    manufacturer: "Eli Lilly",
    category: "rapid",
    onset_minutes: 15,
    peak_start_minutes: 60,
    peak_end_minutes: 90,
    duration_minutes: 330,       // 5.5h — midpoint of 4.7-7.3 range
    is_peakless: false,
    decay_model: "exponential",
    decay_parameters: {
      sc_half_life_minutes: 90,
      lys_pro_reversal: true,
      first_rapid_analog: true,  // approved 1996
    },
    mechanism_notes: "Pro28→Lys + Lys29→Pro prevents hexamer self-association. First rapid-acting analog (1996).",
    pk_source: "FDA NDA 020563 · PMC7716902 Leohr 2020",
    is_active: true,
    colour: "#F06292",
  },

  // ── 6. Humulin N ─────────────────────────────────────────────────────
  // pk_source: FDA NDA 018781 (2022 revision)
  {
    brand_name: "Humulin N",
    generic_name: "NPH isophane insulin",
    manufacturer: "Eli Lilly",
    category: "intermediate",
    onset_minutes: 90,
    peak_start_minutes: 240,
    peak_end_minutes: 480,       // broad peak 4-8h
    duration_minutes: 960,       // 16h typical, up to 24h at high doses
    is_peakless: false,
    decay_model: "exponential",
    decay_parameters: {
      sc_half_life_minutes: 360,
      crystalline_suspension: true,
      protamine_zinc: true,
      dose_dependent_doa: true,
    },
    mechanism_notes: "Protamine-zinc crystalline suspension (NPH, 1946). Gaussian-like peak. Cheapest basal option for low-resource settings.",
    pk_source: "FDA NDA 018781 (2022 revision)",
    is_active: true,
    colour: "#9575CD",
  },

  // ── 7. Insulatard ────────────────────────────────────────────────────
  // pk_source: EMA SmPC Insulatard — same molecule as Humulin N
  {
    brand_name: "Insulatard",
    generic_name: "NPH isophane insulin",
    manufacturer: "Novo Nordisk",
    category: "intermediate",
    onset_minutes: 90,
    peak_start_minutes: 240,
    peak_end_minutes: 480,
    duration_minutes: 960,
    is_peakless: false,
    decay_model: "exponential",
    decay_parameters: {
      sc_half_life_minutes: 360,
      crystalline_suspension: true,
      protamine_zinc: true,
      dose_dependent_doa: true,
    },
    mechanism_notes: "EU/UK/AF equivalent of Humulin N. Same molecule, different brand.",
    pk_source: "EMA SmPC Insulatard",
    is_active: true,
    colour: "#7E57C2",
  },

  // ── 8. Lantus ────────────────────────────────────────────────────────
  // pk_source: FDA NDA 021081 (2019 revision) · Heise 2012 PMID:22642570
  // FOUNDER RESOLUTION 4.3: is_peakless: false — always lab result, never marketing
  {
    brand_name: "Lantus",
    generic_name: "insulin glargine U-100",
    manufacturer: "Sanofi",
    category: "long",
    onset_minutes: 90,
    peak_start_minutes: 240,     // 4h — broad, low peak per clamp data
    peak_end_minutes: 720,       // 12h
    duration_minutes: 1440,
    is_peakless: false,          // FOUNDER RESOLUTION 4.3: lab data, never marketing
    decay_model: "microprecipitate",
    decay_parameters: {
      sc_half_life_minutes: 780, // 13h terminal
      plateau_minutes: 1200,
      steady_state_days: 3,
      cv_within_subject_pct: 82, // 4× higher than Tresiba
      isoelectric_point_shift: true,
    },
    mechanism_notes: "Microprecipitates at subcutaneous pH 7.4. Depot geometry varies → CV 82% (4× Tresiba).",
    pk_source: "FDA NDA 021081 (2019) · PMID:22642570 Heise 2012",
    is_active: true,
    colour: "#26A69A",
  },

  // ── 9. Levemir ───────────────────────────────────────────────────────
  // pk_source: Plank 2005 PMID:15855574 · Havelund 2004 PMID:15359587
  // CRITICAL: dose-dependent DOA — the foundational finding for this engine
  {
    brand_name: "Levemir",
    generic_name: "insulin detemir",
    manufacturer: "Novo Nordisk",
    category: "long",
    onset_minutes: 120,          // Plank 2005 — slow ramp from depot
    peak_start_minutes: null,    // NO clinical peak — flat plateau (albumin buffered)
    peak_end_minutes: null,
    duration_minutes: 1200,      // 20h AT 0.4 U/kg — default for adults
    is_peakless: true,           // buffered flat plateau
    decay_model: "albumin_bound",
    decay_parameters: {
      albumin_bound_pct: 98,
      primary_protraction: "subcutaneous_depot",
      secondary_protraction: "albumin_buffering",
      depot_t50_hours: 10.2,
      dose_dependent_doa: true,
      // Plank 2005 Table 1 — dose-dependent duration of action
      // Engine uses resolveEffectiveDOA() to interpolate from this table
      doa_0_1: 342,   // 5.7h  at 0.1 U/kg → minutes
      doa_0_2: 726,   // 12.1h at 0.2 U/kg → minutes
      doa_0_4: 1194,  // 19.9h at 0.4 U/kg → minutes
      doa_0_8: 1362,  // 22.7h at 0.8 U/kg → minutes
      doa_1_6: 1392,  // 23.2h at 1.6 U/kg → minutes
    },
    mechanism_notes: "C14 fatty acid at LysB29 → >98% albumin-bound. Dihexamers at depot (T50% 10.2h). DOA is dose-dependent (Plank 2005).",
    pk_source: "Plank 2005 PMID:15855574 · Havelund 2004 PMID:15359587",
    is_active: true,
    colour: "#5B8FD4",
  },

  // ── 10. Lyumjev ──────────────────────────────────────────────────────
  // pk_source: FDA NDA 761109 · PMC7716902 Leohr 2020
  {
    brand_name: "Lyumjev",
    generic_name: "ultra-rapid lispro",
    manufacturer: "Eli Lilly",
    category: "ultra-rapid",
    onset_minutes: 16,           // midpoint of 15-17
    peak_start_minutes: 50,
    peak_end_minutes: 70,
    duration_minutes: 360,       // 6h — midpoint of 4.7-7.3
    is_peakless: false,
    decay_model: "exponential",
    decay_parameters: {
      sc_half_life_minutes: 44,  // IV median
      treprostinil_accelerated: true,
      citrate_permeability: true,
      early_exposure_multiplier_vs_humalog: 7.2,
      late_exposure_reduction_pct: 26,
    },
    mechanism_notes: "Lispro + treprostinil (vasodilation) + citrate (permeability). 7.2× early exposure vs Humalog, 26% less late exposure.",
    pk_source: "FDA NDA 761109 · PMC7716902 Leohr 2020",
    is_active: true,
    colour: "#EC407A",
  },

  // ── 11. NovoRapid ────────────────────────────────────────────────────
  // pk_source: EMA SmPC NovoRapid · FDA NDA 020986 NovoLog · PMC7007438 Heise 2017
  {
    brand_name: "NovoRapid",
    generic_name: "insulin aspart",
    manufacturer: "Novo Nordisk",
    category: "rapid",
    onset_minutes: 15,
    peak_start_minutes: 60,
    peak_end_minutes: 90,
    duration_minutes: 300,
    is_peakless: false,
    decay_model: "exponential",
    decay_parameters: {
      sc_half_life_minutes: 75,
      asp_b28_substitution: true,
      blood_appearance_minutes: 5.2,
      cmax_minutes: 70,
    },
    mechanism_notes: "Pro28→Asp disrupts hexamer self-association. Same amino acid sequence as Fiasp, different excipients.",
    pk_source: "EMA SmPC NovoRapid · FDA NDA 020986 · PMC7007438",
    is_active: true,
    colour: "#FF8A65",
  },

  // ── 12. Toujeo ───────────────────────────────────────────────────────
  // pk_source: PMC5501629 · Becker 2015 PMID:25287289
  {
    brand_name: "Toujeo",
    generic_name: "insulin glargine U-300",
    manufacturer: "Sanofi",
    category: "ultra-long",
    onset_minutes: 360,          // 6h — slower than Lantus
    peak_start_minutes: 720,     // 12h broad, gentle
    peak_end_minutes: 1080,      // 18h
    duration_minutes: 2160,      // 36h practical DOA
    is_peakless: true,           // flatter than Lantus — treated as peakless for engine simplicity
    decay_model: "depot_release",
    decay_parameters: {
      sc_half_life_minutes: 1140, // 19h at steady state
      concentration: "U-300",
      steady_state_days: 4,
      dose_increment_vs_lantus_pct: 12, // typical 10-18% higher dosing
    },
    mechanism_notes: "U-300 glargine — smaller depot surface → slower release → flatter, longer profile than Lantus.",
    pk_source: "PMC5501629 · Becker 2015 PMID:25287289",
    is_active: true,
    colour: "#42A5F5",
  },

  // ── 13. Tresiba ──────────────────────────────────────────────────────
  // pk_source: Heise 2012 PMID:22642570 · Jonassen 2012 PMID:22271189 · FDA NDA 203314
  // CANONICAL RULE: is_peakless: true — LOCKED. NEVER draw spikes.
  {
    brand_name: "Tresiba",
    generic_name: "insulin degludec",
    manufacturer: "Novo Nordisk",
    category: "ultra-long",
    onset_minutes: 60,
    peak_start_minutes: null,    // PEAKLESS — LOCKED
    peak_end_minutes: null,      // PEAKLESS — LOCKED
    duration_minutes: 2520,      // 42h conservative; effective >42h at steady state
    is_peakless: true,           // LOCKED — never changes
    decay_model: "depot_release",
    decay_parameters: {
      sc_half_life_minutes: 1524,      // 25.4h (Heise 2012)
      steady_state_days: 3,
      distribution_per_6h_0: 0.23,     // even distribution across 24h
      distribution_per_6h_1: 0.28,
      distribution_per_6h_2: 0.26,
      distribution_per_6h_3: 0.23,
      cv_within_subject_pct: 20,       // 4× lower than Lantus
      primary_protraction: "multi_hexamer_depot",
      albumin_bound_pct: 0,            // NOT albumin-bound
    },
    mechanism_notes:
      "Degludec forms multi-hexamers at injection site. Zinc diffuses from chain ends, releasing monomers "
      + "at a near-constant rate for 42+ h. True depot release. NEVER has a peak.",
    pk_source: "Heise 2012 PMID:22642570 · Jonassen 2012 PMID:22271189 · FDA NDA 203314",
    is_active: true,
    colour: "#1976D2",
  },
] as const;

/**
 * Lookup helper. Returns the canonical profile for a brand_name, or null.
 * Callers that accept regional aliases should resolve via `insulin-regions.ts`
 * first, then pass the canonical name here.
 */
export function findProfile(brandName: string): InsulinProfile | null {
  const profile = INSULIN_PROFILES.find(
    (p) => p.brand_name.toLowerCase() === brandName.toLowerCase(),
  );
  return profile ?? null;
}

/**
 * Full list sorted by brand_name (redundant but explicit — the array is
 * already alphabetical, this is for callers that want defensive ordering).
 */
export function getAllProfiles(): InsulinProfile[] {
  return [...INSULIN_PROFILES].sort((a, b) =>
    a.brand_name.localeCompare(b.brand_name),
  );
}
