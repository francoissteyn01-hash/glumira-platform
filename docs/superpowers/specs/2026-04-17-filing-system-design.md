# GluMira V7 — Canonical Filing System Design
**Date:** 2026-04-17  
**Status:** Approved by Founder  
**Supersedes:** All prior filing registers, Directorate Filing Register v1.x, Doc-Index variants  
**Effective:** Immediately upon implementation

---

## 1. Problem Statement

The current filing system has accumulated the following pathologies over multiple build cycles:

- **Duplicate folder**: `18_CLAUDE_CODE_MEMORY` (underscore) and `18_Claude Code Memory` (spaces) — same number, same purpose
- **Sequence gaps**: Numbers 04, 07, 14, 17 are missing or orphaned across the top-level domain scheme
- **Cross-contamination**: Files with `13_*` prefix living inside `00_MASTER` and `06_CODE`; `04.x` files inside `01_PLATFORM_CORE`, `02_MODULES`, `06_CODE`; `99.x` archive files scattered across all active domains
- **`00_MASTER` is a junk drawer**: 70+ files including audit reports, code files, financial models, competing filing registers (v1.0, v1.3, "superseded"), and duplicated content
- **`13_RESEARCH` nearly empty**: The most credibility-critical folder contains only a README
- **Flat duplicates alongside subfolders**: `MODULE-Pregnancy_v1.0/` folder coexists with `PM01-Pregnancy-Spec_v1.0.txt` flat file in `02_MODULES`
- **`GluMira-Legacy/`** sits at Drive root with no number prefix, acting as a second unmanaged archive
- **Module numbering inconsistent**: V5, V6, and V7 each use different PM numbering schemes with no reconciliation
- **Archive Director position vacant**: No human or automated process has successfully enforced prior filing rules

**Root cause:** The system was too complex to enforce without a dedicated curator. The fix is structural simplicity enforced by Claude at every session start — no human director required.

---

## 2. Design Goals

1. **External credibility** — A clinical researcher, IRB reviewer, or investor opens the Drive and immediately understands the structure without reading a README
2. **Internal navigability** — Claude locates any document within 2 seconds using canonical IDs
3. **Self-enforcing** — The Filing Constitution (5 rules) is enforced automatically at every session start via CLAUDE.md Rule 8a
4. **Research-worthy** — `01_Research/` contains a properly organised, citable insulin PK and clinical evidence library
5. **No Archive Director needed** — Simplicity removes the need for a dedicated curator

---

## 3. Top-Level Domain Structure

### Google Drive: `G:/My Drive/GLUMIRA/GluMira-V7/`

```
GluMira-V7/
├── 00_MASTER/       Founding docs · master index · operating contracts · filing constitution
├── 01_Research/     Insulin PK library · clinical citations · evidence base · studies
├── 02_Clinical/     Patient safety · adverse reactions · IRB · audit trails · drug interactions
├── 03_Platform/     Architecture · specs · build reports · code docs · PK engine reference
├── 04_Brand/        Visual identity · Mira spec · typography · voice templates · colour palette
├── 05_Business/     Financial models · legal · marketing · strategy · competitive analysis
├── 06_Operations/   Claude memory · session logs · filing registers · deployment notes
├── 07_Education/    Patient education · glossary · public resources · beta docs
└── 99_Archive/      One-way door — superseded · legacy · duplicates · v5/v6 content
```

### Migration Map — Current → Canonical

| Current Folder | Migrates To |
|---|---|
| `01_PLATFORM_CORE` | `03_Platform/` |
| `02_MODULES` | `03_Platform/Modules/` |
| `03_STRATEGY` | `05_Business/Strategy/` |
| `05_PHASES` | `06_Operations/Build-Phases/` |
| `06_CODE` | `03_Platform/Code-Docs/` |
| `08_BUSINESS` | `05_Business/` |
| `09_LEGAL` | `05_Business/Legal/` |
| `10_BRAND` | `04_Brand/` |
| `11_MARKETING` | `05_Business/Marketing/` |
| `12_EDUCATION` | `07_Education/` |
| `13_RESEARCH` | `01_Research/` |
| `15_MIRA` | `04_Brand/Mira/` |
| `16_BADGES` | `04_Brand/Badges/` |
| `18_CLAUDE_CODE_MEMORY` + `18_Claude Code Memory` | `06_Operations/Claude-Memory/` (merged, one canonical folder) |
| `GluMira-Legacy/` | `99_Archive/Legacy/` |
| `00_MASTER` (junk drawer contents) | Core governance docs stay; audit/filing docs → `06_Operations/`; research docs → `01_Research/`; code files → `99_Archive/` |

---

## 4. Internal Sub-Taxonomy

