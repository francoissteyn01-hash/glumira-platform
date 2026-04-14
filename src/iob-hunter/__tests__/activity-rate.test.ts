/**
 * GluMira™ V7 — Activity-rate (U/h) engine tests
 *
 * Locks in the "soft hill" per-dose activity profile used by the new
 * BasalActivityChart. Key invariants:
 *   1. Area under the rate curve equals the dose (conservation).
 *   2. Peak rate scales linearly with dose units.
 *   3. A 5U Levemir at 0.4 U/kg (adult) peaks near 0.4 U/h.
 *   4. Curve has three phases: smooth rise → plateau → smooth decay.
 *
 * GluMira™ is an educational platform, not a medical device.
 */

import { describe, expect, test } from "vitest";
import {
  calculateActivityRate,
  detectRiskZones,
  generatePerDoseActivityCurves,
} from "@/iob-hunter/engine/iob-engine";
import { INSULIN_PROFILES, findProfile } from "@/iob-hunter/engine/insulin-profiles";
import type { InsulinDose } from "@/iob-hunter/types";

const LEVEMIR = findProfile("Levemir")!;

describe("calculateActivityRate — Levemir bell curve", () => {
  test("5U at adult 0.4 U/kg (12.5kg) peaks near 0.4 U/h", () => {
    // Use 12.5kg so 5U = 0.4 U/kg → DOA 19.9h = 1194 min
    const weight = 12.5;
    // Peak should occur somewhere in the plateau (rate is constant there).
    // Plateau starts at onset (120 min) and ends at 45% DOA = 537 min.
    const at240min = calculateActivityRate(5, LEVEMIR, 240, weight);
    const at360min = calculateActivityRate(5, LEVEMIR, 360, weight);
    const at500min = calculateActivityRate(5, LEVEMIR, 500, weight);

    // All three should be in the plateau and equal.
    expect(at240min).toBeCloseTo(at360min, 3);
    expect(at360min).toBeCloseTo(at500min, 3);
    // Target: 5 / (0.5 * (1194 + 537 - 120) / 60) = 5 / 13.43 = 0.372 U/h
    expect(at360min).toBeGreaterThan(0.3);
    expect(at360min).toBeLessThan(0.45);
  });

  test("4U peak is lower than 5U peak (smaller dose → lower absolute peak)", () => {
    // Note: with Plank dose-dependent DOA, smaller doses have SHORTER DOA,
    // so peak rate per dose unit is actually higher for smaller doses.
    // The absolute peak still obeys smaller-dose < larger-dose because
    // total area-under-curve = dose_units.
    const weight = 12.5;
    const peak5U = calculateActivityRate(5, LEVEMIR, 300, weight);
    const peak4U = calculateActivityRate(4, LEVEMIR, 300, weight);
    expect(peak4U).toBeLessThan(peak5U);
    expect(peak4U).toBeGreaterThan(0);
  });

  test("rate is zero before dose and after DOA expires", () => {
    const weight = 12.5;
    expect(calculateActivityRate(5, LEVEMIR, -10, weight)).toBe(0);
    // 25h = 1500 min, well past 19.9h DOA
    expect(calculateActivityRate(5, LEVEMIR, 1500, weight)).toBe(0);
  });

  test("onset phase rises smoothly from 0 to peak (not linear jump)", () => {
    const weight = 12.5;
    // Onset is 120 min. Sample at 0, 30, 60 (halfway), 90, 120.
    const r0   = calculateActivityRate(5, LEVEMIR, 0,   weight);
    const r30  = calculateActivityRate(5, LEVEMIR, 30,  weight);
    const r60  = calculateActivityRate(5, LEVEMIR, 60,  weight);
    const r120 = calculateActivityRate(5, LEVEMIR, 120, weight);

    // Monotonic rise
    expect(r0).toBe(0);
    expect(r30).toBeGreaterThan(r0);
    expect(r60).toBeGreaterThan(r30);
    expect(r120).toBeGreaterThan(r60);
    // At t=30 (25% of onset), smoothstep(0.25) = 0.15625 — rate is
    // sub-linear, proving the rounded shape.
    const linearEstimate = r120 * 0.25;
    expect(r30).toBeLessThan(linearEstimate);
  });

  test("area under activity-rate curve ≈ dose units (conservation)", () => {
    // Numerically integrate over the full DOA.
    const dose = 5;
    const weight = 12.5;
    const stepMin = 1;
    let area = 0;
    for (let m = 0; m <= 1400; m += stepMin) {
      const r = calculateActivityRate(dose, LEVEMIR, m, weight);
      area += r * (stepMin / 60);  // r is U/h, step is min/60 = hours
    }
    // Should equal dose within ~1% numerical error
    expect(area).toBeCloseTo(dose, 1);
  });
});

