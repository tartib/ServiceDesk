# ADR 001 — Refactor Reality Audit

> Per-file scan of the repository against the target architecture defined in ADR 001.
> Verified against current repo snapshot — Apr 19 2026

---

## Summary

| Category | Done | Partial | Open |
|---|---|---|---|
| Form definition path | 5 | 0 | 0 |
| Records platform | 4 | 1 | 2 |
| Workflow binding | 5 | 0 | 2 |
| Workflow engine actions | 4 | 0 | 3 |
| SLA canonicalization | 3 | 0 | 0 |
| Solution facades | 2 | 0 | 5 |
| Platform pillars | 0 | 0 | 3 |
| Boundary enforcement | 4 | 0 | 0 |
| Dead code cleanup | 3 | 1 | 1 |
| Navigation | 3 | 1 | 1 |

---

## File-by-file scan

### Frontend — `components/forms-platform/`

| File | Status | Notes |
|---|---|---|
| `FormDefinitionBuilder.tsx` | ✅ | Has Fields + Workflow tabs; accepts `formId` |
| `FormRenderer.tsx` | ✅ | Re-export proxy; enforces boundary |
| `RecordsDashboard.tsx` | ✅ | Records-first; supports `records` + `submissions` alias |
| `WorkflowBindingPanel.tsx` | ✅ | none/simple/advanced modes implemented |

### Frontend — `components/records/`

| File | Status | Notes |
|---|---|---|
| `RecordTableView.tsx` | ❌ OPEN | Does not exist — T8 |
| `RecordKanbanView.tsx` | ❌ OPEN | Does not exist — T8 |
| `RecordDetailDrawer.tsx` | ❌ OPEN | Does not exist — T8 |
| `RecordInboxView.tsx` | ❌ OPEN | Does not exist — T8 |

### Frontend — `app/(dashboard)/records/`

| File | Status | Notes |
|---|---|---|
| `page.tsx` | ⚠️ PARTIAL | `record.submissionId` shown as display ID — T3 |
| `[id]/page.tsx` | ✅ | Fully records-first copy |
| `[definitionId]/page.tsx` | ❌ OPEN | Does not exist — T8 |

### Frontend — `hooks/`

| File | Status | Notes |
|---|---|---|
| `useFormDefinitions.ts` | ✅ | Canonical form template hooks |
| `useRecords.ts` | ✅ | Canonical record lifecycle hooks |
| `useSlaV2.ts` | ✅ | Canonical SLA hooks |
| `useWorkflowBinding.ts` | ❌ OPEN | Does not exist — T4 |
| `useServiceCatalogSolution.ts` | ❌ OPEN | Does not exist — T9 |
| `useSmartForms.ts` | ⚠️ PARTIAL | Template hooks have no `@deprecated` marker — T5 |
| `useSLA.ts` | ✅ DELETED | Removed |
| `useRecordViews.ts` | ❌ OPEN | Does not exist — T8 |

### Frontend — `lib/domains/forms/`

| File | Status | Notes |
|---|---|---|
| `api.ts` | ✅ | Full CRUD + publish |
| `types.ts` | ✅ | Canonical `FormDefinition`, `FormRecord` aliases |
| `keys.ts` | ✅ | Query key factory |
| `adapters.ts` | ✅ | Normalizer functions |
| `records.ts` | ✅ | Record API functions |
| `index.ts` | ✅ | Barrel export |
| `workflow-binding.ts` | ❌ OPEN | Does not exist — T4 |

### Frontend — `components/smart-forms/`

| File | Status | Notes |
|---|---|---|
| `FormRenderer.tsx` | ✅ | Legacy impl; accessed only via `forms-platform/` proxy |
| `SubmissionsDashboard.tsx` | ✅ DELETED | Removed |
| `builder/*` | ✅ | Accessed only through `FormDefinitionBuilder` shell |

### Frontend — `components/layout/Sidebar.tsx`

| Status | Notes |
|---|---|
| ✅ | Four sections: Forms / Records / Workflows / Solutions |
| ⚠️ PARTIAL | No `/forms` alias route — T11 |

### Backend — `src/modules/forms/services/`

| File | Status | Notes |
|---|---|---|
| `FormWorkflowService.ts` | ✅ | `@deprecated FROZEN` — no new logic |
| `FormWorkflowBindingService.ts` | ✅ | Canonical binding service |
| `RecordService.ts` | ✅ | Facade with `toRecordDetail` projection |

### Backend — `src/modules/workflow-engine/`

| File | Status | Notes |
|---|---|---|
| `engine/ActionExecutor.ts` | ✅ | UPDATE_RECORD implemented; CREATE_TASK wired |
| `engine/GenericWorkflowEngine.ts` | ⚠️ PARTIAL | Does not populate `recordContext` on events — T6 |
| `adapters/TaskServiceAdapter.ts` | ✅ | Persists `sourceRecordId/sourceRecordType` in metadata |
| `adapters/RecordServiceAdapter.ts` | ✅ | Implements `IWFEntityService` for form records |
| `core/types/workflow-engine.types.ts` | ⚠️ PARTIAL | `IWFEvent` missing `recordContext` field — T6 |

### Backend — `src/solutions/`

| File | Status | Notes |
|---|---|---|
| `service-catalog/index.ts` | ⚠️ PARTIAL | Stub barrel only — T9 |
| `service-catalog/types.ts` | ✅ | Type definitions present |
| `service-catalog/ServiceCatalogService.ts` | ❌ OPEN | Does not exist — T9 |
| `service-catalog/SelfServiceFacade.ts` | ❌ OPEN | Does not exist — T9 |
| `itsm/index.ts` | ⚠️ PARTIAL | Stub barrel only — T9 |
| `itsm/types.ts` | ✅ | Type definitions present |
| `itsm/IncidentFormBinding.ts` | ❌ OPEN | Does not exist — T9 |
| `itsm/ITSMRecordFacade.ts` | ❌ OPEN | Does not exist — T9 |

### Backend — `src/modules/documents/`

| Status | Notes |
|---|---|
| ❌ OPEN | Module does not exist — T10 |

### Backend — `src/modules/portal/`

| Status | Notes |
|---|---|
| ❌ OPEN | Module does not exist — T10 |

### Backend — `src/jobs/`

| File | Status | Notes |
|---|---|---|
| `monthlyRatingJob.ts` | ✅ | Canonical — wired via `taskScheduler.ts` |
| `monthlyRatingJobFixed.ts` | ⚠️ PARTIAL | Has `@deprecated DEAD DUPLICATE` header; not yet deleted — T7 |
| `taskScheduler.ts` | ✅ | Wires `startMonthlyRatingJob` from canonical file |

---

## Boundary scan results

Ran `npx ts-node scripts/check-boundaries.ts` — **✅ 0 violations**.

Rules active:
- Rule 1–5: Various backend module boundary rules
- Rule 6: `service-catalog` ↛ `smart-forms/builder` internals
- Rule 7: `app/(dashboard)/**` ↛ `smart-forms/builder` internals
