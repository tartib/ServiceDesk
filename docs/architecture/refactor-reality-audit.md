# Forms / Records / Workflow Platform — Reality Audit

**Date:** 2026-06  
**Author:** Refactor engineering lead  
**Scope:** ADR 001 Phases 0–6 — reconcile documentation vs actual code state  
**Methodology:** Direct file inspection of all referenced paths

---

## How to Read This Document

Each row maps one checklist item to its documented status and actual state in the repo:

| Symbol | Meaning |
|---|---|
| ✅ Already implemented | Code exists and is correct |
| ⚠️ Implemented but not wired | Code exists, integration missing |
| 🔶 Partially implemented | Core exists, adoption incomplete |
| ❌ Missing | Code does not exist |
| 🗑️ Obsolete | Checklist item no longer applies |
| 📋 Stale checklist | Item marked Pending but actually done |

---

## Phase 1 — FormDefinitionBuilder (Canonical Form Shell)

| Checklist Item | Doc Status | Actual Code Status | Gap | Action |
|---|---|---|---|---|
| Create `lib/domains/forms/` domain barrel | ⬜ Pending | ✅ EXISTS — `index.ts` + `types.ts` + `keys.ts` + `api.ts` + `adapters.ts` + `records.ts` | 📋 Stale | Mark ✅ in checklist |
| `lib/domains/forms/types.ts` — `FormDefinition`, `FormRecord` aliases | ⬜ Pending | ✅ EXISTS — `FormDefinition = FormTemplate`, `FormRecord = FormSubmission` | 📋 Stale | Mark ✅ |
| `FormDefinitionBuilder.tsx` public shell | ⬜ Pending | ✅ EXISTS — `components/forms-platform/FormDefinitionBuilder.tsx` wraps `FieldPalette`, `FieldEditor`, `FormCanvas` correctly | 📋 Stale | Mark ✅ |
| `ServiceFormBuilder.tsx` → thin wrapper | ⬜ Pending | ✅ EXISTS — imports `FormDefinitionBuilder`, no direct builder internal imports | 📋 Stale | Mark ✅ |
| `platform-interfaces.ts` — `IFormDefinitionService`, type aliases | ⬜ Pending | ✅ EXISTS — `modules/forms/domain/platform-interfaces.ts` exports all aliases + `IFormDefinitionService` interface | 📋 Stale | Mark ✅ |
| Boundary Rule 6 — service-catalog cannot import `smart-forms/builder/*` | ✅ Done | ✅ ENFORCED — `check-boundaries.ts` Rule 6 `checkPlatformBoundaries()` | Correct | — |
| **NEW GAP:** `smart-forms/page.tsx` imports `FormBuilder` from `@/components/smart-forms/builder` | — | ⚠️ VIOLATION — outside service-catalog, not covered by Rule 6 | Boundary check blind spot | Migrate page (B1) + extend Rule 7 (B2) |
| **NEW GAP:** Boundary check scope — only `components/service-catalog/` checked | — | ⚠️ PARTIAL — `app/(dashboard)/**` pages not included in Rule 6 | Rule too narrow | Extend to all `app/(dashboard)` (B2) |

---

## Phase 2 — Record Domain (FormSubmission → RecordService)

| Checklist Item | Doc Status | Actual Code Status | Gap | Action |
|---|---|---|---|---|
| `record-interfaces.ts` — `RecordDetail`, `IRecordService` | ⬜ Pending | ✅ EXISTS — `modules/forms/domain/record-interfaces.ts` complete | 📋 Stale | Mark ✅ |
| `RecordService.ts` facade | ⬜ Pending | ✅ EXISTS — full facade with `toRecordDetail()` projection | 📋 Stale | Mark ✅ |
| `lib/domains/forms/records.ts` — frontend API + `RecordDetail` type | ⬜ Pending | ✅ EXISTS — `recordApi` with all endpoints, `normalizeRecord()` | 📋 Stale | Mark ✅ |
| `hooks/useRecords.ts` — React Query hooks | ⬜ Pending | ✅ EXISTS — `useRecords`, `useRecord`, `useMyRecords`, `usePendingApprovals`, `useCreateRecord`, `useApproveRecord`, `useRejectRecord`, `useCancelRecord`, `useAddRecordComment` | 📋 Stale | Mark ✅ |
| `/records/page.tsx` — list view using platform hooks | ⬜ Pending | ✅ EXISTS — uses `useRecords`, `useMyRecords`, `usePendingApprovals` from `hooks/useRecords` | 📋 Stale | Mark ✅ |
| `/records/[id]/page.tsx` — detail view | ⬜ Pending | ✅ EXISTS — uses `useRecord`, `useApproveRecord`, `useRejectRecord`, `useCancelRecord`, `useAddRecordComment` | 📋 Stale | Mark ✅ |
| `SubmissionsDashboard` uses Record framing | ⬜ Pending | ❌ MISSING — still uses `FormSubmission` type, "Submissions" copy throughout, no `records` prop alias | Adoption gap | Add `records` alias, update copy (C1) |
| `smart-forms/page.tsx` uses `useRecords` hooks | — | ❌ MISSING — still uses `useFormSubmissions`, `useCreateSubmission`, `useApproveSubmission`, `useRejectSubmission` from `useSmartForms` | Legacy hook usage | Migrate page (B1) |

