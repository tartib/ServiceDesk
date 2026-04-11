'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  useIncidents,
  useMyAssignedIncidents,
  useUnassignedIncidents,
  useIncidentStats,
  useAssignIncident,
  useUpdateIncidentStatus,
  useAddWorklog,
  useEscalateIncident,
  incidentKeys,
} from '@/hooks/useIncidents';
import {
  useServiceRequests,
  useApproveServiceRequest,
  useAssignServiceRequest,
  useUpdateServiceRequestStatus,
  useFulfillServiceRequest,
  ServiceRequestStatus,
  ServiceRequest,
  requestKeys,
} from '@/hooks/useServiceRequests';
import {
  IIncident,
  IncidentStatus,
  Priority,
  getPriorityColor as getIncPriorityColor,
  getStatusColor as getIncStatusColor,
  formatSLATime,
} from '@/types/itsm';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useITSMSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Headset,
  RefreshCw,
  Inbox,
  Users,
  ShieldCheck,
  List,
  X,
  Clock,
  User,
  Building,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  Ban,
  ArrowUpRight,
  MessageSquare,
  History,
  Loader2,
  Send,
  Tag,
} from 'lucide-react';

// ─── Unified ticket type ───────────────────────────────────────────
type TicketType = 'incident' | 'sr';

interface QueueTicket {
  id: string;
  type: TicketType;
  title: string;
  status: string;
  priority: string;
  requester: { name: string; email: string; department: string };
  assignedTo?: string;
  slaRemaining?: number;
  slaBreach?: boolean;
  createdAt: string;
  raw: IIncident | ServiceRequest;
}

// ─── Tab definitions ───────────────────────────────────────────────
type QueueTab = 'my' | 'unassigned' | 'approval' | 'all';

const tabMeta: Record<QueueTab, { icon: typeof Inbox; labelKey: string }> = {
  my: { icon: Inbox, labelKey: 'agentConsole.tabs.myQueue' },
  unassigned: { icon: Users, labelKey: 'agentConsole.tabs.unassigned' },
  approval: { icon: ShieldCheck, labelKey: 'agentConsole.tabs.pendingApproval' },
  all: { icon: List, labelKey: 'agentConsole.tabs.allOpen' },
};

// ─── Helpers ───────────────────────────────────────────────────────
function normalizeIncident(inc: IIncident): QueueTicket {
  return {
    id: inc.incident_id,
    type: 'incident',
    title: inc.title,
    status: inc.status,
    priority: inc.priority,
    requester: { name: inc.requester.name, email: inc.requester.email, department: inc.requester.department },
    assignedTo: inc.assigned_to?.name,
    slaRemaining: inc.time_to_breach_minutes,
    slaBreach: inc.sla?.breach_flag,
    createdAt: inc.created_at,
    raw: inc,
  };
}

function normalizeSR(sr: ServiceRequest): QueueTicket {
  return {
    id: sr.request_id,
    type: 'sr',
    title: sr.service_name,
    status: sr.status,
    priority: sr.priority,
    requester: { name: sr.requester.name, email: sr.requester.email, department: sr.requester.department },
    assignedTo: sr.assigned_to?.name,
    createdAt: sr.created_at,
    raw: sr,
  };
}

function statusBadgeColor(type: TicketType, status: string): string {
  if (type === 'incident') return getIncStatusColor(status as IncidentStatus);
  const map: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    pending_approval: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    on_hold: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    fulfilled: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  };
  return map[status] || 'bg-gray-100 text-gray-800';
}

function priorityBadge(p: string): string {
  return getIncPriorityColor(p as Priority);
}

