'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import FormRenderer from '@/components/forms-platform/FormRenderer';
import type { FormTemplate } from '@/types/smart-forms';
import { API_URL } from '@/lib/api/config';
import { Loader2, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PageState = 'loading' | 'ready' | 'submitting' | 'success' | 'error' | 'not_found';

export default function PublicFormFillPage() {
  const { formId } = useParams<{ formId: string }>();
  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [pageState, setPageState] = useState<PageState>('loading');
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!formId) return;

    const publicApi = axios.create({ baseURL: API_URL });

    publicApi
      .get<{ success: boolean; data: FormTemplate }>(`/public/forms/${formId}`)
      .then((res) => {
        const tpl = (res as unknown as { data: { success: boolean; data: FormTemplate } }).data?.data
          ?? (res as unknown as { data: FormTemplate }).data;
        if (!tpl) {
          setPageState('not_found');
        } else {
          setTemplate(tpl);
          setPageState('ready');
        }
      })
      .catch(() => setPageState('not_found'));
  }, [formId]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    setPageState('submitting');
    setSubmitError(null);
    try {
      const publicApi = axios.create({ baseURL: API_URL });
      await publicApi.post(`/public/forms/${template?.form_id ?? formId}/submissions`, { data });
      setPageState('success');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Submission failed. Please try again.';
      setSubmitError(msg);
      setPageState('ready');
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col">
      {/* Header */}
      <header className="bg-background border-b border-border px-6 py-4 flex items-center gap-3 shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-surface">
          <FileText className="h-4 w-4 text-brand" />
        </div>
        <span className="text-sm font-semibold text-foreground">
          {template?.name ?? 'Form'}
        </span>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl">

          {/* Loading */}
          {pageState === 'loading' && (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Loading form…</p>
            </div>
          )}

          {/* Not found / unpublished */}
          {pageState === 'not_found' && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-7 w-7 text-destructive" />
              </div>
              <div>
                <p className="text-lg font-semibold">Form not available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This form doesn&apos;t exist or is no longer accepting responses.
                </p>
              </div>
            </div>
          )}

          {/* Submit error banner */}
          {submitError && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              {submitError}
            </div>
          )}

          {/* Form ready / submitting */}
          {(pageState === 'ready' || pageState === 'submitting') && template && (
            <div className="bg-background rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="px-6 pt-6 pb-2">
                <h1 className="text-xl font-bold text-foreground">{template.name}</h1>
                {template.description && (
                  <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
                )}
              </div>
              <div className="px-2 pb-6">
                <FormRenderer
                  template={template}
                  onSubmit={handleSubmit}
                  disabled={pageState === 'submitting'}
                  locale="en"
                />
              </div>
            </div>
          )}

          {/* Success */}
          {pageState === 'success' && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-16 h-16 rounded-full bg-success-soft flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <div>
                <p className="text-xl font-bold">Response submitted!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Thank you — your response has been recorded.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPageState('ready')}
              >
                Submit another response
              </Button>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 py-4 text-center text-xs text-muted-foreground/60">
        Powered by ServiceDesk Forms
      </footer>
    </div>
  );
}
