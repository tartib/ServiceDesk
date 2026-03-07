# Core Layer — Ownership Boundaries

> **⚠️ This directory is being decomposed.** New code should NOT be added here.
> Instead, add code to the appropriate module under `src/modules/`.

## Ownership Map

| Directory | Owner Module | Status |
|---|---|---|
| `entities/Incident.ts` | `modules/itsm` | Re-exported via `modules/itsm/core-re-exports` |
| `entities/Problem.ts` | `modules/itsm` | Re-exported via `modules/itsm/core-re-exports` |
| `entities/Change.ts` | `modules/itsm` | Re-exported via `modules/itsm/core-re-exports` |
| `entities/Release.ts` | `modules/itsm` | Re-exported via `modules/itsm/core-re-exports` |
| `entities/SLA.ts` | `modules/itsm` | Re-exported via `modules/itsm/core-re-exports` |
| `entities/ServiceCatalog.ts` | `modules/itsm` | Re-exported via `modules/itsm/core-re-exports` |
| `entities/ServiceRequest.ts` | `modules/itsm` | Re-exported via `modules/itsm/core-re-exports` |
| `entities/Site.ts` | `shared` (platform) | Re-exported via `modules/itsm/core-re-exports` |
| `entities/Category.ts` | `shared` (platform) | Re-exported via `modules/itsm/core-re-exports` |
| `entities/User.ts` | `shared` (platform) | Re-exported via `modules/itsm/core-re-exports` |
| `entities/FormTemplate.ts` | `modules/forms` | Re-exported via `modules/forms/core-re-exports` |
| `entities/FormSubmission.ts` | `modules/forms` | Re-exported via `modules/forms/core-re-exports` |
| `entities/Counter.ts` | `shared` (platform) | Stays here |
| `services/*` | `modules/itsm` | Re-exported via `modules/itsm/core-re-exports` |
| `repositories/*` | `modules/itsm` | Re-exported via `modules/itsm/core-re-exports` |
| `engines/*` | `shared` (cross-cutting) | Re-exported via `shared/engines` |
| `auth/*` | `shared` (cross-cutting) | Re-exported via `shared/auth` |
| `types/itsm.types.ts` | `modules/itsm` | Re-exported via `modules/itsm/core-re-exports` |
| `types/smart-forms.types.ts` | `modules/forms` | Re-exported via `modules/forms/core-re-exports` |
| `types/workflow-engine.types.ts` | `modules/workflow-engine` | Already in module domain |

## Migration Path

1. New consumers should import from `modules/<owner>/core-re-exports` instead of `core/`.
2. Existing imports from `core/` continue to work via the original barrel exports.
3. Once all consumers are migrated, the physical files can be moved.
