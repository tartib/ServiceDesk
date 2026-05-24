'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useDashboardSummary, useRecordsByType } from '@/hooks/useExecutiveDashboard';
import ClientReportGenerator from '@/components/reports/ClientReportGenerator';
import { BarChart3, CheckCircle, Clock, AlertTriangle, Loader2 } from 'lucide-react';

const STATUS_LABELS: Record<string, { en: string; ar: string; color: string }> = {
  submitted: { en: 'Submitted', ar: 'مقدم', color: 'bg-brand-surface text-brand' },
  under_review: { en: 'Under Review', ar: 'قيد المراجعة', color: 'bg-info-soft text-info' },
  in_progress: { en: 'In Progress', ar: 'قيد التنفيذ', color: 'bg-brand-surface text-brand' },
  waiting_client: { en: 'Waiting Client', ar: 'بانتظار العميل', color: 'bg-warning-soft text-warning' },
  approved: { en: 'Approved', ar: 'موافق عليه', color: 'bg-success-soft text-success' },
  rejected: { en: 'Rejected', ar: 'مرفوض', color: 'bg-destructive-soft text-destructive' },
  completed: { en: 'Completed', ar: 'مكتمل', color: 'bg-success-soft text-success' },
  cancelled: { en: 'Cancelled', ar: 'ملغى', color: 'bg-muted text-muted-foreground' },
  draft: { en: 'Draft', ar: 'مسودة', color: 'bg-muted text-muted-foreground' },
};

const WORKSPACE_LABELS: Record<string, { en: string; ar: string }> = {
  product_studio: { en: 'Product Studio', ar: 'استوديو المنتجات' },
  marketing_agency: { en: 'Marketing Agency', ar: 'وكالة تسويق' },
  professional_service_office: { en: 'Professional Service', ar: 'خدمات مهنية' },
};

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl border bg-background p-5 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

export default function ExecutiveDashboardPage() {
  const { t, locale } = useLanguage();
  const isAr = locale === 'ar';
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: byType } = useRecordsByType();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <h1 className="text-2xl font-bold">{t('workspace.executive.title')}</h1>

        {summaryLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : summary ? (
          <>
            {/* KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard icon={BarChart3} label={t('workspace.executive.openRecords')} value={summary.totalOpen} color="bg-brand-surface text-brand" />
              <StatCard icon={CheckCircle} label={t('workspace.executive.slaCompliance')} value={`${summary.slaCompliance}%`} color="bg-success-soft text-success" />
              <StatCard icon={Clock} label={t('workspace.executive.avgResolution')} value={`${summary.avgResolutionHours} ${t('workspace.executive.hours')}`} color="bg-info-soft text-info" />
              <StatCard icon={AlertTriangle} label={isAr ? 'مخالفات SLA' : 'SLA Breached'} value={summary.slaBreached} color="bg-destructive-soft text-destructive" />
            </div>

            {/* Records by Status */}
            <div className="rounded-xl border bg-background p-5 space-y-4">
              <h2 className="text-base font-semibold">{t('workspace.executive.byStatus')}</h2>
              {summary.byStatus.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('workspace.executive.noData')}</p>
              ) : (
                <div className="space-y-2">
                  {summary.byStatus.map((item) => {
                    const meta = STATUS_LABELS[item.status] ?? { en: item.status, ar: item.status, color: 'bg-muted text-muted-foreground' };
                    const pct = summary.totalRecords > 0 ? Math.round((item.count / summary.totalRecords) * 100) : 0;
                    return (
                      <div key={item.status} className="flex items-center gap-3">
                        <span className="w-28 text-sm truncate">{isAr ? meta.ar : meta.en}</span>
                        <div className="flex-1 h-6 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${meta.color} transition-all`} style={{ width: `${Math.max(pct, 2)}%` }} />
                        </div>
                        <span className="w-10 text-right text-sm font-medium">{item.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Records by Workspace */}
            {summary.byWorkspace.length > 0 && (
              <div className="rounded-xl border bg-background p-5 space-y-4">
                <h2 className="text-base font-semibold">{t('workspace.executive.byWorkspace')}</h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  {summary.byWorkspace.map((item) => {
                    const wsLabel = WORKSPACE_LABELS[item.workspaceType] ?? { en: item.workspaceType, ar: item.workspaceType };
                    return (
                      <div key={item.workspaceType} className="flex items-center justify-between rounded-lg border p-3">
                        <span className="text-sm">{isAr ? wsLabel.ar : wsLabel.en}</span>
                        <span className="text-lg font-bold">{item.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Top Request Types */}
            {byType && byType.length > 0 && (
              <div className="rounded-xl border bg-background p-5 space-y-4">
                <h2 className="text-base font-semibold">{t('workspace.executive.byType')}</h2>
                <div className="space-y-2">
                  {byType.slice(0, 10).map((item) => (
                    <div key={item.requestTypeId} className="flex items-center justify-between py-1.5 border-b last:border-0">
                      <span className="text-sm">{isAr ? (item.nameAr || item.name) : item.name}</span>
                      <span className="text-sm font-semibold">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground text-center py-12">{t('workspace.executive.noData')}</p>
        )}

        {/* Client Report Generator */}
        <div className="rounded-xl border bg-background p-5">
          <ClientReportGenerator />
        </div>
      </div>
    </DashboardLayout>
  );
}
