import { describe, it, expect } from "vitest";
import { generateSickDayProtocol, type SickDayInput } from "./sick-day-protocol";

/* ── helpers ─────────────────────────────────────────────────── */
const baseInput: SickDayInput = {
  diabetesType: "type1",
  currentGlucoseMmol: 12.0,
  symptoms: ["fever", "fatigue"],
  canEat: true,
  canDrinkFluids: true,
  vomitingCount24h: 0,
  onInsulinPump: false,
  hoursSinceOnset: 6,
  currentMedications: ["Lantus", "Novorapid"],
};

/* ── Structure ───────────────────────────────────────────────── */
describe("generateSickDayProtocol — structure", () => {
  it("returns complete protocol", () => {
    const r = generateSickDayProtocol(baseInput);
    expect(r.alertLevel).toBeDefined();
    expect(r.alertMessage).toBeDefined();
    expect(r.monitoringFrequency).toBeDefined();
    expect(r.disclaimer).toContain("educational platform");
  });

  it("includes emergency signs", () => {
    const r = generateSickDayProtocol(baseInput);
    expect(r.emergencySigns.length).toBeGreaterThan(0);
  });

  it("includes when to call doctor", () => {
    const r = generateSickDayProtocol(baseInput);
    expect(r.whenToCallDoctor.length).toBeGreaterThan(0);
  });
});

/* ── Alert levels ────────────────────────────────────────────── */
describe("generateSickDayProtocol — alert levels", () => {
  it("green for mild illness with OK glucose", () => {
    const input: SickDayInput = {
      ...baseInput,
      currentGlucoseMmol: 7.0,
      symptoms: ["cough"],
    };
    const r = generateSickDayProtocol(input);
    expect(r.alertLevel).toBe("green");
  });

  it("amber for moderate glucose elevation", () => {
    const input: SickDayInput = {
      ...baseInput,
      currentGlucoseMmol: 14.0,
    };
    const r = generateSickDayProtocol(input);
    expect(r.alertLevel).toBe("amber");
  });

  it("red for high glucose in type 1", () => {
    const input: SickDayInput = {
      ...baseInput,
      currentGlucoseMmol: 16.0,
    };
    const r = generateSickDayProtocol(input);
    expect(r.alertLevel).toBe("red");
  });

  it("red for unable to drink fluids", () => {
    const input: SickDayInput = {
      ...baseInput,
      canDrinkFluids: false,
      vomitingCount24h: 1,
    };
    const r = generateSickDayProtocol(input);
    expect(r.alertLevel).toBe("red");
  });

  it("emergency for confusion", () => {
    const input: SickDayInput = {
      ...baseInput,
      symptoms: ["confusion"],
    };
    const r = generateSickDayProtocol(input);
    expect(r.alertLevel).toBe("emergency");
  });

  it("emergency for very high ketones", () => {
    const input: SickDayInput = {
      ...baseInput,
      ketoneMmol: 3.5,
    };
    const r = generateSickDayProtocol(input);
    expect(r.alertLevel).toBe("emergency");
  });

  it("emergency for glucose > 20", () => {
    const input: SickDayInput = {
      ...baseInput,
      currentGlucoseMmol: 22.0,
    };
    const r = generateSickDayProtocol(input);
    expect(r.alertLevel).toBe("emergency");
  });

  it("emergency for persistent vomiting + unable to drink", () => {
    const input: SickDayInput = {
      ...baseInput,
      canDrinkFluids: false,
      vomitingCount24h: 4,
    };
    const r = generateSickDayProtocol(input);
    expect(r.alertLevel).toBe("emergency");
  });
});

/* ── Monitoring frequency ────────────────────────────────────── */
describe("generateSickDayProtocol — monitoring", () => {
  it("every 4 hours for green", () => {
    const input: SickDayInput = { ...baseInput, currentGlucoseMmol: 7.0, symptoms: ["cough"] };
    const r = generateSickDayProtocol(input);
    expect(r.monitoringFrequency).toContain("4");
  });

  it("every 1-2 hours for emergency", () => {
    const input: SickDayInput = { ...baseInput, symptoms: ["confusion"] };
    const r = generateSickDayProtocol(input);
    expect(r.monitoringFrequency).toContain("1-2");
  });
});

