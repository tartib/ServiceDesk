# Token Reference

Complete reference for all design tokens. Source of truth: `lib/design-system/tokens.ts` + `app/globals.css`.

## Color Tokens

### Semantic Colors

| CSS Variable | Tailwind Class | Light Value | Dark Value |
|---|---|---|---|
| `--background` | `bg-background` | `oklch(1 0 0)` | `oklch(0.145 0 0)` |
| `--foreground` | `text-foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `--primary` | `bg-primary` | `oklch(0.205 0 0)` | `oklch(0.922 0 0)` |
| `--brand` | `bg-brand` | `oklch(0.58 0.19 262)` | `oklch(0.68 0.17 262)` |
| `--destructive` | `bg-destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` |
| `--success` | `bg-success` | `oklch(0.517 0.174 142.495)` | `oklch(0.696 0.17 162.48)` |
| `--warning` | `bg-warning` | `oklch(0.681 0.162 75.834)` | `oklch(0.769 0.188 70.08)` |
| `--info` | `bg-info` | `oklch(0.55 0.20 235)` | `oklch(0.62 0.18 235)` |
| `--muted` | `bg-muted` | `oklch(0.97 0 0)` | `oklch(0.269 0 0)` |
| `--border` | `border-border` | `oklch(0.922 0 0)` | `oklch(1 0 0 / 10%)` |
| `--ring` | `ring-ring` | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` |

### Brand System

Brand tokens provide product identity beyond the base `--brand` color. Use for emphasis, CTAs, and selected states — **not** for status communication.

| CSS Variable | Tailwind Class | Light Value | Dark Value | Usage |
|---|---|---|---|---|
| `--brand` | `bg-brand` | `oklch(0.58 0.19 262)` | `oklch(0.68 0.17 262)` | Standard branded actions, emphasis |
| `--brand-strong` | `bg-brand-strong` | `oklch(0.50 0.22 262)` | `oklch(0.74 0.19 262)` | CTA hover/pressed, selected+focused |
| `--brand-soft` | `bg-brand-soft` | `oklch(0.95 0.03 262)` | `oklch(0.26 0.05 262)` | Icon chips, soft badges, helper emphasis |
| `--brand-surface` | `bg-brand-surface` | `oklch(0.98 0.015 262)` | `oklch(0.22 0.03 262)` | Hero sections, selected cards, highlighted panels |
| `--brand-border` | `bg-brand-border` | `oklch(0.84 0.08 262)` | `oklch(0.45 0.09 262)` | Focus rings, selected outlines, active borders |
| `--brand-foreground` | `text-brand-foreground` | `oklch(0.985 0 0)` | `oklch(0.985 0 0)` | Text on solid brand backgrounds |

### Surface Colors

| CSS Variable | Tailwind Class | Light | Dark |
|---|---|---|---|
| `--surface-default` | `bg-surface-default` | white | near-black |
| `--surface-raised` | `bg-surface-raised` | white | dark gray |
| `--surface-sunken` | `bg-surface-sunken` | light gray | darker |
| `--surface-overlay` | `bg-surface-overlay` | black/50% | black/70% |

### Soft Tones (tinted backgrounds)

| CSS Variable | Tailwind Class | Light Value | Dark Value |
|---|---|---|---|
| `--brand-soft` | `bg-brand-soft` | `oklch(0.95 0.03 262)` | `oklch(0.26 0.05 262)` |
| `--success-soft` | `bg-success-soft` | `oklch(0.951 0.029 142.495)` | `oklch(0.25 0.05 142.495)` |
| `--warning-soft` | `bg-warning-soft` | `oklch(0.962 0.043 75.834)` | `oklch(0.27 0.06 75.834)` |
| `--destructive-soft` | `bg-destructive-soft` | `oklch(0.958 0.027 27.325)` | `oklch(0.25 0.05 27.325)` |
| `--info-soft` | `bg-info-soft` | `oklch(0.95 0.03 235)` | `oklch(0.25 0.06 235)` |

> **Removed:** The decorative palette (purple, orange, teal, indigo, pink, amber, emerald, cyan, slate) has been fully removed. See `MIGRATION.md` for the mapping.

## Typography Tokens

| Token | CSS Variable | Value |
|---|---|---|
| Font size xs | `--font-size-xs` | 0.75rem |
| Font size sm | `--font-size-sm` | 0.875rem |
| Font size base | `--font-size-base` | 1rem |
| Font size lg | `--font-size-lg` | 1.125rem |
| Font size xl | `--font-size-xl` | 1.25rem |
| Font size 2xl | `--font-size-2xl` | 1.5rem |
| Font size 3xl | `--font-size-3xl` | 1.875rem |
| Font size 4xl | `--font-size-4xl` | 2.25rem |
| Weight normal | `--font-weight-normal` | 400 |
| Weight medium | `--font-weight-medium` | 500 |
| Weight semibold | `--font-weight-semibold` | 600 |
| Weight bold | `--font-weight-bold` | 700 |
| Line height tight | `--line-height-tight` | 1.25 |
| Line height normal | `--line-height-normal` | 1.5 |
| Line height relaxed | `--line-height-relaxed` | 1.75 |

## Shadow Tokens

| Token | CSS Variable | Value |
|---|---|---|
| xs | `--shadow-xs` | `0 1px 2px 0 oklch(0 0 0 / 3%)` |
| sm | `--shadow-sm` | `0 1px 3px ...` |
| md | `--shadow-md` | `0 4px 6px ...` |
| lg | `--shadow-lg` | `0 10px 15px ...` |
| xl | `--shadow-xl` | `0 20px 25px ...` |

## Motion Tokens

| Token | CSS Variable | Value |
|---|---|---|
| Fast | `--duration-fast` | 100ms |
| Normal | `--duration-normal` | 200ms |
| Slow | `--duration-slow` | 300ms |
| Default ease | `--ease-default` | cubic-bezier(0.4, 0, 0.2, 1) |

## Z-index Tokens

| Token | CSS Variable | Value |
|---|---|---|
| Base | `--z-base` | 0 |
| Dropdown | `--z-dropdown` | 10 |
| Sticky | `--z-sticky` | 20 |
| Overlay | `--z-overlay` | 30 |
| Modal | `--z-modal` | 40 |
| Sidebar | `--z-sidebar` | 50 |
| Toast | `--z-toast` | 60 |
| Tooltip | `--z-tooltip` | 70 |

## Radius Tokens

| Token | CSS Variable | Value |
|---|---|---|
| sm | `--radius-sm` | calc(var(--radius) - 4px) |
| md | `--radius-md` | calc(var(--radius) - 2px) |
| lg | `--radius-lg` | var(--radius) = 0.625rem |
| xl | `--radius-xl` | calc(var(--radius) + 4px) |
| full | `--radius-full` | 9999px |
