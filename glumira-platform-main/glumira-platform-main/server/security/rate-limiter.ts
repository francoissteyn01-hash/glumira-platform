/**
 * GluMira™ Rate Limiter
 * Version: 7.0.0
 * Security: SEC-04 — Upstash Redis sliding window rate limiting
 *
 * Provides configurable rate limit profiles per endpoint category.
 * In production: backed by Upstash Redis (@upstash/ratelimit).
 * In development/test: in-memory sliding window fallback.
 *
 * Profiles:
 *   auth:       5  req / 60s  — login, signup, password reset
 *   api_read:   100 req / 60s — GET endpoints
 *   api_write:  30  req / 60s — POST/PUT/DELETE endpoints
 *   pdf_export: 10  req / 60s — care plan generation
 *   ai_query:   20  req / 60s — Claude pattern analysis
 *   iob_calc:   100 req / 60s — IOB calculations
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

import type { Request, Response, NextFunction } from "express";

// ─── Types ────────────────────────────────────────────────────

export type RateLimitProfile =
  | "auth"
  | "api_read"
  | "api_write"
  | "pdf_export"
  | "ai_query"
  | "iob_calc";

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;       // Unix timestamp (seconds)
  retryAfter?: number;   // seconds until reset (only when blocked)
}

// ─── Profiles ─────────────────────────────────────────────────

export const RATE_LIMIT_PROFILES: Record<RateLimitProfile, RateLimitConfig> = {
  auth:       { maxRequests: 5,   windowSeconds: 60 },
  api_read:   { maxRequests: 100, windowSeconds: 60 },
  api_write:  { maxRequests: 30,  windowSeconds: 60 },
  pdf_export: { maxRequests: 10,  windowSeconds: 60 },
  ai_query:   { maxRequests: 20,  windowSeconds: 60 },
  iob_calc:   { maxRequests: 100, windowSeconds: 60 },
};

// ─── In-Memory Store (dev/test fallback) ──────────────────────

interface WindowEntry {
  timestamps: number[];   // Unix ms
}

const memoryStore = new Map<string, WindowEntry>();

/**
 * Sanitise an identifier key — removes special characters to prevent
 * Redis key injection or log injection attacks.
 */
export function sanitiseIdentifier(key: string): string {
  return key.replace(/[^a-zA-Z0-9._@:-]/g, "_").slice(0, 128);
}

/**
 * In-memory sliding window rate limiter.
 * Used when Redis is not configured (development / unit tests).
 */
function checkMemoryRateLimit(
  identifier: string,
  profile: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const windowMs = profile.windowSeconds * 1000;
  const cutoff = now - windowMs;

  const entry = memoryStore.get(identifier) ?? { timestamps: [] };
  // Evict expired timestamps
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  const allowed = entry.timestamps.length < profile.maxRequests;
  if (allowed) {
    entry.timestamps.push(now);
  }
  memoryStore.set(identifier, entry);

  const resetAt = Math.ceil((entry.timestamps[0] ?? now) / 1000) + profile.windowSeconds;
  const remaining = Math.max(0, profile.maxRequests - entry.timestamps.length);

  return {
    allowed,
    remaining,
    resetAt,
    retryAfter: allowed ? undefined : Math.ceil((resetAt - now / 1000)),
  };
}

// ─── Upstash Redis (production) ───────────────────────────────

let upstashRatelimit: any = null;

async function getUpstashRatelimit(profile: RateLimitConfig) {
  if (upstashRatelimit) return upstashRatelimit;
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) return null;

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({ url: redisUrl, token: redisToken });
    upstashRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(profile.maxRequests, `${profile.windowSeconds}s`),
      analytics: false,
    });
    return upstashRatelimit;
  } catch {
    return null;
  }
}

// ─── Core Check ───────────────────────────────────────────────

/**
 * Check rate limit for a given identifier and profile.
 *
 * @param identifier - Unique key (e.g. IP address, user ID)
 * @param profileName - Rate limit profile to apply
 */
export async function checkRateLimit(
  identifier: string,
  profileName: RateLimitProfile
): Promise<RateLimitResult> {
  const profile = RATE_LIMIT_PROFILES[profileName];
  const safeId = sanitiseIdentifier(`glumira:${profileName}:${identifier}`);

  const limiter = await getUpstashRatelimit(profile);
  if (limiter) {
    try {
      const result = await limiter.limit(safeId);
      return {
        allowed: result.success,
        remaining: result.remaining,
        resetAt: Math.ceil(result.reset / 1000),
        retryAfter: result.success ? undefined : Math.ceil((result.reset - Date.now()) / 1000),
      };
    } catch {
      // Fall through to memory limiter on Redis error
    }
  }

  return checkMemoryRateLimit(safeId, profile);
}

// ─── Express Middleware ───────────────────────────────────────

/**
 * Express middleware factory — applies a named rate limit profile.
 *
 * Usage:
 *   app.use("/api/school-care-plan", rateLimitMiddleware("pdf_export"));
 *   app.use("/api/auth", rateLimitMiddleware("auth"));
 */
export function rateLimitMiddleware(profileName: RateLimitProfile) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() ||
      req.socket.remoteAddress ||
      "unknown";

    const result = await checkRateLimit(identifier, profileName);

    // Set standard rate limit headers
    res.setHeader("X-RateLimit-Limit", RATE_LIMIT_PROFILES[profileName].maxRequests);
    res.setHeader("X-RateLimit-Remaining", result.remaining);
    res.setHeader("X-RateLimit-Reset", result.resetAt);

    if (!result.allowed) {
      res.setHeader("Retry-After", result.retryAfter ?? 60);
      return res.status(429).json({
        error: "Too many requests",
        retryAfter: result.retryAfter ?? 60,
      });
    }

    next();
  };
}
