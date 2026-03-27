/**
 * GluMira™ PHI Column-Level Encryption
 * Version: 7.1.0
 * Module: PHI-CRYPTO
 *
 * Implements AES-256-GCM application-layer encryption for PHI fields:
 *   - firstName, lastName (patient_profiles)
 *   - dateOfBirth (patient_profiles)
 *
 * Keys are sourced from the Supabase Vault via the PHI_ENCRYPTION_KEY
 * environment variable (base64-encoded 32-byte AES-256 key).
 *
 * Each encrypted value is stored as a self-contained ciphertext string:
 *   base64(iv):base64(authTag):base64(ciphertext)
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible.
 */
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from "crypto";

// ─── Constants ────────────────────────────────────────────────
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;   // 96-bit IV recommended for GCM
const TAG_LENGTH = 16;  // 128-bit auth tag
const SEPARATOR = ":";

// ─── Key Loading ──────────────────────────────────────────────
/**
 * Load the PHI encryption key from the environment.
 * Expects PHI_ENCRYPTION_KEY as a base64-encoded 32-byte string.
 * Falls back to a deterministic test key in non-production environments.
 */
export function loadPhiKey(): Buffer {
  const raw = process.env.PHI_ENCRYPTION_KEY;
  if (raw) {
    const key = Buffer.from(raw, "base64");
    if (key.length !== 32) {
      throw new Error(
        `PHI_ENCRYPTION_KEY must be 32 bytes (256 bits). Got ${key.length} bytes.`
      );
    }
    return key;
  }
  // Test/CI fallback — deterministic 32-byte key, never used in production
  if (process.env.NODE_ENV === "production") {
    throw new Error("PHI_ENCRYPTION_KEY must be set in production.");
  }
  return Buffer.alloc(32, 0x47); // 'G' repeated — clearly a test key
}

// ─── Encryption ───────────────────────────────────────────────
/**
 * Encrypt a plaintext PHI string using AES-256-GCM.
 * Returns a portable ciphertext string: base64(iv):base64(authTag):base64(ciphertext)
 */
export function encryptPhi(plaintext: string, key?: Buffer): string {
  const k = key ?? loadPhiKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, k, iv, { authTagLength: TAG_LENGTH });
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(SEPARATOR);
}

// ─── Decryption ───────────────────────────────────────────────
/**
 * Decrypt a PHI ciphertext string produced by encryptPhi().
 * Returns the original plaintext string.
 */
export function decryptPhi(ciphertext: string, key?: Buffer): string {
  const k = key ?? loadPhiKey();
  const parts = ciphertext.split(SEPARATOR);
  if (parts.length !== 3) {
    throw new Error("Invalid PHI ciphertext format. Expected iv:authTag:ciphertext.");
  }
  const [ivB64, tagB64, encB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(tagB64, "base64");
  const encrypted = Buffer.from(encB64, "base64");

  const decipher = createDecipheriv(ALGORITHM, k, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

// ─── Null-safe helpers ────────────────────────────────────────
/**
 * Encrypt a nullable PHI field. Returns null if the input is null/undefined.
 */
export function encryptPhiNullable(value: string | null | undefined, key?: Buffer): string | null {
  if (value == null) return null;
  return encryptPhi(value, key);
}

/**
 * Decrypt a nullable PHI field. Returns null if the input is null/undefined.
 */
export function decryptPhiNullable(value: string | null | undefined, key?: Buffer): string | null {
  if (value == null) return null;
  return decryptPhi(value, key);
}

// ─── Ciphertext detection ─────────────────────────────────────
/**
 * Returns true if the string looks like a PHI ciphertext (iv:tag:enc).
 * Used to safely re-encrypt or skip already-encrypted values.
 */
export function isPhiCiphertext(value: string): boolean {
  const parts = value.split(SEPARATOR);
  if (parts.length !== 3) return false;
  try {
    const iv = Buffer.from(parts[0], "base64");
    const tag = Buffer.from(parts[1], "base64");
    return iv.length === IV_LENGTH && tag.length === TAG_LENGTH;
  } catch {
    return false;
  }
}

// ─── Batch re-encryption ──────────────────────────────────────
/**
 * Re-encrypt a PHI ciphertext from an old key to a new key.
 * Used during key rotation.
 */
export function reEncryptPhi(ciphertext: string, oldKey: Buffer, newKey: Buffer): string {
  const plaintext = decryptPhi(ciphertext, oldKey);
  return encryptPhi(plaintext, newKey);
}