### `00_MASTER/`
```
00_MASTER/
├── Founding-Statement_vX.X.docx
├── Master-Index_vX.X.md               ← single index, replaces all competing versions
├── Filing-Constitution_vX.X.md        ← the 5 rules (Section 6)
├── Operating-Contract_vX.X.md         ← CLAUDE.md companion doc
└── Insulin-Lock_vX.X.md               ← PK engine governance
```
**Rule:** Nothing else ever lives here. If a file doesn't fit one of these five categories, it doesn't belong in `00_MASTER/`.

### `01_Research/`
```
01_Research/
├── Insulin-PK/                        ← pharmacokinetic profiles, DOA tables, peak data
├── Clinical-Evidence/                 ← peer-reviewed studies, PMID citations
├── Drug-Interactions/                 ← interaction databases, adverse event data
├── Competitive-Intelligence/          ← Dexcom, Libre, market analysis
└── Reference-Library/                 ← Bernstein, Plank 2005, FDA/EMA source docs
```

### `02_Clinical/`
```
02_Clinical/
├── Patient-Safety/                    ← safety ratings, risk frameworks
├── Audit-Trails/                      ← verification reports, remediation checklists
├── IRB-Readiness/                     ← consent forms, ethics protocols
├── Adverse-Reactions/                 ← documented in 00.23, population flags
└── Clinical-Flags/                    ← P001 reports, patient-specific clinical notes
```

### `03_Platform/`
```
03_Platform/
├── Architecture/                      ← system design, tRPC, Supabase, Drizzle schema
├── Specs/                             ← feature specs per module
├── Modules/                           ← 20 canonical modules (see Section 5)
├── Code-Docs/                         ← extracted code docs, engine logic references
├── PK-Engine/                         ← iob-engine references, insulin profiles, lock docs
└── Build-Reports/                     ← completion reports, TypeScript audit outputs
```

### `04_Brand/`
```
04_Brand/
├── Visual-Identity/                   ← colour palette, typography, design philosophy
├── Mira/                              ← owl spec, mixBlendMode rules, asset variants
├── Badges/                            ← badge designs, Mira shield variants
├── Voice/                             ← Mira voice templates, writing style guide
└── Logo/                              ← logo spec PDF, export variants
```

### `05_Business/`
```
05_Business/
├── Financial-Models/                  ← V7 model, Ramadan variant, unit economics
├── Legal/                             ← TM registration, privacy policy, T&Cs
├── Marketing/                         ← campaign docs, social, Facebook action plan
├── Strategy/                          ← next actions, T1D global strategy, roadmap
└── Competitive-Analysis/              ← market positioning, Dexcom analysis
```

### `06_Operations/`
```
06_Operations/
├── Claude-Memory/                     ← merged canonical Claude Code memory
│   ├── _index/
│   └── Sessions/
├── Filing-Registers/                  ← current register only; all prior → Archive
├── Build-Phases/                      ← phase execution logs, overnight reports
├── Beta-Program/                      ← beta testing protocol, consent, feedback (moved from modules)
├── Deployment/                        ← Vercel config, DNS notes, deploy logs
└── Automation/                        ← auto-filer skill, hooks, cron configs
```

### `07_Education/`
```
07_Education/
├── Patient-Guides/                    ← Beta getting-started, how-to-use docs
├── Glossary/                          ← insulin concepts glossary, curve definitions
├── Clinical-Explainers/               ← 60-sec insight templates, PK overviews
└── Public-Resources/                  ← early owl pre-registration, public-facing docs
```

### `99_Archive/`
```
99_Archive/
├── Legacy-V5/
├── Legacy-V6/
├── Superseded-Docs/                   ← anything marked SUPERSEDED, stripped of that tag
├── Chat-Sessions/                     ← old Manus/Lovable exports
├── Duplicates/                        ← exact duplicates confirmed before deletion
└── Code-Experiments/                  ← HTML demos, patch files, one-off scripts
```
**Rule:** No internal numbering inside `99_Archive/`. It is unstructured by design. Label bins, don't sequence them.

---

## 5. Canonical Module Registry

20 modules total. Beta-Testing is removed from the module list — it is operational, not clinical, and moves to `06_Operations/Beta-Program/`.

