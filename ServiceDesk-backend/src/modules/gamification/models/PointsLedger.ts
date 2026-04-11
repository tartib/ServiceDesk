import { Schema, model, Document, Types } from 'mongoose';

export interface IPointsLedgerDoc extends Document {
  userId: Types.ObjectId;
  organizationId: Types.ObjectId;
  pointsDelta: number;
  reasonCode: string;
  sourceModule: string;
  sourceEntityType: string;
  sourceEntityId: string;
  eventId: string;
  ruleId?: string;
  balanceAfter: number;
  metadata?: Record<string, unknown>;
}

const pointsLedgerSchema = new Schema<IPointsLedgerDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    organizationId: { type: Schema.Types.ObjectId, required: true },
    pointsDelta: { type: Number, required: true },
    reasonCode: { type: String, required: true },
    sourceModule: { type: String, required: true },
    sourceEntityType: { type: String, required: true },
    sourceEntityId: { type: String, required: true },
    eventId: { type: String, required: true },
    ruleId: { type: String },
    balanceAfter: { type: Number, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Idempotency: prevent duplicate ledger entries for the same event + reason + user
pointsLedgerSchema.index({ eventId: 1, reasonCode: 1, userId: 1 }, { unique: true });
pointsLedgerSchema.index({ userId: 1, organizationId: 1, createdAt: -1 });
pointsLedgerSchema.index({ organizationId: 1, createdAt: -1 });

export default model<IPointsLedgerDoc>('PointsLedger', pointsLedgerSchema);
