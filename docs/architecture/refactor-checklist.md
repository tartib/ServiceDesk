# Platform Refactor — Progress Checklist

Tracks completion of the 8-phase Forms / Records / Workflow platform refactor.  
See ADR 001 and ownership-map.md for context.

Legend: ✅ Done | 🔄 In Progress | ⬜ Pending | ⚠️ Exists but not fully adopted

> **Audit note (2026-06):** See `docs/architecture/refactor-reality-audit.md` for full reconciliation. Many items marked ⬜ below are actually implemented — this file has been updated to reflect current state.

---

## Phase 0 — Baseline, Inventory & Architecture Guardrails

- ✅ ADR `docs/architecture/adrs/001-forms-records-workflow-platform.md`
- ✅ Ownership map `docs/architecture/ownership-map.md`
- ✅ This checklist `docs/architecture/refactor-checklist.md`
- ✅ PR template `.github/pull_request_template.md`
- ✅ Boundary check Rule 6 (no service-catalog importing smart-form builder internals)
- ✅ `quality-gate.sh` runs boundary check
- ✅ `docs/architecture/refactor-reality-audit.md` — full doc vs code reconciliation
- ⚠️ Rule 6 scope narrow: only `components/service-catalog/` checked; `app/(dashboard)/` pages excluded (see B2 gap)

---

## Phase 1 — Canonical Form-Definition Platform

- ✅ `lib/domains/forms/` created (keys.ts, api.ts, adapters.ts, types.ts, records.ts, index.ts)
- ✅ `components/forms-platform/FormDefinitionBuilder.tsx` public shell exists
- ✅ `ServiceFormBuilder` imports only from `forms-platform/`, not `smart-forms/builder/*`
- ✅ `modules/forms/domain/platform-interfaces.ts` aliases + `IFormDefinitionService` interface
- ✅ Boundary check Rule 6 passes (no direct smart-forms imports from service-catalog)

**Adoption gaps (not yet fully canonical):**
- ⚠️ `app/(dashboard)/smart-forms/page.tsx` imports `FormBuilder` from internals — migration pending (B1)
- ⚠️ Boundary Rule 7 (all `app/(dashboard)/**` pages) — not yet enforced (B2)

---

## Phase 2 — Records as First-Class Objects

- ✅ `modules/forms/domain/record-interfaces.ts` — `RecordDetail`, `IRecordService`, all sub-types
- ✅ `modules/forms/services/RecordService.ts` facade with `toRecordDetail()` projection
- ✅ `RecordDetail` read model (backend + frontend mirror)
- ✅ `lib/domains/forms/records.ts` — `recordApi`, `normalizeRecord()`, full type defs
- ✅ `hooks/useRecords.ts` — `useRecord`, `useRecords`, `useMyRecords`, `usePendingApprovals`, `useCreateRecord`, `useApproveRecord`, `useRejectRecord`, `useCancelRecord`, `useAddRecordComment`
- ✅ `app/(dashboard)/records/page.tsx` + `[id]/page.tsx` — use platform hooks
- ✅ All existing submission API routes unchanged (no breaking changes)

**Adoption gaps:**
- ⚠️ `SubmissionsDashboard` still uses `FormSubmission` type; no `records` prop alias yet (C1)
- ⚠️ `smart-forms/page.tsx` still uses `useSmartForms` submission hooks instead of `useRecords` (B1)

---

## Phase 3 — Merge the Two Workflow Worlds

- ✅ `modules/forms/services/FormWorkflowBindingService.ts` — bind/unbind/disable/getStatus/getFormsByWorkflowDefinition
- ✅ `FormTemplate` schema has `workflow_definition_id` + `workflow_mode` optional fields
- ✅ `components/forms-platform/WorkflowBindingPanel.tsx` — 3-mode UI panel (none/simple/advanced)
- ✅ `FormWorkflowService` is unchanged (handles simple mode only, frozen)

**Adoption gaps:**
- ⚠️ `WorkflowBindingPanel` exists standalone but not wired as tab inside `FormDefinitionBuilder` (D2)
- ⚠️ `FormWorkflowService` has no `@deprecated` freeze marker in code (C2)
- ⬜ `lib/domains/forms/workflow-binding.ts` — frontend API wrappers (not yet created)

