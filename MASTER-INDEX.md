# GluMira™ V7 — Master File Index
Generated: 2026-04-17 (partial update — 2026-04-17 session changes only)

## A. ACTIVE V7 CODEBASE (Desktop — C:/Users/franc/Desktop/glumira-v7)

### Root Config
- .env.example
- .gitignore
- index.html
- index.css
- main.tsx
- App.tsx
- package.json
- package-lock.json
- vite.config.ts
- tsconfig.json
- tsconfig.server.json
- tailwind.config.js
- postcss.config.js
- netlify.toml
- railway.json
- vercel.json

### SQL / Schema
- glumira-schema.sql
- glumira-trpc-types.ts
- 20260329_badges_mira_schema.sql
- 20260329_beta_tables_addendum.sql
- drizzle/schema.ts

### HTML Reference Pages
- glumira-auth.html
- glumira-brand-guidelines.html
- glumira-dashboard.html
- glumira-iob-calculator.html
- glumira-landing.html

### Scripts
- glumira-patch.ps1

### Public Assets
- public/story-school.json

### src/ (Vite client — V7)
- src/components/MiraOwl.tsx
- src/components/ProtectedRoute.tsx
- src/hooks/useAuth.ts
- src/lib/api.ts
- src/lib/constants.ts
- src/lib/utils.ts
- src/pages/AuthPage.tsx
- src/pages/BadgesPage.tsx
- src/pages/DashboardPage.tsx  ← refactored 2026-04-17 (state extracted to useDashboard.ts)
- src/pages/EducationPage.tsx
- src/pages/FAQPage.tsx
- src/pages/LandingPageV2.tsx  ← primary landing (LandingPage.tsx deleted 2026-04-17)
- src/pages/MiraPage.tsx
- src/pages/SettingsPage.tsx
- src/pages/ReportPage.tsx  (legacy Bateman engine — planned migration to v7)
- src/components/ErrorBoundary.tsx  ← added 2026-04-17
- src/components/charts/IOBTerrainChart.tsx  ← v7-only, legacy path removed 2026-04-17
- src/components/charts/IOBTerrainTooltip.tsx  ← extracted 2026-04-17
- src/components/charts/IOBTerrainLegend.tsx  ← extracted 2026-04-17
- src/components/charts/IOBTerrainG4View.tsx  ← extracted 2026-04-17
- src/hooks/useDashboard.ts  ← added 2026-04-17
- src/hooks/useAlerts.ts  ← added 2026-04-17
- src/hooks/useAnonymousAuth.ts  ← rewritten 2026-04-17 (Supabase native anonymous auth)
- src/hooks/useSubscription.ts  ← rewritten 2026-04-17 (reads from /api/subscription/status)
- src/utils/glucose-units.ts  ← canonical glucose unit conversion (sole source of truth)
- src/lib/pharmacokinetics.ts  ← LEGACY Bateman engine (ReportPage only)

### client/ (Extended modules)
- client/src/App.tsx
- client/src/main.tsx
- client/src/components/MiraOwlBadge.tsx
- client/src/components/SchoolCarePlanForm.tsx
- client/src/components/index.ts
- client/src/hooks/index.ts
- client/src/hooks/useAuth.ts
- client/src/hooks/useGlucoseExport.ts
- client/src/hooks/useMenstrualCycleImpact.ts
- client/src/hooks/useTelemetry.ts
- client/src/lib/api.ts
- client/src/lib/constants.ts
- client/src/lib/menstrual-cycle-impact.ts
- client/src/lib/menstrual-cycle-impact.test.ts
- client/src/lib/pediatric-dose.ts
- client/src/lib/pediatric-dose.test.ts
- client/src/lib/pregnancy-glucose.ts
- client/src/lib/pregnancy-glucose.test.ts
- client/src/lib/school-care-plan.ts
- client/src/lib/school-care-plan.test.ts
- client/src/lib/utils.ts
- client/src/pages/BadgesPage.tsx
- client/src/pages/DashboardPage.tsx
- client/src/pages/EducationPage.tsx
- client/src/pages/FAQPage.tsx
- client/src/pages/MenstrualCycleModule.tsx
- client/src/pages/MiraPage.tsx
- client/src/pages/PaediatricModule.tsx
- client/src/pages/PregnancyModule.tsx
- client/src/pages/PregnancyPage.tsx
- client/src/pages/SchoolCarePlanModule.tsx
- client/src/pages/SchoolCarePlanPage.tsx

