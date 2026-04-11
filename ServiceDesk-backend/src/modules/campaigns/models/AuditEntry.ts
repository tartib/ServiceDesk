/**
 * Audit Entry Model
 */

import mongoose, { Document, Schema } from 'mongoose';
import { AuditAction, AuditEntityType } from '../domain/enums';

export interface IAuditEntryDocument extends Document {
  entityType: AuditEntityType;
  entityId: mongoose.Types.ObjectId;
  entityName?: string;
  action: AuditAction;
  performedBy: mongoose.Types.ObjectId;
  performedByName?: string;
  changes?: Record<string, { from: unknown; to: unknown }>;
  metadata?: Record<string, unknown>;
  organizationId: mongoose.Types.ObjectId;
  timestamp: Date;
}

const auditEntrySchema = new Schema<IAuditEntryDocument>(
  {
    entityType: {
      type: String,
      enum: Object.values(AuditEntityType),
      required: true,
      index: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true, index: true },
    entityName: { type: String, maxlength: 300 },
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
      index: true,
    },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    performedByName: { type: String, maxlength: 200 },
    changes: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed },
    organizationId: { type: Schema.Types.ObjectId, required: true, index: true },
    timestamp: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: false, collection: 'notification_audit_log' }
);

auditEntrySchema.index({ organizationId: 1, entityType: 1, timestamp: -1 });
auditEntrySchema.index({ entityId: 1, timestamp: -1 });
// TTL: keep audit for 2 years
auditEntrySchema.index({ timestamp: 1 }, { expireAfterSeconds: 730 * 24 * 60 * 60 });

const AuditEntry = mongoose.model<IAuditEntryDocument>('CampaignAuditEntry', auditEntrySchema);
export default AuditEntry;
