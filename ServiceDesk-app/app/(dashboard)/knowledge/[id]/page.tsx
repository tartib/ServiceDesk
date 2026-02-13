'use client';

import { useParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarkdownRenderer } from '@/components/knowledge/MarkdownRenderer';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowLeft,
  Edit,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Star,
  Calendar,
  User,
  Tag,
  Send,
  Archive,
} from 'lucide-react';
import Link from 'next/link';
import {
  useKnowledgeArticle,
  usePublishArticle,
  useArchiveArticle,
  useSubmitFeedback,
  ArticleStatus,
} from '@/hooks/useKnowledge';

export default function ArticleViewPage() {
  const params = useParams();
  const { locale } = useLanguage();
  const articleId = params.id as string;

  const { data: article, isLoading, error, refetch } = useKnowledgeArticle(articleId, true);
  const publishArticle = usePublishArticle();
  const archiveArticle = useArchiveArticle();
  const submitFeedback = useSubmitFeedback();

  const handlePublish = async () => {
    if (!article) return;
    try {
      await publishArticle.mutateAsync(article.article_id || article._id);
      refetch();
    } catch (err) {
      console.error('Error publishing:', err);
    }
  };

  const handleArchive = async () => {
    if (!article) return;
    try {
      await archiveArticle.mutateAsync(article.article_id || article._id);
      refetch();
    } catch (err) {
      console.error('Error archiving:', err);
    }
  };

  const handleFeedback = async (helpful: boolean) => {
    if (!article) return;
    try {
      await submitFeedback.mutateAsync({
        id: article.article_id || article._id,
        helpful,
      });
      refetch();
    } catch (err) {
      console.error('Error submitting feedback:', err);
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !article) {
    return (
      <DashboardLayout>
        <div className="container mx-auto py-6">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <h3 className="text-lg font-medium mb-2">
                {locale === 'ar' ? 'المقالة غير موجودة' : 'Article not found'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {locale === 'ar'
                  ? 'لم يتم العثور على المقالة المطلوبة'
                  : 'The requested article could not be found'}
              </p>
              <Link href="/knowledge">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {locale === 'ar' ? 'العودة للقائمة' : 'Back to list'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const title = locale === 'ar' ? article.title_ar || article.title : article.title;
  const content = locale === 'ar' ? article.content_ar || article.content : article.content;
  const summary = locale === 'ar' ? article.summary_ar || article.summary : article.summary;

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/knowledge">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm text-muted-foreground">
                  {article.article_id}
                </span>
                {getStatusBadge(article.status)}
                {article.is_featured && (
                  <Badge variant="outline" className="text-yellow-600">
                    <Star className="h-3 w-3 mr-1" />
                    {locale === 'ar' ? 'مميز' : 'Featured'}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold">{title}</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/knowledge/${articleId}/edit`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                {locale === 'ar' ? 'تعديل' : 'Edit'}
              </Button>
            </Link>
            {article.status === ArticleStatus.DRAFT && (
              <Button onClick={handlePublish}>
                <Send className="h-4 w-4 mr-2" />
                {locale === 'ar' ? 'نشر' : 'Publish'}
              </Button>
            )}
            {article.status === ArticleStatus.PUBLISHED && (
              <Button variant="outline" onClick={handleArchive}>
                <Archive className="h-4 w-4 mr-2" />
                {locale === 'ar' ? 'أرشفة' : 'Archive'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Summary */}
            {summary && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {locale === 'ar' ? 'الملخص' : 'Summary'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{summary}</p>
                </CardContent>
              </Card>
            )}

            {/* Content */}
            <Card>
              <CardContent className="pt-6">
                <MarkdownRenderer 
                  content={content} 
                  dir={locale === 'ar' ? 'rtl' : 'ltr'}
                />
              </CardContent>
            </Card>

            {/* Feedback */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {locale === 'ar' ? 'هل كانت هذه المقالة مفيدة؟' : 'Was this article helpful?'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handleFeedback(true)}
                    className="flex-1"
                  >
                    <ThumbsUp className="h-4 w-4 mr-2" />
                    {locale === 'ar' ? 'نعم' : 'Yes'} ({article.metrics?.helpful_count || 0})
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleFeedback(false)}
                    className="flex-1"
                  >
                    <ThumbsDown className="h-4 w-4 mr-2" />
                    {locale === 'ar' ? 'لا' : 'No'} ({article.metrics?.not_helpful_count || 0})
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {locale === 'ar' ? 'الإحصائيات' : 'Metrics'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    {locale === 'ar' ? 'المشاهدات' : 'Views'}
                  </span>
                  <span className="font-medium">{article.metrics?.views || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    {locale === 'ar' ? 'التقييم' : 'Rating'}
                  </span>
                  <span className="font-medium">
                    {article.metrics?.avg_rating?.toFixed(1) || '0.0'} / 5
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {locale === 'ar' ? 'الإصدار' : 'Version'}
                  </span>
                  <span className="font-medium">v{article.version || 1}</span>
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {locale === 'ar' ? 'التفاصيل' : 'Details'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {locale === 'ar' ? 'الكاتب:' : 'Author:'}
                  </span>
                  <span>{article.author?.name || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {locale === 'ar' ? 'تاريخ الإنشاء:' : 'Created:'}
                  </span>
                  <span>{formatDate(article.created_at)}</span>
                </div>
                {article.published_at && (
                  <div className="flex items-center gap-2 text-sm">
                    <Send className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {locale === 'ar' ? 'تاريخ النشر:' : 'Published:'}
                    </span>
                    <span>{formatDate(article.published_at)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    {locale === 'ar' ? 'الوسوم' : 'Tags'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
