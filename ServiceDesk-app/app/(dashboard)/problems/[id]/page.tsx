'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useProblem, useUpdateProblemStatus, useUpdateRootCause, useStartRCA, useCompleteRCA, usePublishKnownError } from '@/hooks/useProblems';
import { IProblem, ProblemStatus, RCAMethod, getPriorityColor } from '@/types/itsm';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
 ArrowLeft, 
 Clock, 
 User, 
 Tag, 
 AlertTriangle,
 Lightbulb,
 History,
 FileQuestion,
 Play,
 CheckCircle,
 BookOpen,
 ChevronRight,
 Search,
} from 'lucide-react';
import Link from 'next/link';

const RCA_STEPS: { status: ProblemStatus; label: string; desc: string }[] = [
 { status: ProblemStatus.LOGGED, label: 'Logged', desc: 'Problem recorded' },
 { status: ProblemStatus.RCA_IN_PROGRESS, label: 'RCA', desc: 'Root cause analysis' },
 { status: ProblemStatus.KNOWN_ERROR, label: 'Known Error', desc: 'Published to KB' },
 { status: ProblemStatus.RESOLVED, label: 'Resolved', desc: 'Permanent fix applied' },
 { status: ProblemStatus.CLOSED, label: 'Closed', desc: 'Problem closed' },
];

const getStatusColor = (status: ProblemStatus): string => {
 const colors: Record<ProblemStatus, string> = {
 [ProblemStatus.LOGGED]: 'bg-brand-soft text-brand dark:bg-brand dark:text-brand',
 [ProblemStatus.RCA_IN_PROGRESS]: 'bg-warning-soft text-warning',
 [ProblemStatus.KNOWN_ERROR]: 'bg-info-soft text-info dark:bg-info',
 [ProblemStatus.RESOLVED]: 'bg-success-soft text-success',
 [ProblemStatus.CLOSED]: 'bg-muted text-foreground dark:bg-foreground/80 dark:text-muted-foreground',
 };
 return colors[status] || 'bg-muted text-foreground';
};

