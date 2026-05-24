'use client';

import React from 'react';
import Link from 'next/link';
import { Send, ClipboardList } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function PortalLandingPage() {
  const { t, locale } = useLanguage();
  const isAr = locale === 'ar';

  return (
    <div className="flex flex-col items-center gap-8 pt-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{t('workspace.portal.title')}</h1>
        <p className="text-muted-foreground max-w-md">
          {isAr
            ? 'مرحبًا بك في بوابة العملاء. يمكنك إرسال طلبات جديدة أو تتبع طلباتك الحالية.'
            : 'Welcome to the client portal. Submit new requests or track your existing ones.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 w-full max-w-lg">
        <Link
          href="/portal/submit"
          className="flex flex-col items-center gap-3 rounded-xl border-2 border-border bg-background p-8 text-center transition-all hover:border-brand hover:shadow-md"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-surface">
            <Send className="h-7 w-7 text-brand" />
          </div>
          <span className="font-semibold">{t('workspace.portal.submitRequest')}</span>
        </Link>

        <Link
          href="/portal/requests"
          className="flex flex-col items-center gap-3 rounded-xl border-2 border-border bg-background p-8 text-center transition-all hover:border-brand hover:shadow-md"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-surface">
            <ClipboardList className="h-7 w-7 text-brand" />
          </div>
          <span className="font-semibold">{t('workspace.portal.trackRequests')}</span>
        </Link>
      </div>
    </div>
  );
}
