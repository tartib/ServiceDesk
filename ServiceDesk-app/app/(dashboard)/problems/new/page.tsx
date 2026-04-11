'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCreateProblem } from '@/hooks/useProblems';
import { Priority, Impact } from '@/types/itsm';

export default function NewProblemPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const createProblem = useCreateProblem();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: Priority.MEDIUM,
    impact: Impact.MEDIUM,
    linked_incidents: '',
  });

  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Title and description are required');
      return;
    }

    const linkedIncidents = formData.linked_incidents
      .split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0);

    createProblem.mutate(
      {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        impact: formData.impact,
        category_id: 'general',
        site_id: 'default',
        linked_incidents: linkedIncidents.length > 0 ? linkedIncidents : undefined,
      },
      {
        onSuccess: () => {
          router.push('/problems');
        },
        onError: (err: Error) => {
          setError(err.message || 'Failed to create problem');
        },
      }
    );
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
              {t('problems.newProblem')}
            </h1>
            <p className="text-muted-foreground">
              {t('problems.subtitle')}
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
                {t('problems.form.title')} <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-input rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder={t('problems.form.titlePlaceholder')}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('problems.form.description')} <span className="text-destructive">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={5}
                className="w-full px-4 py-2 border border-input rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder={t('problems.form.descriptionPlaceholder')}
              />
            </div>

            {/* Priority & Impact */}
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
                  {t('common.status')}
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
                  className="w-full px-4 py-2 border border-input rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                  <option value={Priority.LOW}>{t('incidents.priority.low')}</option>
                  <option value={Priority.MEDIUM}>{t('incidents.priority.medium')}</option>
                  <option value={Priority.HIGH}>{t('incidents.priority.high')}</option>
                  <option value={Priority.CRITICAL}>{t('incidents.priority.critical')}</option>
                </select>
              </div>
            </div>

            {/* Linked Incidents */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('problems.linkedIncidents')}
              </label>
              <input
                type="text"
                value={formData.linked_incidents}
                onChange={(e) => setFormData({ ...formData, linked_incidents: e.target.value })}
                className="w-full px-4 py-2 border border-input rounded-lg bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder={t('problems.form.linkedIncidentsPlaceholder')}
              />
              <p className="text-sm text-muted-foreground mt-1">{t('problems.form.linkedIncidentsHint')}</p>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Button variant="outline" type="button" onClick={() => router.back()}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createProblem.isPending}>
              {createProblem.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('common.loading')}
                </>
              ) : (
                t('problems.form.submit')
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
