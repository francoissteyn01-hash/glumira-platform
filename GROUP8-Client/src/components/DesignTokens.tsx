/**
 * GluMira™ Design Token System
 * Version: 1.0
 * 
 * Single source of truth for all design tokens used across the GluMira platform.
 * Two aesthetic tracks:
 *   - Marketing / Landing: Dark navy gradient + teal waves + amber sparkles (Clinical Depth)
 *   - App UI: White + light gray, Scandinavian minimalist
 * 
 * Fonts: Playfair Display (headings) + DM Sans (body/UI) + JetBrains Mono (clinical data)
 * App UI fonts: Inter + DM Sans
 */

// ─── Color Tokens ───────────────────────────────────────────────────────────

export const Colors = {
  /** Brand primary colors */
  brand: {
    navy:       '#1a2a5e',   // oklch(0.27 0.09 258) — headings, dark backgrounds
    navyDeep:   '#0d1b3e',   // oklch(0.18 0.08 258) — hero/marketing gradients
    teal:       '#2ab5c1',   // oklch(0.70 0.12 196) — links, waves, highlights
    amber:      '#f59e0b',   // oklch(0.78 0.16 75)  — CTAs, glucose drop motif
    lightBlue:  '#e8f4f8',   // oklch(0.96 0.02 220) — section backgrounds
    white:      '#ffffff',   // cards, text on dark
  },

  /** Text colors */
  text: {
    primary:    '#1a2a5e',   // navy — headings
    secondary:  '#52667a',   // body text on light bg
    tertiary:   '#94a3b8',   // muted/caption text
    inverse:    '#ffffff',   // text on dark backgrounds
    link:       '#2ab5c1',   // teal — interactive text
  },

  /** Background colors */
  background: {
    primary:    '#ffffff',
    secondary:  '#f8fafd',
    tertiary:   '#e8f4f8',
    dark:       '#1a2a5e',
    darkDeep:   '#0d1b3e',
    card:       '#ffffff',
    input:      '#f0f4f8',
  },

  /** Border colors */
  border: {
    default:    '#e2e8f0',
    focus:      '#2ab5c1',
    error:      '#d32f2f',
    success:    '#2e7d32',
  },

  /** Glucose status colors (WCAG AA compliant) */
  glucose: {
    hypo:       '#D32F2F',   // < 3.9 mmol/L
    low:        '#F57C00',   // 3.9–4.4 mmol/L
    target:     '#2E7D32',   // 4.4–10.0 mmol/L
    high:       '#F57C00',   // 10.0–13.9 mmol/L
    veryHigh:   '#D32F2F',   // > 13.9 mmol/L
    iobLine:    '#3b5998',   // IOB curve overlay
  },

  /** Chart palette (IOB, Glucose, Basal, Bolus, Stacking) */
  chart: {
    series1:    '#2ab5c1',   // teal
    series2:    '#f59e0b',   // amber
    series3:    '#1a2a5e',   // navy
    series4:    '#7dd3c0',   // light teal
    series5:    '#fcd34d',   // light amber
  },

  /** Alert/status semantic colors */
  status: {
    success:      '#2E7D32',
    successBg:    'rgba(46, 125, 50, 0.08)',
    successBorder:'rgba(46, 125, 50, 0.25)',
    warning:      '#F57C00',
    warningBg:    'rgba(245, 158, 11, 0.08)',
    warningBorder:'rgba(245, 158, 11, 0.25)',
    error:        '#D32F2F',
    errorBg:      'rgba(211, 47, 47, 0.08)',
    errorBorder:  'rgba(211, 47, 47, 0.25)',
    info:         '#2ab5c1',
    infoBg:       'rgba(42, 181, 193, 0.08)',
    infoBorder:   'rgba(42, 181, 193, 0.25)',
  },

  /** Stacking risk indicators */
  stacking: {
    safe:       '#2E7D32',
    moderate:   '#F59E0B',
    high:       '#D32F2F',
  },
} as const;


// ─── OKLCH Color Tokens (for CSS custom properties) ─────────────────────────

export const ColorsOKLCH = {
  navy:       'oklch(0.27 0.09 258)',
  navyDeep:   'oklch(0.18 0.08 258)',
  teal:       'oklch(0.70 0.12 196)',
  amber:      'oklch(0.78 0.16 75)',
  lightBlue:  'oklch(0.96 0.02 220)',
} as const;


// ─── Typography Tokens ──────────────────────────────────────────────────────

