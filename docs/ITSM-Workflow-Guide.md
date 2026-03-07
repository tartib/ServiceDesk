# ITSM (IT Service Management) - Workflow Integration Guide

## Table of Contents
1. [ITSM Overview](#itsm-overview)
2. [Workflow Engine Integration](#workflow-engine-integration)
3. [ITSM Processes & Workflows](#itsm-processes--workflows)
4. [Configuration Guide](#configuration-guide)
5. [API Reference](#api-reference)

---

## ITSM Overview

IT Service Management (ITSM) refers to the entirety of activities – directed by policies, organized and structured in processes and supporting procedures – that are performed by an organization to plan, design, deliver, operate and control information technology (IT) services offered to customers.

### Key ITSM Processes

| Process | Purpose | Typical Workflow States |
|---------|---------|------------------------|
| **Incident Management** | Restore normal service operation quickly | New → Assigned → In Progress → Resolved → Closed |
| **Problem Management** | Root cause analysis and permanent fixes | Identified → Under Investigation → Known Error → Resolved → Closed |
| **Change Management** | Control lifecycle of changes | Requested → Assessed → Approved → Scheduled → Implemented → Reviewed → Closed |
| **Request Fulfillment** | Handle service requests | Submitted → Approved → In Progress → Fulfilled → Closed |
| **Service Level Management** | Monitor and maintain SLAs | Active → Breach Warning → Breached → Escalated → Resolved |

---

## Workflow Engine Integration

### Architecture

The ServiceDesk workflow engine is built on a BPMN (Business Process Model and Notation) approach with the following components:

```
┌─────────────────────────────────────────────────────────────┐
│                    WORKFLOW ENGINE                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Definition  │  │  Instance    │  │   Events     │      │
│  │   (Design)   │→ │  (Runtime)   │→ │  (Audit)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│  Components:                                                │
│  • GenericWorkflowEngine - Core orchestrator                │
│  • GuardEvaluator - Transition conditions                   │
│  • ActionExecutor - Automated actions                       │
│  • ParallelStepManager - Fork/Join handling                   │
│  • TimerManager - SLA and escalation handling               │
└─────────────────────────────────────────────────────────────┘
```

### Workflow Definition Structure

```typescript
interface IWFDefinition {
  id: string;
  name: string;
  version: number;
  states: IWFStateDefinition[];      // BPMN nodes
  transitions: IWFTransition[];       // BPMN edges
  variables: Record<string, unknown>; // Context data
  published: boolean;
}

interface IWFStateDefinition {
  id: string;
  name: string;
  type: WFStateType;    // start, end, state, fork, join, timer, approval, external_task
  config?: {
    assignee?: string;   // Auto-assign to role/user
    sla?: number;        // SLA hours
    actions?: WFAction[];
  };
}
```

---

## ITSM Processes & Workflows

### 1. Incident Management Workflow

**Purpose:** Minimize impact of incidents on business operations

```mermaid
flowchart LR
    A[New] → B{Auto-Assign?}
    B →|Yes| C[Assigned]
    B →|No| D[Triage Queue]
    D → E[Assigned]
    C → F[In Progress]
    F → G{Resolved?}
    G →|Yes| H[Resolved]
    G →|Escalate| I[Escalated]
    I → J[Manager Review]
    J → F
    H → K[Closed]
```

**Key Features:**
- **Automatic Assignment:** Based on category and workload
- **SLA Monitoring:** Warning at 80%, escalation at breach
- **Parallel Escalation:** Notify manager + update status simultaneously
- **External Integration:** Auto-create ticket in monitoring systems

**Workflow Configuration:**
```json
{
  "name": "Incident Management",
  "states": [
    { "id": "new", "type": "start", "name": "New" },
    { 
      "id": "assigned", 
      "type": "state", 
      "name": "Assigned",
      "config": { 
        "assignee": "${incident.category.owner}",
        "sla": 4 
      }
    },
    { "id": "in_progress", "type": "state", "name": "In Progress" },
    { 
      "id": "escalated", 
      "type": "approval", 
      "name": "Escalated",
      "config": { "approvers": ["manager", "lead"] }
    },
    { "id": "resolved", "type": "state", "name": "Resolved" },
    { "id": "closed", "type": "end", "name": "Closed" }
  ],
  "transitions": [
    { "from": "new", "to": "assigned", "trigger": "auto" },
    { "from": "assigned", "to": "in_progress", "trigger": "manual" },
    { 
      "from": "in_progress", 
      "to": "escalated", 
      "trigger": "timer",
      "config": { "timer": "sla_breach" }
    },
    { "from": "in_progress", "to": "resolved", "trigger": "manual" },
    { "from": "resolved", "to": "closed", "trigger": "timer", "config": { "timer": "7d" } }
  ]
}
```

### 2. Change Management Workflow

**Purpose:** Ensure changes are assessed, approved, and implemented with minimal risk

**States:**
1. **Requested** - Change submitted with impact assessment
2. **Under Assessment** - CAB (Change Advisory Board) review
3. **Approved/Rejected** - Decision with conditions
4. **Scheduled** - Implementation window defined
5. **Implementing** - Change in progress
6. **Review** - Post-implementation review
7. **Closed** - Change complete, documented

**Approval Gates:**
- Standard Changes: Auto-approved based on risk matrix
- Normal Changes: CAB approval required
- Emergency Changes: Emergency CAB (ECAB) fast-track

### 3. Problem Management Workflow

**Purpose:** Identify and eliminate root causes of incidents

**Key Workflow Features:**
- **Linked Incidents:** Track related incidents
- **Known Error Database:** Store workarounds and solutions
- **RFC Integration:** Auto-create change requests for fixes

### 4. Service Request Fulfillment

**Purpose:** Handle standard service requests efficiently

**Automated Fulfillment Examples:**
- **Password Reset:** 100% automated via workflow
- **Software Installation:** Approval + automated deployment
- **Access Requests:** Manager approval + AD group assignment

---

## Configuration Guide

### Creating an ITSM Workflow

**Step 1: Define the Workflow**

```typescript
// Using the Workflow Builder UI or API
const workflowDefinition = {
  name: "Incident Management",
  states: [
    {
      id: "new",
      type: WFStateType.START,
      name: "New Incident",
      nameAr: "حادث جديد"
    },
    {
      id: "triage",
      type: WFStateType.STATE,
      name: "Triage",
      config: {
        sla: 1, // 1 hour SLA
        actions: [
          { type: WFActionType.NOTIFY, target: "assignee" },
          { type: WFActionType.SET_FIELD, field: "priority", value: "calculated" }
        ]
      }
    },
    {
      id: "resolved",
      type: WFStateType.STATE,
      name: "Resolved"
    },
    {
      id: "closed",
      type: WFStateType.END,
      name: "Closed"
    }
  ],
  transitions: [
    {
      from: "new",
      to: "triage",
      on: "submit",
      guards: [
        { type: "expression", expression: "category != null" }
      ]
    },
    {
      from: "triage",
      to: "resolved",
      on: "resolve"
    },
    {
      from: "resolved",
      to: "closed",
      on: "auto",
      timer: "168h" // 7 days auto-close
    }
  ]
};
```

**Step 2: Configure Guards (Transition Conditions)**

```typescript
// Example: CAB approval required for high-risk changes
{
  type: "guard",
  condition: {
    type: "field",
    field: "riskLevel",
    operator: "in",
    value: ["high", "critical"]
  },
  action: {
    type: "require_approval",
    approvers: ["cab_member", "change_manager"]
  }
}
```

**Step 3: Define Actions**

| Action Type | Description | Example |
|-------------|-------------|---------|
| `NOTIFY` | Send notification | Email/SMS to assignee |
| `ASSIGN` | Auto-assign ticket | Round-robin by category |
| `SET_FIELD` | Update field value | Set priority based on impact |
| `WEBHOOK` | External integration | Create Jira ticket |
| `TIMER` | Schedule action | Auto-escalate after SLA breach |
| `SET_FIELD` | Update data | Update status, assignee |

**Step 4: SLA Configuration**

```typescript
{
  sla: {
    responseTime: 1,    // hours
    resolutionTime: 8,  // hours
    businessHours: true, // Only count business hours
    escalation: {
      warningAt: 80,      // Percentage of SLA
      breachAction: {
        notify: ["manager", "director"],
        escalate: true
      }
    }
  }
}
```

---

## API Reference

### Workflow Engine API

**Base URL:** `/api/v2/workflow-engine`

#### Definitions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/definitions` | List all workflow definitions |
| `POST` | `/definitions` | Create new definition |
| `GET` | `/definitions/:id` | Get definition details |
| `POST` | `/definitions/:id/publish` | Publish definition (creates version) |
| `GET` | `/definitions/:id/versions` | Get version history |

#### Instances

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/instances` | Start new workflow instance |
| `GET` | `/instances/:id` | Get instance status |
| `POST` | `/instances/:id/transition` | Execute transition |
| `POST` | `/instances/:id/cancel` | Cancel instance |
| `GET` | `/instances/:id/transitions` | Available transitions |

**Example: Start Incident Workflow**

```bash
curl -X POST http://localhost:5000/api/v2/workflow-engine/instances \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "definitionId": "incident-management-v1",
    "context": {
      "ticketId": "INC-2024-001",
      "category": "hardware",
      "priority": "high",
      "reporter": "user@company.com"
    }
  }'
```

**Example: Execute Transition**

```bash
curl -X POST http://localhost:5000/api/v2/workflow-engine/instances/inst-123/transition \
  -H "Content-Type: application/json" \
  -d '{
    "transitionId": "resolve",
    "data": {
      "resolution": "Replaced faulty power supply",
      "resolvedBy": "technician@company.com"
    }
  }'
```

### External Task Workers

For long-running or external system integrations:

```typescript
// Poll for available tasks
POST /api/v2/workflow-engine/external-tasks/fetch-and-lock
{
  "topics": ["jira-create", "ad-provisioning"],
  "workerId": "worker-1",
  "maxTasks": 10,
  "lockDuration": 300000  // 5 minutes
}

// Complete task
POST /api/v2/workflow-engine/external-tasks/:taskId/complete
{
  "workerId": "worker-1",
  "variables": {
    "jiraTicketId": "PROJ-123"
  }
}
```

---

## Best Practices

### 1. Workflow Design

- **Keep it simple:** Avoid deeply nested parallel branches
- **Use timers wisely:** Set reasonable escalation intervals
- **Document transitions:** Every guard should be documented

### 2. SLA Management

```typescript
// Progressive escalation
{
  timers: [
    { at: "75%_sla", action: "notify_assignee" },
    { at: "90%_sla", action: "notify_manager" },
    { at: "100%_sla", action: "escalate_to_director" }
  ]
}
```

### 3. Integration Patterns

| Pattern | Use Case | Implementation |
|---------|----------|----------------|
| **Webhook** | Real-time sync | POST to external system on state change |
| **Polling** | Legacy systems | External task worker pattern |
| **Event-Driven** | Microservices | Publish events on transitions |

### 4. Monitoring

Track these metrics for ITSM workflows:
- **MTTR (Mean Time To Resolution)**
- **MTTA (Mean Time To Assignment)**
- **SLA Compliance %**
- **Reopen Rate**
- **Escalation Rate**

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Workflow stuck | Guard condition not met | Review guard expression |
| SLA not triggering | Timer job not running | Check WorkflowTimerJob status |
| Permission denied | User role mismatch | Verify `requireRole` guard |
| External task timeout | Worker not responding | Check worker health |

### Debug Mode

Enable verbose logging:
```typescript
// In workflow definition
{
  debug: true,
  logging: {
    level: "debug",
    includeVariables: true
  }
}
```

---

## Summary

The ServiceDesk ITSM workflow engine provides:

✅ **Full BPMN support** - States, transitions, forks, joins, timers  
✅ **SLA management** - Breach warnings and escalations  
✅ **Role-based access** - Guards for authorization  
✅ **External integration** - Webhooks and external tasks  
✅ **Audit trail** - Complete event history  
✅ **Multi-language** - English and Arabic support  

For ITSM processes, the engine handles the complete lifecycle from ticket creation through resolution, with built-in compliance and reporting capabilities.
