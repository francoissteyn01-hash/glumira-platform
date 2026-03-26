import { describe, it, expect } from "vitest";
import { assessComplicationRisk, type ComplicationInput } from "./complication-risk-score";

/* ── helpers ─────────────────────────────────────────────────── */
const lowRiskInput: ComplicationInput = {
  diabetesType: "type1",
  yearsSinceDiagnosis: 2,
  latestA1C: 6.5,
  systolicBP: 120,
  diastolicBP: 75,
  ldlCholesterol: 2.0,
  smoker: false,
  familyHistoryCVD: false,
  existingComplications: [],
  age: 30,
  bmi: 23,
};

const highRiskInput: ComplicationInput = {
  diabetesType: "type2",
  yearsSinceDiagnosis: 25,
  latestA1C: 9.5,
  systolicBP: 155,
  diastolicBP: 95,
  ldlCholesterol: 4.5,
  smoker: true,
  familyHistoryCVD: true,
  existingComplications: ["retinopathy", "neuropathy"],
  age: 65,
  bmi: 35,
};

/* ── Structure ───────────────────────────────────────────────── */
describe("assessComplicationRisk — structure", () => {
  it("returns 5 complications", () => {
    const r = assessComplicationRisk(lowRiskInput);
    expect(r.complications.length).toBe(5);
  });

  it("includes screening schedule", () => {
    const r = assessComplicationRisk(lowRiskInput);
    expect(r.screeningSchedule.length).toBeGreaterThanOrEqual(5);
  });

  it("includes disclaimer", () => {
    const r = assessComplicationRisk(lowRiskInput);
    expect(r.disclaimer).toContain("NOT a medical device");
  });
});

/* ── Overall risk ────────────────────────────────────────────── */
describe("assessComplicationRisk — overall", () => {
  it("low risk for healthy profile", () => {
    const r = assessComplicationRisk(lowRiskInput);
    expect(["low", "moderate"]).toContain(r.overallRisk);
  });

  it("high risk for poor profile", () => {
    const r = assessComplicationRisk(highRiskInput);
    expect(["high", "very-high"]).toContain(r.overallRisk);
  });
});

/* ── Retinopathy ─────────────────────────────────────────────── */
describe("assessComplicationRisk — retinopathy", () => {
  it("low risk for new diagnosis", () => {
    const r = assessComplicationRisk(lowRiskInput);
    const retino = r.complications.find((c) => c.complication === "Retinopathy")!;
    expect(retino.riskLevel).toBe("low");
  });

  it("high risk for long duration + high A1C", () => {
    const r = assessComplicationRisk(highRiskInput);
    const retino = r.complications.find((c) => c.complication === "Retinopathy")!;
    expect(["high", "very-high"]).toContain(retino.riskLevel);
  });
});

/* ── Nephropathy ─────────────────────────────────────────────── */
describe("assessComplicationRisk — nephropathy", () => {
  it("includes key factors", () => {
    const r = assessComplicationRisk(highRiskInput);
    const nephro = r.complications.find((c) => c.complication === "Nephropathy")!;
    expect(nephro.keyFactors.length).toBeGreaterThan(0);
  });
});

/* ── CVD ─────────────────────────────────────────────────────── */
describe("assessComplicationRisk — CVD", () => {
  it("smoking increases CVD risk", () => {
    const noSmoke = assessComplicationRisk({ ...lowRiskInput, smoker: false });
    const smoke = assessComplicationRisk({ ...lowRiskInput, smoker: true });
    const cvdNoSmoke = noSmoke.complications.find((c) => c.complication === "Cardiovascular Disease")!;
    const cvdSmoke = smoke.complications.find((c) => c.complication === "Cardiovascular Disease")!;
    expect(cvdSmoke.riskScore).toBeGreaterThan(cvdNoSmoke.riskScore);
  });

  it("family history increases CVD risk", () => {
    const noFH = assessComplicationRisk({ ...lowRiskInput, familyHistoryCVD: false });
    const fh = assessComplicationRisk({ ...lowRiskInput, familyHistoryCVD: true });
    const cvdNoFH = noFH.complications.find((c) => c.complication === "Cardiovascular Disease")!;
    const cvdFH = fh.complications.find((c) => c.complication === "Cardiovascular Disease")!;
    expect(cvdFH.riskScore).toBeGreaterThan(cvdNoFH.riskScore);
  });
});

/* ── Modifiable factors ──────────────────────────────────────── */
describe("assessComplicationRisk — modifiable factors", () => {
  it("identifies smoking as modifiable", () => {
    const r = assessComplicationRisk({ ...lowRiskInput, smoker: true });
    expect(r.modifiableFactors.some((f) => f.includes("Smoking"))).toBe(true);
  });

  it("identifies A1C as modifiable", () => {
    const r = assessComplicationRisk({ ...lowRiskInput, latestA1C: 8.5 });
    expect(r.modifiableFactors.some((f) => f.includes("A1C"))).toBe(true);
  });

  it("no modifiable factors for optimal profile", () => {
    const r = assessComplicationRisk(lowRiskInput);
    expect(r.modifiableFactors.length).toBe(0);
  });
});

/* ── Urgent actions ──────────────────────────────────────────── */
describe("assessComplicationRisk — urgent actions", () => {
  it("urgent for very high risk", () => {
    const r = assessComplicationRisk(highRiskInput);
    expect(r.urgentActions.length).toBeGreaterThan(0);
  });

  it("no urgent for low risk", () => {
    const r = assessComplicationRisk(lowRiskInput);
    expect(r.urgentActions.length).toBe(0);
  });
});

/* ── Prevention tips ─────────────────────────────────────────── */
describe("assessComplicationRisk — prevention", () => {
  it("each complication has prevention tips", () => {
    const r = assessComplicationRisk(lowRiskInput);
    r.complications.forEach((c) => {
      expect(c.preventionTips.length).toBeGreaterThan(0);
    });
  });
});
