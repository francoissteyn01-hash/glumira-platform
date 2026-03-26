import { describe, expect, it } from "vitest";
import {
  walshBilinearFraction,
  toBiologicalUnits,
  toDrawnUnits,
  calculateSingleDoseIOB,
  calculateTotalIOB,
  generateDecayCurve,
  predictIOB,
  timeToIOBThreshold,
  classifyGlucose,
  mmolToMgdl,
  mgdlToMmol,
  validateInsulinDose,
  getInsulinProfile,
  getInsulinTypes,
  getConcentrations,
  IOB_ENGINE_VERSION,
  type InsulinDose,
} from "./iob";

// ─── Helper ───────────────────────────────────────────────────

function makeDose(
  amount: number,
  minutesAgo: number,
  insulinType: InsulinDose["insulinType"] = "rapid",
  concentration: InsulinDose["concentration"] = "U-100",
  category: InsulinDose["category"] = "bolus"
): InsulinDose {
  return {
    amount,
    timestamp: new Date(Date.now() - minutesAgo * 60000),
    insulinType,
    concentration,
    category,
  };
}

// ═══════════════════════════════════════════════════════════════
// 1. Walsh Bilinear Fraction
// ═══════════════════════════════════════════════════════════════

describe("walshBilinearFraction", () => {
  it("returns 1.0 at time 0", () => {
    expect(walshBilinearFraction(0, 360)).toBe(1.0);
  });

  it("returns 0.0 at time >= DIA", () => {
    expect(walshBilinearFraction(360, 360)).toBe(0.0);
    expect(walshBilinearFraction(400, 360)).toBe(0.0);
  });

  it("returns 0.5 at exactly half DIA", () => {
    expect(walshBilinearFraction(180, 360)).toBe(0.5);
  });

  it("returns 1.0 for negative elapsed time", () => {
    expect(walshBilinearFraction(-10, 360)).toBe(1.0);
  });

  it("returns 0.0 for zero DIA", () => {
    expect(walshBilinearFraction(60, 0)).toBe(0.0);
  });

  it("is monotonically decreasing", () => {
    let prev = 1.0;
    for (let t = 0; t <= 360; t += 10) {
      const frac = walshBilinearFraction(t, 360);
      expect(frac).toBeLessThanOrEqual(prev + 0.001);
      prev = frac;
    }
  });

  it("is symmetric around the midpoint", () => {
    const d = 360;
    const q = walshBilinearFraction(d / 4, d);
    const tq = walshBilinearFraction((3 * d) / 4, d);
    expect(q).toBeCloseTo(0.875, 3);
    expect(tq).toBeCloseTo(0.125, 3);
    expect(q + tq).toBeCloseTo(1.0, 3);
  });

  it("works with different DIA values", () => {
    expect(walshBilinearFraction(0, 240)).toBe(1.0);
    expect(walshBilinearFraction(120, 240)).toBe(0.5);
    expect(walshBilinearFraction(240, 240)).toBe(0.0);
  });
});

// ═══════════════════════════════════════════════════════════════
// 2. Concentration Conversion
// ═══════════════════════════════════════════════════════════════

describe("concentration conversion", () => {
  it("U-100: 1 drawn = 1 biological", () => {
    expect(toBiologicalUnits(10, "U-100")).toBe(10);
  });

  it("U-200: 1 drawn = 2 biological", () => {
    expect(toBiologicalUnits(10, "U-200")).toBe(20);
  });

  it("U-500: 1 drawn = 5 biological", () => {
    expect(toBiologicalUnits(10, "U-500")).toBe(50);
  });

  it("round-trips correctly", () => {
    expect(toDrawnUnits(toBiologicalUnits(8, "U-200"), "U-200")).toBe(8);
    expect(toDrawnUnits(toBiologicalUnits(5, "U-500"), "U-500")).toBe(5);
  });
});

// ═══════════════════════════════════════════════════════════════
// 3. Single Dose IOB
// ═══════════════════════════════════════════════════════════════

