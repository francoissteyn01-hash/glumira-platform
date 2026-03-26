/**
 * GluMira™ Bernstein AI Q&A Engine — Test Suite
 * Version: 7.0.0
 *
 * Tests all pure-logic functions without making API calls.
 */

import { describe, it, expect } from "vitest";
import { classifyQuestion } from "./bernstein-qa";

describe("classifyQuestion", () => {
  it("classifies IOB questions correctly", () => {
    expect(classifyQuestion("What is IOB?")).toBe("iob");
    expect(classifyQuestion("How does insulin stacking work?")).toBe("iob");
    expect(classifyQuestion("How much active insulin do I have?")).toBe("iob");
  });

  it("classifies nutrition questions correctly", () => {
    expect(classifyQuestion("How many carbs should I eat?")).toBe("nutrition");
    expect(classifyQuestion("What foods are best for diabetes?")).toBe("nutrition");
    expect(classifyQuestion("Can I eat fruit with T1D?")).toBe("nutrition");
  });

  it("classifies monitoring questions correctly", () => {
    expect(classifyQuestion("What is a CGM?")).toBe("monitoring");
    expect(classifyQuestion("How do I monitor my blood sugar?")).toBe("monitoring");
    expect(classifyQuestion("What is time in range?")).toBe("monitoring");
  });

  it("classifies insulin questions correctly", () => {
    expect(classifyQuestion("What is the difference between basal and bolus?")).toBe("insulin");
    expect(classifyQuestion("How does insulin dose timing work?")).toBe("insulin");
    expect(classifyQuestion("What is a correction bolus?")).toBe("insulin");
  });

  it("classifies general questions as general", () => {
    expect(classifyQuestion("What is the Bernstein method?")).toBe("general");
    expect(classifyQuestion("How can I improve my HbA1c?")).toBe("general");
  });

  it("is case-insensitive", () => {
    expect(classifyQuestion("WHAT IS IOB")).toBe("iob");
    expect(classifyQuestion("CARB COUNTING")).toBe("nutrition");
  });
});
