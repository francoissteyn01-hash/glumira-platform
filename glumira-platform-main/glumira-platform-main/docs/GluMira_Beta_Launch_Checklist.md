# GluMira™ Beta Launch Preparation Checklist
**Author:** Manus AI  
**Date:** March 27, 2026  
**Version:** 1.0  

This document outlines the comprehensive strategy and checklist for launching the GluMira™ Beta. It bridges the gap between the technical modules built in Phase 2 (Groups A, B, and C) and the operational requirements needed to run a successful, grant-ready beta program.

---

## 1. Technical Readiness (Phase 2 Verification)

The core architecture required for a closed beta is now built. The following checklist ensures all environments are configured before the first user logs in.

### Group A: Data Pipeline & Bypass
- [x] **Dexcom Share Bridge Built:** Bypass module completed (`dexcom-share-bridge.ts`).
- [x] **Unified Pipeline Built:** Merges Dexcom Share and Nightscout data (`unified-data-pipeline.ts`).
- [ ] **Environment Variables Configured:** Ensure `.env.dexcom-share` credentials (`GluMiraDev`) are securely loaded into the Vercel production environment.
- [ ] **Cron Job Activated:** Ensure the 5-minute sync interval (`/api/cron/sync`) is registered in Vercel.

### Group B: Onboarding & Telemetry
- [x] **Telemetry Engine Built:** Event tracking and batch processing ready (`telemetry-engine.ts`).
- [x] **Onboarding Gate Built:** 5-step wizard enforcing mandatory baseline data capture (`OnboardingGate.tsx`).
- [x] **Beta Dashboard Built:** Grant-ready metrics dashboard ready (`beta-analytics-dashboard.ts`).
- [ ] **Database Migrations Applied:** Ensure `20260327_wave_groupb_telemetry.sql` is executed on the production Supabase instance.

### Group C: AI Clinician Module
- [x] **RAG Context Engine Built:** Live patient data injection ready (`rag-context-engine.ts`).
- [x] **Bernstein QA Engine Built:** Chapter-indexed knowledge base ready (`bernstein-qa-engine.ts`).
- [x] **Clinician Notes Generator Built:** SOAP and School Care Plan formats ready (`clinician-notes-generator.ts`).
- [ ] **API Keys Configured:** Ensure `OPENAI_API_KEY` (or equivalent LLM key) is active in the production environment.
- [ ] **Rate Limiting Verified:** Confirm the 20-query-per-hour limit is active to manage API costs during beta.

---

## 2. User Recruitment Strategy

To generate credible data for grant applications (Breakthrough T1D, Helmsley Charitable Trust), the beta requires a specific cohort size and demographic mix.

**Target Cohort Size:** 30–50 active users.  
**Beta Duration:** 12 weeks (3 months).

### Recruitment Channels
1. **Nightscout Community ("CGM in the Cloud" Facebook Group):** 
   - *Why:* Highly engaged, tech-savvy users who already understand CGM data.
   - *Action:* Post the formal collaboration letter (drafted in Group A) and offer early access to 20 users.
2. **Local Diabetes Clinics / Endocrinologists:**
   - *Why:* Provides the "Clinician" perspective needed to test the Clinician Notes Generator.
   - *Action:* Onboard 2–3 clinicians and ask them to invite 5 of their patients each.
3. **Bernstein Protocol Followers:**
   - *Why:* Perfect fit for the Bernstein QA Engine and Law of Small Numbers analytics.
   - *Action:* Engage in low-carb diabetes forums with the GluMira value proposition.

### Selection Criteria
- Must have Type 1 Diabetes (or insulin-dependent Type 2).
- Must use Dexcom (via Share) or Nightscout.
- Must agree to the 12-week testing period.
- Must consent to anonymized data usage for grant applications.

---

## 3. Feedback Mechanisms

Capturing user feedback is automated and embedded directly into the platform to reduce friction.

| Mechanism | Implementation | Purpose |
| :--- | :--- | :--- |
| **In-App Feedback Widget** | `BetaFeedbackWidget.tsx` (Floating pill button) | Captures bug reports, feature requests, and general comments in real-time without leaving the app. |
| **Telemetry Engine** | `useTelemetry.ts` (Silent background tracking) | Tracks feature utilization, session duration, and drop-off points automatically. |
| **NPS Prompts** | Triggered every 5th session via Widget | Calculates Net Promoter Score, a critical metric for grant applications and investor pitches. |
| **Exit Interviews** | Scheduled via email at Week 12 | Qualitative feedback on how GluMira changed their daily management routine. |

---

## 4. Grant-Readiness Milestones

The primary goal of this beta is to produce a dataset that secures funding. The `beta-analytics-dashboard.ts` module is designed to automatically generate these metrics.

### Month 1: Engagement & Onboarding
- **Target:** >80% completion rate through the `OnboardingGate`.
- **Target:** >60% Day-7 Retention.
- **Metric to Export:** DAU/WAU ratio and feature utilization (especially the AI chat).

### Month 2: Clinical Efficacy Trends
- **Target:** Demonstrable improvement in Time in Range (TIR).
- **Target:** Reduction in Hypoglycaemia Risk Score.
- **Metric to Export:** Baseline vs. Current clinical outcomes (TIR delta).

### Month 3: Long-Term Value & NPS
- **Target:** >50% Month-3 Retention (Industry average for health apps is ~4%).
- **Target:** NPS Score > 30.
- **Metric to Export:** Full 90-day retention curve and aggregated clinician notes generated.

---

## 5. Launch Sequence & Next Actions

1. **Environment Lock:** Deploy all Phase 2 code to Vercel production. Verify Supabase schemas and API keys.
2. **Internal Alpha Test:** Run 1 dummy patient through the entire flow (Onboarding → Dexcom Sync → RAG AI Chat → Clinician Note Generation).
3. **Nightscout Outreach:** Submit the collaboration letter to the Nightscout Foundation.
4. **Cohort Selection:** Finalize the list of 30–50 beta testers and distribute access codes.
5. **Beta Day 1:** Monitor the `telemetry_events` table in Supabase to ensure onboarding data is capturing correctly.

*GluMira™ is an educational platform. The science of insulin, made visible. Consult your clinician for any medical advice.*
