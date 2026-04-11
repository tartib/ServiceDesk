/**
 * Segment Model
 */

import mongoose, { Document, Schema } from 'mongoose';
import {
  SegmentOperator,
  SegmentConditionField,
  SegmentLogicGroup,
} from '../domain/enums';

export interface ISegmentDocument extends Document {
  name: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  rules: {
    field: SegmentConditionField;
    customFieldKey?: string;
    operator: SegmentOperator;
    value: unknown;
    logicGroup: SegmentLogicGroup;
  }[];
  estimatedCount?: number;
  lastEvaluatedAt?: Date;
  isActive: boolean;
  organizationId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const segmentRuleSchema = new Schema(
  {
    field: {
      type: String,
      enum: Object.values(SegmentConditionField),
      required: true,
    },
    customFieldKey: { type: String },
    operator: {
      type: String,
      enum: Object.values(SegmentOperator),
      required: true,
    },
    value: { type: Schema.Types.Mixed, required: true },
    logicGroup: {
      type: String,
      enum: Object.values(SegmentLogicGroup),
      default: SegmentLogicGroup.AND,
    },
  },
  { _id: false }
);

const segmentSchema = new Schema<ISegmentDocument>(
  {
    name: { type: String, required: true, maxlength: 200 },
    nameAr: { type: String, maxlength: 200 },
    description: { type: String, maxlength: 2000 },
    descriptionAr: { type: String, maxlength: 2000 },
    rules: [segmentRuleSchema],
    estimatedCount: { type: Number },
    lastEvaluatedAt: { type: Date },
    isActive: { type: Boolean, default: true, index: true },
    organizationId: { type: Schema.Types.ObjectId, required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, collection: 'notification_segments' }
);

segmentSchema.index({ organizationId: 1, isActive: 1, createdAt: -1 });

const Segment = mongoose.model<ISegmentDocument>('CampaignSegment', segmentSchema);
export default Segment;
