/**
 * GluMira™ Security Module — Test Suite
 * Version: 7.0.0
 */

import { describe, expect, it, beforeEach } from "vitest";
import {
  generateCsrfToken,
  sanitiseRequest,
  securityHeaders,
} from "./middleware";
import {
  checkRateLimit,
  sanitiseIdentifier,
  RATE_LIMIT_PROFILES,
  type RateLimitProfile,
} from "./rate-limiter";
import {
  writeAuditLog,
  verifyAuditChain,
  getRecentAuditLog,
  resetAuditLog,
  type AuditAction,
} from "./audit";

// ─── Middleware ────────────────────────────────────────────────

describe("generateCsrfToken", () => {
  it("returns a 64-character hex string", () => {
    const token = generateCsrfToken();
    expect(token).toMatch(/^[a-f0-9]{64}$/);
  });

  it("generates unique tokens each call", () => {
    const tokens = new Set(Array.from({ length: 20 }, () => generateCsrfToken()));
    expect(tokens.size).toBe(20);
  });
});

describe("securityHeaders", () => {
  it("is a function (middleware)", () => {
    expect(typeof securityHeaders).toBe("function");
    expect(securityHeaders.length).toBe(3); // req, res, next
  });
});

describe("sanitiseRequest", () => {
  it("is a function (middleware)", () => {
    expect(typeof sanitiseRequest).toBe("function");
  });
});

// ─── Rate Limiter ──────────────────────────────────────────────

describe("sanitiseIdentifier", () => {
  it("removes special characters", () => {
    const result = sanitiseIdentifier("user<script>alert(1)</script>");
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
  });

  it("preserves valid characters", () => {
    const result = sanitiseIdentifier("glumira:auth:192.168.1.1");
    expect(result).toBe("glumira:auth:192.168.1.1");
  });

  it("truncates to 128 characters", () => {
    const long = "a".repeat(200);
    expect(sanitiseIdentifier(long).length).toBe(128);
  });
});

describe("RATE_LIMIT_PROFILES", () => {
  it("defines all 6 profiles", () => {
    const profiles: RateLimitProfile[] = [
      "auth", "api_read", "api_write", "pdf_export", "ai_query", "iob_calc",
    ];
    for (const p of profiles) {
      expect(RATE_LIMIT_PROFILES[p]).toBeDefined();
      expect(RATE_LIMIT_PROFILES[p].maxRequests).toBeGreaterThan(0);
      expect(RATE_LIMIT_PROFILES[p].windowSeconds).toBeGreaterThan(0);
    }
  });

  it("auth profile is the most restrictive (≤ 10 req/window)", () => {
    expect(RATE_LIMIT_PROFILES.auth.maxRequests).toBeLessThanOrEqual(10);
  });

  it("api_read is more permissive than api_write", () => {
    expect(RATE_LIMIT_PROFILES.api_read.maxRequests).toBeGreaterThan(
      RATE_LIMIT_PROFILES.api_write.maxRequests
    );
  });
});

