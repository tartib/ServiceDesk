'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFiles, FileMetadata, Folder, FolderContents } from '@/hooks/useFiles';
import DashboardLayout from '@/components/layout/DashboardLayout';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import JsonView from '@uiw/react-json-view';

// Initialize PDF.js worker - set at runtime
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
}

// Helper function to get API URL with fallback
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://localhost:5000/api/v1';
  }
  return 'http://localhost:5000/api/v1';
};

// Helper function to get preview URL with token
const getPreviewUrl = (fileId: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const apiUrl = getApiUrl();
  // If token exists, we'll fetch as blob in the handler
  // For grid thumbnails, use the URL directly (will fail without token, but that's expected)
  return `${apiUrl}/files/${fileId}/preview`;
};
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Upload,
  FolderPlus,
  Search,
  MoreVertical,
  Download,
  Share2,
  Trash2,
  Edit,
  FileText,
  Image as ImageIcon,
  Video,
  File,
  Folder as FolderIcon,
  Grid3x3,
  List,
  ChevronRight,
  Home,
  Clock,
  Star,
  Users,
  HardDrive,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocale } from '@/hooks/useLocale';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type ViewMode = 'grid' | 'list';
type DriveView = 'my-drive' | 'shared' | 'recent' | 'starred' | 'trash';

