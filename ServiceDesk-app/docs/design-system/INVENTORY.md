# Design System Inventory

Current state of all shared UI components.

## Core Components (`components/ui/`)

| Component | File | CVA | Tone | A11y | Status |
|---|---|---|---|---|---|
| Badge | `badge.tsx` | Yes | Yes | Focus ring | Standardized |
| Button | `button.tsx` | Yes (brand CTA) | brandOutline | Focus ring, aria | Standardized |
| Card | `card.tsx` | No | — | Semantic HTML | Stable |
| Dialog | `dialog.tsx` | No | — | Focus trap, Escape | Stable |
| Dropdown Menu | `dropdown-menu.tsx` | No | — | Arrow keys, Escape | Stable |
| EmptyState | `empty-state.tsx` | No | Yes | — | Standardized |
| Input | `input.tsx` | No | — | Focus ring, label | Stable |
| Label | `label.tsx` | No | — | htmlFor | Stable |
| PriorityBadge | `priority-badge.tsx` | Yes | — | Semantic colors | Standardized |
| Select | `select.tsx` | No | — | Arrow keys | Stable |
| Separator | `separator.tsx` | No | — | role | Stable |
| Sheet | `sheet.tsx` | No | — | Focus trap | Stable |
| Sidebar | `sidebar.tsx` | No | — | Nav role | Stable |
| Skeleton | `skeleton.tsx` | No | — | aria-hidden | Stable |
| StatsCard | `stats-card.tsx` | No | Yes | Semantic HTML | Standardized |
| StatusBadge | `status-badge.tsx` | Yes | Via variant | Semantic colors | Standardized |
| Table | `table.tsx` | No | — | thead/tbody | Stable |
| Tabs | `tabs.tsx` | No | — | Arrow keys | Stable |
| Textarea | `textarea.tsx` | No | — | Focus ring | Stable |
| Toast (Sonner) | `sonner.tsx` | No | — | aria-live | Stable |
| Tooltip | `tooltip.tsx` | No | — | Hover/focus | Stable |

## Feature Components

| Area | Key Components | Status |
|---|---|---|
| Auth | LoginForm, RegisterForm | Stable |
| ITSM | IncidentForm, ProblemForm, ChangeForm | Stable |
| Projects | TaskCard, TaskKanban, SprintBoard | Stable |
| Workflow | BPMNNodes, WorkflowCanvas | Stable |
| Gamification | ProfileCard, Leaderboard | Stable |
| Settings | OrgSettings, UserProfile | Stable |
| Self-Service | RequestForm, KnowledgeBase | Stable |

## Token coverage

| Category | Tokens defined | Registered in @theme | TS constants |
|---|---|---|---|
| Semantic colors | 18 pairs | Yes | Yes |
| Brand system | 6 (brand, strong, soft, surface, border, foreground) | Yes | Yes |
| Soft tones | 5 | Yes | Yes |
| Surface colors | 4 | Yes | Yes |
| Typography | 15 | CSS only | Yes |
| Shadows | 5 | Yes | Yes |
| Motion | 4 | CSS only | Yes |
| Z-index | 8 | Yes | Yes |
| Radius | 5 | Yes | Yes |
| Chart colors | 5 | Yes | — |
| Sidebar colors | 8 | Yes | — |
