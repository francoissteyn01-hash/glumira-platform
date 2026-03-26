/**
 * GluMira™ Nightscout Integration — Test Suite
 * Version: 7.0.0
 */

import { describe, expect, it } from "vitest";
import {
  NightscoutClient,
  directionToArrow,
  directionToTrend,
  sgvToGlucoseReading,
  treatmentToInsulinDose,
  createNightscoutClientFromEnv,
  type NightscoutSGV,
  type NightscoutTreatment,
  type NightscoutDirection,
} from "./nightscout";

// ─── Fixtures ─────────────────────────────────────────────────

const MOCK_SGV: NightscoutSGV = {
  _id: "sgv-001",
  device: "Dexcom G6",
  date: 1711396800000,
  dateString: "2026-03-25T12:00:00.000Z",
  sgv: 142,
  delta: -2,
  direction: "FortyFiveDown",
  type: "sgv",
};

const MOCK_TREATMENT_BOLUS: NightscoutTreatment = {
  _id: "trt-001",
  eventType: "Bolus",
  created_at: "2026-03-25T12:00:00.000Z",
  insulin: 3.5,
  carbs: 45,
  notes: "Lunch bolus",
};

const MOCK_TREATMENT_CARBS: NightscoutTreatment = {
  _id: "trt-002",
  eventType: "Carb Correction",
  created_at: "2026-03-25T14:00:00.000Z",
  carbs: 15,
};

const MOCK_TREATMENT_TEMP_BASAL: NightscoutTreatment = {
  _id: "trt-003",
  eventType: "Temp Basal",
  created_at: "2026-03-25T10:00:00.000Z",
  insulin: 0.8,
  duration: 30,
  absolute: 0.8,
};

// ─── NightscoutClient constructor ─────────────────────────────

describe("NightscoutClient constructor", () => {
  it("creates a client with baseUrl", () => {
    const client = new NightscoutClient({ baseUrl: "https://test.nightscout.me" });
    expect(client).toBeDefined();
  });

  it("throws if baseUrl is empty", () => {
    expect(() => new NightscoutClient({ baseUrl: "" })).toThrow("baseUrl is required");
  });

  it("strips trailing slash from baseUrl", () => {
    // Indirect test: client should be created without error
    const client = new NightscoutClient({ baseUrl: "https://test.nightscout.me/" });
    expect(client).toBeDefined();
  });

  it("accepts jwtToken as auth method", () => {
    const client = new NightscoutClient({
      baseUrl: "https://test.nightscout.me",
      jwtToken: "my-jwt-token",
    });
    expect(client).toBeDefined();
  });

  it("accepts apiSecret as auth method", () => {
    const client = new NightscoutClient({
      baseUrl: "https://test.nightscout.me",
      apiSecret: "my-api-secret",
    });
    expect(client).toBeDefined();
  });
});

// ─── directionToArrow ─────────────────────────────────────────

describe("directionToArrow", () => {
  const cases: Array<[NightscoutDirection, string]> = [
    ["DoubleUp", "↑↑"],
    ["SingleUp", "↑"],
    ["FortyFiveUp", "↗"],
    ["Flat", "→"],
    ["FortyFiveDown", "↘"],
    ["SingleDown", "↓"],
    ["DoubleDown", "↓↓"],
    ["NOT COMPUTABLE", "?"],
    ["RATE OUT OF RANGE", "⚠"],
    ["NONE", "→"],
  ];

  for (const [direction, arrow] of cases) {
    it(`maps ${direction} to ${arrow}`, () => {
      expect(directionToArrow(direction)).toBe(arrow);
    });
  }

  it("returns → for undefined direction", () => {
    expect(directionToArrow(undefined)).toBe("→");
  });
});

// ─── directionToTrend ─────────────────────────────────────────

