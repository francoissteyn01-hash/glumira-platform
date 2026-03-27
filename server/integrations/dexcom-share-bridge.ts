/**
 * GluMira™ Dexcom Share Bridge
 * Version: 7.0.0
 * Module: INT-DEXCOM-SHARE
 *
 * Bypasses the official Dexcom Developer API by using the Dexcom Share/Follow
 * protocol — the same mechanism Nightscout's share2nightscout-bridge uses.
 *
 * Flow:
 *   1. Authenticate with Dexcom Share servers using username/password
 *   2. Obtain a session ID
 *   3. Fetch latest glucose readings via the Share API
 *   4. Map readings to GluMira's glucoseReadings schema
 *
 * Supports both US and non-US (international) Dexcom servers.
 *
 * DISCLAIMER: GluMira™ is an informational tool only. Not a medical device.
 * Dexcom Share data is for informational purposes only. Always verify with
 * a calibrated blood glucose meter and consult your diabetes care team.
 */

// ─── Constants ───────────────────────────────────────────────

const DEXCOM_SERVERS = {
  US: "https://share2.dexcom.com/ShareWebServices/Services",
  INTERNATIONAL: "https://shareous1.dexcom.com/ShareWebServices/Services",
} as const;

const DEXCOM_APPLICATION_ID = "d89443d2-327c-4a6f-89e5-496bbb0317db";

const TREND_DESCRIPTIONS: Record<number, string> = {
  0: "NONE",
  1: "DoubleUp",
  2: "SingleUp",
  3: "FortyFiveUp",
  4: "Flat",
  5: "FortyFiveDown",
  6: "SingleDown",
  7: "DoubleDown",
  8: "NOT COMPUTABLE",
  9: "RATE OUT OF RANGE",
};

const TREND_ARROWS: Record<number, string> = {
  0: "→",
  1: "↑↑",
  2: "↑",
  3: "↗",
  4: "→",
  5: "↘",
  6: "↓",
  7: "↓↓",
  8: "?",
  9: "⚠",
};

// ─── Types ───────────────────────────────────────────────────

export type DexcomRegion = "US" | "INTERNATIONAL";

export interface DexcomShareConfig {
  username: string;
  password: string;
  region?: DexcomRegion;
  applicationId?: string;
}

export interface DexcomShareReading {
  DT: string;           // "/Date(1711234567890)/" format
  ST: string;           // "/Date(1711234567890)/" format (system time)
  Trend: number;        // 0-9 trend direction
  Value: number;        // mg/dL glucose value
  WT: string;           // "/Date(1711234567890)/" format (wall time)
}

export interface DexcomParsedReading {
  glucoseValue: number;
  glucoseUnit: "mg/dL";
  readingTime: Date;
  systemTime: Date;
  wallTime: Date;
  trend: number;
  trendDirection: string;
  trendArrow: string;
  source: "dexcom-share";
}

export interface DexcomShareConnectionTest {
  success: boolean;
  sessionId?: string;
  latestReading?: DexcomParsedReading;
  error?: string;
}

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Parse Dexcom's proprietary date format: "/Date(1711234567890)/"
 */
function parseDexcomDate(dateStr: string): Date {
  const match = dateStr.match(/Date\((\d+)\)/);
  if (!match) throw new Error(`Invalid Dexcom date format: ${dateStr}`);
  return new Date(parseInt(match[1], 10));
}

/**
 * Parse a raw Dexcom Share reading into a clean GluMira-compatible shape.
 */
function parseReading(raw: DexcomShareReading): DexcomParsedReading {
  return {
    glucoseValue: raw.Value,
    glucoseUnit: "mg/dL",
    readingTime: parseDexcomDate(raw.DT),
    systemTime: parseDexcomDate(raw.ST),
    wallTime: parseDexcomDate(raw.WT),
    trend: raw.Trend,
    trendDirection: TREND_DESCRIPTIONS[raw.Trend] ?? "NONE",
    trendArrow: TREND_ARROWS[raw.Trend] ?? "→",
    source: "dexcom-share",
  };
}

// ─── Client ──────────────────────────────────────────────────

export class DexcomShareClient {
  private readonly baseUrl: string;
  private readonly username: string;
  private readonly password: string;
  private readonly applicationId: string;
  private sessionId: string | null = null;

  constructor(config: DexcomShareConfig) {
    if (!config.username) throw new Error("DexcomShareClient: username is required");
    if (!config.password) throw new Error("DexcomShareClient: password is required");

    const region = config.region ?? "INTERNATIONAL";
    this.baseUrl = DEXCOM_SERVERS[region];
    this.username = config.username;
    this.password = config.password;
    this.applicationId = config.applicationId ?? DEXCOM_APPLICATION_ID;
  }

  // ── Authentication ──

