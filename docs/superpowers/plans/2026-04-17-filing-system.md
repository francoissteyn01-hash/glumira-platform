# Filing System Canonical Restructure — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken GluMira V7 filing system with a self-enforcing 8-domain canonical structure on Google Drive, delete redundant desktop copies, clean the code repo root, and wire session-start/end hooks so Claude auto-enforces the Filing Constitution and never loses progress to a network drop.

**Architecture:** Four sequential phases — (1) create new Drive structure, (2) migrate existing Drive content into canonical locations, (3) clean desktop and repo, (4) wire CLAUDE.md rules and shell hooks. Each phase is independently verifiable before the next begins.

**Tech Stack:** Bash (Windows paths via G:/ mount), PowerShell for robocopy where noted, direct file edits to CLAUDE.md and `.claude/settings.json`.

**Spec:** `docs/superpowers/specs/2026-04-17-filing-system-design.md`

---

## Files Created / Modified

| Path | Action |
|---|---|
| `G:/My Drive/GLUMIRA/GluMira-V7/01_Research/` + subfolders | Create |
| `G:/My Drive/GLUMIRA/GluMira-V7/02_Clinical/` + subfolders | Create |
| `G:/My Drive/GLUMIRA/GluMira-V7/03_Platform/` + subfolders + 20 PM folders | Create |
| `G:/My Drive/GLUMIRA/GluMira-V7/04_Brand/` + subfolders | Create |
| `G:/My Drive/GLUMIRA/GluMira-V7/05_Business/` + subfolders | Create |
| `G:/My Drive/GLUMIRA/GluMira-V7/06_Operations/` + subfolders | Create |
| `G:/My Drive/GLUMIRA/GluMira-V7/07_Education/` + subfolders | Create |
| `G:/My Drive/GLUMIRA/GluMira-V7/99_Archive/` + subfolders | Create |
| `G:/My Drive/GLUMIRA/GluMira-V7/00_MASTER/Filing-Constitution_v1.0.md` | Create |
| `G:/My Drive/GLUMIRA/GluMira-V7/05_Business/Strategy/05.010_Strategy-Next-Actions_v1.0.md` | Create |
| `G:/My Drive/GLUMIRA/GluMira-V7/03_Platform/Modules/PM05-PM20/PMxx_Spec-Placeholder_v0.1.md` | Create (16 files) |
| `C:/glumira-v7/CLAUDE.md` | Modify — add Rule 8a, Rule 8b |
| `C:/glumira-v7/.claude/settings.json` | Modify — update session hooks |
| `C:/Users/franc/.claude/projects/C--Users-franc/memory/MEMORY.md` | Modify — update Drive paths |

---

## PHASE 1 — Create New Drive Structure

### Task 1: Create top-level domain folders

**Files:**
- Create: `G:/My Drive/GLUMIRA/GluMira-V7/01_Research/`
- Create: `G:/My Drive/GLUMIRA/GluMira-V7/02_Clinical/`
- Create: `G:/My Drive/GLUMIRA/GluMira-V7/03_Platform/`
- Create: `G:/My Drive/GLUMIRA/GluMira-V7/04_Brand/`
- Create: `G:/My Drive/GLUMIRA/GluMira-V7/05_Business/`
- Create: `G:/My Drive/GLUMIRA/GluMira-V7/06_Operations/`
- Create: `G:/My Drive/GLUMIRA/GluMira-V7/07_Education/`
- Create: `G:/My Drive/GLUMIRA/GluMira-V7/99_Archive/`

- [ ] **Step 1: Create all top-level domain folders**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
mkdir -p "$DRIVE/01_Research"
mkdir -p "$DRIVE/02_Clinical"
mkdir -p "$DRIVE/03_Platform"
mkdir -p "$DRIVE/04_Brand"
mkdir -p "$DRIVE/05_Business"
mkdir -p "$DRIVE/06_Operations"
mkdir -p "$DRIVE/07_Education"
mkdir -p "$DRIVE/99_Archive"
```

- [ ] **Step 2: Verify all 8 folders created (plus existing 00_MASTER = 9 total)**

```bash
ls "G:/My Drive/GLUMIRA/GluMira-V7/" | grep -E "^0[0-9]_|^99_" | sort
```

Expected output (9 lines):
```
00_MASTER
01_Research
02_Clinical
03_Platform
04_Brand
05_Business
06_Operations
07_Education
99_Archive
```

---

### Task 2: Create internal sub-taxonomy folders

**Files:** All subfolders within the 8 domains.

- [ ] **Step 1: Create 01_Research subfolders**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
mkdir -p "$DRIVE/01_Research/Insulin-PK"
mkdir -p "$DRIVE/01_Research/Clinical-Evidence"
mkdir -p "$DRIVE/01_Research/Drug-Interactions"
mkdir -p "$DRIVE/01_Research/Competitive-Intelligence"
mkdir -p "$DRIVE/01_Research/Reference-Library"
```

