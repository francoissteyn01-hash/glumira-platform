import { describe, it, expect } from "vitest";
import {
  analyzeAltitudeImpact,
  getAltitudeZone,
  getAltitudeZones,
  type AltitudeReading,
} from "./altitude-impact";

/* ── helpers ─────────────────────────────────────────────────── */
const mkReading = (
  altitudeMeters: number,
  glucoseMmol: number,
  hoursAgo: number,
  opts: Partial<AltitudeReading> = {}
): AltitudeReading => {
  const d = new Date("2026-03-26T12:00:00Z");
  d.setHours(d.getHours() - hoursAgo);
  return {
    timestampUtc: d.toISOString(),
    altitudeMeters,
    glucoseMmol,
    ...opts,
  };
};

/* ── Zone classification ─────────────────────────────────────── */
describe("getAltitudeZone", () => {
  it("classifies sea level as Low Altitude", () => {
    expect(getAltitudeZone(0).name).toBe("Low Altitude");
  });

  it("classifies 2000m as Moderate Altitude", () => {
    expect(getAltitudeZone(2000).name).toBe("Moderate Altitude");
  });

  it("classifies 3000m as High Altitude", () => {
    expect(getAltitudeZone(3000).name).toBe("High Altitude");
  });

  it("classifies 4000m as Very High Altitude", () => {
    expect(getAltitudeZone(4000).name).toBe("Very High Altitude");
  });

  it("classifies 6000m as Extreme Altitude", () => {
    expect(getAltitudeZone(6000).name).toBe("Extreme Altitude");
  });

  it("returns all 5 zones", () => {
    expect(getAltitudeZones()).toHaveLength(5);
  });
});

/* ── Empty readings ──────────────────────────────────────────── */
describe("analyzeAltitudeImpact — empty", () => {
  it("returns stable with no readings", () => {
    const r = analyzeAltitudeImpact([], 0);
    expect(r.direction).toBe("stable");
    expect(r.currentAltitude).toBe(0);
    expect(r.recommendations.length).toBeGreaterThan(0);
  });

  it("uses baseline altitude when no readings", () => {
    const r = analyzeAltitudeImpact([], 3000);
    expect(r.currentZone.name).toBe("High Altitude");
  });
});

/* ── Low altitude ────────────────────────────────────────────── */
describe("analyzeAltitudeImpact — low altitude", () => {
  it("no insulin adjustment at sea level", () => {
    const readings = [
      mkReading(100, 6.5, 3),
      mkReading(100, 7.0, 2),
      mkReading(100, 6.8, 1),
    ];
    const r = analyzeAltitudeImpact(readings, 100);
    expect(r.insulinAdjustment.basalChangePercent).toBe(0);
    expect(r.direction).toBe("stable");
  });
});

/* ── Ascending to high altitude ──────────────────────────────── */
describe("analyzeAltitudeImpact — ascending", () => {
  it("detects ascending direction", () => {
    const readings = [
      mkReading(1000, 6.5, 6),
      mkReading(2000, 6.0, 4),
      mkReading(3000, 5.5, 2),
    ];
    const r = analyzeAltitudeImpact(readings, 1000);
    expect(r.direction).toBe("ascending");
    expect(r.altitudeChange).toBe(2000);
  });

  it("recommends basal reduction at high altitude", () => {
    const readings = [
      mkReading(3000, 6.0, 3),
      mkReading(3000, 5.5, 2),
      mkReading(3000, 5.8, 1),
    ];
    const r = analyzeAltitudeImpact(readings, 0);
    expect(r.insulinAdjustment.basalChangePercent).toBeLessThan(0);
  });

  it("increases monitoring frequency at high altitude", () => {
    const readings = [mkReading(3000, 6.0, 1)];
    const r = analyzeAltitudeImpact(readings, 0);
    expect(r.monitoringFrequencyHours).toBeLessThanOrEqual(2);
  });

  it("requires acclimatization at high altitude", () => {
    const readings = [mkReading(3500, 7.0, 1)];
    const r = analyzeAltitudeImpact(readings, 0);
    expect(r.acclimatizationDays).toBeGreaterThanOrEqual(3);
  });
});

