import mongoose, { Schema } from 'mongoose';

export interface IPMImprovement {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: 'waste_reduction' | 'process_improvement' | 'quality' | 'efficiency' | 'automation';
  status: 'idea' | 'evaluating' | 'approved' | 'in_progress' | 'completed' | 'rejected';
  priority: 'high' | 'medium' | 'low';
  submittedBy: mongoose.Types.ObjectId;
  assignee?: mongoose.Types.ObjectId;
  votes: number;
  voters: mongoose.Types.ObjectId[];
  expectedImpact: string;
  estimatedSavings?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ImprovementSchema = new Schema<IPMImprovement>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'PMProject', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'PMOrganization', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ['waste_reduction', 'process_improvement', 'quality', 'efficiency', 'automation'], required: true },
    status: { type: String, enum: ['idea', 'evaluating', 'approved', 'in_progress', 'completed', 'rejected'], default: 'idea' },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignee: { type: Schema.Types.ObjectId, ref: 'User' },
    votes: { type: Number, default: 0 },
    voters: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    expectedImpact: { type: String, required: true },
    estimatedSavings: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

ImprovementSchema.index({ projectId: 1, status: 1 });

const PMImprovement = mongoose.model<IPMImprovement>('PMImprovement', ImprovementSchema);
export default PMImprovement;
