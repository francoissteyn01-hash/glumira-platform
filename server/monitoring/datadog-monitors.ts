/**
 * GluMira™ Datadog SIEM Monitor Definitions
 * Version: 7.0.0
 * Module: MONITORING-SIEM
 *
 * Defines all 8 Datadog monitors for the GluMira platform.
 * Monitors cover:
 *   1. Auth anomaly detection (brute force, credential stuffing)
 *   2. PHI access audit (unusual data access patterns)
 *   3. Rate limit breaches (DDoS / abuse detection)
 *   4. API error spike (5xx surge detection)
 *   5. Key rotation failure (missed rotation window)
 *   6. GDPR erase audit (erasure without certificate)
 *   7. IOB calculation anomaly (extreme IOB values)
 *   8. Uptime / health check (service availability)
 *
 * Usage:
 *   import { GLUMIRA_MONITORS, createAllMonitors } from "./datadog-monitors";
 *   await createAllMonitors(datadogApiKey);
 *
 * DISCLAIMER: GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.
 */

// ─── Types ────────────────────────────────────────────────────

export type MonitorType =
  | "metric alert"
  | "log alert"
  | "service check"
  | "event-v2 alert"
  | "query alert";

export type MonitorPriority = 1 | 2 | 3 | 4 | 5; // 1 = Critical, 5 = Info

export interface DatadogMonitorThresholds {
  critical?: number;
  critical_recovery?: number;
  warning?: number;
  warning_recovery?: number;
}

export interface DatadogMonitorOptions {
  notify_no_data?: boolean;
  no_data_timeframe?: number;
  renotify_interval?: number;
  escalation_message?: string;
  include_tags?: boolean;
  require_full_window?: boolean;
  evaluation_delay?: number;
  new_host_delay?: number;
}

export interface DatadogMonitorDefinition {
  id: string;                        // Internal ID (e.g. "MON-01")
  name: string;
  type: MonitorType;
  query: string;
  message: string;
  tags: string[];
  priority: MonitorPriority;
  thresholds: DatadogMonitorThresholds;
  options: DatadogMonitorOptions;
  notify_audit?: boolean;
}

export interface MonitorCreateResult {
  monitorId: string;
  datadogId?: number;
  name: string;
  status: "created" | "updated" | "failed";
  error?: string;
}

// ─── Monitor Definitions ──────────────────────────────────────

