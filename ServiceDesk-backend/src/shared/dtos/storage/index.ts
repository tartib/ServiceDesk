/**
 * File Storage DTOs
 */

// File DTOs
export interface UploadFileDTO {
  file: Buffer;
  fileName: string;
  mimeType: string;
  size: number;
  folderId?: string;
  metadata?: {
    description?: string;
    tags?: string[];
    isPublic?: boolean;
  };
}

export interface FileDTO {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  folderId?: string;
  uploadedBy: string;
  isPublic: boolean;
  tags: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileListDTO {
  items: FileDTO[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface UpdateFileDTO {
  fileName?: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
  folderId?: string;
}

export interface FileMetadataDTO {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  lastAccessedAt?: Date;
  accessCount: number;
  isPublic: boolean;
}

// Folder DTOs
export interface CreateFolderDTO {
  name: string;
  description?: string;
  parentFolderId?: string;
  isPublic?: boolean;
}

export interface UpdateFolderDTO {
  name?: string;
  description?: string;
  isPublic?: boolean;
}

export interface FolderDTO {
  id: string;
  name: string;
  description?: string;
  parentFolderId?: string;
  fileCount: number;
  subfolderCount: number;
  isPublic: boolean;
  owner: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FolderListDTO {
  items: FolderDTO[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface FolderTreeDTO {
  id: string;
  name: string;
  children: FolderTreeDTO[];
  fileCount: number;
}

// File Share DTOs
export interface ShareFileDTO {
  fileId: string;
  sharedWith: string[];
  permission: 'view' | 'download' | 'edit';
  expiresAt?: Date;
}

export interface FileShareDTO {
  id: string;
  fileId: string;
  fileName: string;
  sharedBy: string;
  sharedWith: string;
  permission: 'view' | 'download' | 'edit';
  createdAt: Date;
  expiresAt?: Date;
}

// File Version DTOs
export interface FileVersionDTO {
  id: string;
  fileId: string;
  version: number;
  fileName: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  changeLog?: string;
}

export interface FileVersionListDTO {
  fileId: string;
  fileName: string;
  versions: FileVersionDTO[];
}

// Bulk Operations DTOs
export interface BulkUploadDTO {
  files: UploadFileDTO[];
  folderId?: string;
}

export interface BulkDeleteDTO {
  fileIds: string[];
}

export interface BulkMoveDTO {
  fileIds: string[];
  targetFolderId: string;
}

export interface BulkShareDTO {
  fileIds: string[];
  sharedWith: string[];
  permission: 'view' | 'download' | 'edit';
}

// Storage Stats DTOs
export interface StorageStatsDTO {
  totalSize: number;
  usedSize: number;
  availableSize: number;
  fileCount: number;
  folderCount: number;
  usagePercentage: number;
  lastUpdated: Date;
}

export interface UserStorageDTO {
  userId: string;
  totalSize: number;
  usedSize: number;
  fileCount: number;
  lastUpdated: Date;
}
