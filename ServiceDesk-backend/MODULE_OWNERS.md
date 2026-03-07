# Module Ownership Registry

> Single source of truth for module boundaries, ownership, and allowed dependencies.
> Used by the `moduleHealth` script to detect boundary violations.

## Modules

### itsm

- **Path:** `src/modules/itsm/`
- **Core legacy:** `src/core/entities/`, `src/core/services/`, `src/core/repositories/`, `src/core/types/itsm.types.ts`
- **Presentation legacy:** `src/presentation/`
- **Controllers legacy:** `src/controllers/itsm/`
- **Routes legacy:** `src/routes/itsm/`
- **Models legacy:** `src/models/itsm/`
- **Allowed deps:** `shared/*`, `core/auth/*`, `core/engines/*`
- **Forbidden deps:** `modules/pm/*`, `modules/forms/*`, `modules/workflow-engine/*` (use Internal API)

### pm

- **Path:** `src/modules/pm/`
- **Controllers legacy:** `src/controllers/pm/`
- **Routes legacy:** `src/routes/pm/`
- **Models legacy:** `src/models/pm/`
- **Allowed deps:** `shared/*`
- **Forbidden deps:** `modules/itsm/*`, `modules/forms/*`, `modules/workflow-engine/*` (use Internal API)

### workflow-engine

- **Path:** `src/modules/workflow-engine/`
- **Core legacy:** `src/core/engines/workflow/`, `src/core/types/workflow-engine.types.ts`
- **Controllers legacy:** `src/controllers/workflow-engine/`
- **Routes legacy:** `src/routes/workflow-engine/`
- **Models legacy:** `src/models/workflow/`
- **Services legacy:** `src/services/workflow-engine/`
- **Allowed deps:** `shared/*`, `core/engines/*`
- **Forbidden deps:** `modules/itsm/*`, `modules/pm/*`, `modules/forms/*` (use Internal API)

### forms

- **Path:** `src/modules/forms/`
- **Core legacy:** `src/core/entities/FormTemplate.ts`, `src/core/entities/FormSubmission.ts`, `src/core/types/smart-forms.types.ts`
- **Controllers legacy:** `src/controllers/formTemplate.controller.ts`, `src/controllers/formSubmission.controller.ts`
- **Services legacy:** `src/services/formTemplateService.ts`, `src/services/formSubmissionService.ts`
- **Allowed deps:** `shared/*`, `core/engines/*`
- **Forbidden deps:** `modules/itsm/*`, `modules/pm/*`, `modules/workflow-engine/*` (use Internal API)

### storage

- **Path:** `src/modules/storage/`
- **Routes legacy:** `src/routes/fileStorage.routes.ts`, `src/routes/fileFolder.routes.ts`
- **Allowed deps:** `shared/*`
- **Forbidden deps:** all other modules (use Internal API)

### analytics

- **Path:** `src/modules/analytics/`
- **Allowed deps:** `shared/*`
- **Forbidden deps:** all other modules (use Internal API)

### notifications

- **Path:** `src/modules/notifications/`
- **Allowed deps:** `shared/*`
- **Forbidden deps:** all other modules (use Internal API)

## Shared Layer

- **Path:** `src/shared/`
- **Description:** Cross-cutting concerns available to all modules
- **Contains:** events, feature-flags, database, cache, auth, internal-api, middleware, engines
- **Rule:** shared/ must NEVER import from any module

## Cross-Module Communication

Modules communicate exclusively through:

1. **Internal API Registry** (`src/shared/internal-api/`) — synchronous calls
2. **Event Bus** (`src/shared/events/`) — asynchronous events
3. **Feature Flags** (`src/shared/feature-flags/`) — runtime toggles

Direct imports between modules are **forbidden** and enforced by ESLint.