export const FontFamily = {
  heading:    "'Playfair Display', serif",
  body:       "'DM Sans', sans-serif",
  mono:       "'JetBrains Mono', monospace",
  appHeading: "'Inter', sans-serif",
  appBody:    "'DM Sans', sans-serif",
} as const;

export const Typography = {
  /** Marketing / Landing page scale */
  display:    { size: '3.5rem',  weight: 800, lineHeight: 1.1, family: FontFamily.heading },
  h1:         { size: '2.5rem',  weight: 700, lineHeight: 1.2, family: FontFamily.heading },
  h2:         { size: '2rem',    weight: 700, lineHeight: 1.25, family: FontFamily.heading },
  h3:         { size: '1.5rem',  weight: 700, lineHeight: 1.3, family: FontFamily.heading },
  h4:         { size: '1.25rem', weight: 700, lineHeight: 1.35, family: FontFamily.heading },

  /** App UI scale (Scandinavian minimalist) */
  appTitle:   { size: '1.5rem',  weight: 600, lineHeight: 1.3, family: FontFamily.appHeading },
  appH2:      { size: '1.25rem', weight: 600, lineHeight: 1.35, family: FontFamily.appHeading },
  appH3:      { size: '1.125rem',weight: 600, lineHeight: 1.4, family: FontFamily.appHeading },

  /** Body text */
  bodyLarge:  { size: '1.125rem',weight: 400, lineHeight: 1.6, family: FontFamily.body },
  body:       { size: '1rem',    weight: 400, lineHeight: 1.6, family: FontFamily.body },
  bodySmall:  { size: '0.875rem',weight: 400, lineHeight: 1.5, family: FontFamily.body },
  caption:    { size: '0.75rem', weight: 400, lineHeight: 1.4, family: FontFamily.body },
  label:      { size: '0.875rem',weight: 500, lineHeight: 1.4, family: FontFamily.body },

  /** Clinical data */
  dataLarge:  { size: '1.5rem',  weight: 600, lineHeight: 1.2, family: FontFamily.mono },
  data:       { size: '1rem',    weight: 500, lineHeight: 1.3, family: FontFamily.mono },
  dataSmall:  { size: '0.875rem',weight: 400, lineHeight: 1.3, family: FontFamily.mono },
} as const;


// ─── Spacing Tokens ─────────────────────────────────────────────────────────

export const Spacing = {
  '0':    '0px',
  px:     '1px',
  '0.5':  '2px',
  '1':    '4px',
  '1.5':  '6px',
  '2':    '8px',     // base unit
  '3':    '12px',
  '4':    '16px',
  '5':    '20px',
  '6':    '24px',
  '8':    '32px',
  '10':   '40px',
  '12':   '48px',
  '16':   '64px',
  '20':   '80px',
  '24':   '96px',
} as const;


// ─── Shadow Tokens ──────────────────────────────────────────────────────────

export const Shadows = {
  /** Soft editorial card shadow */
  card:       '0 1px 3px rgba(26, 42, 94, 0.06), 0 4px 12px rgba(26, 42, 94, 0.04)',
  /** Elevated card (hover) */
  cardHover:  '0 4px 14px rgba(26, 42, 94, 0.10), 0 8px 24px rgba(26, 42, 94, 0.06)',
  /** Modal overlay */
  modal:      '0 8px 32px rgba(26, 42, 94, 0.16), 0 16px 48px rgba(26, 42, 94, 0.08)',
  /** Button glow (teal) */
  btnPrimary: '0 4px 14px rgba(42, 181, 193, 0.35)',
  /** Button glow (amber) */
  btnCta:     '0 4px 14px rgba(245, 158, 11, 0.35)',
  /** Focus ring */
  focus:      '0 0 0 3px rgba(42, 181, 193, 0.25)',
  /** No shadow */
  none:       'none',
} as const;


// ─── Border Radius Tokens ───────────────────────────────────────────────────

export const BorderRadius = {
  none:   '0px',
  sm:     '4px',
  md:     '8px',
  lg:     '12px',
  xl:     '16px',
  '2xl':  '24px',
  full:   '9999px',
} as const;


// ─── Transition Tokens ──────────────────────────────────────────────────────

