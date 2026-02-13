'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProblem, useUpdateProblemStatus, useUpdateRootCause } from '@/hooks/useProblems';
import { IProblem, ProblemStatus, getPriorityColor } from '@/types/itsm';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Tag, 
  AlertTriangle,
  Lightbulb,
  History,
  FileQuestion
} from 'lucide-react';
import Link from 'next/link';

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

export default function ProblemDetailPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const problemId = params.id as string;
  
  const { data: problem, isLoading, error } = useProblem(problemId);
  const updateStatus = useUpdateProblemStatus();
  const updateRootCause = useUpdateRootCause();

  const [showRCAForm, setShowRCAForm] = useState(false);
  const [rcaData, setRcaData] = useState({
    root_cause: '',
    workaround: '',
  });

  const handleStatusChange = (newStatus: ProblemStatus) => {
    if (!problem) return;
    updateStatus.mutate({
      problemId: problem.problem_id,
      status: newStatus,
    });
  };

  const handleUpdateRCA = () => {
    if (!problem || !rcaData.root_cause.trim()) return;
    updateRootCause.mutate({
      problemId: problem.problem_id,
      root_cause: rcaData.root_cause,
      workaround: rcaData.workaround,
    }, {
      onSuccess: () => {
        setRcaData({ root_cause: '', workaround: '' });
        setShowRCAForm(false);
      },
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !problem) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('problems.notFound')}</h2>
          <p className="text-gray-500 mt-2">{t('problems.notFoundDesc')}</p>
          <Link href="/problems" className="mt-4 inline-block text-blue-600 hover:underline">
            {t('problems.backToProblems')}
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const problemData = problem as IProblem;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {problemData.problem_id}
                </h1>
                {problemData.known_error && (
                  <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" />
                    {t('problems.knownError')}
                  </span>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{problemData.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${getStatusColor(problemData.status)}`}>
              {t(`problems.status.${problemData.status}`)}
            </span>
            <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${getPriorityColor(problemData.priority)}`}>
              {t(`incidents.priority.${problemData.priority}`)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('incidents.form.description')}</h2>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {problemData.description}
              </p>
            </div>

            {/* Root Cause Analysis */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('problems.rootCause')}</h2>
                {!problemData.root_cause && (
                  <button
                    onClick={() => setShowRCAForm(!showRCAForm)}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + {t('common.add')}
                  </button>
                )}
              </div>

              {showRCAForm && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('problems.rootCause')}
                      </label>
                      <textarea
                        value={rcaData.root_cause}
                        onChange={(e) => setRcaData({ ...rcaData, root_cause: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                        placeholder={t('problems.form.rootCausePlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('problems.workaround')}
                      </label>
                      <textarea
                        value={rcaData.workaround}
                        onChange={(e) => setRcaData({ ...rcaData, workaround: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                        placeholder={t('problems.form.workaroundPlaceholder')}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateRCA}
                        disabled={updateRootCause.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {updateRootCause.isPending ? t('common.loading') : t('common.save')}
                      </button>
                      <button
                        onClick={() => setShowRCAForm(false)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {problemData.root_cause ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('problems.rootCause')}</h3>
                    <p className="text-gray-700 dark:text-gray-300">{problemData.root_cause}</p>
                  </div>
                  {problemData.workaround && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t('problems.workaround')}</h3>
                      <p className="text-gray-700 dark:text-gray-300">{problemData.workaround}</p>
                    </div>
                  )}
                  {problemData.permanent_fix && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Permanent Fix</h3>
                      <p className="text-gray-700 dark:text-gray-300">{problemData.permanent_fix}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">{t('problems.noRootCause')}</p>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <History className="w-5 h-5" />
                {t('incidents.timeline')}
              </h2>
              {problemData.timeline && problemData.timeline.length > 0 ? (
                <div className="space-y-4">
                  {problemData.timeline.map((event, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-500 rounded-full"></div>
                      <div>
                        <p className="text-gray-900 dark:text-white">{event.event}</p>
                        <p className="text-sm text-gray-500">
                          {event.by_name || event.by} • {new Date(event.time).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">{t('incidents.noTimeline')}</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Details */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-4">{t('common.details')}</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">{t('problems.owner')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{problemData.owner.name}</p>
                    <p className="text-sm text-gray-500">{problemData.owner.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">{t('common.category')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{problemData.category_id}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FileQuestion className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">{t('problems.linkedIncidents')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {problemData.linked_incidents?.length || 0} {t('incidents.title')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">{t('common.createdAt')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(problemData.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-4">{t('common.actions')}</h3>
              <div className="space-y-2">
                {problemData.status === ProblemStatus.LOGGED && (
                  <button
                    onClick={() => handleStatusChange(ProblemStatus.RCA_IN_PROGRESS)}
                    className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    {t('problems.startRCA')}
                  </button>
                )}
                {problemData.status === ProblemStatus.RCA_IN_PROGRESS && problemData.root_cause && (
                  <button
                    onClick={() => handleStatusChange(ProblemStatus.KNOWN_ERROR)}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    {t('problems.markAsKnownError')}
                  </button>
                )}
                {(problemData.status === ProblemStatus.RCA_IN_PROGRESS || problemData.status === ProblemStatus.KNOWN_ERROR) && (
                  <button
                    onClick={() => handleStatusChange(ProblemStatus.RESOLVED)}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {t('problems.resolveProblem')}
                  </button>
                )}
                {problemData.status === ProblemStatus.RESOLVED && (
                  <button
                    onClick={() => handleStatusChange(ProblemStatus.CLOSED)}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    {t('common.close')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
