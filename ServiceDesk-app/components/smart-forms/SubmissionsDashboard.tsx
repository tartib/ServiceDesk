'use client';

/**
 * Submissions Dashboard - لوحة التقديمات
 * Smart Forms System
 * 
 * عرض وإدارة تقديمات النماذج
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
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  Calendar,
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react';

interface SubmissionsDashboardProps {
  submissions: FormSubmission[];
  templates?: FormTemplate[];
  isLoading?: boolean;
  onView: (submission: FormSubmission) => void;
  onApprove?: (submission: FormSubmission) => void;
  onReject?: (submission: FormSubmission) => void;
  onRefresh?: () => void;
  locale?: 'en' | 'ar';
}

const statusConfig: Record<SubmissionStatus, { label: string; label_ar: string; color: string; icon: React.ReactNode }> = {
  [SubmissionStatus.DRAFT]: {
    label: 'Draft',
    label_ar: 'مسودة',
    color: 'bg-gray-100 text-gray-800',
    icon: <FileText className="h-3 w-3" />,
  },
  [SubmissionStatus.SUBMITTED]: {
    label: 'Submitted',
    label_ar: 'مقدم',
    color: 'bg-blue-100 text-blue-800',
    icon: <Clock className="h-3 w-3" />,
  },
  [SubmissionStatus.PENDING_APPROVAL]: {
    label: 'Pending Approval',
    label_ar: 'بانتظار الموافقة',
    color: 'bg-yellow-100 text-yellow-800',
    icon: <Clock className="h-3 w-3" />,
  },
  [SubmissionStatus.APPROVED]: {
    label: 'Approved',
    label_ar: 'موافق عليه',
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircle className="h-3 w-3" />,
  },
  [SubmissionStatus.REJECTED]: {
    label: 'Rejected',
    label_ar: 'مرفوض',
    color: 'bg-red-100 text-red-800',
    icon: <XCircle className="h-3 w-3" />,
  },
  [SubmissionStatus.IN_PROGRESS]: {
    label: 'In Progress',
    label_ar: 'قيد التنفيذ',
    color: 'bg-purple-100 text-purple-800',
    icon: <Clock className="h-3 w-3" />,
  },
  [SubmissionStatus.COMPLETED]: {
    label: 'Completed',
    label_ar: 'مكتمل',
    color: 'bg-green-100 text-green-800',
    icon: <CheckCircle className="h-3 w-3" />,
  },
  [SubmissionStatus.CANCELLED]: {
    label: 'Cancelled',
    label_ar: 'ملغي',
    color: 'bg-gray-100 text-gray-800',
    icon: <XCircle className="h-3 w-3" />,
  },
  [SubmissionStatus.ON_HOLD]: {
    label: 'On Hold',
    label_ar: 'معلق',
    color: 'bg-orange-100 text-orange-800',
    icon: <Clock className="h-3 w-3" />,
  },
};

export default function SubmissionsDashboard({
  submissions,
  templates = [],
  isLoading = false,
  onView,
  onApprove,
  onReject,
  onRefresh,
  locale = 'en',
}: SubmissionsDashboardProps) {
  const getTemplateName = (templateId: string) => {
    const tmpl = templates.find(t => t._id === templateId || t.form_id === templateId);
    if (!tmpl) return templateId;
    return locale === 'ar' ? (tmpl.name_ar || tmpl.name) : tmpl.name;
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'all'>('all');

  // تصفية التقديمات
  const filteredSubmissions = submissions.filter(submission => {
    // تصفية بالبحث
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesId = submission.submission_id.toLowerCase().includes(query);
      const matchesName = submission.submitted_by.name.toLowerCase().includes(query);
      if (!matchesId && !matchesName) return false;
    }

    // تصفية بالحالة
    if (statusFilter !== 'all' && submission.workflow_state.status !== statusFilter) {
      return false;
    }

    return true;
  });

  // إحصائيات
  const stats = {
    total: submissions.length,
    pending: submissions.filter(s => s.workflow_state.status === SubmissionStatus.PENDING_APPROVAL || s.workflow_state.status === SubmissionStatus.SUBMITTED).length,
    approved: submissions.filter(s => s.workflow_state.status === SubmissionStatus.APPROVED).length,
    rejected: submissions.filter(s => s.workflow_state.status === SubmissionStatus.REJECTED).length,
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
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {locale === 'ar' ? 'إجمالي التقديمات' : 'Total Submissions'}
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
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
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
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
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
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {locale === 'ar' ? 'التقديمات' : 'Submissions'}
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
                placeholder={locale === 'ar' ? 'بحث...' : 'Search...'}
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

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">{locale === 'ar' ? 'رقم التقديم' : 'Submission ID'}</th>
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
                ) : filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      {locale === 'ar' ? 'لا توجد تقديمات' : 'No submissions found'}
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((submission) => (
                    <tr key={submission.submission_id} className="hover:bg-muted/50">
                      <td className="px-4 py-3 font-mono text-sm">{submission.submission_id}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium">{getTemplateName(submission.form_template_id)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{submission.submitted_by.name}</p>
                            <p className="text-xs text-muted-foreground">{submission.submitted_by.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(submission.workflow_state.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(submission.created_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => onView(submission)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {submission.workflow_state.status === SubmissionStatus.PENDING_APPROVAL && (
                            <>
                              {onApprove && (
                                <Button variant="ghost" size="sm" className="text-green-600" onClick={() => onApprove(submission)}>
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              {onReject && (
                                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => onReject(submission)}>
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
