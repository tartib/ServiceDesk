'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import {
  ProjectHeader,
  ProjectNavTabs,
  ProjectToolbar,
  LoadingState,
} from '@/components/projects';
import { useMethodology } from '@/hooks/useMethodology';
import { useReleases, useReleaseStats, IRelease } from '@/hooks/useReleases';

interface Project {
  _id: string;
  name: string;
  key: string;
}

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

export default function ReleasesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;
  
  const { methodology } = useMethodology(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [selectedRelease, setSelectedRelease] = useState<IRelease | null>(null);
  const [showNewReleaseModal, setShowNewReleaseModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const { data: releasesData, isLoading: releasesLoading } = useReleases(
    filterStatus !== 'all' ? { status: filterStatus } : undefined
  );
  const { data: stats } = useReleaseStats();
  const releases: IRelease[] = useMemo(() => releasesData?.data || [], [releasesData]);

  const fetchProject = useCallback(async (token: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/v1/pm/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setProject(data.data.project);
    } catch (error) {
      console.error('Failed to fetch project:', error);
    } finally {
      setProjectLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProject(token);
  }, [projectId, router, fetchProject]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isLoading = projectLoading || releasesLoading;

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Project Header */}
      <ProjectHeader 
        projectKey={project?.key} 
        projectName={project?.name}
        projectId={projectId}
      />

      {/* Navigation Tabs */}
      <ProjectNavTabs projectId={projectId} methodology={methodology || 'itil'} />

      {/* Toolbar */}
      <ProjectToolbar
        searchPlaceholder="Search releases..."
        primaryAction={{
          label: 'Plan Release',
          onClick: () => setShowNewReleaseModal(true),
        }}
        rightActions={
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
        }
      />

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
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
        {/* Releases List */}
        <div className={`${selectedRelease ? 'w-1/2 border-r border-gray-200' : 'w-full'} overflow-y-auto p-4`}>
          <div className="space-y-3">
            {releases.length === 0 ? (
              <div className="text-center py-12">
                <Rocket className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No releases found</p>
              </div>
            ) : (
              releases.map((release) => {
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
                      {/* Icon */}
                      <div className={`p-2 rounded-lg ${
                        release.status === 'deployed' ? 'bg-teal-100' :
                        release.status === 'rolled_back' ? 'bg-red-100' :
                        'bg-blue-100'
                      }`}>
                        <Rocket className={`h-5 w-5 ${
                          release.status === 'deployed' ? 'text-teal-600' :
                          release.status === 'rolled_back' ? 'text-red-600' :
                          'text-blue-600'
                        }`} />
                      </div>

                      {/* Content */}
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

                      {/* Changes Count */}
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
              })
            )}
          </div>
        </div>

        {/* Release Detail Panel */}
        {selectedRelease && (
          <div className="w-1/2 overflow-y-auto bg-white">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl font-mono font-bold text-gray-900">{selectedRelease.version}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${typeConfig[selectedRelease.type].color}`}>
                      {typeConfig[selectedRelease.type].label}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedRelease.name}</h2>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusConfig[selectedRelease.status].color}`}>
                  {statusConfig[selectedRelease.status].label}
                </span>
              </div>

              {/* Description */}
              {selectedRelease.description && (
                <p className="text-gray-600 mb-6">{selectedRelease.description}</p>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Environment</p>
                  <p className="text-sm font-medium text-gray-900 mt-1 flex items-center gap-2">
                    {(() => { const env = selectedRelease.deployment?.environment || 'development'; const ec = envConfig[env] || envConfig.development; return (<><span className={`w-2 h-2 rounded-full ${ec.color}`} />{env.charAt(0).toUpperCase() + env.slice(1)}</>); })()}
                  </p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Owner</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedRelease.owner?.name || 'Unassigned'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Planned Date</p>
                  <p className="text-sm font-medium text-gray-900 mt-1">{selectedRelease.deployment?.planned_date ? formatDate(selectedRelease.deployment.planned_date) : 'Not set'}</p>
                </div>
                {selectedRelease.deployment?.actual_date && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Actual Date</p>
                    <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(selectedRelease.deployment.actual_date)}</p>
                  </div>
                )}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Linked Changes</p>
                  <p className="text-sm font-medium text-blue-600 mt-1">{selectedRelease.linked_changes?.length || 0} change requests</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Linked Incidents</p>
                  <p className={`text-sm font-medium mt-1 ${(selectedRelease.linked_incidents?.length || 0) > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {selectedRelease.linked_incidents?.length || 0} incidents
                  </p>
                </div>
              </div>

              {/* Rollback Plan */}
              {selectedRelease.deployment?.rollback_plan && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-semibold text-yellow-900">Rollback Plan</h3>
                  </div>
                  <p className="text-sm text-yellow-700">{selectedRelease.deployment.rollback_plan}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                {selectedRelease.status === 'planning' && (
                  <button className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                    Start Building
                  </button>
                )}
                {selectedRelease.status === 'building' && (
                  <button className="flex-1 px-4 py-2.5 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 transition-colors">
                    Move to Testing
                  </button>
                )}
                {selectedRelease.status === 'testing' && (
                  <button className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors">
                    Approve
                  </button>
                )}
                {selectedRelease.status === 'approved' && (
                  <button className="flex-1 px-4 py-2.5 bg-teal-600 text-white font-medium rounded-lg hover:bg-teal-700 transition-colors">
                    Deploy to Production
                  </button>
                )}
                {selectedRelease.status === 'deployed' && (
                  <button className="flex-1 px-4 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors">
                    Rollback
                  </button>
                )}
                <button className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Release Modal */}
      {showNewReleaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Plan New Release</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
                  <input
                    type="text"
                    placeholder="e.g., v2.6.0"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="major">Major</option>
                    <option value="minor">Minor</option>
                    <option value="patch">Patch</option>
                    <option value="hotfix">Hotfix</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="Release name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  placeholder="Release description..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Planned Date</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNewReleaseModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Create Release
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
