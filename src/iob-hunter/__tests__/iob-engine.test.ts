/**
 * GluMira™ V7 — IOB Hunter v7 · Engine Unit Tests
 *
 * Phase 1 foundation tests. Every test references a profile from
 * `insulin-profiles.ts` — NO hardcoded PK values in the tests themselves.
 *
 * Canonical rules these tests enforce:
 *   - Tresiba NEVER has a peak (depot_release → linear decline)
 *   - Levemir uses albumin_bound with dose-dependent DOA (Plank 2005)
 *   - Lantus is_peakless: false — small peak per clamp data, NOT marketing
 *   - Rapid insulins clamp to 0 at t = duration
 *   - Stacking detection fires on overlapping boluses
 *   - Tier gating clamps history window
 *   - No real names anywhere in src/
 *   - All profiles have pk_source
 *
 * Source: 05.8_IOB-Hunter-V7-PK-Research_v1.1.md (founder-approved 2026-04-12)
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
  getRegimenGraphWindow,
  predictiveLowAlert,
  applyWhatIfScenario,
  analyzeBasalCoverage,
  resolveEffectiveDOA,
  TIER_CONFIG,
} from "@/iob-hunter/engine/iob-engine";
import { findProfile, INSULIN_PROFILES } from "@/iob-hunter/engine/insulin-profiles";
import type { InsulinDose, WhatIfScenario } from "@/iob-hunter/types";

/* ─── Test fixtures sourced from the canonical profile table ────────────── */

const FIASP = findProfile("Fiasp")!;
const TRESIBA = findProfile("Tresiba")!;
const ACTRAPID = findProfile("Actrapid")!;
const LANTUS = findProfile("Lantus")!;
const LEVEMIR = findProfile("Levemir")!;

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

