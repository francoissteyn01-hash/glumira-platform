/**
 * GluMira™ Nightscout Integration Client
 * Version: 7.0.0
 * Module: INT-NIGHTSCOUT
 *
 * Provides a typed client for the Nightscout REST API v3.
 * Supports:
 *   - SGV (sensor glucose values) fetch
 *   - Treatments fetch (insulin, carbs, notes)
 *   - Device status fetch (pump, CGM battery)
 *   - Profile fetch (basal rates, ISF, CR)
 *   - Bi-directional sync to GluMira database
 *
 * Authentication: API_SECRET (SHA1 hash) or JWT bearer token.
 *
 * DISCLAIMER: GluMira™ is an informational tool only. Not a medical device.
 * Nightscout data is for informational purposes only. Always verify with
 * a calibrated blood glucose meter and consult your diabetes care team.
 */

import { createHash } from "crypto";

// ─── Types ────────────────────────────────────────────────────

export interface NightscoutConfig {
  baseUrl: string;         // e.g. "https://mysite.nightscout.me"
  apiSecret?: string;      // Plain-text API_SECRET (will be SHA1-hashed)
  jwtToken?: string;       // JWT bearer token (alternative to apiSecret)
  timeoutMs?: number;      // Request timeout in ms (default: 10000)
}

export interface NightscoutSGV {
  _id: string;
  device?: string;
  date: number;            // Unix ms
  dateString: string;      // ISO string
  sgv: number;             // mg/dL
  delta?: number;
  direction?: NightscoutDirection;
  type: "sgv";
  filtered?: number;
  unfiltered?: number;
  rssi?: number;
  noise?: number;
  sysTime?: string;
  utcOffset?: number;
}

export type NightscoutDirection =
  | "NONE"
  | "DoubleUp"
  | "SingleUp"
  | "FortyFiveUp"
  | "Flat"
  | "FortyFiveDown"
  | "SingleDown"
  | "DoubleDown"
  | "NOT COMPUTABLE"
  | "RATE OUT OF RANGE";

export interface NightscoutTreatment {
  _id: string;
  eventType: string;       // "Bolus", "Carb Correction", "Temp Basal", etc.
  created_at: string;      // ISO string
  timestamp?: string;
  glucose?: number;        // mg/dL
  glucoseType?: string;
  carbs?: number;          // grams
  protein?: number;
  fat?: number;
  insulin?: number;        // units
  units?: string;
  duration?: number;       // minutes
  absolute?: number;       // U/hr for temp basal
  percent?: number;
  notes?: string;
  enteredBy?: string;
  device?: string;
}

export interface NightscoutDeviceStatus {
  _id: string;
  device?: string;
  created_at: string;
  pump?: {
    clock: string;
    battery: { status: string; voltage?: number };
    reservoir: number;
    status: { bolusing: boolean; suspended: boolean; timestamp: string };
    extended?: Record<string, unknown>;
  };
  uploader?: {
    battery: number;
    name?: string;
  };
  openaps?: Record<string, unknown>;
  loop?: Record<string, unknown>;
}

export interface NightscoutProfile {
  _id: string;
  defaultProfile: string;
  store: Record<string, NightscoutProfileStore>;
  startDate: string;
  created_at: string;
}

export interface NightscoutProfileStore {
  dia: number;             // Duration of insulin action (hours)
  carbratio: Array<{ time: string; value: number; timeAsSeconds: number }>;
  sens: Array<{ time: string; value: number; timeAsSeconds: number }>;
  basal: Array<{ time: string; value: number; timeAsSeconds: number }>;
  target_low: Array<{ time: string; value: number; timeAsSeconds: number }>;
  target_high: Array<{ time: string; value: number; timeAsSeconds: number }>;
  units: "mg/dl" | "mmol";
  timezone?: string;
}

export interface NightscoutSyncResult {
  sgvCount: number;
  treatmentCount: number;
  deviceStatusCount: number;
  syncedAt: string;
  errors: string[];
}

export interface NightscoutConnectionTest {
  success: boolean;
  version?: string;
  status?: string;
  error?: string;
}

// ─── Direction Helpers ────────────────────────────────────────

export function directionToArrow(direction?: NightscoutDirection): string {
  const arrows: Record<NightscoutDirection, string> = {
    NONE:                "→",
    DoubleUp:            "↑↑",
    SingleUp:            "↑",
    FortyFiveUp:         "↗",
    Flat:                "→",
    FortyFiveDown:       "↘",
    SingleDown:          "↓",
    DoubleDown:          "↓↓",
    "NOT COMPUTABLE":    "?",
    "RATE OUT OF RANGE": "⚠",
  };
  return direction ? (arrows[direction] ?? "→") : "→";
}

export function directionToTrend(direction?: NightscoutDirection): number {
  const trends: Record<NightscoutDirection, number> = {
    NONE:                0,
    DoubleUp:            1,
    SingleUp:            2,
    FortyFiveUp:         3,
    Flat:                4,
    FortyFiveDown:       5,
    SingleDown:          6,
    DoubleDown:          7,
    "NOT COMPUTABLE":    0,
    "RATE OUT OF RANGE": 0,
  };
  return direction ? (trends[direction] ?? 0) : 0;
}

// ─── Client ───────────────────────────────────────────────────

