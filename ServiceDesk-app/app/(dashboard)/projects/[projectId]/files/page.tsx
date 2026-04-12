'use client';

import { API_URL } from '@/lib/api/config';
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

interface BackendFile {
 _id: string;
 name: string;
 type: 'file' | 'folder' | 'image' | 'document' | 'spreadsheet';
 size?: number;
 uploadedBy: { _id: string; email: string; profile?: { firstName: string; lastName: string } } | null;
 taskKey?: string;
 createdAt: string;
}

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

const mapFile = (f: BackendFile): FileItem => ({
 id: f._id,
 name: f.name,
 type: f.type,
 size: f.size,
 uploadedBy: f.uploadedBy?.profile ? `${f.uploadedBy.profile.firstName} ${f.uploadedBy.profile.lastName}`.trim() : f.uploadedBy?.email || 'Unknown',
 uploadedAt: f.createdAt,
 taskKey: f.taskKey,
});

const typeConfig = {
 folder: { icon: Folder, color: 'text-warning', bgColor: 'bg-warning-soft' },
 file: { icon: File, color: 'text-muted-foreground', bgColor: 'bg-muted' },
 image: { icon: Image, color: 'text-success', bgColor: 'bg-success-soft' },
 document: { icon: FileText, color: 'text-brand', bgColor: 'bg-brand-soft' },
 spreadsheet: { icon: FileText, color: 'text-success', bgColor: 'bg-success-soft' },
};

