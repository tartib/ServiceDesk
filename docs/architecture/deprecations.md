# Deprecations Registry

Tracks frozen and deprecated code paths per ADR 001.
All new features must use the canonical replacements listed here.

---

## Backend

### `FormWorkflowService` (FROZEN)

| File | `src/modules/forms/services/FormWorkflowService.ts` |
|------|-----------------------------------------------------|
| Status | FROZEN — no new features |
| Reason | Handles inline/simple workflow only (step-based approval). The platform now uses `FormWorkflowBindingService` + `workflow-engine` module for advanced workflows (ADR 001, Phase 3). |
| Replace with | `FormWorkflowBindingService` → `src/modules/forms/services/FormWorkflowBindingService.ts` |

### `monthlyRatingJobFixed.ts` (DEAD DUPLICATE)

| File | `src/jobs/monthlyRatingJobFixed.ts` |
|------|--------------------------------------|
| Status | Dead duplicate of `monthlyRatingJob.ts` |
| Reason | Identical implementation. Canonical file is now wired via `taskScheduler.ts`. |
| Replace with | `src/jobs/monthlyRatingJob.ts` |
| Action | **Delete** this file in a follow-up cleanup commit. |

---

## Frontend

### `hooks/useSLA.ts` (LEGACY)

| File | `ServiceDesk-app/hooks/useSLA.ts` |
|------|-----------------------------------|
| Status | LEGACY — targets old `/api/v2/slas` endpoint (snake_case model) |
| Reason | The canonical SLA module is `useSlaV2` which targets `/api/v2/sla` (camelCase, richer model with goals, calendars, escalation rules). |
| Replace with | `hooks/useSlaV2.ts` |
| Known callers | ~~`app/(dashboard)/projects/[projectId]/sla/page.tsx`~~ (migrated) |
| Action | Migrate remaining ITSM SLA pages, then delete. |

### `components/smart-forms/builder/FormBuilder.tsx` (INTERNAL — DO NOT IMPORT DIRECTLY)

| File | `ServiceDesk-app/components/smart-forms/builder/FormBuilder.tsx` |
|------|------------------------------------------------------------------|
| Status | INTERNAL — access via platform shell only |
| Reason | ADR 001 Rule 6/7: `app/(dashboard)` pages and `components/service-catalog` must not import `smart-forms/builder` internals directly. |
| Replace with | `components/forms-platform/FormDefinitionBuilder.tsx` |
| Enforcement | `check-boundaries.ts` Rule 6 (service-catalog) + Rule 7 (all dashboard pages) |

---

## When to Update This File

Add an entry here whenever you:
- Freeze a service (no new features, only bug fixes)
- Mark a file as a dead duplicate
- Decide a hook/component should be migrated to a canonical replacement

Remove an entry only when the deprecated file is **deleted** from the codebase.
