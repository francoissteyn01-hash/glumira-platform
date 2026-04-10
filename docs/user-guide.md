# GluMira™ V7 — User Guide

A short tour of the platform from a patient's perspective.

> **GluMira™ is an educational platform, not a medical device.** Always
> consult your care team before making changes to your insulin regimen,
> diet, or treatment plan. Nothing in GluMira replaces clinical advice.

---

## Getting started

1. **Sign up** at [glumira.ai](https://glumira.ai) with your Google account.
2. **Complete onboarding** — the wizard walks through your diabetes type,
   insulin regimen, dietary approach, and (if applicable) your caregiver
   relationship.
3. **Connect Nightscout** (optional but recommended) from the Dashboard. Paste
   your Nightscout URL and API secret; GluMira will pull the last 24 hours of
   CGM readings and keep them in sync every 5 minutes.

---

## The Dashboard (`/dashboard`)

Your home base. Shows:

- **Active Insulin** — your current IOB (insulin on board) computed from
  recent doses
- **Latest Glucose** — most recent CGM reading with trend arrow
- **Risk Window** — current insulin pressure classification
- **Sensor Confidence** — how complete the CGM data is for the current period
- **Hidden IOB** — leftover basal/long-acting insulin from earlier doses
- **Glucose Variability (CV%)** — your 7-day stability metric vs the 14-day baseline
- **Alert Notification Center** — live alerts for highs, lows, fast trends,
  and insulin stacking. Each alert can be **dismissed** or **snoozed** for
  15 min / 1 hour / 4 hours
- **IOB Hunter™** — full 24-hour insulin pressure map (click through)
- **What-If Scenario Engine** — adjust dose timing and watch the curve respond

---

## Analytics (`/dashboard/analytics`)

Patterns from your last 14 days of data.

- **Glucose Variability** — coefficient of variation, time-in-range, mean glucose
- **Carb Ratio (ICR)** — your configured ICR side-by-side with what the data
  suggests is actually working. Verdict: **balanced**, **under-dosed**, or
  **over-dosed**
- **Basal Rate** — overnight stability score (0–10) from the 02:00–06:00
  fasting window. Reads as a gauge plus written observations
- **Insulin Sensitivity by Hour** — 24-cell heatmap showing when your body
  responds best to corrections

Use this page when reviewing trends with your endocrinologist. **None of these
suggestions are prescriptions** — they are starting points for a clinical
conversation.

---

## Alert History (`/alerts/history`)

A complete record of every alert you've dismissed or snoozed. Filter by:

- **Action** — dismissed only / snoozed only / both
- **Alert type** — low glucose, high glucose, rising fast, falling fast, stacking
- **Limit** — 25 / 50 / 100 / 200 entries

Useful for spotting patterns ("I keep snoozing the 3am low alert" → talk to
your team about overnight basal).

---

## Sync Status (`/sync-status`)

Three things, all live:

- **Offline Mode** — whether your browser is online, how much local storage
  is in use, and whether a service worker cache is registered
- **Device Status** — health of the GluMira API, your Nightscout connection,
  and your authenticated session token
- **Sync Queue** — recent Nightscout sync events with how many readings each
  one added

If the GluMira API row goes red, the platform is unreachable — try again in
a minute. If Nightscout goes red, your CGM data won't update; check your
Nightscout server.

---

## Compliance (`/compliance`)

For users (and their lawyers) who want to know what GluMira does with their
data.

- **HIPAA / GDPR / POPIA** — control status across the three regimes,
  including which controls are compliant and which are still in progress
- **System Health** — live server uptime, memory usage, database ping
- **Core Web Vitals** — page-load performance metrics (LCP, CLS, INP, TTFB)
- **Incident Response** — any open security incidents (none, in normal operation)
- **Security Audit Log** — every action recorded against your account

You can request your data export at any time via the **Profile** page
(GDPR Article 20 / POPIA portability right).

---

## Modules

GluMira ships specialist modules for situations that change insulin behaviour:

- **Pregnancy / Gestational** — trimester-specific ISF/ICR guidance
- **Paediatric** — child/adolescent-specific dosing patterns
- **School Care Plan** — generates a printable PDF for school nurses
- **Menstrual Cycle** — tracks insulin sensitivity changes through the cycle
- **ADHD / Autism** — sensory and routine considerations
- **Pregnancy / Thyroid / Ramadan / Keto / Bernstein** — and 25+ more

Find them under **Modules** in the sidebar.

---

## Caregiver mode

If you manage diabetes for someone else (a child, parent, partner), enable
caregiver mode in your **Profile** and set the relationship + patient name.
The dashboard header will switch to "{Name}'s Dashboard" and Mira will
address you in the second person about the person you care for.

---

## Mira — your AI diabetes coach

Mira is the chat tab in the sidebar. She is **Claude Opus 4.6** under the
hood, fine-tuned with diabetes guidelines and your platform context. Ask her
questions about patterns you see, ingredients you're unsure about, or how
to approach a conversation with your care team.

**Mira will not:**
- Tell you what dose to take
- Diagnose anything
- Replace your endocrinologist

**Mira will:**
- Explain what your numbers mean
- Suggest questions to ask your team
- Help you understand the science

---

## Help and feedback

- **Bug reports & feature requests:** [GitHub Issues](https://github.com/anthropics/claude-code/issues)
- **General questions:** Mira chat, or email the team
- **In-app feedback:** every page has a "Beta Feedback" link in the footer

---

## Privacy

- Your CGM data is stored in Supabase Postgres in the EU
- Encryption at rest (AES-256) and in transit (TLS 1.2+)
- You can delete your account and all associated data at any time from
  your Profile page
- We do not sell, share, or use your data for advertising

For the full policy, see the **Privacy** link in the footer.
