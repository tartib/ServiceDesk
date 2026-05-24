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
- ✅ `WorkflowBindingPanel` wired as tab inside `FormDefinitionBuilder` (D2 closed)
- ✅ `FormWorkflowService` has `@deprecated FROZEN` marker in code (C2 closed)
- ✅ `lib/domains/forms/workflow-binding.ts` — frontend API wrappers created

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
- ✅ `app/(dashboard)/records/new/page.tsx` — unified create request flow
- ✅ `components/records/RecordTableView.tsx` — reusable shared component
- ✅ `components/records/RecordKanbanView.tsx`
- ✅ `components/records/RecordDetailDrawer.tsx`
- ✅ `components/records/RecordInboxView.tsx`
- ✅ `components/records/CreateRequestFlow.tsx` — 3-step request creation wizard with autosave
- ✅ `components/records/RecordDetailView.tsx` — unified record detail (RecordItem + FormSubmission)
- ✅ `components/records/RecordErrorState.tsx` + `RecordEmptyState.tsx` — error/empty state variants
- ✅ `hooks/useRecordItems.ts` — React Query hooks for new RecordItem model
- ✅ `hooks/useRequestTypes.ts` — React Query hooks for RequestType CRUD
- ✅ `lib/domains/forms/record-items.ts` — API wrappers for /records endpoints
- ✅ `lib/domains/forms/request-types.ts` — API wrappers for /request-types endpoints
- ✅ `locales/en|ar|fr/records.json` — i18n for records flow
- ✅ `hooks/useRecordViews.ts` — view mode state + per-definition record query
- ✅ `app/(dashboard)/records/definitions/[definitionId]/page.tsx` — per-form record list with view switcher
- ✅ `FormTemplate` has `view_config` optional field (`IFormViewConfig` + schema)
- ✅ Old `/smart-forms` page still works (not removed)

### Section 1 Backend (Platform Core):
- ✅ `modules/forms/models/RequestType.ts` — request type model
- ✅ `modules/forms/models/RecordItem.ts` — metadata layer with auto-generated recordNumber
- ✅ `modules/forms/services/RecordService.ts` — extended with full-record methods
- ✅ `modules/forms/services/requestTypeService.ts` — CRUD + filtering
- ✅ `modules/forms/services/RecordAdapter.ts` — backward compat adapters
- ✅ `modules/forms/services/RecordActivityService.ts` — timeline events
- ✅ `modules/forms/services/RecordWorkflowService.ts` — auto-workflow attachment
- ✅ `modules/forms/controllers/record.controller.ts` + `record.routes.ts`
- ✅ `modules/forms/controllers/requestType.controller.ts` + `request-type.routes.ts`
- ✅ `modules/forms/errors/RecordErrors.ts` — 6 custom error classes
- ✅ `shared/feature-flags/seeds/record-flow-flags.ts`
- ✅ `shared/types/workspace.types.ts` — WorkspaceType enum
- ✅ `core/types/workflow-engine.types.ts` — RECORD entity type added
- ✅ Frontend `types/index.ts` — WorkspaceType, RecordItemStatus, RecordPriority, RequestType, RecordItem + DTOs

---

## Phase 6 — Solution Wrappers

- ✅ `solutions/service-catalog/types.ts` + `index.ts` — imports `IFormDefinition` from platform-interfaces (correct boundary)
- ✅ `solutions/itsm/types.ts` + `index.ts` — imports `IFormDefinition` + `IRecordService` (correct boundary)
- ✅ `solutions/service-catalog/ServiceCatalogService.ts` — full facade: addCatalogItem, listCatalogItems, requestService
- ✅ `solutions/service-catalog/SelfServiceFacade.ts` — customer-facing record policy (ownership + visibility filter)
- ✅ `solutions/itsm/ITSMRecordFacade.ts` — full ITSM facade: create, list, escalate with priority/SLA metadata
- ✅ `solutions/itsm/IncidentFormBinding.ts` — entity-type → FormDefinition resolver
- ⬜ `ServiceFormModal` migrated to use `RecordDetailDrawer` (large UI refactor — deferred)

---

## Phase 7 — Platform Pillars

- ✅ `modules/documents/` — types, DocumentService (template CRUD + rendering), controller, routes
- ✅ `modules/portal/` — types (PortalToken, PortalSession), PortalService, controller, routes
- ✅ `modules/workflow-engine/types/automation-actions.ts` — 15-action catalog (record, task, notify, document, webhook, system)
- ⬜ Record detail page shows generated documents (frontend integration)
- ⬜ Portal frontend pages (external-user form submission + status tracking)

---

## Phase 8 — UX Simplification

- ✅ New top-level nav: Forms Platform / Workflows / Solutions sections in Sidebar
- ✅ Old routes still work — `/forms` redirects to `/smart-forms`
- ✅ Form settings use unified tab model (Design / Access / Workflow / Views / Automation / Publishing)
- ✅ Sidebar sections: Projects, Gamification, Forms Platform, Workflows, Solutions
- ⬜ Stub tab panels (Access, Views, Automation, Publishing) need full implementation

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
