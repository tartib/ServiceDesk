'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  FileText,
  Image,
  File,
  Folder,
  Download,
  Trash2,
  Upload,
  Search,
  Grid,
  List,
  MoreHorizontal,
  Eye,
} from 'lucide-react';
import {
  ProjectHeader,
  ProjectNavTabs,
  LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';
import { useLanguage } from '@/contexts/LanguageContext';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder' | 'image' | 'document' | 'spreadsheet';
  size?: number;
  uploadedBy: string;
  uploadedAt: string;
  taskId?: string;
  taskKey?: string;
}

interface Project {
  _id: string;
  name: string;
  key: string;
}

const defaultFiles: FileItem[] = [
  { id: 'f1', name: 'Design Assets', type: 'folder', uploadedBy: 'Emily Davis', uploadedAt: '2024-01-15' },
  { id: 'f2', name: 'dashboard-mockup-v3.fig', type: 'document', size: 4500000, uploadedBy: 'Emily Davis', uploadedAt: '2024-01-15', taskKey: 'PROJ-102' },
  { id: 'f3', name: 'api-documentation.pdf', type: 'document', size: 1200000, uploadedBy: 'Sarah Johnson', uploadedAt: '2024-01-14', taskKey: 'PROJ-101' },
  { id: 'f4', name: 'screenshot-bug-login.png', type: 'image', size: 850000, uploadedBy: 'Mike Chen', uploadedAt: '2024-01-14', taskKey: 'PROJ-103' },
  { id: 'f5', name: 'sprint-report.xlsx', type: 'spreadsheet', size: 320000, uploadedBy: 'Sarah Johnson', uploadedAt: '2024-01-13' },
  { id: 'f6', name: 'user-flow-diagram.png', type: 'image', size: 1500000, uploadedBy: 'Emily Davis', uploadedAt: '2024-01-12', taskKey: 'PROJ-102' },
  { id: 'f7', name: 'meeting-notes-jan.md', type: 'document', size: 45000, uploadedBy: 'John Doe', uploadedAt: '2024-01-10' },
  { id: 'f8', name: 'architecture-diagram.svg', type: 'image', size: 280000, uploadedBy: 'Mike Chen', uploadedAt: '2024-01-08' },
];

const typeConfig = {
  folder: { icon: Folder, color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
  file: { icon: File, color: 'text-gray-500', bgColor: 'bg-gray-100' },
  image: { icon: Image, color: 'text-green-500', bgColor: 'bg-green-100' },
  document: { icon: FileText, color: 'text-blue-500', bgColor: 'bg-blue-100' },
  spreadsheet: { icon: FileText, color: 'text-emerald-500', bgColor: 'bg-emerald-100' },
};

export default function FilesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  const { methodology } = useMethodology(projectId);
  const { t } = useLanguage();

  const [project, setProject] = useState<Project | null>(null);
  const [files] = useState<FileItem[]>(defaultFiles);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const fetchProject = useCallback(async (token: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setProject(data.data.project);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProject(token);
  }, [projectId, router, fetchProject]);

  const formatSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStats = () => ({
    total: files.length,
    folders: files.filter(f => f.type === 'folder').length,
    totalSize: files.reduce((sum, f) => sum + (f.size || 0), 0),
  });

  const stats = getStats();

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Project Header */}
      <ProjectHeader 
        projectKey={project?.key} 
        projectName={project?.name}
        projectId={projectId}
      />

      {/* Navigation Tabs */}
      <ProjectNavTabs projectId={projectId} methodology={methodology || 'scrum'} />

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">{t('projects.files.title') || 'Files'}</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('projects.files.searchPlaceholder') || 'Search files...'}
                className="pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              >
                <Grid className="h-4 w-4 text-gray-600" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              >
                <List className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            <button className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              <Upload className="h-4 w-4" />
              {t('projects.files.upload') || 'Upload'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <span>{stats.total} {t('projects.common.items') || 'items'}</span>
          <span>{stats.folders} {t('projects.files.folders') || 'folders'}</span>
          <span>{formatSize(stats.totalSize)} {t('projects.files.total') || 'total'}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Files Grid/List */}
        <div className={`${selectedFile ? 'w-2/3 border-r border-gray-200' : 'w-full'} overflow-y-auto p-4`}>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredFiles.map((file) => {
                const config = typeConfig[file.type];
                const Icon = config.icon;

                return (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className={`bg-white border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedFile?.id === file.id 
                        ? 'border-blue-500 ring-2 ring-blue-100' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-lg ${config.bgColor} flex items-center justify-center mb-3`}>
                      <Icon className={`h-6 w-6 ${config.color}`} />
                    </div>
                    <h3 className="font-medium text-gray-900 text-sm truncate" title={file.name}>
                      {file.name}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {file.type === 'folder' ? t('projects.files.folder') || 'Folder' : formatSize(file.size)}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('projects.files.name') || 'Name'}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('projects.files.size') || 'Size'}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('projects.files.uploadedBy') || 'Uploaded By'}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('projects.files.date') || 'Date'}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('projects.files.task') || 'Task'}</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredFiles.map((file) => {
                    const config = typeConfig[file.type];
                    const Icon = config.icon;

                    return (
                      <tr
                        key={file.id}
                        onClick={() => setSelectedFile(file)}
                        className={`hover:bg-gray-50 cursor-pointer ${
                          selectedFile?.id === file.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded ${config.bgColor} flex items-center justify-center`}>
                              <Icon className={`h-4 w-4 ${config.color}`} />
                            </div>
                            <span className="text-sm font-medium text-gray-900">{file.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {file.type === 'folder' ? '-' : formatSize(file.size)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{file.uploadedBy}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(file.uploadedAt)}</td>
                        <td className="px-4 py-3">
                          {file.taskKey && (
                            <span className="text-xs font-mono text-blue-600 hover:underline">
                              {file.taskKey}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* File Detail Panel */}
        {selectedFile && (
          <div className="w-1/3 overflow-y-auto bg-white p-6">
            {/* Preview */}
            <div className={`w-full h-40 rounded-xl ${typeConfig[selectedFile.type].bgColor} flex items-center justify-center mb-6`}>
              {(() => {
                const Icon = typeConfig[selectedFile.type].icon;
                return <Icon className={`h-16 w-16 ${typeConfig[selectedFile.type].color}`} />;
              })()}
            </div>

            {/* Info */}
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{selectedFile.name}</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">{t('projects.files.type') || 'Type'}</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{selectedFile.type}</span>
              </div>
              {selectedFile.size && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">{t('projects.files.size') || 'Size'}</span>
                  <span className="text-sm font-medium text-gray-900">{formatSize(selectedFile.size)}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">{t('projects.files.uploadedBy') || 'Uploaded by'}</span>
                <span className="text-sm font-medium text-gray-900">{selectedFile.uploadedBy}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">{t('projects.files.date') || 'Date'}</span>
                <span className="text-sm font-medium text-gray-900">{formatDate(selectedFile.uploadedAt)}</span>
              </div>
              {selectedFile.taskKey && (
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">{t('projects.files.linkedTask') || 'Linked Task'}</span>
                  <span className="text-sm font-mono text-blue-600 hover:underline cursor-pointer">{selectedFile.taskKey}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="h-4 w-4" />
                {t('projects.files.download') || 'Download'}
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                <Eye className="h-4 w-4" />
                {t('projects.files.preview') || 'Preview'}
              </button>
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-300 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors">
                <Trash2 className="h-4 w-4" />
                {t('projects.common.delete') || 'Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
