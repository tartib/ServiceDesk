# Modular Monolith — Module Map

## Directory Layout

```text
src/
├── modules/                  # Domain modules (self-contained verticals)
│   ├── itsm/                 # IT Service Management
│   │   ├── contracts/        # Internal API facade (ItsmApi)
│   │   ├── controllers/      # Application layer — Express handlers
│   │   ├── domain/           # Domain interfaces & enums (DB-agnostic)
│   │   ├── infrastructure/   # Repository implementations (MongoRepository)
│   │   │   └── repositories/
│   │   ├── models/           # Mongoose schemas & models
│   │   └── routes/
│   ├── pm/                   # Project Management
│   │   ├── contracts/        # Internal API facade (PmApi)
│   │   ├── controllers/
│   │   ├── domain/           # Domain interfaces & enums
│   │   ├── infrastructure/   # Repository implementations
│   │   │   └── repositories/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   ├── workflow-engine/      # Generic BPMN Workflow Engine
│   │   ├── contracts/        # Internal API facade + Local/Remote Client Factory
│   │   ├── controllers/
│   │   ├── domain/           # Domain interfaces
│   │   ├── engine/           # Core engine (guards, actions, timers, parallel)
│   │   ├── infrastructure/   # Repository implementations
│   │   │   └── repositories/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   ├── forms/                # Smart Forms
│   │   ├── domain/           # Service interfaces
│   │   └── services/
│   ├── storage/              # File Storage & Prep Tasks
│   │   ├── domain/           # Service interfaces
│   │   └── services/
│   ├── analytics/            # Dashboard Analytics
│   │   ├── domain/           # Service interfaces
│   │   └── services/
│   └── index.ts              # Module registry + Internal API registration
│
├── shared/                   # Shared Kernel (cross-cutting, no business logic)
│   ├── auth/                 # RBAC/ABAC permission types & policies
│   ├── contracts/            # Base entity contracts, API response types
│   ├── database/             # Repository abstraction (IRepository, MongoRepository, DatabaseStrategy)
│   ├── events/               # Kafka event bus, publishers, consumers
│   │   ├── consumers/
│   │   └── publishers/
│   ├── feature-flags/        # Feature flag system (types, service, middleware, REST API)
│   ├── internal-api/         # Internal API registry + module facade interfaces
│   ├── middleware/            # Deprecation, CSRF, validation
│   └── cache/                # Redis cache manager
│
├── integrations/             # External system adapters (Adapter Pattern)
│   ├── channels/             # Email, Slack, Teams
│   ├── devops/               # GitHub, GitLab, CI/CD
│   ├── monitoring/           # Alert webhooks, Heartbeat
│   └── services/             # Webhook service
│
├── infrastructure/           # DI container, middleware wiring
│   └── di/
│
├── core/                     # Domain-agnostic engines & types
│   ├── auth/                 # Authorization engine
│   ├── engines/              # Approval engine, auto-assignment
│   ├── entities/             # Mongoose models for forms
│   └── types/                # Workflow engine types, smart form types
│
├── middleware/               # Express middleware (auth, rate-limit, XSS, etc.)
├── models/                   # Shared/legacy Mongoose models (User, FeatureFlag, etc.)
├── routes/                   # Legacy v1 routes (non-modularized)
├── services/                 # Legacy services (non-modularized)
├── utils/                    # Logger, ApiError, metrics, permissions
├── config/                   # Env, DB, MinIO, Swagger, Socket
├── jobs/                     # Cron/timer jobs
├── app.ts                    # Express app setup, middleware, route mounting
└── server.ts                 # HTTP server, DB connect, event bus, graceful shutdown
```

## Module Internal Layering

Each module follows a clean architecture with three layers:

```text
┌─────────────────────────────────────────┐
│  contracts/   — Public API facade       │  ← Other modules consume THIS
│               (implements IXxxApi)       │
├─────────────────────────────────────────┤
│  controllers/ — Application layer       │  ← Express route handlers
│  routes/      — HTTP route definitions  │
├─────────────────────────────────────────┤
│  domain/      — Domain interfaces       │  ← Pure types, no DB dependency
│               — Enums, value objects     │
├─────────────────────────────────────────┤
│  infrastructure/                        │
│    └── repositories/                    │  ← MongoRepository implementations
│  models/      — Mongoose schemas        │  ← Persistence (swappable via strategy)
│  services/    — Business logic          │
└─────────────────────────────────────────┘
```

