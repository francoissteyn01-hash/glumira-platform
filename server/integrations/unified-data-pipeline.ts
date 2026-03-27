/**
 * GluMira™ Unified Data Pipeline
 * Version: 7.0.0
 * Module: INT-UNIFIED-PIPELINE
 *
 * Orchestrates data ingestion from multiple sources:
 *   1. Dexcom Share Bridge (primary — direct CGM data)
 *   2. Nightscout REST API (secondary — aggregated CGM + treatments)
 *
 * The pipeline runs on a configurable interval (default: every 5 minutes)
 * and de-duplicates readings by timestamp before inserting into the
 * GluMira database.
 *
 * Priority order:
 *   - If Dexcom Share credentials are available, use Dexcom Share as primary
 *   - If Nightscout URL is available, use Nightscout for treatments + fallback SGV
 *   - Both sources can run simultaneously for maximum data coverage
 *
 * DISCLAIMER: GluMira™ is an informational tool only. Not a medical device.
 */

import {
  DexcomShareClient,
  createDexcomShareClientFromEnv,
  dexcomReadingToGlucoseReading,
  type DexcomParsedReading,
} from "./dexcom-share-bridge";

import {
  NightscoutClient,
  createNightscoutClientFromEnv,
  sgvToGlucoseReading,
  treatmentToInsulinDose,
  type NightscoutSGV,
  type NightscoutTreatment,
} from "./nightscout";

// ─── Types ───────────────────────────────────────────────────

export interface PipelineConfig {
  patientId: number;
  syncIntervalMinutes?: number;   // Default: 5
  dexcomEnabled?: boolean;        // Default: true if credentials exist
  nightscoutEnabled?: boolean;    // Default: true if URL exists
  maxReadingsPerSync?: number;    // Default: 12 (1 hour of 5-min readings)
}

export interface PipelineSyncResult {
  dexcom: {
    enabled: boolean;
    readingsCount: number;
    latestValue: number | null;
    latestTrend: string | null;
    error: string | null;
  };
  nightscout: {
    enabled: boolean;
    sgvCount: number;
    treatmentCount: number;
    error: string | null;
  };
  totalNewReadings: number;
  deduplicatedCount: number;
  syncedAt: string;
}

export interface PipelineStatus {
  dexcomConfigured: boolean;
  nightscoutConfigured: boolean;
  lastSyncAt: string | null;
  lastSyncResult: PipelineSyncResult | null;
  isRunning: boolean;
}

// ─── Pipeline ────────────────────────────────────────────────

export class UnifiedDataPipeline {
  private readonly config: Required<PipelineConfig>;
  private dexcomClient: DexcomShareClient | null;
  private nightscoutClient: NightscoutClient | null;
  private lastSyncResult: PipelineSyncResult | null = null;
  private isRunning = false;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;

  constructor(config: PipelineConfig) {
    this.config = {
      patientId: config.patientId,
      syncIntervalMinutes: config.syncIntervalMinutes ?? 5,
      dexcomEnabled: config.dexcomEnabled ?? true,
      nightscoutEnabled: config.nightscoutEnabled ?? true,
      maxReadingsPerSync: config.maxReadingsPerSync ?? 12,
    };

    this.dexcomClient = this.config.dexcomEnabled
      ? createDexcomShareClientFromEnv()
      : null;

    this.nightscoutClient = this.config.nightscoutEnabled
      ? createNightscoutClientFromEnv()
      : null;
  }

  // ── Status ──

  getStatus(): PipelineStatus {
    return {
      dexcomConfigured: this.dexcomClient !== null,
      nightscoutConfigured: this.nightscoutClient !== null,
      lastSyncAt: this.lastSyncResult?.syncedAt ?? null,
      lastSyncResult: this.lastSyncResult,
      isRunning: this.isRunning,
    };
  }

  // ── Single Sync ──

