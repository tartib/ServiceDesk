import mongoose, { Document, Schema } from 'mongoose';
import { TaskStatus } from '../types';

export interface ITaskExecutionLog extends Document {
  taskId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  userName?: string;
  action: string;
  oldStatus?: TaskStatus;
  newStatus?: TaskStatus;
  details?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const taskExecutionLogSchema = new Schema<ITaskExecutionLog>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'PrepTask',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    userName: {
      type: String,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'created',
        'assigned',
        'started',
        'paused',
        'resumed',
        'completed',
        'cancelled',
        'escalated',
        'updated',
        'commented',
        'status_changed',
      ],
    },
    oldStatus: {
      type: String,
      enum: Object.values(TaskStatus),
    },
    newStatus: {
      type: String,
      enum: Object.values(TaskStatus),
    },
    details: {
      type: String,
      maxlength: 500,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Index for efficient queries
taskExecutionLogSchema.index({ taskId: 1, createdAt: -1 });
taskExecutionLogSchema.index({ userId: 1, createdAt: -1 });
taskExecutionLogSchema.index({ action: 1, createdAt: -1 });

const TaskExecutionLog = mongoose.model<ITaskExecutionLog>('TaskExecutionLog', taskExecutionLogSchema);

export default TaskExecutionLog;