/* ── Very high altitude ──────────────────────────────────────── */
describe("analyzeAltitudeImpact — very high altitude", () => {
  it("warns about altitude sickness overlap", () => {
    const readings = [mkReading(4000, 8.0, 1)];
    const r = analyzeAltitudeImpact(readings, 0);
    expect(r.warnings.some((w) => w.toLowerCase().includes("altitude sickness") || w.toLowerCase().includes("altitude"))).toBe(true);
  });

  it("increases hydration requirement", () => {
    const readings = [mkReading(4000, 7.0, 1)];
    const r = analyzeAltitudeImpact(readings, 0);
    expect(r.hydrationAdvice.minimumLitersPerDay).toBeGreaterThanOrEqual(3.5);
  });

  it("recommends additional carbs", () => {
    const readings = [mkReading(4000, 6.5, 1)];
    const r = analyzeAltitudeImpact(readings, 0);
    expect(r.carbAdjustment.additionalCarbsPerHour).toBeGreaterThan(0);
  });

  it("reduces basal less aggressively due to stress response", () => {
    const readings = [mkReading(4000, 7.0, 1)];
    const r = analyzeAltitudeImpact(readings, 0);
    // At very high altitude, stress hormones counteract sensitivity
    expect(r.insulinAdjustment.basalChangePercent).toBeGreaterThan(-15);
  });
});

/* ── Extreme altitude ────────────────────────────────────────── */
describe("analyzeAltitudeImpact — extreme altitude", () => {
  it("warns about extreme altitude dangers", () => {
    const readings = [mkReading(6000, 9.0, 1)];
    const r = analyzeAltitudeImpact(readings, 0);
    expect(r.warnings.some((w) => w.includes("EXTREME ALTITUDE"))).toBe(true);
  });

  it("requires 7+ days acclimatization", () => {
    const readings = [mkReading(6000, 8.0, 1)];
    const r = analyzeAltitudeImpact(readings, 0);
    expect(r.acclimatizationDays).toBeGreaterThanOrEqual(7);
  });

  it("monitoring every hour", () => {
    const readings = [mkReading(6000, 8.0, 1)];
    const r = analyzeAltitudeImpact(readings, 0);
    expect(r.monitoringFrequencyHours).toBe(1);
  });
});

/* ── Descending ──────────────────────────────────────────────── */
describe("analyzeAltitudeImpact — descending", () => {
  it("detects descending direction", () => {
    const readings = [
      mkReading(3000, 6.0, 4),
      mkReading(2000, 6.5, 2),
      mkReading(500, 7.0, 1),
    ];
    const r = analyzeAltitudeImpact(readings, 3000);
    expect(r.direction).toBe("descending");
  });
});

/* ── Ascent rate warning ─────────────────────────────────────── */
describe("analyzeAltitudeImpact — ascent rate", () => {
  it("warns when ascent rate exceeds 500m/hour", () => {
    const readings = [
      mkReading(2000, 6.5, 2),
      mkReading(4000, 6.0, 1), // 2000m in 1 hour
    ];
    const r = analyzeAltitudeImpact(readings, 2000);
    expect(r.warnings.some((w) => w.includes("Ascent rate"))).toBe(true);
  });

  it("no ascent rate warning for gradual climb", () => {
    const readings = [
      mkReading(2000, 6.5, 10),
      mkReading(2500, 6.0, 1), // 500m in 9 hours
    ];
    const r = analyzeAltitudeImpact(readings, 2000);
    expect(r.warnings.some((w) => w.includes("Ascent rate"))).toBe(false);
  });
});

