import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFileMetadata {
  width?: number;
  height?: number;
  duration?: number;
  pages?: number;
  [key: string]: any;
}

export interface IFileStorage extends Document {
  _id: Types.ObjectId;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  bucket: string;
  objectKey: string;
  folder?: Types.ObjectId;
  owner: Types.ObjectId;
  organization?: Types.ObjectId;
  tags: string[];
  description?: string;
  metadata?: IFileMetadata;
  isPublic: boolean;
  permissions: {
    user: Types.ObjectId;
    role: 'viewer' | 'editor' | 'owner';
  }[];
  version: number;
  parentFile?: Types.ObjectId;
  checksum: string;
  downloadCount: number;
  lastAccessedAt?: Date;
  expiresAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const fileStorageSchema = new Schema<IFileStorage>(
  {
    fileName: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
    },
    bucket: {
      type: String,
      required: true,
    },
    objectKey: {
      type: String,
      required: true,
      unique: true,
    },
    folder: {
      type: Schema.Types.ObjectId,
      ref: 'FileFolder',
      default: null,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    description: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    permissions: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      role: {
        type: String,
        enum: ['viewer', 'editor', 'owner'],
        required: true,
      },
    }],
    version: {
      type: Number,
      default: 1,
    },
    parentFile: {
      type: Schema.Types.ObjectId,
      ref: 'FileStorage',
    },
    checksum: {
      type: String,
      required: true,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    lastAccessedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

fileStorageSchema.index({ owner: 1, isDeleted: 1, createdAt: -1 });
fileStorageSchema.index({ organization: 1, isDeleted: 1, createdAt: -1 });
fileStorageSchema.index({ folder: 1, isDeleted: 1 });
fileStorageSchema.index({ tags: 1 });
fileStorageSchema.index({ mimeType: 1 });
fileStorageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

fileStorageSchema.virtual('url').get(function() {
  return `/api/v1/files/${this._id}`;
});

fileStorageSchema.virtual('isImage').get(function() {
  return this.mimeType.startsWith('image/');
});

fileStorageSchema.virtual('isPDF').get(function() {
  return this.mimeType === 'application/pdf';
});

fileStorageSchema.virtual('isVideo').get(function() {
  return this.mimeType.startsWith('video/');
});

fileStorageSchema.virtual('isDocument').get(function() {
  const docTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];
  return docTypes.includes(this.mimeType);
});

fileStorageSchema.virtual('isText').get(function() {
  return this.mimeType.startsWith('text/');
});

fileStorageSchema.virtual('canPreview').get(function() {
  return this.mimeType.startsWith('image/') || 
         this.mimeType === 'application/pdf' || 
         this.mimeType.startsWith('text/');
});

fileStorageSchema.virtual('previewUrl').get(function() {
  const canPreview = this.mimeType.startsWith('image/') || 
                     this.mimeType === 'application/pdf' || 
                     this.mimeType.startsWith('text/');
  if (canPreview) {
    return `/api/v1/files/${this._id}/preview`;
  }
  return null;
});

fileStorageSchema.virtual('downloadUrl').get(function() {
  return `/api/v1/files/${this._id}/download`;
});

fileStorageSchema.virtual('fileType').get(function() {
  if (this.mimeType.startsWith('image/')) return 'image';
  if (this.mimeType === 'application/pdf') return 'pdf';
  if (this.mimeType.startsWith('text/')) return 'text';
  if (this.mimeType.startsWith('video/')) return 'video';
  if (this.mimeType.startsWith('audio/')) return 'audio';
  const docTypes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ];
  if (docTypes.includes(this.mimeType)) return 'document';
  return 'other';
});

export default mongoose.model<IFileStorage>('FileStorage', fileStorageSchema);
