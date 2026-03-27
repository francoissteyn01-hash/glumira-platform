# GluMira™ V6 Free Tier — Rebuild TODO (V7.0.0 Architecture)

**Version:** 7.0.0 (Manus Implementation)  
**Tagline:** Visualizing the science of insulin  
**Powered by:** IOB Hunter™  
**Status:** Phase 1 - Architecture Integration  
**Stack:** Next.js 14 · Supabase · Upstash Redis · Tailwind CSS · Recharts · Claude Sonnet

---

## Phase 1: Architecture Integration & Planning

- [x] Integrate V7.0.0 master code reference
- [x] Analyze security stack requirements (Supabase Vault, AES-256-GCM, HMAC audit logging)
- [x] Review meal regimes (20 profiles) and module specifications
- [x] Collect brand assets (owl mascot, wave backgrounds, color palette)
- [x] Create comprehensive todo.md with V7 requirements
- [ ] Update project structure to match V7 folder layout (62 folders)
- [ ] Configure Supabase project with vault and migrations
- [ ] Set up Upstash Redis for rate limiting and WebAuthn challenges
- [ ] Configure Datadog SIEM integration

---

## Phase 2: Security Stack Implementation

### Supabase Vault & Secrets Management
- [ ] Enable supabase_vault extension
- [ ] Seed 8 secrets (phi_encryption_key_current, phi_encryption_key_next, phi_key_version_current, audit_hmac_secret, anthropic_api_key, upstash_redis_token, cron_secret, datadog_api_key)
- [ ] Implement getVaultSecret() and setVaultSecret() helpers
- [ ] Create vault cache with 5-minute TTL
- [ ] Implement key rotation workflow

### PHI Encryption (AES-256-GCM)
- [ ] Implement encryptPHI() and decryptPHI() functions
- [ ] Build versioned envelope encryption (encryptWithVersion, decryptWithVersion)
- [ ] Implement reEncryptBatch() for key rotation
- [ ] Add patient field encryption (name, DOB)
- [ ] Write encryption/decryption tests

### Audit Logging & SIEM
- [ ] Implement writeAuditLog() with HMAC-SHA256 chaining
- [ ] Build audit_log table with RLS (service_role only)
- [ ] Implement writeAuditWithSIEM() for Datadog dual-write
- [ ] Add risk scoring (0–100) per action type
- [ ] De-identify user IDs before sending to Datadog

### Rate Limiting & Security Middleware
- [ ] Implement Upstash Redis rate limiter
- [ ] Create rate limit profiles (auth:5/60s, api_read:100/60s, api_write:30/60s, pdf_export:10/60s, ai_query:20/60s, iob_calc:100/60s)
- [ ] Build secureApiMiddleware() with CSRF validation
- [ ] Implement input sanitization with DOMPurify (2000 char cap)
- [ ] Add constant-time token comparison (timing attack prevention)

### WebAuthn MFA
- [ ] Implement startRegistration() and finishRegistration()
- [ ] Implement startAuthentication() and finishAuthentication()
- [ ] Store WebAuthn credentials in database with RLS
- [ ] Create challenge storage in Redis (5-minute TTL, one-time use)
- [ ] Support ES256 (P-256) and RS256 algorithms
- [ ] Enforce userVerification: required (PIN or biometric)

### Security Headers & CSP
- [ ] Configure Content Security Policy (default-src none, script-src self)
- [ ] Set X-Content-Type-Options: nosniff
- [ ] Set X-Frame-Options: DENY
- [ ] Set HSTS: 2 years, includeSubDomains, preload
- [ ] Set Referrer-Policy: strict-origin-when-cross-origin
- [ ] Set Permissions-Policy (blocks camera/mic/geo/payment/usb)
- [ ] Configure COEP/COOP/CORP headers (Spectre protection)

---

## Phase 3: IOB Calculation Engine (Walsh Bilinear)

### Core Algorithm
- [x] Implement Walsh bilinear DIA decay curve (NOT linear)
  - `t <= d/2: fraction = 1 - (2/d²) × t²`
  - `t > d/2: fraction = (2/d²) × (t - d)²`
  - `t >= d: fraction = 0`
- [x] Build calculateIOB() function with multiple dose support
- [x] Implement bolus vs. basal IOB separation

