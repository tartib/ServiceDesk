import { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import logger from '../../utils/logger';
import FileStorage, { IFileStorage } from '../../models/FileStorage';
import FileShareLink, { IFileShareLink } from '../../models/FileShareLink';
import { IFileShareService, ShareLinkOptions } from './interfaces/IFileShareService';

/**
 * File Share Service
 * Handles file sharing and access control
 */
export class FileShareService implements IFileShareService {
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

    try {
      logger.debug('Creating share link', { fileId, userId });

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
    } catch (error) {
      logger.error('Error creating share link:', error);
      throw error;
    }
  }

  async getFileByShareToken(token: string): Promise<{ file: IFileStorage; shareLink: IFileShareLink }> {
    try {
      logger.debug('Fetching file by share token');

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

      logger.info(`File accessed via share link: ${shareLink._id}`);
      return { file, shareLink };
    } catch (error) {
      logger.error('Error fetching file by share token:', error);
      throw error;
    }
  }

  async revokeShareLink(linkId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
    try {
      logger.debug('Revoking share link', { linkId, userId });

      const shareLink = await FileShareLink.findOne({
        _id: linkId,
        createdBy: userId,
      });

      if (!shareLink) {
        throw new Error('Share link not found or access denied');
      }

      shareLink.isActive = false;
      await shareLink.save();

      logger.info(`Share link revoked: ${linkId}`);
    } catch (error) {
      logger.error('Error revoking share link:', error);
      throw error;
    }
  }

  async getShareLinks(fileId: Types.ObjectId, userId: Types.ObjectId): Promise<IFileShareLink[]> {
    try {
      logger.debug('Fetching share links', { fileId, userId });

      const file = await FileStorage.findById(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      const hasAccess = this.checkFileAccess(file, userId);
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      const shareLinks = await FileShareLink.find({
        file: fileId,
        isActive: true,
      }).sort({ createdAt: -1 });

      logger.info(`Share links fetched: ${shareLinks.length} links for file: ${fileId}`);
      return shareLinks;
    } catch (error) {
      logger.error('Error fetching share links:', error);
      throw error;
    }
  }

  private checkFileAccess(file: IFileStorage, userId: Types.ObjectId): boolean {
    if (file.isPublic) return true;
    if (file.owner.toString() === userId.toString()) return true;

    const permission = file.permissions.find((p) => p.user.toString() === userId.toString());

    return !!permission;
  }
}

export default new FileShareService();
