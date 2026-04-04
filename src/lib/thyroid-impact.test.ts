import { describe, it, expect } from "vitest";
import { calculateThyroidInsulinImpact, assessHashimotoOverlap, generateThyroidMonitoringPlan } from "./thyroid-impact";

describe("Thyroid Impact", () => {
  describe("calculateThyroidInsulinImpact", () => {
    it("returns no change for normal TSH", () => {
      const result = calculateThyroidInsulinImpact(2.5, 50);
      expect(result.adjustedISF).toBe(50);
      expect(result.change).toBe(0);
    });

    it("decreases ISF for hypothyroid (high TSH)", () => {
      const result = calculateThyroidInsulinImpact(8, 50);
      expect(result.adjustedISF).toBeLessThan(50);
      expect(result.direction).toBe("decreased");
    });

    it("increases ISF for hyperthyroid (low TSH)", () => {
      const result = calculateThyroidInsulinImpact(0.1, 50);
      expect(result.adjustedISF).toBeGreaterThan(50);
      expect(result.direction).toBe("increased");
    });
  });

  describe("assessHashimotoOverlap", () => {
    it("returns standard for no antibodies", () => {
      expect(assessHashimotoOverlap(false, 10).riskLevel).toBe("standard");
    });

    it("returns elevated for antibodies with recent T1D", () => {
      expect(assessHashimotoOverlap(true, 2).riskLevel).toBe("elevated");
    });
  });

  describe("generateThyroidMonitoringPlan", () => {
    it("returns shorter interval when dose is changing", () => {
      const plan = generateThyroidMonitoringPlan("2026-03-01", true, true);
      expect(plan.length).toBeGreaterThan(0);
      expect(plan[0].priority).toBe("high");
    });
  });
});
