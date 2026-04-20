'use client';

import React, { useMemo } from 'react';
import type { RecordDetail } from '@/lib/domains/forms/records';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Clock, AlertCircle } from 'lucide-react';

interface RecordInboxViewProps {
  records?: RecordDetail[];
  isLoading?: boolean;
  onSelect?: (record: RecordDetail) => void;
  emptyMessage?: string;
}

const PRIORITY_ORDER: Record<string, number> = {
  pending_approval: 0,
  submitted: 1,
  in_progress: 2,
  draft: 3,
  approved: 4,
  completed: 5,
  rejected: 6,
  cancelled: 7,
};

function RecordInboxRow({
  record,
  onClick,
  isPriority,
}: {
  record: RecordDetail;
  onClick: () => void;
  isPriority: boolean;
}) {
  const age = Math.floor(
    (Date.now() - new Date(record.createdAt).getTime()) / (1000 * 60 * 60 * 24),
  );

  return (
    <div
      onClick={onClick}
      className={`flex items-start gap-3 p-4 border-b last:border-0 cursor-pointer transition-colors hover:bg-muted/50 ${
        isPriority ? 'border-l-2 border-l-warning' : ''
      }`}
    >
      {isPriority ? (
        <AlertCircle className="h-4 w-4 text-warning mt-0.5 shrink-0" />
      ) : (
        <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">
            Record #{record.id.slice(-8).toUpperCase()}
          </span>
          <Badge
            variant={isPriority ? 'outline' : 'secondary'}
            className="text-xs"
          >
            {record.status.replace(/_/g, ' ')}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          Submitted by {record.submittedBy.name}
          {record.submittedBy.department && ` · ${record.submittedBy.department}`}
        </p>
      </div>

      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
        <Clock className="h-3.5 w-3.5" />
        <span>{age === 0 ? 'Today' : `${age}d ago`}</span>
      </div>
    </div>
  );
}

export function RecordInboxView({
  records,
  isLoading,
  onSelect,
  emptyMessage = 'Inbox is empty',
}: RecordInboxViewProps) {
  const sorted = useMemo(() => {
    if (!records) return [];
    return [...records].sort((a, b) => {
      const pa = PRIORITY_ORDER[a.status] ?? 99;
      const pb = PRIORITY_ORDER[b.status] ?? 99;
      if (pa !== pb) return pa - pb;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [records]);

  const grouped = useMemo(() => {
    const priority = sorted.filter((r) => r.status === 'pending_approval');
    const rest = sorted.filter((r) => r.status !== 'pending_approval');
    return { priority, rest };
  }, [sorted]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sorted.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
        <FileText className="h-8 w-8" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      {grouped.priority.length > 0 && (
        <>
          <div className="px-4 py-2 bg-warning/10 border-b">
            <span className="text-xs font-semibold text-warning uppercase tracking-wider">
              Pending Approval ({grouped.priority.length})
            </span>
          </div>
          {grouped.priority.map((record) => (
            <RecordInboxRow
              key={record.id}
              record={record}
              onClick={() => onSelect?.(record)}
              isPriority
            />
          ))}
        </>
      )}
      {grouped.rest.length > 0 && (
        <>
          {grouped.priority.length > 0 && (
            <div className="px-4 py-2 bg-muted/40 border-b">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                All Records ({grouped.rest.length})
              </span>
            </div>
          )}
          {grouped.rest.map((record) => (
            <RecordInboxRow
              key={record.id}
              record={record}
              onClick={() => onSelect?.(record)}
              isPriority={false}
            />
          ))}
        </>
      )}
    </div>
  );
}

export default RecordInboxView;
