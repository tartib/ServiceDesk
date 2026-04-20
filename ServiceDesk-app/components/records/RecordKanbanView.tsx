'use client';

import React, { useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { RecordDetail } from '@/lib/domains/forms/records';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, GripVertical } from 'lucide-react';

const KANBAN_STATUSES = [
  { key: 'draft', label: 'Draft' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'pending_approval', label: 'Pending Approval' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'approved', label: 'Approved' },
  { key: 'completed', label: 'Completed' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'cancelled', label: 'Cancelled' },
];

const COLUMN_COLORS: Record<string, string> = {
  draft: 'bg-muted/50',
  submitted: 'bg-brand/5',
  pending_approval: 'bg-warning/5',
  in_progress: 'bg-info/5',
  approved: 'bg-success/5',
  completed: 'bg-success/10',
  rejected: 'bg-destructive/5',
  cancelled: 'bg-muted/30',
};

interface SortableCardProps {
  record: RecordDetail;
  onSelect?: (record: RecordDetail) => void;
}

function SortableCard({ record, onSelect }: SortableCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: record.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect?.(record)}
      className="bg-background rounded-lg border p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-1">
            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium truncate">
              #{record.id.slice(-8).toUpperCase()}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">{record.submittedBy.name}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(record.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  status: { key: string; label: string };
  records: RecordDetail[];
  onSelect?: (record: RecordDetail) => void;
}

function KanbanColumn({ status, records, onSelect }: KanbanColumnProps) {
  return (
    <div className={`flex flex-col rounded-lg ${COLUMN_COLORS[status.key] ?? 'bg-muted/40'} p-3 min-h-[200px] min-w-[220px] w-full`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {status.label}
        </span>
        <Badge variant="secondary" className="text-xs h-5 min-w-[20px] flex items-center justify-center">
          {records.length}
        </Badge>
      </div>
      <SortableContext items={records.map((r) => r.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 flex-1">
          {records.map((record) => (
            <SortableCard key={record.id} record={record} onSelect={onSelect} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

interface RecordKanbanViewProps {
  records?: RecordDetail[];
  isLoading?: boolean;
  onSelect?: (record: RecordDetail) => void;
  onStatusChange?: (recordId: string, newStatus: string) => void;
}

export function RecordKanbanView({
  records,
  isLoading,
  onSelect,
  onStatusChange,
}: RecordKanbanViewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const columns = useMemo(() => {
    const map: Record<string, RecordDetail[]> = {};
    KANBAN_STATUSES.forEach((s) => { map[s.key] = []; });
    (records ?? []).forEach((r) => {
      if (map[r.status]) {
        map[r.status].push(r);
      } else {
        map['draft'] = [...(map['draft'] ?? []), r];
      }
    });
    return map;
  }, [records]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeRecord = (records ?? []).find((r) => r.id === active.id);
    if (!activeRecord) return;

    const targetColumn = KANBAN_STATUSES.find((s) =>
      columns[s.key]?.some((r) => r.id === over.id),
    );
    if (targetColumn && targetColumn.key !== activeRecord.status) {
      onStatusChange?.(activeRecord.id, targetColumn.key);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const populatedColumns = KANBAN_STATUSES.filter((s) => columns[s.key]?.length > 0);
  const displayColumns = populatedColumns.length > 0 ? populatedColumns : KANBAN_STATUSES.slice(0, 4);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {displayColumns.map((status) => (
          <KanbanColumn
            key={status.key}
            status={status}
            records={columns[status.key] ?? []}
            onSelect={onSelect}
          />
        ))}
      </div>
    </DndContext>
  );
}

export default RecordKanbanView;