describe("calculateSingleDoseIOB", () => {
  it("returns full biological dose at time 0", () => {
    const dose = makeDose(10, 0);
    expect(calculateSingleDoseIOB(dose, 0)).toBe(10);
  });

  it("returns 0 after DIA has elapsed", () => {
    const dose = makeDose(10, 0);
    expect(calculateSingleDoseIOB(dose, 360)).toBe(0);
  });

  it("returns ~50% at half DIA for rapid", () => {
    const dose = makeDose(10, 0);
    expect(calculateSingleDoseIOB(dose, 180)).toBeCloseTo(5, 0);
  });

  it("handles U-200 concentration", () => {
    const dose = makeDose(10, 0, "rapid", "U-200");
    expect(calculateSingleDoseIOB(dose, 0)).toBe(20);
  });

  it("handles U-500 concentration", () => {
    const dose = makeDose(10, 0, "rapid", "U-500");
    expect(calculateSingleDoseIOB(dose, 0)).toBe(50);
  });

  it("respects custom DIA override", () => {
    const dose = makeDose(10, 0);
    expect(calculateSingleDoseIOB(dose, 120, 4)).toBeCloseTo(5, 0);
  });

  it("clamps custom DIA to min 2h", () => {
    const dose = makeDose(10, 0);
    expect(calculateSingleDoseIOB(dose, 60, 1)).toBeCloseTo(5, 0);
  });

  it("returns less IOB as time increases", () => {
    const dose = makeDose(5, 0);
    const iob0 = calculateSingleDoseIOB(dose, 0);
    const iob60 = calculateSingleDoseIOB(dose, 60);
    const iob120 = calculateSingleDoseIOB(dose, 120);
    expect(iob0).toBeGreaterThan(iob60);
    expect(iob60).toBeGreaterThan(iob120);
  });

  it("never returns negative IOB", () => {
    const dose = makeDose(5, 0);
    expect(calculateSingleDoseIOB(dose, 1000)).toBeGreaterThanOrEqual(0);
  });
});

// ═══════════════════════════════════════════════════════════════
// 4. Total IOB Calculation
// ═══════════════════════════════════════════════════════════════

describe("calculateTotalIOB", () => {
  it("returns zero for empty doses", () => {
    const r = calculateTotalIOB([]);
    expect(r.totalIOB).toBe(0);
    expect(r.bolusIOB).toBe(0);
    expect(r.basalIOB).toBe(0);
    expect(r.correctionIOB).toBe(0);
  });

  it("separates bolus, basal, and correction IOB", () => {
    const now = new Date();
    const doses: InsulinDose[] = [
      { amount: 5, timestamp: now, insulinType: "rapid", concentration: "U-100", category: "bolus" },
      { amount: 3, timestamp: now, insulinType: "rapid", concentration: "U-100", category: "basal" },
      { amount: 2, timestamp: now, insulinType: "rapid", concentration: "U-100", category: "correction" },
    ];
    const r = calculateTotalIOB(doses, now);
    expect(r.bolusIOB).toBe(5);
    expect(r.basalIOB).toBe(3);
    expect(r.correctionIOB).toBe(2);
    expect(r.totalIOB).toBe(10);
  });

  it("includes stacking risk assessment", () => {
    const r = calculateTotalIOB([makeDose(10, 30)]);
    expect(r.stackingRisk).toBeDefined();
    expect(["safe", "moderate", "high"]).toContain(r.stackingRisk.level);
  });

  it("generates decay points", () => {
    const r = calculateTotalIOB([makeDose(10, 0)]);
    expect(r.decayPoints.length).toBeGreaterThan(0);
    expect(r.decayPoints[0].time).toBe(0);
  });

  it("caps total IOB at 100", () => {
    const now = new Date();
    const doses: InsulinDose[] = Array.from({ length: 30 }, () => ({
      amount: 10, timestamp: now, insulinType: "rapid" as const,
      concentration: "U-100" as const, category: "bolus" as const,
    }));
    expect(calculateTotalIOB(doses, now).totalIOB).toBeLessThanOrEqual(100);
  });

  it("skips future doses", () => {
    const dose: InsulinDose = {
      amount: 10, timestamp: new Date(Date.now() + 60 * 60000),
      insulinType: "rapid", concentration: "U-100", category: "bolus",
    };
    expect(calculateTotalIOB([dose]).totalIOB).toBe(0);
  });

  it("returns correct diaUsed", () => {
    expect(calculateTotalIOB([makeDose(10, 0)], new Date(), 5).diaUsed).toBe(5);
  });

  it("handles multiple doses at different times", () => {
    const now = new Date();
    const doses: InsulinDose[] = [
      { amount: 3, timestamp: new Date(now.getTime() - 30 * 60000), insulinType: "rapid", concentration: "U-100", category: "bolus" },
      { amount: 4, timestamp: new Date(now.getTime() - 90 * 60000), insulinType: "rapid", concentration: "U-100", category: "bolus" },
      { amount: 2, timestamp: new Date(now.getTime() - 150 * 60000), insulinType: "rapid", concentration: "U-100", category: "bolus" },
    ];
    const r = calculateTotalIOB(doses, now);
    expect(r.totalIOB).toBeGreaterThan(0);
    expect(r.decayPoints.length).toBeGreaterThan(0);
  });

  it("returns zero IOB for expired doses", () => {
    const now = new Date();
    const doses: InsulinDose[] = [
      { amount: 5, timestamp: new Date(now.getTime() - 500 * 60000), insulinType: "rapid", concentration: "U-100", category: "bolus" },
    ];
    expect(calculateTotalIOB(doses, now).totalIOB).toBeLessThan(0.01);
  });
});

