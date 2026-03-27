/**
 * GluMira™ Unified Data Pipeline — Test Suite
 * Version: 7.0.0
 * Module: INT-UNIFIED-PIPELINE-TEST
 *
 * DISCLAIMER: GluMira™ is an informational tool only. Not a medical device.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { UnifiedDataPipeline, createPipelineFromEnv, type PipelineConfig } from "./unified-data-pipeline";

describe("UnifiedDataPipeline — Construction", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should create a pipeline with default config", () => {
    const pipeline = new UnifiedDataPipeline({ patientId: 1 });
    expect(pipeline).toBeDefined();
  });

  it("should report status correctly when no sources configured", () => {
    delete process.env.DEXCOM_SHARE_USERNAME;
    delete process.env.NIGHTSCOUT_URL;
    const pipeline = new UnifiedDataPipeline({ patientId: 1 });
    const status = pipeline.getStatus();
    expect(status.dexcomConfigured).toBe(false);
    expect(status.nightscoutConfigured).toBe(false);
    expect(status.isRunning).toBe(false);
    expect(status.lastSyncAt).toBeNull();
  });

  it("should detect Dexcom when env vars are set", () => {
    process.env.DEXCOM_SHARE_USERNAME = "testuser";
    process.env.DEXCOM_SHARE_PASSWORD = "testpass";
    const pipeline = new UnifiedDataPipeline({ patientId: 1 });
    const status = pipeline.getStatus();
    expect(status.dexcomConfigured).toBe(true);
  });

  it("should detect Nightscout when env vars are set", () => {
    process.env.NIGHTSCOUT_URL = "https://test.nightscout.me";
    process.env.NIGHTSCOUT_API_SECRET = "testsecret";
    const pipeline = new UnifiedDataPipeline({ patientId: 1 });
    const status = pipeline.getStatus();
    expect(status.nightscoutConfigured).toBe(true);
  });

  it("should respect dexcomEnabled=false override", () => {
    process.env.DEXCOM_SHARE_USERNAME = "testuser";
    process.env.DEXCOM_SHARE_PASSWORD = "testpass";
    const pipeline = new UnifiedDataPipeline({
      patientId: 1,
      dexcomEnabled: false,
    });
    const status = pipeline.getStatus();
    expect(status.dexcomConfigured).toBe(false);
  });

  it("should respect nightscoutEnabled=false override", () => {
    process.env.NIGHTSCOUT_URL = "https://test.nightscout.me";
    const pipeline = new UnifiedDataPipeline({
      patientId: 1,
      nightscoutEnabled: false,
    });
    const status = pipeline.getStatus();
    expect(status.nightscoutConfigured).toBe(false);
  });
});

describe("UnifiedDataPipeline — Sync (No Sources)", () => {
  it("should return zero counts when no sources configured", async () => {
    delete process.env.DEXCOM_SHARE_USERNAME;
    delete process.env.NIGHTSCOUT_URL;
    const pipeline = new UnifiedDataPipeline({ patientId: 1 });
    const result = await pipeline.sync();

    expect(result.dexcom.enabled).toBe(false);
    expect(result.dexcom.readingsCount).toBe(0);
    expect(result.nightscout.enabled).toBe(false);
    expect(result.nightscout.sgvCount).toBe(0);
    expect(result.totalNewReadings).toBe(0);
    expect(result.syncedAt).toBeDefined();
  });
});

describe("UnifiedDataPipeline — Start/Stop", () => {
  it("should start and stop without error", () => {
    const pipeline = new UnifiedDataPipeline({ patientId: 1 });
    pipeline.start();
    expect(pipeline.getStatus().isRunning).toBe(false); // sync completes instantly with no sources
    pipeline.stop();
  });

  it("should be idempotent on multiple start calls", () => {
    const pipeline = new UnifiedDataPipeline({ patientId: 1 });
    pipeline.start();
    pipeline.start(); // Should not create duplicate intervals
    pipeline.stop();
  });

  it("should be safe to stop when not started", () => {
    const pipeline = new UnifiedDataPipeline({ patientId: 1 });
    pipeline.stop(); // Should not throw
  });
});

describe("createPipelineFromEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return null when no sources configured", () => {
    delete process.env.DEXCOM_SHARE_USERNAME;
    delete process.env.DEXCOM_SHARE_PASSWORD;
    delete process.env.NIGHTSCOUT_URL;
    const pipeline = createPipelineFromEnv(1);
    expect(pipeline).toBeNull();
  });

  it("should return pipeline when Dexcom is configured", () => {
    process.env.DEXCOM_SHARE_USERNAME = "testuser";
    process.env.DEXCOM_SHARE_PASSWORD = "testpass";
    const pipeline = createPipelineFromEnv(1);
    expect(pipeline).toBeDefined();
  });

  it("should return pipeline when Nightscout is configured", () => {
    process.env.NIGHTSCOUT_URL = "https://test.nightscout.me";
    const pipeline = createPipelineFromEnv(1);
    expect(pipeline).toBeDefined();
  });
});