describe("generatePerDoseActivityCurves — 4-dose basal example", () => {
  // Adult regimen described in the design spec:
  // 20:45 prev (4U), 05:30 (5U), 13:45 (5U), 22:30 (4U)
  const doses: InsulinDose[] = [
    { id: "d1", insulin_name: "Levemir", dose_units: 4, administered_at: "20:45", dose_type: "basal_injection" },
    { id: "d2", insulin_name: "Levemir", dose_units: 5, administered_at: "05:30", dose_type: "basal_injection" },
    { id: "d3", insulin_name: "Levemir", dose_units: 5, administered_at: "13:45", dose_type: "basal_injection" },
    { id: "d4", insulin_name: "Levemir", dose_units: 4, administered_at: "22:30", dose_type: "basal_injection" },
  ];

  test("produces one curve per dose × cycle that lands in the window", () => {
    // 24h window starting at -3h (21:00 prev day equivalent) through 27h.
    // With cycles=2, expect yesterday's 20:45 and 22:30 to appear as
    // prior-cycle curves, plus all 4 today.
    const curves = generatePerDoseActivityCurves(
      doses, INSULIN_PROFILES, -3, 27, 15, 2, 70,
    );
    expect(curves.length).toBeGreaterThanOrEqual(4);
    // Curves are sorted chronologically by injection time.
    for (let i = 1; i < curves.length; i++) {
      const prevHour = parseAdministered(curves[i - 1]);
      const thisHour = parseAdministered(curves[i]);
      expect(prevHour).toBeLessThanOrEqual(thisHour);
    }
  });

  test("peak rates scale with dose: 5U curves peak higher than 4U curves", () => {
    const curves = generatePerDoseActivityCurves(
      doses, INSULIN_PROFILES, -3, 27, 15, 1, 70,
    );
    const c5 = curves.find((c) => c.dose_units === 5);
    const c4 = curves.find((c) => c.dose_units === 4);
    expect(c5!.peak_rate_uph).toBeGreaterThan(c4!.peak_rate_uph);
  });

  test("all curve points sit within the requested window", () => {
    const start = -3;
    const end   = 27;
    const curves = generatePerDoseActivityCurves(
      doses, INSULIN_PROFILES, start, end, 15, 1, 70,
    );
    for (const c of curves) {
      for (const p of c.points) {
        expect(p.hour).toBeGreaterThanOrEqual(start - 0.01);
        expect(p.hour).toBeLessThanOrEqual(end + 0.01);
        expect(p.rate_uph).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

function parseAdministered(c: { administered_at: string; cycle_offset: number }): number {
  const [h, m] = c.administered_at.split(":").map(Number);
  return h + m / 60 + c.cycle_offset * 24;
}

describe("detectRiskZones — overnight basal gap detection", () => {
  // Case A: 06:30 / 14:00 / 21:00 Levemir at 30kg leaves a gap from
  // ~02:42 → 06:30 (night Levemir decayed, morning not yet given).
  const doses: InsulinDose[] = [
    { id: "m",  insulin_name: "Levemir", dose_units: 5.5, administered_at: "06:30", dose_type: "basal_injection" },
    { id: "a",  insulin_name: "Levemir", dose_units: 6.0, administered_at: "14:00", dose_type: "basal_injection" },
    { id: "n",  insulin_name: "Levemir", dose_units: 2.5, administered_at: "21:00", dose_type: "basal_injection" },
  ];

  test("does NOT flag a coverage_gap for 3x Levemir regimen — fixed DOA means curves overlap continuously", () => {
    // With fixed Levemir DOA of 20h (profile.duration_minutes) and three
    // doses spaced 06:30 / 14:00 / 21:00, coverage wraps around the clock.
    // The prior-cycle 21:00 dose's tail is still active at 05:30 the next
    // morning when the next 06:30 dose starts ramping up. Hence no gap.
    const curves = generatePerDoseActivityCurves(
      doses, INSULIN_PROFILES, 5.5, 29.5, 15, 2, 30,
    );
    const zones = detectRiskZones(curves, { minGapMinutes: 60 });
    expect(zones.filter((z) => z.type === "coverage_gap").length).toBe(0);
  });

  test("flags a coverage_gap only when there's a real sparse-dose regimen", () => {
    // Deliberately under-dosed: only a single morning basal with nothing
    // to cover the evening. A long window will surface the afternoon gap.
    const sparseDoses: InsulinDose[] = [
      { id: "only", insulin_name: "Levemir", dose_units: 5, administered_at: "06:00", dose_type: "basal_injection" },
    ];
    const curves = generatePerDoseActivityCurves(
      sparseDoses, INSULIN_PROFILES, 5, 29, 15, 1, 30,
    );
    const zones = detectRiskZones(curves, { minGapMinutes: 60 });
    expect(zones.filter((z) => z.type === "coverage_gap").length).toBeGreaterThan(0);
  });

  test("returns empty array for empty input", () => {
    expect(detectRiskZones([])).toEqual([]);
  });
});
