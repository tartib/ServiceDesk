# Legacy v1 Routes — Migration Plan

**Sunset Date:** 2026-09-01

All legacy v1 routes now include `Sunset` and `Deprecation` response headers. Each route group is independently toggleable via feature flags.

## Feature Flags

| Flag | Default | Controls |
|---|---|---|
| `legacy_v1_routes_enabled` | `true` | Master switch — disables ALL legacy routes |
| `legacy_auth_routes` | `true` | `/api/v1/auth`, `/api/v1/users`, `/api/v1/teams`, `/api/v1/employees` |
| `legacy_ops_routes` | `true` | `/api/v1/tasks`, `/api/v1/categories`, `/api/v1/inventory`, `/api/v1/assets` |
| `legacy_itsm_v1_routes` | `true` | `/api/v1/service-requests`, `/api/v1/incidents`, `/api/v1/problems`, `/api/v1/changes`, `/api/v1/slas`, `/api/v1/releases`, `/api/v1/service-catalog` + `/api/v2/itsm` (legacy) |
| `legacy_forms_routes` | `true` | `/api/v2/forms/templates`, `/api/v2/forms/submissions` |
| `legacy_files_routes` | `true` | `/api/v1/files`, `/api/v1/folders`, `/api/v1/workflows` |
| `legacy_misc_routes` | `true` | `/api/v1/knowledge`, `/api/v1/reports`, `/api/v1/kpi`, `/api/v1/alerts`, `/api/v1/performance`, `/api/v1/leaderboard`, `/api/v1/ratings`, `/api/v1/leave-requests` |

## Migration Status

| Legacy Route | v2 Module Equivalent | Status |
|---|---|---|
| `/api/v1/service-requests` | `modules/itsm` → `/api/v2/itsm/service-requests` | ✅ Migrated |
| `/api/v1/incidents` | `modules/itsm` → `/api/v2/itsm/incidents` (via presentation) | ⚠️ Dual-running |
| `/api/v1/problems` | `modules/itsm` → `/api/v2/itsm/problems` (via presentation) | ⚠️ Dual-running |
| `/api/v1/changes` | `modules/itsm` → `/api/v2/itsm/changes` (via presentation) | ⚠️ Dual-running |
| `/api/v1/slas` | `modules/itsm` → `/api/v2/itsm/slas` (via presentation) | ⚠️ Dual-running |
| `/api/v1/releases` | `modules/itsm` → `/api/v2/itsm/releases` (via presentation) | ⚠️ Dual-running |
| `/api/v1/service-catalog` | `modules/itsm` → `/api/v2/itsm/catalog` | ✅ Migrated |
| `/api/v1/auth` | — | 🔴 No v2 equivalent yet |
| `/api/v1/users` | — | 🔴 No v2 equivalent yet |
| `/api/v1/teams` | — | 🔴 No v2 equivalent yet |
| `/api/v1/employees` | — | 🔴 No v2 equivalent yet |
| `/api/v1/tasks` | — | 🔴 No v2 equivalent yet |
| `/api/v1/categories` | — | 🔴 No v2 equivalent yet |
| `/api/v1/inventory` | — | 🔴 No v2 equivalent yet |
| `/api/v1/assets` | — | 🔴 No v2 equivalent yet |
| `/api/v1/knowledge` | — | 🔴 No v2 equivalent yet |
| `/api/v1/reports` | — | 🔴 No v2 equivalent yet |
| `/api/v1/kpi` | `modules/analytics` | ⚠️ Partial |
| `/api/v1/performance` | `modules/analytics` | ⚠️ Partial |
| `/api/v1/files` | `modules/storage` | ⚠️ Partial |
| `/api/v1/folders` | `modules/storage` | ⚠️ Partial |
| `/api/v2/forms/*` | `modules/forms` | ⚠️ Partial |
| `/api/v1/leave-requests` | — | 🔴 No v2 equivalent yet |
| `/api/v1/leaderboard` | — | 🔴 No v2 equivalent yet |
| `/api/v1/ratings` | — | 🔴 No v2 equivalent yet |
| `/api/v1/alerts` | — | 🔴 No v2 equivalent yet |

## How to Disable

### Disable all legacy routes (production cutover)

Set in `.env` or Feature Flags admin UI:
```
legacy_v1_routes_enabled = false
```

### Disable one group

```
legacy_ops_routes = false    # disables tasks, categories, inventory, assets
```

### Response Headers

All legacy responses include:
```
Sunset: Mon, 01 Sep 2026 00:00:00 GMT
Deprecation: true
Link: </api/v2>; rel="successor-version"
```
