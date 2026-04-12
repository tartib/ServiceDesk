# Component Catalog

All shared UI components live in `components/ui/`. They follow consistent patterns:

- Built with Radix UI primitives where applicable
- Styled via `class-variance-authority` (CVA) for variant management
- Accept `className` prop for composition
- Use `data-slot` attributes for debugging
- Use `cn()` utility for class merging

## Button

**File:** `components/ui/button.tsx`

**Variants:** `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`, `brandOutline`
**Sizes:** `default`, `sm`, `lg`, `icon`, `icon-sm`, `icon-lg`

The `default` variant uses the brand CTA pattern: `bg-brand text-brand-foreground hover:bg-brand-strong`.
The `brandOutline` variant provides a lighter branded outline: `border-brand-border text-brand hover:bg-brand-soft`.

```tsx
<Button>Create Project</Button>                          {/* Brand CTA */}
<Button variant="brandOutline">View Details</Button>    {/* Brand outline */}
<Button variant="destructive" size="sm">Delete</Button>
<Button variant="outline" size="icon"><Plus /></Button>
```

## Badge

**File:** `components/ui/badge.tsx`

**Variants:** `default`, `secondary`, `destructive`, `outline`
**Tones:** `brand`, `destructive`, `success`, `warning`, `info`, `neutral`

When `tone` is set, it overrides the variant's color with a soft tinted style.

```tsx
<Badge tone="success">Active</Badge>
<Badge tone="info">In Review</Badge>
<Badge variant="outline">Draft</Badge>
```

## StatusBadge

**File:** `components/ui/status-badge.tsx`

**Variants:** `success`, `warning`, `danger`, `info`, `neutral`, `brand`, `outline`

```tsx
<StatusBadge variant="success">Resolved</StatusBadge>
<StatusBadge variant="danger">Critical</StatusBadge>
```

## PriorityBadge

**File:** `components/ui/priority-badge.tsx`

**Priority:** `critical`, `high`, `medium`, `low`, `trivial`

```tsx
<PriorityBadge priority="critical">P1</PriorityBadge>
```

## StatsCard

**File:** `components/ui/stats-card.tsx`

**Props:**

| Prop | Type | Description |
|---|---|---|
| `label` | `string` | Card title |
| `value` | `string \| number` | Primary value |
| `icon` | `LucideIcon` | Optional icon |
| `tone` | `StatsCardTone` | Icon background color |
| `trend` | `"up" \| "down" \| "neutral"` | Trend indicator |
| `trendLabel` | `string` | Trend description (e.g., "+12%") |
| `description` | `string` | Footer text |

```tsx
<StatsCard
  label="Active Incidents"
  value={42}
  icon={AlertTriangle}
  tone="destructive"
  trend="down"
  trendLabel="-8%"
/>
```

## EmptyState

**File:** `components/ui/empty-state.tsx`

**Props:**

| Prop | Type | Description |
|---|---|---|
| `icon` | `LucideIcon` | Illustration icon |
| `title` | `string` | Heading |
| `description` | `string` | Body text |
| `action` | `ReactNode` | CTA button |
| `variant` | `"default" \| "compact"` | Size variant |
| `tone` | `EmptyStateTone` | Icon color tone |

```tsx
<EmptyState
  icon={Inbox}
  title="No tickets"
  description="Create your first ticket to get started."
  variant="compact"
  tone="brand"
  action={<Button>Create Ticket</Button>}
/>
```

## Other Core Components

| Component | File | Notes |
|---|---|---|
| Card | `card.tsx` | Base container with header/content/footer |
| Dialog | `dialog.tsx` | Modal dialog (Radix) |
| Dropdown Menu | `dropdown-menu.tsx` | Context/action menus (Radix) |
| Input | `input.tsx` | Text input with focus ring |
| Label | `label.tsx` | Form label |
| Select | `select.tsx` | Select dropdown (Radix) |
| Separator | `separator.tsx` | Horizontal/vertical divider |
| Sheet | `sheet.tsx` | Slide-out panel |
| Sidebar | `sidebar.tsx` | App navigation sidebar |
| Skeleton | `skeleton.tsx` | Loading placeholder |
| Table | `table.tsx` | Data table |
| Tabs | `tabs.tsx` | Tabbed interface (Radix) |
| Textarea | `textarea.tsx` | Multi-line text input |
| Toast | `sonner.tsx` | Toast notifications (Sonner) |
| Tooltip | `tooltip.tsx` | Hover tooltips (Radix) |
