/**
 * GluMira™ Dose Log — Test Suite
 * Version: 7.0.0
 */

import { describe, it, expect } from "vitest";
import {
  logDose,
  getDoses,
  deleteDose,
  computeActiveIob,
  getAllDoses,
  clearDoses,
  iobFraction,
} from "./dose-log";

function uid() {
  return `user_${Math.random().toString(36).slice(2, 8)}`;
}

// ─── iobFraction ──────────────────────────────────────────────

describe("iobFraction", () => {
  it("returns 1.0 at t=0", () => {
    expect(iobFraction("NovoRapid", 0)).toBe(1.0);
  });

  it("returns 0.0 at or after duration", () => {
    expect(iobFraction("NovoRapid", 240)).toBe(0.0);
    expect(iobFraction("NovoRapid", 300)).toBe(0.0);
  });

  it("returns a value between 0 and 1 mid-duration", () => {
    const f = iobFraction("NovoRapid", 60);
    expect(f).toBeGreaterThan(0);
    expect(f).toBeLessThan(1);
  });

  it("Fiasp decays faster than NovoRapid at 90 min", () => {
    const fiasp = iobFraction("Fiasp", 90);
    const novo = iobFraction("NovoRapid", 90);
    expect(fiasp).toBeLessThan(novo);
  });

  it("Tresiba has significant IOB at 720 min", () => {
    const f = iobFraction("Tresiba", 720);
    expect(f).toBeGreaterThan(0.1);
  });

  it("Lantus has significant IOB at 660 min", () => {
    const f = iobFraction("Lantus", 660);
    expect(f).toBeGreaterThan(0.1);
  });
});

// ─── logDose ──────────────────────────────────────────────────

describe("logDose", () => {
  it("creates a dose with correct fields", () => {
    const userId = uid();
    const dose = logDose(userId, "NovoRapid", "bolus", 4.0);
    expect(dose.userId).toBe(userId);
    expect(dose.insulinType).toBe("NovoRapid");
    expect(dose.doseType).toBe("bolus");
    expect(dose.units).toBe(4.0);
    expect(dose.id).toMatch(/^dose_/);
  });

  it("throws for zero units", () => {
    expect(() => logDose(uid(), "NovoRapid", "bolus", 0)).toThrow();
  });

  it("throws for units > 100", () => {
    expect(() => logDose(uid(), "NovoRapid", "bolus", 101)).toThrow();
  });

  it("accepts custom administeredAt", () => {
    const userId = uid();
    const at = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const dose = logDose(userId, "Humalog", "correction", 2.0, at);
    expect(dose.administeredAt).toBe(at);
  });

  it("stores notes", () => {
    const userId = uid();
    const dose = logDose(userId, "Apidra", "bolus", 3.5, undefined, "Pre-meal");
    expect(dose.notes).toBe("Pre-meal");
  });
});

// ─── getDoses ─────────────────────────────────────────────────

describe("getDoses", () => {
  it("returns doses within the last 24 hours", () => {
    const userId = uid();
    logDose(userId, "NovoRapid", "bolus", 4.0);
    logDose(userId, "NovoRapid", "bolus", 3.0);
    expect(getDoses(userId, 24).length).toBe(2);
  });

  it("excludes doses older than the window", () => {
    const userId = uid();
    const old = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    logDose(userId, "NovoRapid", "bolus", 4.0, old);
    logDose(userId, "NovoRapid", "bolus", 3.0); // recent
    expect(getDoses(userId, 24).length).toBe(1);
  });

  it("returns empty array for unknown user", () => {
    expect(getDoses("nobody", 24)).toEqual([]);
  });
});

// ─── deleteDose ───────────────────────────────────────────────

describe("deleteDose", () => {
  it("deletes a dose by ID", () => {
    const userId = uid();
    const dose = logDose(userId, "NovoRapid", "bolus", 4.0);
    const ok = deleteDose(userId, dose.id);
    expect(ok).toBe(true);
    expect(getDoses(userId, 24).length).toBe(0);
  });

  it("returns false for unknown dose ID", () => {
    const userId = uid();
    expect(deleteDose(userId, "nonexistent")).toBe(false);
  });
});

// ─── computeActiveIob ─────────────────────────────────────────

describe("computeActiveIob", () => {
  it("returns 0 IOB for user with no doses", () => {
    const summary = computeActiveIob(uid());
    expect(summary.totalIob).toBe(0);
    expect(summary.doses.length).toBe(0);
  });

  it("returns full IOB for a dose just administered", () => {
    const userId = uid();
    logDose(userId, "NovoRapid", "bolus", 4.0);
    const summary = computeActiveIob(userId);
    expect(summary.totalIob).toBeCloseTo(4.0, 0);
  });

  it("returns 0 IOB for a fully expired dose", () => {
    const userId = uid();
    const old = new Date(Date.now() - 300 * 60 * 1000).toISOString(); // 300 min ago
    logDose(userId, "NovoRapid", "bolus", 4.0, old);
    const summary = computeActiveIob(userId);
    expect(summary.totalIob).toBe(0);
  });

  it("sums IOB across multiple active doses", () => {
    const userId = uid();
    logDose(userId, "NovoRapid", "bolus", 4.0);
    logDose(userId, "NovoRapid", "bolus", 2.0);
    const summary = computeActiveIob(userId);
    expect(summary.totalIob).toBeCloseTo(6.0, 0);
  });

  it("includes dose breakdown in result", () => {
    const userId = uid();
    logDose(userId, "Fiasp", "bolus", 3.0);
    const summary = computeActiveIob(userId);
    expect(summary.doses.length).toBeGreaterThan(0);
    expect(summary.doses[0].insulinType).toBe("Fiasp");
  });

  it("computes at a custom time", () => {
    const userId = uid();
    const at = new Date(Date.now() - 120 * 60 * 1000).toISOString();
    logDose(userId, "NovoRapid", "bolus", 4.0, at);
    const atNow = computeActiveIob(userId);
    const atFuture = computeActiveIob(userId, new Date(Date.now() + 60 * 60 * 1000));
    expect(atFuture.totalIob).toBeLessThan(atNow.totalIob);
  });
});

// ─── clearDoses ───────────────────────────────────────────────

describe("clearDoses", () => {
  it("clears all doses and returns count", () => {
    const userId = uid();
    logDose(userId, "NovoRapid", "bolus", 4.0);
    logDose(userId, "NovoRapid", "bolus", 3.0);
    const count = clearDoses(userId);
    expect(count).toBe(2);
    expect(getAllDoses(userId).length).toBe(0);
  });

  it("returns 0 for user with no doses", () => {
    expect(clearDoses(uid())).toBe(0);
  });
});
