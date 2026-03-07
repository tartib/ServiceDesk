'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  ArrowLeft,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronRight,
  Zap,
} from 'lucide-react';
import api from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/layout/DashboardLayout';

// ============================================
// Types
// ============================================

interface ExecutionLog {
  _id: string;
  ruleId: string;
  ruleName: string;
  triggerTicketId?: string;
  triggerType: string;
  executionId: string;
  status: 'success' | 'failed' | 'partial' | 'timeout';
  startedAt: string;
  completedAt?: string;
  durationMs: number;
  conditionsResult: boolean;
  conditionsEvaluated?: Array<{
    groupIndex: number;
    conditionIndex: number;
    field: string;
    operator: string;
    expectedValue: unknown;
    actualValue: unknown;
    result: boolean;
  }>;
  actionsExecuted?: Array<{
    order: number;
    type: string;
    status: 'success' | 'failed' | 'skipped';
    error?: string;
    durationMs: number;
  }>;
  error?: { message: string; code?: string };
  retryCount: number;
}

// ============================================
// Constants
// ============================================

const BASE = '/api/v2/itsm/automation';

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle; labelEn: string; labelAr: string }> = {
  success: { color: 'text-green-600 bg-green-50', icon: CheckCircle, labelEn: 'Success', labelAr: 'ناجح' },
  failed: { color: 'text-red-600 bg-red-50', icon: XCircle, labelEn: 'Failed', labelAr: 'فاشل' },
  partial: { color: 'text-yellow-600 bg-yellow-50', icon: AlertTriangle, labelEn: 'Partial', labelAr: 'جزئي' },
  timeout: { color: 'text-orange-600 bg-orange-50', icon: Clock, labelEn: 'Timeout', labelAr: 'انتهاء الوقت' },
};

const TRIGGER_LABELS: Record<string, { en: string; ar: string }> = {
  ticket_created: { en: 'Ticket Created', ar: 'إنشاء تذكرة' },
  ticket_updated: { en: 'Ticket Updated', ar: 'تحديث تذكرة' },
  status_changed: { en: 'Status Changed', ar: 'تغيير الحالة' },
  priority_changed: { en: 'Priority Changed', ar: 'تغيير الأولوية' },
  assignment_changed: { en: 'Assignment Changed', ar: 'تغيير التعيين' },
  sla_breach_warning: { en: 'SLA Warning', ar: 'تحذير SLA' },
  sla_breached: { en: 'SLA Breached', ar: 'انتهاك SLA' },
  time_trigger: { en: 'Time Trigger', ar: 'مؤقت زمني' },
  scheduled: { en: 'Scheduled', ar: 'مجدول' },
};

// ============================================
// Component
// ============================================

