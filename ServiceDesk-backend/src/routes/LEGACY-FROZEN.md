# Legacy Routes — Frozen

This directory is **frozen** as of 2026-03-20.

## Allowed Changes

- Bug fixes
- Security patches
- Compatibility fixes for existing consumers

## Forbidden

- New route files
- New endpoints in existing files
- New business logic

## Where to Put New Code

All new routes must be implemented in `src/modules/*/routes/`.

See [Architecture Policy](../../../docs/architecture/architecture-policy.md) for details.

## Sunset

Legacy v1 routes are gated by feature flags and emit `Sunset: Mon, 01 Sep 2026` headers.
See `src/routes/index.ts` for the feature flag mapping.
