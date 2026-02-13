'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { WikiEditor } from '@/components/knowledge/WikiEditor';
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
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Send, X } from 'lucide-react';
import Link from 'next/link';
import {
  useKnowledgeArticle,
  useUpdateArticle,
  usePublishArticle,
  ArticleVisibility,
  UpdateArticleDTO,
} from '@/hooks/useKnowledge';
import { useCategories } from '@/hooks/useCategories';

export default function EditArticlePage() {
  const params = useParams();
  const { locale } = useLanguage();
  const router = useRouter();
  const articleId = params.id as string;

  const { data: article, isLoading, error } = useKnowledgeArticle(articleId, true);
  const updateArticle = useUpdateArticle();
  const publishArticle = usePublishArticle();
  const { data: categories = [] } = useCategories();

  const [formData, setFormData] = useState<UpdateArticleDTO>({
    title: '',
    title_ar: '',
    content: '',
    content_ar: '',
    summary: '',
    summary_ar: '',
    category_id: '',
    tags: [],
    visibility: ArticleVisibility.INTERNAL,
    is_featured: false,
  });

  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (article) {
      setFormData({
        title: article.title || '',
        title_ar: article.title_ar || '',
        content: article.content || '',
        content_ar: article.content_ar || '',
        summary: article.summary || '',
        summary_ar: article.summary_ar || '',
        category_id: article.category_id || '',
        tags: article.tags || [],
        visibility: article.visibility || ArticleVisibility.INTERNAL,
        is_featured: article.is_featured || false,
      });
    }
  }, [article]);

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag) || [],
    });
  };

  const handleSave = async (publish = false) => {
    if (!formData.title || !formData.content) {
      alert(locale === 'ar' ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    try {
      const id = article?.article_id || articleId;
      await updateArticle.mutateAsync({ id, data: formData });

      if (publish) {
        await publishArticle.mutateAsync(id);
      }

      router.push(`/knowledge/${articleId}`);
    } catch (error) {
      console.error('Error saving article:', error);
      alert(locale === 'ar' ? 'حدث خطأ أثناء الحفظ' : 'Error saving article');
    } finally {
      setIsSaving(false);
    }
  };

  const visibilityOptions = [
    { value: ArticleVisibility.PUBLIC, label: 'Public', label_ar: 'عام' },
    { value: ArticleVisibility.INTERNAL, label: 'Internal', label_ar: 'داخلي' },
    { value: ArticleVisibility.TECHNICIANS, label: 'Technicians Only', label_ar: 'للفنيين فقط' },
  ];

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

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href={`/knowledge/${articleId}`}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">
                {locale === 'ar' ? 'تعديل المقالة' : 'Edit Article'}
              </h1>
              <p className="text-muted-foreground">
                {article.article_id}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleSave(false)}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {locale === 'ar' ? 'حفظ' : 'Save'}
            </Button>
            <Button onClick={() => handleSave(true)} disabled={isSaving}>
              <Send className="h-4 w-4 mr-2" />
              {locale === 'ar' ? 'حفظ ونشر' : 'Save & Publish'}
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Main Content */}
          <Card>
            <CardHeader>
              <CardTitle>{locale === 'ar' ? 'المحتوى' : 'Content'}</CardTitle>
              <CardDescription>
                {locale === 'ar'
                  ? 'تعديل عنوان ومحتوى المقالة'
                  : 'Edit the article title and content'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div className="space-y-2">
                <Label>
                  {locale === 'ar' ? 'العنوان' : 'Title'} *
                </Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={locale === 'ar' ? 'عنوان المقالة' : 'Article title'}
                  dir={locale === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>

              {/* Summary */}
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'الملخص' : 'Summary'}</Label>
                <Textarea
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder={locale === 'ar' ? 'وصف مختصر للمقالة...' : 'Brief description of the article...'}
                  rows={2}
                  dir={locale === 'ar' ? 'rtl' : 'ltr'}
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label>
                  {locale === 'ar' ? 'المحتوى' : 'Content'} *
                </Label>
                <WikiEditor
                  value={formData.content || ''}
                  onChange={(value) => setFormData({ ...formData, content: value })}
                  placeholder={locale === 'ar' ? 'اكتب محتوى المقالة هنا...' : 'Write your article content here...'}
                  dir={locale === 'ar' ? 'rtl' : 'ltr'}
                  locale={locale}
                  minHeight="450px"
                />
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{locale === 'ar' ? 'الإعدادات' : 'Settings'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Category */}
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'الفئة' : 'Category'} *</Label>
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={locale === 'ar' ? 'اختر الفئة' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">
                      {locale === 'ar' ? 'عام' : 'General'}
                    </SelectItem>
                    <SelectItem value="hardware">
                      {locale === 'ar' ? 'الأجهزة' : 'Hardware'}
                    </SelectItem>
                    <SelectItem value="software">
                      {locale === 'ar' ? 'البرمجيات' : 'Software'}
                    </SelectItem>
                    <SelectItem value="network">
                      {locale === 'ar' ? 'الشبكات' : 'Network'}
                    </SelectItem>
                    <SelectItem value="security">
                      {locale === 'ar' ? 'الأمان' : 'Security'}
                    </SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id || cat.name} value={cat._id || cat.name}>
                        {locale === 'ar' ? cat.nameAr || cat.name : cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Visibility */}
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'الرؤية' : 'Visibility'}</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value) => setFormData({ ...formData, visibility: value as ArticleVisibility })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {visibilityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {locale === 'ar' ? opt.label_ar : opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label>{locale === 'ar' ? 'الوسوم' : 'Tags'}</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder={locale === 'ar' ? 'أضف وسم...' : 'Add tag...'}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddTag}>
                    {locale === 'ar' ? 'إضافة' : 'Add'}
                  </Button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Featured */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>{locale === 'ar' ? 'مقالة مميزة' : 'Featured Article'}</Label>
                  <p className="text-sm text-muted-foreground">
                    {locale === 'ar'
                      ? 'عرض هذه المقالة في قسم المميزات'
                      : 'Show this article in the featured section'}
                  </p>
                </div>
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked: boolean) => setFormData({ ...formData, is_featured: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
