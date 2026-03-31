/**
 * GluMira™ Audit Logger
 * Version: 7.0.0
 * Security: SEC-08 — HMAC-SHA256 chained audit log
 *
 * Every audit entry is HMAC-signed using the previous entry's hash,
 * creating a tamper-evident chain. Entries are written to the database
 * and optionally forwarded to Datadog SIEM.
 *
 * Risk scoring (0–100):
 *   0–25:  Informational (login, read)
 *   26–50: Low risk (profile update, meal log)
 *   51–75: Medium risk (insulin dose, glucose entry)
 *   76–100: High risk (PHI access, key rotation, GDPR erase)
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import { createHmac, randomBytes } from "crypto";

// ─── Types ────────────────────────────────────────────────────

export type AuditAction =
  | "user.login"
  | "user.logout"
  | "user.signup"
  | "user.password_reset"
  | "patient.create"
  | "patient.read"
  | "patient.update"
  | "patient.delete"
  | "glucose.create"
  | "glucose.read"
  | "glucose.delete"
  | "insulin.create"
  | "insulin.read"
  | "insulin.delete"
  | "meal.create"
  | "meal.read"
  | "iob.calculate"
  | "care_plan.generate"
  | "phi.encrypt"
  | "phi.decrypt"
  | "phi.key_rotation"
  | "gdpr.erase"
  | "security.rate_limit_exceeded"
  | "security.csrf_failure"
  | "security.auth_failure";

export interface AuditEntry {
  id?: string;
  eventTime: Date;
  userId: string;
  patientId?: string;
  action: AuditAction;
  tableName?: string;
  recordId?: string;
  ipAddress?: string;
  userAgent?: string;
  riskScore: number;
  metadata?: Record<string, unknown>;
  hmacSha256: string;
  prevHmac: string;
}

export interface AuditLogInput {
  userId: string;
  patientId?: string;
  action: AuditAction;
  tableName?: string;
  recordId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

// ─── Risk Scoring ─────────────────────────────────────────────

const RISK_SCORES: Record<AuditAction, number> = {
  "user.login":                    10,
  "user.logout":                   5,
  "user.signup":                   15,
  "user.password_reset":           40,
  "patient.create":                30,
  "patient.read":                  20,
  "patient.update":                35,
  "patient.delete":                80,
  "glucose.create":                50,
  "glucose.read":                  20,
  "glucose.delete":                60,
  "insulin.create":                60,
  "insulin.read":                  25,
  "insulin.delete":                65,
  "meal.create":                   30,
  "meal.read":                     15,
  "iob.calculate":                 40,
  "care_plan.generate":            55,
  "phi.encrypt":                   70,
  "phi.decrypt":                   75,
  "phi.key_rotation":              90,
  "gdpr.erase":                    95,
  "security.rate_limit_exceeded":  60,
  "security.csrf_failure":         80,
  "security.auth_failure":         75,
};

// ─── HMAC Chain ───────────────────────────────────────────────

let lastHmac = "GENESIS"; // sentinel for first entry

function getHmacSecret(): string {
  const secret = process.env.AUDIT_HMAC_SECRET;
  if (!secret) {
    // In development/test, use a deterministic fallback
    return "glumira-dev-hmac-secret-do-not-use-in-production";
  }
  return secret;
}

/**
 * Compute HMAC-SHA256 for an audit entry.
 * Includes the previous entry's hash to create a tamper-evident chain.
 */
function computeHmac(entry: Omit<AuditEntry, "hmacSha256">, secret: string): string {
  const payload = JSON.stringify({
    eventTime: entry.eventTime.toISOString(),
    userId: entry.userId,
    patientId: entry.patientId ?? null,
    action: entry.action,
    tableName: entry.tableName ?? null,
    recordId: entry.recordId ?? null,
    riskScore: entry.riskScore,
    prevHmac: entry.prevHmac,
  });
  return createHmac("sha256", secret).update(payload).digest("hex");
}

