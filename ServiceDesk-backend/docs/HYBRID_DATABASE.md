# Hybrid Database Strategy

ServiceDesk uses a **hybrid database** approach: PostgreSQL for transactional/relational data, MongoDB for flexible document-oriented content. Each module can independently choose its backend via environment variables.

## Configuration

```bash
# Per-module database strategy (mongodb | postgresql)
DB_STRATEGY_ITSM=mongodb
DB_STRATEGY_PM=mongodb
DB_STRATEGY_FORMS=mongodb
DB_STRATEGY_WORKFLOW=mongodb
DB_STRATEGY_PLATFORM=mongodb
DB_STRATEGY_ANALYTICS=mongodb

# PostgreSQL connection (required when any module = postgresql)
POSTGRES_URL=postgresql://servicedesk:servicedesk123@localhost:5432/servicedesk
```

Set any `DB_STRATEGY_*` to `postgresql` to switch that module. All modules default to `mongodb`.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  Controller                      │
│                                                  │
│   if (isXxxPostgres()) {                        │
│     // PG repo path                             │
│   } else {                                       │
│     // Mongoose model path                      │
│   }                                              │
└──────────┬──────────────────┬───────────────────┘
           │                  │
    ┌──────▼──────┐    ┌──────▼──────┐
    │  PG Repos   │    │  Mongoose   │
    │  (SQL)      │    │  Models     │
    └──────┬──────┘    └──────┬──────┘
           │                  │
    ┌──────▼──────┐    ┌──────▼──────┐
    │ PostgreSQL  │    │  MongoDB    │
    └─────────────┘    └─────────────┘
```

## Module Inventory

| Module | Env Var | PG Tables | PG Repos | Factory |
|--------|---------|-----------|----------|---------|
| **Platform** | `DB_STRATEGY_PLATFORM` | `users`, `teams`, `organizations` | `PgUserRepository`, `PgTeamRepository`, `PgOrganizationRepository` | — (shared/database/repositories) |
| **ITSM** | `DB_STRATEGY_ITSM` | `itsm_service_catalog`, `itsm_service_requests`, `itsm_configuration_items`, `itsm_ci_relationships`, `itsm_automation_rules`, `itsm_rule_execution_logs` | 6 PG repos | `ItsmRepositoryFactory` |
| **PM** | `DB_STRATEGY_PM` | `pm_projects`, `pm_tasks`, `pm_sprints` | `PgProjectRepository`, `PgTaskRepository`, `PgSprintRepository` | `PmRepositoryFactory` |
| **Workflow** | `DB_STRATEGY_WORKFLOW` | `wf_instances`, `wf_events`, `wf_external_tasks` | `PgWfInstanceRepository`, `PgWfEventRepository`, `PgWfExternalTaskRepository` | `WfRepositoryFactory` |
| **Analytics** | `DB_STRATEGY_ANALYTICS` | `analytics_task_snapshots`, `analytics_daily_kpi_snapshots`, `analytics_event_log` | `PgTaskSnapshotRepository`, `PgDailyKPISnapshotRepository`, `PgEventLogRepository` | `AnalyticsRepositoryFactory` |
| **Forms** | `DB_STRATEGY_FORMS` | — | — (not yet migrated) | — |
| **Storage** | `DB_STRATEGY_STORAGE` | — | — (not yet migrated) | — |

## ID Strategy

- **PostgreSQL** tables use `UUID PRIMARY KEY DEFAULT uuid_generate_v4()`
- **Platform tables** include a `mongo_id VARCHAR(24)` column for migration from existing ObjectId references
- **ITSM/PM/WF/Analytics** tables use `VARCHAR(50)` for foreign key references (accepts both UUID and ObjectId strings)
- **No global ID migration** is required — PG repos accept string IDs and the DDL handles generation

## Repository Pattern

Each module follows the same pattern:

```
src/modules/<module>/infrastructure/repositories/
├── Pg<Entity>Repository.ts      # PostgreSQL implementation
├── <Module>RepositoryFactory.ts  # Factory returning PG or Mongo repos
└── index.ts                      # Barrel export
```

### Factory Pattern

```typescript
import { getDatabaseType } from '../../../../shared/database/DatabaseStrategy';

export function isXxxPostgres(): boolean {
  return getDatabaseType('<module>') === 'postgresql';
}

export function getXxxRepos(): XxxRepositories {
  if (_cached) return _cached;
  _cached = { /* instantiate PG repos */ };
  return _cached;
}
```

### Controller Dual-Path

```typescript
export async function listItems(req, res) {
  // ── PostgreSQL path ──
  if (isXxxPostgres()) {
    const repo = getXxxRepos().items;
    const result = await repo.search(filters, page, limit);
    return res.json({ success: true, data: result });
  }

  // ── MongoDB path ──
  const items = await MongoModel.find(query).skip(skip).limit(limit);
  return res.json({ success: true, data: items });
}
```

## PostgreSQL DDL

All table definitions live in `scripts/pg-init/01-schema.sql`. This script runs automatically on first PostgreSQL container boot.

## Connection Management

- **Pool**: `shared/database/PostgresConnectionManager.ts` — singleton `Pool` with max 20 connections
- **Startup**: `server.ts` calls `connectPostgres()` if `isPostgresRequired()` returns true
- **Shutdown**: `disconnectPostgres()` called on SIGTERM/SIGINT
- **Base class**: `shared/database/PostgresRepository.ts` — generic CRUD with camelCase↔snake_case mapping

## Design Decisions

1. **Workflow Definitions stay in MongoDB** — heavily nested JSONB (states, transitions, guards, actions, SLA rules) is design-time content better suited for document storage
2. **Analytics uses JSONB for distribution maps** — `by_type`, `by_priority`, `by_status` columns in `analytics_daily_kpi_snapshots` use JSONB with atomic increment operations
3. **External task locking uses `FOR UPDATE SKIP LOCKED`** — PostgreSQL row-level locking for concurrent worker fetch-and-lock
4. **CQRS read models have dual-path projectors** — analytics projectors write to PG or Mongo based on strategy; dashboard services read from the corresponding backend
5. **No cross-module PG transactions** — each module manages its own data independently