// ═══════════════════════════════════════════════════════════════
// 5. Stacking Risk
// ═══════════════════════════════════════════════════════════════

describe("stacking risk", () => {
  it("reports safe for no doses", () => {
    expect(calculateTotalIOB([]).stackingRisk.level).toBe("safe");
  });

  it("reports high risk for multiple recent doses", () => {
    const r = calculateTotalIOB([makeDose(10, 10), makeDose(8, 20), makeDose(6, 30)]);
    expect(r.stackingRisk.level).toBe("high");
    expect(r.stackingRisk.recentPercent).toBeGreaterThan(80);
  });

  it("reports safe for well-spaced doses", () => {
    expect(calculateTotalIOB([makeDose(5, 300)]).stackingRisk.level).toBe("safe");
  });

  it("percentages sum to ~100%", () => {
    const now = new Date();
    const doses: InsulinDose[] = [
      { amount: 5, timestamp: new Date(now.getTime() - 30 * 60000), insulinType: "rapid", concentration: "U-100", category: "bolus" },
      { amount: 4, timestamp: new Date(now.getTime() - 150 * 60000), insulinType: "rapid", concentration: "U-100", category: "bolus" },
      { amount: 3, timestamp: new Date(now.getTime() - 300 * 60000), insulinType: "rapid", concentration: "U-100", category: "bolus" },
    ];
    const { recentPercent, moderatePercent, elderlyPercent } = calculateTotalIOB(doses, now).stackingRisk;
    expect(recentPercent + moderatePercent + elderlyPercent).toBeCloseTo(100, 0);
  });
});

// ═══════════════════════════════════════════════════════════════
// 6. Decay Curve Generation
// ═══════════════════════════════════════════════════════════════

describe("generateDecayCurve", () => {
  it("starts at 100% and ends at 0%", () => {
    const curve = generateDecayCurve(makeDose(10, 0));
    expect(curve[0].percentage).toBe(100);
    expect(curve[curve.length - 1].percentage).toBe(0);
  });

  it("generates points at specified interval", () => {
    const curve = generateDecayCurve(makeDose(10, 0), 10);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].time - curve[i - 1].time).toBe(10);
    }
  });

  it("first point IOB equals biological dose", () => {
    const curve = generateDecayCurve(makeDose(10, 0, "rapid", "U-200"));
    expect(curve[0].iob).toBe(20);
  });

  it("has decreasing IOB values", () => {
    const curve = generateDecayCurve(makeDose(5, 0), 15);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].iob).toBeLessThanOrEqual(curve[i - 1].iob);
    }
  });
});

// ═══════════════════════════════════════════════════════════════
// 7. Predictive Functions
// ═══════════════════════════════════════════════════════════════

describe("predictIOB", () => {
  it("predicts lower IOB in the future", () => {
    const doses = [makeDose(10, 30)];
    const now = new Date();
    expect(predictIOB(doses, 60, now)).toBeLessThan(predictIOB(doses, 0, now));
  });

  it("predicts zero IOB after DIA", () => {
    expect(predictIOB([makeDose(10, 0)], 360, new Date())).toBe(0);
  });

  it("predicts decreasing IOB over time", () => {
    const now = new Date();
    const doses: InsulinDose[] = [
      { amount: 5, timestamp: now, insulinType: "rapid", concentration: "U-100", category: "bolus" },
    ];
    const iob0 = predictIOB(doses, 0, now);
    const iob60 = predictIOB(doses, 60, now);
    const iob120 = predictIOB(doses, 120, now);
    expect(iob0).toBeGreaterThan(iob60);
    expect(iob60).toBeGreaterThan(iob120);
  });
});

describe("timeToIOBThreshold", () => {
  it("returns 0 when already below threshold", () => {
    expect(timeToIOBThreshold([], 0.1)).toBe(0);
  });

  it("returns positive number for active doses", () => {
    const r = timeToIOBThreshold([makeDose(10, 10)], 0.1);
    expect(r).not.toBeNull();
    expect(r!).toBeGreaterThan(0);
  });

  it("finds time when IOB reaches threshold", () => {
    const now = new Date();
    const doses: InsulinDose[] = [
      { amount: 5, timestamp: now, insulinType: "rapid", concentration: "U-100", category: "bolus" },
    ];
    const t = timeToIOBThreshold(doses, 1, now);
    expect(t).toBeGreaterThan(0);
    expect(t!).toBeLessThan(360);
  });
});

