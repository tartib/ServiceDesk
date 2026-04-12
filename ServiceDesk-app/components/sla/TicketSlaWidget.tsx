'use client';

import { useMemo } from 'react';
import {
 Clock,
 CheckCircle,
 AlertTriangle,
 XCircle,
 PauseCircle,
} from 'lucide-react';
import { useTicketSla, ITicketSlaMetric } from '@/hooks/useSlaV2';

interface TicketSlaWidgetProps {
 ticketId: string;
}

const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string; label: string }> = {
 running: { icon: Clock, color: 'text-brand', bg: 'bg-brand-surface', label: 'Running' },
 paused: { icon: PauseCircle, color: 'text-warning', bg: 'bg-warning-soft', label: 'Paused' },
 met: { icon: CheckCircle, color: 'text-success', bg: 'bg-success-soft', label: 'Met' },
 breached: { icon: XCircle, color: 'text-destructive', bg: 'bg-destructive-soft', label: 'Breached' },
 cancelled: { icon: XCircle, color: 'text-muted-foreground', bg: 'bg-muted/50', label: 'Cancelled' },
};

function formatDuration(seconds: number): string {
 if (seconds <= 0) return '0m';
 const h = Math.floor(seconds / 3600);
 const m = Math.floor((seconds % 3600) / 60);
 if (h > 0) return `${h}h ${m}m`;
 return `${m}m`;
}

function MetricRow({ metric }: { metric: ITicketSlaMetric }) {
 const config = statusConfig[metric.status] || statusConfig.running;
 const Icon = config.icon;
 const progress = metric.targetMinutes > 0
 ? Math.min(100, (metric.elapsedBusinessSeconds / (metric.targetMinutes * 60)) * 100)
 : 0;
 const isUrgent = metric.status === 'running' && metric.remainingBusinessSeconds < 600; // < 10min

 return (
 <div className={`flex items-center gap-3 p-3 rounded-lg ${config.bg}`}>
 <Icon className={`h-4 w-4 shrink-0 ${config.color}`} />
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between mb-1">
 <span className="text-xs font-medium text-foreground capitalize">
 {metric.metricKey.replace(/_/g, ' ')}
 </span>
 <span className={`text-xs font-semibold ${config.color}`}>
 {config.label}
 </span>
 </div>
 <div className="w-full bg-muted rounded-full h-1.5">
 <div
 className={`h-1.5 rounded-full transition-all ${
 metric.breached ? 'bg-destructive' : isUrgent ? 'bg-warning' : 'bg-brand'
 }`}
 style={{ width: `${Math.min(progress, 100)}%` }}
 />
 </div>
 <div className="flex items-center justify-between mt-1">
 <span className="text-[10px] text-muted-foreground">
 {formatDuration(metric.elapsedBusinessSeconds)} / {metric.targetMinutes}m target
 </span>
 {(metric.status === 'running' || metric.status === 'paused') && (
 <span className={`text-[10px] font-medium ${isUrgent ? 'text-destructive' : 'text-muted-foreground'}`}>
 {formatDuration(metric.remainingBusinessSeconds)} left
 </span>
 )}
 </div>
 </div>
 </div>
 );
}

export default function TicketSlaWidget({ ticketId }: TicketSlaWidgetProps) {
 const { data: slaView, isLoading, isError } = useTicketSla(ticketId);

 const hasBreaches = useMemo(() => {
 if (!slaView) return false;
 return slaView.metrics.some((m) => m.breached);
 }, [slaView]);

 if (isLoading) {
 return (
 <div className="animate-pulse bg-muted rounded-lg p-4 h-24" />
 );
 }

 if (isError || !slaView) {
 return null; // No SLA for this ticket — hide widget
 }

 return (
 <div className={`rounded-xl border p-4 ${hasBreaches ? 'border-destructive/30 bg-destructive-soft/30' : 'border-border bg-background'}`}>
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2">
 {hasBreaches ? (
 <AlertTriangle className="h-4 w-4 text-destructive" />
 ) : (
 <Clock className="h-4 w-4 text-brand" />
 )}
 <span className="text-sm font-semibold text-foreground">SLA</span>
 </div>
 <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
 {slaView.policy.code}
 </span>
 </div>

 <div className="space-y-2">
 {slaView.metrics.map((m) => (
 <MetricRow key={m.metricKey} metric={m} />
 ))}
 </div>
 </div>
 );
}
