/**
 * GluMira — A1c Estimator Test Suite
 *
 * Tests mmolToMgdl, mgdlToMmol, estimateA1cFromMean, a1cPercentToMmolMol,
 * a1cMmolMolToPercent, categoriseA1c, a1cCategoryLabel, a1cCategoryColour,
 * estimateConfidence, estimateA1c, and projectA1c.
 */

import { describe, it, expect } from "vitest";
import {
  mmolToMgdl,
  mgdlToMmol,
  estimateA1cFromMean,
  a1cPercentToMmolMol,
  a1cMmolMolToPercent,
  categoriseA1c,
  a1cCategoryLabel,
  a1cCategoryColour,
  estimateConfidence,
  estimateA1c,
  projectA1c,
  type GlucoseReading,
} from "./a1c-estimator";

// ─── Conversion helpers ───────────────────────────────────────────────────────

describe("mmolToMgdl", () => {
  it("converts 5.5 mmol/L to ~99 mg/dL", () => {
    expect(mmolToMgdl(5.5)).toBeCloseTo(99.1, 0);
  });

  it("converts 10 mmol/L to ~180 mg/dL", () => {
    expect(mmolToMgdl(10)).toBeCloseTo(180.2, 0);
  });

  it("converts 0 to 0", () => {
    expect(mmolToMgdl(0)).toBe(0);
  });
});

describe("mgdlToMmol", () => {
  it("converts 100 mg/dL to ~5.6 mmol/L", () => {
    expect(mgdlToMmol(100)).toBeCloseTo(5.6, 0);
  });

  it("converts 180 mg/dL to ~10 mmol/L", () => {
    expect(mgdlToMmol(180)).toBeCloseTo(10, 0);
  });
});

// ─── ADAG formula ─────────────────────────────────────────────────────────────

describe("estimateA1cFromMean", () => {
  it("returns ~5.1% for mean 5.0 mmol/L", () => {
    const result = estimateA1cFromMean(5.0);
    expect(result).toBeGreaterThan(4.5);
    expect(result).toBeLessThan(6.0);
  });

  it("returns ~7.0% for mean ~8.6 mmol/L", () => {
    const result = estimateA1cFromMean(8.6);
    expect(result).toBeCloseTo(7.0, 0);
  });

  it("returns higher A1c for higher mean glucose", () => {
    expect(estimateA1cFromMean(12.0)).toBeGreaterThan(estimateA1cFromMean(6.0));
  });
});

// ─── IFCC conversion ─────────────────────────────────────────────────────────

describe("a1cPercentToMmolMol", () => {
  it("converts 7.0% to ~53 mmol/mol", () => {
    expect(a1cPercentToMmolMol(7.0)).toBeCloseTo(53, 0);
  });

  it("converts 5.7% to ~39 mmol/mol", () => {
    expect(a1cPercentToMmolMol(5.7)).toBeCloseTo(39, 0);
  });
});

describe("a1cMmolMolToPercent", () => {
  it("converts 53 mmol/mol to ~7.0%", () => {
    expect(a1cMmolMolToPercent(53)).toBeCloseTo(7.0, 0);
  });

  it("round-trips with a1cPercentToMmolMol", () => {
    const percent = 6.5;
    const mmolMol = a1cPercentToMmolMol(percent);
    expect(a1cMmolMolToPercent(mmolMol)).toBeCloseTo(percent, 0);
  });
});

// ─── Categorise ──────────────────────────────────────────────────────────────

describe("categoriseA1c", () => {
  it("returns normal for < 5.7%", () => {
    expect(categoriseA1c(5.0)).toBe("normal");
  });

  it("returns pre-diabetes for 5.7-6.4%", () => {
    expect(categoriseA1c(6.0)).toBe("pre-diabetes");
  });

  it("returns well-controlled for 6.5-6.9%", () => {
    expect(categoriseA1c(6.8)).toBe("well-controlled");
  });

  it("returns above-target for 7.0-7.9%", () => {
    expect(categoriseA1c(7.5)).toBe("above-target");
  });

  it("returns diabetes for >= 8.0%", () => {
    expect(categoriseA1c(9.0)).toBe("diabetes");
  });
});

describe("a1cCategoryLabel", () => {
  it("returns a string for each category", () => {
    expect(a1cCategoryLabel("normal")).toBe("Normal range");
    expect(a1cCategoryLabel("diabetes")).toBe("Diabetes range");
  });
});

