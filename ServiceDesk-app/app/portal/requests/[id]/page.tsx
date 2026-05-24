'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle, XCircle, MessageSquare, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const STATUS_LABELS: Record<string, { en: string; ar: string }> = {
  draft: { en: 'Draft', ar: 'مسودة' },
  submitted: { en: 'Submitted', ar: 'مقدم' },
  under_review: { en: 'Under Review', ar: 'قيد المراجعة' },
  in_progress: { en: 'In Progress', ar: 'قيد التنفيذ' },
  waiting_client: { en: 'Awaiting Your Action', ar: 'بانتظار إجراءك' },
  approved: { en: 'Approved', ar: 'موافق عليه' },
  rejected: { en: 'Rejected', ar: 'مرفوض' },
  completed: { en: 'Completed', ar: 'مكتمل' },
  cancelled: { en: 'Cancelled', ar: 'ملغى' },
};

export default function PortalRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, locale } = useLanguage();
  const isAr = locale === 'ar';
  const [record, setRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [comments, setComments] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const portalToken = new URLSearchParams(window.location.search).get('token') || '';
        const res = await fetch(`/api/v2/portal/records/${id}`, {
          headers: { 'x-portal-token': portalToken },
        });
        if (res.ok) {
          const json = await res.json();
          setRecord(json.data);
        }
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  const handleAction = async (action: 'approve' | 'reject' | 'request_changes') => {
    setActionLoading(true);
    try {
      const portalToken = new URLSearchParams(window.location.search).get('token') || '';
      const res = await fetch(`/api/v2/portal/records/${id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-portal-token': portalToken,
        },
        body: JSON.stringify({ action, comments }),
      });
      if (res.ok) {
        const json = await res.json();
        setRecord(json.data);
      }
    } catch {
      // silent
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">{isAr ? 'السجل غير موجود' : 'Record not found'}</p>
      </div>
    );
  }

  const statusLabel = STATUS_LABELS[record.status] ?? { en: record.status, ar: record.status };
  const isWaitingClient = record.status === 'waiting_client';

  return (
    <div>
      <Link
        href="/portal/requests"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('workspace.portal.myRequests')}
      </Link>

      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          {record.recordNumber && (
            <span className="text-xs font-mono text-muted-foreground">{record.recordNumber}</span>
          )}
          <h1 className="text-xl font-bold">{record.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {new Date(record.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </span>
            <span className="inline-flex items-center rounded-full bg-brand-surface px-2.5 py-0.5 text-xs font-medium text-brand">
              {isAr ? statusLabel.ar : statusLabel.en}
            </span>
          </div>
        </div>

        {/* Description */}
        {record.description && (
          <div className="rounded-xl border bg-background p-5">
            <p className="text-sm whitespace-pre-wrap">{record.description}</p>
          </div>
        )}

        {/* Client Actions — only when waiting_client */}
        {isWaitingClient && (
          <div className="rounded-xl border bg-background p-5 space-y-4">
            <h3 className="font-semibold">{t('workspace.portal.approvalTitle')}</h3>
            <p className="text-sm text-muted-foreground">{t('workspace.portal.approvalDescription')}</p>

            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={t('workspace.portal.changesPlaceholder')}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-border resize-none"
            />

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => handleAction('approve')}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-medium text-success-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                {t('workspace.portal.approve')}
              </button>
              <button
                type="button"
                onClick={() => handleAction('request_changes')}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
              >
                <MessageSquare className="h-4 w-4" />
                {t('workspace.portal.requestChanges')}
              </button>
              <button
                type="button"
                onClick={() => handleAction('reject')}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                {t('workspace.portal.reject')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
