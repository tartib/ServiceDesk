# ServiceDesk - IT Service Management

A comprehensive ITSM and project management platform with incident, problem, change, and service request management, project boards, workflow automation, and multi-domain architecture.

## Features

### ITSM Module
- **Incident Management**: Create, assign, escalate, and resolve incidents with SLA tracking
- **Problem Management**: Root cause analysis, known error database, recurring problem detection
- **Change Management**: Change requests, CAB approval workflow, scheduling, and calendar view
- **Service Catalog & Requests**: Self-service portal, request fulfillment, approval chains
- **CMDB**: Configuration item tracking with relationships and type counts
- **Automation Rules**: Event-driven automation with execution logging

### Project Management
- **Scrum/Kanban Boards**: Drag-and-drop task boards with sprint management
- **Task Management**: Project-scoped tasks with story points, labels, subtasks, and transitions
- **Intake Pipeline**: Scored intake requests with prioritization
- **Planning Poker**: Real-time estimation sessions via WebSocket

### Platform
- **Role-Based Access**: ITSM RBAC/ABAC (admin, manager, technician, end_user) + PM project roles
- **Real-time Updates**: Shared WebSocket connection (singleton) for live ITSM and project events
- **Dashboard Analytics**: ITSM dashboard with incident trends, SLA compliance, split loading states
- **Reports & Analytics**: Unified ITSM/PM analytics with tabbed interface (incident volume, SLA, velocity, sprints)
- **Agent Console**: Unified queue view for incidents and service requests
- **Workflow Builder**: Visual BPMN workflow editor with ReactFlow
- **Multilingual**: English/Arabic (i18n) via LanguageContext
- **Gamification**: Achievements, leaderboards, and admin controls
- **Campaigns**: Campaign management with templates, segments, triggers, and analytics

### User Roles
- **Admin/Manager**: Full system access including user management, reports, and system configuration
- **Technician/Agent**: Incident handling, task management, service request fulfillment
- **End User**: Self-service portal, submit and track requests

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **State Management**: Zustand + TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios (dual clients: `authAxios` for auth, `api` for all other calls)
- **Real-time**: Socket.io-client (shared singleton connection)
- **Virtualization**: @tanstack/react-virtual for large lists
- **Icons**: Lucide React
- **Date/Time**: date-fns
- **DnD**: @dnd-kit for board drag-and-drop

## Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ServiceDesk-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Create a `.env.local` file in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v2
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
ServiceDesk-app/
├── app/
│   ├── (auth)/              # Login, register
│   ├── (dashboard)/         # All protected pages
│   │   ├── itsm-dashboard/  # ITSM overview with split loading
│   │   ├── agent-console/   # Unified incident + SR queue
│   │   ├── incidents/       # Incident list, detail, create
│   │   ├── changes/         # Change management
│   │   ├── projects/        # PM boards, backlog, settings
│   │   ├── workflow-builder/ # Visual BPMN editor
│   │   ├── self-service/    # End-user service catalog
│   │   ├── cmdb/            # Configuration items
│   │   ├── reports/         # Unified ITSM/PM analytics + legacy reports
│   │   ├── campaigns/       # Campaign management
│   │   ├── gamification/    # Achievements, leaderboard
│   │   └── ...
│   ├── layout.tsx           # Root layout with providers
│   └── page.tsx             # Auth redirect
├── components/
│   ├── dashboard/           # StatCard (memoized), charts
│   ├── layout/              # Header, Sidebar, DashboardLayout
│   ├── projects/            # TaskCard, DraggableTaskCard, ProjectCard (all memoized)
│   ├── workflow-builder/    # BPMN nodes, panels
│   ├── providers/           # QueryProvider (staleTime: 60s, refetchOnWindowFocus: false)
│   └── ui/                  # shadcn/ui components
├── hooks/                   # React Query hooks with key factories
│   ├── useAuth.ts           # Auth hooks (/core/auth/*)
│   ├── useIncidents.ts      # incidentKeys factory + setQueryData mutations
│   ├── useProblems.ts       # problemKeys factory + setQueryData mutations
│   ├── useChanges.ts        # changeKeys factory + setQueryData mutations
│   ├── useServiceRequests.ts # requestKeys factory
│   ├── useReports.ts        # reportKeys factory + ITSM/PM analytics hooks
│   ├── useTasks.ts          # PM tasks (project-scoped)
│   ├── useSocket.ts         # Shared socket hooks (useITSMSocket, usePortfolioSocket, etc.)
│   └── ...
├── lib/
│   ├── axios.ts             # Main API client (baseURL: /api/v2)
│   ├── api/auth-client.ts   # Auth Axios client (baseURL: /api, Bearer + CSRF)
│   ├── api/auth-service.ts  # Login, logout, register, refresh
│   ├── socket.ts            # Ref-counted WebSocket singleton
│   └── utils.ts
├── store/                   # Zustand stores (auth, UI, notifications)
├── contexts/                # LanguageContext (i18n)
├── types/                   # TypeScript interfaces
└── tests/
    ├── contracts/           # API contract tests (auth, tasks, ITSM, catalog, reports)
    ├── e2e/                 # Playwright E2E tests (incidents, reports, projects)
    └── ...