/* ── Cold exposure ───────────────────────────────────────────── */
describe("analyzeAltitudeImpact — cold exposure", () => {
  it("warns about cold affecting insulin absorption", () => {
    const readings = [
      mkReading(3500, 6.0, 2, { temperatureCelsius: -5 }),
      mkReading(3500, 5.5, 1, { temperatureCelsius: -3 }),
    ];
    const r = analyzeAltitudeImpact(readings, 0);
    expect(r.warnings.some((w) => w.includes("Cold exposure"))).toBe(true);
  });

  it("increases hydration for cold conditions", () => {
    const coldReadings = [
      mkReading(3000, 6.0, 2, { temperatureCelsius: 2 }),
      mkReading(3000, 6.5, 1, { temperatureCelsius: 0 }),
    ];
    const warmReadings = [
      mkReading(3000, 6.0, 2, { temperatureCelsius: 20 }),
      mkReading(3000, 6.5, 1, { temperatureCelsius: 18 }),
    ];
    const cold = analyzeAltitudeImpact(coldReadings, 0);
    const warm = analyzeAltitudeImpact(warmReadings, 0);
    expect(cold.hydrationAdvice.minimumLitersPerDay).toBeGreaterThan(
      warm.hydrationAdvice.minimumLitersPerDay
    );
  });
});

/* ── Activity level ──────────────────────────────────────────── */
describe("analyzeAltitudeImpact — activity", () => {
  it("further reduces basal for active at altitude", () => {
    const active = [
      mkReading(3000, 6.0, 3, { activityLevel: "intense" }),
      mkReading(3000, 5.5, 2, { activityLevel: "moderate" }),
      mkReading(3000, 5.8, 1, { activityLevel: "intense" }),
    ];
    const rest = [
      mkReading(3000, 6.0, 3, { activityLevel: "rest" }),
      mkReading(3000, 6.5, 2, { activityLevel: "rest" }),
      mkReading(3000, 6.2, 1, { activityLevel: "rest" }),
    ];
    const activeResult = analyzeAltitudeImpact(active, 0);
    const restResult = analyzeAltitudeImpact(rest, 0);
    expect(activeResult.insulinAdjustment.basalChangePercent).toBeLessThan(
      restResult.insulinAdjustment.basalChangePercent
    );
  });
});

/* ── Glucose warnings ────────────────────────────────────────── */
describe("analyzeAltitudeImpact — glucose warnings", () => {
  it("warns about hypo at altitude", () => {
    const readings = [
      mkReading(3000, 3.5, 2),
      mkReading(3000, 6.0, 1),
    ];
    const r = analyzeAltitudeImpact(readings, 0);
    expect(r.warnings.some((w) => w.includes("Hypoglycemia"))).toBe(true);
  });

  it("warns about hyper at very high altitude", () => {
    const readings = [
      mkReading(4000, 16.0, 2),
      mkReading(4000, 15.5, 1),
    ];
    const r = analyzeAltitudeImpact(readings, 0);
    expect(r.warnings.some((w) => w.includes("Hyperglycemia"))).toBe(true);
  });
});

/* ── Glucose trend ───────────────────────────────────────────── */
describe("analyzeAltitudeImpact — glucose trend", () => {
  it("detects rising glucose trend", () => {
    const readings = [
      mkReading(3000, 5.0, 4),
      mkReading(3000, 5.5, 3),
      mkReading(3000, 7.0, 2),
      mkReading(3000, 8.0, 1),
    ];
    const r = analyzeAltitudeImpact(readings, 0);
    expect(r.glucoseAtAltitude.trend).toBe("rising");
  });

  it("detects falling glucose trend", () => {
    const readings = [
      mkReading(3000, 8.0, 4),
      mkReading(3000, 7.5, 3),
      mkReading(3000, 6.0, 2),
      mkReading(3000, 5.0, 1),
    ];
    const r = analyzeAltitudeImpact(readings, 0);
    expect(r.glucoseAtAltitude.trend).toBe("falling");
  });
});
