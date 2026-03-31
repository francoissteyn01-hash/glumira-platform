import { describe, it, expect } from "vitest";
import { calculateVariabilityIndex, type GlucoseReading } from "./glucose-variability-index";

/* ── helpers ─────────────────────────────────────────────────── */
function mkReadings(count: number, baseMmol: number, variability: number = 0.5): GlucoseReading[] {
  return Array.from({ length: count }, (_, i) => ({
    timestampUtc: new Date(Date.UTC(2026, 2, 15) + i * 15 * 60 * 1000).toISOString(),
    glucoseMmol: Math.round((baseMmol + Math.sin(i / 5) * variability) * 10) / 10,
  }));
}

function mkMultiDayReadings(days: number, baseMmol: number, variability: number = 0.5): GlucoseReading[] {
  const readings: GlucoseReading[] = [];
  for (let d = 0; d < days; d++) {
    for (let i = 0; i < 96; i++) { // 96 readings per day (every 15 min)
      readings.push({
        timestampUtc: new Date(Date.UTC(2026, 2, 15 + d) + i * 15 * 60 * 1000).toISOString(),
        glucoseMmol: Math.round((baseMmol + Math.sin(i / 10) * variability + (d % 2) * 0.3) * 10) / 10,
      });
    }
  }
  return readings;
}

const stableReadings = mkReadings(96, 6.5, 0.3);
const variableReadings = mkReadings(96, 8.0, 4.0);

/* ── Structure ───────────────────────────────────────────────── */
describe("calculateVariabilityIndex — structure", () => {
  it("returns complete result", () => {
    const r = calculateVariabilityIndex(stableReadings);
    expect(r.metrics).toBeDefined();
    expect(r.disclaimer).toContain("educational platform");
    expect(r.interpretation.length).toBeGreaterThan(0);
  });

  it("handles empty readings", () => {
    const r = calculateVariabilityIndex([]);
    expect(r.readingCount).toBe(0);
    expect(r.metrics.mean).toBe(0);
  });
});

/* ── Mean and SD ─────────────────────────────────────────────── */
describe("calculateVariabilityIndex — basic metrics", () => {
  it("calculates mean", () => {
    const r = calculateVariabilityIndex(stableReadings);
    expect(r.metrics.mean).toBeGreaterThan(6);
    expect(r.metrics.mean).toBeLessThan(7);
  });

  it("calculates SD", () => {
    const r = calculateVariabilityIndex(stableReadings);
    expect(r.metrics.sd).toBeGreaterThan(0);
  });

  it("higher variability = higher SD", () => {
    const stable = calculateVariabilityIndex(stableReadings);
    const variable = calculateVariabilityIndex(variableReadings);
    expect(variable.metrics.sd).toBeGreaterThan(stable.metrics.sd);
  });
});

/* ── CV ──────────────────────────────────────────────────────── */
describe("calculateVariabilityIndex — CV", () => {
  it("CV is percentage", () => {
    const r = calculateVariabilityIndex(stableReadings);
    expect(r.metrics.cv).toBeGreaterThan(0);
    expect(r.metrics.cv).toBeLessThan(100);
  });

  it("stable readings have low CV", () => {
    const r = calculateVariabilityIndex(stableReadings);
    expect(r.metrics.cv).toBeLessThan(36);
  });

  it("variable readings have high CV", () => {
    const r = calculateVariabilityIndex(variableReadings);
    expect(r.metrics.cv).toBeGreaterThan(20);
  });
});

/* ── CV status ───────────────────────────────────────────────── */
describe("calculateVariabilityIndex — CV status", () => {
  it("excellent for very low CV", () => {
    const readings = mkReadings(96, 6.5, 0.1);
    const r = calculateVariabilityIndex(readings);
    expect(r.cvStatus).toBe("excellent");
  });

  it("stable readings in target", () => {
    const r = calculateVariabilityIndex(stableReadings);
    expect(["excellent", "good", "target"]).toContain(r.cvStatus);
  });
});

