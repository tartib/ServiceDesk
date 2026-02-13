import mongoose, { Document, Schema } from 'mongoose';

export interface ITaskComment extends Document {
  taskId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  userName: string;
  comment: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const taskCommentSchema = new Schema<ITaskComment>(
  {
    taskId: {
      type: Schema.Types.ObjectId,
      ref: 'PrepTask',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    comment: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    attachments: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
taskCommentSchema.index({ taskId: 1, createdAt: -1 });
taskCommentSchema.index({ userId: 1, createdAt: -1 });

const TaskComment = mongoose.model<ITaskComment>('TaskComment', taskCommentSchema);

export default TaskComment;