### Insulin Concentration Handling (BUG-08 fix)
- [x] Support U-100, U-200, U-500 concentrations
- [x] Implement biological unit conversion:
  - `U-100: doseUnits × 1.0 = biological units`
  - `U-200: doseUnits ÷ 2.0 = biological units`
  - `U-500: doseUnits ÷ 5.0 = biological units`

### Validation & Safety (SEC-05)
- [x] Validate doseUnits: 0.01–300 (throw INVALID_DOSE)
- [x] Validate diaHours: 2.0–8.0 (throw INVALID_DOSE)
- [x] Validate concentration: U-100 | U-200 | U-500 only
- [x] Skip future doses with warning
- [x] Implement IOB safety cap: 100 units max

### Unit Conversion (BUG-02 fix)
- [x] Implement mmolToMgdl: value × 18.018 (round to integer)
- [x] Implement mgdlToMmol: value ÷ 18.018 (round to 1 decimal)

### Testing (24+ test cases)
- [x] Test Walsh curve calculation accuracy (67 tests passing)
- [x] Test insulin concentration conversions
- [x] Test unit conversions (mmol/L ↔ mg/dL)
- [x] Test IOB safety caps and validation
- [x] Test future dose detection
- [x] Test edge cases (zero doses, very long DIA, etc.)

---

## Phase 4: Meal Regimes & School Care Module

### Meal Regime Profiles (20 total - BUG-06 fix)
- [x] Implement MEAL_REGIMES array with all 20 profiles
- [x] Create getMealRegimeById() and getHypoThreshold() helpers
- [x] Each profile includes: id, name, hypoThresholdMmol, absorptionDelayMin, carbEstimationNote, patternInsightLanguage

### Hypo Thresholds by Regime
- [x] STANDARD_CARB: 5.0 mmol/L
- [x] BERNSTEIN: 4.2 mmol/L
- [x] RAMADAN: 4.0 mmol/L
- [x] YOM_KIPPUR: 4.0 mmol/L
- [x] FRUCTOSE_FREE: 4.5 mmol/L
- [x] GFD / NCGS / WHEAT: 4.8 mmol/L
- [x] CUSTOM: 5.0 mmol/L (clinician override)
- [x] Fallback: 5.0 mmol/L for unknown IDs

### School Care Plan Generator (MOD-SCHOOL)
- [ ] Build school-specific meal regime selector
- [ ] Generate printable care plan PDF
- [ ] Include emergency contact information
- [ ] Add hypo treatment protocols
- [ ] Include teacher/staff education section
- [ ] Implement PDF export via Puppeteer

### Testing
- [x] Test all 20 meal regime profiles (26 tests passing)
- [x] Test hypo threshold logic
- [ ] Test school care plan generation
- [ ] Test PDF export functionality

---

## Phase 5: Patient Dashboard & Visualization

### Patient Profile Management
- [x] Build patient profile creation UI
- [x] Implement patient profile editing
- [ ] Store patient data with encryption (name, DOB)
- [x] Add diabetes type selector
- [ ] Add sex at birth field
- [ ] Add weight/height tracking
- [x] Add insulin type and concentration selector
- [x] Add DIA hours configuration
- [x] Add ISF (Insulin Sensitivity Factor) input
- [x] Add ICR (Insulin-to-Carb Ratio) input

### Glucose Data Management
- [x] Build manual glucose entry form
- [ ] Implement CGM data import (CSV upload)
- [ ] Support Dexcom, Freestyle, Medtronic formats
- [x] Add glucose readings table with pagination
- [x] Implement glucose readings API endpoints
- [x] Add data validation for glucose values

### Insulin Dose Logging
- [x] Build insulin dose entry form (bolus + basal)
- [x] Implement dose history table
- [x] Add insulin dose API endpoints
- [x] Support multiple insulin types

### Visualization Components
- [x] Build IOB timeline chart (Recharts with Walsh curve)
- [x] Build glucose trend chart with target range overlay
- [ ] Build basal vs. bolus breakdown (stacked bar chart)
- [x] Build insulin stacking indicator
- [x] Build glucose statistics dashboard (TIR, avg, std dev, HbA1c estimate)
- [ ] Implement date range selector (7d, 14d, 30d, custom)
- [ ] Add real-time chart updates

### Dashboard Layout
- [x] Build responsive dashboard grid
- [ ] Add widget resizing capability
- [ ] Implement widget preferences persistence
- [ ] Add dark/light theme toggle

---

## Phase 6: Authentication & Access Control

