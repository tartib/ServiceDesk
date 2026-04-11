'use client';

import { API_URL } from '@/lib/api/config';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Check, X, FileText, Briefcase, Settings, Eye } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface IntakeFormData {
  title: string;
  description: string;
  category: string;
  priority: string;
  businessJustification: string;
  expectedBenefits: string;
  estimatedBudget: string;
  estimatedTimeline: string;
  riskLevel: string;
  strategicAlignment: string;
  preferredMethodology: string;
  suggestedTeam: string;
}

const initialFormData: IntakeFormData = {
  title: '',
  description: '',
  category: 'new_product',
  priority: 'medium',
  businessJustification: '',
  expectedBenefits: '',
  estimatedBudget: '',
  estimatedTimeline: '',
  riskLevel: '',
  strategicAlignment: '',
  preferredMethodology: 'scrum',
  suggestedTeam: '',
};

const STEP_ICONS = [FileText, Briefcase, Settings, Eye];
const CATEGORY_VALUES = ['new_product', 'improvement', 'maintenance', 'research', 'infrastructure'];
const METHODOLOGY_VALUES = ['scrum', 'kanban', 'waterfall', 'itil', 'lean', 'okr'];

export default function NewIntakeRequestPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const steps = [
    { id: 1, name: t('intake.new.steps.projectInfo'), icon: STEP_ICONS[0] },
    { id: 2, name: t('intake.new.steps.businessCase'), icon: STEP_ICONS[1] },
    { id: 3, name: t('intake.new.steps.details'), icon: STEP_ICONS[2] },
    { id: 4, name: t('intake.new.steps.review'), icon: STEP_ICONS[3] },
  ];

  const categories = CATEGORY_VALUES.map((v) => ({
    value: v,
    label: t(`intake.categories.${v}`),
    desc: t(`intake.categoryDescriptions.${v}`),
  }));

  const methodologies = METHODOLOGY_VALUES.map((v) => ({
    value: v,
    label: t(`intake.methodologies.${v}`),
    desc: t(`intake.methodologyDescriptions.${v}`),
  }));
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<IntakeFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (field: keyof IntakeFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1: return formData.title.trim() !== '' && formData.description.trim() !== '';
      case 2: return true;
      case 3: return true;
      case 4: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      if (!token) throw new Error('Not authenticated');

      const body: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        priority: formData.priority,
        preferredMethodology: formData.preferredMethodology,
      };

      if (formData.businessJustification) body.businessJustification = formData.businessJustification;
      if (formData.expectedBenefits) body.expectedBenefits = formData.expectedBenefits;
      if (formData.estimatedBudget) body.estimatedBudget = parseFloat(formData.estimatedBudget);
      if (formData.estimatedTimeline) body.estimatedTimeline = formData.estimatedTimeline;
      if (formData.riskLevel) body.riskLevel = formData.riskLevel;
      if (formData.strategicAlignment) body.strategicAlignment = formData.strategicAlignment;
      if (formData.suggestedTeam) body.suggestedTeam = formData.suggestedTeam;

      const response = await fetch(`${API_URL}/pm/intake`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.errors?.[0]?.message || 'Failed to create request');
      }

      toast.success(t('intake.new.successMessage'));
      router.push(`/projects/intake/${data.data.intake._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('intake.new.projectTitle')} *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder={t('intake.new.projectTitlePlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('intake.new.description')} *</label>
              <textarea
                value={formData.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder={t('intake.new.descriptionPlaceholder')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('intake.new.categoryLabel')} *</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => update('category', cat.value)}
                    className={`text-left p-3 rounded-lg border-2 transition-colors ${
                      formData.category === cat.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{cat.label}</div>
                    <div className="text-xs text-gray-500">{cat.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('intake.new.priorityLabel')}</label>
              <div className="flex gap-2">
                {['low', 'medium', 'high', 'critical'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => update('priority', p)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                      formData.priority === p
                        ? p === 'critical' ? 'bg-red-100 text-red-700 ring-2 ring-red-500' :
                          p === 'high' ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-500' :
                          p === 'medium' ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-500' :
                          'bg-green-100 text-green-700 ring-2 ring-green-500'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t(`intake.priorities.${p}`)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('intake.new.businessJustification')}</label>
              <textarea
                value={formData.businessJustification}
                onChange={(e) => update('businessJustification', e.target.value)}
                placeholder={t('intake.new.businessJustificationPlaceholder')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('intake.new.expectedBenefits')}</label>
              <textarea
                value={formData.expectedBenefits}
                onChange={(e) => update('expectedBenefits', e.target.value)}
                placeholder={t('intake.new.expectedBenefitsPlaceholder')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('intake.new.estimatedBudget')}</label>
                <input
                  type="number"
                  value={formData.estimatedBudget}
                  onChange={(e) => update('estimatedBudget', e.target.value)}
                  placeholder={t('intake.new.estimatedBudgetPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('intake.new.estimatedTimeline')}</label>
                <input
                  type="text"
                  value={formData.estimatedTimeline}
                  onChange={(e) => update('estimatedTimeline', e.target.value)}
                  placeholder={t('intake.new.estimatedTimelinePlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('intake.new.riskLevel')}</label>
              <div className="flex gap-2">
                {['low', 'medium', 'high'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => update('riskLevel', r)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                      formData.riskLevel === r
                        ? r === 'high' ? 'bg-red-100 text-red-700 ring-2 ring-red-500' :
                          r === 'medium' ? 'bg-yellow-100 text-yellow-700 ring-2 ring-yellow-500' :
                          'bg-green-100 text-green-700 ring-2 ring-green-500'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t(`intake.priorities.${r}`)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('intake.new.strategicAlignment')}</label>
              <textarea
                value={formData.strategicAlignment}
                onChange={(e) => update('strategicAlignment', e.target.value)}
                placeholder={t('intake.new.strategicAlignmentPlaceholder')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('intake.new.preferredMethodology')}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {methodologies.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => update('preferredMethodology', m.value)}
                    className={`text-left p-3 rounded-lg border-2 transition-colors ${
                      formData.preferredMethodology === m.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{m.label}</div>
                    <div className="text-xs text-gray-500">{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('intake.new.suggestedTeam')}</label>
              <textarea
                value={formData.suggestedTeam}
                onChange={(e) => update('suggestedTeam', e.target.value)}
                placeholder={t('intake.new.suggestedTeamPlaceholder')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700" dangerouslySetInnerHTML={{ __html: t('intake.new.reviewNotice') }} />
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-medium text-gray-400 uppercase mb-1">{t('intake.table.title')}</h3>
                <p className="text-sm text-gray-900 font-medium">{formData.title}</p>
              </div>
              <div>
                <h3 className="text-xs font-medium text-gray-400 uppercase mb-1">{t('intake.new.description')}</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.description}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <h3 className="text-xs font-medium text-gray-400 uppercase mb-1">{t('intake.new.categoryLabel')}</h3>
                  <p className="text-sm text-gray-700">{t(`intake.categories.${formData.category}`)}</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-400 uppercase mb-1">{t('intake.new.priorityLabel')}</h3>
                  <p className="text-sm text-gray-700">{t(`intake.priorities.${formData.priority}`)}</p>
                </div>
                <div>
                  <h3 className="text-xs font-medium text-gray-400 uppercase mb-1">{t('intake.new.methodology')}</h3>
                  <p className="text-sm text-gray-700">{t(`intake.methodologies.${formData.preferredMethodology}`)}</p>
                </div>
              </div>

              {formData.businessJustification && (
                <div>
                  <h3 className="text-xs font-medium text-gray-400 uppercase mb-1">{t('intake.new.businessJustification')}</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.businessJustification}</p>
                </div>
              )}
              {formData.expectedBenefits && (
                <div>
                  <h3 className="text-xs font-medium text-gray-400 uppercase mb-1">{t('intake.new.expectedBenefits')}</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{formData.expectedBenefits}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                {formData.estimatedBudget && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-400 uppercase mb-1">{t('intake.new.budget')}</h3>
                    <p className="text-sm text-gray-700">${Number(formData.estimatedBudget).toLocaleString()}</p>
                  </div>
                )}
                {formData.estimatedTimeline && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-400 uppercase mb-1">{t('intake.new.timeline')}</h3>
                    <p className="text-sm text-gray-700">{formData.estimatedTimeline}</p>
                  </div>
                )}
                {formData.riskLevel && (
                  <div>
                    <h3 className="text-xs font-medium text-gray-400 uppercase mb-1">{t('intake.new.risk')}</h3>
                    <p className="text-sm text-gray-700">{t(`intake.priorities.${formData.riskLevel}`)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-gray-50">
        <div className="max-w-3xl mx-auto w-full py-8 px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('intake.new.title')}</h1>
              <p className="text-sm text-gray-500">{t('intake.new.subtitle')}</p>
            </div>
            <button
              onClick={() => router.push('/projects/intake')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        currentStep > step.id
                          ? 'bg-green-500 text-white'
                          : currentStep === step.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {currentStep > step.id ? <Check className="h-5 w-5" /> : <StepIcon className="h-4 w-4" />}
                    </div>
                    <span className={`mt-1.5 text-xs font-medium ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'}`}>
                      {step.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 sm:w-24 h-1 mx-2 rounded ${currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            {renderStep()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : router.push('/projects/intake')}
              className="flex items-center gap-1 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              <ChevronLeft className="h-4 w-4" />
              {currentStep > 1 ? t('intake.new.back') : t('intake.new.cancel')}
            </button>

            {currentStep < steps.length ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {t('intake.new.next')}
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('intake.new.submitting')}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    {t('intake.new.submitRequest')}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
