# Accessibility

ServiceDesk targets WCAG 2.1 AA compliance.

## Color contrast

- All text on semantic backgrounds meets 4.5:1 contrast ratio (AA)
- Large text (18px+) meets 3:1 contrast ratio
- Interactive elements have visible focus indicators
- Never rely on color alone to convey information — pair with icons, text, or patterns

## Focus management

All interactive elements use a consistent focus ring:

```
focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
```

This provides a visible 3px ring on keyboard focus without affecting mouse interaction.

## Reduced motion

The design system respects `prefers-reduced-motion: reduce`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

This is defined in `globals.css` and applies globally.

## Keyboard navigation

- All interactive elements are reachable via Tab
- Dialogs trap focus
- Dropdown menus support arrow key navigation (via Radix)
- Escape closes modals/dropdowns/sheets

## Screen readers

- Use semantic HTML (`button`, `nav`, `main`, `section`, `h1`-`h6`)
- All images have `alt` text
- Form inputs have associated `<Label>` elements
- Status changes use `aria-live` regions where appropriate
- Icon-only buttons have `aria-label`

## Component-specific rules

### Buttons

- Never use `<div>` as a button — use `<Button>` or `<button>`
- Icon-only buttons must have `aria-label`

```tsx
<Button variant="ghost" size="icon" aria-label="Close">
  <X />
</Button>
```

### Badges

- Status badges should be accompanied by text, not color-only
- Use `aria-label` if the badge contains an abbreviation

### Forms

- Every input needs a `<Label>`
- Error messages should be linked via `aria-describedby`
- Required fields should use `aria-required="true"`

### Modals

- Focus is trapped inside the modal (handled by Radix Dialog)
- Pressing Escape closes the modal
- Body scroll is locked when modal is open

### Tables

- Use proper `<thead>`, `<tbody>`, `<th>` structure
- Sortable columns should indicate sort direction via `aria-sort`

## Testing

- Test with keyboard-only navigation
- Test with screen reader (VoiceOver on macOS)
- Verify color contrast with browser DevTools
- Check reduced motion behavior
