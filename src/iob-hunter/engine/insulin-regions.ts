/**
 * GluMira™ V7 — IOB Hunter v7 · Regional Name Resolver
 *
 * Maps regional / biosimilar / brand aliases to canonical InsulinProfile
 * names. Used in four places:
 *   1. CSV import (Dexcom Clarity uses US names)
 *   2. Manual dose entry (user types whatever they know)
 *   3. Visitor "Enter my insulin" form
 *   4. What-if insulin swap dropdown
 *
 * Every regional_name MUST resolve to a canonical brand_name that exists
 * in `insulin-profiles.ts`. Case-insensitive. Trim-tolerant.
 *
 * Regions (ISO 3166-1 alpha-2 or zone, alphabetical):
 *   AF  sub-Saharan Africa
 *   AP  Asia-Pacific
 *   EU  European Union + EEA
 *   LA  Latin America
 *   ME  Middle East
 *   NA  North America (US + Canada)
 *   UK  United Kingdom
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import type { InsulinRegionalName, RegionCode } from "@/iob-hunter/types";

/* ═════════════════════════════════════════════════════════════════════════ */
/*  Regional mapping table — alphabetical by canonical_name                */
/*  Every entry is educational data sourced from publicly-available        */
/*  regulatory registers (FDA, EMA, SAHPRA, MHRA, etc.)                    */
/* ═════════════════════════════════════════════════════════════════════════ */

