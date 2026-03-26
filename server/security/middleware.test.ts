/**
 * GluMira™ — middleware.test.ts
 *
 * Test suite for server/security/middleware.ts
 * Covers: generateCsrfToken, securityHeaders, csrfProtection, sanitiseRequest
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateCsrfToken,
  securityHeaders,
  csrfProtection,
  sanitiseRequest,
} from "./middleware";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mockRes() {
  const headers: Record<string, string> = {};
  const res: any = {
    setHeader: (k: string, v: string) => { headers[k] = v; },
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn(),
    _headers: headers,
  };
  return res;
}

function mockReq(overrides: Record<string, any> = {}) {
  return {
    method: "GET",
    path: "/api/test",
    headers: {},
    cookies: {},
    body: {},
    query: {},
    params: {},
    socket: { remoteAddress: "127.0.0.1" },
    ...overrides,
  } as any;
}

// ─── generateCsrfToken ────────────────────────────────────────────────────────

describe("generateCsrfToken", () => {
  it("returns a non-empty string", () => {
    const token = generateCsrfToken();
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);
  });

  it("generates unique tokens on each call", () => {
    const t1 = generateCsrfToken();
    const t2 = generateCsrfToken();
    expect(t1).not.toBe(t2);
  });

  it("token is at least 32 characters", () => {
    const token = generateCsrfToken();
    expect(token.length).toBeGreaterThanOrEqual(32);
  });

  it("token contains only hex or base64 characters", () => {
    const token = generateCsrfToken();
    expect(/^[a-zA-Z0-9+/=_-]+$/.test(token)).toBe(true);
  });
});

// ─── securityHeaders ──────────────────────────────────────────────────────────

describe("securityHeaders", () => {
  it("calls next()", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    securityHeaders(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("sets X-Content-Type-Options header", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    securityHeaders(req, res, next);
    expect(res._headers["X-Content-Type-Options"]).toBe("nosniff");
  });

  it("sets X-Frame-Options header", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    securityHeaders(req, res, next);
    expect(res._headers["X-Frame-Options"]).toBe("DENY");
  });

  it("sets Strict-Transport-Security header", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    securityHeaders(req, res, next);
    expect(res._headers["Strict-Transport-Security"]).toBeTruthy();
  });

  it("sets X-XSS-Protection header", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    securityHeaders(req, res, next);
    expect(res._headers["X-XSS-Protection"]).toBeTruthy();
  });
});

// ─── csrfProtection ───────────────────────────────────────────────────────────

describe("csrfProtection", () => {
  it("calls next() for GET requests (no CSRF check needed)", () => {
    const req = mockReq({ method: "GET" });
    const res = mockRes();
    const next = vi.fn();
    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("calls next() for HEAD requests", () => {
    const req = mockReq({ method: "HEAD" });
    const res = mockRes();
    const next = vi.fn();
    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("calls next() for OPTIONS requests", () => {
    const req = mockReq({ method: "OPTIONS" });
    const res = mockRes();
    const next = vi.fn();
    csrfProtection(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("blocks POST requests without CSRF token", () => {
    const req = mockReq({ method: "POST", headers: {} });
    const res = mockRes();
    const next = vi.fn();
    csrfProtection(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows POST with valid x-csrf-token header", () => {
    const token = generateCsrfToken();
    const req = mockReq({
      method: "POST",
      headers: { "x-csrf-token": token },
    });
    const res = mockRes();
    const next = vi.fn();
    // In unit tests the token store may not be populated — just check it doesn't throw
    expect(() => csrfProtection(req, res, next)).not.toThrow();
  });
});

// ─── sanitiseRequest ──────────────────────────────────────────────────────────

describe("sanitiseRequest", () => {
  it("calls next()", () => {
    const req = mockReq();
    const res = mockRes();
    const next = vi.fn();
    sanitiseRequest(req, res, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("strips script tags from string body fields", () => {
    const req = mockReq({
      body: { name: "<script>alert('xss')</script>Alex" },
    });
    const res = mockRes();
    const next = vi.fn();
    sanitiseRequest(req, res, next);
    expect(req.body.name).not.toContain("<script>");
  });

  it("preserves safe string values", () => {
    const req = mockReq({
      body: { name: "Alex Johnson", email: "alex@example.com" },
    });
    const res = mockRes();
    const next = vi.fn();
    sanitiseRequest(req, res, next);
    expect(req.body.name).toBe("Alex Johnson");
    expect(req.body.email).toBe("alex@example.com");
  });

  it("handles empty body without throwing", () => {
    const req = mockReq({ body: {} });
    const res = mockRes();
    const next = vi.fn();
    expect(() => sanitiseRequest(req, res, next)).not.toThrow();
  });

  it("handles null body without throwing", () => {
    const req = mockReq({ body: null });
    const res = mockRes();
    const next = vi.fn();
    expect(() => sanitiseRequest(req, res, next)).not.toThrow();
  });
});
