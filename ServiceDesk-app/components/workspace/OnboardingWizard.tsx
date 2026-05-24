'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Loader2, Check, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSetupWorkspace } from '@/hooks/useOnboarding';
import WorkspaceTemplateCard from './WorkspaceTemplateCard';
import { getAvailableTemplates, getWorkspaceTemplate } from './workspaceTemplates';
import type { WorkspaceType } from './workspaceTemplates';

type Step = 'template' | 'details' | 'confirm';
const STEPS: Step[] = ['template', 'details', 'confirm'];

export default function OnboardingWizard() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const isAr = locale === 'ar';

  const [currentStep, setCurrentStep] = useState<Step>('template');
  const [selectedType, setSelectedType] = useState<WorkspaceType | null>(null);
  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState('');

  const setupMutation = useSetupWorkspace();
  const templates = getAvailableTemplates();
  const selectedTemplate = selectedType ? getWorkspaceTemplate(selectedType) : null;

  const stepIndex = STEPS.indexOf(currentStep);
  const canGoNext =
    (currentStep === 'template' && selectedType !== null) ||
    (currentStep === 'details' && orgName.trim().length > 0) ||
    currentStep === 'confirm';

  const goNext = useCallback(() => {
    if (stepIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[stepIndex + 1]);
    }
  }, [stepIndex]);

  const goBack = useCallback(() => {
    if (stepIndex > 0) {
      setCurrentStep(STEPS[stepIndex - 1]);
    }
  }, [stepIndex]);

  const handleLaunch = useCallback(async () => {
    if (!selectedType) return;
    await setupMutation.mutateAsync({
      workspaceType: selectedType,
      organizationName: orgName.trim() || undefined,
    });
    router.push('/');
  }, [selectedType, orgName, setupMutation, router]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Progress */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((step, i) => (
          <React.Fragment key={step}>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                i < stepIndex
                  ? 'bg-brand text-brand-foreground'
                  : i === stepIndex
                  ? 'bg-brand text-brand-foreground ring-2 ring-brand-border ring-offset-2'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < stepIndex ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 w-12 ${i < stepIndex ? 'bg-brand' : 'bg-muted'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Title */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">
          {t('workspace.onboarding.title')}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t('workspace.onboarding.subtitle')}
        </p>
      </div>

      {/* Step 1: Choose Template */}
      {currentStep === 'template' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tpl) => (
            <WorkspaceTemplateCard
              key={tpl.type}
              template={tpl}
              isSelected={selectedType === tpl.type}
              onSelect={(type) => setSelectedType(type)}
              locale={locale as 'en' | 'ar'}
            />
          ))}
        </div>
      )}

      {/* Step 2: Org Details */}
      {currentStep === 'details' && (
        <div className="mx-auto max-w-md space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="org-name">
              {t('workspace.onboarding.orgName')}
            </label>
            <input
              id="org-name"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder={t('workspace.onboarding.orgNamePlaceholder')}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-border"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="org-desc">
              {t('workspace.onboarding.orgDescription')}
            </label>
            <textarea
              id="org-desc"
              value={orgDescription}
              onChange={(e) => setOrgDescription(e.target.value)}
              placeholder={t('workspace.onboarding.orgDescriptionPlaceholder')}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-border resize-none"
            />
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {currentStep === 'confirm' && selectedTemplate && (
        <div className="mx-auto max-w-md space-y-6">
          <div className="rounded-xl border bg-muted/30 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-brand" />
              <h3 className="text-lg font-semibold">{t('workspace.onboarding.confirmTitle')}</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('workspace.onboarding.confirmDescription')}
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('workspace.onboarding.workspaceTypeLabel')}</span>
                <span className="font-medium">{isAr ? selectedTemplate.nameAr : selectedTemplate.name}</span>
              </div>
              {orgName && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('workspace.onboarding.orgName')}</span>
                  <span className="font-medium">{orgName}</span>
                </div>
              )}
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">{t('workspace.onboarding.requestTypesLabel')}</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedTemplate.defaultRequestTypes.map((rt) => (
                    <span
                      key={rt.name}
                      className="inline-flex items-center gap-1 rounded-full bg-brand-surface px-2.5 py-1 text-xs font-medium text-brand"
                    >
                      {isAr ? rt.nameAr : rt.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="mt-10 flex items-center justify-between">
        <button
          type="button"
          onClick={goBack}
          disabled={stepIndex === 0}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:invisible"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('workspace.onboarding.back')}
        </button>

        {currentStep === 'confirm' ? (
          <button
            type="button"
            onClick={handleLaunch}
            disabled={setupMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand-strong transition-colors disabled:opacity-60"
          >
            {setupMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('workspace.onboarding.launching')}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {t('workspace.onboarding.launch')}
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={goNext}
            disabled={!canGoNext}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand-strong transition-colors disabled:opacity-40"
          >
            {t('workspace.onboarding.next')}
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
