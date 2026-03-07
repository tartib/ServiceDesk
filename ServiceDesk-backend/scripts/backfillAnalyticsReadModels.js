#!/usr/bin/env node

/**
 * Backfill Analytics Read Models
 *
 * Seeds TaskSnapshot and DailyKPISnapshot from existing PM Task collection.
 * Run once after deployment; projectors handle incremental updates afterward.
 *
 * Usage:
 *   node scripts/backfillAnalyticsReadModels.js
 *
 * Environment:
 *   MONGODB_URI — MongoDB connection string (falls back to .env)
 */

const mongoose = require('mongoose');
const path = require('path');

// Load env
try {
  require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
} catch {
  // dotenv may not be installed in prod
}

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/servicedesk';

// ── Inline schemas (avoids TS compilation requirement) ──────────

const taskSnapshotSchema = new mongoose.Schema(
  {
    sourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    sourceModule: { type: String, enum: ['pm', 'ops'], required: true },
    organizationId: mongoose.Schema.Types.ObjectId,
    projectId: mongoose.Schema.Types.ObjectId,
    key: String,
    title: { type: String, required: true },
    type: String,
    priority: String,
    status: String,
    statusCategory: { type: String, enum: ['todo', 'in_progress', 'done'] },
    assigneeId: mongoose.Schema.Types.ObjectId,
    reporterId: mongoose.Schema.Types.ObjectId,
    completedAt: Date,
    dueDate: Date,
    startDate: Date,
    durationHours: Number,
    isOnTime: Boolean,
    isOverdue: Boolean,
    lastEventType: String,
    lastEventAt: Date,
  },
  { timestamps: true, collection: 'analytics_task_snapshots' }
);
taskSnapshotSchema.index({ sourceId: 1, sourceModule: 1 }, { unique: true });

const dailyKPISchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    organizationId: mongoose.Schema.Types.ObjectId,
    sourceModule: { type: String, enum: ['pm', 'ops', 'all'], required: true },
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
    byType: { type: mongoose.Schema.Types.Mixed, default: {} },
    byPriority: { type: mongoose.Schema.Types.Mixed, default: {} },
    byStatus: { type: mongoose.Schema.Types.Mixed, default: {} },
    lastUpdatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false, collection: 'analytics_daily_kpi_snapshots' }
);
dailyKPISchema.index({ date: 1, organizationId: 1, sourceModule: 1 }, { unique: true });

// ── Main ────────────────────────────────────────────────────────

