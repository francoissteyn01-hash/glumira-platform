/**
 * GluMira™ V7 — Clarity CSV import + IOB Hunter determinism test
 *
 * End-to-end contract for the Free-tier CSV import path:
 *   1. A Dexcom Clarity CSV export parses correctly into CGM readings.
 *   2. Personally identifiable information (name, DOB) never appears in
 *      parser output — stripped at the ingest boundary.
 *   3. IOB Hunter produces byte-identical output for the same regimen on
 *      every run ("renders perfect every time").
 *
 * The regimen is Case A's Fiasp + Actrapid + Levemir schedule — the same
 * shape of therapy the founder logs. No real names, no real data.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseClarityCsv } from "@/lib/clarity-parser";
import { INSULIN_PROFILES } from "@/iob-hunter/engine/insulin-profiles";
import {
  generateStackedCurve,
  calculateTotalIOB,
} from "@/iob-hunter/engine/iob-engine";
import type { InsulinDose } from "@/iob-hunter/types";

const FIXTURE = resolve(
  __dirname,
  "fixtures",
  "clarity-sample.csv",
);

const CASE_A_REGIMEN: InsulinDose[] = [
  { id: "lev-am",       insulin_name: "Levemir",  dose_units: 5.5, administered_at: "06:30", dose_type: "basal_injection" },
  { id: "fiasp-bk",     insulin_name: "Fiasp",    dose_units: 2.0, administered_at: "08:00", dose_type: "bolus" },
  { id: "act-lunch",    insulin_name: "Actrapid", dose_units: 3.5, administered_at: "13:00", dose_type: "bolus" },
  { id: "lev-pm",       insulin_name: "Levemir",  dose_units: 6.0, administered_at: "14:00", dose_type: "basal_injection" },
  { id: "fiasp-dinner", insulin_name: "Fiasp",    dose_units: 1.5, administered_at: "19:30", dose_type: "bolus" },
  { id: "lev-night",    insulin_name: "Levemir",  dose_units: 2.5, administered_at: "21:00", dose_type: "basal_injection" },
];

describe("Clarity CSV parser — anonymisation boundary", () => {
  const raw = readFileSync(FIXTURE, "utf8");
  const result = parseClarityCsv(raw);

  test("strips all PII column values from output", () => {
    // None of the reading objects should carry any recognisable PII.
    const serialised = JSON.stringify(result.readings);
    expect(serialised).not.toMatch(/REDACTED/i);
    expect(serialised).not.toMatch(/Case A/);
    expect(serialised).not.toMatch(/First ?Name/i);
    expect(serialised).not.toMatch(/Last ?Name/i);
    expect(serialised).not.toMatch(/DOB/i);
    expect(serialised).not.toMatch(/iPhone|Android/);
  });

  test("reports how many PII fields were detected in the header", () => {
    // Header has Patient Info, First Name, Last Name, Date of Birth = 4
    expect(result.meta.pii_fields_stripped).toBe(4);
  });

  test("detects mmol/L units from header", () => {
    expect(result.meta.units_detected).toBe("mmol/L");
  });

  test("keeps EGV readings and skips Calibration/Alert rows", () => {
    // Fixture has 19 data rows, 1 Calibration + 1 Alert should be skipped.
    expect(result.meta.rows_kept).toBe(17);
    expect(result.meta.rows_skipped).toBeGreaterThanOrEqual(2);
  });

  test("parses EU comma-decimal glucose values", () => {
    // First reading: "4,8" mmol/L
    expect(result.readings[0].glucose_mmol).toBe(4.8);
  });

  test("sorts readings chronologically", () => {
    for (let i = 1; i < result.readings.length; i++) {
      expect(result.readings[i - 1].timestamp <= result.readings[i].timestamp).toBe(true);
    }
  });

  test("emits ISO 8601 timestamps with seconds precision", () => {
    expect(result.readings[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
  });
});

describe("IOB Hunter — determinism under Case A regimen (Fiasp + Actrapid + Levemir)", () => {
  test("all three insulin profiles resolve", () => {
    const names = CASE_A_REGIMEN.map((d) => d.insulin_name);
    for (const name of names) {
      const profile = INSULIN_PROFILES.find(
        (p) => p.brand_name.toLowerCase() === name.toLowerCase(),
      );
      expect(profile, `missing PK profile for ${name}`).toBeDefined();
    }
  });

  test("generateStackedCurve produces byte-identical output on repeated runs", () => {
    const runA = generateStackedCurve(CASE_A_REGIMEN, INSULIN_PROFILES, 0, 24, 15, 2);
    const runB = generateStackedCurve(CASE_A_REGIMEN, INSULIN_PROFILES, 0, 24, 15, 2);
    expect(JSON.stringify(runA)).toBe(JSON.stringify(runB));
  });

  test("curve has expected point count for 24h at 15min resolution", () => {
    const curve = generateStackedCurve(CASE_A_REGIMEN, INSULIN_PROFILES, 0, 24, 15, 2);
    // 24h at 15min resolution, inclusive of both endpoints
    expect(curve.length).toBe(24 * 4 + 1);
  });

  test("IOB is non-zero at 09:00 (1h after Fiasp breakfast) and at 14:30 (peak Actrapid)", () => {
    const curve = generateStackedCurve(CASE_A_REGIMEN, INSULIN_PROFILES, 0, 24, 15, 2);

    const at0900 = curve.find((p) => p.time_label === "09:00");
    const at1430 = curve.find((p) => p.time_label === "14:30");

    expect(at0900?.total_iob).toBeGreaterThan(0);
    expect(at1430?.total_iob).toBeGreaterThan(0);
  });

  test("total IOB at 13:00 (Actrapid lunch injection time) is positive — stacking visible", () => {
    // calculateTotalIOB takes hours, not minutes.
    const lunchIob = calculateTotalIOB(CASE_A_REGIMEN, INSULIN_PROFILES, 13);
    expect(lunchIob).toBeGreaterThan(0);
  });

  test("Levemir DOA respects patientWeightKg — 30kg child gets longer DOA than 70kg adult default", () => {
    // Regression: previously useIOBHunter dropped patientWeightKg, so the
    // engine fell back to 70kg. For a 5.5U Levemir dose:
    //   - at 70kg: 0.078 U/kg → below Plank's smallest anchor → 5.7h DOA
    //   - at 30kg: 0.183 U/kg → interpolated → ~11h DOA
    // The chart was dropping to zero between Levemir doses because of this.
    const dose: InsulinDose[] = [
      { id: "lev-test", insulin_name: "Levemir", dose_units: 5.5, administered_at: "06:30", dose_type: "basal_injection" },
    ];

    const at70kg = generateStackedCurve(dose, INSULIN_PROFILES, 0, 24, 15, 1, 70);
    const at30kg = generateStackedCurve(dose, INSULIN_PROFILES, 0, 24, 15, 1, 30);

    // At t = 10h after dose (16:30), the 30kg curve should still show IOB,
    // while the 70kg curve should be at zero (5.7h DOA expired ~12:12).
    const iobAt1630_70kg = at70kg.find((p) => p.time_label === "16:30")?.total_iob ?? 0;
    const iobAt1630_30kg = at30kg.find((p) => p.time_label === "16:30")?.total_iob ?? 0;

    expect(iobAt1630_70kg).toBe(0);
    expect(iobAt1630_30kg).toBeGreaterThan(0.5);
  });

  test("changing dose order in input array does NOT change curve output (commutative)", () => {
    // Commutativity is a determinism requirement — the engine must not
    // depend on input order. Swap doses and recompute.
    const shuffled: InsulinDose[] = [
      CASE_A_REGIMEN[5], CASE_A_REGIMEN[0], CASE_A_REGIMEN[3],
      CASE_A_REGIMEN[1], CASE_A_REGIMEN[4], CASE_A_REGIMEN[2],
    ];
    const ordered = generateStackedCurve(CASE_A_REGIMEN, INSULIN_PROFILES, 0, 24, 15, 2);
    const swapped = generateStackedCurve(shuffled, INSULIN_PROFILES, 0, 24, 15, 2);

    // Totals must match to 4 decimal places at every point (breakdown keys may
    // reorder but the totals are invariant).
    expect(ordered.length).toBe(swapped.length);
    for (let i = 0; i < ordered.length; i++) {
      expect(ordered[i].total_iob).toBeCloseTo(swapped[i].total_iob, 4);
    }
  });
});

describe("End-to-end: Clarity CSV → CGM readings coexist with IOB engine output", () => {
  const raw = readFileSync(FIXTURE, "utf8");
  const { readings } = parseClarityCsv(raw);

  test("parsed CGM readings and IOB curve share the same midnight-based hour space", () => {
    const curve = generateStackedCurve(CASE_A_REGIMEN, INSULIN_PROFILES, 0, 24, 15, 2);

    // Every CGM timestamp maps to an hour in [0, 24]; every curve point does too.
    for (const r of readings) {
      const h = Number(r.timestamp.slice(11, 13));
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(24);
    }
    expect(curve[0].hours).toBe(0);
    expect(curve[curve.length - 1].hours).toBe(24);
  });
});
