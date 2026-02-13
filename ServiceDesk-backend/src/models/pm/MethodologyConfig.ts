import mongoose, { Schema } from 'mongoose';

// ============================================
// Scrum Configuration
// ============================================
export interface IScrumConfig {
  sprintLength: number; // days: 7, 14, 21, 28
  roles: {
    productOwner?: mongoose.Types.ObjectId;
    scrumMaster?: mongoose.Types.ObjectId;
    developers: mongoose.Types.ObjectId[];
  };
  definitionOfDone: string[];
  events: {
    planning: { enabled: boolean; defaultDuration: number }; // minutes
    daily: { enabled: boolean; defaultDuration: number };
    review: { enabled: boolean; defaultDuration: number };
    retrospective: { enabled: boolean; defaultDuration: number };
  };
  estimationMethod: 'story_points' | 'hours' | 'tshirt';
  velocityHistory: number[];
}

// ============================================
// Kanban Configuration
// ============================================
export interface IKanbanColumn {
  id: string;
  name: string;
  order: number;
  wipLimit?: number;
  category: 'todo' | 'in_progress' | 'done';
}

export interface ISwimlane {
  id: string;
  name: string;
  order: number;
  filter?: {
    field: string;
    value: string;
  };
}

export interface IKanbanConfig {
  columns: IKanbanColumn[];
  wipLimits: {
    global?: number;
    perColumn: Record<string, number>;
  };
  policies: {
    pullBased: boolean;
    cycleTimeTracking: boolean;
    blockerHighlight: boolean;
    agingThreshold: number; // days
  };
  swimlanes: ISwimlane[];
  cardFields: string[]; // fields to show on cards
}

// ============================================
// Waterfall Configuration
// ============================================
export interface IWaterfallPhase {
  id: string;
  name: string;
  order: number;
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  deliverables: string[];
  gateId?: string;
}

export interface IGateReview {
  id: string;
  name: string;
  phaseId: string;
  criteria: string[];
  approvers: mongoose.Types.ObjectId[];
  status: 'pending' | 'approved' | 'rejected';
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  comments?: string;
}

export interface IMilestone {
  id: string;
  name: string;
  dueDate: Date;
  phaseId?: string;
  status: 'upcoming' | 'completed' | 'missed';
  completedAt?: Date;
}

export interface IWaterfallConfig {
  phases: IWaterfallPhase[];
  gates: IGateReview[];
  milestones: IMilestone[];
  approvalWorkflow: {
    requireAllApprovers: boolean;
    autoAdvanceOnApproval: boolean;
  };
  baselines: Array<{
    id: string;
    name: string;
    createdAt: Date;
    snapshot: Record<string, unknown>;
  }>;
}

// ============================================
// ITIL Configuration
// ============================================
export interface IServiceItem {
  id: string;
  name: string;
  description: string;
  category: string;
  slaId?: string;
  supportTeam?: mongoose.Types.ObjectId;
  status: 'active' | 'inactive' | 'deprecated';
}

export interface ISlaDefinition {
  id: string;
  name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  responseTime: number; // minutes
  resolutionTime: number; // minutes
  escalationRules: Array<{
    afterMinutes: number;
    notifyUsers: mongoose.Types.ObjectId[];
    action: 'notify' | 'escalate' | 'auto_assign';
  }>;
}

export interface IItilConfig {
  serviceCatalog: IServiceItem[];
  slaDefinitions: ISlaDefinition[];
  processes: {
    incident: { enabled: boolean; prefix: string };
    problem: { enabled: boolean; prefix: string };
    change: { enabled: boolean; prefix: string };
    release: { enabled: boolean; prefix: string };
  };
  cab: {
    enabled: boolean;
    members: mongoose.Types.ObjectId[];
    meetingSchedule?: string; // cron expression
    approvalThreshold: number; // percentage
  };
  releaseWindows: Array<{
    id: string;
    name: string;
    dayOfWeek: number[];
    startTime: string;
    endTime: string;
    blackoutDates: Date[];
  }>;
}

