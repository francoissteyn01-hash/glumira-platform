import { describe, it, expect } from "vitest";
import { generateBasalProfile, type BasalProfileInput, type FastingGlucosePoint } from "./basal-rate-profiler";

/* ── helpers ─────────────────────────────────────────────────── */
function mkFastingData(hourStart: number, hourEnd: number, baseGlucose: number, trend: number = 0): FastingGlucosePoint[] {
  const points: FastingGlucosePoint[] = [];
  for (let h = hourStart; h < hourEnd; h++) {
    const progress = (h - hourStart) / (hourEnd - hourStart);
    points.push({
      timestampUtc: new Date(Date.UTC(2026, 2, 15, h, 0)).toISOString(),
      glucoseMmol: Math.round((baseGlucose + trend * progress) * 10) / 10,
    });
    points.push({
      timestampUtc: new Date(Date.UTC(2026, 2, 15, h, 30)).toISOString(),
      glucoseMmol: Math.round((baseGlucose + trend * progress + 0.1) * 10) / 10,
    });
  }
  return points;
}

const baseInput: BasalProfileInput = {
  fastingData: [
    ...mkFastingData(0, 6, 6.0),
    ...mkFastingData(6, 12, 6.5),
    ...mkFastingData(12, 18, 6.0),
    ...mkFastingData(18, 24, 6.2),
  ],
  currentTDD: 35,
  currentBasalTotal: 16,
  targetMmol: { low: 4.0, high: 8.0 },
  segmentCount: 4,
};

/* ── Structure ───────────────────────────────────────────────── */
describe("generateBasalProfile — structure", () => {
  it("returns correct number of segments", () => {
    const r = generateBasalProfile(baseInput);
    expect(r.segments.length).toBe(4);
  });

  it("returns 6 segments when requested", () => {
    const r = generateBasalProfile({ ...baseInput, segmentCount: 6 });
    expect(r.segments.length).toBe(6);
  });

  it("returns 8 segments when requested", () => {
    const r = generateBasalProfile({ ...baseInput, segmentCount: 8 });
    expect(r.segments.length).toBe(8);
  });

  it("includes disclaimer", () => {
    const r = generateBasalProfile(baseInput);
    expect(r.disclaimer).toContain("NOT a medical device");
  });

  it("includes recommendations", () => {
    const r = generateBasalProfile(baseInput);
    expect(r.recommendations.length).toBeGreaterThan(0);
  });
});

/* ── Segment properties ──────────────────────────────────────── */
describe("generateBasalProfile — segments", () => {
  it("each segment has start and end time", () => {
    const r = generateBasalProfile(baseInput);
    r.segments.forEach((s) => {
      expect(s.startTime).toMatch(/^\d{2}:00$/);
      expect(s.endTime).toMatch(/^\d{2}:00$/);
    });
  });

  it("each segment has mean glucose", () => {
    const r = generateBasalProfile(baseInput);
    r.segments.forEach((s) => {
      expect(s.meanGlucose).toBeGreaterThan(0);
    });
  });

  it("each segment has suggested rate", () => {
    const r = generateBasalProfile(baseInput);
    r.segments.forEach((s) => {
      expect(s.suggestedRate).toBeGreaterThan(0);
    });
  });

  it("multiplier is between 0.5 and 2.0", () => {
    const r = generateBasalProfile(baseInput);
    r.segments.forEach((s) => {
      expect(s.suggestedRateMultiplier).toBeGreaterThanOrEqual(0.5);
      expect(s.suggestedRateMultiplier).toBeLessThanOrEqual(2.0);
    });
  });
});

