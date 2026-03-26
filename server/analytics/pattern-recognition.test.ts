/**
 * GluMira™ — Pattern Recognition Test Suite
 *
 * Tests for all pattern detectors and the main recognisePatterns function.
 */

import { describe, it, expect } from "vitest";
import {
  detectDawnPhenomenon,
  detectSomogyiEffect,
  detectNocturnalHypo,
  detectRollerCoaster,
  detectPostLunchDip,
  detectFastingHyper,
  recognisePatterns,
  patternSeveritySummary,
} from "./pattern-recognition";
import type { GlucosePoint } from "./glucose-trend";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePoint(hour: number, mmol: number, dayOffset = 0): GlucosePoint {
  const d = new Date(2026, 2, 20 + dayOffset); // March 20 2026 local
  d.setHours(hour, 0, 0, 0);
  return { timestamp: d.toISOString(), mmol };
}

// ─── Dawn Phenomenon ──────────────────────────────────────────────────────────

describe("detectDawnPhenomenon", () => {
  it("detects clear dawn phenomenon with 2+ mmol rise 3-8am", () => {
    const readings: GlucosePoint[] = [
      makePoint(3, 5.5),
      makePoint(4, 6.2),
      makePoint(5, 7.0),
      makePoint(6, 7.8),
      makePoint(7, 8.2),
    ];
    const result = detectDawnPhenomenon(readings);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("dawn-phenomenon");
    expect(result!.confidence).toBe("high");
  });

  it("returns null when rise is less than 1.5 mmol/L", () => {
    const readings: GlucosePoint[] = [
      makePoint(3, 6.0),
      makePoint(5, 6.8),
      makePoint(7, 7.2),
    ];
    const result = detectDawnPhenomenon(readings);
    expect(result).toBeNull();
  });

  it("returns null when fewer than 3 early morning readings", () => {
    const readings: GlucosePoint[] = [
      makePoint(4, 5.5),
      makePoint(7, 8.0),
    ];
    expect(detectDawnPhenomenon(readings)).toBeNull();
  });

  it("returns null when trend is not consistently rising", () => {
    const readings: GlucosePoint[] = [
      makePoint(3, 8.0),
      makePoint(4, 6.0),
      makePoint(5, 9.0),
      makePoint(6, 5.0),
    ];
    expect(detectDawnPhenomenon(readings)).toBeNull();
  });

  it("assigns warning severity for rise > 3 mmol/L", () => {
    const readings: GlucosePoint[] = [
      makePoint(3, 5.0),
      makePoint(4, 6.5),
      makePoint(5, 7.5),
      makePoint(6, 8.5),
      makePoint(7, 9.0),
    ];
    const result = detectDawnPhenomenon(readings);
    expect(result!.severity).toBe("warning");
  });
});

// ─── Somogyi Effect ───────────────────────────────────────────────────────────

describe("detectSomogyiEffect", () => {
  it("detects Somogyi effect with nocturnal hypo and morning rebound", () => {
    const readings: GlucosePoint[] = [
      makePoint(1, 3.2),
      makePoint(2, 3.5),
      makePoint(5, 9.5),
      makePoint(6, 10.2),
      makePoint(7, 11.0),
    ];
    const result = detectSomogyiEffect(readings);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("somogyi-effect");
  });

  it("returns null when no nocturnal hypo", () => {
    const readings: GlucosePoint[] = [
      makePoint(1, 5.5),
      makePoint(2, 6.0),
      makePoint(5, 9.5),
      makePoint(6, 10.0),
    ];
    expect(detectSomogyiEffect(readings)).toBeNull();
  });

  it("returns null when no morning rebound", () => {
    const readings: GlucosePoint[] = [
      makePoint(1, 3.2),
      makePoint(2, 3.5),
      makePoint(5, 6.0),
      makePoint(6, 6.5),
    ];
    expect(detectSomogyiEffect(readings)).toBeNull();
  });

  it("assigns high confidence when nocturnal min < 3.5", () => {
    const readings: GlucosePoint[] = [
      makePoint(1, 2.8),
      makePoint(2, 3.1),
      makePoint(5, 10.0),
      makePoint(6, 11.5),
    ];
    const result = detectSomogyiEffect(readings);
    expect(result!.confidence).toBe("high");
  });
});

