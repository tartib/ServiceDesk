'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateChange } from '@/hooks/useChanges';
import { ChangeType, Priority, Impact, RiskLevel, CreateChangeDTO } from '@/types/itsm';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NewChangePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const createChange = useCreateChange();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: ChangeType.NORMAL,
    priority: Priority.MEDIUM,
    impact: Impact.MEDIUM,
    risk: RiskLevel.MEDIUM,
    reason_for_change: '',
    risk_assessment: '',
    implementation_plan: '',
    rollback_plan: '',
    affected_services: ['General'] as string[],
    site_id: 'default',
    planned_start: '',
    planned_end: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [affectedServiceInput, setAffectedServiceInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.title.trim().length < 3) {
      setError(t('changes.form.titleMinError') || 'Title must be at least 3 characters');
      return;
    }
    if (formData.description.trim().length < 10) {
      setError(t('changes.form.descriptionMinError') || 'Description must be at least 10 characters');
      return;
    }
    if (!formData.reason_for_change.trim()) {
      setError(t('changes.form.reasonRequired') || 'Reason for change is required');
      return;
    }

    // Default schedule to next week if not provided
    const now = new Date();
    const plannedStart = formData.planned_start || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const plannedEnd = formData.planned_end || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString();

    const changeData: CreateChangeDTO = {
      title: formData.title,
      description: formData.description,
      type: formData.type,
      priority: formData.priority,
      impact: formData.impact,
      risk: formData.risk,
      reason_for_change: formData.reason_for_change,
      risk_assessment: formData.risk_assessment || 'To be assessed',
      implementation_plan: formData.implementation_plan || 'To be defined',
      rollback_plan: formData.rollback_plan || 'Revert to previous state',
      affected_services: formData.affected_services,
      site_id: formData.site_id,
      schedule: {
        planned_start: plannedStart,
        planned_end: plannedEnd,
      },
    };

    createChange.mutate(changeData, {
      onSuccess: () => {
        router.push('/changes');
      },
      onError: (err: unknown) => {
        const axiosErr = err as { response?: { data?: { message?: string; details?: { errors?: { field: string; message: string }[] } } } };
        const details = axiosErr?.response?.data?.details?.errors;
        if (details && details.length > 0) {
          setError(details.map((e: { message: string }) => e.message).join(', '));
        } else {
          setError(axiosErr?.response?.data?.message || (err as Error).message || 'Failed to create change request');
        }
      },
    });
  };

  const addAffectedService = () => {
    if (affectedServiceInput.trim() && !formData.affected_services.includes(affectedServiceInput.trim())) {
      setFormData({
        ...formData,
        affected_services: [...formData.affected_services, affectedServiceInput.trim()],
      });
      setAffectedServiceInput('');
    }
  };

  const removeAffectedService = (service: string) => {
    setFormData({
      ...formData,
      affected_services: formData.affected_services.filter((s) => s !== service),
    });
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
              {t('changes.createChange')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('changes.subtitle')}
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
                {t('changes.form.title')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => { setFormData({ ...formData, title: e.target.value }); setError(null); }}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('changes.form.titlePlaceholder')}
                minLength={3}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('changes.form.titleHint') || 'At least 3 characters'}</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('changes.form.description')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => { setFormData({ ...formData, description: e.target.value }); setError(null); }}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('changes.form.descriptionPlaceholder')}
                minLength={10}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('changes.form.descriptionHint') || 'At least 10 characters'}</p>
            </div>

            {/* Type & Priority */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('changes.form.changeType')}
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ChangeType })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={ChangeType.NORMAL}>{t('changes.form.typeNormal')}</option>
                  <option value={ChangeType.STANDARD}>{t('changes.form.typeStandard')}</option>
                  <option value={ChangeType.EMERGENCY}>{t('changes.form.typeEmergency')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('incidents.filters.priority')}
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={Priority.LOW}>{t('incidents.priority.low')}</option>
                  <option value={Priority.MEDIUM}>{t('incidents.priority.medium')}</option>
                  <option value={Priority.HIGH}>{t('incidents.priority.high')}</option>
                  <option value={Priority.CRITICAL}>{t('incidents.priority.critical')}</option>
                </select>
              </div>
            </div>

            {/* Reason for Change */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('changes.reasonForChange')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.reason_for_change}
                onChange={(e) => setFormData({ ...formData, reason_for_change: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('changes.form.reasonPlaceholder')}
              />
            </div>

            {/* Risk Assessment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('changes.riskAssessment')}
              </label>
              <textarea
                value={formData.risk_assessment}
                onChange={(e) => setFormData({ ...formData, risk_assessment: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('changes.form.riskPlaceholder')}
              />
            </div>

            {/* Rollback Plan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('changes.rollbackPlan')}
              </label>
              <textarea
                value={formData.rollback_plan}
                onChange={(e) => setFormData({ ...formData, rollback_plan: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('changes.form.rollbackPlaceholder')}
              />
            </div>

            {/* Affected Services */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('changes.affectedServices')}
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={affectedServiceInput}
                  onChange={(e) => setAffectedServiceInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAffectedService())}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('changes.form.addService')}
                />
                <button
                  type="button"
                  onClick={addAffectedService}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  Add
                </button>
              </div>
              {formData.affected_services.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.affected_services.map((service) => (
                    <span
                      key={service}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                    >
                      {service}
                      <button
                        type="button"
                        onClick={() => removeAffectedService(service)}
                        className="hover:text-blue-900 dark:hover:text-blue-100"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
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
              disabled={createChange.isPending}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {createChange.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('changes.createChange')
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