async function main() {
  console.log('🔌 Connecting to MongoDB:', MONGO_URI.replace(/\/\/.*@/, '//***@'));
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected');

  const TaskSnapshot = mongoose.model('TaskSnapshot', taskSnapshotSchema);
  const DailyKPISnapshot = mongoose.model('DailyKPISnapshot', dailyKPISchema);

  // Use the existing Task collection (PM module)
  const db = mongoose.connection.db;
  const tasksCollection = db.collection('tasks');

  const totalTasks = await tasksCollection.countDocuments();
  console.log(`📊 Found ${totalTasks} tasks in PM collection`);

  if (totalTasks === 0) {
    console.log('⚠️  No tasks to backfill. Exiting.');
    await mongoose.disconnect();
    return;
  }

  // ── Phase 1: TaskSnapshot ──────────────────────────────────────
  console.log('\n── Phase 1: Backfilling TaskSnapshot ──');
  let snapshotCount = 0;
  let snapshotErrors = 0;

  const cursor = tasksCollection.find({}).batchSize(200);

  for await (const task of cursor) {
    try {
      const statusCat = inferStatusCategory(task.status?.category || task.status?.name || '');
      const completedAt = statusCat === 'done' ? (task.completedAt || task.updatedAt) : undefined;
      let durationHours;
      let isOnTime;

      if (completedAt && task.createdAt) {
        durationHours = Math.round(
          ((new Date(completedAt).getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60)) * 100
        ) / 100;
      }

      if (completedAt && task.dueDate) {
        isOnTime = new Date(completedAt) <= new Date(task.dueDate);
      }

      const isOverdue = !completedAt && task.dueDate && new Date(task.dueDate) < new Date();

      await TaskSnapshot.updateOne(
        { sourceId: task._id, sourceModule: 'pm' },
        {
          $set: {
            projectId: task.project,
            organizationId: task.organization,
            key: task.key,
            title: task.title || task.summary || `Task ${task._id}`,
            type: task.type,
            priority: task.priority,
            status: task.status?.name || task.status?.category || 'unknown',
            statusCategory: statusCat,
            assigneeId: task.assignee,
            reporterId: task.reporter,
            completedAt,
            dueDate: task.dueDate,
            startDate: task.startDate,
            durationHours,
            isOnTime,
            isOverdue: isOverdue || false,
            lastEventType: 'backfill',
            lastEventAt: new Date(),
          },
          $setOnInsert: {
            sourceId: task._id,
            sourceModule: 'pm',
            createdAt: task.createdAt || new Date(),
          },
        },
        { upsert: true }
      );

      snapshotCount++;
      if (snapshotCount % 500 === 0) {
        console.log(`  ... ${snapshotCount}/${totalTasks} snapshots`);
      }
    } catch (err) {
      snapshotErrors++;
      if (snapshotErrors <= 5) {
        console.error(`  ❌ Error for task ${task._id}:`, err.message);
      }
    }
  }

  console.log(`✅ TaskSnapshot backfill complete: ${snapshotCount} upserted, ${snapshotErrors} errors`);

  // ── Phase 2: DailyKPISnapshot ──────────────────────────────────
  console.log('\n── Phase 2: Backfilling DailyKPISnapshot ──');

  const pipeline = [
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        },
        totalTasks: { $sum: 1 },
        completedTasks: {
          $sum: { $cond: [{ $eq: ['$statusCategory', 'done'] }, 1, 0] },
        },
        inProgressTasks: {
          $sum: { $cond: [{ $eq: ['$statusCategory', 'in_progress'] }, 1, 0] },
        },
        pendingTasks: {
          $sum: { $cond: [{ $eq: ['$statusCategory', 'todo'] }, 1, 0] },
        },
        overdueTasks: {
          $sum: { $cond: [{ $eq: ['$isOverdue', true] }, 1, 0] },
        },
        criticalTasks: {
          $sum: { $cond: [{ $eq: ['$priority', 'critical'] }, 1, 0] },
        },
        totalDurationHours: {
          $sum: { $ifNull: ['$durationHours', 0] },
        },
        completedWithDuration: {
          $sum: { $cond: [{ $and: [{ $eq: ['$statusCategory', 'done'] }, { $gt: ['$durationHours', 0] }] }, 1, 0] },
        },
      },
    },
    { $sort: { '_id.date': 1 } },
  ];

  const dailyAggregation = await TaskSnapshot.aggregate(pipeline);
  let kpiCount = 0;

  for (const day of dailyAggregation) {
    const dateKey = day._id.date;
    if (!dateKey) continue;

    const completionRate = day.totalTasks > 0
      ? Math.round((day.completedTasks / day.totalTasks) * 10000) / 10000
      : 0;
    const avgTime = day.completedWithDuration > 0
      ? Math.round((day.totalDurationHours / day.completedWithDuration) * 100) / 100
      : 0;

    await DailyKPISnapshot.updateOne(
      { date: dateKey, organizationId: null, sourceModule: 'pm' },
      {
        $set: {
          totalTasks: day.totalTasks,
          createdTasks: day.totalTasks,
          completedTasks: day.completedTasks,
          inProgressTasks: day.inProgressTasks,
          pendingTasks: day.pendingTasks,
          overdueTasks: day.overdueTasks,
          criticalTasks: day.criticalTasks,
          escalatedTasks: 0,
          completionRate,
          onTimeCompletionRate: 0,
          averageCompletionTimeHours: avgTime,
          totalCompletionTimeHours: day.totalDurationHours,
          completedWithDurationCount: day.completedWithDuration,
          lastUpdatedAt: new Date(),
        },
      },
      { upsert: true }
    );

    kpiCount++;
  }

  console.log(`✅ DailyKPISnapshot backfill complete: ${kpiCount} daily snapshots`);

  // ── Done ───────────────────────────────────────────────────────
  console.log('\n🎉 Backfill complete!');
  console.log(`   TaskSnapshots: ${snapshotCount}`);
  console.log(`   DailyKPISnapshots: ${kpiCount}`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected');
}

function inferStatusCategory(status) {
  const lower = (status || '').toLowerCase();
  if (['done', 'completed', 'closed', 'resolved', 'cancelled'].includes(lower)) return 'done';
  if (['in_progress', 'in progress', 'active', 'started', 'review', 'testing'].includes(lower)) return 'in_progress';
  return 'todo';
}

main().catch((err) => {
  console.error('💥 Backfill failed:', err);
  process.exit(1);
});
