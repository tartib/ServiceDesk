# Request Flow Discovery — Platform Core Refactoring

> Generated as part of Section 1: Foundation & Core Platform Tasks  
> Pre-Sprint 0 — Discovery & Architecture

---

## 1. Current Request-Like Flows

| # | Flow | Backend Location | Frontend Location | Storage Model | Status Model | Workflow |
|---|------|-----------------|-------------------|---------------|-------------|----------|
| 1 | **ITSM Incident** | `modules/itsm/` controllers + `core/entities/Incident.ts` + `core/services/IncidentService.ts` | `app/(dashboard)/agent-console/`, `self-service/new-incident/` | `Incident` (Mongoose) | `IncidentStatus` (7 states) | Hardcoded status machine in service |
| 2 | **ITSM Service Request** | `modules/itsm/` controllers + `core/entities/ServiceRequest.ts` | `app/(dashboard)/agent-console/`, `self-service/new-request/` | `ServiceRequest` (Mongoose) | `ServiceRequestStatus` (8 states) | Approval steps + hardcoded fulfillment |
| 3 | **Service Catalog Item** | `core/entities/ServiceCatalog.ts` + `modules/itsm/models/ServiceCatalog.ts` | `app/(dashboard)/service-catalog/` | `ServiceCatalog` (Mongoose) | Active/inactive availability | Static workflow config per item |
| 4 | **Form Submission (Smart Forms)** | `modules/forms/services/formSubmissionService.ts` + `core/entities/FormSubmission.ts` | `app/(dashboard)/records/`, smart-form components | `FormSubmission` (Mongoose) | `SubmissionStatus` (9 states: draft → cancelled) | Simple workflow (FormWorkflowService, frozen) OR advanced (FormWorkflowBindingService → workflow-engine) |
| 5 | **Record (Platform Facade)** | `modules/forms/services/RecordService.ts` | `app/(dashboard)/records/[id]/` + `hooks/useRecords.ts` | Wraps `FormSubmission` | Delegates to `SubmissionStatus` | Delegates to FormSubmission workflow |
| 6 | **PM Task** | `modules/pm/controllers/` + `modules/pm/models/Task.ts` | `app/(dashboard)/tasks/`, `projects/[id]/tasks/` | `Task` (Mongoose) | Task status (backlog → done) | Kanban columns / sprint workflow |
| 7 | **PM Project Intake** | `modules/pm/models/ProjectIntake.ts` | Project creation wizard | `ProjectIntake` (Mongoose) | Intake status | Approval-based |
| 8 | **Workflow Instance** | `modules/workflow-engine/models/WorkflowInstance.ts` | `app/(dashboard)/workflow-builder/` | `WorkflowInstance` (Mongoose) | `WFInstanceStatus` (active, completed, cancelled, suspended) | Full state machine engine |
| 9 | **SLA Instance** | `modules/sla/models/SlaInstance.ts` + `SlaPolicy.ts` | SLA dashboard | `SlaInstance` + `SlaMetricInstance` | Metric tracking states | Timer-based with escalation rules |
| 10 | **Portal Session** | `modules/portal/PortalService.ts` | External portal access | In-memory (tokens + sessions) | Token scopes: form:submit, record:view, catalog:browse | Token-gated access |
| 11 | **ITSM Change** | `core/entities/Change.ts` | Change management pages | `Change` (Mongoose) | Change status lifecycle | CAB approval workflow |
| 12 | **ITSM Problem** | `core/entities/Problem.ts` | Problem management pages | `Problem` (Mongoose) | Problem status lifecycle | Root cause analysis workflow |

---

## 2. Canonical Flow Definition

```
RequestType  →  Form Schema (FormTemplate)  →  Form Submission (FormSubmission)
                                                       ↓
                                               RecordItem (NEW — metadata)
                                                       ↓
                                             WorkflowInstance (optional)
                                                       ↓
                                          Tasks / Documents / Activity / SLA
```

