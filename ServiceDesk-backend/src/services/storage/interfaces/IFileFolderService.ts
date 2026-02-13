import { Types } from 'mongoose';
import { IFileFolder } from '../../../models/FileFolder';
import { IFileStorage } from '../../../models/FileStorage';

export interface CreateFolderOptions {
  name: string;
  userId: Types.ObjectId;
  organizationId?: Types.ObjectId;
  parentId?: Types.ObjectId;
  description?: string;
  isPublic?: boolean;
}

export interface IFileFolderService {
  /**
   * Create a new folder
   */
  createFolder(options: CreateFolderOptions): Promise<IFileFolder>;

  /**
   * Get folder contents (files and subfolders)
   */
  getFolderContents(
    folderId: Types.ObjectId | null,
    userId: Types.ObjectId,
    organizationId?: Types.ObjectId
  ): Promise<{ folders: IFileFolder[]; files: IFileStorage[] }>;

  /**
   * Move a file to a different folder
   */
  moveFile(
    fileId: Types.ObjectId,
    targetFolderId: Types.ObjectId | null,
    userId: Types.ObjectId
  ): Promise<IFileStorage>;

  /**
   * Delete a folder
   */
  deleteFolder(folderId: Types.ObjectId, userId: Types.ObjectId): Promise<void>;

  /**
   * Get folder by ID
   */
  getFolderById(folderId: Types.ObjectId): Promise<IFileFolder | null>;
}
