'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Columns3,
  Layers,
  Shield,
  Zap,
  Target,
  Check,
  FolderPlus,
  Calendar,
  KeyRound,
  FileText,
  AlignLeft,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';

const methodologies = [
  {
    code: 'scrum',
    name: 'Scrum',
    description: 'Iterative sprints with daily standups, sprint planning, and retrospectives.',
    icon: RefreshCw,
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    selectedColor: 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  {
    code: 'kanban',
    name: 'Kanban',
    description: 'Continuous flow with WIP limits and visual board management.',
    icon: Columns3,
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    selectedColor: 'bg-blue-50 border-blue-500 ring-2 ring-blue-200',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  {
    code: 'waterfall',
    name: 'Waterfall',
    description: 'Sequential phases with formal milestones and gate reviews.',
    icon: Layers,
    color: 'bg-violet-50 border-violet-200 text-violet-700',
    selectedColor: 'bg-violet-50 border-violet-500 ring-2 ring-violet-200',
    iconBg: 'bg-violet-100 text-violet-600',
  },
  {
    code: 'itil',
    name: 'ITIL',
    description: 'IT service management with change advisory board and release calendar.',
    icon: Shield,
    color: 'bg-orange-50 border-orange-200 text-orange-700',
    selectedColor: 'bg-orange-50 border-orange-500 ring-2 ring-orange-200',
    iconBg: 'bg-orange-100 text-orange-600',
  },
  {
    code: 'lean',
    name: 'Lean',
    description: 'Value stream optimization with waste reduction focus.',
    icon: Zap,
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    selectedColor: 'bg-amber-50 border-amber-500 ring-2 ring-amber-200',
    iconBg: 'bg-amber-100 text-amber-600',
  },
  {
    code: 'okr',
    name: 'OKR',
    description: 'Objectives and Key Results with quarterly goal tracking.',
    icon: Target,
    color: 'bg-pink-50 border-pink-200 text-pink-700',
    selectedColor: 'bg-pink-50 border-pink-500 ring-2 ring-pink-200',
    iconBg: 'bg-pink-100 text-pink-600',
  },
];

export default function NewProjectPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [keyManuallyEdited, setKeyManuallyEdited] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    methodology: '',
    startDate: '',
    targetEndDate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/v1/pm/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          key: formData.key,
          description: formData.description || undefined,
          methodology: formData.methodology,
          startDate: formData.startDate || undefined,
          targetEndDate: formData.targetEndDate || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.error || 'Failed to create project');
      }

      const projectId = data.data?.project?._id || data.data?._id;

      if (projectId) {
        // Initialize methodology
        await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}/methodology`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ methodologyCode: formData.methodology }),
        }).catch(() => {});

        router.push(`/projects/${projectId}/board`);
      } else {
        router.push('/projects');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  const generateKey = (name: string) => {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6);
  };

  return (
    <DashboardLayout>
      <div className="min-h-full bg-gray-50">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <Link
              href="/projects"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {t('projects.createProject') || 'Create New Project'}
              </h1>
              <p className="text-sm text-gray-500">
                {t('projects.createProjectDesc') || 'Set up your project details and choose a methodology'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-red-500 text-xs font-bold">!</span>
              </div>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section 1: Project Details */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FolderPlus className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {t('projects.projectDetails') || 'Project Details'}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {t('projects.projectDetailsDesc') || 'Basic information about your project'}
                  </p>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Name & Key Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <FileText className="h-3.5 w-3.5 text-gray-400" />
                      {t('projects.projectName') || 'Project Name'}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setFormData({
                          ...formData,
                          name,
                          key: keyManuallyEdited ? formData.key : generateKey(name),
                        });
                      }}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder={t('projects.projectNamePlaceholder') || 'e.g., Mobile App Redesign'}
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <KeyRound className="h-3.5 w-3.5 text-gray-400" />
                      {t('projects.projectKey') || 'Project Key'}
                      <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      value={formData.key}
                      onChange={(e) => {
                        setKeyManuallyEdited(true);
                        setFormData({ ...formData, key: e.target.value.toUpperCase() });
                      }}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-mono uppercase"
                      placeholder="PROJ"
                    />
                    <p className="mt-1.5 text-xs text-gray-400">
                      {t('projects.keyHint') || 'Prefix for task IDs (e.g., PROJ-123)'}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <AlignLeft className="h-3.5 w-3.5 text-gray-400" />
                    {t('projects.description') || 'Description'}
                    <span className="text-xs text-gray-400 font-normal">({t('common.optional') || 'Optional'})</span>
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                    placeholder={t('projects.descriptionPlaceholder') || 'Brief description of your project goals and scope...'}
                  />
                </div>

                {/* Dates Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      {t('projects.startDate') || 'Start Date'}
                      <span className="text-xs text-gray-400 font-normal">({t('common.optional') || 'Optional'})</span>
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      {t('projects.endDate') || 'Target End Date'}
                      <span className="text-xs text-gray-400 font-normal">({t('common.optional') || 'Optional'})</span>
                    </label>
                    <input
                      type="date"
                      value={formData.targetEndDate}
                      onChange={(e) => setFormData({ ...formData, targetEndDate: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Methodology */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Layers className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    {t('projects.methodology') || 'Methodology'}
                    <span className="text-red-500 ml-1">*</span>
                  </h2>
                  <p className="text-xs text-gray-500">
                    {t('projects.methodologyDesc') || 'Choose the framework that best fits your workflow'}
                  </p>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {methodologies.map((method) => {
                    const Icon = method.icon;
                    const isSelected = formData.methodology === method.code;
                    return (
                      <button
                        key={method.code}
                        type="button"
                        onClick={() => setFormData({ ...formData, methodology: method.code })}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          isSelected
                            ? method.selectedColor
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${method.iconBg}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{method.name}</h3>
                        <p className="text-xs text-gray-500 leading-relaxed">{method.description}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 pb-8">
              <Link
                href="/projects"
                className="px-5 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors font-medium"
              >
                {t('projects.common.cancel') || 'Cancel'}
              </Link>
              <button
                type="submit"
                disabled={isLoading || !formData.methodology || !formData.name || !formData.key}
                className="flex items-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors shadow-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('projects.creating') || 'Creating...'}
                  </>
                ) : (
                  <>
                    <FolderPlus className="h-4 w-4" />
                    {t('projects.createProject') || 'Create Project'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
