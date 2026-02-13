'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Workflow,
  Eye,
  Edit,
  Trash2,
  Send,
  Archive,
  Grid3x3,
  List,
  Calendar,
  GitBranch,
  Circle,
} from 'lucide-react';
import Link from 'next/link';
import {
  useWorkflows,
  useDeleteWorkflow,
  usePublishWorkflow,
  useArchiveWorkflow,
  WorkflowDiagram,
  WorkflowStatus,
} from '@/hooks/useWorkflows';

export default function WorkflowsPage() {
  const { locale } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);

  const filters = {
    search: searchQuery || undefined,
    status: statusFilter !== 'all' ? (statusFilter as WorkflowStatus) : undefined,
    page,
    limit: 12,
  };

  const { data, isLoading, refetch } = useWorkflows(filters);
  const deleteWorkflow = useDeleteWorkflow();
  const publishWorkflow = usePublishWorkflow();
  const archiveWorkflow = useArchiveWorkflow();

  const workflows = data?.workflows || [];
  const pagination = data?.pagination;

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف سير العمل هذا؟' : 'Are you sure you want to delete this workflow?')) {
      return;
    }
    try {
      await deleteWorkflow.mutateAsync(id);
      refetch();
    } catch (error) {
      console.error('Error deleting workflow:', error);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishWorkflow.mutateAsync(id);
      refetch();
    } catch (error) {
      console.error('Error publishing workflow:', error);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveWorkflow.mutateAsync(id);
      refetch();
    } catch (error) {
      console.error('Error archiving workflow:', error);
    }
  };

  const getStatusBadge = (status: WorkflowStatus) => {
    const statusConfig = {
      draft: {
        label: locale === 'ar' ? 'مسودة' : 'Draft',
        variant: 'secondary' as const,
      },
      published: {
        label: locale === 'ar' ? 'منشور' : 'Published',
        variant: 'default' as const,
      },
      archived: {
        label: locale === 'ar' ? 'مؤرشف' : 'Archived',
        variant: 'destructive' as const,
      },
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              {locale === 'ar' ? 'سير العمل' : 'Workflows'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {locale === 'ar'
                ? 'تصميم وإدارة مخططات سير العمل المرئية'
                : 'Design and manage visual workflow diagrams'}
            </p>
          </div>
          <Link href="/workflows/new">
            <Button>
              <Plus className="h-4 w-4 me-2" />
              {locale === 'ar' ? 'سير عمل جديد' : 'New Workflow'}
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={locale === 'ar' ? 'البحث في سير العمل...' : 'Search workflows...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="ps-10"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={locale === 'ar' ? 'الحالة' : 'Status'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{locale === 'ar' ? 'الكل' : 'All'}</SelectItem>
              <SelectItem value="draft">{locale === 'ar' ? 'مسودة' : 'Draft'}</SelectItem>
              <SelectItem value="published">{locale === 'ar' ? 'منشور' : 'Published'}</SelectItem>
              <SelectItem value="archived">{locale === 'ar' ? 'مؤرشف' : 'Archived'}</SelectItem>
            </SelectContent>
          </Select>

          {/* View Mode Toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
              className="rounded-e-none"
              title={locale === 'ar' ? 'عرض شبكي' : 'Grid view'}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
              className="rounded-s-none"
              title={locale === 'ar' ? 'عرض قائمة' : 'List view'}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Workflows */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : workflows.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workflows.map((workflow: WorkflowDiagram) => (
                  <Card key={workflow._id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-1">
                            {workflow.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            {getStatusBadge(workflow.status)}
                          </div>
                        </div>
                      </div>
                      <CardDescription className="line-clamp-2 mt-2">
                        {workflow.description || (locale === 'ar' ? 'بدون وصف' : 'No description')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Tags */}
                      {workflow.tags && workflow.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {workflow.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {workflow.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{workflow.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Metrics */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Circle className="h-3 w-3" />
                          {workflow.nodes?.length || 0} {locale === 'ar' ? 'عقد' : 'nodes'}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitBranch className="h-3 w-3" />
                          {workflow.edges?.length || 0} {locale === 'ar' ? 'اتصالات' : 'edges'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link href={`/workflows/${workflow._id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="h-4 w-4 me-1" />
                            {locale === 'ar' ? 'فتح' : 'Open'}
                          </Button>
                        </Link>
                        {workflow.status === 'draft' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePublish(workflow._id)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        {workflow.status === 'published' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleArchive(workflow._id)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(workflow._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                {workflows.map((workflow: WorkflowDiagram) => (
                  <div
                    key={workflow._id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Icon */}
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                      <Workflow className="h-5 w-5 text-purple-600" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/workflows/${workflow._id}`}
                          className="text-sm font-semibold text-gray-900 hover:text-blue-600 truncate"
                        >
                          {workflow.name}
                        </Link>
                        {getStatusBadge(workflow.status)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {workflow.description || (locale === 'ar' ? 'بدون وصف' : 'No description')}
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="hidden lg:flex items-center gap-1 shrink-0">
                      {workflow.tags?.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {(workflow.tags?.length || 0) > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{(workflow.tags?.length || 0) - 2}
                        </Badge>
                      )}
                    </div>

                    {/* Metrics */}
                    <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                      <span className="flex items-center gap-1">
                        <Circle className="h-3 w-3" />
                        {workflow.nodes?.length || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <GitBranch className="h-3 w-3" />
                        {workflow.edges?.length || 0}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Calendar className="h-3 w-3" />
                      {workflow.updatedAt
                        ? new Date(workflow.updatedAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })
                        : '—'}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Link href={`/workflows/${workflow._id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      {workflow.status === 'draft' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handlePublish(workflow._id)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      {workflow.status === 'published' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleArchive(workflow._id)}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(workflow._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  {locale === 'ar' ? 'السابق' : 'Previous'}
                </Button>
                <span className="flex items-center px-4 text-sm">
                  {locale === 'ar'
                    ? `صفحة ${page} من ${pagination.pages}`
                    : `Page ${page} of ${pagination.pages}`}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === pagination.pages}
                  onClick={() => setPage(page + 1)}
                >
                  {locale === 'ar' ? 'التالي' : 'Next'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {locale === 'ar' ? 'لا توجد مخططات سير عمل' : 'No workflows yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {locale === 'ar'
                  ? 'ابدأ بإنشاء مخطط سير عمل جديد'
                  : 'Get started by creating a new workflow diagram'}
              </p>
              <Link href="/workflows/new">
                <Button>
                  <Plus className="h-4 w-4 me-2" />
                  {locale === 'ar' ? 'إنشاء سير عمل' : 'Create Workflow'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
