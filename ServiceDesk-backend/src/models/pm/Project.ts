import mongoose, { Schema } from 'mongoose';

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
  settings: {
    visibility: 'public' | 'private';
    allowExternalAccess: boolean;
  };
  status: ProjectStatus;
  startDate?: Date;
  targetEndDate?: Date;
  actualEndDate?: Date;
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
    settings: {
      visibility: { type: String, enum: ['public', 'private'], default: 'private' },
      allowExternalAccess: { type: Boolean, default: false },
    },
    status: {
      type: String,
      enum: Object.values(ProjectStatus),
      default: ProjectStatus.ACTIVE,
    },
    startDate: { type: Date },
    targetEndDate: { type: Date },
    actualEndDate: { type: Date },
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
