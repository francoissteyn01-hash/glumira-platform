/**
 * GluMira — Glucose Prediction Test Suite
 *
 * Tests computeRateOfChange, rateToArrow, rateToLabel, predictGlucose,
 * assessUrgency, and generateGlucosePrediction.
 */

import { describe, it, expect } from "vitest";
import {
  computeRateOfChange,
  rateToArrow,
  rateToLabel,
  predictGlucose,
  assessUrgency,
  generateGlucosePrediction,
  type GlucoseReading,
} from "./glucose-prediction";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeReadings(values: number[], intervalMin: number = 5): GlucoseReading[] {
  const now = Date.now();
  return values.map((mmol, i) => ({
    mmol,
    timestamp: new Date(now - (values.length - 1 - i) * intervalMin * 60000).toISOString(),
  }));
}

// ─── computeRateOfChange ─────────────────────────────────────────────────────

describe("computeRateOfChange", () => {
  it("returns 0 for empty readings", () => {
    expect(computeRateOfChange([])).toBe(0);
  });

  it("returns 0 for single reading", () => {
    expect(computeRateOfChange(makeReadings([5.0]))).toBe(0);
  });

  it("returns positive rate for rising glucose", () => {
    const readings = makeReadings([5.0, 5.5, 6.0, 6.5, 7.0]);
    expect(computeRateOfChange(readings)).toBeGreaterThan(0);
  });

  it("returns negative rate for falling glucose", () => {
    const readings = makeReadings([8.0, 7.5, 7.0, 6.5, 6.0]);
    expect(computeRateOfChange(readings)).toBeLessThan(0);
  });

  it("returns ~0 for flat glucose", () => {
    const readings = makeReadings([6.0, 6.0, 6.0, 6.0, 6.0]);
    expect(Math.abs(computeRateOfChange(readings))).toBeLessThan(0.001);
  });

  it("handles unsorted readings", () => {
    const now = Date.now();
    const readings: GlucoseReading[] = [
      { mmol: 7.0, timestamp: new Date(now).toISOString() },
      { mmol: 5.0, timestamp: new Date(now - 20 * 60000).toISOString() },
      { mmol: 6.0, timestamp: new Date(now - 10 * 60000).toISOString() },
    ];
    expect(computeRateOfChange(readings)).toBeGreaterThan(0);
  });
});

// ─── rateToArrow ─────────────────────────────────────────────────────────────

describe("rateToArrow", () => {
  it("returns → for stable rate", () => {
    expect(rateToArrow(0)).toBe("→");
  });

  it("returns ↑↑ for very rapid rise", () => {
    expect(rateToArrow(0.06)).toBe("↑↑"); // 3.6 mmol/hr
  });

  it("returns ↑ for rapid rise", () => {
    expect(rateToArrow(0.04)).toBe("↑"); // 2.4 mmol/hr
  });

  it("returns ↗ for moderate rise", () => {
    expect(rateToArrow(0.02)).toBe("↗"); // 1.2 mmol/hr
  });

  it("returns ↘ for moderate fall", () => {
    expect(rateToArrow(-0.02)).toBe("↘"); // -1.2 mmol/hr
  });

  it("returns ↓ for rapid fall", () => {
    expect(rateToArrow(-0.04)).toBe("↓"); // -2.4 mmol/hr
  });

  it("returns ↓↓ for very rapid fall", () => {
    expect(rateToArrow(-0.06)).toBe("↓↓"); // -3.6 mmol/hr
  });
});

// ─── rateToLabel ─────────────────────────────────────────────────────────────

describe("rateToLabel", () => {
  it("returns Stable for near-zero rate", () => {
    expect(rateToLabel(0)).toBe("Stable");
  });

  it("returns Slowly rising for small positive rate", () => {
    expect(rateToLabel(0.01)).toBe("Slowly rising"); // 0.6 mmol/hr
  });

  it("returns Rising for moderate positive rate", () => {
    expect(rateToLabel(0.025)).toBe("Rising"); // 1.5 mmol/hr
  });

  it("returns Rapidly falling for large negative rate", () => {
    expect(rateToLabel(-0.04)).toContain("Rapidly");
  });

  it("returns Very rapidly for extreme rate", () => {
    expect(rateToLabel(0.06)).toContain("Very rapidly");
  });
});

// ─── predictGlucose ──────────────────────────────────────────────────────────

