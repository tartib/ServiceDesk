'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateIncident } from '@/hooks/useIncidents';
import { useCategories } from '@/hooks/useCategories';
import { useDeflectionSuggestions, useMarkHelpful, useMarkNotHelpful } from '@/hooks/useKnowledgeDeflection';
import { Impact, Urgency, Channel, CreateIncidentDTO, IDeflectionResult } from '@/types/itsm';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, AlertCircle, Loader2, BookOpen, ThumbsUp, ThumbsDown, ExternalLink, Lightbulb } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NewIncidentPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const createIncident = useCreateIncident();
  const { data: categories = [] } = useCategories(true);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    impact: Impact.MEDIUM,
    urgency: Urgency.MEDIUM,
    channel: Channel.SELF_SERVICE,
    department: '',
    phone: '',
    category_id: '',
  });

  const [error, setError] = useState('');
  const [debouncedTitle, setDebouncedTitle] = useState('');
  const [debouncedDesc, setDebouncedDesc] = useState('');
  const [dismissedDeflection, setDismissedDeflection] = useState(false);
  const [helpfulMarked, setHelpfulMarked] = useState<Record<string, 'helpful' | 'not_helpful'>>({});
  const titleDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const descDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markHelpful = useMarkHelpful();
  const markNotHelpful = useMarkNotHelpful();

  const { data: deflectionData, isFetching: deflectionLoading } = useDeflectionSuggestions(
    debouncedTitle,
    debouncedDesc,
    { category_id: formData.category_id || undefined, enabled: !dismissedDeflection }
  );
  const deflection = deflectionData as IDeflectionResult | undefined;

  useEffect(() => {
    if (titleDebounceRef.current) clearTimeout(titleDebounceRef.current);
    titleDebounceRef.current = setTimeout(() => setDebouncedTitle(formData.title), 800);
  }, [formData.title]);

  useEffect(() => {
    if (descDebounceRef.current) clearTimeout(descDebounceRef.current);
    descDebounceRef.current = setTimeout(() => setDebouncedDesc(formData.description), 800);
  }, [formData.description]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError(locale === 'ar' ? 'العنوان مطلوب' : 'Title is required');
      return;
    }
    if (formData.title.trim().length < 3) {
      setError(locale === 'ar' ? 'العنوان يجب أن يكون 3 أحرف على الأقل' : 'Title must be at least 3 characters');
      return;
    }
    if (!formData.description.trim()) {
      setError(locale === 'ar' ? 'الوصف مطلوب' : 'Description is required');
      return;
    }
    if (formData.description.trim().length < 10) {
      setError(locale === 'ar' ? 'الوصف يجب أن يكون 10 أحرف على الأقل' : 'Description must be at least 10 characters');
      return;
    }

    const incidentData: CreateIncidentDTO = {
      title: formData.title,
      description: formData.description,
      impact: formData.impact,
      urgency: formData.urgency,
      channel: formData.channel,
      category_id: formData.category_id || 'general',
      site_id: 'default',
      department: formData.department || undefined,
      phone: formData.phone || undefined,
    };

    try {
      await createIncident.mutateAsync(incidentData);
      router.push('/incidents');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; details?: { errors?: { message: string }[] } } } };
      const details = axiosErr?.response?.data?.details?.errors;
      if (details && details.length > 0) {
        setError(details.map((e: { message: string }) => e.message).join(', '));
      } else {
        setError(axiosErr?.response?.data?.message || (locale === 'ar' ? 'حدث خطأ أثناء إنشاء البلاغ' : 'Failed to create incident'));
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t('incidents.reportIncident')}
            </h1>
            <p className="text-muted-foreground">
              {t('incidents.subtitle')}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-4 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <Card className="p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('incidents.form.title')} <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-input rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder={t('incidents.form.titlePlaceholder')}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('incidents.form.description')} <span className="text-destructive">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className="w-full px-4 py-2 border border-input rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder={t('incidents.form.descriptionPlaceholder')}
              />
            </div>

            {/* Impact & Urgency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('incidents.form.impact')}
                </label>
                <select
                  value={formData.impact}
                  onChange={(e) => setFormData({ ...formData, impact: e.target.value as Impact })}
                  className="w-full px-4 py-2 border border-input rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value={Impact.LOW}>{t('incidents.form.impactLow')}</option>
                  <option value={Impact.MEDIUM}>{t('incidents.form.impactMedium')}</option>
                  <option value={Impact.HIGH}>{t('incidents.form.impactHigh')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('incidents.form.urgency')}
                </label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value as Urgency })}
                  className="w-full px-4 py-2 border border-input rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value={Urgency.LOW}>{t('incidents.form.urgencyLow')}</option>
                  <option value={Urgency.MEDIUM}>{t('incidents.form.urgencyMedium')}</option>
                  <option value={Urgency.HIGH}>{t('incidents.form.urgencyHigh')}</option>
                </select>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('incidents.form.category')}
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-2 border border-input rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
              >
                <option value="">{locale === 'ar' ? 'اختر الفئة' : 'Select category'}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {locale === 'ar' && cat.nameAr ? cat.nameAr : cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('incidents.form.department')}
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder={locale === 'ar' ? 'القسم' : 'Your department'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('incidents.form.phone')}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-input rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                  placeholder="+966-XX-XXXXXXX"
                />
              </div>
            </div>

            {/* Channel */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('incidents.form.channel')}
              </label>
              <div className="flex flex-wrap gap-3">
                {Object.values(Channel).map((channel) => (
                  <label
                    key={channel}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                      formData.channel === channel
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    <input
                      type="radio"
                      name="channel"
                      value={channel}
                      checked={formData.channel === channel}
                      onChange={(e) => setFormData({ ...formData, channel: e.target.value as Channel })}
                      className="sr-only"
                    />
                    <span className="capitalize">{channel}</span>
                  </label>
                ))}
              </div>
            </div>
          </Card>

          {/* Knowledge Deflection Panel */}
          {!dismissedDeflection && debouncedTitle.length >= 5 && (
            <div className="border border-blue-200 dark:border-blue-700 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Lightbulb className="w-4 h-4" />
                  <span className="text-sm font-semibold">{locale === 'ar' ? 'هل وجدت ما تحتاجه؟' : 'Self-help suggestions'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDismissedDeflection(true)}
                  className="text-xs text-blue-500 hover:underline"
                >
                  {locale === 'ar' ? 'تجاهل' : 'Dismiss'}
                </button>
              </div>

              {deflectionLoading ? (
                <div className="flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> {locale === 'ar' ? 'جاري البحث...' : 'Searching knowledge base...'}
                </div>
              ) : deflection && deflection.suggestions && deflection.suggestions.length > 0 ? (
                <div className="divide-y divide-blue-100 dark:divide-blue-800">
                  {deflection.suggestions.slice(0, 4).map((s) => (
                    <div key={s.article_id} className="px-4 py-3 flex items-start gap-3">
                      <BookOpen className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{s.title}</p>
                        {s.summary && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{s.summary}</p>}
                        <div className="flex items-center gap-3 mt-2">
                          <a
                            href={`/knowledge/${s.article_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {locale === 'ar' ? 'اقرأ المقالة' : 'Read article'}
                          </a>
                          {!helpfulMarked[s.article_id] && (
                            <div className="flex items-center gap-2 ml-auto">
                              <span className="text-xs text-muted-foreground">{locale === 'ar' ? 'هل أفادتك؟' : 'Helpful?'}</span>
                              <button
                                type="button"
                                onClick={() => { markHelpful.mutate(s.article_id); setHelpfulMarked((p) => ({ ...p, [s.article_id]: 'helpful' })); }}
                                className="p-1 hover:bg-green-100 rounded"
                              >
                                <ThumbsUp className="w-3.5 h-3.5 text-gray-400 hover:text-green-600" />
                              </button>
                              <button
                                type="button"
                                onClick={() => { markNotHelpful.mutate(s.article_id); setHelpfulMarked((p) => ({ ...p, [s.article_id]: 'not_helpful' })); }}
                                className="p-1 hover:bg-red-100 rounded"
                              >
                                <ThumbsDown className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                              </button>
                            </div>
                          )}
                          {helpfulMarked[s.article_id] === 'helpful' && (
                            <span className="ml-auto text-xs text-green-600 font-medium">{locale === 'ar' ? '✓ مفيدة' : '✓ Marked helpful'}</span>
                          )}
                          {helpfulMarked[s.article_id] === 'not_helpful' && (
                            <span className="ml-auto text-xs text-muted-foreground">{locale === 'ar' ? 'شكرًا على ملاحظتك' : 'Thanks for your feedback'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {deflection.deflection_possible && (
                    <div className="px-4 py-3 bg-green-50 dark:bg-green-900/10 text-center">
                      <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                        {locale === 'ar' ? 'هل حلّت المقالات أعلاه مشكلتك؟ يمكنك إغلاق هذه الصفحة إذا تم الحل.' : 'Did any of the above resolve your issue? You can go back if it did.'}
                      </p>
                    </div>
                  )}
                </div>
              ) : debouncedTitle.length >= 5 && !deflectionLoading ? (
                <div className="px-4 py-3 text-sm text-muted-foreground">{locale === 'ar' ? 'لا توجد مقترحات مطابقة' : 'No matching articles found'}</div>
              ) : null}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createIncident.isPending}>
              {createIncident.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('incidents.submitIncident')
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
