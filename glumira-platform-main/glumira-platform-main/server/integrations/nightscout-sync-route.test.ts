/**
 * GluMira™ — Nightscout Sync Route Test Suite
 *
 * Tests the Express router endpoints for Nightscout integration:
 * POST /test, GET /latest, POST /sync
 *
 * Uses mocked NightscoutClient to avoid real HTTP calls.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mock the nightscout module before importing the router ───────────────────

const mockTestConnection = vi.fn();
const mockGetLatestSGV = vi.fn();
const mockGetSGV = vi.fn();
const mockGetTreatments = vi.fn();
const mockGetDeviceStatus = vi.fn();

vi.mock("./nightscout", () => ({
  NightscoutClient: vi.fn().mockImplementation(() => ({
    testConnection: mockTestConnection,
    getLatestSGV: mockGetLatestSGV,
    getSGV: mockGetSGV,
    getTreatments: mockGetTreatments,
    getDeviceStatus: mockGetDeviceStatus,
  })),
  sgvToGlucoseReading: vi.fn((sgv: any, patientId: number) => ({
    patientId,
    mmol: sgv.sgv / 18.0,
    mgdl: sgv.sgv,
    timestamp: sgv.dateString,
    source: "nightscout",
  })),
  treatmentToInsulinDose: vi.fn((treatment: any, patientId: number) => {
    if (!treatment.insulin || treatment.insulin <= 0) return null;
    return {
      patientId,
      units: treatment.insulin,
      type: treatment.eventType,
      administeredAt: treatment.created_at,
    };
  }),
}));

// ─── Helper: simulate Express req/res ─────────────────────────────────────────

function mockReq(overrides: Partial<{ body: any; query: any }> = {}): any {
  return {
    body: overrides.body ?? {},
    query: overrides.query ?? {},
  };
}

function mockRes(): any {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

// ─── Extract route handlers from the router ───────────────────────────────────

import { nightscoutSyncRouter } from "./nightscout-sync-route";

type RouteHandler = (req: any, res: any) => Promise<any>;

function getHandler(method: string, path: string): RouteHandler {
  const layer = (nightscoutSyncRouter as any).stack.find(
    (l: any) => l.route?.path === path && l.route?.methods[method]
  );
  if (!layer) throw new Error(`No ${method.toUpperCase()} ${path} handler found`);
  return layer.route.stack[0].handle;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /test", () => {
  const handler = getHandler("post", "/test");

  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when baseUrl is missing", async () => {
    const req = mockReq({ body: {} });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "baseUrl is required" });
  });

  it("returns 200 with connection test result on success", async () => {
    mockTestConnection.mockResolvedValue({ success: true, serverTime: "2026-03-26T12:00:00Z" });
    const req = mockReq({ body: { baseUrl: "https://ns.example.com" } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, serverTime: "2026-03-26T12:00:00Z" });
  });

  it("returns 500 when connection test throws", async () => {
    mockTestConnection.mockRejectedValue(new Error("ECONNREFUSED"));
    const req = mockReq({ body: { baseUrl: "https://ns.example.com" } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "ECONNREFUSED" });
  });
});

describe("GET /latest", () => {
  const handler = getHandler("get", "/latest");

  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when baseUrl query param is missing", async () => {
    const req = mockReq({ query: {} });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 404 when no SGV data found", async () => {
    mockGetLatestSGV.mockResolvedValue(null);
    const req = mockReq({ query: { baseUrl: "https://ns.example.com" } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("returns 200 with latest SGV on success", async () => {
    const sgv = { sgv: 120, dateString: "2026-03-26T12:00:00Z", direction: "Flat" };
    mockGetLatestSGV.mockResolvedValue(sgv);
    const req = mockReq({ query: { baseUrl: "https://ns.example.com" } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(sgv);
  });

  it("returns 500 when fetch throws", async () => {
    mockGetLatestSGV.mockRejectedValue(new Error("Timeout"));
    const req = mockReq({ query: { baseUrl: "https://ns.example.com" } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("POST /sync", () => {
  const handler = getHandler("post", "/sync");

  beforeEach(() => vi.clearAllMocks());

  it("returns 400 when patientId is missing", async () => {
    const req = mockReq({ body: { nightscoutConfig: { baseUrl: "https://ns.example.com" } } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 400 when nightscoutConfig.baseUrl is missing", async () => {
    const req = mockReq({ body: { patientId: 1, nightscoutConfig: {} } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("returns 502 when connection test fails", async () => {
    mockTestConnection.mockResolvedValue({ success: false, error: "Unauthorized" });
    const req = mockReq({
      body: { patientId: 1, nightscoutConfig: { baseUrl: "https://ns.example.com" } },
    });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(502);
  });

  it("returns 200 with sync counts on full success", async () => {
    mockTestConnection.mockResolvedValue({ success: true });
    mockGetSGV.mockResolvedValue([
      { _id: "a1", sgv: 120, dateString: "2026-03-26T12:00:00Z" },
      { _id: "a2", sgv: 140, dateString: "2026-03-26T12:05:00Z" },
    ]);
    mockGetTreatments.mockResolvedValue([
      { _id: "t1", insulin: 5, eventType: "Bolus", created_at: "2026-03-26T12:00:00Z" },
      { _id: "t2", insulin: 0, eventType: "Carbs", created_at: "2026-03-26T12:00:00Z" },
    ]);
    mockGetDeviceStatus.mockResolvedValue([{ _id: "d1" }, { _id: "d2" }]);

    const req = mockReq({
      body: { patientId: 1, nightscoutConfig: { baseUrl: "https://ns.example.com" } },
    });
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const result = res.json.mock.calls[0][0];
    expect(result.sgvCount).toBe(2);
    expect(result.treatmentCount).toBe(1); // only 1 has insulin > 0
    expect(result.deviceStatusCount).toBe(2);
    expect(result.syncedAt).toBeDefined();
    expect(result.errors).toEqual([]);
  });

  it("handles SGV fetch failure gracefully", async () => {
    mockTestConnection.mockResolvedValue({ success: true });
    mockGetSGV.mockRejectedValue(new Error("SGV timeout"));
    mockGetTreatments.mockResolvedValue([]);
    mockGetDeviceStatus.mockResolvedValue([]);

    const req = mockReq({
      body: { patientId: 1, nightscoutConfig: { baseUrl: "https://ns.example.com" } },
    });
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    const result = res.json.mock.calls[0][0];
    expect(result.sgvCount).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("respects syncSGV=false option", async () => {
    mockTestConnection.mockResolvedValue({ success: true });
    mockGetTreatments.mockResolvedValue([]);
    mockGetDeviceStatus.mockResolvedValue([]);

    const req = mockReq({
      body: {
        patientId: 1,
        nightscoutConfig: { baseUrl: "https://ns.example.com" },
        options: { syncSGV: false },
      },
    });
    const res = mockRes();
    await handler(req, res);

    expect(mockGetSGV).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("respects syncTreatments=false option", async () => {
    mockTestConnection.mockResolvedValue({ success: true });
    mockGetSGV.mockResolvedValue([]);
    mockGetDeviceStatus.mockResolvedValue([]);

    const req = mockReq({
      body: {
        patientId: 1,
        nightscoutConfig: { baseUrl: "https://ns.example.com" },
        options: { syncTreatments: false },
      },
    });
    const res = mockRes();
    await handler(req, res);

    expect(mockGetTreatments).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("respects syncDeviceStatus=false option", async () => {
    mockTestConnection.mockResolvedValue({ success: true });
    mockGetSGV.mockResolvedValue([]);
    mockGetTreatments.mockResolvedValue([]);

    const req = mockReq({
      body: {
        patientId: 1,
        nightscoutConfig: { baseUrl: "https://ns.example.com" },
        options: { syncDeviceStatus: false },
      },
    });
    const res = mockRes();
    await handler(req, res);

    expect(mockGetDeviceStatus).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});
