# GluMira Design System

**Version:** 1.0  
**Last Updated:** 2026-03-27  
**Platform:** GluMira V6 — Powered by IOB Hunter  
**Tagline:** The science of insulin, made visible

---

## 1. Overview

The GluMira Design System establishes a unified visual language across the entire platform, from marketing landing pages to the clinical dashboard application. It is built on two distinct aesthetic tracks that serve different purposes while sharing a common brand identity.

The **Clinical Depth** track is used for all marketing, landing pages, and external-facing materials. It features dark navy gradients, glowing teal waves, and amber sparkle accents that convey medical authority and innovation. The **Scandinavian Minimalist** track is used for the application dashboard, forms, and data entry interfaces. It prioritizes white space, compact layouts, and subtle borders to reduce cognitive load during clinical data entry.

Every design decision in this system is grounded in three principles: clinical trust (colors and typography that convey medical credibility), accessibility (WCAG 2.1 AA compliance throughout), and educational clarity (GluMira is an educational platform, not a medical device).

---

## 2. Color Palette

### Brand Colors

| Token | Hex | OKLCH | Usage |
|:------|:----|:------|:------|
| Navy | `#1a2a5e` | `oklch(0.27 0.09 258)` | Headings, dark backgrounds, primary brand |
| Navy Deep | `#0d1b3e` | `oklch(0.18 0.08 258)` | Hero sections, marketing gradients |
| Teal | `#2ab5c1` | `oklch(0.70 0.12 196)` | Links, wave dividers, highlights, focus rings |
| Light Blue | `#e8f4f8` | `oklch(0.96 0.02 220)` | Section backgrounds, input fields |
| Amber | `#f59e0b` | `oklch(0.78 0.16 75)` | CTAs only, glucose drop motif |
| White | `#ffffff` | `oklch(1 0 0)` | Cards, text on dark backgrounds |
| Body Text | `#52667a` | — | Paragraph text on light backgrounds |

### Glucose Status Colors

These colors are used exclusively for glucose value displays and must meet WCAG AA contrast requirements against their respective badge backgrounds.

| Status | Color | Hex | Threshold |
|:-------|:------|:----|:----------|
| Hypoglycemia | Red | `#D32F2F` | < 3.9 mmol/L |
| Low | Orange | `#F57C00` | 3.9–4.4 mmol/L |
| Target | Green | `#2E7D32` | 4.4–10.0 mmol/L |
| High | Orange | `#F57C00` | 10.0–13.9 mmol/L |
| Very High | Red | `#D32F2F` | > 13.9 mmol/L |
| IOB Line | Blue | `#3b5998` | IOB curve overlay |

### Chart Palette

| Series | Color | Hex | Represents |
|:-------|:------|:----|:-----------|
| 1 | Teal | `#2ab5c1` | Primary data (glucose) |
| 2 | Amber | `#f59e0b` | Secondary data (IOB) |
| 3 | Navy | `#1a2a5e` | Tertiary data (basal) |
| 4 | Light Teal | `#7dd3c0` | Quaternary (bolus) |
| 5 | Light Amber | `#fcd34d` | Quinary (stacking) |

### Semantic Status Colors

| Status | Text | Background | Border |
|:-------|:-----|:-----------|:-------|
| Success | `#2E7D32` | `rgba(46,125,50,0.08)` | `rgba(46,125,50,0.25)` |
| Warning | `#F57C00` | `rgba(245,158,11,0.08)` | `rgba(245,158,11,0.25)` |
| Error | `#D32F2F` | `rgba(211,47,47,0.08)` | `rgba(211,47,47,0.25)` |
| Info | `#2ab5c1` | `rgba(42,181,193,0.08)` | `rgba(42,181,193,0.25)` |

---

## 3. Typography

### Font Families

