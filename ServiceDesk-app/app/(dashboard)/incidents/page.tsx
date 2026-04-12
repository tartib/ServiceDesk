'use client';

import { useState } from 'react';
import { useIncidents, useIncidentStats } from '@/hooks/useIncidents';
import { IIncident, IIncidentStats, IncidentStatus, Priority, getPriorityColor, getStatusColor, formatSLATime } from '@/types/itsm';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Plus, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader, PageHeaderContent, PageHeaderTitle, PageHeaderDescription, PageHeaderActions } from '@/components/ui/page-header';
import { Search } from 'lucide-react';

export default function IncidentsPage() {
 const { t } = useLanguage();
 const [page, setPage] = useState(1);
 const [statusFilter, setStatusFilter] = useState<IncidentStatus[]>([]);
 const [priorityFilter, setPriorityFilter] = useState<Priority[]>([]);
 const [searchQuery, setSearchQuery] = useState('');

 const { data: incidentsData, isLoading } = useIncidents({
 status: statusFilter.length > 0 ? statusFilter : undefined,
 priority: priorityFilter.length > 0 ? priorityFilter : undefined,
 page,
 limit: 20,
 });

 const { data: stats } = useIncidentStats();

 const incidents = incidentsData?.data || [];
 const pagination = incidentsData?.pagination;

 const statusOptions = [
 { value: IncidentStatus.OPEN, label: t('incidents.status.open'), icon: AlertTriangle, color: 'text-info' },
 { value: IncidentStatus.IN_PROGRESS, label: t('incidents.status.in_progress'), icon: Clock, color: 'text-warning' },
 { value: IncidentStatus.PENDING, label: t('incidents.status.pending'), icon: Clock, color: 'text-warning' },
 { value: IncidentStatus.RESOLVED, label: t('incidents.status.resolved'), icon: CheckCircle, color: 'text-success' },
 { value: IncidentStatus.CLOSED, label: t('incidents.status.closed'), icon: XCircle, color: 'text-muted-foreground' },
 ];

 const priorityOptions = [
 { value: Priority.CRITICAL, label: t('incidents.priority.critical') },
 { value: Priority.HIGH, label: t('incidents.priority.high') },
 { value: Priority.MEDIUM, label: t('incidents.priority.medium') },
 { value: Priority.LOW, label: t('incidents.priority.low') },
 ];

 const toggleStatusFilter = (status: IncidentStatus) => {
 setStatusFilter((prev) =>
 prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
 );
 setPage(1);
 };

 const togglePriorityFilter = (priority: Priority) => {
 setPriorityFilter((prev) =>
 prev.includes(priority) ? prev.filter((p) => p !== priority) : [...prev, priority]
 );
 setPage(1);
 };

 return (
 <DashboardLayout>
 <div className="space-y-6 md:space-y-8">
 {/* Header */}
 <PageHeader>
 <PageHeaderContent>
 <PageHeaderTitle>{t('incidents.title')}</PageHeaderTitle>
 <PageHeaderDescription>{t('incidents.subtitle')}</PageHeaderDescription>
 </PageHeaderContent>
 <PageHeaderActions>
 <Button asChild>
 <Link href="/incidents/new">
 <Plus className="w-5 h-5" />
 <span className="hidden sm:inline">{t('incidents.newIncident')}</span>
 </Link>
 </Button>
 </PageHeaderActions>
 </PageHeader>

 {/* Stats Cards */}
 {stats && (
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
 <Card className="gap-0 py-4 px-4">
 <div className="text-2xl font-bold text-foreground">{(stats as IIncidentStats).total}</div>
 <div className="text-sm text-muted-foreground">{t('incidents.stats.total')}</div>
 </Card>
 <Card className="gap-0 py-4 px-4">
 <div className="text-2xl font-bold text-info">{(stats as IIncidentStats).open}</div>
 <div className="text-sm text-muted-foreground">{t('incidents.stats.open')}</div>
 </Card>
 <Card className="gap-0 py-4 px-4">
 <div className="text-2xl font-bold text-warning">{(stats as IIncidentStats).inProgress}</div>
 <div className="text-sm text-muted-foreground">{t('incidents.stats.inProgress')}</div>
 </Card>
 <Card className="gap-0 py-4 px-4">
 <div className="text-2xl font-bold text-success">{(stats as IIncidentStats).resolved}</div>
 <div className="text-sm text-muted-foreground">{t('incidents.stats.resolved')}</div>
 </Card>
 <Card className="gap-0 py-4 px-4">
 <div className="text-2xl font-bold text-muted-foreground">{(stats as IIncidentStats).closed}</div>
 <div className="text-sm text-muted-foreground">{t('incidents.stats.closed')}</div>
 </Card>
 <Card className="gap-0 py-4 px-4">
 <div className="text-2xl font-bold text-destructive">{(stats as IIncidentStats).breached}</div>
 <div className="text-sm text-muted-foreground">{t('incidents.stats.breached')}</div>
 </Card>
 </div>
 )}

 {/* Filters */}
 <Card className="p-4 md:p-6">
 <div className="flex flex-col md:flex-row gap-4 md:gap-6">
 {/* Search */}
 <div className="flex-1 min-w-0">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground shrink-0" />
 <Input
 type="text"
 placeholder={t('incidents.filters.search')}
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-9"
 />
 </div>
 </div>

 {/* Status Filter */}
 <div className="flex flex-wrap items-center gap-2">
 {statusOptions.map((option) => (
 <button
 key={option.value}
 onClick={() => toggleStatusFilter(option.value)}
 className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
 statusFilter.includes(option.value)
 ? 'bg-brand text-brand-foreground'
 : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
 }`}
 >
 <option.icon className={`w-4 h-4 shrink-0 ${option.color}`} />
 <span className="hidden sm:inline">{option.label}</span>
 </button>
 ))}
 </div>

 {/* Priority Filter */}
 <div className="flex flex-wrap items-center gap-2">
 {priorityOptions.map((option) => (
 <button
 key={option.value}
 onClick={() => togglePriorityFilter(option.value)}
 className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
 priorityFilter.includes(option.value)
 ? getPriorityColor(option.value)
 : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
 }`}
 >
 {option.label}
 </button>
 ))}
 </div>
 </div>
 </Card>

 {/* Incidents Table */}
 <Card className="overflow-hidden p-0">
 {isLoading ? (
 <LoadingSpinner className="py-12" label="Loading incidents..." />
 ) : incidents.length === 0 ? (
 <EmptyState
 icon={AlertTriangle}
 title="No incidents found"
 />
 ) : (
 <div className="overflow-x-auto">
 <Table>
 <TableHeader>
 <TableRow className="bg-muted/50 hover:bg-muted/50">
 <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</TableHead>
 <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</TableHead>
 <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</TableHead>
 <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Priority</TableHead>
 <TableHead className="hidden sm:table-cell text-xs font-medium text-muted-foreground uppercase tracking-wider">Requester</TableHead>
 <TableHead className="hidden md:table-cell text-xs font-medium text-muted-foreground uppercase tracking-wider">Assigned To</TableHead>
 <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">SLA</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {incidents.map((incident: IIncident) => (
 <TableRow
 key={incident._id}
 className="cursor-pointer"
 onClick={() => window.location.href = `/incidents/${incident.incident_id}`}
 >
 <TableCell className="whitespace-nowrap">
 <span className="text-sm font-medium text-brand">
 {incident.incident_id}
 </span>
 {incident.is_major && (
 <span className="ml-2 px-2 py-0.5 text-xs bg-destructive-soft text-destructive rounded-full">
 Major
 </span>
 )}
 </TableCell>
 <TableCell>
 <div className="text-sm font-medium text-foreground truncate max-w-xs">
 {incident.title}
 </div>
 </TableCell>
 <TableCell className="whitespace-nowrap">
 <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(incident.status)}`}>
 {incident.status.replace('_', ' ')}
 </span>
 </TableCell>
 <TableCell className="whitespace-nowrap">
 <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getPriorityColor(incident.priority)}`}>
 {incident.priority}
 </span>
 </TableCell>
 <TableCell className="hidden sm:table-cell whitespace-nowrap">
 <div className="text-sm text-foreground">{incident.requester.name}</div>
 <div className="text-xs text-muted-foreground">{incident.requester.department}</div>
 </TableCell>
 <TableCell className="hidden md:table-cell whitespace-nowrap">
 {incident.assigned_to ? (
 <div className="text-sm text-foreground">{incident.assigned_to.name}</div>
 ) : (
 <span className="text-sm text-muted-foreground italic">Unassigned</span>
 )}
 </TableCell>
 <TableCell className="whitespace-nowrap">
 {incident.sla.breach_flag ? (
 <span className="text-sm text-destructive font-medium">Breached</span>
 ) : (
 <span className="text-sm text-foreground">
 {incident.time_to_breach_minutes !== undefined
 ? formatSLATime(incident.time_to_breach_minutes)
 : '-'}
 </span>
 )}
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 )}

 {/* Pagination */}
 {pagination && pagination.totalPages > 1 && (
 <div className="px-4 py-3 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
 <div className="text-sm text-muted-foreground">
 Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
 {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} incidents
 </div>
 <div className="flex gap-2">
 <Button
 variant="outline"
 size="sm"
 onClick={() => setPage((p) => Math.max(1, p - 1))}
 disabled={page === 1}
 >
 Previous
 </Button>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
 disabled={page === pagination.totalPages}
 >
 Next
 </Button>
 </div>
 </div>
 )}
 </Card>
 </div>
 </DashboardLayout>
 );
}