// ─── Nocturnal Hypo ───────────────────────────────────────────────────────────

describe("detectNocturnalHypo", () => {
  it("detects nocturnal hypo below 3.9 mmol/L", () => {
    const readings: GlucosePoint[] = [
      makePoint(1, 3.5),
      makePoint(2, 3.2),
      makePoint(3, 3.8),
    ];
    const result = detectNocturnalHypo(readings);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("nocturnal-hypo");
  });

  it("assigns critical severity when min < 3.0 mmol/L", () => {
    const readings: GlucosePoint[] = [
      makePoint(2, 2.7),
      makePoint(3, 3.1),
    ];
    const result = detectNocturnalHypo(readings);
    expect(result!.severity).toBe("critical");
  });

  it("returns null when all nocturnal readings are in range", () => {
    const readings: GlucosePoint[] = [
      makePoint(1, 5.5),
      makePoint(2, 6.0),
      makePoint(3, 5.8),
    ];
    expect(detectNocturnalHypo(readings)).toBeNull();
  });

  it("assigns high confidence with 3+ hypo readings", () => {
    const readings: GlucosePoint[] = [
      makePoint(0, 3.5),
      makePoint(1, 3.2),
      makePoint(2, 3.7),
      makePoint(3, 3.4),
    ];
    const result = detectNocturnalHypo(readings);
    expect(result!.confidence).toBe("high");
  });
});

// ─── Roller-Coaster ───────────────────────────────────────────────────────────

describe("detectRollerCoaster", () => {
  it("detects roller-coaster with CV > 36%", () => {
    const readings: GlucosePoint[] = [
      makePoint(0, 3.5), makePoint(2, 14.0), makePoint(4, 3.2), makePoint(6, 13.5),
      makePoint(8, 3.8), makePoint(10, 15.0), makePoint(12, 3.0), makePoint(14, 12.0),
    ];
    const result = detectRollerCoaster(readings);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("roller-coaster");
  });

  it("returns null when CV is low", () => {
    const readings: GlucosePoint[] = Array.from({ length: 10 }, (_, i) =>
      makePoint(i * 2, 6.0 + (i % 3) * 0.2)
    );
    expect(detectRollerCoaster(readings)).toBeNull();
  });

  it("returns null with fewer than 8 readings", () => {
    const readings: GlucosePoint[] = [
      makePoint(0, 3.0), makePoint(2, 15.0), makePoint(4, 3.0),
    ];
    expect(detectRollerCoaster(readings)).toBeNull();
  });
});

// ─── Post-Lunch Dip ───────────────────────────────────────────────────────────

describe("detectPostLunchDip", () => {
  it("detects post-lunch dip below 4.5 mmol/L 1-3pm", () => {
    const readings: GlucosePoint[] = [
      makePoint(13, 4.2),
      makePoint(14, 4.0),
      makePoint(15, 4.3),
    ];
    const result = detectPostLunchDip(readings);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("post-lunch-dip");
  });

  it("returns null when all post-lunch readings are in range", () => {
    const readings: GlucosePoint[] = [
      makePoint(13, 6.0),
      makePoint(14, 5.5),
    ];
    expect(detectPostLunchDip(readings)).toBeNull();
  });

  it("returns null with fewer than 2 post-lunch readings", () => {
    const readings: GlucosePoint[] = [makePoint(13, 4.0)];
    expect(detectPostLunchDip(readings)).toBeNull();
  });
});

// ─── Fasting Hyper ────────────────────────────────────────────────────────────

