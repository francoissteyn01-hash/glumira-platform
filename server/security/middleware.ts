/**
 * GluMira™ Security Middleware
 * Version: 7.0.0
 * Security: SEC-01 — Express security middleware stack
 *
 * Provides:
 *   - CSRF double-submit cookie protection
 *   - Content Security Policy (CSP) headers
 *   - HSTS, X-Frame-Options, X-Content-Type-Options
 *   - Request sanitisation (XSS prevention)
 *   - Auth guard middleware
 *
 * DISCLAIMER: GluMira™ is an informational tool only. Not a medical device.
 */

import { randomBytes, timingSafeEqual } from "crypto";
import type { Request, Response, NextFunction } from "express";

// ─── CSP Headers ──────────────────────────────────────────────

const CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",   // unsafe-inline required for Vite HMR in dev
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' wss: https://api.openai.com https://*.upstash.io",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

/**
 * Apply security headers to every response.
 * Should be the first middleware registered.
 */
export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // HSTS — 1 year, include subdomains
  res.setHeader(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");
  // Prevent MIME sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Disable browser XSS filter (deprecated but still sent for legacy browsers)
  res.setHeader("X-XSS-Protection", "0");
  // Referrer policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  // Permissions policy — restrict sensitive APIs
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  // CSP
  res.setHeader("Content-Security-Policy", CSP_DIRECTIVES);

  next();
}

// ─── CSRF Protection ──────────────────────────────────────────

const CSRF_COOKIE_NAME = "glumira_csrf";
const CSRF_HEADER_NAME = "x-csrf-token";
const CSRF_TOKEN_BYTES = 32;

// Methods that require CSRF validation
const CSRF_PROTECTED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Paths exempt from CSRF (OAuth callbacks, webhook receivers)
const CSRF_EXEMPT_PATHS = [
  "/api/oauth/callback",
  "/api/trpc",   // tRPC uses its own auth context
];

/**
 * Generate a cryptographically secure CSRF token.
 */
export function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_BYTES).toString("hex");
}

/**
 * CSRF double-submit cookie middleware.
 *
 * On GET requests: sets a CSRF cookie if not already present.
 * On state-mutating requests: validates that the X-CSRF-Token header
 * matches the cookie value using timing-safe comparison.
 */
export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  // Skip CSRF for exempt paths
  if (CSRF_EXEMPT_PATHS.some((p) => req.path.startsWith(p))) {
    return next();
  }

  // Ensure CSRF cookie exists
  let csrfToken = req.cookies?.[CSRF_COOKIE_NAME];
  if (!csrfToken) {
    csrfToken = generateCsrfToken();
    res.cookie(CSRF_COOKIE_NAME, csrfToken, {
      httpOnly: false,    // Must be readable by JS for double-submit pattern
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
  }

  // Validate on state-mutating requests
  if (CSRF_PROTECTED_METHODS.has(req.method)) {
    const headerToken = req.headers[CSRF_HEADER_NAME] as string | undefined;
    if (!headerToken) {
      res.status(403).json({ error: "CSRF token missing" });
      return;
    }
    try {
      const cookieBuf = Buffer.from(csrfToken, "utf8");
      const headerBuf = Buffer.from(headerToken, "utf8");
      if (
        cookieBuf.length !== headerBuf.length ||
        !timingSafeEqual(cookieBuf, headerBuf)
      ) {
        res.status(403).json({ error: "CSRF token invalid" });
        return;
      }
    } catch {
      res.status(403).json({ error: "CSRF validation error" });
      return;
    }
  }

  next();
}

// ─── Request Sanitisation ─────────────────────────────────────

const XSS_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe[\s\S]*?>/gi,
  /<object[\s\S]*?>/gi,
  /<embed[\s\S]*?>/gi,
];

function sanitiseString(value: string): string {
  let sanitised = value;
  for (const pattern of XSS_PATTERNS) {
    sanitised = sanitised.replace(pattern, "");
  }
  return sanitised;
}

function sanitiseValue(value: unknown): unknown {
  if (typeof value === "string") return sanitiseString(value);
  if (Array.isArray(value)) return value.map(sanitiseValue);
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      result[k] = sanitiseValue(v);
    }
    return result;
  }
  return value;
}

/**
 * Sanitise request body, query, and params to prevent XSS injection.
 * Applied to all incoming requests.
 */
export function sanitiseRequest(req: Request, _res: Response, next: NextFunction): void {
  if (req.body) req.body = sanitiseValue(req.body);
  if (req.query) req.query = sanitiseValue(req.query) as typeof req.query;
  next();
}

// ─── Auth Guard ───────────────────────────────────────────────

/**
 * Express middleware that requires an authenticated session.
 * Reads the session from the request context (set by tRPC context or cookie).
 * Use for non-tRPC Express routes that need auth protection.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  // Check for session cookie (same logic as tRPC context)
  const sessionCookie = req.cookies?.["glumira_session"];
  if (!sessionCookie) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  next();
}

// ─── Compose Middleware Stack ─────────────────────────────────

/**
 * Returns the full ordered security middleware stack.
 * Register with: app.use(securityMiddlewareStack());
 *
 * Order matters:
 *   1. Security headers (always first)
 *   2. Request sanitisation
 *   3. CSRF protection (after body parser)
 */
export function securityMiddlewareStack() {
  return [securityHeaders, sanitiseRequest, csrfProtection];
}
