/**
 * GluMira™ — key-rotation.test.ts
 *
 * Test suite for server/gdpr/key-rotation.ts
 * Covers: generateAes256Key, encodeKeyForVault, decodeKeyFromVault,
 *         validateKeyLength, generateRotationProof,
 *         calculateNextRotationDue, isRotationOverdue
 *
 * GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { describe, it, expect } from "vitest";
import {
  generateAes256Key,
  encodeKeyForVault,
  decodeKeyFromVault,
  validateKeyLength,
  generateRotationProof,
  calculateNextRotationDue,
  isRotationOverdue,
} from "./key-rotation";

// ─── generateAes256Key ────────────────────────────────────────────────────────

describe("generateAes256Key", () => {
  it("returns a Buffer", () => {
    const key = generateAes256Key();
    expect(Buffer.isBuffer(key)).toBe(true);
  });

  it("returns exactly 32 bytes", () => {
    const key = generateAes256Key();
    expect(key.length).toBe(32);
  });

  it("generates unique keys on each call", () => {
    const k1 = generateAes256Key();
    const k2 = generateAes256Key();
    expect(k1.equals(k2)).toBe(false);
  });
});

// ─── encodeKeyForVault / decodeKeyFromVault ───────────────────────────────────

describe("encodeKeyForVault / decodeKeyFromVault", () => {
  it("encodes a key as a base64 string", () => {
    const key = generateAes256Key();
    const encoded = encodeKeyForVault(key);
    expect(typeof encoded).toBe("string");
    expect(encoded.length).toBeGreaterThan(0);
  });

  it("round-trips key through encode/decode", () => {
    const key = generateAes256Key();
    const encoded = encodeKeyForVault(key);
    const decoded = decodeKeyFromVault(encoded);
    expect(decoded.equals(key)).toBe(true);
  });

  it("decoded key is still 32 bytes", () => {
    const key = generateAes256Key();
    const decoded = decodeKeyFromVault(encodeKeyForVault(key));
    expect(decoded.length).toBe(32);
  });

  it("encoded string is valid base64", () => {
    const key = generateAes256Key();
    const encoded = encodeKeyForVault(key);
    expect(() => Buffer.from(encoded, "base64")).not.toThrow();
  });
});

// ─── validateKeyLength ────────────────────────────────────────────────────────

describe("validateKeyLength", () => {
  it("returns true for a 32-byte key", () => {
    const key = generateAes256Key();
    expect(validateKeyLength(key)).toBe(true);
  });

  it("returns false for a 16-byte key (AES-128)", () => {
    const key = Buffer.alloc(16);
    expect(validateKeyLength(key)).toBe(false);
  });

  it("returns false for a 24-byte key (AES-192)", () => {
    const key = Buffer.alloc(24);
    expect(validateKeyLength(key)).toBe(false);
  });

  it("returns false for an empty buffer", () => {
    expect(validateKeyLength(Buffer.alloc(0))).toBe(false);
  });
});

// ─── generateRotationProof ────────────────────────────────────────────────────

describe("generateRotationProof", () => {
  it("returns a 64-character hex string (SHA-256)", () => {
    const proof = generateRotationProof("2026-03-26T02:00:00.000Z", 2);
    expect(proof).toHaveLength(64);
    expect(/^[0-9a-f]+$/.test(proof)).toBe(true);
  });

  it("is deterministic for the same inputs", () => {
    const ts = "2026-03-26T02:00:00.000Z";
    const p1 = generateRotationProof(ts, 3);
    const p2 = generateRotationProof(ts, 3);
    expect(p1).toBe(p2);
  });

  it("differs for different key versions", () => {
    const ts = "2026-03-26T02:00:00.000Z";
    const p1 = generateRotationProof(ts, 1);
    const p2 = generateRotationProof(ts, 2);
    expect(p1).not.toBe(p2);
  });

  it("differs for different timestamps", () => {
    const p1 = generateRotationProof("2026-03-19T02:00:00.000Z", 1);
    const p2 = generateRotationProof("2026-03-26T02:00:00.000Z", 1);
    expect(p1).not.toBe(p2);
  });
});

// ─── calculateNextRotationDue ─────────────────────────────────────────────────

describe("calculateNextRotationDue", () => {
  it("returns epoch (Date(0)) when lastRotatedAt is null", () => {
    const due = calculateNextRotationDue(null);
    expect(due.getTime()).toBe(0);
  });

  it("returns 7 days after the last rotation", () => {
    const last = new Date("2026-03-19T02:00:00.000Z");
    const expected = new Date("2026-03-26T02:00:00.000Z");
    const due = calculateNextRotationDue(last.toISOString());
    expect(due.getTime()).toBe(expected.getTime());
  });

  it("returns a Date object", () => {
    const due = calculateNextRotationDue("2026-03-19T02:00:00.000Z");
    expect(due instanceof Date).toBe(true);
  });
});

// ─── isRotationOverdue ────────────────────────────────────────────────────────

describe("isRotationOverdue", () => {
  it("returns true when lastRotatedAt is null", () => {
    expect(isRotationOverdue(null)).toBe(true);
  });

  it("returns true when last rotation was more than 7 days ago", () => {
    const old = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    expect(isRotationOverdue(old)).toBe(true);
  });

  it("returns false when last rotation was less than 7 days ago", () => {
    const recent = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(isRotationOverdue(recent)).toBe(false);
  });

  it("returns false when last rotation was just now", () => {
    const now = new Date().toISOString();
    expect(isRotationOverdue(now)).toBe(false);
  });
});