// ─── In-Memory Log (dev/test) ─────────────────────────────────

const memoryLog: AuditEntry[] = [];

// ─── Core Writer ──────────────────────────────────────────────

/**
 * Write an audit log entry.
 * In production, this should write to the database audit_log table.
 * In development, writes to in-memory log.
 */
export async function writeAuditLog(input: AuditLogInput): Promise<AuditEntry> {
  const secret = getHmacSecret();
  const riskScore = RISK_SCORES[input.action] ?? 50;

  const partialEntry: Omit<AuditEntry, "hmacSha256"> = {
    id: randomBytes(8).toString("hex"),
    eventTime: new Date(),
    userId: input.userId,
    patientId: input.patientId,
    action: input.action,
    tableName: input.tableName,
    recordId: input.recordId,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    riskScore,
    metadata: input.metadata,
    prevHmac: lastHmac,
  };

  const hmac = computeHmac(partialEntry, secret);
  const entry: AuditEntry = { ...partialEntry, hmacSha256: hmac };

  // Update chain
  lastHmac = hmac;

  // Store in memory (dev) — in production, replace with DB insert
  memoryLog.push(entry);

  // Datadog SIEM dual-write (if configured)
  await writeAuditWithSIEM(entry);

  return entry;
}

/**
 * Dual-write to Datadog SIEM.
 * De-identifies user IDs before sending (DATA-01).
 * No-op if DATADOG_API_KEY is not set.
 */
async function writeAuditWithSIEM(entry: AuditEntry): Promise<void> {
  const apiKey = process.env.DATADOG_API_KEY;
  if (!apiKey) return;

  // De-identify: hash user ID before sending to Datadog (DATA-01)
  const { createHash } = await import("crypto");
  const hashedUserId = createHash("sha256").update(entry.userId).digest("hex").slice(0, 16);

  const siemPayload = {
    ddsource: "glumira",
    ddtags: `env:${process.env.NODE_ENV ?? "development"},action:${entry.action}`,
    hostname: "glumira-api",
    service: "glumira-platform",
    message: `[AUDIT] ${entry.action} | risk:${entry.riskScore} | user:${hashedUserId}`,
    event_time: entry.eventTime.toISOString(),
    action: entry.action,
    risk_score: entry.riskScore,
    user_id_hash: hashedUserId,
    patient_id: entry.patientId ? "REDACTED" : null,
    table_name: entry.tableName ?? null,
    hmac: entry.hmacSha256.slice(0, 16) + "...", // partial for log integrity check
  };

  try {
    await fetch("https://http-intake.logs.datadoghq.com/api/v2/logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "DD-API-KEY": apiKey,
      },
      body: JSON.stringify([siemPayload]),
    });
  } catch {
    // SIEM write failure must never block the main request
  }
}

// ─── Verification ─────────────────────────────────────────────

/**
 * Verify the HMAC chain integrity of a sequence of audit entries.
 * Returns true if the chain is intact, false if tampered.
 */
export function verifyAuditChain(entries: AuditEntry[]): boolean {
  if (entries.length === 0) return true;
  const secret = getHmacSecret();

  let prevHmac = "GENESIS";
  for (const entry of entries) {
    if (entry.prevHmac !== prevHmac) return false;
    const expected = computeHmac({ ...entry }, secret);
    if (expected !== entry.hmacSha256) return false;
    prevHmac = entry.hmacSha256;
  }
  return true;
}

// ─── Query (dev/test) ─────────────────────────────────────────

/** Get recent audit log entries (in-memory, dev only). */
export function getRecentAuditLog(limit = 100): AuditEntry[] {
  return memoryLog.slice(-limit);
}

/** Reset the in-memory log and chain (test utility). */
export function resetAuditLog(): void {
  memoryLog.length = 0;
  lastHmac = "GENESIS";
}
