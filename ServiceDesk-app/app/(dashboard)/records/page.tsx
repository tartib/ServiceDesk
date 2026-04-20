'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useRecords, useMyRecords, usePendingApprovals } from '@/hooks/useRecords';
import type { RecordListParams, RecordDetail } from '@/lib/domains/forms/records';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  submitted: { label: 'Submitted', variant: 'default' },
  pending_approval: { label: 'Pending Approval', variant: 'outline' },
  approved: { label: 'Approved', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  in_progress: { label: 'In Progress', variant: 'default' },
  completed: { label: 'Completed', variant: 'default' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, variant: 'secondary' as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

function RecordRow({ record, onClick }: { record: RecordDetail; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">Record #{record.id.slice(-8).toUpperCase()}</p>
          <p className="text-xs text-muted-foreground truncate">
            {record.submittedBy.name} &middot; {new Date(record.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <StatusBadge status={record.status} />
    </div>
  );
}

function RecordList({
  records,
  isLoading,
  onSelect,
}: {
  records?: RecordDetail[];
  isLoading: boolean;
  onSelect: (id: string) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!records?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
        <FileText className="h-8 w-8" />
        <p className="text-sm">No records found</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {records.map((r) => (
        <RecordRow key={r.id} record={r} onClick={() => onSelect(r.id)} />
      ))}
    </div>
  );
}

export default function RecordsPage() {
  const router = useRouter();
  const [params, setParams] = useState<RecordListParams>({ page: 1, limit: 20 });
  const [search, setSearch] = useState('');

  const allQuery = useRecords({ ...params, search: search || undefined });
  const mineQuery = useMyRecords();
  const pendingQuery = usePendingApprovals();

  const handleSelect = (id: string) => router.push(`/records/${id}`);

  return (
    <DashboardLayout>
    <div className="container max-w-4xl mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Records</h1>
          <p className="text-sm text-muted-foreground">Platform records and approvals</p>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Records</TabsTrigger>
          <TabsTrigger value="mine" className="gap-1">
            My Records
            {mineQuery.data?.length ? (
              <Badge variant="secondary" className="text-xs">{mineQuery.data.length}</Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-1">
            Pending Approval
            {pendingQuery.data?.length ? (
              <Badge variant="outline" className="text-xs">{pendingQuery.data.length}</Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4 mt-4">
          <Input
            placeholder="Search records…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <RecordList
            records={allQuery.data?.records}
            isLoading={allQuery.isLoading}
            onSelect={handleSelect}
          />
          {allQuery.data && allQuery.data.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={params.page === 1}
                onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) - 1 }))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {params.page} of {allQuery.data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={params.page === allQuery.data.totalPages}
                onClick={() => setParams((p) => ({ ...p, page: (p.page ?? 1) + 1 }))}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="mine" className="mt-4">
          <RecordList
            records={mineQuery.data}
            isLoading={mineQuery.isLoading}
            onSelect={handleSelect}
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <RecordList
            records={pendingQuery.data}
            isLoading={pendingQuery.isLoading}
            onSelect={handleSelect}
          />
        </TabsContent>
      </Tabs>
    </div>
    </DashboardLayout>
  );
}
