# UI Patterns

Standard patterns used throughout ServiceDesk.

## Dashboard stats row

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatsCard label="Open" value={12} icon={AlertCircle} tone="destructive" />
  <StatsCard label="In Progress" value={8} icon={Clock} tone="brand" />
  <StatsCard label="Resolved" value={45} icon={CheckCircle} tone="success" />
  <StatsCard label="Total" value={65} icon={BarChart} tone="neutral" />
</div>
```

## Status badge mapping

Use helper functions from `types/itsm.ts` or `hooks/useServiceRequests.ts`:

```tsx
import { getStatusColor, getPriorityColor } from '@/types/itsm';

<span className={getPriorityColor(priority)}>{priority}</span>
```

All helper functions return semantic token classes (e.g., `bg-destructive text-destructive-foreground`).

## Form layout

```tsx
<div className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="name">Name</Label>
    <Input id="name" placeholder="Enter name" />
  </div>
  <div className="space-y-2">
    <Label htmlFor="description">Description</Label>
    <Textarea id="description" />
  </div>
  <Button type="submit">Save</Button>
</div>
```

## Empty state in a table/list

```tsx
{items.length === 0 ? (
  <EmptyState
    icon={Inbox}
    title="No items found"
    description="Try adjusting your filters."
    variant="compact"
    tone="neutral"
  />
) : (
  <DataTable data={items} columns={columns} />
)}
```

## Card grid

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id} className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle>{item.name}</CardTitle>
      </CardHeader>
      <CardContent>...</CardContent>
    </Card>
  ))}
</div>
```

## Modal/dialog

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm</DialogTitle>
      <DialogDescription>Are you sure?</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button variant="destructive">Delete</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Surface elevation

Use surface tokens for visual hierarchy:

```tsx
<div className="bg-surface-sunken p-4 rounded-lg">
  <div className="bg-surface-raised p-4 rounded-lg shadow-sm">
    Elevated content
  </div>
</div>
```

## Branded patterns

### Branded CTA

```tsx
<Button>Create Project</Button>  {/* Uses brand CTA: bg-brand hover:bg-brand-strong */}
```

### Branded card / selected card

```tsx
<Card className="bg-brand-surface border-brand-border">
  <CardContent>Selected or highlighted content</CardContent>
</Card>
```

### Branded sidebar active state

```tsx
<div className={isActive ? 'bg-brand-surface text-brand font-medium ltr:border-l-2 rtl:border-r-2 border-brand' : 'text-sidebar-foreground'}>
  <Icon /> <span>Nav Item</span>
</div>
```

### Branded notification highlight

```tsx
<div className={!isRead ? 'bg-brand-surface' : ''}>
  Notification content
</div>
```

## Z-index usage

Always use semantic z-index tokens:

```tsx
<div className="z-dropdown">...</div>   {/* Menus */}
<div className="z-modal">...</div>       {/* Dialogs */}
<div className="z-toast">...</div>       {/* Notifications */}
```

Never use arbitrary `z-[50]` — use `z-sidebar` instead.
