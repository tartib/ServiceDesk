'use client';

import { useState, useMemo } from 'react';
import {
  Rocket,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  Package,
  GitBranch,
  MoreHorizontal,
} from 'lucide-react';
import { useReleases, useReleaseStats, IRelease } from '@/hooks/useReleases';
import { useLocale } from '@/hooks/useLocale';

const typeConfig: Record<string, { label: string; color: string }> = {
  major: { label: 'Major', color: 'bg-purple-100 text-purple-700' },
  minor: { label: 'Minor', color: 'bg-blue-100 text-blue-700' },
  patch: { label: 'Patch', color: 'bg-gray-100 text-gray-700' },
  hotfix: { label: 'Hotfix', color: 'bg-red-100 text-red-700' },
  emergency: { label: 'Emergency', color: 'bg-red-100 text-red-700' },
};

const statusConfig: Record<string, { label: string; color: string; icon: typeof Calendar }> = {
  planning: { label: 'Planning', color: 'bg-gray-100 text-gray-600', icon: Calendar },
  building: { label: 'Building', color: 'bg-blue-100 text-blue-700', icon: GitBranch },
  testing: { label: 'Testing', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  deployed: { label: 'Deployed', color: 'bg-teal-100 text-teal-700', icon: Rocket },
  rolled_back: { label: 'Rolled Back', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500', icon: Calendar },
};

const envConfig: Record<string, { label: string; color: string }> = {
  development: { label: 'DEV', color: 'bg-gray-500' },
  staging: { label: 'STG', color: 'bg-yellow-500' },
  production: { label: 'PROD', color: 'bg-green-500' },
};

export default function ReleasesStandalonePage() {
  const { t } = useLocale();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedRelease, setSelectedRelease] = useState<IRelease | null>(null);

  const { data: releasesData, isLoading } = useReleases(
    filterStatus !== 'all' ? { status: filterStatus } : undefined
  );
  const { data: stats } = useReleaseStats();
  const releases: IRelease[] = useMemo(() => releasesData?.data || [], [releasesData]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
            <Rocket className="h-6 w-6 text-teal-600" />
            <h1 className="text-xl font-bold text-gray-900">{t('nav.releases')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="planning">Planning</option>
              <option value="building">Building</option>
              <option value="testing">Testing</option>
              <option value="approved">Approved</option>
              <option value="deployed">Deployed</option>
              <option value="rolled_back">Rolled Back</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{stats?.total || 0} Total</span>
          </div>
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-teal-500" />
            <span className="text-sm text-gray-600">{stats?.deployed || 0} Deployed</span>
          </div>
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-gray-600">{(stats?.building || 0) + (stats?.testing || 0)} In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{stats?.planning || 0} Planning</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        <div className={`${selectedRelease ? 'w-1/2 border-r border-gray-200' : 'w-full'} overflow-y-auto p-4`}>
          {releases.length === 0 ? (
            <div className="text-center py-12">
              <Rocket className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No releases found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {releases.map((release) => {
                const stCfg = statusConfig[release.status] || statusConfig.planning;
                const StatusIcon = stCfg.icon;
                const tCfg = typeConfig[release.type] || typeConfig.minor;
                const env = release.deployment?.environment || 'development';
                const eCfg = envConfig[env] || envConfig.development;

                return (
                  <div
                    key={release._id}
                    onClick={() => setSelectedRelease(release)}
                    className={`bg-white border rounded-xl p-4 cursor-pointer transition-all ${
                      selectedRelease?._id === release._id
                        ? 'border-blue-500 ring-2 ring-blue-100'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${
                        release.status === 'deployed' ? 'bg-teal-100' :
                        release.status === 'rolled_back' ? 'bg-red-100' : 'bg-blue-100'
                      }`}>
                        <Rocket className={`h-5 w-5 ${
                          release.status === 'deployed' ? 'text-teal-600' :
                          release.status === 'rolled_back' ? 'text-red-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-mono font-bold text-gray-900">{release.version}</span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${tCfg.color}`}>
                            {tCfg.label}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${stCfg.color}`}>
                            <StatusIcon className="h-3 w-3 inline mr-1" />
                            {stCfg.label}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">{release.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {release.deployment?.planned_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(release.deployment.planned_date)}
                            </span>
                          )}
                          <span className={`px-1.5 py-0.5 text-xs font-medium rounded ${eCfg.color} text-white`}>
                            {eCfg.label}
                          </span>
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-gray-900">{release.linked_changes?.length || 0}</p>
                        <p className="text-xs text-gray-500">changes</p>
                      </div>
                      <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selectedRelease && (
          <div className="w-1/2 overflow-y-auto bg-white p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl font-mono font-bold text-gray-900">{selectedRelease.version}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${(typeConfig[selectedRelease.type] || typeConfig.minor).color}`}>
                    {(typeConfig[selectedRelease.type] || typeConfig.minor).label}
                  </span>
                </div>
                <h2 className="text-lg font-semibold text-gray-900">{selectedRelease.name}</h2>
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${(statusConfig[selectedRelease.status] || statusConfig.planning).color}`}>
                {(statusConfig[selectedRelease.status] || statusConfig.planning).label}
              </span>
            </div>

            {selectedRelease.description && (
              <p className="text-gray-600 mb-6">{selectedRelease.description}</p>
            )}

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Environment</p>
                <p className="text-sm font-medium text-gray-900 mt-1 capitalize">{selectedRelease.deployment?.environment || 'development'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Owner</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{selectedRelease.owner?.name || 'Unassigned'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Planned Date</p>
                <p className="text-sm font-medium text-gray-900 mt-1">{selectedRelease.deployment?.planned_date ? formatDate(selectedRelease.deployment.planned_date) : 'Not set'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Linked Changes</p>
                <p className="text-sm font-medium text-blue-600 mt-1">{selectedRelease.linked_changes?.length || 0} change requests</p>
              </div>
            </div>

            {selectedRelease.deployment?.rollback_plan && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-semibold text-yellow-900">Rollback Plan</h3>
                </div>
                <p className="text-sm text-yellow-700">{selectedRelease.deployment.rollback_plan}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
