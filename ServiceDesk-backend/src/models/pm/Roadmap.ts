import mongoose, { Schema } from 'mongoose';
import { MethodologyCode } from './Project';

export interface IRoadmapMilestone {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: 'planned' | 'in_progress' | 'completed' | 'delayed';
  progress: number;
  color?: string;
}

export interface IRoadmapPhase {
  id: string;
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  status: 'planned' | 'in_progress' | 'completed' | 'delayed';
  milestones: IRoadmapMilestone[];
  color?: string;
}

export interface IRoadmapSprint {
  sprintId: mongoose.Types.ObjectId;
  name: string;
  startDate: Date;
  endDate: Date;
  status: 'planning' | 'active' | 'completed';
  velocity?: number;
  plannedPoints: number;
  completedPoints: number;
}

export interface IRoadmapRelease {
  id: string;
  name: string;
  version: string;
  releaseDate: Date;
  status: 'planned' | 'in_progress' | 'released';
  features: string[];
}

export interface IPMRoadmap {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  type: 'sprint_timeline' | 'release_plan' | 'gantt' | 'change_calendar' | 'okr_progress' | 'value_stream';
  methodology: MethodologyCode;
  startDate: Date;
  endDate: Date;
  sprints?: IRoadmapSprint[];
  phases?: IRoadmapPhase[];
  milestones?: IRoadmapMilestone[];
  releases?: IRoadmapRelease[];
  changeWindows?: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    type: 'maintenance' | 'release' | 'emergency';
    changes: mongoose.Types.ObjectId[];
  }[];
  objectives?: {
    id: string;
    name: string;
    progress: number;
    keyResults: {
      id: string;
      name: string;
      target: number;
      current: number;
      unit: string;
    }[];
  }[];
  settings: {
    showWeekends: boolean;
    showDependencies: boolean;
    groupBy: 'none' | 'assignee' | 'epic' | 'phase';
    zoomLevel: 'day' | 'week' | 'month' | 'quarter';
  };
  isDefault: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RoadmapSchema = new Schema<IPMRoadmap>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'PMProject',
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'PMOrganization',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ['sprint_timeline', 'release_plan', 'gantt', 'change_calendar', 'okr_progress', 'value_stream'],
      required: true,
    },
    methodology: {
      type: String,
      enum: Object.values(MethodologyCode),
      required: true,
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    sprints: [{
      sprintId: { type: Schema.Types.ObjectId, ref: 'PMSprint' },
      name: String,
      startDate: Date,
      endDate: Date,
      status: { type: String, enum: ['planning', 'active', 'completed'] },
      velocity: Number,
      plannedPoints: Number,
      completedPoints: Number,
    }],
    phases: [{
      id: String,
      name: String,
      description: String,
      startDate: Date,
      endDate: Date,
      status: { type: String, enum: ['planned', 'in_progress', 'completed', 'delayed'] },
      milestones: [{
        id: String,
        name: String,
        description: String,
        startDate: Date,
        endDate: Date,
        status: { type: String, enum: ['planned', 'in_progress', 'completed', 'delayed'] },
        progress: Number,
        color: String,
      }],
      color: String,
    }],
    milestones: [{
      id: String,
      name: String,
      description: String,
      startDate: Date,
      endDate: Date,
      status: { type: String, enum: ['planned', 'in_progress', 'completed', 'delayed'] },
      progress: Number,
      color: String,
    }],
    releases: [{
      id: String,
      name: String,
      version: String,
      releaseDate: Date,
      status: { type: String, enum: ['planned', 'in_progress', 'released'] },
      features: [String],
    }],
    changeWindows: [{
      id: String,
      name: String,
      startDate: Date,
      endDate: Date,
      type: { type: String, enum: ['maintenance', 'release', 'emergency'] },
      changes: [{ type: Schema.Types.ObjectId, ref: 'PMTask' }],
    }],
    objectives: [{
      id: String,
      name: String,
      progress: Number,
      keyResults: [{
        id: String,
        name: String,
        target: Number,
        current: Number,
        unit: String,
      }],
    }],
    settings: {
      showWeekends: { type: Boolean, default: true },
      showDependencies: { type: Boolean, default: true },
      groupBy: { type: String, enum: ['none', 'assignee', 'epic', 'phase'], default: 'none' },
      zoomLevel: { type: String, enum: ['day', 'week', 'month', 'quarter'], default: 'week' },
    },
    isDefault: { type: Boolean, default: false },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.__v = undefined;
        return ret;
      },
    },
  }
);

RoadmapSchema.index({ projectId: 1 });
RoadmapSchema.index({ organizationId: 1 });
RoadmapSchema.index({ projectId: 1, type: 1 });

const PMRoadmap = mongoose.model<IPMRoadmap>('PMRoadmap', RoadmapSchema);

export default PMRoadmap;
