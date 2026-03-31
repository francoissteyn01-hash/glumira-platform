# GluMira™ Vercel Deployment Guide
**Version:** 7.0.0  
**Last Updated:** 2026-03-26  

This guide covers the complete deployment process for GluMira™ on Vercel, including environment variable configuration, Supabase Edge Function deployment, and post-deployment verification.

---

## 1. Prerequisites

Before deploying, ensure the following are in place:

| Requirement | Status |
|---|---|
| Vercel account with Pro plan (for cron jobs) | Required |
| Supabase project created (free tier sufficient) | Required |
| GitHub private repository created | Required |
| Anthropic API key (Claude Sonnet) | Required for AI tier |
| Nightscout instance running (NAM-001 / ZA-001) | Required for beta |
| Datadog account | Required for SIEM |

---

## 2. Environment Variables

Run the validator before every deployment:

```bash
npx tsx scripts/validate-env.ts
```

Set the following variables in the Vercel dashboard under **Settings → Environment Variables**:

### Critical (app will not start without these)

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | `eyJhbGciOiJIUzI1NiIs...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only) | `eyJhbGciOiJIUzI1NiIs...` |
| `DATABASE_URL` | MySQL/TiDB connection string | `mysql://user:pass@host/db` |

### Required (features degraded without these)

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Claude Sonnet for Clinician Assistant |
| `NIGHTSCOUT_BASE_URL` | Nightscout instance URL |
| `NIGHTSCOUT_API_SECRET` | Nightscout API secret (SHA1 hashed) |
| `CRON_SECRET` | Secret for cron endpoint auth |
| `DATADOG_API_KEY` | Datadog API key |
| `DATADOG_APP_KEY` | Datadog application key |
| `AUDIT_HMAC_SECRET` | HMAC-SHA256 secret for audit log |

---

## 3. Deployment Steps

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "feat: GluMira v7.0.0 — Beast Mode Wave 4"
gh repo create glumira-v6 --private --source=. --push
```

### Step 2: Connect to Vercel

```bash
npx vercel --prod
```

Or connect via the Vercel dashboard: **New Project → Import Git Repository → glumira-v6**.

### Step 3: Deploy Supabase Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy Edge Functions
supabase functions deploy gdpr-erase
supabase functions deploy key-rotation

# Set Edge Function secrets
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
supabase secrets set CRON_SECRET=your_cron_secret
```

### Step 4: Run Database Migrations

```bash
pnpm db:migrate
```

### Step 5: Verify Deployment

```bash
# Check health endpoint
curl https://your-app.vercel.app/api/health

# Expected response:
# { "status": "ok", "version": "7.0.0", "timestamp": "..." }
```

---

## 4. Cron Jobs

Two cron jobs are configured in `vercel.json`:

| Cron | Schedule | Description |
|---|---|---|
| `/api/cron/key-rotation` | Every Sunday at 02:00 UTC | Rotates patient encryption keys older than 90 days |
| `/api/cron/nightscout-sync` | Every 5 minutes | Syncs CGM data from Nightscout for active beta participants |

Both endpoints require the `X-Cron-Secret` header matching the `CRON_SECRET` environment variable.

---

## 5. Post-Deployment Verification Checklist

```
[ ] /api/health returns { "status": "ok" }
[ ] Login page loads at /login
[ ] Dashboard redirects to /login if unauthenticated
[ ] IOB chart renders with mock data
[ ] Nightscout sync returns 200 for NAM-001
[ ] School Care Plan generates PDF successfully
[ ] Rate limiter returns 429 after 5 rapid requests to /api/auth/login
[ ] GDPR erase endpoint rejects requests without correct JWT
[ ] Datadog monitors show green in dashboard
[ ] Key rotation cron runs successfully on first Sunday
```

---

## 6. Rollback

If a deployment fails, roll back via Vercel dashboard:

```bash
vercel rollback
```

Or via CLI:

```bash
vercel ls                          # List deployments
vercel alias set <old-url> <domain>  # Repoint domain to previous deployment
```

---

*GluMira™ · Powered by IOB Hunter™ · v7.0.0*  
*Not a medical device. Not a dosing tool. Always consult your diabetes care team.*
