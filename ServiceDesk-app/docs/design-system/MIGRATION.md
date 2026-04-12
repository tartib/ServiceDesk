# Migration Guide

Notes on migrating from raw Tailwind color scales to semantic design tokens.

## What changed

Previously, components used raw Tailwind color classes like `bg-purple-600`, `text-green-500`, `border-red-200`. These have been replaced with semantic tokens that:

- Adapt to dark mode automatically
- Use consistent oklch color values
- Follow a predictable naming pattern
- Are enforced by linting

## Color mapping

### Raw scale to semantic token

| Before | After | Notes |
|---|---|---|
| `bg-purple-50/100` | `bg-info-soft` | Light tint |
| `bg-purple-500/600/700` | `bg-info` | Base color |
| `text-purple-500/600/700` | `text-info` | Text on light bg |
| `bg-blue-500/600` | `bg-brand` | Primary brand |
| `bg-red-500/600` | `bg-destructive` | Errors, deletions |
| `bg-green-500/600` | `bg-success` | Success states |
| `bg-yellow-500` | `bg-warning` | Warnings |
| `bg-gray-100/200` | `bg-muted` | Subdued backgrounds |
| `text-gray-500/600` | `text-muted-foreground` | Secondary text |
| `text-gray-800/900` | `text-foreground` | Primary text |
| `border-gray-200/300` | `border-border` | Default borders |

### Status/Priority helpers

Helper functions in `types/itsm.ts`, `lib/utils.ts`, and `hooks/useServiceRequests.ts` now return semantic classes:

| Before | After |
|---|---|
| `bg-red-600 text-white` | `bg-destructive text-destructive-foreground` |
| `bg-green-500 text-white` | `bg-success text-success-foreground` |
| `bg-gray-100 text-gray-800` | `bg-muted text-foreground` |

### Decorative tones → Semantic tones (v2 migration)

All decorative palette colors have been **removed**. Use the 6 semantic tones:

| Decorative (removed) | Semantic replacement | Rationale |
|---|---|---|
| `purple`, `indigo`, `cyan` | `info` | Informational accent |
| `orange`, `amber` | `warning` | Warning / attention |
| `emerald`, `teal` | `success` | Positive / complete |
| `pink` | `destructive` | Error / danger accent |
| `slate` | `neutral` (use `muted`) | Neutral / disabled |

### Shade model change

| Old pattern | New pattern |
|---|---|
| `bg-purple-light text-purple` | `bg-info-soft text-info` |
| `bg-purple/10 text-purple dark:bg-purple/20` | `bg-info-soft text-info` |
| `bg-purple text-purple-foreground` | `bg-info text-info-foreground` |

### Component tone prop

| Before | After |
|---|---|
| `tone="purple"` | `tone="info"` |
| `tone="orange"` | `tone="warning"` |
| `tone="emerald"` | `tone="success"` |
| `tone="muted"` | `tone="neutral"` |
| `variant="purple"` | `variant="info"` |

## What to do if you find deprecated colors

1. Check the mapping table above
2. Use the closest semantic tone
3. If no mapping exists, check if a new token is needed (see CONTRIBUTING.md)
4. The ESLint plugin `no-raw-colors` and `no-decorative-tones` will flag violations
5. Run `scripts/normalize-semantic-tones.sh` for bulk migration

## Brand system migration

The following brand-opacity patterns have been replaced with dedicated tokens:

| Old Pattern | New Pattern | Reason |
|-------------|-------------|--------|
| `bg-brand/10` | `bg-brand-surface` | Dedicated subtle brand background |
| `bg-brand/15` | `bg-brand-soft` | Dedicated tinted brand chip |
| `hover:bg-brand/90` | `hover:bg-brand-strong` | Dedicated hover/pressed state |
| `hover:border-brand/60` | `hover:border-brand-border` | Dedicated active border |
| `bg-primary text-primary-foreground` (Button) | `bg-brand text-brand-foreground` | Brand CTA identity |

### Info hue shift

`--info` was shifted from hue 262 (blue-purple, same as brand) to hue 235 (sky-blue) to prevent visual confusion between product identity and informational status.

## Files not migrated

- `components/ui/*.tsx` — Shadcn core components left as-is (upstream maintained)
- `tests/` — E2E test files may contain raw colors in selectors (these don't affect the UI)