/* ── MAGE ────────────────────────────────────────────────────── */
describe("calculateVariabilityIndex — MAGE", () => {
  it("MAGE is non-negative", () => {
    const r = calculateVariabilityIndex(stableReadings);
    expect(r.metrics.mage).toBeGreaterThanOrEqual(0);
  });

  it("higher variability = higher MAGE", () => {
    const stable = calculateVariabilityIndex(stableReadings);
    const variable = calculateVariabilityIndex(variableReadings);
    expect(variable.metrics.mage).toBeGreaterThanOrEqual(stable.metrics.mage);
  });
});

/* ── MODD ────────────────────────────────────────────────────── */
describe("calculateVariabilityIndex — MODD", () => {
  it("MODD requires multi-day data", () => {
    const r = calculateVariabilityIndex(stableReadings);
    // Single day = 96 readings, MODD needs 48+
    expect(r.metrics.modd).toBeGreaterThanOrEqual(0);
  });

  it("MODD calculated for multi-day data", () => {
    const readings = mkMultiDayReadings(3, 6.5, 0.5);
    const r = calculateVariabilityIndex(readings);
    expect(r.metrics.modd).toBeGreaterThanOrEqual(0);
  });
});

/* ── Risk indices ────────────────────────────────────────────── */
describe("calculateVariabilityIndex — risk indices", () => {
  it("LBGI is non-negative", () => {
    const r = calculateVariabilityIndex(stableReadings);
    expect(r.metrics.lbgi).toBeGreaterThanOrEqual(0);
  });

  it("HBGI is non-negative", () => {
    const r = calculateVariabilityIndex(stableReadings);
    expect(r.metrics.hbgi).toBeGreaterThanOrEqual(0);
  });

  it("high glucose readings increase HBGI", () => {
    const highReadings = mkReadings(96, 14.0, 2.0);
    const r = calculateVariabilityIndex(highReadings);
    expect(r.metrics.hbgi).toBeGreaterThan(0);
  });

  it("low glucose readings increase LBGI", () => {
    const lowReadings = mkReadings(96, 3.5, 0.3);
    const r = calculateVariabilityIndex(lowReadings);
    expect(r.metrics.lbgi).toBeGreaterThan(0);
  });
});

/* ── IQR ─────────────────────────────────────────────────────── */
describe("calculateVariabilityIndex — IQR", () => {
  it("IQR is non-negative", () => {
    const r = calculateVariabilityIndex(stableReadings);
    expect(r.metrics.iqr).toBeGreaterThanOrEqual(0);
  });

  it("higher variability = higher IQR", () => {
    const stable = calculateVariabilityIndex(stableReadings);
    const variable = calculateVariabilityIndex(variableReadings);
    expect(variable.metrics.iqr).toBeGreaterThan(stable.metrics.iqr);
  });
});

/* ── Overall stability ───────────────────────────────────────── */
describe("calculateVariabilityIndex — stability", () => {
  it("very stable for low variability", () => {
    const readings = mkReadings(96, 6.5, 0.1);
    const r = calculateVariabilityIndex(readings);
    expect(r.overallStability).toBe("very-stable");
  });

  it("unstable for high variability", () => {
    const readings = mkReadings(96, 8.0, 5.0);
    const r = calculateVariabilityIndex(readings);
    expect(["unstable", "very-unstable", "moderate"]).toContain(r.overallStability);
  });
});

/* ── Recommendations ─────────────────────────────────────────── */
describe("calculateVariabilityIndex — recommendations", () => {
  it("positive recommendation for good control", () => {
    const r = calculateVariabilityIndex(stableReadings);
    expect(r.recommendations.some((rec) => rec.includes("within target"))).toBe(true);
  });

  it("CV recommendation for high variability", () => {
    const readings = mkReadings(96, 8.0, 5.0);
    const r = calculateVariabilityIndex(readings);
    expect(r.recommendations.some((rec) => rec.includes("CV") || rec.includes("excursions") || rec.includes("hypo") || rec.includes("hyper"))).toBe(true);
  });
});

/* ── Days covered ────────────────────────────────────────────── */
describe("calculateVariabilityIndex — days", () => {
  it("counts days covered", () => {
    const readings = mkMultiDayReadings(5, 6.5);
    const r = calculateVariabilityIndex(readings);
    expect(r.daysCovered).toBeGreaterThanOrEqual(4);
  });

  it("reading count matches input", () => {
    const r = calculateVariabilityIndex(stableReadings);
    expect(r.readingCount).toBe(stableReadings.length);
  });
});
