'use client';

import { useMemo } from 'react';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Target,
  Calendar,
  TrendingUp,
  Shield,
} from 'lucide-react';
import { useSlaPolicies, useSlaStats, useSlaComplianceReport, ISlaPolicy } from '@/hooks/useSlaV2';
import { useLocale } from '@/hooks/useLocale';

export default function SLAStandalonePage() {
  const { t } = useLocale();

  const { data: policyData, isLoading } = useSlaPolicies();
  const { data: stats } = useSlaStats();
  const { data: compliance } = useSlaComplianceReport();

  const policies: ISlaPolicy[] = useMemo(() => policyData?.data || [], [policyData]);

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
    return `${(minutes / 1440).toFixed(1)}d`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">{t('nav.sla')}</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">Total Policies</span>
              <div className="p-2 rounded-lg bg-blue-100">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900">{stats?.policies?.total || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Defined policies</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">Active Policies</span>
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-green-600">{stats?.policies?.active || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Currently enforced</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">Calendars</span>
              <div className="p-2 rounded-lg bg-purple-100">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-purple-600">{stats?.calendars?.total || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Business calendars</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">Compliance</span>
              <div className="p-2 rounded-lg bg-emerald-100">
                <Shield className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-emerald-600">
              {compliance?.compliancePercent != null ? `${compliance.compliancePercent}%` : '—'}
            </p>
            <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
          </div>
        </div>

        {/* Compliance Summary */}
        {compliance && compliance.total > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-500">Avg Response</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatTime(compliance.avgResponseMinutes)}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-gray-500">Avg Resolution</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatTime(compliance.avgResolutionMinutes)}</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-gray-500">Breaches (30d)</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{compliance.breached}</p>
              <p className="text-xs text-gray-400">of {compliance.total} completed</p>
            </div>
          </div>
        )}

        {/* SLA Policies Table */}
        <div className="bg-white rounded-xl border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">SLA Policies</h3>
          </div>
          <div className="p-6">
            {policies.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No SLA policies defined yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {policies.map((policy) => (
                  <div key={policy.id} className="flex items-center gap-6 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-28">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        {policy.entityType}
                      </span>
                    </div>
                    <div className="w-48 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{policy.name}</p>
                      <p className="text-xs text-gray-500">{policy.code}</p>
                    </div>
                    <div className="w-32 text-sm">
                      <p className="text-gray-500">Priority: <span className="font-medium text-gray-900">{policy.priority}</span></p>
                    </div>
                    <div className="w-40 text-sm">
                      {policy.goals && policy.goals.length > 0 ? (
                        policy.goals.map((g) => (
                          <p key={g.id} className="text-gray-500 text-xs">
                            {g.metricKey}: <span className="font-medium text-gray-900">{formatTime(g.targetMinutes)}</span>
                          </p>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400">No goals</p>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {policy.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                            <CheckCircle className="h-3 w-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                            <XCircle className="h-3 w-3" /> Inactive
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-24 text-center">
                      <p className="text-sm font-semibold text-gray-700">
                        {policy.matchConditions?.length || 0}
                      </p>
                      <p className="text-[10px] text-gray-400">conditions</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Active Instances Summary */}
        {stats?.instances && Object.keys(stats.instances).length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Instance Status Overview</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(stats.instances).map(([status, count]) => {
                  const colors: Record<string, string> = {
                    active: 'bg-blue-500',
                    completed: 'bg-green-500',
                    cancelled: 'bg-gray-400',
                  };
                  return (
                    <div key={status} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`w-3 h-3 rounded-full ${colors[status] || 'bg-gray-300'}`} />
                        <p className="text-sm font-medium text-gray-900 capitalize">{status}</p>
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{count}</p>
                      <p className="text-xs text-gray-500 mt-1">instances</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
