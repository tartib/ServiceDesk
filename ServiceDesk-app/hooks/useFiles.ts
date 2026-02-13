import { useState, useCallback } from 'react';
import api from '@/lib/axios';
import { useToast } from '@/components/ui/Toast';
import { parseApiResponse, getErrorMessage } from '@/lib/api/response-parser';

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
  const toast = useToast();

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

      const response = await api.post('/file-storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('File uploaded successfully');

      return parseApiResponse<FileMetadata>(response);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to upload file');
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const uploadMultipleFiles = useCallback(async (
    files: File[],
    folderId?: string
  ): Promise<FileMetadata[] | null> => {
    setLoading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      if (folderId) formData.append('folderId', folderId);

      const response = await api.post('/file-storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(`${files.length} files uploaded successfully`);

      return parseApiResponse<FileMetadata[]>(response);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to upload files');
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getFile = useCallback(async (fileId: string): Promise<FileMetadata | null> => {
    setLoading(true);
    try {
      const response = await api.get(`/file-storage/${fileId}`);
      return parseApiResponse<FileMetadata>(response);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to get file');
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const downloadFile = useCallback((fileId: string, fileName: string) => {
    const token = localStorage.getItem('token');
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/file-storage/${fileId}/download`;
    
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
  }, [toast]);

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
      const response = await api.put(`/file-storage/${fileId}`, updates);
      
      toast.success('File updated successfully');

      return parseApiResponse<FileMetadata>(response);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to update file');
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const moveFile = useCallback(async (fileId: string, folderId?: string): Promise<FileMetadata | null> => {
    setLoading(true);
    try {
      const response = await api.put(`/file-storage/${fileId}`, {
        folder: folderId,
      });

      toast.success('File moved successfully');

      return parseApiResponse<FileMetadata>(response);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to move file');
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const deleteFile = useCallback(async (fileId: string): Promise<boolean> => {
    setLoading(true);
    try {
      await api.delete(`/file-storage/${fileId}`);
      
      toast.success('File moved to trash');

      return true;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to delete file');
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const permanentlyDeleteFile = useCallback(async (fileId: string): Promise<boolean> => {
    setLoading(true);
    try {
      await api.delete<ApiResponse<void>>(`/files/${fileId}/permanent`);
      
      toast.success('File permanently deleted');

      return true;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to permanently delete file');
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const restoreFile = useCallback(async (fileId: string): Promise<FileMetadata | null> => {
    setLoading(true);
    try {
      const response = await api.post<ApiResponse<FileMetadata>>(`/files/${fileId}/restore`);
      
      toast.success('File restored successfully');

      return response.data;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to restore file');
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const searchFiles = useCallback(async (query: string): Promise<FileMetadata[]> => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<FileMetadata[]>>(`/files/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to search files');
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const getStorageStats = useCallback(async (): Promise<StorageStats | null> => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<StorageStats>>('/files/stats');
      return response.data;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to get storage stats');
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

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
      const response = await api.post<ApiResponse<Folder>>('/folders', {
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
  }, [toast]);

  const getFolderContents = useCallback(async (folderId?: string): Promise<FolderContents | null> => {
    setLoading(true);
    try {
      const url = folderId ? `/folders/${folderId}` : '/folders';
      const response = await api.get<ApiResponse<FolderContents>>(url);
      return response.data;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to get folder contents');
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

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
      const response = await api.post<ApiResponse<ShareLink>>(`/files/${fileId}/share`, options);

      toast.success('Share link created successfully');

      return response.data;
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || 'Failed to create share link');
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

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
