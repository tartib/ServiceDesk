'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useParams, useRouter } from 'next/navigation';
import { useFormDefinition } from '@/hooks/useFormDefinitions';
import { useRecordsByDefinition, useRecordViewMode } from '@/hooks/useRecordViews';
import { useApproveRecord, useRejectRecord, useAddRecordComment } from '@/hooks/useRecords';
import { RecordTableView, RecordKanbanView, RecordInboxView, RecordDetailDrawer } from '@/components/records';
import type { RecordDetail } from '@/lib/domains/forms/records';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LayoutList, Columns, Inbox, ArrowLeft, RefreshCw } from 'lucide-react';

export default function DefinitionRecordsPage() {
  const params = useParams<{ definitionId: string }>();
  const router = useRouter();
  const definitionId = params.definitionId;

  const { viewMode, setViewMode } = useRecordViewMode('table');
  const [selectedRecord, setSelectedRecord] = useState<RecordDetail | null>(null);

  const { data: definition, isLoading: defLoading } = useFormDefinition(definitionId);
  const { data: result, isLoading: recordsLoading, refetch } = useRecordsByDefinition(definitionId);

  const approveRecordMutation = useApproveRecord();
  const rejectRecordMutation = useRejectRecord();
  const addCommentMutation = useAddRecordComment();

  const records = result?.records ?? [];
  const isLoading = defLoading || recordsLoading;

  const handleApprove = async (record: RecordDetail) => {
    await approveRecordMutation.mutateAsync({ id: record.id, approverId: '' });
    setSelectedRecord(null);
    refetch();
  };

  const handleReject = async (record: RecordDetail, reason: string) => {
    await rejectRecordMutation.mutateAsync({ id: record.id, approverId: '', reason });
    setSelectedRecord(null);
    refetch();
  };

  const handleComment = async (record: RecordDetail, text: string) => {
    await addCommentMutation.mutateAsync({ id: record.id, text });
    refetch();
  };

  return (
    <DashboardLayout>
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/records')}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
          All Records
        </Button>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-semibold">
              {defLoading ? '...' : (definition?.name ?? 'Records')}
            </h1>
            <Badge variant="outline" className="text-xs">
              Project View
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {records.length} record{records.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          {/* View mode switcher */}
          <div className="flex rounded-md border p-0.5 gap-0.5">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'table' ? 'bg-muted' : 'hover:bg-muted/50'}`}
              title="Table view"
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'kanban' ? 'bg-muted' : 'hover:bg-muted/50'}`}
              title="Kanban view"
            >
              <Columns className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('inbox')}
              className={`p-1.5 rounded transition-colors ${viewMode === 'inbox' ? 'bg-muted' : 'hover:bg-muted/50'}`}
              title="Inbox view"
            >
              <Inbox className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* View */}
      {viewMode === 'table' && (
        <RecordTableView
          records={records}
          isLoading={isLoading}
          onSelect={setSelectedRecord}
        />
      )}

      {viewMode === 'kanban' && (
        <RecordKanbanView
          records={records}
          isLoading={isLoading}
          onSelect={setSelectedRecord}
        />
      )}

      {viewMode === 'inbox' && (
        <RecordInboxView
          records={records}
          isLoading={isLoading}
          onSelect={setSelectedRecord}
        />
      )}

      {/* Detail drawer */}
      <RecordDetailDrawer
        record={selectedRecord}
        open={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onApprove={handleApprove}
        onReject={handleReject}
        onComment={handleComment}
        isActioning={approveRecordMutation.isPending || rejectRecordMutation.isPending}
      />
    </div>
    </DashboardLayout>
  );
}