describe("checkRateLimit — in-memory", () => {
  it("allows requests within limit", async () => {
    const id = `test-allow-${Date.now()}`;
    const result = await checkRateLimit(id, "pdf_export");
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
    expect(result.resetAt).toBeGreaterThan(0);
  });

  it("blocks after exceeding limit", async () => {
    const id = `test-block-${Date.now()}`;
    const limit = RATE_LIMIT_PROFILES.auth.maxRequests;
    // Exhaust the limit
    for (let i = 0; i < limit; i++) {
      await checkRateLimit(id, "auth");
    }
    const result = await checkRateLimit(id, "auth");
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("remaining decrements with each request", async () => {
    const id = `test-decrement-${Date.now()}`;
    const r1 = await checkRateLimit(id, "api_write");
    const r2 = await checkRateLimit(id, "api_write");
    expect(r2.remaining).toBeLessThan(r1.remaining);
  });

  it("retryAfter is undefined when allowed", async () => {
    const id = `test-retry-${Date.now()}`;
    const result = await checkRateLimit(id, "iob_calc");
    expect(result.retryAfter).toBeUndefined();
  });
});

// ─── Audit Logger ──────────────────────────────────────────────

describe("writeAuditLog", () => {
  beforeEach(() => resetAuditLog());

  it("returns an audit entry with all required fields", async () => {
    const entry = await writeAuditLog({
      userId: "user-123",
      action: "user.login",
    });
    expect(entry.id).toBeDefined();
    expect(entry.userId).toBe("user-123");
    expect(entry.action).toBe("user.login");
    expect(entry.riskScore).toBeGreaterThanOrEqual(0);
    expect(entry.hmacSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(entry.prevHmac).toBe("GENESIS");
    expect(entry.eventTime).toBeInstanceOf(Date);
  });

  it("assigns correct risk score for high-risk actions", async () => {
    const entry = await writeAuditLog({
      userId: "user-123",
      action: "gdpr.erase",
    });
    expect(entry.riskScore).toBeGreaterThanOrEqual(90);
  });

  it("assigns low risk score for login", async () => {
    const entry = await writeAuditLog({
      userId: "user-123",
      action: "user.login",
    });
    expect(entry.riskScore).toBeLessThan(30);
  });

  it("chains prevHmac from previous entry", async () => {
    const e1 = await writeAuditLog({ userId: "u1", action: "user.login" });
    const e2 = await writeAuditLog({ userId: "u1", action: "patient.read" });
    expect(e2.prevHmac).toBe(e1.hmacSha256);
  });

  it("stores entries in memory log", async () => {
    await writeAuditLog({ userId: "u1", action: "meal.create" });
    await writeAuditLog({ userId: "u1", action: "iob.calculate" });
    const log = getRecentAuditLog();
    expect(log.length).toBe(2);
  });

  it("includes patientId when provided", async () => {
    const entry = await writeAuditLog({
      userId: "u1",
      patientId: "p-42",
      action: "glucose.create",
    });
    expect(entry.patientId).toBe("p-42");
  });

  it("includes metadata when provided", async () => {
    const entry = await writeAuditLog({
      userId: "u1",
      action: "care_plan.generate",
      metadata: { school: "Springfield Primary", regime: "pediatric-standard" },
    });
    expect(entry.metadata?.school).toBe("Springfield Primary");
  });
});

describe("verifyAuditChain", () => {
  beforeEach(() => resetAuditLog());

  it("returns true for empty chain", () => {
    expect(verifyAuditChain([])).toBe(true);
  });

  it("returns true for valid chain", async () => {
    await writeAuditLog({ userId: "u1", action: "user.login" });
    await writeAuditLog({ userId: "u1", action: "patient.read" });
    await writeAuditLog({ userId: "u1", action: "iob.calculate" });
    const log = getRecentAuditLog();
    expect(verifyAuditChain(log)).toBe(true);
  });

  it("returns false if an entry is tampered", async () => {
    await writeAuditLog({ userId: "u1", action: "user.login" });
    await writeAuditLog({ userId: "u1", action: "gdpr.erase" });
    const log = getRecentAuditLog();
    // Tamper with the first entry
    const tampered = [...log];
    tampered[0] = { ...tampered[0], action: "user.logout" };
    expect(verifyAuditChain(tampered)).toBe(false);
  });

  it("returns false if prevHmac chain is broken", async () => {
    await writeAuditLog({ userId: "u1", action: "user.login" });
    await writeAuditLog({ userId: "u1", action: "patient.read" });
    const log = getRecentAuditLog();
    const tampered = [...log];
    tampered[1] = { ...tampered[1], prevHmac: "000000" };
    expect(verifyAuditChain(tampered)).toBe(false);
  });
});

describe("getRecentAuditLog", () => {
  beforeEach(() => resetAuditLog());

  it("returns empty array when no entries", () => {
    expect(getRecentAuditLog()).toHaveLength(0);
  });

  it("respects limit parameter", async () => {
    for (let i = 0; i < 10; i++) {
      await writeAuditLog({ userId: "u1", action: "user.login" });
    }
    expect(getRecentAuditLog(5)).toHaveLength(5);
  });
});
