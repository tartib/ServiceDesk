import mongoose, { Schema } from 'mongoose';

export interface IPMStandup {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  yesterday?: string;
  today: string;
  blockers: string[];
  status: 'draft' | 'published';
  date: Date;
  writtenBy?: mongoose.Types.ObjectId;
  isTeamStandup: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StandupSchema = new Schema<IPMStandup>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'PMProject',
      required: true,
    },
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
    yesterday: {
      type: String,
      maxlength: 2000,
    },
    today: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    blockers: [{
      type: String,
      maxlength: 500,
    }],
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    date: {
      type: Date,
      default: () => new Date().setHours(0, 0, 0, 0),
    },
    writtenBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    isTeamStandup: {
      type: Boolean,
      default: false,
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

// Index for efficient queries
StandupSchema.index({ projectId: 1, date: -1 });
StandupSchema.index({ projectId: 1, userId: 1, date: 1 }, { unique: true });
StandupSchema.index({ organizationId: 1 });

const PMStandup = mongoose.model<IPMStandup>('PMStandup', StandupSchema);

export default PMStandup;
