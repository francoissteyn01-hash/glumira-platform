import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DISCLAIMER } from "@/lib/constants";

/* ─── GluMira™ V7 — Block 79: API Documentation ─────────────────────── */

type HttpMethod = "GET" | "POST" | "PUT";

interface Endpoint {
  method: HttpMethod;
  path: string;
  description: string;
  requestBody?: string;
  responseExample: string;
}

interface EndpointCategory {
  name: string;
  endpoints: Endpoint[];
}

const METHOD_COLORS: Record<HttpMethod, { bg: string; fg: string }> = {
  GET: { bg: "#10b98122", fg: "#10b981" },
  POST: { bg: "#3b82f622", fg: "#3b82f6" },
  PUT: { bg: "#f59e0b22", fg: "#f59e0b" },
};

const API_CATEGORIES: EndpointCategory[] = [
  {
    name: "Glucose",
    endpoints: [
      {
        method: "GET",
        path: "/trpc/glucoseLog.getByDate",
        description: "Get glucose readings for a date",
        responseExample: `{
  "result": {
    "data": [
      {
        "id": "uuid",
        "value": 6.2,
        "unit": "mmol/L",
        "timestamp": "2026-04-08T08:30:00Z",
        "source": "manual"
      }
    ]
  }
}`,
      },
      {
        method: "GET",
        path: "/trpc/glucoseLog.getByDateRange",
        description: "Get readings for date range",
        responseExample: `{
  "result": {
    "data": {
      "readings": [...],
      "stats": {
        "mean": 7.1,
        "timeInRange": 72,
        "stdDev": 1.8
      }
    }
  }
}`,
      },
      {
        method: "POST",
        path: "/trpc/glucoseLog.create",
        description: "Log a glucose reading",
        requestBody: `{
  "value": 6.2,
  "unit": "mmol/L",
  "timestamp": "2026-04-08T08:30:00Z",
  "source": "manual",
  "notes": "Before breakfast"
}`,
        responseExample: `{
  "result": {
    "data": {
      "id": "uuid",
      "value": 6.2,
      "created": true
    }
  }
}`,
      },
    ],
  },
  {
    name: "Insulin",
    endpoints: [
      {
        method: "GET",
        path: "/trpc/insulinEvent.getByDateRange",
        description: "Get insulin events",
        responseExample: `{
  "result": {
    "data": [
      {
        "id": "uuid",
        "units": 4.5,
        "insulinType": "novorapid",
        "category": "bolus",
        "timestamp": "2026-04-08T12:00:00Z"
      }
    ]
  }
}`,
      },
      {
        method: "POST",
        path: "/trpc/insulinEvent.create",
        description: "Log an insulin event",
        requestBody: `{
  "units": 4.5,
  "insulinType": "novorapid",
  "category": "bolus",
  "timestamp": "2026-04-08T12:00:00Z"
}`,
        responseExample: `{
  "result": {
    "data": {
      "id": "uuid",
      "units": 4.5,
      "created": true
    }
  }
}`,
      },
    ],
  },
  {
    name: "IOB Hunter\u2122",
    endpoints: [
      {
        method: "GET",
        path: "/trpc/iobHunter.calculateIOB",
        description: "Calculate current insulin on board",
        responseExample: `{
  "result": {
    "data": {
      "totalIOB": 2.3,
      "activeEvents": 2,
      "decayCurve": [...],
      "stackingRisk": "low",
      "estimatedClearTime": "2026-04-08T16:30:00Z"
    }
  }
}`,
      },
      {
        method: "GET",
        path: "/trpc/iobHunter.getStackingCurve",
        description: "Get stacking curve data",
        responseExample: `{
  "result": {
    "data": {
      "curves": [...],
      "peakIOB": 4.1,
      "peakTime": "2026-04-08T13:15:00Z",
      "stackingDetected": false
    }
  }
}`,
      },
    ],
  },
  {
    name: "Meals",
    endpoints: [
      {
        method: "GET",
        path: "/trpc/mealLog.getByDate",
        description: "Get meal entries",
        responseExample: `{
  "result": {
    "data": [
      {
        "id": "uuid",
        "name": "Lunch",
        "carbs": 45,
        "regime": "standard",
        "timestamp": "2026-04-08T12:00:00Z"
      }
    ]
  }
}`,
      },
      {
        method: "POST",
        path: "/trpc/mealLog.create",
        description: "Log a meal",
        requestBody: `{
  "name": "Lunch",
  "carbs": 45,
  "protein": 22,
  "fat": 12,
  "regime": "standard",
  "timestamp": "2026-04-08T12:00:00Z"
}`,
        responseExample: `{
  "result": {
    "data": {
      "id": "uuid",
      "name": "Lunch",
      "created": true
    }
  }
}`,
      },
    ],
  },
  {
    name: "Patterns",
    endpoints: [
      {
        method: "GET",
        path: "/trpc/patterns.analyse",
        description: "Run pattern analysis",
        responseExample: `{
  "result": {
    "data": {
      "patterns": [
        {
          "type": "dawn_phenomenon",
          "confidence": 0.87,
          "description": "Consistent rise between 04:00-07:00",
          "suggestion": "Consider basal adjustment"
        }
      ],
      "period": "7d"
    }
  }
}`,
      },
    ],
  },
  {
    name: "Nightscout",
    endpoints: [
      {
        method: "POST",
        path: "/api/nightscout/sync",
        description: "Sync Nightscout data",
        requestBody: `{
  "nightscoutUrl": "https://my-ns.herokuapp.com",
  "apiSecret": "sha1-hash",
  "syncPeriod": "24h"
}`,
        responseExample: `{
  "synced": true,
  "entriesImported": 288,
  "treatmentsImported": 12,
  "lastSync": "2026-04-08T09:00:00Z"
}`,
      },
    ],
  },
  {
    name: "Profile",
    endpoints: [
      {
        method: "GET",
        path: "/api/profile",
        description: "Get user profile",
        responseExample: `{
  "id": "uuid",
  "email": "user@example.com",
  "displayName": "Alex",
  "diabetesType": "type1",
  "diagnosisYear": 2018,
  "insulinRegime": "MDI",
  "units": "mmol/L",
  "plan": "pro"
}`,
      },
      {
        method: "PUT",
        path: "/api/profile",
        description: "Update profile",
        requestBody: `{
  "displayName": "Alex",
  "insulinRegime": "pump",
  "units": "mmol/L"
}`,
        responseExample: `{
  "id": "uuid",
  "updated": true
}`,
      },
    ],
  },
  {
    name: "Reports",
    endpoints: [
      {
        method: "GET",
        path: "/api/report",
        description: "Generate clinical report",
        responseExample: `{
  "reportId": "uuid",
  "period": "14d",
  "generatedAt": "2026-04-08T09:00:00Z",
  "summary": {
    "avgGlucose": 7.2,
    "timeInRange": 71,
    "gmi": 6.8,
    "hypoEvents": 3,
    "totalReadings": 420
  },
  "downloadUrl": "/api/report/uuid/pdf"
}`,
      },
    ],
  },
];

