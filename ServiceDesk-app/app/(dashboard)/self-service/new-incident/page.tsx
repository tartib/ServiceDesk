'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useCreateIncident } from '@/hooks/useIncidents';
import { useCategories } from '@/hooks/useCategories';
import { Impact, Urgency, Channel } from '@/types/itsm';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { ArrowLeft, Send, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function NewIncidentPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const createIncident = useCreateIncident();
  const { data: categories = [] } = useCategories(true);

  const [form, setForm] = useState({
    title: '',
    description: '',
    impact: Impact.MEDIUM,
    urgency: Urgency.MEDIUM,
    category_id: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.title.length < 3) {
      setError(locale === 'ar' ? 'العنوان يجب أن يكون 3 أحرف على الأقل' : 'Title must be at least 3 characters');
      return;
    }
    if (form.description.length < 10) {
      setError(locale === 'ar' ? 'الوصف يجب أن يكون 10 أحرف على الأقل' : 'Description must be at least 10 characters');
      return;
    }

    try {
      await createIncident.mutateAsync({
        title: form.title,
        description: form.description,
        impact: form.impact,
        urgency: form.urgency,
        channel: Channel.SELF_SERVICE,
        category_id: form.category_id || 'general',
        site_id: 'default',
      });
      
      router.push('/self-service');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string; details?: { errors?: { message: string }[] } } } };
      const details = axiosErr?.response?.data?.details?.errors;
      if (details && details.length > 0) {
        setError(details.map(e => e.message).join(', '));
      } else {
        setError(axiosErr?.response?.data?.message || (locale === 'ar' ? 'حدث خطأ أثناء إنشاء البلاغ' : 'Failed to create incident'));
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/self-service">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              {t('selfService.reportIssue')}
            </h1>
            <p className="text-muted-foreground">
              {t('selfService.reportIssueDesc')}
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('selfService.submitTicket')}</CardTitle>
            <CardDescription>
              {locale === 'ar' ? 'أخبرنا عن المشكلة التي تواجهها' : 'Tell us about the issue you are experiencing'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label>{t('selfService.form.subject')} *</Label>
                <Input
                  required
                  minLength={3}
                  value={form.title}
                  onChange={(e) => { setForm({ ...form, title: e.target.value }); setError(null); }}
                  placeholder={t('selfService.form.subjectPlaceholder')}
                  dir={locale === 'ar' ? 'rtl' : 'ltr'}
                />
                <p className="text-xs text-muted-foreground">
                  {locale === 'ar' ? '3 أحرف على الأقل' : 'At least 3 characters'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>{t('selfService.form.description')} *</Label>
                <Textarea
                  required
                  minLength={10}
                  rows={5}
                  value={form.description}
                  onChange={(e) => { setForm({ ...form, description: e.target.value }); setError(null); }}
                  placeholder={t('selfService.form.descriptionPlaceholder')}
                  dir={locale === 'ar' ? 'rtl' : 'ltr'}
                />
                <p className="text-xs text-muted-foreground">
                  {locale === 'ar' ? '10 أحرف على الأقل' : 'At least 10 characters'}
                </p>
              </div>

              <div className="space-y-2">
                <Label>{t('incidents.form.category')}</Label>
                <Select
                  value={form.category_id}
                  onValueChange={(value) => setForm({ ...form, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={locale === 'ar' ? 'اختر الفئة' : 'Select category'} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {locale === 'ar' && cat.nameAr ? cat.nameAr : cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('incidents.form.impact')}</Label>
                  <Select
                    value={form.impact}
                    onValueChange={(value) => setForm({ ...form, impact: value as Impact })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Impact.LOW}>{t('incidents.form.impactLow')}</SelectItem>
                      <SelectItem value={Impact.MEDIUM}>{t('incidents.form.impactMedium')}</SelectItem>
                      <SelectItem value={Impact.HIGH}>{t('incidents.form.impactHigh')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('incidents.form.urgency')}</Label>
                  <Select
                    value={form.urgency}
                    onValueChange={(value) => setForm({ ...form, urgency: value as Urgency })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Urgency.LOW}>{t('incidents.form.urgencyLow')}</SelectItem>
                      <SelectItem value={Urgency.MEDIUM}>{t('incidents.form.urgencyMedium')}</SelectItem>
                      <SelectItem value={Urgency.HIGH}>{t('incidents.form.urgencyHigh')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push('/self-service')}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createIncident.isPending}
                >
                  {createIncident.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      {t('selfService.submitTicket')}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