export default function ProblemDetailPage() {
 const { t } = useLanguage();
 const params = useParams();
 const router = useRouter();
 const problemId = params.id as string;
 
 const { data: problem, isLoading, error } = useProblem(problemId);
 const updateStatus = useUpdateProblemStatus();
 const updateRootCause = useUpdateRootCause();
 const startRCA = useStartRCA();
 const completeRCA = useCompleteRCA();
 const publishKnownError = usePublishKnownError();

 const [showRCAForm, setShowRCAForm] = useState(false);
 const [rcaData, setRcaData] = useState({ root_cause: '', workaround: '' });

 const [showStartRCAModal, setShowStartRCAModal] = useState(false);
 const [selectedRCAMethod, setSelectedRCAMethod] = useState<RCAMethod>(RCAMethod.FIVE_WHYS);
 const RCA_METHODS: { value: RCAMethod; label: string }[] = [
 { value: RCAMethod.FIVE_WHYS, label: '5 Whys' },
 { value: RCAMethod.FISHBONE, label: 'Fishbone (Ishikawa)' },
 { value: RCAMethod.TIMELINE, label: 'Timeline Analysis' },
 { value: RCAMethod.FAULT_TREE, label: 'Fault Tree Analysis' },
 ];

 const [showCompleteRCAPanel, setShowCompleteRCAPanel] = useState(false);
 const [completeRCAData, setCompleteRCAData] = useState({ rca_findings: '', root_cause: '', contributing_factors: '' });

 const [showPublishKEPanel, setShowPublishKEPanel] = useState(false);
 const [keData, setKEData] = useState({ title: '', symptoms: '', workaround: '' });

 const handleStatusChange = (newStatus: ProblemStatus) => {
 if (!problem) return;
 updateStatus.mutate({ problemId: problem.problem_id, status: newStatus });
 };

 const handleUpdateRCA = () => {
 if (!problem || !rcaData.root_cause.trim()) return;
 updateRootCause.mutate(
 { problemId: problem.problem_id, root_cause: rcaData.root_cause, workaround: rcaData.workaround },
 { onSuccess: () => { setRcaData({ root_cause: '', workaround: '' }); setShowRCAForm(false); } }
 );
 };

 const handleStartRCA = () => {
 if (!problem) return;
 startRCA.mutate(
 { problemId: problem.problem_id, rca_method: selectedRCAMethod },
 { onSuccess: () => { setShowStartRCAModal(false); } }
 );
 };

 const handleCompleteRCA = () => {
 if (!problem || !completeRCAData.rca_findings.trim() || !completeRCAData.root_cause.trim()) return;
 completeRCA.mutate(
 {
 problemId: problem.problem_id,
 rca_findings: completeRCAData.rca_findings,
 root_cause: completeRCAData.root_cause,
 contributing_factors: completeRCAData.contributing_factors
 ? completeRCAData.contributing_factors.split('\n').filter(Boolean)
 : undefined,
 },
 { onSuccess: () => setShowCompleteRCAPanel(false) }
 );
 };

 const handlePublishKE = () => {
 if (!problem || !keData.title.trim()) return;
 publishKnownError.mutate(
 { problemId: problem.problem_id, title: keData.title, symptoms: keData.symptoms, workaround: keData.workaround },
 { onSuccess: () => setShowPublishKEPanel(false) }
 );
 };

 if (isLoading) {
 return (
 <DashboardLayout>
 <div className="flex items-center justify-center h-64">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
 </div>
 </DashboardLayout>
 );
 }

 if (error || !problem) {
 return (
 <DashboardLayout>
 <div className="text-center py-12">
 <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
 <h2 className="text-xl font-semibold text-foreground">{t('problems.notFound')}</h2>
 <p className="text-muted-foreground mt-2">{t('problems.notFoundDesc')}</p>
 <Link href="/problems" className="mt-4 inline-block text-brand hover:underline">
 {t('problems.backToProblems')}
 </Link>
 </div>
 </DashboardLayout>
 );
 }

 const problemData = problem as IProblem;
 const currentStepIdx = RCA_STEPS.findIndex((s) => s.status === problemData.status);

 return (
 <DashboardLayout>
 <div className="space-y-6">
 {/* Header */}
 <div className="flex items-start justify-between flex-wrap gap-4">
 <div className="flex items-start gap-4">
 <button onClick={() => router.back()} className="p-2 hover:bg-accent rounded-lg">
 <ArrowLeft className="w-5 h-5" />
 </button>
 <div>
 <div className="flex items-center gap-3 flex-wrap">
 <h1 className="text-2xl font-bold text-foreground">{problemData.problem_id}</h1>
 {problemData.known_error && (
 <span className="px-2 py-1 text-xs font-bold bg-info-soft text-info rounded-full flex items-center gap-1">
 <Lightbulb className="w-3 h-3" /> {t('problems.knownError')}
 </span>
 )}
 </div>
 <p className="text-muted-foreground mt-1">{problemData.title}</p>
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

 {/* RCA Status Stepper */}
 <Card className="p-5">
 <div className="flex items-center">
 {RCA_STEPS.map((step, idx) => {
 const done = idx < currentStepIdx;
 const active = idx === currentStepIdx;
 return (
 <div key={step.status} className="flex items-center flex-1">
 <div className="flex flex-col items-center">
 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
 done ? 'bg-success text-success-foreground' :
 active ? 'bg-brand text-brand-foreground ring-4 ring-brand-border' :
 'bg-muted text-muted-foreground'
 }`}>
 {done ? <CheckCircle className="w-4 h-4" /> : idx + 1}
 </div>
 <p className={`text-xs font-medium mt-1 whitespace-nowrap ${active ? 'text-brand' : done ? 'text-success' : 'text-muted-foreground'}`}>{step.label}</p>
 </div>
 {idx < RCA_STEPS.length - 1 && (
 <div className={`flex-1 h-0.5 mx-1 ${idx < currentStepIdx ? 'bg-success' : 'bg-muted'}`} />
 )}
 </div>
 );
 })}
 </div>
 </Card>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 {/* Main Content */}
 <div className="lg:col-span-2 space-y-6">
 {/* Description */}
 <Card className="p-6">
 <h2 className="text-lg font-semibold text-foreground mb-4">{t('incidents.form.description')}</h2>
 <p className="text-muted-foreground whitespace-pre-wrap">{problemData.description}</p>
 </Card>

 {/* RCA Workflow Panel */}
 <Card className="p-6">
 <div className="flex items-center justify-between mb-5">
 <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
 <Search className="w-5 h-5 text-warning" /> Root Cause Analysis
 </h2>
 {problemData.status === ProblemStatus.RCA_IN_PROGRESS && !showCompleteRCAPanel && (
 <button onClick={() => setShowCompleteRCAPanel(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-warning text-warning-foreground rounded-lg text-sm hover:bg-warning/70">
 <CheckCircle className="w-4 h-4" /> Complete RCA
 </button>
 )}
 {problemData.status === ProblemStatus.RCA_IN_PROGRESS && !problemData.root_cause && !showCompleteRCAPanel && (
 <button onClick={() => setShowRCAForm(!showRCAForm)} className="text-sm text-brand hover:underline">+ {t('common.add')}</button>
 )}
 </div>

 {/* Inline Complete RCA Form */}
 {showCompleteRCAPanel && (
 <div className="mb-5 p-4 bg-warning-soft rounded-xl border border-warning/30 dark:border-warning space-y-3">
 <p className="text-sm font-semibold text-warning">Complete RCA — document findings</p>
 <textarea value={completeRCAData.rca_findings} onChange={(e) => setCompleteRCAData((d) => ({ ...d, rca_findings: e.target.value }))} rows={3} placeholder="Summary of RCA findings..." className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card" />
 <textarea value={completeRCAData.root_cause} onChange={(e) => setCompleteRCAData((d) => ({ ...d, root_cause: e.target.value }))} rows={2} placeholder="Root cause statement..." className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card" />
 <textarea value={completeRCAData.contributing_factors} onChange={(e) => setCompleteRCAData((d) => ({ ...d, contributing_factors: e.target.value }))} rows={2} placeholder="Contributing factors (one per line)..." className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card" />
 <div className="flex gap-2">
 <button onClick={handleCompleteRCA} disabled={completeRCA.isPending || !completeRCAData.rca_findings.trim() || !completeRCAData.root_cause.trim()} className="px-4 py-2 bg-warning text-warning-foreground rounded-lg text-sm disabled:opacity-50">{completeRCA.isPending ? 'Saving...' : 'Save & Complete RCA'}</button>
 <Button variant="outline" size="sm" onClick={() => setShowCompleteRCAPanel(false)}>Cancel</Button>
 </div>
 </div>
 )}

 {showRCAForm && (
 <div className="mb-4 p-4 bg-muted rounded-lg space-y-3">
 <textarea value={rcaData.root_cause} onChange={(e) => setRcaData({ ...rcaData, root_cause: e.target.value })} rows={3} className="w-full px-3 py-2 border border-input rounded-lg bg-card text-sm" placeholder={t('problems.form.rootCausePlaceholder')} />
 <textarea value={rcaData.workaround} onChange={(e) => setRcaData({ ...rcaData, workaround: e.target.value })} rows={2} className="w-full px-3 py-2 border border-input rounded-lg bg-card text-sm" placeholder={t('problems.form.workaroundPlaceholder')} />
 <div className="flex gap-2">
 <Button size="sm" onClick={handleUpdateRCA} disabled={updateRootCause.isPending}>{updateRootCause.isPending ? t('common.loading') : t('common.save')}</Button>
 <Button variant="outline" size="sm" onClick={() => setShowRCAForm(false)}>{t('common.cancel')}</Button>
 </div>
 </div>
 )}

 {problemData.root_cause ? (
 <div className="space-y-4">
 <div>
 <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t('problems.rootCause')}</h3>
 <p className="text-muted-foreground text-sm">{problemData.root_cause}</p>
 </div>
 {problemData.rca_findings && (
 <div>
 <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">RCA Findings</h3>
 <p className="text-muted-foreground text-sm">{problemData.rca_findings}</p>
 </div>
 )}
 {problemData.contributing_factors && problemData.contributing_factors.length > 0 && (
 <div>
 <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Contributing Factors</h3>
 <ul className="space-y-1">
 {problemData.contributing_factors.map((f, i) => (
 <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
 <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" /> {f}
 </li>
 ))}
 </ul>
 </div>
 )}
 {problemData.workaround && (
 <div>
 <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">{t('problems.workaround')}</h3>
 <p className="text-muted-foreground text-sm">{problemData.workaround}</p>
 </div>
 )}
 {problemData.permanent_fix && (
 <div>
 <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Permanent Fix</h3>
 <p className="text-muted-foreground text-sm">{problemData.permanent_fix}</p>
 </div>
 )}
 </div>
 ) : (
 <p className="text-muted-foreground text-center py-4 text-sm">{t('problems.noRootCause')}</p>
 )}
 </Card>

 {/* Publish Known Error Panel */}
 {problemData.status === ProblemStatus.RCA_IN_PROGRESS && problemData.root_cause && (
 <div className="bg-info-soft dark:bg-info-soft rounded-xl border border-info/20 dark:border-info/70 p-6">
 <div className="flex items-center justify-between mb-4">
 <h2 className="font-semibold text-info dark:text-info/50 flex items-center gap-2">
 <BookOpen className="w-5 h-5" /> Publish as Known Error
 </h2>
 {!showPublishKEPanel && (
 <button onClick={() => setShowPublishKEPanel(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-info text-white rounded-lg text-sm hover:bg-info">
 <BookOpen className="w-4 h-4" /> Publish to KB
 </button>
 )}
 </div>
 {showPublishKEPanel && (
 <div className="space-y-3">
 <input type="text" value={keData.title} onChange={(e) => setKEData((d) => ({ ...d, title: e.target.value }))} placeholder="Known Error title..." className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card" />
 <textarea value={keData.symptoms} onChange={(e) => setKEData((d) => ({ ...d, symptoms: e.target.value }))} rows={2} placeholder="Symptoms / how to identify..." className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card" />
 <textarea value={keData.workaround} onChange={(e) => setKEData((d) => ({ ...d, workaround: e.target.value }))} rows={2} placeholder="Workaround steps..." className="w-full px-3 py-2 border border-input rounded-lg text-sm bg-card" />
 <div className="flex gap-2">
 <button onClick={handlePublishKE} disabled={publishKnownError.isPending || !keData.title.trim()} className="px-4 py-2 bg-info text-white rounded-lg text-sm disabled:opacity-50">{publishKnownError.isPending ? 'Publishing...' : 'Publish'}</button>
 <Button variant="outline" size="sm" onClick={() => setShowPublishKEPanel(false)}>Cancel</Button>
 </div>
 </div>
 )}
 {!showPublishKEPanel && (
 <p className="text-sm text-info">Root cause identified — publish a Known Error record to the KB so support teams can reference it.</p>
 )}
 </div>
 )}

 {/* Recurring Incidents Banner */}
 {problemData.recurring_incidents && problemData.recurring_incidents.length > 0 && (
 <div className="bg-destructive-soft rounded-xl border border-destructive/30 dark:border-destructive p-5">
 <h3 className="font-semibold text-destructive flex items-center gap-2 mb-3">
 <AlertTriangle className="w-5 h-5" /> Recurring Incidents ({problemData.recurring_incidents.length})
 </h3>
 <div className="space-y-2">
 {problemData.recurring_incidents.map((inc) => (
 <Link key={inc.incident_id} href={`/incidents/${inc.incident_id}`} className="flex items-center justify-between p-3 bg-card rounded-lg border border-destructive/30 dark:border-destructive hover:border-destructive/60 transition-colors">
 <div>
 <span className="font-medium text-sm text-brand">{inc.incident_id}</span>
 {inc.title && <span className="text-xs text-muted-foreground ml-2 truncate">{inc.title}</span>}
 </div>
 <ChevronRight className="w-4 h-4 text-muted-foreground" />
 </Link>
 ))}
 </div>
 </div>
 )}

 {/* Timeline */}
 <Card className="p-6">
 <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
 <History className="w-5 h-5" /> {t('incidents.timeline')}
 </h2>
 {problemData.timeline && problemData.timeline.length > 0 ? (
 <div className="relative">
 <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" />
 <div className="space-y-5 pl-8">
 {problemData.timeline.map((event, index) => (
 <div key={index} className="relative">
 <div className="absolute -left-5 top-1 w-3 h-3 bg-brand rounded-full border-2 border-card" />
 <p className="text-foreground text-sm font-medium">{event.event}</p>
 <p className="text-xs text-muted-foreground">{event.by_name || event.by} • {new Date(event.time).toLocaleString()}</p>
 </div>
 ))}
 </div>
 </div>
 ) : (
 <p className="text-muted-foreground text-center py-4 text-sm">{t('incidents.noTimeline')}</p>
 )}
 </Card>
 </div>

 {/* Sidebar */}
 <div className="space-y-5">
 {/* Details */}
 <Card className="p-5">
 <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">{t('common.details')}</h3>
 <div className="space-y-3 text-sm">
 <div className="flex items-start gap-3">
 <User className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
 <div>
 <p className="text-xs text-muted-foreground">{t('problems.owner')}</p>
 <p className="font-medium text-foreground">{problemData.owner.name}</p>
 <p className="text-xs text-muted-foreground">{problemData.owner.email}</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <Tag className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
 <div>
 <p className="text-xs text-muted-foreground">{t('common.category')}</p>
 <p className="font-medium text-foreground">{problemData.category_id}</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <FileQuestion className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
 <div>
 <p className="text-xs text-muted-foreground">{t('problems.linkedIncidents')}</p>
 <p className="font-medium text-foreground">{problemData.linked_incidents?.length || 0} incidents</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
 <div>
 <p className="text-xs text-muted-foreground">{t('common.createdAt')}</p>
 <p className="font-medium text-foreground">{new Date(problemData.created_at).toLocaleString()}</p>
 </div>
 </div>
 {problemData.rca_method && (
 <div className="flex items-start gap-3">
 <Search className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
 <div>
 <p className="text-xs text-muted-foreground">RCA Method</p>
 <p className="font-medium text-foreground capitalize">{problemData.rca_method.replace('_', ' ')}</p>
 </div>
 </div>
 )}
 </div>
 </Card>

 {/* Actions */}
 <Card className="p-5">
 <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">{t('common.actions')}</h3>
 <div className="space-y-2">
 {problemData.status === ProblemStatus.LOGGED && (
 <button onClick={() => setShowStartRCAModal(true)} className="w-full px-4 py-2 bg-warning text-warning-foreground rounded-lg hover:bg-warning/70 text-sm flex items-center justify-center gap-2">
 <Play className="w-4 h-4" /> {t('problems.startRCA')}
 </button>
 )}
 {problemData.status === ProblemStatus.RCA_IN_PROGRESS && (
 <button onClick={() => setShowCompleteRCAPanel(true)} className="w-full px-4 py-2 bg-warning text-warning-foreground rounded-lg hover:bg-warning/70 text-sm flex items-center justify-center gap-2">
 <CheckCircle className="w-4 h-4" /> Complete RCA
 </button>
 )}
 {problemData.status === ProblemStatus.RCA_IN_PROGRESS && problemData.root_cause && (
 <button onClick={() => setShowPublishKEPanel(true)} className="w-full px-4 py-2 bg-info text-white rounded-lg hover:bg-info text-sm flex items-center justify-center gap-2">
 <BookOpen className="w-4 h-4" /> {t('problems.markAsKnownError')}
 </button>
 )}
 {(problemData.status === ProblemStatus.RCA_IN_PROGRESS || problemData.status === ProblemStatus.KNOWN_ERROR) && (
 <button onClick={() => handleStatusChange(ProblemStatus.RESOLVED)} className="w-full px-4 py-2 bg-success text-success-foreground rounded-lg hover:bg-success/80 text-sm">
 {t('problems.resolveProblem')}
 </button>
 )}
 {problemData.status === ProblemStatus.RESOLVED && (
 <button onClick={() => handleStatusChange(ProblemStatus.CLOSED)} className="w-full px-4 py-2 bg-muted-foreground/70 text-background rounded-lg hover:bg-foreground/80 text-sm">
 {t('common.close')}
 </button>
 )}
 </div>
 </Card>
 </div>
 </div>
 </div>

 {/* Start RCA Modal */}
 {showStartRCAModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
 <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md p-6">
 <div className="flex items-center gap-3 mb-5">
 <div className="w-10 h-10 bg-warning-soft rounded-full flex items-center justify-center">
 <Play className="w-5 h-5 text-warning" />
 </div>
 <h2 className="text-lg font-bold text-foreground">Start Root Cause Analysis</h2>
 </div>
 <div className="space-y-4">
 <div>
 <label className="block text-sm font-medium text-foreground mb-2">RCA Method</label>
 <div className="grid grid-cols-2 gap-2">
 {RCA_METHODS.map((m) => (
 <button
 key={m.value}
 onClick={() => setSelectedRCAMethod(m.value)}
 className={`p-3 rounded-lg border-2 text-left text-sm transition-all ${
 selectedRCAMethod === m.value
 ? 'border-warning/60 bg-warning-soft font-semibold text-warning'
 : 'border-border text-muted-foreground hover:border-muted-foreground'
 }`}
 >
 {m.label}
 </button>
 ))}
 </div>
 </div>
 <div className="flex gap-3 pt-2">
 <button
 onClick={handleStartRCA}
 disabled={startRCA.isPending}
 className="flex-1 px-4 py-2.5 bg-warning text-warning-foreground rounded-lg hover:bg-warning/70 font-medium disabled:opacity-50"
 >
 {startRCA.isPending ? 'Starting...' : 'Start RCA'}
 </button>
 <button
 onClick={() => setShowStartRCAModal(false)}
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
