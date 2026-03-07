/**
 * DailyKPISnapshot — Pre-computed KPI Rollup
 *
 * Stores daily aggregated KPIs so dashboard queries read a single document
 * instead of aggregating thousands of tasks.
 * Updated incrementally by projectors on each domain event.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IDailyKPISnapshot extends Document {
  /** Date key: YYYY-MM-DD */
  date: string;
  organizationId?: mongoose.Types.ObjectId;
  sourceModule: 'pm' | 'ops' | 'all';

  // ── Counters ────────────────────────────────────────────────
  totalTasks: number;
  createdTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  pendingTasks: number;
  criticalTasks: number;
  escalatedTasks: number;

  // ── Rates (0–1) ─────────────────────────────────────────────
  completionRate: number;
  onTimeCompletionRate: number;

  // ── Time metrics ────────────────────────────────────────────
  /** Average hours from creation to completion for tasks completed today */
  averageCompletionTimeHours: number;
  /** Sum of completion hours (for incremental avg recalculation) */
  totalCompletionTimeHours: number;
  /** Count of completed tasks with known duration (for avg) */
  completedWithDurationCount: number;

  // ── Distribution snapshots ──────────────────────────────────
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  byStatus: Record<string, number>;

  // ── Metadata ────────────────────────────────────────────────
  lastUpdatedAt: Date;
}

const dailyKPISnapshotSchema = new Schema<IDailyKPISnapshot>(
  {
    date: { type: String, required: true, index: true },
    organizationId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    sourceModule: {
      type: String,
      enum: ['pm', 'ops', 'all'],
      required: true,
      index: true,
    },
    totalTasks: { type: Number, default: 0 },
    createdTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    inProgressTasks: { type: Number, default: 0 },
    overdueTasks: { type: Number, default: 0 },
    pendingTasks: { type: Number, default: 0 },
    criticalTasks: { type: Number, default: 0 },
    escalatedTasks: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    onTimeCompletionRate: { type: Number, default: 0 },
    averageCompletionTimeHours: { type: Number, default: 0 },
    totalCompletionTimeHours: { type: Number, default: 0 },
    completedWithDurationCount: { type: Number, default: 0 },
    byType: { type: Schema.Types.Mixed, default: {} },
    byPriority: { type: Schema.Types.Mixed, default: {} },
    byStatus: { type: Schema.Types.Mixed, default: {} },
    lastUpdatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    collection: 'analytics_daily_kpi_snapshots',
  }
);

// One snapshot per date + org + source
dailyKPISnapshotSchema.index(
  { date: 1, organizationId: 1, sourceModule: 1 },
  { unique: true }
);

const DailyKPISnapshot = mongoose.model<IDailyKPISnapshot>(
  'DailyKPISnapshot',
  dailyKPISnapshotSchema
);

export default DailyKPISnapshot;
