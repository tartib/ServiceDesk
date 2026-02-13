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
  BookOpen,
  Eye,
  ThumbsUp,
  Star,
  FileText,
  Edit,
  Trash2,
  Send,
  Archive,
  Grid3x3,
  List,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import {
  useKnowledgeArticles,
  useKnowledgeStats,
  useDeleteArticle,
  usePublishArticle,
  useArchiveArticle,
  ArticleStatus,
  KnowledgeArticle,
} from '@/hooks/useKnowledge';

export default function KnowledgePage() {
  const { locale } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);

  const filters = {
    search: searchQuery || undefined,
    status: statusFilter !== 'all' ? (statusFilter as ArticleStatus) : undefined,
    page,
    limit: 12,
  };

  const { data, isLoading, refetch } = useKnowledgeArticles(filters);
  const { data: stats } = useKnowledgeStats();
  const deleteArticle = useDeleteArticle();
  const publishArticle = usePublishArticle();
  const archiveArticle = useArchiveArticle();

  const articles = data?.articles || [];
  const pagination = data?.pagination;

  const handleDelete = async (id: string) => {
    if (!confirm(locale === 'ar' ? 'هل أنت متأكد من حذف هذه المقالة؟' : 'Are you sure you want to delete this article?')) {
      return;
    }
    try {
      await deleteArticle.mutateAsync(id);
      refetch();
    } catch (error) {
      console.error('Error deleting article:', error);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishArticle.mutateAsync(id);
      refetch();
    } catch (error) {
      console.error('Error publishing article:', error);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveArticle.mutateAsync(id);
      refetch();
    } catch (error) {
      console.error('Error archiving article:', error);
    }
  };

  const getStatusBadge = (status: ArticleStatus) => {
    const statusConfig = {
      [ArticleStatus.DRAFT]: {
        label: locale === 'ar' ? 'مسودة' : 'Draft',
        variant: 'secondary' as const,
      },
      [ArticleStatus.PENDING_REVIEW]: {
        label: locale === 'ar' ? 'قيد المراجعة' : 'Pending Review',
        variant: 'outline' as const,
      },
      [ArticleStatus.PUBLISHED]: {
        label: locale === 'ar' ? 'منشور' : 'Published',
        variant: 'default' as const,
      },
      [ArticleStatus.ARCHIVED]: {
        label: locale === 'ar' ? 'مؤرشف' : 'Archived',
        variant: 'destructive' as const,
      },
    };
    const config = statusConfig[status] || statusConfig[ArticleStatus.DRAFT];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">
              {locale === 'ar' ? 'قاعدة المعرفة' : 'Knowledge Base'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {locale === 'ar'
                ? 'إدارة مقالات المعرفة والحلول'
                : 'Manage knowledge articles and solutions'}
            </p>
          </div>
          <Link href="/knowledge/new">
            <Button>
              <Plus className="h-4 w-4 me-2" />
              {locale === 'ar' ? 'مقالة جديدة' : 'New Article'}
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {locale === 'ar' ? 'إجمالي المقالات' : 'Total Articles'}
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_articles}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {locale === 'ar' ? 'المنشورة' : 'Published'}
                </CardTitle>
                <FileText className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.published_articles}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {locale === 'ar' ? 'إجمالي المشاهدات' : 'Total Views'}
                </CardTitle>
                <Eye className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_views}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {locale === 'ar' ? 'متوسط التقييم' : 'Avg Rating'}
                </CardTitle>
                <Star className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.avg_rating ? stats.avg_rating.toFixed(1) : '0.0'}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={locale === 'ar' ? 'البحث في المقالات...' : 'Search articles...'}
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

        {/* Articles */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : articles.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {articles.map((article: KnowledgeArticle) => (
                  <Card key={article._id || article.article_id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2">
                            {locale === 'ar' ? article.title_ar || article.title : article.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            {getStatusBadge(article.status)}
                            {article.is_featured && (
                              <Badge variant="outline" className="text-yellow-600">
                                <Star className="h-3 w-3 me-1" />
                                {locale === 'ar' ? 'مميز' : 'Featured'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <CardDescription className="line-clamp-2 mt-2">
                        {locale === 'ar'
                          ? article.summary_ar || article.summary || 'بدون ملخص'
                          : article.summary || 'No summary'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Tags */}
                      {article.tags && article.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {article.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {article.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{article.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Metrics */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {article.metrics?.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {article.metrics?.helpful_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {article.metrics?.avg_rating?.toFixed(1) || '0.0'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link href={`/knowledge/${article.article_id || article._id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Eye className="h-4 w-4 me-1" />
                            {locale === 'ar' ? 'عرض' : 'View'}
                          </Button>
                        </Link>
                        <Link href={`/knowledge/${article.article_id || article._id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        {article.status === ArticleStatus.DRAFT && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePublish(article.article_id || article._id)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        {article.status === ArticleStatus.PUBLISHED && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleArchive(article.article_id || article._id)}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(article.article_id || article._id)}
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
                {articles.map((article: KnowledgeArticle) => (
                  <div
                    key={article._id || article.article_id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    {/* Icon */}
                    <div className="shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/knowledge/${article.article_id || article._id}`}
                          className="text-sm font-semibold text-gray-900 hover:text-blue-600 truncate"
                        >
                          {locale === 'ar' ? article.title_ar || article.title : article.title}
                        </Link>
                        {getStatusBadge(article.status)}
                        {article.is_featured && (
                          <Badge variant="outline" className="text-yellow-600 shrink-0">
                            <Star className="h-3 w-3 me-1" />
                            {locale === 'ar' ? 'مميز' : 'Featured'}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {locale === 'ar'
                          ? article.summary_ar || article.summary || 'بدون ملخص'
                          : article.summary || 'No summary'}
                      </p>
                    </div>

                    {/* Tags */}
                    <div className="hidden lg:flex items-center gap-1 shrink-0">
                      {article.tags?.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {(article.tags?.length || 0) > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{(article.tags?.length || 0) - 2}
                        </Badge>
                      )}
                    </div>

                    {/* Metrics */}
                    <div className="hidden md:flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {article.metrics?.views || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />
                        {article.metrics?.helpful_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {article.metrics?.avg_rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                      <Calendar className="h-3 w-3" />
                      {article.updated_at
                        ? new Date(article.updated_at).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', { month: 'short', day: 'numeric' })
                        : '—'}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Link href={`/knowledge/${article.article_id || article._id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/knowledge/${article.article_id || article._id}/edit`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      {article.status === ArticleStatus.DRAFT && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handlePublish(article.article_id || article._id)}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      )}
                      {article.status === ArticleStatus.PUBLISHED && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleArchive(article.article_id || article._id)}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(article.article_id || article._id)}
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
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {locale === 'ar' ? 'لا توجد مقالات' : 'No articles yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {locale === 'ar'
                  ? 'ابدأ بإنشاء مقالة جديدة'
                  : 'Get started by creating a new article'}
              </p>
              <Link href="/knowledge/new">
                <Button>
                  <Plus className="h-4 w-4 me-2" />
                  {locale === 'ar' ? 'إنشاء مقالة' : 'Create Article'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
