'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useIncidents, useCreateIncident } from '@/hooks/useIncidents';
import { useMyServiceRequests } from '@/hooks/useServiceRequests';
import { useAuthStore } from '@/store/authStore';
import { IIncident, Impact, Urgency, Channel, IncidentStatus, getPriorityColor, getStatusColor } from '@/types/itsm';
import { ServiceRequest, ServiceRequestStatus, getStatusColor as getSRStatusColor } from '@/hooks/useServiceRequests';
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
 color: 'bg-destructive-soft text-destructive',
 action: 'new-incident',
 },
 {
 icon: HelpCircle,
 titleKey: 'selfService.requestHelp',
 descKey: 'selfService.requestHelpDesc',
 color: 'bg-brand-soft text-brand',
 action: 'new-request',
 },
 {
 icon: BookOpen,
 titleKey: 'selfService.knowledgeBase',
 descKey: 'selfService.knowledgeBaseDesc',
 color: 'bg-success-soft text-success',
 action: 'knowledge-base',
 },
 {
 icon: Headphones,
 titleKey: 'selfService.contactSupport',
 descKey: 'selfService.contactSupportDesc',
 color: 'bg-info-soft text-info',
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

 const userId = user?.id || '';
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
 <h1 className="text-3xl font-bold text-foreground mb-2">
 {t('selfService.subtitle')}
 </h1>
 <p className="text-muted-foreground">
 {user?.name || 'User'}
 </p>
 </div>

 {/* Search Bar */}
 <div className="max-w-2xl mx-auto">
 <div className="relative">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
 <input
 type="text"
 placeholder={t('selfService.searchPlaceholder')}
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full pl-12 pr-4 py-4 text-lg border border-input rounded-xl bg-card text-foreground focus:ring-2 focus:ring-ring focus:border-transparent shadow-sm"
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
 className="p-6 bg-card rounded-xl border border-border hover:shadow-lg transition-all text-left group"
 >
 <div className={`w-12 h-12 rounded-lg ${action.color} flex items-center justify-center mb-4`}>
 <Icon className="w-6 h-6" />
 </div>
 <h3 className="font-semibold text-foreground mb-1 group-hover:text-brand">
 {t(action.titleKey)}
 </h3>
 <p className="text-sm text-muted-foreground">
 {t(action.descKey)}
 </p>
 </button>
 );
 })}
 </div>

 {/* Two Column Layout */}
 <div className="grid md:grid-cols-2 gap-8">
 {/* My Recent Tickets */}
 <div className="bg-card rounded-xl border border-border p-6">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
 <FileText className="w-5 h-5" />
 {t('selfService.myTickets')}
 </h2>
 <button
 onClick={() => router.push('/incidents')}
 className="text-sm text-brand hover:text-brand-strong flex items-center gap-1"
 >
 {t('selfService.viewAll')} <ChevronRight className="w-4 h-4" />
 </button>
 </div>

 {loadingIncidents ? (
 <div className="space-y-3">
 {[1, 2, 3].map((i) => (
 <div key={i} className="animate-pulse h-16 bg-muted rounded-lg" />
 ))}
 </div>
 ) : incidents.length === 0 ? (
 <div className="text-center py-8 text-muted-foreground">
 <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
 <p>{t('selfService.noTickets')}</p>
 <button
 onClick={() => setShowNewTicketModal(true)}
 className="mt-2 text-brand hover:text-brand-strong text-sm"
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
 className="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors"
 >
 <div className="flex items-start justify-between">
 <div className="flex-1 min-w-0">
 <p className="font-medium text-foreground truncate">
 {incident.title}
 </p>
 <p className="text-sm text-muted-foreground">
 {incident.incident_id}
 </p>
 </div>
 <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(incident.status)}`}>
 {incident.status.replace('_', ' ')}
 </span>
 </div>
 <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
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
 <div className="bg-card rounded-xl border border-border p-6">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
 <Send className="w-5 h-5" />
 {t('selfService.myRequests') || (locale === 'ar' ? 'طلباتي' : 'My Requests')}
 </h2>
 <button
 onClick={() => router.push('/self-service/new-request')}
 className="text-sm text-brand hover:text-brand-strong flex items-center gap-1"
 >
 {t('selfService.newRequest')} <ChevronRight className="w-4 h-4" />
 </button>
 </div>

 {loadingRequests ? (
 <div className="space-y-3">
 {[1, 2, 3].map((i) => (
 <div key={i} className="animate-pulse h-16 bg-muted rounded-lg" />
 ))}
 </div>
 ) : serviceRequests.length === 0 ? (
 <div className="text-center py-8 text-muted-foreground">
 <Clipboard className="w-12 h-12 mx-auto mb-2 opacity-50" />
 <p>{locale === 'ar' ? 'لا توجد طلبات' : 'No requests yet'}</p>
 <button
 onClick={() => router.push('/self-service/new-request')}
 className="mt-2 text-brand hover:text-brand-strong text-sm"
 >
 {locale === 'ar' ? 'إنشاء طلب جديد' : 'Create your first request'}
 </button>
 </div>
 ) : (
 <div className="space-y-3">
 {serviceRequests.map((request: ServiceRequest) => (
 <div
 key={request._id}
 onClick={() => router.push(`/itsm-dashboard/service-requests/${request.request_id}`)}
 className="p-4 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors"
 >
 <div className="flex items-start justify-between">
 <div className="flex-1 min-w-0">
 <p className="font-medium text-foreground truncate">
 {request.service_name}
 </p>
 <p className="text-sm text-muted-foreground">
 {request.request_id}
 </p>
 </div>
 <span className={`px-2 py-1 text-xs rounded-full ${getSRStatusColor(request.status)}`}>
 {request.status.replace('_', ' ')}
 </span>
 </div>
 <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
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
 <div className="bg-card rounded-xl border border-border p-6">
 <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-4">
 <HelpCircle className="w-5 h-5" />
 {t('selfService.commonIssues')}
 </h2>
 <div className="grid md:grid-cols-3 gap-2">
 {commonIssues.map((issue, index) => (
 <button
 key={index}
 onClick={() => handleCommonIssue(issue)}
 className="p-3 text-left border border-border rounded-lg hover:bg-accent transition-colors flex items-center justify-between group"
 >
 <div>
 <p className="font-medium text-foreground group-hover:text-brand">
 {t(issue.titleKey)}
 </p>
 <p className="text-sm text-muted-foreground">{t(issue.categoryKey)}</p>
 </div>
 <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-brand" />
 </button>
 ))}
 </div>
 </div>

 {/* Stats */}
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
 <div className="bg-card rounded-xl border border-border p-6 text-center">
 <div className="w-12 h-12 bg-brand-soft rounded-full flex items-center justify-center mx-auto mb-3">
 <FileText className="w-6 h-6 text-brand" />
 </div>
 <p className="text-2xl font-bold text-foreground">
 {incidents.filter((i: IIncident) => i.status === IncidentStatus.OPEN).length}
 </p>
 <p className="text-sm text-muted-foreground">{t('incidents.stats.open')}</p>
 </div>
 <div className="bg-card rounded-xl border border-border p-6 text-center">
 <div className="w-12 h-12 bg-warning-soft rounded-full flex items-center justify-center mx-auto mb-3">
 <Clock className="w-6 h-6 text-warning" />
 </div>
 <p className="text-2xl font-bold text-foreground">
 {incidents.filter((i: IIncident) => i.status === IncidentStatus.IN_PROGRESS).length}
 </p>
 <p className="text-sm text-muted-foreground">{t('incidents.stats.inProgress')}</p>
 </div>
 <div className="bg-card rounded-xl border border-border p-6 text-center">
 <div className="w-12 h-12 bg-success-soft rounded-full flex items-center justify-center mx-auto mb-3">
 <CheckCircle className="w-6 h-6 text-success" />
 </div>
 <p className="text-2xl font-bold text-foreground">
 {incidents.filter((i: IIncident) => i.status === IncidentStatus.RESOLVED).length}
 </p>
 <p className="text-sm text-muted-foreground">{t('incidents.stats.resolved')}</p>
 </div>
 <div className="bg-card rounded-xl border border-border p-6 text-center">
 <div className="w-12 h-12 bg-info-soft rounded-full flex items-center justify-center mx-auto mb-3">
 <Send className="w-6 h-6 text-info" />
 </div>
 <p className="text-2xl font-bold text-foreground">
 {serviceRequests.filter((r: ServiceRequest) => r.status === ServiceRequestStatus.SUBMITTED || r.status === ServiceRequestStatus.PENDING_APPROVAL).length}
 </p>
 <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'طلبات معلقة' : 'Pending Requests'}</p>
 </div>
 <div className="bg-card rounded-xl border border-border p-6 text-center">
 <div className="w-12 h-12 bg-info-soft rounded-full flex items-center justify-center mx-auto mb-3">
 <Clock className="w-6 h-6 text-info" />
 </div>
 <p className="text-2xl font-bold text-foreground">
 {serviceRequests.filter((r: ServiceRequest) => r.status === ServiceRequestStatus.IN_PROGRESS).length}
 </p>
 <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'طلبات قيد التنفيذ' : 'Requests In Progress'}</p>
 </div>
 <div className="bg-card rounded-xl border border-border p-6 text-center">
 <div className="w-12 h-12 bg-success-soft rounded-full flex items-center justify-center mx-auto mb-3">
 <CheckCircle className="w-6 h-6 text-success" />
 </div>
 <p className="text-2xl font-bold text-foreground">
 {serviceRequests.filter((r: ServiceRequest) => r.status === ServiceRequestStatus.FULFILLED).length}
 </p>
 <p className="text-sm text-muted-foreground">{locale === 'ar' ? 'طلبات منجزة' : 'Requests Fulfilled'}</p>
 </div>
 </div>
 </div>

 {/* New Ticket Modal - kept for common issues quick create */}
 {showNewTicketModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-card rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
 <div className="p-6 border-b border-border flex items-center justify-between">
 <h2 className="text-xl font-semibold text-foreground">
 {t('selfService.submitTicket')}
 </h2>
 <button
 onClick={() => setShowNewTicketModal(false)}
 className="p-2 hover:bg-accent rounded-lg"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 
 <form onSubmit={handleSubmitTicket} className="p-6 space-y-4">
 <div>
 <label className="block text-sm font-medium text-muted-foreground mb-1">
 {t('selfService.form.subject')} *
 </label>
 <input
 type="text"
 required
 value={ticketForm.title}
 onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
 placeholder={t('selfService.form.subjectPlaceholder')}
 className="w-full px-4 py-2 border border-input rounded-lg bg-muted text-foreground focus:ring-2 focus:ring-ring"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-muted-foreground mb-1">
 {t('selfService.form.description')} *
 </label>
 <textarea
 required
 rows={4}
 value={ticketForm.description}
 onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
 placeholder={t('selfService.form.descriptionPlaceholder')}
 className="w-full px-4 py-2 border border-input rounded-lg bg-muted text-foreground focus:ring-2 focus:ring-ring"
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-sm font-medium text-muted-foreground mb-1">
 {t('incidents.form.impact')}
 </label>
 <select
 value={ticketForm.impact}
 onChange={(e) => setTicketForm({ ...ticketForm, impact: e.target.value as Impact })}
 className="w-full px-4 py-2 border border-input rounded-lg bg-muted text-foreground focus:ring-2 focus:ring-ring"
 >
 <option value={Impact.LOW}>{t('incidents.form.impactLow')}</option>
 <option value={Impact.MEDIUM}>{t('incidents.form.impactMedium')}</option>
 <option value={Impact.HIGH}>{t('incidents.form.impactHigh')}</option>
 </select>
 </div>

 <div>
 <label className="block text-sm font-medium text-muted-foreground mb-1">
 {t('incidents.form.urgency')}
 </label>
 <select
 value={ticketForm.urgency}
 onChange={(e) => setTicketForm({ ...ticketForm, urgency: e.target.value as Urgency })}
 className="w-full px-4 py-2 border border-input rounded-lg bg-muted text-foreground focus:ring-2 focus:ring-ring"
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
 className="flex-1 px-4 py-2 border border-input rounded-lg text-muted-foreground hover:bg-accent"
 >
 {t('common.cancel')}
 </button>
 <button
 type="submit"
 disabled={createIncident.isPending}
 className="flex-1 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong disabled:opacity-50 flex items-center justify-center gap-2"
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