### server/
- server/index.ts  ← scheduleSyncJob() activated 2026-04-17
- server/router.ts
- server/trpc.ts
- server/db/index.ts
- server/db/schema.ts
- server/db/20260329_beta_tables_addendum.sql
- server/lib/glucose-trend.ts
- server/lib/utils.ts
- server/meals/carb-counter.ts
- server/middleware/auth.ts
- server/middleware/subscription.ts
- server/analytics/analytics-summary.ts
- server/analytics/analytics.ts
- server/analytics/bolus-calculator.ts
- server/analytics/glucose-export.ts
- server/analytics/glucose-prediction.ts
- server/analytics/glucose-trend.ts
- server/analytics/glucose-variability.ts
- server/analytics/hypo-risk.ts
- server/analytics/meal-timing.ts
- server/analytics/patient-progress-report.ts
- server/analytics/regime-comparison.ts
- server/analytics/sick-day-rules.ts
- server/analytics/weekly-summary.ts
- server/routes/analytics.route.ts
- server/routes/analytics.ts
- server/routes/auth.ts
- server/routes/badges.route.ts
- server/routes/beta-feedback.route.ts
- server/routes/cron-nightscout-sync.route.ts
- server/routes/doses.ts
- server/routes/glucose-prediction.route.ts
- server/routes/glucose-trend.route.ts
- server/routes/meals.ts
- server/routes/mira.route.ts
- server/routes/nightscout.ts
- server/routes/notifications.ts
- server/routes/remaining.routes.ts
- server/routes/school-care-plan-route.ts
- server/routes/settings.ts
- server/routes/subscription.ts
- server/routes/telemetry.ts

### docs/
- docs/modules/PM01-Pregnancy-Spec.txt
- docs/modules/Pregnancy-Module-Backend-Logic.txt
- docs/modules/School-Care-Plan-Backend-Logic.txt

---

## B. DRIVE ARCHIVE (G:/My Drive/04_CLAUDE)

### B1. Documentation (unique reference files)
- 02_GluMira-V7_Tag-Lines/Tag lines.txt
- 03_GluMira-V7_Downgrade-Policy/03_GluMira-Downgrade-Policy-V7.md
- 03_GluMira-V7_Downgrade-Policy/Downgrade Policy_260330_193456.txt
- 04_GluMira-V7_Build-Blocks/04_GluMira-Build-Blocks-Master-V7.md
- 04_GluMira-V7_Build-Blocks/GLUMIRA BUILD BLOCKS_260330_193637.txt
- 05_GluMira-V7_Marketing-Strategy/05_GluMira-Marketing-Strategy-V7.md
- 05_GluMira-V7_Marketing-Strategy/MARKETING STRATEGY_260330_194051.txt
- 06_GluMira-V7_Social-Media-Plan/SOCIAL MEDIA PLAN_260330_195459.txt
- 07_GluMira-V7_Mira-Education-0-12/EDUCATION _260330_195653.txt
- 08_GluMira-V7_Mira-Content-Research/07_GluMira-Mira-Education-0to12-V7.md
- 08_GluMira-V7_Mira-Content-Research/08_GluMira-Mira-Content-Research-V7.md
- 08_GluMira-V7_Mira-Content-Research/CONTENT RESEARCH _260330_195943.txt
- 09_GluMira-V7_Image-Registry/Image registry_260330_200243.txt
- Complete _260330_200537.txt
- Visual Design Philosophy.txt

### B2. Source Code Groups
- GROUP2-Auth-Patients/ — Auth middleware, subscription, patient schema, tests
- GROUP3-IOB-Engine/ — IOB spec docs, calculator, insulin profiles, components
- GROUP4-Modules/ — Pregnancy, paediatric, school care plan, menstrual cycle (with animations)
- GROUP4-Modules-Final/ — Final versions of module files
- GROUP5-UI-Pages/ — Dashboard, settings, landing, brand guidelines, components
- GROUP6-Integrations/ — Nightscout, Dexcom/Libre, Stripe, cron sync, notifications
- GROUP7-Beta-Launch/ — Onboarding flow, beta docs, analytics, feedback, story engine

