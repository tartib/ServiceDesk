'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePIR, useUpdatePIR, useAddFollowUpAction, useCompleteFollowUpAction, useSubmitPIR, useCompletePIR } from '@/hooks/usePIR';
import { IPIR, PIRStatus, RCAMethod } from '@/types/itsm';
import {
 ArrowLeft, ClipboardList, CheckCircle, Clock, FileText, Plus,
 User, Calendar, AlertTriangle, ChevronRight, Lightbulb, Target, ThumbsUp, ThumbsDown,
} from 'lucide-react';

const RCA_METHODS: { value: RCAMethod; label: string }[] = [
 { value: RCAMethod.FIVE_WHYS, label: '5 Whys' },
 { value: RCAMethod.FISHBONE, label: 'Fishbone (Ishikawa)' },
 { value: RCAMethod.TIMELINE, label: 'Timeline Analysis' },
 { value: RCAMethod.FAULT_TREE, label: 'Fault Tree Analysis' },
];

const STATUS_BADGE: Record<PIRStatus, string> = {
 [PIRStatus.DRAFT]: 'bg-muted text-muted-foreground',
 [PIRStatus.IN_REVIEW]: 'bg-brand-soft text-brand',
 [PIRStatus.COMPLETED]: 'bg-success-soft text-success',
};

