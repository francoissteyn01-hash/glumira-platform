/**
 * GluMira™ PHI Encryption Tests
 * Version: 7.1.0
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */
import { describe, it, expect } from "vitest";
import {
  encryptPhi,
  decryptPhi,
  encryptPhiNullable,
  decryptPhiNullable,
  isPhiCiphertext,
  reEncryptPhi,
  loadPhiKey,
} from "../server/security/phi-crypto";
import { randomBytes } from "crypto";

const TEST_KEY = Buffer.alloc(32, 0x47); // deterministic test key

describe("PHI Encryption — Core", () => {
  it("encrypts and decrypts a name correctly", () => {
    const plaintext = "Alice Smith";
    const ciphertext = encryptPhi(plaintext, TEST_KEY);
    expect(ciphertext).not.toBe(plaintext);
    expect(decryptPhi(ciphertext, TEST_KEY)).toBe(plaintext);
  });

  it("produces different ciphertexts for the same plaintext (random IV)", () => {
    const plaintext = "Bob Jones";
    const c1 = encryptPhi(plaintext, TEST_KEY);
    const c2 = encryptPhi(plaintext, TEST_KEY);
    expect(c1).not.toBe(c2);
    expect(decryptPhi(c1, TEST_KEY)).toBe(plaintext);
    expect(decryptPhi(c2, TEST_KEY)).toBe(plaintext);
  });

  it("encrypts and decrypts a date of birth correctly", () => {
    const dob = "1990-03-15";
    const ciphertext = encryptPhi(dob, TEST_KEY);
    expect(decryptPhi(ciphertext, TEST_KEY)).toBe(dob);
  });

  it("ciphertext has the expected iv:tag:enc format", () => {
    const ciphertext = encryptPhi("Test", TEST_KEY);
    const parts = ciphertext.split(":");
    expect(parts).toHaveLength(3);
  });

  it("throws on tampered ciphertext (auth tag mismatch)", () => {
    const ciphertext = encryptPhi("Sensitive", TEST_KEY);
    const parts = ciphertext.split(":");
    // Corrupt the ciphertext portion
    parts[2] = Buffer.alloc(10, 0xff).toString("base64");
    const tampered = parts.join(":");
    expect(() => decryptPhi(tampered, TEST_KEY)).toThrow();
  });

  it("throws on wrong key", () => {
    const wrongKey = randomBytes(32);
    const ciphertext = encryptPhi("Sensitive", TEST_KEY);
    expect(() => decryptPhi(ciphertext, wrongKey)).toThrow();
  });

  it("throws on invalid ciphertext format", () => {
    expect(() => decryptPhi("not-a-valid-ciphertext", TEST_KEY)).toThrow(
      "Invalid PHI ciphertext format"
    );
  });
});

describe("PHI Encryption — Nullable helpers", () => {
  it("returns null for null input", () => {
    expect(encryptPhiNullable(null, TEST_KEY)).toBeNull();
    expect(decryptPhiNullable(null, TEST_KEY)).toBeNull();
  });

  it("returns null for undefined input", () => {
    expect(encryptPhiNullable(undefined, TEST_KEY)).toBeNull();
    expect(decryptPhiNullable(undefined, TEST_KEY)).toBeNull();
  });

  it("encrypts and decrypts non-null values correctly", () => {
    const value = "Jane Doe";
    const enc = encryptPhiNullable(value, TEST_KEY);
    expect(enc).not.toBeNull();
    expect(decryptPhiNullable(enc!, TEST_KEY)).toBe(value);
  });
});

describe("PHI Encryption — Ciphertext detection", () => {
  it("detects a valid ciphertext", () => {
    const ciphertext = encryptPhi("Test", TEST_KEY);
    expect(isPhiCiphertext(ciphertext)).toBe(true);
  });

  it("rejects plaintext as a ciphertext", () => {
    expect(isPhiCiphertext("Alice Smith")).toBe(false);
    expect(isPhiCiphertext("1990-03-15")).toBe(false);
    expect(isPhiCiphertext("")).toBe(false);
  });
});

describe("PHI Encryption — Key rotation re-encryption", () => {
  it("re-encrypts a value from old key to new key", () => {
    const newKey = randomBytes(32);
    const plaintext = "Charlie Brown";
    const oldCiphertext = encryptPhi(plaintext, TEST_KEY);
    const newCiphertext = reEncryptPhi(oldCiphertext, TEST_KEY, newKey);
    expect(newCiphertext).not.toBe(oldCiphertext);
    expect(decryptPhi(newCiphertext, newKey)).toBe(plaintext);
  });
});

describe("PHI Encryption — Key loading", () => {
  it("loads test key in non-production environment", () => {
    const key = loadPhiKey();
    expect(key).toBeInstanceOf(Buffer);
    expect(key.length).toBe(32);
  });
});
