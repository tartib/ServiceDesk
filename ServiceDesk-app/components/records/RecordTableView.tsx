'use client';

import React from 'react';
import type { RecordDetail } from '@/lib/domains/forms/records';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, ChevronUp, ChevronDown } from 'lucide-react';

export type SortField = 'id' | 'status' | 'submittedBy' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

interface Column {
  key: SortField;
  label: string;
  sortable?: boolean;
}

const COLUMNS: Column[] = [
  { key: 'id', label: 'Record', sortable: true },
  { key: 'submittedBy', label: 'Created By', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'createdAt', label: 'Date', sortable: true },
];

const STATUS_COLORS: Record<string, string> = {
  draft: 'secondary',
  submitted: 'default',
  pending_approval: 'outline',
  approved: 'default',
  rejected: 'destructive',
  in_progress: 'default',
  completed: 'default',
  cancelled: 'secondary',
};

interface RecordTableViewProps {
  records?: RecordDetail[];
  isLoading?: boolean;
  onSelect?: (record: RecordDetail) => void;
  sortField?: SortField;
  sortOrder?: SortOrder;
  onSort?: (field: SortField) => void;
  emptyMessage?: string;
}

export function RecordTableView({
  records,
  isLoading,
  onSelect,
  sortField,
  sortOrder = 'desc',
  onSort,
  emptyMessage = 'No records found',
}: RecordTableViewProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!records?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
        <FileText className="h-8 w-8" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left font-medium text-muted-foreground"
              >
                {col.sortable && onSort ? (
                  <button
                    onClick={() => onSort(col.key)}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    {col.label}
                    {sortField === col.key ? (
                      sortOrder === 'asc' ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )
                    ) : (
                      <span className="h-3.5 w-3.5 opacity-0 group-hover:opacity-50">
                        <ChevronDown className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr
              key={record.id}
              onClick={() => onSelect?.(record)}
              className={`border-b last:border-0 transition-colors ${
                onSelect ? 'cursor-pointer hover:bg-muted/50' : ''
              }`}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium">
                    Record #{record.id.slice(-8).toUpperCase()}
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {record.submittedBy.name}
              </td>
              <td className="px-4 py-3">
                <Badge variant={(STATUS_COLORS[record.status] ?? 'secondary') as 'default' | 'secondary' | 'destructive' | 'outline'}>
                  {record.status.replace(/_/g, ' ')}
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {new Date(record.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default RecordTableView;
