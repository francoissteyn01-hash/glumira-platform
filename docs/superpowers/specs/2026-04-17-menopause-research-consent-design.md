# MenopauseModule + Research Consent — Design Spec

**Date:** 2026-04-17
**Status:** Approved
**Workstream:** Female Health Suite + Research Infrastructure

---

## Overview

Two deliverables:

1. **MenopauseModule** — T1D + menopause insulin resistance modelling, at `/modules/menopause`
2. **Research consent addition** — IRB-aligned optional opt-in added to the existing ConsentPage at `/onboarding/consent`

---

## Part 1: MenopauseModule

### Route & files

| File | Purpose |
| --- | --- |
| `src/lib/menopause-engine.ts` | Clinical engine — inputs → ISF modifiers → outputs |
| `src/pages/MenopauseModule.tsx` | Page component — single-scroll, mobile-first |
| `App.tsx` | Add lazy import + `/modules/menopause` route |
| `src/components/AppSidebar.tsx` | Add entry under female health group |

### Interaction model

Snapshot → immediate output → optional weekly tracker (collapsible section below results). No longitudinal requirement to get first value.

### Engine: inputs

#### Profile

- `stage`: `"perimenopause" | "menopause" | "postmenopause"`
- `hrtType`: `"none" | "oestrogen-only" | "combined"`
- `yearsSinceLastPeriod`: number (0–15)
- `symptoms`: array of `"hot_flashes" | "insomnia" | "mood_changes" | "weight_gain" | "brain_fog" | "vaginal_dryness"`

#### Glucose / Insulin

- `avgFastingMmol`: number
- `avgPostMealMmol`: number
- `basalDoseUnits`: number
- `hypoEventsLast7Days`: number
- `currentISF`: number | undefined (optional)
- `unit`: `"mmol" | "mg"` (convert mg → mmol at input boundary)

### Engine: ISF sensitivity modifiers

Literature-derived multiplier ranges applied to current ISF. All values are educational estimates shown as bands, never point values.

| Stage | HRT | ISF impact |
| --- | --- | --- |
| perimenopause | none | −10% to −25% |
| menopause | none | −15% to −30% |
| postmenopause | none | −20% to −35% |
| any | oestrogen-only | −5% to −15% |
| any | combined | −10% to −20% |

Sources: Mauvais-Jarvis 2015 (Nat Rev Endocrinol PMID:26260609), Samaras 1999 (Diabetes Care PMID:10333937), NAMS 2022 Menopause Society Position Statement.

Hot flashes flag: if `symptoms` includes `"hot_flashes"`, add a correlation note — hot flash events transiently raise cortisol → acute glucose spikes independent of ISF shift.

Insomnia flag: if `symptoms` includes `"insomnia"`, flag elevated dawn phenomenon risk — sleep disruption raises cortisol and growth hormone overnight.

### Engine: outputs

```ts
interface MenopauseAnalysisResult {
  isfImpactLow: number;           // e.g. -0.10
  isfImpactHigh: number;          // e.g. -0.20
  resistanceLevel: "low" | "moderate" | "high";
  nocturnalHypoRisk: "low" | "elevated" | "high";
  dawnPhenomenonFlag: boolean;
  hrtInteractionNote: string | null;
  hotFlashCorrelationNote: string | null;
  monitoringPlan: string[];       // 3–5 bullet strings
  doctorTalkingPoints: string[];  // 3–5 bullet strings
  citations: string[];
}
```

Resistance level derived from: stage weight + HRT modifier + hypo frequency (high hypo count → paradoxical resistance from counter-regulation).

### Page layout: MenopauseModule.tsx

Single-scroll, mobile-first (390px baseline). Follows PregnancyModule pattern exactly.

Sections (top → bottom):

1. Back link → `/education`
2. Header — 🌸 icon, "Menopause & Glucose" (Playfair Display 22px), subtitle
3. Stage selector card — pill buttons (perimenopause / menopause / postmenopause) + contextual description
4. HRT card — pill buttons (none / oestrogen-only / combined)
5. Glucose & insulin card — 2-column grid inputs (fasting, post-meal, basal dose, hypo count)
6. Symptoms card — multi-select pill tags
7. "Analyse my pattern" CTA — full-width teal gradient, 48px+ touch target
8. Results section (appears after analysis):
   - ISF impact card — navy gradient, teal number, band display
   - Risk flags grid — 2-column (insulin resistance level, nocturnal hypo risk)
   - HRT interaction note (conditional, green card)
   - Hot flash correlation note (conditional, amber card)
   - Dawn phenomenon flag (conditional, orange card)
   - Doctor talking points card
   - "Track this week" CTA → collapsible optional tracker
