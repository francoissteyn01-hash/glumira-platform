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
