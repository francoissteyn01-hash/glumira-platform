/**
 * GluMira™ V7 — server/lib/rate-limiter.ts
 *
 * Simple in-memory rate limiter for Express.
 * Referenced by 04.1.43 (glucose-trend route).
 * In production: swap for Redis-backed limiter (upstash/ratelimit).
 * Version: v1.0 · 2026-03-29
 */

import { Request } from "express";

interface RateLimitOptions {
  limit:    number;  // max requests per window
  windowMs: number;  // window size in ms
}

interface RateLimitResult {
  ok:         boolean;
  remaining:  number;
  retryAfter?: number;  // seconds
}

// In-memory store: Map<key, { count, resetAt }>
const store = new Map<string, { count: number; resetAt: number }>();

function getKey(req: Request): string {
  // Use user ID from auth middleware if available, else IP
  const userId = (req as { user?: { id: string } }).user?.id;
  return userId ?? (req.ip ?? "unknown");
}

export function rateLimit(req: Request, opts: RateLimitOptions): RateLimitResult {
  const key  = getKey(req);
  const now  = Date.now();
  const rec  = store.get(key);

  if (!rec || now > rec.resetAt) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs });
    return { ok: true, remaining: opts.limit - 1 };
  }

  rec.count++;
  if (rec.count > opts.limit) {
    const retryAfter = Math.ceil((rec.resetAt - now) / 1000);
    return { ok: false, remaining: 0, retryAfter };
  }

  return { ok: true, remaining: opts.limit - rec.count };
}

// Express middleware factory
export function rateLimitMiddleware(opts: RateLimitOptions) {
  return (req: Request, res: { status: (c: number) => { json: (b: unknown) => void }; setHeader: (k: string, v: string) => void }, next: () => void) => {
    const result = rateLimit(req, opts);
    res.setHeader("X-RateLimit-Remaining", String(result.remaining));
    if (!result.ok) {
      return res.status(429).json({ error: "Too many requests", retryAfter: result.retryAfter });
    }
    return next();
  };
}

/**
 * GluMira™ V7 — server/lib/audit.ts
 *
 * Audit log helper. Writes to audit_log table in Supabase.
 * Referenced by 04.1.43 (glucose-trend route).
 * Version: v1.0 · 2026-03-29
 */

// Inline here so both utilities are in one file for simplicity.
// Split into separate files if the project grows.

interface AuditLogParams {
  userId:   string;
  action:   string;
  metadata?: Record<string, unknown>;
}

// Lazy import to avoid circular dependency with server/index.ts
export async function auditLog(params: AuditLogParams): Promise<void> {
  try {
    const { supabase } = await import("../index");
    await supabase.from("audit_log").insert({
      user_id:       params.userId,
      action:        params.action,
      resource_type: "glucose_readings",
      metadata:      params.metadata ?? {},
    });
  } catch {
    // Audit failures are silent — never break the user flow
  }
}
