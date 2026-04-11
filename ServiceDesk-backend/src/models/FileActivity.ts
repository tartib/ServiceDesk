import mongoose, { Schema, Document, Types } from 'mongoose';

export type FileAction =
  | 'upload'
  | 'download'
  | 'preview'
  | 'share'
  | 'delete'
  | 'restore'
  | 'permanent_delete'
  | 'move'
  | 'rename'
  | 'presigned_url';

export interface IFileActivity extends Document {
  _id: Types.ObjectId;
  file: Types.ObjectId;
  user: Types.ObjectId;
  action: FileAction;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const fileActivitySchema = new Schema<IFileActivity>(
  {
    file: {
      type: Schema.Types.ObjectId,
      ref: 'FileStorage',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        'upload',
        'download',
        'preview',
        'share',
        'delete',
        'restore',
        'permanent_delete',
        'move',
        'rename',
        'presigned_url',
      ],
      required: true,
    },
    ip: {
      type: String,
    },
    userAgent: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'fileactivity',
  }
);

fileActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

export default mongoose.model<IFileActivity>('FileActivity', fileActivitySchema);
