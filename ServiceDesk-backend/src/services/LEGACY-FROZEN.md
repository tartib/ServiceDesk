# Legacy Services — Frozen

This directory is **frozen** as of 2026-03-20.

## Allowed Changes

- Bug fixes
- Security patches
- Compatibility fixes for existing consumers

## Forbidden

- New service files
- New business logic in existing files
- New domain operations

## Where to Put New Code

All new services must be implemented in `src/modules/*/services/`.

See [Architecture Policy](../../../docs/architecture/architecture-policy.md) for details.
