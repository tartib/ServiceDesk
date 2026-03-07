/**
 * TaskSnapshot — Denormalized Read Model
 *
 * A flattened copy of task data optimized for analytics queries.
 * Materialized from PM + OPS domain events via projectors.
 * Avoids cross-module Mongoose model access at query time.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface ITaskSnapshot extends Document {
  /** Original task _id from the source module */
  sourceId: mongoose.Types.ObjectId;
  /** Source module: 'pm' or 'ops' */
  sourceModule: 'pm' | 'ops';
  organizationId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;

  // ── Task attributes (denormalized) ──────────────────────────
  key?: string;
  title: string;
  type?: string;
  priority?: string;
  status?: string;
  statusCategory?: string; // 'todo' | 'in_progress' | 'done'
  assigneeId?: mongoose.Types.ObjectId;
  reporterId?: mongoose.Types.ObjectId;

  // ── Time fields ─────────────────────────────────────────────
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  dueDate?: Date;
  startDate?: Date;

  // ── Computed fields ─────────────────────────────────────────
  /** Duration in hours from creation to completion */
  durationHours?: number;
  /** Whether the task was completed on time */
  isOnTime?: boolean;
  /** Whether the task is overdue (not completed and past due) */
  isOverdue?: boolean;

  // ── Snapshot metadata ───────────────────────────────────────
  /** Last event that updated this snapshot */
  lastEventType?: string;
  lastEventAt?: Date;
}

const taskSnapshotSchema = new Schema<ITaskSnapshot>(
  {
    sourceId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    sourceModule: {
      type: String,
      enum: ['pm', 'ops'],
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    key: String,
    title: { type: String, required: true },
    type: { type: String, index: true },
    priority: { type: String, index: true },
    status: { type: String, index: true },
    statusCategory: {
      type: String,
      enum: ['todo', 'in_progress', 'done'],
      index: true,
    },
    assigneeId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    reporterId: Schema.Types.ObjectId,
    completedAt: Date,
    dueDate: Date,
    startDate: Date,
    durationHours: Number,
    isOnTime: Boolean,
    isOverdue: Boolean,
    lastEventType: String,
    lastEventAt: Date,
  },
  {
    timestamps: true,
    collection: 'analytics_task_snapshots',
  }
);

// Compound indexes for dashboard queries
taskSnapshotSchema.index({ sourceModule: 1, statusCategory: 1, createdAt: -1 });
taskSnapshotSchema.index({ sourceModule: 1, type: 1, createdAt: -1 });
taskSnapshotSchema.index({ sourceModule: 1, priority: 1, createdAt: -1 });
taskSnapshotSchema.index({ assigneeId: 1, statusCategory: 1, createdAt: -1 });
taskSnapshotSchema.index({ organizationId: 1, statusCategory: 1, createdAt: -1 });
taskSnapshotSchema.index({ sourceId: 1, sourceModule: 1 }, { unique: true });

const TaskSnapshot = mongoose.model<ITaskSnapshot>('TaskSnapshot', taskSnapshotSchema);

export default TaskSnapshot;