describe("predictGlucose", () => {
  it("returns zero-confidence predictions for < 2 readings", () => {
    const preds = predictGlucose(makeReadings([5.0]));
    expect(preds).toHaveLength(4);
    expect(preds[0].confidence).toBe(0);
  });

  it("returns 4 prediction points by default", () => {
    const preds = predictGlucose(makeReadings([5.0, 5.5, 6.0, 6.5, 7.0]));
    expect(preds).toHaveLength(4);
    expect(preds[0].minutesAhead).toBe(15);
    expect(preds[3].minutesAhead).toBe(60);
  });

  it("predicts higher values for rising glucose", () => {
    const readings = makeReadings([5.0, 5.5, 6.0, 6.5, 7.0]);
    const preds = predictGlucose(readings);
    expect(preds[0].mmol).toBeGreaterThan(7.0);
  });

  it("predicts lower values for falling glucose", () => {
    const readings = makeReadings([10.0, 9.5, 9.0, 8.5, 8.0]);
    const preds = predictGlucose(readings);
    expect(preds[0].mmol).toBeLessThan(8.0);
  });

  it("clamps predictions to physiological range", () => {
    const readings = makeReadings([2.0, 1.5, 1.2, 1.0, 0.8]);
    const preds = predictGlucose(readings);
    preds.forEach((p) => {
      expect(p.mmol).toBeGreaterThanOrEqual(1.0);
      expect(p.mmol).toBeLessThanOrEqual(30.0);
    });
  });

  it("confidence decreases with longer horizons", () => {
    const readings = makeReadings([5.0, 5.5, 6.0, 6.5, 7.0]);
    const preds = predictGlucose(readings);
    expect(preds[0].confidence).toBeGreaterThan(preds[3].confidence);
  });

  it("supports custom horizons", () => {
    const preds = predictGlucose(makeReadings([5.0, 6.0]), [10, 20]);
    expect(preds).toHaveLength(2);
    expect(preds[0].minutesAhead).toBe(10);
  });
});

// ─── assessUrgency ───────────────────────────────────────────────────────────

describe("assessUrgency", () => {
  it("returns urgent for current < 3.0", () => {
    const r = assessUrgency(2.5, 0);
    expect(r.urgency).toBe("urgent");
  });

  it("returns urgent for predicted hypo < 3.0", () => {
    const r = assessUrgency(3.5, -0.04); // 3.5 - 0.6 = 2.9
    expect(r.urgency).toBe("urgent");
  });

  it("returns high for predicted < 3.5", () => {
    const r = assessUrgency(4.0, -0.04); // 4.0 - 0.6 = 3.4
    expect(r.urgency).toBe("high");
  });

  it("returns high for current > 20", () => {
    const r = assessUrgency(21.0, 0);
    expect(r.urgency).toBe("high");
  });

  it("returns moderate for predicted < 4.0", () => {
    const r = assessUrgency(4.2, -0.02); // 4.2 - 0.3 = 3.9
    expect(r.urgency).toBe("moderate");
  });

  it("returns low for current slightly out of range", () => {
    const r = assessUrgency(3.8, 0.02); // 3.8 + 0.3 = 4.1 predicted, but current < 4.0
    expect(r.urgency).toBe("low");
  });

  it("returns none for in-range", () => {
    const r = assessUrgency(6.0, 0);
    expect(r.urgency).toBe("none");
  });
});

// ─── generateGlucosePrediction ───────────────────────────────────────────────

describe("generateGlucosePrediction", () => {
  it("returns no-data result for empty readings", () => {
    const r = generateGlucosePrediction([]);
    expect(r.currentMmol).toBe(0);
    expect(r.rateLabel).toBe("No data");
    expect(r.predictions).toHaveLength(0);
  });

  it("returns full prediction for valid readings", () => {
    const readings = makeReadings([5.0, 5.5, 6.0, 6.5, 7.0]);
    const r = generateGlucosePrediction(readings);
    expect(r.currentMmol).toBe(7.0);
    expect(r.predictions).toHaveLength(4);
    expect(r.arrow).toBeDefined();
    expect(r.urgency).toBeDefined();
  });

  it("detects rising trend", () => {
    const readings = makeReadings([5.0, 5.5, 6.0, 6.5, 7.0]);
    const r = generateGlucosePrediction(readings);
    expect(r.rateOfChange).toBeGreaterThan(0);
    expect(r.rateLabel).toContain("rising");
  });

  it("detects falling trend", () => {
    const readings = makeReadings([10.0, 9.5, 9.0, 8.5, 8.0]);
    const r = generateGlucosePrediction(readings);
    expect(r.rateOfChange).toBeLessThan(0);
    expect(r.rateLabel).toContain("falling");
  });

  it("detects urgent hypo risk", () => {
    const readings = makeReadings([4.0, 3.5, 3.2, 2.8, 2.5]);
    const r = generateGlucosePrediction(readings);
    expect(r.urgency).toBe("urgent");
  });
});