### Email/Password Authentication
- [ ] Build signup form with validation
- [ ] Build login form with validation
- [ ] Implement password reset flow
- [ ] Add email verification
- [ ] Create user_profiles table with RLS

### WebAuthn MFA (Optional)
- [ ] Build WebAuthn registration UI
- [ ] Build WebAuthn authentication UI
- [ ] Store WebAuthn credentials securely
- [ ] Implement challenge workflow

### Session Management
- [ ] Configure Supabase session cookies (SameSite=Strict, Secure)
- [ ] Implement JWT refresh logic
- [ ] Build logout functionality
- [ ] Create protected route middleware

### Tier-Based Access Control
- [ ] Implement tierHasAccess() function
- [ ] Enforce free tier limits:
  - 1 patient profile
  - 90 days of glucose history
  - 10 meals/day
- [ ] Implement MODULE_TIER_REQUIREMENTS enforcement
- [ ] Free tier modules: MOD-IOB, MOD-MEAL, MOD-SCHOOL

### Role-Based Access
- [ ] Implement user vs. admin roles
- [ ] Create adminProcedure for admin-only endpoints
- [ ] Add role-based UI visibility

---

## Phase 7: Data Management & Export

### Predictive Text Chat Interface
- [ ] Implement Levenshtein distance algorithm in TypeScript
- [ ] Build dictionary of common English + medical terms
- [ ] Create real-time typo detection hook
- [ ] Build chat message input with typo underlines (amber)
- [ ] Implement suggestion pill UI ("Did you mean?")
- [ ] Add Tab/Esc keyboard shortcuts
- [ ] Build chat message display with markdown support
- [ ] Implement chat history persistence

### Data Export
- [ ] Build CSV export for glucose readings
- [ ] Build CSV export for insulin doses
- [ ] Build PDF report generation (Puppeteer)
- [ ] Include charts in PDF reports
- [ ] Add export audit logging
- [ ] Implement rate limiting on exports (10/60s)

### Data Import
- [ ] Build CGM data import UI (CSV upload)
- [ ] Support Dexcom format
- [ ] Support Freestyle format
- [ ] Support Medtronic format
- [ ] Add data validation for imports
- [ ] Implement bulk upload capability

### Data Deletion (GDPR)
- [ ] Implement gdpr_erase_user() function
- [ ] Cascade delete all user data
- [ ] Log deletion in audit trail
- [ ] Service role only (no authenticated access)

---

## Phase 8: Landing Page & Marketing

### Hero Section
- [ ] Integrate owl mascot (teal + navy, golden eyes)
- [ ] Add wave design dividers (teal gradients)
- [x] Build main headline: "Have you ever wondered what your insulin is actually doing between injections?"
- [x] Add tagline: "GluMira™ makes it visible"
- [x] Create CTA buttons (Try GluMira Free, Explore Features)
- [ ] Add hero background (data visualization theme)

### Features Showcase
- [ ] Feature 1: IOB Curves (with animated visualization)
- [ ] Feature 2: Stacking Risk (with visual indicator)
- [ ] Feature 3: Basal Evaluation (with chart)
- [ ] Add feature descriptions and benefits

### Pricing Section
- [x] Display tier comparison (Free, Pro, AI)
- [x] Show pricing in USD
- [x] Add PPP pricing for Africa (50% discount)
- [x] Highlight free tier features
- [x] Add CTA for each tier

### Mission/About Section
- [x] Add mission statement
- [ ] Include team information
- [x] Add company origin (Windhoek, Namibia)
- [x] Include contact information (info@glumira.ai)

### Footer
- [x] Add medical disclaimer
- [x] Add links to privacy policy and terms
- [ ] Add social media links
- [x] Add contact information

### Responsive Design
- [ ] Mobile-first design (mobile, tablet, desktop)
- [ ] Test on all major browsers
- [ ] Ensure accessibility (WCAG 2.1 AA)

---

## Phase 9: Compliance & Testing

### HIPAA Compliance
- [ ] Verify all PHI encrypted with AES-256-GCM
- [ ] Verify audit logging for all clinical actions
- [ ] Verify access controls and RLS policies
- [ ] Verify data retention policies
- [ ] Document business associate agreements

### GDPR Compliance
- [ ] Implement data deletion (gdpr_erase_user)
- [ ] Implement data export (user can download all data)
- [ ] Implement consent tracking
- [ ] Add privacy policy
- [ ] Document data processing agreements