export default function DrivePage() {
  const {
    loading,
    uploadFile,
    uploadMultipleFiles,
    downloadFile,
    deleteFile,
    createFolder,
    getFolderContents,
    searchFiles,
    getStorageStats,
    createShareLink,
    updateFileMetadata,
  } = useFiles();

  const { t, locale } = useLocale();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [activeView, setActiveView] = useState<DriveView>('my-drive');
  const [contents, setContents] = useState<FolderContents | null>(null);
  const [currentFolder, setCurrentFolder] = useState<string | undefined>(undefined);
  const [folderPath, setFolderPath] = useState<Folder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FileMetadata[] | null>(null);
  const [storageStats, setStorageStats] = useState<{
    totalFiles: number;
    totalSize: number;
    filesByType: Array<{ type: string; count: number; size: number }>;
  } | null>(null);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileMetadata | null>(null);

  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileMetadata | null>(null);
  const [textPreviewContent, setTextPreviewContent] = useState('');
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [cardImageUrls, setCardImageUrls] = useState<Record<string, string>>({});
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [currentPdfPage, setCurrentPdfPage] = useState(1);
  const [jsonData, setJsonData] = useState<Record<string, unknown> | null>(null);
  const [docxHtmlContent, setDocxHtmlContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const loadFolderContents = useCallback(async (folderId?: string) => {
    const data = await getFolderContents(folderId);
    if (data) {
      setContents(data);
      setSearchResults(null);
      setSearchQuery('');
      
      // Load image previews for cards
      const newCardImageUrls: Record<string, string> = {};
      for (const file of data.files) {
        if (file.isImage) {
          try {
            const token = localStorage.getItem('token');
            const apiUrl = getApiUrl();
            const response = await fetch(
              `${apiUrl}/files/${file._id}/preview`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            if (response.ok) {
              const blob = await response.blob();
              newCardImageUrls[file._id] = URL.createObjectURL(blob);
            }
          } catch (error) {
            console.error('Failed to load card image:', error);
          }
        }
      }
      setCardImageUrls(newCardImageUrls);
    }
  }, [getFolderContents]);

  useEffect(() => {
    const loadData = async () => {
      await loadFolderContents(currentFolder);

      const stats = await getStorageStats();
      if (stats) {
        setStorageStats(stats);
      }
    };

    loadData();
  }, [currentFolder, loadFolderContents, getStorageStats]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const results = await searchFiles(searchQuery);
    setSearchResults(results);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    if (fileArray.length === 1) {
      await uploadFile(fileArray[0], { folderId: currentFolder });
    } else {
      await uploadMultipleFiles(fileArray, currentFolder);
    }

    setUploadDialogOpen(false);
    loadFolderContents(currentFolder);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    await createFolder(newFolderName, {
      description: newFolderDescription,
      parentId: currentFolder,
    });

    setNewFolderName('');
    setNewFolderDescription('');
    setCreateFolderDialogOpen(false);
    loadFolderContents(currentFolder);
  };

  const handleFolderClick = (folder: Folder) => {
    setCurrentFolder(folder._id);
    setFolderPath([...folderPath, folder]);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setCurrentFolder(undefined);
      setFolderPath([]);
    } else {
      const folder = folderPath[index];
      setCurrentFolder(folder._id);
      setFolderPath(folderPath.slice(0, index + 1));
    }
  };

  const handleDownload = (file: FileMetadata) => {
    downloadFile(file._id, file.fileName);
  };

  const handleDelete = async (fileId: string) => {
    const success = await deleteFile(fileId);
    if (success) {
      loadFolderContents(currentFolder);
    }
  };

  const handleShare = async (file: FileMetadata) => {
    setSelectedFile(file);
    const link = await createShareLink(file._id, {
      expiresIn: 86400,
      canDownload: true,
      canView: true,
    });

    if (link) {
      const apiUrl = getApiUrl();
      const fullUrl = `${apiUrl}${link.url}`;
      setShareLink(fullUrl);
      setShareDialogOpen(true);
    }
  };

  const handleRename = async () => {
    if (!selectedFile || !newFileName.trim()) return;

    await updateFileMetadata(selectedFile._id, {
      fileName: newFileName,
    });

    setNewFileName('');
    setRenameDialogOpen(false);
    setSelectedFile(null);
    loadFolderContents(currentFolder);
  };

  const openRenameDialog = (file: FileMetadata) => {
    setSelectedFile(file);
    setNewFileName(file.fileName);
    setRenameDialogOpen(true);
  };

  const handlePreviewFile = (file: FileMetadata) => {
    // Navigate to full-page preview
    window.location.href = `/drive/preview/${file._id}`;
  };

  const handlePreviewFileOld = async (file: FileMetadata) => {
    setPreviewFile(file);
    setTextPreviewContent('');
    setImagePreviewUrl('');
    setPdfPages([]);
    setCurrentPdfPage(1);
    setJsonData(null);
    setDocxHtmlContent('');
    setVideoUrl('');
    
    try {
      const token = localStorage.getItem('token');
      const apiUrl = getApiUrl();
      
      if (file.isVideo || file.fileName?.toLowerCase().endsWith('.mp4')) {
        // Create blob URL for video playback
        const response = await fetch(
          `${apiUrl}/files/${file._id}/preview`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch video: ${response.status}`);
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
      } else if (file.isImage) {
        const response = await fetch(
          `${apiUrl}/files/${file._id}/preview`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setImagePreviewUrl(url);
      } else if (file.isPDF) {
        // Render PDF with pagination
        const response = await fetch(
          `${apiUrl}/files/${file._id}/preview`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF: ${response.status}`);
        }
        
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        const pages: string[] = [];
        for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          
          if (context) {
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            const renderTask = page.render({
              canvasContext: context,
              viewport: viewport,
              canvas: canvas,
            });
            await renderTask.promise;
            
            pages.push(canvas.toDataURL());
          }
        }
        
        setPdfPages(pages);
      } else if (file.fileName?.endsWith('.docx') && file.mimeType?.includes('word')) {
        // Render DOCX with HTML formatting
        const response = await fetch(
          `${apiUrl}/files/${file._id}/preview`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch document: ${response.status}`);
        }
        
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        
        try {
          const result = await mammoth.convertToHtml({ arrayBuffer });
          setDocxHtmlContent(result.value);
        } catch (error) {
          console.error('Failed to convert Word document:', error);
          setTextPreviewContent('Unable to preview this Word document. Please download to view.');
        }
      } else if (file.fileName?.endsWith('.json')) {
        // Parse and display JSON with syntax highlighting
        const response = await fetch(
          `${apiUrl}/files/${file._id}/preview`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch JSON: ${response.status}`);
        }
        
        const text = await response.text();
        try {
          const parsed = JSON.parse(text);
          setJsonData(parsed);
        } catch (e) {
          setTextPreviewContent('Invalid JSON format. Please download to view.');
        }
      } else if (file.mimeType?.startsWith('text/')) {
        // Fetch text content for text files
        const response = await fetch(
          `${apiUrl}/files/${file._id}/preview`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }
        
        const text = await response.text();
        setTextPreviewContent(text.substring(0, 5000));
      }
    } catch (error) {
      console.error('Failed to fetch file preview:', error);
      setTextPreviewContent('Failed to load file content. Please try downloading the file instead.');
    }
    setPreviewDialogOpen(true);
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
  };

  const getFileIcon = (file: FileMetadata) => {
    if (file.isImage) return <ImageIcon className="h-5 w-5 text-blue-500" />;
    if (file.isPDF) return <FileText className="h-5 w-5 text-red-500" />;
    if (file.isVideo) return <Video className="h-5 w-5 text-purple-500" />;
    if (file.isDocument) return <FileText className="h-5 w-5 text-blue-600" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };


  return (
    <DashboardLayout>
    <div className="flex h-full bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-e border-gray-200 flex flex-col">
        <div className="p-4">
          <Button
            onClick={() => setUploadDialogOpen(true)}
            className="w-full"
            size="lg"
          >
            <Upload className="me-2 h-5 w-5" />
            {t('drive.newUpload')}
          </Button>
        </div>

        <nav className="flex-1 px-2 space-y-1">
          <button
            onClick={() => { setActiveView('my-drive'); handleBreadcrumbClick(-1); }}
            className={cn(
              'w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100',
              activeView === 'my-drive' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
            )}
          >
            <Home className="me-3 h-5 w-5" />
            {t('drive.title')}
          </button>

          <button
            onClick={() => { setActiveView('shared'); setSearchResults(null); setSearchQuery(''); }}
            className={cn(
              'w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100',
              activeView === 'shared' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
            )}
          >
            <Users className="me-3 h-5 w-5" />
            {t('drive.sharedWithMe')}
          </button>

          <button
            onClick={() => { setActiveView('recent'); setSearchResults(null); setSearchQuery(''); }}
            className={cn(
              'w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100',
              activeView === 'recent' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
            )}
          >
            <Clock className="me-3 h-5 w-5" />
            {t('drive.recent')}
          </button>

          <button
            onClick={() => { setActiveView('starred'); setSearchResults(null); setSearchQuery(''); }}
            className={cn(
              'w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100',
              activeView === 'starred' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
            )}
          >
            <Star className="me-3 h-5 w-5" />
            {t('drive.starred')}
          </button>

          <button
            onClick={() => { setActiveView('trash'); setSearchResults(null); setSearchQuery(''); }}
            className={cn(
              'w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg hover:bg-gray-100',
              activeView === 'trash' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
            )}
          >
            <Trash2 className="me-3 h-5 w-5" />
            {t('drive.trash')}
          </button>
        </nav>

        {storageStats && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">{t('drive.storage')}</span>
              <HardDrive className="h-4 w-4 text-gray-400" />
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{
                  width: `${Math.min((storageStats.totalSize / (5 * 1024 * 1024 * 1024)) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {t('drive.storageUsed').replace('{used}', formatFileSize(storageStats.totalSize))}
            </p>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              {/* Breadcrumbs / View Title */}
              <div className="flex items-center gap-2 text-sm">
                {activeView === 'my-drive' ? (
                  <>
                    <button
                      onClick={() => handleBreadcrumbClick(-1)}
                      className="text-gray-600 hover:text-gray-900 font-medium"
                    >
                      {t('drive.title')}
                    </button>
                    {folderPath.map((folder, index) => (
                      <div key={folder._id} className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                        <button
                          onClick={() => handleBreadcrumbClick(index)}
                          className="text-gray-600 hover:text-gray-900 font-medium"
                        >
                          {folder.name}
                        </button>
                      </div>
                    ))}
                  </>
                ) : (
                  <span className="text-gray-900 font-medium">
                    {activeView === 'shared' && t('drive.sharedWithMe')}
                    {activeView === 'recent' && t('drive.recent')}
                    {activeView === 'starred' && t('drive.starred')}
                    {activeView === 'trash' && t('drive.trash')}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder={t('drive.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-64"
                />
                <Button variant="ghost" size="icon" onClick={handleSearch}>
                  <Search className="h-5 w-5" />
                </Button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center border border-gray-200 rounded-lg">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="rounded-e-none"
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className="rounded-s-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => loadFolderContents(currentFolder)}
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Toolbar - only for My Drive */}
        {activeView === 'my-drive' && (
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateFolderDialogOpen(true)}
              >
                <FolderPlus className="me-2 h-4 w-4" />
                {t('drive.newFolder')}
              </Button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {activeView !== 'my-drive' && !searchResults ? (
            <div className="text-center py-20">
              {activeView === 'shared' && <Users className="mx-auto h-16 w-16 text-gray-300" />}
              {activeView === 'recent' && <Clock className="mx-auto h-16 w-16 text-gray-300" />}
              {activeView === 'starred' && <Star className="mx-auto h-16 w-16 text-gray-300" />}
              {activeView === 'trash' && <Trash2 className="mx-auto h-16 w-16 text-gray-300" />}
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {activeView === 'shared' && t('drive.sharedEmpty')}
                {activeView === 'recent' && t('drive.recentEmpty')}
                {activeView === 'starred' && t('drive.starredEmpty')}
                {activeView === 'trash' && t('drive.trashEmpty')}
              </h3>
              <p className="mt-2 text-gray-500">
                {activeView === 'shared' && t('drive.sharedEmptyDescription')}
                {activeView === 'recent' && t('drive.recentEmptyDescription')}
                {activeView === 'starred' && t('drive.starredEmptyDescription')}
                {activeView === 'trash' && t('drive.trashEmptyDescription')}
              </p>
            </div>
          ) : loading && !contents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          ) : searchResults ? (
            <div>
              <h2 className="text-lg font-semibold mb-4">
                {t('drive.searchResultsFor')} &quot;{searchQuery}&quot;
              </h2>
              {searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-4 text-gray-600">{t('drive.noFilesFound')}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((file) => (
                    <div
                      key={file._id}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-4">
                        {getFileIcon(file)}
                        <div>
                          <p className="font-medium text-gray-900">{file.fileName}</p>
                          <p className="text-sm text-gray-500">
                            {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(file)}>
                            <Download className="me-2 h-4 w-4" />
                            {t('drive.download')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare(file)}>
                            <Share2 className="me-2 h-4 w-4" />
                            {t('drive.share')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openRenameDialog(file)}>
                            <Edit className="me-2 h-4 w-4" />
                            {t('drive.rename')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(file._id)}
                            className="text-red-600"
                          >
                            <Trash2 className="me-2 h-4 w-4" />
                            {t('drive.delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div>
              {/* Folders */}
              {contents?.folders && contents.folders.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">{t('drive.folders')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {contents.folders.map((folder) => (
                      <div
                        key={folder._id}
                        onClick={() => handleFolderClick(folder)}
                        className="group p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <FolderIcon className="h-10 w-10 text-blue-500" />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Share2 className="me-2 h-4 w-4" />
                                {t('drive.share')}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="me-2 h-4 w-4" />
                                {t('drive.rename')}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="me-2 h-4 w-4" />
                                {t('drive.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="font-medium text-gray-900 truncate">{folder.name}</p>
                        {folder.description && (
                          <p className="text-xs text-gray-500 truncate mt-1">{folder.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Files */}
              {contents?.files && contents.files.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-4">{t('drive.files')}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {contents.files.map((file) => (
                      <div
                        key={file._id}
                        className="group bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer"
                        onClick={() => handlePreviewFile(file)}
                      >
                        {/* File Preview */}
                        <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden relative">
                          {file.isImage ? (
                            <div
                              className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-200"
                              style={{
                                backgroundImage: cardImageUrls[file._id] 
                                  ? `url(${cardImageUrls[file._id]})` 
                                  : `url(${getPreviewUrl(file._id)})`,
                              }}
                            />
                          ) : file.isPDF ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-red-50 to-red-100 p-4">
                              <FileText className="h-16 w-16 text-red-500 mb-2" />
                              <p className="text-xs text-red-700 text-center font-semibold">PDF</p>
                            </div>
                          ) : file.isDocument ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4">
                              <FileText className="h-16 w-16 text-blue-500 mb-2" />
                              <p className="text-xs text-blue-700 text-center font-semibold">Document</p>
                            </div>
                          ) : file.mimeType?.startsWith('text/') ? (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-4">
                              <FileText className="h-16 w-16 text-green-500 mb-2" />
                              <p className="text-xs text-green-700 text-center font-semibold">Text</p>
                            </div>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                              <div className="text-gray-400 mb-2">{getFileIcon(file)}</div>
                              <p className="text-xs text-gray-600 font-semibold">{file.fileName.split('.').pop()?.toUpperCase()}</p>
                            </div>
                          )}
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
                        </div>

                        {/* File Info */}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                {file.fileName}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatFileSize(file.size)}
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDownload(file)}>
                                  <Download className="me-2 h-4 w-4" />
                                  {t('drive.download')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleShare(file)}>
                                  <Share2 className="me-2 h-4 w-4" />
                                  {t('drive.share')}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openRenameDialog(file)}>
                                  <Edit className="me-2 h-4 w-4" />
                                  {t('drive.rename')}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(file._id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="me-2 h-4 w-4" />
                                  {t('drive.delete')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          {file.tags && file.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {file.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {(!contents?.folders || contents.folders.length === 0) &&
                (!contents?.files || contents.files.length === 0) && (
                  <div className="text-center py-12">
                    <FolderIcon className="mx-auto h-16 w-16 text-gray-400" />
                    <h3 className="mt-4 text-lg font-medium text-gray-900">{t('drive.noFilesOrFolders')}</h3>
                    <p className="mt-2 text-gray-500">
                      {t('drive.emptyStateDescription')}
                    </p>
                    <div className="mt-6 flex justify-center gap-3">
                      <Button onClick={() => setUploadDialogOpen(true)}>
                        <Upload className="me-2 h-4 w-4" />
                        {t('drive.uploadFiles')}
                      </Button>
                      <Button variant="outline" onClick={() => setCreateFolderDialogOpen(true)}>
                        <FolderPlus className="me-2 h-4 w-4" />
                        {t('drive.newFolder')}
                      </Button>
                    </div>
                  </div>
                )}
            </div>
          ) : (
            // List View
            <div className="bg-white rounded-lg border border-gray-200">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('drive.name')}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('drive.owner')}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('drive.modified')}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('drive.size')}
                    </th>
                    <th className="px-6 py-3 text-end text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('drive.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {contents?.folders.map((folder) => (
                    <tr
                      key={folder._id}
                      onClick={() => handleFolderClick(folder)}
                      className="hover:bg-gray-50 cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FolderIcon className="h-5 w-5 text-blue-500 me-3" />
                          <span className="font-medium text-gray-900">{folder.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {folder.owner.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(folder.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">—</td>
                      <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Share2 className="me-2 h-4 w-4" />
                              {t('drive.share')}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="me-2 h-4 w-4" />
                              {t('drive.rename')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="me-2 h-4 w-4" />
                              {t('drive.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  {contents?.files.map((file) => (
                    <tr key={file._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getFileIcon(file)}
                          <span className="ms-3 font-medium text-gray-900">{file.fileName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {file.owner.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(file.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(file.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownload(file)}>
                              <Download className="me-2 h-4 w-4" />
                              {t('drive.download')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleShare(file)}>
                              <Share2 className="me-2 h-4 w-4" />
                              {t('drive.share')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openRenameDialog(file)}>
                              <Edit className="me-2 h-4 w-4" />
                              {t('drive.rename')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(file._id)}
                              className="text-red-600"
                            >
                              <Trash2 className="me-2 h-4 w-4" />
                              {t('drive.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('drive.uploadDialogTitle')}</DialogTitle>
            <DialogDescription>
              {currentFolder ? t('drive.uploadToFolder') : t('drive.uploadToRoot')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-600">
                {t('drive.dragAndDrop')}
              </p>
              <Input
                type="file"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="mt-4"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Folder Dialog */}
      <Dialog open={createFolderDialogOpen} onOpenChange={setCreateFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('drive.createFolderTitle')}</DialogTitle>
            <DialogDescription>
              {currentFolder ? t('drive.createFolderInFolder') : t('drive.createFolderInRoot')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="folderName">{t('drive.folderName')}</Label>
              <Input
                id="folderName"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder={t('drive.folderNamePlaceholder')}
              />
            </div>
            <div>
              <Label htmlFor="folderDescription">{t('drive.descriptionOptional')}</Label>
              <Textarea
                id="folderDescription"
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                placeholder={t('drive.folderDescriptionPlaceholder')}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateFolderDialogOpen(false)}>
              {t('drive.cancel')}
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              {t('drive.createFolder')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('drive.shareFile')}</DialogTitle>
            <DialogDescription>
              {t('drive.shareDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input value={shareLink} readOnly className="flex-1" />
              <Button onClick={copyShareLink}>{t('drive.copy')}</Button>
            </div>
            <p className="text-sm text-gray-500">
              {t('drive.linkExpiry')}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('drive.renameFile')}</DialogTitle>
            <DialogDescription>
              {t('drive.renameDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="fileName">{t('drive.fileName')}</Label>
              <Input
                id="fileName"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder={t('drive.fileNamePlaceholder')}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              {t('drive.cancel')}
            </Button>
            <Button onClick={handleRename} disabled={!newFileName.trim()}>
              {t('drive.rename')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
    </DashboardLayout>
  );
}