| ID | Module | Status | Clinical Basis |
|---|---|---|---|
| PM01 | Pregnancy | Built | Endocrinology, obstetric guidelines |
| PM02 | ADHD | Built | Psycho-neuro-endocrinology |
| PM03 | Thyroid | Built | Thyroid-glucose interaction research |
| PM04 | School-Care-Plan | Built | Paediatric diabetes management |
| PM05 | Autism-Spectrum | Built (file only) | ASD-insulin sensitivity literature |
| PM06 | Paediatric | Planned | CLAUDE.md Rule 18 |
| PM07 | Renal | Planned | CLAUDE.md Rule 18 |
| PM08 | Hepatic | Planned | CLAUDE.md Rule 18 |
| PM09 | Exercise | Planned (High priority) | Exercise physiology, insulin sensitivity |
| PM10 | Menstrual-Cycle | Planned (High priority) | Reproductive endocrinology, ISF cycling |
| PM11 | Alcohol | Planned | Hepatic gluconeogenesis inhibition |
| PM12 | Travel | Planned | Travel medicine, time-zone insulin adjustment |
| PM13 | Stress | Planned | Cortisol-insulin resistance research |
| PM14 | Fasting-Ramadan | Planned | Islamic fasting clinical guidelines |
| PM15 | Nutrition | Planned | Dietary impact on glucose metabolism |
| PM16 | Sleep | Planned | Sleep-glucose homeostasis research |
| PM17 | Post-Surgical | Planned | Surgical stress response, insulin protocols |
| PM18 | Psychological | Planned | Diabetes distress, mental health |
| PM19 | Community | Planned | Peer support, group management |
| PM20 | Environmental | Planned | Climate, altitude, environmental glucose effects |

### Module Sub-Structure (each PM folder)
```
PM01-Pregnancy/
├── PM01_Spec_vX.X.md
├── PM01_Backend-Logic_vX.X.md
├── PM01_Clinical-Evidence_vX.X.md
└── PM01_Test-Cases_vX.X.md
```
Planned modules contain a single `PMxx_Spec-Placeholder_v0.1.md` until build begins.

---

## 6. Canonical File Naming Convention

**One rule governs every file:**

```
DOMAIN.SEQ_Descriptive-Name_vX.X.ext
```

| Part | Rule | Example |
|---|---|---|
| `DOMAIN` | Two-digit folder number | `01` = Research, `03` = Platform |
| `SEQ` | Three-digit sequence, tens-spaced | `010`, `020`, `030` |
| `Descriptive-Name` | Title-case, hyphens not spaces | `Insulin-PK-Levemir-Profile` |
| `_vX.X` | Semantic version, mandatory | `_v1.0`, `_v2.3` |
| `.ext` | Actual file extension | `.md`, `.pdf`, `.ts`, `.docx` |

**Examples:**
```
01.010_Levemir-PK-Profile_v1.0.md
01.020_Plank-2005-DOA-Study_v1.0.pdf
02.010_Patient-Safety-Rating_v2.0.md
03.010_Platform-Architecture_v1.0.md
03.020_IOB-Engine-Logic_v1.0.md
06.010_Filing-Register_v1.0.md
```

**Migration rules for existing files:**
- Drop `99.x` prefix from active files — assign real domain ID or move to `99_Archive/`
- Version conflicts: keep highest version number, archive the rest
- `SUPERSEDED` files: strip the tag, move to `99_Archive/Superseded-Docs/`, done
- Files inside `99_Archive/`: no renaming required — the archive is unstructured

---

## 7. Filing Constitution

**5 rules. Effective immediately. Enforced by Claude at every session start.**

```
GLUMIRA V7 — FILING CONSTITUTION
Effective: 2026-04-17
Supersedes: All prior filing registers and Directorate Filing Register versions

RULE 1 — ONE HOME PER FILE
Every file lives in exactly one domain folder. No copies across domains.
Cross-references use links, not duplicate files.

RULE 2 — CANONICAL ID ON CREATION
Every new file gets DOMAIN.SEQ_Name_vX.X.ext at creation.
No file is ever saved without a version number.

RULE 3 — ARCHIVE IS A ONE-WAY DOOR
Superseded → 99_Archive/Superseded-Docs/.
Nothing returns from Archive to an active domain.

RULE 4 — 00_MASTER HOLDS ONLY GOVERNANCE DOCS
00_MASTER contains exactly: Founding Statement, Master Index,
Filing Constitution, Operating Contract, Insulin Lock.
Nothing else. Ever.

RULE 5 — CLAUDE ENFORCES AT SESSION START
At every session start, Claude scans for: files in wrong domains,
missing version numbers, duplicates outside Archive,
anything in 00_MASTER that isn't a governance doc.
Violations are reported as a numbered list before any other work begins.
```

---

## 8. CLAUDE.md Changes Required

### Rule 8a — New rule added to Group 1

> **Rule 8a — Filing Constitution check.** At every session start, after loading CLAUDE.md, Claude checks for Filing Constitution violations: files in wrong domain folders, files without version numbers, duplicates outside `99_Archive/`, anything in `00_MASTER` that isn't a governance doc. Report violations as a numbered list before proceeding. Do not silently ignore them.

### Rule 8b — New rule added to Group 1