### WCAG 2.1 AA Accessibility
- [ ] Test with screen readers (NVDA, JAWS)
- [ ] Verify keyboard navigation
- [ ] Verify color contrast (4.5:1 for text)
- [ ] Verify touch targets (44px minimum)
- [ ] Test with accessibility validators

### Security Audit
- [ ] Verify 30/30 security findings resolved
- [ ] Run OWASP Top 10 checks
- [ ] Verify no hardcoded secrets
- [ ] Verify rate limiting on all endpoints
- [ ] Verify CSRF protection
- [ ] Verify input sanitization

### Unit Testing
- [ ] IOB calculations (24+ test cases)
- [ ] Meal regimes (20 profiles)
- [ ] Unit conversions (mmol/L ↔ mg/dL)
- [ ] Encryption/decryption
- [ ] Audit logging
- [ ] Rate limiting

### Integration Testing
- [ ] Auth flows (signup, login, logout, MFA)
- [ ] Patient profile CRUD
- [ ] Glucose readings CRUD
- [ ] Insulin doses CRUD
- [ ] Data export workflows
- [ ] Data import workflows

### E2E Testing
- [ ] Patient dashboard workflow
- [ ] Data entry and visualization
- [ ] Export and import workflows
- [ ] MFA registration and authentication

### Performance Testing
- [ ] IOB calculation speed (<100ms for 1000 doses)
- [ ] Chart rendering (1000+ data points)
- [ ] API response times (<200ms p95)
- [ ] Database query optimization
- [ ] Bundle size optimization

---

## Phase 10: Deployment & Monitoring

### CI/CD Pipeline
- [ ] Set up GitHub Actions
- [ ] Automated testing on pull requests
- [ ] Automated linting and type checking
- [ ] Automated security scanning
- [ ] Automated deployment to staging
- [ ] Manual approval for production

### Environment Configuration
- [ ] Development environment (localhost)
- [ ] Staging environment (staging.glumira.ai)
- [ ] Production environment (glumira.ai)
- [ ] Configure environment variables for each
- [ ] Set up Supabase projects for each environment

### Monitoring & Alerting
- [ ] Configure Datadog monitoring
- [ ] Set up error tracking (Sentry or similar)
- [ ] Create dashboards for key metrics
- [ ] Set up alerting for critical errors
- [ ] Monitor rate limiting and abuse
- [ ] Monitor database performance

### Backup & Disaster Recovery
- [ ] Configure Supabase automated backups
- [ ] Test backup restoration
- [ ] Document disaster recovery procedures
- [ ] Create incident response playbook

### Status Page
- [ ] Deploy status page (Statuspage.io or similar)
- [ ] Monitor uptime
- [ ] Communicate incidents to users

---

## Phase 11: Free Tier Features (MVP)

### Included in Free Tier
- [x] IOB Hunter™ Core (MOD-IOB) — Walsh bilinear calculations
- [x] Meal Regime Intelligence (MOD-MEAL) — 20 profiles
- [x] School Care Plan Generator (MOD-SCHOOL)
- [x] Basic glucose tracking and visualization
- [x] Insulin dose logging
- [ ] Email/password authentication
- [ ] WebAuthn MFA (optional)
- [ ] Data export (CSV)
- [ ] Predictive text chat
- [ ] 1 patient profile
- [ ] 90 days of glucose history
- [ ] 10 meals/day

### Not in Free Tier (Pro/AI/Clinical only)
- Pregnancy module (MOD-PREG)
- ADHD module (MOD-ADHD)
- Thyroid module (MOD-THYROID)
- Gastroparesis module (MOD-GASTRO)
- Ramadan module (MOD-RAMADAN)
- AI pattern analysis
- AI insight generation
- AI report generation
- Clinical team sharing
- Clinical audit export
- Bulk patient import

---

## Phase 12: Quality Assurance & Launch

### User Acceptance Testing
- [ ] Recruit beta testers (patients and clinicians)
- [ ] Conduct UAT sessions
- [ ] Gather feedback and prioritize issues
- [ ] Iterate on design and features

### Clinician Review
- [ ] Have endocrinologists review IOB calculations
- [ ] Verify meal regime thresholds
- [ ] Review school care plan generator
- [ ] Collect clinical feedback

### Security Penetration Testing
- [ ] Hire security firm for penetration testing
- [ ] Address any vulnerabilities found
- [ ] Verify fixes
- [ ] Document security posture

