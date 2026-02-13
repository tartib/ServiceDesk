'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateIncident } from '@/hooks/useIncidents';
import { useCategories } from '@/hooks/useCategories';
import { Impact, Urgency, Channel, CreateIncidentDTO } from '@/types/itsm';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
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
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('incidents.reportIncident')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('incidents.subtitle')}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('incidents.form.title')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('incidents.form.titlePlaceholder')}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('incidents.form.description')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('incidents.form.descriptionPlaceholder')}
              />
            </div>

            {/* Impact & Urgency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('incidents.form.impact')}
                </label>
                <select
                  value={formData.impact}
                  onChange={(e) => setFormData({ ...formData, impact: e.target.value as Impact })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={Impact.LOW}>{t('incidents.form.impactLow')}</option>
                  <option value={Impact.MEDIUM}>{t('incidents.form.impactMedium')}</option>
                  <option value={Impact.HIGH}>{t('incidents.form.impactHigh')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('incidents.form.urgency')}
                </label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value as Urgency })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={Urgency.LOW}>{t('incidents.form.urgencyLow')}</option>
                  <option value={Urgency.MEDIUM}>{t('incidents.form.urgencyMedium')}</option>
                  <option value={Urgency.HIGH}>{t('incidents.form.urgencyHigh')}</option>
                </select>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('incidents.form.category')}
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('incidents.form.department')}
                </label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={locale === 'ar' ? 'القسم' : 'Your department'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('incidents.form.phone')}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+966-XX-XXXXXXX"
                />
              </div>
            </div>

            {/* Channel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('incidents.form.channel')}
              </label>
              <div className="flex flex-wrap gap-3">
                {Object.values(Channel).map((channel) => (
                  <label
                    key={channel}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                      formData.channel === channel
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
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
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={createIncident.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {createIncident.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('incidents.submitIncident')
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