---

## Phase 4 — Generic Record Actions in Workflow Engine

- ✅ `modules/workflow-engine/adapters/RecordServiceAdapter.ts` — `IWFEntityService` for `form_record`/`form_submission`
- ✅ `WFActionType.UPDATE_RECORD` added to `core/types/workflow-engine.types.ts`
- ✅ `ActionExecutor` has `IWFRecordService` interface + `executeUpdateRecord` method
- ✅ `workflowEngineFactory` wires `recordServiceAdapter` to engine
- ✅ `UPDATE_ENTITY` still works (no regression)

**Adoption gaps:**
- ⚠️ `TaskServiceAdapter.createTask()` context has `entityType`/`entityId` but does NOT persist to task metadata as `sourceRecordId` (D1)
- ⬜ Events from record creation include `recordType`, `recordId`, `formDefinitionId` — not implemented

---

## Phase 5 — Reusable Record Views Layer

- ✅ `app/(dashboard)/records/page.tsx` — record list (all/mine/pending-approvals tabs)
- ✅ `app/(dashboard)/records/[id]/page.tsx` — record detail with actions + timeline + comments
- ⬜ `components/records/RecordTableView.tsx` — reusable shared component
- ⬜ `components/records/RecordKanbanView.tsx`
- ⬜ `components/records/RecordDetailDrawer.tsx`
- ⬜ `components/records/RecordInboxView.tsx`
- ⬜ `hooks/useRecordViews.ts`
- ⬜ `app/(dashboard)/records/[definitionId]/page.tsx` (per-form record list)
- ⬜ `FormTemplate` has `view_config` optional field
- ✅ Old `/smart-forms` page still works (not removed)

---

## Phase 6 — Solution Wrappers

- ✅ `solutions/service-catalog/types.ts` + `index.ts` — imports `IFormDefinition` from platform-interfaces (correct boundary)
- ✅ `solutions/itsm/types.ts` + `index.ts` — imports `IFormDefinition` + `IRecordService` (correct boundary)
- ⚠️ Stubs are type-only; no factory/DI seam yet (G2)
- ⬜ `solutions/service-catalog/ServiceCatalogSolution.ts` full facade
- ⬜ Service catalog operational handling uses `RecordDetail` model
- ⬜ `ServiceFormModal` migrated to use `RecordDetailDrawer`

---

## Phase 7 — Platform Pillars

- ⬜ `modules/documents/` module exists (DocumentTemplate model, DocumentRenderService)
- ⬜ Record detail page shows generated documents
- ⬜ `modules/portal/` module exists (row-level access, status tracking)
- ⬜ Automation action catalog in workflow builder (assign, notify, update record, create task, call webhook, generate document)

---

## Phase 8 — UX Simplification

- ⬜ New top-level nav: Forms / Records / Workflows / Solutions
- ⬜ Old routes still work as redirects or wrappers
- ⬜ Form settings use unified tab model (Design / Access / Workflow / Views / Automation / Publishing)
- ⬜ Duplicate nav entries demoted

---

---

## Newly Discovered Gaps (Post-Audit)

These items are not in the original Phase 0–8 checklist but were found during the 2026-06 reality audit:

- ⚠️ `hooks/useSLA.ts` (legacy) vs `hooks/useSlaV2.ts` (new module) — dual SLA hook systems (F1)
- ⚠️ `projects/[projectId]/sla/page.tsx` uses legacy `useSLA` while `/sla/page.tsx` uses `useSlaV2` (F1)
- ⚠️ `src/jobs/monthlyRatingJobFixed.ts` is a dead duplicate of `monthlyRatingJob.ts`; neither is wired (F2)
- ⚠️ Project-scoped ITSM views (`/projects/[projectId]/incidents`, `changes`, `problems`) use canonical hooks but lack platform-context comments (E1)
- ⬜ `docs/architecture/deprecations.md` — ledger of deprecated hooks/routes (H2)

---

## CI Gate

After every phase, run:
```bash
./scripts/quality-gate.sh
```

All checks must pass before the next phase begins.
