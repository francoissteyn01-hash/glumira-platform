/**
 * GluMira™ — rate-limiter.test.ts
 *
 * Test suite for server/security/rate-limiter.ts
 * Covers: sanitiseIdentifier, checkRateLimit, RATE_LIMIT_PROFILES
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  sanitiseIdentifier,
  checkRateLimit,
  RATE_LIMIT_PROFILES,
} from "./rate-limiter";
import type { RateLimitProfile } from "./rate-limiter";

// ─── sanitiseIdentifier ───────────────────────────────────────────────────────

describe("sanitiseIdentifier", () => {
  it("passes through safe alphanumeric keys", () => {
    expect(sanitiseIdentifier("user123")).toBe("user123");
  });

  it("passes through keys with allowed special chars (. _ @ : -)", () => {
    expect(sanitiseIdentifier("user@example.com")).toBe("user@example.com");
    expect(sanitiseIdentifier("192.168.1.1")).toBe("192.168.1.1");
    expect(sanitiseIdentifier("key:value")).toBe("key:value");
  });

  it("replaces spaces with underscores", () => {
    expect(sanitiseIdentifier("hello world")).toBe("hello_world");
  });

  it("replaces forward slashes with underscores", () => {
    expect(sanitiseIdentifier("path/to/key")).toBe("path_to_key");
  });

  it("replaces newlines with underscores (injection prevention)", () => {
    expect(sanitiseIdentifier("key\ninjection")).toBe("key_injection");
  });

  it("truncates to 128 characters", () => {
    const long = "a".repeat(200);
    expect(sanitiseIdentifier(long).length).toBe(128);
  });

  it("handles empty string", () => {
    expect(sanitiseIdentifier("")).toBe("");
  });
});

// ─── RATE_LIMIT_PROFILES ──────────────────────────────────────────────────────

describe("RATE_LIMIT_PROFILES", () => {
  const profiles: RateLimitProfile[] = [
    "auth",
    "api_read",
    "api_write",
    "pdf_export",
    "ai_query",
    "iob_calc",
  ];

  it("defines all 6 profiles", () => {
    expect(Object.keys(RATE_LIMIT_PROFILES)).toHaveLength(6);
  });

  profiles.forEach((p) => {
    it(`profile '${p}' has positive maxRequests`, () => {
      expect(RATE_LIMIT_PROFILES[p].maxRequests).toBeGreaterThan(0);
    });

    it(`profile '${p}' has positive windowSeconds`, () => {
      expect(RATE_LIMIT_PROFILES[p].windowSeconds).toBeGreaterThan(0);
    });
  });

  it("auth profile is the most restrictive (lowest maxRequests)", () => {
    const authMax = RATE_LIMIT_PROFILES.auth.maxRequests;
    const others = profiles.filter((p) => p !== "auth");
    others.forEach((p) => {
      expect(RATE_LIMIT_PROFILES[p].maxRequests).toBeGreaterThanOrEqual(authMax);
    });
  });
});

// ─── checkRateLimit ───────────────────────────────────────────────────────────

describe("checkRateLimit", () => {
  it("allows the first request", async () => {
    const result = await checkRateLimit(`test-user-${Date.now()}`, "api_read");
    expect(result.allowed).toBe(true);
  });

  it("returns remaining count after first request", async () => {
    const id = `test-remaining-${Date.now()}`;
    const result = await checkRateLimit(id, "api_read");
    expect(result.remaining).toBe(RATE_LIMIT_PROFILES.api_read.maxRequests - 1);
  });

  it("returns a resetAt timestamp in the future", async () => {
    const result = await checkRateLimit(`test-reset-${Date.now()}`, "api_read");
    expect(result.resetAt).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("does not set retryAfter when allowed", async () => {
    const result = await checkRateLimit(`test-retry-${Date.now()}`, "api_read");
    expect(result.retryAfter).toBeUndefined();
  });

  it("blocks after exceeding auth limit (5 requests)", async () => {
    const id = `test-auth-block-${Date.now()}`;
    const limit = RATE_LIMIT_PROFILES.auth.maxRequests;

    for (let i = 0; i < limit; i++) {
      await checkRateLimit(id, "auth");
    }

    const blocked = await checkRateLimit(id, "auth");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("sets retryAfter when blocked", async () => {
    const id = `test-retry-after-${Date.now()}`;
    const limit = RATE_LIMIT_PROFILES.auth.maxRequests;

    for (let i = 0; i < limit; i++) {
      await checkRateLimit(id, "auth");
    }

    const blocked = await checkRateLimit(id, "auth");
    expect(blocked.retryAfter).toBeDefined();
    expect(blocked.retryAfter!).toBeGreaterThan(0);
  });

  it("different identifiers are tracked independently", async () => {
    const ts = Date.now();
    const id1 = `user-a-${ts}`;
    const id2 = `user-b-${ts}`;

    await checkRateLimit(id1, "api_write");
    const r2 = await checkRateLimit(id2, "api_write");

    expect(r2.remaining).toBe(RATE_LIMIT_PROFILES.api_write.maxRequests - 1);
  });

  it("different profiles are tracked independently for same identifier", async () => {
    const id = `shared-id-${Date.now()}`;
    await checkRateLimit(id, "auth");
    const readResult = await checkRateLimit(id, "api_read");
    expect(readResult.remaining).toBe(RATE_LIMIT_PROFILES.api_read.maxRequests - 1);
  });

  it("iob_calc profile allows 100 requests", async () => {
    expect(RATE_LIMIT_PROFILES.iob_calc.maxRequests).toBe(100);
  });
});
