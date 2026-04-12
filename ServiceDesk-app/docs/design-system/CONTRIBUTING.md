# Contributing to the Design System

## Adding a new component

1. Create file in `components/ui/{component-name}.tsx`
2. Use CVA for variant management if the component has variants
3. Accept `className` prop and merge with `cn()`
4. Add `data-slot` attribute for debugging
5. Export both the component and its variants
6. Update `COMPONENTS.md` with usage examples

### Template

```tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const myComponentVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "...",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function MyComponent({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof myComponentVariants>) {
  return (
    <div
      data-slot="my-component"
      className={cn(myComponentVariants({ variant }), className)}
      {...props}
    />
  )
}

export { MyComponent, myComponentVariants }
```

### Brand vs Status tokens

> **Brand tokens** (`brand`, `brand-strong`, `brand-soft`, `brand-surface`, `brand-border`) are for product identity: CTAs, emphasis, selection, and navigation active states. **Never** use them for status communication (success/warning/error/info). Conversely, **never** use status tokens for identity.

## Adding a new color token

1. Add CSS variables to `:root` and `.dark` in `globals.css`
2. Register in `@theme inline` block
3. Add TypeScript constant in `lib/design-system/tokens.ts`
4. Add to `SemanticTone` type and tone utility maps if adding a new semantic tone
5. Update `TOKENS.md`

## Modifying an existing component

1. Ensure backward compatibility — don't break existing prop signatures
2. Add new variants/props additively
3. Update documentation
4. Test in both light and dark modes
5. Test with RTL layout if applicable

## Code style

- Use `oklch()` for all color values (wide gamut, perceptually uniform)
- Use semantic token names, never raw Tailwind color scales (e.g., `bg-brand` not `bg-blue-600`)
- Use `cn()` for all className merging
- Follow existing naming conventions for variants and props

## Review checklist

- [ ] Uses semantic tokens (no raw color scales)
- [ ] Works in light and dark modes
- [ ] Keyboard accessible
- [ ] Has `data-slot` attribute
- [ ] Accepts and merges `className`
- [ ] Documented in COMPONENTS.md
- [ ] No new `z-[N]` arbitrary values (use z-index tokens)