// ═══════════════════════════════════════════════════════════════
// 8. Glucose Classification
// ═══════════════════════════════════════════════════════════════

describe("classifyGlucose", () => {
  it("classifies hypo (<54)", () => { expect(classifyGlucose(50).status).toBe("hypo"); });
  it("classifies low (54-69)", () => { expect(classifyGlucose(65).status).toBe("low"); });
  it("classifies target (70-180)", () => { expect(classifyGlucose(120).status).toBe("target"); });
  it("classifies high (181-250)", () => { expect(classifyGlucose(200).status).toBe("high"); });
  it("classifies very-high (>250)", () => { expect(classifyGlucose(300).status).toBe("very-high"); });
  it("returns CSS class names", () => {
    expect(classifyGlucose(120).cssClass).toBe("glum-glucose-target");
    expect(classifyGlucose(50).cssClass).toBe("glum-glucose-hypo");
  });
});

// ═══════════════════════════════════════════════════════════════
// 9. Unit Conversion
// ═══════════════════════════════════════════════════════════════

describe("unit conversion", () => {
  it("converts mmol/L to mg/dL", () => { expect(mmolToMgdl(5.5)).toBeCloseTo(99.1, 0); });
  it("converts mg/dL to mmol/L", () => { expect(mgdlToMmol(100)).toBeCloseTo(5.55, 1); });
  it("round-trips approximately", () => { expect(mmolToMgdl(mgdlToMmol(120))).toBeCloseTo(120, 0); });
});

// ═══════════════════════════════════════════════════════════════
// 10. Validation
// ═══════════════════════════════════════════════════════════════

describe("validateInsulinDose", () => {
  it("accepts valid dose", () => {
    const r = validateInsulinDose(makeDose(10, 30));
    expect(r.valid).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it("rejects zero amount", () => {
    expect(validateInsulinDose(makeDose(0, 30)).valid).toBe(false);
  });

  it("rejects negative amount", () => {
    expect(validateInsulinDose(makeDose(-5, 30)).valid).toBe(false);
  });

  it("rejects amount > 300", () => {
    expect(validateInsulinDose(makeDose(301, 30)).valid).toBe(false);
  });

  it("rejects future timestamp", () => {
    const dose: InsulinDose = {
      amount: 10, timestamp: new Date(Date.now() + 60000),
      insulinType: "rapid", concentration: "U-100", category: "bolus",
    };
    expect(validateInsulinDose(dose).valid).toBe(false);
  });

  it("rejects unknown insulin type", () => {
    const dose: InsulinDose = {
      amount: 5, timestamp: new Date(Date.now() - 60000),
      insulinType: "unknown" as any, concentration: "U-100", category: "bolus",
    };
    expect(validateInsulinDose(dose).valid).toBe(false);
  });

  it("warns rapid used as basal", () => {
    expect(validateInsulinDose(makeDose(10, 30, "rapid", "U-100", "basal")).warnings.length).toBeGreaterThan(0);
  });

  it("warns long-acting used as bolus", () => {
    expect(validateInsulinDose(makeDose(10, 30, "long", "U-100", "bolus")).warnings.length).toBeGreaterThan(0);
  });

  it("warns high U-500 doses", () => {
    expect(validateInsulinDose(makeDose(55, 30, "rapid", "U-500", "bolus")).warnings.length).toBeGreaterThan(0);
  });

  it("rejects biological dose > max", () => {
    expect(validateInsulinDose(makeDose(100, 30, "rapid", "U-500", "bolus")).valid).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════
// 11. Utility Exports
// ═══════════════════════════════════════════════════════════════

describe("utility exports", () => {
  it("engine version is 7.0.0", () => { expect(IOB_ENGINE_VERSION).toBe("7.0.0"); });

  it("returns insulin profile data", () => {
    const p = getInsulinProfile("rapid");
    expect(p.diaHours).toBe(6);
    expect(p.peakMinutes).toBe(75);
  });

  it("lists all 5 insulin types", () => {
    const types = getInsulinTypes();
    expect(types).toContain("rapid");
    expect(types).toContain("ultra-long");
    expect(types.length).toBe(5);
  });

  it("lists all 3 concentrations", () => {
    const concs = getConcentrations();
    expect(concs).toContain("U-100");
    expect(concs).toContain("U-500");
    expect(concs.length).toBe(3);
  });
});
