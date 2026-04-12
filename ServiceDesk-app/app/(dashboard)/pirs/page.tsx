'use client';

import { useState } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePIRs } from '@/hooks/usePIR';
import { IPIR, PIRStatus } from '@/types/itsm';
import { ClipboardList, Plus, Search, Filter, CheckCircle, Clock, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';

const STATUS_CONFIG: Record<PIRStatus, { label: string; variant: 'neutral' | 'info' | 'success'; icon: React.ReactNode }> = {
 [PIRStatus.DRAFT]: { label: 'Draft', variant: 'neutral', icon: <FileText className="w-3 h-3" /> },
 [PIRStatus.IN_REVIEW]: { label: 'In Review', variant: 'info', icon: <Clock className="w-3 h-3" /> },
 [PIRStatus.COMPLETED]: { label: 'Completed', variant: 'success', icon: <CheckCircle className="w-3 h-3" /> },
};

export default function PIRsPage() {
 const { t } = useLanguage();
 const [statusFilter, setStatusFilter] = useState<PIRStatus | ''>('');
 const [search, setSearch] = useState('');
 const [page, setPage] = useState(1);

 const { data, isLoading } = usePIRs({
 status: statusFilter || undefined,
 page,
 limit: 15,
 });

 const pirs: IPIR[] = (data as any)?.data ?? [];
 const total: number = (data as any)?.pagination?.total ?? 0;
 const totalPages: number = (data as any)?.pagination?.pages ?? 1;

 const filtered = search
 ? pirs.filter(
 (p) =>
 p.pir_id?.toLowerCase().includes(search.toLowerCase()) ||
 p.incident_title?.toLowerCase().includes(search.toLowerCase()) ||
 p.incident_id?.toLowerCase().includes(search.toLowerCase())
 )
 : pirs;

 return (
 <DashboardLayout>
 <div className="space-y-6">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-info-soft rounded-xl flex items-center justify-center">
 <ClipboardList className="w-5 h-5 text-info" />
 </div>
 <div>
 <h1 className="text-2xl font-bold text-foreground">Post-Incident Reviews</h1>
 <p className="text-sm text-muted-foreground">{total} total</p>
 </div>
 </div>
 <Button asChild>
 <Link href="/pirs/new">
 <Plus className="w-4 h-4" /> New PIR
 </Link>
 </Button>
 </div>

 {/* Stats Strip */}
 <div className="grid grid-cols-3 gap-4">
 {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
 const count = pirs.filter((p) => p.status === status).length;
 return (
 <button
 key={status}
 onClick={() => setStatusFilter(statusFilter === status ? '' : status as PIRStatus)}
 className={`rounded-xl border p-4 text-left transition-all ${
 statusFilter === status
 ? 'border-brand bg-brand-surface'
 : 'border-border bg-card hover:border-accent-foreground/20'
 }`}
 >
 <p className="text-2xl font-bold text-foreground">{count}</p>
 <p className="text-sm text-muted-foreground mt-1">{cfg.label}</p>
 </button>
 );
 })}
 </div>

 {/* Filters */}
 <div className="flex items-center gap-3 flex-wrap">
 <div className="relative flex-1 min-w-[200px]">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <Input
 type="text"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search PIR ID or incident..."
 className="pl-9"
 />
 </div>
 <div className="flex items-center gap-2">
 <Filter className="w-4 h-4 text-muted-foreground" />
 {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
 <button
 key={status}
 onClick={() => setStatusFilter(statusFilter === status ? '' : status as PIRStatus)}
 className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
 statusFilter === status ? 'bg-brand text-brand-foreground ring-2 ring-offset-1 ring-brand-border' : 'bg-muted text-muted-foreground hover:bg-accent'
 }`}
 >
 {cfg.label}
 </button>
 ))}
 </div>
 </div>

 {/* Table */}
 <Card className="overflow-hidden p-0">
 {isLoading ? (
 <LoadingSpinner className="h-40" />
 ) : filtered.length === 0 ? (
 <EmptyState
 icon={ClipboardList}
 title="No PIRs found"
 description="Start by creating a PIR for a resolved major incident"
 />
 ) : (
 <Table>
 <TableHeader>
 <TableRow className="bg-muted/50 hover:bg-muted/50">
 <TableHead className="text-xs font-semibold text-muted-foreground uppercase">PIR ID</TableHead>
 <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Incident</TableHead>
 <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Status</TableHead>
 <TableHead className="text-xs font-semibold text-muted-foreground uppercase">RCA Method</TableHead>
 <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Actions</TableHead>
 <TableHead className="text-xs font-semibold text-muted-foreground uppercase">Created</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {filtered.map((pir) => {
 const cfg = STATUS_CONFIG[pir.status];
 return (
 <TableRow key={pir._id}>
 <TableCell>
 <Link href={`/pirs/${pir._id}`} className="font-medium text-info hover:text-info text-sm">
 {pir.pir_id}
 </Link>
 </TableCell>
 <TableCell>
 <div>
 <Link href={`/incidents/${pir.incident_id}`} className="text-sm text-brand hover:underline font-medium">
 {pir.incident_id}
 </Link>
 {pir.incident_title && (
 <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{pir.incident_title}</p>
 )}
 </div>
 </TableCell>
 <TableCell>
 <StatusBadge variant={cfg.variant}>
 {cfg.icon} {cfg.label}
 </StatusBadge>
 </TableCell>
 <TableCell>
 <span className="text-sm text-muted-foreground capitalize">
 {pir.rca_method?.replace('_', ' ') ?? '—'}
 </span>
 </TableCell>
 <TableCell>
 <span className="text-sm text-muted-foreground">
 {pir.follow_up_actions?.length ?? 0} action{pir.follow_up_actions?.length !== 1 ? 's' : ''}
 </span>
 </TableCell>
 <TableCell className="text-sm text-muted-foreground">
 {new Date(pir.created_at).toLocaleDateString()}
 </TableCell>
 </TableRow>
 );
 })}
 </TableBody>
 </Table>
 )}
 </Card>

 {/* Pagination */}
 {totalPages > 1 && (
 <div className="flex items-center justify-between">
 <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
 <div className="flex gap-2">
 <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
 Previous
 </Button>
 <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
 Next
 </Button>
 </div>
 </div>
 )}
 </div>
 </DashboardLayout>
 );
}