- [ ] **Step 2: Create 02_Clinical subfolders**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
mkdir -p "$DRIVE/02_Clinical/Patient-Safety"
mkdir -p "$DRIVE/02_Clinical/Audit-Trails"
mkdir -p "$DRIVE/02_Clinical/IRB-Readiness"
mkdir -p "$DRIVE/02_Clinical/Adverse-Reactions"
mkdir -p "$DRIVE/02_Clinical/Clinical-Flags"
```

- [ ] **Step 3: Create 03_Platform subfolders**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
mkdir -p "$DRIVE/03_Platform/Architecture"
mkdir -p "$DRIVE/03_Platform/Specs"
mkdir -p "$DRIVE/03_Platform/Modules"
mkdir -p "$DRIVE/03_Platform/Code-Docs"
mkdir -p "$DRIVE/03_Platform/PK-Engine"
mkdir -p "$DRIVE/03_Platform/Build-Reports"
```

- [ ] **Step 4: Create 04_Brand subfolders**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
mkdir -p "$DRIVE/04_Brand/Visual-Identity"
mkdir -p "$DRIVE/04_Brand/Mira"
mkdir -p "$DRIVE/04_Brand/Badges"
mkdir -p "$DRIVE/04_Brand/Voice"
mkdir -p "$DRIVE/04_Brand/Logo"
```

- [ ] **Step 5: Create 05_Business subfolders**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
mkdir -p "$DRIVE/05_Business/Financial-Models"
mkdir -p "$DRIVE/05_Business/Legal"
mkdir -p "$DRIVE/05_Business/Marketing"
mkdir -p "$DRIVE/05_Business/Strategy"
mkdir -p "$DRIVE/05_Business/Competitive-Analysis"
```

- [ ] **Step 6: Create 06_Operations subfolders**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
mkdir -p "$DRIVE/06_Operations/Claude-Memory/_index"
mkdir -p "$DRIVE/06_Operations/Claude-Memory/Sessions"
mkdir -p "$DRIVE/06_Operations/Filing-Registers"
mkdir -p "$DRIVE/06_Operations/Build-Phases"
mkdir -p "$DRIVE/06_Operations/Beta-Program"
mkdir -p "$DRIVE/06_Operations/Deployment"
mkdir -p "$DRIVE/06_Operations/Automation"
```

- [ ] **Step 7: Create 07_Education subfolders**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
mkdir -p "$DRIVE/07_Education/Patient-Guides"
mkdir -p "$DRIVE/07_Education/Glossary"
mkdir -p "$DRIVE/07_Education/Clinical-Explainers"
mkdir -p "$DRIVE/07_Education/Public-Resources"
```

- [ ] **Step 8: Create 99_Archive subfolders**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
mkdir -p "$DRIVE/99_Archive/Legacy-V5"
mkdir -p "$DRIVE/99_Archive/Legacy-V6"
mkdir -p "$DRIVE/99_Archive/Superseded-Docs"
mkdir -p "$DRIVE/99_Archive/Chat-Sessions"
mkdir -p "$DRIVE/99_Archive/Duplicates"
mkdir -p "$DRIVE/99_Archive/Code-Experiments"
```

---

### Task 3: Create 20 module folders with placeholders

**Files:** `03_Platform/Modules/PM01–PM20/` — built modules get full structure, planned get a placeholder.

- [ ] **Step 1: Create all 20 module folders**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7/03_Platform/Modules"
for m in \
  "PM01-Pregnancy" "PM02-ADHD" "PM03-Thyroid" "PM04-School-Care-Plan" \
  "PM05-Autism-Spectrum" "PM06-Paediatric" "PM07-Renal" "PM08-Hepatic" \
  "PM09-Exercise" "PM10-Menstrual-Cycle" "PM11-Alcohol" "PM12-Travel" \
  "PM13-Stress" "PM14-Fasting-Ramadan" "PM15-Nutrition" "PM16-Sleep" \
  "PM17-Post-Surgical" "PM18-Psychological" "PM19-Community" "PM20-Environmental"
do
  mkdir -p "$DRIVE/$m"
done
```

- [ ] **Step 2: Create placeholder files for planned modules (PM06–PM20)**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7/03_Platform/Modules"
for entry in \
  "PM06-Paediatric:PM06" "PM07-Renal:PM07" "PM08-Hepatic:PM08" \
  "PM09-Exercise:PM09" "PM10-Menstrual-Cycle:PM10" "PM11-Alcohol:PM11" \
  "PM12-Travel:PM12" "PM13-Stress:PM13" "PM14-Fasting-Ramadan:PM14" \
  "PM15-Nutrition:PM15" "PM16-Sleep:PM16" "PM17-Post-Surgical:PM17" \
  "PM18-Psychological:PM18" "PM19-Community:PM19" "PM20-Environmental:PM20"
