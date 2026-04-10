/**
 * GluMira™ V7 — IOB Hunter™ Engine Tests
 */

import { describe, test, expect } from "vitest";
import {
  calculateIOB,
  applyGaussianPeak,
  getActiveIOB,
  calculateStackingScore,
  generateStackingCurve,
  classifyPressure,
  FORMULARY_MAP,
  type InsulinEvent,
} from "../iob-hunter";

/* ─── Exponential Decay ───────────────────────────────────────────────────── */

describe("calculateIOB — exponential decay", () => {
  test("at t=0 should return full dose", () => {
    expect(calculateIOB(10, 0, 90)).toBeCloseTo(10, 2);
  });

  test("at t=halfLife should return ~50% of dose", () => {
    const result = calculateIOB(10, 90, 90);
    expect(result).toBeCloseTo(5, 1);
  });

  test("at t=2×halfLife should return ~25% of dose", () => {
    const result = calculateIOB(10, 180, 90);
    expect(result).toBeCloseTo(2.5, 1);
  });

  test("at t=3×halfLife should return ~12.5%", () => {
    const result = calculateIOB(10, 270, 90);
    expect(result).toBeCloseTo(1.25, 1);
  });

  test("returns 0 for negative time", () => {
    expect(calculateIOB(10, -10, 90)).toBe(0);
  });

  test("returns 0 for zero dose", () => {
    expect(calculateIOB(0, 60, 90)).toBe(0);
  });

  test("returns 0 when IOB decays below 0.001", () => {
    // After many half-lives, IOB should be negligible
    const result = calculateIOB(1, 2000, 90);
    expect(result).toBe(0);
  });

  test("works with Levemir half-life (720 min)", () => {
    const result = calculateIOB(10, 720, 720);
    expect(result).toBeCloseTo(5, 1);
  });
});

/* ─── Gaussian Peak Modifier ──────────────────────────────────────────────── */

describe("applyGaussianPeak", () => {
  test("modifier = 1.0 at peak time (no attenuation)", () => {
    const result = applyGaussianPeak(5, 120, 120, 40);
    expect(result).toBeCloseTo(5, 4);
  });

  test("modifier < 1.0 away from peak", () => {
    const atPeak = applyGaussianPeak(5, 120, 120, 40);
    const offPeak = applyGaussianPeak(5, 60, 120, 40);
    expect(offPeak).toBeLessThan(atPeak);
  });

  test("modifier is symmetric around peak", () => {
    const before = applyGaussianPeak(5, 80, 120, 40);
    const after = applyGaussianPeak(5, 160, 120, 40);
    expect(before).toBeCloseTo(after, 4);
  });

  test("narrower sigma means faster drop-off", () => {
    const wide = applyGaussianPeak(5, 60, 120, 60);
    const narrow = applyGaussianPeak(5, 60, 120, 20);
    expect(narrow).toBeLessThan(wide);
  });
});

/* ─── getActiveIOB (combined) ─────────────────────────────────────────────── */

describe("getActiveIOB", () => {
  const novorapid = FORMULARY_MAP["novorapid"];
  const levemir = FORMULARY_MAP["levemir"];

  test("returns 0 before onset", () => {
    expect(getActiveIOB(10, 5, novorapid)).toBe(0); // onset = 15 min
  });

  test("returns 0 after duration", () => {
    expect(getActiveIOB(10, 300, novorapid)).toBe(0); // duration = 240 min
  });

  test("peaked insulin: returns > 0 at peak time", () => {
    const iob = getActiveIOB(10, novorapid.peak_minutes!, novorapid);
    expect(iob).toBeGreaterThan(0);
  });

  test("peakless insulin: returns > 0 within duration", () => {
    const iob = getActiveIOB(10, 360, levemir);
    expect(iob).toBeGreaterThan(0);
  });

  test("peakless insulin: pure decay, no Gaussian applied", () => {
    // For peakless, getActiveIOB should equal calculateIOB
    const active = getActiveIOB(10, 360, levemir);
    const raw = calculateIOB(10, 360, levemir.half_life_minutes);
    expect(active).toBeCloseTo(raw, 6);
  });
});

/* ─── Stacking Score ──────────────────────────────────────────────────────── */

