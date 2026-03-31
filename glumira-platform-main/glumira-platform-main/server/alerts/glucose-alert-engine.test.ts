/**
 * GluMira™ — glucose-alert-engine.test.ts
 *
 * Unit tests for the glucose alert engine module.
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { describe, it, expect } from "vitest";
import {
  evaluateReading,
  evaluateRateOfChange,
  detectMissedReading,
  detectPersistentExcursion,
  evaluateReadingStream,
  DEFAULT_THRESHOLDS,
  type GlucoseReading,
} from "./glucose-alert-engine";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReading(glucoseMmol: number, hour = 14, minuteOffset = 0): GlucoseReading {
  const d = new Date("2026-03-20T00:00:00.000Z");
  d.setUTCHours(hour, minuteOffset, 0, 0);
  return { recordedAt: d, glucoseMmol };
}

// ─── evaluateReading ──────────────────────────────────────────────────────────

describe("evaluateReading", () => {
  it("returns no alerts for in-range glucose", () => {
    const alerts = evaluateReading(makeReading(6.5));
    expect(alerts).toHaveLength(0);
  });

  it("generates warning hypo alert for glucose < 3.9", () => {
    const alerts = evaluateReading(makeReading(3.5));
    expect(alerts).toHaveLength(1);
    expect(alerts[0].type).toBe("hypo");
    expect(alerts[0].severity).toBe("warning");
  });

  it("generates critical hypo alert for glucose <= 3.0", () => {
    const alerts = evaluateReading(makeReading(2.8));
    expect(alerts[0].severity).toBe("critical");
    expect(alerts[0].actionRequired).toBe(true);
  });

  it("generates warning hyper alert for glucose > 10.0", () => {
    const alerts = evaluateReading(makeReading(11.0));
    expect(alerts[0].type).toBe("hyper");
    expect(alerts[0].severity).toBe("warning");
  });

  it("generates critical hyper alert for glucose >= 16.7", () => {
    const alerts = evaluateReading(makeReading(17.0));
    expect(alerts[0].severity).toBe("critical");
    expect(alerts[0].actionRequired).toBe(true);
  });

  it("generates nocturnal-hypo for hypo at 02:00 UTC", () => {
    const alerts = evaluateReading(makeReading(3.5, 2)); // 02:00 UTC
    expect(alerts[0].type).toBe("nocturnal-hypo");
    expect(alerts[0].severity).toBe("critical");
  });

  it("generates nocturnal-hyper for hyper at 03:00 UTC (23:00 local)", () => {
    const alerts = evaluateReading(makeReading(12.0, 3)); // 03:00 UTC = 23:00 America/New_York
    expect(alerts[0].type).toBe("nocturnal-hyper");
  });

  it("includes recordedAt in ISO format", () => {
    const alerts = evaluateReading(makeReading(3.5));
    expect(alerts[0].recordedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// ─── evaluateRateOfChange ─────────────────────────────────────────────────────

describe("evaluateRateOfChange", () => {
  it("returns null for stable glucose", () => {
    const prev = makeReading(6.5, 14, 0);
    const curr = makeReading(6.6, 14, 5);
    expect(evaluateRateOfChange(prev, curr)).toBeNull();
  });

  it("detects rapid rise", () => {
    // Rise of 1.0 mmol/L in 5 min = 0.2/min > threshold 0.1/min
    const prev = makeReading(6.0, 14, 0);
    const curr = makeReading(7.0, 14, 5);
    const alert = evaluateRateOfChange(prev, curr);
    expect(alert).not.toBeNull();
    expect(alert!.type).toBe("rapid-rise");
  });

  it("detects rapid fall", () => {
    // Fall of 1.0 mmol/L in 5 min = 0.2/min > threshold 0.1/min
    const prev = makeReading(8.0, 14, 0);
    const curr = makeReading(7.0, 14, 5);
    const alert = evaluateRateOfChange(prev, curr);
    expect(alert).not.toBeNull();
    expect(alert!.type).toBe("rapid-fall");
  });

  it("returns null when gap > 30 min (stale pair)", () => {
    const prev = makeReading(6.0, 14, 0);
    const curr = makeReading(8.0, 14, 35);
    expect(evaluateRateOfChange(prev, curr)).toBeNull();
  });

  it("returns null when gap <= 0", () => {
    const prev = makeReading(6.0, 14, 5);
    const curr = makeReading(8.0, 14, 0);
    expect(evaluateRateOfChange(prev, curr)).toBeNull();
  });

  it("critical rapid rise when rate >= 1.5x threshold", () => {
    // Rise of 2.0 mmol/L in 5 min = 0.4/min > 1.5 * 0.1 = 0.15
    const prev = makeReading(6.0, 14, 0);
    const curr = makeReading(8.0, 14, 5);
    const alert = evaluateRateOfChange(prev, curr);
    expect(alert!.severity).toBe("critical");
  });
});

// ─── detectMissedReading ──────────────────────────────────────────────────────

describe("detectMissedReading", () => {
  it("returns null when reading is recent (< 20 min)", () => {
    const reading = makeReading(6.5, 14, 0);
    const now = toMs(reading.recordedAt) + 10 * 60 * 1000; // 10 min later
    expect(detectMissedReading(reading, now)).toBeNull();
  });

  it("returns warning alert when gap is 20–60 min", () => {
    const reading = makeReading(6.5, 14, 0);
    const now = toMs(reading.recordedAt) + 30 * 60 * 1000; // 30 min later
    const alert = detectMissedReading(reading, now);
    expect(alert).not.toBeNull();
    expect(alert!.type).toBe("missed-reading");
    expect(alert!.severity).toBe("warning");
  });

  it("returns critical alert when gap > 60 min", () => {
    const reading = makeReading(6.5, 14, 0);
    const now = toMs(reading.recordedAt) + 90 * 60 * 1000; // 90 min later
    const alert = detectMissedReading(reading, now);
    expect(alert!.severity).toBe("critical");
    expect(alert!.actionRequired).toBe(true);
  });
});

function toMs(val: Date | string): number {
  return val instanceof Date ? val.getTime() : new Date(val).getTime();
}

// ─── detectPersistentExcursion ────────────────────────────────────────────────

describe("detectPersistentExcursion", () => {
  it("returns null for in-range readings", () => {
    const readings = [makeReading(6.0), makeReading(6.5), makeReading(7.0)];
    expect(detectPersistentExcursion(readings)).toBeNull();
  });

  it("detects persistent hypo", () => {
    const readings = [makeReading(3.5), makeReading(3.4), makeReading(3.6)];
    const alert = detectPersistentExcursion(readings);
    expect(alert!.type).toBe("persistent-hypo");
    expect(alert!.severity).toBe("critical");
  });

  it("detects persistent hyper", () => {
    const readings = [makeReading(11.0), makeReading(12.0), makeReading(11.5)];
    const alert = detectPersistentExcursion(readings);
    expect(alert!.type).toBe("persistent-hyper");
    expect(alert!.severity).toBe("warning");
  });

  it("returns null when fewer readings than consecutiveCount", () => {
    const readings = [makeReading(3.5), makeReading(3.4)];
    expect(detectPersistentExcursion(readings, 3)).toBeNull();
  });

  it("only checks last N readings", () => {
    // First 3 are hypo, last 3 are in-range → no persistent alert
    const readings = [
      makeReading(3.5), makeReading(3.4), makeReading(3.6),
      makeReading(6.0), makeReading(6.5), makeReading(7.0),
    ];
    expect(detectPersistentExcursion(readings, 3)).toBeNull();
  });
});

// ─── evaluateReadingStream ────────────────────────────────────────────────────

describe("evaluateReadingStream", () => {
  it("returns empty array for empty stream", () => {
    expect(evaluateReadingStream([])).toHaveLength(0);
  });

  it("returns alerts for a stream with hypo", () => {
    const readings = [makeReading(6.5, 14, 0), makeReading(3.5, 14, 5)];
    const alerts = evaluateReadingStream(readings);
    expect(alerts.some((a) => a.type === "hypo" || a.type === "rapid-fall")).toBe(true);
  });

  it("includes rate-of-change alerts", () => {
    const readings = [makeReading(6.0, 14, 0), makeReading(8.5, 14, 5)];
    const alerts = evaluateReadingStream(readings);
    expect(alerts.some((a) => a.type === "rapid-rise")).toBe(true);
  });

  it("includes persistent excursion when applicable", () => {
    const readings = [
      makeReading(11.0, 14, 0),
      makeReading(11.5, 14, 5),
      makeReading(12.0, 14, 10),
    ];
    const alerts = evaluateReadingStream(readings);
    expect(alerts.some((a) => a.type === "persistent-hyper")).toBe(true);
  });
});