> **Rule 8b — Session-end next-actions update.** At the close of every session (before network drop, on task completion, or when the user signals done), Claude writes a timestamped update to `G:/My Drive/GLUMIRA/GluMira-V7/05_Business/Strategy/05.010_Strategy-Next-Actions_v1.0.md`. The update appends: date/time, tasks completed this session, tasks still open, and the single most important next action. This is written to Drive — not the repo — so it survives network interruptions and session loss.

### Session Start Hook — Updated

```
SESSION START:
1) Read c:/glumira-v7/CLAUDE.md (57 rules + INSULIN LOCK + operating contract) FIRST — state "Framework loaded."
2) Scan git log --since=yesterday in c:/glumira-v7.
3) Identify the active workstream from cwd or user request, then read the most recent session file
   in G:/My Drive/GLUMIRA/GluMira-V7/06_Operations/Claude-Memory/Sessions/{workstream}/
4) Run Filing Constitution check (Rule 8a): scan 00_MASTER for non-governance files,
   scan active domains for cross-contamination, report violations before any other work.
5) Read G:/My Drive/GLUMIRA/GluMira-V7/05_Business/Strategy/05.010_Strategy-Next-Actions_v1.0.md
   — load open items as context before any work begins.
```

### Session End Hook — New

```
SESSION END (on task completion or user signals done):
1) Append to G:/My Drive/GLUMIRA/GluMira-V7/05_Business/Strategy/05.010_Strategy-Next-Actions_v1.0.md:

   ## [YYYY-MM-DD HH:MM] Session Close
   **Completed:** [list of tasks finished this session]
   **Open:** [tasks started but not finished]
   **Next action:** [single most important thing to do next session]
   **Workstream:** [active workstream name]

2) Write session memory file to 06_Operations/Claude-Memory/Sessions/{workstream}/
   GLUMIRA_SESSION_YYYYMMDD_HHMM.md
```

### Next-Actions File Structure

`05.010_Strategy-Next-Actions_v1.0.md` is a rolling append-only log:

```markdown
# GluMira™ — Strategy Next Actions
_Auto-updated by Claude at every session close. Never manually edited above the latest entry._

---

## [YYYY-MM-DD HH:MM] Session Close
**Completed:** Filing system design spec approved and written
**Open:** Implementation plan pending
**Next action:** Execute Drive folder migration — Phase 1 (create new structure)
**Workstream:** filing-system

---
[prior entries below, newest at top]
```

---

## 9. Code Repository Root Cleanup

The following files currently sitting at `C:/glumira-v7/` root are misplaced:

| File | Action |
|---|---|
| `20260329_badges_mira_schema.sql`, `20260329_beta_tables_addendum.sql`, `glumira-schema.sql` | Move to `drizzle/` |
| `FINANCIAL-MODEL-RAMADAN-V2.md`, `FINANCIAL-MODEL-V7.md` | Drive only (`05_Business/Financial-Models/`); delete from repo |
| `backup-stash-0.patch`, `backup-stash-0-untracked.patch` | Delete (git stash is the record) |
| `glumira-auth.html`, `glumira-dashboard.html`, `glumira-iob-calculator.html`, `glumira-landing.html`, `glumira-brand-guidelines.html` | `99_Archive/Code-Experiments/` or delete |
| `x_xx.0-Reports/` | Rename to `docs/reports/` |
| `00_MASTER/` in repo root | Delete — Drive is the document layer, not the repo |
| `App.tsx`, `main.tsx`, `index.css` at root | Move to `src/` |
| `glumira-platform/` | Assess: if active code, move into `src/`; if legacy, archive |

---

## 10. Success Criteria

- [ ] A researcher opening the Drive reads domain names, not numbers, and immediately understands the structure
- [ ] Claude can locate any document within 2 seconds using its canonical `DOMAIN.SEQ` ID
- [ ] `00_MASTER/` contains exactly 5 governance documents and nothing else
- [ ] `01_Research/` contains a populated, citable insulin PK library
- [ ] `99_Archive/` contains all superseded content — no `SUPERSEDED` files remain in active domains
- [ ] No file in any active domain lacks a version number
- [ ] Both `18_CLAUDE_CODE_MEMORY` folders are merged into `06_Operations/Claude-Memory/`
- [ ] All 20 module folders exist in `03_Platform/Modules/`, built or placeholder
- [ ] Session start hook enforces Filing Constitution check (Rule 8a)
- [ ] Session-end hook appends to `05.010_Strategy-Next-Actions_v1.0.md` on Drive after every session
- [ ] Session start hook reads Next-Actions file as context before work begins
- [ ] `05.010_Strategy-Next-Actions_v1.0.md` exists on Drive and contains at least one entry
- [ ] Code repo root is clean — no SQL files, HTML demos, financial models, or patch files

---

*GluMira™ — The science of insulin, made visible.*
