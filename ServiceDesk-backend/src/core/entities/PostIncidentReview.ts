import mongoose, { Document, Schema } from 'mongoose';
import { PIRStatus, RCAMethod, IFollowUpAction } from '../types/itsm.types';

export interface IPIR extends Document {
  pir_id: string;
  incident_id: string;
  status: PIRStatus;
  owner: string;
  owner_name: string;
  incident_summary: string;
  impact_summary: string;
  timeline_summary: string;
  root_cause_summary?: string;
  rca_method?: RCAMethod;
  contributing_factors: string[];
  follow_up_actions: IFollowUpAction[];
  lessons_learned?: string;
  participants: { id: string; name: string; role: string }[];
  review_date?: Date;
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
}

const FollowUpActionSchema = new Schema<IFollowUpAction>(
  {
    action_id: { type: String, required: true },
    description: { type: String, required: true },
    owner: { type: String, required: true },
    owner_name: { type: String, required: true },
    due_date: { type: Date },
    completed: { type: Boolean, default: false },
    completed_at: { type: Date },
  },
  { _id: false }
);

const ParticipantSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
  },
  { _id: false }
);

const PIRSchema = new Schema<IPIR>(
  {
    pir_id: { type: String, required: true, unique: true, index: true },
    incident_id: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: Object.values(PIRStatus),
      default: PIRStatus.DRAFT,
      index: true,
    },
    owner: { type: String, required: true },
    owner_name: { type: String, required: true },
    incident_summary: { type: String, required: true },
    impact_summary: { type: String, required: true },
    timeline_summary: { type: String, default: '' },
    root_cause_summary: { type: String },
    rca_method: { type: String, enum: Object.values(RCAMethod) },
    contributing_factors: { type: [String], default: [] },
    follow_up_actions: { type: [FollowUpActionSchema], default: [] },
    lessons_learned: { type: String },
    participants: { type: [ParticipantSchema], default: [] },
    review_date: { type: Date },
    completed_at: { type: Date },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

PIRSchema.index({ incident_id: 1, status: 1 });

const PostIncidentReview = (mongoose.models['PostIncidentReview'] as mongoose.Model<IPIR>) ||
  mongoose.model<IPIR>('PostIncidentReview', PIRSchema);

export default PostIncidentReview;
