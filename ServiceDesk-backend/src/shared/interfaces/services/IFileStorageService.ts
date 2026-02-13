/**
 * File Storage Service Interface
 */

import {
  UploadFileDTO,
  FileDTO,
  FileListDTO,
  UpdateFileDTO,
  FolderDTO,
  FolderListDTO,
  ShareFileDTO,
  FileShareDTO,
  StorageStatsDTO,
} from '../../dtos/storage';

export interface IFileStorageService {
  // File operations
  uploadFile(dto: UploadFileDTO): Promise<FileDTO>;
  getFile(id: string): Promise<FileDTO>;
  updateFile(id: string, dto: UpdateFileDTO): Promise<FileDTO>;
  deleteFile(id: string): Promise<void>;
  listFiles(filter: FileFilterDTO): Promise<FileListDTO>;
  downloadFile(id: string): Promise<Buffer>;
  searchFiles(query: string): Promise<FileDTO[]>;

  // Folder operations
  createFolder(name: string, parentId?: string): Promise<FolderDTO>;
  getFolder(id: string): Promise<FolderDTO>;
  updateFolder(id: string, name: string): Promise<FolderDTO>;
  deleteFolder(id: string): Promise<void>;
  listFolders(parentId?: string): Promise<FolderListDTO>;

  // Sharing operations
  shareFile(dto: ShareFileDTO): Promise<FileShareDTO>;
  unshareFile(shareId: string): Promise<void>;
  getSharedFiles(userId: string): Promise<FileShareDTO[]>;

  // Storage management
  getStorageStats(): Promise<StorageStatsDTO>;
  getUserStorageStats(userId: string): Promise<StorageStatsDTO>;
  cleanupExpiredShares(): Promise<number>;
}

export interface FileFilterDTO {
  folderId?: string;
  mimeType?: string;
  uploadedBy?: string;
  isPublic?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
