/**
 * GluMira™ — audit.test.ts
 *
 * Test suite for server/security/audit.ts
 * Covers: writeAuditLog, verifyAuditChain, getRecentAuditLog, resetAuditLog
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  writeAuditLog,
  verifyAuditChain,
  getRecentAuditLog,
  resetAuditLog,
} from "./audit";
import type { AuditLogInput } from "./audit";

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  resetAuditLog();
});

// ─── writeAuditLog ────────────────────────────────────────────────────────────

describe("writeAuditLog", () => {
  it("returns an AuditEntry with an id", async () => {
    const entry = await writeAuditLog({
      userId: "user-1",
      action: "user.login",
    });
    expect(entry.id).toBeTruthy();
    expect(typeof entry.id).toBe("string");
  });

  it("records the correct userId", async () => {
    const entry = await writeAuditLog({
      userId: "user-abc",
      action: "user.login",
    });
    expect(entry.userId).toBe("user-abc");
  });

  it("records the correct action", async () => {
    const entry = await writeAuditLog({
      userId: "user-1",
      action: "gdpr.erase",
    });
    expect(entry.action).toBe("gdpr.erase");
  });

  it("assigns a riskScore", async () => {
    const entry = await writeAuditLog({
      userId: "user-1",
      action: "user.login",
    });
    expect(typeof entry.riskScore).toBe("number");
    expect(entry.riskScore).toBeGreaterThanOrEqual(0);
    expect(entry.riskScore).toBeLessThanOrEqual(100);
  });

  it("assigns higher riskScore to gdpr.erase than user.login", async () => {
    const loginEntry = await writeAuditLog({ userId: "u1", action: "user.login" });
    resetAuditLog();
    const eraseEntry = await writeAuditLog({ userId: "u1", action: "gdpr.erase" });
    expect(eraseEntry.riskScore).toBeGreaterThan(loginEntry.riskScore);
  });

  it("includes an eventTime Date", async () => {
    const entry = await writeAuditLog({ userId: "u1", action: "user.login" });
    expect(entry.eventTime).toBeInstanceOf(Date);
    expect(entry.eventTime.getTime()).toBeGreaterThan(0);
  });

  it("includes prevHmac field", async () => {
    const entry = await writeAuditLog({ userId: "u1", action: "user.login" });
    expect(entry.prevHmac).toBeTruthy();
  });

  it("includes hmacSha256 field", async () => {
    const entry = await writeAuditLog({ userId: "u1", action: "user.login" });
    expect(entry.hmacSha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("stores optional patientId", async () => {
    const entry = await writeAuditLog({
      userId: "u1",
      action: "patient.read",
      patientId: "patient-xyz",
    });
    expect(entry.patientId).toBe("patient-xyz");
  });

  it("stores optional tableName", async () => {
    const entry = await writeAuditLog({
      userId: "u1",
      action: "glucose.create",
      tableName: "glucose_readings",
    });
    expect(entry.tableName).toBe("glucose_readings");
  });

  it("stores optional metadata", async () => {
    const entry = await writeAuditLog({
      userId: "u1",
      action: "user.login",
      metadata: { ip: "127.0.0.1" },
    });
    expect(entry.metadata?.ip).toBe("127.0.0.1");
  });

  it("appends multiple entries to the log", async () => {
    await writeAuditLog({ userId: "u1", action: "user.login" });
    await writeAuditLog({ userId: "u2", action: "user.login" });
    const log = getRecentAuditLog(10);
    expect(log.length).toBe(2);
  });

  it("chains prevHmac correctly between entries", async () => {
    const e1 = await writeAuditLog({ userId: "u1", action: "user.login" });
    const e2 = await writeAuditLog({ userId: "u1", action: "user.logout" });
    expect(e2.prevHmac).toBe(e1.hmacSha256);
  });
});

// ─── verifyAuditChain ─────────────────────────────────────────────────────────

describe("verifyAuditChain", () => {
  it("returns true for empty chain", () => {
    expect(verifyAuditChain([])).toBe(true);
  });

  it("returns true for a single valid entry", async () => {
    const entry = await writeAuditLog({ userId: "u1", action: "user.login" });
    const log = getRecentAuditLog(10);
    expect(verifyAuditChain(log)).toBe(true);
  });

  it("returns true for a valid multi-entry chain", async () => {
    await writeAuditLog({ userId: "u1", action: "user.login" });
    await writeAuditLog({ userId: "u1", action: "glucose.create" });
    await writeAuditLog({ userId: "u1", action: "iob.calculate" });
    const log = getRecentAuditLog(10);
    expect(verifyAuditChain(log)).toBe(true);
  });

  it("returns false when an entry's userId is tampered with", async () => {
    await writeAuditLog({ userId: "u1", action: "user.login" });
    const log = getRecentAuditLog(10);
    const tampered = log.map((e) => ({ ...e, userId: "attacker" }));
    expect(verifyAuditChain(tampered)).toBe(false);
  });

  it("returns false when an entry's action is tampered with", async () => {
    await writeAuditLog({ userId: "u1", action: "user.login" });
    const log = getRecentAuditLog(10);
    const tampered = log.map((e) => ({ ...e, action: "gdpr.erase" as const }));
    expect(verifyAuditChain(tampered)).toBe(false);
  });

  it("returns false when prevHmac is broken in chain", async () => {
    await writeAuditLog({ userId: "u1", action: "user.login" });
    await writeAuditLog({ userId: "u1", action: "user.logout" });
    const log = getRecentAuditLog(10);
    // Break the chain link
    const broken = log.map((e, i) =>
      i === 1 ? { ...e, prevHmac: "0000000000000000" } : e
    );
    expect(verifyAuditChain(broken)).toBe(false);
  });
});

// ─── getRecentAuditLog ────────────────────────────────────────────────────────

describe("getRecentAuditLog", () => {
  it("returns empty array when no entries", () => {
    expect(getRecentAuditLog(10)).toHaveLength(0);
  });

  it("respects the limit parameter", async () => {
    for (let i = 0; i < 5; i++) {
      await writeAuditLog({ userId: `u${i}`, action: "user.login" });
    }
    expect(getRecentAuditLog(3)).toHaveLength(3);
  });

  it("returns all entries when limit exceeds count", async () => {
    await writeAuditLog({ userId: "u1", action: "user.login" });
    expect(getRecentAuditLog(100)).toHaveLength(1);
  });

  it("defaults to 100 entries when no limit given", async () => {
    for (let i = 0; i < 5; i++) {
      await writeAuditLog({ userId: `u${i}`, action: "user.login" });
    }
    expect(getRecentAuditLog()).toHaveLength(5);
  });
});

// ─── resetAuditLog ────────────────────────────────────────────────────────────

describe("resetAuditLog", () => {
  it("clears all entries", async () => {
    await writeAuditLog({ userId: "u1", action: "user.login" });
    resetAuditLog();
    expect(getRecentAuditLog(100)).toHaveLength(0);
  });

  it("resets HMAC chain so next entry uses GENESIS prevHmac", async () => {
    await writeAuditLog({ userId: "u1", action: "user.login" });
    resetAuditLog();
    const entry = await writeAuditLog({ userId: "u2", action: "user.login" });
    expect(entry.prevHmac).toBe("GENESIS");
  });
});