### Module Ownership Matrix

| Concept | Owner Module | Storage |
|---------|-------------|---------|
| RequestType | `modules/forms/` | NEW `RequestType` model |
| Form Schema | `modules/forms/` | Existing `FormTemplate` |
| Form Data | `modules/forms/` | Existing `FormSubmission` |
| RecordItem (metadata) | `modules/forms/` | NEW `RecordItem` model |
| Workflow Execution | `modules/workflow-engine/` | Existing `WorkflowInstance` |
| SLA Tracking | `modules/sla/` | Existing `SlaInstance` |
| Notifications | `modules/notifications/` | Existing notification models |
| Portal Access | `modules/portal/` | Existing token system |
| ITSM Tickets | `modules/itsm/` | Existing `Incident` / `ServiceRequest` (consumed via adapters) |

---

## 3. Decision: Keep / Extend / Deprecate

| Flow | Decision | Rationale |
|------|----------|-----------|
| ITSM Incident | **Keep** — adapt via RecordAdapter | Domain-specific logic stays; unified view via adapter |
| ITSM Service Request | **Keep** — adapt via RecordAdapter | Same as above |
| Service Catalog | **Keep** — link to RequestType | Catalog items map 1:1 to RequestTypes |
| FormSubmission | **Extend** — add RecordItem metadata layer | Core form data storage unchanged |
| RecordService | **Extend** — add createFullRecord, getFullRecord | Existing methods preserved for backward compat |
| PM Task | **Keep** — adapt via RecordAdapter | PM domain stays separate |
| Workflow Engine | **Extend** — add `RECORD` to WFEntityType | Engine already generic; needs new entity type |
| SLA Module | **Extend** — bind to RecordItem via SlaPolicy | Already supports entity-based policies |
| Portal | **Keep** — already supports record:view scope | No changes needed now |

---

## 4. New Models Summary

### RequestType
- Links a workspace type to a form schema and optional workflow template
- Fields: `name`, `nameAr`, `workspaceType`, `formSchemaId`, `workflowTemplateId?`, `defaultPriority`, `isClientVisible`, `isActive`, `organizationId`

### RecordItem (Hybrid Metadata)
- Thin metadata model that references FormSubmission (form data) + WorkflowInstance (execution)
- Fields: `recordNumber`, `title`, `requestTypeId`, `workspaceType`, `status`, `priority`, `requesterId`, `assigneeId?`, `formSubmissionId`, `workflowInstanceId?`, `sla { dueAt, status }`, `sourceType`, `organizationId`
- **Not** a replacement for FormSubmission — sits alongside it

---

## 5. Feature Flags Required

| Flag | Purpose | Default |
|------|---------|---------|
| `new_request_flow` | Gate CreateRequestFlow UI + new API endpoints | `false` |
| `unified_record_detail` | Gate RecordDetailPage rewrite | `false` |
| `workspace_based_navigation` | Gate workspace-aware sidebar | `false` |
| `client_portal_mvp` | Gate external portal features | `false` |
| `auto_workflow_attachment` | Gate automatic workflow binding on record creation | `false` |
| `sla_engine_v2` | Gate new SLA binding to RecordItem | `false` |

---

## 6. Integration Points

### Workflow Engine Integration
- Via `InternalApiRegistry.get('workflow')` — existing `IWorkflowApi` contract
- Methods used: `startWorkflow()`, `executeTransition()`, `getAvailableTransitions()`, `cancelWorkflow()`
- New: add `RECORD = 'record'` to `WFEntityType` enum

### SLA Integration
- Via `InternalApiRegistry.get('sla')` — existing `ISlaApi` contract
- RecordItem creation triggers SLA policy matching based on `requestType` + `priority`

### Notification Integration
- Via `InternalApiRegistry.get('notifications')` — existing contract
- Events: record created, status changed, assigned, comment added, SLA warning/breach
