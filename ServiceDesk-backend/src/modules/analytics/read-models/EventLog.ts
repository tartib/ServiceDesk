/**
 * EventLog — Raw Event Store for Analytics
 *
 * Persists every domain event for historical analysis,
 * trend calculation, and audit trails.
 * Replaces the TODO in the analytics consumer.
 */

import mongoose, { Document, Schema } from 'mongoose';

export interface IEventLog extends Document {
  eventId: string;
  eventType: string;
  /** Top-level domain: 'itsm', 'pm', 'ops', 'wf', 'sd' */
  domain: string;
  /** Sub-domain/entity: 'work_order', 'sprint', 'service_request', etc. */
  entity: string;
  /** Action: 'created', 'completed', 'transitioned', etc. */
  action: string;
  organizationId?: string;
  userId?: string;
  /** Full event payload (stored as-is for flexibility) */
  payload: Record<string, any>;
  timestamp: Date;
  processedAt: Date;
}

const eventLogSchema = new Schema<IEventLog>(
  {
    eventId: { type: String, required: true, unique: true },
    eventType: { type: String, required: true, index: true },
    domain: { type: String, required: true, index: true },
    entity: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    organizationId: { type: String, index: true },
    userId: { type: String, index: true },
    payload: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, required: true, index: true },
    processedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    collection: 'analytics_event_log',
  }
);

// Compound indexes for trend queries
eventLogSchema.index({ domain: 1, action: 1, timestamp: -1 });
eventLogSchema.index({ organizationId: 1, domain: 1, timestamp: -1 });
// TTL index: auto-delete events older than 365 days
eventLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

const EventLog = mongoose.model<IEventLog>('EventLog', eventLogSchema);

export default EventLog;
