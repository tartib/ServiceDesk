'use client';

import { useState } from 'react';
import { useProblems, useProblemStats } from '@/hooks/useProblems';
import { IProblem, IProblemStats, ProblemStatus, getPriorityColor } from '@/types/itsm';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Plus, Search, AlertTriangle, FileQuestion, CheckCircle, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

const getStatusColor = (status: ProblemStatus): string => {
  const colors: Record<ProblemStatus, string> = {
    [ProblemStatus.LOGGED]: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    [ProblemStatus.RCA_IN_PROGRESS]: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    [ProblemStatus.KNOWN_ERROR]: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    [ProblemStatus.RESOLVED]: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    [ProblemStatus.CLOSED]: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

export default function ProblemsPage() {
  const { t } = useLanguage();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ProblemStatus[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: problemsData, isLoading } = useProblems({
    status: statusFilter.length > 0 ? statusFilter : undefined,
    page,
    limit: 20,
  });

  const { data: stats } = useProblemStats();

  const response = problemsData as { data: IProblem[]; pagination: { page: number; limit: number; total: number; totalPages: number } } | undefined;
  const problems = response?.data || [];
  const pagination = response?.pagination;

  const statusOptions = [
    { value: ProblemStatus.LOGGED, label: t('problems.status.logged'), icon: FileQuestion, color: 'text-blue-500' },
    { value: ProblemStatus.RCA_IN_PROGRESS, label: t('problems.status.rca_in_progress'), icon: Search, color: 'text-yellow-500' },
    { value: ProblemStatus.KNOWN_ERROR, label: t('problems.status.known_error'), icon: Lightbulb, color: 'text-purple-500' },
    { value: ProblemStatus.RESOLVED, label: t('problems.status.resolved'), icon: CheckCircle, color: 'text-green-500' },
  ];

  const toggleStatusFilter = (status: ProblemStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('problems.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {t('problems.subtitle')}
            </p>
          </div>
          <Link
            href="/problems/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            {t('problems.newProblem')}
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{(stats as IProblemStats).total || 0}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('problems.stats.total')}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-yellow-600">{(stats as IProblemStats).rcaInProgress || 0}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('problems.stats.rcaInProgress')}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-purple-600">{(stats as IProblemStats).knownErrors || 0}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('problems.stats.knownErrors')}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="text-2xl font-bold text-green-600">{(stats as IProblemStats).resolved || 0}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{t('problems.stats.resolved')}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search problems..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggleStatusFilter(option.value)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    statusFilter.includes(option.value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <option.icon className="w-4 h-4" />
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Problems Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : problems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <AlertTriangle className="w-12 h-12 mb-4 text-gray-300" />
              <p>No problems found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Priority
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Linked Incidents
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {problems.map((problem: IProblem) => (
                    <tr
                      key={problem._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                      onClick={() => window.location.href = `/problems/${problem._id}`}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {problem.problem_id}
                        </span>
                        {problem.known_error && (
                          <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded-full">
                            KE
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-xs">
                          {problem.title}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(problem.status)}`}>
                          {problem.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getPriorityColor(problem.priority)}`}>
                          {problem.priority}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">{problem.owner.name}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {problem.linked_incidents?.length || 0}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(problem.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} problems
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
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
