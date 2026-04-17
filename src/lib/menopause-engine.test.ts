import { describe, it, expect } from "vitest";
import { analyseMenopause } from "./menopause-engine";

describe("analyseMenopause", () => {
  it("perimenopause, no HRT → ISF band −10% to −25%", () => {
    const r = analyseMenopause({
      stage: "perimenopause",
      hrtType: "none",
      yearsSinceLastPeriod: 2,
      symptoms: [],
      avgFastingMmol: 6.5,
      avgPostMealMmol: 9.0,
      basalDoseUnits: 20,
      hypoEventsLast7Days: 0,
      unit: "mmol",
    });
    expect(r.isfImpactLow).toBeCloseTo(-0.10);
    expect(r.isfImpactHigh).toBeCloseTo(-0.25);
  });

  it("menopause, no HRT → ISF band −15% to −30%", () => {
    const r = analyseMenopause({
      stage: "menopause",
      hrtType: "none",
      yearsSinceLastPeriod: 1,
      symptoms: [],
      avgFastingMmol: 7.0,
      avgPostMealMmol: 10.0,
      basalDoseUnits: 22,
      hypoEventsLast7Days: 1,
      unit: "mmol",
    });
    expect(r.isfImpactLow).toBeCloseTo(-0.15);
    expect(r.isfImpactHigh).toBeCloseTo(-0.30);
  });

  it("postmenopause, oestrogen-only HRT → band shifts +10%", () => {
    const r = analyseMenopause({
      stage: "postmenopause",
      hrtType: "oestrogen-only",
      yearsSinceLastPeriod: 5,
      symptoms: [],
      avgFastingMmol: 7.5,
      avgPostMealMmol: 11.0,
      basalDoseUnits: 24,
      hypoEventsLast7Days: 0,
      unit: "mmol",
    });
    // postmenopause no HRT = −20% to −35%, oestrogen-only adds +10% → −10% to −25%
    expect(r.isfImpactLow).toBeCloseTo(-0.10);
    expect(r.isfImpactHigh).toBeCloseTo(-0.25);
  });

  it("nocturnalHypoRisk elevated when hypoEventsLast7Days >= 2", () => {
    const r = analyseMenopause({
      stage: "menopause",
      hrtType: "none",
      yearsSinceLastPeriod: 2,
      symptoms: ["insomnia"],
      avgFastingMmol: 5.5,
      avgPostMealMmol: 8.0,
      basalDoseUnits: 18,
      hypoEventsLast7Days: 3,
      unit: "mmol",
    });
    expect(r.nocturnalHypoRisk).not.toBe("low");
  });

  it("hrtInteractionNote present when hrtType !== none", () => {
    const r = analyseMenopause({
      stage: "perimenopause",
      hrtType: "combined",
      yearsSinceLastPeriod: 0,
      symptoms: [],
      avgFastingMmol: 6.0,
      avgPostMealMmol: 9.5,
      basalDoseUnits: 20,
      hypoEventsLast7Days: 0,
      unit: "mmol",
    });
    expect(r.hrtInteractionNote).toBeTruthy();
  });

  it("hotFlashCorrelationNote present when hot_flashes symptom selected", () => {
    const r = analyseMenopause({
      stage: "menopause",
      hrtType: "none",
      yearsSinceLastPeriod: 1,
      symptoms: ["hot_flashes"],
      avgFastingMmol: 7.0,
      avgPostMealMmol: 10.0,
      basalDoseUnits: 20,
      hypoEventsLast7Days: 0,
      unit: "mmol",
    });
    expect(r.hotFlashCorrelationNote).toBeTruthy();
  });
});