export const INSULIN_REGIONAL_NAMES: readonly InsulinRegionalName[] = [
  /* ─── Actrapid / Novolin R (regular human insulin) ─────────────── */
  { canonical_name: "Actrapid", regional_name: "Actrapid",  region: "AF", manufacturer: "Novo Nordisk", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Actrapid", regional_name: "Actrapid",  region: "AP", manufacturer: "Novo Nordisk", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Actrapid", regional_name: "Actrapid",  region: "EU", manufacturer: "Novo Nordisk", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Actrapid", regional_name: "Actrapid",  region: "UK", manufacturer: "Novo Nordisk", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Actrapid", regional_name: "Novolin R", region: "NA", manufacturer: "Novo Nordisk", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: "US brand name for the same regular human insulin." },

  /* ─── Apidra ──────────────────────────────────────────────────── */
  { canonical_name: "Apidra", regional_name: "Apidra", region: "AF", manufacturer: "Sanofi", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Apidra", regional_name: "Apidra", region: "EU", manufacturer: "Sanofi", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Apidra", regional_name: "Apidra", region: "NA", manufacturer: "Sanofi", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Apidra", regional_name: "Apidra", region: "UK", manufacturer: "Sanofi", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },

  /* ─── Basaglar (glargine biosimilar) ──────────────────────────── */
  { canonical_name: "Basaglar", regional_name: "Basaglar",  region: "NA", manufacturer: "Eli Lilly", status: "biosimilar", concentration: "U-100", is_biosimilar: true,  biosimilar_of: "Lantus", notes: "Glargine biosimilar." },
  { canonical_name: "Basaglar", regional_name: "Abasaglar", region: "EU", manufacturer: "Eli Lilly", status: "biosimilar", concentration: "U-100", is_biosimilar: true,  biosimilar_of: "Lantus", notes: "EU brand of the same biosimilar." },
  { canonical_name: "Basaglar", regional_name: "Abasaglar", region: "UK", manufacturer: "Eli Lilly", status: "biosimilar", concentration: "U-100", is_biosimilar: true,  biosimilar_of: "Lantus", notes: null },

  /* ─── Fiasp ───────────────────────────────────────────────────── */
  { canonical_name: "Fiasp", regional_name: "Fiasp", region: "AF", manufacturer: "Novo Nordisk", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: "Limited availability in sub-Saharan Africa." },
  { canonical_name: "Fiasp", regional_name: "Fiasp", region: "EU", manufacturer: "Novo Nordisk", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Fiasp", regional_name: "Fiasp", region: "NA", manufacturer: "Novo Nordisk", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Fiasp", regional_name: "Fiasp", region: "UK", manufacturer: "Novo Nordisk", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },

  /* ─── Humalog + biosimilars + Lyumjev ─────────────────────────── */
  { canonical_name: "Humalog",  regional_name: "Humalog",  region: "AF", manufacturer: "Eli Lilly", status: "approved",   concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Humalog",  regional_name: "Humalog",  region: "EU", manufacturer: "Eli Lilly", status: "approved",   concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Humalog",  regional_name: "Humalog",  region: "NA", manufacturer: "Eli Lilly", status: "approved",   concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Humalog",  regional_name: "Humalog",  region: "UK", manufacturer: "Eli Lilly", status: "approved",   concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Humalog",  regional_name: "Admelog",  region: "NA", manufacturer: "Sanofi",    status: "biosimilar", concentration: "U-100", is_biosimilar: true,  biosimilar_of: "Humalog", notes: "Lispro biosimilar." },
  { canonical_name: "Humalog",  regional_name: "Insulin Lispro Sanofi", region: "EU", manufacturer: "Sanofi", status: "biosimilar", concentration: "U-100", is_biosimilar: true, biosimilar_of: "Humalog", notes: "EU lispro biosimilar." },

  /* ─── Humulin N (NPH) ─────────────────────────────────────────── */
  { canonical_name: "Humulin N", regional_name: "Humulin N",  region: "NA", manufacturer: "Eli Lilly",    status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Humulin N", regional_name: "Humulin N",  region: "AF", manufacturer: "Eli Lilly",    status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Insulatard", regional_name: "Insulatard", region: "EU", manufacturer: "Novo Nordisk", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: "EU/UK NPH equivalent of Humulin N." },
  { canonical_name: "Insulatard", regional_name: "Insulatard", region: "UK", manufacturer: "Novo Nordisk", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Insulatard", regional_name: "Insulatard", region: "AF", manufacturer: "Novo Nordisk", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },

  /* ─── Lantus + biosimilars ────────────────────────────────────── */
  { canonical_name: "Lantus", regional_name: "Lantus",  region: "AF", manufacturer: "Sanofi", status: "approved",   concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Lantus", regional_name: "Lantus",  region: "EU", manufacturer: "Sanofi", status: "approved",   concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Lantus", regional_name: "Lantus",  region: "NA", manufacturer: "Sanofi", status: "approved",   concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Lantus", regional_name: "Lantus",  region: "UK", manufacturer: "Sanofi", status: "approved",   concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Lantus", regional_name: "Semglee", region: "NA", manufacturer: "Viatris", status: "biosimilar", concentration: "U-100", is_biosimilar: true,  biosimilar_of: "Lantus", notes: "Interchangeable biosimilar (FDA 2021)." },

  /* ─── Levemir ─────────────────────────────────────────────────── */
  { canonical_name: "Levemir", regional_name: "Levemir", region: "AF", manufacturer: "Novo Nordisk", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Levemir", regional_name: "Levemir", region: "EU", manufacturer: "Novo Nordisk", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Levemir", regional_name: "Levemir", region: "NA", manufacturer: "Novo Nordisk", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Levemir", regional_name: "Levemir", region: "UK", manufacturer: "Novo Nordisk", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },

  /* ─── Lyumjev ─────────────────────────────────────────────────── */
  { canonical_name: "Lyumjev", regional_name: "Lyumjev", region: "EU", manufacturer: "Eli Lilly", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: "Ultra-rapid lispro." },
  { canonical_name: "Lyumjev", regional_name: "Lyumjev", region: "NA", manufacturer: "Eli Lilly", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Lyumjev", regional_name: "Lyumjev", region: "UK", manufacturer: "Eli Lilly", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },

  /* ─── NovoRapid / NovoLog ─────────────────────────────────────── */
  { canonical_name: "NovoRapid", regional_name: "NovoRapid", region: "AF", manufacturer: "Novo Nordisk", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "NovoRapid", regional_name: "NovoRapid", region: "EU", manufacturer: "Novo Nordisk", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "NovoRapid", regional_name: "NovoRapid", region: "UK", manufacturer: "Novo Nordisk", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "NovoRapid", regional_name: "NovoLog",   region: "NA", manufacturer: "Novo Nordisk", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: "US brand name for the same insulin aspart." },

  /* ─── Toujeo (U-300 glargine) ─────────────────────────────────── */
  { canonical_name: "Toujeo", regional_name: "Toujeo", region: "EU", manufacturer: "Sanofi", status: "approved", concentration: "U-300", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Toujeo", regional_name: "Toujeo", region: "NA", manufacturer: "Sanofi", status: "approved", concentration: "U-300", is_biosimilar: false, biosimilar_of: null, notes: null },
  { canonical_name: "Toujeo", regional_name: "Toujeo", region: "UK", manufacturer: "Sanofi", status: "approved", concentration: "U-300", is_biosimilar: false, biosimilar_of: null, notes: null },

  /* ─── Tresiba (LOCKED — peakless) ─────────────────────────────── */
  { canonical_name: "Tresiba", regional_name: "Tresiba", region: "EU", manufacturer: "Novo Nordisk", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: "Peakless depot-release. NEVER draw spikes." },
  { canonical_name: "Tresiba", regional_name: "Tresiba", region: "NA", manufacturer: "Novo Nordisk", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: "Peakless depot-release. NEVER draw spikes." },
  { canonical_name: "Tresiba", regional_name: "Tresiba", region: "UK", manufacturer: "Novo Nordisk", status: "approved", concentration: "U-100", is_biosimilar: false, biosimilar_of: null, notes: "Peakless depot-release. NEVER draw spikes." },
] as const;

/* ═════════════════════════════════════════════════════════════════════════ */
/*  Canonical name set — for fast exact-match checks                       */
/* ═════════════════════════════════════════════════════════════════════════ */

const CANONICAL_NAMES = new Set<string>([
  "Actrapid", "Apidra", "Basaglar", "Fiasp", "Humalog", "Humulin N",
  "Insulatard", "Lantus", "Levemir", "Lyumjev", "NovoRapid", "Toujeo", "Tresiba",
]);

function normaliseName(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

/* ═════════════════════════════════════════════════════════════════════════ */
/*  Resolver                                                                */
/* ═════════════════════════════════════════════════════════════════════════ */

/**
 * Resolve any regional/biosimilar/branded name to its canonical InsulinProfile name.
 *
 * Resolution order:
 *   1. Exact canonical match (case-insensitive) → return canonical as-is
 *   2. Regional table match (optionally scoped to a region) → return canonical
 *   3. Region-agnostic regional search → return first match
 *   4. No match → return null
 *
 * @param input   Any string the user typed, e.g. "NovoLog", "Semglee", "levemir"
 * @param region  Optional region scope; if provided, regional matches prefer this region
 * @returns       Canonical brand_name or null
 */
export function resolveInsulinName(input: string, region?: RegionCode): string | null {
  if (!input) return null;
  const query = normaliseName(input);

  // 1. Exact canonical match
  for (const canonical of CANONICAL_NAMES) {
    if (normaliseName(canonical) === query) return canonical;
  }

  // 2. Region-scoped regional match
  if (region) {
    const scoped = INSULIN_REGIONAL_NAMES.find(
      (r) => r.region === region && normaliseName(r.regional_name) === query,
    );
    if (scoped) return scoped.canonical_name;
  }

  // 3. Region-agnostic regional match
  const anywhere = INSULIN_REGIONAL_NAMES.find(
    (r) => normaliseName(r.regional_name) === query,
  );
  if (anywhere) return anywhere.canonical_name;

  // 4. Fuzzy prefix match (e.g. "levemi" → "Levemir")
  for (const canonical of CANONICAL_NAMES) {
    if (normaliseName(canonical).startsWith(query) && query.length >= 3) {
      return canonical;
    }
  }

  return null;
}

/**
 * Return every regional_name available in a given region, sorted
 * alphabetically. Used by the visitor "Enter my insulin" dropdown.
 */
export function listRegionalNames(region: RegionCode): InsulinRegionalName[] {
  return INSULIN_REGIONAL_NAMES
    .filter((r) => r.region === region)
    .slice()
    .sort((a, b) => a.regional_name.localeCompare(b.regional_name));
}

/**
 * Return every unique regional_name across ALL regions, sorted alphabetically.
 * Used when the user's region is unknown.
 */
export function listAllRegionalNames(): string[] {
  const unique = new Set<string>();
  for (const r of INSULIN_REGIONAL_NAMES) unique.add(r.regional_name);
  return Array.from(unique).sort((a, b) => a.localeCompare(b));
}
