/**
 * MongoDB Init Script
 *
 * Creates collections and indexes for the ServiceDesk platform.
 * Runs automatically on first container start via docker-entrypoint-initdb.d.
 */

db = db.getSiblingDB('servicedesk');

print('── Creating collections and indexes ──');

// ============================================================
// Notifications Module — Unified Notifications
// ============================================================
db.createCollection('unified_notifications');

db.unified_notifications.createIndex({ userId: 1, read: 1, createdAt: -1 });
db.unified_notifications.createIndex({ userId: 1, source: 1, createdAt: -1 });
db.unified_notifications.createIndex({ organizationId: 1, createdAt: -1 });
db.unified_notifications.createIndex(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60, name: 'ttl_90_days' }
);

print('✅ unified_notifications collection + indexes created');

// ============================================================
// Analytics Module — CQRS Read Models
// ============================================================

// ── TaskSnapshot ──────────────────────────────────────────────
db.createCollection('analytics_task_snapshots');

db.analytics_task_snapshots.createIndex(
  { sourceId: 1, sourceModule: 1 },
  { unique: true }
);
db.analytics_task_snapshots.createIndex({ sourceModule: 1, statusCategory: 1, createdAt: -1 });
db.analytics_task_snapshots.createIndex({ sourceModule: 1, type: 1, createdAt: -1 });
db.analytics_task_snapshots.createIndex({ sourceModule: 1, priority: 1, createdAt: -1 });
db.analytics_task_snapshots.createIndex({ assigneeId: 1, statusCategory: 1, createdAt: -1 });
db.analytics_task_snapshots.createIndex({ organizationId: 1, statusCategory: 1, createdAt: -1 });

print('✅ analytics_task_snapshots collection + indexes created');

// ── DailyKPISnapshot ──────────────────────────────────────────
db.createCollection('analytics_daily_kpi_snapshots');

db.analytics_daily_kpi_snapshots.createIndex(
  { date: 1, organizationId: 1, sourceModule: 1 },
  { unique: true }
);

print('✅ analytics_daily_kpi_snapshots collection + indexes created');

// ── EventLog ──────────────────────────────────────────────────
db.createCollection('analytics_event_log');

db.analytics_event_log.createIndex({ eventId: 1 }, { unique: true });
db.analytics_event_log.createIndex({ eventType: 1 });
db.analytics_event_log.createIndex({ domain: 1 });
db.analytics_event_log.createIndex({ entity: 1 });
db.analytics_event_log.createIndex({ action: 1 });
db.analytics_event_log.createIndex({ organizationId: 1 });
db.analytics_event_log.createIndex({ domain: 1, action: 1, timestamp: -1 });
db.analytics_event_log.createIndex({ organizationId: 1, domain: 1, timestamp: -1 });
db.analytics_event_log.createIndex(
  { timestamp: 1 },
  { expireAfterSeconds: 365 * 24 * 60 * 60, name: 'ttl_365_days' }
);

print('✅ analytics_event_log collection + indexes created');

// ============================================================
// Done
// ============================================================
print('🎉 MongoDB init complete — all collections and indexes ready');
