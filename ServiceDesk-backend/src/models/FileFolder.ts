import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFileFolder extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  parent?: Types.ObjectId;
  owner: Types.ObjectId;
  organization?: Types.ObjectId;
  path: string;
  color?: string;
  icon?: string;
  permissions: {
    user: Types.ObjectId;
    role: 'viewer' | 'editor' | 'owner';
  }[];
  isPublic: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const fileFolderSchema = new Schema<IFileFolder>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    parent: {
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
    path: {
      type: String,
      required: true,
      index: true,
    },
    color: {
      type: String,
      default: '#3B82F6',
    },
    icon: {
      type: String,
      default: 'folder',
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
    isPublic: {
      type: Boolean,
      default: false,
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

fileFolderSchema.index({ owner: 1, isDeleted: 1 });
fileFolderSchema.index({ organization: 1, isDeleted: 1 });
fileFolderSchema.index({ parent: 1, isDeleted: 1 });
fileFolderSchema.index({ path: 1, isDeleted: 1 });

fileFolderSchema.pre('save', async function(next) {
  if (this.isModified('parent') || this.isNew) {
    if (this.parent) {
      const parentFolder = await mongoose.model('FileFolder').findById(this.parent);
      if (parentFolder) {
        this.path = `${parentFolder.path}/${this.name}`;
      } else {
        this.path = `/${this.name}`;
      }
    } else {
      this.path = `/${this.name}`;
    }
  }
  next();
});

export default mongoose.model<IFileFolder>('FileFolder', fileFolderSchema);
