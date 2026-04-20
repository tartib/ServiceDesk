# Deprecation Registry

Tracks intentionally deprecated APIs, hooks, and components. Each entry records the legacy path, its canonical replacement, and the phase/ADR that governs the migration.

---

## Frontend

### `hooks/useSLA.ts` → `hooks/useSlaV2.ts`

| Field | Value |
|---|---|
| **Legacy** | `@/hooks/useSLA` (exports: `useSLAs`, `useSLA`, `useSLAStats`, `useCreateSLA`, `useUpdateSLA`, `useDeleteSLA`) |
| **Canonical** | `@/hooks/useSlaV2` (exports: `useSlaPolicies`, `useSlaPolicy`, `useSlaStats`, `useCreateSlaPolicy`, `useUpdateSlaPolicy`, `useDeleteSlaPolicy`, `useSlaCalendars`, `useTicketSla`, `useSlaComplianceReport`) |
| **Reason** | Legacy hook targets the old `/api/v2/slas` endpoint with snake_case models. `useSlaV2` targets the canonical `/api/v2/sla` module with camelCase models and richer policy/goal/calendar structure. |
| **Status** | ✅ DELETED — file removed. |
| **ADR** | ADR 001 — Forms Platform Refactor (Task 6) |
| **Remove by** | Next major cleanup sprint |

---

### `components/smart-forms/SubmissionsDashboard.tsx` → `components/forms-platform/RecordsDashboard.tsx`

| Field | Value |
|---|---|
| **Legacy** | `@/components/smart-forms/SubmissionsDashboard` |
| **Canonical** | `@/components/forms-platform/RecordsDashboard` |
| **Reason** | Terminology migration: "Submissions" → "Records" (canonical lifecycle abstraction). `RecordsDashboard` accepts both `records` (canonical) and `submissions` (deprecated alias) props for backward compatibility. |
| **Status** | ✅ DELETED — file removed. All callers migrated to `RecordsDashboard`. |
| **ADR** | ADR 001 — Forms Platform Refactor (Task 1 + Task 3) |

---

### `components/smart-forms/FormRenderer.tsx` (direct import)

| Field | Value |
|---|---|
| **Legacy import** | `@/components/smart-forms/FormRenderer` |
| **Canonical import** | `@/components/forms-platform/FormRenderer` (re-export proxy) |
| **Reason** | All `app/(dashboard)/**` pages must import through the `forms-platform/` boundary shell. The underlying implementation still lives in `components/smart-forms/FormRenderer.tsx`. |
| **Status** | `app/(dashboard)/smart-forms/page.tsx` migrated. |
| **ADR** | ADR 001 — Forms Platform Refactor (Task 1) |

---

## Backend

### `src/modules/forms/services/FormWorkflowService.ts`

| Field | Value |
|---|---|
| **Legacy** | `FormWorkflowService` — handles simple (inline) workflow only |
| **Canonical** | `FormWorkflowBindingService` + `modules/workflow-engine` |
| **Reason** | Advanced workflow behavior must route through `FormWorkflowBindingService` and the `modules/workflow-engine` module. `FormWorkflowService` is frozen; no new capabilities may be added. |
| **Status** | Frozen — `@deprecated FROZEN` marker in file. No new logic permitted. `@deprecated` marker also added to template hooks section of `useSmartForms.ts`. |
| **ADR** | ADR 001 — Forms Platform Refactor (Task 4) |

---

### `hooks/useSmartForms.ts` template hooks → `hooks/useFormDefinitions.ts`

| Field | Value |
|---|---|
| **Legacy** | `useFormTemplates`, `useCreateFormTemplate`, `useUpdateFormTemplate`, `usePublishFormTemplate`, `useUnpublishFormTemplate` from `@/hooks/useSmartForms` |
| **Canonical** | `useFormDefinitions`, `useCreateFormDefinition`, `useUpdateFormDefinition`, `usePublishFormDefinition`, `useUnpublishFormDefinition` from `@/hooks/useFormDefinitions` |
| **Reason** | Template hooks in `useSmartForms` use raw `fetch` + token logic; canonical hooks use the typed `formDefinitionApi` from `lib/domains/forms/`. Data shape: `templatesData.definitions` (was `templatesData.data`). Arg shapes: `{ id, dto }` (was `{ formId, data }`). |
| **Status** | `smart-forms/page.tsx` migrated. `useSmartForms` submission hooks remain valid. |
| **ADR** | ADR 001 — Forms Platform Refactor (Cleanup Sprint) |
