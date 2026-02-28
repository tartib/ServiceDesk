import mongoose, { Schema } from 'mongoose';

export enum IntakeStage {
  DRAFT = 'draft',
  SCREENING = 'screening',
  BUSINESS_CASE = 'business_case',
  PRIORITIZATION = 'prioritization',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum IntakeCategory {
  NEW_PRODUCT = 'new_product',
  IMPROVEMENT = 'improvement',
  MAINTENANCE = 'maintenance',
  RESEARCH = 'research',
  INFRASTRUCTURE = 'infrastructure',
}

export enum IntakePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum IntakeRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface IIntakeScore {
  criterion: string;
  score: number; // 1-5
  scoredBy: mongoose.Types.ObjectId;
  scoredAt: Date;
}

export interface IIntakeStageHistory {
  stage: IntakeStage;
  enteredAt: Date;
  exitedAt?: Date;
  action?: string;
  actionBy?: mongoose.Types.ObjectId;
  comment?: string;
}

export interface IIntakeComment {
  _id?: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
}

export interface IIntakeAttachment {
  name: string;
  url: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
}

export interface IProjectIntake {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  requestedBy: mongoose.Types.ObjectId;
  category: IntakeCategory;
  priority: IntakePriority;

  // Business case
  businessJustification?: string;
  expectedBenefits?: string;
  estimatedBudget?: number;
  estimatedTimeline?: string;
  riskLevel?: IntakeRiskLevel;
  strategicAlignment?: string;

  // Project preferences
  preferredMethodology?: string;
  suggestedTeam?: string;

  // Workflow
  stage: IntakeStage;
  stageHistory: IIntakeStageHistory[];
  scores: IIntakeScore[];
  comments: IIntakeComment[];
  reviewers: mongoose.Types.ObjectId[];
  approvedBy?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  attachments: IIntakeAttachment[];

  createdAt: Date;
  updatedAt: Date;
}

const ProjectIntakeSchema = new Schema<IProjectIntake>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'PMOrganization',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    category: {
      type: String,
      enum: Object.values(IntakeCategory),
      required: true,
    },
    priority: {
      type: String,
      enum: Object.values(IntakePriority),
      default: IntakePriority.MEDIUM,
    },

    // Business case
    businessJustification: { type: String, maxlength: 5000 },
    expectedBenefits: { type: String, maxlength: 3000 },
    estimatedBudget: { type: Number, min: 0 },
    estimatedTimeline: { type: String, maxlength: 200 },
    riskLevel: {
      type: String,
      enum: Object.values(IntakeRiskLevel),
    },
    strategicAlignment: { type: String, maxlength: 3000 },

    // Project preferences
    preferredMethodology: { type: String },
    suggestedTeam: { type: String, maxlength: 500 },

    // Workflow
    stage: {
      type: String,
      enum: Object.values(IntakeStage),
      default: IntakeStage.DRAFT,
    },
    stageHistory: [
      {
        stage: { type: String, enum: Object.values(IntakeStage), required: true },
        enteredAt: { type: Date, required: true },
        exitedAt: { type: Date },
        action: { type: String },
        actionBy: { type: Schema.Types.ObjectId, ref: 'User' },
        comment: { type: String },
      },
    ],
    scores: [
      {
        criterion: { type: String, required: true },
        score: { type: Number, required: true, min: 1, max: 5 },
        scoredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        scoredAt: { type: Date, default: Date.now },
      },
    ],
    comments: [
      {
        author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        content: { type: String, required: true, maxlength: 2000 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    reviewers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    projectId: { type: Schema.Types.ObjectId, ref: 'PMProject' },
    attachments: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.__v = undefined;
        return ret;
      },
    },
  }
);

ProjectIntakeSchema.index({ organizationId: 1, stage: 1 });
ProjectIntakeSchema.index({ organizationId: 1, requestedBy: 1 });
ProjectIntakeSchema.index({ organizationId: 1, createdAt: -1 });
ProjectIntakeSchema.index({ stage: 1 });

const ProjectIntake = mongoose.model<IProjectIntake>('PMProjectIntake', ProjectIntakeSchema);

export default ProjectIntake;