---

## Phase 3 — Dual-Track Workflow Binding

| Checklist Item | Doc Status | Actual Code Status | Gap | Action |
|---|---|---|---|---|
| `workflow_definition_id` + `workflow_mode` on `IFormTemplate` | ⬜ Pending | ✅ EXISTS — in `core/types/smart-forms.types.ts` | 📋 Stale | Mark ✅ |
| `FormTemplate` schema patched | ⬜ Pending | ✅ EXISTS — Mongoose entity has both fields | 📋 Stale | Mark ✅ |
| `FormWorkflowBindingService` — bind/unbind/disable/getStatus | ⬜ Pending | ✅ EXISTS — complete service with all 5 methods | 📋 Stale | Mark ✅ |
| `WorkflowBindingPanel.tsx` — UI panel | ⬜ Pending | ✅ EXISTS — `components/forms-platform/WorkflowBindingPanel.tsx` with 3-mode UI | 📋 Stale | Mark ✅ |
| `FormWorkflowService` frozen (no new features) | ⬜ Pending | 🔶 PARTIAL — service exists but has NO freeze documentation/marker | Governance gap | Add `@deprecated` JSDoc (C2) |
| `WorkflowBindingPanel` integrated into `FormDefinitionBuilder` | — | ❌ MISSING — panel exists standalone but not wired as tab in builder | Adoption gap | Wire as optional tab (D2) |

---

## Phase 4 — Workflow Engine UPDATE_RECORD Action

| Checklist Item | Doc Status | Actual Code Status | Gap | Action |
|---|---|---|---|---|
| `WFActionType.UPDATE_RECORD` action type | ⬜ Pending | ✅ EXISTS — in `core/types/workflow-engine.types.ts` | 📋 Stale | Mark ✅ |
| `IWFEntityService` interface in `ActionExecutor` | ⬜ Pending | ✅ EXISTS — `IWFEntityService`, `IWFRecordService` interfaces in `ActionExecutor.ts` | 📋 Stale | Mark ✅ |
| `RecordServiceAdapter` — `IWFEntityService` for `form_record`/`form_submission` | ⬜ Pending | ✅ EXISTS — `modules/workflow-engine/adapters/RecordServiceAdapter.ts` fully implemented | 📋 Stale | Mark ✅ |
| `workflowEngineFactory` wires `recordService` | ⬜ Pending | ✅ EXISTS — factory passes `recordServiceAdapter` to engine | 📋 Stale | Mark ✅ |
| `TaskServiceAdapter` passes source record context | ⬜ Pending | ❌ MISSING — `IWFTaskService.createTask` context has `entityType`/`entityId` but does NOT persist them to task metadata | Adoption gap | Add sourceRecordId wiring (D1) |

---

## Phase 5 — Record Views (Platform UI Layer)

| Checklist Item | Doc Status | Actual Code Status | Gap | Action |
|---|---|---|---|---|
| `/records/page.tsx` exists | ⬜ Pending | ✅ EXISTS | 📋 Stale | Mark ✅ |
| `/records/[id]/page.tsx` exists | ⬜ Pending | ✅ EXISTS | 📋 Stale | Mark ✅ |
| `RecordTableView` shared component | ⬜ Pending | ❌ MISSING | Future phase | Defer to Sprint 3 |
| `RecordKanbanView` shared component | ⬜ Pending | ❌ MISSING | Future phase | Defer to Sprint 3 |
| Project-scoped `/projects/[projectId]/service-catalog/` uses platform hooks | — | 🔶 PARTIAL — fetches own data via raw `API_URL` fetch, does not use platform `recordApi` | Adoption gap | Sprint 3 |

---

## Phase 6 — Solution Stubs