### B3. Foundation Batch (Foundation-Batch-2026-03-29/)
- 00_MANIFEST.md
- 01_DB_Schema_Changelog/ (2 files)
- 02_Server_Files/ (4 files)
- 03_Server_Routes/ (11 files)
- 04_Server_Analytics/ (2 files)
- 05_Server_Middleware/ (2 files)
- 06_Client_Source/ (7 files)
- 07_Config_Env/ (2 files)
- 08_Drizzle/ (1 file)
- 09_HTML_Pages/ (5 files)
- 10_Types/ (1 file)

### B4. PDFs
- GROUP2-Auth-Patients/03_Subscription_Logic/Subscription_Tier_Logic.pdf
- GROUP3-IOB-Engine/01_IOB_Spec_Docs/IOB_Hunter_Core_Engine_Logic.pdf
- GROUP3-IOB-Engine/03_Insulin_Profiles/P001-Insulin-Profile.xlsx
- GROUP3-IOB-Engine/03_Insulin_Profiles/P002-Insulin-Profile.xlsx

### B5. ZIP Archives (now in Legacy)
- ZIP FILES/glumira-platform-main.zip
- ZIP FILES/glumira-v7-codebase.zip
- Foundation-Batch-2026-03-29/glumira-foundation-batch.zip
- Code based files for manus/glumira-v7-codebase.zip

### B6. Duplicate Copies (archived to Legacy)
- GROUP8-Client/ → Legacy/GROUP8-Client-NextJS/ (Next.js app/ directory pattern, not V7)
- glumira-platform-main/glumira-platform-main/ → Legacy/glumira-platform-main-duplicate/
- Code based files for manus/ → Legacy/Code-based-files-for-manus/
- Foundation-Batch/glumira-foundation-batch/glumira-foundation-batch/ → Legacy/Foundation-Batch-duplicate-zip/
- MISSING-ROUTES/*.zip → Legacy/MISSING-ROUTES-ZIPs/
- ZIP FILES/ → Legacy/ZIP-FILES/

---

## C. LEGACY FILES (Not used in V7)

### GROUP8-Client (Next.js app/ directory — NOT V7 Vite)
- Uses Next.js `app/` router with `(dashboard)`, `(auth)`, `(admin)` route groups
- Contains ~200+ files including shadcn/ui components, 50+ hooks, API routes
- Archived to: `C:/Users/franc/Desktop/GluMira-Legacy/GROUP8-Client-NextJS/`

### glumira-platform-main/glumira-platform-main/ (double-nested duplicate)
- Duplicate of the platform repo, nested inside itself
- Archived to: `C:/Users/franc/Desktop/GluMira-Legacy/glumira-platform-main-duplicate/`

### Code based files for manus/ (duplicate of Foundation-Batch)
- Contains glumira-v7-codebase.zip and extracted files that duplicate Foundation-Batch
- Archived to: `C:/Users/franc/Desktop/GluMira-Legacy/Code-based-files-for-manus/`

### Foundation-Batch nested ZIP extract
- Double-nested: Foundation-Batch/glumira-foundation-batch/glumira-foundation-batch/
- Exact duplicate of the parent Foundation-Batch folders
- Archived to: `C:/Users/franc/Desktop/GluMira-Legacy/Foundation-Batch-duplicate-zip/`

---

## D. IMAGE REGISTRY

| Image | Original Location | Status |
|-------|------------------|--------|
| glumira-hero-bg-dark.png | glumira-v7/public/ | Archived → Legacy/archived-images/ |
| mira-owl-hero.png | glumira-v7/public/ | Archived → Legacy/archived-images/ |
| mira-owl-identity.png | glumira-v7/public/ | Archived → Legacy/archived-images/ |
| glumira-data-wave.png | GROUP8-Client/public/ | Legacy (Next.js only) |
| glumira-hero-bg.png | GROUP8-Client/public/ | Legacy (Next.js only) |
| glumira-hero-owl.png | GROUP8-Client/public/ | Legacy (Next.js only) |
| glumira-locked-canvas-ref.png | GROUP8-Client/public/ | Legacy (Next.js only) |
| glumira-mission-bg.png | GROUP8-Client/public/ | Legacy (Next.js only) |
| glumira-owl-clean.png | GROUP8-Client/public/ | Legacy (Next.js only) |
| glumira-teal-line.png | GROUP8-Client/public/ | Legacy (Next.js only) |
| hero_owl_v1.png | GROUP8-Client/public/ | Legacy (Next.js only) |
| MiraOwl.tsx (inline SVG) | glumira-v7/src/components/ | Active — replaces all PNG owls |
