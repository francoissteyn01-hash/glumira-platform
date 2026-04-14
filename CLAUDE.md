# GluMira™ V7 — Operating Framework (57 Rules)

**Auto-load at every session start.** Before ANY work: scan `git log --since=yesterday`, load this file, load `10_Visual-Design-Philosophy.txt`, load Founding Statement. State: "Framework loaded."

---

## 🔒 INSULIN LOCK — SUPERSEDES EVERYTHING BELOW FOR INSULIN / CHART / ENGINE WORK

Before ANY `Edit` / `Write` / `MultiEdit` touching **any of these files**:

- `src/iob-hunter/engine/iob-engine.ts`
- `src/iob-hunter/engine/insulin-profiles.ts`
- `src/iob-hunter/components/BasalLifecycleChart.tsx`
- `src/iob-hunter/components/BasalActivityChart.tsx`
- `src/iob-hunter/components/IOBHunterChart.tsx`
- `src/pages/BasalParametersPage.tsx`
- `src/pages/IOBHunterPage.tsx`
- `tresiba-interpretation-test.html`

Claude MUST, in this order, in the SAME reply, **before any tool call**:

1. **Read `INSULIN_LOCK.md`** at the repo root.
2. **Paste the matching row(s)** for every insulin touched by the change.
3. **State the prose diff** — current behavior vs proposed behavior, with `pk_source` citation.
4. **Wait for the founder to type:** `APPROVE-INSULIN-EDIT`.

No row paste + no prose diff + no `APPROVE-INSULIN-EDIT` phrase → **no edit**.
Questions ("why", "how come", "what if") are never authorizations.
Only these words authorize: `go`, `build`, `ship it`, `apply`, `yes apply`, `approved`, `APPROVE-INSULIN-EDIT`, `commit`.

**The `.claude/hooks/insulin-lock-check.sh` hook enforces banned patterns at the tool-call boundary.** If the hook blocks with `🛑 INSULIN-LOCK BLOCKED`, read its stderr message and comply. Do not retry the same edit. Do not attempt to bypass. Acknowledge the block to the founder and request direction.

**Engine change protocol.** The engine (`iob-engine.ts`) is ground truth. Touching it requires: (1) posting the diff in prose with citations, (2) explicit `APPROVE-INSULIN-EDIT` phrase, (3) if tests fail after the change, **do not auto-update tests** — report failures and wait.

**Universal chart invariants** (from `INSULIN_LOCK.md`):
- Never start at zero. Steady state always — prior-cycle residual present at the left edge.
- No vertical spike at injection. New dose ramps up smoothly onto existing non-zero residual.
- Peakless insulins (Tresiba, Toujeo, Levemir) never draw a peak.
- No invented curve functions — only `calculateIOB` / `calculateActivityRate`.
- Cadence is locked per insulin — never copy Levemir's 12 h BID onto Tresiba, never copy Tresiba's 24 h once-daily onto Levemir.

---

## Group 1: Core Operating (8 Rules)

1. Zero prompts, zero confirmations — execute fully autonomously. Fix everything, push everything, don't stop between steps.
2. Never say "now it should work" — verify it actually works first.
3. Mobile-first always — user tests on Samsung S23 FE. Every layout change must work on mobile first, desktop second.
4. Don't send the user on debugging chases — compile one comprehensive solution.
5. Archive, never delete (except 0-byte empty files and exact duplicates).
6. Git push after changes — user expects changes to be committed and pushed so they can see results on glumira.ai immediately.
7. No spouting: No "Let me…", no "I'll now…", no recap. Tools direct. 1-line blocks only. Markdown lists fine, prose paragraphs not.
8. At session start: Scan git/Drive since yesterday + load CLAUDE.md/MEMORY.md/Visual-Philosophy/Founding.

## Group 2: IOB Hunter Specific (10 Rules)

