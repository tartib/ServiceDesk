import mongoose, { Schema } from 'mongoose';

export interface IPMComment {
  _id: mongoose.Types.ObjectId;
  taskId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  content: string;
  author: mongoose.Types.ObjectId;
  mentions: mongoose.Types.ObjectId[];
  attachments: {
    name: string;
    url: string;
    size: number;
    mimeType: string;
  }[];
  isEdited: boolean;
  editedAt?: Date;
  parentId?: mongoose.Types.ObjectId;
  reactions: {
    emoji: string;
    users: mongoose.Types.ObjectId[];
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IPMComment>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'PMTask',
      required: true,
    },
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
    content: {
      type: String,
      required: true,
      maxlength: 10000,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mentions: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    attachments: [{
      name: { type: String, required: true },
      url: { type: String, required: true },
      size: { type: Number },
      mimeType: { type: String },
    }],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'PMComment',
    },
    reactions: [{
      emoji: { type: String, required: true },
      users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    }],
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

CommentSchema.index({ taskId: 1, createdAt: -1 });
CommentSchema.index({ projectId: 1 });
CommentSchema.index({ author: 1 });

const PMComment = mongoose.model<IPMComment>('PMComment', CommentSchema);

export default PMComment;
