import mongoose, { Schema } from 'mongoose';

export type RetrospectiveStatus = 'draft' | 'voting' | 'published' | 'archived';
export type NoteCategory = 'went_well' | 'to_improve';

export interface IRetrospectiveNote {
  _id: mongoose.Types.ObjectId;
  category: NoteCategory;
  content: string;
  createdBy: mongoose.Types.ObjectId;
  votes: mongoose.Types.ObjectId[];
  voteCount: number;
  createdAt: Date;
}

export interface IActionItem {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  owner?: mongoose.Types.ObjectId;
  dueDate?: Date;
  status: 'pending' | 'in_progress' | 'completed';
  linkedNoteId?: mongoose.Types.ObjectId;
  linkedToNextSprint?: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IPMRetrospective {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  sprintId: mongoose.Types.ObjectId;
  status: RetrospectiveStatus;
  maxVotesPerUser: number;
  notes: IRetrospectiveNote[];
  actionItems: IActionItem[];
  publishedBy?: mongoose.Types.ObjectId;
  publishedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const RetrospectiveNoteSchema = new Schema<IRetrospectiveNote>(
  {
    category: {
      type: String,
      enum: ['went_well', 'to_improve'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    votes: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    voteCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const ActionItemSchema = new Schema<IActionItem>(
  {
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed'],
      default: 'pending',
    },
    linkedNoteId: {
      type: Schema.Types.ObjectId,
    },
    linkedToNextSprint: {
      type: Schema.Types.ObjectId,
      ref: 'PMSprint',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

const RetrospectiveSchema = new Schema<IPMRetrospective>(
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
    sprintId: {
      type: Schema.Types.ObjectId,
      ref: 'PMSprint',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'voting', 'published', 'archived'],
      default: 'draft',
    },
    maxVotesPerUser: {
      type: Number,
      default: 3,
      min: 1,
      max: 10,
    },
    notes: [RetrospectiveNoteSchema],
    actionItems: [ActionItemSchema],
    publishedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    publishedAt: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

// Indexes
RetrospectiveSchema.index({ projectId: 1, sprintId: 1 }, { unique: true });
RetrospectiveSchema.index({ organizationId: 1 });
RetrospectiveSchema.index({ sprintId: 1 });

const PMRetrospective = mongoose.model<IPMRetrospective>('PMRetrospective', RetrospectiveSchema);

export default PMRetrospective;
