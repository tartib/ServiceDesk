import mongoose, { Schema } from 'mongoose';

export enum PointType {
  EARNED = 'earned',
  SPENT = 'spent',
  BONUS = 'bonus',
  PENALTY = 'penalty',
}

export interface IPointTransaction {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  type: PointType;
  category?: string;
  description?: string;
  approved: boolean;
  relatedTaskId?: mongoose.Types.ObjectId;
  relatedGoalId?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const PointTransactionSchema = new Schema<IPointTransaction>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'PMOrganization',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(PointType),
      required: true,
    },
    category: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    approved: {
      type: Boolean,
      default: true,
    },
    relatedTaskId: {
      type: Schema.Types.ObjectId,
      ref: 'PMTask',
    },
    relatedGoalId: {
      type: Schema.Types.ObjectId,
      ref: 'PMGoal',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

PointTransactionSchema.index({ userId: 1, approved: 1, createdAt: 1 });
PointTransactionSchema.index({ organizationId: 1 });

const PMPointTransaction = mongoose.model<IPointTransaction>('PMPointTransaction', PointTransactionSchema);

export default PMPointTransaction;
