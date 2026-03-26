import { describe, it, expect } from "vitest";
import { screenBurnout, type BurnoutResponse } from "./burnout-screener";

/* ── helpers ─────────────────────────────────────────────────── */
function mkResponses(domain: BurnoutResponse["domain"], scores: number[]): BurnoutResponse[] {
  return scores.map((score, i) => ({
    domain,
    question: `${domain} question ${i + 1}`,
    score,
  }));
}

const lowBurnout: BurnoutResponse[] = [
  ...mkResponses("emotional", [1, 1, 2]),
  ...mkResponses("regimen", [1, 2, 1]),
  ...mkResponses("interpersonal", [1, 1, 1]),
  ...mkResponses("physician", [1, 1, 2]),
  ...mkResponses("monitoring", [1, 2, 1]),
];

const highBurnout: BurnoutResponse[] = [
  ...mkResponses("emotional", [5, 4, 5]),
  ...mkResponses("regimen", [4, 5, 4]),
  ...mkResponses("interpersonal", [3, 4, 4]),
  ...mkResponses("physician", [4, 3, 4]),
  ...mkResponses("monitoring", [5, 5, 4]),
];

/* ── Empty ───────────────────────────────────────────────────── */
describe("screenBurnout — empty", () => {
  it("handles no responses", () => {
    const r = screenBurnout([]);
    expect(r.overallScore).toBe(0);
    expect(r.domains.length).toBe(0);
  });
});

/* ── Overall score ───────────────────────────────────────────── */
describe("screenBurnout — overall", () => {
  it("low score for low burnout", () => {
    const r = screenBurnout(lowBurnout);
    expect(r.overallScore).toBeLessThan(2.5);
    expect(["minimal", "mild"]).toContain(r.overallLevel);
  });

  it("high score for high burnout", () => {
    const r = screenBurnout(highBurnout);
    expect(r.overallScore).toBeGreaterThan(3.5);
    expect(["high", "severe"]).toContain(r.overallLevel);
  });
});

/* ── Domain analysis ─────────────────────────────────────────── */
describe("screenBurnout — domains", () => {
  it("returns all domains", () => {
    const r = screenBurnout(lowBurnout);
    expect(r.domains.length).toBe(5);
  });

  it("each domain has mean score", () => {
    const r = screenBurnout(lowBurnout);
    r.domains.forEach((d) => {
      expect(d.meanScore).toBeGreaterThan(0);
      expect(d.meanScore).toBeLessThanOrEqual(5);
    });
  });

  it("each domain has level", () => {
    const r = screenBurnout(lowBurnout);
    r.domains.forEach((d) => {
      expect(["minimal", "mild", "moderate", "high", "severe"]).toContain(d.level);
    });
  });

  it("identifies highest domain", () => {
    const r = screenBurnout(highBurnout);
    expect(r.highestDomain).not.toBeNull();
  });

  it("identifies lowest domain", () => {
    const r = screenBurnout(highBurnout);
    expect(r.lowestDomain).not.toBeNull();
  });
});

/* ── Top concerns ────────────────────────────────────────────── */
describe("screenBurnout — top concerns", () => {
  it("flags top concerns for high scores", () => {
    const r = screenBurnout(highBurnout);
    const withConcerns = r.domains.filter((d) => d.topConcern !== null);
    expect(withConcerns.length).toBeGreaterThan(0);
  });

  it("no top concerns for low scores", () => {
    const r = screenBurnout(lowBurnout);
    const withConcerns = r.domains.filter((d) => d.topConcern !== null);
    expect(withConcerns.length).toBe(0);
  });
});

/* ── Red flags ───────────────────────────────────────────────── */
describe("screenBurnout — red flags", () => {
  it("red flags for high burnout", () => {
    const r = screenBurnout(highBurnout);
    expect(r.redFlags.length).toBeGreaterThan(0);
  });

  it("no red flags for low burnout", () => {
    const r = screenBurnout(lowBurnout);
    expect(r.redFlags.length).toBe(0);
  });
});

/* ── Supportive messages ─────────────────────────────────────── */
describe("screenBurnout — supportive messages", () => {
  it("positive message for low burnout", () => {
    const r = screenBurnout(lowBurnout);
    expect(r.supportiveMessages.some((m) => m.includes("doing well"))).toBe(true);
  });

  it("empathetic message for high burnout", () => {
    const r = screenBurnout(highBurnout);
    expect(r.supportiveMessages.some((m) => m.includes("okay") || m.includes("strength") || m.includes("hard"))).toBe(true);
  });
});

/* ── Recommendations ─────────────────────────────────────────── */
describe("screenBurnout — recommendations", () => {
  it("recommends discussion for high burnout", () => {
    const r = screenBurnout(highBurnout);
    expect(r.recommendations.some((rec) => rec.includes("Discuss") || rec.includes("referral") || rec.includes("Simplify"))).toBe(true);
  });

  it("continue approach for low burnout", () => {
    const r = screenBurnout(lowBurnout);
    expect(r.recommendations.some((rec) => rec.includes("Continue"))).toBe(true);
  });
});

/* ── Resources ───────────────────────────────────────────────── */
describe("screenBurnout — resources", () => {
  it("provides support resources", () => {
    const r = screenBurnout(lowBurnout);
    expect(r.resources.length).toBeGreaterThanOrEqual(3);
  });
});

/* ── Disclaimer ──────────────────────────────────────────────── */
describe("screenBurnout — disclaimer", () => {
  it("includes disclaimer", () => {
    const r = screenBurnout(lowBurnout);
    expect(r.disclaimer).toContain("NOT a medical device");
  });
});
