import { describe, it, expect } from "vitest";
import { calculateStimulantOverlap, generateAdhdMealPlan, simplifyIOBDisplay } from "./adhd-impact";

describe("ADHD Impact", () => {
  describe("calculateStimulantOverlap", () => {
    it("detects high overlap when long-acting stimulant covers insulin window", () => {
      const windows = calculateStimulantOverlap("lisdexamfetamine", 7, 8, 4);
      expect(windows.length).toBeGreaterThan(0);
      expect(windows[0].risk).toBe("high");
    });

    it("returns empty when no overlap", () => {
      const windows = calculateStimulantOverlap("methylphenidate", 7, 18, 4);
      expect(windows.length).toBe(0);
    });

    it("detects medium overlap for short-acting stimulant", () => {
      const windows = calculateStimulantOverlap("methylphenidate", 7, 8, 4);
      expect(windows.length).toBeGreaterThan(0);
    });
  });

  describe("generateAdhdMealPlan", () => {
    it("puts breakfast before medication dose time", () => {
      const plan = generateAdhdMealPlan("methylphenidate", 8);
      expect(plan[0].type).toBe("breakfast");
      expect(plan[0].time).toBe("7:00");
    });

    it("includes snacks during suppression window", () => {
      const plan = generateAdhdMealPlan("lisdexamfetamine", 7);
      const snacks = plan.filter((m) => m.type === "snack");
      expect(snacks.length).toBeGreaterThan(2);
    });

    it("includes dinner after medication wears off", () => {
      const plan = generateAdhdMealPlan("methylphenidate", 8);
      const dinner = plan.find((m) => m.type === "dinner");
      expect(dinner).toBeDefined();
    });
  });

  describe("simplifyIOBDisplay", () => {
    it("returns HIGH for >4 units", () => {
      expect(simplifyIOBDisplay(5).level).toBe("HIGH");
    });
    it("returns CLEAR for <0.5 units", () => {
      expect(simplifyIOBDisplay(0.2).level).toBe("CLEAR");
    });
  });
});
