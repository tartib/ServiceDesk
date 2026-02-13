# Dynamic Roadmap Generator - Methodology-Driven Project Manager

## Overview

The Dynamic Roadmap Generator automatically creates methodology-specific roadmap views based on the selected project methodology.

## Roadmap Types by Methodology

### 1. Scrum - Sprint-Based Roadmap

**View Type:** Sprint Timeline with Epic Lanes

**Features:**

- Sprint containers showing 2-4 week blocks
- Epics displayed as horizontal bars spanning sprints
- Story points capacity per sprint
- Burndown & velocity widgets
- Sprint goals visible on hover

**Data Structure:**

```javascript
{
  type: 'sprint_timeline',
  config: {
    timeUnit: 'sprint',
    sprintLength: 14,              // days
    showCapacity: true,
    showVelocity: true,
    groupBy: 'epic',
    widgets: ['burndown', 'velocity', 'sprint_progress']
  },
  
  lanes: [{
    epicId: ObjectId,
    epicName: String,
    color: String,
    items: [{
      taskId: ObjectId,
      sprintId: ObjectId,
      sprintNumber: Number,
      storyPoints: Number,
      status: String
    }]
  }],
  
  sprints: [{
    id: ObjectId,
    number: Number,
    name: String,
    startDate: Date,
    endDate: Date,
    capacity: Number,
    committed: Number,
    completed: Number,
    velocity: Number
  }],
  
  metrics: {
    averageVelocity: Number,
    predictedCompletion: Date,
    burndownData: [{ date: Date, remaining: Number, ideal: Number }]
  }
}
```

**Widgets:**

1. **Burndown Chart** - Daily remaining work vs ideal line
2. **Velocity Chart** - Sprint-over-sprint velocity trend
3. **Sprint Progress** - Current sprint completion percentage
4. **Epic Progress** - Epic completion across sprints

---

### 2. Kanban - Continuous Flow Timeline

**View Type:** Monthly Buckets with Throughput Analytics

**Features:**

- Monthly/weekly time buckets
- Continuous flow visualization
- Throughput & cycle time analytics
- WIP limits visualization
- Cumulative flow diagram

**Data Structure:**

```javascript
{
  type: 'flow_timeline',
  config: {
    timeUnit: 'week',              // or 'month'
    showThroughput: true,
    showCycleTime: true,
    showWipLimits: true,
    groupBy: 'status',
    widgets: ['cumulative_flow', 'cycle_time', 'throughput']
  },
  
  buckets: [{
    startDate: Date,
    endDate: Date,
    label: String,                 // "Week 1", "January"
    items: [{
      taskId: ObjectId,
      enteredAt: Date,
      completedAt: Date,
      cycleTime: Number            // days
    }],
    metrics: {
      throughput: Number,
      avgCycleTime: Number,
      wipCount: Number
    }
  }],
  
  flowData: [{
    date: Date,
    statusCounts: {
      backlog: Number,
      inProgress: Number,
      review: Number,
      done: Number
    }
  }],
  
  metrics: {
    avgThroughput: Number,         // items per week
    avgCycleTime: Number,          // days
    predictedDelivery: [{
      itemId: ObjectId,
      estimatedDate: Date,
      confidence: Number           // percentage
    }]
  }
}
```

**Widgets:**

1. **Cumulative Flow Diagram** - Stacked area chart of status over time
2. **Cycle Time Scatter Plot** - Individual item cycle times
3. **Throughput Histogram** - Weekly/monthly completion rates
4. **Aging WIP** - Items in progress by age

---

### 3. Waterfall - Gantt Chart Roadmap

**View Type:** Gantt-Style with Critical Path

**Features:**

- Sequential phase blocks
- Task dependencies with arrows
- Critical path highlighting
- Milestone diamonds
- Resource allocation view
- Phase gate approvals

**Data Structure:**

```javascript
{
  type: 'gantt_chart',
  config: {
    timeUnit: 'day',
    showDependencies: true,
    showCriticalPath: true,
    showMilestones: true,
    showResources: true,
    groupBy: 'phase',
    widgets: ['phase_progress', 'resource_utilization', 'risk_matrix']
  },
  
  phases: [{
    id: String,
    name: String,
    order: Number,
    startDate: Date,
    endDate: Date,
    status: String,
    progress: Number,
    gateApproval: {
      required: Boolean,
      status: String,
      approvedBy: ObjectId,
      approvedAt: Date
    }
  }],
  
  tasks: [{
    id: ObjectId,
    name: String,
    phase: String,
    startDate: Date,
    endDate: Date,
    duration: Number,
    progress: Number,
    assignee: ObjectId,
    dependencies: [{
      taskId: ObjectId,
      type: String               // 'finish_to_start' | 'start_to_start'
    }],
    isCriticalPath: Boolean,
    slack: Number                // days of float
  }],
  
  milestones: [{
    id: ObjectId,
    name: String,
    date: Date,
    phase: String,
    status: String,
    linkedTasks: [ObjectId]
  }],
  
  criticalPath: {
    tasks: [ObjectId],
    totalDuration: Number,
    endDate: Date
  },
  
  resources: [{
    userId: ObjectId,
    name: String,
    allocation: [{
      taskId: ObjectId,
      startDate: Date,
      endDate: Date,
      percentage: Number
    }],
    utilization: Number          // percentage
  }]
}
```

