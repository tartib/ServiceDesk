import mongoose, { Document, Schema } from 'mongoose';
import { SlaEventType, SlaEventSource } from '../domain';

export interface ISlaEventDoc extends Document {
  tenantId: string;
  instanceId: string;
  metricInstanceId?: string;
  ticketId: string;
  eventType: string;
  eventSource: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

const SlaEventSchema = new Schema<ISlaEventDoc>(
  {
    tenantId: { type: String, required: true, index: true },
    instanceId: { type: String, required: true, index: true },
    metricInstanceId: { type: String, index: true },
    ticketId: { type: String, required: true },
    eventType: { type: String, enum: Object.values(SlaEventType), required: true },
    eventSource: { type: String, enum: Object.values(SlaEventSource), default: SlaEventSource.SYSTEM },
    payload: { type: Schema.Types.Mixed, default: {} },
    occurredAt: { type: Date, default: Date.now },
  },
  {
    collection: 'sla_events',
  }
);

SlaEventSchema.index({ ticketId: 1, occurredAt: -1 });
SlaEventSchema.index({ tenantId: 1, eventType: 1 });

const SlaEvent = mongoose.model<ISlaEventDoc>('SlaEvent', SlaEventSchema);
export default SlaEvent;
