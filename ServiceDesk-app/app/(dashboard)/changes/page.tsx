'use client';

import { useState } from 'react';
import { useChanges, useChangeStats } from '@/hooks/useChanges';
import { IChange, ChangeStatus, ChangeType, getPriorityColor } from '@/types/itsm';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Plus, Search, Calendar } from 'lucide-react';
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

const getStatusVariant = (status: ChangeStatus) => {
  const map: Record<ChangeStatus, 'neutral' | 'info' | 'warning' | 'success' | 'danger' | 'purple' | 'orange'> = {
    [ChangeStatus.DRAFT]: 'neutral',
    [ChangeStatus.SUBMITTED]: 'info',
    [ChangeStatus.CAB_REVIEW]: 'warning',
    [ChangeStatus.APPROVED]: 'success',
    [ChangeStatus.REJECTED]: 'danger',
    [ChangeStatus.SCHEDULED]: 'purple',
    [ChangeStatus.IMPLEMENTING]: 'orange',
    [ChangeStatus.COMPLETED]: 'success',
    [ChangeStatus.FAILED]: 'danger',
    [ChangeStatus.CANCELLED]: 'neutral',
  };
  return map[status] || 'neutral';
};

const getTypeVariant = (type: ChangeType) => {
  const map: Record<ChangeType, 'info' | 'success' | 'danger'> = {
    [ChangeType.NORMAL]: 'info',
    [ChangeType.STANDARD]: 'success',
    [ChangeType.EMERGENCY]: 'danger',
  };
  return map[type] || 'info';
};

export default function ChangesPage() {
  const { t } = useLanguage();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ChangeStatus[]>([]);

  const { data: changesData, isLoading } = useChanges({
    status: statusFilter.length > 0 ? statusFilter : undefined,
    page,
    limit: 20,
  });

  const { data: stats } = useChangeStats();

  const response = changesData as { data: IChange[]; pagination: { page: number; limit: number; total: number; totalPages: number } } | undefined;
  const changes = response?.data || [];
  const pagination = response?.pagination;

  const toggleStatusFilter = (status: ChangeStatus) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader>
          <PageHeaderContent>
            <PageHeaderTitle>{t('changes.title')}</PageHeaderTitle>
            <PageHeaderDescription>{t('changes.subtitle')}</PageHeaderDescription>
          </PageHeaderContent>
          <PageHeaderActions>
            <Button asChild>
              <Link href="/changes/new">
                <Plus className="w-5 h-5" />
                {t('changes.newChange')}
              </Link>
            </Button>
          </PageHeaderActions>
        </PageHeader>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="gap-0 py-4 px-4">
              <div className="text-2xl font-bold text-foreground">{stats.total || 0}</div>
              <div className="text-sm text-muted-foreground">{t('changes.stats.total')}</div>
            </Card>
            <Card className="gap-0 py-4 px-4">
              <div className="text-2xl font-bold text-warning">{stats.pendingApproval || 0}</div>
              <div className="text-sm text-muted-foreground">{t('changes.stats.pendingCAB')}</div>
            </Card>
            <Card className="gap-0 py-4 px-4">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.scheduled || 0}</div>
              <div className="text-sm text-muted-foreground">{t('changes.stats.scheduled')}</div>
            </Card>
            <Card className="gap-0 py-4 px-4">
              <div className="text-2xl font-bold text-success">{stats.completed || 0}</div>
              <div className="text-sm text-muted-foreground">{t('changes.stats.completed')}</div>
            </Card>
          </div>
        )}

        <Card className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="text" placeholder="Search changes..." className="pl-9" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[ChangeStatus.DRAFT, ChangeStatus.CAB_REVIEW, ChangeStatus.SCHEDULED].map((status) => (
                <button
                  key={status}
                  onClick={() => toggleStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter.includes(status) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'}`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          {isLoading ? (
            <LoadingSpinner className="h-64" />
          ) : changes.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No change requests found"
              className="h-64"
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase">ID</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase">Title</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase">Type</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase">Status</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase">Priority</TableHead>
                    <TableHead className="text-xs font-medium text-muted-foreground uppercase">Requester</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {changes.map((change: IChange) => (
                    <TableRow key={change._id} className="cursor-pointer" onClick={() => window.location.href = `/changes/${change.change_id}`}>
                      <TableCell className="whitespace-nowrap">
                        <span className="text-sm font-medium text-primary">{change.change_id}</span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-foreground truncate max-w-xs">{change.title}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <StatusBadge variant={getTypeVariant(change.type)}>{change.type}</StatusBadge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <StatusBadge variant={getStatusVariant(change.status)}>{change.status.replace('_', ' ')}</StatusBadge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getPriorityColor(change.priority)}`}>{change.priority}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm text-foreground">{change.requested_by?.name ?? '—'}</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="px-4 py-3 border-t border-border flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.totalPages}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
