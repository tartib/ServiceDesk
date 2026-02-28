import mongoose, { Schema } from 'mongoose';

export interface IPMValueStreamStep {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  name: string;
  type: 'process' | 'wait' | 'decision';
  order: number;
  processTime: number;
  waitTime: number;
  valueAdded: boolean;
  efficiency: number;
  bottleneck: boolean;
  owner?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ValueStreamStepSchema = new Schema<IPMValueStreamStep>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'PMProject', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'PMOrganization', required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['process', 'wait', 'decision'], required: true },
    order: { type: Number, required: true, default: 0 },
    processTime: { type: Number, default: 0 },
    waitTime: { type: Number, default: 0 },
    valueAdded: { type: Boolean, default: true },
    efficiency: { type: Number, default: 0, min: 0, max: 100 },
    bottleneck: { type: Boolean, default: false },
    owner: { type: String },
    description: { type: String },
  },
  { timestamps: true }
);

ValueStreamStepSchema.index({ projectId: 1, order: 1 });

const PMValueStreamStep = mongoose.model<IPMValueStreamStep>('PMValueStreamStep', ValueStreamStepSchema);
export default PMValueStreamStep;
