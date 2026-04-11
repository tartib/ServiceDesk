# Setup Guide - ServiceDesk

## Quick Start

### 1. Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v2
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

**Important**: Replace `localhost:5000` with your actual backend API URL if different.

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Backend API Requirements

This frontend application requires a backend API with the following endpoints:

### Authentication Endpoints
- `POST /api/v2/core/auth/register` - Register new user
- `POST /api/v2/core/auth/login` - User login
- `POST /api/v2/core/auth/logout` - User logout
- `POST /api/v2/core/auth/refresh` - Refresh JWT token
- `GET /api/v2/core/auth/me` - Get current user info
- `PATCH /api/v2/core/auth/profile` - Update user profile
- `PATCH /api/v2/core/auth/password` - Change password

### Task Endpoints (project-scoped)
- `GET /api/v2/projects/:projectId/tasks` - List tasks for a project
  - Query params: `?dueDate=YYYY-MM-DD` (today's tasks), `?assignee=me` (my tasks), `?status=scheduled` (by status), `?product=:productId`
- `POST /api/v2/projects/:projectId/tasks` - Create a new task in a project
- `GET /api/v2/tasks/:id` - Get single task details
- `PUT /api/v2/tasks/:id` - Update task (assign, edit fields)
- `POST /api/v2/tasks/:id/transition` - Transition task status (start, complete)
  - Body: `{ statusId: 'in-progress' | 'done', comment?: string }`

### Inventory Endpoints
- `GET /api/v2/inventory` - Get all inventory items
- `GET /api/v2/inventory/low-stock` - Get low stock items
- `GET /api/v2/inventory/:id` - Get inventory item details
- `POST /api/v2/inventory` - Create inventory item
- `PATCH /api/v2/inventory/:id` - Update inventory item
- `PATCH /api/v2/inventory/:id/restock` - Restock item

## Authentication Flow

1. User registers or logs in via `/login` or `/register`
2. Backend returns user object and JWT token
3. Token is stored in localStorage
4. All subsequent API requests include the token in Authorization header: `Bearer <token>`
5. If token is invalid (401 response), user is redirected to login

## Role-Based Access

The application supports the following ITSM roles:

- **end_user**: Self-service portal — submit and track service requests
- **technician / agent**: Incident handling, task management, service request fulfillment
- **manager**: Team oversight, reporting, approvals
- **admin**: Full system access including user management and configuration

Project management uses separate project-level roles (owner, member, viewer).
Routes are protected based on these roles using the `ProtectedRoute` component and the RBAC/ABAC authorization layer.

## State Management

### Zustand Stores (Client State)
- **authStore**: User authentication and profile data
- **uiStore**: UI preferences (sidebar state, theme)
- **notificationStore**: Real-time notifications

### TanStack Query (Server State)
- Handles all API data fetching with caching
- `staleTime: 60s`, `refetchOnWindowFocus: false` (configured in `QueryProvider.tsx`)
- Query keys use factory pattern: `incidentKeys.lists()`, `problemKeys.detail(id)`, etc.
- Mutations use `setQueryData` + targeted `invalidateQueries` instead of broad collection invalidation

## Socket.io Integration (Active)

The app uses a **shared, ref-counted WebSocket singleton** (`lib/socket.ts`) for real-time features:

- `getSocket()` — returns or creates the shared connection
- `releaseSocket()` — decrements ref count; disconnects when 0
- All hooks (`useITSMSocket`, `usePortfolioSocket`, `useSelfServiceSocket`, `usePlanningPoker`) share this single connection

Events handled:
- Incident/problem/change/service-request created/updated
- Planning poker sessions
- Portfolio notifications

Ensure your backend has Socket.io running at `NEXT_PUBLIC_SOCKET_URL`.

## ITSM Endpoints

- `GET/POST /api/v2/itsm/incidents` — Incident list/create
- `GET/PATCH /api/v2/itsm/incidents/:id` — Incident detail/update
- `GET/POST /api/v2/itsm/problems` — Problem list/create
- `POST /api/v2/itsm/problems/:id/known-error` — Mark as known error
- `GET/POST /api/v2/itsm/changes` — Change list/create
- `POST /api/v2/itsm/changes/:id/cab/approve` — CAB approval
- `GET /api/v2/itsm/service-catalog` — Service catalog
- `GET/POST /api/v2/itsm/service-requests` — Service requests
- `GET /api/v2/itsm/cmdb/config-items` — CMDB items

## Query Key Conventions

All ITSM hooks export a key factory for targeted cache invalidation:

```typescript
export const incidentKeys = {
  all: ['incidents'] as const,
  lists: () => [...incidentKeys.all, 'list'] as const,
  detail: (id: string) => ['incidents', id] as const,
  stats: () => ['incidents', 'stats'] as const,
  // ...
};
```

Equivalent factories exist for `problemKeys`, `changeKeys`, and `requestKeys`.

Mutations should:
1. Call `setQueryData(keys.detail(id), updatedEntity)` for optimistic cache updates
2. Invalidate only the affected list/stat keys, never the bare collection key

## Pre-merge Checklist

Before merging, run the contract test suite to verify API route alignment:

```bash
npx vitest run tests/contracts/
```

This validates:
- Auth routes use `/v2/core/auth/*`
- Task routes are project-scoped
- ITSM mutations use targeted query key invalidation

## Development Tips

### Adding New API Endpoints

1. Define types in `types/index.ts`
2. Create React Query hooks in `hooks/` directory
3. Use hooks in components with `useQuery` or `useMutation`

Example:
```typescript
// In hooks/useNewFeature.ts
export const useNewFeature = () => {
  return useQuery({
    queryKey: ['feature'],
    queryFn: async () => {
      const response = await api.get('/feature');
      return response.data;
    },
  });
};
```

### Adding New Pages

1. Create page in `app/(dashboard)/your-page/page.tsx`
2. Wrap with `DashboardLayout` for protected routes
3. Add route to sidebar in `components/layout/Sidebar.tsx`

### Adding New Components

1. Place in appropriate directory under `components/`
2. Use existing shadcn/ui components as building blocks
3. Import utilities from `lib/utils.ts` for styling

## Troubleshooting

### "Network Error" on Login
- Check if backend API is running
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for CORS errors

### "Cannot find module" Errors
- Run `npm install` to ensure all dependencies are installed
- Check TypeScript paths in `tsconfig.json`

### Styling Not Working
- Verify TailwindCSS is configured correctly
- Check `app/globals.css` is imported in `layout.tsx`
- Run `npm run dev` to restart the dev server

## Production Build

```bash
npm run build
npm start
```

The optimized build will be created in `.next/` directory.

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Zustand State Management](https://zustand-demo.pmnd.rs)
