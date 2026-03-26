import { describe, it, expect } from "vitest";
import { evaluateCarbEstimates, REFERENCE_FOODS, type CarbEstimate, type FoodItem } from "./carb-counting-trainer";

/* ── helpers ─────────────────────────────────────────────────── */
const rice = REFERENCE_FOODS.find((f) => f.name.includes("rice"))!;
const banana = REFERENCE_FOODS.find((f) => f.name.includes("banana"))!;
const bread = REFERENCE_FOODS.find((f) => f.name.includes("bread"))!;
const pizza = REFERENCE_FOODS.find((f) => f.name.includes("Pizza"))!;
const chicken = REFERENCE_FOODS.find((f) => f.name.includes("Chicken"))!;

function mkEstimate(food: FoodItem, estimate: number): CarbEstimate {
  return { foodItem: food, userEstimateG: estimate, timestamp: new Date().toISOString() };
}

/* ── Empty input ─────────────────────────────────────────────── */
describe("evaluateCarbEstimates — empty", () => {
  it("handles no estimates", () => {
    const r = evaluateCarbEstimates([]);
    expect(r.sessionScore).toBe(0);
    expect(r.estimates.length).toBe(0);
  });
});

/* ── Accuracy classification ─────────────────────────────────── */
describe("evaluateCarbEstimates — accuracy", () => {
  it("excellent for within 10%", () => {
    const r = evaluateCarbEstimates([mkEstimate(rice, 44)]);
    expect(r.estimates[0].accuracy).toBe("excellent");
  });

  it("good for within 20%", () => {
    const r = evaluateCarbEstimates([mkEstimate(rice, 37)]); // ~18% under
    expect(r.estimates[0].accuracy).toBe("good");
  });

  it("fair for within 40%", () => {
    const r = evaluateCarbEstimates([mkEstimate(rice, 30)]); // ~33% under
    expect(r.estimates[0].accuracy).toBe("fair");
  });

  it("poor for over 40%", () => {
    const r = evaluateCarbEstimates([mkEstimate(rice, 20)]); // ~56% under
    expect(r.estimates[0].accuracy).toBe("poor");
  });
});

/* ── Scoring ─────────────────────────────────────────────────── */
describe("evaluateCarbEstimates — scoring", () => {
  it("perfect score for exact estimates", () => {
    const r = evaluateCarbEstimates([
      mkEstimate(rice, 45),
      mkEstimate(banana, 27),
      mkEstimate(bread, 15),
    ]);
    expect(r.sessionScore).toBe(100);
  });

  it("high score for close estimates", () => {
    const r = evaluateCarbEstimates([
      mkEstimate(rice, 43),
      mkEstimate(banana, 25),
      mkEstimate(bread, 14),
    ]);
    expect(r.sessionScore).toBeGreaterThanOrEqual(80);
  });

  it("low score for poor estimates", () => {
    const r = evaluateCarbEstimates([
      mkEstimate(rice, 20),
      mkEstimate(banana, 10),
      mkEstimate(bread, 5),
    ]);
    expect(r.sessionScore).toBeLessThanOrEqual(50);
  });
});

/* ── Difference calculation ──────────────────────────────────── */
describe("evaluateCarbEstimates — differences", () => {
  it("positive difference for overestimate", () => {
    const r = evaluateCarbEstimates([mkEstimate(bread, 25)]);
    expect(r.estimates[0].differenceG).toBeGreaterThan(0);
  });

  it("negative difference for underestimate", () => {
    const r = evaluateCarbEstimates([mkEstimate(bread, 10)]);
    expect(r.estimates[0].differenceG).toBeLessThan(0);
  });

  it("zero difference for exact", () => {
    const r = evaluateCarbEstimates([mkEstimate(bread, 15)]);
    expect(r.estimates[0].differenceG).toBe(0);
  });
});

/* ── Counts ──────────────────────────────────────────────────── */
describe("evaluateCarbEstimates — counts", () => {
  it("counts overestimates", () => {
    const r = evaluateCarbEstimates([
      mkEstimate(rice, 60),
      mkEstimate(banana, 40),
      mkEstimate(bread, 15),
    ]);
    expect(r.overestimateCount).toBe(2);
  });

  it("counts underestimates", () => {
    const r = evaluateCarbEstimates([
      mkEstimate(rice, 20),
      mkEstimate(banana, 10),
      mkEstimate(bread, 15),
    ]);
    expect(r.underestimateCount).toBe(2);
  });

  it("counts accurate estimates", () => {
    const r = evaluateCarbEstimates([
      mkEstimate(rice, 45),
      mkEstimate(banana, 27),
    ]);
    expect(r.accurateCount).toBe(2);
  });
});

