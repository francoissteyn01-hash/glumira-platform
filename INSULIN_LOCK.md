# INSULIN LOCK — single source of truth

**Source of PK values:** `src/iob-hunter/engine/insulin-profiles.ts` (never invent).
**Before ANY edit to `iob-engine.ts`, `insulin-profiles.ts`, or any chart component, paste the matching row from this file in your reply.**
**Never start at zero. Steady state always.**

## 🔒 VERIFIED-LOCKED — founder-signed 2026-04-14

The following basal profiles are rendering correctly and the underlying math is frozen. No further interpretation changes without founder approval via `APPROVE-INSULIN-EDIT`.

| Insulin | Rendering | Status |
|---------|-----------|--------|
| Tresiba | `/basal-parameters` BasalLifecycleChart, `/iob-hunter` BasalActivityChart | **VERIFIED CORRECT 2026-04-14** |
| Levemir | `/basal-parameters` BasalLifecycleChart, `/iob-hunter` BasalActivityChart | **VERIFIED CORRECT 2026-04-14** |
| Toujeo · Lantus · Basaglar · Humulin N · Insulatard | Same engine path as Tresiba/Levemir | Locked by inheritance — engine math frozen, change invalidates above |

**Canonical rendering path** (all basal charts must use exactly one of these two):

1. **`/iob-hunter`** — `BasalActivityChart` component fed by `computeGraphBounds` + `generatePerDoseActivityCurves(..., cycles)` from `iob-engine.ts`.
2. **`/basal-parameters`** — `BasalLifecycleChart` component which replicates the first-day pattern backwards by `max(1, ceil(DOA/24))` prior cycles, then sums `calculateIOB` / `calculateActivityRate` per sample. Equivalent math to path 1 for activity-rate + adds the IOB-depot panel under a toggle.

**Engine is FROZEN** on `src/iob-hunter/engine/iob-engine.ts`:
- `calculateIOB` — 6 decay models, all locked per-insulin (see banned-patterns section)
- `calculateActivityRate` — smoothstep onset + plateau + smoothstep decay; fixed DOA from `profile.duration_minutes` only
- `generatePerDoseActivityCurves` — multi-cycle replication for steady-state rendering
- `computeGraphBounds` — window + cycle count
- Canonical PK data: `src/iob-hunter/engine/insulin-profiles.ts`

## 🛰️ SATELLITE MIRRORS — vendored copies that must equal canonical

The following repositories carry **vendored copies** of `iob-engine.ts` and `insulin-profiles.ts`. Math + PK drift between canonical and any satellite is an INSULIN LOCK violation.

| Repo | Path | Sync direction | Last sync |
|------|------|----------------|-----------|
| `francoissteyn01-hash/glumira-insight-e00084f6` (Lovable) | `src/iob-hunter/engine/iob-engine.ts` + `src/iob-hunter/engine/insulin-profiles.ts` | canonical → satellite (manual) | **2026-04-18 — Phase 1 mirror** |

**Satellite consumption rule:**

1. Engine math + PK rows in any satellite must be **byte-equivalent in spirit** to canonical (formula choice, decay-model branches, PK source citations). API surface may differ — the satellite chart code remains free to evolve.
2. Edits to engine math originate in `glumira-v7` (canonical), pass `APPROVE-INSULIN-EDIT`, then propagate to every satellite by hand-port or hash-check sync. Edits made in a satellite first are LOCK violations.
3. Satellite engine files MUST carry the `VENDORED MIRROR` banner header so any reader knows the file is downstream of canonical.
4. **Phase 2 (deferred):** extract canonical engine into `@glumira/iob-engine` npm package, retire vendored mirrors. Tracked separately.

**Lovable.dev specific note:** The `glumira-insight-e00084f6` repo is owned by `gpt-engineer-app[bot]`. Direct human pushes to engine files survive UNTIL the founder asks Lovable's editor to modify those files — at which point the bot may regenerate them and undo the mirror. Workflow: any future engine change must (a) edit canonical first under `APPROVE-INSULIN-EDIT`, (b) re-port to Lovable, (c) push Lovable repo, (d) NOT prompt the Lovable editor to touch engine files thereafter.

## 🗑️ DEPRECATED — do not import into protected files

The following files are **alternative/legacy engines** that produced the drift documented across sessions. They must NOT be imported by any protected chart component or engine file. Existing importers (`IOBHunterPage`, `ReportPage`, etc.) are pending migration to the canonical engine — tracked as Phase 2 cleanup.

