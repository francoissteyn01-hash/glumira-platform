/**
 * GluMira™ — gdpr-erase.test.ts
 *
 * Unit tests for the GDPR erasure module.
 * Tests: validateErasureToken, generateErasureCertificate, simulateGdprErase.
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  validateErasureToken,
  generateErasureCertificate,
  simulateGdprErase,
  type GdprErasureManifest,
} from "./gdpr-erase";

// ─── Setup: set GDPR_ERASE_TOKEN env var for tests ────────────────────────────

const TEST_TOKEN = "test-gdpr-token-32chars-abcdefgh";

beforeAll(() => {
  process.env.GDPR_ERASE_TOKEN = TEST_TOKEN;
});

afterAll(() => {
  delete process.env.GDPR_ERASE_TOKEN;
});

// ─── validateErasureToken ─────────────────────────────────────────────────────

describe("validateErasureToken", () => {
  it("accepts the correct token", () => {
    expect(validateErasureToken(TEST_TOKEN)).toBe(true);
  });

  it("rejects an incorrect token of the same length", () => {
    const wrong = "wrong-gdpr-token-32chars-xxxxxxxx";
    // Same length as TEST_TOKEN (32 chars)
    expect(validateErasureToken(wrong)).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(validateErasureToken("")).toBe(false);
  });

  it("rejects a token of different length", () => {
    expect(validateErasureToken("short")).toBe(false);
  });

  it("rejects a token with extra characters", () => {
    expect(validateErasureToken(TEST_TOKEN + "extra")).toBe(false);
  });

  it("returns false when GDPR_ERASE_TOKEN is not set", () => {
    const saved = process.env.GDPR_ERASE_TOKEN;
    delete process.env.GDPR_ERASE_TOKEN;
    expect(validateErasureToken(TEST_TOKEN)).toBe(false);
    process.env.GDPR_ERASE_TOKEN = saved;
  });
});

// ─── generateErasureCertificate ───────────────────────────────────────────────

describe("generateErasureCertificate", () => {
  const manifest: GdprErasureManifest = {
    userId: "user-42",
    erasedAt: "2026-03-26T10:00:05.000Z",
    requestedBy: "admin-1",
    reason: "User requested account deletion",
    rowsDeleted: {
      glucose_readings: 500,
      insulin_doses: 200,
      meals: 100,
      patients: 1,
      webauthn_credentials: 2,
      user_profiles: 1,
      "auth.users": 1,
    },
    certificateId: "",
  };

  it("returns an object with certificateId", () => {
    const cert = generateErasureCertificate(manifest);
    expect(cert).toHaveProperty("certificateId");
    expect(typeof cert.certificateId).toBe("string");
    expect(cert.certificateId.length).toBeGreaterThan(0);
  });

  it("returns an object with sha256", () => {
    const cert = generateErasureCertificate(manifest);
    expect(cert).toHaveProperty("sha256");
    expect(typeof cert.sha256).toBe("string");
    expect(cert.sha256.length).toBe(64); // SHA-256 hex = 64 chars
  });

  it("certificateId looks like a UUID", () => {
    const cert = generateErasureCertificate(manifest);
    // UUID format: 8-4-4-4-12
    expect(cert.certificateId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    );
  });

  it("produces different certificateIds on each call (random)", () => {
    const cert1 = generateErasureCertificate(manifest);
    const cert2 = generateErasureCertificate(manifest);
    expect(cert1.certificateId).not.toBe(cert2.certificateId);
  });

  it("sha256 is a valid hex string", () => {
    const cert = generateErasureCertificate(manifest);
    expect(cert.sha256).toMatch(/^[0-9a-f]{64}$/);
  });
});

// ─── simulateGdprErase ────────────────────────────────────────────────────────

describe("simulateGdprErase", () => {
  const validRequest = {
    userId: "user-99",
    requestedBy: "admin-1",
    reason: "User requested account deletion",
    confirmationToken: TEST_TOKEN,
  };

  it("returns a GdprErasureResult with userId", async () => {
    const result = await simulateGdprErase(validRequest);
    expect(result.userId).toBe("user-99");
  });

  it("result includes erasedAt ISO timestamp", async () => {
    const result = await simulateGdprErase(validRequest);
    expect(result.erasedAt).toBeDefined();
    expect(() => new Date(result.erasedAt)).not.toThrow();
    expect(new Date(result.erasedAt).getTime()).toBeGreaterThan(0);
  });

  it("result includes tablesAffected array", async () => {
    const result = await simulateGdprErase(validRequest);
    expect(Array.isArray(result.tablesAffected)).toBe(true);
    expect(result.tablesAffected.length).toBeGreaterThan(0);
    expect(result.tablesAffected).toContain("glucose_readings");
    expect(result.tablesAffected).toContain("insulin_doses");
  });

  it("result includes rowsDeleted record", async () => {
    const result = await simulateGdprErase(validRequest);
    expect(typeof result.rowsDeleted).toBe("object");
    expect(result.rowsDeleted).not.toBeNull();
  });

  it("result includes certificateId", async () => {
    const result = await simulateGdprErase(validRequest);
    expect(typeof result.certificateId).toBe("string");
    expect(result.certificateId.length).toBeGreaterThan(0);
  });

  it("result includes sha256 hash", async () => {
    const result = await simulateGdprErase(validRequest);
    expect(result.sha256).toMatch(/^[0-9a-f]{64}$/);
  });

  it("throws for invalid confirmation token", async () => {
    const badRequest = { ...validRequest, confirmationToken: "wrong-token" };
    await expect(simulateGdprErase(badRequest)).rejects.toThrow();
  });

  it("throws for empty confirmation token", async () => {
    const badRequest = { ...validRequest, confirmationToken: "" };
    await expect(simulateGdprErase(badRequest)).rejects.toThrow();
  });
});
