import { Types, FilterQuery } from 'mongoose';
import crypto from 'crypto';
import path from 'path';
import FileStorage, { IFileStorage } from '../models/FileStorage';
import FileFolder, { IFileFolder } from '../models/FileFolder';
import FileShareLink, { IFileShareLink } from '../models/FileShareLink';
import minioClient from '../config/minio';
import logger from '../utils/logger';
import bcrypt from 'bcryptjs';

interface UploadFileOptions {
  file: Express.Multer.File;
  userId: Types.ObjectId;
  organizationId?: Types.ObjectId;
  folderId?: Types.ObjectId;
  tags?: string[];
  description?: string;
  isPublic?: boolean;
}

interface CreateFolderOptions {
  name: string;
  userId: Types.ObjectId;
  organizationId?: Types.ObjectId;
  parentId?: Types.ObjectId;
  description?: string;
  isPublic?: boolean;
}

interface ShareLinkOptions {
  fileId: Types.ObjectId;
  userId: Types.ObjectId;
  expiresIn?: number;
  maxDownloads?: number;
  password?: string;
  allowedEmails?: string[];
  canDownload?: boolean;
  canView?: boolean;
}

class FileStorageService {
  private generateObjectKey(userId: Types.ObjectId, fileName: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(fileName);
    const baseName = path.basename(fileName, ext);
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
    return `${userId}/${timestamp}-${randomString}-${sanitizedName}${ext}`;
  }