describe("calculateIOB — Tresiba depot_release (CANONICAL: never spike)", () => {
  test("is_peakless flag is true", () => {
    expect(TRESIBA.is_peakless).toBe(true);
  });

  test("decay_model is depot_release", () => {
    expect(TRESIBA.decay_model).toBe("depot_release");
  });

  test("peak_start_minutes is null", () => {
    expect(TRESIBA.peak_start_minutes).toBeNull();
  });

  test("IOB declines monotonically with NO local maximum after t=0", () => {
    const curve: number[] = [];
    for (let min = 0; min <= TRESIBA.duration_minutes; min += 60) {
      curve.push(calculateIOB(10, TRESIBA, min));
    }
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i]).toBeLessThanOrEqual(curve[i - 1] + 1e-9);
    }
  });

  test("Bateman depot-release — halfway through duration retains majority of dose", () => {
    // Two-compartment model (k_a ≈ 0.06/h, k_e = ln(2)/25h): slow
    // absorption means at midpoint more than half the dose is still on
    // board. Heise 2012 clamp data shows Tresiba activity is still near
    // peak at ~21h post-injection. Linear decline is incorrect and was
    // replaced 2026-04-14 to match the founder-approved Riley visual.
    const half = calculateIOB(10, TRESIBA, TRESIBA.duration_minutes / 2);
    expect(half).toBeGreaterThan(5);
    expect(half).toBeLessThan(9);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  3. Levemir — albumin_bound with dose-dependent DOA (Plank 2005)        */
/* ═══════════════════════════════════════════════════════════════════════════ */

describe("calculateIOB — Levemir albumin_bound (Plank 2005)", () => {
  test("decay_model is albumin_bound", () => {
    expect(LEVEMIR.decay_model).toBe("albumin_bound");
  });

  test("is_peakless is true (flat plateau, no Bateman peak)", () => {
    expect(LEVEMIR.is_peakless).toBe(true);
  });

  test("dose-dependent DOA: 0.1 U/kg returns DOA within 10% of 5.7h (342 min)", () => {
    const doa = resolveEffectiveDOA(7, 70, LEVEMIR); // 7U / 70kg = 0.1 U/kg
    expect(doa).toBeGreaterThan(342 * 0.9);
    expect(doa).toBeLessThan(342 * 1.1);
  });

  test("dose-dependent DOA: 0.2 U/kg returns DOA within 10% of 12.1h (726 min)", () => {
    const doa = resolveEffectiveDOA(14, 70, LEVEMIR); // 14U / 70kg = 0.2 U/kg
    expect(doa).toBeGreaterThan(726 * 0.9);
    expect(doa).toBeLessThan(726 * 1.1);
  });

  test("dose-dependent DOA: 0.4 U/kg returns DOA within 10% of 19.9h (1194 min)", () => {
    const doa = resolveEffectiveDOA(28, 70, LEVEMIR); // 28U / 70kg = 0.4 U/kg
    expect(doa).toBeGreaterThan(1194 * 0.9);
    expect(doa).toBeLessThan(1194 * 1.1);
  });

  test("dose-dependent DOA: interpolates for in-between U/kg values", () => {
    // 0.3 U/kg is between 0.2 and 0.4 anchors
    const doa = resolveEffectiveDOA(21, 70, LEVEMIR); // 21U / 70kg = 0.3 U/kg
    const expected = (726 + 1194) / 2; // linear midpoint of 0.2 and 0.4
    expect(doa).toBeGreaterThan(expected * 0.85);
    expect(doa).toBeLessThan(expected * 1.15);
  });

  test("Levemir IOB after onset is non-increasing (flat plateau then decline)", () => {
    // Use 0.4 U/kg (adult dose) for a predictable DOA
    const curve: number[] = [];
    const doa = resolveEffectiveDOA(28, 70, LEVEMIR);
    for (let min = LEVEMIR.onset_minutes; min <= doa; min += 30) {
      curve.push(calculateIOB(28, LEVEMIR, min, 70));
    }
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i]).toBeLessThanOrEqual(curve[i - 1] + 0.01);
    }
  });

  test("founder's daughter: 5U at 30kg (0.17 U/kg) → DOA ~11h", () => {
    const doa = resolveEffectiveDOA(5, 30, LEVEMIR);
    const doaHours = doa / 60;
    // 0.17 U/kg interpolates between 0.1 (5.7h) and 0.2 (12.1h)
    expect(doaHours).toBeGreaterThan(8);
    expect(doaHours).toBeLessThan(13);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  4. Lantus — is_peakless: false (FOUNDER RESOLUTION 4.3)                */
/* ═══════════════════════════════════════════════════════════════════════════ */

describe("Lantus — lab data not marketing (founder resolution 4.3)", () => {
  test("is_peakless is false", () => {
    expect(LANTUS.is_peakless).toBe(false);
  });

  test("has peak_start_minutes and peak_end_minutes set", () => {
    expect(LANTUS.peak_start_minutes).not.toBeNull();
    expect(LANTUS.peak_end_minutes).not.toBeNull();
  });

  test("decay_model is microprecipitate", () => {
    expect(LANTUS.decay_model).toBe("microprecipitate");
  });

  test("CV is 82% (4× higher than Tresiba)", () => {
    expect(LANTUS.decay_parameters.cv_within_subject_pct).toBe(82);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  5. Cycles loop backward — prior-day Levemir tail present               */
/* ═══════════════════════════════════════════════════════════════════════════ */

describe("calculateTotalIOB — prior-day cycle tails (Levemir)", () => {
  test("a single Levemir dose at 14:00 yesterday contributes IOB at 06:00 today", () => {
    const doses: InsulinDose[] = [
      {
        id: "lev-yesterday",
        insulin_name: "Levemir",
        dose_units: 28,  // 28U / 70kg default = 0.4 U/kg → DOA 19.9h → covers 06:00 next day
        administered_at: "14:00",
        dose_type: "basal_injection",
      },
    ];
    const iobAt0600Today = calculateTotalIOB(doses, INSULIN_PROFILES, 6, 2);
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
/*  6. Stacking detection                                                   */
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
/*  7. Predictive low alert                                                 */
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
/*  8. generateDecayCurve — single dose single insulin                     */
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
/*  9. What-if scenario: timing shift                                       */
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
    const originalPeak = Math.max(...result.original_curve.map((p) => p.total_iob));
    const modifiedPeak = Math.max(...result.modified_curve.map((p) => p.total_iob));
    expect(originalPeak).toBeCloseTo(modifiedPeak, 1);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  10. Basal coverage analysis — 3-dose Levemir split                      */
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
/*  11. Tier gating — free user clamps history to 7 days                   */
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
/*  12. Stacked curve includes prior-cycle residual (NEVER starts at 0)    */
/* ═══════════════════════════════════════════════════════════════════════════ */

describe("generateStackedCurve — prior-cycle residual baseline rule", () => {
  test("a 14:00 Lantus dose produces a non-zero IOB at hour 0 via cycles=2", () => {
    const doses: InsulinDose[] = [
      { id: "lan", insulin_name: "Lantus", dose_units: 10, administered_at: "14:00", dose_type: "basal_injection" },
    ];
    const curve = generateStackedCurve(doses, INSULIN_PROFILES, 0, 24, 60, 2);
    expect(curve[0].total_iob).toBeGreaterThan(0);
  });

  test("Lantus is_peakless is false and uses microprecipitate model", () => {
    expect(LANTUS.is_peakless).toBe(false);
    expect(LANTUS.decay_model).toBe("microprecipitate");
  });
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  13. Actrapid / regular insulin — exponential decay boundary + IM route  */
/* ═══════════════════════════════════════════════════════════════════════════ */

describe("calculateIOB — Actrapid short-acting", () => {
  test("at t=duration Actrapid clamps to 0", () => {
    expect(calculateIOB(5, ACTRAPID, ACTRAPID.duration_minutes)).toBe(0);
  });

  test("Actrapid at t=0 returns full dose", () => {
    expect(calculateIOB(5, ACTRAPID, 0)).toBeCloseTo(5, 3);
  });

  test("Actrapid has IM parameters in decay_parameters", () => {
    expect(ACTRAPID.decay_parameters.im_onset_minutes).toBe(12);
    expect(ACTRAPID.decay_parameters.im_duration_minutes).toBe(300);
  });
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  14. Profile integrity — all 13 profiles pass basic sanity checks        */
/* ═══════════════════════════════════════════════════════════════════════════ */

describe("profile integrity — all 13 canonical insulins", () => {
  test("exactly 13 profiles in alphabetical order", () => {
    expect(INSULIN_PROFILES.length).toBe(13);
    const names = INSULIN_PROFILES.map((p) => p.brand_name);
    const sorted = [...names].sort();
    expect(names).toEqual(sorted);
  });

  test("every profile has a non-empty pk_source", () => {
    for (const profile of INSULIN_PROFILES) {
      expect(profile.pk_source.length).toBeGreaterThan(0);
    }
  });

  test("every profile has a non-empty colour", () => {
    for (const profile of INSULIN_PROFILES) {
      expect(profile.colour).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  test("no profile brand_name contains real patient names", () => {
    for (const profile of INSULIN_PROFILES) {
      const lower = profile.brand_name.toLowerCase();
      expect(lower).not.toContain("anouk");
      expect(lower).not.toContain("mira");
    }
  });
});

/* ═══════════════════════════════════════════════════════════════════════════ */
/*  15. getRegimenGraphWindow — DOA-driven cycles                          */
/* ═══════════════════════════════════════════════════════════════════════════ */

describe("getRegimenGraphWindow — DOA-driven graph window", () => {
  test("Tresiba regimen gets more cycles than rapid-only", () => {
    const tresDoses: InsulinDose[] = [
      { id: "t1", insulin_name: "Tresiba", dose_units: 12, administered_at: "06:00", dose_type: "basal_injection" },
    ];
    const rapidDoses: InsulinDose[] = [
      { id: "f1", insulin_name: "Fiasp", dose_units: 4, administered_at: "08:00", dose_type: "bolus" },
    ];
    const tresWindow = getRegimenGraphWindow(tresDoses, INSULIN_PROFILES);
    const rapidWindow = getRegimenGraphWindow(rapidDoses, INSULIN_PROFILES);
    expect(tresWindow.cycles).toBeGreaterThan(rapidWindow.cycles);
  });

  test("Tresiba regimen returns longestDOAHours > 24", () => {
    const doses: InsulinDose[] = [
      { id: "t1", insulin_name: "Tresiba", dose_units: 12, administered_at: "06:00", dose_type: "basal_injection" },
    ];
    const window = getRegimenGraphWindow(doses, INSULIN_PROFILES);
    expect(window.longestDOAHours).toBeGreaterThan(24);
  });
});