**Widgets:**

1. **Phase Progress** - Progress bars per phase
2. **Critical Path Summary** - Key dates and slack
3. **Resource Utilization** - Team member workload
4. **Risk Matrix** - Phase risks and mitigations

---

### 4. ITIL Change Management - Change Calendar

**View Type:** Calendar with CAB Windows & Freeze Periods

**Features:**

- Change calendar view (month/week)
- CAB meeting windows
- Release freeze periods (highlighted)
- Scheduled changes timeline
- Emergency change indicators
- Approval status badges

**Data Structure:**

```javascript
{
  type: 'change_calendar',
  config: {
    timeUnit: 'day',
    viewMode: 'month',            // or 'week'
    showCABWindows: true,
    showFreezePeriods: true,
    showMaintenanceWindows: true,
    colorByChangeType: true,
    widgets: ['change_stats', 'approval_queue', 'risk_summary']
  },
  
  calendar: {
    startDate: Date,
    endDate: Date,
    
    cabMeetings: [{
      id: ObjectId,
      name: String,
      date: Date,
      time: String,
      duration: Number,
      attendees: [ObjectId],
      agenda: [{
        changeId: ObjectId,
        title: String,
        type: String,
        status: String
      }]
    }],
    
    freezePeriods: [{
      id: ObjectId,
      name: String,
      reason: String,
      startDate: Date,
      endDate: Date,
      allowEmergency: Boolean
    }],
    
    maintenanceWindows: [{
      id: ObjectId,
      name: String,
      date: Date,
      startTime: String,
      endTime: String,
      systems: [String]
    }],
    
    scheduledChanges: [{
      id: ObjectId,
      title: String,
      type: String,              // 'standard' | 'normal' | 'emergency'
      scheduledDate: Date,
      scheduledTime: String,
      duration: Number,
      status: String,            // 'scheduled' | 'approved' | 'in_progress' | 'completed'
      riskLevel: String,
      implementer: ObjectId,
      cabApproval: {
        required: Boolean,
        status: String,
        meetingId: ObjectId
      }
    }]
  },
  
  metrics: {
    totalChanges: Number,
    byType: { standard: Number, normal: Number, emergency: Number },
    successRate: Number,
    avgLeadTime: Number,
    pendingApprovals: Number
  }
}
```

**Widgets:**

1. **Change Statistics** - Changes by type, success rate
2. **Approval Queue** - Pending CAB approvals
3. **Risk Summary** - Changes by risk level
4. **Lead Time Trend** - Change request to implementation time

---

### 5. Lean - Value Stream Timeline

**View Type:** Value Stream Map with Waste Indicators

**Features:**

- Value stream stages
- Lead time vs process time
- Waste identification
- Continuous improvement tracking
- Kaizen events

**Data Structure:**

```javascript
{
  type: 'value_stream',
  config: {
    showLeadTime: true,
    showProcessTime: true,
    showWaste: true,
    showKaizen: true,
    widgets: ['efficiency_ratio', 'waste_breakdown', 'improvement_trend']
  },
  
  stages: [{
    id: String,
    name: String,
    order: Number,
    metrics: {
      avgProcessTime: Number,      // hours
      avgWaitTime: Number,         // hours
      throughput: Number,
      wip: Number
    },
    wasteIndicators: [{
      type: String,                // 'waiting' | 'overproduction' | 'defects' | etc.
      severity: String,
      description: String
    }]
  }],
  
  items: [{
    id: ObjectId,
    title: String,
    currentStage: String,
    stageHistory: [{
      stage: String,
      enteredAt: Date,
      exitedAt: Date,
      processTime: Number,
      waitTime: Number
    }],
    totalLeadTime: Number,
    totalProcessTime: Number,
    efficiencyRatio: Number
  }],
  
  kaizen: [{
    id: ObjectId,
    title: String,
    stage: String,
    targetImprovement: String,
    status: String,
    startDate: Date,
    endDate: Date,
    results: {
      beforeMetric: Number,
      afterMetric: Number,
      improvement: Number
    }
  }],
  
  metrics: {
    overallLeadTime: Number,
    overallProcessTime: Number,
    efficiencyRatio: Number,
    wastePercentage: Number
  }
}
```

---

### 6. OKR Execution - Objectives Timeline

**View Type:** Quarterly OKR Progress Timeline

**Features:**

- Quarterly/yearly objective lanes
- Key result progress bars
- Linked initiatives/epics
- Confidence indicators
- Check-in history

**Data Structure:**

