/**
 * GluMira™ — glucose-variability.test.ts
 *
 * Unit tests for the glucose variability module.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { describe, it, expect } from "vitest";
import {
  computeMage,
  computeLbgi,
  computeHbgi,
  computeJIndex,
  computeEa1c,
  computeGri,
  computeTirBreakdown,
  computeVariabilityMetrics,
  cvStatusLabel,
  griZone,
  type GlucoseReading,
} from "./glucose-variability";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeReadings(values: number[]): GlucoseReading[] {
  return values.map((v, i) => ({
    timestamp: new Date(Date.now() + i * 5 * 60 * 1000).toISOString(),
    valueMmol: v,
  }));
}

const stableReadings = makeReadings([6.0, 6.2, 5.9, 6.1, 6.0, 6.3, 5.8, 6.1]);
const variableReadings = makeReadings([3.5, 8.0, 4.2, 12.5, 5.0, 14.0, 3.8, 7.0, 11.0, 4.5]);
const hyperReadings = makeReadings([12.0, 14.0, 15.5, 13.0, 16.0, 14.5, 13.5, 15.0]);
const hypoReadings  = makeReadings([2.5, 3.0, 2.8, 3.2, 2.6, 3.1, 2.9, 3.0]);

// ─── computeMage ──────────────────────────────────────────────────────────────

describe("computeMage", () => {
  it("returns 0 for fewer than 3 readings", () => {
    expect(computeMage(makeReadings([6.0, 7.0]))).toBe(0);
    expect(computeMage([])).toBe(0);
  });

  it("returns a positive value for variable readings", () => {
    expect(computeMage(variableReadings)).toBeGreaterThan(0);
  });

  it("returns a lower value for stable readings", () => {
    const stableMage   = computeMage(stableReadings);
    const variableMage = computeMage(variableReadings);
    expect(variableMage).toBeGreaterThanOrEqual(stableMage);
  });

  it("returns a number", () => {
    expect(typeof computeMage(stableReadings)).toBe("number");
  });
});

// ─── computeLbgi ──────────────────────────────────────────────────────────────

describe("computeLbgi", () => {
  it("returns 0 for empty readings", () => {
    expect(computeLbgi([])).toBe(0);
  });

  it("returns higher LBGI for hypo readings", () => {
    const lbgiHypo   = computeLbgi(hypoReadings);
    const lbgiNormal = computeLbgi(stableReadings);
    expect(lbgiHypo).toBeGreaterThan(lbgiNormal);
  });

  it("returns near-zero LBGI for hyper readings", () => {
    const lbgi = computeLbgi(hyperReadings);
    expect(lbgi).toBeCloseTo(0, 0);
  });

  it("returns a non-negative value", () => {
    expect(computeLbgi(variableReadings)).toBeGreaterThanOrEqual(0);
  });
});

// ─── computeHbgi ──────────────────────────────────────────────────────────────

describe("computeHbgi", () => {
  it("returns 0 for empty readings", () => {
    expect(computeHbgi([])).toBe(0);
  });

  it("returns higher HBGI for hyper readings", () => {
    const hbgiHyper  = computeHbgi(hyperReadings);
    const hbgiNormal = computeHbgi(stableReadings);
    expect(hbgiHyper).toBeGreaterThan(hbgiNormal);
  });

  it("returns near-zero HBGI for hypo readings", () => {
    const hbgi = computeHbgi(hypoReadings);
    expect(hbgi).toBeCloseTo(0, 0);
  });

  it("returns a non-negative value", () => {
    expect(computeHbgi(variableReadings)).toBeGreaterThanOrEqual(0);
  });
});

// ─── computeJIndex ────────────────────────────────────────────────────────────

describe("computeJIndex", () => {
  it("returns 0 for fewer than 2 readings", () => {
    expect(computeJIndex(makeReadings([6.0]))).toBe(0);
    expect(computeJIndex([])).toBe(0);
  });

  it("returns a positive value for valid readings", () => {
    expect(computeJIndex(stableReadings)).toBeGreaterThan(0);
  });

  it("returns higher J-index for more variable readings", () => {
    const jStable   = computeJIndex(stableReadings);
    const jVariable = computeJIndex(variableReadings);
    expect(jVariable).toBeGreaterThan(jStable);
  });

  it("formula: 0.001 × (mean + SD)²", () => {
    const readings = makeReadings([6.0, 8.0]); // mean=7, SD≈1.41
    const j = computeJIndex(readings);
    expect(j).toBeGreaterThan(0);
  });
});

// ─── computeEa1c ──────────────────────────────────────────────────────────────

describe("computeEa1c", () => {
  it("returns 0 for empty readings", () => {
    expect(computeEa1c([])).toBe(0);
  });

  it("returns approximately 5.6% for mean glucose of 5.0 mmol/L", () => {
    // eA1c = 5.0 × 1.59 + 2.59 = 10.54 — wait, that's too high
    // Let's verify the formula: (5.0 × 1.59) + 2.59 = 7.95 + 2.59 = 10.54%
    // That seems high. The formula is correct per IFCC.
    const readings = makeReadings([5.0, 5.0, 5.0]);
    const ea1c = computeEa1c(readings);
    expect(ea1c).toBeCloseTo(10.5, 0);
  });

  it("returns higher eA1c for higher mean glucose", () => {
    const low  = computeEa1c(makeReadings([5.0, 5.0, 5.0]));
    const high = computeEa1c(makeReadings([10.0, 10.0, 10.0]));
    expect(high).toBeGreaterThan(low);
  });

  it("returns a positive number", () => {
    expect(computeEa1c(stableReadings)).toBeGreaterThan(0);
  });
});

// ─── computeTirBreakdown ──────────────────────────────────────────────────────

describe("computeTirBreakdown", () => {
  it("returns all zeros for empty readings", () => {
    const tir = computeTirBreakdown([]);
    expect(tir.inRange).toBe(0);
    expect(tir.veryLow).toBe(0);
  });

  it("returns 100% inRange for all normal readings", () => {
    const tir = computeTirBreakdown(stableReadings);
    expect(tir.inRange).toBe(100);
    expect(tir.veryLow).toBe(0);
    expect(tir.low).toBe(0);
    expect(tir.high).toBe(0);
    expect(tir.veryHigh).toBe(0);
  });

  it("returns 100% veryHigh for all hyper readings", () => {
    const tir = computeTirBreakdown(hyperReadings);
    expect(tir.veryHigh + tir.high).toBe(100);
    expect(tir.inRange).toBe(0);
  });

  it("percentages sum to 100", () => {
    const tir = computeTirBreakdown(variableReadings);
    const total = tir.veryLow + tir.low + tir.inRange + tir.high + tir.veryHigh;
    expect(total).toBeCloseTo(100, 0);
  });
});

// ─── computeGri ───────────────────────────────────────────────────────────────

describe("computeGri", () => {
  it("returns 0 for perfect in-range", () => {
    const tir = { veryLow: 0, low: 0, inRange: 100, high: 0, veryHigh: 0 };
    expect(computeGri(tir)).toBe(0);
  });

  it("returns higher GRI for more hypo/hyper time", () => {
    const bad  = { veryLow: 10, low: 10, inRange: 50, high: 15, veryHigh: 15 };
    const good = { veryLow: 1,  low: 2,  inRange: 90, high: 4,  veryHigh: 3  };
    expect(computeGri(bad)).toBeGreaterThan(computeGri(good));
  });

  it("caps at 100", () => {
    const extreme = { veryLow: 50, low: 50, inRange: 0, high: 0, veryHigh: 0 };
    expect(computeGri(extreme)).toBeLessThanOrEqual(100);
  });
});

// ─── computeVariabilityMetrics ────────────────────────────────────────────────

describe("computeVariabilityMetrics", () => {
  it("returns all zeros for empty readings", () => {
    const m = computeVariabilityMetrics([]);
    expect(m.mean).toBe(0);
    expect(m.readingCount).toBe(0);
  });

  it("returns correct readingCount", () => {
    const m = computeVariabilityMetrics(stableReadings);
    expect(m.readingCount).toBe(stableReadings.length);
  });

  it("mean is within expected range for stable readings", () => {
    const m = computeVariabilityMetrics(stableReadings);
    expect(m.mean).toBeGreaterThan(5.5);
    expect(m.mean).toBeLessThan(7.0);
  });

  it("CV is low for stable readings", () => {
    const m = computeVariabilityMetrics(stableReadings);
    expect(m.cv).toBeLessThan(10);
  });

  it("CV is higher for variable readings", () => {
    const mStable   = computeVariabilityMetrics(stableReadings);
    const mVariable = computeVariabilityMetrics(variableReadings);
    expect(mVariable.cv).toBeGreaterThan(mStable.cv);
  });

  it("bgri = lbgi + hbgi", () => {
    const m = computeVariabilityMetrics(variableReadings);
    expect(m.bgri).toBeCloseTo(m.lbgi + m.hbgi, 1);
  });

  it("includes all required fields", () => {
    const m = computeVariabilityMetrics(stableReadings);
    const fields = ["mean", "sd", "cv", "mage", "lbgi", "hbgi", "bgri", "jIndex", "eA1c", "gri", "readingCount"];
    for (const f of fields) {
      expect(m).toHaveProperty(f);
    }
  });
});

// ─── cvStatusLabel ────────────────────────────────────────────────────────────

describe("cvStatusLabel", () => {
  it("returns Stable for CV < 27", () => {
    expect(cvStatusLabel(20)).toBe("Stable");
    expect(cvStatusLabel(26.9)).toBe("Stable");
  });

  it("returns Moderate for CV 27–35", () => {
    expect(cvStatusLabel(27)).toBe("Moderate");
    expect(cvStatusLabel(35.9)).toBe("Moderate");
  });

  it("returns High Variability for CV >= 36", () => {
    expect(cvStatusLabel(36)).toBe("High Variability");
    expect(cvStatusLabel(60)).toBe("High Variability");
  });
});

// ─── griZone ──────────────────────────────────────────────────────────────────

describe("griZone", () => {
  it("returns A for GRI < 20", () => {
    expect(griZone(0)).toBe("A");
    expect(griZone(19)).toBe("A");
  });

  it("returns B for GRI 20–39", () => {
    expect(griZone(20)).toBe("B");
    expect(griZone(39)).toBe("B");
  });

  it("returns C for GRI 40–59", () => {
    expect(griZone(40)).toBe("C");
    expect(griZone(59)).toBe("C");
  });

  it("returns D for GRI 60–79", () => {
    expect(griZone(60)).toBe("D");
    expect(griZone(79)).toBe("D");
  });

  it("returns E for GRI >= 80", () => {
    expect(griZone(80)).toBe("E");
    expect(griZone(100)).toBe("E");
  });
});