export class NightscoutClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly timeoutMs: number;

  constructor(config: NightscoutConfig) {
    if (!config.baseUrl) throw new Error("NightscoutClient: baseUrl is required");

    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.timeoutMs = config.timeoutMs ?? 10_000;

    if (config.jwtToken) {
      this.authHeader = `Bearer ${config.jwtToken}`;
    } else if (config.apiSecret) {
      const hashed = createHash("sha1").update(config.apiSecret).digest("hex");
      this.authHeader = hashed;
    } else {
      this.authHeader = "";
    }
  }

  // ── HTTP ──

  private async fetch<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url.toString(), {
        headers: {
          "api-secret": this.authHeader,
          "Accept": "application/json",
        },
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Nightscout HTTP ${res.status}: ${res.statusText}`);
      }

      return (await res.json()) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  // ── Connection Test ──

  /**
   * Test connectivity to the Nightscout instance.
   * Returns version and status if successful.
   */
  async testConnection(): Promise<NightscoutConnectionTest> {
    try {
      const status = await this.fetch<{ status: string; version: string; apiEnabled: boolean }>(
        "/api/v1/status.json"
      );
      return {
        success: true,
        version: status.version,
        status: status.status,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message ?? "Unknown error",
      };
    }
  }

  // ── SGV ──

  /**
   * Fetch sensor glucose values.
   *
   * @param count - Number of entries to fetch (default: 288 = 24h at 5min intervals)
   * @param fromDate - Start date (ISO string)
   * @param toDate - End date (ISO string)
   */
  async getSGV(options?: {
    count?: number;
    fromDate?: string;
    toDate?: string;
  }): Promise<NightscoutSGV[]> {
    const params: Record<string, string> = {
      count: String(options?.count ?? 288),
    };
    if (options?.fromDate) params["find[dateString][$gte]"] = options.fromDate;
    if (options?.toDate) params["find[dateString][$lte]"] = options.toDate;

    return this.fetch<NightscoutSGV[]>("/api/v1/entries/sgv.json", params);
  }

  /**
   * Fetch the latest SGV reading.
   */
  async getLatestSGV(): Promise<NightscoutSGV | null> {
    const entries = await this.getSGV({ count: 1 });
    return entries[0] ?? null;
  }

  // ── Treatments ──

  /**
   * Fetch treatments (insulin doses, carb entries, notes).
   *
   * @param count - Number of treatments to fetch (default: 100)
   * @param eventType - Filter by event type (e.g. "Bolus", "Carb Correction")
   */
  async getTreatments(options?: {
    count?: number;
    eventType?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<NightscoutTreatment[]> {
    const params: Record<string, string> = {
      count: String(options?.count ?? 100),
    };
    if (options?.eventType) params["find[eventType]"] = options.eventType;
    if (options?.fromDate) params["find[created_at][$gte]"] = options.fromDate;
    if (options?.toDate) params["find[created_at][$lte]"] = options.toDate;

    return this.fetch<NightscoutTreatment[]>("/api/v1/treatments.json", params);
  }

  // ── Device Status ──

  /**
   * Fetch device status (pump battery, reservoir, CGM status).
   *
   * @param count - Number of entries to fetch (default: 1)
   */
  async getDeviceStatus(count = 1): Promise<NightscoutDeviceStatus[]> {
    return this.fetch<NightscoutDeviceStatus[]>("/api/v1/devicestatus.json", {
      count: String(count),
    });
  }

  // ── Profile ──

  /**
   * Fetch the active Nightscout profile (basal rates, ISF, CR, targets).
   */
  async getProfile(): Promise<NightscoutProfile[]> {
    return this.fetch<NightscoutProfile[]>("/api/v1/profile.json");
  }

  /**
   * Get the active profile store from the profile response.
   */
  async getActiveProfileStore(): Promise<NightscoutProfileStore | null> {
    const profiles = await this.getProfile();
    if (!profiles.length) return null;
    const profile = profiles[0];
    return profile.store[profile.defaultProfile] ?? null;
  }
}

// ─── Factory ──────────────────────────────────────────────────

/**
 * Create a NightscoutClient from environment variables.
 * NIGHTSCOUT_URL and NIGHTSCOUT_API_SECRET must be set.
 */
export function createNightscoutClientFromEnv(): NightscoutClient | null {
  const url = process.env.NIGHTSCOUT_URL;
  const secret = process.env.NIGHTSCOUT_API_SECRET;
  const jwt = process.env.NIGHTSCOUT_JWT_TOKEN;

  if (!url) return null;

  return new NightscoutClient({
    baseUrl: url,
    apiSecret: secret,
    jwtToken: jwt,
  });
}

// ─── Sync Utilities ───────────────────────────────────────────

/**
 * Map a Nightscout SGV to a GluMira glucose reading insert shape.
 */
export function sgvToGlucoseReading(sgv: NightscoutSGV, patientId: number) {
  return {
    patientId,
    glucoseValue: sgv.sgv.toString(),
    glucoseUnit: "mg/dL" as const,
    readingTime: new Date(sgv.date),
    source: "nightscout" as const,
    trendDirection: sgv.direction ?? "NONE",
    trendArrow: directionToArrow(sgv.direction),
    rawData: JSON.stringify(sgv),
  };
}

/**
 * Map a Nightscout treatment to a GluMira insulin dose insert shape.
 * Returns null if the treatment is not an insulin dose.
 */
export function treatmentToInsulinDose(
  treatment: NightscoutTreatment,
  patientId: number
) {
  if (!treatment.insulin) return null;
  return {
    patientId,
    amount: treatment.insulin.toString(),
    insulinType: "rapid" as const,   // Nightscout doesn't always specify — default to rapid
    category: (treatment.eventType === "Temp Basal" ? "basal" : "bolus") as "bolus" | "basal",
    administeredAt: new Date(treatment.created_at),
    source: "nightscout" as const,
    notes: treatment.notes,
    rawData: JSON.stringify(treatment),
  };
}
