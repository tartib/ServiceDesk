import mongoose, { Schema } from 'mongoose';

export interface IPMProjectFile {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  organizationId: mongoose.Types.ObjectId;
  name: string;
  type: 'file' | 'folder' | 'image' | 'document' | 'spreadsheet';
  size?: number;
  mimeType?: string;
  path?: string;
  uploadedBy: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;
  taskKey?: string;
  parentFolder?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectFileSchema = new Schema<IPMProjectFile>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'PMProject', required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: 'PMOrganization', required: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['file', 'folder', 'image', 'document', 'spreadsheet'], default: 'file' },
    size: { type: Number },
    mimeType: { type: String },
    path: { type: String },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'PMTask' },
    taskKey: { type: String },
    parentFolder: { type: Schema.Types.ObjectId, ref: 'PMProjectFile' },
  },
  { timestamps: true }
);

ProjectFileSchema.index({ projectId: 1, parentFolder: 1 });

const PMProjectFile = mongoose.model<IPMProjectFile>('PMProjectFile', ProjectFileSchema);
export default PMProjectFile;