/* ── Totals ──────────────────────────────────────────────────── */
describe("evaluateCarbEstimates — totals", () => {
  it("sums estimated carbs", () => {
    const r = evaluateCarbEstimates([
      mkEstimate(rice, 50),
      mkEstimate(banana, 30),
    ]);
    expect(r.totalEstimated).toBe(80);
  });

  it("sums actual carbs", () => {
    const r = evaluateCarbEstimates([
      mkEstimate(rice, 50),
      mkEstimate(banana, 30),
    ]);
    expect(r.totalActual).toBe(72); // 45 + 27
  });
});

/* ── Category analysis ───────────────────────────────────────── */
describe("evaluateCarbEstimates — categories", () => {
  it("identifies worst category", () => {
    const r = evaluateCarbEstimates([
      mkEstimate(rice, 20),    // grain: poor
      mkEstimate(banana, 26),  // fruit: excellent
    ]);
    expect(r.worstCategory).toBe("grain");
  });

  it("identifies best category", () => {
    const r = evaluateCarbEstimates([
      mkEstimate(rice, 20),    // grain: poor
      mkEstimate(banana, 27),  // fruit: exact
    ]);
    expect(r.bestCategory).toBe("fruit");
  });
});

/* ── Feedback ────────────────────────────────────────────────── */
describe("evaluateCarbEstimates — feedback", () => {
  it("positive feedback for excellent", () => {
    const r = evaluateCarbEstimates([mkEstimate(rice, 44)]);
    expect(r.estimates[0].feedback).toContain("Great job");
  });

  it("warning for poor estimate", () => {
    const r = evaluateCarbEstimates([mkEstimate(rice, 15)]);
    expect(r.estimates[0].feedback).toContain("insulin dose");
  });
});

/* ── Tips ────────────────────────────────────────────────────── */
describe("evaluateCarbEstimates — tips", () => {
  it("tip for underestimating tendency", () => {
    const r = evaluateCarbEstimates([
      mkEstimate(rice, 20),
      mkEstimate(banana, 10),
      mkEstimate(bread, 5),
    ]);
    expect(r.tips.some((t) => t.includes("underestimate"))).toBe(true);
  });

  it("tip for overestimating tendency", () => {
    const r = evaluateCarbEstimates([
      mkEstimate(rice, 70),
      mkEstimate(banana, 50),
      mkEstimate(bread, 30),
    ]);
    expect(r.tips.some((t) => t.includes("overestimate"))).toBe(true);
  });

  it("always includes food scale tip", () => {
    const r = evaluateCarbEstimates([mkEstimate(rice, 45)]);
    expect(r.tips.some((t) => t.includes("food scale"))).toBe(true);
  });
});

/* ── Encouragement ───────────────────────────────────────────── */
describe("evaluateCarbEstimates — encouragement", () => {
  it("outstanding for high score", () => {
    const r = evaluateCarbEstimates([mkEstimate(rice, 45), mkEstimate(banana, 27)]);
    expect(r.encouragement).toContain("Outstanding");
  });

  it("keep practicing for low score", () => {
    const r = evaluateCarbEstimates([mkEstimate(rice, 10)]);
    expect(r.encouragement).toContain("practicing");
  });
});

/* ── Reference foods ─────────────────────────────────────────── */
describe("REFERENCE_FOODS", () => {
  it("has at least 15 foods", () => {
    expect(REFERENCE_FOODS.length).toBeGreaterThanOrEqual(15);
  });

  it("all foods have positive carbs or zero for protein", () => {
    REFERENCE_FOODS.forEach((f) => {
      expect(f.actualCarbsG).toBeGreaterThanOrEqual(0);
    });
  });

  it("covers multiple categories", () => {
    const cats = new Set(REFERENCE_FOODS.map((f) => f.category));
    expect(cats.size).toBeGreaterThanOrEqual(5);
  });
});
