'use client';

import { useState } from 'react';
import { useIncidents, useIncidentStats } from '@/hooks/useIncidents';
import { IIncident, IIncidentStats, IncidentStatus, Priority, getPriorityColor, getStatusColor, formatSLATime } from '@/types/itsm';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Plus, Search, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function IncidentsPage() {
  const { t } = useLanguage();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<IncidentStatus[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<Priority[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: incidentsData, isLoading } = useIncidents({
    status: statusFilter.length > 0 ? statusFilter : undefined,
    priority: priorityFilter.length > 0 ? priorityFilter : undefined,
    page,
    limit: 20,
  });

  const { data: stats } = useIncidentStats();

  const incidents = incidentsData?.data || [];
  const pagination = incidentsData?.pagination;

  const statusOptions = [
    { value: IncidentStatus.OPEN, label: t('incidents.status.open'), icon: AlertTriangle, color: 'text-blue-500' },
    { value: IncidentStatus.IN_PROGRESS, label: t('incidents.status.in_progress'), icon: Clock, color: 'text-yellow-500' },
    { value: IncidentStatus.PENDING, label: t('incidents.status.pending'), icon: Clock, color: 'text-orange-500' },
    { value: IncidentStatus.RESOLVED, label: t('incidents.status.resolved'), icon: CheckCircle, color: 'text-green-500' },
    { value: IncidentStatus.CLOSED, label: t('incidents.status.closed'), icon: XCircle, color: 'text-gray-500' },
  ];

  const priorityOptions = [
    { value: Priority.CRITICAL, label: t('incidents.priority.critical') },
    { value: Priority.HIGH, label: t('incidents.priority.high') },
    { value: Priority.MEDIUM, label: t('incidents.priority.medium') },
    { value: Priority.LOW, label: t('incidents.priority.low') },
  ];

  const toggleStatusFilter = (status: IncidentStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
    setPage(1);
  };

  const togglePriorityFilter = (priority: Priority) => {
    setPriorityFilter((prev) =>
      prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]
    );
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 md:gap-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
              {t('incidents.title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
              {t('incidents.subtitle')}
            </p>
          </div>
          <Link
            href="/incidents/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 md:py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors h-10 md:h-11 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">{t('incidents.newIncident')}</span>
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{(stats as IIncidentStats).total}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('incidents.stats.total')}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-blue-600">{(stats as IIncidentStats).open}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('incidents.stats.open')}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-yellow-600">{(stats as IIncidentStats).inProgress}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('incidents.stats.inProgress')}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-green-600">{(stats as IIncidentStats).resolved}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('incidents.stats.resolved')}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-gray-600">{(stats as IIncidentStats).closed}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('incidents.stats.closed')}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-red-600">{(stats as IIncidentStats).breached}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('incidents.stats.breached')}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 md:p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 shrink-0" />
                <input
                  type="text"
                  placeholder={t('incidents.filters.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 md:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent h-10 md:h-11"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap gap-2 md:gap-3">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggleStatusFilter(option.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 md:py-2 rounded-full text-sm md:text-base font-medium transition-colors h-10 md:h-11 whitespace-nowrap ${
                    statusFilter.includes(option.value)
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <option.icon className={`w-4 h-4 shrink-0 ${option.color}`} />
                  <span className="hidden sm:inline">{option.label}</span>
                </button>
              ))}
            </div>

            {/* Priority Filter */}
            <div className="flex flex-wrap gap-2 md:gap-3">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => togglePriorityFilter(option.value)}
                  className={`px-3 py-1.5 md:py-2 rounded-full text-sm md:text-base font-medium transition-colors h-10 md:h-11 whitespace-nowrap ${
                    priorityFilter.includes(option.value)
                      ? getPriorityColor(option.value)
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Incidents Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm md:text-base text-gray-500 dark:text-gray-400">Loading incidents...</p>
            </div>
          ) : incidents.length === 0 ? (
            <div className="p-8 text-center">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">No incidents found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 md:px-4 py-3 md:py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="hidden sm:table-cell px-3 md:px-4 py-3 md:py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Requester
                    </th>
                    <th className="hidden md:table-cell px-3 md:px-4 py-3 md:py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Assigned To
                    </th>
                    <th className="px-3 md:px-4 py-3 md:py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      SLA
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {incidents.map((incident: IIncident) => (
                    <tr
                      key={incident._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      onClick={() => window.location.href = `/incidents/${incident.incident_id}`}
                    >
                      <td className="px-3 md:px-4 py-3 md:py-4 whitespace-nowrap">
                        <span className="text-xs md:text-sm font-medium text-blue-600 dark:text-blue-400">
                          {incident.incident_id}
                        </span>
                        {incident.is_major && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">
                            Major
                          </span>
                        )}
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4">
                        <div className="text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                          {incident.title}
                        </div>
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(incident.status)}`}>
                          {incident.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getPriorityColor(incident.priority)}`}>
                          {incident.priority}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-3 md:px-4 py-3 md:py-4 whitespace-nowrap">
                        <div className="text-xs md:text-sm text-gray-900 dark:text-white">{incident.requester.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{incident.requester.department}</div>
                      </td>
                      <td className="hidden md:table-cell px-3 md:px-4 py-3 md:py-4 whitespace-nowrap">
                        {incident.assigned_to ? (
                          <div className="text-xs md:text-sm text-gray-900 dark:text-white">{incident.assigned_to.name}</div>
                        ) : (
                          <span className="text-xs md:text-sm text-gray-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-3 md:px-4 py-3 md:py-4 whitespace-nowrap">
                        {incident.sla.breach_flag ? (
                          <span className="text-xs md:text-sm text-red-600 font-medium">Breached</span>
                        ) : (
                          <span className="text-xs md:text-sm text-gray-900 dark:text-white">
                            {incident.time_to_breach_minutes !== undefined
                              ? formatSLATime(incident.time_to_breach_minutes)
                              : '-'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-3 md:px-4 py-3 md:py-4 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} incidents
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 md:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs md:text-sm h-10 md:h-11 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-3 py-2 md:py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-xs md:text-sm h-10 md:h-11 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
