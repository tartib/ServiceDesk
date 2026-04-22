'use client';

/**
 * RecordsDashboard — Platform Records List
 *
 * Canonical replacement for components/smart-forms/SubmissionsDashboard.
 * Terminology: "Records" (platform) instead of "Submissions" (legacy).
 *
 * Backward-compatible: accepts both `records` (canonical) and
 * `submissions` (deprecated alias) props so existing callers don't break.
 *
 * Architecture (ADR 001):
 *   ALLOWED:   import RecordsDashboard from '@/components/forms-platform/RecordsDashboard'
 *   FORBIDDEN: import SubmissionsDashboard from '@/components/smart-forms/SubmissionsDashboard'
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FormSubmission, FormTemplate, SubmissionStatus } from '@/types/smart-forms';
import {
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  Calendar,
  RefreshCw,
} from 'lucide-react';

export type RecordItem = FormSubmission;

interface RecordsDashboardProps {
  /** Canonical prop — platform records (preferred). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  records?: RecordItem[] | any[];
  /**
   * @deprecated Use `records` instead.
   * Legacy alias kept for backward compatibility. Will be removed in a future cleanup.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  submissions?: RecordItem[] | any[];
  templates?: FormTemplate[];
  isLoading?: boolean;
  onView: (record: RecordItem) => void;
  onApprove?: (record: RecordItem) => void;
  onReject?: (record: RecordItem) => void;
  onRefresh?: () => void;
  locale?: 'en' | 'ar';
}

const statusConfig: Record<SubmissionStatus, { label: string; label_ar: string; color: string; icon: React.ReactNode }> = {
  [SubmissionStatus.DRAFT]: {
    label: 'Draft',
    label_ar: 'مسودة',
    color: 'bg-muted text-foreground',
    icon: <FileText className="h-3 w-3" />,
  },
  [SubmissionStatus.SUBMITTED]: {
    label: 'Submitted',
    label_ar: 'مقدم',
    color: 'bg-brand-soft text-brand',
    icon: <Clock className="h-3 w-3" />,
  },
  [SubmissionStatus.PENDING_APPROVAL]: {
    label: 'Pending Approval',
    label_ar: 'بانتظار الموافقة',
    color: 'bg-warning-soft text-warning',
    icon: <Clock className="h-3 w-3" />,
  },
  [SubmissionStatus.APPROVED]: {
    label: 'Approved',
    label_ar: 'موافق عليه',
    color: 'bg-success-soft text-success',
    icon: <CheckCircle className="h-3 w-3" />,
  },
  [SubmissionStatus.REJECTED]: {
    label: 'Rejected',
    label_ar: 'مرفوض',
    color: 'bg-destructive-soft text-destructive',
    icon: <XCircle className="h-3 w-3" />,
  },
  [SubmissionStatus.IN_PROGRESS]: {
    label: 'In Progress',
    label_ar: 'قيد التنفيذ',
    color: 'bg-info-soft text-info',
    icon: <Clock className="h-3 w-3" />,
  },
  [SubmissionStatus.COMPLETED]: {
    label: 'Completed',
    label_ar: 'مكتمل',
    color: 'bg-success-soft text-success',
    icon: <CheckCircle className="h-3 w-3" />,
  },
  [SubmissionStatus.CANCELLED]: {
    label: 'Cancelled',
    label_ar: 'ملغي',
    color: 'bg-muted text-foreground',
    icon: <XCircle className="h-3 w-3" />,
  },
  [SubmissionStatus.ON_HOLD]: {
    label: 'On Hold',
    label_ar: 'معلق',
    color: 'bg-warning-soft text-warning',
    icon: <Clock className="h-3 w-3" />,
  },
};

export default function RecordsDashboard({
  records,
  submissions,
  templates = [],
  isLoading = false,
  onView,
  onApprove,
  onReject,
  onRefresh,
  locale = 'en',
}: RecordsDashboardProps) {
  const items: RecordItem[] = records ?? submissions ?? [];

  const getTemplateName = (templateId: string) => {
    const tmpl = templates.find(t => t._id === templateId || t.form_id === templateId);
    if (!tmpl) return templateId;
    return locale === 'ar' ? (tmpl.name_ar || tmpl.name) : tmpl.name;
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all');

  const filteredItems = items.filter(item => {
    if (!item) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesId = (item.submission_id || '').toLowerCase().includes(query);
      const matchesName = (item.submitted_by?.name || '').toLowerCase().includes(query);
      if (!matchesId && !matchesName) return false;
    }
    if (statusFilter !== 'all' && item.workflow_state?.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const stats = {
    total: items.length,
    pending: items.filter(s =>
      s?.workflow_state?.status === SubmissionStatus.PENDING_APPROVAL ||
      s?.workflow_state?.status === SubmissionStatus.SUBMITTED
    ).length,
    approved: items.filter(s => s?.workflow_state?.status === SubmissionStatus.APPROVED).length,
    rejected: items.filter(s => s?.workflow_state?.status === SubmissionStatus.REJECTED).length,
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: SubmissionStatus) => {
    const config = statusConfig[status];
    return (
      <Badge variant="secondary" className={cn('gap-1', config.color)}>
        {config.icon}
        {locale === 'ar' ? config.label_ar : config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {locale === 'ar' ? 'إجمالي السجلات' : 'Total Records'}
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {locale === 'ar' ? 'بانتظار الموافقة' : 'Pending Approval'}
                </p>
                <p className="text-2xl font-bold text-warning">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {locale === 'ar' ? 'موافق عليها' : 'Approved'}
                </p>
                <p className="text-2xl font-bold text-success">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {locale === 'ar' ? 'مرفوضة' : 'Rejected'}
                </p>
                <p className="text-2xl font-bold text-destructive">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {locale === 'ar' ? 'السجلات' : 'Records'}
            </CardTitle>
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading}>
                <RefreshCw className={cn('h-4 w-4 mr-1', isLoading && 'animate-spin')} />
                {locale === 'ar' ? 'تحديث' : 'Refresh'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={locale === 'ar' ? 'بحث...' : 'Search records...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SubmissionStatus | 'all')}
              className="h-10 px-3 border rounded-md"
            >
              <option value="all">{locale === 'ar' ? 'جميع الحالات' : 'All Status'}</option>
              {Object.entries(statusConfig).map(([status, config]) => (
                <option key={status} value={status}>
                  {locale === 'ar' ? config.label_ar : config.label}
                </option>
              ))}
            </select>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">{locale === 'ar' ? 'رقم السجل' : 'Record ID'}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">{locale === 'ar' ? 'النموذج' : 'Form'}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">{locale === 'ar' ? 'مقدم الطلب' : 'Submitted By'}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">{locale === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">{locale === 'ar' ? 'التاريخ' : 'Date'}</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">{locale === 'ar' ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      {locale === 'ar' ? 'لا توجد سجلات' : 'No records found'}
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.submission_id || item._id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono text-sm">{item.submission_id || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium">{getTemplateName(item.form_template_id)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{item.submitted_by?.name || '—'}</p>
                            <p className="text-xs text-muted-foreground">{item.submitted_by?.email || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(item.workflow_state?.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(item.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => onView(item)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {item.workflow_state?.status === SubmissionStatus.PENDING_APPROVAL && (
                            <>
                              {onApprove && (
                                <Button variant="ghost" size="sm" className="text-success" onClick={() => onApprove(item)}>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              {onReject && (
                                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onReject(item)}>
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
