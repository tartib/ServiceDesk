# ServiceDesk Design System

A governed design system providing consistent, accessible, and theme-aware UI across the ServiceDesk application.

## Architecture

```
lib/design-system/
├── tokens.ts          # TypeScript token constants (single source of truth)
└── index.ts           # Barrel export

app/globals.css        # CSS custom properties (light + dark themes)

components/ui/         # Core shared components (35+)
components/{feature}/  # Feature-specific compositions
```

## Quick Start

### Using tokens in TypeScript
```ts
import { toneBgClasses, zIndexValues } from '@/lib/design-system';

const bg = toneBgClasses.brand; // "bg-brand-soft text-brand"
```

### Using tokens in CSS/Tailwind
```tsx
// Semantic colors (auto dark mode via CSS vars)
<div className="bg-brand text-brand-foreground" />

// Brand system (identity + emphasis, NOT status)
<Button>CTA</Button>                                    {/* bg-brand hover:bg-brand-strong */}
<div className="bg-brand-surface border-brand-border" /> {/* Selected card */}
<div className="bg-brand-soft text-brand" />             {/* Tinted chip */}

// Soft tones (auto dark mode)
<div className="bg-success-soft text-success" />

// Surface levels
<div className="bg-surface-raised" />
```

### Using component tone system
```tsx
<Badge tone="success">Active</Badge>
<StatsCard tone="brand" trend="up" trendLabel="+12%" label="Users" value={1234} />
<StatusBadge variant="info">In Review</StatusBadge>
```

## Key Documents

| Doc | Purpose |
|-----|---------|
| [FOUNDATIONS.md](./FOUNDATIONS.md) | Color, typography, spacing, radius, shadow, motion, z-index |
| [TOKENS.md](./TOKENS.md) | Full token reference table |
| [THEMES.md](./THEMES.md) | Theming system, adding themes, dark mode |
| [COMPONENTS.md](./COMPONENTS.md) | Component catalog with APIs and examples |
| [PATTERNS.md](./PATTERNS.md) | Standard UI patterns (forms, tables, panels) |
| [ACCESSIBILITY.md](./ACCESSIBILITY.md) | A11y standards and rules |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | How to add/modify components |
| [MIGRATION.md](./MIGRATION.md) | Migration notes from raw colors to tokens |
| [INVENTORY.md](./INVENTORY.md) | Current component inventory |