| Checklist Item | Doc Status | Actual Code Status | Gap | Action |
|---|---|---|---|---|
| `solutions/service-catalog/types.ts` | ⬜ Pending | ✅ EXISTS — imports from `platform-interfaces`, correct boundaries | 📋 Stale | Mark ✅ |
| `solutions/service-catalog/index.ts` | ⬜ Pending | ✅ EXISTS | 📋 Stale | Mark ✅ |
| `solutions/itsm/types.ts` | ⬜ Pending | ✅ EXISTS — imports `IFormDefinition`, `IRecordService` | 📋 Stale | Mark ✅ |
| `solutions/itsm/index.ts` | ⬜ Pending | ✅ EXISTS | 📋 Stale | Mark ✅ |
| Solution stubs have factory/seam for injection | — | ❌ MISSING — stubs are type-only, no factory function for DI seam | Minor gap | Add ITSM stub factory (G2) |

---

## Newly Discovered Gaps (Not in Original Checklist)

These are issues found during code inspection not covered by the existing checklist:

| Gap | Location | Severity | Action |
|---|---|---|---|
| `useSLA.ts` (legacy) vs `useSlaV2.ts` (new module) — two parallel SLA hook systems | `hooks/useSLA.ts`, `hooks/useSlaV2.ts` | High | Deprecate old, migrate SLA page (F1) |
| Project-scoped `/sla/page.tsx` uses legacy `useSLA` | `app/(dashboard)/projects/[projectId]/sla/page.tsx` | High | Migrate to `useSlaV2` (F1) |
| `monthlyRatingJob.ts` and `monthlyRatingJobFixed.ts` both exist, neither wired | `src/jobs/` | Medium | Delete Fixed, wire canonical (F2) |
| `smart-forms/page.tsx` uses `useSmartForms` raw submission hooks instead of `useRecords` | `app/(dashboard)/smart-forms/page.tsx` | High | Migrate (B1) |
| `smart-forms/page.tsx` imports `FormBuilder` from internals | `app/(dashboard)/smart-forms/page.tsx` | High | Migrate to `FormDefinitionBuilder` (B1) |
| Standalone `/sla/page.tsx` uses `useSlaV2` but project `/sla/page.tsx` uses `useSLA` | two different pages | High | Standardize on `useSlaV2` (F1) |

---

## Boundary Check Coverage Map

| Rule | What it checks | Scope | Status |
|---|---|---|---|
| Rule 1 — Frozen dirs | No new files in `src/controllers/`, `src/routes/`, `src/services/`, `src/presentation/` | Backend | ✅ Active |
| Rule 2 — Cross-module imports | No module importing another module's internals | Backend | ✅ Active |
| Rule 3 — shared independence | `shared/` must not import from `modules/` | Backend | ✅ Active |
| Rule 4 — No v1 in modules | No `/api/v1/` string in module code | Backend | ✅ Active |
| Rule 5 — No manual validation | Controllers use middleware (warning only) | Backend | ✅ Active (warn) |
| Rule 6 — service-catalog builder boundary | `components/service-catalog/` cannot import `smart-forms/builder/` | Frontend | ✅ Active — but scope too narrow |
| **Rule 7 — App-wide builder boundary** | Any `app/(dashboard)/**` page cannot import `smart-forms/builder/` | Frontend | ❌ MISSING — to be added (B2) |

---

## Summary of Actions Required

| Phase | Action | Risk | Effort |
|---|---|---|---|
| B1 | Migrate `smart-forms/page.tsx` — replace builder + submission hooks | Low | 2–3h |
| B2 | Add boundary Rule 7 to `check-boundaries.ts` | Zero | 30m |
| C1 | `SubmissionsDashboard` — add `records` prop alias + update copy | Zero | 30m |
| C2 | Add `@deprecated` JSDoc to `FormWorkflowService` | Zero | 10m |
| C3 | Fix user-facing "Submission" strings in `/records/` pages | Zero | 20m |
| F1 | Deprecate `useSLA.ts`; migrate project SLA page to `useSlaV2` | Low | 1h |
| F2 | Delete `monthlyRatingJobFixed.ts`; wire `startMonthlyRatingJob` in `server.ts` | Low | 20m |
| D1 | `TaskServiceAdapter` — pass source record context | Low | 30m |
| D2 | `FormDefinitionBuilder` — wire `WorkflowBindingPanel` as optional tab | Low | 1h |
| E1 | Document project-scoped ITSM views (comments only) | Zero | 15m |
| E2 | Nav group comments | Zero | 10m |
| G1 | Service Catalog stub comment | Zero | 10m |
| G2 | ITSM stub factory seam | Zero | 20m |
| H1 | Contract tests | Low | 2h |
| H2 | `deprecations.md` | Zero | 30m |
