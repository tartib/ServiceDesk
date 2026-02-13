import { Types } from 'mongoose';
import { IFileShareLink } from '../../../models/FileShareLink';
import { IFileStorage } from '../../../models/FileStorage';

export interface ShareLinkOptions {
  fileId: Types.ObjectId;
  userId: Types.ObjectId;
  expiresIn?: number;
  maxDownloads?: number;
  password?: string;
  allowedEmails?: string[];
  canDownload?: boolean;
  canView?: boolean;
}

export interface IFileShareService {
  /**
   * Create a share link for a file
   */
  shareFile(options: ShareLinkOptions): Promise<IFileShareLink>;

  /**
   * Get file by share token
   */
  getFileByShareToken(token: string): Promise<{ file: IFileStorage; shareLink: IFileShareLink }>;

  /**
   * Revoke a share link
   */
  revokeShareLink(linkId: Types.ObjectId, userId: Types.ObjectId): Promise<void>;

  /**
   * Get all share links for a file
   */
  getShareLinks(fileId: Types.ObjectId, userId: Types.ObjectId): Promise<IFileShareLink[]>;
}