  async sync(): Promise<PipelineSyncResult> {
    this.isRunning = true;
    const result: PipelineSyncResult = {
      dexcom: {
        enabled: this.dexcomClient !== null,
        readingsCount: 0,
        latestValue: null,
        latestTrend: null,
        error: null,
      },
      nightscout: {
        enabled: this.nightscoutClient !== null,
        sgvCount: 0,
        treatmentCount: 0,
        error: null,
      },
      totalNewReadings: 0,
      deduplicatedCount: 0,
      syncedAt: new Date().toISOString(),
    };

    const allTimestamps = new Set<number>();

    // ── Dexcom Share ──
    if (this.dexcomClient) {
      try {
        const readings = await this.dexcomClient.getReadings(
          this.config.syncIntervalMinutes + 5, // Slight overlap for safety
          this.config.maxReadingsPerSync
        );

        for (const reading of readings) {
          const ts = reading.readingTime.getTime();
          if (!allTimestamps.has(ts)) {
            allTimestamps.add(ts);
            const _dbReading = dexcomReadingToGlucoseReading(
              reading,
              this.config.patientId
            );
            // In production: await insertGlucoseReading(dbReading);
            result.dexcom.readingsCount++;
          } else {
            result.deduplicatedCount++;
          }
        }

        if (readings.length > 0) {
          result.dexcom.latestValue = readings[0].glucoseValue;
          result.dexcom.latestTrend = readings[0].trendArrow;
        }
      } catch (err: any) {
        result.dexcom.error = err.message ?? "Dexcom sync failed";
      }
    }

    // ── Nightscout ──
    if (this.nightscoutClient) {
      try {
        // SGV (only if Dexcom didn't already provide readings)
        if (result.dexcom.readingsCount === 0) {
          const sgvEntries = await this.nightscoutClient.getSGV({
            count: this.config.maxReadingsPerSync,
          });

          for (const sgv of sgvEntries) {
            const ts = sgv.date;
            if (!allTimestamps.has(ts)) {
              allTimestamps.add(ts);
              const _dbReading = sgvToGlucoseReading(sgv, this.config.patientId);
              // In production: await insertGlucoseReading(dbReading);
              result.nightscout.sgvCount++;
            } else {
              result.deduplicatedCount++;
            }
          }
        }

        // Treatments (always sync — Dexcom Share doesn't provide these)
        const treatments = await this.nightscoutClient.getTreatments({
          count: 50,
        });

        for (const treatment of treatments) {
          const dose = treatmentToInsulinDose(treatment, this.config.patientId);
          if (dose) {
            // In production: await insertInsulinDose(dose);
            result.nightscout.treatmentCount++;
          }
        }
      } catch (err: any) {
        result.nightscout.error = err.message ?? "Nightscout sync failed";
      }
    }

    result.totalNewReadings =
      result.dexcom.readingsCount + result.nightscout.sgvCount;

    this.lastSyncResult = result;
    this.isRunning = false;
    return result;
  }

  // ── Scheduled Sync ──

  /**
   * Start the automated sync loop.
   * Runs immediately, then every `syncIntervalMinutes`.
   */
  start(): void {
    if (this.intervalHandle) return; // Already running

    // Run immediately
    this.sync().catch(console.error);

    // Then on interval
    this.intervalHandle = setInterval(
      () => this.sync().catch(console.error),
      this.config.syncIntervalMinutes * 60 * 1000
    );
  }

  /**
   * Stop the automated sync loop.
   */
  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    this.isRunning = false;
  }
}

// ─── Factory ─────────────────────────────────────────────────

/**
 * Create a UnifiedDataPipeline from environment variables.
 * Requires at least one data source to be configured.
 */
export function createPipelineFromEnv(patientId: number): UnifiedDataPipeline | null {
  const dexcomClient = createDexcomShareClientFromEnv();
  const nightscoutClient = createNightscoutClientFromEnv();

  if (!dexcomClient && !nightscoutClient) return null;

  return new UnifiedDataPipeline({
    patientId,
    dexcomEnabled: dexcomClient !== null,
    nightscoutEnabled: nightscoutClient !== null,
  });
}
