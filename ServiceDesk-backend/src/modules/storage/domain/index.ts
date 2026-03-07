/**
 * Storage Module — Domain Layer
 *
 * Service-only module. Domain interfaces define what storage services expose.
 */

export interface IFileUploadService {
  upload(file: any, userId: string, orgId?: string, folderId?: string): Promise<any>;
  uploadMultiple(files: any[], userId: string, orgId?: string, folderId?: string): Promise<any[]>;
  download(fileId: string, userId: string): Promise<{ stream: NodeJS.ReadableStream; file: any }>;
  deleteFile(fileId: string, userId: string): Promise<void>;
  restoreFile(fileId: string, userId: string): Promise<any>;
}

export interface IFileFolderService {
  create(data: any, userId: string): Promise<any>;
  getById(id: string): Promise<any>;
  list(parentId?: string): Promise<any[]>;
  move(folderId: string, parentId: string): Promise<any>;
  deleteFolder(id: string): Promise<void>;
}

export interface IFileShareService {
  share(options: any): Promise<any>;
  getByToken(token: string): Promise<any>;
  revoke(linkId: string, userId: string): Promise<void>;
}
