'use client';

import { useMemo } from 'react';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Target,
} from 'lucide-react';
import { useSLAs, useSLAStats, ISLA } from '@/hooks/useSLA';
import { useLocale } from '@/hooks/useLocale';

const priorityConfig: Record<string, { label: string; color: string; textColor: string; bgColor: string }> = {
  critical: { label: 'Critical', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-100' },
  high: { label: 'High', color: 'bg-orange-500', textColor: 'text-orange-700', bgColor: 'bg-orange-100' },
  medium: { label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  low: { label: 'Low', color: 'bg-gray-500', textColor: 'text-gray-700', bgColor: 'bg-gray-100' },
};

export default function SLAStandalonePage() {
  const { t } = useLocale();

  const { data: slaData, isLoading } = useSLAs();
  const { data: stats } = useSLAStats();
  const slaDefinitions: ISLA[] = useMemo(() => slaData?.data || [], [slaData]);

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
              <span className="text-sm text-gray-500">Total SLAs</span>
              <div className="p-2 rounded-lg bg-blue-100">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-gray-900">{stats?.total || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Defined policies</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">Active SLAs</span>
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-green-600">{stats?.active || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Currently enforced</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">Default SLAs</span>
              <div className="p-2 rounded-lg bg-purple-100">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-purple-600">{stats?.defaults || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Fallback policies</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-gray-500">Priorities Covered</span>
              <div className="p-2 rounded-lg bg-yellow-100">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
            <p className="text-4xl font-bold text-yellow-600">
              {stats?.byPriority ? Object.keys(stats.byPriority).filter(k => stats.byPriority[k] > 0).length : 0}
            </p>
            <p className="text-sm text-gray-500 mt-1">Priority levels</p>
          </div>
        </div>

        {/* SLA Definitions Table */}
        <div className="bg-white rounded-xl border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">SLA Policies</h3>
          </div>
          <div className="p-6">
            {slaDefinitions.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No SLA policies defined yet</p>
              </div>
            ) : (
              <div className="space-y-6">
                {slaDefinitions.map((sla) => {
                  const config = priorityConfig[sla.priority] || priorityConfig.medium;
                  const responseMinutes = (sla.response_time?.hours || 0) * 60;
                  const resolutionMinutes = (sla.resolution_time?.hours || 0) * 60;

                  return (
                    <div key={sla._id} className="flex items-center gap-6">
                      <div className="w-32">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor}`}>
                          {config.label}
                        </span>
                      </div>
                      <div className="w-40">
                        <p className="text-sm font-medium text-gray-900">{sla.name}</p>
                        <p className="text-xs text-gray-500">{sla.sla_id}</p>
                      </div>
                      <div className="w-48 text-sm">
                        <p className="text-gray-500">Response: <span className="font-medium text-gray-900">{formatTime(responseMinutes)}</span></p>
                        <p className="text-gray-500">Resolution: <span className="font-medium text-gray-900">{formatTime(resolutionMinutes)}</span></p>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          {sla.is_active ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                              <CheckCircle className="h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                              <XCircle className="h-3 w-3" /> Inactive
                            </span>
                          )}
                          {sla.is_default && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-32 text-center">
                        <p className="text-lg font-bold text-gray-900">{sla.escalation_matrix?.length || 0}</p>
                        <p className="text-xs text-gray-500">Escalation Levels</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Priority Coverage */}
        {stats?.byPriority && (
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">SLA Coverage by Priority</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(stats.byPriority).map(([priority, count]) => {
                  const config = priorityConfig[priority] || priorityConfig.medium;
                  return (
                    <div key={priority} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`w-3 h-3 rounded-full ${config.color}`} />
                        <p className="text-sm font-medium text-gray-900">{config.label}</p>
                      </div>
                      <p className="text-3xl font-bold text-gray-900">{count}</p>
                      <p className="text-xs text-gray-500 mt-1">SLA policies</p>
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