| Context | Font | Weight Range | Usage |
|:--------|:-----|:-------------|:------|
| Marketing Headings | Playfair Display | 700, 800 | Landing page titles, hero text |
| Body / UI | DM Sans | 300–600 | Paragraphs, buttons, labels, forms |
| App Headings | Inter | 300–600 | Dashboard titles, section headers |
| Clinical Data | JetBrains Mono | 400–600 | Glucose values, IOB numbers, doses |

### Type Scale (Marketing)

| Level | Size | Weight | Line Height | CSS Class |
|:------|:-----|:-------|:------------|:----------|
| Display | 3.5rem (56px) | 800 | 1.1 | `text-6xl` |
| H1 | 2.5rem (40px) | 700 | 1.2 | `text-5xl` |
| H2 | 2rem (32px) | 700 | 1.25 | `text-4xl` |
| H3 | 1.5rem (24px) | 700 | 1.3 | `text-3xl` |
| H4 | 1.25rem (20px) | 700 | 1.35 | `text-2xl` |

### Type Scale (App UI)

| Level | Size | Weight | Line Height |
|:------|:-----|:-------|:------------|
| App Title | 1.5rem (24px) | 600 | 1.3 |
| App H2 | 1.25rem (20px) | 600 | 1.35 |
| App H3 | 1.125rem (18px) | 600 | 1.4 |
| Body Large | 1.125rem (18px) | 400 | 1.6 |
| Body | 1rem (16px) | 400 | 1.6 |
| Body Small | 0.875rem (14px) | 400 | 1.5 |
| Caption | 0.75rem (12px) | 400 | 1.4 |
| Label | 0.875rem (14px) | 500 | 1.4 |

### Clinical Data Type Scale

| Level | Size | Weight | Usage |
|:------|:-----|:-------|:------|
| Data Large | 1.5rem (24px) | 600 | Primary glucose reading |
| Data | 1rem (16px) | 500 | IOB values, dose amounts |
| Data Small | 0.875rem (14px) | 400 | Timestamps, secondary readings |

All clinical data uses `font-variant-numeric: tabular-nums` for aligned columns.

---

## 4. Spacing System

The spacing system uses an 8px base unit. All padding, margin, and gap values should be multiples of this base.

| Token | Value | Usage |
|:------|:------|:------|
| `0` | 0px | Reset |
| `px` | 1px | Hairline borders |
| `0.5` | 2px | Micro spacing |
| `1` | 4px | Minimal internal padding |
| `1.5` | 6px | Tight grouping |
| `2` | 8px | Base unit — compact spacing |
| `3` | 12px | Standard internal padding |
| `4` | 16px | Standard component spacing |
| `5` | 20px | Generous internal padding |
| `6` | 24px | Section internal padding |
| `8` | 32px | Large component spacing |
| `10` | 40px | Section gaps |
| `12` | 48px | Major section spacing |
| `16` | 64px | Page section spacing |
| `20` | 80px | Hero section padding |
| `24` | 96px | Maximum section spacing |

App UI forms use compact `h-8` (32px) input fields with `py-1.5 px-3` padding.

---

## 5. Shadows and Elevation

| Level | Shadow | Usage |
|:------|:-------|:------|
| Card | `0 1px 3px rgba(26,42,94,0.06), 0 4px 12px rgba(26,42,94,0.04)` | Default card state |
| Card Hover | `0 4px 14px rgba(26,42,94,0.10), 0 8px 24px rgba(26,42,94,0.06)` | Interactive card hover |
| Modal | `0 8px 32px rgba(26,42,94,0.16), 0 16px 48px rgba(26,42,94,0.08)` | Modal dialogs |
| Button Primary | `0 4px 14px rgba(42,181,193,0.35)` | Teal button hover glow |
| Button CTA | `0 4px 14px rgba(245,158,11,0.35)` | Amber CTA button glow |
| Focus | `0 0 0 3px rgba(42,181,193,0.25)` | Focus ring for accessibility |

