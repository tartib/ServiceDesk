import mongoose, { Schema, Document, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IFileShareLink extends Document {
  _id: Types.ObjectId;
  file: Types.ObjectId;
  token: string;
  createdBy: Types.ObjectId;
  expiresAt?: Date;
  maxDownloads?: number;
  downloadCount: number;
  password?: string;
  allowedEmails: string[];
  permissions: {
    canDownload: boolean;
    canView: boolean;
  };
  isActive: boolean;
  lastAccessedAt?: Date;
  accessLog: {
    ip: string;
    userAgent: string;
    accessedAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
  isExpired: boolean;
  hasReachedMaxDownloads: boolean;
  shareUrl: string;
}

const fileShareLinkSchema = new Schema<IFileShareLink>(
  {
    file: {
      type: Schema.Types.ObjectId,
      ref: 'FileStorage',
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      default: () => uuidv4(),
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    maxDownloads: {
      type: Number,
      min: 1,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    password: {
      type: String,
    },
    allowedEmails: [{
      type: String,
      lowercase: true,
      trim: true,
    }],
    permissions: {
      canDownload: {
        type: Boolean,
        default: true,
      },
      canView: {
        type: Boolean,
        default: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastAccessedAt: {
      type: Date,
    },
    accessLog: [{
      ip: {
        type: String,
        required: true,
      },
      userAgent: {
        type: String,
      },
      accessedAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
  }
);

fileShareLinkSchema.index({ token: 1, isActive: 1 });
fileShareLinkSchema.index({ createdBy: 1, createdAt: -1 });
fileShareLinkSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

fileShareLinkSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

fileShareLinkSchema.virtual('hasReachedMaxDownloads').get(function() {
  if (!this.maxDownloads) return false;
  return this.downloadCount >= this.maxDownloads;
});

fileShareLinkSchema.virtual('shareUrl').get(function() {
  return `/api/v1/files/share/${this.token}`;
});

export default mongoose.model<IFileShareLink>('FileShareLink', fileShareLinkSchema);
