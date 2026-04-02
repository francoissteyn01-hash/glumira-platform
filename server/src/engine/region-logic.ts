/**
 * GluMira™ V7 — Region Logic
 *
 * Maps country codes to approved insulin formularies.
 * ZA-NAM = South Africa + Namibia (primary market).
 * Additional regions can be added by extending REGION_FORMULARIES.
 */

import { FORMULARY, type InsulinProfile } from "./iob-hunter";

/* ═══════════════════════════════════════════════════════════════════════════
   REGION → APPROVED INSULIN IDS
   ═══════════════════════════════════════════════════════════════════════════ */

const REGION_FORMULARIES: Record<string, string[]> = {
  // ZA-NAM: all 13 insulins approved
  ZA: [
    "fiasp", "novorapid", "humalog", "apidra", "actrapid",
    "nph", "levemir", "lantus", "basaglar", "toujeo",
    "tresiba", "novomix30", "ryzodeg",
  ],
  NA: [
    "fiasp", "novorapid", "humalog", "apidra", "actrapid",
    "nph", "levemir", "lantus", "basaglar", "toujeo",
    "tresiba", "novomix30", "ryzodeg",
  ],

  // UK / EU — common subset (can be refined per market)
  GB: [
    "fiasp", "novorapid", "humalog", "apidra", "actrapid",
    "nph", "levemir", "lantus", "basaglar", "toujeo",
    "tresiba", "novomix30", "ryzodeg",
  ],

  // US
  US: [
    "fiasp", "novorapid", "humalog", "apidra", "actrapid",
    "nph", "levemir", "lantus", "basaglar", "toujeo",
    "tresiba", "novomix30", "ryzodeg",
  ],

  // Australia
  AU: [
    "fiasp", "novorapid", "humalog", "apidra", "actrapid",
    "nph", "levemir", "lantus", "basaglar", "toujeo",
    "tresiba", "novomix30", "ryzodeg",
  ],
};

/** Alias table — map alternative codes to canonical region key */
const ALIASES: Record<string, string> = {
  NAM: "NA",
  RSA: "ZA",
  UK:  "GB",
  AUS: "AU",
};

function resolveCode(countryCode: string): string {
  const upper = countryCode.toUpperCase();
  return ALIASES[upper] ?? upper;
}

/* ═══════════════════════════════════════════════════════════════════════════
   PUBLIC API
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Return the full InsulinProfile[] approved for a given country.
 * Falls back to the full ZA formulary for unknown regions.
 */
export function getFormularyForRegion(countryCode: string): InsulinProfile[] {
  const code = resolveCode(countryCode);
  const ids = REGION_FORMULARIES[code] ?? REGION_FORMULARIES["ZA"];
  return FORMULARY.filter((p) => ids.includes(p.id));
}

/**
 * Check whether a specific insulin is approved in a region.
 */
export function isInsulinApproved(
  insulinId: string,
  countryCode: string
): boolean {
  const code = resolveCode(countryCode);
  const ids = REGION_FORMULARIES[code] ?? REGION_FORMULARIES["ZA"];
  return ids.includes(insulinId);
}
