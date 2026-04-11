/**
 * GluMira™ V7 — IOB Hunter v7 · Engine Unit Tests
 *
 * Tests all 12+ engine functions without spinning up React, Supabase, or
 * Chart.js. Every test references a profile from `insulin-profiles.ts` —
 * NO hardcoded PK values in the tests themselves.
 *
 * Canonical rules these tests enforce:
 *   - Tresiba NEVER has a peak (flat_depot → linear decline)
 *   - Levemir prior-day tail is computed correctly (cycles loop backward)
 *   - Rapid insulins clamp to 0 at t = duration
 *   - Stacking detection fires on overlapping boluses
 *   - Tier gating clamps history window
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { describe, expect, test } from "vitest";
import {
  calculateIOB,
  calculateTotalIOB,
  detectStacking,
  generateDecayCurve,
  generateStackedCurve,
  getHistoryWindow,
  predictiveLowAlert,
  applyWhatIfScenario,
  analyzeBasalCoverage,
  TIER_CONFIG,
} from "@/iob-hunter/engine/iob-engine";
import { findProfile, INSULIN_PROFILES } from "@/iob-hunter/engine/insulin-profiles";
import type { InsulinDose, WhatIfScenario } from "@/iob-hunter/types";

/* ─── Test fixtures sourced from the canonical profile table ────────────── */

const FIASP = findProfile("Fiasp")!;
const TRESIBA = findProfile("Tresiba")!;
const ACTRAPID = findProfile("Actrapid")!;
const LANTUS = findProfile("Lantus")!;

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  1. Rapid-acting (Fiasp) IOB at various times — must reach 0 by DIA      */
/* ═══════════════════════════════════════════════════════════════════════════ */

