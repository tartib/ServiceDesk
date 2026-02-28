'use client';

import { API_URL } from '@/lib/api/config';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, LayoutGrid, List, RefreshCw, FileText, Search as SearchIcon } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import IntakeRequestCard from '@/components/projects/IntakeRequestCard';
import { useLanguage } from '@/contexts/LanguageContext';

const STAGE_IDS = ['draft', 'screening', 'business_case', 'prioritization', 'approved', 'rejected'];

const STAGE_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-300',
  screening: 'bg-blue-100 text-blue-700 border-blue-300',
  business_case: 'bg-purple-100 text-purple-700 border-purple-300',
  prioritization: 'bg-amber-100 text-amber-700 border-amber-300',
  approved: 'bg-green-100 text-green-700 border-green-300',
  rejected: 'bg-red-100 text-red-700 border-red-300',
};

interface IntakeRequest {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  stage: string;
  requestedBy?: {
    _id: string;
    profile?: { firstName?: string; lastName?: string; avatar?: string };
    name?: string;
    email?: string;
  };
  createdAt: string;
  scores?: { criterion: string; score: number }[];
}

interface Stats {
  total: number;
  byStage: Record<string, number>;
  avgApprovalDays: number;
}

export default function IntakeDashboardPage() {
  const router = useRouter();
  const { t } = useLanguage();

  const STAGES = STAGE_IDS.map((id) => ({
    id,
    label: t(`intake.stages.${id}`),
    color: STAGE_COLORS[id] || 'bg-gray-100 text-gray-600 border-gray-300',
  }));
  const [intakes, setIntakes] = useState<IntakeRequest[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'pipeline' | 'table'>('pipeline');
  const [filterStage, setFilterStage] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) { router.push('/login'); return; }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (filterStage) params.set('stage', filterStage);
      if (filterPriority) params.set('priority', filterPriority);

      const [intakesRes, statsRes] = await Promise.all([
        fetch(`${API_URL}/pm/intake?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/pm/intake/stats`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const intakesData = await intakesRes.json();
      const statsData = await statsRes.json();

      if (intakesData.success) setIntakes(intakesData.data.intakes || []);
      if (statsData.success) setStats(statsData.data);
    } catch (error) {
      console.error('Failed to fetch intake data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, [filterStage, filterPriority]);

  const filteredIntakes = searchQuery
    ? intakes.filter((r) => r.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : intakes;

  const getStageIntakes = (stageId: string) =>
    filteredIntakes.filter((r) => r.stage === stageId);

  return (
    <DashboardLayout>
      <div className="flex flex-col h-full bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('intake.title')}</h1>
              <p className="text-sm text-gray-500 mt-1">{t('intake.subtitle')}</p>
            </div>
            <button
              onClick={() => router.push('/projects/intake/new')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              {t('intake.newRequest')}
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
                <div className="text-xs text-blue-600">{t('intake.stats.totalRequests')}</div>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-amber-700">
                  {(stats.byStage?.screening || 0) + (stats.byStage?.business_case || 0) + (stats.byStage?.prioritization || 0)}
                </div>
                <div className="text-xs text-amber-600">{t('intake.stats.inReview')}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-700">{stats.byStage?.approved || 0}</div>
                <div className="text-xs text-green-600">{t('intake.stats.approved')}</div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="text-2xl font-bold text-gray-700">{stats.avgApprovalDays || 0}d</div>
                <div className="text-xs text-gray-500">{t('intake.stats.avgApprovalTime')}</div>
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <SearchIcon className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('intake.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-60"
                />
              </div>
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('intake.allStages')}</option>
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('intake.allPriorities')}</option>
                <option value="critical">{t('intake.priorities.critical')}</option>
                <option value="high">{t('intake.priorities.high')}</option>
                <option value="medium">{t('intake.priorities.medium')}</option>
                <option value="low">{t('intake.priorities.low')}</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchData}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title={t('intake.refresh')}
              >
                <RefreshCw className="h-4 w-4" />
              </button>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('pipeline')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'pipeline' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
            </div>
          ) : viewMode === 'pipeline' ? (
            /* Pipeline/Kanban View */
            <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
              {STAGES.filter((s) => !filterStage || s.id === filterStage).map((stage) => {
                const stageIntakes = getStageIntakes(stage.id);
                return (
                  <div key={stage.id} className="shrink-0 w-72">
                    <div className={`flex items-center justify-between mb-3 px-3 py-2 rounded-lg border ${stage.color}`}>
                      <span className="text-sm font-medium">{stage.label}</span>
                      <span className="text-xs font-bold bg-white/60 px-2 py-0.5 rounded-full">
                        {stageIntakes.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {stageIntakes.map((request) => (
                        <IntakeRequestCard key={request._id} request={request} />
                      ))}
                      {stageIntakes.length === 0 && (
                        <div className="text-center py-8 text-gray-400 text-sm">
                          {t('intake.noRequests')}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">{t('intake.table.title')}</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">{t('intake.table.stage')}</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">{t('intake.table.priority')}</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">{t('intake.table.category')}</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">{t('intake.table.requester')}</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase px-4 py-3">{t('intake.table.created')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIntakes.map((request) => {
                    const stageInfo = STAGES.find((s) => s.id === request.stage);
                    const requesterName = request.requestedBy?.profile
                      ? `${request.requestedBy.profile.firstName || ''} ${request.requestedBy.profile.lastName || ''}`.trim()
                      : request.requestedBy?.name || '—';
                    return (
                      <tr
                        key={request._id}
                        onClick={() => router.push(`/projects/intake/${request._id}`)}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">{request.title}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stageInfo?.color || 'bg-gray-100 text-gray-600'}`}>
                            {stageInfo?.label || request.stage}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                            request.priority === 'critical' ? 'bg-red-100 text-red-700' :
                            request.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                            request.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {t(`intake.priorities.${request.priority}`)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {t(`intake.categories.${request.category}`)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{requesterName}</td>
                        <td className="px-4 py-3 text-sm text-gray-400">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredIntakes.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-gray-400">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>{t('intake.noIntakeRequests')}</p>
                        <button
                          onClick={() => router.push('/projects/intake/new')}
                          className="mt-2 text-blue-600 text-sm hover:underline"
                        >
                          {t('intake.createFirst')}
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