do
  folder="${entry%%:*}"
  id="${entry##*:}"
  cat > "$DRIVE/$folder/${id}_Spec-Placeholder_v0.1.md" << EOF
# ${folder} — Spec Placeholder
**Status:** Planned
**ID:** ${id}
**Version:** v0.1
**Created:** 2026-04-17

This module is planned. Replace this file with ${id}_Spec_v1.0.md when build begins.

## Clinical Basis
_To be documented at build start._

## Scope
_To be documented at build start._
EOF
done
```

- [ ] **Step 3: Verify all 20 folders exist**

```bash
ls "G:/My Drive/GLUMIRA/GluMira-V7/03_Platform/Modules/" | wc -l
```

Expected: `20`

- [ ] **Step 4: Commit the spec file to git**

```bash
cd C:/glumira-v7
git add docs/superpowers/specs/2026-04-17-filing-system-design.md
git add docs/superpowers/plans/2026-04-17-filing-system.md
git commit -m "docs: filing system canonical design spec and implementation plan

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## PHASE 2 — Migrate Drive Content

> **Safety rule for all migration tasks:** Copy first (`cp -r`), verify file count matches, then remove source. Never `mv` directly on Drive — Google Drive sync can corrupt partial moves.

### Task 4: Migrate 13_RESEARCH → 01_Research

- [ ] **Step 1: Copy all content**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
cp -r "$DRIVE/13_RESEARCH/." "$DRIVE/01_Research/"
```

- [ ] **Step 2: Verify counts match**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
echo "Source:" && find "$DRIVE/13_RESEARCH" -type f | wc -l
echo "Dest:"   && find "$DRIVE/01_Research"  -type f | wc -l
```

Expected: both numbers equal (destination may be higher if subfolders already had files).

- [ ] **Step 3: Remove old folder**

```bash
rm -rf "G:/My Drive/GLUMIRA/GluMira-V7/13_RESEARCH"
```

---

### Task 5: Migrate 10_BRAND, 15_MIRA, 16_BADGES → 04_Brand

- [ ] **Step 1: Copy BRAND content into Visual-Identity**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
cp -r "$DRIVE/10_BRAND/." "$DRIVE/04_Brand/Visual-Identity/"
```

- [ ] **Step 2: Copy MIRA content**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
cp -r "$DRIVE/15_MIRA/." "$DRIVE/04_Brand/Mira/"
```

- [ ] **Step 3: Copy BADGES content**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
cp -r "$DRIVE/16_BADGES/." "$DRIVE/04_Brand/Badges/"
```

- [ ] **Step 4: Verify and remove sources**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
echo "04_Brand total:" && find "$DRIVE/04_Brand" -type f | wc -l
rm -rf "$DRIVE/10_BRAND" "$DRIVE/15_MIRA" "$DRIVE/16_BADGES"
```

---

### Task 6: Migrate business/legal/marketing → 05_Business

- [ ] **Step 1: Copy content**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
cp -r "$DRIVE/08_BUSINESS/." "$DRIVE/05_Business/"
cp -r "$DRIVE/09_LEGAL/."    "$DRIVE/05_Business/Legal/"
cp -r "$DRIVE/11_MARKETING/." "$DRIVE/05_Business/Marketing/"
cp -r "$DRIVE/03_STRATEGY/."  "$DRIVE/05_Business/Strategy/"
```

- [ ] **Step 2: Verify and remove sources**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
echo "05_Business total:" && find "$DRIVE/05_Business" -type f | wc -l
rm -rf "$DRIVE/08_BUSINESS" "$DRIVE/09_LEGAL" "$DRIVE/11_MARKETING" "$DRIVE/03_STRATEGY"
```

---

### Task 7: Migrate 12_EDUCATION → 07_Education

- [ ] **Step 1: Copy content**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
cp -r "$DRIVE/12_EDUCATION/." "$DRIVE/07_Education/"
```

- [ ] **Step 2: Verify and remove**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
echo "Source:" && find "$DRIVE/12_EDUCATION" -type f | wc -l
echo "Dest:"   && find "$DRIVE/07_Education"  -type f | wc -l
rm -rf "$DRIVE/12_EDUCATION"
```

---

### Task 8: Migrate 05_PHASES + 18_CLAUDE_CODE_MEMORY (both) → 06_Operations

- [ ] **Step 1: Copy build phases**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
cp -r "$DRIVE/05_PHASES/." "$DRIVE/06_Operations/Build-Phases/"
```

- [ ] **Step 2: Merge both Claude Memory folders into one canonical location**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
cp -r "$DRIVE/18_CLAUDE_CODE_MEMORY/." "$DRIVE/06_Operations/Claude-Memory/"
cp -r "$DRIVE/18_Claude Code Memory/." "$DRIVE/06_Operations/Claude-Memory/"
```