// ============================================
// Lean Configuration
// ============================================
export interface IValueStreamStep {
  id: string;
  name: string;
  order: number;
  processTime: number; // minutes
  waitTime: number; // minutes
  percentComplete: number;
  owner?: mongoose.Types.ObjectId;
  wasteTypes: string[];
}

export interface IKaizenEvent {
  id: string;
  title: string;
  description: string;
  targetArea: string;
  status: 'planned' | 'in_progress' | 'completed';
  startDate: Date;
  endDate?: Date;
  participants: mongoose.Types.ObjectId[];
  improvements: string[];
  measuredImpact?: string;
}

export interface ILeanConfig {
  valueStream: IValueStreamStep[];
  wasteCategories: Array<{
    id: string;
    name: string;
    description: string;
    color: string;
  }>;
  improvementBoard: {
    enabled: boolean;
    columns: string[];
  };
  metrics: {
    leadTime: boolean;
    cycleTime: boolean;
    throughput: boolean;
    bottleneckDetection: boolean;
  };
  kaizenEvents: IKaizenEvent[];
}

// ============================================
// OKR Configuration
// ============================================
export interface IKeyResult {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  owner?: mongoose.Types.ObjectId;
  dueDate?: Date;
  status: 'on_track' | 'at_risk' | 'behind';
}

export interface IObjective {
  id: string;
  title: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  keyResults: IKeyResult[];
  parentObjectiveId?: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  progress: number; // 0-100
  cycleId: string;
}

export interface IOkrCycle {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'planning' | 'active' | 'review' | 'closed';
}

export interface IOkrConfig {
  cycleType: 'monthly' | 'quarterly' | 'yearly';
  cycles: IOkrCycle[];
  objectives: IObjective[];
  checkInFrequency: 'daily' | 'weekly' | 'biweekly';
  scoringMethod: 'percentage' | 'scale_1_10' | 'binary';
  settings: {
    allowCascading: boolean;
    requireKeyResults: boolean;
    minKeyResults: number;
    maxKeyResults: number;
  };
}

// ============================================
// Methodology Config Schema
// ============================================
export interface IMethodologyConfig {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  methodologyCode: 'scrum' | 'kanban' | 'waterfall' | 'itil' | 'lean' | 'okr';
  scrum?: IScrumConfig;
  kanban?: IKanbanConfig;
  waterfall?: IWaterfallConfig;
  itil?: IItilConfig;
  lean?: ILeanConfig;
  okr?: IOkrConfig;
  createdAt: Date;
  updatedAt: Date;
}

const MethodologyConfigSchema = new Schema<IMethodologyConfig>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'PMProject',
      required: true,
      unique: true,
    },
    methodologyCode: {
      type: String,
      enum: ['scrum', 'kanban', 'waterfall', 'itil', 'lean', 'okr'],
      required: true,
    },
    scrum: {
      type: Schema.Types.Mixed,
    },
    kanban: {
      type: Schema.Types.Mixed,
    },
    waterfall: {
      type: Schema.Types.Mixed,
    },
    itil: {
      type: Schema.Types.Mixed,
    },
    lean: {
      type: Schema.Types.Mixed,
    },
    okr: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

MethodologyConfigSchema.index({ methodologyCode: 1 });

const MethodologyConfig = mongoose.model<IMethodologyConfig>(
  'PMMethodologyConfig',
  MethodologyConfigSchema
);

export default MethodologyConfig;

// ============================================
// Default Configurations
// ============================================
export const defaultScrumConfig: Partial<IScrumConfig> = {
  sprintLength: 14,
  roles: { developers: [] },
  definitionOfDone: [
    'Code reviewed',
    'Unit tests passed',
    'Documentation updated',
    'Acceptance criteria met',
  ],
  events: {
    planning: { enabled: true, defaultDuration: 120 },
    daily: { enabled: true, defaultDuration: 15 },
    review: { enabled: true, defaultDuration: 60 },
    retrospective: { enabled: true, defaultDuration: 60 },
  },
  estimationMethod: 'story_points',
  velocityHistory: [],
};

