# Design System Governance

## Ownership

The design system is maintained by the frontend team. Changes require review from at least one design system maintainer.

## Change process

### Adding a new token

1. Open a PR with changes to `globals.css` and `tokens.ts`
2. Include rationale in PR description
3. Update relevant documentation (TOKENS.md, FOUNDATIONS.md)
4. Get approval from a design system maintainer

### Adding a new component

1. Follow the template in CONTRIBUTING.md
2. Include usage examples
3. Add to COMPONENTS.md and INVENTORY.md
4. Ensure a11y compliance (keyboard nav, focus ring, contrast)
5. Test in light/dark/RTL modes

### Modifying an existing component

1. Must be backward compatible (no breaking changes to props)
2. New variants/props added additively
3. Update documentation

## Review guidelines

### Must-have for approval

- Uses semantic tokens (no raw color scales like `bg-blue-600`)
- Works in both light and dark modes
- Keyboard accessible
- No arbitrary z-index values (use `z-*` tokens)
- No hardcoded colors outside globals.css

### Nice-to-have

- RTL-tested
- Reduced motion tested
- TypeScript types exported
- Storybook story (future)

## Versioning

The design system follows semver within the monorepo:

- **Patch:** Bug fixes, documentation updates
- **Minor:** New tokens, new components, new variants
- **Major:** Breaking changes to component APIs or token names

Changes are tracked via git history and the INVENTORY.md file.

## Enforcement

### Automated

- **ESLint plugin** (`eslint-plugin-servicedesk-ds`) enforces:
  - `no-raw-colors`: Flags raw Tailwind color scales in app/components code
  - `no-arbitrary-z`: Flags `z-[N]` arbitrary z-index values
  - `no-decorative-tones`: Flags deprecated decorative token classes (e.g., `bg-purple`, `text-emerald`)
- **CI pipeline** runs lint checks on every PR

### Brand system rules

- **Brand tokens are for identity only.** Do not use `brand-surface`, `brand-strong`, or `brand-border` to communicate success/warning/error/info status.
- **Status tokens are for status only.** Do not use `success`, `warning`, `destructive`, or `info` for CTA buttons, navigation active states, or hero sections.
- **Prefer brand tokens over opacity hacks.** Use `bg-brand-surface` instead of `bg-brand/10`, and `hover:bg-brand-strong` instead of `hover:bg-brand/90`.

### Manual

- PR review checks the governance checklist (including brand vs status separation)
- Quarterly audit of INVENTORY.md to track coverage

## Exceptions

If a raw color or arbitrary value is truly needed (e.g., third-party library integration):

1. Add an `// eslint-disable-next-line` comment
2. Include a comment explaining why
3. Track in a "Technical Debt" section of INVENTORY.md
