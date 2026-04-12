'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
 ScrollText,
 ArrowLeft,
 User,
 Clock,
} from 'lucide-react';
import { useAuditLog, IAuditEntry } from '@/hooks/useCampaigns';

const actionColors: Record<string, string> = {
 created: 'bg-success-soft text-success',
 updated: 'bg-brand-soft text-brand',
 deleted: 'bg-destructive-soft text-destructive',
 sent: 'bg-info-soft text-info',
 scheduled: 'bg-warning-soft text-warning',
 paused: 'bg-warning-soft text-warning',
 resumed: 'bg-success-soft text-success',
 cancelled: 'bg-destructive-soft text-destructive',
 published: 'bg-success-soft text-success',
 archived: 'bg-muted text-foreground',
};

export default function AuditLogPage() {
 const router = useRouter();
 const [page, setPage] = useState(1);
 const [entityTypeFilter, setEntityTypeFilter] = useState('');
 const [actionFilter, setActionFilter] = useState('');

 const { data: auditData, isLoading } = useAuditLog({
 page,
 limit: 30,
 entityType: entityTypeFilter || undefined,
 action: actionFilter || undefined,
 });

 const entries: IAuditEntry[] = useMemo(
 () => auditData?.items || [],
 [auditData]
 );
 const totalPages = auditData?.totalPages || 1;

 return (
 <div className="flex flex-col h-full bg-background">
 <div className="bg-card border-b border-border px-6 py-4">
 <div className="flex items-center gap-3">
 <button onClick={() => router.push('/campaigns')} className="p-1.5 rounded-lg hover:bg-accent">
 <ArrowLeft className="h-5 w-5" />
 </button>
 <ScrollText className="h-6 w-6 text-brand" />
 <h1 className="text-xl font-bold text-foreground">Audit Log</h1>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-6">
 <div className="flex items-center gap-3 mb-4">
 <select
 value={entityTypeFilter}
 onChange={(e) => { setEntityTypeFilter(e.target.value); setPage(1); }}
 className="px-3 py-2 text-sm border border-border rounded-lg bg-background"
 >
 <option value="">All Entities</option>
 <option value="campaign">Campaign</option>
 <option value="template">Template</option>
 <option value="segment">Segment</option>
 <option value="trigger">Trigger</option>
 <option value="journey">Journey</option>
 <option value="provider">Provider</option>
 <option value="abtest">A/B Test</option>
 </select>
 <select
 value={actionFilter}
 onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
 className="px-3 py-2 text-sm border border-border rounded-lg bg-background"
 >
 <option value="">All Actions</option>
 <option value="created">Created</option>
 <option value="updated">Updated</option>
 <option value="deleted">Deleted</option>
 <option value="sent">Sent</option>
 <option value="scheduled">Scheduled</option>
 <option value="paused">Paused</option>
 <option value="cancelled">Cancelled</option>
 <option value="published">Published</option>
 </select>
 </div>

 {isLoading ? (
 <div className="flex items-center justify-center h-64">
 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand" />
 </div>
 ) : entries.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
 <ScrollText className="h-12 w-12 mb-4 opacity-50" />
 <p className="text-lg font-medium">No audit entries</p>
 </div>
 ) : (
 <>
 <div className="space-y-2">
 {entries.map((entry) => (
 <div
 key={entry._id}
 className="bg-card rounded-lg border border-border p-4 flex items-center gap-4"
 >
 <div className="shrink-0">
 <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
 <User className="h-4 w-4 text-muted-foreground" />
 </div>
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionColors[entry.action] || 'bg-muted text-foreground'}`}>
 {entry.action}
 </span>
 <span className="text-xs text-muted-foreground capitalize">{entry.entityType}</span>
 {entry.entityName && (
 <span className="text-sm font-medium text-foreground truncate">{entry.entityName}</span>
 )}
 </div>
 {entry.changes && Object.keys(entry.changes).length > 0 && (
 <p className="text-xs text-muted-foreground mt-1 truncate">
 Changed: {Object.keys(entry.changes).join(', ')}
 </p>
 )}
 </div>
 <div className="shrink-0 text-right">
 <div className="flex items-center gap-1 text-xs text-muted-foreground">
 <Clock className="h-3 w-3" />
 {new Date(entry.timestamp).toLocaleString()}
 </div>
 <p className="text-xs text-muted-foreground mt-0.5">{entry.performedBy}</p>
 </div>
 </div>
 ))}
 </div>

 {totalPages > 1 && (
 <div className="flex items-center justify-center gap-2 mt-6">
 <button
 onClick={() => setPage((p) => Math.max(1, p - 1))}
 disabled={page === 1}
 className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-50 hover:bg-accent"
 >
 Previous
 </button>
 <span className="text-sm text-muted-foreground">
 Page {page} of {totalPages}
 </span>
 <button
 onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
 disabled={page === totalPages}
 className="px-3 py-1.5 text-sm border border-border rounded-lg disabled:opacity-50 hover:bg-accent"
 >
 Next
 </button>
 </div>
 )}
 </>
 )}
 </div>
 </div>
 );
}
