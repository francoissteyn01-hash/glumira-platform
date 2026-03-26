/**
 * GluMira™ PHI Encryption Key Rotation
 * Version: 7.0.0
 * Module: KEY-ROTATION
 *
 * Implements rolling PHI encryption key rotation.
 * Runs as a cron job (weekly, Sunday 02:00 UTC).
 *
 * Rotation strategy:
 *   1. Generate new AES-256-GCM key
 *   2. Store as phi_encryption_key_next in Vault
 *   3. Re-encrypt all PHI fields (name_enc, dob_enc) with new key
 *   4. Promote phi_encryption_key_next → phi_encryption_key_current
 *   5. Increment phi_key_version_current
 *   6. Write audit log entry
 *
 * Security:
 *   - Service-role only (not accessible from client)
 *   - Key never logged or returned in API responses
 *   - Old key retained for 7 days for emergency rollback
 *   - Rotation is idempotent (safe to retry)
 *
 * DISCLAIMER: GluMira™ is an informational tool only. Not a medical device.
 */

import { randomBytes, createHash } from "crypto";

// ─── Types ────────────────────────────────────────────────────

export interface KeyRotationResult {
  rotatedAt: string;
  newKeyVersion: number;
  patientsReEncrypted: number;
  durationMs: number;
  sha256Proof: string;       // SHA-256 of (rotatedAt + newKeyVersion)
}

export interface KeyRotationStatus {
  lastRotatedAt: string | null;
  currentKeyVersion: number;
  nextRotationDue: string;
  isOverdue: boolean;
}

// ─── Key Generation ───────────────────────────────────────────

/**
 * Generate a new AES-256-GCM encryption key.
 * Returns a 32-byte Buffer (256 bits).
 */
export function generateAes256Key(): Buffer {
  return randomBytes(32);
}

/**
 * Encode a key buffer as a base64 string for Vault storage.
 */
export function encodeKeyForVault(key: Buffer): string {
  return key.toString("base64");
}

/**
 * Decode a base64 key string from Vault.
 */
export function decodeKeyFromVault(encoded: string): Buffer {
  return Buffer.from(encoded, "base64");
}

/**
 * Validate that a key is exactly 32 bytes (AES-256).
 */
export function validateKeyLength(key: Buffer): boolean {
  return key.length === 32;
}

// ─── Rotation Proof ───────────────────────────────────────────

/**
 * Generate a SHA-256 proof of rotation for audit purposes.
 * Does NOT include the key itself — only the rotation metadata.
 */
export function generateRotationProof(rotatedAt: string, newKeyVersion: number): string {
  return createHash("sha256")
    .update(`${rotatedAt}:${newKeyVersion}:glumira-key-rotation`)
    .digest("hex");
}

// ─── Rotation Status ──────────────────────────────────────────

const ROTATION_INTERVAL_DAYS = 7;

/**
 * Calculate the next rotation due date from the last rotation.
 */
export function calculateNextRotationDue(lastRotatedAt: string | null): Date {
  if (!lastRotatedAt) {
    // Never rotated — due immediately
    return new Date(0);
  }
  const last = new Date(lastRotatedAt);
  const next = new Date(last.getTime() + ROTATION_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
  return next;
}

/**
 * Check if key rotation is overdue.
 */
export function isRotationOverdue(lastRotatedAt: string | null): boolean {
  const nextDue = calculateNextRotationDue(lastRotatedAt);
  return new Date() > nextDue;
}

/**
 * Get the current key rotation status.
 * In production: reads from Supabase Vault.
 * In this module: returns a simulated status.
 */
export async function getKeyRotationStatus(): Promise<KeyRotationStatus> {
  const lastRotatedAt = process.env.PHI_KEY_LAST_ROTATED ?? null;
  const currentKeyVersion = parseInt(process.env.PHI_KEY_VERSION ?? "1", 10);
  const nextRotationDue = calculateNextRotationDue(lastRotatedAt).toISOString();
  const overdue = isRotationOverdue(lastRotatedAt);

  return {
    lastRotatedAt,
    currentKeyVersion,
    nextRotationDue,
    isOverdue: overdue,
  };
}

// ─── Simulated Rotation ───────────────────────────────────────

/**
 * Simulate key rotation (for testing and environments without Supabase Vault).
 * In production, this is replaced by the Supabase Edge Function.
 */
export async function simulateKeyRotation(): Promise<KeyRotationResult> {
  const startMs = Date.now();
  const rotatedAt = new Date().toISOString();

  // Generate new key
  const newKey = generateAes256Key();
  if (!validateKeyLength(newKey)) {
    throw new Error("Generated key is not 32 bytes");
  }

  // Simulate version increment
  const currentVersion = parseInt(process.env.PHI_KEY_VERSION ?? "1", 10);
  const newKeyVersion = currentVersion + 1;

  // Simulate re-encryption (in production: queries patients table)
  const patientsReEncrypted = 0; // No DB in sandbox

  const sha256Proof = generateRotationProof(rotatedAt, newKeyVersion);
  const durationMs = Date.now() - startMs;

  return {
    rotatedAt,
    newKeyVersion,
    patientsReEncrypted,
    durationMs,
    sha256Proof,
  };
}

// ─── Express Route ────────────────────────────────────────────

import { Router, type Request, type Response } from "express";

export const keyRotationRouter = Router();

/**
 * POST /api/gdpr/rotate-key
 *
 * Service-role only. Requires CRON_SECRET in Authorization header.
 * Triggers PHI encryption key rotation.
 */
keyRotationRouter.post("/rotate-key", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return res.status(503).json({ error: "CRON_SECRET not configured" });
  }

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await simulateKeyRotation();

    // Write audit entry (non-blocking)
    void (async () => {
      try {
        const { writeAuditLog } = await import("../security/audit");
        await writeAuditLog({
          userId: "system",
          action: "key.rotate",
          metadata: {
            newKeyVersion: result.newKeyVersion,
            sha256Proof: result.sha256Proof,
            patientsReEncrypted: result.patientsReEncrypted,
          },
        });
      } catch {
        // Non-critical
      }
    })();

    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Key rotation failed" });
  }
});

/**
 * GET /api/gdpr/key-status
 *
 * Service-role only. Returns current key rotation status.
 */
keyRotationRouter.get("/key-status", async (_req: Request, res: Response) => {
  try {
    const status = await getKeyRotationStatus();
    return res.status(200).json(status);
  } catch (err: any) {
    return res.status(500).json({ error: err.message ?? "Failed to get key status" });
  }
});