- [ ] **Step 3: Verify and remove all three sources**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
echo "06_Operations total:" && find "$DRIVE/06_Operations" -type f | wc -l
rm -rf "$DRIVE/05_PHASES"
rm -rf "$DRIVE/18_CLAUDE_CODE_MEMORY"
rm -rf "$DRIVE/18_Claude Code Memory"
```

---

### Task 9: Migrate 01_PLATFORM_CORE + 02_MODULES + 06_CODE → 03_Platform

- [ ] **Step 1: Copy platform core content**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
cp -r "$DRIVE/01_PLATFORM_CORE/." "$DRIVE/03_Platform/"
```

- [ ] **Step 2: Copy modules content into Modules subfolder**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
cp -r "$DRIVE/02_MODULES/." "$DRIVE/03_Platform/Modules/"
```

- [ ] **Step 3: Copy code docs**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
cp -r "$DRIVE/06_CODE/." "$DRIVE/03_Platform/Code-Docs/"
```

- [ ] **Step 4: Verify and remove sources**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
echo "03_Platform total:" && find "$DRIVE/03_Platform" -type f | wc -l
rm -rf "$DRIVE/01_PLATFORM_CORE" "$DRIVE/02_MODULES" "$DRIVE/06_CODE"
```

---

### Task 10: Migrate GluMira-Legacy → 99_Archive and clean 00_MASTER

- [ ] **Step 1: Move GluMira-Legacy into Archive**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
cp -r "$DRIVE/GluMira-Legacy/." "$DRIVE/99_Archive/Legacy/"
```

- [ ] **Step 2: Move V5/V6 content from Legacy into correct Archive subfolders**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
# V5 content
[ -d "$DRIVE/99_Archive/Legacy/V5-Content" ] && \
  cp -r "$DRIVE/99_Archive/Legacy/V5-Content/." "$DRIVE/99_Archive/Legacy-V5/"
# V6 content
[ -d "$DRIVE/99_Archive/Legacy/V6-Content" ] && \
  cp -r "$DRIVE/99_Archive/Legacy/V6-Content/." "$DRIVE/99_Archive/Legacy-V6/"
```

- [ ] **Step 3: Move non-governance files out of 00_MASTER**

Move audit reports, filing registers (except the canonical one), code files, and financial models out:

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
ARCHIVE="$DRIVE/99_Archive/Superseded-Docs"
OPS="$DRIVE/06_Operations/Filing-Registers"

# Move all audit/verification reports to Clinical/Audit-Trails
find "$DRIVE/00_MASTER" -name "*Audit*" -o -name "*Verification*" -o -name "*Remediation*" | \
  while read f; do cp "$f" "$DRIVE/02_Clinical/Audit-Trails/"; done

# Move all filing registers (except canonical) to Operations
find "$DRIVE/00_MASTER" -name "*Filing-Register*" -o -name "*Filing-Rules*" | \
  while read f; do cp "$f" "$OPS/"; done

# Move code files (.ts, .tsx) to Archive
find "$DRIVE/00_MASTER" -name "*.ts" -o -name "*.tsx" | \
  while read f; do cp "$f" "$ARCHIVE/"; done

# Move all 99.x prefixed files to Archive
find "$DRIVE/00_MASTER" -name "99.*" | \
  while read f; do cp "$f" "$ARCHIVE/"; done

# Move all 13_* prefixed files to 01_Research
find "$DRIVE/00_MASTER" -name "13_*" | \
  while read f; do cp "$f" "$DRIVE/01_Research/"; done
```

- [ ] **Step 4: Remove GluMira-Legacy and verify 00_MASTER**

```bash
DRIVE="G:/My Drive/GLUMIRA/GluMira-V7"
rm -rf "$DRIVE/GluMira-Legacy"
echo "00_MASTER remaining files:"
ls "$DRIVE/00_MASTER/" | grep -v "desktop.ini"
```

Expected — only governance docs remain:
```
Founding-Statement (or similar)
Master-Index (or similar)
Filing-Rules / Global-Filing-Rules
Operating Contract docs
Insulin-Lock
```

Manually delete anything that isn't one of those 5 categories, moving to appropriate domain.

- [ ] **Step 5: Verify final Drive structure**

```bash
ls "G:/My Drive/GLUMIRA/GluMira-V7/" | grep -v "desktop.ini" | sort
```

Expected — exactly 9 folders:
```
00_MASTER
01_Research
02_Clinical
03_Platform
04_Brand
05_Business
06_Operations
07_Education
99_Archive
```

---

## PHASE 3 — Create Governance Documents + Desktop/Repo Cleanup

### Task 11: Create Filing Constitution on Drive

**Files:**
- Create: `G:/My Drive/GLUMIRA/GluMira-V7/00_MASTER/Filing-Constitution_v1.0.md`

- [ ] **Step 1: Write the Filing Constitution**