describe("a1cCategoryColour", () => {
  it("returns green for normal", () => {
    expect(a1cCategoryColour("normal")).toBe("green");
  });

  it("returns red for diabetes", () => {
    expect(a1cCategoryColour("diabetes")).toBe("red");
  });
});

// ─── Confidence ──────────────────────────────────────────────────────────────

describe("estimateConfidence", () => {
  it("returns high for >= 200 readings and >= 14 days", () => {
    expect(estimateConfidence(250, 14)).toBe("high");
  });

  it("returns moderate for >= 50 readings and >= 7 days", () => {
    expect(estimateConfidence(60, 10)).toBe("moderate");
  });

  it("returns low for few readings", () => {
    expect(estimateConfidence(10, 3)).toBe("low");
  });
});

// ─── estimateA1c ─────────────────────────────────────────────────────────────

describe("estimateA1c", () => {
  it("returns zeros for empty readings", () => {
    const r = estimateA1c([]);
    expect(r.eA1cPercent).toBe(0);
    expect(r.readingCount).toBe(0);
  });

  it("computes eA1c from readings", () => {
    const now = Date.now();
    const readings: GlucoseReading[] = Array.from({ length: 100 }, (_, i) => ({
      mmol: 7.0 + (i % 3) * 0.5,
      timestamp: new Date(now - i * 3600000).toISOString(),
    }));
    const r = estimateA1c(readings);
    expect(r.eA1cPercent).toBeGreaterThan(5.0);
    expect(r.readingCount).toBe(100);
    expect(r.method).toBe("ADAG");
    expect(r.meanGlucoseMmol).toBeGreaterThan(6);
    expect(r.meanGlucoseMgdl).toBeGreaterThan(100);
  });

  it("returns correct daysCovered", () => {
    const readings: GlucoseReading[] = [
      { mmol: 6.0, timestamp: "2026-03-01T00:00:00Z" },
      { mmol: 7.0, timestamp: "2026-03-15T00:00:00Z" },
    ];
    const r = estimateA1c(readings);
    expect(r.daysCovered).toBe(14);
  });

  it("eA1cMmolMol is consistent with eA1cPercent", () => {
    const readings: GlucoseReading[] = [
      { mmol: 8.0, timestamp: "2026-03-01T00:00:00Z" },
      { mmol: 8.0, timestamp: "2026-03-10T00:00:00Z" },
    ];
    const r = estimateA1c(readings);
    expect(a1cMmolMolToPercent(r.eA1cMmolMol)).toBeCloseTo(r.eA1cPercent, 0);
  });
});

// ─── projectA1c ──────────────────────────────────────────────────────────────

describe("projectA1c", () => {
  const makeReadings = (meanMmol: number, startDay: number, count: number): GlucoseReading[] =>
    Array.from({ length: count }, (_, i) => ({
      mmol: meanMmol,
      timestamp: new Date(Date.now() - (startDay - i) * 86400000).toISOString(),
    }));

  it("detects improving trend when recent is lower", () => {
    const recent = makeReadings(6.0, 7, 50);
    const older = makeReadings(9.0, 21, 50);
    const p = projectA1c(recent, older);
    expect(p.trend).toBe("improving");
    expect(p.trendLabel).toContain("Improving");
  });

  it("detects worsening trend when recent is higher", () => {
    const recent = makeReadings(10.0, 7, 50);
    const older = makeReadings(6.0, 21, 50);
    const p = projectA1c(recent, older);
    expect(p.trend).toBe("worsening");
    expect(p.trendLabel).toContain("Worsening");
  });

  it("detects stable trend when similar", () => {
    const recent = makeReadings(7.0, 7, 50);
    const older = makeReadings(7.1, 21, 50);
    const p = projectA1c(recent, older);
    expect(p.trend).toBe("stable");
    expect(p.trendLabel).toBe("Stable");
  });

  it("projected values are never below 4.0", () => {
    const recent = makeReadings(4.0, 7, 50);
    const older = makeReadings(5.0, 21, 50);
    const p = projectA1c(recent, older);
    expect(p.projected30d).toBeGreaterThanOrEqual(4.0);
    expect(p.projected90d).toBeGreaterThanOrEqual(4.0);
  });

  it("returns current estimate in projection", () => {
    const recent = makeReadings(7.0, 7, 50);
    const older = makeReadings(7.0, 21, 50);
    const p = projectA1c(recent, older);
    expect(p.current.readingCount).toBe(50);
    expect(p.current.eA1cPercent).toBeGreaterThan(0);
  });
});
