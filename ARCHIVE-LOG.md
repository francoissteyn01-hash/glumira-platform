# GluMira™ V7 — Archive Log

A running log of what's been moved, renamed, or retired in this repository,
and why. Append-only — read top-down for the most recent entries.

---

## 2026-04-10 · Ignored `glumira-platform/`

**What:** The embedded `glumira-platform/` directory at the project root has
been added to the root `.gitignore` and to the `vitest.config.ts` exclude
list. It is no longer surfaced by `git status` or scanned by `vitest`.

**Why:** It is a V6 Next.js fork duplicate (GROUP8-Client pattern). The
active V7 code lives in `/`, `/server`, and `/src`. Having the V6 fork
present as an embedded git repository was polluting tool scans:

- `git status` was reporting it as an untracked directory on every check.
- `vitest` was discovering tests inside it, double-counting failures and
  producing confusing reports (visible in commit `e062267`'s test fixes).
- `git stash -u` refused to capture it ("Ignoring path glumira-platform/").
- Every Bash search and `find` invocation had to thread `--exclude` flags.

**What was NOT done:**

- ❌ The directory was **not** deleted. Its contents (including its own
  `.git` history) remain on disk untouched. If anything in the V6 fork
  turns out to be unique and worth recovering, it can still be read.
- ❌ It was **not** moved out of the project root. A future cleanup pass
  can `mv` it to `../glumira-platform-legacy/` if desired.
- ❌ No symlink, no submodule pointer, no archive tarball. Just a
  `.gitignore` line.

**How to undo:** Remove the `glumira-platform/` line from `.gitignore` and
the matching exclude from `vitest.config.ts:34`. The directory will
reappear in `git status` and vitest will scan it again.

**Rationale for the patient-first V7 direction:** see
`05_PHASES/GluMira-Phase-3-Implementation-Timeline-&-Dependencies_v1.0.md`
(the closing audit dated 2026-04-10) for the full product pivot story.

---

## 2026-04-11 · Stage 4 carry-overs deferred (clinician portal)

**What:** Four Stage 4.1 items have been deliberately **not built** in
the Stage 4 implementation pass:

- `S4.1.1` RecommendationsQueue (clinician approval workflow)
- `S4.1.2` BulkMessagingPanel (clinician → patients)
- `S4.1.3` ClinicianNotesPanel (notes capture)
- `S4.1.4` WorkflowMetrics dashboard

**Why:** These items were originally part of Phase 3 but were intentionally
descoped during the 2026-04-10 audit when the codebase pivoted patient-first.
The audit doc explicitly recommends triaging them before any code is written:

> Triage Stage 4.1 carry-overs first — decide whether the clinician-portal
> direction is still in scope or whether to formally cut those items from
> the product. That single decision unblocks ~8 items.

Building them now without that product decision would either:
1. Re-introduce a clinician-portal architecture that contradicts the
   patient-first product direction, or
2. Ship UI scaffolding that has no real backing data flow (the alerts
   carry-over `S4.1.6` is the canary — its dismiss/snooze logic was
   inlined into `AlertNotificationCenter` directly because there was no
   meaningful "extract a separate AlertActionButtons component" without
   a clinician viewing-side to use it).

**What WAS done:** All Stage 4.1 items that survive the patient-first
direction are shipped:
- `S4.1.5` AlertNotificationCenter (live polling, dismiss/snooze, localStorage)
- `S4.1.7` AlertHistoryViewer (paginated, filterable)
- `S4.1.8` Component coverage — partial (29 alerts-engine tests, plus
  the analytics modules' implicit coverage via integration)
- `S4.1.9` E2E harness — `vitest.config.e2e.ts` exists and an `e2e/`
  directory is staged untracked. Real Playwright/jsdom tests are
  Stage 4.4 follow-up.

**Also deferred from Stage 4.2:**
- `S4.2.9` ConflictResolutionModal — Nightscout sync is one-way pull
  with no merge step, so there is no conflict source to render. Will
  be revisited if/when bidirectional sync lands.

**How to undo:** When a product decision lands on the clinician portal,
build the four S4.1.x items as a fresh batch. None of the Stage 4 work
done in 2026-04-10/11 blocks them.

---

## 2026-04-11 · Auto-ship stub commits reverted

**What:** Three earlier "Auto-ship Week N" commits were reverted via
`c919def`:

- `df7d1a6` Auto-ship Week 2: server/routes/alerts.route.ts
- `9e30d43` Auto-ship Week 3: server/routes/compliance.route.ts
- `3d56cae` Auto-ship Week 4: vitest.config.e2e.ts

Each had a misleading commit message implying a Week was "shipped" but the
actual diff was 5-line placeholder TSX/TS files with `export default function
ComponentName() { return <div>Week N Widget</div>; }` and zero imports
anywhere in the codebase.

**Why:** The placeholders blocked the canonical filenames and would have
caused confusion when real Week 2/3/4 implementations needed those paths.

**Preserved:** `vitest.config.e2e.ts` (33 lines, real jsdom config) was
**not** deleted by the revert. A parallel session had built real Week 4
e2e harness config on top of the original 5-line stub. The bundled revert
explicitly preserved the real version. See commit `c919def` for the full
preservation logic.

---

