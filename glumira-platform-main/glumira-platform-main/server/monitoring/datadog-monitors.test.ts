/**
 * GluMira™ Datadog SIEM Monitors — Test Suite
 * Version: 7.0.0
 */

import { describe, expect, it } from "vitest";
import {
  GLUMIRA_MONITORS,
  getMonitorSummary,
  type DatadogMonitorDefinition,
  type MonitorPriority,
} from "./datadog-monitors";

// ─── Monitor Definitions ──────────────────────────────────────

describe("GLUMIRA_MONITORS", () => {
  it("defines exactly 8 monitors", () => {
    expect(GLUMIRA_MONITORS).toHaveLength(8);
  });

  it("all monitors have unique IDs", () => {
    const ids = GLUMIRA_MONITORS.map((m) => m.id);
    expect(new Set(ids).size).toBe(8);
  });

  it("all monitors have unique names", () => {
    const names = GLUMIRA_MONITORS.map((m) => m.name);
    expect(new Set(names).size).toBe(8);
  });

  it("all monitors have IDs in MON-0N format", () => {
    for (const m of GLUMIRA_MONITORS) {
      expect(m.id).toMatch(/^MON-0[1-9]$/);
    }
  });

  it("all monitors have non-empty queries", () => {
    for (const m of GLUMIRA_MONITORS) {
      expect(m.query.length).toBeGreaterThan(10);
    }
  });

  it("all monitors have non-empty messages", () => {
    for (const m of GLUMIRA_MONITORS) {
      expect(m.message.length).toBeGreaterThan(20);
    }
  });

  it("all monitors have at least 3 tags", () => {
    for (const m of GLUMIRA_MONITORS) {
      expect(m.tags.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("all monitors have service:glumira tag", () => {
    for (const m of GLUMIRA_MONITORS) {
      expect(m.tags).toContain("service:glumira");
    }
  });

  it("all monitors have valid priority (1-5)", () => {
    const validPriorities: MonitorPriority[] = [1, 2, 3, 4, 5];
    for (const m of GLUMIRA_MONITORS) {
      expect(validPriorities).toContain(m.priority);
    }
  });

  it("all monitors have at least one threshold defined", () => {
    for (const m of GLUMIRA_MONITORS) {
      const hasThreshold =
        m.thresholds.critical !== undefined ||
        m.thresholds.warning !== undefined;
      expect(hasThreshold).toBe(true);
    }
  });

  it("all monitor messages contain @slack-glumira-alerts", () => {
    for (const m of GLUMIRA_MONITORS) {
      expect(m.message).toContain("@slack-glumira-alerts");
    }
  });

  it("all monitor messages contain PagerDuty routing", () => {
    for (const m of GLUMIRA_MONITORS) {
      expect(m.message).toContain("@pagerduty-glumira");
    }
  });
});

// ─── Individual Monitor Checks ────────────────────────────────

describe("MON-01 Auth Anomaly", () => {
  const mon = GLUMIRA_MONITORS.find((m) => m.id === "MON-01")!;

  it("is defined", () => expect(mon).toBeDefined());
  it("is priority 1 (Critical)", () => expect(mon.priority).toBe(1));
  it("is a log alert", () => expect(mon.type).toBe("log alert"));
  it("has critical threshold of 20", () => expect(mon.thresholds.critical).toBe(20));
  it("has warning threshold of 10", () => expect(mon.thresholds.warning).toBe(10));
  it("query targets /api/auth/* path", () => expect(mon.query).toContain("/api/auth/"));
  it("has module:auth tag", () => expect(mon.tags).toContain("module:auth"));
});

describe("MON-02 PHI Access", () => {
  const mon = GLUMIRA_MONITORS.find((m) => m.id === "MON-02")!;

  it("is defined", () => expect(mon).toBeDefined());
  it("is priority 1 (Critical)", () => expect(mon.priority).toBe(1));
  it("has gdpr:true tag", () => expect(mon.tags).toContain("gdpr:true"));
  it("message mentions GDPR Article 33", () => expect(mon.message).toContain("Article 33"));
  it("routes to DPO pagerduty", () => expect(mon.message).toContain("pagerduty-glumira-dpo"));
});

describe("MON-05 Key Rotation", () => {
  const mon = GLUMIRA_MONITORS.find((m) => m.id === "MON-05")!;

  it("is defined", () => expect(mon).toBeDefined());
  it("has hipaa:true tag", () => expect(mon.tags).toContain("hipaa:true"));
  it("has notify_no_data enabled", () => expect(mon.options.notify_no_data).toBe(true));
  it("no_data_timeframe is 7 days (10080 minutes)", () =>
    expect(mon.options.no_data_timeframe).toBe(10080));
});

describe("MON-06 GDPR Erase", () => {
  const mon = GLUMIRA_MONITORS.find((m) => m.id === "MON-06")!;

  it("is defined", () => expect(mon).toBeDefined());
  it("is priority 1 (Critical)", () => expect(mon.priority).toBe(1));
  it("has gdpr:true tag", () => expect(mon.tags).toContain("gdpr:true"));
  it("routes to DPO pagerduty", () => expect(mon.message).toContain("pagerduty-glumira-dpo"));
});

describe("MON-07 IOB Anomaly", () => {
  const mon = GLUMIRA_MONITORS.find((m) => m.id === "MON-07")!;

  it("is defined", () => expect(mon).toBeDefined());
  it("query checks for IOB > 50 or < 0", () => {
    expect(mon.query).toContain(">50");
    expect(mon.query).toContain("<0");
  });
  it("message includes DISCLAIMER", () => expect(mon.message).toContain("DISCLAIMER"));
  it("message says not to alert patients", () =>
    expect(mon.message).toContain("Do NOT alert patients"));
});

describe("MON-08 Uptime", () => {
  const mon = GLUMIRA_MONITORS.find((m) => m.id === "MON-08")!;

  it("is defined", () => expect(mon).toBeDefined());
  it("is a service check", () => expect(mon.type).toBe("service check"));
  it("is priority 1 (Critical)", () => expect(mon.priority).toBe(1));
  it("has notify_no_data enabled", () => expect(mon.options.notify_no_data).toBe(true));
  it("renotify_interval is 5 minutes", () => expect(mon.options.renotify_interval).toBe(5));
});

// ─── getMonitorSummary ────────────────────────────────────────

describe("getMonitorSummary", () => {
  it("returns a non-empty string", () => {
    const summary = getMonitorSummary();
    expect(typeof summary).toBe("string");
    expect(summary.length).toBeGreaterThan(100);
  });

  it("includes all 8 monitor IDs", () => {
    const summary = getMonitorSummary();
    for (let i = 1; i <= 8; i++) {
      expect(summary).toContain(`MON-0${i}`);
    }
  });

  it("includes total monitor count", () => {
    const summary = getMonitorSummary();
    expect(summary).toContain("Total monitors: 8");
  });

  it("includes GluMira branding", () => {
    const summary = getMonitorSummary();
    expect(summary).toContain("GluMira");
  });
});