9. Disclaimer banner — "Educational platform — not a medical device…"

Colours: brand palette only — navy #1A2A5E, teal #2AB5C1, amber #F59E0B, interior #F8F9FA.

Optional tracker (collapsible): 7-day lightweight log — daily fasting glucose + post-meal + symptoms. After 7 entries shows a week-summary card (avg glucose by day, symptom frequency). Stored in localStorage only — no backend required for V1.

---

## Part 2: Research Consent

### Approach

Add one item to `CONSENT_ITEMS` in `ConsentPage.tsx`. Non-blocking (`mandatory: false`). Visually distinguished from mandatory items with amber accent.

### ConsentItem interface extension

The existing `ConsentItem` interface (`ConsentPage.tsx:22`) must be extended with two optional fields:

```ts
interface ConsentItem {
  id: string;
  label: string;
  mandatory: boolean;
  link?: { text: string; href: string };
  sublabel?: string;    // NEW — secondary explanatory text
  badgeText?: string;   // NEW — pill badge text
}
```

The existing renderer loop must be updated to render `sublabel` and `badgeText` when present.

### New consent item

```ts
{
  id: "research_programme",
  label: "I voluntarily consent to contribute my anonymised glucose and insulin patterns to the GluMira™ Real-World Research Programme",
  mandatory: false,
  sublabel: "Your identity is never shared. Data is aggregated only. You may withdraw at any time from Settings → Research.",
  badgeText: "Optional — does not affect platform access",
  link: { text: "Learn more", href: "/research" },
}
```

Visual treatment: amber checkbox accent (not teal), amber "Optional" badge, sublabel in muted text below main label. Separated from mandatory items by a thin divider.

### Database

The existing `ConsentPage.tsx` stores consent to localStorage and fires a best-effort POST to `/trpc/consent.create` (no server handler exists today — it is caught and ignored). As part of this work:

- Create a `user_consents` table in `drizzle/schema.ts`
- Implement the `consent.create` tRPC endpoint on the server
- Add two research-specific columns:

```sql
research_consent         BOOLEAN      NOT NULL DEFAULT FALSE,
research_consent_ts      TIMESTAMPTZ,
research_consent_withdrawn_ts  TIMESTAMPTZ,
```

`research_consent_ts` written only when `research_consent = TRUE`. localStorage continues as the offline fallback.

### Withdrawal

Settings page: add a "Research" section with a toggle. Toggling off sets `research_consent = FALSE`, clears `research_consent_ts`, writes `research_consent_withdrawn_ts`.

### /research route

A lightweight static page (`ResearchInfoPage.tsx`) at `/research` — plain-language description of:

- What data is collected (anonymised glucose patterns, module inputs)
- How it is used (aggregated analysis, no individual identification)
- Who has access (GluMira internal research only, no third-party sharing)
- How to withdraw

Reuse existing privacy/terms page styling — no new design system required.

### IRB alignment

- Voluntary participation
- Fully anonymised — no PII in research dataset
- Withdrawable at any time with no penalty
- Non-interventional, observational only
- Plain-language description provided
- Meets standard criteria for waived IRB review (anonymised, no more than minimal risk, no deception)

---

## Out of scope

- Doctor report PDF export (Pro-tier — future)
- Ramadan cohort collection layer (separate workstream)
- Stripe billing verification (separate workstream)
- Backend persistence for optional tracker (V1 = localStorage only)
- Full IRB submission (anonymised observational data does not require one)

---

## Routing additions (App.tsx)

```tsx
// Lazy imports to add
const MenopauseModule  = lazy(() => import("@/pages/MenopauseModule"));
const ResearchInfoPage = lazy(() => import("@/pages/ResearchInfoPage"));

// Routes to add
<Route path="/modules/menopause" element={<MenopauseModule />} />
<Route path="/research"          element={<ResearchInfoPage />} />
```

AppSidebar: add `{ path: "/modules/menopause", label: "Menopause" }` under the female health group alongside menstrual, pregnancy, paediatric.

---

## Success criteria

- [ ] `/modules/menopause` renders, accepts all inputs, returns analysis with ISF band + risk flags
- [ ] HRT interaction note appears when hrtType ≠ "none"
- [ ] Hot flash / insomnia flags appear when those symptoms selected
- [ ] "Track this week" accordion opens, logs 7 entries, shows week summary
- [ ] ConsentPage shows research item with amber styling, non-blocking
- [ ] Opting in stores `research_consent = TRUE` in DB
- [ ] Settings → Research toggle successfully withdraws consent
- [ ] `/research` info page renders with correct content
- [ ] `tsc --noEmit` passes
- [ ] Mobile layout correct at 390px
