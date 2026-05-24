'use client';

/**
 * RecordDetailView — Unified record detail component
 *
 * Renders full record metadata (RecordItem) + form data (RecordDetail).
 * Supports status updates, assignment, timeline, and comments.
 * Feature-flagged under `unified_record_detail`.
 */

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRecordItem, useUpdateRecordItemStatus, useAssignRecordItem } from '@/hooks/useRecordItems';
import type { RecordItem, RecordItemStatus } from '@/types';
import { RecordItemStatus as StatusEnum, RecordPriority } from '@/types';
import type { RecordDetail } from '@/lib/domains/forms/records';
import {
  Clock,
  User,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Calendar,
  Tag,
} from 'lucide-react';

interface RecordDetailViewProps {
  recordId: string;
}

const statusConfig: Record<string, { label: string; labelAr: string; color: string; icon: React.ReactNode }> = {
  [StatusEnum.DRAFT]: { label: 'Draft', labelAr: 'مسودة', color: 'bg-muted text-muted-foreground', icon: <FileText className="w-4 h-4" /> },
  [StatusEnum.SUBMITTED]: { label: 'Submitted', labelAr: 'مقدم', color: 'bg-brand-soft text-brand', icon: <Clock className="w-4 h-4" /> },
  [StatusEnum.UNDER_REVIEW]: { label: 'Under Review', labelAr: 'قيد المراجعة', color: 'bg-warning-soft text-warning', icon: <Clock className="w-4 h-4" /> },
  [StatusEnum.IN_PROGRESS]: { label: 'In Progress', labelAr: 'قيد التنفيذ', color: 'bg-info-soft text-info', icon: <Clock className="w-4 h-4" /> },
  [StatusEnum.WAITING_CLIENT]: { label: 'Waiting Client', labelAr: 'بانتظار العميل', color: 'bg-warning-soft text-warning', icon: <AlertTriangle className="w-4 h-4" /> },
  [StatusEnum.APPROVED]: { label: 'Approved', labelAr: 'معتمد', color: 'bg-success-soft text-success', icon: <CheckCircle className="w-4 h-4" /> },
  [StatusEnum.REJECTED]: { label: 'Rejected', labelAr: 'مرفوض', color: 'bg-destructive-soft text-destructive', icon: <XCircle className="w-4 h-4" /> },
  [StatusEnum.COMPLETED]: { label: 'Completed', labelAr: 'مكتمل', color: 'bg-success-soft text-success', icon: <CheckCircle className="w-4 h-4" /> },
  [StatusEnum.CANCELLED]: { label: 'Cancelled', labelAr: 'ملغى', color: 'bg-muted text-muted-foreground', icon: <XCircle className="w-4 h-4" /> },
};

const priorityConfig: Record<string, { label: string; labelAr: string; color: string }> = {
  [RecordPriority.LOW]: { label: 'Low', labelAr: 'منخفض', color: 'bg-info-soft text-info' },
  [RecordPriority.MEDIUM]: { label: 'Medium', labelAr: 'متوسط', color: 'bg-warning-soft text-warning' },
  [RecordPriority.HIGH]: { label: 'High', labelAr: 'عالي', color: 'bg-destructive-soft text-destructive' },
  [RecordPriority.CRITICAL]: { label: 'Critical', labelAr: 'حرج', color: 'bg-destructive text-destructive-foreground' },
};

export function RecordDetailView({ recordId }: RecordDetailViewProps) {
  const { locale } = useLanguage();
  const { data, isLoading, isError } = useRecordItem(recordId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-20">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-destructive opacity-60" />
        <h3 className="text-lg font-semibold text-foreground">
          {locale === 'ar' ? 'لم يتم العثور على السجل' : 'Record Not Found'}
        </h3>
        <p className="text-muted-foreground mt-1">
          {locale === 'ar' ? 'تعذر تحميل تفاصيل هذا السجل' : 'Could not load details for this record'}
        </p>
      </div>
    );
  }

  const { recordItem, detail } = data;
  const status = statusConfig[recordItem.status] ?? statusConfig[StatusEnum.SUBMITTED];
  const prio = priorityConfig[recordItem.priority] ?? priorityConfig[RecordPriority.MEDIUM];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm text-muted-foreground font-mono">{recordItem.recordNumber}</span>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
              {status.icon}
              {locale === 'ar' ? status.labelAr : status.label}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{recordItem.title}</h1>
          {recordItem.description && (
            <p className="text-muted-foreground mt-2 whitespace-pre-wrap">{recordItem.description}</p>
          )}
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${prio.color}`}>
          {locale === 'ar' ? prio.labelAr : prio.label}
        </span>
      </div>

      {/* Metadata cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetadataCard
          icon={<User className="w-4 h-4" />}
          label={locale === 'ar' ? 'مقدم الطلب' : 'Requester'}
          value={recordItem.requesterName ?? recordItem.requesterId}
        />
        <MetadataCard
          icon={<User className="w-4 h-4" />}
          label={locale === 'ar' ? 'المسؤول' : 'Assignee'}
          value={recordItem.assigneeName ?? (locale === 'ar' ? 'غير معين' : 'Unassigned')}
        />
        <MetadataCard
          icon={<Calendar className="w-4 h-4" />}
          label={locale === 'ar' ? 'تاريخ الإنشاء' : 'Created'}
          value={new Date(recordItem.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        />
        {recordItem.sla?.dueAt && (
          <MetadataCard
            icon={<Clock className="w-4 h-4" />}
            label={locale === 'ar' ? 'موعد التسليم' : 'Due Date'}
            value={new Date(recordItem.sla.dueAt).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
            extra={
              recordItem.sla.status === 'breached' ? (
                <span className="text-xs text-destructive font-medium">
                  {locale === 'ar' ? 'متجاوز' : 'Breached'}
                </span>
              ) : undefined
            }
          />
        )}
      </div>

      {/* Tags */}
      {recordItem.tags && recordItem.tags.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <Tag className="w-4 h-4 text-muted-foreground" />
          {recordItem.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-muted rounded-full text-xs text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Timeline from form submission */}
      {detail && detail.timeline.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {locale === 'ar' ? 'الجدول الزمني' : 'Timeline'}
          </h3>
          <div className="space-y-4">
            {detail.timeline.map((event) => (
              <div key={event.eventId} className="flex gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-brand flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">
                    {locale === 'ar' ? (event.description_ar || event.description) : event.description}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    {event.actorName && <span>{event.actorName}</span>}
                    <span>{new Date(event.timestamp).toLocaleString(locale === 'ar' ? 'ar-SA' : 'en-US')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      {detail && detail.comments.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-foreground mb-4">
            {locale === 'ar' ? 'التعليقات' : 'Comments'} ({detail.comments.length})
          </h3>
          <div className="space-y-4">
            {detail.comments.map((comment) => (
              <div key={comment.commentId} className="border-b border-border last:border-0 pb-3 last:pb-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">{comment.authorName ?? comment.author}</span>
                  <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</span>
                  {comment.isPrivate && (
                    <span className="text-xs bg-warning-soft text-warning px-1.5 py-0.5 rounded">
                      {locale === 'ar' ? 'خاص' : 'Internal'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">{comment.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetadataCard({
  icon,
  label,
  value,
  extra,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="font-medium text-foreground text-sm truncate">{value}</p>
      {extra}
    </div>
  );
}