| Path | Status | Action |
|------|--------|--------|
| `src/lib/pharmacokinetics.ts` | DEPRECATED alt engine | Phase 2: migrate 6 importers to `iob-engine.ts`, then delete |
| `src/lib/iob-hunter.ts` | DEPRECATED alt engine | Phase 2: audit usage, delete or merge |
| `src/components/charts/IOBTerrainChart.tsx` | Uses deprecated alt engine | Phase 2: migrate or delete |
| `src/components/charts/MountainView.tsx` | Uses deprecated alt engine | Phase 2: migrate or delete |
| `src/iob-hunter/components/IOBHunterChart.tsx` | Legacy Chart.js — 427 LOC | Phase 2: verify if still used; delete if orphaned |
| `tresiba-interpretation-test.html` | Standalone with invented `tresibaFrac` | **DELETED 2026-04-14** ✓ |

**Hook enforcement (`.claude/hooks/insulin-lock-check.py`):** blocks any `Edit`/`Write` that would add an `import` from `@/lib/pharmacokinetics` or `@/lib/iob-hunter` into a protected path.

## Basals (7) — daily lifecycle contract

| Brand | decay_model | is_peakless | Cadence | 3-day demo schedule (80 kg adult) |
|-------|-------------|-------------|---------|-----------------------------------|
| Tresiba | `depot_release` | **true LOCKED** | 1 × / 24 h | Day 1 06:00 20U · Day 2 06:00 20U · Day 3 06:00 20U |
| Toujeo | `depot_release` | true | 1 × / 24 h | Day 1 06:00 20U · Day 2 06:00 20U · Day 3 06:00 20U |
| Lantus | `microprecipitate` | false (small clamp peak) | 1 × / 24 h | Day 1 06:00 20U · Day 2 06:00 20U · Day 3 06:00 20U |
| Basaglar | `microprecipitate` | false | 1 × / 24 h | Day 1 06:00 20U · Day 2 06:00 20U · Day 3 06:00 20U |
| Levemir | `albumin_bound` | true | **2 × / 12 h** (adult) · 3 × split (paed) | Day 1 06:00 + 18:00 10U · Day 2 06:00 + 18:00 10U · Day 3 06:00 + 18:00 10U |
| Humulin N | `exponential` (NPH) | false (4–8 h peak) | **2 × / 12 h** | Day 1 06:00 + 18:00 10U · Day 2 06:00 + 18:00 10U · Day 3 06:00 + 18:00 10U |
| Insulatard | `exponential` (NPH) | false | **2 × / 12 h** | Day 1 06:00 + 18:00 10U · Day 2 06:00 + 18:00 10U · Day 3 06:00 + 18:00 10U |

## Rapid / short (6) — bolus contract

| Brand | decay_model | Cadence | Demo schedule |
|-------|-------------|---------|---------------|
| Actrapid | `exponential` | per meal | 07:00 3U · 13:00 2.5U · 19:00 3.5U |
| Apidra | `exponential` | per meal | 07:00 3U · 13:00 2.5U · 19:00 3.5U |
| Fiasp | `exponential` | per meal | 07:00 3U · 13:00 2.5U · 19:00 3.5U |
| Humalog | `exponential` | per meal | 07:00 3U · 13:00 2.5U · 19:00 3.5U |
| Lyumjev | `exponential` | per meal | 07:00 3U · 13:00 2.5U · 19:00 3.5U |
| NovoRapid | `exponential` | per meal | 07:00 3U · 13:00 2.5U · 19:00 3.5U |

## Visual language rules (founder-signed 2026-04-14)

1. **Basal stays blue.** Per-dose fills default to each insulin's `profile.colour`. When ALL visible doses are the same basal insulin (current `/basal-parameters` panels), the resulting chart reads blue-monochrome as today. No change.
2. **Multi-insulin chart = multi-colour.** When two or more distinct insulin brands appear on the same chart (basal + bolus, or Levemir + NPH), each dose's hill paints in that insulin's own `profile.colour` from `insulin-profiles.ts`. Overlap regions darken via natural alpha compositing. Vivid per-type distinction so the educator can say "Levemir is the teal hill, Fiasp is the pink hill."
3. **Injection markers — vertical rotated label ON TOP of the dashed line.**
   - Dashed line colour = dose's `profile.colour` (per-insulin distinction).
   - Label rotated −90°, reads bottom-to-top along the line.
   - Label text: single-insulin → `HH:MM  NU`. Multi-insulin → `HH:MM  NU  Brand`.
   - Font: 500 weight, 9 px mobile / 10 px desktop, colour = dose's profile colour.
   - No separate arrow triangle — just the rotated text label sitting on the dashed line.
