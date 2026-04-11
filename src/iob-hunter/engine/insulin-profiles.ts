/**
 * GluMira™ V7 — IOB Hunter v7 · Canonical Insulin Profiles
 *
 * Alphabetical seed data for the IOB Hunter engine. Every profile cites its
 * PK source. No hardcoded values in the engine itself — everything the
 * engine needs is read from this table (or from the database once the v7
 * Supabase migration is applied).
 *
 * Canonical rules enforced:
 *   - ALPHABETICAL ORDER by brand_name (Actrapid first, Tresiba last)
 *   - Tresiba: `is_peakless: true, decay_model: 'flat_depot'` — NEVER draw spikes
 *   - Lantus/Basaglar: `decay_model: 'microprecipitate'` — near-flat, NOT Bateman
 *   - Every profile has `pk_source` citation
 *   - Colours are VIVID per-insulin (not brand palette)
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import type { InsulinProfile } from "@/iob-hunter/types";

/**
 * Master profile list — alphabetical by brand_name.
 * Biosimilars and regional aliases are in `insulin-regions.ts`, not here.
 */
export const INSULIN_PROFILES: readonly InsulinProfile[] = [
  {
    brand_name: "Actrapid",
    generic_name: "regular human insulin",
    manufacturer: "Novo Nordisk",
    category: "short",
    onset_minutes: 30,
    peak_start_minutes: 120,
    peak_end_minutes: 180,
    duration_minutes: 480,
    is_peakless: false,
    decay_model: "exponential",
    decay_parameters: { half_life_minutes: 150 },
    mechanism_notes: "Soluble human insulin, hexamer dissociation on absorption.",
    pk_source: "Novo Nordisk SmPC — Actrapid · EMA/H/C/424",
    is_active: true,
    colour: "#C27200", // dark amber
  },
  {
    brand_name: "Apidra",
    generic_name: "insulin glulisine",
    manufacturer: "Sanofi",
    category: "rapid",
    onset_minutes: 10,
    peak_start_minutes: 45,
    peak_end_minutes: 75,
    duration_minutes: 270,
    is_peakless: false,
    decay_model: "exponential",
    decay_parameters: { half_life_minutes: 75 },
    mechanism_notes: "Rapid-acting analog. No zinc stabilisation — faster monomer formation.",
    pk_source: "FDA DailyMed — Apidra (NDA 021629)",
    is_active: true,
    colour: "#FF6B9D", // pink-coral
  },
  {
    brand_name: "Basaglar",
    generic_name: "insulin glargine U-100 (biosimilar)",
    manufacturer: "Eli Lilly",
    category: "long",
    onset_minutes: 120,
    peak_start_minutes: null,
    peak_end_minutes: null,
    duration_minutes: 1440,
    is_peakless: true,
    decay_model: "microprecipitate",
    decay_parameters: { plateau_minutes: 1200 },
    mechanism_notes: "Microprecipitates at subcutaneous pH — slow, near-constant release.",
    pk_source: "FDA DailyMed — Basaglar (BLA 205692)",
    is_active: true,
    colour: "#4DB6AC", // muted teal
  },
  {
    brand_name: "Fiasp",
    generic_name: "faster aspart",
    manufacturer: "Novo Nordisk",
    category: "ultra-rapid",
    onset_minutes: 3,
    peak_start_minutes: 50,
    peak_end_minutes: 70,
    duration_minutes: 300,
    is_peakless: false,
    decay_model: "exponential",
    decay_parameters: { half_life_minutes: 90 },
    mechanism_notes: "Aspart + niacinamide-accelerated absorption (~5min faster onset than NovoRapid).",
    pk_source: "EMA SmPC — Fiasp · PMID:28055157",
    is_active: true,
    colour: "#E84040", // vivid red
  },
  {
    brand_name: "Humalog",
    generic_name: "insulin lispro",
    manufacturer: "Eli Lilly",
    category: "rapid",
    onset_minutes: 15,
    peak_start_minutes: 60,
    peak_end_minutes: 90,
    duration_minutes: 300,
    is_peakless: false,
    decay_model: "exponential",
    decay_parameters: { half_life_minutes: 90 },
    mechanism_notes: "First rapid-acting analog (1996). Lys-Pro reversal prevents hexamer formation.",
    pk_source: "FDA DailyMed — Humalog (NDA 020563)",
    is_active: true,
    colour: "#F06292", // soft coral
  },
  {
    brand_name: "Humulin N",
    generic_name: "NPH isophane insulin",
    manufacturer: "Eli Lilly",
    category: "intermediate",
    onset_minutes: 90,
    peak_start_minutes: 240,
    peak_end_minutes: 360,
    duration_minutes: 960,
    is_peakless: false,
    decay_model: "exponential",
    decay_parameters: { half_life_minutes: 360 },
    mechanism_notes: "Protamine-zinc crystalline suspension — Gaussian-ish peak curve.",
    pk_source: "FDA DailyMed — Humulin N (NDA 018780)",
    is_active: true,
    colour: "#9575CD", // lavender
  },
  {
    brand_name: "Insulatard",
    generic_name: "NPH isophane insulin",
    manufacturer: "Novo Nordisk",
    category: "intermediate",
    onset_minutes: 90,
    peak_start_minutes: 240,
    peak_end_minutes: 360,
    duration_minutes: 960,
    is_peakless: false,
    decay_model: "exponential",
    decay_parameters: { half_life_minutes: 360 },
    mechanism_notes: "EU/UK equivalent of Humulin N. Same PK profile, different brand.",
    pk_source: "EMA SmPC — Insulatard",
    is_active: true,
    colour: "#7E57C2", // deeper lavender
  },
  {
    brand_name: "Lantus",
    generic_name: "insulin glargine U-100",
    manufacturer: "Sanofi",
    category: "long",
    onset_minutes: 120,
    peak_start_minutes: null,
    peak_end_minutes: null,
    duration_minutes: 1440,
    is_peakless: true,
    decay_model: "microprecipitate",
    decay_parameters: { plateau_minutes: 1200 },
    mechanism_notes: "Microprecipitates at subcutaneous pH — slow, near-constant release over 24h.",
    pk_source: "FDA DailyMed — Lantus (NDA 021081)",
    is_active: true,
    colour: "#26A69A", // clear teal
  },
  {
    brand_name: "Levemir",
    generic_name: "insulin detemir",
    manufacturer: "Novo Nordisk",
    category: "long",
    onset_minutes: 120,
    peak_start_minutes: 360,
    peak_end_minutes: 720,
    duration_minutes: 1200,
    is_peakless: false,
    decay_model: "exponential",
    decay_parameters: { half_life_minutes: 420 },
    mechanism_notes: "Albumin-binding via C14 fatty acid chain — broad, flat-ish peak 6-12h.",
    pk_source: "EMA SmPC — Levemir · PMID:12954624",
    is_active: true,
    colour: "#5B8FD4", // basal band blue (spec-canonical)
  },
  {
    brand_name: "Lyumjev",
    generic_name: "ultra-rapid lispro",
    manufacturer: "Eli Lilly",
    category: "ultra-rapid",
    onset_minutes: 3,
    peak_start_minutes: 55,
    peak_end_minutes: 75,
    duration_minutes: 300,
    is_peakless: false,
    decay_model: "exponential",
    decay_parameters: { half_life_minutes: 90 },
    mechanism_notes: "Lispro + treprostinil + citrate → faster capillary uptake. Slightly different PK vs Humalog.",
    pk_source: "FDA DailyMed — Lyumjev (NDA 761109)",
    is_active: true,
    colour: "#EC407A", // magenta
  },
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
    decay_parameters: { half_life_minutes: 90 },
    mechanism_notes: "Aspart analog — Pro28→Asp substitution prevents hexamer self-association.",
    pk_source: "EMA SmPC — NovoRapid · FDA NDA 020986 (as NovoLog)",
    is_active: true,
    colour: "#FF8A65", // coral
  },
  {
    brand_name: "Toujeo",
    generic_name: "insulin glargine U-300",
    manufacturer: "Sanofi",
    category: "ultra-long",
    onset_minutes: 360,
    peak_start_minutes: null,
    peak_end_minutes: null,
    duration_minutes: 2160,
    is_peakless: true,
    decay_model: "flat_depot",
    decay_parameters: { linear_decay: true },
    mechanism_notes: "Concentrated U-300 glargine — smaller depot surface → slower release → longer flatter profile.",
    pk_source: "EMA SmPC — Toujeo · PMID:25287289",
    is_active: true,
    colour: "#42A5F5", // sky blue
  },
  {
    brand_name: "Tresiba",
    generic_name: "insulin degludec",
    manufacturer: "Novo Nordisk",
    category: "ultra-long",
    onset_minutes: 60,
    peak_start_minutes: null,   // PEAKLESS — never draw spikes
    peak_end_minutes: null,     // PEAKLESS — never draw spikes
    duration_minutes: 2520,
    is_peakless: true,           // LOCKED
    decay_model: "flat_depot",   // LOCKED — linear decline only
    decay_parameters: { linear_decay: true },
    mechanism_notes:
      "Degludec forms soluble multi-hexamers at injection site, releasing monomers "
      + "at a near-constant rate for 42+ hours. True flat-depot. NEVER has a peak.",
    pk_source: "FDA DailyMed — Tresiba (NDA 203314) · PMID:23824353",
    is_active: true,
    colour: "#1976D2", // deep blue — denotes ultra-long
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