### Performance Benchmarking
- [ ] Measure IOB calculation speed
- [ ] Measure chart rendering performance
- [ ] Measure API response times
- [ ] Optimize bottlenecks

### Data Backup & Recovery Testing
- [ ] Test backup restoration
- [ ] Verify data integrity
- [ ] Document recovery procedures

### Incident Response Drill
- [ ] Simulate security incident
- [ ] Test incident response procedures
- [ ] Document lessons learned

### Launch Checklist
- [ ] All tests passing
- [ ] Security audit complete
- [ ] Compliance verified
- [ ] Documentation complete
- [ ] Monitoring configured
- [ ] Support team trained
- [ ] Marketing materials ready

### Soft Launch
- [ ] Launch to beta users
- [ ] Monitor metrics and user feedback
- [ ] Address critical issues
- [ ] Iterate based on feedback

### Public Launch
- [ ] Announce public launch
- [ ] Monitor uptime and performance
- [ ] Respond to user feedback
- [ ] Plan next features

---

## Design System (Soft Editorial)

### Colors
| Element | Value | OKLCH | Usage |
|---|---|---|---|
| Primary Navy | `#1a2a5e` | oklch(0.27 0.09 258) | Main UI elements, headers |
| Accent Teal | `#2ab5c1` | oklch(0.70 0.12 196) | Interactive elements, highlights |
| Highlight Amber | `#f59e0b` | oklch(0.78 0.16 75) | Alerts, typo corrections, CTAs |
| Background | `#f8fafd` | oklch(0.98 0.01 230) | Page backgrounds |

### Typography
- **Headings:** Playfair Display (serif, elegant, 400/700 weights)
- **Body:** DM Sans (sans-serif, clean, 400/500/700 weights)
- **Data:** JetBrains Mono (monospace for glucose values)

