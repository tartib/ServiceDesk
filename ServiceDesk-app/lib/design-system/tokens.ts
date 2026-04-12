/**
 * Design System Tokens — Single Source of Truth
 *
 * All semantic tokens used throughout the app.
 * CSS custom properties in globals.css mirror these values.
 * Import these when you need type-safe token references in TS/TSX.
 */

// ─── Color Tokens ──────────────────────────────────────────────

export const semanticColors = {
  background: 'var(--background)',
  foreground: 'var(--foreground)',
  card: 'var(--card)',
  cardForeground: 'var(--card-foreground)',
  popover: 'var(--popover)',
  popoverForeground: 'var(--popover-foreground)',
  primary: 'var(--primary)',
  primaryForeground: 'var(--primary-foreground)',
  brand: 'var(--brand)',
  brandStrong: 'var(--brand-strong)',
  brandSurface: 'var(--brand-surface)',
  brandBorder: 'var(--brand-border)',
  brandForeground: 'var(--brand-foreground)',
  secondary: 'var(--secondary)',
  secondaryForeground: 'var(--secondary-foreground)',
  muted: 'var(--muted)',
  mutedForeground: 'var(--muted-foreground)',
  accent: 'var(--accent)',
  accentForeground: 'var(--accent-foreground)',
  destructive: 'var(--destructive)',
  destructiveForeground: 'var(--destructive-foreground)',
  success: 'var(--success)',
  successForeground: 'var(--success-foreground)',
  warning: 'var(--warning)',
  warningForeground: 'var(--warning-foreground)',
  info: 'var(--info)',
  infoForeground: 'var(--info-foreground)',
  border: 'var(--border)',
  input: 'var(--input)',
  ring: 'var(--ring)',
} as const;

export const surfaceColors = {
  default: 'var(--surface-default)',
  raised: 'var(--surface-raised)',
  sunken: 'var(--surface-sunken)',
  overlay: 'var(--surface-overlay)',
} as const;

export type SemanticTone =
  | 'brand'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'info'
  | 'neutral';

export const semanticTones: SemanticTone[] = [
  'brand',
  'destructive',
  'success',
  'warning',
  'info',
  'neutral',
] as const;

export const softColors = {
  brand: 'var(--brand-soft)',
  success: 'var(--success-soft)',
  warning: 'var(--warning-soft)',
  destructive: 'var(--destructive-soft)',
  info: 'var(--info-soft)',
} as const;

// ─── Brand System ──────────────────────────────────────────────────

export const brandColors = {
  base: 'var(--brand)',
  strong: 'var(--brand-strong)',
  soft: 'var(--brand-soft)',
  surface: 'var(--brand-surface)',
  border: 'var(--brand-border)',
  foreground: 'var(--brand-foreground)',
} as const;

/**
 * Pre-composed Tailwind class sets for common brand patterns.
 * Use these for consistent brand application across components.
 */
export const brandSemanticClasses = {
  cta: 'bg-brand text-brand-foreground hover:bg-brand-strong',
  soft: 'bg-brand-soft text-brand',
  surface: 'bg-brand-surface text-foreground border border-brand-border',
  outline: 'border border-brand-border text-brand',
  focus: 'focus-visible:ring-brand-border/50 focus-visible:border-brand-border',
} as const;

// ─── Typography Tokens ─────────────────────────────────────────

export const fontSize = {
  xs: 'var(--font-size-xs)',       // 0.75rem
  sm: 'var(--font-size-sm)',       // 0.875rem
  base: 'var(--font-size-base)',   // 1rem
  lg: 'var(--font-size-lg)',       // 1.125rem
  xl: 'var(--font-size-xl)',       // 1.25rem
  '2xl': 'var(--font-size-2xl)',   // 1.5rem
  '3xl': 'var(--font-size-3xl)',   // 1.875rem
  '4xl': 'var(--font-size-4xl)',   // 2.25rem
} as const;

export const fontWeight = {
  normal: 'var(--font-weight-normal)',     // 400
  medium: 'var(--font-weight-medium)',     // 500
  semibold: 'var(--font-weight-semibold)', // 600
  bold: 'var(--font-weight-bold)',         // 700
} as const;

export const lineHeight = {
  tight: 'var(--line-height-tight)',       // 1.25
  normal: 'var(--line-height-normal)',     // 1.5
  relaxed: 'var(--line-height-relaxed)',   // 1.75
} as const;

// ─── Radius Tokens ─────────────────────────────────────────────

export const radius = {
  sm: 'var(--radius-sm)',
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  full: 'var(--radius-full)',
} as const;

// ─── Shadow Tokens ─────────────────────────────────────────────

export const shadow = {
  xs: 'var(--shadow-xs)',
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  xl: 'var(--shadow-xl)',
} as const;

// ─── Motion Tokens ─────────────────────────────────────────────

export const duration = {
  fast: 'var(--duration-fast)',       // 100ms
  normal: 'var(--duration-normal)',   // 200ms
  slow: 'var(--duration-slow)',       // 300ms
} as const;

export const easing = {
  default: 'var(--ease-default)',
  inOut: 'var(--ease-in-out)',
} as const;

// ─── Z-index Layer System ──────────────────────────────────────

export const zIndex = {
  base: 'var(--z-base)',           // 0
  dropdown: 'var(--z-dropdown)',   // 10
  sticky: 'var(--z-sticky)',       // 20
  overlay: 'var(--z-overlay)',     // 30
  modal: 'var(--z-modal)',         // 40
  sidebar: 'var(--z-sidebar)',     // 50
  toast: 'var(--z-toast)',         // 60
  tooltip: 'var(--z-tooltip)',     // 70
} as const;

// Raw numeric values for use in JS (e.g. portal z-index)
export const zIndexValues = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  sidebar: 50,
  toast: 60,
  tooltip: 70,
} as const;

// ─── Tone Utilities ────────────────────────────────────────────

/**
 * Maps a semantic tone to Tailwind classes for background + text color.
 * Use in components that accept a `tone` prop.
 */
export const toneBgClasses: Record<SemanticTone, string> = {
  brand: 'bg-brand-soft text-brand',
  destructive: 'bg-destructive-soft text-destructive',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-info-soft text-info',
  neutral: 'bg-muted text-muted-foreground',
};

/**
 * Maps a semantic tone to Tailwind classes for solid background + foreground.
 */
export const toneSolidClasses: Record<SemanticTone, string> = {
  brand: 'bg-brand text-brand-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  info: 'bg-info text-info-foreground',
  neutral: 'bg-muted text-muted-foreground',
};
