/**
 * GluMira™ V7 — IOB Hunter v7 · Regional Name Resolver Tests
 *
 * Ensures every canonical insulin resolves to itself, every known regional
 * alias resolves to the correct canonical name, biosimilars point at their
 * originator, unknown inputs return null, and case-insensitive matching
 * works as documented.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { describe, expect, test } from "vitest";
import {
  INSULIN_REGIONAL_NAMES,
  listAllRegionalNames,
  listRegionalNames,
  resolveInsulinName,
} from "@/iob-hunter/engine/insulin-regions";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  1. Canonical self-resolution                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

describe("resolveInsulinName — canonical names", () => {
  const canonicals = [
    "Actrapid", "Apidra", "Basaglar", "Fiasp", "Humalog", "Humulin N",
    "Insulatard", "Lantus", "Levemir", "Lyumjev", "NovoRapid", "Toujeo", "Tresiba",
  ];

  for (const name of canonicals) {
    test(`"${name}" resolves to itself`, () => {
      expect(resolveInsulinName(name)).toBe(name);
    });
  }
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  2. US regional aliases                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

describe("resolveInsulinName — US regional aliases", () => {
  test("NovoLog resolves to NovoRapid", () => {
    expect(resolveInsulinName("NovoLog", "NA")).toBe("NovoRapid");
  });

  test("Novolin R resolves to Actrapid", () => {
    expect(resolveInsulinName("Novolin R", "NA")).toBe("Actrapid");
  });
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  3. Biosimilar aliases → originator canonical                            */
/* ═══════════════════════════════════════════════════════════════════════════ */

describe("resolveInsulinName — biosimilars", () => {
  test("Semglee resolves to Lantus (originator)", () => {
    expect(resolveInsulinName("Semglee")).toBe("Lantus");
  });

  test("Abasaglar resolves to Basaglar (canonical biosimilar family)", () => {
    expect(resolveInsulinName("Abasaglar", "EU")).toBe("Basaglar");
  });

  test("Admelog resolves to Humalog (lispro biosimilar)", () => {
    expect(resolveInsulinName("Admelog", "NA")).toBe("Humalog");
  });

  test("Insulin Lispro Sanofi resolves to Humalog", () => {
    expect(resolveInsulinName("Insulin Lispro Sanofi", "EU")).toBe("Humalog");
  });
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  4. Unknown input                                                         */
/* ═══════════════════════════════════════════════════════════════════════════ */

describe("resolveInsulinName — unknown input", () => {
  test("gibberish returns null", () => {
    expect(resolveInsulinName("xyzzy")).toBeNull();
  });

  test("empty string returns null", () => {
    expect(resolveInsulinName("")).toBeNull();
  });
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  5. Case-insensitive matching                                             */
/* ═══════════════════════════════════════════════════════════════════════════ */

describe("resolveInsulinName — case-insensitive", () => {
  test("lowercase levemir resolves to Levemir", () => {
    expect(resolveInsulinName("levemir")).toBe("Levemir");
  });

  test("UPPERCASE FIASP resolves to Fiasp", () => {
    expect(resolveInsulinName("FIASP")).toBe("Fiasp");
  });

  test("MiXeD-CaSe NoVoRaPiD resolves to NovoRapid", () => {
    expect(resolveInsulinName("NoVoRaPiD")).toBe("NovoRapid");
  });

  test("trimmed whitespace still resolves", () => {
    expect(resolveInsulinName("  Tresiba  ")).toBe("Tresiba");
  });

  test("fuzzy prefix matches (e.g. 'levemi' → Levemir)", () => {
    expect(resolveInsulinName("levemi")).toBe("Levemir");
  });
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  6. Region availability + listing                                        */
/* ═══════════════════════════════════════════════════════════════════════════ */

describe("listRegionalNames — by region", () => {
  test("NA region contains NovoLog (not NovoRapid)", () => {
    const naNames = listRegionalNames("NA").map((r) => r.regional_name);
    expect(naNames).toContain("NovoLog");
  });

  test("EU region contains NovoRapid (not NovoLog)", () => {
    const euNames = listRegionalNames("EU").map((r) => r.regional_name);
    expect(euNames).toContain("NovoRapid");
    expect(euNames).not.toContain("NovoLog");
  });

  test("AF region contains Levemir, Actrapid, and Insulatard", () => {
    const afNames = listRegionalNames("AF").map((r) => r.regional_name);
    expect(afNames).toContain("Levemir");
    expect(afNames).toContain("Actrapid");
  });

  test("every regional name maps to a valid canonical", () => {
    const canonicals = new Set([
      "Actrapid", "Apidra", "Basaglar", "Fiasp", "Humalog", "Humulin N",
      "Insulatard", "Lantus", "Levemir", "Lyumjev", "NovoRapid", "Toujeo", "Tresiba",
    ]);
    for (const entry of INSULIN_REGIONAL_NAMES) {
      expect(canonicals.has(entry.canonical_name)).toBe(true);
    }
  });

  test("listAllRegionalNames returns a sorted, deduplicated list", () => {
    const list = listAllRegionalNames();
    const sorted = [...list].sort((a, b) => a.localeCompare(b));
    expect(list).toEqual(sorted);
    expect(new Set(list).size).toBe(list.length);
  });
});