export default function ExecutionLogsPage() {
  const router = useRouter();
  const { locale } = useLanguage();
  const isAr = locale === 'ar';

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const limit = 20;

  // Fetch all execution logs across rules
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['execution-logs', statusFilter, search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (search) params.append('search', search);
      params.append('page', String(page));
      params.append('limit', String(limit));
      const response = await api.get<{
        success: boolean;
        data: { logs: ExecutionLog[] };
        pagination: { page: number; limit: number; total: number; totalPages: number };
      }>(`${BASE}/execution-logs?${params.toString()}`);
      return response;
    },
  });

  const logs = data?.data?.logs || [];
  const pagination = data?.pagination || { page: 1, limit, total: 0, totalPages: 1 };

  const toggleExpand = useCallback((id: string) => {
    setExpandedLog((prev) => (prev === id ? null : id));
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString(isAr ? 'ar-SA' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/automation-rules')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isAr ? 'سجل التنفيذ' : 'Execution Logs'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isAr
                  ? 'عرض سجلات تنفيذ قواعد الأتمتة'
                  : 'View automation rule execution history'}
              </p>
            </div>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder={isAr ? 'بحث بالقاعدة أو التذكرة...' : 'Search by rule or ticket...'}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{isAr ? 'كل الحالات' : 'All Statuses'}</option>
              <option value="success">{isAr ? 'ناجح' : 'Success'}</option>
              <option value="failed">{isAr ? 'فاشل' : 'Failed'}</option>
              <option value="partial">{isAr ? 'جزئي' : 'Partial'}</option>
              <option value="timeout">{isAr ? 'انتهاء الوقت' : 'Timeout'}</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              {isAr ? 'جار التحميل...' : 'Loading...'}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">
                {isAr ? 'لا توجد سجلات تنفيذ' : 'No execution logs found'}
              </p>
              <p className="text-sm mt-1">
                {isAr
                  ? 'ستظهر السجلات هنا عند تنفيذ قواعد الأتمتة'
                  : 'Logs will appear here when automation rules execute'}
              </p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="grid grid-cols-[40px_1fr_150px_120px_100px_100px_80px] gap-3 px-4 py-3 bg-gray-50 border-b text-xs font-medium text-gray-500 uppercase">
                <div></div>
                <div>{isAr ? 'القاعدة' : 'Rule'}</div>
                <div>{isAr ? 'المحفز' : 'Trigger'}</div>
                <div>{isAr ? 'الحالة' : 'Status'}</div>
                <div>{isAr ? 'المدة' : 'Duration'}</div>
                <div>{isAr ? 'التاريخ' : 'Date'}</div>
                <div>{isAr ? 'الإجراءات' : 'Actions'}</div>
              </div>

              {/* Rows */}
              {logs.map((log) => {
                const statusCfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.failed;
                const StatusIcon = statusCfg.icon;
                const isExpanded = expandedLog === log._id;
                const triggerLabel = TRIGGER_LABELS[log.triggerType];
                const actionCount = log.actionsExecuted?.length || 0;
                const failedActions = log.actionsExecuted?.filter((a) => a.status === 'failed').length || 0;

                return (
                  <div key={log._id} className="border-b border-gray-100 last:border-b-0">
                    {/* Main row */}
                    <div
                      className="grid grid-cols-[40px_1fr_150px_120px_100px_100px_80px] gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer items-center text-sm"
                      onClick={() => toggleExpand(log._id)}
                    >
                      <div>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 truncate">{log.ruleName}</p>
                        {log.triggerTicketId && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {isAr ? 'تذكرة:' : 'Ticket:'} {log.triggerTicketId}
                          </p>
                        )}
                      </div>
                      <div>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                          <Zap className="w-3 h-3" />
                          {triggerLabel ? (isAr ? triggerLabel.ar : triggerLabel.en) : log.triggerType}
                        </span>
                      </div>
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusCfg.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {isAr ? statusCfg.labelAr : statusCfg.labelEn}
                        </span>
                      </div>
                      <div className="text-gray-600 text-xs font-mono">
                        {formatDuration(log.durationMs)}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {formatDate(log.startedAt)}
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-700">{actionCount}</span>
                        {failedActions > 0 && (
                          <span className="text-red-500 ml-1">({failedActions} ✗)</span>
                        )}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-6 pb-4 pt-1 bg-gray-50 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Execution info */}
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                              {isAr ? 'تفاصيل التنفيذ' : 'Execution Details'}
                            </h4>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-500">{isAr ? 'معرف التنفيذ' : 'Execution ID'}:</span>
                                <span className="font-mono text-xs text-gray-700">{log.executionId}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">{isAr ? 'الشروط مطابقة' : 'Conditions Matched'}:</span>
                                <span className={log.conditionsResult ? 'text-green-600' : 'text-red-600'}>
                                  {log.conditionsResult ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">{isAr ? 'إعادة المحاولة' : 'Retries'}:</span>
                                <span className="text-gray-700">{log.retryCount}</span>
                              </div>
                              {log.completedAt && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">{isAr ? 'انتهى في' : 'Completed At'}:</span>
                                  <span className="text-gray-700">{formatDate(log.completedAt)}</span>
                                </div>
                              )}
                              {log.error && (
                                <div className="mt-2 p-2 bg-red-50 rounded border border-red-100 text-xs text-red-700">
                                  <strong>{isAr ? 'خطأ' : 'Error'}:</strong> {log.error.message}
                                  {log.error.code && <span className="ml-1 text-red-500">({log.error.code})</span>}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Actions executed */}
                          <div>
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                              {isAr ? 'الإجراءات المنفذة' : 'Actions Executed'}
                            </h4>
                            {log.actionsExecuted && log.actionsExecuted.length > 0 ? (
                              <div className="space-y-1">
                                {log.actionsExecuted.map((action, i) => {
                                  const actStatusCfg =
                                    action.status === 'success'
                                      ? { color: 'text-green-600', icon: CheckCircle }
                                      : action.status === 'skipped'
                                      ? { color: 'text-gray-400', icon: Clock }
                                      : { color: 'text-red-600', icon: XCircle };
                                  const ActIcon = actStatusCfg.icon;
                                  return (
                                    <div
                                      key={i}
                                      className="flex items-center gap-2 text-sm p-1.5 bg-white rounded border border-gray-100"
                                    >
                                      <ActIcon className={`w-3.5 h-3.5 ${actStatusCfg.color}`} />
                                      <span className="text-gray-800 font-medium text-xs">
                                        #{action.order}
                                      </span>
                                      <span className="text-gray-600 text-xs flex-1">
                                        {action.type.replace(/_/g, ' ')}
                                      </span>
                                      <span className="text-gray-400 text-xs font-mono">
                                        {formatDuration(action.durationMs)}
                                      </span>
                                      {action.error && (
                                        <span className="text-red-500 text-xs truncate max-w-[150px]" title={action.error}>
                                          {action.error}
                                        </span>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400">
                                {isAr ? 'لم يتم تنفيذ إجراءات' : 'No actions executed'}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Conditions evaluated */}
                        {log.conditionsEvaluated && log.conditionsEvaluated.length > 0 && (
                          <div className="mt-4">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                              {isAr ? 'تقييم الشروط' : 'Conditions Evaluated'}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                              {log.conditionsEvaluated.map((cond, i) => (
                                <div
                                  key={i}
                                  className={`flex items-center gap-2 text-xs p-2 rounded border ${
                                    cond.result
                                      ? 'bg-green-50 border-green-100'
                                      : 'bg-red-50 border-red-100'
                                  }`}
                                >
                                  {cond.result ? (
                                    <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                                  ) : (
                                    <XCircle className="w-3 h-3 text-red-500 shrink-0" />
                                  )}
                                  <span className="text-gray-700 font-mono truncate">
                                    {cond.field} {cond.operator}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {isAr
                ? `عرض ${(page - 1) * limit + 1}-${Math.min(page * limit, pagination.total)} من ${pagination.total}`
                : `Showing ${(page - 1) * limit + 1}-${Math.min(page * limit, pagination.total)} of ${pagination.total}`}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isAr ? 'السابق' : 'Previous'}
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isAr ? 'التالي' : 'Next'}
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
