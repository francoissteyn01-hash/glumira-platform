import { describe, it, expect } from "vitest";
import { analyzeAlcoholImpact, type AlcoholInput, type DrinkEntry } from "./alcohol-impact";

/* ── helpers ─────────────────────────────────────────────────── */
const mkDrink = (type: DrinkEntry["type"], count: number = 1): DrinkEntry[] =>
  Array.from({ length: count }, () => ({
    type,
    volumeMl: type === "beer" ? 330 : type === "wine" ? 150 : type === "spirits" ? 30 : 200,
    alcoholPercent: type === "beer" ? 5 : type === "wine" ? 13 : type === "spirits" ? 40 : 10,
    timestampUtc: "2026-03-26T20:00:00Z",
  }));

const baseInput: AlcoholInput = {
  drinks: mkDrink("beer", 2),
  diabetesType: "type2",
  currentGlucoseMmol: 7.0,
  basalDoseUnits: 20,
  lastMealHoursAgo: 1,
  weightKg: 80,
  isFemale: false,
};

/* ── Basic analysis ──────────────────────────────────────────── */
describe("analyzeAlcoholImpact — basics", () => {
  it("calculates standard drinks", () => {
    const r = analyzeAlcoholImpact(baseInput);
    expect(r.totalStandardDrinks).toBeGreaterThan(0);
  });

  it("calculates total carbs from drinks", () => {
    const r = analyzeAlcoholImpact(baseInput);
    expect(r.totalCarbsFromDrinks).toBeGreaterThan(0);
  });

  it("estimates BAC", () => {
    const r = analyzeAlcoholImpact(baseInput);
    expect(r.estimatedBAC).toBeGreaterThanOrEqual(0);
  });

  it("returns warnings and recommendations", () => {
    const r = analyzeAlcoholImpact(baseInput);
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.recommendations.length).toBeGreaterThan(0);
  });
});

/* ── Risk levels ─────────────────────────────────────────────── */
describe("analyzeAlcoholImpact — risk", () => {
  it("low risk for 1 beer with meal", () => {
    const input: AlcoholInput = { ...baseInput, drinks: mkDrink("beer", 1) };
    const r = analyzeAlcoholImpact(input);
    expect(r.riskLevel).toBe("low");
  });

  it("higher risk for 4+ drinks", () => {
    const input: AlcoholInput = { ...baseInput, drinks: mkDrink("beer", 5) };
    const r = analyzeAlcoholImpact(input);
    expect(["moderate", "high", "very-high"]).toContain(r.riskLevel);
    // Should be higher than 1 drink
    const light: AlcoholInput = { ...baseInput, drinks: mkDrink("beer", 1) };
    const lightR = analyzeAlcoholImpact(light);
    const riskOrder = ["low", "moderate", "high", "very-high"];
    expect(riskOrder.indexOf(r.riskLevel)).toBeGreaterThanOrEqual(riskOrder.indexOf(lightR.riskLevel));
  });

  it("higher risk when glucose already low", () => {
    const input: AlcoholInput = { ...baseInput, currentGlucoseMmol: 4.5 };
    const r = analyzeAlcoholImpact(input);
    expect(["moderate", "high", "very-high"]).toContain(r.riskLevel);
  });

  it("higher risk on empty stomach", () => {
    const input: AlcoholInput = { ...baseInput, lastMealHoursAgo: 5 };
    const r = analyzeAlcoholImpact(input);
    expect(r.riskLevel).not.toBe("low");
  });
});

/* ── Hypo risk window ────────────────────────────────────────── */
describe("analyzeAlcoholImpact — hypo window", () => {
  it("delayed hypo window starts after 2 hours", () => {
    const r = analyzeAlcoholImpact(baseInput);
    expect(r.hypoRiskWindow.startHoursFromNow).toBe(2);
  });

  it("longer hypo window for heavy drinking", () => {
    const light: AlcoholInput = { ...baseInput, drinks: mkDrink("beer", 1) };
    const heavy: AlcoholInput = { ...baseInput, drinks: mkDrink("beer", 5) };
    const lightR = analyzeAlcoholImpact(light);
    const heavyR = analyzeAlcoholImpact(heavy);
    expect(heavyR.hypoRiskWindow.endHoursFromNow).toBeGreaterThan(lightR.hypoRiskWindow.endHoursFromNow);
  });
});

/* ── Glucose expectation ─────────────────────────────────────── */
describe("analyzeAlcoholImpact — glucose", () => {
  it("expects initial rise from high-carb drinks", () => {
    const input: AlcoholInput = { ...baseInput, drinks: mkDrink("beer", 3) };
    const r = analyzeAlcoholImpact(input);
    expect(r.glucoseExpectation.immediate).toBe("rise");
  });

  it("expects delayed fall from alcohol", () => {
    const input: AlcoholInput = { ...baseInput, drinks: mkDrink("beer", 2) };
    const r = analyzeAlcoholImpact(input);
    expect(r.glucoseExpectation.delayed).toBe("fall");
  });

  it("stable delayed for very light drinking", () => {
    const input: AlcoholInput = {
      ...baseInput,
      drinks: [{ type: "spirits", volumeMl: 15, alcoholPercent: 40, timestampUtc: "2026-03-26T20:00:00Z" }],
    };
    const r = analyzeAlcoholImpact(input);
    expect(r.glucoseExpectation.delayed).toBe("stable");
  });
});

