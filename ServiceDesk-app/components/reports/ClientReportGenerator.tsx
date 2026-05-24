'use client';

import React, { useState } from 'react';
import { FileText, Download, Loader2, Calendar } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWorkspaceContext } from '@/hooks/useWorkspaceContext';
import { getWorkspaceTemplate } from '@/components/workspace/workspaceTemplates';

export default function ClientReportGenerator() {
  const { t, locale } = useLanguage();
  const isAr = locale === 'ar';
  const { workspaceType } = useWorkspaceContext();
  const wsTemplate = workspaceType ? getWorkspaceTemplate(workspaceType) : null;

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setReportData(null);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);

      const res = await fetch(`/api/v2/forms/analytics/summary?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        setReportData(json.data);
      }
    } catch {
      // silent
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!reportData) return;

    const wsName = wsTemplate ? (isAr ? wsTemplate.nameAr : wsTemplate.name) : 'All';
    const lines = [
      isAr ? '# تقرير العميل' : '# Client Report',
      '',
      `${isAr ? 'مساحة العمل' : 'Workspace'}: ${wsName}`,
      `${isAr ? 'الفترة' : 'Period'}: ${dateFrom || 'N/A'} - ${dateTo || 'N/A'}`,
      '',
      `| ${isAr ? 'المقياس' : 'Metric'} | ${isAr ? 'القيمة' : 'Value'} |`,
      '|---|---|',
      `| ${isAr ? 'إجمالي السجلات' : 'Total Records'} | ${reportData.totalRecords} |`,
      `| ${isAr ? 'مفتوحة' : 'Open'} | ${reportData.totalOpen} |`,
      `| ${isAr ? 'مكتملة' : 'Completed'} | ${reportData.totalCompleted} |`,
      `| ${isAr ? 'التزام SLA' : 'SLA Compliance'} | ${reportData.slaCompliance}% |`,
      `| ${isAr ? 'متوسط الحل' : 'Avg Resolution'} | ${reportData.avgResolutionHours}h |`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report-${dateFrom || 'all'}-${dateTo || 'all'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 text-brand" />
        <h2 className="text-lg font-semibold">{t('workspace.executive.generateReport')}</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {isAr ? 'من' : 'From'}
          </label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-border"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {isAr ? 'إلى' : 'To'}
          </label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-border"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:bg-brand-strong transition-colors disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          {t('workspace.executive.generate')}
        </button>

        {reportData && (
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
          >
            <Download className="h-4 w-4" />
            {t('workspace.executive.download')}
          </button>
        )}
      </div>

      {reportData && (
        <div className="rounded-xl border bg-background p-5 space-y-3">
          <h3 className="font-semibold text-sm">{isAr ? 'معاينة التقرير' : 'Report Preview'}</h3>
          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            <div className="rounded-lg bg-muted p-3 text-center">
              <div className="text-2xl font-bold">{reportData.totalRecords}</div>
              <div className="text-muted-foreground">{isAr ? 'إجمالي' : 'Total'}</div>
            </div>
            <div className="rounded-lg bg-muted p-3 text-center">
              <div className="text-2xl font-bold">{reportData.slaCompliance}%</div>
              <div className="text-muted-foreground">SLA</div>
            </div>
            <div className="rounded-lg bg-muted p-3 text-center">
              <div className="text-2xl font-bold">{reportData.avgResolutionHours}h</div>
              <div className="text-muted-foreground">{isAr ? 'متوسط الحل' : 'Avg Res.'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
