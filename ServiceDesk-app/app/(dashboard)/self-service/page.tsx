'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useIncidents, useCreateIncident } from '@/hooks/useIncidents';
import { useMyServiceRequests } from '@/hooks/useServiceRequests';
import { useAuthStore } from '@/store/authStore';
import { IIncident, Impact, Urgency, Channel, IncidentStatus, getPriorityColor, getStatusColor } from '@/types/itsm';
import { ServiceRequest, getStatusColor as getSRStatusColor } from '@/hooks/useServiceRequests';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Search,
  Plus,
  HelpCircle,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  Headphones,
  ChevronRight,
  X,
  Send,
  Clipboard,
} from 'lucide-react';


export default function SelfServicePortal() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const { user } = useAuthStore();

  const quickActions = [
    {
      icon: AlertTriangle,
      titleKey: 'selfService.reportIssue',
      descKey: 'selfService.reportIssueDesc',
      color: 'bg-red-100 text-red-600',
      action: 'new-incident',
    },
    {
      icon: HelpCircle,
      titleKey: 'selfService.requestHelp',
      descKey: 'selfService.requestHelpDesc',
      color: 'bg-blue-100 text-blue-600',
      action: 'new-request',
    },
    {
      icon: BookOpen,
      titleKey: 'selfService.knowledgeBase',
      descKey: 'selfService.knowledgeBaseDesc',
      color: 'bg-green-100 text-green-600',
      action: 'knowledge-base',
    },
    {
      icon: Headphones,
      titleKey: 'selfService.contactSupport',
      descKey: 'selfService.contactSupportDesc',
      color: 'bg-purple-100 text-purple-600',
      action: 'contact',
    },
  ];

  const commonIssues = [
    { titleKey: 'selfService.issues.passwordReset', categoryKey: 'selfService.categories.accountAccess' },
    { titleKey: 'selfService.issues.emailNotWorking', categoryKey: 'selfService.categories.email' },
    { titleKey: 'selfService.issues.vpnIssues', categoryKey: 'selfService.categories.network' },
    { titleKey: 'selfService.issues.softwareInstall', categoryKey: 'selfService.categories.software' },
    { titleKey: 'selfService.issues.printerNotWorking', categoryKey: 'selfService.categories.hardware' },
    { titleKey: 'selfService.issues.slowComputer', categoryKey: 'selfService.categories.performance' },
  ];
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    title: '',
    description: '',
    impact: Impact.MEDIUM,
    urgency: Urgency.MEDIUM,
  });


  const { data: myIncidents, isLoading: loadingIncidents } = useIncidents({
    page: 1,
    limit: 5,
  });

  const userId = user?._id || user?.id || '';
  const { data: myRequests, isLoading: loadingRequests } = useMyServiceRequests(userId, { limit: 5 });

  const createIncident = useCreateIncident();

  const incidents = myIncidents?.data || [];
  const serviceRequests = myRequests?.data || [];

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'new-incident':
        router.push('/self-service/new-incident');
        break;
      case 'new-request':
        router.push('/self-service/new-request');
        break;
      case 'knowledge-base':
        router.push('/knowledge');
        break;
      case 'contact':
        router.push('/self-service/contact');
        break;
    }
  };

  const handleCommonIssue = (issue: { titleKey: string; categoryKey: string }) => {
    setTicketForm({
      ...ticketForm,
      title: t(issue.titleKey),
    });
    setShowNewTicketModal(true);
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createIncident.mutateAsync({
        title: ticketForm.title,
        description: ticketForm.description,
        impact: ticketForm.impact,
        urgency: ticketForm.urgency,
        channel: Channel.SELF_SERVICE,
        category_id: 'CAT-001',
        site_id: 'SITE-001',
      });
      
      setShowNewTicketModal(false);
      setTicketForm({
        title: '',
        description: '',
        impact: Impact.MEDIUM,
        urgency: Urgency.MEDIUM,
      });
    } catch (error) {
      console.error('Failed to create ticket:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('selfService.subtitle')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {user?.name || 'User'}
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('selfService.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.action}
                onClick={() => handleQuickAction(action.action)}
                className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all text-left group"
              >
                <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600">
                  {t(action.titleKey)}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t(action.descKey)}
                </p>
              </button>
            );
          })}
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* My Recent Tickets */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {t('selfService.myTickets')}
              </h2>
              <button
                onClick={() => router.push('/incidents')}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {t('selfService.viewAll')} <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {loadingIncidents ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse h-16 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                ))}
              </div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{t('selfService.noTickets')}</p>
                <button
                  onClick={() => setShowNewTicketModal(true)}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  {t('selfService.createFirst')}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {incidents.map((incident: IIncident) => (
                  <div
                    key={incident._id}
                    onClick={() => router.push(`/incidents/${incident.incident_id}`)}
                    className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {incident.title}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {incident.incident_id}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(incident.status)}`}>
                        {incident.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(incident.created_at).toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${getPriorityColor(incident.priority)}`}>
                        {incident.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* My Service Requests */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Send className="w-5 h-5" />
                {t('selfService.myRequests') || (locale === 'ar' ? 'طلباتي' : 'My Requests')}
              </h2>
              <button
                onClick={() => router.push('/self-service/new-request')}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {t('selfService.newRequest')} <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {loadingRequests ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse h-16 bg-gray-100 dark:bg-gray-700 rounded-lg" />
                ))}
              </div>
            ) : serviceRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clipboard className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{locale === 'ar' ? 'لا توجد طلبات' : 'No requests yet'}</p>
                <button
                  onClick={() => router.push('/self-service/new-request')}
                  className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  {locale === 'ar' ? 'إنشاء طلب جديد' : 'Create your first request'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {serviceRequests.map((request: ServiceRequest) => (
                  <div
                    key={request._id}
                    onClick={() => {}}
                    className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {request.service_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {request.request_id}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${getSRStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(request.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Common Issues */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5" />
            {t('selfService.commonIssues')}
          </h2>
          <div className="grid md:grid-cols-3 gap-2">
            {commonIssues.map((issue, index) => (
              <button
                key={index}
                onClick={() => handleCommonIssue(issue)}
                className="p-3 text-left border border-gray-100 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-between group"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600">
                    {t(issue.titleKey)}
                  </p>
                  <p className="text-sm text-gray-500">{t(issue.categoryKey)}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {incidents.filter((i: IIncident) => i.status === IncidentStatus.OPEN).length}
            </p>
            <p className="text-sm text-gray-500">{t('incidents.stats.open')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {incidents.filter((i: IIncident) => i.status === IncidentStatus.IN_PROGRESS).length}
            </p>
            <p className="text-sm text-gray-500">{t('incidents.stats.inProgress')}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {incidents.filter((i: IIncident) => i.status === IncidentStatus.RESOLVED).length}
            </p>
            <p className="text-sm text-gray-500">{t('incidents.stats.resolved')}</p>
          </div>
        </div>
      </div>

      {/* New Ticket Modal - kept for common issues quick create */}
      {showNewTicketModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('selfService.submitTicket')}
              </h2>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmitTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('selfService.form.subject')} *
                </label>
                <input
                  type="text"
                  required
                  value={ticketForm.title}
                  onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                  placeholder={t('selfService.form.subjectPlaceholder')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('selfService.form.description')} *
                </label>
                <textarea
                  required
                  rows={4}
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  placeholder={t('selfService.form.descriptionPlaceholder')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('incidents.form.impact')}
                  </label>
                  <select
                    value={ticketForm.impact}
                    onChange={(e) => setTicketForm({ ...ticketForm, impact: e.target.value as Impact })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={Impact.LOW}>{t('incidents.form.impactLow')}</option>
                    <option value={Impact.MEDIUM}>{t('incidents.form.impactMedium')}</option>
                    <option value={Impact.HIGH}>{t('incidents.form.impactHigh')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('incidents.form.urgency')}
                  </label>
                  <select
                    value={ticketForm.urgency}
                    onChange={(e) => setTicketForm({ ...ticketForm, urgency: e.target.value as Urgency })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={Urgency.LOW}>{t('incidents.form.urgencyLow')}</option>
                    <option value={Urgency.MEDIUM}>{t('incidents.form.urgencyMedium')}</option>
                    <option value={Urgency.HIGH}>{t('incidents.form.urgencyHigh')}</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={createIncident.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createIncident.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      {t('selfService.submitTicket')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
