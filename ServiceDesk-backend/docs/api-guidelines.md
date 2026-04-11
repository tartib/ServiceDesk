# API Development Guidelines

> Canonical reference for all backend developers. Updated: 2026-04-10.

---

## 1. Authentication

Authentication is **centralized in the module registry** (`src/modules/index.ts`).

- `requiresAuth` defaults to **`true`** — every new module is authenticated by default.
- Modules with public routes (e.g., `core`, `pm`, `storage`) set `requiresAuth: false` and apply `authenticate` internally on protected sub-routers.
- **Never** import `authenticate` inside a module sub-router that inherits auth from the registry. This causes a double DB lookup per request.

### Public routes

If your module needs unauthenticated endpoints:

1. Set `requiresAuth: false` in the module descriptor.
2. Place public routes **before** `router.use(authenticate)` in the sub-router.
3. Document the public routes in the module's README.

---

## 2. Validation

### Preferred: express-validator + `handleValidation`

Use `express-validator` chains in routes with the shared `handleValidation` middleware:

```ts
import { body, param } from 'express-validator';
import { handleValidation } from '../../../shared/middleware/validate';

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
  ],
  handleValidation, // <-- catches errors before controller
  controller.create
);
```

### Alternative: Joi schemas

For complex schemas (nested objects, conditional fields), use Joi with the `validate()` middleware:

```ts
import { validate } from '../../../shared/middleware/validate';
import { createIncidentSchema } from '../../../shared/validation/schemas';

router.post('/', validate(createIncidentSchema), controller.create);
```

### Unified error format

Both systems throw `ApiError(400, 'Validation failed', { errors })` with:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "name", "message": "Name is required" },
    { "field": "email", "message": "Valid email required" }
  ]
}
```

### Migration rule

- **Do NOT** call `validationResult(req)` inside controllers. Let route-level middleware handle it.
- Existing controllers with manual `validationResult` checks will be migrated incrementally.

---

## 3. HTTP Verb Conventions

| Action | Verb | Example |
|--------|------|---------|
| Create resource | `POST` | `POST /api/v2/itsm/incidents` |
| Read resource(s) | `GET` | `GET /api/v2/itsm/incidents/:id` |
| Full update | `PUT` | `PUT /api/v2/pm/projects/:id` |
| Partial update | `PATCH` | `PATCH /api/v2/pm/tasks/:id` |
| Delete resource | `DELETE` | `DELETE /api/v2/pm/tasks/:id` |
| State transition | `PATCH` | `PATCH /api/v2/itsm/incidents/:id/status` |
| Command / action | `POST` | `POST /api/v2/workflow-engine/instances/:id/cancel` |

### Rules

- **State changes** (status transitions, activate/deactivate) → `PATCH /:id/status` or `PATCH /:id/activate`
- **Commands** (publish, archive, cancel, send) → `POST /:id/<verb>`
- **Never** use `GET` for mutations.
- **Never** use `DELETE` for soft-deletes — use `PATCH /:id/archive` instead.

---

## 4. Response Format

Use the unified response helpers from `src/utils/ApiResponse.ts`:

```ts
import { sendSuccess, sendError, sendPaginated } from '../../../utils/ApiResponse';

// Single item
sendSuccess(res, data, 'Resource created', 201);

// Paginated list
sendPaginated(res, items, total, page, limit);

// Error (prefer throwing ApiError instead)
sendError(res, 400, 'Invalid input');
```

### Envelope shape

```json
{
  "success": true,
  "message": "Resource created",
  "data": { ... }
}
```

Paginated:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5
  }
}
```

---

## 5. Naming Conventions

| Concept | Convention | Example |
|---------|-----------|---------|
| Module prefix | kebab-case | `/api/v2/workflow-engine` |
| Resource path | plural kebab-case | `/incidents`, `/work-orders` |
| URL params | camelCase | `:projectId`, `:incidentId` |
| Query params | camelCase | `?pageSize=20&sortBy=createdAt` |
| Body fields | camelCase | `{ "firstName": "John" }` |

---

## 6. Error Handling

- Wrap async handlers with `asyncHandler` from `src/utils/asyncHandler.ts`.
- Throw `ApiError` for expected errors (400, 401, 403, 404, 409).
- Let the global error handler catch unexpected errors (500).
- Never catch errors just to `res.status(500).json(...)` — let them propagate.

---

## 7. Versioning

- All new endpoints go under `/api/v2/<module>/...`.
- Legacy `/api/v1/*` routes are **frozen** and gated by feature flags.
- The `v1BlockMiddleware` returns `410 Gone` for any unregistered v1 path.
- See `docs/api-mapping.md` for the full v1 → v2 mapping.
