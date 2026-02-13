# System Architecture - Methodology-Driven Project Manager

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                           │
│  Web App (React) │ Mobile (RN) │ Desktop │ API Clients   │
└──────────────────────────┬───────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────┐
│                    API GATEWAY                            │
│  Rate Limiting │ Auth │ Load Balancing │ Caching         │
└──────────────────────────┬───────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────┐
│                 MICROSERVICES LAYER                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌────────────┐  │
│  │ Methodology     │ │ Workflow        │ │ Roadmap    │  │
│  │ Config Engine   │ │ Engine          │ │ Engine     │  │
│  └─────────────────┘ └─────────────────┘ └────────────┘  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌────────────┐  │
│  │ Project Service │ │ Task Service    │ │ Board Svc  │  │
│  └─────────────────┘ └─────────────────┘ └────────────┘  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌────────────┐  │
│  │ User/Team Svc   │ │ Notification    │ │ Analytics  │  │
│  └─────────────────┘ └─────────────────┘ └────────────┘  │
└──────────────────────────┬───────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────┐
│                    DATA LAYER                             │
│  MongoDB │ Redis (Cache) │ Elasticsearch │ S3 (Files)    │
└──────────────────────────┬───────────────────────────────┘
                           │
┌──────────────────────────▼───────────────────────────────┐
│                 MESSAGE QUEUE / EVENT BUS                 │
│              RabbitMQ / Kafka / Redis Streams             │
└──────────────────────────────────────────────────────────┘
```

## Core Engines

### 1. Methodology Configuration Engine

**Purpose:** Manages methodology profiles and generates default configurations.

**Components:**
- **Methodology Registry** - Stores Agile/Scrum, Kanban, Waterfall, ITIL, Lean, OKR profiles
- **Configuration Generator** - Creates workflows, statuses, fields, boards, reports
- **Template Library** - Pre-configured templates per methodology

**Responsibilities:**
- Store and manage methodology profiles
- Generate default configurations when methodology selected
- Provide customization APIs
- Validate methodology-specific constraints
- Support hybrid methodology configurations

### 2. Dynamic Workflow Engine

**Components:**
- **Workflow Definition Layer** - States, Transitions, Conditions, Actions, Validators
- **Workflow Execution Layer** - State Machine Manager, Transition Executor, Automation Triggers
- **Rules & Automation Layer** - Condition Evaluator, Action Executor, Webhook Dispatcher

**Capabilities:**
- Define states with entry/exit actions
- Configure transitions with guards and conditions
- Support parallel states and sub-workflows
- Trigger automations on state changes
- Validate transitions based on methodology rules

### 3. Roadmap Engine

**Components:**
- **Roadmap Type Selector** - Sprint-based, Flow-based, Gantt, Calendar, Timeline
- **Computation Engine** - Dependency Resolver, Critical Path Calculator, Resource Allocator
- **Visualization Renderer** - Chart.js, D3.js, Custom renderers

## Role & Permission Model

### Organization Level
| Role | Description |
|------|-------------|
| Owner | Full control over organization |
| Admin | Manage all projects and users |
| Member | View and edit assigned items |

### Project Level
| Role | Description |
|------|-------------|
| Project Lead | Full project control |
| Project Manager | Manage workflows and team |
| Team Member | Create and edit tasks |
| Viewer | Read-only access |

### Methodology-Specific Roles

**Scrum:**
- Product Owner
- Scrum Master
- Dev Team

**ITIL:**
- Change Manager
- CAB Member
- Requestor
- Implementer

**Waterfall:**
- Project Manager
- Phase Lead
- Team Member

### Permission Matrix

| Permission | Owner | Admin | Lead | Manager | Member | Viewer |
|------------|-------|-------|------|---------|--------|--------|
| Create Project | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Delete Project | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Configure Methodology | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Manage Workflows | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Create Tasks | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Edit Tasks | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| Delete Tasks | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| View Roadmap | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Edit Roadmap | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| Manage Team | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |

## Project Structure Hierarchy

```
Organization
    └── Teams
         └── Projects
              ├── Methodology Config
              ├── Workflow Config
              ├── Roadmap Config
              └── Epics
                   └── Stories
                        └── Tasks/Subtasks
```

## Technology Stack

### Backend
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js / NestJS
- **Database:** MongoDB (primary), Redis (cache)
- **Search:** Elasticsearch
- **Queue:** RabbitMQ / Redis Streams
- **Storage:** S3 / MinIO

### Frontend
- **Framework:** React 18+ with TypeScript
- **State:** Zustand / Redux Toolkit
- **UI:** TailwindCSS + shadcn/ui
- **Charts:** Chart.js, D3.js
- **Drag & Drop:** @dnd-kit

### Infrastructure
- **Container:** Docker + Kubernetes
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana
- **Logging:** ELK Stack
