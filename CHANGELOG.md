# GluMira™ V7 — Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

GluMira™ is an educational platform, not a medical device.

---

## [Unreleased]

### Stage 4 — Patient analytics, alerts, sync, compliance

#### Added

- **Patient analytics** (Stage 4.2.1–4.2.6)
  - `GlucoseVariabilityCard` — 7-day CV% with stability badge and 14-day TIR delta
  - `InsulinSensitivityHeatmap` — 24-cell hourly ISF map derived from correction-bolus pairings
  - `CarbRatioCard` — configured vs observed ICR with tighten/relax/balanced verdict
  - `BasalRateCard` — overnight basal stability score (0–10) wrapping the existing gauge
  - `AnalyticsDashboardPage` — unified `/dashboard/analytics` route assembling all four
  - Server-side analytics modules: `insulin-sensitivity.ts`, `carb-ratio.ts`, `basal-evaluation.ts`
  - Three new REST endpoints under `/api/analytics/*`

- **Alerts pipeline** (Stage 4.1.5, 4.1.7)
  - `alerts-engine.ts` — pure detection functions (hypo, hyper, fast trend, stacking)
  - `AlertNotificationCenter` — polled live alerts with dismiss/snooze (localStorage backed)
  - `AlertHistoryPage` — paginated, filterable history at `/alerts/history`
  - REST: `GET /api/alerts`, `POST /api/alerts/dismiss`, `PUT /api/alerts/snooze`, `GET /api/alerts/history`
  - 29 unit tests in `alerts-engine.test.ts` (5 detectors + history shaping)

- **Sync & device status** (Stage 4.2.7–4.2.10)
  - `OfflineModePanel` — real-time `navigator.onLine`, localStorage usage, Cache API status
  - `DeviceStatusMonitor` — live probes against `/health`, Nightscout, browser session
  - `SyncQueueViewer` — Nightscout sync history sourced from `audit_log` via existing notifications endpoint
  - `SyncStatusPage` — combined view at `/sync-status`

- **Compliance & performance** (Stage 4.3.1–4.3.8)
  - `CompliancePillarCard` ×3 — HIPAA / GDPR / POPIA control status
  - `SystemHealthCard` — live `/api/compliance/system-health` snapshot (uptime, heap, DB ping)
  - `CoreWebVitalsCard` — LCP / CLS / INP / TTFB measured in-browser via `PerformanceObserver`
  - `IncidentResponseCard` — derived from `audit_log` action prefix
  - `SecurityAuditLogViewer` — paginated audit log table
  - `CompliancePage` — full dashboard at `/compliance`
  - REST: `GET /api/compliance/{status,audit-log,system-health}`

- **Documentation**
  - `ARCHIVE-LOG.md` — append-only log of archive decisions
  - `CHANGELOG.md` — this file
  - `docs/api.md` — REST endpoint reference
  - `docs/deploy-checklist.md` — production deployment runbook
  - `docs/user-guide.md` — patient-facing feature tour

#### Changed

- **Refactor:** Day-6 alert detection extracted from `alerts.route.ts` into pure
  `server/analytics/alerts-engine.ts` so the algorithms are unit-testable without
  Express or Supabase.
- **Alert telemetry storage:** dismiss/snooze actions now store the composite
  `alertId` inside `metadata.alertId` rather than `audit_log.resource_id` (which
  is a `uuid` column and would have rejected the string IDs at runtime).
- **DashboardPage lint cleanup:** removed pre-existing unused imports/locals,
  typed pattern arrays properly, replaced `any` with concrete types.

#### Fixed

- **IOB engine boundary bug** (`server/lib/iob-engine.ts`): `>` → `>=` so IOB
  clamps to 0 at exactly t=duration_minutes (was returning ~0.25U at the
  boundary). Test fixture in `iob-engine.test.ts:97` was the canary.
- **Vitest auto-discovery:** vitest 4.1.3 on Windows wasn't picking up
  `vitest.config.ts` from the project root. Test config moved into the canonical
  `vite.config.ts` `test:` block so a bare `npx vitest run` works without flags.
- **Vitest globals:** added explicit `import { describe, test, expect } from "vitest"`
  to test files that previously relied on the dropped vitest 3.x global injection.

#### Archived

- `glumira-platform/` (V6 Next.js fork duplicate) — silenced from `git status`
  and `vitest`, not deleted. See `ARCHIVE-LOG.md` for the full rationale.
- Three "Auto-ship Week N" stub commits — reverted via `c919def`. The 9
  placeholder files they introduced never had any imports anywhere in the
  codebase. The real Week 4 e2e config (33 lines, jsdom) was preserved.

#### Deferred (Stage 4.1 carry-over)

The original Phase-3 timeline doc included clinician-portal items
(RecommendationsQueue, BulkMessagingPanel, ClinicianNotesPanel, WorkflowMetrics)
which were intentionally descoped during the 2026-04-10 audit when the codebase
went patient-first. These remain on the backlog pending an explicit product
decision on whether to revive the clinician direction or formally cut them.

A `ConflictResolutionModal` was also planned for Stage 4.2 but is not built —
Nightscout sync is one-way pull with no merge step, so there is no conflict
source to render. Will be revisited if/when bidirectional sync lands.

---