describe("directionToTrend", () => {
  it("returns 1 for DoubleUp", () => {
    expect(directionToTrend("DoubleUp")).toBe(1);
  });

  it("returns 4 for Flat", () => {
    expect(directionToTrend("Flat")).toBe(4);
  });

  it("returns 7 for DoubleDown", () => {
    expect(directionToTrend("DoubleDown")).toBe(7);
  });

  it("returns 0 for undefined", () => {
    expect(directionToTrend(undefined)).toBe(0);
  });

  it("returns 0 for NOT COMPUTABLE", () => {
    expect(directionToTrend("NOT COMPUTABLE")).toBe(0);
  });
});

// ─── sgvToGlucoseReading ──────────────────────────────────────

describe("sgvToGlucoseReading", () => {
  it("maps SGV to glucose reading shape", () => {
    const reading = sgvToGlucoseReading(MOCK_SGV, 42);
    expect(reading.patientId).toBe(42);
    expect(reading.glucoseValue).toBe("142");
    expect(reading.glucoseUnit).toBe("mg/dL");
    expect(reading.source).toBe("nightscout");
    expect(reading.trendDirection).toBe("FortyFiveDown");
    expect(reading.trendArrow).toBe("↘");
    expect(reading.readingTime).toBeInstanceOf(Date);
  });

  it("readingTime matches SGV date", () => {
    const reading = sgvToGlucoseReading(MOCK_SGV, 1);
    expect(reading.readingTime.getTime()).toBe(MOCK_SGV.date);
  });

  it("rawData is a valid JSON string", () => {
    const reading = sgvToGlucoseReading(MOCK_SGV, 1);
    expect(() => JSON.parse(reading.rawData)).not.toThrow();
  });

  it("handles SGV without direction", () => {
    const sgv = { ...MOCK_SGV, direction: undefined };
    const reading = sgvToGlucoseReading(sgv, 1);
    expect(reading.trendDirection).toBe("NONE");
    expect(reading.trendArrow).toBe("→");
  });
});

// ─── treatmentToInsulinDose ───────────────────────────────────

describe("treatmentToInsulinDose", () => {
  it("maps bolus treatment to insulin dose", () => {
    const dose = treatmentToInsulinDose(MOCK_TREATMENT_BOLUS, 42);
    expect(dose).not.toBeNull();
    expect(dose!.patientId).toBe(42);
    expect(dose!.amount).toBe("3.5");
    expect(dose!.category).toBe("bolus");
    expect(dose!.source).toBe("nightscout");
    expect(dose!.administeredAt).toBeInstanceOf(Date);
  });

  it("maps temp basal treatment to basal category", () => {
    const dose = treatmentToInsulinDose(MOCK_TREATMENT_TEMP_BASAL, 1);
    expect(dose).not.toBeNull();
    expect(dose!.category).toBe("basal");
  });

  it("returns null for carb-only treatment", () => {
    const dose = treatmentToInsulinDose(MOCK_TREATMENT_CARBS, 1);
    expect(dose).toBeNull();
  });

  it("includes notes when present", () => {
    const dose = treatmentToInsulinDose(MOCK_TREATMENT_BOLUS, 1);
    expect(dose!.notes).toBe("Lunch bolus");
  });

  it("rawData is a valid JSON string", () => {
    const dose = treatmentToInsulinDose(MOCK_TREATMENT_BOLUS, 1);
    expect(() => JSON.parse(dose!.rawData)).not.toThrow();
  });
});

// ─── createNightscoutClientFromEnv ────────────────────────────

describe("createNightscoutClientFromEnv", () => {
  it("returns null when NIGHTSCOUT_URL is not set", () => {
    const originalUrl = process.env.NIGHTSCOUT_URL;
    delete process.env.NIGHTSCOUT_URL;
    const client = createNightscoutClientFromEnv();
    expect(client).toBeNull();
    if (originalUrl) process.env.NIGHTSCOUT_URL = originalUrl;
  });

  it("returns a NightscoutClient when NIGHTSCOUT_URL is set", () => {
    process.env.NIGHTSCOUT_URL = "https://test.nightscout.me";
    const client = createNightscoutClientFromEnv();
    expect(client).toBeInstanceOf(NightscoutClient);
    delete process.env.NIGHTSCOUT_URL;
  });
});