```

## Authentication Flow

1. User lands on `/` — redirects to `/login` or dashboard based on auth state
2. Login/register via `authAxios` to `/api/v2/core/auth/*`
3. CSRF token fetched before login; JWT + refresh token stored in localStorage
4. All API calls include Bearer token via axios interceptor
5. Token refresh handled automatically on 401 responses
6. Role-based route protection via `ProtectedRoute` component

## API Integration

### Authentication (`/api/v2/core/auth/*`)
- `POST /api/v2/core/auth/login` — User login (CSRF-protected)
- `POST /api/v2/core/auth/register` — Register new user
- `POST /api/v2/core/auth/logout` — Logout + clear CSRF
- `POST /api/v2/core/auth/refresh` — Refresh JWT token
- `GET /api/v2/core/auth/me` — Get current user
- `PATCH /api/v2/core/auth/profile` — Update profile
- `PATCH /api/v2/core/auth/password` — Change password

### ITSM (`/api/v2/itsm/*`)
- `GET/POST /api/v2/itsm/incidents` — List/create incidents
- `GET/PATCH /api/v2/itsm/incidents/:id` — Get/update incident
- `GET/POST /api/v2/itsm/problems` — List/create problems
- `GET/POST /api/v2/itsm/changes` — List/create changes
- `GET /api/v2/itsm/service-catalog` — Service catalog
- `GET/POST /api/v2/itsm/service-requests` — Service requests
- `GET /api/v2/itsm/cmdb/config-items` — CMDB items

### Tasks (project-scoped)
- `GET /api/v2/projects/:projectId/tasks` — List tasks (supports `?dueDate`, `?assignee=me`, `?status`)
- `POST /api/v2/projects/:projectId/tasks` — Create task
- `GET /api/v2/tasks/:id` — Get task details
- `POST /api/v2/tasks/:id/transition` — Start/complete a task

### Analytics (`/api/v2/analytics/*`)
- `GET /api/v2/analytics/itsm/summary` — ITSM KPIs (incidents, SLA, problems, changes)
- `GET /api/v2/analytics/itsm/incident-trend?days=14` — Incident volume trend
- `GET /api/v2/analytics/itsm/sla-trend?days=30` — SLA compliance trend
- `GET /api/v2/analytics/pm/summary` — PM KPIs (projects, tasks, sprints, story points)
- `GET /api/v2/analytics/pm/velocity-trend?limit=10` — Sprint velocity trend
- `GET /api/v2/analytics/reports/dashboard` — Legacy dashboard analytics
- `GET /api/v2/analytics/reports/daily` — Daily report
- `GET /api/v2/analytics/reports/weekly` — Weekly report
- `GET /api/v2/analytics/reports/monthly` — Monthly report

### Inventory
- `GET /api/v2/inventory` — List all inventory items
- `GET /api/v2/inventory/low-stock` — Get low stock items
- `PATCH /api/v2/inventory/:id/restock` — Restock item

## Performance Architecture

- **WebSocket Singleton**: Single shared, ref-counted connection in `lib/socket.ts`
- **Query Key Factories**: `incidentKeys`, `problemKeys`, `changeKeys`, `requestKeys`, `reportKeys` — all mutations use targeted invalidation
- **setQueryData**: Mutations that return updated entities update the cache directly instead of refetching
- **React.memo**: Applied to `TaskCard`, `DraggableTaskCard`, `ProjectCard`, `IntakeRequestCard`, `StatCard`
- **Split Loading**: Dashboard panels render independently (per-section skeletons)
- **Virtualization**: `VirtualTaskList` pattern using `@tanstack/react-virtual` for lists >20 items
- **React Query Defaults**: `staleTime: 60s`, `refetchOnWindowFocus: false`

## Development

```bash
npm run dev        # Development server
npm run build      # Production build
npm start          # Production server
npm run lint       # Lint code
npx vitest run     # Run tests
npx vitest run tests/contracts/  # Run contract tests only
```

## Testing

- **Contract Tests** (7 suites, 54 tests): Verify API route paths, token storage, CSRF behavior, and query key patterns
  - `tests/contracts/auth-routes.contract.test.ts` — Auth path + CSRF + token storage contracts
  - `tests/contracts/task-routes.contract.test.ts` — Project-scoped task route contracts
  - `tests/contracts/itsm-routes.contract.test.ts` — ITSM route + key factory pattern contracts
  - `tests/contracts/service-catalog.contract.test.ts` — Service catalog CRUD + invalidation
  - `tests/contracts/service-requests.contract.test.ts` — Service request routes + requestKeys factory
  - `tests/contracts/reports-analytics.contract.test.ts` — reportKeys factory + ITSM/PM/legacy route contracts
  - `tests/contracts/notification-routes.contract.test.ts` — Notification query + mutation routes
- **Unit Tests**: Hook behavior, normalization, error handling
- **E2E Tests**: Playwright tests for critical user flows
  - `tests/e2e/itsm/incident-lifecycle.spec.ts` — Full incident lifecycle (create → acknowledge → resolve)
  - `tests/e2e/itsm/service-request-lifecycle.spec.ts` — Service request lifecycle (create → approve → fulfill)
  - `tests/e2e/reports/reports-navigation.spec.ts` — Reports page tabs + analytics API endpoints

## License

This project is private and proprietary.

## Contributors

ServiceDesk Development Team
