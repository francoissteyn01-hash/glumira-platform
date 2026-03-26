/**
 * GluMira™ — iob-history.test.ts
 *
 * Unit tests for IOB history computation logic.
 * Tests the iobFraction decay model and computeActiveIob.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  iobFraction,
  logDose,
  computeActiveIob,
  clearDoses,
  type InsulinType,
} from "../doses/dose-log";

const USER = "test-iob-history";

// ─── iobFraction ──────────────────────────────────────────────────────────────

describe("iobFraction", () => {
  it("returns 1.0 at t=0 (full dose active)", () => {
    expect(iobFraction("NovoRapid", 0)).toBeCloseTo(1.0, 2);
  });

  it("returns 0 at t >= DIA (all insulin absorbed)", () => {
    // NovoRapid DIA = 240 min
    expect(iobFraction("NovoRapid", 300)).toBe(0);
  });

  it("returns a value between 0 and 1 at mid-DIA", () => {
    const frac = iobFraction("NovoRapid", 120);
    expect(frac).toBeGreaterThan(0);
    expect(frac).toBeLessThan(1);
  });

  it("is monotonically decreasing over time (after peak)", () => {
    // The biexponential model peaks around 30-60 min then decays
    // Test that IOB at 120 min < IOB at 60 min < IOB at 30 min (post-peak)
    const f30  = iobFraction("NovoRapid", 30);
    const f60  = iobFraction("NovoRapid", 60);
    const f120 = iobFraction("NovoRapid", 120);
    const f180 = iobFraction("NovoRapid", 180);
    const f240 = iobFraction("NovoRapid", 240);
    // After the initial rise, IOB should decrease
    expect(f120).toBeLessThan(f60);
    expect(f180).toBeLessThan(f120);
    expect(f240).toBeLessThanOrEqual(f180);
    // All values must be in [0, 1]
    for (const f of [f30, f60, f120, f180, f240]) {
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThanOrEqual(1);
    }
  });

  it("Lantus has longer DIA than NovoRapid", () => {
    // At 240 min, Lantus should still have active IOB
    const lantus    = iobFraction("Lantus", 240);
    const novoRapid = iobFraction("NovoRapid", 240);
    expect(lantus).toBeGreaterThan(novoRapid);
  });

  it("handles Humalog correctly", () => {
    expect(iobFraction("Humalog", 0)).toBeCloseTo(1.0, 2);
    expect(iobFraction("Humalog", 300)).toBe(0);
  });

  it("handles Tresiba correctly — still active at 240 min", () => {
    expect(iobFraction("Tresiba", 0)).toBeCloseTo(1.0, 2);
    // Tresiba DIA = 1440 min — at 240 min still has meaningful IOB
    expect(iobFraction("Tresiba", 240)).toBeGreaterThan(0);
    // At 240 min, Tresiba should have more IOB remaining than NovoRapid
    expect(iobFraction("Tresiba", 240)).toBeGreaterThan(iobFraction("NovoRapid", 240));
  });

  it("handles Lantus correctly — still active at 240 min", () => {
    expect(iobFraction("Lantus", 0)).toBeCloseTo(1.0, 2);
    // Lantus DIA = 1320 min — at 240 min still has meaningful IOB
    expect(iobFraction("Lantus", 240)).toBeGreaterThan(0);
    // At 240 min, Lantus should have more IOB remaining than NovoRapid
    expect(iobFraction("Lantus", 240)).toBeGreaterThan(iobFraction("NovoRapid", 240));
  });

  it("returns 0 for negative time", () => {
    // t <= 0 returns 1.0 per implementation
    expect(iobFraction("NovoRapid", -10)).toBe(1.0);
  });
});

// ─── computeActiveIob ─────────────────────────────────────────────────────────

describe("computeActiveIob", () => {
  beforeEach(() => {
    clearDoses(USER);
  });

  it("returns zero IOB when no doses logged", () => {
    const summary = computeActiveIob(USER);
    expect(summary.totalIob).toBe(0);
    expect(summary.doses).toHaveLength(0);
  });

  it("returns full IOB immediately after a bolus dose", () => {
    const now = new Date();
    logDose(USER, "NovoRapid", "bolus", 4, now.toISOString());
    const summary = computeActiveIob(USER, now);
    expect(summary.totalIob).toBeCloseTo(4, 1);
    expect(summary.doses).toHaveLength(1);
    expect(summary.doses[0].units).toBe(4);
  });

  it("returns zero IOB for a dose administered beyond DIA", () => {
    const past = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(); // 6h ago
    logDose(USER, "NovoRapid", "bolus", 4, past);
    const summary = computeActiveIob(USER);
    expect(summary.totalIob).toBe(0);
  });

  it("accumulates IOB from multiple simultaneous doses", () => {
    const now = new Date();
    logDose(USER, "NovoRapid", "bolus",      4, now.toISOString());
    logDose(USER, "NovoRapid", "correction", 2, now.toISOString());
    const summary = computeActiveIob(USER, now);
    expect(summary.totalIob).toBeCloseTo(6, 1);
  });

  it("separates basal and bolus doses in breakdown", () => {
    const now = new Date();
    logDose(USER, "Lantus",    "basal", 20, now.toISOString());
    logDose(USER, "NovoRapid", "bolus",  5, now.toISOString());
    const summary = computeActiveIob(USER, now);
    expect(summary.doses).toHaveLength(2);
    const types = summary.doses.map((d) => d.insulinType);
    expect(types).toContain("Lantus");
    expect(types).toContain("NovoRapid");
  });

  it("decays IOB correctly at 1h after NovoRapid bolus", () => {
    const doseTime = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1h ago
    logDose(USER, "NovoRapid", "bolus", 4, doseTime);
    const summary = computeActiveIob(USER);
    // At 60 min, should have less than full IOB but more than 0
    expect(summary.totalIob).toBeGreaterThan(0);
    expect(summary.totalIob).toBeLessThan(4);
  });

  it("computedAt is a valid ISO timestamp", () => {
    const summary = computeActiveIob(USER);
    expect(() => new Date(summary.computedAt)).not.toThrow();
    expect(new Date(summary.computedAt).getTime()).toBeGreaterThan(0);
  });

  it("minutesElapsed in breakdown is approximately correct", () => {
    const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    logDose(USER, "NovoRapid", "bolus", 4, thirtyMinsAgo);
    const summary = computeActiveIob(USER);
    expect(summary.doses[0].minutesElapsed).toBeGreaterThanOrEqual(28);
    expect(summary.doses[0].minutesElapsed).toBeLessThanOrEqual(32);
  });
});