All shadows use navy-tinted rgba values rather than pure black to maintain the brand warmth.

---

## 6. Border Radius

| Token | Value | Usage |
|:------|:------|:------|
| `none` | 0px | Sharp edges (data tables) |
| `sm` | 4px | Small elements (badges, pills) |
| `md` | 8px | Inputs, small cards |
| `lg` | 12px | Standard cards, modals |
| `xl` | 16px | Feature cards, hero elements |
| `2xl` | 24px | Large promotional cards |
| `full` | 9999px | Circular elements, avatars |

The default border radius for the platform is `0.65rem` (approximately 10px), set via `--radius`.

---

## 7. Component Patterns

### Buttons

The platform provides five button variants. All buttons enforce a minimum touch target of 44px (WCAG 2.1 AA).

| Variant | Class | Usage |
|:--------|:------|:------|
| Primary | `glum-btn-primary` | Main actions (teal gradient) |
| Secondary | `glum-btn-secondary` | Secondary actions (navy outline) |
| CTA | Custom amber gradient | Call-to-action (amber gradient, larger) |
| Danger | Red background | Destructive actions |
| Ghost | Transparent with hover | Tertiary/navigation actions |

### Cards

Cards use the `.glum-card` class with soft editorial shadows. Three variants exist: default (static), highlighted (teal ring), and interactive (hover lift effect).

### Inputs

All form inputs use `.glum-input` with a minimum height of 44px. Error states add a red border and focus ring. Disabled states reduce opacity to 50%.

### Alerts

Four semantic alert variants are available: info (teal), warning (amber), danger (red), and success (green). Each uses a left-border accent with a tinted background.

### Glucose Badges

Glucose status badges use `.glum-glucose-badge` combined with a status modifier. They display in JetBrains Mono for clinical data consistency.

### Tables

Table headers use a light navy background with uppercase tracking. Rows have hover states using a subtle teal tint.

---

## 8. Responsive Design

| Breakpoint | Width | Usage |
|:-----------|:------|:------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet portrait |
| `lg` | 1024px | Tablet landscape / small desktop |
| `xl` | 1280px | Standard desktop (max container width) |
| `2xl` | 1536px | Large desktop |

The container has a maximum width of 1280px with responsive padding: 1rem (mobile), 1.5rem (sm), 2rem (lg).

---

## 9. Dark Mode

Dark mode tokens are defined in the `.dark` class scope. Key adjustments include lighter primary colors for contrast, dark card backgrounds, and reduced border opacity. The dark mode is designed for low-light clinical environments where screen glare must be minimized.

---

## 10. Icons

The platform uses Lucide React icons for consistency. Icon sizing follows the spacing scale: 16px (inline), 20px (button), 24px (section header), 32px (feature card).

---

## 11. Animation and Transitions

| Token | Duration | Easing | Usage |
|:------|:---------|:-------|:------|
| Fast | 150ms | ease | Hover states, focus rings |
| Default | 200ms | ease | Button interactions, card hover |
| Slow | 300ms | ease | Modal open/close, section transitions |
| Spring | 400ms | cubic-bezier(0.34, 1.56, 0.64, 1) | Playful micro-interactions |

All animations respect `prefers-reduced-motion: reduce` by disabling transitions for users who request it.

---

## 12. Accessibility Standards

The GluMira Design System enforces WCAG 2.1 AA compliance throughout.

| Requirement | Standard | Implementation |
|:------------|:---------|:---------------|
| Text contrast | 4.5:1 minimum | All text/background combinations tested |
| Large text contrast | 3:1 minimum | Headings and display text verified |
| Touch targets | 44px minimum | All interactive elements enforced via CSS |
| Focus indicators | Visible ring | Teal focus ring on all focusable elements |
| Color independence | Not sole indicator | Status always includes text labels alongside color |
| Motion sensitivity | Reduced motion | `prefers-reduced-motion` respected |