export const GLUMIRA_MONITORS: DatadogMonitorDefinition[] = [
  // ── MON-01: Auth Anomaly ──────────────────────────────────
  {
    id: "MON-01",
    name: "GluMira | Auth Anomaly — Brute Force / Credential Stuffing",
    type: "log alert",
    query: `logs("service:glumira @http.status_code:(401 OR 403) @http.url_details.path:/api/auth/*").rollup("count").last("5m") > 20`,
    message: `**GluMira Auth Anomaly Detected**

More than 20 failed authentication attempts in 5 minutes.

**Possible causes:**
- Brute force attack
- Credential stuffing
- Misconfigured client

**Immediate actions:**
1. Check source IP in Datadog Logs
2. Block IP via Cloudflare if confirmed attack
3. Notify security team: @pagerduty-glumira-security

**Context:**
- Service: glumira
- Environment: {{env.name}}
- Triggered at: {{last_triggered_at}}

@pagerduty-glumira-security @slack-glumira-alerts`,
    tags: ["service:glumira", "team:security", "severity:critical", "module:auth"],
    priority: 1,
    thresholds: { critical: 20, warning: 10 },
    options: {
      notify_no_data: false,
      renotify_interval: 60,
      include_tags: true,
    },
  },

  // ── MON-02: PHI Access Audit ──────────────────────────────
  {
    id: "MON-02",
    name: "GluMira | PHI Access — Unusual Data Access Pattern",
    type: "log alert",
    query: `logs("service:glumira @audit.action:(patient.read OR glucose.read OR insulin.read) @audit.risk_score:>70").rollup("count").last("10m") > 50`,
    message: `**GluMira PHI Access Anomaly**

High-risk PHI access events detected (risk score > 70).

**Possible causes:**
- Bulk data export attempt
- Compromised user account
- Insider threat

**Immediate actions:**
1. Review audit log for affected user IDs
2. Suspend suspicious accounts if confirmed
3. Notify DPO: @pagerduty-glumira-dpo

**GDPR Note:** This may constitute a reportable breach under GDPR Article 33.
Breach must be reported to supervisory authority within 72 hours if confirmed.

@pagerduty-glumira-security @pagerduty-glumira-dpo @slack-glumira-alerts`,
    tags: ["service:glumira", "team:security", "severity:critical", "module:phi", "gdpr:true"],
    priority: 1,
    thresholds: { critical: 50, warning: 20 },
    options: {
      notify_no_data: false,
      renotify_interval: 30,
      include_tags: true,
    },
  },

  // ── MON-03: Rate Limit Breaches ───────────────────────────
  {
    id: "MON-03",
    name: "GluMira | Rate Limit — DDoS / Abuse Detection",
    type: "log alert",
    query: `logs("service:glumira @http.status_code:429").rollup("count").last("1m") > 100`,
    message: `**GluMira Rate Limit Breach**

More than 100 rate-limited (429) responses in 1 minute.

**Possible causes:**
- DDoS attack
- Abusive API client
- Misconfigured integration

**Immediate actions:**
1. Identify top offending IPs in Datadog Logs
2. Enable Cloudflare Under Attack mode if DDoS confirmed
3. Review rate limit profiles in server/security/rate-limiter.ts

@pagerduty-glumira-security @slack-glumira-alerts`,
    tags: ["service:glumira", "team:security", "severity:high", "module:rate-limiter"],
    priority: 2,
    thresholds: { critical: 100, warning: 50 },
    options: {
      notify_no_data: false,
      renotify_interval: 15,
      include_tags: true,
    },
  },

  // ── MON-04: API Error Spike ───────────────────────────────
  {
    id: "MON-04",
    name: "GluMira | API Error Spike — 5xx Surge",
    type: "log alert",
    query: `logs("service:glumira @http.status_code:(500 OR 502 OR 503 OR 504)").rollup("count").last("5m") > 10`,
    message: `**GluMira API Error Spike**

More than 10 server errors (5xx) in 5 minutes.

**Possible causes:**
- Database connection failure
- Unhandled exception in API route
- Memory/CPU exhaustion
- Deployment issue

**Immediate actions:**
1. Check Vercel deployment logs
2. Check Supabase connection pool status
3. Roll back last deployment if errors started after deploy

@pagerduty-glumira-oncall @slack-glumira-alerts`,
    tags: ["service:glumira", "team:engineering", "severity:high", "module:api"],
    priority: 2,
    thresholds: { critical: 10, warning: 5 },
    options: {
      notify_no_data: false,
      renotify_interval: 30,
      include_tags: true,
    },
  },

  // ── MON-05: Key Rotation Failure ──────────────────────────
  {
    id: "MON-05",
    name: "GluMira | Key Rotation — Missed Weekly Window",
    type: "log alert",
    query: `logs("service:glumira @audit.action:key.rotate").rollup("count").last("7d") < 1`,
    message: `**GluMira Key Rotation Missed**

PHI encryption key has NOT been rotated in the past 7 days.

**Required action:**
1. Trigger manual key rotation: POST /api/gdpr/rotate-key
2. Verify rotation completes successfully
3. Check cron job configuration in .github/workflows/ci.yml

**Compliance note:** Weekly key rotation is required for HIPAA compliance.

@pagerduty-glumira-security @slack-glumira-alerts`,
    tags: ["service:glumira", "team:security", "severity:high", "module:key-rotation", "hipaa:true"],
    priority: 2,
    thresholds: { critical: 1 },
    options: {
      notify_no_data: true,
      no_data_timeframe: 10080, // 7 days in minutes
      include_tags: true,
    },
  },

  // ── MON-06: GDPR Erase Audit ──────────────────────────────
  {
    id: "MON-06",
    name: "GluMira | GDPR Erase — Erasure Without Certificate",
    type: "log alert",
    query: `logs("service:glumira @audit.action:gdpr.erase -@audit.metadata.certificateId:*").rollup("count").last("1h") > 0`,
    message: `**GluMira GDPR Erasure Without Certificate**

A GDPR erasure event was recorded without a valid certificate ID.

**This is a compliance violation.**

**Immediate actions:**
1. Review the erasure audit entry in Datadog Logs
2. Verify the erasure was authorised
3. Generate a manual certificate if erasure was legitimate
4. Report to DPO if erasure cannot be verified

@pagerduty-glumira-dpo @pagerduty-glumira-security @slack-glumira-alerts`,
    tags: ["service:glumira", "team:security", "severity:critical", "module:gdpr", "gdpr:true"],
    priority: 1,
    thresholds: { critical: 0 },
    options: {
      notify_no_data: false,
      renotify_interval: 60,
      include_tags: true,
    },
  },

  // ── MON-07: IOB Calculation Anomaly ───────────────────────
  {
    id: "MON-07",
    name: "GluMira | IOB Anomaly — Extreme IOB Value Calculated",
    type: "log alert",
    query: `logs("service:glumira @iob.value:>50 OR @iob.value:<0").rollup("count").last("1h") > 5`,
    message: `**GluMira IOB Calculation Anomaly**

More than 5 extreme IOB values (>50 units or <0) calculated in the past hour.

**Possible causes:**
- Data entry error (incorrect dose units)
- U-500/U-200 concentration conversion bug
- IOB engine regression

**Immediate actions:**
1. Review affected patient records
2. Check IOB engine version and test results
3. Do NOT alert patients — this is an internal monitoring alert

**DISCLAIMER:** GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.

@pagerduty-glumira-oncall @slack-glumira-alerts`,
    tags: ["service:glumira", "team:engineering", "severity:high", "module:iob-engine"],
    priority: 2,
    thresholds: { critical: 5, warning: 2 },
    options: {
      notify_no_data: false,
      renotify_interval: 60,
      include_tags: true,
    },
  },

  // ── MON-08: Uptime / Health Check ─────────────────────────
  {
    id: "MON-08",
    name: "GluMira | Uptime — Health Check Failure",
    type: "service check",
    query: `"http.can_connect".over("url:https://glumira.com/api/health","env:production").by("*").last(3).count_by_status()`,
    message: `**GluMira Health Check Failed**

The /api/health endpoint has been unreachable for 3 consecutive checks.

**Immediate actions:**
1. Check Vercel deployment status
2. Check Supabase project status
3. Check DNS and CDN configuration
4. Escalate to on-call engineer if not resolved in 5 minutes

@pagerduty-glumira-oncall @slack-glumira-alerts`,
    tags: ["service:glumira", "team:engineering", "severity:critical", "module:uptime"],
    priority: 1,
    thresholds: { critical: 3 },
    options: {
      notify_no_data: true,
      no_data_timeframe: 10,
      renotify_interval: 5,
      include_tags: true,
    },
  },
];

