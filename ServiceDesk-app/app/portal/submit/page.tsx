'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PortalSubmitPage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const isAr = locale === 'ar';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const portalToken = new URLSearchParams(window.location.search).get('token') || '';
      const res = await fetch('/api/v2/portal/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-portal-token': portalToken,
        },
        body: JSON.stringify({ title: title.trim(), description: description.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Submission failed');
      }

      router.push('/portal/requests');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <Link
        href="/portal"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {isAr ? 'العودة' : 'Back'}
      </Link>

      <h1 className="text-xl font-bold mb-6">{t('workspace.portal.submitRequest')}</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="title" className="text-sm font-medium">
            {isAr ? 'عنوان الطلب' : 'Request Title'} *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isAr ? 'صف طلبك باختصار...' : 'Briefly describe your request...'}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-border"
            required
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="text-sm font-medium">
            {isAr ? 'التفاصيل' : 'Details'}
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isAr ? 'أضف تفاصيل إضافية...' : 'Add more details...'}
            rows={5}
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-border resize-none"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-destructive-soft p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !title.trim()}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-2.5 text-sm font-medium text-brand-foreground hover:bg-brand-strong transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {t('workspace.portal.submitRequest')}
        </button>
      </form>
    </div>
  );
}