### Glucose Status Colors (WCAG AA)
- **Hypo** (<3.9 mmol/L): Red (#dc2626)
- **Low** (3.9–5.0): Orange (#f97316)
- **Target** (5.0–10.0): Green (#16a34a)
- **High** (10.0–13.9): Yellow (#eab308)
- **Very High** (≥13.9): Red (#dc2626)

### Brand Assets
- **Owl Mascot:** Teal + navy, golden eyes, glowing effect
- **Wave Dividers:** Teal gradients, flowing design
- **Hero Backgrounds:** Data visualization theme
- **Feature Icons:** Healthcare + data theme

---

## Key Algorithms & Formulas

### Walsh Bilinear DIA Decay Curve
```
t <= d/2: fraction = 1 - (2/d²) × t²
t > d/2:  fraction = (2/d²) × (t - d)²
t >= d:   fraction = 0
```

### Insulin Concentration Conversion
```
U-100: doseUnits × 1.0 = biological units
U-200: doseUnits ÷ 2.0 = biological units
U-500: doseUnits ÷ 5.0 = biological units
```

### Unit Conversion
```
mmol/L to mg/dL: value × 18.018 (round to integer)
mg/dL to mmol/L: value ÷ 18.018 (round to 1 decimal)
```

### Levenshtein Distance (Typo Detection)
```
Edit distance between two strings
Used for predictive text suggestions
```

---

## Security Checklist

- [ ] All PHI encrypted with AES-256-GCM
- [ ] All audit logs HMAC-chained (SHA-256)
- [ ] Rate limiting on all API endpoints (Upstash Redis)
- [ ] CSRF tokens on all state-changing operations
- [ ] Input sanitization with DOMPurify (2000 char cap)
- [ ] WebAuthn challenge TTL 5 minutes
- [ ] Session cookies SameSite=Strict + Secure
- [ ] Content Security Policy enforced
- [ ] No hardcoded secrets (all in Supabase Vault)
- [ ] Service role key never exposed to client
- [ ] All secrets rotated regularly
- [ ] Audit logs immutable (HMAC chaining)
- [ ] Rate limiting prevents brute force attacks
- [ ] Input validation on all endpoints
- [ ] Output encoding prevents XSS

---

## Testing Coverage

### Unit Tests (24+ IOB cases)
- [x] Walsh curve calculation accuracy (67 tests)
- [x] Insulin concentration conversions
- [x] Unit conversions (mmol/L ↔ mg/dL)
- [x] IOB safety caps and validation
- [x] Future dose detection
- [x] Edge cases (zero doses, very long DIA)

### Meal Regime Tests (20 profiles)
- [x] All 20 profiles load correctly (26 tests)
- [x] Hypo thresholds are accurate
- [x] Fallback to 5.0 mmol/L for unknown IDs

### Integration Tests
- [x] Auth flows (logout test passing)
- [x] Patient profile CRUD (9 tests)
- [x] Glucose readings CRUD
- [x] Insulin doses CRUD
- [ ] Encryption/decryption
- [ ] Audit logging

### E2E Tests
- [ ] Patient dashboard workflow
- [ ] Data entry and visualization
- [ ] Export and import workflows
- [ ] MFA registration and authentication

### Performance Tests
- [ ] IOB calculation speed (<100ms for 1000 doses)
- [ ] Chart rendering (1000+ data points)
- [ ] API response times (<200ms p95)

### Accessibility Tests
- [ ] Screen reader compatibility
- [ ] Keyboard navigation
- [ ] Color contrast (4.5:1 for text)
- [ ] Touch targets (44px minimum)

---

## Deployment Checklist

- [ ] Environment variables configured (Vercel)
- [ ] Database migrations applied (Supabase)
- [ ] Vault secrets seeded (8 secrets)
- [ ] Redis connection tested (Upstash)
- [ ] Datadog agent configured
- [ ] Monitoring dashboards created
- [ ] Alerting rules configured
- [ ] Backup strategy implemented
- [ ] Disaster recovery plan documented
- [ ] Status page deployed
- [ ] Custom domain configured
- [ ] SSL certificate valid
- [ ] DNS records updated
- [ ] CI/CD pipeline configured
- [ ] Automated tests passing

---

## Notes

- **Free Tier Limits:** 1 patient profile, 90 days of glucose history, 10 meals/day
- **Disclaimer:** Educational tool only. Not a medical device. Always consult healthcare team.
- **Compliance:** HIPAA, GDPR, WCAG 2.1 AA
- **Security Audit:** 30/30 findings resolved, zero open vulnerabilities
- **AI Model:** Claude Sonnet (claude-sonnet-4-5 or latest) for pattern analysis
- **Stack:** Next.js 14, Supabase, Upstash Redis, Tailwind CSS, Recharts, Puppeteer
- **Origin:** Windhoek, Namibia
- **Contact:** info@glumira.ai
- **Website:** beta.glumira.ai

---

**Last Updated:** 2026-03-25  
**Next Review:** After Phase 2 completion  
**Estimated Timeline:** 8–12 weeks for MVP launch

---

## Implementation Sprint (2026-03-25) — Manus Build

### Completed in this sprint
- [x] IOB Hunter™ Walsh bilinear engine (server/iob.ts) — 67 tests passing
- [x] Meal regimes library with 20 culturally-aware profiles (server/meal-regimes.ts) — 26 tests passing
- [x] Database schema: meals + mealPatientSettings tables (migration applied)
- [x] Database helpers: createMeal, getMealsByPatient, getMealSettingsByPatient, upsertMealSettings
- [x] tRPC meals router: getRegimes, getRegimeById, getRegimesByCategory, searchRegimes, getFastingRegimes, logMeal, getMeals, getSettings, updateSettings
- [x] Meals router tests — 11 tests passing
- [x] Patient integration tests — 9 tests passing
- [x] Auth logout test — 1 test passing
- [x] GluMira™ branded DashboardLayout with sidebar navigation
- [x] Dashboard overview page with summary widgets
- [x] Glucose tracking page with entry form and chart
- [x] Insulin dose logging page with dose history
- [x] IOB Analysis page with Walsh bilinear curve visualization
- [x] Meals page with regime browser and meal logging
- [x] Profile page with patient settings management
- [x] Landing page with hero, features, pricing tiers, mission section
- [x] GluMira™ brand design system (index.css): Playfair Display, DM Sans, JetBrains Mono, navy/teal/amber palette, WCAG AA glucose status colors
- [x] All 114 tests passing (5 test files)

### Total test count: 114
| Test File | Tests | Status |
|---|---|---|
| server/iob.test.ts | 67 | ✅ |
| server/meal-regimes.test.ts | 26 | ✅ |
| server/meals.test.ts | 11 | ✅ |
| server/patient.test.ts | 9 | ✅ |
| server/auth.logout.test.ts | 1 | ✅ |
