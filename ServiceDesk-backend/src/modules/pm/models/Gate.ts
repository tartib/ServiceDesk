import mongoose, { Schema } from 'mongoose';

export interface IGateCriteria {
  name: string;
  description?: string;
  status: 'not_checked' | 'passed' | 'failed';
  checkedBy?: mongoose.Types.ObjectId;
  checkedAt?: Date;
}

export interface IGateApprover {
  userId: mongoose.Types.ObjectId;
  role: string;
  decision: 'pending' | 'approved' | 'rejected';
  decidedAt?: Date;
  comment?: string;
}

export interface IGateComment {
  author: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
}

export interface IPMGate {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  phaseId?: mongoose.Types.ObjectId;
  name: string;
  phaseName?: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected';
  criteria: IGateCriteria[];
  approvers: IGateApprover[];
  comments: IGateComment[];
  requestedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const GateSchema = new Schema<IPMGate>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'PMProject', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'PMOrganization', required: true },
    phaseId: { type: Schema.Types.ObjectId, ref: 'PMPhase' },
    name: { type: String, required: true },
    phaseName: { type: String },
    status: { type: String, enum: ['pending', 'in_review', 'approved', 'rejected'], default: 'pending' },
    criteria: [{
      name: { type: String, required: true },
      description: { type: String },
      status: { type: String, enum: ['not_checked', 'passed', 'failed'], default: 'not_checked' },
      checkedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      checkedAt: { type: Date },
    }],
    approvers: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      role: { type: String, required: true },
      decision: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
      decidedAt: { type: Date },
      comment: { type: String },
    }],
    comments: [{
      author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      content: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
    }],
    requestedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

GateSchema.index({ projectId: 1 });

const PMGate = mongoose.model<IPMGate>('PMGate', GateSchema);
export default PMGate;
