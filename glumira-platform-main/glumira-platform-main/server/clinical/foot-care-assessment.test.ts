import { describe, it, expect } from "vitest";
import { assessFootCare, type FootAssessmentInput } from "./foot-care-assessment";

/* ── helpers ─────────────────────────────────────────────────── */
const lowRiskInput: FootAssessmentInput = {
  hasNeuropathy: false,
  hasPVD: false,
  previousUlcer: false,
  previousAmputation: false,
  footDeformity: false,
  calluses: false,
  skinBreaks: false,
  poorCirculation: false,
  canFeelMonofilament: true,
  dailyFootCheck: true,
  appropriateFootwear: true,
  smoker: false,
  latestA1C: 6.5,
  yearsSinceDiagnosis: 3,
};

const highRiskInput: FootAssessmentInput = {
  hasNeuropathy: true,
  hasPVD: true,
  previousUlcer: true,
  previousAmputation: false,
  footDeformity: true,
  calluses: true,
  skinBreaks: true,
  poorCirculation: true,
  canFeelMonofilament: false,
  dailyFootCheck: false,
  appropriateFootwear: false,
  smoker: true,
  latestA1C: 9.0,
  yearsSinceDiagnosis: 20,
};

/* ── Risk category ───────────────────────────────────────────── */
describe("assessFootCare — risk category", () => {
  it("low risk for healthy feet", () => {
    const r = assessFootCare(lowRiskInput);
    expect(r.riskCategory).toBe("low");
  });

  it("very high risk for multiple factors", () => {
    const r = assessFootCare(highRiskInput);
    expect(r.riskCategory).toBe("very-high");
  });

  it("neuropathy alone increases risk", () => {
    const r = assessFootCare({ ...lowRiskInput, hasNeuropathy: true });
    expect(["moderate", "high"]).toContain(r.riskCategory);
  });
});

/* ── Risk factors ────────────────────────────────────────────── */
describe("assessFootCare — risk factors", () => {
  it("lists risk factors for high risk", () => {
    const r = assessFootCare(highRiskInput);
    expect(r.riskFactors.length).toBeGreaterThan(5);
  });

  it("no risk factors for low risk", () => {
    const r = assessFootCare(lowRiskInput);
    expect(r.riskFactors.length).toBe(0);
  });

  it("includes neuropathy as factor", () => {
    const r = assessFootCare({ ...lowRiskInput, hasNeuropathy: true });
    expect(r.riskFactors.some((f) => f.includes("neuropathy"))).toBe(true);
  });
});

/* ── Protective factors ──────────────────────────────────────── */
describe("assessFootCare — protective factors", () => {
  it("lists protective factors for good habits", () => {
    const r = assessFootCare(lowRiskInput);
    expect(r.protectiveFactors.length).toBeGreaterThan(0);
  });

  it("includes daily foot check", () => {
    const r = assessFootCare(lowRiskInput);
    expect(r.protectiveFactors.some((f) => f.includes("Daily foot checks"))).toBe(true);
  });
});

/* ── Exam frequency ──────────────────────────────────────────── */
describe("assessFootCare — exam frequency", () => {
  it("annual for low risk", () => {
    const r = assessFootCare(lowRiskInput);
    expect(r.examFrequency).toContain("Annual");
  });

  it("more frequent for high risk", () => {
    const r = assessFootCare(highRiskInput);
    expect(r.examFrequency).toContain("1-3 months");
  });
});

/* ── Daily care checklist ────────────────────────────────────── */
describe("assessFootCare — daily care", () => {
  it("provides care checklist", () => {
    const r = assessFootCare(lowRiskInput);
    expect(r.dailyCareChecklist.length).toBeGreaterThanOrEqual(5);
  });

  it("includes foot inspection", () => {
    const r = assessFootCare(lowRiskInput);
    expect(r.dailyCareChecklist.some((c) => c.includes("Inspect"))).toBe(true);
  });
});

/* ── Warning signs ───────────────────────────────────────────── */
describe("assessFootCare — warning signs", () => {
  it("lists warning signs", () => {
    const r = assessFootCare(lowRiskInput);
    expect(r.warningSignsToWatch.length).toBeGreaterThan(0);
  });
});

/* ── When to seek help ───────────────────────────────────────── */
describe("assessFootCare — when to seek help", () => {
  it("lists emergency signs", () => {
    const r = assessFootCare(lowRiskInput);
    expect(r.whenToSeekHelp.length).toBeGreaterThan(0);
  });
});

/* ── Footwear ────────────────────────────────────────────────── */
describe("assessFootCare — footwear", () => {
  it("therapeutic footwear for high risk", () => {
    const r = assessFootCare(highRiskInput);
    expect(r.footwearRecommendations.some((f) => f.includes("therapeutic") || f.includes("orthotic"))).toBe(true);
  });

  it("general advice for low risk", () => {
    const r = assessFootCare(lowRiskInput);
    expect(r.footwearRecommendations.some((f) => f.includes("wide toe box"))).toBe(true);
  });
});

/* ── Referrals ───────────────────────────────────────────────── */
describe("assessFootCare — referrals", () => {
  it("specialist referral for high risk", () => {
    const r = assessFootCare(highRiskInput);
    expect(r.referrals.some((ref) => ref.includes("Podiatrist") || ref.includes("Vascular"))).toBe(true);
  });

  it("routine care for low risk", () => {
    const r = assessFootCare(lowRiskInput);
    expect(r.referrals.some((ref) => ref.includes("routine"))).toBe(true);
  });
});

/* ── Disclaimer ──────────────────────────────────────────────── */
describe("assessFootCare — disclaimer", () => {
  it("includes disclaimer", () => {
    const r = assessFootCare(lowRiskInput);
    expect(r.disclaimer).toContain("educational platform");
  });
});
