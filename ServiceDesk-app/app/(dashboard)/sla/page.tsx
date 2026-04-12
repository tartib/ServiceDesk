'use client';

import { useMemo } from 'react';
import {
 Clock,
 CheckCircle,
 AlertTriangle,
 XCircle,
 Target,
 Calendar,
 TrendingUp,
 Shield,
} from 'lucide-react';
import { useSlaPolicies, useSlaStats, useSlaComplianceReport, ISlaPolicy } from '@/hooks/useSlaV2';
import { useLocale } from '@/hooks/useLocale';

export default function SLAStandalonePage() {
 const { t } = useLocale();

 const { data: policyData, isLoading } = useSlaPolicies();
 const { data: stats } = useSlaStats();
 const { data: compliance } = useSlaComplianceReport();

 const policies: ISlaPolicy[] = useMemo(() => policyData?.data || [], [policyData]);

 const formatTime = (minutes: number) => {
 if (minutes < 60) return `${minutes}m`;
 if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
 return `${(minutes / 1440).toFixed(1)}d`;
 };

 if (isLoading) {
 return (
 <div className="flex items-center justify-center h-64">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
 </div>
 );
 }

 return (
 <div className="flex flex-col h-full bg-background">
 {/* Header */}
 <div className="bg-card border-b border-border px-6 py-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <Target className="h-6 w-6 text-brand" />
 <h1 className="text-xl font-bold text-foreground">{t('nav.sla')}</h1>
 </div>
 </div>
 </div>

 {/* Content */}
 <div className="flex-1 overflow-y-auto p-6">
 {/* Stats Cards */}
 <div className="grid grid-cols-4 gap-4 mb-8">
 <div className="bg-card rounded-xl p-6 border border-border">
 <div className="flex items-center justify-between mb-4">
 <span className="text-sm text-muted-foreground">Total Policies</span>
 <div className="p-2 rounded-lg bg-brand-soft">
 <Target className="h-5 w-5 text-brand" />
 </div>
 </div>
 <p className="text-4xl font-bold text-foreground">{stats?.policies?.total || 0}</p>
 <p className="text-sm text-muted-foreground mt-1">Defined policies</p>
 </div>
 <div className="bg-card rounded-xl p-6 border border-border">
 <div className="flex items-center justify-between mb-4">
 <span className="text-sm text-muted-foreground">Active Policies</span>
 <div className="p-2 rounded-lg bg-success-soft">
 <CheckCircle className="h-5 w-5 text-success" />
 </div>
 </div>
 <p className="text-4xl font-bold text-success">{stats?.policies?.active || 0}</p>
 <p className="text-sm text-muted-foreground mt-1">Currently enforced</p>
 </div>
 <div className="bg-card rounded-xl p-6 border border-border">
 <div className="flex items-center justify-between mb-4">
 <span className="text-sm text-muted-foreground">Calendars</span>
 <div className="p-2 rounded-lg bg-info-soft">
 <Calendar className="h-5 w-5 text-info" />
 </div>
 </div>
 <p className="text-4xl font-bold text-info">{stats?.calendars?.total || 0}</p>
 <p className="text-sm text-muted-foreground mt-1">Business calendars</p>
 </div>
 <div className="bg-card rounded-xl p-6 border border-border">
 <div className="flex items-center justify-between mb-4">
 <span className="text-sm text-muted-foreground">Compliance</span>
 <div className="p-2 rounded-lg bg-success-soft">
 <Shield className="h-5 w-5 text-success" />
 </div>
 </div>
 <p className="text-4xl font-bold text-success">
 {compliance?.compliancePercent != null ? `${compliance.compliancePercent}%` : '—'}
 </p>
 <p className="text-sm text-muted-foreground mt-1">Last 30 days</p>
 </div>
 </div>

 {/* Compliance Summary */}
 {compliance && compliance.total > 0 && (
 <div className="grid grid-cols-3 gap-4 mb-8">
 <div className="bg-card rounded-xl p-5 border border-border">
 <div className="flex items-center gap-2 mb-2">
 <TrendingUp className="h-4 w-4 text-brand" />
 <span className="text-sm text-muted-foreground">Avg Response</span>
 </div>
 <p className="text-2xl font-bold text-foreground">{formatTime(compliance.avgResponseMinutes)}</p>
 </div>
 <div className="bg-card rounded-xl p-5 border border-border">
 <div className="flex items-center gap-2 mb-2">
 <Clock className="h-4 w-4 text-brand" />
 <span className="text-sm text-muted-foreground">Avg Resolution</span>
 </div>
 <p className="text-2xl font-bold text-foreground">{formatTime(compliance.avgResolutionMinutes)}</p>
 </div>
 <div className="bg-card rounded-xl p-5 border border-border">
 <div className="flex items-center gap-2 mb-2">
 <AlertTriangle className="h-4 w-4 text-destructive" />
 <span className="text-sm text-muted-foreground">Breaches (30d)</span>
 </div>
 <p className="text-2xl font-bold text-destructive">{compliance.breached}</p>
 <p className="text-xs text-muted-foreground">of {compliance.total} completed</p>
 </div>
 </div>
 )}

 {/* SLA Policies Table */}
 <div className="bg-card rounded-xl border border-border mb-8">
 <div className="px-6 py-4 border-b border-border">
 <h3 className="font-semibold text-foreground">SLA Policies</h3>
 </div>
 <div className="p-6">
 {policies.length === 0 ? (
 <div className="text-center py-8">
 <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
 <p className="text-muted-foreground">No SLA policies defined yet</p>
 </div>
 ) : (
 <div className="space-y-4">
 {policies.map((policy) => (
 <div key={policy.id} className="flex items-center gap-6 p-4 rounded-lg hover:bg-background transition-colors">
 <div className="w-28">
 <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-brand-soft text-brand">
 {policy.entityType}
 </span>
 </div>
 <div className="w-48 min-w-0">
 <p className="text-sm font-medium text-foreground truncate">{policy.name}</p>
 <p className="text-xs text-muted-foreground">{policy.code}</p>
 </div>
 <div className="w-32 text-sm">
 <p className="text-muted-foreground">Priority: <span className="font-medium text-foreground">{policy.priority}</span></p>
 </div>
 <div className="w-40 text-sm">
 {policy.goals && policy.goals.length > 0 ? (
 policy.goals.map((g) => (
 <p key={g.id} className="text-muted-foreground text-xs">
 {g.metricKey}: <span className="font-medium text-foreground">{formatTime(g.targetMinutes)}</span>
 </p>
 ))
 ) : (
 <p className="text-xs text-muted-foreground">No goals</p>
 )}
 </div>
 <div className="flex-1">
 <div className="flex items-center gap-2">
 {policy.isActive ? (
 <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-success-soft text-success">
 <CheckCircle className="h-3 w-3" /> Active
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground">
 <XCircle className="h-3 w-3" /> Inactive
 </span>
 )}
 </div>
 </div>
 <div className="w-24 text-center">
 <p className="text-sm font-semibold text-foreground">
 {policy.matchConditions?.length || 0}
 </p>
 <p className="text-[10px] text-muted-foreground">conditions</p>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>

 {/* Active Instances Summary */}
 {stats?.instances && Object.keys(stats.instances).length > 0 && (
 <div className="bg-card rounded-xl border border-border">
 <div className="px-6 py-4 border-b border-border">
 <h3 className="font-semibold text-foreground">Instance Status Overview</h3>
 </div>
 <div className="p-6">
 <div className="grid grid-cols-4 gap-4">
 {Object.entries(stats.instances).map(([status, count]) => {
 const colors: Record<string, string> = {
 active: 'bg-brand',
 completed: 'bg-success',
 cancelled: 'bg-muted-foreground/30',
 };
 return (
 <div key={status} className="p-4 bg-background rounded-lg">
 <div className="flex items-center gap-2 mb-3">
 <span className={`w-3 h-3 rounded-full ${colors[status] || 'bg-muted-foreground'}`} />
 <p className="text-sm font-medium text-foreground capitalize">{status}</p>
 </div>
 <p className="text-3xl font-bold text-foreground">{count}</p>
 <p className="text-xs text-muted-foreground mt-1">instances</p>
 </div>
 );
 })}
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
