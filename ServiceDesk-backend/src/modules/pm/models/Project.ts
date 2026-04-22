import mongoose, { Schema } from 'mongoose';
import type { TaskFieldDefinition } from '../domain/task-field-definition';
import { ALLOWED_FIELD_TYPES } from '../domain/task-field-definition';

// Enums
export enum MethodologyCode {
  SCRUM = 'scrum',
  KANBAN = 'kanban',
  WATERFALL = 'waterfall',
  ITIL = 'itil',
  LEAN = 'lean',
  OKR = 'okr'
}

export enum ProjectRole {
  LEAD = 'lead',           // Full control - can delete project, manage all members
  MANAGER = 'manager',     // Can manage members, create/edit/delete all tasks
  CONTRIBUTOR = 'contributor', // Can create tasks, assign to self, update own tasks
  MEMBER = 'member',       // Legacy - same as contributor
  VIEWER = 'viewer'        // Read-only access
}

export enum ProjectStatus {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

export enum ProjectHealth {
  GREEN = 'green',
  YELLOW = 'yellow',
  RED = 'red'
}

export enum ProjectPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface IProject {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  key: string;
  name: string;
  description?: string;
  avatar?: string;
  methodology: {
    code: MethodologyCode;
    customizations?: Record<string, unknown>;
  };
  teams: Array<{
    teamId: mongoose.Types.ObjectId;
    role: 'primary' | 'supporting';
  }>;
  members: Array<{
    userId: mongoose.Types.ObjectId;
    role: ProjectRole;
    permissions: string[];
    addedAt: Date;
  }>;
  issueTypes: Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    description?: string;
  }>;
  settings: {
    visibility: 'public' | 'private';
    allowExternalAccess: boolean;
  };
  status: ProjectStatus;
  health: ProjectHealth;
  priority: ProjectPriority;
  escalated: boolean;
  escalationReason?: string;
  startDate?: Date;
  targetEndDate?: Date;
  actualEndDate?: Date;
  taskFieldDefinitions: TaskFieldDefinition[];
  starredBy: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: mongoose.Types.ObjectId;
}

const ProjectSchema = new Schema<IProject>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'PMOrganization',
      required: true,
    },
    key: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      maxlength: 10,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    avatar: {
      type: String,
    },
    methodology: {
      code: {
        type: String,
        enum: Object.values(MethodologyCode),
        required: true,
      },
      customizations: {
        type: Schema.Types.Mixed,
        default: {},
      },
    },
    teams: [
      {
        teamId: { type: Schema.Types.ObjectId, ref: 'PMTeam' },
        role: { type: String, enum: ['primary', 'supporting'], default: 'primary' },
      },
    ],
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: {
          type: String,
          enum: ['lead', 'manager', 'contributor', 'member', 'viewer'],
          default: 'contributor',
        },
        permissions: [{ type: String }],
        addedAt: { type: Date, default: Date.now },
      },
    ],
    issueTypes: {
      type: [
        {
          id: { type: String, required: true },
          name: { type: String, required: true },
          icon: { type: String, required: true },
          color: { type: String, required: true },
          description: { type: String },
        },
      ],
      default: [
        { id: 'epic', name: 'Epic', icon: '⚡', color: 'text-purple-400' },
        { id: 'feature', name: 'Feature', icon: '📦', color: 'text-orange-400' },
        { id: 'task', name: 'Task', icon: '✓', color: 'text-blue-400' },
        { id: 'story', name: 'Story', icon: '📖', color: 'text-green-400' },
        { id: 'bug', name: 'Bug', icon: '🐛', color: 'text-red-400' },
      ],
    },
    settings: {
      visibility: { type: String, enum: ['public', 'private'], default: 'private' },
      allowExternalAccess: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.ACTIVE,
    },
    health: {
      type: String,
      enum: Object.values(ProjectHealth),
      default: ProjectHealth.GREEN,
    },
    priority: {
      type: String,
      enum: Object.values(ProjectPriority),
      default: ProjectPriority.MEDIUM,
    },
    escalated: {
      type: Boolean,
      default: false,
    },
    escalationReason: {
      type: String,
      maxlength: 500,
    },
    startDate: { type: Date },
    targetEndDate: { type: Date },
    actualEndDate: { type: Date },
    taskFieldDefinitions: {
      type: [
        {
          id: { type: String, required: true },
          name: { type: String, required: true },
          type: { type: String, required: true, enum: ALLOWED_FIELD_TYPES },
          required: { type: Boolean, default: false },
          options: [{ type: String }],
          defaultValue: { type: Schema.Types.Mixed },
          position: { type: Number, default: 0 },
          appliesTo: [{ type: String }],
          archived: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
    starredBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
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

ProjectSchema.index({ organizationId: 1, key: 1 }, { unique: true });
ProjectSchema.index({ organizationId: 1, status: 1 });
ProjectSchema.index({ 'members.userId': 1 });
ProjectSchema.index({ 'teams.teamId': 1 });
ProjectSchema.index({ 'methodology.code': 1 });

const PMProject = mongoose.model<IProject>('PMProject', ProjectSchema);

export default PMProject;
