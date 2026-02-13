import { Request, Response } from 'express';
import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import container from '../infrastructure/di/container';
import logger from '../utils/logger';

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  return String(error);
};

export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file provided',
      });
      return;
    }

    const fileUploadService = container.resolve('fileUploadService');
    const userId = new Types.ObjectId(req.user!.id);
    const organizationId = req.headers['x-organization-id']
      ? new Types.ObjectId(req.headers['x-organization-id'] as string)
      : undefined;
    const folderId = req.body.folderId
      ? new Types.ObjectId(req.body.folderId)
      : undefined;

    const file = await fileUploadService.uploadFile({
      file: req.file,
      userId,
      organizationId,
      folderId,
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      description: req.body.description,
      isPublic: req.body.isPublic === 'true',
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: file,
    });
  } catch (error: unknown) {
    logger.error('Error in uploadFile controller:', error);
    res.status(500).json({
      success: false,
      message: getErrorMessage(error) || 'Failed to upload file',
    });
  }
};

export const uploadMultipleFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No files provided',
      });
      return;
    }

    const fileUploadService = container.resolve('fileUploadService');
    const userId = new Types.ObjectId(req.user!.id);
    const organizationId = req.headers['x-organization-id']
      ? new Types.ObjectId(req.headers['x-organization-id'] as string)
      : undefined;
    const folderId = req.body.folderId
      ? new Types.ObjectId(req.body.folderId)
      : undefined;

    const files = await fileUploadService.uploadMultipleFiles(
      req.files,
      userId,
      organizationId,
      folderId
    );

    res.status(201).json({
      success: true,
      message: `${files.length} files uploaded successfully`,
      data: files,
    });
  } catch (error: unknown) {
    logger.error('Error in uploadMultipleFiles controller:', error);
    res.status(500).json({
      success: false,
      message: getErrorMessage(error) || 'Failed to upload files',
    });
  }
};

export const getFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const fileUploadService = container.resolve('fileUploadService');
    const fileId = new Types.ObjectId(req.params.id);
    const userId = new Types.ObjectId(req.user!.id);

    const { file } = await fileUploadService.downloadFile(fileId, userId);

    if (!file) {
      res.status(404).json({
        success: false,
        message: 'File not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: file,
    });
  } catch (error: unknown) {
    logger.error('Error in getFile controller:', error);
    const errorMessage = getErrorMessage(error);
    res.status(errorMessage === 'Access denied' ? 403 : 500).json({
      success: false,
      message: errorMessage || 'Failed to get file',
    });
  }
};

export const downloadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const fileStorageService = container.resolve('fileStorageService');
    const fileId = new Types.ObjectId(req.params.id);
    const userId = new Types.ObjectId(req.user!.id);

    const { stream, file } = await fileStorageService.downloadFile(fileId, userId);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', file.size);
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    stream.pipe(res);
  } catch (error: unknown) {
    logger.error('Error in downloadFile controller:', error);
    const errorMessage = getErrorMessage(error);
    res.status(errorMessage === 'Access denied' ? 403 : 500).json({
      success: false,
      message: errorMessage || 'Failed to download file',
    });
  }
};

export const previewFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const fileStorageService = container.resolve('fileStorageService');
    const fileId = new Types.ObjectId(req.params.id);
    const userId = new Types.ObjectId(req.user!.id);

    const { stream, file } = await fileStorageService.downloadFile(fileId, userId);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', file.size);
    res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');

    stream.pipe(res);
  } catch (error: unknown) {
    logger.error('Error in previewFile controller:', error);
    const errorMessage = getErrorMessage(error);
    res.status(errorMessage === 'Access denied' ? 403 : 500).json({
      success: false,
      message: errorMessage || 'Failed to preview file',
    });
  }
};

export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const fileStorageService = container.resolve('fileStorageService');
    const fileId = new Types.ObjectId(req.params.id);
    const userId = new Types.ObjectId(req.user!.id);

    await fileStorageService.deleteFile(fileId, userId);

    res.status(200).json({
      success: true,
      message: 'File moved to trash',
    });
  } catch (error: unknown) {
    logger.error('Error in deleteFile controller:', error);
    res.status(500).json({
      success: false,
      message: getErrorMessage(error) || 'Failed to delete file',
    });
  }
};

