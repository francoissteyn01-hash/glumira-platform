# GROUP8-Client — Manifest

**Created:** 2026-03-29
**Source:** glumira-platform-main/client
**Filed to:** 04_CLAUDE/GROUP8-Client

## Summary

Complete client-side source code for the GluMira V7 platform. Contains all React/TypeScript frontend files including pages, components, hooks, UI library, onboarding story engine, gamification system, charts, and routing.

## Structure

| Folder | Contents |
| :--- | :--- |
| `public/` | Static assets, PWA manifest, Manus integration |
| `src/app/` | Next.js-style route pages (dashboard, auth, admin, pricing, offline) |
| `src/components/` | Reusable UI components, charts, clinician views, beta features, onboarding animations |
| `src/components/ui/` | shadcn/ui component library (buttons, forms, dialogs, etc.) |
| `src/components/onboarding/story-engine/` | Story Engine with 40+ persona-based animations |
| `src/components/gamification/` | Gamification overlay and reward system |
| `src/contexts/` | React contexts (Theme) |
| `src/hooks/` | Custom React hooks (auth, glucose export, telemetry) |
| `src/lib/` | Utility functions, tRPC client, gamification engine |
| `src/pages/` | Legacy page components (Dashboard, IOB, Meals, Pregnancy, ADHD, etc.) |
| `src/_core/` | Core hooks (useAuth) |

## File Count

- **Folders:** 158
- **Files:** 376
- **Total items:** 534

## Key Files

- `src/App.tsx` — Main application component
- `src/pages/Dashboard.tsx` — Primary dashboard page
- `src/components/onboarding/story-engine/StoryEngine.tsx` — Onboarding story engine
- `src/lib/gamification/GamificationContext.tsx` — Gamification provider
- `src/hooks/useAuth.ts` — Authentication hook
- `src/components/charts/NightscoutCGMChart.tsx` — CGM data visualization
- `src/components/charts/InsulinkStackingChart.tsx` — Insulin stacking chart