/* ── Dawn phenomenon detection ───────────────────────────────── */
describe("generateBasalProfile — dawn phenomenon", () => {
  it("detects dawn phenomenon", () => {
    const input: BasalProfileInput = {
      ...baseInput,
      segmentCount: 6,
      fastingData: [
        ...mkFastingData(0, 4, 5.5),
        ...mkFastingData(4, 8, 5.5, 5.0),  // rising from 5.5 to 10.5
        ...mkFastingData(8, 12, 7.0),
        ...mkFastingData(12, 16, 6.0),
        ...mkFastingData(16, 20, 6.0),
        ...mkFastingData(20, 24, 5.5),
      ],
    };
    const r = generateBasalProfile(input);
    expect(r.dawnPhenomenon).toBe(true);
    expect(r.overallPattern).toContain("Dawn");
  });

  it("no dawn phenomenon for stable overnight", () => {
    const r = generateBasalProfile(baseInput);
    expect(r.dawnPhenomenon).toBe(false);
  });
});

/* ── Peak and lowest demand ──────────────────────────────────── */
describe("generateBasalProfile — demand times", () => {
  it("identifies peak demand time", () => {
    const r = generateBasalProfile(baseInput);
    expect(r.peakDemandTime).toMatch(/^\d{2}:00$/);
  });

  it("identifies lowest demand time", () => {
    const r = generateBasalProfile(baseInput);
    expect(r.lowestDemandTime).toMatch(/^\d{2}:00$/);
  });
});

/* ── Total basal ─────────────────────────────────────────────── */
describe("generateBasalProfile — totals", () => {
  it("total basal is reasonable", () => {
    const r = generateBasalProfile(baseInput);
    expect(r.totalBasalUnits).toBeGreaterThan(5);
    expect(r.totalBasalUnits).toBeLessThan(50);
  });

  it("average rate matches input", () => {
    const r = generateBasalProfile(baseInput);
    expect(r.averageRate).toBeCloseTo(16 / 24, 1);
  });
});

/* ── High/low segments ───────────────────────────────────────── */
describe("generateBasalProfile — needs more/less", () => {
  it("flags segments above target", () => {
    const input: BasalProfileInput = {
      ...baseInput,
      fastingData: [
        ...mkFastingData(0, 6, 6.0),
        ...mkFastingData(6, 12, 10.0),  // high
        ...mkFastingData(12, 18, 6.0),
        ...mkFastingData(18, 24, 6.0),
      ],
    };
    const r = generateBasalProfile(input);
    expect(r.segments.some((s) => s.needsMore)).toBe(true);
  });

  it("flags segments below target", () => {
    const input: BasalProfileInput = {
      ...baseInput,
      fastingData: [
        ...mkFastingData(0, 6, 6.0),
        ...mkFastingData(6, 12, 6.0),
        ...mkFastingData(12, 18, 3.5),  // low
        ...mkFastingData(18, 24, 6.0),
      ],
    };
    const r = generateBasalProfile(input);
    expect(r.segments.some((s) => s.needsLess)).toBe(true);
  });
});

/* ── Recommendations ─────────────────────────────────────────── */
describe("generateBasalProfile — recommendations", () => {
  it("always recommends basal testing", () => {
    const r = generateBasalProfile(baseInput);
    expect(r.recommendations.some((rec) => rec.includes("basal testing"))).toBe(true);
  });

  it("recommends increase for high segments", () => {
    const input: BasalProfileInput = {
      ...baseInput,
      fastingData: [
        ...mkFastingData(0, 6, 6.0),
        ...mkFastingData(6, 12, 10.0),
        ...mkFastingData(12, 18, 6.0),
        ...mkFastingData(18, 24, 6.0),
      ],
    };
    const r = generateBasalProfile(input);
    expect(r.recommendations.some((rec) => rec.includes("above target"))).toBe(true);
  });
});

/* ── Empty data handling ─────────────────────────────────────── */
describe("generateBasalProfile — empty data", () => {
  it("handles no fasting data", () => {
    const input: BasalProfileInput = { ...baseInput, fastingData: [] };
    const r = generateBasalProfile(input);
    expect(r.segments.length).toBe(4);
    r.segments.forEach((s) => {
      expect(s.meanGlucose).toBe(0);
    });
  });
});