**Dependency direction within a module:**
- `contracts/` → `models/`, `services/`
- `controllers/` → `models/`, `services/`
- `infrastructure/repositories/` → `models/`, `shared/database/`
- `domain/` → nothing (pure interfaces)

## Module Boundaries

### Rules

1. **Modules MUST NOT import from other modules' internals.**
   - ✅ `import { InternalApiRegistry } from 'shared/internal-api'` then `registry.get<IItsmApi>('itsm')`
   - ✅ `import { ServiceCatalog } from '../itsm/models'` (via barrel export, within same module only)
   - ❌ `import { createRequest } from '../itsm/controllers/serviceRequest.controller'`

2. **Cross-module communication goes through:**
   - The **Internal API Registry** (`shared/internal-api/`) for synchronous calls
   - The **Kafka event bus** (`shared/events/`) for async events
   - **Shared contracts** (`shared/contracts/`) for common types
   - The **DI container** (`infrastructure/di/`) for service injection

3. **Feature flags** gate module routes at runtime via `featureGate()` middleware. Admin API at `/api/v2/admin/feature-flags`.

4. **Shared Kernel** (`src/shared/`) is read-only for modules — modules consume but never modify shared code.

5. **Legacy code** in `src/routes/`, `src/controllers/`, `src/services/` is gradually migrated into modules. New features MUST go into a module.

6. **Database strategy** is per-module via `DB_STRATEGY_*` env vars. Today all modules use MongoDB. When PostgreSQL is added, only `shared/database/DatabaseStrategy.ts` and a new `PgRepository` are needed.

### Dependency Direction

```text
modules/* ──→ shared/*
modules/* ──→ core/*
modules/* ──→ infrastructure/di
modules/* ──→ middleware/*
modules/* ──→ models/* (shared models like User)
modules/* ──→ utils/*
modules/* ──→ config/*

modules/* ──✗──→ modules/*  (no direct cross-module imports)
shared/*  ──✗──→ modules/*  (shared never depends on modules)
```

### ESLint Enforcement

`.eslintrc.json` warns on:
- Importing module controllers, engine, services from outside the module
- Importing module infrastructure or domain internals from outside
- Importing module models directly from outside (use Internal API instead)

## Module Registry

Modules register themselves in `src/modules/index.ts`:

```typescript
import { registerModules } from './modules';
registerModules(app); // mounts all module routers + registers Internal APIs
```

Each module declares: `name`, `prefix`, `requiresAuth`, `featureFlag`, and a `router()` factory.

After route mounting, `registerInternalApis()` instantiates each module's facade and registers it in the `InternalApiRegistry`.

## Feature Flags

Feature flags are managed via:
- **Backend:** `shared/feature-flags/` (types, service, middleware, REST API)
- **Model:** `models/FeatureFlag.ts` (MongoDB persistence)
- **Admin API:** `GET/PATCH/POST /api/v2/admin/feature-flags`
- **Frontend:** `app/(dashboard)/feature-flags/page.tsx`
- **Middleware:** `featureGate(flagName)` — gates module routes per-request

## Workflow Engine Extraction Prep

The workflow engine is prepared for future extraction as a standalone microservice:

- **`WORKFLOW_ENGINE_MODE`** env var: `local` (default) or `remote`
- **`WorkflowEngineClientFactory`** returns `LocalClient` (in-process) or future `RemoteClient` (HTTP/gRPC)
- Consumers use `getWorkflowEngineClient()` — transparent whether engine is local or remote
- All workflow domain interfaces are in `workflow-engine/domain/`

## Hybrid Database Strategy

Each module can be configured to use a different database:

```env
DB_STRATEGY_ITSM=mongodb       # or postgresql (future)
DB_STRATEGY_PM=mongodb
DB_STRATEGY_FORMS=mongodb
DB_STRATEGY_WORKFLOW=mongodb
```

- **`shared/database/IRepository`** — generic repository interface
- **`shared/database/MongoRepository`** — MongoDB implementation (current)
- **`shared/database/DatabaseStrategy`** — factory that returns the right implementation per module
- Future: add `PgRepository` implementing `IRepository` for PostgreSQL support
