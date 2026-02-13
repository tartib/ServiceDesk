import mongoose, { Schema } from 'mongoose';

export interface ITeamMemberCapacity {
  userId: mongoose.Types.ObjectId;
  availableDays: number;
  hoursPerDay: number;
  plannedLeave: number;
  meetingHours: number;
}

export interface ISprintCommitment {
  committedAt: Date;
  committedBy: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
}

export interface ISprintAuditEntry {
  action: string;
  userId: mongoose.Types.ObjectId;
  timestamp: Date;
  details: string;
  overCapacity?: boolean;
  justification?: string;
}

export interface IPMSprint {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  name: string;
  goal?: string;
  number: number;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  startDate: Date;
  endDate: Date;
  capacity: {
    planned: number;
    committed: number;
    available: number;
  };
  teamCapacity: ITeamMemberCapacity[];
  estimationMethod: 'story_points' | 'hours' | 'days';
  velocity?: {
    planned: number;
    completed: number;
    average?: number;
  };
  commitment?: ISprintCommitment;
  settings: {
    requireGoal: boolean;
    requireEstimates: boolean;
    enforceCapacity: boolean;
  };
  retrospective?: {
    whatWentWell: string[];
    whatCouldImprove: string[];
    actionItems: string[];
    completedAt?: Date;
  };
  auditLog: ISprintAuditEntry[];
  overCapacityWarning: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SprintSchema = new Schema<IPMSprint>(
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
    goal: {
      type: String,
      maxlength: 1000,
    },
    number: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['planning', 'active', 'completed', 'cancelled'],
      default: 'planning',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    capacity: {
      planned: { type: Number, default: 0 },
      committed: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
    },
    teamCapacity: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        availableDays: { type: Number, default: 0 },
        hoursPerDay: { type: Number, default: 8 },
        plannedLeave: { type: Number, default: 0 },
        meetingHours: { type: Number, default: 0 },
      },
    ],
    estimationMethod: {
      type: String,
      enum: ['story_points', 'hours', 'days'],
      default: 'story_points',
    },
    velocity: {
      planned: { type: Number },
      completed: { type: Number },
      average: { type: Number },
    },
    commitment: {
      committedAt: { type: Date },
      committedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      participants: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    },
    settings: {
      requireGoal: { type: Boolean, default: true },
      requireEstimates: { type: Boolean, default: true },
      enforceCapacity: { type: Boolean, default: true },
    },
    retrospective: {
      whatWentWell: [{ type: String }],
      whatCouldImprove: [{ type: String }],
      actionItems: [{ type: String }],
      completedAt: { type: Date },
    },
    auditLog: [
      {
        action: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        timestamp: { type: Date, default: Date.now },
        details: { type: String },
        overCapacity: { type: Boolean, default: false },
        justification: { type: String },
      },
    ],
    overCapacityWarning: {
      type: Boolean,
      default: false,
    },
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

SprintSchema.index({ projectId: 1, number: 1 }, { unique: true });
SprintSchema.index({ projectId: 1, status: 1 });
SprintSchema.index({ organizationId: 1 });

const PMSprint = mongoose.model<IPMSprint>('PMSprint', SprintSchema);

export default PMSprint;
