# GluMira™ V7 — REST API Reference

This document covers the REST endpoints exposed by `server/index.ts`. tRPC
procedures (under `/trpc/*`) are not included here — see
`server/router.ts` for the tRPC schema.

All endpoints listed below require a Supabase JWT in the `Authorization: Bearer
<token>` header **unless explicitly marked as public**. The token is verified
by `requireAuth` middleware (`server/middleware/auth.ts`).

GluMira™ is an educational platform, not a medical device.

---

## Conventions

- Base URL in production: `https://glumira.ai`
- Base URL in development: `http://localhost:3001` (proxied from Vite dev server)
- All response bodies are JSON
- Successful responses include `ok: true`
- Error responses use HTTP status codes (400 / 401 / 403 / 500) and a JSON body
  `{ error: string, details?: object }`
- All glucose values are in **mmol/L** (server-side canonical unit)
- All timestamps are ISO 8601 in UTC

---

## Health

### `GET /health` — *public*

Liveness probe. Returns `{ status: "ok", version, timestamp }`. No auth.

---

## Analytics — `/api/analytics/*`

### `GET /api/analytics/summary`

7-day vs 14-day glucose summary: TIR, GMI, CV, mean, SD, patterns. Used by
`GlucoseVariabilityCard`.

**Query:** `patientId` (optional, clinician viewing a patient)

**Returns:** `{ ok, summary: { sevenDay, fourteenDay, tirDelta, gmiDelta, computedAt } }`

### `GET /api/analytics/insulin-sensitivity`

Per-hour ISF estimates derived from correction-bolus events. Used by
`InsulinSensitivityHeatmap`.

**Query:** `days` (1–60, default 14)

**Returns:** `{ ok, bucketsByHour: HourBucket[24], totalEvents, usedEvents, windowDays, computedAt }`

### `GET /api/analytics/carb-ratio`

Effective ICR vs configured ICR analysis from meal_log + post-meal excursion.
Used by `CarbRatioCard`.

**Query:** `days` (1–60, default 14)

**Returns:** `{ ok, configuredIcr, observedGramsPerUnit, meanRise, meanDelta, recommendation, recommendationText, ... }`

### `GET /api/analytics/basal-evaluation`

Overnight basal stability score (0–10) from glucose drift in the 02:00–06:00
fasting window. Used by `BasalRateCard`.

**Query:** `days` (1–60, default 14)

**Returns:** `{ ok, score, meanDrift, validNights, hypoNights, hyperNights, observations, ... }`

### `POST /api/analytics/regime-comparison`

Side-by-side comparison of glucose outcomes across multiple insulin regime
windows.

**Body:** `{ windows: RegimeWindow[1..6], patientId? }`

---

## Alerts — `/api/alerts/*`

### `GET /api/alerts`

Returns currently active alerts derived from the last 30 minutes of
`glucose_readings` plus the last 6 hours of `insulin_events`. Stateless —
nothing is cached server-side.

**Returns:** `{ ok, alerts: ActiveAlert[], computedAt }`

Alert types:
- `hypo`            — value < 3.9 mmol/L
- `hyper`           — value > 13.9 mmol/L
- `rising_fast`     — +2.2 mmol/L over the last 15 min
- `falling_fast`    — −2.2 mmol/L over the last 15 min
- `stacking`        — ≥3 doses in the last 6h

### `POST /api/alerts/dismiss`

Records a dismissal in `audit_log` (telemetry only — the source of truth
for "what's hidden" lives in client `localStorage`).

**Body:** `{ alertId: string }`

**Returns:** `{ ok: true }`

### `PUT /api/alerts/snooze`

Records a snooze in `audit_log`.

**Body:** `{ alertId: string, untilIso: string }`

**Returns:** `{ ok: true, snoozedUntil }`

### `GET /api/alerts/history`

Paginated list of past dismiss/snooze actions for the current user.

**Query:**
- `limit` (1–200, default 50)
- `action` (`dismiss` | `snooze`, optional)
- `type` (one of the alert types, optional)

**Returns:** `{ ok, entries: HistoryEntry[], total, appliedFilters }`

---

## Compliance — `/api/compliance/*`

### `GET /api/compliance/status`

HIPAA / GDPR / POPIA control status. Each pillar contains an `items` list
with `state ∈ { compliant, in-progress, not-applicable }` and a `summary`.

**Returns:** `{ ok, hipaa, gdpr, popia, computedAt }`

### `GET /api/compliance/audit-log`

Paginated `audit_log` rows for the current user. Used by both
`SecurityAuditLogViewer` and (filtered) `IncidentResponseCard`.

**Query:**
- `limit` (1–200, default 50)
- `action` (string, optional)

**Returns:** `{ ok, entries: AuditEntry[], total }`

### `GET /api/compliance/system-health`

Live server + DB health snapshot. Real metrics from `process.uptime()`,
`process.memoryUsage()`, and a Supabase HEAD ping.

**Returns:** `{ ok, server: { version, uptimeSec, memoryHeapMB, ... }, database: { state, latencyMs, ... }, computedAt }`

---

## Notifications — `/api/notifications`

### `GET /api/notifications?limit=N`

Returns the last N rows from `audit_log` for the current user. Used by
`SyncQueueViewer` to surface `nightscout_sync` events.

**Query:** `limit` (default 20, max 100)

**Returns:** `{ notifications, total, userId }`

### `POST /api/notifications`

Append a generic action row to `audit_log`.

**Body:** `{ action, resourceType?, resourceId?, metadata? }`

---

## Other production endpoints

The following endpoints exist on the server but are documented inline in their
respective route files. Listed here for discovery only:

- `/api/nightscout/sync` — pull glucose from Nightscout
- `/api/cron/nightscout-sync` — protected by `X-Cron-Secret` header
- `/api/meals/*`, `/api/doses/*` — meal and dose CRUD
- `/api/settings`, `/api/profile/*` — user preferences
- `/api/telemetry`, `/api/beta-feedback` — opt-in product telemetry
- `/api/badges/*` — gamification
- `/api/mira/*` — Claude-backed diabetes coach
- `/api/invite/*`, `/api/caregiver/*` — caregiver flows
- `/api/report/export` — data export (used for GDPR portability)
- `/api/school-care-plan` — school care plan PDF generator
- Specialist modules: `/api/adhd`, `/api/autism`, `/api/thyroid`,
  `/api/meal-plan`, `/api/education`, `/api/insulin-log`, `/api/insulin-profiles`

---

## Authentication details

All non-public endpoints require:

```
Authorization: Bearer <supabase-jwt>
```

The middleware verifies the token against `SUPABASE_URL` and `SUPABASE_ANON_KEY`
environment variables and attaches `req.user.id` for downstream handlers.

---

## Rate limits

There is currently no explicit rate limiting at the application layer. Production
traffic is fronted by Netlify which provides DDoS protection at the edge. Adding
per-user rate limits is on the Stage 4.4 backlog.
