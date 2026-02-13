import { Types } from 'mongoose';
import crypto from 'crypto';
import path from 'path';
import logger from '../../utils/logger';
import FileStorage, { IFileStorage } from '../../models/FileStorage';
import minioClient from '../../config/minio';
import { IFileUploadService, UploadFileOptions } from './interfaces/IFileUploadService';

/**
 * File Upload Service
 * Handles file uploads, downloads, and metadata management
 */
export class FileUploadService implements IFileUploadService {
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
      logger.debug('Uploading file', { fileName: file.originalname, userId });

      const objectKey = this.generateObjectKey(userId, file.originalname);
      const bucket = this.getBucketByMimeType(file.mimetype);
      const checksum = this.calculateChecksum(file.buffer);

      const metadata = {
        'content-type': file.mimetype,
      };

      await minioClient.uploadFile(bucket, objectKey, file.buffer, file.size, metadata);

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
      throw error;
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    userId: Types.ObjectId,
    organizationId?: Types.ObjectId,
    folderId?: Types.ObjectId
  ): Promise<IFileStorage[]> {
    try {
      logger.debug('Uploading multiple files', { count: files.length, userId });

      const uploadPromises = files.map((file) =>
        this.uploadFile({
          file,
          userId,
          organizationId,
          folderId,
        })
      );

      const results = await Promise.all(uploadPromises);
      logger.info(`Successfully uploaded ${results.length} files`);
      return results;
    } catch (error) {
      logger.error('Error uploading multiple files:', error);
      throw error;
    }
  }

  async downloadFile(
    fileId: Types.ObjectId,
    userId: Types.ObjectId
  ): Promise<{ stream: NodeJS.ReadableStream; file: IFileStorage }> {
    try {
      logger.debug('Downloading file', { fileId, userId });

      const file = await FileStorage.findOne({
        _id: fileId,
        isDeleted: false,
      }).populate('owner', 'name email');

      if (!file) {
        throw new Error('File not found');
      }

      const hasAccess = this.checkFileAccess(file, userId);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      const stream = await minioClient.downloadFile(file.bucket, file.objectKey);

      await FileStorage.findByIdAndUpdate(fileId, {
        $inc: { downloadCount: 1 },
        lastAccessedAt: new Date(),
      });

      logger.info(`File downloaded: ${fileId}`);
      return { stream, file };
    } catch (error) {
      logger.error('Error downloading file:', error);
      throw error;
    }
  }

  async deleteFile(fileId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
    try {
      logger.debug('Deleting file', { fileId, userId });

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
    } catch (error) {
      logger.error('Error deleting file:', error);
      throw error;
    }
  }

  async permanentlyDeleteFile(fileId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
    try {
      logger.debug('Permanently deleting file', { fileId, userId });

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
    } catch (error) {
      logger.error('Error permanently deleting file:', error);
      throw error;
    }
  }

  async restoreFile(fileId: Types.ObjectId, userId: Types.ObjectId): Promise<IFileStorage> {
    try {
      logger.debug('Restoring file', { fileId, userId });

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
    } catch (error) {
      logger.error('Error restoring file:', error);
      throw error;
    }
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
    try {
      logger.debug('Updating file metadata', { fileId, userId });

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
      logger.info(`File metadata updated: ${fileId}`);
      return file;
    } catch (error) {
      logger.error('Error updating file metadata:', error);
      throw error;
    }
  }

  private checkFileAccess(file: IFileStorage, userId: Types.ObjectId): boolean {
    if (file.isPublic) return true;
    if (file.owner.toString() === userId.toString()) return true;

    const permission = file.permissions.find((p) => p.user.toString() === userId.toString());

    return !!permission;
  }

  private checkFileEditAccess(file: IFileStorage, userId: Types.ObjectId): boolean {
    if (file.owner.toString() === userId.toString()) return true;

    const permission = file.permissions.find((p) => p.user.toString() === userId.toString());

    return permission?.role === 'editor' || permission?.role === 'owner';
  }
}

export default new FileUploadService();
