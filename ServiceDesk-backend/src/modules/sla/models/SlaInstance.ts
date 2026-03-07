import mongoose, { Document, Schema } from 'mongoose';
import { SlaEntityType, SlaInstanceStatus } from '../domain';

export interface ISlaInstanceDoc extends Document {
  tenantId: string;
  ticketId: string;
  ticketType: string;
  policyId: string;
  status: string;
  startedAt: Date;
  stoppedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SlaInstanceSchema = new Schema<ISlaInstanceDoc>(
  {
    tenantId: { type: String, required: true, index: true },
    ticketId: { type: String, required: true },
    ticketType: { type: String, enum: Object.values(SlaEntityType), required: true },
    policyId: { type: String, required: true },
    status: { type: String, enum: Object.values(SlaInstanceStatus), default: SlaInstanceStatus.ACTIVE },
    startedAt: { type: Date, required: true },
    stoppedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'sla_instances',
  }
);

SlaInstanceSchema.index({ tenantId: 1, ticketId: 1, policyId: 1 }, { unique: true });
SlaInstanceSchema.index({ status: 1 });

const SlaInstance = mongoose.model<ISlaInstanceDoc>('SlaInstance', SlaInstanceSchema);
export default SlaInstance;
