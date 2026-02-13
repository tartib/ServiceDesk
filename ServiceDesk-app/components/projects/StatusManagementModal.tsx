'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  DndContext,
  DragEndEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface WorkflowStatus {
  id: string;
  name: string;
  category: string;
  color: string;
}

interface StatusManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  statuses: WorkflowStatus[];
  onStatusesChange: (statuses: WorkflowStatus[]) => void;
  onAddStatus: () => void;
  onDeleteStatus: (statusId: string) => void;
}

interface SortableStatusItemProps {
  status: WorkflowStatus;
  onDelete: (statusId: string) => void;
}

function SortableStatusItem({ status, onDelete }: SortableStatusItemProps) {
  const { t } = useLanguage();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'todo':
        return t('projects.board.categoryTodo') || 'To Do';
      case 'in_progress':
        return t('projects.board.categoryInProgress') || 'In Progress';
      case 'done':
        return t('projects.board.categoryDone') || 'Done';
      default:
        return category;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
    >
      <button
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      
      <div
        className="w-4 h-4 rounded"
        style={{ backgroundColor: status.color }}
      />
      
      <div className="flex-1">
        <div className="font-medium text-gray-900">{status.name}</div>
        <div className="text-xs text-gray-500">{getCategoryLabel(status.category)}</div>
      </div>
      
      <button
        onClick={() => onDelete(status.id)}
        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
        aria-label={t('common.delete') || 'Delete'}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function StatusManagementModal({
  isOpen,
  onClose,
  statuses,
  onStatusesChange,
  onAddStatus,
  onDeleteStatus,
}: StatusManagementModalProps) {
  const { t } = useLanguage();
  const [localStatuses, setLocalStatuses] = useState(statuses);

  // Sync local state when parent statuses change (e.g. after refetch)
  useEffect(() => {
    setLocalStatuses(statuses);
  }, [statuses]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localStatuses.findIndex((item) => item.id === active.id);
      const newIndex = localStatuses.findIndex((item) => item.id === over.id);
      const reordered = arrayMove(localStatuses, oldIndex, newIndex);
      setLocalStatuses(reordered);
      onStatusesChange(reordered);
    }
  };

  const handleDelete = (statusId: string) => {
    const updatedStatuses = localStatuses.filter((s) => s.id !== statusId);
    setLocalStatuses(updatedStatuses);
    onDeleteStatus(statusId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {t('projects.board.manageWorkTypes') || 'Manage Workflow Statuses'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label={t('common.close') || 'Close'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              {t('projects.board.statusManagementDescription') || 'Drag to reorder statuses, or click the trash icon to delete. Add new statuses using the button below.'}
            </p>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localStatuses.map((s) => s.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {localStatuses.map((status) => (
                    <SortableStatusItem
                      key={status.id}
                      status={status}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <button
            onClick={onAddStatus}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">{t('projects.board.addStatus') || 'Add Status'}</span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {t('common.close') || 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