export const permanentlyDeleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const fileStorageService = container.resolve('fileStorageService');
    const fileId = new Types.ObjectId(req.params.id);
    const userId = new Types.ObjectId(req.user!.id);

    await fileStorageService.permanentlyDeleteFile(fileId, userId);

    res.status(200).json({
      success: true,
      message: 'File permanently deleted',
    });
  } catch (error: unknown) {
    logger.error('Error in permanentlyDeleteFile controller:', error);
    res.status(500).json({
      success: false,
      message: getErrorMessage(error) || 'Failed to permanently delete file',
    });
  }
};

export const restoreFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const fileStorageService = container.resolve('fileStorageService');
    const fileId = new Types.ObjectId(req.params.id);
    const userId = new Types.ObjectId(req.user!.id);

    const file = await fileStorageService.restoreFile(fileId, userId);

    res.status(200).json({
      success: true,
      message: 'File restored successfully',
      data: file,
    });
  } catch (error: unknown) {
    logger.error('Error in restoreFile controller:', error);
    res.status(500).json({
      success: false,
      message: getErrorMessage(error) || 'Failed to restore file',
    });
  }
};

export const updateFileMetadata = async (req: Request, res: Response): Promise<void> => {
  try {
    const fileStorageService = container.resolve('fileStorageService');
    const fileId = new Types.ObjectId(req.params.id);
    const userId = new Types.ObjectId(req.user!.id);

    const file = await fileStorageService.updateFileMetadata(fileId, userId, {
      fileName: req.body.fileName,
      description: req.body.description,
      tags: req.body.tags,
    });

    res.status(200).json({
      success: true,
      message: 'File metadata updated successfully',
      data: file,
    });
  } catch (error: unknown) {
    logger.error('Error in updateFileMetadata controller:', error);
    const errorMessage = getErrorMessage(error);
    res.status(errorMessage === 'Access denied' ? 403 : 500).json({
      success: false,
      message: errorMessage || 'Failed to update file metadata',
    });
  }
};

export const moveFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const fileStorageService = container.resolve('fileStorageService');
    const fileId = new Types.ObjectId(req.params.id);
    const userId = new Types.ObjectId(req.user!.id);
    const targetFolderId = req.body.folderId
      ? new Types.ObjectId(req.body.folderId)
      : null;

    const file = await fileStorageService.moveFile(fileId, targetFolderId, userId);

    res.status(200).json({
      success: true,
      message: 'File moved successfully',
      data: file,
    });
  } catch (error: unknown) {
    logger.error('Error in moveFile controller:', error);
    const errorMessage = getErrorMessage(error);
    res.status(errorMessage === 'Access denied' ? 403 : 500).json({
      success: false,
      message: errorMessage || 'Failed to move file',
    });
  }
};

export const searchFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const fileStorageService = container.resolve('fileStorageService');
    const userId = new Types.ObjectId(req.user!.id);
    const query = req.query.q as string;
    const organizationId = req.headers['x-organization-id']
      ? new Types.ObjectId(req.headers['x-organization-id'] as string)
      : undefined;

    if (!query) {
      res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
      return;
    }

    const files = await fileStorageService.searchFiles(userId, query, organizationId);

    res.status(200).json({
      success: true,
      data: files,
    });
  } catch (error: unknown) {
    logger.error('Error in searchFiles controller:', error);
    res.status(500).json({
      success: false,
      message: getErrorMessage(error) || 'Failed to search files',
    });
  }
};

export const getStorageStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const fileStorageService = container.resolve('fileStorageService');
    const userId = new Types.ObjectId(req.user!.id);
    const organizationId = req.headers['x-organization-id']
      ? new Types.ObjectId(req.headers['x-organization-id'] as string)
      : undefined;

    const stats = await fileStorageService.getStorageStats(userId, organizationId);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error: unknown) {
    logger.error('Error in getStorageStats controller:', error);
    res.status(500).json({
      success: false,
      message: getErrorMessage(error) || 'Failed to get storage stats',
    });
  }
};

export const createFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const fileStorageService = container.resolve('fileStorageService');
    const userId = new Types.ObjectId(req.user!.id);
    const organizationId = req.headers['x-organization-id']
      ? new Types.ObjectId(req.headers['x-organization-id'] as string)
      : undefined;
    const parentId = req.body.parentId
      ? new Types.ObjectId(req.body.parentId)
      : undefined;

    const folder = await fileStorageService.createFolder({
      name: req.body.name,
      userId,
      organizationId,
      parentId,
      description: req.body.description,
      isPublic: req.body.isPublic,
    });

    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      data: folder,
    });
  } catch (error: unknown) {
    logger.error('Error in createFolder controller:', error);
    res.status(500).json({
      success: false,
      message: getErrorMessage(error) || 'Failed to create folder',
    });
  }
};

