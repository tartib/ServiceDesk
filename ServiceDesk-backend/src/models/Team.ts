import mongoose, { Document, Schema } from 'mongoose';

export type TeamMemberRole = 'leader' | 'maintainer' | 'member' | 'observer';
export type TeamType = 'support' | 'technical' | 'operations' | 'management' | 'security' | 'other';
export type TeamScope = 'global' | 'organization' | 'project';
export type TeamVisibility = 'public' | 'organization' | 'private';

/**
 * Team Member Interface
 */
export interface ITeamMember {
  user_id: mongoose.Types.ObjectId;
  role: TeamMemberRole;
  joined_at: Date;
  added_by?: mongoose.Types.ObjectId;
}

/**
 * Team Capacity Settings
 */
export interface ITeamCapacity {
  default_hours_per_week: number;
  sprint_length_days: number;
  working_days: number[];
}

/**
 * Team Interface — Unified model for both ITSM support teams and PM agile teams
 */
export interface ITeam extends Document {
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  type: TeamType;
  scope: TeamScope;
  visibility: TeamVisibility;
  organization_id?: mongoose.Types.ObjectId;
  project_id?: mongoose.Types.ObjectId;
  members: ITeamMember[];
  leader_id?: mongoose.Types.ObjectId;
  capacity?: ITeamCapacity;
  is_active: boolean;
  created_by: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
  member_count: number;
}

const TeamMemberSchema = new Schema<ITeamMember>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['leader', 'maintainer', 'member', 'observer'],
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

const TeamCapacitySchema = new Schema<ITeamCapacity>({
  default_hours_per_week: { type: Number, default: 40 },
  sprint_length_days: { type: Number, default: 14 },
  working_days: { type: [Number], default: [1, 2, 3, 4, 5] },
}, { _id: false });

const TeamSchema = new Schema<ITeam>(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
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
      enum: ['support', 'technical', 'operations', 'management', 'security', 'other'],
      default: 'support',
    },
    scope: {
      type: String,
      enum: ['global', 'organization', 'project'],
      default: 'global',
    },
    visibility: {
      type: String,
      enum: ['public', 'organization', 'private'],
      default: 'public',
    },
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: 'PMOrganization',
    },
    project_id: {
      type: Schema.Types.ObjectId,
      ref: 'PMProject',
    },
    members: {
      type: [TeamMemberSchema],
      default: [],
    },
    leader_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    capacity: {
      type: TeamCapacitySchema,
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

// Unique name within scope context
TeamSchema.index({ name: 1, organization_id: 1, project_id: 1 }, { unique: true });
TeamSchema.index({ type: 1 });
TeamSchema.index({ scope: 1 });
TeamSchema.index({ is_active: 1 });
TeamSchema.index({ organization_id: 1 });
TeamSchema.index({ project_id: 1 });
TeamSchema.index({ 'members.user_id': 1 });

const Team = mongoose.model<ITeam>('Team', TeamSchema);

export default Team;
