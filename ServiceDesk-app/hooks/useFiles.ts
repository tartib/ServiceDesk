import { useState, useCallback } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { normalizeEntity, getErrorMessage } from '@/lib/api/normalize';
import { API_BASE_URL } from '@/lib/api/config';

const STORAGE_BASE = '/storage';

export interface FileMetadata {
  _id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  bucket: string;
  objectKey: string;
  folder?: string;
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  organization?: string;
  tags: string[];
  description?: string;
  metadata?: Record<string, string | number | boolean | null>;
  isPublic: boolean;
  permissions: {
    user: string;
    role: 'viewer' | 'editor' | 'owner';
  }[];
  version: number;
  parentFile?: string;
  checksum: string;
  downloadCount: number;
  lastAccessedAt?: string;
  expiresAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
  url: string;
  isImage: boolean;
  isPDF: boolean;
  isVideo: boolean;
  isDocument: boolean;
}

export interface Folder {
  _id: string;
  name: string;
  description?: string;
  parent?: string;
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  organization?: string;
  path: string;
  color?: string;
  icon?: string;
  permissions: {
    user: string;
    role: 'viewer' | 'editor' | 'owner';
  }[];
  isPublic: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShareLink {
  token: string;
  url: string;
  expiresAt?: string;
  maxDownloads?: number;
}

export interface FolderContents {
  folders: Folder[];
  files: FileMetadata[];
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  filesByType: {
    type: string;
    count: number;
    size: number;
  }[];
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export const useFiles = () => {
  const [loading, setLoading] = useState(false);

  const uploadFile = useCallback(async (
    file: File,
    options?: {
      folderId?: string;
      description?: string;
      tags?: string[];
      isPublic?: boolean;
    }
  ): Promise<FileMetadata | null> => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (options?.folderId) formData.append('folderId', options.folderId);
      if (options?.description) formData.append('description', options.description);
      if (options?.tags) formData.append('tags', JSON.stringify(options.tags));
      if (options?.isPublic !== undefined) formData.append('isPublic', String(options.isPublic));

      const response = await api.post(`${STORAGE_BASE}/files/upload`, formData, {
        headers: { 'Content-Type': undefined },
      });

      toast.success('File uploaded successfully');

      return normalizeEntity<FileMetadata>(response);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to upload file');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadMultipleFiles = useCallback(async (
    files: File[],
    folderId?: string
  ): Promise<FileMetadata[] | null> => {
    setLoading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      if (folderId) formData.append('folderId', folderId);

      const response = await api.post(`${STORAGE_BASE}/files/upload/multiple`, formData, {
        headers: { 'Content-Type': undefined },
      });

      toast.success(`${files.length} files uploaded successfully`);

      return normalizeEntity<FileMetadata[]>(response);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to upload files');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getFile = useCallback(async (fileId: string): Promise<FileMetadata | null> => {
    setLoading(true);
    try {
      const response = await api.get(`${STORAGE_BASE}/files/${fileId}`);
      return normalizeEntity<FileMetadata>(response);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to get file');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadFile = useCallback((fileId: string, fileName: string) => {
    const token = localStorage.getItem('token');
    const url = `${API_BASE_URL}${STORAGE_BASE}/files/${fileId}/download`;
    
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .catch(() => {
        toast.error('Failed to download file');
      });
  }, []);

  const updateFileMetadata = useCallback(async (
    fileId: string,
    updates: {
      fileName?: string;
      description?: string;
      tags?: string[];
    }
  ): Promise<FileMetadata | null> => {
    setLoading(true);
    try {
      const response = await api.put(`${STORAGE_BASE}/files/${fileId}`, updates);
      
      toast.success('File updated successfully');

      return normalizeEntity<FileMetadata>(response);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to update file');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const moveFile = useCallback(async (fileId: string, folderId?: string): Promise<FileMetadata | null> => {
    setLoading(true);
    try {
      const response = await api.put(`${STORAGE_BASE}/files/${fileId}`, {
        folder: folderId,
      });

      toast.success('File moved successfully');

      return normalizeEntity<FileMetadata>(response);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to move file');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteFile = useCallback(async (fileId: string): Promise<boolean> => {
    setLoading(true);
    try {
      await api.delete(`${STORAGE_BASE}/files/${fileId}`);
      
      toast.success('File moved to trash');

      return true;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to delete file');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const permanentlyDeleteFile = useCallback(async (fileId: string): Promise<boolean> => {
    setLoading(true);
    try {
      await api.delete<ApiResponse<void>>(`${STORAGE_BASE}/files/${fileId}/permanent`);
      
      toast.success('File permanently deleted');

      return true;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to permanently delete file');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const restoreFile = useCallback(async (fileId: string): Promise<FileMetadata | null> => {
    setLoading(true);
    try {
      const response = await api.post<ApiResponse<FileMetadata>>(`${STORAGE_BASE}/files/${fileId}/restore`);
      
      toast.success('File restored successfully');

      return response.data;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to restore file');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const searchFiles = useCallback(async (query: string): Promise<FileMetadata[]> => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<FileMetadata[]>>(`${STORAGE_BASE}/files/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to search files');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getStorageStats = useCallback(async (): Promise<StorageStats | null> => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<StorageStats>>(`${STORAGE_BASE}/files/stats`);
      return response.data;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to get storage stats');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createFolder = useCallback(async (
    name: string,
    options?: {
      description?: string;
      parentId?: string;
      isPublic?: boolean;
    }
  ): Promise<Folder | null> => {
    setLoading(true);
    try {
      const response = await api.post<ApiResponse<Folder>>(`${STORAGE_BASE}/folders`, {
        name,
        description: options?.description,
        parentId: options?.parentId,
        isPublic: options?.isPublic,
      });

      toast.success('Folder created successfully');

      return response.data;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to create folder');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getFolderContents = useCallback(async (folderId?: string): Promise<FolderContents | null> => {
    setLoading(true);
    try {
      const url = folderId ? `${STORAGE_BASE}/folders/${folderId}` : `${STORAGE_BASE}/folders`;
      const response = await api.get<ApiResponse<FolderContents>>(url);
      return response.data;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to get folder contents');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createShareLink = useCallback(async (
    fileId: string,
    options?: {
      expiresIn?: number;
      maxDownloads?: number;
      password?: string;
      allowedEmails?: string[];
      canDownload?: boolean;
      canView?: boolean;
    }
  ): Promise<ShareLink | null> => {
    setLoading(true);
    try {
      const response = await api.post<ApiResponse<ShareLink>>(`${STORAGE_BASE}/files/${fileId}/share`, options);

      toast.success('Share link created successfully');

      return response.data;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to create share link');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    uploadFile,
    uploadMultipleFiles,
    getFile,
    downloadFile,
    updateFileMetadata,
    moveFile,
    deleteFile,
    permanentlyDeleteFile,
    restoreFile,
    searchFiles,
    getStorageStats,
    createFolder,
    getFolderContents,
    createShareLink,
  };
};
