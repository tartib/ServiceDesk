import mongoose, { Schema } from 'mongoose';

export interface IPMPhase {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  order: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold';
  plannedStartDate?: Date;
  plannedEndDate?: Date;
  actualStartDate?: Date;
  actualEndDate?: Date;
  deliverables: string[];
  progress: number;
  createdAt: Date;
  updatedAt: Date;
}

const PhaseSchema = new Schema<IPMPhase>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'PMProject', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'PMOrganization', required: true },
    name: { type: String, required: true },
    description: { type: String },
    order: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['not_started', 'in_progress', 'completed', 'on_hold'], default: 'not_started' },
    plannedStartDate: { type: Date },
    plannedEndDate: { type: Date },
    actualStartDate: { type: Date },
    actualEndDate: { type: Date },
    deliverables: [{ type: String }],
    progress: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

PhaseSchema.index({ projectId: 1, order: 1 });

const PMPhase = mongoose.model<IPMPhase>('PMPhase', PhaseSchema);
export default PMPhase;
