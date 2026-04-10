# GluMira™ V7 — Production Deployment Checklist

Use this runbook for every promotion to `glumira.ai`. The platform is hosted
on Netlify (frontend) and Railway (Express API), backed by Supabase Postgres.

GluMira™ is an educational platform, not a medical device.

---

## Pre-flight (run on the local working tree)

- [ ] `git status` is clean (or all dirty files are intentional and committed)
- [ ] On `main` branch: `git rev-parse --abbrev-ref HEAD` returns `main`
- [ ] Pulled latest: `git pull --ff-only origin main`
- [ ] **Type-check passes**: `npx tsc --noEmit` exits 0
- [ ] **Unit tests pass**: `npx vitest run` exits 0
  - Expected: 9+ test files, 200+ tests, 0 failures
  - If new failures appear, do NOT deploy — investigate the diff
- [ ] **ESLint passes**: `npx eslint .` returns no warnings or errors
- [ ] **Bundle build**: `npm run build:client` succeeds
  - Output goes to `dist/client/`
  - Watch for unexpected bundle size increases (>10% over previous deploy)
- [ ] **Server build**: `npm run build:server` succeeds
- [ ] Smoke-test locally: `npm run dev` then visit `http://localhost:5173`,
  log in, hit Dashboard / Analytics / Alerts / Compliance / Sync Status

## Environment variables

Verify all of the following are set in **both** Netlify (frontend) and
Railway (backend) before promoting:

### Netlify (frontend, `VITE_*` prefixed)

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_API_URL` (points at the Railway API URL in production, empty in dev)

### Railway (backend)

- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (server uses this for admin operations)
- [ ] `ANTHROPIC_API_KEY` (Mira AI chat)
- [ ] `CRON_SECRET` (protects `/api/cron/nightscout-sync`)
- [ ] `PORT` (default 3001)
- [ ] `NODE_ENV=production`

## Database

- [ ] All Drizzle migrations in `drizzle/` and `server/db/` are applied to the
  production Supabase project
- [ ] Row-level security policies are enabled on every patient-data table
  (see `server/db/20260405_rls_all_tables.sql`)
- [ ] `audit_log` table exists and is writable by the service role
- [ ] `glucose_readings`, `insulin_events`, `meal_log`, `patient_profiles`,
  `user_profiles` all exist

## Deployment

1. [ ] Push to `main`:
   ```
   git push origin main
   ```
2. [ ] Netlify auto-deploys frontend on push (watch the Netlify dashboard)
3. [ ] Railway auto-deploys backend on push (watch the Railway dashboard)
4. [ ] Verify deploy logs are clean (no build errors, no missing env vars)

## Post-deploy smoke tests

Run these against `https://glumira.ai`:

- [ ] `GET /health` returns `{ status: "ok", version: "7.0.0" }`
- [ ] Sign in with a test account loads `/dashboard` without errors
- [ ] Dashboard shows live glucose data (or "no readings" empty state for new user)
- [ ] `/dashboard/analytics` loads all four cards without errors
- [ ] `/alerts/history` returns a (possibly empty) table
- [ ] `/sync-status` shows GluMira API as **ok** (green)
- [ ] `/compliance` loads HIPAA / GDPR / POPIA pillars and System Health
- [ ] No console errors in the browser DevTools

## Rollback

If anything is broken in production:

1. **Frontend rollback:** Netlify dashboard → Deploys → previous successful
   deploy → "Publish deploy"
2. **Backend rollback:** Railway dashboard → Deployments → previous successful
   deploy → "Redeploy"
3. **Both:** `git revert <bad-commit-sha>` and push, letting CI redeploy

Never `git push --force` to `main`.

## Monitoring (post-launch)

- [ ] Watch Netlify "Functions" tab for 5xx spikes
- [ ] Watch Railway "Logs" for stack traces
- [ ] Watch Supabase "Logs Explorer" for failed queries
- [ ] Sentry will be wired in via the untracked `server/sentry.server.ts` /
  `src/sentry.client.ts` (Stage 4.4 follow-up)

---

## Known untracked infrastructure

The following are present on disk but not yet committed (deliberate, pending
provenance review):

- `.husky/` — pre-commit hooks
- `eslint.config.mjs` — flat ESLint config
- `.lintstagedrc.json`
- `e2e/` — Playwright/Vitest e2e harness directory
- `server/sentry.server.ts`, `src/sentry.client.ts` — Sentry init
- `.github/workflows/ci.yml` — GitHub Actions CI
- `package-lock.json`
- `vitest.config.ts` (made redundant by the `test:` block in `vite.config.ts`)

When these are reviewed and committed, this checklist should be updated to
include CI status checks and Sentry release tagging steps.
