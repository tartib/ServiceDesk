import mongoose, { Schema, Document } from 'mongoose';

/**
 * External Task Status
 */
export enum ExternalTaskStatus {
  AVAILABLE = 'available',
  LOCKED = 'locked',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * External Task Interface
 */
export interface IExternalTask extends Document {
  instanceId: mongoose.Types.ObjectId;
  definitionId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  topic: string;
  stateCode: string;
  status: ExternalTaskStatus;
  workerId?: string;
  lockExpiresAt?: Date;
  variables: Record<string, any>;
  resultVariables?: Record<string, any>;
  retries: number;
  retriesLeft: number;
  priority: number;
  errorMessage?: string;
  errorDetails?: string;
  errorHandling: 'retry' | 'fail_instance' | 'skip';
  createdAt: Date;
  lockedAt?: Date;
  completedAt?: Date;
}

const ExternalTaskSchema = new Schema<IExternalTask>(
  {
    instanceId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkflowInstance',
      required: true,
      index: true,
    },
    definitionId: {
      type: Schema.Types.ObjectId,
      ref: 'WorkflowDefinition',
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    stateCode: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ExternalTaskStatus),
      default: ExternalTaskStatus.AVAILABLE,
      required: true,
      index: true,
    },
    workerId: {
      type: String,
      default: null,
    },
    lockExpiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    variables: {
      type: Schema.Types.Mixed,
      default: {},
    },
    resultVariables: {
      type: Schema.Types.Mixed,
      default: null,
    },
    retries: {
      type: Number,
      default: 3,
    },
    retriesLeft: {
      type: Number,
      default: 3,
    },
    priority: {
      type: Number,
      default: 0,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    errorDetails: {
      type: String,
      default: null,
    },
    errorHandling: {
      type: String,
      enum: ['retry', 'fail_instance', 'skip'],
      default: 'retry',
    },
    lockedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fetch-and-lock queries
ExternalTaskSchema.index({ topic: 1, status: 1, priority: -1 });

const ExternalTask = mongoose.model<IExternalTask>('ExternalTask', ExternalTaskSchema);

export default ExternalTask;
