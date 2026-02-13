import { Types } from 'mongoose';
import logger from '../../utils/logger';
import FileFolder, { IFileFolder } from '../../models/FileFolder';
import FileStorage, { IFileStorage } from '../../models/FileStorage';
import { IFileFolderService, CreateFolderOptions } from './interfaces/IFileFolderService';

/**
 * File Folder Service
 * Handles folder management and organization
 */
export class FileFolderService implements IFileFolderService {
  async createFolder(options: CreateFolderOptions): Promise<IFileFolder> {
    const { name, userId, organizationId, parentId, description, isPublic } = options;

    try {
      logger.debug('Creating folder', { name, userId });

      let folderPath = `/${name}`;
      if (parentId) {
        const parentFolder = await FileFolder.findById(parentId);
        if (parentFolder) {
          folderPath = `${parentFolder.path}/${name}`;
        }
      }

      const folder = await FileFolder.create({
        name,
        owner: userId,
        organization: organizationId,
        parent: parentId || null,
        description,
        path: folderPath,
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
    } catch (error) {
      logger.error('Error creating folder:', error);
      throw error;
    }
  }

  async getFolderContents(
    folderId: Types.ObjectId | null,
    userId: Types.ObjectId,
    organizationId?: Types.ObjectId
  ): Promise<{ folders: IFileFolder[]; files: IFileStorage[] }> {
    try {
      logger.debug('Fetching folder contents', { folderId, userId });

      const query: Record<string, unknown> = {
        isDeleted: false,
      };

      if (organizationId) {
        query.organization = organizationId;
      } else {
        query.owner = userId;
      }

      const [folders, files] = await Promise.all([
        FileFolder.find({
          ...query,
          parent: folderId,
        }).sort({ name: 1 }),
        FileStorage.find({
          ...query,
          folder: folderId,
        })
          .populate('owner', 'name email')
          .sort({ createdAt: -1 }),
      ]);

      logger.info(`Folder contents fetched: ${folders.length} folders, ${files.length} files`);
      return { folders, files };
    } catch (error) {
      logger.error('Error fetching folder contents:', error);
      throw error;
    }
  }

  async moveFile(
    fileId: Types.ObjectId,
    targetFolderId: Types.ObjectId | null,
    userId: Types.ObjectId
  ): Promise<IFileStorage> {
    try {
      logger.debug('Moving file', { fileId, targetFolderId, userId });

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
    } catch (error) {
      logger.error('Error moving file:', error);
      throw error;
    }
  }

  async deleteFolder(folderId: Types.ObjectId, userId: Types.ObjectId): Promise<void> {
    try {
      logger.debug('Deleting folder', { folderId, userId });

      const folder = await FileFolder.findOne({
        _id: folderId,
        owner: userId,
      });

      if (!folder) {
        throw new Error('Folder not found or access denied');
      }

      folder.isDeleted = true;
      folder.deletedAt = new Date();
      await folder.save();

      logger.info(`Folder deleted: ${folderId}`);
    } catch (error) {
      logger.error('Error deleting folder:', error);
      throw error;
    }
  }

  async getFolderById(folderId: Types.ObjectId): Promise<IFileFolder | null> {
    try {
      logger.debug('Fetching folder by ID', { folderId });

      const folder = await FileFolder.findOne({
        _id: folderId,
        isDeleted: false,
      });

      return folder;
    } catch (error) {
      logger.error('Error fetching folder:', error);
      throw error;
    }
  }

  private checkFileEditAccess(file: IFileStorage, userId: Types.ObjectId): boolean {
    if (file.owner.toString() === userId.toString()) return true;

    const permission = file.permissions.find((p) => p.user.toString() === userId.toString());

    return permission?.role === 'editor' || permission?.role === 'owner';
  }
}

export default new FileFolderService();
