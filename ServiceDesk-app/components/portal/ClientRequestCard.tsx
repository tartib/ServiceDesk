'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  submitted: 'bg-brand-surface text-brand',
  under_review: 'bg-info-soft text-info',
  in_progress: 'bg-brand-surface text-brand',
  waiting_client: 'bg-warning-soft text-warning',
  approved: 'bg-success-soft text-success',
  rejected: 'bg-destructive-soft text-destructive',
  completed: 'bg-success-soft text-success',
  cancelled: 'bg-muted text-muted-foreground',
};

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

interface ClientRequestCardProps {
  record: {
    _id: string;
    recordNumber?: string;
    title: string;
    status: string;
    priority: string;
    createdAt: string;
    updatedAt: string;
  };
}

export default function ClientRequestCard({ record }: ClientRequestCardProps) {
  const { locale } = useLanguage();
  const isAr = locale === 'ar';
  const statusColor = STATUS_COLORS[record.status] ?? STATUS_COLORS.draft;
  const statusLabel = STATUS_LABELS[record.status] ?? STATUS_LABELS.draft;

  return (
    <Link
      href={`/portal/requests/${record._id}`}
      className="group flex items-center gap-4 rounded-xl border bg-background p-4 transition-colors hover:bg-muted/50"
    >
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          {record.recordNumber && (
            <span className="text-xs font-mono text-muted-foreground">{record.recordNumber}</span>
          )}
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
            {isAr ? statusLabel.ar : statusLabel.en}
          </span>
        </div>
        <h3 className="text-sm font-medium truncate">{record.title}</h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {new Date(record.createdAt).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
    </Link>
  );
}
