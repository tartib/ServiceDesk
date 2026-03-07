import mongoose, { Document, Schema } from 'mongoose';
import { SlaMetricKey, SlaMetricStatus } from '../domain';

export interface ISlaMetricInstanceDoc extends Document {
  instanceId: string;
  goalId?: string;
  metricKey: string;
  status: string;
  targetMinutes: number;
  elapsedBusinessSeconds: number;
  remainingBusinessSeconds?: number;
  startedAt: Date;
  pausedAt?: Date;
  stoppedAt?: Date;
  dueAt?: Date;
  breachedAt?: Date;
  lastStateChangeAt: Date;
  calendarId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SlaMetricInstanceSchema = new Schema<ISlaMetricInstanceDoc>(
  {
    instanceId: { type: String, required: true, index: true },
    goalId: { type: String },
    metricKey: { type: String, enum: Object.values(SlaMetricKey), required: true },
    status: { type: String, enum: Object.values(SlaMetricStatus), default: SlaMetricStatus.RUNNING },
    targetMinutes: { type: Number, required: true },
    elapsedBusinessSeconds: { type: Number, default: 0 },
    remainingBusinessSeconds: { type: Number },
    startedAt: { type: Date, required: true },
    pausedAt: { type: Date },
    stoppedAt: { type: Date },
    dueAt: { type: Date },
    breachedAt: { type: Date },
    lastStateChangeAt: { type: Date, required: true },
    calendarId: { type: String },
  },
  {
    timestamps: true,
    collection: 'sla_metric_instances',
  }
);

SlaMetricInstanceSchema.index({ instanceId: 1, metricKey: 1 }, { unique: true });
SlaMetricInstanceSchema.index({ status: 1, dueAt: 1 });

const SlaMetricInstance = mongoose.model<ISlaMetricInstanceDoc>('SlaMetricInstance', SlaMetricInstanceSchema);
export default SlaMetricInstance;
