# Platform Ownership Map

Maps current code locations to their target platform ownership after refactor.  
See ADR 001 for context and rules.

---

## Form Authoring

| Current | Owner | Target | Notes |
|---|---|---|---|
| `components/smart-forms/builder/FormBuilder.tsx` | Platform / Forms | Keep — platform internal UI | Not a public API |
| `components/smart-forms/builder/FieldPalette.tsx` | Platform / Forms | Keep — platform internal | Consumed only via shell |
| `components/smart-forms/builder/FieldEditor.tsx` | Platform / Forms | Keep — platform internal | Consumed only via shell |
| `components/smart-forms/builder/FormCanvas.tsx` | Platform / Forms | Keep — platform internal | Consumed only via shell |
| `components/forms-platform/FormDefinitionBuilder.tsx` | Platform / Forms | **New** — public shell | Phase 1 |
| `components/service-catalog/ServiceFormBuilder.tsx` | Solution / Service Catalog | Thin wrapper over `FormDefinitionBuilder` | Phase 1 refactor |
| `ServiceDesk-backend/src/modules/forms/services/formTemplateService.ts` | Platform / Forms | Keep as implementation | Aliased by `platform-interfaces.ts` |
| `ServiceDesk-backend/src/modules/forms/domain/platform-interfaces.ts` | Platform / Forms | **New** — canonical DTOs | Phase 1 |

---

## Submissions / Records

| Current | Owner | Target | Notes |
|---|---|---|---|
| `modules/forms/services/formSubmissionService.ts` | Platform / Records | Implementation — keep | Wrapped by RecordService |
| `modules/forms/services/FormSubmissionCommentService.ts` | Platform / Records | Implementation — keep | Re-exported as RecordCommentService |
| `modules/forms/services/FormSubmissionTimelineService.ts` | Platform / Records | Implementation — keep | Re-exported as RecordTimelineService |
| `modules/forms/services/FormSubmissionValidationService.ts` | Platform / Records | Implementation — keep | Used internally |
| `modules/forms/services/RecordService.ts` | Platform / Records | **New** facade | Phase 2 |
| `modules/forms/domain/record-interfaces.ts` | Platform / Records | **New** domain types | Phase 2 |
| `components/smart-forms/SubmissionsDashboard.tsx` | Platform / Records | Wrap to accept `records` prop | Phase 2 refactor |
| `lib/domains/forms/records.ts` | Platform / Records | **New** frontend types + API | Phase 2 |
| `hooks/useRecords.ts` | Platform / Records | **New** React Query hooks | Phase 2 |

---

## Workflow

| Current | Owner | Target | Notes |
|---|---|---|---|
| `modules/forms/services/FormWorkflowService.ts` | Platform / Forms (simple) | **Frozen** — no new features | Dual-track simple mode |
| `modules/forms/services/FormWorkflowBindingService.ts` | Platform / Forms (advanced) | **New** — routes to workflow-engine | Phase 3 |
| `modules/workflow-engine/` (all) | Platform / Workflow | Canonical engine — keep and extend | Phase 3, 4 |
| `modules/workflow-engine/adapters/EntityServiceAdapter.ts` | Platform / Workflow | Extended by RecordServiceAdapter | Phase 4 |
| `modules/workflow-engine/adapters/RecordServiceAdapter.ts` | Platform / Workflow | **New** — generic record actions | Phase 4 |

---

## Solution Wrappers (post Phase 6)

| Current | Owner | Target | Notes |
|---|---|---|---|
| `modules/itsm/` (all) | Solution / ITSM | Keep domain logic; consume platform for forms/workflow | Phase 6 |
| `components/service-catalog/` | Solution / Service Catalog | Thin solution wrapper | Phase 6 |
| `app/(dashboard)/service-catalog/` | Solution / Service Catalog | Route wrapper | Phase 6 |
| `solutions/service-catalog/` | Solution / Service Catalog | **New** solution facade | Phase 6 |
| `solutions/itsm/` | Solution / ITSM | **New** solution facade stub | Phase 6 |

---

## Platform Pillars (post Phase 7)

| Concept | Location | Status |
|---|---|---|
| `DocumentTemplate` | `modules/documents/` | **New** Phase 7 |
| `DocumentRenderService` | `modules/documents/` | **New** Phase 7 |
| Portal (external access) | `modules/portal/` | **New** Phase 7 |
| Automation action catalog | `components/workflow-builder/` additions | **New** Phase 7 |

---

## Frontend Domain Layer

| Domain | Location | Status |
|---|---|---|
| Forms (definitions) | `lib/domains/forms/` | **New** Phase 1 |
| Records | `lib/domains/forms/records.ts` | **New** Phase 2 |
| Workflow binding | `lib/domains/forms/workflow-binding.ts` | **New** Phase 3 |
| ITSM | `lib/domains/itsm/` | Exists |
| PM | `lib/domains/pm/` | Exists |
| Notifications | `lib/domains/notifications/` | Exists |
| Workflow | `lib/domains/workflow/` | Exists |
| Gamification | `lib/domains/gamification/` | Exists |
| Settings | `lib/domains/settings/` | Exists |