export default function FilesPage() {
 const params = useParams();
 const router = useRouter();
 const projectId = params?.projectId as string;
 
 const { methodology } = useMethodology(projectId);
 const { t } = useLanguage();

 const [project, setProject] = useState<Project | null>(null);
 const [files, setFiles] = useState<FileItem[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
 const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

 const getToken = () => localStorage.getItem('token') || localStorage.getItem('accessToken');

 const fetchData = useCallback(async (token: string) => {
 try {
 const [projRes, filesRes] = await Promise.all([
 fetch(`${API_URL}/pm/projects/${projectId}`, { headers: { Authorization: `Bearer ${token}` } }),
 fetch(`${API_URL}/pm/projects/${projectId}/files`, { headers: { Authorization: `Bearer ${token}` } }),
 ]);
 const projData = await projRes.json();
 if (projData.success) setProject(projData.data.project);
 const filesData = await filesRes.json();
 if (filesData.success) setFiles((filesData.data.files || []).map(mapFile));
 } catch (error) {
 console.error('Failed to fetch files:', error);
 } finally {
 setIsLoading(false);
 }
 }, [projectId]);

 useEffect(() => {
 const token = getToken();
 if (!token) { router.push('/login'); return; }
 fetchData(token);
 }, [projectId, router, fetchData]);

 const handleDelete = async (fileId: string) => {
 const token = getToken();
 if (!token) return;
 try {
 const res = await fetch(`${API_URL}/pm/files/${fileId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
 const data = await res.json();
 if (data.success) {
 setFiles(prev => prev.filter(f => f.id !== fileId));
 if (selectedFile?.id === fileId) setSelectedFile(null);
 }
 } catch (error) { console.error('Failed to delete file:', error); }
 };

 const handleCreateFolder = async () => {
 const name = prompt('Enter folder name:');
 if (!name) return;
 const token = getToken();
 if (!token) return;
 try {
 const res = await fetch(`${API_URL}/pm/projects/${projectId}/files`, {
 method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
 body: JSON.stringify({ name, type: 'folder' }),
 });
 const data = await res.json();
 if (data.success) fetchData(token);
 } catch (error) { console.error('Failed to create folder:', error); }
 };

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
 <div className="flex flex-col h-full bg-muted/50">
 {/* Project Header */}
 <ProjectHeader 
 projectKey={project?.key} 
 projectName={project?.name}
 projectId={projectId}
 />

 {/* Navigation Tabs */}
 <ProjectNavTabs projectId={projectId} methodology={methodology || 'scrum'} />

 {/* Toolbar */}
 <div className="bg-background border-b border-border px-4 py-3">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-2">
 <FileText className="h-5 w-5 text-brand" />
 <h2 className="text-lg font-semibold text-foreground">{t('projects.files.title') || 'Files'}</h2>
 </div>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder={t('projects.files.searchPlaceholder') || 'Search files...'}
 className="pl-9 pr-4 py-1.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
 />
 </div>
 </div>
 <div className="flex items-center gap-2">
 <div className="flex items-center bg-muted rounded-lg p-1">
 <button
 onClick={() => setViewMode('grid')}
 className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-background shadow-sm' : ''}`}
 >
 <Grid className="h-4 w-4 text-muted-foreground" />
 </button>
 <button
 onClick={() => setViewMode('list')}
 className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-background shadow-sm' : ''}`}
 >
 <List className="h-4 w-4 text-muted-foreground" />
 </button>
 </div>
 <button
 onClick={handleCreateFolder}
 className="flex items-center gap-2 px-4 py-1.5 bg-brand text-brand-foreground text-sm font-medium rounded-lg hover:bg-brand-strong transition-colors"
 >
 <Upload className="h-4 w-4" />
 {t('projects.files.upload') || 'New Folder'}
 </button>
 </div>
 </div>
 </div>

 {/* Stats Bar */}
 <div className="bg-background border-b border-border px-4 py-3">
 <div className="flex items-center gap-6 text-sm text-muted-foreground">
 <span>{stats.total} {t('projects.common.items') || 'items'}</span>
 <span>{stats.folders} {t('projects.files.folders') || 'folders'}</span>
 <span>{formatSize(stats.totalSize)} {t('projects.files.total') || 'total'}</span>
 </div>
 </div>

 {/* Main Content */}
 <div className="flex-1 overflow-hidden flex">
 {/* Files Grid/List */}
 <div className={`${selectedFile ? 'w-2/3 border-r border-border' : 'w-full'} overflow-y-auto p-4`}>
 {viewMode === 'grid' ? (
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
 {filteredFiles.map((file) => {
 const config = typeConfig[file.type];
 const Icon = config.icon;

 return (
 <div
 key={file.id}
 onClick={() => setSelectedFile(file)}
 className={`bg-background border rounded-xl p-4 cursor-pointer transition-all hover:shadow-md ${
 selectedFile?.id === file.id 
 ? 'border-brand ring-2 ring-brand-border' 
 : 'border-border'
 }`}
 >
 <div className={`w-12 h-12 rounded-lg ${config.bgColor} flex items-center justify-center mb-3`}>
 <Icon className={`h-6 w-6 ${config.color}`} />
 </div>
 <h3 className="font-medium text-foreground text-sm truncate" title={file.name}>
 {file.name}
 </h3>
 <p className="text-xs text-muted-foreground mt-1">
 {file.type === 'folder' ? t('projects.files.folder') || 'Folder' : formatSize(file.size)}
 </p>
 </div>
 );
 })}
 </div>
 ) : (
 <div className="bg-background border border-border rounded-xl overflow-hidden">
 <table className="w-full">
 <thead className="bg-muted/50">
 <tr>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('projects.files.name') || 'Name'}</th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('projects.files.size') || 'Size'}</th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('projects.files.uploadedBy') || 'Uploaded By'}</th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('projects.files.date') || 'Date'}</th>
 <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{t('projects.files.task') || 'Task'}</th>
 <th className="px-4 py-3"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {filteredFiles.map((file) => {
 const config = typeConfig[file.type];
 const Icon = config.icon;

 return (
 <tr
 key={file.id}
 onClick={() => setSelectedFile(file)}
 className={`hover:bg-muted/50 cursor-pointer ${
 selectedFile?.id === file.id ? 'bg-brand-surface' : ''
 }`}
 >
 <td className="px-4 py-3">
 <div className="flex items-center gap-3">
 <div className={`w-8 h-8 rounded ${config.bgColor} flex items-center justify-center`}>
 <Icon className={`h-4 w-4 ${config.color}`} />
 </div>
 <span className="text-sm font-medium text-foreground">{file.name}</span>
 </div>
 </td>
 <td className="px-4 py-3 text-sm text-muted-foreground">
 {file.type === 'folder' ? '-' : formatSize(file.size)}
 </td>
 <td className="px-4 py-3 text-sm text-muted-foreground">{file.uploadedBy}</td>
 <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(file.uploadedAt)}</td>
 <td className="px-4 py-3">
 {file.taskKey && (
 <span className="text-xs font-mono text-brand hover:underline">
 {file.taskKey}
 </span>
 )}
 </td>
 <td className="px-4 py-3">
 <button className="p-1 text-muted-foreground hover:text-muted-foreground rounded">
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
 <div className="w-1/3 overflow-y-auto bg-background p-6">
 {/* Preview */}
 <div className={`w-full h-40 rounded-xl ${typeConfig[selectedFile.type].bgColor} flex items-center justify-center mb-6`}>
 {(() => {
 const Icon = typeConfig[selectedFile.type].icon;
 return <Icon className={`h-16 w-16 ${typeConfig[selectedFile.type].color}`} />;
 })()}
 </div>

 {/* Info */}
 <h2 className="text-lg font-semibold text-foreground mb-4">{selectedFile.name}</h2>
 
 <div className="space-y-3 mb-6">
 <div className="flex items-center justify-between py-2 border-b border-border">
 <span className="text-sm text-muted-foreground">{t('projects.files.type') || 'Type'}</span>
 <span className="text-sm font-medium text-foreground capitalize">{selectedFile.type}</span>
 </div>
 {selectedFile.size && (
 <div className="flex items-center justify-between py-2 border-b border-border">
 <span className="text-sm text-muted-foreground">{t('projects.files.size') || 'Size'}</span>
 <span className="text-sm font-medium text-foreground">{formatSize(selectedFile.size)}</span>
 </div>
 )}
 <div className="flex items-center justify-between py-2 border-b border-border">
 <span className="text-sm text-muted-foreground">{t('projects.files.uploadedBy') || 'Uploaded by'}</span>
 <span className="text-sm font-medium text-foreground">{selectedFile.uploadedBy}</span>
 </div>
 <div className="flex items-center justify-between py-2 border-b border-border">
 <span className="text-sm text-muted-foreground">{t('projects.files.date') || 'Date'}</span>
 <span className="text-sm font-medium text-foreground">{formatDate(selectedFile.uploadedAt)}</span>
 </div>
 {selectedFile.taskKey && (
 <div className="flex items-center justify-between py-2 border-b border-border">
 <span className="text-sm text-muted-foreground">{t('projects.files.linkedTask') || 'Linked Task'}</span>
 <span className="text-sm font-mono text-brand hover:underline cursor-pointer">{selectedFile.taskKey}</span>
 </div>
 )}
 </div>

 {/* Actions */}
 <div className="space-y-2">
 <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand text-brand-foreground font-medium rounded-lg hover:bg-brand-strong transition-colors">
 <Download className="h-4 w-4" />
 {t('projects.files.download') || 'Download'}
 </button>
 <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-foreground font-medium rounded-lg hover:bg-muted/50 transition-colors">
 <Eye className="h-4 w-4" />
 {t('projects.files.preview') || 'Preview'}
 </button>
 <button
 onClick={() => { if (selectedFile && confirm('Delete this file?')) handleDelete(selectedFile.id); }}
 className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-destructive/30 text-destructive font-medium rounded-lg hover:bg-destructive-soft transition-colors"
 >
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
