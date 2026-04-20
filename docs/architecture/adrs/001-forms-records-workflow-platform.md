# ADR 001 — Forms / Records / Workflow Platform

**Status:** Accepted  
**Date:** 2026-04-15  
**Deciders:** Engineering team

---

## Context

The codebase has grown three parallel, partially-overlapping authoring and execution systems:

1. **Smart Forms** (`modules/forms/`, `components/smart-forms/`) — form builder, submissions, workflow, approval
2. **Service Catalog** (`components/service-catalog/`, `app/(dashboard)/service-catalog/`) — its own form builder that *directly imports* Smart Forms builder internals
3. **Workflow Engine** (`modules/workflow-engine/`) — generic state-machine engine, currently used only by ITSM/PM

This creates:
- Duplicate form authoring logic (ServiceFormBuilder re-wires FieldPalette/FormCanvas/FieldEditor)
- Duplicate workflow concepts (FormWorkflowService + workflow-engine run independently)
- Submissions treated as raw data blobs, not lifecycle objects
- Workflow actions hard-coded to 5 ITSM/PM entity types — no form-backed records

---

## Decision

Unify all form, record, and workflow concerns into a **three-layer platform**:

```
┌─────────────────────────────────────────────────┐
│  Solution Layer (service-catalog, itsm, hr…)    │
│  Consumes platform APIs only                    │
├─────────────────────────────────────────────────┤
│  Platform Layer                                 │
│  ├── Form Definitions  (one canonical builder)  │
│  ├── Records           (submissions as records) │
│  ├── Workflow Engine   (one execution engine)   │
│  ├── Documents         (record → PDF/HTML)      │
│  └── Portal            (external-user access)   │
├─────────────────────────────────────────────────┤
│  Infrastructure (MongoDB, Redis, S3, Redpanda)  │
└─────────────────────────────────────────────────┘
```

### Target Domain Model

| Concept | Maps from | Canonical location |
|---|---|---|
| `FormDefinition` | `FormTemplate` | `modules/forms/` |
| `Record` | `FormSubmission` | `modules/forms/` (aliased) |
| `RecordView` | SubmissionsDashboard config | `modules/forms/` + frontend |
| `WorkflowDefinition` | WorkflowDefinition (engine) | `modules/workflow-engine/` |
| `WorkflowInstance` | WorkflowInstance (engine) | `modules/workflow-engine/` |
| `DocumentTemplate` | (new) | `modules/documents/` |

---

## Architecture Rules

### Rule 1 — No solution importing platform internals (after Phase 1)
Service catalog UI **must not** import `components/smart-forms/builder/*` directly.  
It must import from `components/forms-platform/` public shell only.

### Rule 2 — Solutions consume platform APIs, not internals
```
ALLOWED:   import { FormDefinitionBuilder } from '@/components/forms-platform/...'
ALLOWED:   import { recordApi } from '@/lib/domains/forms'
FORBIDDEN: import FieldPalette from '@/components/smart-forms/builder/FieldPalette'
FORBIDDEN: import formTemplateService from '@/modules/forms/services/formTemplateService'  (from solution code)
```

### Rule 3 — Forms module may not own a new workflow engine
`FormWorkflowService` is **frozen** — no new capabilities added to it.  
All new workflow features use `modules/workflow-engine` via `FormWorkflowBindingService`.

### Rule 4 — New platform API routes use `/api/v2/platform/` prefix
Legacy `/api/v2/forms/*` routes remain stable for backward compatibility.

### Rule 5 — Dual-track workflow strategy
`FormWorkflowService` (simple mode) → kept for existing simple/legacy forms  
`FormWorkflowBindingService` (advanced mode) → new forms bind to `workflow-engine`  
These coexist; `FormWorkflowService` is NOT extended with new capabilities.

---

## Consequences

**Positive:**
- One canonical form builder path eliminates duplication
- Submissions gain lifecycle semantics (status, assignment, timeline, comments)
- Workflow actions can target any form-backed record, not just ITSM entities
- Service catalog and ITSM become solution wrappers → easier to add new solutions

**Negative / trade-offs:**
- Migration work per phase (mitigated by dual-track and facade patterns)
- `FormWorkflowService` dual-track adds short-term complexity (capped by Phase 3)

---

## Implementation Phases

| Phase | Description |
|---|---|
| 0 | Guardrails: this ADR, ownership map, boundary rule, PR template |
| 1 | Canonical form-definition platform (builder shell, lib/domains/forms/) |
| 2 | Records as first-class objects (RecordService facade, RecordDetail model) |
| 3 | Workflow binding (FormWorkflowBindingService, workflow tab in builder) |
| 4 | Generic record actions in workflow engine (RecordServiceAdapter) |
| 5 | Record views layer (RecordTableView, RecordKanbanView, /records/ routes) |
| 6 | Solution wrappers (solutions/service-catalog, solutions/itsm) |
| 7 | Platform pillars (documents, portal, automation catalog) |
| 8 | UX simplification (nav restructure) |

See `docs/architecture/refactor-checklist.md` for per-phase completion tracking.