/* ── Insulin guidance ────────────────────────────────────────── */
describe("generateSickDayProtocol — insulin", () => {
  it("never stop basal for type 1", () => {
    const r = generateSickDayProtocol(baseInput);
    expect(r.insulinGuidance.some((a) => a.action.includes("NEVER stop basal"))).toBe(true);
  });

  it("suggests correction for high glucose type 1", () => {
    const input: SickDayInput = { ...baseInput, currentGlucoseMmol: 16.0 };
    const r = generateSickDayProtocol(input);
    expect(r.insulinGuidance.some((a) => a.action.includes("correction"))).toBe(true);
  });

  it("pump guidance for pump users", () => {
    const input: SickDayInput = { ...baseInput, onInsulinPump: true };
    const r = generateSickDayProtocol(input);
    expect(r.insulinGuidance.some((a) => a.action.includes("basal increase"))).toBe(true);
  });

  it("stop metformin if vomiting for type 2", () => {
    const input: SickDayInput = {
      ...baseInput,
      diabetesType: "type2",
      currentMedications: ["Metformin"],
      vomitingCount24h: 3,
    };
    const r = generateSickDayProtocol(input);
    expect(r.insulinGuidance.some((a) => a.action.includes("STOP metformin"))).toBe(true);
  });

  it("stop SGLT2 during illness for type 2", () => {
    const input: SickDayInput = {
      ...baseInput,
      diabetesType: "type2",
      currentMedications: ["Empagliflozin"],
    };
    const r = generateSickDayProtocol(input);
    expect(r.insulinGuidance.some((a) => a.action.includes("STOP SGLT2"))).toBe(true);
  });
});

/* ── Hydration guidance ──────────────────────────────────────── */
describe("generateSickDayProtocol — hydration", () => {
  it("recommends 200ml/hour", () => {
    const r = generateSickDayProtocol(baseInput);
    expect(r.hydrationGuidance.some((a) => a.action.includes("200ml"))).toBe(true);
  });

  it("sugar-free for high glucose", () => {
    const input: SickDayInput = { ...baseInput, currentGlucoseMmol: 14.0 };
    const r = generateSickDayProtocol(input);
    expect(r.hydrationGuidance.some((a) => a.action.includes("sugar-free"))).toBe(true);
  });

  it("sugary fluids for low glucose", () => {
    const input: SickDayInput = { ...baseInput, currentGlucoseMmol: 5.0 };
    const r = generateSickDayProtocol(input);
    expect(r.hydrationGuidance.some((a) => a.action.includes("sugary"))).toBe(true);
  });

  it("small sips when vomiting", () => {
    const input: SickDayInput = { ...baseInput, vomitingCount24h: 2 };
    const r = generateSickDayProtocol(input);
    expect(r.hydrationGuidance.some((a) => a.action.includes("small"))).toBe(true);
  });
});

/* ── Ketone guidance ─────────────────────────────────────────── */
describe("generateSickDayProtocol — ketones", () => {
  it("check ketones for type 1", () => {
    const r = generateSickDayProtocol(baseInput);
    expect(r.ketoneGuidance.some((a) => a.action.includes("Check blood ketones"))).toBe(true);
  });

  it("normal ketones message", () => {
    const input: SickDayInput = { ...baseInput, ketoneMmol: 0.3 };
    const r = generateSickDayProtocol(input);
    expect(r.ketoneGuidance.some((a) => a.action.includes("normal"))).toBe(true);
  });

  it("moderate ketones action", () => {
    const input: SickDayInput = { ...baseInput, ketoneMmol: 1.0 };
    const r = generateSickDayProtocol(input);
    expect(r.ketoneGuidance.some((a) => a.action.includes("correction insulin"))).toBe(true);
  });

  it("high ketones — contact team", () => {
    const input: SickDayInput = { ...baseInput, ketoneMmol: 2.0 };
    const r = generateSickDayProtocol(input);
    expect(r.ketoneGuidance.some((a) => a.action.includes("contact"))).toBe(true);
  });

  it("dangerous ketones — emergency", () => {
    const input: SickDayInput = { ...baseInput, ketoneMmol: 3.5 };
    const r = generateSickDayProtocol(input);
    expect(r.ketoneGuidance.some((a) => a.action.includes("emergency"))).toBe(true);
  });
});

/* ── Nutrition ───────────────────────────────────────────────── */
describe("generateSickDayProtocol — nutrition", () => {
  it("solid food when can eat", () => {
    const r = generateSickDayProtocol(baseInput);
    expect(r.nutritionGuidance.some((a) => a.action.includes("small, regular meals"))).toBe(true);
  });

  it("liquid carbs when cannot eat", () => {
    const input: SickDayInput = { ...baseInput, canEat: false };
    const r = generateSickDayProtocol(input);
    expect(r.nutritionGuidance.some((a) => a.action.includes("liquid carbs"))).toBe(true);
  });
});

/* ── Warnings ────────────────────────────────────────────────── */
describe("generateSickDayProtocol — warnings", () => {
  it("emergency warning for emergency level", () => {
    const input: SickDayInput = { ...baseInput, symptoms: ["confusion"] };
    const r = generateSickDayProtocol(input);
    expect(r.warnings.some((w) => w.includes("EMERGENCY"))).toBe(true);
  });

  it("urgent warning for red level", () => {
    const input: SickDayInput = { ...baseInput, currentGlucoseMmol: 16.0 };
    const r = generateSickDayProtocol(input);
    expect(r.warnings.some((w) => w.includes("URGENT"))).toBe(true);
  });

  it("no warnings for green level", () => {
    const input: SickDayInput = { ...baseInput, currentGlucoseMmol: 7.0, symptoms: ["cough"] };
    const r = generateSickDayProtocol(input);
    expect(r.warnings.length).toBe(0);
  });
});
