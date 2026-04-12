'use client';

import { useState } from 'react';
import { useProblems, useProblemStats } from '@/hooks/useProblems';
import { IProblem, IProblemStats, ProblemStatus, getPriorityColor } from '@/types/itsm';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Plus, Search, AlertTriangle, FileQuestion, CheckCircle, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader, PageHeaderContent, PageHeaderTitle, PageHeaderDescription, PageHeaderActions } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';

const getStatusVariant = (status: ProblemStatus) => {
 const map: Record<ProblemStatus, 'info' | 'warning' | 'success' | 'neutral'> = {
 [ProblemStatus.LOGGED]: 'info',
 [ProblemStatus.RCA_IN_PROGRESS]: 'warning',
 [ProblemStatus.KNOWN_ERROR]: 'info',
 [ProblemStatus.RESOLVED]: 'success',
 [ProblemStatus.CLOSED]: 'neutral',
 };
 return map[status] || 'neutral';
};

export default function ProblemsPage() {
 const { t } = useLanguage();
 const [page, setPage] = useState(1);
 const [statusFilter, setStatusFilter] = useState<ProblemStatus[]>([]);
 const [searchQuery, setSearchQuery] = useState('');

 const { data: problemsData, isLoading } = useProblems({
 status: statusFilter.length > 0 ? statusFilter : undefined,
 page,
 limit: 20,
 });

 const { data: stats } = useProblemStats();

 const response = problemsData as { data: IProblem[]; pagination: { page: number; limit: number; total: number; totalPages: number } } | undefined;
 const problems = response?.data || [];
 const pagination = response?.pagination;

 const statusOptions = [
 { value: ProblemStatus.LOGGED, label: t('problems.status.logged'), icon: FileQuestion },
 { value: ProblemStatus.RCA_IN_PROGRESS, label: t('problems.status.rca_in_progress'), icon: Search },
 { value: ProblemStatus.KNOWN_ERROR, label: t('problems.status.known_error'), icon: Lightbulb },
 { value: ProblemStatus.RESOLVED, label: t('problems.status.resolved'), icon: CheckCircle },
 ];

 const toggleStatusFilter = (status: ProblemStatus) => {
 setStatusFilter((prev) =>
 prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
 );
 setPage(1);
 };

 return (
 <DashboardLayout>
 <div className="space-y-6">
 {/* Header */}
 <PageHeader>
 <PageHeaderContent>
 <PageHeaderTitle>{t('problems.title')}</PageHeaderTitle>
 <PageHeaderDescription>{t('problems.subtitle')}</PageHeaderDescription>
 </PageHeaderContent>
 <PageHeaderActions>
 <Button asChild>
 <Link href="/problems/new">
 <Plus className="w-5 h-5" />
 {t('problems.newProblem')}
 </Link>
 </Button>
 </PageHeaderActions>
 </PageHeader>

 {/* Stats Cards */}
 {stats && (
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 <Card className="gap-0 py-4 px-4">
 <div className="text-2xl font-bold text-foreground">{(stats as IProblemStats).total || 0}</div>
 <div className="text-sm text-muted-foreground">{t('problems.stats.total')}</div>
 </Card>
 <Card className="gap-0 py-4 px-4">
 <div className="text-2xl font-bold text-warning">{(stats as IProblemStats).rcaInProgress || 0}</div>
 <div className="text-sm text-muted-foreground">{t('problems.stats.rcaInProgress')}</div>
 </Card>
 <Card className="gap-0 py-4 px-4">
 <div className="text-2xl font-bold text-info dark:text-info/80">{(stats as IProblemStats).knownErrors || 0}</div>
 <div className="text-sm text-muted-foreground">{t('problems.stats.knownErrors')}</div>
 </Card>
 <Card className="gap-0 py-4 px-4">
 <div className="text-2xl font-bold text-success">{(stats as IProblemStats).resolved || 0}</div>
 <div className="text-sm text-muted-foreground">{t('problems.stats.resolved')}</div>
 </Card>
 </div>
 )}

 {/* Filters */}
 <Card className="p-4">
 <div className="flex flex-wrap items-center gap-4">
 {/* Search */}
 <div className="relative flex-1 min-w-[200px]">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
 <Input
 type="text"
 placeholder="Search problems..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="pl-9"
 />
 </div>

 {/* Status Filter */}
 <div className="flex flex-wrap gap-2">
 {statusOptions.map((option) => (
 <button
 key={option.value}
 onClick={() => toggleStatusFilter(option.value)}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
 statusFilter.includes(option.value)
 ? 'bg-brand text-brand-foreground'
 : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
 }`}
 >
 <option.icon className="w-4 h-4" />
 {option.label}
 </button>
 ))}
 </div>
 </div>
 </Card>

 {/* Problems Table */}
 <Card className="overflow-hidden p-0">
 {isLoading ? (
 <LoadingSpinner className="h-64" />
 ) : problems.length === 0 ? (
 <EmptyState
 icon={AlertTriangle}
 title="No problems found"
 className="h-64"
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
 <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Owner</TableHead>
 <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Linked Incidents</TableHead>
 <TableHead className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</TableHead>
 </TableRow>
 </TableHeader>
 <TableBody>
 {problems.map((problem: IProblem) => (
 <TableRow
 key={problem._id}
 className="cursor-pointer"
 onClick={() => window.location.href = `/problems/${problem._id}`}
 >
 <TableCell className="whitespace-nowrap">
 <span className="text-sm font-medium text-brand">
 {problem.problem_id}
 </span>
 {problem.known_error && (
 <StatusBadge variant="info" className="ml-2">KE</StatusBadge>
 )}
 </TableCell>
 <TableCell>
 <div className="text-sm font-medium text-foreground truncate max-w-xs">
 {problem.title}
 </div>
 </TableCell>
 <TableCell className="whitespace-nowrap">
 <StatusBadge variant={getStatusVariant(problem.status)}>
 {problem.status.replace('_', ' ')}
 </StatusBadge>
 </TableCell>
 <TableCell className="whitespace-nowrap">
 <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getPriorityColor(problem.priority)}`}>
 {problem.priority}
 </span>
 </TableCell>
 <TableCell className="whitespace-nowrap">
 <div className="text-sm text-foreground">{problem.owner.name}</div>
 </TableCell>
 <TableCell className="whitespace-nowrap">
 <span className="text-sm text-foreground">
 {problem.linked_incidents?.length || 0}
 </span>
 </TableCell>
 <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
 {new Date(problem.created_at).toLocaleDateString()}
 </TableCell>
 </TableRow>
 ))}
 </TableBody>
 </Table>
 </div>
 )}

 {/* Pagination */}
 {pagination && pagination.totalPages > 1 && (
 <div className="px-4 py-3 border-t border-border flex items-center justify-between">
 <div className="text-sm text-muted-foreground">
 Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
 {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} problems
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
