# ADR 001 — Forms Platform Refactor Checklist

> Verified against current repo snapshot — Apr 19 2026

Tracks every migration item defined in ADR 001. Items are marked ✅ DONE, ⚠️ PARTIAL, or ❌ OPEN.

---

## Phase 1 — Canonical Form Definition path

| Item | Status | Evidence |
|---|---|---|
| `FormDefinitionBuilder` canonical shell | ✅ DONE | `components/forms-platform/FormDefinitionBuilder.tsx` |
| `lib/domains/forms/` — types, keys, api, adapters, records | ✅ DONE | All files present, exported from `index.ts` |
| `hooks/useFormDefinitions.ts` canonical hooks | ✅ DONE | Created; replaces template hooks in `useSmartForms` |
| `smart-forms/page.tsx` migrated to canonical imports | ✅ DONE | Uses `useFormDefinitions`, `RecordsDashboard`, `FormRenderer` from `forms-platform/` |
| `ServiceFormBuilder` wrapper in `service-catalog/` | ✅ DONE | `components/service-catalog/ServiceFormBuilder.tsx` |

---

## Phase 2 — Records as first-class lifecycle objects

| Item | Status | Evidence |
|---|---|---|
| `lib/domains/forms/records.ts` — frontend record API | ✅ DONE | Present |
| `hooks/useRecords.ts` — canonical record hooks | ✅ DONE | Present |
| `app/(dashboard)/records/page.tsx` | ✅ DONE | Present, fully records-first |
| `app/(dashboard)/records/[id]/page.tsx` | ✅ DONE | Present |
| `RecordsDashboard.tsx` (replaces SubmissionsDashboard) | ✅ DONE | `components/forms-platform/RecordsDashboard.tsx` |
| `SubmissionsDashboard.tsx` deleted | ✅ DONE | File removed |
| `records/page.tsx` submission wording removed | ⚠️ PARTIAL | `record.submissionId` still shown as display ID (T3) |
| Reusable record view components | ❌ OPEN | `components/records/` dir does not exist (T8) |
| `records/[definitionId]/page.tsx` per-definition view | ❌ OPEN | Does not exist (T8) |

---

## Phase 3 — Workflow binding integration

| Item | Status | Evidence |
|---|---|---|
| `WorkflowBindingPanel.tsx` | ✅ DONE | `components/forms-platform/WorkflowBindingPanel.tsx` |
| `FormDefinitionBuilder` Workflow tab (formId prop) | ✅ DONE | Added in previous session |
| `FormWorkflowBindingService.ts` backend | ✅ DONE | `src/modules/forms/services/FormWorkflowBindingService.ts` |
| `FormWorkflowService.ts` frozen (`@deprecated FROZEN`) | ✅ DONE | Marker present in file |
| `lib/domains/forms/workflow-binding.ts` API wrapper | ❌ OPEN | Does not exist (T4) |
| `hooks/useWorkflowBinding.ts` | ❌ OPEN | Does not exist (T4) |

---

## Phase 4 — Workflow engine record actions

| Item | Status | Evidence |
|---|---|---|
| `WFActionType.UPDATE_RECORD` added | ✅ DONE | `workflow-engine.types.ts` |
| `ActionExecutor.executeUpdateRecord` | ✅ DONE | Implemented |
| `RecordServiceAdapter.ts` | ✅ DONE | Present |
| `TaskServiceAdapter` sourceRecordId | ✅ DONE | Persisted in task metadata |
| `IWFEvent.recordContext` | ❌ OPEN | Not on event type yet (T6) |
| Engine populates `recordContext` on events | ❌ OPEN | Not implemented (T6) |
| `WFActionType.GENERATE_DOCUMENT` | ❌ OPEN | Does not exist (T10) |

---

## Phase 5 — SLA canonicalization

| Item | Status | Evidence |
|---|---|---|
| `hooks/useSLA.ts` deprecated and deleted | ✅ DONE | File removed |
| All SLA pages use `useSlaV2` | ✅ DONE | Both SLA pages verified |
| `deprecations.md` entry | ✅ DONE | Present |

---

## Phase 6 — Solution facades

| Item | Status | Evidence |
|---|---|---|
| `solutions/service-catalog/` stub created | ✅ DONE | Barrel + types |
| `solutions/itsm/` stub created | ✅ DONE | Barrel + types |
| `ServiceCatalogService` real facade | ❌ OPEN | TODOs only (T9) |
| `SelfServiceFacade` | ❌ OPEN | TODOs only (T9) |
| `IncidentFormBinding` | ❌ OPEN | TODOs only (T9) |
| `ITSMRecordFacade` | ❌ OPEN | TODOs only (T9) |
| `hooks/useServiceCatalogSolution.ts` | ❌ OPEN | Does not exist (T9) |

---

## Phase 7 — Platform pillars

| Item | Status | Evidence |
|---|---|---|
| `modules/documents/` | ❌ OPEN | Does not exist (T10) |
| `modules/portal/` | ❌ OPEN | Does not exist (T10) |
| Workflow action: generate document | ❌ OPEN | Not implemented (T10) |

---

## Boundary Enforcement

| Rule | Status | Evidence |
|---|---|---|
| Rule 6: service-catalog ↛ smart-forms/builder | ✅ DONE | `check-boundaries.ts` lines 260–289 |
| Rule 7: app/(dashboard) ↛ smart-forms/builder | ✅ DONE | `check-boundaries.ts` lines 291–317 |
| CI gate runs boundary check | ✅ DONE | `quality-gate.sh` step 4 |
| Backend tsc passes (0 new errors) | ✅ DONE | Verified |

---

## Dead Code Cleanup

| Item | Status | Evidence |
|---|---|---|
| `monthlyRatingJobFixed.ts` | ⚠️ PARTIAL | `@deprecated` header added; deletion pending (T7) |
| `SubmissionsDashboard.tsx` | ✅ DONE | Deleted |
| `hooks/useSLA.ts` | ✅ DONE | Deleted |
| `useSmartForms` template hooks `@deprecated` marker | ❌ OPEN | Header not yet added (T5) |

---

## Navigation

| Item | Status | Evidence |
|---|---|---|
| Sidebar Forms/Records/Workflows/Solutions sections | ✅ DONE | `Sidebar.tsx` restructured |
| Old "Forms Platform" / "ITSM" labels removed | ✅ DONE | Replaced |
| `/forms` route alias | ❌ OPEN | Does not exist (T11) |
| `ProjectNavTabs` contextual "Project View" pills | ⚠️ PARTIAL | Added to SLA page only (T11) |

---

## Tests

| Item | Status | Evidence |
|---|---|---|
| Vitest frontend contract tests | ❌ OPEN | T12 |
| Jest backend integration tests | ❌ OPEN | T12 |