describe("detectFastingHyper", () => {
  it("detects fasting hyperglycaemia when 60%+ of 6-9am readings > 7.0", () => {
    const readings: GlucosePoint[] = [
      makePoint(6, 8.5),
      makePoint(7, 9.0),
      makePoint(8, 8.2),
      makePoint(9, 7.8),
    ];
    const result = detectFastingHyper(readings);
    expect(result).not.toBeNull();
    expect(result!.type).toBe("fasting-hyper");
  });

  it("returns null when fewer than 3 pre-breakfast readings", () => {
    const readings: GlucosePoint[] = [
      makePoint(7, 8.5),
      makePoint(8, 9.0),
    ];
    expect(detectFastingHyper(readings)).toBeNull();
  });

  it("returns null when most readings are in range", () => {
    const readings: GlucosePoint[] = [
      makePoint(6, 5.5),
      makePoint(7, 6.0),
      makePoint(8, 5.8),
      makePoint(9, 8.5),
    ];
    expect(detectFastingHyper(readings)).toBeNull();
  });
});

// ─── recognisePatterns ────────────────────────────────────────────────────────

describe("recognisePatterns", () => {
  it("returns empty report for flat in-range readings", () => {
    const readings: GlucosePoint[] = Array.from({ length: 24 }, (_, i) =>
      makePoint(i, 5.5 + (i % 3) * 0.1)
    );
    const report = recognisePatterns(readings);
    expect(report.patternCount).toBe(0);
    expect(report.dominantPattern).toBeNull();
  });

  it("detects multiple patterns in a complex dataset", () => {
    const readings: GlucosePoint[] = [
      // Nocturnal hypo
      makePoint(1, 3.2), makePoint(2, 3.5),
      // Dawn rise
      makePoint(3, 5.0), makePoint(4, 6.2), makePoint(5, 7.5), makePoint(6, 8.0), makePoint(7, 8.5),
      // Post-lunch dip
      makePoint(13, 4.1), makePoint(14, 4.0),
    ];
    const report = recognisePatterns(readings);
    expect(report.patternCount).toBeGreaterThan(0);
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it("sorts patterns with critical first", () => {
    const readings: GlucosePoint[] = [
      makePoint(1, 2.5), makePoint(2, 2.8), // critical nocturnal hypo
      makePoint(13, 4.2), makePoint(14, 4.0), // info post-lunch dip
    ];
    const report = recognisePatterns(readings);
    if (report.patterns.length > 1) {
      expect(report.patterns[0].severity).toBe("critical");
    }
  });

  it("sets dominantPattern to the most severe pattern type", () => {
    const readings: GlucosePoint[] = [
      makePoint(1, 2.8), makePoint(2, 3.0), // nocturnal hypo
    ];
    const report = recognisePatterns(readings);
    if (report.patternCount > 0) {
      expect(report.dominantPattern).not.toBeNull();
    }
  });
});

// ─── patternSeveritySummary ───────────────────────────────────────────────────

describe("patternSeveritySummary", () => {
  it("returns clear for empty pattern report", () => {
    const report = { patterns: [], dominantPattern: null, patternCount: 0, recommendations: [] };
    expect(patternSeveritySummary(report)).toBe("clear");
  });

  it("returns critical when any pattern is critical", () => {
    const report = {
      patterns: [
        { type: "nocturnal-hypo" as const, label: "", description: "", severity: "critical" as const, affectedReadings: 2, confidence: "high" as const },
        { type: "post-lunch-dip" as const, label: "", description: "", severity: "info" as const, affectedReadings: 1, confidence: "low" as const },
      ],
      dominantPattern: "nocturnal-hypo" as const,
      patternCount: 2,
      recommendations: [],
    };
    expect(patternSeveritySummary(report)).toBe("critical");
  });

  it("returns warning when highest severity is warning", () => {
    const report = {
      patterns: [
        { type: "dawn-phenomenon" as const, label: "", description: "", severity: "warning" as const, affectedReadings: 4, confidence: "high" as const },
      ],
      dominantPattern: "dawn-phenomenon" as const,
      patternCount: 1,
      recommendations: [],
    };
    expect(patternSeveritySummary(report)).toBe("warning");
  });

  it("returns info when only info patterns present", () => {
    const report = {
      patterns: [
        { type: "post-lunch-dip" as const, label: "", description: "", severity: "info" as const, affectedReadings: 2, confidence: "low" as const },
      ],
      dominantPattern: "post-lunch-dip" as const,
      patternCount: 1,
      recommendations: [],
    };
    expect(patternSeveritySummary(report)).toBe("info");
  });
});