```bash
cat > "G:/My Drive/GLUMIRA/GluMira-V7/00_MASTER/Filing-Constitution_v1.0.md" << 'EOF'
# GluMira V7 — Filing Constitution
**Version:** 1.0
**Effective:** 2026-04-17
**Supersedes:** All prior filing registers, Directorate Filing Register v1.x, Doc-Index variants
**Authority:** Founder

---

## The 5 Rules

### RULE 1 — ONE HOME PER FILE
Every file lives in exactly one domain folder. No copies across domains.
Cross-references use links, not duplicate files.

### RULE 2 — CANONICAL ID ON CREATION
Every new file gets `DOMAIN.SEQ_Descriptive-Name_vX.X.ext` at creation.
No file is ever saved without a version number.

Format: `01.010_Levemir-PK-Profile_v1.0.md`
- DOMAIN: two-digit folder number (01 = Research, 03 = Platform, etc.)
- SEQ: three-digit, tens-spaced (010, 020, 030)
- Name: Title-Case-Hyphens
- Version: _vX.X mandatory

### RULE 3 — ARCHIVE IS A ONE-WAY DOOR
Superseded → `99_Archive/Superseded-Docs/`.
Nothing returns from Archive to an active domain.

### RULE 4 — 00_MASTER HOLDS ONLY GOVERNANCE DOCS
`00_MASTER` contains exactly:
1. Founding Statement
2. Master Index
3. Filing Constitution (this document)
4. Operating Contract
5. Insulin Lock

Nothing else. Ever. If a file doesn't fit one of these five — it doesn't belong here.

### RULE 5 — CLAUDE ENFORCES AT SESSION START
At every session start, Claude scans for:
- Files in wrong domain folders
- Files without version numbers
- Duplicates outside `99_Archive/`
- Anything in `00_MASTER` that isn't a governance doc

Violations reported as a numbered list before any other work begins.

---

## Domain Map

| Folder | Domain | Contents |
|---|---|---|
| 00_MASTER | Governance | Founding docs, master index, this constitution, operating contract, insulin lock |
| 01_Research | Research | Insulin PK library, clinical citations, evidence base, drug interactions |
| 02_Clinical | Clinical | Patient safety, audit trails, IRB, adverse reactions, clinical flags |
| 03_Platform | Platform | Architecture, specs, 20 modules, code docs, PK engine reference |
| 04_Brand | Brand | Visual identity, Mira, badges, voice, logo |
| 05_Business | Business | Financial models, legal, marketing, strategy, competitive analysis |
| 06_Operations | Operations | Claude memory, session logs, filing registers, deployment, automation |
| 07_Education | Education | Patient guides, glossary, clinical explainers, public resources |
| 99_Archive | Archive | One-way door — superseded, legacy V5/V6, duplicates, code experiments |

---

*GluMira™ — The science of insulin, made visible.*
EOF
```

- [ ] **Step 2: Verify file created**

```bash
ls "G:/My Drive/GLUMIRA/GluMira-V7/00_MASTER/" | grep "Filing-Constitution"
```

Expected: `Filing-Constitution_v1.0.md`

---

### Task 12: Create Next-Actions rolling log on Drive

**Files:**
- Create: `G:/My Drive/GLUMIRA/GluMira-V7/05_Business/Strategy/05.010_Strategy-Next-Actions_v1.0.md`

- [ ] **Step 1: Write the initial Next-Actions file**

```bash
cat > "G:/My Drive/GLUMIRA/GluMira-V7/05_Business/Strategy/05.010_Strategy-Next-Actions_v1.0.md" << 'EOF'
# GluMira™ — Strategy Next Actions
**Canonical ID:** 05.010
**Version:** 1.0
**Updated:** Auto-appended by Claude at every session close

> Append-only log. Newest entry at top. Never edit entries once written.
> Claude reads this at session start. Claude writes to this at session end.

---

## [2026-04-17 SESSION CLOSE]
**Completed:**
- Filing system design spec approved (docs/superpowers/specs/2026-04-17-filing-system-design.md)
- Implementation plan written (docs/superpowers/plans/2026-04-17-filing-system.md)
- Desktop audit completed — Drive confirmed as sole canonical source
- 8 V6 files identified for rescue before desktop deletion

**Open:**
- Execute Phase 1: Create Drive folder structure
- Execute Phase 2: Migrate Drive content
- Execute Phase 3: Desktop cleanup + repo cleanup
- Execute Phase 4: Wire CLAUDE.md rules + session hooks

**Next action:** Execute Task 1 of implementation plan — create top-level Drive domain folders

**Workstream:** filing-system

---
EOF
```

- [ ] **Step 2: Verify file created**

```bash
ls "G:/My Drive/GLUMIRA/GluMira-V7/05_Business/Strategy/"
```

Expected: `05.010_Strategy-Next-Actions_v1.0.md`

---

### Task 13: Desktop pre-deletion — rescue 8 V6 files