9. Layer by layer: Basal navy base → bolus teal → total outline. Single-Tresiba: depot 72h (-24h start).
10. Risk zones: DangerBrackets (warning/critical). Timing suggestions ONLY — never dosage volume.
11. 60-sec insight: Pharmacology overview + "Peak X@HH:MM — full picture before making more treatment decisions."
12. What-if: Green dashed overlay (#2E9E5A) for improved basal/bolus timing.
13. Basal-first: Tab basal-only view. Trough analysis: Redistribute timing, not dose.
14. Low data response: "Insulin A pharmacology (cite Plank 2005). Add boluses for detailed analysis."
15. PK cited: FDA/EMA/PMID per profile. Plank PMID:15855574 for Levemir DOA dose-dependence. Research every time.
16. Free minimum: Stacking graph + basal timing suggestions ungated. Pro: Save/PDF/multi-what-if/AI insights.
17. Graph start: NEVER 0 IOB. Prior-day tail always present from minute 0.
18. Adverse reactions, drug interactions, use in specific populations: Documented in 00.23, wired into modules (pregnancy/paediatric/renal/hepatic).

## Group 3: Design/Brand (12 Rules)

19. Colors LOCKED: Navy #1A2A5E, Deep #0D1B3E, Teal #2AB5C1, Amber #F59E0B, White #FFFFFF, Interior #F8F9FA.
20. Fonts LOCKED: Playfair Display headings, DM Sans body, JetBrains Mono clinical data.
21. Design tracks: Clinical Depth (dark navy) for landing/auth. Scandinavian Minimalist (white #F8F9FA) for app interior.
22. Mira: Wings-spread, amber heraldic shield on chest, NO forehead gem, NO teardrop. Blend into background with mixBlendMode lighten.
23. No teal copy from mockups, no graphs copy. Observatory palette per 10_Visual-Design-Philosophy.txt.
24. Hero: GluMira™ big/bold/white (clamp 52-88px), tagline "made visible" in amber with glow. No casino flash.
25. Thumb CTA: 48px+ minimum touch target, full-width on mobile.
26. No personal names, no locations, no private data anywhere in codebase. P0 violation.
27. Educational platform, NOT a medical device. Disclaimers on every analysis surface.
28. **14-day free trial.** Always. Never 30. (Updated 2026-04-14 per financial model: 30-day trial breaks unit economics; 14-day maximizes conversion velocity.)
29. Archive old versions to 99_ARCHIVE. Never reference v6 — platform is V7.
30. No AI-tell writing: No Oxford-comma-and lists ("X, Y, and Z"). No parenthetical asides in brackets. Use em-dashes or short sentences.

## Group 4: Beast Mode / 55 Tasks (15 Rules)

31. 55 tasks → V7 intelligent clinical assistant.
32. Group1: Master rules/platform core (PK engine, IOB stacking).
33. Group2: Modules (Pregnancy/ADHD/Thyroid/School/Beta).
34. Group3: Phases/Strategy/Dashboards.
35. Group4: Code (Core-Engine, Module-Scripts, Agents).
36. Group5: Business/Legal/Brand/Marketing/Research/Next.
37. Filing: 00_PROMPT-FIX-FINAL.md supersedes all previous prompts.
38. Naming convention: [FOLDER].[SEQ]_[Description]_v[X.X].[ext].
39. Audit: Comprehensive (Patient Safety v2, Remediation Checklist).
40. Complete anonymity enforced. No geography, no builder location, no origin story visible. Privacy lock all.
41. DNS propagation: Wait full loop before verify.
42. TM on GluMira™ everywhere in display text (not code variables).
43. Owl on landing page — always.
44. Beast Mode: Parallel execution, no stop between tasks.
45. Next Actions: Nightscout letter, Strategy v1.

## Group 5: Execution/Presentation/Filing (12 Rules)

46. Inspect/search updates since last session ALWAYS — git log + Drive changes.
47. Filing Register: Resolve unfiled documents (landing/chat/audit).
48. Superseded documents → Archive (per v1.3 Index).
49. No duplicates/conflicts (Migration Log v1.2).
50. Brand disregard → P0 priority. TM missing, name leak, palette violation = stop and fix.
51. Privacy: No email addresses, no real names. Lock Manus/Lovable/GitHub/Supabase access.
52. Don't stop publishing until 55 tasks complete.
53. Mobile UX: Card/tabbed layout, no infinite scroll, thumb-reachable CTAs.
54. Verify: Build (tsc --noEmit) → deploy → live test on glumira.ai before declaring done.
55. Presentation: Tables for research data, framing, step-by-step data generation and interpretation.
56. Diligent/True: Cite sources after every claim. No assumptions. Research every time.
57. Grok accurate: Full framework governs EVERY response — graphs, programming, execution, presentation, filing.

---

## IOB Hunter Operating Contract

Before ANY IOB Hunter work, re-read in order:
1. Founding Statement (`G:\My Drive\GLUMIRA\GluMira-V7\00_MASTER\00.2_Founding-Statement.docx`)
2. This CLAUDE.md (all 57 rules)
3. Brand rules (Group 3 above)
4. Visual Design Philosophy (`G:\My Drive\GLUMIRA\GluMira-V7\10_BRAND\10_Visual-Design-Philosophy.txt`)

## The Mission

GluMira exists for patients who cannot afford premium glucose monitoring. The platform prioritizes accessibility over profit. Revenue from Pro and AI tiers directly funds the free tier. The science of insulin, made visible.

## Project Context

- **Code:** github.com/francoissteyn01-hash/glumira-platform → Vercel → glumira.ai + glumira.app
- **Stack:** React + Vite + TypeScript | Express + tRPC + Drizzle | Supabase PostgreSQL
- **Deployment:** Vercel (dual-region for EMRO performance)
