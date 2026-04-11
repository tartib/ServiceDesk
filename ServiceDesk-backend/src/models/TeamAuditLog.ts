import mongoose, { Document, Schema } from 'mongoose';

export type TeamAuditAction =
  | 'team_created'
  | 'team_updated'
  | 'team_deleted'
  | 'member_added'
  | 'member_removed'
  | 'role_changed'
  | 'leader_transferred'
  | 'queue_created'
  | 'queue_updated';

export interface ITeamAuditLog extends Document {
  team_id: mongoose.Types.ObjectId;
  action: TeamAuditAction;
  actor_id: mongoose.Types.ObjectId;
  target_user_id?: mongoose.Types.ObjectId;
  before_data?: Record<string, unknown>;
  after_data?: Record<string, unknown>;
  note?: string;
  created_at: Date;
}

const TeamAuditLogSchema = new Schema<ITeamAuditLog>(
  {
    team_id: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    action: {
      type: String,
      enum: [
        'team_created',
        'team_updated',
        'team_deleted',
        'member_added',
        'member_removed',
        'role_changed',
        'leader_transferred',
        'queue_created',
        'queue_updated',
      ],
      required: true,
    },
    actor_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    target_user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    before_data: {
      type: Schema.Types.Mixed,
    },
    after_data: {
      type: Schema.Types.Mixed,
    },
    note: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
);

TeamAuditLogSchema.index({ team_id: 1, created_at: -1 });
TeamAuditLogSchema.index({ actor_id: 1 });
TeamAuditLogSchema.index({ action: 1 });

const TeamAuditLog = mongoose.model<ITeamAuditLog>('TeamAuditLog', TeamAuditLogSchema);

export default TeamAuditLog;