  private calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('md5').update(buffer).digest('hex');
  }

  private getBucketByMimeType(mimeType: string): string {
    const defaultBucket = minioClient.getDefaultBucket();
    
    if (mimeType.startsWith('image/')) {
      return `${defaultBucket}-images`;
    } else if (mimeType.startsWith('video/')) {
      return `${defaultBucket}-videos`;
    } else if (
      mimeType === 'application/pdf' ||
      mimeType.includes('document') ||
      mimeType.includes('spreadsheet') ||
      mimeType.includes('presentation')
    ) {
      return `${defaultBucket}-documents`;
    }
    
    return defaultBucket;
  }

  async uploadFile(options: UploadFileOptions): Promise<IFileStorage> {
    const { file, userId, organizationId, folderId, tags, description, isPublic } = options;

    try {
      const objectKey = this.generateObjectKey(userId, file.originalname);
      const bucket = this.getBucketByMimeType(file.mimetype);
      const checksum = this.calculateChecksum(file.buffer);

      const metadata = {
        'content-type': file.mimetype,
      };

      await minioClient.uploadFile(
        bucket,
        objectKey,
        file.buffer,
        file.size,
        metadata
      );

      const fileDoc = await FileStorage.create({
        fileName: file.originalname,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        bucket,
        objectKey,
        folder: folderId,
        owner: userId,
        organization: organizationId,
        tags: tags || [],
        description,
        isPublic: isPublic || false,
        checksum,
        permissions: [
          {
            user: userId,
            role: 'owner',
          },
        ],
      });

      logger.info(`File uploaded successfully: ${fileDoc._id}`);
      return fileDoc;
    } catch (error) {
      logger.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    userId: Types.ObjectId,
    organizationId?: Types.ObjectId,
    folderId?: Types.ObjectId
  ): Promise<IFileStorage[]> {
    const uploadPromises = files.map(file =>
      this.uploadFile({
        file,
        userId,
        organizationId,
        folderId,
      })
    );

    return Promise.all(uploadPromises);
  }

  async getFileById(fileId: Types.ObjectId, userId: Types.ObjectId): Promise<IFileStorage | null> {
    const file = await FileStorage.findOne({
      _id: fileId,
      isDeleted: false,
    }).populate('owner', 'name email');

    if (!file) {
      return null;
    }

    const hasAccess = this.checkFileAccess(file, userId);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    return file;
  }

  async downloadFile(fileId: Types.ObjectId, userId: Types.ObjectId): Promise<{
    stream: NodeJS.ReadableStream;
    file: IFileStorage;
  }> {
    const file = await this.getFileById(fileId, userId);
    
    if (!file) {
      throw new Error('File not found');
    }

    const stream = await minioClient.downloadFile(file.bucket, file.objectKey);

    await FileStorage.findByIdAndUpdate(fileId, {
      $inc: { downloadCount: 1 },
      lastAccessedAt: new Date(),
    });

    return { stream, file };
  }

  async deleteFile(fileId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
    const file = await FileStorage.findOne({
      _id: fileId,
      isDeleted: false,
    });

    if (!file) {
      throw new Error('File not found');
    }

    const isOwner = file.owner.toString() === userId.toString();
    if (!isOwner) {
      throw new Error('Only the owner can delete this file');
    }

    file.isDeleted = true;
    file.deletedAt = new Date();
    file.deletedBy = userId;
    await file.save();

    logger.info(`File soft deleted: ${fileId}`);
  }

  async permanentlyDeleteFile(fileId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
    const file = await FileStorage.findOne({
      _id: fileId,
      isDeleted: true,
    });

    if (!file) {
      throw new Error('File not found in trash');
    }

    const isOwner = file.owner.toString() === userId.toString();
    if (!isOwner) {
      throw new Error('Only the owner can permanently delete this file');
    }

    await minioClient.deleteFile(file.bucket, file.objectKey);
    await FileStorage.findByIdAndDelete(fileId);

    logger.info(`File permanently deleted: ${fileId}`);
  }

  async restoreFile(fileId: Types.ObjectId, userId: Types.ObjectId): Promise<IFileStorage> {
    const file = await FileStorage.findOne({
      _id: fileId,
      isDeleted: true,
      owner: userId,
    });

    if (!file) {
      throw new Error('File not found in trash');
    }

    file.isDeleted = false;
    file.deletedAt = undefined;
    file.deletedBy = undefined;
    await file.save();

    logger.info(`File restored: ${fileId}`);
    return file;
  }

  async createFolder(options: CreateFolderOptions): Promise<IFileFolder> {
    const { name, userId, organizationId, parentId, description, isPublic } = options;

    // Generate path based on parent folder
    let path = `/${name}`;
    if (parentId) {
      const parentFolder = await FileFolder.findById(parentId);
      if (parentFolder) {
        path = `${parentFolder.path}/${name}`;
      }
    }

    const folder = await FileFolder.create({
      name,
      owner: userId,
      organization: organizationId,
      parent: parentId || null,
      description,
      path,
      isPublic: isPublic || false,
      permissions: [
        {
          user: userId,
          role: 'owner',
        },
      ],
    });

    logger.info(`Folder created: ${folder._id}`);
    return folder;
  }

  async getFolderContents(
    folderId: Types.ObjectId | null,
    userId: Types.ObjectId,
    organizationId?: Types.ObjectId
  ): Promise<{
    folders: IFileFolder[];
    files: IFileStorage[];
  }> {
    const query: { isDeleted: boolean; organization?: Types.ObjectId; owner?: Types.ObjectId } = {
      isDeleted: false,
    };

    if (organizationId) {
      query.organization = organizationId;
    } else {
      query.owner = userId;
    }

    const folders = await FileFolder.find({
      ...query,
      parent: folderId,
    }).sort({ name: 1 });

    const files = await FileStorage.find({
      ...query,
      folder: folderId,
    })
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    return { folders, files };
  }

  async moveFile(
    fileId: Types.ObjectId,
    targetFolderId: Types.ObjectId | null,
    userId: Types.ObjectId
  ): Promise<IFileStorage> {
    const file = await FileStorage.findOne({
      _id: fileId,
      isDeleted: false,
    });

    if (!file) {
      throw new Error('File not found');
    }

    const hasEditAccess = this.checkFileEditAccess(file, userId);
    if (!hasEditAccess) {
      throw new Error('Access denied');
    }

    file.folder = targetFolderId || undefined;
    await file.save();

    logger.info(`File moved: ${fileId} to folder: ${targetFolderId}`);
    return file;
  }

  async shareFile(options: ShareLinkOptions): Promise<IFileShareLink> {
    const {
      fileId,
      userId,
      expiresIn,
      maxDownloads,
      password,
      allowedEmails,
      canDownload = true,
      canView = true,
    } = options;

    const file = await FileStorage.findById(fileId);
    if (!file) {
      throw new Error('File not found');
    }

    const hasAccess = this.checkFileAccess(file, userId);
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    const shareLink = await FileShareLink.create({
      file: fileId,
      createdBy: userId,
      expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : undefined,
      maxDownloads,
      password: password ? await bcrypt.hash(password, 10) : undefined,
      allowedEmails: allowedEmails || [],
      permissions: {
        canDownload,
        canView,
      },
    });

    logger.info(`Share link created: ${shareLink._id} for file: ${fileId}`);
    return shareLink;
  }

  async getFileByShareToken(token: string): Promise<{
    file: IFileStorage;
    shareLink: IFileShareLink;
  }> {
    const shareLink = await FileShareLink.findOne({
      token,
      isActive: true,
    }).populate('file');

    if (!shareLink) {
      throw new Error('Invalid or expired share link');
    }

    if (shareLink.isExpired || shareLink.hasReachedMaxDownloads) {
      throw new Error('Share link has expired or reached maximum downloads');
    }

    const file = await FileStorage.findById(shareLink.file);
    if (!file) {
      throw new Error('File not found');
    }

    return { file, shareLink };
  }

  async updateFileMetadata(
    fileId: Types.ObjectId,
    userId: Types.ObjectId,
    updates: {
      fileName?: string;
      description?: string;
      tags?: string[];
    }
  ): Promise<IFileStorage> {
    const file = await FileStorage.findOne({
      _id: fileId,
      isDeleted: false,
    });

    if (!file) {
      throw new Error('File not found');
    }

    const hasEditAccess = this.checkFileEditAccess(file, userId);
    if (!hasEditAccess) {
      throw new Error('Access denied');
    }

    if (updates.fileName) file.fileName = updates.fileName;
    if (updates.description !== undefined) file.description = updates.description;
    if (updates.tags) file.tags = updates.tags;

    await file.save();
    return file;
  }

  async searchFiles(
    userId: Types.ObjectId,
    query: string,
    organizationId?: Types.ObjectId
  ): Promise<IFileStorage[]> {
    const searchQuery: Record<string, unknown> = {
      isDeleted: false,
      $or: [
        { fileName: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } },
      ],
    };

    if (organizationId) {
      searchQuery.organization = organizationId;
    } else {
      searchQuery.owner = userId;
    }

    return FileStorage.find(searchQuery)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
  }

  async getStorageStats(
    userId: Types.ObjectId,
    organizationId?: Types.ObjectId
  ): Promise<{
    totalFiles: number;
    totalSize: number;
    filesByType: { type: string; count: number; size: number }[];
  }> {
    const query: FilterQuery<IFileStorage> = organizationId
      ? { isDeleted: false, organization: organizationId }
      : { isDeleted: false, owner: userId };

    const files = await FileStorage.find(query);

    const totalFiles = files.length;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    const typeMap = new Map<string, { count: number; size: number }>();
    files.forEach(file => {
      const type = file.mimeType.split('/')[0];
      const current = typeMap.get(type) || { count: 0, size: 0 };
      typeMap.set(type, {
        count: current.count + 1,
        size: current.size + file.size,
      });
    });

    const filesByType = Array.from(typeMap.entries()).map(([type, stats]) => ({
      type,
      ...stats,
    }));

    return { totalFiles, totalSize, filesByType };
  }

  private checkFileAccess(file: IFileStorage, userId: Types.ObjectId): boolean {
    if (file.isPublic) return true;
    if (file.owner.toString() === userId.toString()) return true;
    
    const permission = file.permissions.find(
      p => p.user.toString() === userId.toString()
    );
    
    return !!permission;
  }

  private checkFileEditAccess(file: IFileStorage, userId: Types.ObjectId): boolean {
    if (file.owner.toString() === userId.toString()) return true;
    
    const permission = file.permissions.find(
      p => p.user.toString() === userId.toString()
    );
    
    return permission?.role === 'editor' || permission?.role === 'owner';
  }
}

export default new FileStorageService();
