'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Zap,
  Search,
  Plus,
  Filter,
  ChevronDown,
  RefreshCw,
  Play,
  Pause,
  Settings,
  Eye,
  Pencil,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  FileText,
  Power,
  PowerOff,
  Activity,
  TrendingUp,
} from 'lucide-react';
import api from '@/lib/axios';
import { useLocale } from '@/hooks/useLocale';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface ApiRes<T> {
  data: { success: boolean; data: T } | T;
}

interface AutomationRule {
  _id: string;
  ruleId: string;
  name: string;
  nameAr?: string;
  description?: string;
  status: string;
  trigger: {
    type: string;
    config: Record<string, unknown>;
  };
  conditions: {
    operator: string;
    groups: Array<unknown>;
  };
  actions: Array<{
    order: number;
    type: string;
    config: Record<string, unknown>;
  }>;
  stats: {
    executionCount: number;
    successCount: number;
    failureCount: number;
    lastExecutedAt?: string;
    lastExecutionStatus?: string;
    averageExecutionTimeMs: number;
  };
  isValid: boolean;
  validationErrors?: string[];
  version: number;
  createdBy?: { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

interface AutomationStats {
  totalRules: number;
  activeRules: number;
  byStatus: Array<{ _id: string; count: number }>;
  byTrigger: Array<{ _id: string; count: number }>;
  recentExecutions: Array<{
    ruleName: string;
    status: string;
    durationMs: number;
    startedAt: string;
    triggerType: string;
  }>;
  executionStats: Array<{
    _id: string;
    count: number;
    avgDuration: number;
  }>;
}

const statusConfig: Record<string, { label: string; labelAr: string; color: string; icon: typeof CheckCircle }> = {
  active: { label: 'Active', labelAr: 'نشط', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: Play },
  inactive: { label: 'Inactive', labelAr: 'غير نشط', color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400', icon: Pause },
  draft: { label: 'Draft', labelAr: 'مسودة', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', icon: FileText },
  deprecated: { label: 'Deprecated', labelAr: 'مهمل', color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
};

const triggerLabels: Record<string, { label: string; labelAr: string }> = {
  ticket_created: { label: 'Ticket Created', labelAr: 'إنشاء تذكرة' },
  ticket_updated: { label: 'Ticket Updated', labelAr: 'تحديث تذكرة' },
  status_changed: { label: 'Status Changed', labelAr: 'تغيير الحالة' },
  priority_changed: { label: 'Priority Changed', labelAr: 'تغيير الأولوية' },
  assignment_changed: { label: 'Assignment Changed', labelAr: 'تغيير التعيين' },
  sla_breach_warning: { label: 'SLA Breach Warning', labelAr: 'تحذير خرق SLA' },
  sla_breached: { label: 'SLA Breached', labelAr: 'خرق SLA' },
  time_trigger: { label: 'Time Trigger', labelAr: 'محفز زمني' },
  scheduled: { label: 'Scheduled', labelAr: 'مجدول' },
  webhook_received: { label: 'Webhook Received', labelAr: 'استقبال Webhook' },
  email_received: { label: 'Email Received', labelAr: 'استقبال بريد' },
  custom_event: { label: 'Custom Event', labelAr: 'حدث مخصص' },
  user_action: { label: 'User Action', labelAr: 'إجراء مستخدم' },
};

export default function AutomationRulesPage() {
  const { locale } = useLocale();
  const isAr = locale === 'ar';
  const router = useRouter();

  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [stats, setStats] = useState<AutomationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTrigger, setSelectedTrigger] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { page: String(page), limit: '20' };
      if (searchQuery) params.q = searchQuery;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedTrigger !== 'all') params.triggerType = selectedTrigger;

      const res = await api.get('/itsm/automation/rules', { params }) as ApiRes<{ rules: AutomationRule[]; pagination: { pages: number } }>;
      const raw = res.data as Record<string, unknown>;
      const data = (raw?.data || raw) as { rules?: AutomationRule[]; pagination?: { pages: number } };
      setRules(data?.rules || []);
      setTotalPages(data?.pagination?.pages || 1);
    } catch (err) {
      console.error('Failed to fetch rules:', err);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, selectedStatus, selectedTrigger]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/itsm/automation/stats') as ApiRes<AutomationStats>;
      const raw = res.data as Record<string, unknown>;
      setStats((raw?.data || raw) as AutomationStats || null);
    } catch (err) {
      console.error('Failed to fetch automation stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleActivate = async (ruleId: string) => {
    try {
      setActionLoading(ruleId);
      await api.post(`/itsm/automation/rules/${ruleId}/activate`);
      await fetchRules();
      await fetchStats();
    } catch (err) {
      console.error('Failed to activate rule:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeactivate = async (ruleId: string) => {
    try {
      setActionLoading(ruleId);
      await api.post(`/itsm/automation/rules/${ruleId}/deactivate`);
      await fetchRules();
      await fetchStats();
    } catch (err) {
      console.error('Failed to deactivate rule:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isAr ? 'محرك الأتمتة' : 'Automation Rules Engine'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isAr ? 'إنشاء وإدارة قواعد الأتمتة لعمليات ITSM' : 'Create and manage automation rules for ITSM processes'}
            </p>
          </div>
          <button
            onClick={() => router.push('/automation-rules/new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {isAr ? 'قاعدة جديدة' : 'New Rule'}
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Zap className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isAr ? 'إجمالي القواعد' : 'Total Rules'}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalRules}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Play className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isAr ? 'نشطة' : 'Active'}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.activeRules}</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isAr ? 'عمليات ناجحة' : 'Successful'}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {stats.executionStats?.find((s) => s._id === 'success')?.count || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isAr ? 'فاشلة' : 'Failed'}
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {stats.executionStats?.find((s) => s._id === 'failed')?.count || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={isAr ? 'بحث عن قواعد الأتمتة...' : 'Search automation rules...'}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-colors ${
                showFilters
                  ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400'
                  : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Filter className="w-4 h-4" />
              {isAr ? 'فلاتر' : 'Filters'}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button
              onClick={() => { fetchRules(); fetchStats(); }}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {isAr ? 'تحديث' : 'Refresh'}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {isAr ? 'الحالة' : 'Status'}
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => { setSelectedStatus(e.target.value); setPage(1); }}
                  className="w-full py-2 px-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                >
                  <option value="all">{isAr ? 'الكل' : 'All Statuses'}</option>
                  {Object.entries(statusConfig).map(([key, cfg]) => (
                    <option key={key} value={key}>{isAr ? cfg.labelAr : cfg.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {isAr ? 'نوع المحفز' : 'Trigger Type'}
                </label>
                <select
                  value={selectedTrigger}
                  onChange={(e) => { setSelectedTrigger(e.target.value); setPage(1); }}
                  className="w-full py-2 px-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm"
                >
                  <option value="all">{isAr ? 'الكل' : 'All Triggers'}</option>
                  {Object.entries(triggerLabels).map(([key, cfg]) => (
                    <option key={key} value={key}>{isAr ? cfg.labelAr : cfg.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Rules List */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
              <span className="ml-2 text-gray-500">{isAr ? 'جاري التحميل...' : 'Loading...'}</span>
            </div>
          ) : rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
              <Zap className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium">{isAr ? 'لا توجد قواعد أتمتة' : 'No automation rules found'}</p>
              <p className="text-sm mt-1">{isAr ? 'أنشئ قاعدة للبدء' : 'Create a rule to get started'}</p>
            </div>
          ) : (
            rules.map((rule) => {
              const stConf = statusConfig[rule.status] || statusConfig.draft;
              const StatusIcon = stConf.icon;
              const triggerConf = triggerLabels[rule.trigger?.type] || { label: rule.trigger?.type, labelAr: rule.trigger?.type };
              const successRate = rule.stats.executionCount > 0
                ? Math.round((rule.stats.successCount / rule.stats.executionCount) * 100)
                : 0;

              return (
                <div
                  key={rule._id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Left: Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-gray-400">{rule.ruleId}</span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${stConf.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {isAr ? stConf.labelAr : stConf.label}
                        </span>
                        {!rule.isValid && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                            <AlertTriangle className="w-3 h-3" />
                            {isAr ? 'غير صالح' : 'Invalid'}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">v{rule.version}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {isAr && rule.nameAr ? rule.nameAr : rule.name}
                      </h3>
                      {rule.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{rule.description}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {isAr ? triggerConf.labelAr : triggerConf.label}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Settings className="w-3 h-3" />
                          {rule.actions?.length || 0} {isAr ? 'إجراءات' : 'actions'}
                        </span>
                        {rule.stats.executionCount > 0 && (
                          <>
                            <span className="inline-flex items-center gap-1">
                              <Activity className="w-3 h-3" />
                              {rule.stats.executionCount} {isAr ? 'تنفيذ' : 'executions'}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <BarChart3 className="w-3 h-3" />
                              {successRate}% {isAr ? 'نجاح' : 'success'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {rule.status === 'active' ? (
                        <button
                          onClick={() => handleDeactivate(rule._id)}
                          disabled={actionLoading === rule._id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:text-orange-400 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <PowerOff className="w-3.5 h-3.5" />
                          {isAr ? 'إيقاف' : 'Deactivate'}
                        </button>
                      ) : rule.status === 'draft' || rule.status === 'inactive' ? (
                        <button
                          onClick={() => handleActivate(rule._id)}
                          disabled={actionLoading === rule._id || !rule.isValid}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 rounded-lg transition-colors disabled:opacity-50"
                          title={!rule.isValid ? (isAr ? 'القاعدة غير صالحة' : 'Rule is invalid') : ''}
                        >
                          <Power className="w-3.5 h-3.5" />
                          {isAr ? 'تفعيل' : 'Activate'}
                        </button>
                      ) : null}
                      <button
                        onClick={() => router.push(`/automation-rules/${rule._id}`)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title={isAr ? 'عرض' : 'View'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => router.push(`/automation-rules/${rule._id}/edit`)}
                        className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                        title={isAr ? 'تعديل' : 'Edit'}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {isAr ? 'السابق' : 'Previous'}
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {isAr ? `صفحة ${page} من ${totalPages}` : `Page ${page} of ${totalPages}`}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {isAr ? 'التالي' : 'Next'}
            </button>
          </div>
        )}

        {/* Recent Executions */}
        {stats && stats.recentExecutions && stats.recentExecutions.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {isAr ? 'آخر عمليات التنفيذ' : 'Recent Executions'}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50">
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                      {isAr ? 'القاعدة' : 'Rule'}
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                      {isAr ? 'المحفز' : 'Trigger'}
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                      {isAr ? 'الحالة' : 'Status'}
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                      {isAr ? 'المدة' : 'Duration'}
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                      {isAr ? 'الوقت' : 'Time'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {stats.recentExecutions.map((exec, idx) => {
                    const execTrigger = triggerLabels[exec.triggerType] || { label: exec.triggerType, labelAr: exec.triggerType };
                    return (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                        <td className="px-4 py-2 text-gray-900 dark:text-white font-medium">{exec.ruleName}</td>
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-400">{isAr ? execTrigger.labelAr : execTrigger.label}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            exec.status === 'success'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : exec.status === 'failed'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {exec.status === 'success' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                            {exec.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-400 text-xs">
                          {exec.durationMs}ms
                        </td>
                        <td className="px-4 py-2 text-gray-500 dark:text-gray-400 text-xs">
                          {new Date(exec.startedAt).toLocaleString(isAr ? 'ar-SA' : 'en-US')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