export const getFolderContents = async (req: Request, res: Response): Promise<void> => {
  try {
    const fileStorageService = container.resolve('fileStorageService');
    const userId = new Types.ObjectId(req.user!.id);
    const folderId = req.params.id ? new Types.ObjectId(req.params.id) : null;
    const organizationId = req.headers['x-organization-id']
      ? new Types.ObjectId(req.headers['x-organization-id'] as string)
      : undefined;

    const contents = await fileStorageService.getFolderContents(
      folderId,
      userId,
      organizationId
    );

    res.status(200).json({
      success: true,
      data: contents,
    });
  } catch (error: unknown) {
    logger.error('Error in getFolderContents controller:', error);
    res.status(500).json({
      success: false,
      message: getErrorMessage(error) || 'Failed to get folder contents',
    });
  }
};

export const createShareLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const fileStorageService = container.resolve('fileStorageService');
    const fileId = new Types.ObjectId(req.params.id);
    const userId = new Types.ObjectId(req.user!.id);

    const shareLink = await fileStorageService.shareFile({
      fileId,
      userId,
      expiresIn: req.body.expiresIn,
      maxDownloads: req.body.maxDownloads,
      password: req.body.password,
      allowedEmails: req.body.allowedEmails,
      canDownload: req.body.canDownload,
      canView: req.body.canView,
    });

    res.status(201).json({
      success: true,
      message: 'Share link created successfully',
      data: {
        token: shareLink.token,
        url: `/api/v1/files/share/${shareLink.token}`,
        expiresAt: shareLink.expiresAt,
        maxDownloads: shareLink.maxDownloads,
      },
    });
  } catch (error: unknown) {
    logger.error('Error in createShareLink controller:', error);
    const errorMessage = getErrorMessage(error);
    res.status(errorMessage === 'Access denied' ? 403 : 500).json({
      success: false,
      message: errorMessage || 'Failed to create share link',
    });
  }
};

export const accessSharedFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const fileStorageService = container.resolve('fileStorageService');
    const token = req.params.token;
    const password = req.body.password;
    const email = req.body.email;

    const { file, shareLink } = await fileStorageService.getFileByShareToken(token);

    if (shareLink.password && password) {
      const isValidPassword = await bcrypt.compare(password, shareLink.password);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          message: 'Invalid password',
        });
        return;
      }
    } else if (shareLink.password && !password) {
      res.status(401).json({
        success: false,
        message: 'Password required',
        requiresPassword: true,
      });
      return;
    }

    if (shareLink.allowedEmails.length > 0) {
      if (!email || !shareLink.allowedEmails.includes(email.toLowerCase())) {
        res.status(403).json({
          success: false,
          message: 'Access denied. Email not authorized.',
        });
        return;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        file: {
          _id: file._id,
          fileName: file.fileName,
          mimeType: file.mimeType,
          size: file.size,
          createdAt: file.createdAt,
        },
        permissions: shareLink.permissions,
      },
    });
  } catch (error: unknown) {
    logger.error('Error in accessSharedFile controller:', error);
    res.status(500).json({
      success: false,
      message: getErrorMessage(error) || 'Failed to access shared file',
    });
  }
};

export const downloadSharedFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const fileStorageService = container.resolve('fileStorageService');
    const token = req.params.token;
    const password = req.body.password;

    const { file, shareLink } = await fileStorageService.getFileByShareToken(token);

    if (shareLink.password && password) {
      const isValidPassword = await bcrypt.compare(password, shareLink.password);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          message: 'Invalid password',
        });
        return;
      }
    } else if (shareLink.password && !password) {
      res.status(401).json({
        success: false,
        message: 'Password required',
      });
      return;
    }

    if (!shareLink.permissions.canDownload) {
      res.status(403).json({
        success: false,
        message: 'Download not allowed for this share link',
      });
      return;
    }

    const { stream } = await fileStorageService.downloadFile(file._id, file.owner);

    shareLink.downloadCount += 1;
    shareLink.lastAccessedAt = new Date();
    shareLink.accessLog.push({
      ip: req.ip || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown',
      accessedAt: new Date(),
    });
    await shareLink.save();

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader('Content-Length', file.size);
    res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);

    stream.pipe(res);
  } catch (error: unknown) {
    logger.error('Error in downloadSharedFile controller:', error);
    res.status(500).json({
      success: false,
      message: getErrorMessage(error) || 'Failed to download shared file',
    });
  }
};
