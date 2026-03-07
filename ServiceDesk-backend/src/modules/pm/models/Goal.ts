import mongoose, { Schema } from 'mongoose';

export enum GoalStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  ACHIEVED = 'achieved',
  AT_RISK = 'at_risk',
  MISSED = 'missed',
}

export interface IGoal {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit?: string;
  status: GoalStatus;
  dueDate?: Date;
  completedAt?: Date;
  projectId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'PMOrganization',
      required: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      maxlength: 2000,
    },
    targetValue: {
      type: Number,
      required: true,
      min: 0,
    },
    currentValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(GoalStatus),
      default: GoalStatus.NOT_STARTED,
    },
    dueDate: { type: Date },
    completedAt: { type: Date },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'PMProject',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

GoalSchema.index({ ownerId: 1, status: 1 });
GoalSchema.index({ organizationId: 1 });
GoalSchema.index({ projectId: 1 });

const PMGoal = mongoose.model<IGoal>('PMGoal', GoalSchema);

export default PMGoal;
