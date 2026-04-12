# Theming

ServiceDesk uses CSS custom properties for theming, with Tailwind v4's `@theme inline` block bridging tokens to utility classes.

## How it works

1. **CSS custom properties** are defined in `:root` (light) and `.dark` (dark) blocks in `globals.css`
2. **`@theme inline`** registers these as Tailwind theme values (e.g., `--color-brand: var(--brand)`)
3. **Components** use Tailwind classes like `bg-brand` which resolve through the chain

```
bg-brand → --color-brand → var(--brand) → oklch(0.546 0.245 262.881)
                                    (dark) → oklch(0.623 0.214 259.815)
```

## Dark mode

Dark mode is activated by adding the `dark` class to the root `<html>` element. The app uses `next-themes` to manage this.

All semantic tokens automatically adapt. Soft tone variants (`-soft`) are defined in both `:root` and `.dark` and adapt automatically.

### Custom dark variant

The `@custom-variant dark` directive is defined in `globals.css`:

```css
@custom-variant dark (&:is(.dark *));
```

Use `dark:` prefix for dark-specific overrides:

```tsx
<div className="bg-brand-soft text-brand" />
```

> With `-soft` tokens, explicit `dark:` overrides are no longer needed for tinted backgrounds.

## RTL support

RTL is handled via custom variants:

```css
@custom-variant rtl (&:is([dir="rtl"] *));
@custom-variant ltr (&:is([dir="ltr"] *));
```

Usage:

```tsx
<div className="ltr:ml-4 rtl:mr-4" />
```

## Adding a new theme color

1. Add the CSS variable to both `:root` and `.dark` in `globals.css`
2. Register it in the `@theme inline` block as `--color-{name}: var(--{name})`
3. Add the TypeScript constant in `lib/design-system/tokens.ts`
4. Add a `-soft` variant for tinted backgrounds in both `:root` and `.dark`

Example:

```css
/* globals.css - :root */
--rose: oklch(0.645 0.211 348.0);
--rose-soft: oklch(0.958 0.027 348.0);
--rose-foreground: oklch(0.985 0 0);

/* globals.css - .dark */
--rose: oklch(0.75 0.18 348.0);
--rose-soft: oklch(0.25 0.05 348.0);
--rose-foreground: oklch(0.985 0 0);

/* globals.css - @theme inline */
--color-rose: var(--rose);
--color-rose-soft: var(--rose-soft);
--color-rose-foreground: var(--rose-foreground);
```

## Tone system

Components like `Badge`, `StatusBadge`, `StatsCard`, and `EmptyState` accept a `tone` prop restricted to the **6 semantic tones**. This ensures consistent coloring without manual class composition.

Available tones: `brand`, `destructive`, `success`, `warning`, `info`, `neutral`.

Shade model per tone: `base` (solid), `soft` (tinted background), `foreground` (text on solid).

### Brand depth

The `brand` tone has additional depth tokens beyond the standard shade model:

| Token | Class | Purpose |
|-------|-------|---------|
| `brand-strong` | `bg-brand-strong` | CTA hover/pressed, selected+focused |
| `brand-surface` | `bg-brand-surface` | Hero sections, selected cards, highlighted panels |
| `brand-border` | `border-brand-border` | Focus rings, selected outlines, active borders |

These are **not** available for other tones. They exist because brand is the only identity-carrying tone.

> **Decorative tones removed.** See `MIGRATION.md` for the mapping from old decorative tones.
