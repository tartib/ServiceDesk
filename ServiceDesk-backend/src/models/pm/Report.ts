import mongoose, { Schema } from 'mongoose';

export interface IPMReport {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  name: string;
  type: 'velocity' | 'burndown' | 'sprint' | 'team' | 'custom';
  description: string;
  schedule: 'daily' | 'weekly' | 'monthly' | 'manual';
  icon: 'bar' | 'pie' | 'line' | 'table';
  config?: Record<string, unknown>;
  lastGeneratedAt?: Date;
  lastGeneratedBy?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IPMReport>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'PMProject', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'PMOrganization', required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['velocity', 'burndown', 'sprint', 'team', 'custom'], required: true },
    description: { type: String, required: true },
    schedule: { type: String, enum: ['daily', 'weekly', 'monthly', 'manual'], default: 'manual' },
    icon: { type: String, enum: ['bar', 'pie', 'line', 'table'], default: 'bar' },
    config: { type: Schema.Types.Mixed },
    lastGeneratedAt: { type: Date },
    lastGeneratedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ReportSchema.index({ projectId: 1 });

const PMReport = mongoose.model<IPMReport>('PMReport', ReportSchema);
export default PMReport;
