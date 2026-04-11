# API v1 → v2 Endpoint Mapping

> **Sunset date**: 2026-09-01
> **Legacy routes**: Feature-flag gated in `src/routes/index.ts`
> **Status legend**: ✅ migrated | 🔄 in-progress | ❌ no v2 yet

---

## Auth & Users (`legacy_auth_routes`)

| v1 Endpoint | v2 Endpoint | Status |
|-------------|-------------|--------|
| `/api/v1/auth/*` | `/api/v2/core/auth/*` | ✅ |
| `/api/v1/users/*` | `/api/v2/core/users/*` | ✅ |
| `/api/v1/teams/*` | `/api/v2/core/teams/*` | ✅ |
| `/api/v1/employees/*` | `/api/v2/core/users/*` | ✅ |
| `/api/v1/pm/auth/*` | `/api/v2/core/auth/*` | ✅ |
| `/api/v1/pm/teams/*` | `/api/v2/core/teams/*` | ✅ |
| `/api/v1/pm/organizations/*` | `/api/v2/core/organizations/*` | ✅ |

## OPS (`legacy_ops_routes`)

| v1 Endpoint | v2 Endpoint | Status |
|-------------|-------------|--------|
| `/api/v1/tasks/*` | `/api/v2/ops/work-orders/*` | ✅ |
| `/api/v1/categories/*` | `/api/v2/ops/categories/*` | ✅ |
| `/api/v1/inventory/*` | `/api/v2/ops/inventory/*` | ✅ |
| `/api/v1/assets/*` | `/api/v2/ops/assets/*` | ✅ |

## ITSM (`legacy_itsm_v1_routes`)

| v1 Endpoint | v2 Endpoint | Status |
|-------------|-------------|--------|
| `/api/v1/service-requests/*` | `/api/v2/itsm/requests/*` | ✅ |
| `/api/v1/incidents/*` | `/api/v2/itsm/incidents/*` | ✅ |
| `/api/v1/problems/*` | `/api/v2/itsm/problems/*` | ✅ |
| `/api/v1/changes/*` | `/api/v2/itsm/changes/*` | ✅ |
| `/api/v1/knowledge/*` | `/api/v2/itsm/knowledge/*` | ✅ |

## Workflows (`legacy_workflow_routes`)

| v1 Endpoint | v2 Endpoint | Status |
|-------------|-------------|--------|
| `GET    /api/v1/workflows` | `GET    /api/v2/workflow-engine/definitions` | ✅ |
| `GET    /api/v1/workflows/:id` | `GET    /api/v2/workflow-engine/definitions/:id` | ✅ |
| `POST   /api/v1/workflows` | `POST   /api/v2/workflow-engine/definitions` | ✅ |
| `PUT    /api/v1/workflows/:id` | `PUT    /api/v2/workflow-engine/definitions/:id` | ✅ |
| `DELETE  /api/v1/workflows/:id` | `DELETE  /api/v2/workflow-engine/definitions/:id` | ✅ |
| `PATCH  /api/v1/workflows/:id/publish` | `POST   /api/v2/workflow-engine/definitions/:id/publish` | ✅ |
| `PATCH  /api/v1/workflows/:id/archive` | `DELETE  /api/v2/workflow-engine/definitions/:id` | ✅ |

## Misc (`legacy_misc_routes`)

| v1 Endpoint | v2 Endpoint | Status |
|-------------|-------------|--------|
| `/api/v1/reports/*` | `/api/v2/analytics/reports/*` | ✅ |
| `/api/v1/kpi/*` | `/api/v2/analytics/kpis` | ✅ |
| `/api/v1/performance/*` | `/api/v2/analytics/performance/*` | ✅ |
| `/api/v1/leaderboard/*` | `/api/v2/analytics/leaderboard` | ❌ |
| `/api/v1/ratings/*` | — | ❌ |
| `/api/v1/alerts/*` | — | ❌ |
| `/api/v1/leave-requests/*` | — | ❌ |

## PM (no legacy flag — mounted directly under v2)

| v1 Endpoint | v2 Endpoint | Status |
|-------------|-------------|--------|
| `/api/v1/pm/projects/*` | `/api/v2/pm/projects/*` | ✅ |
| `/api/v1/pm/sprints/*` | `/api/v2/pm/sprints/*` | ✅ |
| `/api/v1/pm/boards/*` | `/api/v2/pm/boards/*` | ✅ |
| `/api/v1/pm/tasks/*` | `/api/v2/pm/tasks/*` | ✅ |

## File Storage

| v1 Endpoint | v2 Endpoint | Status |
|-------------|-------------|--------|
| `/api/v1/files/*` | `/api/v2/storage/files/*` | ✅ |
| `/api/v1/folders/*` | `/api/v2/storage/folders/*` | ✅ |

## Forms

| v1 Endpoint | v2 Endpoint | Status |
|-------------|-------------|--------|
| `/api/v1/forms/*` | `/api/v2/forms/*` | ✅ |

---

## v2 Module Prefixes (canonical)

| Module | Prefix | Feature Flag |
|--------|--------|-------------|
| Core (auth, users, orgs, teams) | `/api/v2/core` | — |
| ITSM (incidents, changes, problems, CMDB, catalog, requests) | `/api/v2/itsm` | `itsm_module_enabled` |
| PM (projects, tasks, sprints, boards) | `/api/v2/pm` | `pm_module_enabled` |
| Workflow Engine (definitions, instances, external tasks) | `/api/v2/workflow-engine` | `workflow_engine_enabled` |
| SLA (policies, calendars, ticket-sla, reports) | `/api/v2/sla` | `sla_module_enabled` |
| Analytics (reports, KPIs, performance, dashboards) | `/api/v2/analytics` | — |
| Notifications | `/api/v2/notifications` | — |
| Forms (templates, submissions) | `/api/v2/forms` | — |
| Storage (files, folders) | `/api/v2/storage` | — |
| OPS (work-orders, assets, inventory, categories) | `/api/v2/ops` | — |