// ═══════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════
export default function AgentConsolePage() {
  const { t } = useLanguage();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // ─── Queue tab state ────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<QueueTab>('my');
  const [selectedTicket, setSelectedTicket] = useState<QueueTicket | null>(null);

  // ─── Dialog state ───────────────────────────────────────────────
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showFulfillDialog, setShowFulfillDialog] = useState(false);
  const [fulfillNotes, setFulfillNotes] = useState('');
  const [showEscalateDialog, setShowEscalateDialog] = useState(false);
  const [escalateReason, setEscalateReason] = useState('');
  const [showWorklogForm, setShowWorklogForm] = useState(false);
  const [worklogNote, setWorklogNote] = useState('');
  const [worklogMinutes, setWorklogMinutes] = useState(30);

  // ─── Data queries ───────────────────────────────────────────────
  const { data: myIncidentsData } = useMyAssignedIncidents(1, 50);
  const { data: unassignedIncData } = useUnassignedIncidents();
  const { data: allIncData } = useIncidents({ status: [IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS, IncidentStatus.PENDING], limit: 50 });
  const { data: incStats } = useIncidentStats();

  const { data: mySRData } = useServiceRequests({ assigned_to: user?.id || '', limit: 50 });
  const { data: pendingSRData } = useServiceRequests({ status: ServiceRequestStatus.PENDING_APPROVAL, limit: 50 });
  const { data: allSRData } = useServiceRequests({ limit: 50 });

  // ─── Mutations ──────────────────────────────────────────────────
  const assignIncident = useAssignIncident();
  const updateIncStatus = useUpdateIncidentStatus();
  const addWorklog = useAddWorklog();
  const escalateIncident = useEscalateIncident();
  const approveSR = useApproveServiceRequest();
  const assignSR = useAssignServiceRequest();
  const updateSRStatus = useUpdateServiceRequestStatus();
  const fulfillSR = useFulfillServiceRequest();

  // ─── WebSocket ──────────────────────────────────────────────────
  useITSMSocket({
    onIncidentCreated: () => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: incidentKeys.stats() });
      queryClient.invalidateQueries({ queryKey: incidentKeys.unassigned() });
    },
    onIncidentUpdated: () => {
      queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: incidentKeys.stats() });
      queryClient.invalidateQueries({ queryKey: incidentKeys.unassigned() });
    },
    onServiceRequestCreated: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requestKeys.stats() });
    },
    onServiceRequestUpdated: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
      queryClient.invalidateQueries({ queryKey: requestKeys.stats() });
    },
  });

  // ─── Normalize data per tab ─────────────────────────────────────
  const myIncidents = useMemo(() => {
    const raw = (myIncidentsData as { data?: IIncident[] })?.data || (myIncidentsData as IIncident[] | undefined) || [];
    return (Array.isArray(raw) ? raw : []).map(normalizeIncident);
  }, [myIncidentsData]);

  const mySRs = useMemo(() => {
    const raw = (mySRData as { data?: ServiceRequest[] })?.data || [];
    return raw
      .filter((sr: ServiceRequest) => ![ServiceRequestStatus.FULFILLED, ServiceRequestStatus.CANCELLED, ServiceRequestStatus.REJECTED].includes(sr.status))
      .map(normalizeSR);
  }, [mySRData]);

  const unassignedIncidents = useMemo(() => {
    const raw = (unassignedIncData as IIncident[] | undefined) || [];
    return (Array.isArray(raw) ? raw : []).map(normalizeIncident);
  }, [unassignedIncData]);

  const unassignedSRs = useMemo(() => {
    const raw = (allSRData as { data?: ServiceRequest[] })?.data || [];
    return raw
      .filter((sr: ServiceRequest) => sr.status === ServiceRequestStatus.APPROVED && !sr.assigned_to)
      .map(normalizeSR);
  }, [allSRData]);

  const pendingSRs = useMemo(() => {
    const raw = (pendingSRData as { data?: ServiceRequest[] })?.data || [];
    return raw.map(normalizeSR);
  }, [pendingSRData]);

  const allOpenIncidents = useMemo(() => {
    const raw = (allIncData as { data?: IIncident[] })?.data || [];
    return raw.map(normalizeIncident);
  }, [allIncData]);

  const allOpenSRs = useMemo(() => {
    const raw = (allSRData as { data?: ServiceRequest[] })?.data || [];
    return raw
      .filter((sr: ServiceRequest) => ![ServiceRequestStatus.FULFILLED, ServiceRequestStatus.CANCELLED, ServiceRequestStatus.REJECTED].includes(sr.status))
      .map(normalizeSR);
  }, [allSRData]);

  const tabTickets: Record<QueueTab, QueueTicket[]> = useMemo(() => ({
    my: [...myIncidents, ...mySRs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    unassigned: [...unassignedIncidents, ...unassignedSRs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    approval: pendingSRs,
    all: [...allOpenIncidents, ...allOpenSRs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  }), [myIncidents, mySRs, unassignedIncidents, unassignedSRs, pendingSRs, allOpenIncidents, allOpenSRs]);

  const tickets = tabTickets[activeTab];

  // ─── Action handlers ────────────────────────────────────────────
  const refreshAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: incidentKeys.lists() });
    queryClient.invalidateQueries({ queryKey: incidentKeys.stats() });
    queryClient.invalidateQueries({ queryKey: incidentKeys.unassigned() });
    queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
    queryClient.invalidateQueries({ queryKey: requestKeys.stats() });
    toast.success(t('agentConsole.dataRefreshed'));
  }, [queryClient, t]);

  const handleAssignToMe = useCallback(async (ticket: QueueTicket) => {
    if (!user) return;
    try {
      if (ticket.type === 'incident') {
        await assignIncident.mutateAsync({
          incidentId: ticket.id,
          assignee: {
            technician_id: user?.id || '',
            name: user.name || 'Unknown',
            email: user.email || '',
          },
        });
      } else {
        await assignSR.mutateAsync({
          id: ticket.id,
          technician_id: user?.id || '',
          name: user.name || 'Unknown',
          email: user.email || '',
        });
      }
      toast.success(t('agentConsole.toast.ticketAssigned'));
      // Refresh selected ticket
      setSelectedTicket(null);
    } catch {
      toast.error(t('agentConsole.toast.assignmentFailed'));
    }
  }, [user, assignIncident, assignSR, t]);

  // Incident status transitions
  const handleIncidentStatus = useCallback(async (ticket: QueueTicket, newStatus: IncidentStatus) => {
    try {
      await updateIncStatus.mutateAsync({
        incidentId: ticket.id,
        status: newStatus,
      });
      toast.success(t('agentConsole.toast.statusUpdated'));
      setSelectedTicket(null);
    } catch {
      toast.error(t('agentConsole.toast.statusUpdateFailed'));
    }
  }, [updateIncStatus, t]);

  // SR Approve
  const handleApproveSR = useCallback(async (ticket: QueueTicket) => {
    if (!user) return;
    try {
      await approveSR.mutateAsync({
        id: ticket.id,
        decision: 'approve',
        approver_id: user?.id || '',
        approver_name: user.name || 'Unknown',
      });
      toast.success(t('agentConsole.toast.requestApproved'));
      setSelectedTicket(null);
    } catch {
      toast.error(t('agentConsole.toast.approvalFailed'));
    }
  }, [user, approveSR, t]);

  // SR Reject (dialog)
  const handleRejectSR = useCallback(async () => {
    if (!user || !selectedTicket) return;
    try {
      await approveSR.mutateAsync({
        id: selectedTicket.id,
        decision: 'reject',
        approver_id: user?.id || '',
        approver_name: user.name || 'Unknown',
        comments: rejectReason,
      });
      toast.success(t('agentConsole.toast.requestRejected'));
      setShowRejectDialog(false);
      setRejectReason('');
      setSelectedTicket(null);
    } catch {
      toast.error(t('agentConsole.toast.rejectionFailed'));
    }
  }, [user, selectedTicket, approveSR, rejectReason, t]);

  // SR Fulfill (dialog)
  const handleFulfillSR = useCallback(async () => {
    if (!user || !selectedTicket) return;
    try {
      await fulfillSR.mutateAsync({
        id: selectedTicket.id,
        fulfilled_by: user?.id || '',
        fulfilled_by_name: user.name || 'Unknown',
        notes: fulfillNotes || undefined,
      });
      toast.success(t('agentConsole.toast.requestFulfilled'));
      setShowFulfillDialog(false);
      setFulfillNotes('');
      setSelectedTicket(null);
    } catch {
      toast.error(t('agentConsole.toast.fulfillmentFailed'));
    }
  }, [user, selectedTicket, fulfillSR, fulfillNotes, t]);

  // SR Start Work
  const handleStartWorkSR = useCallback(async (ticket: QueueTicket) => {
    if (!user) return;
    try {
      await updateSRStatus.mutateAsync({
        id: ticket.id,
        status: ServiceRequestStatus.IN_PROGRESS,
        user_id: user?.id || '',
        user_name: user.name || 'Unknown',
      });
      toast.success(t('agentConsole.toast.workStarted'));
      setSelectedTicket(null);
    } catch {
      toast.error(t('agentConsole.toast.workStartFailed'));
    }
  }, [user, updateSRStatus, t]);

  // Incident Escalate (dialog)
  const handleEscalate = useCallback(async () => {
    if (!selectedTicket) return;
    try {
      await escalateIncident.mutateAsync({
        incidentId: selectedTicket.id,
        reason: escalateReason,
      });
      toast.success(t('agentConsole.toast.escalated'));
      setShowEscalateDialog(false);
      setEscalateReason('');
      setSelectedTicket(null);
    } catch {
      toast.error(t('agentConsole.toast.escalationFailed'));
    }
  }, [selectedTicket, escalateIncident, escalateReason, t]);

  // Add worklog
  const handleAddWorklog = useCallback(async () => {
    if (!selectedTicket || !worklogNote.trim()) return;
    try {
      await addWorklog.mutateAsync({
        incidentId: selectedTicket.id,
        worklog: { minutes_spent: worklogMinutes, note: worklogNote, is_internal: false },
      });
      toast.success(t('agentConsole.toast.worklogAdded'));
      setShowWorklogForm(false);
      setWorklogNote('');
      setWorklogMinutes(30);
    } catch {
      toast.error(t('agentConsole.toast.worklogFailed'));
    }
  }, [selectedTicket, addWorklog, worklogMinutes, worklogNote, t]);

  // ─── Status label helper ────────────────────────────────────────
  const statusText = (type: TicketType, status: string) => {
    const key = type === 'incident'
      ? `agentConsole.incidentStatus.${status}`
      : `agentConsole.srStatus.${status}`;
    const val = t(key);
    return val !== key ? val : status.replace('_', ' ');
  };

  const prioText = (p: string) => {
    const key = `agentConsole.priority.${p}`;
    const val = t(key);
    return val !== key ? val : p;
  };

  // ─── Counts for badges ──────────────────────────────────────────
  const tabCounts: Record<QueueTab, number> = {
    my: tabTickets.my.length,
    unassigned: tabTickets.unassigned.length,
    approval: tabTickets.approval.length,
    all: tabTickets.all.length,
  };

  // ─── Render: slide-over detail ──────────────────────────────────
  const renderDetailPanel = () => {
    if (!selectedTicket) return null;
    const tk = selectedTicket;
    const isInc = tk.type === 'incident';
    const inc = isInc ? (tk.raw as IIncident) : null;
    const sr = !isInc ? (tk.raw as ServiceRequest) : null;

    return (
      <div className="fixed inset-y-0 ltr:right-0 rtl:left-0 w-full sm:w-[480px] bg-card shadow-2xl z-50 flex flex-col border-l border-border rtl:border-l-0 rtl:border-r">
        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`px-2 py-0.5 text-xs font-semibold rounded ${isInc ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'}`}>
              {isInc ? t('agentConsole.ticketType.incident') : t('agentConsole.ticketType.serviceRequest')}
            </span>
            <span className="font-mono text-sm font-semibold text-foreground truncate">{tk.id}</span>
          </div>
          <button onClick={() => setSelectedTicket(null)} className="p-1.5 hover:bg-accent rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Panel body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Title + badges */}
          <div>
            <h2 className="text-lg font-bold text-foreground">{tk.title}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusBadgeColor(tk.type, tk.status)}`}>
                {statusText(tk.type, tk.status)}
              </span>
              <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${priorityBadge(tk.priority)}`}>
                {prioText(tk.priority)}
              </span>
            </div>
          </div>

          {/* Description (incident only) */}
          {isInc && inc?.description && (
            <div className="bg-muted rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-1">{t('agentConsole.detail.description')}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{inc.description}</p>
            </div>
          )}

          {/* Form data (SR only) */}
          {sr && sr.form_data && Object.keys(sr.form_data).length > 0 && (
            <div className="bg-muted rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-2">{t('agentConsole.detail.formData')}</h3>
              <div className="space-y-1.5">
                {Object.entries(sr.form_data).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-foreground font-medium truncate max-w-[200px]">{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meta info */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{t('agentConsole.detail.requester')}:</span>
              <span className="text-foreground font-medium">{tk.requester.name}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Building className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{t('agentConsole.detail.department')}:</span>
              <span className="text-foreground font-medium">{tk.requester.department}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{t('agentConsole.detail.assignedTo')}:</span>
              <span className="text-foreground font-medium">{tk.assignedTo || t('agentConsole.detail.unassigned')}</span>
            </div>
            {isInc && (
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">SLA:</span>
                {tk.slaBreach ? (
                  <span className="text-red-600 font-medium">{t('agentConsole.detail.slaBreached')}</span>
                ) : (
                  <span className="text-foreground font-medium">
                    {tk.slaRemaining !== undefined ? formatSLATime(tk.slaRemaining) : '-'}
                  </span>
                )}
              </div>
            )}
            {sr?.approval_status && (
              <div className="flex items-center gap-3 text-sm">
                <ShieldCheck className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{t('agentConsole.detail.approvals')}:</span>
                <span className="text-foreground font-medium">
                  {sr.approval_status.current_step}/{sr.approval_status.total_steps}
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">{t('agentConsole.detail.created')}:</span>
              <span className="text-foreground font-medium">{new Date(tk.createdAt).toLocaleString()}</span>
            </div>
          </div>

          {/* Timeline */}
          {isInc && inc?.timeline && inc.timeline.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <History className="w-4 h-4" />
                {t('agentConsole.detail.timeline')}
              </h3>
              <div className="space-y-2.5 max-h-48 overflow-y-auto">
                {inc.timeline.slice(0, 10).map((ev, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="w-1.5 h-1.5 mt-1.5 bg-blue-500 rounded-full shrink-0" />
                    <div>
                      <p className="text-foreground">{ev.event}</p>
                      <p className="text-xs text-muted-foreground">{ev.by_name || ev.by} • {new Date(ev.time).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sr?.timeline && sr.timeline.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <History className="w-4 h-4" />
                {t('agentConsole.detail.timeline')}
              </h3>
              <div className="space-y-2.5 max-h-48 overflow-y-auto">
                {sr.timeline.slice(0, 10).map((ev, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className="w-1.5 h-1.5 mt-1.5 bg-purple-500 rounded-full shrink-0" />
                    <div>
                      <p className="text-foreground">{ev.event}</p>
                      <p className="text-xs text-muted-foreground">{ev.by_name || ev.by} • {new Date(ev.time).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inline worklog form (incident) */}
          {isInc && showWorklogForm && (
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <Label>{t('agentConsole.worklog.timeSpent')}</Label>
              <input
                type="number"
                value={worklogMinutes}
                onChange={(e) => setWorklogMinutes(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-card text-sm"
              />
              <Label>{t('agentConsole.worklog.notes')}</Label>
              <Textarea
                value={worklogNote}
                onChange={(e) => setWorklogNote(e.target.value)}
                rows={3}
                placeholder={t('agentConsole.worklog.notesPlaceholder')}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddWorklog} disabled={addWorklog.isPending || !worklogNote.trim()}>
                  {addWorklog.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin ltr:mr-1 rtl:ml-1" />}
                  {t('agentConsole.actions.save')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowWorklogForm(false)}>
                  {t('agentConsole.actions.cancel')}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Panel actions */}
        <div className="border-t border-border px-5 py-4 shrink-0 space-y-2">
          {/* Assignment */}
          {!tk.assignedTo && (
            <Button className="w-full" onClick={() => handleAssignToMe(tk)} disabled={assignIncident.isPending || assignSR.isPending}>
              {(assignIncident.isPending || assignSR.isPending) && <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" />}
              <User className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
              {t('agentConsole.actions.assignToMe')}
            </Button>
          )}

          {/* Incident actions */}
          {isInc && inc && (
            <div className="flex flex-wrap gap-2">
              {inc.status === IncidentStatus.OPEN && (
                <Button size="sm" className="flex-1" onClick={() => handleIncidentStatus(tk, IncidentStatus.IN_PROGRESS)}>
                  <Play className="w-3.5 h-3.5 ltr:mr-1 rtl:ml-1" />{t('agentConsole.actions.startWork')}
                </Button>
              )}
              {inc.status === IncidentStatus.IN_PROGRESS && (
                <>
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleIncidentStatus(tk, IncidentStatus.PENDING)}>
                    <Pause className="w-3.5 h-3.5 ltr:mr-1 rtl:ml-1" />{t('agentConsole.actions.pending')}
                  </Button>
                  <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleIncidentStatus(tk, IncidentStatus.RESOLVED)}>
                    <CheckCircle className="w-3.5 h-3.5 ltr:mr-1 rtl:ml-1" />{t('agentConsole.actions.resolve')}
                  </Button>
                </>
              )}
              {inc.status === IncidentStatus.PENDING && (
                <Button size="sm" className="flex-1" onClick={() => handleIncidentStatus(tk, IncidentStatus.IN_PROGRESS)}>
                  <Play className="w-3.5 h-3.5 ltr:mr-1 rtl:ml-1" />{t('agentConsole.actions.resume')}
                </Button>
              )}
              {inc.status === IncidentStatus.RESOLVED && (
                <Button size="sm" variant="outline" className="flex-1" onClick={() => handleIncidentStatus(tk, IncidentStatus.CLOSED)}>
                  <Ban className="w-3.5 h-3.5 ltr:mr-1 rtl:ml-1" />{t('agentConsole.actions.close')}
                </Button>
              )}
              {[IncidentStatus.OPEN, IncidentStatus.IN_PROGRESS].includes(inc.status as IncidentStatus) && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setShowWorklogForm(!showWorklogForm)}>
                    <MessageSquare className="w-3.5 h-3.5 ltr:mr-1 rtl:ml-1" />{t('agentConsole.actions.worklog')}
                  </Button>
                  <Button size="sm" variant="outline" className="text-orange-600 border-orange-300 hover:bg-orange-50" onClick={() => setShowEscalateDialog(true)}>
                    <ArrowUpRight className="w-3.5 h-3.5 ltr:mr-1 rtl:ml-1" />{t('agentConsole.actions.escalate')}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* SR actions */}
          {!isInc && sr && (
            <div className="flex flex-wrap gap-2">
              {sr.status === ServiceRequestStatus.PENDING_APPROVAL && (
                <>
                  <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApproveSR(tk)} disabled={approveSR.isPending}>
                    {approveSR.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin ltr:mr-1 rtl:ml-1" />}
                    <CheckCircle className="w-3.5 h-3.5 ltr:mr-1 rtl:ml-1" />{t('agentConsole.actions.approve')}
                  </Button>
                  <Button size="sm" variant="destructive" className="flex-1" onClick={() => { setRejectReason(''); setShowRejectDialog(true); }}>
                    <XCircle className="w-3.5 h-3.5 ltr:mr-1 rtl:ml-1" />{t('agentConsole.actions.reject')}
                  </Button>
                </>
              )}
              {sr.status === ServiceRequestStatus.APPROVED && (
                <Button size="sm" className="flex-1" onClick={() => handleStartWorkSR(tk)} disabled={updateSRStatus.isPending}>
                  {updateSRStatus.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin ltr:mr-1 rtl:ml-1" />}
                  <Play className="w-3.5 h-3.5 ltr:mr-1 rtl:ml-1" />{t('agentConsole.actions.startWork')}
                </Button>
              )}
              {sr.status === ServiceRequestStatus.IN_PROGRESS && (
                <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => { setFulfillNotes(''); setShowFulfillDialog(true); }}>
                  <Send className="w-3.5 h-3.5 ltr:mr-1 rtl:ml-1" />{t('agentConsole.actions.fulfill')}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // Main render
  // ═══════════════════════════════════════════════════════════════
  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
              <Headset className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {t('agentConsole.title')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('agentConsole.welcome').replace('{name}', user?.name || '')}
                {' • '}
                {t('agentConsole.activeTickets').replace('{count}', String(tabCounts.my))}
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refreshAll}>
            <RefreshCw className="w-4 h-4 ltr:mr-2 rtl:ml-2" />
            {t('agentConsole.refresh')}
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
            <p className="text-blue-100 text-xs font-medium uppercase">{t('agentConsole.stats.openIncidents')}</p>
            <p className="text-2xl font-bold mt-1">{(incStats as { open?: number } | undefined)?.open || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white">
            <p className="text-red-100 text-xs font-medium uppercase">{t('agentConsole.stats.slaBreached')}</p>
            <p className="text-2xl font-bold mt-1">{(incStats as { breached?: number } | undefined)?.breached || 0}</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4 text-white">
            <p className="text-yellow-100 text-xs font-medium uppercase">{t('agentConsole.stats.pendingApproval')}</p>
            <p className="text-2xl font-bold mt-1">{tabCounts.approval}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
            <p className="text-purple-100 text-xs font-medium uppercase">{t('agentConsole.stats.unassigned')}</p>
            <p className="text-2xl font-bold mt-1">{tabCounts.unassigned}</p>
          </div>
        </div>

        {/* Queue tabs */}
        <div className="border-b border-border">
          <nav className="flex gap-1 overflow-x-auto -mb-px">
            {(Object.keys(tabMeta) as QueueTab[]).map((tab) => {
              const meta = tabMeta[tab];
              const Icon = meta.icon;
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t(meta.labelKey)}
                  {tabCounts[tab] > 0 && (
                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                      isActive ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-muted text-muted-foreground'
                    }`}>
                      {tabCounts[tab]}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Ticket table */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          {tickets.length === 0 ? (
            <div className="py-16 text-center">
              <Inbox className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">
                {t('agentConsole.noTickets')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase rtl:text-right">{t('agentConsole.table.id')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase rtl:text-right">{t('agentConsole.table.type')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase rtl:text-right">{t('agentConsole.table.title')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase rtl:text-right">{t('agentConsole.table.status')}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase rtl:text-right">{t('agentConsole.table.priority')}</th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase rtl:text-right">{t('agentConsole.table.requester')}</th>
                    <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase rtl:text-right">{t('agentConsole.table.assigned')}</th>
                    <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase rtl:text-right">{t('agentConsole.table.created')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tickets.map((ticket) => (
                    <tr
                      key={`${ticket.type}-${ticket.id}`}
                      onClick={() => { setSelectedTicket(ticket); setShowWorklogForm(false); }}
                      className={`hover:bg-accent cursor-pointer transition-colors ${
                        selectedTicket?.id === ticket.id && selectedTicket?.type === ticket.type ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm font-mono font-medium text-indigo-600 dark:text-indigo-400">{ticket.id}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          ticket.type === 'incident'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                        }`}>
                          {ticket.type === 'incident' ? t('agentConsole.ticketType.incidentShort') : t('agentConsole.ticketType.serviceRequestShort')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-foreground truncate block max-w-[200px]">{ticket.title}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusBadgeColor(ticket.type, ticket.status)}`}>
                          {statusText(ticket.type, ticket.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${priorityBadge(ticket.priority)}`}>
                          {prioText(ticket.priority)}
                        </span>
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">{ticket.requester.name}</td>
                      <td className="hidden lg:table-cell px-4 py-3 whitespace-nowrap text-sm">
                        {ticket.assignedTo ? (
                          <span className="text-muted-foreground">{ticket.assignedTo}</span>
                        ) : (
                          <span className="text-muted-foreground italic">{t('agentConsole.detail.unassigned')}</span>
                        )}
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Slide-over detail panel */}
      {selectedTicket && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSelectedTicket(null)} />
          {renderDetailPanel()}
        </>
      )}

      {/* ── Reject Dialog ── */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('agentConsole.dialogs.rejectRequest')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>{t('agentConsole.dialogs.rejectionReason')}</Label>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder={t('agentConsole.dialogs.rejectionPlaceholder')} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>{t('agentConsole.actions.cancel')}</Button>
            <Button variant="destructive" onClick={handleRejectSR} disabled={approveSR.isPending}>
              {approveSR.isPending && <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" />}
              {t('agentConsole.actions.reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Fulfill Dialog ── */}
      <Dialog open={showFulfillDialog} onOpenChange={setShowFulfillDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('agentConsole.dialogs.fulfillRequest')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>{t('agentConsole.dialogs.fulfillmentNotes')}</Label>
            <Textarea value={fulfillNotes} onChange={(e) => setFulfillNotes(e.target.value)} rows={3} placeholder={t('agentConsole.dialogs.fulfillmentPlaceholder')} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFulfillDialog(false)}>{t('agentConsole.actions.cancel')}</Button>
            <Button onClick={handleFulfillSR} disabled={fulfillSR.isPending}>
              {fulfillSR.isPending && <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" />}
              {t('agentConsole.actions.fulfill')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Escalate Dialog ── */}
      <Dialog open={showEscalateDialog} onOpenChange={setShowEscalateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('agentConsole.dialogs.escalateIncident')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label>{t('agentConsole.dialogs.escalationReason')}</Label>
            <Textarea value={escalateReason} onChange={(e) => setEscalateReason(e.target.value)} rows={3} placeholder={t('agentConsole.dialogs.escalationPlaceholder')} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEscalateDialog(false)}>{t('agentConsole.actions.cancel')}</Button>
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={handleEscalate} disabled={escalateIncident.isPending}>
              {escalateIncident.isPending && <Loader2 className="w-4 h-4 animate-spin ltr:mr-2 rtl:ml-2" />}
              {t('agentConsole.actions.escalate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