export const defaultKanbanConfig: Partial<IKanbanConfig> = {
  columns: [
    { id: 'backlog', name: 'Backlog', order: 0, category: 'todo' },
    { id: 'todo', name: 'To Do', order: 1, wipLimit: 5, category: 'todo' },
    { id: 'in_progress', name: 'In Progress', order: 2, wipLimit: 3, category: 'in_progress' },
    { id: 'review', name: 'Review', order: 3, wipLimit: 2, category: 'in_progress' },
    { id: 'done', name: 'Done', order: 4, category: 'done' },
  ],
  wipLimits: { global: 15, perColumn: {} },
  policies: {
    pullBased: true,
    cycleTimeTracking: true,
    blockerHighlight: true,
    agingThreshold: 7,
  },
  swimlanes: [],
  cardFields: ['assignee', 'priority', 'dueDate'],
};

export const defaultWaterfallConfig: Partial<IWaterfallConfig> = {
  phases: [
    { id: 'requirements', name: 'Requirements', order: 0, status: 'not_started', deliverables: ['Requirements Document'] },
    { id: 'design', name: 'Design', order: 1, status: 'not_started', deliverables: ['Design Document', 'Architecture Diagram'] },
    { id: 'development', name: 'Development', order: 2, status: 'not_started', deliverables: ['Source Code', 'Unit Tests'] },
    { id: 'testing', name: 'Testing', order: 3, status: 'not_started', deliverables: ['Test Results', 'Bug Reports'] },
    { id: 'deployment', name: 'Deployment', order: 4, status: 'not_started', deliverables: ['Release Notes', 'Deployment Guide'] },
  ],
  gates: [],
  milestones: [],
  approvalWorkflow: { requireAllApprovers: false, autoAdvanceOnApproval: true },
  baselines: [],
};

export const defaultItilConfig: Partial<IItilConfig> = {
  serviceCatalog: [],
  slaDefinitions: [
    { id: 'critical', name: 'Critical', priority: 'critical', responseTime: 15, resolutionTime: 240, escalationRules: [] },
    { id: 'high', name: 'High', priority: 'high', responseTime: 60, resolutionTime: 480, escalationRules: [] },
    { id: 'medium', name: 'Medium', priority: 'medium', responseTime: 240, resolutionTime: 1440, escalationRules: [] },
    { id: 'low', name: 'Low', priority: 'low', responseTime: 480, resolutionTime: 2880, escalationRules: [] },
  ],
  processes: {
    incident: { enabled: true, prefix: 'INC' },
    problem: { enabled: true, prefix: 'PRB' },
    change: { enabled: true, prefix: 'CHG' },
    release: { enabled: true, prefix: 'REL' },
  },
  cab: { enabled: false, members: [], approvalThreshold: 50 },
  releaseWindows: [],
};

export const defaultLeanConfig: Partial<ILeanConfig> = {
  valueStream: [],
  wasteCategories: [
    { id: 'defects', name: 'Defects', description: 'Rework and corrections', color: '#ef4444' },
    { id: 'overproduction', name: 'Overproduction', description: 'Making more than needed', color: '#f97316' },
    { id: 'waiting', name: 'Waiting', description: 'Idle time', color: '#eab308' },
    { id: 'motion', name: 'Motion', description: 'Unnecessary movement', color: '#22c55e' },
    { id: 'transportation', name: 'Transportation', description: 'Unnecessary transfer', color: '#3b82f6' },
    { id: 'overprocessing', name: 'Over-processing', description: 'More work than required', color: '#8b5cf6' },
    { id: 'inventory', name: 'Inventory', description: 'Excess stock', color: '#ec4899' },
  ],
  improvementBoard: { enabled: true, columns: ['Ideas', 'In Progress', 'Implemented'] },
  metrics: { leadTime: true, cycleTime: true, throughput: true, bottleneckDetection: true },
  kaizenEvents: [],
};

export const defaultOkrConfig: Partial<IOkrConfig> = {
  cycleType: 'quarterly',
  cycles: [],
  objectives: [],
  checkInFrequency: 'weekly',
  scoringMethod: 'percentage',
  settings: {
    allowCascading: true,
    requireKeyResults: true,
    minKeyResults: 2,
    maxKeyResults: 5,
  },
};
