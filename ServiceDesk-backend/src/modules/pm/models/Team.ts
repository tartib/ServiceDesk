import mongoose, { Schema } from 'mongoose';

export interface IPMTeam {
  _id: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  avatar?: string;
  lead?: mongoose.Types.ObjectId;
  members: Array<{
    userId: mongoose.Types.ObjectId;
    role: 'lead' | 'member';
    joinedAt: Date;
  }>;
  settings: {
    defaultCapacity: number;
    sprintLength: number;
    workingDays: number[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<IPMTeam>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'PMOrganization',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    avatar: {
      type: String,
    },
    lead: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    members: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        role: { type: String, enum: ['lead', 'member'], default: 'member' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    settings: {
      defaultCapacity: { type: Number, default: 40 },
      sprintLength: { type: Number, default: 14 },
      workingDays: { type: [Number], default: [1, 2, 3, 4, 5] },
    },
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

TeamSchema.index({ organizationId: 1 });
TeamSchema.index({ 'members.userId': 1 });
TeamSchema.index({ organizationId: 1, name: 1 }, { unique: true });

const PMTeam = mongoose.model<IPMTeam>('PMTeam', TeamSchema);

export default PMTeam;