4. **Brand navy/teal palette is for PAGE CHROME only**, not graph data. The `#0A2A5E → #22AABB` gradient, `#BA7517` amber, `#070D1A` background are UI chrome colours. Graph data uses per-insulin profile colours + overlap composition. This rule prevents the "colour lock limits visualization" bug.
5. **Pressure-gradient palette** (yellow `#D4C960` / gold `#FFD700` / orange `#FF8C00` / red `#E84040`) is reserved for the **Combined Pressure Map** rendering on the Combined View — segment-coloured by value band on the summed pressure line. Not used on per-insulin basal charts.

## Universal shape rules

1. **Never start at zero.** Steady state at the left edge. Prior-cycle residual always present. **Applies to every insulin graph in every application** — `/basal-parameters`, `/iob-hunter`, `/dashboard`, any standalone HTML file, any future chart. Applies to **both basal and bolus** insulins.
   - **How it's guaranteed in demos:** every lifecycle chart silently prepends a PRIOR phantom dose at `first_visible_dose_hour − (DOA/2)` with the same units as the first visible dose. That positions the phantom at its half-DOA point (≈ 50 % residual) when the chart opens. The phantom contributes to the curve but is NOT rendered as an injection marker (no arrow, no `HH:MM — NU` label).
   - **For bolus insulins:** same rule. "Previous bolus" = last meal-time dose. A breakfast chart opening at 07:00 has a phantom at `07:00 − (DOA/2)` representing the previous day's overnight basal residual or the last meal-time bolus that's still tailing off.
   - **DOA source:** `profile.duration_minutes / 60` for fixed-DOA insulins. For Levemir (dose-dependent), use the Plank 2005 interpolation from the patient's `units / weightKg` anchor.
   - **Alternative mechanism (multi-cycle insulins):** `/iob-hunter` and `/dashboard` use `computeGraphBounds` + `generatePerDoseActivityCurves(... cycles)` which duplicate visible doses by prior-cycle count — same effect, no explicit phantom. Both paths are valid — pick whichever the chart is already wired for.
2. **No vertical spike at injection.** The NEW dose's contribution ramps up smoothly; it adds onto the existing non-zero residual. Total line is continuous.
3. **Fixed DOA on the activity-rate chart path.** Same insulin = same curve shape = same X footprint. Only peak height scales with dose. The ONLY exception is the IOB chart for Levemir (Plank 2005 dose-dependent DOA table).
4. **Peakless insulins never draw a peak.** Tresiba, Toujeo, Levemir — never.
5. **No invented curve functions.** All shapes come from `calculateIOB` or `calculateActivityRate` in `iob-engine.ts`. If the engine doesn't produce the right shape, stop and propose an engine change as a prose diff. Never work around with inline helpers.
6. **Cadence is locked per insulin.** Copying Levemir's 12 h BID cadence onto Tresiba is a bug. Copying Tresiba's 24 h once-daily onto Levemir is a bug.

## Banned patterns (enforced by hook at `.claude/hooks/insulin-lock-check.sh`)

The hook will block `Edit` / `Write` if the new content contains any of these literal strings in protected files:

- `tresibaFrac`, `levemirFrac`, `basalFrac`, `insulinFrac` — invented curve functions
- `rise from zero` — violates never-zero-start
- `1 - minutesSinceDose / effectiveDuration` inside the `case "depot_release"` block — reverts Bateman to linear without approval
- `Tresiba` with two dose times inside the same 24 h in any demo schedule
- `Levemir` with only one dose time per 24 h in any demo schedule

## Protected paths (hook enforces)

- `src/iob-hunter/engine/iob-engine.ts`
- `src/iob-hunter/engine/insulin-profiles.ts`
- `src/iob-hunter/components/BasalLifecycleChart.tsx`
- `src/iob-hunter/components/BasalActivityChart.tsx`
- `src/iob-hunter/components/IOBHunterChart.tsx`
- `src/pages/BasalParametersPage.tsx`
- `src/pages/IOBHunterPage.tsx`
- `tresiba-interpretation-test.html`

## Pre-edit protocol

Before any `Edit` / `Write` to a protected path, Claude MUST:

1. Paste the matching row from the tables above.
2. State the current behavior vs proposed behavior (prose diff).
3. Wait for a green-light phrase from founder: `APPROVE-INSULIN-EDIT`.

No paste, no diff, no green light — no edit. Questions are not authorizations.