export default function PIRDetailPage() {
 const params = useParams();
 const router = useRouter();
 const pirId = params.pirId as string;

 const { data: pir, isLoading, error } = usePIR(pirId);
 const updatePIR = useUpdatePIR();
 const addAction = useAddFollowUpAction();
 const completeAction = useCompleteFollowUpAction();
 const submitPIR = useSubmitPIR();
 const completePIR = useCompletePIR();

 const [activeTab, setActiveTab] = useState<'overview' | 'rca' | 'actions' | 'participants'>('overview');
 const [editing, setEditing] = useState(false);
 const [form, setForm] = useState<Partial<IPIR>>({});
 const [newAction, setNewAction] = useState({ description: '', owner_name: '', due_date: '' });
 const [showAddAction, setShowAddAction] = useState(false);

 if (isLoading) {
 return (
 <DashboardLayout>
 <div className="flex items-center justify-center h-64">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
 </div>
 </DashboardLayout>
 );
 }

 if (error || !pir) {
 return (
 <DashboardLayout>
 <div className="text-center py-16">
 <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-3" />
 <h2 className="text-xl font-semibold text-foreground">PIR Not Found</h2>
 <Link href="/pirs" className="mt-4 inline-block text-brand hover:underline">← Back to PIRs</Link>
 </div>
 </DashboardLayout>
 );
 }

 const pirData = pir as IPIR;
 const isEditable = pirData.status !== PIRStatus.COMPLETED;
 const openActions = pirData.follow_up_actions?.filter((a) => a.status !== 'completed').length ?? 0;

 const handleSave = () => {
 updatePIR.mutate({ pirId, data: form }, { onSuccess: () => setEditing(false) });
 };

 const handleAddAction = () => {
 if (!newAction.description.trim()) return;
 addAction.mutate(
 { pirId, action: newAction },
 { onSuccess: () => { setNewAction({ description: '', owner_name: '', due_date: '' }); setShowAddAction(false); } }
 );
 };

 const handleCompleteAction = (actionId: string) => {
 completeAction.mutate({ pirId, actionId });
 };

 const handleSubmit = () => submitPIR.mutate(pirId);
 const handleComplete = () => completePIR.mutate(pirId);

 return (
 <DashboardLayout>
 <div className="space-y-6">
 {/* Header */}
 <div className="flex items-start justify-between flex-wrap gap-4">
 <div className="flex items-start gap-4">
 <button onClick={() => router.back()} className="p-2 hover:bg-accent rounded-lg transition-colors">
 <ArrowLeft className="w-5 h-5" />
 </button>
 <div>
 <div className="flex items-center gap-3 flex-wrap">
 <div className="w-9 h-9 bg-info-soft rounded-lg flex items-center justify-center">
 <ClipboardList className="w-5 h-5 text-info" />
 </div>
 <h1 className="text-xl font-bold text-foreground">{pirData.pir_id}</h1>
 <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGE[pirData.status]}`}>
 {pirData.status.replace('_', ' ')}
 </span>
 </div>
 {pirData.incident_title && (
 <p className="text-sm text-muted-foreground mt-1 ml-12">
 Re:{' '}
 <Link href={`/incidents/${pirData.incident_id}`} className="text-brand hover:underline">
 {pirData.incident_id} — {pirData.incident_title}
 </Link>
 </p>
 )}
 </div>
 </div>
 <div className="flex items-center gap-2">
 {isEditable && pirData.status === PIRStatus.DRAFT && (
 <Button onClick={handleSubmit} disabled={submitPIR.isPending}>
 {submitPIR.isPending ? 'Submitting...' : 'Submit for Review'}
 </Button>
 )}
 {pirData.status === PIRStatus.IN_REVIEW && (
 <button
 onClick={handleComplete}
 disabled={completePIR.isPending}
 className="px-4 py-2 bg-success text-success-foreground rounded-lg hover:bg-success/90 text-sm font-medium disabled:opacity-50"
 >
 {completePIR.isPending ? 'Completing...' : 'Mark Complete'}
 </button>
 )}
 </div>
 </div>

 {/* Progress Banner */}
 {openActions > 0 && (
 <div className="bg-warning-soft dark:bg-warning-soft border border-warning/20 dark:border-warning/80 rounded-xl p-4 flex items-center gap-3">
 <Clock className="w-5 h-5 text-warning shrink-0" />
 <p className="text-sm text-warning">
 <span className="font-semibold">{openActions} open action{openActions !== 1 ? 's' : ''}</span> remaining before PIR can be closed
 </p>
 </div>
 )}

 {/* Tabs */}
 <div className="border-b border-border">
 <nav className="flex gap-1">
 {(['overview', 'rca', 'actions', 'participants'] as const).map((tab) => (
 <button
 key={tab}
 onClick={() => setActiveTab(tab)}
 className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors capitalize ${
 activeTab === tab
 ? 'border-brand text-brand'
 : 'border-transparent text-muted-foreground hover:text-foreground'
 }`}
 >
 {tab === 'actions' ? `Actions (${pirData.follow_up_actions?.length ?? 0})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
 </button>
 ))}
 </nav>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 space-y-6">

 {/* OVERVIEW TAB */}
 {activeTab === 'overview' && (
 <div className="space-y-5">
 {/* Impact Summary */}
 <Card className="p-6">
 <div className="flex items-center justify-between mb-4">
 <h2 className="font-semibold text-foreground flex items-center gap-2">
 <Target className="w-4 h-4 text-info" /> Impact Summary
 </h2>
 {isEditable && !editing && (
 <button onClick={() => { setEditing(true); setForm({ impact_summary: pirData.impact_summary }); }} className="text-xs text-brand hover:underline">Edit</button>
 )}
 </div>
 {editing ? (
 <div className="space-y-3">
 <textarea
 value={form.impact_summary ?? ''}
 onChange={(e) => setForm((f) => ({ ...f, impact_summary: e.target.value }))}
 rows={4}
 className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card"
 placeholder="Describe the business and technical impact..."
 />
 <div className="flex gap-2">
 <Button size="sm" onClick={handleSave} disabled={updatePIR.isPending}>Save</Button>
 <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
 </div>
 </div>
 ) : (
 <p className="text-muted-foreground text-sm whitespace-pre-wrap">
 {pirData.impact_summary || <span className="text-muted-foreground/50 italic">Not yet filled in</span>}
 </p>
 )}
 </Card>

 {/* What Went Well / What Went Wrong */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="bg-success-soft rounded-xl border border-success/30 dark:border-success/80 p-5">
 <h3 className="font-semibold text-success flex items-center gap-2 mb-3 text-sm">
 <ThumbsUp className="w-4 h-4" /> What Went Well
 </h3>
 <p className="text-success text-sm whitespace-pre-wrap">
 {pirData.what_went_well || <span className="text-success/70 italic">Not filled in</span>}
 </p>
 </div>
 <div className="bg-destructive-soft rounded-xl border border-destructive/30 dark:border-destructive/80 p-5">
 <h3 className="font-semibold text-destructive flex items-center gap-2 mb-3 text-sm">
 <ThumbsDown className="w-4 h-4" /> What Went Wrong
 </h3>
 <p className="text-destructive text-sm whitespace-pre-wrap">
 {pirData.what_went_wrong || <span className="text-destructive/70 italic">Not filled in</span>}
 </p>
 </div>
 </div>

 {/* Timeline of Events */}
 <Card className="p-6">
 <h2 className="font-semibold text-foreground flex items-center gap-2 mb-4">
 <Clock className="w-4 h-4 text-brand" /> Timeline of Events
 </h2>
 <p className="text-muted-foreground text-sm whitespace-pre-wrap">
 {pirData.timeline_of_events || <span className="text-muted-foreground/50 italic">Not yet documented</span>}
 </p>
 </Card>
 </div>
 )}

 {/* RCA TAB */}
 {activeTab === 'rca' && (
 <div className="space-y-5">
 <Card className="p-6">
 <h2 className="font-semibold text-foreground flex items-center gap-2 mb-5">
 <Lightbulb className="w-4 h-4 text-warning" /> Root Cause Analysis
 </h2>
 <div className="space-y-5">
 <div>
 <label className="text-xs font-semibold text-muted-foreground uppercase">RCA Method</label>
 {isEditable ? (
 <select
 value={pirData.rca_method ?? ''}
 onChange={(e) => updatePIR.mutate({ pirId, data: { rca_method: e.target.value as RCAMethod } })}
 className="mt-1 block w-full px-3 py-2 border border-input rounded-lg bg-card text-sm"
 >
 <option value="">Select method...</option>
 {RCA_METHODS.map((m) => (
 <option key={m.value} value={m.value}>{m.label}</option>
 ))}
 </select>
 ) : (
 <p className="mt-1 text-sm text-muted-foreground capitalize">{pirData.rca_method?.replace('_', ' ') ?? '—'}</p>
 )}
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground uppercase">Root Cause</label>
 <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
 {pirData.root_cause || <span className="text-muted-foreground/50 italic">Not identified yet</span>}
 </p>
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground uppercase">Contributing Factors</label>
 {pirData.contributing_factors && pirData.contributing_factors.length > 0 ? (
 <ul className="mt-2 space-y-1">
 {pirData.contributing_factors.map((f, i) => (
 <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
 <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" /> {f}
 </li>
 ))}
 </ul>
 ) : (
 <p className="mt-1 text-sm text-muted-foreground/50 italic">No contributing factors listed</p>
 )}
 </div>
 <div>
 <label className="text-xs font-semibold text-muted-foreground uppercase">RCA Findings</label>
 <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
 {pirData.rca_findings || <span className="text-muted-foreground/50 italic">Not yet completed</span>}
 </p>
 </div>
 </div>
 </Card>
 </div>
 )}

 {/* ACTIONS TAB */}
 {activeTab === 'actions' && (
 <Card className="p-6">
 <div className="flex items-center justify-between mb-5">
 <h2 className="font-semibold text-foreground">Follow-up Actions</h2>
 {isEditable && (
 <Button size="sm" onClick={() => setShowAddAction(true)}>
 <Plus className="w-4 h-4" /> Add Action
 </Button>
 )}
 </div>

 {showAddAction && (
 <div className="mb-5 p-4 bg-muted rounded-xl border border-border space-y-3">
 <input
 type="text"
 value={newAction.description}
 onChange={(e) => setNewAction((a) => ({ ...a, description: e.target.value }))}
 placeholder="Action description..."
 className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card"
 />
 <div className="grid grid-cols-2 gap-3">
 <input
 type="text"
 value={newAction.owner_name}
 onChange={(e) => setNewAction((a) => ({ ...a, owner_name: e.target.value }))}
 placeholder="Assigned to..."
 className="px-3 py-2 border border-input rounded-lg text-sm bg-card"
 />
 <input
 type="date"
 value={newAction.due_date}
 onChange={(e) => setNewAction((a) => ({ ...a, due_date: e.target.value }))}
 className="px-3 py-2 border border-input rounded-lg text-sm bg-card"
 />
 </div>
 <div className="flex gap-2">
 <Button size="sm" onClick={handleAddAction} disabled={addAction.isPending}>Save Action</Button>
 <Button variant="outline" size="sm" onClick={() => setShowAddAction(false)}>Cancel</Button>
 </div>
 </div>
 )}

 {pirData.follow_up_actions && pirData.follow_up_actions.length > 0 ? (
 <div className="space-y-3">
 {pirData.follow_up_actions.map((action) => (
 <div key={action.action_id} className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
 action.status === 'completed'
 ? 'border-success/30 bg-success-soft'
 : 'border-border bg-muted'
 }`}>
 <button
 onClick={() => action.status !== 'completed' && handleCompleteAction(action.action_id)}
 className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
 action.status === 'completed'
 ? 'bg-success border-success text-success-foreground'
 : 'border-border hover:border-success'
 }`}
 >
 {action.status === 'completed' && <CheckCircle className="w-3 h-3" />}
 </button>
 <div className="flex-1">
 <p className={`text-sm font-medium ${action.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
 {action.description}
 </p>
 <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
 {action.owner_name && (
 <span className="flex items-center gap-1"><User className="w-3 h-3" /> {action.owner_name}</span>
 )}
 {action.due_date && (
 <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Due {new Date(action.due_date).toLocaleDateString()}</span>
 )}
 <span className={`px-2 py-0.5 rounded-full capitalize ${
 action.status === 'completed' ? 'bg-success-soft text-success' :
 action.status === 'in_progress' ? 'bg-brand-soft text-brand' :
 'bg-muted text-muted-foreground'
 }`}>{action.status.replace('_', ' ')}</span>
 </div>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="text-center py-10 text-muted-foreground">
 <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
 <p className="text-sm">No follow-up actions added yet</p>
 </div>
 )}
 </Card>
 )}

 {/* PARTICIPANTS TAB */}
 {activeTab === 'participants' && (
 <Card className="p-6">
 <h2 className="font-semibold text-foreground mb-5 flex items-center gap-2">
 <User className="w-4 h-4 text-brand" /> Participants
 </h2>
 {pirData.participants && pirData.participants.length > 0 ? (
 <div className="space-y-3">
 {pirData.participants.map((p) => (
 <div key={p.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
 <div className="w-9 h-9 bg-brand-surface rounded-full flex items-center justify-center text-sm font-semibold text-brand">
 {p.name.charAt(0).toUpperCase()}
 </div>
 <div>
 <p className="font-medium text-sm text-foreground">{p.name}</p>
 {p.role && <p className="text-xs text-muted-foreground">{p.role}</p>}
 </div>
 </div>
 ))}
 </div>
 ) : (
 <p className="text-center text-muted-foreground text-sm py-8">No participants listed</p>
 )}
 </Card>
 )}
 </div>

 {/* Sidebar */}
 <div className="space-y-5">
 <Card className="p-5">
 <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">PIR Info</h3>
 <div className="space-y-3 text-sm">
 <div className="flex justify-between">
 <span className="text-muted-foreground">Status</span>
 <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[pirData.status]}`}>
 {pirData.status.replace('_', ' ')}
 </span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Created by</span>
 <span className="text-foreground font-medium">{pirData.created_by?.name}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Review Date</span>
 <span className="text-foreground">
 {pirData.review_date ? new Date(pirData.review_date).toLocaleDateString() : '—'}
 </span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Actions</span>
 <span className="text-foreground">
 {(pirData.follow_up_actions?.filter((a) => a.status === 'completed').length ?? 0)} / {pirData.follow_up_actions?.length ?? 0} done
 </span>
 </div>
 <div className="flex justify-between">
 <span className="text-muted-foreground">Created</span>
 <span className="text-muted-foreground">{new Date(pirData.created_at).toLocaleDateString()}</span>
 </div>
 </div>
 </Card>

 <Card className="p-5">
 <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Linked Incident</h3>
 <Link
 href={`/incidents/${pirData.incident_id}`}
 className="flex items-center gap-2 p-3 bg-muted rounded-lg hover:bg-accent transition-colors group"
 >
 <FileText className="w-4 h-4 text-brand shrink-0" />
 <div className="flex-1 min-w-0">
 <p className="font-medium text-brand text-sm group-hover:underline truncate">{pirData.incident_id}</p>
 {pirData.incident_title && <p className="text-xs text-muted-foreground truncate">{pirData.incident_title}</p>}
 </div>
 <ChevronRight className="w-4 h-4 text-muted-foreground" />
 </Link>
 </Card>
 </div>
 </div>
 </div>
 </DashboardLayout>
 );
}
