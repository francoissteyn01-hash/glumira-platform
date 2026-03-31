/**
 * GluMira™ GDPR Module — Test Suite
 * Version: 7.0.0
 */

import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  validateErasureToken,
  generateErasureCertificate,
  simulateGdprErase,
  type GdprErasureManifest,
} from "./gdpr-erase";
import {
  generateAes256Key,
  encodeKeyForVault,
  decodeKeyFromVault,
  validateKeyLength,
  generateRotationProof,
  calculateNextRotationDue,
  isRotationOverdue,
  simulateKeyRotation,
} from "./key-rotation";

// ─── GDPR Erase ───────────────────────────────────────────────

describe("validateErasureToken", () => {
  beforeEach(() => {
    process.env.GDPR_ERASE_TOKEN = "test-erase-token-abc123";
  });
  afterEach(() => {
    delete process.env.GDPR_ERASE_TOKEN;
  });

  it("returns true for correct token", () => {
    expect(validateErasureToken("test-erase-token-abc123")).toBe(true);
  });

  it("returns false for wrong token", () => {
    expect(validateErasureToken("wrong-token")).toBe(false);
  });

  it("returns false when GDPR_ERASE_TOKEN not set", () => {
    delete process.env.GDPR_ERASE_TOKEN;
    expect(validateErasureToken("anything")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(validateErasureToken("")).toBe(false);
  });
});

describe("generateErasureCertificate", () => {
  const manifest: GdprErasureManifest = {
    userId: "user-123",
    erasedAt: "2026-03-26T10:00:00.000Z",
    requestedBy: "admin-456",
    reason: "User requested deletion",
    rowsDeleted: { user_profiles: 1 },
    certificateId: "",
  };

  it("returns a certificateId in UUID format", () => {
    const { certificateId } = generateErasureCertificate(manifest);
    expect(certificateId).toMatch(
      /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/
    );
  });

  it("returns a 64-character SHA-256 hex string", () => {
    const { sha256 } = generateErasureCertificate(manifest);
    expect(sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("generates unique certificates each call", () => {
    const c1 = generateErasureCertificate(manifest);
    const c2 = generateErasureCertificate(manifest);
    expect(c1.certificateId).not.toBe(c2.certificateId);
    expect(c1.sha256).not.toBe(c2.sha256);
  });
});

describe("simulateGdprErase", () => {
  beforeEach(() => {
    process.env.GDPR_ERASE_TOKEN = "erase-token-test";
  });
  afterEach(() => {
    delete process.env.GDPR_ERASE_TOKEN;
  });

  it("returns erasure result with all required fields", async () => {
    const result = await simulateGdprErase({
      userId: "user-abc",
      requestedBy: "admin-xyz",
      reason: "GDPR Article 17 request",
      confirmationToken: "erase-token-test",
    });
    expect(result.userId).toBe("user-abc");
    expect(result.erasedAt).toBeDefined();
    expect(result.tablesAffected).toContain("user_profiles");
    expect(result.tablesAffected).toContain("auth.users");
    expect(result.certificateId).toMatch(
      /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/
    );
    expect(result.sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it("throws on invalid token", async () => {
    await expect(
      simulateGdprErase({
        userId: "user-abc",
        requestedBy: "admin-xyz",
        reason: "test",
        confirmationToken: "wrong-token",
      })
    ).rejects.toThrow("GDPR erasure token invalid");
  });

  it("erasedAt is a valid ISO timestamp", async () => {
    const result = await simulateGdprErase({
      userId: "user-abc",
      requestedBy: "admin-xyz",
      reason: "test",
      confirmationToken: "erase-token-test",
    });
    expect(new Date(result.erasedAt).toISOString()).toBe(result.erasedAt);
  });

  it("tablesAffected contains all 7 tables", async () => {
    const result = await simulateGdprErase({
      userId: "u1",
      requestedBy: "a1",
      reason: "test",
      confirmationToken: "erase-token-test",
    });
    expect(result.tablesAffected).toHaveLength(7);
  });
});

// ─── Key Rotation ─────────────────────────────────────────────

describe("generateAes256Key", () => {
  it("returns a 32-byte Buffer", () => {
    const key = generateAes256Key();
    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toBe(32);
  });

  it("generates unique keys each call", () => {
    const keys = new Set(
      Array.from({ length: 10 }, () => generateAes256Key().toString("hex"))
    );
    expect(keys.size).toBe(10);
  });
});

describe("encodeKeyForVault / decodeKeyFromVault", () => {
  it("round-trips a key through base64 encoding", () => {
    const original = generateAes256Key();
    const encoded = encodeKeyForVault(original);
    const decoded = decodeKeyFromVault(encoded);
    expect(decoded.equals(original)).toBe(true);
  });

  it("encoded key is a valid base64 string", () => {
    const key = generateAes256Key();
    const encoded = encodeKeyForVault(key);
    expect(() => Buffer.from(encoded, "base64")).not.toThrow();
  });
});

describe("validateKeyLength", () => {
  it("returns true for 32-byte key", () => {
    expect(validateKeyLength(Buffer.alloc(32))).toBe(true);
  });

  it("returns false for 16-byte key", () => {
    expect(validateKeyLength(Buffer.alloc(16))).toBe(false);
  });

  it("returns false for 64-byte key", () => {
    expect(validateKeyLength(Buffer.alloc(64))).toBe(false);
  });

  it("returns false for empty buffer", () => {
    expect(validateKeyLength(Buffer.alloc(0))).toBe(false);
  });
});

describe("generateRotationProof", () => {
  it("returns a 64-character hex string", () => {
    const proof = generateRotationProof("2026-03-26T02:00:00.000Z", 2);
    expect(proof).toMatch(/^[a-f0-9]{64}$/);
  });

  it("is deterministic for same inputs", () => {
    const p1 = generateRotationProof("2026-03-26T02:00:00.000Z", 2);
    const p2 = generateRotationProof("2026-03-26T02:00:00.000Z", 2);
    expect(p1).toBe(p2);
  });

  it("differs for different versions", () => {
    const p1 = generateRotationProof("2026-03-26T02:00:00.000Z", 1);
    const p2 = generateRotationProof("2026-03-26T02:00:00.000Z", 2);
    expect(p1).not.toBe(p2);
  });
});

describe("calculateNextRotationDue", () => {
  it("returns epoch (immediate) when lastRotatedAt is null", () => {
    const next = calculateNextRotationDue(null);
    expect(next.getTime()).toBe(0);
  });

  it("returns 7 days after last rotation", () => {
    const last = "2026-03-19T02:00:00.000Z";
    const next = calculateNextRotationDue(last);
    const expected = new Date("2026-03-26T02:00:00.000Z");
    expect(next.getTime()).toBe(expected.getTime());
  });
});

describe("isRotationOverdue", () => {
  it("returns true when lastRotatedAt is null", () => {
    expect(isRotationOverdue(null)).toBe(true);
  });

  it("returns true when last rotation was more than 7 days ago", () => {
    const longAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    expect(isRotationOverdue(longAgo)).toBe(true);
  });

  it("returns false when last rotation was recent", () => {
    const recent = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    expect(isRotationOverdue(recent)).toBe(false);
  });
});

describe("simulateKeyRotation", () => {
  it("returns a rotation result with all required fields", async () => {
    const result = await simulateKeyRotation();
    expect(result.rotatedAt).toBeDefined();
    expect(result.newKeyVersion).toBeGreaterThan(0);
    expect(result.sha256Proof).toMatch(/^[a-f0-9]{64}$/);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("rotatedAt is a valid ISO timestamp", async () => {
    const result = await simulateKeyRotation();
    expect(new Date(result.rotatedAt).toISOString()).toBe(result.rotatedAt);
  });

  it("newKeyVersion is current version + 1", async () => {
    process.env.PHI_KEY_VERSION = "3";
    const result = await simulateKeyRotation();
    expect(result.newKeyVersion).toBe(4);
    delete process.env.PHI_KEY_VERSION;
  });
});