  /**
   * Authenticate with Dexcom Share and obtain a session ID.
   * The session ID is cached for subsequent requests.
   */
  async authenticate(): Promise<string> {
    const url = `${this.baseUrl}/General/AuthenticatePublisherAccount`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Dexcom Share/3.0.2.11",
      },
      body: JSON.stringify({
        accountName: this.username,
        password: this.password,
        applicationId: this.applicationId,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Dexcom auth failed (HTTP ${res.status}): ${body}`);
    }

    const accountId = (await res.json()) as string;

    // Now get a session ID using the account ID
    const sessionUrl = `${this.baseUrl}/General/LoginPublisherAccountById`;
    const sessionRes = await fetch(sessionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Dexcom Share/3.0.2.11",
      },
      body: JSON.stringify({
        accountId,
        password: this.password,
        applicationId: this.applicationId,
      }),
    });

    if (!sessionRes.ok) {
      const body = await sessionRes.text();
      throw new Error(`Dexcom session login failed (HTTP ${sessionRes.status}): ${body}`);
    }

    this.sessionId = (await sessionRes.json()) as string;
    return this.sessionId;
  }

  /**
   * Ensure we have a valid session, re-authenticating if needed.
   */
  private async ensureSession(): Promise<string> {
    if (!this.sessionId) {
      await this.authenticate();
    }
    return this.sessionId!;
  }

  // ── Data Fetch ──

  /**
   * Fetch the latest glucose readings from Dexcom Share.
   *
   * @param minutes - How many minutes of data to fetch (default: 1440 = 24h)
   * @param maxCount - Maximum number of readings to return (default: 288 = 24h at 5min)
   */
  async getReadings(minutes = 1440, maxCount = 288): Promise<DexcomParsedReading[]> {
    const sessionId = await this.ensureSession();

    const url = `${this.baseUrl}/Publisher/ReadPublisherLatestGlucoseValues` +
      `?sessionId=${sessionId}&minutes=${minutes}&maxCount=${maxCount}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "Dexcom Share/3.0.2.11",
      },
    });

    if (!res.ok) {
      // Session might have expired — retry once
      if (res.status === 500) {
        this.sessionId = null;
        const newSessionId = await this.ensureSession();
        const retryUrl = `${this.baseUrl}/Publisher/ReadPublisherLatestGlucoseValues` +
          `?sessionId=${newSessionId}&minutes=${minutes}&maxCount=${maxCount}`;
        const retryRes = await fetch(retryUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "Dexcom Share/3.0.2.11",
          },
        });
        if (!retryRes.ok) {
          throw new Error(`Dexcom readings fetch failed after retry (HTTP ${retryRes.status})`);
        }
        const retryData = (await retryRes.json()) as DexcomShareReading[];
        return retryData.map(parseReading);
      }
      throw new Error(`Dexcom readings fetch failed (HTTP ${res.status})`);
    }

    const data = (await res.json()) as DexcomShareReading[];
    return data.map(parseReading);
  }

  /**
   * Fetch only the latest single reading.
   */
  async getLatestReading(): Promise<DexcomParsedReading | null> {
    const readings = await this.getReadings(10, 1);
    return readings[0] ?? null;
  }

  /**
   * Test the connection by authenticating and fetching the latest reading.
   */
  async testConnection(): Promise<DexcomShareConnectionTest> {
    try {
      const sessionId = await this.authenticate();
      const latest = await this.getLatestReading();
      return {
        success: true,
        sessionId,
        latestReading: latest ?? undefined,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message ?? "Unknown error",
      };
    }
  }
}

// ─── Factory ─────────────────────────────────────────────────

/**
 * Create a DexcomShareClient from environment variables.
 * DEXCOM_SHARE_USERNAME and DEXCOM_SHARE_PASSWORD must be set.
 * DEXCOM_SHARE_REGION defaults to "INTERNATIONAL".
 */
export function createDexcomShareClientFromEnv(): DexcomShareClient | null {
  const username = process.env.DEXCOM_SHARE_USERNAME;
  const password = process.env.DEXCOM_SHARE_PASSWORD;
  const region = (process.env.DEXCOM_SHARE_REGION ?? "INTERNATIONAL") as DexcomRegion;

  if (!username || !password) return null;

  return new DexcomShareClient({ username, password, region });
}

// ─── GluMira DB Mapping ──────────────────────────────────────

/**
 * Map a parsed Dexcom Share reading to a GluMira glucose reading insert shape.
 * Compatible with the glucoseReadings Drizzle schema.
 */
export function dexcomReadingToGlucoseReading(reading: DexcomParsedReading, patientId: number) {
  return {
    patientId,
    glucoseValue: reading.glucoseValue.toString(),
    glucoseUnit: "mg/dL" as const,
    readingType: "cgm" as const,
    cgmSource: "Dexcom Share",
    timestamp: reading.readingTime,
    notes: `Trend: ${reading.trendArrow} ${reading.trendDirection}`,
  };
}