export default function APIDocumentationPage() {
  const { user } = useAuth();
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);

  const toggleEndpoint = (key: string) => {
    setExpandedEndpoint((prev) => (prev === key ? null : key));
  };

  const card: React.CSSProperties = {
    background: "var(--bg-card)",
    border: "1px solid var(--border-light)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  };

  const sectionTitle: React.CSSProperties = {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.125rem",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: 12,
  };

  const codeBlock: React.CSSProperties = {
    background: "#0d1b3e",
    color: "#e2e8f0",
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: "0.75rem",
    lineHeight: 1.6,
    padding: 16,
    borderRadius: 8,
    overflowX: "auto",
    whiteSpace: "pre",
    margin: 0,
  };

  const metaLabel: React.CSSProperties = {
    fontSize: "0.6875rem",
    fontWeight: 600,
    color: "var(--text-faint)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  };

  const methodBadge = (method: HttpMethod): React.CSSProperties => ({
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: 4,
    fontSize: "0.6875rem",
    fontWeight: 700,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    background: METHOD_COLORS[method].bg,
    color: METHOD_COLORS[method].fg,
    border: `1px solid ${METHOD_COLORS[method].fg}44`,
    minWidth: 40,
    textAlign: "center",
  });

  const authBadge: React.CSSProperties = {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 999,
    fontSize: "0.5625rem",
    fontWeight: 600,
    background: "#f59e0b22",
    color: "#f59e0b",
    border: "1px solid #f59e0b33",
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>

        {/* ── Header ───────────────────────────────────────────────── */}
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
            GluMira™ API Documentation
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
            Developer reference for platform integrations
          </p>
        </div>

        {/* ── Authentication ───────────────────────────────────────── */}
        <div style={card}>
          <h2 style={sectionTitle}>Authentication</h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.6 }}>
            All API requests require a Bearer token obtained via Supabase auth.
            Include the token in every request header.
          </p>
          <pre style={codeBlock}>{`Authorization: Bearer <access_token>`}</pre>
          <p style={{ fontSize: "0.75rem", color: "var(--text-faint)", marginTop: 10, lineHeight: 1.5 }}>
            Tokens are issued on login via <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6875rem" }}>supabase.auth.signInWithPassword()</code> and
            expire after 1 hour. Use the refresh token to obtain a new access token.
          </p>
        </div>

        {/* ── Versioning ───────────────────────────────────────────── */}
        <div style={card}>
          <h2 style={sectionTitle}>Versioning</h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            API v1 — all endpoints are prefixed with the current base URL. No version prefix is required at this time.
            Breaking changes will be communicated via the developer changelog with a minimum 90-day deprecation window.
          </p>
        </div>

        {/* ── Rate Limiting ────────────────────────────────────────── */}
        <div style={card}>
          <h2 style={sectionTitle}>Rate Limiting</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 8, background: "#f59e0b22",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.125rem", color: "#f59e0b", flexShrink: 0,
            }}>
              &#9888;
            </div>
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
                100 requests per minute per user
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                Exceeding the rate limit returns HTTP 429. Implement exponential backoff. The
                <code style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "0.6875rem" }}> X-RateLimit-Remaining</code> header
                indicates remaining quota.
              </p>
            </div>
          </div>
        </div>

        {/* ── Endpoints Reference ──────────────────────────────────── */}
        <h2 style={{ ...sectionTitle, fontSize: "1.25rem", marginBottom: 16 }}>Endpoints Reference</h2>

        {API_CATEGORIES.map((cat) => (
          <div key={cat.name} style={{ marginBottom: 20 }}>
            <h3 style={{
              fontSize: "0.875rem", fontWeight: 700, color: "var(--text-primary)",
              marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid var(--border-light)",
            }}>
              {cat.name}
            </h3>

            {cat.endpoints.map((ep) => {
              const key = `${ep.method}-${ep.path}`;
              const isExpanded = expandedEndpoint === key;

              return (
                <div key={key} style={{
                  ...card,
                  marginBottom: 8,
                  cursor: "pointer",
                  transition: "border-color 0.15s ease",
                  borderColor: isExpanded ? METHOD_COLORS[ep.method].fg + "66" : "var(--border-light)",
                }}>
                  {/* Endpoint header row */}
                  <div
                    onClick={() => toggleEndpoint(key)}
                    style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}
                  >
                    <span style={methodBadge(ep.method)}>{ep.method}</span>
                    <code style={{
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      flex: 1,
                    }}>
                      {ep.path}
                    </code>
                    <span style={authBadge}>Auth Required</span>
                    <span style={{
                      fontSize: "0.75rem",
                      color: "var(--text-faint)",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.15s ease",
                    }}>
                      &#9660;
                    </span>
                  </div>

                  <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: 6, marginBottom: 0 }}>
                    {ep.description}
                  </p>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{ marginTop: 14 }}>
                      {ep.requestBody && (
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ ...metaLabel, marginBottom: 6 }}>Request Body</div>
                          <pre style={codeBlock}>{ep.requestBody}</pre>
                        </div>
                      )}
                      <div>
                        <div style={{ ...metaLabel, marginBottom: 6 }}>Response</div>
                        <pre style={codeBlock}>{ep.responseExample}</pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* ── SDKs ─────────────────────────────────────────────────── */}
        <div style={card}>
          <h2 style={sectionTitle}>SDKs</h2>
          <div style={{
            background: "var(--bg-primary)", borderRadius: 8, padding: 16,
            border: "1px dashed var(--border-light)", textAlign: "center",
          }}>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
              TypeScript SDK — Coming Soon
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-faint)", lineHeight: 1.5 }}>
              A fully typed TypeScript SDK is under development. It will provide auto-completion,
              request validation, and response typing for all endpoints listed above.
            </p>
            <pre style={{ ...codeBlock, marginTop: 12, textAlign: "left" }}>{`// Coming Q3 2026
import { GluMiraClient } from "@glumira/sdk";

const client = new GluMiraClient({
  accessToken: "<your_token>",
});

const readings = await client.glucose.getByDate("2026-04-08");
const iob = await client.iobHunter.calculateIOB();`}</pre>
          </div>
        </div>

        {/* ── Webhooks ─────────────────────────────────────────────── */}
        <div style={card}>
          <h2 style={sectionTitle}>Webhooks</h2>
          <div style={{
            background: "var(--bg-primary)", borderRadius: 8, padding: 16,
            border: "1px dashed var(--border-light)", textAlign: "center",
          }}>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>
              Webhook Support — Coming Soon
            </p>
            <p style={{ fontSize: "0.75rem", color: "var(--text-faint)", lineHeight: 1.5 }}>
              Subscribe to real-time events such as glucose alerts, insulin reminders,
              and pattern detections. Webhooks will deliver JSON payloads via HTTP POST
              to your registered callback URL with HMAC-SHA256 signature verification.
            </p>
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {["glucose.alert", "insulin.reminder", "pattern.detected", "report.generated", "nightscout.synced"].map((evt) => (
                <span key={evt} style={{
                  padding: "4px 10px", borderRadius: 4, fontSize: "0.6875rem", fontWeight: 600,
                  fontFamily: "'JetBrains Mono', monospace",
                  background: "#0d1b3e", color: "#94a3b8",
                }}>{evt}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Support ──────────────────────────────────────────────── */}
        <div style={card}>
          <h2 style={sectionTitle}>Support</h2>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: 8, lineHeight: 1.6 }}>
            For API access requests, integration support, or to report issues:
          </p>
          <a
            href="mailto:api@glumira.ai"
            style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#0ea5e9", textDecoration: "none" }}
          >
            api@glumira.ai
          </a>
        </div>

        {/* ── Disclaimer ───────────────────────────────────────────── */}
        <p style={{ fontSize: "0.625rem", color: "var(--text-faint)", textAlign: "center", lineHeight: 1.5, marginTop: 24 }}>
          {DISCLAIMER}
        </p>
      </div>
    </div>
  );
}
