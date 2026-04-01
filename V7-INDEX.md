# GluMira™ V7 — Active File Index
Generated: 2026-04-01

## Active V7 Codebase (Desktop — deploys to glumira.ai via Netlify)

### Core App (Vite + React)
| File | Status |
|------|--------|
| App.tsx | Active — root routes + nav + auth guard |
| index.html | Active — SPA entry point |
| index.css | Active — global styles |
| main.tsx | Active — React root |
| vite.config.ts | Active — Vite config with aliases |
| tsconfig.json | Active |
| tailwind.config.js | Active |
| postcss.config.js | Active |

### Pages (src/pages/)
| File | Status |
|------|--------|
| LandingPage.tsx | Active — hero, countdown, CTA |
| AuthPage.tsx | Active — sign in/register/caregiver/reset |
| DashboardPage.tsx | Active |
| EducationPage.tsx | Active |
| MiraPage.tsx | Active |
| BadgesPage.tsx | Active |
| FAQPage.tsx | Active |
| SettingsPage.tsx | Active |

### Components (src/components/)
| File | Status |
|------|--------|
| MiraOwl.tsx | Active — inline SVG owl (replaces all PNGs) |
| ProtectedRoute.tsx | Active |

### Extended Modules (client/)
| File | Status |
|------|--------|
| client/src/pages/PregnancyPage.tsx | Active |
| client/src/pages/PregnancyModule.tsx | Active |
| client/src/pages/PaediatricModule.tsx | Active |
| client/src/pages/SchoolCarePlanModule.tsx | Active |
| client/src/pages/SchoolCarePlanPage.tsx | Active |
| client/src/pages/MenstrualCycleModule.tsx | Active |
| client/src/lib/pregnancy-glucose.ts | Active |
| client/src/lib/pediatric-dose.ts | Active |
| client/src/lib/school-care-plan.ts | Active |
| client/src/lib/menstrual-cycle-impact.ts | Active |
| client/src/components/SchoolCarePlanForm.tsx | Active |
| client/src/components/MiraOwlBadge.tsx | Active |

### Server
| File | Status |
|------|--------|
| server/index.ts | Active — Express entry |
| server/router.ts | Active |
| server/trpc.ts | Active |
| server/db/ | Active — Drizzle schema + connection |
| server/analytics/ (13 files) | Active |
| server/routes/ (17 files) | Active |
| server/middleware/ (2 files) | Active |
| server/meals/carb-counter.ts | Active |

### HTML Reference Pages
| File | Status |
|------|--------|
| glumira-landing.html | Reference — standalone HTML version |
| glumira-auth.html | Reference — standalone HTML version |
| glumira-dashboard.html | Reference — standalone HTML version |
| glumira-iob-calculator.html | Reference — standalone HTML version |
| glumira-brand-guidelines.html | Reference — brand spec |

### Deployment Config
| File | Status |
|------|--------|
| netlify.toml | Active — Netlify SPA config |
| package.json | Active |
| .env.example | Active |
| .gitignore | Active |

### Reports (x_xx.0-Reports/)
| File | Status |
|------|--------|
| Marketing-Strategy-V7.md | Report |
| Social-Media-Plan.txt | Report |
| Downgrade-Policy-V7.md | Report |
| Build-Blocks-Master-V7.md | Report |
| Content-Research-V7.md | Report |
| Mira-Education-0to12-V7.md | Report |
| IOB-Hunter-Core-Engine-Logic.pdf | Report |
| Subscription-Tier-Logic.pdf | Report |
| + 14 more (see x_xx.0-Reports/) | Report |

### Public Assets
| File | Status |
|------|--------|
| public/story-school.json | Active — school care plan story data |

---

## Drive Archive (G:/My Drive/04_CLAUDE) — Still Relevant

| Folder | Purpose |
|--------|---------|
| 02_Tag-Lines/ | Brand tag lines reference |
| 03_Downgrade-Policy/ | Subscription downgrade rules |
| 04_Build-Blocks/ | Architecture reference |
| 05_Marketing-Strategy/ | Go-to-market plan |
| 06_Social-Media-Plan/ | Social media content calendar |
| 07_Mira-Education-0-12/ | Children's education framework |
| 08_Mira-Content-Research/ | Mira AI content library |
| 09_Image-Registry/ | Image tracking reference |
| GROUP2-Auth-Patients/ | Auth & patient schema specs |
| GROUP3-IOB-Engine/ | IOB calculator specs & profiles |
| GROUP4-Modules/ + GROUP4-Modules-Final/ | Module specs & implementations |
| GROUP5-UI-Pages/ | UI page specs & components |
| GROUP6-Integrations/ | Nightscout, Stripe, cron specs |
| GROUP7-Beta-Launch/ | Beta onboarding & analytics |
| Foundation-Batch-2026-03-29/ | Organized server/client source archive |
| MISSING-ROUTES/ (extracted .ts files) | Route implementations |

---

## Legacy (C:/Users/franc/Desktop/GluMira-Legacy) — Archived

| Folder | Why Archived |
|--------|-------------|
| GROUP8-Client-NextJS/ | Next.js app/ router — not V7 (Vite) |
| glumira-platform-main-duplicate/ | Double-nested duplicate of platform repo |
| Code-based-files-for-manus/ | Duplicate of Foundation-Batch content |
| Foundation-Batch-duplicate-zip/ | Nested ZIP extract duplicate |
| MISSING-ROUTES-ZIPs/ | ZIP archives (extracted .ts kept in Drive) |
| ZIP-FILES/ | All ZIP archive backups |
| archived-images/ | 3 PNGs removed from live site |