describe("calculateStackingScore", () => {
  test("sums IOB from multiple overlapping doses", () => {
    const now = new Date("2026-04-02T12:00:00Z");
    const events: InsulinEvent[] = [
      {
        id: "a",
        event_time: new Date("2026-04-02T11:00:00Z").toISOString(),
        insulin_type: "novorapid",
        dose_units: 5,
      },
      {
        id: "b",
        event_time: new Date("2026-04-02T11:30:00Z").toISOString(),
        insulin_type: "novorapid",
        dose_units: 3,
      },
    ];

    const score = calculateStackingScore(events, now);

    // Both doses have IOB remaining at t=12:00
    // Dose A: 60 min elapsed, Dose B: 30 min elapsed
    const iobA = getActiveIOB(5, 60, FORMULARY_MAP["novorapid"]);
    const iobB = getActiveIOB(3, 30, FORMULARY_MAP["novorapid"]);

    expect(score).toBeCloseTo(iobA + iobB, 4);
  });

  test("returns 0 when no events", () => {
    expect(calculateStackingScore([], new Date())).toBe(0);
  });

  test("ignores unknown insulin types", () => {
    const events: InsulinEvent[] = [
      { id: "x", event_time: new Date().toISOString(), insulin_type: "unknown_xyz", dose_units: 10 },
    ];
    expect(calculateStackingScore(events, new Date())).toBe(0);
  });
});

/* ─── Levemir 3× daily overlap scenario ───────────────────────────────────── */

describe("Levemir 3× daily stacking", () => {
  test("produces overlap around 13:30-15:30 window", () => {
    const baseDate = "2026-04-02";
    const events: InsulinEvent[] = [
      { id: "1", event_time: `${baseDate}T06:30:00Z`, insulin_type: "levemir", dose_units: 5.5 },
      { id: "2", event_time: `${baseDate}T14:00:00Z`, insulin_type: "levemir", dose_units: 5.5 },
      { id: "3", event_time: `${baseDate}T21:00:00Z`, insulin_type: "levemir", dose_units: 5.5 },
    ];

    // Check IOB at 13:30 (just before second dose — only dose 1 active)
    const at1330 = calculateStackingScore(events, new Date(`${baseDate}T13:30:00Z`));

    // Check IOB at 15:30 (1.5h after second dose — past 60min onset, doses 1 + 2 both active)
    const at1530 = calculateStackingScore(events, new Date(`${baseDate}T15:30:00Z`));

    // The stacking score should be higher at 15:30 than at 13:30 because two
    // Levemir doses are now both contributing (dose 2 has cleared its 60min onset).
    // Note: at 14:30 (30min post-dose-2) the engine returns 0 for dose 2 because
    // it's still in its onset window — that's the correct PK model and we don't
    // assert on it here.
    expect(at1530).toBeGreaterThan(at1330);

    // Verify doses 1 and 2 both contribute
    // Dose 1 at 15:30 = 9h = 540 min elapsed
    // Dose 2 at 15:30 = 1.5h = 90 min elapsed (past onset of 60 min)
    const dose1iob = getActiveIOB(5.5, 540, FORMULARY_MAP["levemir"]);
    const dose2iob = getActiveIOB(5.5, 90, FORMULARY_MAP["levemir"]);
    expect(dose1iob).toBeGreaterThan(0);
    expect(dose2iob).toBeGreaterThan(0);
    expect(at1530).toBeCloseTo(dose1iob + dose2iob, 4);
  });
});

/* ─── Stacking Curve Generation ───────────────────────────────────────────── */

describe("generateStackingCurve", () => {
  test("produces points at 5-minute intervals", () => {
    const events: InsulinEvent[] = [
      { id: "a", event_time: "2026-04-02T08:00:00Z", insulin_type: "novorapid", dose_units: 5 },
    ];
    const start = new Date("2026-04-02T08:00:00Z");
    const end = new Date("2026-04-02T09:00:00Z"); // 1 hour = 12 intervals + 1
    const curve = generateStackingCurve(events, start, end);

    expect(curve.length).toBe(13); // 0, 5, 10, ..., 60
    expect(curve[0].pressure).toBeDefined();
  });

  test("every point has a valid pressure classification", () => {
    const events: InsulinEvent[] = [
      { id: "a", event_time: "2026-04-02T08:00:00Z", insulin_type: "novorapid", dose_units: 5 },
    ];
    const curve = generateStackingCurve(
      events,
      new Date("2026-04-02T08:00:00Z"),
      new Date("2026-04-02T12:00:00Z")
    );

    for (const p of curve) {
      expect(["light", "moderate", "strong", "overlap"]).toContain(p.pressure);
    }
  });
});

/* ─── Pressure Classification ─────────────────────────────────────────────── */

describe("classifyPressure", () => {
  test("light when < 25%", () => {
    expect(classifyPressure(2, 10)).toBe("light");
  });
  test("moderate when 25-50%", () => {
    expect(classifyPressure(3, 10)).toBe("moderate");
  });
  test("strong when 50-75%", () => {
    expect(classifyPressure(6, 10)).toBe("strong");
  });
  test("overlap when > 75%", () => {
    expect(classifyPressure(8, 10)).toBe("overlap");
  });
  test("light when maxScore is 0", () => {
    expect(classifyPressure(0, 0)).toBe("light");
  });
});
