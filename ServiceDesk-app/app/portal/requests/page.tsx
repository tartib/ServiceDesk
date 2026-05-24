'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Inbox } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import ClientRequestCard from '@/components/portal/ClientRequestCard';

export default function PortalRequestsPage() {
  const { t, locale } = useLanguage();
  const isAr = locale === 'ar';
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const portalToken = new URLSearchParams(window.location.search).get('token') || '';
        const res = await fetch('/api/v2/portal/records', {
          headers: { 'x-portal-token': portalToken },
        });
        if (res.ok) {
          const json = await res.json();
          setRecords(json.data?.records ?? []);
        }
      } catch {
        // silent fail
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div>
      <Link
        href="/portal"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {isAr ? 'العودة' : 'Back'}
      </Link>

      <h1 className="text-xl font-bold mb-6">{t('workspace.portal.myRequests')}</h1>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl border bg-muted animate-pulse" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Inbox className="h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">{t('workspace.portal.noRequests')}</p>
          <Link
            href="/portal/submit"
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-strong"
          >
            {t('workspace.portal.submitNew')}
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <ClientRequestCard key={record._id} record={record} />
          ))}
        </div>
      )}
    </div>
  );
}
