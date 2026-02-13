import { Types } from 'mongoose';
import { IFileStorage } from '../../../models/FileStorage';

export interface UploadFileOptions {
  file: Express.Multer.File;
  userId: Types.ObjectId;
  organizationId?: Types.ObjectId;
  folderId?: Types.ObjectId;
  tags?: string[];
  description?: string;
  isPublic?: boolean;
}

export interface IFileUploadService {
  /**
   * Upload a single file to storage
   */
  uploadFile(options: UploadFileOptions): Promise<IFileStorage>;

  /**
   * Upload multiple files in batch
   */
  uploadMultipleFiles(
    files: Express.Multer.File[],
    userId: Types.ObjectId,
    organizationId?: Types.ObjectId,
    folderId?: Types.ObjectId
  ): Promise<IFileStorage[]>;

  /**
   * Download a file by ID
   */
  downloadFile(
    fileId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<{ stream: NodeJS.ReadableStream; file: IFileStorage }>;

  /**
   * Delete a file (soft delete)
   */
  deleteFile(fileId: Types.ObjectId, userId: Types.ObjectId): Promise<void>;

  /**
   * Permanently delete a file
   */
  permanentlyDeleteFile(fileId: Types.ObjectId, userId: Types.ObjectId): Promise<void>;

  /**
   * Restore a deleted file
   */
  restoreFile(fileId: Types.ObjectId, userId: Types.ObjectId): Promise<IFileStorage>;

  /**
   * Update file metadata
   */
  updateFileMetadata(
    fileId: Types.ObjectId,
    userId: Types.ObjectId,
    updates: {
      fileName?: string;
      description?: string;
      tags?: string[];
    }
  ): Promise<IFileStorage>;
}
