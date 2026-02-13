'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useIncident, useUpdateIncidentStatus, useAddWorklog } from '@/hooks/useIncidents';
import { IIncident, IncidentStatus, getPriorityColor, getStatusColor } from '@/types/itsm';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Building, 
  Tag, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  History
} from 'lucide-react';
import Link from 'next/link';

export default function IncidentDetailPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const incidentId = params.id as string;
  
  const { data: incident, isLoading, error } = useIncident(incidentId);
  const updateStatus = useUpdateIncidentStatus();
    const addWorklog = useAddWorklog();

  const [showWorklogForm, setShowWorklogForm] = useState(false);
  const [worklogNote, setWorklogNote] = useState('');
  const [worklogMinutes, setWorklogMinutes] = useState(30);

  const handleStatusChange = (newStatus: IncidentStatus) => {
    if (!incident) return;
    updateStatus.mutate({
      incidentId: incident.incident_id,
      status: newStatus,
    });
  };

  const handleAddWorklog = () => {
    if (!incident || !worklogNote.trim()) return;
    addWorklog.mutate({
      incidentId: incident.incident_id,
      worklog: {
        minutes_spent: worklogMinutes,
        note: worklogNote,
        is_internal: false,
      },
    }, {
      onSuccess: () => {
        setWorklogNote('');
        setShowWorklogForm(false);
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

  if (error || !incident) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('incidents.notFound')}</h2>
          <p className="text-gray-500 mt-2">{t('incidents.notFoundDesc')}</p>
          <Link href="/incidents" className="mt-4 inline-block text-blue-600 hover:underline">
            {t('incidents.backToIncidents')}
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const incidentData = incident as IIncident;

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
                  {incidentData.incident_id}
                </h1>
                {incidentData.is_major && (
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                    {t('incidents.majorIncident')}
                  </span>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{incidentData.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${getStatusColor(incidentData.status)}`}>
              {incidentData.status.replace('_', ' ')}
            </span>
            <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${getPriorityColor(incidentData.priority)}`}>
              {incidentData.priority}
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
                {incidentData.description}
              </p>
            </div>

            {/* Worklogs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('incidents.worklog')}</h2>
                <button
                  onClick={() => setShowWorklogForm(!showWorklogForm)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + {t('incidents.addWorklog')}
                </button>
              </div>

              {showWorklogForm && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('incidents.timeSpent')}
                      </label>
                      <input
                        type="number"
                        value={worklogMinutes}
                        onChange={(e) => setWorklogMinutes(parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('incidents.notes')}
                      </label>
                      <textarea
                        value={worklogNote}
                        onChange={(e) => setWorklogNote(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                        placeholder={t('incidents.worklogPlaceholder')}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddWorklog}
                        disabled={addWorklog.isPending}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        {addWorklog.isPending ? t('common.loading') : t('common.save')}
                      </button>
                      <button
                        onClick={() => setShowWorklogForm(false)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {incidentData.worklogs && incidentData.worklogs.length > 0 ? (
                <div className="space-y-4">
                  {incidentData.worklogs.map((log, index) => (
                    <div key={index} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 dark:text-white">{log.by_name}</span>
                          <span className="text-sm text-gray-500">{log.minutes_spent} min</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 mt-1">{log.note}</p>
                        <span className="text-xs text-gray-500 mt-2 block">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">{t('incidents.noWorklogs')}</p>
              )}
            </div>

            {/* Timeline */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <History className="w-5 h-5" />
                {t('incidents.timeline')}
              </h2>
              {incidentData.timeline && incidentData.timeline.length > 0 ? (
                <div className="space-y-4">
                  {incidentData.timeline.map((event, index) => (
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
            {/* SLA Status */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-4">{t('incidents.sla')}</h3>
              <div className="space-y-3">
                {incidentData.sla.breach_flag ? (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-5 h-5" />
                    <span className="font-medium">{t('incidents.breached')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">{t('incidents.withinSLA')}</span>
                  </div>
                )}
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p>{t('incidents.responseDue')}: {new Date(incidentData.sla.response_due).toLocaleString()}</p>
                  <p>{t('incidents.resolutionDue')}: {new Date(incidentData.sla.resolution_due).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-4">{t('common.details')}</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">{t('incidents.requester')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{incidentData.requester.name}</p>
                    <p className="text-sm text-gray-500">{incidentData.requester.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">{t('incidents.form.department')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{incidentData.requester.department}</p>
                  </div>
                </div>
                {incidentData.assigned_to && (
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">{t('incidents.assignedTo')}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{incidentData.assigned_to.name}</p>
                      {incidentData.assigned_to.group_name && (
                        <p className="text-sm text-gray-500">{incidentData.assigned_to.group_name}</p>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Tag className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">{t('common.category')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{incidentData.category_id}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-500">{t('common.createdAt')}</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(incidentData.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase mb-4">{t('common.actions')}</h3>
              <div className="space-y-2">
                {incidentData.status === IncidentStatus.OPEN && (
                  <button
                    onClick={() => handleStatusChange(IncidentStatus.IN_PROGRESS)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('incidents.startWorking')}
                  </button>
                )}
                {incidentData.status === IncidentStatus.IN_PROGRESS && (
                  <>
                    <button
                      onClick={() => handleStatusChange(IncidentStatus.PENDING)}
                      className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                    >
                      {t('incidents.setPending')}
                    </button>
                    <button
                      onClick={() => handleStatusChange(IncidentStatus.RESOLVED)}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      {t('incidents.resolve')}
                    </button>
                  </>
                )}
                {incidentData.status === IncidentStatus.PENDING && (
                  <button
                    onClick={() => handleStatusChange(IncidentStatus.IN_PROGRESS)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('incidents.resumeWork')}
                  </button>
                )}
                {incidentData.status === IncidentStatus.RESOLVED && (
                  <button
                    onClick={() => handleStatusChange(IncidentStatus.CLOSED)}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    {t('incidents.closeIncident')}
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