export const Transitions = {
  fast:     'all 0.15s ease',
  default:  'all 0.2s ease',
  slow:     'all 0.3s ease',
  spring:   'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;


// ─── Breakpoint Tokens ──────────────────────────────────────────────────────

export const Breakpoints = {
  sm:   '640px',
  md:   '768px',
  lg:   '1024px',
  xl:   '1280px',
  '2xl':'1536px',
} as const;


// ─── Z-Index Tokens ─────────────────────────────────────────────────────────

export const ZIndex = {
  base:       0,
  dropdown:   10,
  sticky:     20,
  fixed:      30,
  overlay:    40,
  modal:      50,
  popover:    60,
  toast:      70,
} as const;


// ─── Component Presets (Tailwind class strings) ─────────────────────────────

export const ComponentPresets = {
  card: {
    default:      'glum-card',
    highlighted:  'glum-card ring-2 ring-glumira-teal/30',
    interactive:  'glum-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer',
  },

  button: {
    primary:      'glum-btn-primary',
    secondary:    'glum-btn-secondary',
    cta:          'inline-flex items-center justify-center gap-2 rounded-lg px-8 py-4 text-base font-bold transition-all duration-200 bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 hover:-translate-y-0.5 shadow-lg hover:shadow-xl min-h-[44px]',
    danger:       'inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-all duration-200 min-h-[44px]',
    ghost:        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-glumira-navy hover:bg-glumira-navy/5 transition-all duration-200 min-h-[44px]',
    small:        'inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all duration-200 min-h-[36px]',
    icon:         'inline-flex items-center justify-center rounded-lg p-2.5 transition-all duration-200 min-h-[44px] min-w-[44px]',
  },

  input: {
    default:      'glum-input',
    error:        'glum-input border-red-500 focus:border-red-500 focus:ring-red-500/20',
    disabled:     'glum-input opacity-50 cursor-not-allowed bg-gray-100',
  },

  label: {
    default:      'glum-label',
  },

  alert: {
    info:         'glum-alert-info',
    warning:      'glum-alert-warning',
    danger:       'glum-alert-danger',
    success:      'glum-alert-success',
  },

  badge: {
    primary:      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-glumira-navy/10 text-glumira-navy',
    teal:         'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-glumira-teal/10 text-glumira-teal',
    amber:        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900',
    success:      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800',
    warning:      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800',
    error:        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800',
    neutral:      'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700',
  },

  glucose: {
    hypo:         'glum-glucose-badge glum-glucose-hypo',
    low:          'glum-glucose-badge glum-glucose-low',
    target:       'glum-glucose-badge glum-glucose-target',
    high:         'glum-glucose-badge glum-glucose-high',
    veryHigh:     'glum-glucose-badge glum-glucose-very-high',
  },

  table: {
    header:       'bg-glumira-navy/5 text-left text-xs font-semibold text-glumira-navy uppercase tracking-wider px-4 py-3',
    row:          'border-b border-border hover:bg-glumira-teal/5 transition-colors',
    cell:         'px-4 py-3 text-sm',
  },

  modal: {
    overlay:      'fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center',
    content:      'bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-auto',
    header:       'px-6 py-4 border-b border-border',
    body:         'px-6 py-4',
    footer:       'px-6 py-4 border-t border-border flex justify-end gap-3',
  },

  section: {
    navy:         'section-navy',
    tealGradient: 'section-teal-gradient',
    light:        'section-light',
    white:        'bg-white',
  },

  disclaimer:     'glum-disclaimer',
} as const;


// ─── Utility Functions ──────────────────────────────────────────────────────

/** Merge class names, filtering out falsy values */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Get a glucose status color based on mmol/L value */
export function getGlucoseColor(mmol: number): string {
  if (mmol < 3.9) return Colors.glucose.hypo;
  if (mmol < 4.4) return Colors.glucose.low;
  if (mmol <= 10.0) return Colors.glucose.target;
  if (mmol <= 13.9) return Colors.glucose.high;
  return Colors.glucose.veryHigh;
}

/** Get a glucose status badge preset based on mmol/L value */
export function getGlucoseBadge(mmol: number): string {
  if (mmol < 3.9) return ComponentPresets.glucose.hypo;
  if (mmol < 4.4) return ComponentPresets.glucose.low;
  if (mmol <= 10.0) return ComponentPresets.glucose.target;
  if (mmol <= 13.9) return ComponentPresets.glucose.high;
  return ComponentPresets.glucose.veryHigh;
}

/** Get a stacking risk color based on risk level */
export function getStackingColor(level: 'safe' | 'moderate' | 'high'): string {
  return Colors.stacking[level];
}

/** Get a chart color by series index (0-based, wraps around) */
export function getChartColor(index: number): string {
  const series = Object.values(Colors.chart);
  return series[index % series.length];
}
