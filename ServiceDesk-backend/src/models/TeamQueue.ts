import mongoose, { Document, Schema } from 'mongoose';

export interface IQueuePriorityRule {
  field: string;
  value: string | number | boolean;
  boost: number;
}

export interface ITeamQueue extends Document {
  team_id: mongoose.Types.ObjectId;
  name: string;
  name_ar?: string;
  ticket_types: string[];
  priority_rules: IQueuePriorityRule[];
  sla_id?: mongoose.Types.ObjectId;
  is_default: boolean;
  is_active: boolean;
  created_by: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const QueuePriorityRuleSchema = new Schema<IQueuePriorityRule>({
  field: { type: String, required: true },
  value: { type: Schema.Types.Mixed, required: true },
  boost: { type: Number, default: 1 },
}, { _id: false });

const TeamQueueSchema = new Schema<ITeamQueue>(
  {
    team_id: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    name_ar: {
      type: String,
      trim: true,
    },
    ticket_types: {
      type: [String],
      default: [],
    },
    priority_rules: {
      type: [QueuePriorityRuleSchema],
      default: [],
    },
    sla_id: {
      type: Schema.Types.ObjectId,
      ref: 'SlaPolicy',
    },
    is_default: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

TeamQueueSchema.index({ team_id: 1 });
TeamQueueSchema.index({ team_id: 1, is_default: 1 });
TeamQueueSchema.index({ is_active: 1 });

const TeamQueue = mongoose.model<ITeamQueue>('TeamQueue', TeamQueueSchema);

export default TeamQueue;
