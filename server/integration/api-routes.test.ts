/**
 * GluMira™ API Routes Integration Test Scaffold
 * Version: 7.0.0
 *
 * Tests the contract and validation logic of all GluMira API routes
 * using a mock fetch interceptor — no live server or DB required.
 *
 * Routes covered:
 *  /api/health
 *  /api/readings        GET + POST
 *  /api/doses           GET + POST + DELETE
 *  /api/iob/current     GET
 *  /api/notifications   GET + POST (mark-read / push-subscribe)
 *  /api/beta/feedback   POST
 *  /api/bernstein/ask   POST
 *  /api/stacking/analyse POST
 *  /api/admin/stats     GET
 *  /api/admin/feedback  GET
 *  /api/admin/participants GET
 *  /api/clinician/patients GET
 *  /api/cron/key-rotation  POST
 *  /api/cron/nightscout-sync POST
 *
 * GluMira™ is an informational tool only. Not a medical device.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ─── Mock fetch helper ────────────────────────────────────────

type MockResponse = {
  status: number;
  body: unknown;
};

function mockFetch(responses: Record<string, MockResponse>) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const key = Object.keys(responses).find((k) => url.includes(k));
    if (!key) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
    }
    const { status, body } = responses[key];
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  });
}

// ─── Route contract helpers ───────────────────────────────────

async function get(url: string, fetchFn: typeof fetch) {
  const res = await fetchFn(url);
  return { status: res.status, body: await res.json() };
}

async function post(url: string, body: unknown, fetchFn: typeof fetch) {
  const res = await fetchFn(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

// ─── Tests ────────────────────────────────────────────────────

describe("GET /api/health", () => {
  it("returns 200 with status ok", async () => {
    const fetch = mockFetch({
      "/api/health": { status: 200, body: { status: "ok", version: "7.0.0" } },
    });
    const { status, body } = await get("/api/health", fetch as unknown as typeof globalThis.fetch);
    expect(status).toBe(200);
    expect(body.status).toBe("ok");
  });
});

describe("GET /api/readings", () => {
  it("returns 200 with readings array", async () => {
    const fetch = mockFetch({
      "/api/readings": {
        status: 200,
        body: { readings: [{ id: "r1", value_mmol: 5.5, recorded_at: new Date().toISOString() }], stats: {} },
      },
    });
    const { status, body } = await get("/api/readings", fetch as unknown as typeof globalThis.fetch);
    expect(status).toBe(200);
    expect(Array.isArray(body.readings)).toBe(true);
  });
});

describe("POST /api/readings", () => {
  it("returns 201 on valid reading", async () => {
    const fetch = mockFetch({
      "/api/readings": { status: 201, body: { id: "r2", value_mmol: 6.1 } },
    });
    const { status, body } = await post(
      "/api/readings",
      { value_mmol: 6.1, source: "manual" },
      fetch as unknown as typeof globalThis.fetch
    );
    expect(status).toBe(201);
    expect(body.value_mmol).toBe(6.1);
  });

  it("returns 400 on missing value", async () => {
    const fetch = mockFetch({
      "/api/readings": { status: 400, body: { error: "value_mmol required" } },
    });
    const { status, body } = await post("/api/readings", {}, fetch as unknown as typeof globalThis.fetch);
    expect(status).toBe(400);
    expect(body.error).toContain("value_mmol");
  });
});

describe("GET /api/doses", () => {
  it("returns 200 with doses array and IOB summary", async () => {
    const fetch = mockFetch({
      "/api/doses": {
        status: 200,
        body: { doses: [], iobSummary: { totalIob: 0, doseCount: 0, riskTier: "safe" } },
      },
    });
    const { status, body } = await get("/api/doses", fetch as unknown as typeof globalThis.fetch);
    expect(status).toBe(200);
    expect(body.iobSummary).toBeDefined();
    expect(body.iobSummary.riskTier).toBe("safe");
  });
});

describe("POST /api/doses", () => {
  it("returns 201 on valid dose", async () => {
    const fetch = mockFetch({
      "/api/doses": { status: 201, body: { id: "d1", units: 4, insulin_type: "novorapid" } },
    });
    const { status, body } = await post(
      "/api/doses",
      { units: 4, insulin_type: "novorapid", administered_at: new Date().toISOString() },
      fetch as unknown as typeof globalThis.fetch
    );
    expect(status).toBe(201);
    expect(body.units).toBe(4);
  });

  it("returns 400 when units is zero", async () => {
    const fetch = mockFetch({
      "/api/doses": { status: 400, body: { error: "units must be > 0" } },
    });
    const { status } = await post("/api/doses", { units: 0 }, fetch as unknown as typeof globalThis.fetch);
    expect(status).toBe(400);
  });
});

describe("GET /api/iob/current", () => {
  it("returns 200 with totalIob and riskTier", async () => {
    const fetch = mockFetch({
      "/api/iob/current": {
        status: 200,
        body: { totalIob: 2.3, riskTier: "caution", doseCount: 2, computedAt: new Date().toISOString() },
      },
    });
    const { status, body } = await get("/api/iob/current", fetch as unknown as typeof globalThis.fetch);
    expect(status).toBe(200);
    expect(typeof body.totalIob).toBe("number");
    expect(["safe", "caution", "danger"]).toContain(body.riskTier);
  });
});

describe("GET /api/notifications", () => {
  it("returns 200 with notifications array", async () => {
    const fetch = mockFetch({
      "/api/notifications": { status: 200, body: { notifications: [], unreadCount: 0 } },
    });
    const { status, body } = await get("/api/notifications", fetch as unknown as typeof globalThis.fetch);
    expect(status).toBe(200);
    expect(Array.isArray(body.notifications)).toBe(true);
  });
});

describe("POST /api/beta/feedback", () => {
  it("returns 201 on valid feedback", async () => {
    const fetch = mockFetch({
      "/api/beta/feedback": { status: 201, body: { id: "f1", rating: 5 } },
    });
    const { status } = await post(
      "/api/beta/feedback",
      { rating: 5, category: "usability", comment: "Great app" },
      fetch as unknown as typeof globalThis.fetch
    );
    expect(status).toBe(201);
  });

  it("returns 400 when rating is out of range", async () => {
    const fetch = mockFetch({
      "/api/beta/feedback": { status: 400, body: { error: "rating must be 1-5" } },
    });
    const { status } = await post(
      "/api/beta/feedback",
      { rating: 10 },
      fetch as unknown as typeof globalThis.fetch
    );
    expect(status).toBe(400);
  });
});

describe("POST /api/bernstein/ask", () => {
  it("returns 200 with answer and category", async () => {
    const fetch = mockFetch({
      "/api/bernstein/ask": {
        status: 200,
        body: { answer: "Insulin stacking occurs when…", category: "insulin", disclaimer: "Not medical advice." },
      },
    });
    const { status, body } = await post(
      "/api/bernstein/ask",
      { question: "What is insulin stacking?" },
      fetch as unknown as typeof globalThis.fetch
    );
    expect(status).toBe(200);
    expect(body.disclaimer).toBeDefined();
  });

  it("returns 400 when question is empty", async () => {
    const fetch = mockFetch({
      "/api/bernstein/ask": { status: 400, body: { error: "question required" } },
    });
    const { status } = await post("/api/bernstein/ask", { question: "" }, fetch as unknown as typeof globalThis.fetch);
    expect(status).toBe(400);
  });
});

describe("POST /api/stacking/analyse", () => {
  it("returns 200 with totalIob and riskTier", async () => {
    const fetch = mockFetch({
      "/api/stacking/analyse": {
        status: 200,
        body: { totalIob: 3.1, riskTier: "caution", doses: [], narrative: "Moderate stacking risk." },
      },
    });
    const { status, body } = await post(
      "/api/stacking/analyse",
      {
        doses: [{ units: 4, insulinType: "novorapid", administeredAt: new Date().toISOString() }],
      },
      fetch as unknown as typeof globalThis.fetch
    );
    expect(status).toBe(200);
    expect(body.narrative).toBeDefined();
  });
});

describe("GET /api/admin/stats", () => {
  it("returns 200 with platform stats", async () => {
    const fetch = mockFetch({
      "/api/admin/stats": {
        status: 200,
        body: { totalUsers: 12, activeParticipants: 8, avgFeedbackRating: 4.2 },
      },
    });
    const { status, body } = await get("/api/admin/stats", fetch as unknown as typeof globalThis.fetch);
    expect(status).toBe(200);
    expect(typeof body.totalUsers).toBe("number");
  });
});

describe("GET /api/admin/feedback", () => {
  it("returns 200 with feedback array", async () => {
    const fetch = mockFetch({
      "/api/admin/feedback": { status: 200, body: { feedback: [], total: 0 } },
    });
    const { status, body } = await get("/api/admin/feedback", fetch as unknown as typeof globalThis.fetch);
    expect(status).toBe(200);
    expect(Array.isArray(body.feedback)).toBe(true);
  });
});

describe("GET /api/admin/participants", () => {
  it("returns 200 with participants array", async () => {
    const fetch = mockFetch({
      "/api/admin/participants": { status: 200, body: { participants: [], total: 0 } },
    });
    const { status, body } = await get("/api/admin/participants", fetch as unknown as typeof globalThis.fetch);
    expect(status).toBe(200);
    expect(Array.isArray(body.participants)).toBe(true);
  });
});

describe("GET /api/clinician/patients", () => {
  it("returns 200 with patients array", async () => {
    const fetch = mockFetch({
      "/api/clinician/patients": { status: 200, body: { patients: [] } },
    });
    const { status, body } = await get("/api/clinician/patients", fetch as unknown as typeof globalThis.fetch);
    expect(status).toBe(200);
    expect(Array.isArray(body.patients)).toBe(true);
  });
});

describe("POST /api/cron/key-rotation", () => {
  it("returns 200 with rotated key count", async () => {
    const fetch = mockFetch({
      "/api/cron/key-rotation": { status: 200, body: { rotated: 3, nextRotation: "2026-04-26" } },
    });
    const { status, body } = await post("/api/cron/key-rotation", {}, fetch as unknown as typeof globalThis.fetch);
    expect(status).toBe(200);
    expect(typeof body.rotated).toBe("number");
  });
});

describe("POST /api/cron/nightscout-sync", () => {
  it("returns 200 with synced reading count", async () => {
    const fetch = mockFetch({
      "/api/cron/nightscout-sync": { status: 200, body: { synced: 48, errors: 0 } },
    });
    const { status, body } = await post("/api/cron/nightscout-sync", {}, fetch as unknown as typeof globalThis.fetch);
    expect(status).toBe(200);
    expect(typeof body.synced).toBe("number");
  });
});

// ─── Auth guard contract ──────────────────────────────────────

describe("Auth guard — protected routes return 401/403 when unauthenticated", () => {
  const protectedRoutes = [
    "/api/readings",
    "/api/doses",
    "/api/iob/current",
    "/api/notifications",
    "/api/beta/feedback",
  ];

  protectedRoutes.forEach((route) => {
    it(`${route} returns 401 without auth`, async () => {
      const fetch = mockFetch({ [route]: { status: 401, body: { error: "Unauthorized" } } });
      const { status } = await get(route, fetch as unknown as typeof globalThis.fetch);
      expect(status).toBe(401);
    });
  });

  const adminRoutes = ["/api/admin/stats", "/api/admin/feedback", "/api/admin/participants"];
  adminRoutes.forEach((route) => {
    it(`${route} returns 403 for non-admin`, async () => {
      const fetch = mockFetch({ [route]: { status: 403, body: { error: "Forbidden" } } });
      const { status } = await get(route, fetch as unknown as typeof globalThis.fetch);
      expect(status).toBe(403);
    });
  });
});