**Files:**
- Copy from: `Desktop/GLUMIRA V7/14_ARCHIVE/V6-Content/`
- Copy to: `G:/My Drive/GLUMIRA/GluMira-V7/99_Archive/Legacy-V6/`

- [ ] **Step 1: Copy V6 files to Drive**

```bash
cp -r "C:/Users/franc/Desktop/GLUMIRA V7/14_ARCHIVE/V6-Content/." \
      "G:/My Drive/GLUMIRA/GluMira-V7/99_Archive/Legacy-V6/"
```

- [ ] **Step 2: Verify 8+ files now in Legacy-V6**

```bash
ls "G:/My Drive/GLUMIRA/GluMira-V7/99_Archive/Legacy-V6/" | grep -v "desktop.ini"
```

Expected — at minimum these 8 files:
```
Build-content-documents-for-empty-GluMira-directorate-folders_v6.csv
v6.14_glumira™ v6  comprehensive status audit & strategic forward plan
v6.15_glumira™ v6  finalized deliverables summary
v6.16_glumira™ v6 - module index
v6.17_glumira™ v6  planned modules roadmap
v6.18_glumira™ v6 medical guidelines reference
v6.21_glumira-v6 filing register
v6.22_glumira v6 — beta testing protocol
v6.8_glumira v6 — beta tester consent form
```

---

### Task 14: Delete desktop folders

- [ ] **Step 1: Delete GLUMIRA V7 desktop folder**

```bash
rm -rf "C:/Users/franc/Desktop/GLUMIRA V7"
```

- [ ] **Step 2: Delete backup desktop folder**

```bash
rm -rf "C:/Users/franc/Desktop/00_GLUMIRA_BACKUP_20260409"
```

- [ ] **Step 3: Delete partial sync folder**

```bash
rm -rf "C:/Users/franc/Desktop/00_GLUMIRA"
```

- [ ] **Step 4: Verify desktop is clean**

```bash
ls "C:/Users/franc/Desktop/" | grep -iE "glumira|00_GL"
```

Expected: no output (no GluMira folders on desktop).

---

### Task 15: Clean code repo root

**Files:**
- Move SQL files to `drizzle/`
- Delete: financial models, patch files
- Move HTML demos to `99_Archive/Code-Experiments/` in Drive
- Rename `x_xx.0-Reports/` to `docs/reports/`
- Delete `00_MASTER/` from repo

