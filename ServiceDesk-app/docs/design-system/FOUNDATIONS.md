# Foundations

Design primitives that power every component and page in ServiceDesk.

## Color

### Semantic Colors

Core colors that adapt to light/dark themes automatically via CSS custom properties in `globals.css`.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `background` | white | near-black | Page background |
| `foreground` | near-black | near-white | Primary text |
| `card` | white | dark gray | Card/panel backgrounds |
| `primary` | dark | light | Buttons, key actions |
| `brand` | blue-purple | lighter blue-purple | Product identity, CTAs, emphasis |
| `secondary` | light gray | dark gray | Secondary actions |
| `muted` | light gray | dark gray | Subdued backgrounds |
| `muted-foreground` | mid gray | lighter gray | Secondary text |
| `destructive` | red | lighter red | Errors, deletions |
| `success` | green | lighter green | Success states |
| `warning` | amber | lighter amber | Warnings |
| `info` | sky-blue | lighter sky-blue | Informational status only |

### Surface Colors

Elevation-based backgrounds:

| Token | Usage |
|-------|-------|
| `surface-default` | Base level |
| `surface-raised` | Cards, panels |
| `surface-sunken` | Inset areas |
| `surface-overlay` | Modal/dialog backdrops |

### Brand System

Beyond the base `brand` color, dedicated tokens provide depth for product identity:

| Token | Usage |
|-------|-------|
| `brand` | Standard branded actions and emphasis |
| `brand-strong` | CTA hover/pressed, selected+focused states |
| `brand-soft` | Icon chips, soft badges, helper emphasis |
| `brand-surface` | Hero sections, selected cards, highlighted panels |
| `brand-border` | Focus rings, selected outlines, active borders |
| `brand-foreground` | Readable text on solid brand backgrounds |

> **Rule:** Brand tokens are for identity and emphasis, not status communication. Do not use brand tokens for success/warning/error/info states.

### Soft Tones

Each semantic color has a `-soft` variant for tinted backgrounds that auto-adapts to dark mode.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `brand-soft` | pale blue-purple | deep blue-purple | Tinted brand backgrounds |
| `success-soft` | pale green | deep green | Tinted success backgrounds |
| `warning-soft` | pale amber | deep amber | Tinted warning backgrounds |
| `destructive-soft` | pale red | deep red | Tinted error backgrounds |
| `info-soft` | pale sky-blue | deep sky-blue | Tinted info backgrounds |

Usage in Tailwind (shade model: `base`, `soft`, `foreground`):

```tsx
<div className="bg-success text-success-foreground" />   // Solid
<div className="bg-success-soft text-success" />          // Tinted (auto dark mode)
```

> **Note:** Decorative tones (purple, orange, teal, indigo, pink, amber, emerald, cyan, slate) have been removed. Use the 6 semantic tones instead. See `docs/design-system/MIGRATION.md` for the mapping table.

## Typography

Uses the system's Geist Sans/Mono fonts. Tokens defined as CSS custom properties:

| Token | Value | Usage |
|-------|-------|-------|
| `--font-size-xs` | 0.75rem (12px) | Captions, labels |
| `--font-size-sm` | 0.875rem (14px) | Body small, badges |
| `--font-size-base` | 1rem (16px) | Body text |
| `--font-size-lg` | 1.125rem (18px) | Section headers |
| `--font-size-xl` | 1.25rem (20px) | Page sub-headers |
| `--font-size-2xl` | 1.5rem (24px) | Page headers |
| `--font-size-3xl` | 1.875rem (30px) | Hero text |
| `--font-size-4xl` | 2.25rem (36px) | Display text |

### Font Weights

- `normal` (400) — Body text
- `medium` (500) — Labels, navigation
- `semibold` (600) — Sub-headers, emphasis
- `bold` (700) — Headers, stats

## Spacing

Uses Tailwind's default 4px grid system. No custom tokens needed.

Common spacing scale: `1` (4px), `2` (8px), `3` (12px), `4` (16px), `5` (20px), `6` (24px), `8` (32px), `10` (40px), `12` (48px).

## Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | radius - 4px | Small elements, chips |
| `--radius-md` | radius - 2px | Inputs, dropdowns |
| `--radius-lg` | radius (0.625rem) | Cards, panels |
| `--radius-xl` | radius + 4px | Large containers |
| `--radius-full` | 9999px | Avatars, badges |

## Shadow

Semantic shadows with dark mode variants (higher opacity for visibility):

| Token | Usage |
|-------|-------|
| `shadow-xs` | Subtle elevation (inputs) |
| `shadow-sm` | Low elevation (cards at rest) |
| `shadow-md` | Medium elevation (dropdowns, popovers) |
| `shadow-lg` | High elevation (dialogs, panels) |
| `shadow-xl` | Highest elevation (toasts, tooltips) |

## Motion

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | 100ms | Hover states, micro-interactions |
| `--duration-normal` | 200ms | Standard transitions |
| `--duration-slow` | 300ms | Complex animations, page transitions |
| `--ease-default` | cubic-bezier(0.4, 0, 0.2, 1) | General easing |
| `--ease-in-out` | cubic-bezier(0.4, 0, 0.2, 1) | Symmetric easing |

All animations respect `prefers-reduced-motion: reduce`.

## Z-index Layer System

Strict semantic layers — never use arbitrary `z-[N]` values.

| Token | Value | Usage |
|-------|-------|-------|
| `z-base` | 0 | Default stacking |
| `z-dropdown` | 10 | Dropdowns, select menus |
| `z-sticky` | 20 | Sticky headers, columns |
| `z-overlay` | 30 | Overlay backdrops |
| `z-modal` | 40 | Dialogs, modals |
| `z-sidebar` | 50 | Sidebar, navigation panels |
| `z-toast` | 60 | Toast notifications |
| `z-tooltip` | 70 | Tooltips |
