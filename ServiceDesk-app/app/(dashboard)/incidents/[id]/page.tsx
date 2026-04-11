'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useIncident, useUpdateIncidentStatus, useAddWorklog, useDeclareMajorIncident, useAddCommsUpdate } from '@/hooks/useIncidents';
import { IIncident, IncidentStatus, MajorIncidentSeverity, getPriorityColor, getStatusColor } from '@/types/itsm';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  History,
  Flame,
  Radio,
  ClipboardList,
  Send,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Link from 'next/link';

const SEVERITY_CONFIG: Record<MajorIncidentSeverity, { label: string; color: string; bg: string }> = {
  [MajorIncidentSeverity.SEV0]: { label: 'SEV0 — Critical', color: 'text-red-700', bg: 'bg-red-100 border-red-300' },
  [MajorIncidentSeverity.SEV1]: { label: 'SEV1 — Major', color: 'text-orange-700', bg: 'bg-orange-100 border-orange-300' },
  [MajorIncidentSeverity.SEV2]: { label: 'SEV2 — Significant', color: 'text-yellow-700', bg: 'bg-yellow-100 border-yellow-300' },
};

export default function IncidentDetailPage() {
  const { t } = useLanguage();
  const params = useParams();
  const router = useRouter();
  const incidentId = params.id as string;
  
  const { data: incident, isLoading, error } = useIncident(incidentId);
  const updateStatus = useUpdateIncidentStatus();
  const addWorklog = useAddWorklog();
  const declareMajor = useDeclareMajorIncident();
  const addCommsUpdate = useAddCommsUpdate();

  const [showWorklogForm, setShowWorklogForm] = useState(false);
  const [worklogNote, setWorklogNote] = useState('');
  const [worklogMinutes, setWorklogMinutes] = useState(30);
  const [activeTab, setActiveTab] = useState<'details' | 'comms' | 'timeline'>('details');
  const [showDeclareModal, setShowDeclareModal] = useState(false);
  const [declareSeverity, setDeclareSeverity] = useState<MajorIncidentSeverity>(MajorIncidentSeverity.SEV1);
  const [declareBridgeUrl, setDeclareBridgeUrl] = useState('');
  const [commsMessage, setCommsMessage] = useState('');
  const [commsNextUpdate, setCommsNextUpdate] = useState('');
  const [showCommsForm, setShowCommsForm] = useState(false);
  const [showCommsHistory, setShowCommsHistory] = useState(true);

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

  const handleDeclareMajor = () => {
    if (!incident) return;
    declareMajor.mutate({
      incidentId: incident.incident_id,
      severity: declareSeverity,
      bridge: declareBridgeUrl ? { bridge_url: declareBridgeUrl } : undefined,
    }, {
      onSuccess: () => setShowDeclareModal(false),
    });
  };

  const handlePostCommsUpdate = () => {
    if (!incident || !commsMessage.trim()) return;
    addCommsUpdate.mutate({
      incidentId: incident.incident_id,
      message: commsMessage,
      next_update_at: commsNextUpdate || undefined,
    }, {
      onSuccess: () => {
        setCommsMessage('');
        setCommsNextUpdate('');
        setShowCommsForm(false);
      },
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !incident) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground">{t('incidents.notFound')}</h2>
          <p className="text-muted-foreground mt-2">{t('incidents.notFoundDesc')}</p>
          <Link href="/incidents" className="mt-4 inline-block text-primary hover:underline">
            {t('incidents.backToIncidents')}
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const incidentData = incident as IIncident;
  const severityCfg = incidentData.severity ? SEVERITY_CONFIG[incidentData.severity] : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">
                  {incidentData.incident_id}
                </h1>
                {incidentData.is_major && severityCfg && (
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${severityCfg.bg} ${severityCfg.color} flex items-center gap-1`}>
                    <Flame className="w-3 h-3" /> {severityCfg.label}
                  </span>
                )}
                {incidentData.is_major && !severityCfg && (
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full flex items-center gap-1">
                    <Flame className="w-3 h-3" /> Major
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-1">{incidentData.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${getStatusColor(incidentData.status)}`}>
              {incidentData.status.replace('_', ' ')}
            </span>
            <span className={`px-3 py-1.5 text-sm font-medium rounded-full ${getPriorityColor(incidentData.priority)}`}>
              {incidentData.priority}
            </span>
          </div>
        </div>

        {/* Major Incident Banner */}
        {incidentData.is_major && (
          <div className={`rounded-xl border-2 p-4 ${severityCfg ? severityCfg.bg : 'bg-red-50 border-red-300'}`}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Flame className={`w-6 h-6 ${severityCfg?.color ?? 'text-red-600'}`} />
                <div>
                  <p className={`font-bold text-sm ${severityCfg?.color ?? 'text-red-700'}`}>Major Incident Active</p>
                  {incidentData.major_declared_at && (
                    <p className="text-xs text-muted-foreground">Declared {new Date(incidentData.major_declared_at).toLocaleString()}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {incidentData.major_bridge?.bridge_url && (
                  <a
                    href={incidentData.major_bridge.bridge_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border text-foreground rounded-lg text-sm hover:bg-accent transition-colors"
                  >
                    <Radio className="w-4 h-4" /> Join Bridge
                  </a>
                )}
                {!incidentData.pir_id && (
                  <Link
                    href={`/pirs/new?incident_id=${incidentData.incident_id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border text-foreground rounded-lg text-sm hover:bg-accent transition-colors"
                  >
                    <ClipboardList className="w-4 h-4" /> Create PIR
                  </Link>
                )}
                {incidentData.pir_id && (
                  <Link
                    href={`/pirs/${incidentData.pir_id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                  >
                    <ClipboardList className="w-4 h-4" /> View PIR
                  </Link>
                )}
              </div>
            </div>
            {incidentData.major_bridge?.bridge_lead_name && (
              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <span><span className="font-medium">Bridge Lead:</span> {incidentData.major_bridge.bridge_lead_name}</span>
                {incidentData.major_bridge.scribe_name && (
                  <span><span className="font-medium">Scribe:</span> {incidentData.major_bridge.scribe_name}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-border">
          <nav className="flex gap-1">
            {(['details', ...(incidentData.is_major ? ['comms'] : []), 'timeline'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as typeof activeTab)}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors capitalize ${
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'comms' ? 'Comms Updates' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'comms' && incidentData.comms_updates && incidentData.comms_updates.length > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-orange-100 text-orange-700 rounded-full">
                    {incidentData.comms_updates.length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">

            {/* DETAILS TAB */}
            {activeTab === 'details' && (
              <>
                <Card className="p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">{t('incidents.form.description')}</h2>
                  <p className="text-muted-foreground whitespace-pre-wrap">{incidentData.description}</p>
                </Card>

                {/* Worklogs */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-foreground">{t('incidents.worklog')}</h2>
                    <button onClick={() => setShowWorklogForm(!showWorklogForm)} className="text-sm text-primary hover:text-primary/80 font-medium">
                      + {t('incidents.addWorklog')}
                    </button>
                  </div>
                  {showWorklogForm && (
                    <div className="mb-4 p-4 bg-muted rounded-lg space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">{t('incidents.timeSpent')}</label>
                        <input type="number" value={worklogMinutes} onChange={(e) => setWorklogMinutes(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 border border-input rounded-lg bg-card" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">{t('incidents.notes')}</label>
                        <textarea value={worklogNote} onChange={(e) => setWorklogNote(e.target.value)} rows={3} className="w-full px-3 py-2 border border-input rounded-lg bg-card" placeholder={t('incidents.worklogPlaceholder')} />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleAddWorklog} disabled={addWorklog.isPending}>
                          {addWorklog.isPending ? t('common.loading') : t('common.save')}
                        </Button>
                        <Button variant="outline" onClick={() => setShowWorklogForm(false)}>{t('common.cancel')}</Button>
                      </div>
                    </div>
                  )}
                  {incidentData.worklogs && incidentData.worklogs.length > 0 ? (
                    <div className="space-y-4">
                      {incidentData.worklogs.map((log, index) => (
                        <div key={index} className="flex gap-4 p-4 bg-muted rounded-lg">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-foreground">{log.by_name}</span>
                              <span className="text-sm text-muted-foreground">{log.minutes_spent} min</span>
                            </div>
                            <p className="text-muted-foreground mt-1">{log.note}</p>
                            <span className="text-xs text-muted-foreground mt-2 block">{new Date(log.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">{t('incidents.noWorklogs')}</p>
                  )}
                </Card>
              </>
            )}

            {/* COMMS UPDATES TAB */}
            {activeTab === 'comms' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Radio className="w-5 h-5 text-orange-500" /> Communications Updates
                  </h2>
                  <button
                    onClick={() => setShowCommsForm(!showCommsForm)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 transition-colors"
                  >
                    <Send className="w-4 h-4" /> Post Update
                  </button>
                </div>

                {showCommsForm && (
                  <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-orange-200 dark:border-orange-800 space-y-3">
                    <textarea
                      value={commsMessage}
                      onChange={(e) => setCommsMessage(e.target.value)}
                      rows={3}
                      placeholder="Status update message for stakeholders..."
                      className="w-full px-3 py-2 border border-input rounded-lg bg-card text-sm"
                    />
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Next Update ETA (optional)</label>
                      <input
                        type="datetime-local"
                        value={commsNextUpdate}
                        onChange={(e) => setCommsNextUpdate(e.target.value)}
                        className="px-3 py-1.5 border border-input rounded-lg bg-card text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handlePostCommsUpdate}
                        disabled={addCommsUpdate.isPending || !commsMessage.trim()}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg text-sm hover:bg-orange-700 disabled:opacity-50"
                      >
                        {addCommsUpdate.isPending ? 'Posting...' : 'Post Update'}
                      </button>
                      <Button variant="outline" size="sm" onClick={() => setShowCommsForm(false)}>Cancel</Button>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {incidentData.comms_updates && incidentData.comms_updates.length > 0 ? (
                    <>
                      <button
                        onClick={() => setShowCommsHistory(!showCommsHistory)}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                      >
                        {showCommsHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        {incidentData.comms_updates.length} update{incidentData.comms_updates.length !== 1 ? 's' : ''}
                      </button>
                      {showCommsHistory && [...incidentData.comms_updates].reverse().map((update, i) => (
                        <div key={i} className="flex gap-4 p-4 bg-muted rounded-lg border-l-4 border-orange-400">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm text-foreground">{update.posted_by_name}</span>
                              <span className="text-xs text-muted-foreground">{new Date(update.posted_at).toLocaleString()}</span>
                            </div>
                            <p className="text-muted-foreground text-sm">{update.message}</p>
                            {update.next_update_at && (
                              <p className="text-xs text-orange-600 mt-1.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Next update: {new Date(update.next_update_at).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Radio className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No comms updates posted yet.</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* TIMELINE TAB */}
            {activeTab === 'timeline' && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <History className="w-5 h-5" /> {t('incidents.timeline')}
                </h2>
                {incidentData.timeline && incidentData.timeline.length > 0 ? (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border"></div>
                    <div className="space-y-5 pl-10">
                      {incidentData.timeline.map((event, index) => (
                        <div key={index} className="relative">
                          <div className="absolute -left-6 top-1 w-3 h-3 bg-primary rounded-full border-2 border-card"></div>
                          <p className="text-foreground font-medium text-sm">{event.event}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {event.by_name || event.by} • {new Date(event.time).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">{t('incidents.noTimeline')}</p>
                )}
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* SLA Status */}
            <Card className="p-6">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">{t('incidents.sla')}</h3>
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
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{t('incidents.responseDue')}: {new Date(incidentData.sla.response_due).toLocaleString()}</p>
                  <p>{t('incidents.resolutionDue')}: {new Date(incidentData.sla.resolution_due).toLocaleString()}</p>
                </div>
              </div>
            </Card>

            {/* Details */}
            <Card className="p-6">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">{t('common.details')}</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('incidents.requester')}</p>
                    <p className="font-medium text-foreground text-sm">{incidentData.requester.name}</p>
                    <p className="text-xs text-muted-foreground">{incidentData.requester.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('incidents.form.department')}</p>
                    <p className="font-medium text-foreground text-sm">{incidentData.requester.department}</p>
                  </div>
                </div>
                {incidentData.assigned_to && (
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t('incidents.assignedTo')}</p>
                      <p className="font-medium text-foreground text-sm">{incidentData.assigned_to.name}</p>
                      {incidentData.assigned_to.group_name && <p className="text-xs text-muted-foreground">{incidentData.assigned_to.group_name}</p>}
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Tag className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('common.category')}</p>
                    <p className="font-medium text-foreground text-sm">{incidentData.category_id}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t('common.createdAt')}</p>
                    <p className="font-medium text-foreground text-sm">{new Date(incidentData.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-6">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">{t('common.actions')}</h3>
              <div className="space-y-2">
                {incidentData.status === IncidentStatus.OPEN && (
                  <Button className="w-full" onClick={() => handleStatusChange(IncidentStatus.IN_PROGRESS)}>
                    {t('incidents.startWorking')}
                  </Button>
                )}
                {incidentData.status === IncidentStatus.IN_PROGRESS && (
                  <>
                    <button onClick={() => handleStatusChange(IncidentStatus.PENDING)} className="w-full px-4 py-2 bg-warning text-white rounded-lg hover:bg-warning/90 transition-colors text-sm">
                      {t('incidents.setPending')}
                    </button>
                    <button onClick={() => handleStatusChange(IncidentStatus.RESOLVED)} className="w-full px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 transition-colors text-sm">
                      {t('incidents.resolve')}
                    </button>
                  </>
                )}
                {incidentData.status === IncidentStatus.PENDING && (
                  <Button className="w-full" onClick={() => handleStatusChange(IncidentStatus.IN_PROGRESS)}>
                    {t('incidents.resumeWork')}
                  </Button>
                )}
                {incidentData.status === IncidentStatus.RESOLVED && (
                  <Button variant="secondary" className="w-full" onClick={() => handleStatusChange(IncidentStatus.CLOSED)}>
                    {t('incidents.closeIncident')}
                  </Button>
                )}
                {!incidentData.is_major && (
                  <button
                    onClick={() => setShowDeclareModal(true)}
                    className="w-full px-4 py-2 border-2 border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Flame className="w-4 h-4" /> Declare Major Incident
                  </button>
                )}
                {incidentData.is_major && incidentData.pir_id && (
                  <Link
                    href={`/pirs/${incidentData.pir_id}`}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <ClipboardList className="w-4 h-4" /> View PIR
                  </Link>
                )}
                {incidentData.is_major && !incidentData.pir_id && (
                  <Link
                    href={`/pirs/new?incident_id=${incidentData.incident_id}`}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <ClipboardList className="w-4 h-4" /> Start PIR
                  </Link>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Declare Major Incident Modal */}
      {showDeclareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                <Flame className="w-5 h-5 text-destructive" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Declare Major Incident</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Severity Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setDeclareSeverity(key as MajorIncidentSeverity)}
                      className={`p-3 rounded-lg border-2 text-center transition-all ${
                        declareSeverity === key
                          ? `${cfg.bg} ${cfg.color} border-current`
                          : 'border-border text-muted-foreground hover:border-muted-foreground'
                      }`}
                    >
                      <p className="font-bold text-sm">{key.toUpperCase()}</p>
                      <p className="text-xs mt-0.5 opacity-75">{cfg.label.split('—')[1]?.trim()}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Bridge URL (optional)</label>
                <input
                  type="url"
                  value={declareBridgeUrl}
                  onChange={(e) => setDeclareBridgeUrl(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  className="w-full px-3 py-2 border border-input rounded-lg bg-card text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleDeclareMajor}
                  disabled={declareMajor.isPending}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
                >
                  {declareMajor.isPending ? 'Declaring...' : 'Declare Major'}
                </button>
                <button
                  onClick={() => setShowDeclareModal(false)}
                  className="flex-1 px-4 py-2.5 border border-border rounded-lg hover:bg-accent"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