```javascript
{
  type: 'okr_timeline',
  config: {
    timeUnit: 'quarter',
    showConfidence: true,
    showLinkedWork: true,
    showCheckIns: true,
    groupBy: 'objective',
    widgets: ['okr_progress', 'confidence_trend', 'alignment_tree']
  },
  
  periods: [{
    year: Number,
    quarter: Number,
    startDate: Date,
    endDate: Date,
    
    objectives: [{
      id: ObjectId,
      title: String,
      owner: ObjectId,
      progress: Number,
      confidence: Number,
      status: String,
      
      keyResults: [{
        id: ObjectId,
        title: String,
        owner: ObjectId,
        metric: {
          type: String,
          start: Number,
          target: Number,
          current: Number,
          unit: String
        },
        progress: Number,
        status: String,
        
        linkedWork: [{
          type: String,            // 'epic' | 'task'
          id: ObjectId,
          title: String,
          status: String,
          progress: Number
        }],
        
        checkIns: [{
          date: Date,
          value: Number,
          note: String,
          updatedBy: ObjectId
        }]
      }]
    }]
  }],
  
  alignment: {
    companyOkrs: [ObjectId],
    teamOkrs: [ObjectId],
    individualOkrs: [ObjectId]
  },
  
  metrics: {
    avgProgress: Number,
    avgConfidence: Number,
    onTrack: Number,
    atRisk: Number,
    behind: Number
  }
}
```

---

## Roadmap Generator Service

```typescript
// roadmap-generator.service.ts

interface RoadmapGeneratorService {
  // Generate roadmap based on methodology
  generateRoadmap(projectId: string, methodology: MethodologyCode): Promise<Roadmap>;
  
  // Get roadmap data for rendering
  getRoadmapData(roadmapId: string, options: RoadmapOptions): Promise<RoadmapData>;
  
  // Update roadmap configuration
  updateRoadmapConfig(roadmapId: string, config: RoadmapConfig): Promise<Roadmap>;
  
  // Calculate dependencies and critical path
  calculateDependencies(projectId: string): Promise<DependencyGraph>;
  
  // Generate forecasts
  generateForecast(projectId: string, methodology: MethodologyCode): Promise<Forecast>;
  
  // Export roadmap
  exportRoadmap(roadmapId: string, format: 'pdf' | 'png' | 'csv'): Promise<Buffer>;
}

type MethodologyCode = 'scrum' | 'kanban' | 'waterfall' | 'itil' | 'lean' | 'okr';

interface RoadmapOptions {
  startDate?: Date;
  endDate?: Date;
  zoomLevel?: number;
  filters?: {
    epics?: string[];
    assignees?: string[];
    types?: string[];
    statuses?: string[];
  };
  groupBy?: string;
}
```

## Roadmap Computation Algorithms

### Critical Path Calculation (Waterfall)

```typescript
function calculateCriticalPath(tasks: Task[]): CriticalPath {
  // Build dependency graph
  const graph = buildDependencyGraph(tasks);
  
  // Forward pass - calculate earliest start/finish
  const forwardPass = calculateForwardPass(graph);
  
  // Backward pass - calculate latest start/finish
  const backwardPass = calculateBackwardPass(graph, forwardPass);
  
  // Calculate slack for each task
  const slack = calculateSlack(forwardPass, backwardPass);
  
  // Critical path = tasks with zero slack
  const criticalTasks = tasks.filter(t => slack[t.id] === 0);
  
  return {
    tasks: criticalTasks.map(t => t.id),
    totalDuration: forwardPass[getEndNode(graph)].finish,
    endDate: calculateEndDate(forwardPass)
  };
}
```

### Velocity-Based Forecasting (Scrum)

```typescript
function forecastCompletion(
  remainingPoints: number,
  velocityHistory: number[]
): Forecast {
  const avgVelocity = average(velocityHistory);
  const stdDev = standardDeviation(velocityHistory);
  
  // Monte Carlo simulation for confidence intervals
  const simulations = runMonteCarloSimulation(remainingPoints, avgVelocity, stdDev);
  
  return {
    optimistic: percentile(simulations, 10),
    mostLikely: percentile(simulations, 50),
    pessimistic: percentile(simulations, 90),
    sprintsRemaining: Math.ceil(remainingPoints / avgVelocity)
  };
}
```

### Cycle Time Prediction (Kanban)

```typescript
function predictDeliveryDate(
  item: Task,
  historicalCycleTimes: number[]
): Prediction {
  const percentiles = {
    p50: percentile(historicalCycleTimes, 50),
    p85: percentile(historicalCycleTimes, 85),
    p95: percentile(historicalCycleTimes, 95)
  };
  
  const startDate = item.dates.startDate || new Date();
  
  return {
    likely: addDays(startDate, percentiles.p50),
    conservative: addDays(startDate, percentiles.p85),
    worstCase: addDays(startDate, percentiles.p95)
  };
}
```