/* ── Insulin guidance ────────────────────────────────────────── */
describe("analyzeAlcoholImpact — insulin", () => {
  it("reduces basal for moderate drinking", () => {
    const input: AlcoholInput = { ...baseInput, drinks: mkDrink("beer", 3) };
    const r = analyzeAlcoholImpact(input);
    expect(r.insulinGuidance.basalChangePercent).toBeLessThan(0);
  });

  it("no basal change for light drinking", () => {
    const input: AlcoholInput = { ...baseInput, drinks: mkDrink("beer", 1) };
    const r = analyzeAlcoholImpact(input);
    expect(r.insulinGuidance.basalChangePercent).toBe(0);
  });

  it("suggests skipping bolus for low-carb spirits", () => {
    const input: AlcoholInput = { ...baseInput, drinks: mkDrink("spirits", 3) };
    const r = analyzeAlcoholImpact(input);
    expect(r.insulinGuidance.skipBolus).toBe(true);
  });
});

/* ── Carb guidance ───────────────────────────────────────────── */
describe("analyzeAlcoholImpact — carbs", () => {
  it("recommends eating first on empty stomach", () => {
    const input: AlcoholInput = { ...baseInput, lastMealHoursAgo: 4 };
    const r = analyzeAlcoholImpact(input);
    expect(r.carbGuidance.eatBeforeDrinking).toBe(true);
  });

  it("recommends bedtime snack for moderate drinking", () => {
    const input: AlcoholInput = { ...baseInput, drinks: mkDrink("beer", 3) };
    const r = analyzeAlcoholImpact(input);
    expect(r.carbGuidance.snackBeforeBed).toBe(true);
    expect(r.carbGuidance.recommendedCarbsGrams).toBeGreaterThan(0);
  });

  it("no bedtime snack needed for 1 drink", () => {
    const input: AlcoholInput = { ...baseInput, drinks: mkDrink("beer", 1) };
    const r = analyzeAlcoholImpact(input);
    expect(r.carbGuidance.snackBeforeBed).toBe(false);
  });
});

/* ── Monitoring advice ───────────────────────────────────────── */
describe("analyzeAlcoholImpact — monitoring", () => {
  it("recommends bedtime check for any drinking", () => {
    const r = analyzeAlcoholImpact(baseInput);
    expect(r.monitoringAdvice.checkBeforeBed).toBe(true);
  });

  it("sets night alarm for 2+ drinks", () => {
    const r = analyzeAlcoholImpact(baseInput);
    expect(r.monitoringAdvice.setAlarmForNightCheck).toBe(true);
  });

  it("no night alarm for 1 drink", () => {
    const input: AlcoholInput = { ...baseInput, drinks: mkDrink("beer", 1) };
    const r = analyzeAlcoholImpact(input);
    expect(r.monitoringAdvice.setAlarmForNightCheck).toBe(false);
  });

  it("recommends morning check", () => {
    const r = analyzeAlcoholImpact(baseInput);
    expect(r.monitoringAdvice.nextMorningCheck).toBe(true);
  });
});

/* ── Warnings ────────────────────────────────────────────────── */
describe("analyzeAlcoholImpact — warnings", () => {
  it("warns about symptom overlap", () => {
    const r = analyzeAlcoholImpact(baseInput);
    expect(r.warnings.some((w) => w.includes("mimic"))).toBe(true);
  });

  it("warns about low glucose before drinking", () => {
    const input: AlcoholInput = { ...baseInput, currentGlucoseMmol: 4.2 };
    const r = analyzeAlcoholImpact(input);
    expect(r.warnings.some((w) => w.includes("already low"))).toBe(true);
  });

  it("warns about empty stomach", () => {
    const input: AlcoholInput = { ...baseInput, lastMealHoursAgo: 5 };
    const r = analyzeAlcoholImpact(input);
    expect(r.warnings.some((w) => w.includes("empty stomach"))).toBe(true);
  });

  it("warns about glucagon effectiveness", () => {
    const r = analyzeAlcoholImpact(baseInput);
    expect(r.warnings.some((w) => w.includes("Glucagon"))).toBe(true);
  });

  it("warns about heavy drinking", () => {
    const input: AlcoholInput = { ...baseInput, drinks: mkDrink("beer", 5) };
    const r = analyzeAlcoholImpact(input);
    expect(r.warnings.some((w) => w.includes("Heavy drinking"))).toBe(true);
  });
});

/* ── Drink types ─────────────────────────────────────────────── */
describe("analyzeAlcoholImpact — drink types", () => {
  it("spirits have zero carbs", () => {
    const input: AlcoholInput = { ...baseInput, drinks: mkDrink("spirits", 2) };
    const r = analyzeAlcoholImpact(input);
    expect(r.totalCarbsFromDrinks).toBe(0);
  });

  it("beer has significant carbs", () => {
    const input: AlcoholInput = { ...baseInput, drinks: mkDrink("beer", 2) };
    const r = analyzeAlcoholImpact(input);
    expect(r.totalCarbsFromDrinks).toBeGreaterThan(20);
  });

  it("low-carb beer has fewer carbs", () => {
    const regular: AlcoholInput = { ...baseInput, drinks: mkDrink("beer", 2) };
    const lowCarb: AlcoholInput = { ...baseInput, drinks: mkDrink("low-carb-beer", 2) };
    const regR = analyzeAlcoholImpact(regular);
    const lcR = analyzeAlcoholImpact(lowCarb);
    expect(lcR.totalCarbsFromDrinks).toBeLessThan(regR.totalCarbsFromDrinks);
  });
});

/* ── Gender differences ──────────────────────────────────────── */
describe("analyzeAlcoholImpact — gender", () => {
  it("higher BAC for same drinks in female", () => {
    const male: AlcoholInput = { ...baseInput, isFemale: false };
    const female: AlcoholInput = { ...baseInput, isFemale: true };
    const maleR = analyzeAlcoholImpact(male);
    const femaleR = analyzeAlcoholImpact(female);
    expect(femaleR.estimatedBAC).toBeGreaterThan(maleR.estimatedBAC);
  });
});