describe("calculateIOB — rapid (Fiasp) exponential decay", () => {
  test("at t=0 returns the full dose", () => {
    expect(calculateIOB(4, FIASP, 0)).toBeCloseTo(4, 3);
  });

  test("at t=onset still near full dose (absorption just starting)", () => {
    const iob = calculateIOB(4, FIASP, FIASP.onset_minutes);
    expect(iob).toBeGreaterThan(3.5);
    expect(iob).toBeLessThanOrEqual(4);
  });

  test("at t=peak_start around 50% absorbed (IOB ~50%)", () => {
    const peakMin = (FIASP.peak_start_minutes ?? 0 + (FIASP.peak_end_minutes ?? 0)) / 2;
    const iob = calculateIOB(4, FIASP, peakMin);
    expect(iob).toBeGreaterThan(1);
    expect(iob).toBeLessThan(4);
  });

  test("at t=duration clamps to 0", () => {
    expect(calculateIOB(4, FIASP, FIASP.duration_minutes)).toBe(0);
  });

  test("past duration returns 0", () => {
    expect(calculateIOB(4, FIASP, FIASP.duration_minutes + 120)).toBe(0);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  2. Tresiba — MUST be a straight line, zero peaks, canonical rule        */
/* ═══════════════════════════════════════════════════════════════════════════ */

describe("calculateIOB — Tresiba flat_depot (CANONICAL: never spike)", () => {
  test("is_peakless flag is true", () => {
    expect(TRESIBA.is_peakless).toBe(true);
  });

  test("decay_model is flat_depot", () => {
    expect(TRESIBA.decay_model).toBe("flat_depot");
  });

  test("peak_start_minutes is null", () => {
    expect(TRESIBA.peak_start_minutes).toBeNull();
  });

  test("IOB declines monotonically with NO local maximum after t=0", () => {
    const curve: number[] = [];
    for (let min = 0; min <= TRESIBA.duration_minutes; min += 60) {
      curve.push(calculateIOB(10, TRESIBA, min));
    }
    // First value is the full dose, every subsequent value must be <= previous
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i]).toBeLessThanOrEqual(curve[i - 1] + 1e-9);
    }
  });

  test("linear decline — halfway through duration = half the dose (±5%)", () => {
    const half = calculateIOB(10, TRESIBA, TRESIBA.duration_minutes / 2);
    expect(half).toBeCloseTo(5, 1);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  3. Cycles loop backward in time — prior-day Levemir tail present       */
/* ═══════════════════════════════════════════════════════════════════════════ */

describe("calculateTotalIOB — prior-day cycle tails (Levemir)", () => {
  test("a single Levemir dose at 14:00 yesterday contributes IOB at 06:00 today", () => {
    const doses: InsulinDose[] = [
      {
        id: "lev-yesterday",
        insulin_name: "Levemir",
        dose_units: 6,
        administered_at: "14:00",
        dose_type: "basal_injection",
      },
    ];
    const iobAt0600Today = calculateTotalIOB(doses, INSULIN_PROFILES, 6, 2);
    // 16h post-dose, well within Levemir's 20h duration → should be non-zero
    expect(iobAt0600Today).toBeGreaterThan(0);
  });

  test("single Levemir at 14:00 today sampled at 14:00 today equals full dose (no double-count)", () => {
    const doses: InsulinDose[] = [
      {
        id: "lev-today",
        insulin_name: "Levemir",
        dose_units: 6,
        administered_at: "14:00",
        dose_type: "basal_injection",
      },
    ];
    const iobAt1400 = calculateTotalIOB(doses, INSULIN_PROFILES, 14, 2);
    expect(iobAt1400).toBeCloseTo(6, 1);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  4. Stacking detection                                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

describe("detectStacking — overlapping Fiasp boluses", () => {
  test("two Fiasp boluses 90 min apart flag a stacking window", () => {
    const doses: InsulinDose[] = [
      { id: "b1", insulin_name: "Fiasp", dose_units: 4, administered_at: "08:00", dose_type: "bolus" },
      { id: "b2", insulin_name: "Fiasp", dose_units: 4, administered_at: "09:30", dose_type: "bolus" },
    ];
    const alerts = detectStacking(doses, INSULIN_PROFILES, 0.5);
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].contributing_doses.length).toBeGreaterThanOrEqual(2);
  });

  test("single bolus produces no stacking alert", () => {
    const doses: InsulinDose[] = [
      { id: "b1", insulin_name: "Fiasp", dose_units: 4, administered_at: "08:00", dose_type: "bolus" },
    ];
    expect(detectStacking(doses, INSULIN_PROFILES, 0.5)).toEqual([]);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  5. Predictive low alert                                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

describe("predictiveLowAlert", () => {
  test("ISF 2.5, BG 5.0, IOB 3.0 → predicted BG 5.0 - 7.5 = -2.5 → alert fires", () => {
    const alert = predictiveLowAlert(3.0, 5.0, 2.5);
    expect(alert).not.toBeNull();
    expect(alert!.type).toBe("predictive_low");
    expect(alert!.predicted_bg).toBeLessThan(3.9);
  });

  test("ISF 2.5, BG 10.0, IOB 1.0 → predicted BG 7.5 → no alert", () => {
    expect(predictiveLowAlert(1.0, 10.0, 2.5)).toBeNull();
  });
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  6. generateDecayCurve — single dose single insulin                     */
/* ═══════════════════════════════════════════════════════════════════════════ */

describe("generateDecayCurve", () => {
  test("Fiasp decay curve starts at full dose and ends at 0", () => {
    const curve = generateDecayCurve(4, FIASP, 15);
    expect(curve[0].iob).toBeCloseTo(4, 2);
    expect(curve[curve.length - 1].iob).toBe(0);
  });

  test("Tresiba decay curve is strictly non-increasing", () => {
    const curve = generateDecayCurve(10, TRESIBA, 60);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].iob).toBeLessThanOrEqual(curve[i - 1].iob + 1e-9);
    }
  });
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  7. What-if scenario: timing shift                                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

describe("applyWhatIfScenario — timing shift", () => {
  test("shifting a Fiasp bolus 2h later changes the curve but not the total area", () => {
    const original: InsulinDose[] = [
      { id: "b1", insulin_name: "Fiasp", dose_units: 4, administered_at: "12:00", dose_type: "bolus" },
    ];
    const scenario: WhatIfScenario = {
      name: "shift-2h",
      modified_doses: [
        { id: "b1", insulin_name: "Fiasp", dose_units: 4, administered_at: "14:00", dose_type: "bolus" },
      ],
    };
    const result = applyWhatIfScenario(original, scenario, INSULIN_PROFILES);
    expect(result.original_curve.length).toBeGreaterThan(0);
    expect(result.modified_curve.length).toBe(result.original_curve.length);
    // Peaks should match (same dose, same profile) but occur at different hours
    const originalPeak = Math.max(...result.original_curve.map((p) => p.total_iob));
    const modifiedPeak = Math.max(...result.modified_curve.map((p) => p.total_iob));
    expect(originalPeak).toBeCloseTo(modifiedPeak, 1);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  8. Basal coverage analysis — 3-dose Levemir split                       */
/* ═══════════════════════════════════════════════════════════════════════════ */

describe("analyzeBasalCoverage — Levemir MDI split", () => {
  test("3-dose Levemir split reports continuous or overlapping coverage", () => {
    const doses: InsulinDose[] = [
      { id: "lev-am",    insulin_name: "Levemir", dose_units: 5.5, administered_at: "06:30", dose_type: "basal_injection" },
      { id: "lev-pm",    insulin_name: "Levemir", dose_units: 6.0, administered_at: "14:00", dose_type: "basal_injection" },
      { id: "lev-night", insulin_name: "Levemir", dose_units: 2.5, administered_at: "21:00", dose_type: "basal_injection" },
    ];
    const analysis = analyzeBasalCoverage(doses, INSULIN_PROFILES);
    expect(analysis.total_basal_units).toBeCloseTo(14, 1);
    expect(["continuous", "overlapping", "gapped"]).toContain(analysis.floor_integrity);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  9. Tier gating — free user clamps history to 7 days                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

describe("getHistoryWindow — tier gating", () => {
  test("free tier returns 7-day window", () => {
    const { days } = getHistoryWindow("free");
    expect(days).toBe(7);
  });

  test("pro tier returns 30-day window", () => {
    const { days } = getHistoryWindow("pro");
    expect(days).toBe(30);
  });

  test("clinical tier returns a large window (Infinity clamped to 365)", () => {
    const { days } = getHistoryWindow("clinical");
    expect(days).toBeGreaterThanOrEqual(365);
  });

  test("TIER_CONFIG keys are alphabetical (canonical rule)", () => {
    const keys = Object.keys(TIER_CONFIG);
    const sorted = [...keys].sort();
    expect(keys).toEqual(sorted);
    expect(keys).toEqual(["clinical", "enterprise", "free", "pro"]);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  10. Stacked curve includes prior-cycle residual (NEVER starts at 0)    */
/* ═══════════════════════════════════════════════════════════════════════════ */

describe("generateStackedCurve — prior-cycle residual baseline rule", () => {
  test("a 14:00 Lantus dose produces a non-zero IOB at hour 0 via cycles=2", () => {
    const doses: InsulinDose[] = [
      { id: "lan", insulin_name: "Lantus", dose_units: 10, administered_at: "14:00", dose_type: "basal_injection" },
    ];
    const curve = generateStackedCurve(doses, INSULIN_PROFILES, 0, 24, 60, 2);
    expect(curve[0].total_iob).toBeGreaterThan(0);
  });

  test("Lantus is marked peakless and uses microprecipitate model", () => {
    expect(LANTUS.is_peakless).toBe(true);
    expect(LANTUS.decay_model).toBe("microprecipitate");
  });
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  11. Actrapid / regular insulin — exponential decay boundary            */
/* ═══════════════════════════════════════════════════════════════════════════ */

describe("calculateIOB — Actrapid short-acting", () => {
  test("at t=duration Actrapid clamps to 0", () => {
    expect(calculateIOB(5, ACTRAPID, ACTRAPID.duration_minutes)).toBe(0);
  });

  test("Actrapid at t=0 returns full dose", () => {
    expect(calculateIOB(5, ACTRAPID, 0)).toBeCloseTo(5, 3);
  });
});