// ─── Datadog API Client ───────────────────────────────────────

export interface DatadogApiConfig {
  apiKey: string;
  appKey: string;
  site?: string;   // Default: datadoghq.com
}

/**
 * Create a single Datadog monitor via the Datadog API.
 */
export async function createDatadogMonitor(
  monitor: DatadogMonitorDefinition,
  config: DatadogApiConfig
): Promise<MonitorCreateResult> {
  const site = config.site ?? "datadoghq.com";
  const url = `https://api.${site}/api/v1/monitor`;

  const body = {
    name: monitor.name,
    type: monitor.type,
    query: monitor.query,
    message: monitor.message,
    tags: monitor.tags,
    priority: monitor.priority,
    options: {
      ...monitor.options,
      thresholds: monitor.thresholds,
      notify_audit: monitor.notify_audit ?? true,
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "DD-API-KEY": config.apiKey,
        "DD-APPLICATION-KEY": config.appKey,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        monitorId: monitor.id,
        name: monitor.name,
        status: "failed",
        error: `HTTP ${response.status}: ${error}`,
      };
    }

    const data = (await response.json()) as { id: number };
    return {
      monitorId: monitor.id,
      datadogId: data.id,
      name: monitor.name,
      status: "created",
    };
  } catch (err: any) {
    return {
      monitorId: monitor.id,
      name: monitor.name,
      status: "failed",
      error: err.message ?? "Unknown error",
    };
  }
}

/**
 * Create all 8 GluMira monitors in Datadog.
 * Returns results for each monitor.
 */
export async function createAllMonitors(
  config: DatadogApiConfig
): Promise<MonitorCreateResult[]> {
  const results: MonitorCreateResult[] = [];
  for (const monitor of GLUMIRA_MONITORS) {
    const result = await createDatadogMonitor(monitor, config);
    results.push(result);
  }
  return results;
}

// ─── Monitor Summary ──────────────────────────────────────────

export function getMonitorSummary(): string {
  const lines = [
    "GluMira™ Datadog SIEM — Monitor Summary",
    "═".repeat(60),
    "",
  ];
  for (const m of GLUMIRA_MONITORS) {
    const priority = ["", "CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"][m.priority];
    lines.push(`${m.id}  [${priority}]  ${m.name}`);
  }
  lines.push("");
  lines.push(`Total monitors: ${GLUMIRA_MONITORS.length}`);
  return lines.join("\n");
}
