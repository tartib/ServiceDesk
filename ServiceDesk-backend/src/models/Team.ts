import mongoose, { Document, Schema } from 'mongoose';

/**
 * Team Member Interface
 */
export interface ITeamMember {
  user_id: mongoose.Types.ObjectId;
  role: 'leader' | 'member';
  joined_at: Date;
  added_by?: mongoose.Types.ObjectId;
}

/**
 * Team Interface
 */
export interface ITeam extends Document {
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  type: 'support' | 'technical' | 'operations' | 'management' | 'other';
  members: ITeamMember[];
  leader_id?: mongoose.Types.ObjectId;
  is_active: boolean;
  created_by: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['leader', 'member'],
    default: 'member',
  },
  joined_at: {
    type: Date,
    default: Date.now,
  },
  added_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, { _id: false });

const TeamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      unique: true,
    },
    name_ar: {
      type: String,
      required: [true, 'Arabic team name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    description_ar: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['support', 'technical', 'operations', 'management', 'other'],
      default: 'support',
    },
    members: {
      type: [TeamMemberSchema],
      default: [],
    },
    leader_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for member count
TeamSchema.virtual('member_count').get(function() {
  return this.members?.length || 0;
});

// Index for faster queries
TeamSchema.index({ type: 1 });
TeamSchema.index({ is_active: 1 });
TeamSchema.index({ 'members.user_id': 1 });

const Team = mongoose.model<ITeam>('Team', TeamSchema);

export default Team;
