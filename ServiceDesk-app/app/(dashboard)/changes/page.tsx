'use client';

import { useState } from 'react';
import { useChanges, useChangeStats } from '@/hooks/useChanges';
import { IChange, ChangeStatus, ChangeType, getPriorityColor } from '@/types/itsm';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Plus, Search, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

const getStatusColor = (status: ChangeStatus): string => {
  const colors: Record<ChangeStatus, string> = {
    [ChangeStatus.DRAFT]: 'bg-gray-100 text-gray-700',
    [ChangeStatus.SUBMITTED]: 'bg-blue-100 text-blue-700',
    [ChangeStatus.CAB_REVIEW]: 'bg-yellow-100 text-yellow-700',
    [ChangeStatus.APPROVED]: 'bg-green-100 text-green-700',
    [ChangeStatus.REJECTED]: 'bg-red-100 text-red-700',
    [ChangeStatus.SCHEDULED]: 'bg-purple-100 text-purple-700',
    [ChangeStatus.IMPLEMENTING]: 'bg-orange-100 text-orange-700',
    [ChangeStatus.COMPLETED]: 'bg-green-100 text-green-700',
    [ChangeStatus.FAILED]: 'bg-red-100 text-red-700',
    [ChangeStatus.CANCELLED]: 'bg-gray-100 text-gray-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

const getTypeColor = (type: ChangeType): string => {
  const colors: Record<ChangeType, string> = {
    [ChangeType.NORMAL]: 'bg-blue-100 text-blue-700',
    [ChangeType.STANDARD]: 'bg-green-100 text-green-700',
    [ChangeType.EMERGENCY]: 'bg-red-100 text-red-700',
  };
  return colors[type] || 'bg-gray-100 text-gray-700';
};

export default function ChangesPage() {
  const { t } = useLanguage();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ChangeStatus[]>([]);

  const { data: changesData, isLoading } = useChanges({
    status: statusFilter.length > 0 ? statusFilter : undefined,
    page,
    limit: 20,
  });

  const { data: stats } = useChangeStats();

  const response = changesData as { data: IChange[]; pagination: { page: number; limit: number; total: number; totalPages: number } } | undefined;
  const changes = response?.data || [];
  const pagination = response?.pagination;

  const toggleStatusFilter = (status: ChangeStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('changes.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{t('changes.subtitle')}</p>
          </div>
          <Link href="/changes/new" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-5 h-5" />
            {t('changes.newChange')}
          </Link>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold">{stats.total || 0}</div>
              <div className="text-sm text-gray-500">{t('changes.stats.total')}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingApproval || 0}</div>
              <div className="text-sm text-gray-500">{t('changes.stats.pendingCAB')}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-purple-600">{stats.scheduled || 0}</div>
              <div className="text-sm text-gray-500">{t('changes.stats.scheduled')}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-green-600">{stats.completed || 0}</div>
              <div className="text-sm text-gray-500">{t('changes.stats.completed')}</div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search changes..." className="w-full pl-10 pr-4 py-2 border rounded-lg" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[ChangeStatus.DRAFT, ChangeStatus.CAB_REVIEW, ChangeStatus.SCHEDULED].map((status) => (
                <button
                  key={status}
                  onClick={() => toggleStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusFilter.includes(status) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : changes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Calendar className="w-12 h-12 mb-4 text-gray-300" />
              <p>No change requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requester</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {changes.map((change: IChange) => (
                    <tr key={change._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer" onClick={() => window.location.href = `/changes/${change.change_id}`}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-blue-600">{change.change_id}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">{change.title}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getTypeColor(change.type)}`}>{change.type}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(change.status)}`}>{change.status.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getPriorityColor(change.priority)}`}>{change.priority}</span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{change.requested_by.name}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t flex items-center justify-between">
              <div className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages}</div>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50">Previous</button>
                <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages} className="px-3 py-1 border rounded-lg text-sm disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
