import mongoose, { Schema } from 'mongoose';

export interface IPMMilestone {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  phaseId?: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  dueDate: Date;
  status: 'upcoming' | 'completed' | 'missed' | 'at_risk';
  completedAt?: Date;
  owner?: mongoose.Types.ObjectId;
  dependencies: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema = new Schema<IPMMilestone>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'PMProject', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'PMOrganization', required: true },
    phaseId: { type: Schema.Types.ObjectId, ref: 'PMPhase' },
    name: { type: String, required: true },
    description: { type: String },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['upcoming', 'completed', 'missed', 'at_risk'], default: 'upcoming' },
    completedAt: { type: Date },
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    dependencies: [{ type: Schema.Types.ObjectId, ref: 'PMMilestone' }],
  },
  { timestamps: true }
);

MilestoneSchema.index({ projectId: 1, dueDate: 1 });

const PMMilestone = mongoose.model<IPMMilestone>('PMMilestone', MilestoneSchema);
export default PMMilestone;