- [ ] **Step 1: Move SQL files into drizzle/**

```bash
cd C:/glumira-v7
mv 20260329_badges_mira_schema.sql drizzle/ 2>/dev/null || true
mv 20260329_beta_tables_addendum.sql drizzle/ 2>/dev/null || true
mv glumira-schema.sql drizzle/ 2>/dev/null || true
```

- [ ] **Step 2: Archive HTML demos to Drive then delete from repo**

```bash
cd C:/glumira-v7
ARCHIVE="G:/My Drive/GLUMIRA/GluMira-V7/99_Archive/Code-Experiments"
for f in glumira-auth.html glumira-dashboard.html glumira-iob-calculator.html glumira-landing.html glumira-brand-guidelines.html; do
  [ -f "$f" ] && cp "$f" "$ARCHIVE/" && rm "$f"
done
```

- [ ] **Step 3: Delete financial model docs from repo (Drive is the home)**

```bash
cd C:/glumira-v7
rm -f FINANCIAL-MODEL-RAMADAN-V2.md FINANCIAL-MODEL-V7.md
```

- [ ] **Step 4: Delete patch files**

```bash
cd C:/glumira-v7
rm -f backup-stash-0.patch backup-stash-0-untracked.patch
```

- [ ] **Step 5: Rename x_xx.0-Reports to docs/reports**

```bash
cd C:/glumira-v7
[ -d "x_xx.0-Reports" ] && mv "x_xx.0-Reports" "docs/reports"
```

- [ ] **Step 6: Delete 00_MASTER from repo root**

```bash
cd C:/glumira-v7
rm -rf 00_MASTER
```

- [ ] **Step 7: Verify repo root is clean**

```bash
cd C:/glumira-v7
ls | grep -vE "^(src|server|client|docs|drizzle|e2e|public|node_modules|dist|glumira-platform|\.)"
```

Expected — only these non-dot files at root:
```
ARCHIVE-LOG.md   BUILD-PROGRESS.md   CHANGELOG.md   CLAUDE.md
CLAUDE.local.md  Dockerfile          INSULIN_LOCK.md  MASTER-INDEX.md
V7-INDEX.md      auto-ship.py        deploy.sh       package.json
package-lock.json  tailwind.config.js  tsconfig.json  tsconfig.server.json
vite.config.ts   vitest.config.ts    vitest.config.e2e.ts  vercel.json
netlify.toml     railway.json        eslint.config.mjs  postcss.config.js
```

- [ ] **Step 8: Commit repo cleanup**

```bash
cd C:/glumira-v7
git add -A
git commit -m "chore: clean repo root — SQL to drizzle/, archive HTML demos, remove doc artifacts

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## PHASE 4 — Wire Automation

### Task 16: Update CLAUDE.md — add Rule 8a and Rule 8b

**Files:**
- Modify: `C:/glumira-v7/CLAUDE.md`

- [ ] **Step 1: Read current Group 1 in CLAUDE.md to find insertion point**

```bash
grep -n "Group 1\|Rule 8\|session start\|Session start" C:/glumira-v7/CLAUDE.md | head -20
```

- [ ] **Step 2: Add Rule 8a after Rule 8 in Group 1**

Edit `C:/glumira-v7/CLAUDE.md`. Find the line:

```
8. At session start: Scan git/Drive since yesterday + load CLAUDE.md/MEMORY.md/Visual-Philosophy/Founding.
```

Add immediately after:

```
8a. **Filing Constitution check.** At every session start, after loading CLAUDE.md, Claude checks for Filing Constitution violations: files in wrong domain folders (`G:/My Drive/GLUMIRA/GluMira-V7/`), files without version numbers, duplicates outside `99_Archive/`, anything in `00_MASTER` that isn't a governance doc (Founding Statement / Master Index / Filing Constitution / Operating Contract / Insulin Lock). Report violations as a numbered list before proceeding. Do not silently ignore them.

8b. **Session-end next-actions update.** At the close of every session — on task completion, when the user signals done, or before network drop — Claude appends a timestamped block to `G:/My Drive/GLUMIRA/GluMira-V7/05_Business/Strategy/05.010_Strategy-Next-Actions_v1.0.md`:
    ```
    ## [YYYY-MM-DD HH:MM] Session Close
    **Completed:** [tasks finished this session]
    **Open:** [tasks started but not finished]
    **Next action:** [single most important thing for next session]
    **Workstream:** [active workstream name]
    ```
    Written to Drive — not the repo — so it survives network interruptions and session loss.
```

- [ ] **Step 3: Verify rules appear in CLAUDE.md**

```bash
grep -n "8a\|8b\|Filing Constitution\|Session-end" C:/glumira-v7/CLAUDE.md
```

Expected: 4+ matches showing both rules.

- [ ] **Step 4: Commit CLAUDE.md**

```bash
cd C:/glumira-v7
git add CLAUDE.md
git commit -m "feat(claude): add Rule 8a filing check + Rule 8b session-end next-actions update

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 17: Update session-start hook to include steps 4 and 5

**Files:**
- Modify: `C:/glumira-v7/.claude/settings.json` (or `C:/Users/franc/.claude/settings.json`)

- [ ] **Step 1: Read current hook configuration**

```bash
cat C:/glumira-v7/.claude/settings.json 2>/dev/null || cat C:/Users/franc/.claude/settings.json 2>/dev/null
```

Note the current `SESSION START:` hook text.

- [ ] **Step 2: Update the session-start hook message**

Using the update-config skill or direct edit, replace the session start hook text with:

```
SESSION START: 1) Read c:/glumira-v7/CLAUDE.md (57 rules + INSULIN LOCK + operating contract) FIRST — state "Framework loaded." 2) Scan git log --since=yesterday in c:/glumira-v7. 3) Identify the active workstream from cwd or user request, then read the most recent session file in G:/My Drive/GLUMIRA/GluMira-V7/06_Operations/Claude-Memory/Sessions/{workstream}/ (sort by filename desc, take first). If folder empty, proceed fresh. 4) Run Filing Constitution check (CLAUDE.md Rule 8a) — scan 00_MASTER for non-governance files, scan active domains for cross-contamination, report violations before any other work. 5) Read G:/My Drive/GLUMIRA/GluMira-V7/05_Business/Strategy/05.010_Strategy-Next-Actions_v1.0.md — load open items as context. DO NOT start work before completing steps 1-5.
```

- [ ] **Step 3: Verify hook is updated**

```bash
grep -o "SESSION START.*DO NOT" C:/glumira-v7/.claude/settings.json 2>/dev/null | head -5
```

Expected: updated text containing steps 4 and 5.

- [ ] **Step 4: Commit settings**

```bash
cd C:/glumira-v7
git add .claude/settings.json
git commit -m "feat(hooks): update session-start hook — add filing check + next-actions read

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

### Task 18: Update MEMORY.md with new canonical Drive paths

**Files:**
- Modify: `C:/Users/franc/.claude/projects/C--Users-franc/memory/MEMORY.md`

- [ ] **Step 1: Update the Visual Design Philosophy path (10_BRAND → 04_Brand)**

In `MEMORY.md`, change:
```
- **Visual Design Philosophy:** `G:/My Drive/GLUMIRA/GluMira-V7/10_BRAND/10_Visual-Design-Philosophy.txt`
```
To:
```
- **Visual Design Philosophy:** `G:/My Drive/GLUMIRA/GluMira-V7/04_Brand/Visual-Identity/10_Visual-Design-Philosophy.txt`
```

- [ ] **Step 2: Add Filing Constitution and Next-Actions references**

Add after the SESSION START block:

```markdown
- **Filing Constitution:** `G:/My Drive/GLUMIRA/GluMira-V7/00_MASTER/Filing-Constitution_v1.0.md`
- **Next Actions (rolling log):** `G:/My Drive/GLUMIRA/GluMira-V7/05_Business/Strategy/05.010_Strategy-Next-Actions_v1.0.md`
- **Claude Memory Sessions:** `G:/My Drive/GLUMIRA/GluMira-V7/06_Operations/Claude-Memory/Sessions/`
```

- [ ] **Step 3: Verify MEMORY.md**

```bash
grep -n "Drive\|Filing Constitution\|Next Actions" "C:/Users/franc/.claude/projects/C--Users-franc/memory/MEMORY.md"
```

Expected: all three new paths appear.

---

### Task 19: Write session close entry to Next-Actions (first real entry)

- [ ] **Step 1: Append session close entry**

```bash
cat >> "G:/My Drive/GLUMIRA/GluMira-V7/05_Business/Strategy/05.010_Strategy-Next-Actions_v1.0.md" << 'EOF'

## [2026-04-17 IMPLEMENTATION COMPLETE]
**Completed:**
- Phase 1: New Drive folder structure created (8 domains + subfolders)
- Phase 2: All Drive content migrated to canonical locations
- Phase 3: Desktop folders deleted, repo root cleaned
- Phase 4: CLAUDE.md Rule 8a + 8b added, session hooks updated, MEMORY.md updated
- 20 module folders created (PM01–PM20) with placeholders for planned modules
- Filing Constitution written to 00_MASTER
- Next-Actions rolling log established

**Open:**
- Manually verify 00_MASTER contains only 5 governance docs (human spot-check)
- Verify Visual Design Philosophy file accessible at new 04_Brand path
- Populate 01_Research/Insulin-PK with PK library documents
- Begin built-module folder structure for PM01–PM05

**Next action:** Human spot-check 00_MASTER contents + verify Drive structure visually in browser

**Workstream:** filing-system
EOF
```

- [ ] **Step 2: Final verification**

```bash
echo "=== Drive top-level ===" && ls "G:/My Drive/GLUMIRA/GluMira-V7/" | grep -v desktop.ini
echo "=== 00_MASTER ===" && ls "G:/My Drive/GLUMIRA/GluMira-V7/00_MASTER/" | grep -v desktop.ini
echo "=== 03_Platform/Modules ===" && ls "G:/My Drive/GLUMIRA/GluMira-V7/03_Platform/Modules/" | wc -l
echo "=== Desktop clean ===" && ls "C:/Users/franc/Desktop/" | grep -iE "glumira|00_GL" || echo "CLEAN"
echo "=== Next-Actions exists ===" && ls "G:/My Drive/GLUMIRA/GluMira-V7/05_Business/Strategy/"
```

Expected:
```
=== Drive top-level ===
00_MASTER  01_Research  02_Clinical  03_Platform  04_Brand  05_Business  06_Operations  07_Education  99_Archive

=== 00_MASTER ===
(5 or fewer governance files)

=== 03_Platform/Modules ===
20

=== Desktop clean ===
CLEAN

=== Next-Actions exists ===
05.010_Strategy-Next-Actions_v1.0.md
```

- [ ] **Step 3: Final commit**

```bash
cd C:/glumira-v7
git add -A
git commit -m "feat: filing system complete — canonical Drive structure, hooks, Rule 8a/8b

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Success Criteria Checklist

- [ ] Drive top-level has exactly 9 folders (00–07 + 99)
- [ ] Researcher opens Drive and reads domain names without a README
- [ ] `00_MASTER/` contains exactly 5 governance documents, nothing else
- [ ] `01_Research/` has populated subfolders (Insulin-PK, Clinical-Evidence, etc.)
- [ ] All 20 module folders exist in `03_Platform/Modules/`
- [ ] Both old `18_CLAUDE_CODE_MEMORY` folders merged into `06_Operations/Claude-Memory/`
- [ ] `99_Archive/Legacy-V6/` contains the 8 rescued V6 files
- [ ] Desktop clean — no GLUMIRA folders
- [ ] Repo root clean — no SQL, HTML demos, financial models, patch files
- [ ] CLAUDE.md contains Rule 8a and Rule 8b
- [ ] Session start hook includes steps 4 and 5
- [ ] `05.010_Strategy-Next-Actions_v1.0.md` exists on Drive with at least 2 entries
- [ ] MEMORY.md updated with new canonical paths

---

*GluMira™ — The science of insulin, made visible.*