---

## 13. Usage Guidelines

**Amber is reserved for CTAs and the glucose drop motif only.** Do not use amber for decorative purposes, backgrounds, or non-interactive elements.

**Navy is the primary brand color.** Use it for headings, dark section backgrounds, and primary text. Never use pure black (`#000000`) for text.

**Teal is the interactive color.** Use it for links, focus rings, wave dividers, and hover states. It signals "clickable" or "active" to the user.

**Clinical data always uses JetBrains Mono** with tabular numerics enabled. This ensures glucose values, IOB numbers, and dose amounts align properly in columns and tables.

**The owl mascot uses Clinical Depth style only.** Never render the owl in flat cartoon, photorealistic, or watercolor styles. The owl has teal/navy feathers, an amber teardrop on its forehead, and golden eyes.

---

## 14. Implementation in Tailwind

### CSS Custom Properties

All brand colors are defined as CSS custom properties in `index.css` using OKLCH color space for perceptual uniformity. The Tailwind theme maps these to utility classes via `@theme inline`.

### Component Classes

Reusable component classes are defined in `@layer components` with the `glum-` prefix to avoid conflicts with Tailwind utilities. These include `glum-card`, `glum-btn-primary`, `glum-btn-secondary`, `glum-input`, `glum-label`, `glum-alert-*`, and `glum-glucose-*`.

### TypeScript Tokens

The `DesignTokens.tsx` file exports all tokens as typed constants for use in React components. Import from `@/components/DesignTokens` to access colors, typography, spacing, shadows, and component presets programmatically.

```tsx
import { Colors, ComponentPresets, cn, getGlucoseColor } from '@/components/DesignTokens';
```

---

## Appendix: Approved Brand Assets

| Asset | CDN URL | Usage |
|:------|:--------|:------|
| Owl Mascot | [CDN Link](https://d2xsxph8kpxj0f.cloudfront.net/310519663458340082/7pTbwMW7uihCCsypZFsqz6/glumira_v6_asset_owl_glow_608d9d80.png) | Hero, marketing |
| App Icon | [CDN Link](https://d2xsxph8kpxj0f.cloudfront.net/310519663458340082/7pTbwMW7uihCCsypZFsqz6/glumira_v6_matched_icon_17a09028.png) | Favicon, app stores |
| Hero BG | [CDN Link](https://d2xsxph8kpxj0f.cloudfront.net/310519663458340082/7pTbwMW7uihCCsypZFsqz6/glumira_v6_bg_hero_17da0369.webp) | Landing hero |
| Data Viz BG | [CDN Link](https://d2xsxph8kpxj0f.cloudfront.net/310519663458340082/7pTbwMW7uihCCsypZFsqz6/glumira_v6_bg_data_viz_f41909df.webp) | Data sections |
| Mission BG | [CDN Link](https://d2xsxph8kpxj0f.cloudfront.net/310519663458340082/7pTbwMW7uihCCsypZFsqz6/glumira_v6_bg_mission_19c01bd9.webp) | Mission/about |
| Feature 1 | [CDN Link](https://d2xsxph8kpxj0f.cloudfront.net/310519663458340082/7pTbwMW7uihCCsypZFsqz6/glumira-feature-1_c848975e.webp) | IOB curve card |
| CTA BG | [CDN Link](https://d2xsxph8kpxj0f.cloudfront.net/310519663458340082/7pTbwMW7uihCCsypZFsqz6/08.6.1_glumira-cta-bg_e54efc61.webp) | CTA sections |
| Pricing BG | [CDN Link](https://d2xsxph8kpxj0f.cloudfront.net/310519663458340082/7pTbwMW7uihCCsypZFsqz6/glumira-pricing-bg_84d533d6.webp) | Pricing section |

---

*GluMira — The science of insulin, made visible. Powered by IOB Hunter.*  
*GluMira is an educational platform, not a medical device.*
