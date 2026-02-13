# Data Models - Methodology-Driven Project Manager

## MongoDB/NoSQL Schema Design

### 1. Organization Collection

```javascript
{
  _id: ObjectId,
  name: String,
  slug: String,
  description: String,
  logo: String,
  settings: {
    defaultMethodology: String,  // 'scrum' | 'kanban' | 'waterfall' | 'itil' | 'lean' | 'okr'
    timezone: String,
    dateFormat: String,
    workingDays: [Number],       // [1,2,3,4,5] for Mon-Fri
    workingHours: { start: String, end: String }
  },
  subscription: {
    plan: String,                // 'free' | 'pro' | 'enterprise'
    validUntil: Date,
    limits: { maxProjects: Number, maxUsers: Number, maxStorage: Number }
  },
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId
}
```

### 2. User Collection

```javascript
{
  _id: ObjectId,
  email: String,
  passwordHash: String,
  profile: {
    firstName: String,
    lastName: String,
    displayName: String,
    avatar: String,
    phone: String,
    timezone: String,
    language: String
  },
  organizations: [{
    organizationId: ObjectId,
    role: String,              // 'owner' | 'admin' | 'member'
    joinedAt: Date
  }],
  preferences: {
    theme: String,
    notifications: { email: Boolean, push: Boolean, inApp: Boolean },
    defaultView: String        // 'board' | 'list' | 'timeline'
  },
  status: String,
  lastLoginAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Team Collection

```javascript
{
  _id: ObjectId,
  organizationId: ObjectId,
  name: String,
  description: String,
  avatar: String,
  lead: ObjectId,
  members: [{
    userId: ObjectId,
    role: String,              // 'lead' | 'member'
    joinedAt: Date
  }],
  settings: {
    defaultCapacity: Number,   // story points per sprint
    sprintLength: Number,
    workingDays: [Number]
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 4. Methodology Profile Collection

```javascript
{
  _id: ObjectId,
  code: String,                // 'scrum' | 'kanban' | 'waterfall' | 'itil' | 'lean' | 'okr'
  name: String,
  description: String,
  icon: String,
  color: String,
  
  defaultConfig: {
    issueTypes: [{
      code: String,
      name: String,
      icon: String,
      color: String,
      fields: [String],
      hierarchy: Number
    }],
    
    statuses: [{
      code: String,
      name: String,
      category: String,        // 'todo' | 'in_progress' | 'done'
      color: String,
      order: Number
    }],
    
    workflow: {
      initialStatus: String,
      transitions: [{
        from: String,
        to: String,
        name: String,
        conditions: [{ type: String, config: Object }],
        actions: [{ type: String, config: Object }]
      }]
    },
    
    fields: [{
      code: String,
      name: String,
      type: String,            // 'text' | 'number' | 'date' | 'select' | 'user'
      required: Boolean,
      options: [Object],
      defaultValue: Mixed
    }],
    
    board: {
      type: String,
      columns: [{ statusCode: String, name: String, wipLimit: Number }],
      swimlanes: { enabled: Boolean, groupBy: String }
    },
    
    roadmap: {
      type: String,            // 'sprint' | 'flow' | 'gantt' | 'calendar'
      timeUnit: String,
      features: { dependencies: Boolean, milestones: Boolean, criticalPath: Boolean }
    },
    
    reports: [{ code: String, name: String, type: String, config: Object }],
    roles: [{ code: String, name: String, permissions: [String] }]
  },
  
  isSystem: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### 5. Project Collection

```javascript
{
  _id: ObjectId,
  organizationId: ObjectId,
  key: String,                   // e.g., "PROJ"
  name: String,
  description: String,
  avatar: String,
  
  methodology: {
    profileId: ObjectId,
    code: String,
    customizations: {
      issueTypes: [Object],
      statuses: [Object],
      workflow: Object,
      fields: [Object],
      board: Object,
      roadmap: Object,
      reports: [Object],
      roles: [Object]
    }
  },
  
  teams: [{ teamId: ObjectId, role: String }],
  members: [{
    userId: ObjectId,
    role: String,
    permissions: [String],
    addedAt: Date
  }],
  
  // Scrum-specific
  sprintConfig: { length: Number, startDay: Number, autoCreate: Boolean },
  currentSprint: { sprintId: ObjectId, number: Number, startDate: Date, endDate: Date },
  
  // Waterfall-specific
  phases: [{
    code: String,
    name: String,
    order: Number,
    startDate: Date,
    endDate: Date,
    status: String,
    gateApproval: { required: Boolean, approvers: [ObjectId], approvedAt: Date }
  }],
  
  // ITIL-specific
  itilConfig: {
    changeTypes: [String],
    cabSchedule: { dayOfWeek: Number, time: String, timezone: String },
    releaseFreezePeriods: [{ name: String, startDate: Date, endDate: Date }]
  },
  
  settings: {
    visibility: String,
    allowExternalAccess: Boolean,
    notifications: Object,
    integrations: [Object]
  },
  
  status: String,
  startDate: Date,
  targetEndDate: Date,
  actualEndDate: Date,
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId
}
```

### 6. Workflow Definition Collection

```javascript
{
  _id: ObjectId,
  projectId: ObjectId,
  name: String,
  description: String,
  isDefault: Boolean,
  
  states: [{
    code: String,
    name: String,
    category: String,
    color: String,
    order: Number,
    onEnter: [{ type: String, config: Object }],
    onExit: [{ type: String, config: Object }],
    requiredFields: [String],
    sla: { warningHours: Number, criticalHours: Number }
  }],
  
  transitions: [{
    _id: ObjectId,
    name: String,
    from: String,              // state code or '*'
    to: String,
    conditions: [{
      type: String,            // 'role' | 'field_value' | 'approval'
      config: Object
    }],
    validators: [{ type: String, config: Object, errorMessage: String }],
    actions: [{ type: String, config: Object }],
    ui: {
      buttonLabel: String,
      buttonColor: String,
      confirmationRequired: Boolean,
      formFields: [String]
    }
  }],
  
  initialState: String,
  finalStates: [String],
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId
}
```

### 7. Task/Issue Collection

```javascript
{
  _id: ObjectId,
  projectId: ObjectId,
  key: String,                   // e.g., "PROJ-123"
  
  type: String,                  // 'epic' | 'story' | 'task' | 'bug' | 'change_request'
  parentId: ObjectId,
  epicId: ObjectId,
  
  title: String,
  description: String,
  
  status: String,
  workflowId: ObjectId,
  statusHistory: [{ from: String, to: String, changedAt: Date, changedBy: ObjectId }],
  
  assignee: ObjectId,
  reporter: ObjectId,
  watchers: [ObjectId],
  
  priority: String,
  severity: String,
  
  estimation: {
    storyPoints: Number,
    originalEstimate: Number,
    remainingEstimate: Number,
    timeSpent: Number
  },
  
  timeTracking: [{ userId: ObjectId, duration: Number, date: Date, description: String }],
  
  sprintId: ObjectId,
  phase: String,
  
  dates: {
    created: Date,
    updated: Date,
    dueDate: Date,
    startDate: Date,
    completedDate: Date
  },
  
  dependencies: [{ taskId: ObjectId, type: String }],  // 'blocks' | 'blocked_by' | 'relates_to'
  
  labels: [String],
  components: [String],
  
  customFields: {
    // ITIL fields
    changeType: String,
    riskLevel: String,
    impactLevel: String,
    cabApproval: { status: String, approvedBy: [ObjectId], approvedAt: Date },
    rollbackPlan: String,
    
    // OKR fields
    objectiveId: ObjectId,
    keyResultId: ObjectId,
    progressPercentage: Number
  },
  
  attachments: [{
    _id: ObjectId,
    filename: String,
    mimeType: String,
    size: Number,
    url: String,
    uploadedBy: ObjectId,
    uploadedAt: Date
  }],
  
  comments: [{
    _id: ObjectId,
    content: String,
    author: ObjectId,
    createdAt: Date,
    updatedAt: Date
  }],
  
  activityLog: [{
    type: String,
    field: String,
    oldValue: Mixed,
    newValue: Mixed,
    userId: ObjectId,
    timestamp: Date
  }],
  
  flags: { flagged: Boolean, blocked: Boolean, blockedReason: String },
  resolution: { status: String, resolvedBy: ObjectId, resolvedAt: Date },
  
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId
}
```

### 8. Sprint Collection

```javascript
{
  _id: ObjectId,
  projectId: ObjectId,
  number: Number,
  name: String,
  goal: String,
  
  startDate: Date,
  endDate: Date,
  status: String,              // 'planning' | 'active' | 'completed'
  
  capacity: { planned: Number, committed: Number, completed: Number },
  velocity: { planned: Number, actual: Number },
  
  dailySnapshots: [{
    date: Date,
    remainingPoints: Number,
    completedPoints: Number,
    taskCount: { total: Number, completed: Number, inProgress: Number, todo: Number }
  }],
  
  retrospective: {
    whatWentWell: [String],
    whatDidntGoWell: [String],
    actionItems: [{ description: String, assignee: ObjectId, status: String }]
  },
  
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId
}
```

### 9. Board Collection

```javascript
{
  _id: ObjectId,
  projectId: ObjectId,
  name: String,
  type: String,                // 'kanban' | 'scrum' | 'custom'
  isDefault: Boolean,
  
  columns: [{
    _id: ObjectId,
    name: String,
    statusCodes: [String],
    order: Number,
    wipLimit: Number,
    color: String
  }],
  
  swimlanes: {
    enabled: Boolean,
    groupBy: String,           // 'assignee' | 'priority' | 'epic'
    collapsedByDefault: Boolean
  },
  
  cardConfig: {
    showFields: [String],
    showAvatar: Boolean,
    showPriority: Boolean,
    showEstimate: Boolean,
    showDueDate: Boolean,
    colorBy: String
  },
  
  quickFilters: [{ _id: ObjectId, name: String, query: Object }],
  defaultFilter: { types: [String], assignees: [ObjectId], labels: [String] },
  
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId
}
```

### 10. Roadmap Collection

```javascript
{
  _id: ObjectId,
  projectId: ObjectId,
  name: String,
  type: String,                // 'sprint' | 'flow' | 'gantt' | 'calendar'
  isDefault: Boolean,
  
  viewConfig: {
    timeUnit: String,          // 'day' | 'week' | 'sprint' | 'month' | 'quarter'
    startDate: Date,
    endDate: Date,
    zoomLevel: Number,
    showDependencies: Boolean,
    showMilestones: Boolean,
    showCriticalPath: Boolean,
    groupBy: String,
    filter: { epics: [ObjectId], teams: [ObjectId], types: [String] }
  },
  
  milestones: [{
    _id: ObjectId,
    name: String,
    date: Date,
    description: String,
    color: String,
    linkedTasks: [ObjectId],
    status: String
  }],
  
  itemOverrides: [{ taskId: ObjectId, startDate: Date, endDate: Date, row: Number }],
  savedViews: [{ _id: ObjectId, name: String, config: Object, isDefault: Boolean }],
  
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId
}
```

### 11. Milestone Collection

```javascript
{
  _id: ObjectId,
  projectId: ObjectId,
  name: String,
  description: String,
  
  targetDate: Date,
  completedDate: Date,
  status: String,              // 'pending' | 'in_progress' | 'completed' | 'at_risk'
  
  linkedEpics: [ObjectId],
  linkedTasks: [ObjectId],
  
  progress: { totalItems: Number, completedItems: Number, percentComplete: Number },
  owner: ObjectId,
  notifications: { reminderDays: [Number], notifyOnRisk: Boolean },
  
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId
}
```

### 12. ITIL Change Calendar Collection

```javascript
{
  _id: ObjectId,
  projectId: ObjectId,
  organizationId: ObjectId,
  
  cabSchedule: [{
    _id: ObjectId,
    name: String,
    recurrence: { type: String, dayOfWeek: Number, time: String, timezone: String },
    attendees: [ObjectId],
    duration: Number
  }],
  
  freezePeriods: [{
    _id: ObjectId,
    name: String,
    reason: String,
    startDate: Date,
    endDate: Date,
    allowEmergency: Boolean
  }],
  
  maintenanceWindows: [{
    _id: ObjectId,
    name: String,
    recurrence: { type: String, dayOfWeek: Number, startTime: String, endTime: String },
    systems: [String]
  }],
  
  scheduledChanges: [{
    changeId: ObjectId,
    scheduledStart: Date,
    scheduledEnd: Date,
    status: String,
    implementer: ObjectId
  }],
  
  createdAt: Date,
  updatedAt: Date
}
```

### 13. OKR Collection

```javascript
{
  _id: ObjectId,
  organizationId: ObjectId,
  projectId: ObjectId,
  
  period: {
    type: String,              // 'quarter' | 'year'
    year: Number,
    quarter: Number,
    startDate: Date,
    endDate: Date
  },
  
  objective: {
    title: String,
    description: String,
    owner: ObjectId,
    status: String,
    progress: Number,
    confidence: Number
  },
  
  keyResults: [{
    _id: ObjectId,
    title: String,
    description: String,
    owner: ObjectId,
    metric: {
      type: String,
      startValue: Number,
      targetValue: Number,
      currentValue: Number,
      unit: String
    },
    progress: Number,
    status: String,
    updates: [{ value: Number, note: String, updatedBy: ObjectId, updatedAt: Date }],
    linkedEpics: [ObjectId],
    linkedTasks: [ObjectId]
  }],
  
  parentOkrId: ObjectId,
  visibility: String,
  
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId
}
```

### 14. Report Configuration Collection

```javascript
{
  _id: ObjectId,
  projectId: ObjectId,
  name: String,
  type: String,                // 'burndown' | 'velocity' | 'cumulative_flow' | 'cycle_time'
  
  config: {
    timeRange: { type: String, sprintId: ObjectId, days: Number, startDate: Date, endDate: Date },
    filters: { types: [String], assignees: [ObjectId], epics: [ObjectId], labels: [String] },
    groupBy: String,
    metrics: [String],
    chartType: String,
    comparison: { enabled: Boolean, type: String, target: Number }
  },
  
  schedule: {
    enabled: Boolean,
    frequency: String,
    recipients: [ObjectId],
    format: String
  },
  
  dashboard: { enabled: Boolean, position: Number, size: String },
  isDefault: Boolean,
  
  createdAt: Date,
  updatedAt: Date,
  createdBy: ObjectId
}
```

## Database Indexes

```javascript
// tasks collection indexes
db.tasks.createIndex({ projectId: 1, key: 1 }, { unique: true })
db.tasks.createIndex({ projectId: 1, status: 1 })
db.tasks.createIndex({ projectId: 1, assignee: 1 })
db.tasks.createIndex({ projectId: 1, sprintId: 1 })
db.tasks.createIndex({ projectId: 1, epicId: 1 })
db.tasks.createIndex({ projectId: 1, type: 1 })
db.tasks.createIndex({ "dates.dueDate": 1 })
db.tasks.createIndex({ searchText: "text" })

// projects collection indexes
db.projects.createIndex({ organizationId: 1, key: 1 }, { unique: true })
db.projects.createIndex({ "methodology.code": 1 })

// sprints collection indexes
db.sprints.createIndex({ projectId: 1, number: 1 }, { unique: true })
db.sprints.createIndex({ projectId: 1, status: 1 })
```
