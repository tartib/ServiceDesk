'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ChevronLeft, Play, Send, CheckCircle, XCircle } from 'lucide-react';
import {
  useCountTask,
  useStartCountTask,
  useUpdateCountItem,
  useUpdateVarianceReason,
  useSubmitCountTask,
  useReviewCountTask,
} from '@/hooks/useCountTasks';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';
import type { InventoryCountTask, InvWarehouse, UserRef, InventoryCountSchedule, CountTaskItem } from '@/types';

const statusColor: Record<string, string> = {
  pending: 'text-muted-foreground bg-muted',
  in_progress: 'text-info bg-info/10',
  submitted: 'text-brand bg-brand-soft',
  under_review: 'text-warning bg-warning/10',
  approved: 'text-success bg-success/10',
  completed: 'text-success bg-success/10',
  rejected: 'text-destructive bg-destructive/10',
};

export default function CountTaskDetailPage() {
  const params = useParams();
  const taskId = params.id as string;
  const { t } = useLanguage();

  const taskQuery = useCountTask(taskId);
  const taskData = taskQuery.data as { data?: { task?: InventoryCountTask } } | undefined;
  const task = taskData?.data?.task;
  const isLoading = taskQuery.isLoading;

  const startMut = useStartCountTask();
  const updateItemMut = useUpdateCountItem();
  const updateReasonMut = useUpdateVarianceReason();
  const submitMut = useSubmitCountTask();
  const reviewMut = useReviewCountTask();

  const [rejectionReason, setRejectionReason] = useState('');

  const getWarehouseName = (w: InvWarehouse | string) => typeof w === 'object' ? w.warehouseName : w;
  const getUserName = (u: UserRef | string) => typeof u === 'object' ? u.name : u;
  const getScheduleName = (s: InventoryCountSchedule | string) => typeof s === 'object' ? s.name : s;

  const handleStart = async () => {
    try {
      await startMut.mutateAsync(taskId);
      toast.success(t('inventory.counts.toast.taskStarted'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('inventory.toast.operationFailed'));
    }
  };

  const handleUpdateItem = async (index: number, actualQuantity: number) => {
    try {
      await updateItemMut.mutateAsync({ taskId, itemIndex: index, actualQuantity });
      toast.success(t('inventory.counts.toast.itemUpdated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('inventory.toast.operationFailed'));
    }
  };

  const handleUpdateReason = async (index: number, reason: string) => {
    try {
      await updateReasonMut.mutateAsync({ taskId, itemIndex: index, varianceReason: reason });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('inventory.toast.operationFailed'));
    }
  };

  const handleSubmit = async () => {
    try {
      await submitMut.mutateAsync(taskId);
      toast.success(t('inventory.counts.toast.taskSubmitted'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('inventory.toast.operationFailed'));
    }
  };

  const handleApprove = async () => {
    try {
      await reviewMut.mutateAsync({ id: taskId, action: 'approve' });
      toast.success(t('inventory.counts.toast.taskApproved'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('inventory.toast.operationFailed'));
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error(t('inventory.counts.rejectionReasonPlaceholder'));
      return;
    }
    try {
      await reviewMut.mutateAsync({ id: taskId, action: 'reject', rejectionReason });
      toast.success(t('inventory.counts.toast.taskRejected'));
      setRejectionReason('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('inventory.toast.operationFailed'));
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20 text-muted-foreground">{t('inventory.messages.loading')}</div>
      </DashboardLayout>
    );
  }

  if (!task) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 text-muted-foreground">Task not found</div>
      </DashboardLayout>
    );
  }

  const canCount = task.status === 'in_progress';
  const canSubmit = task.status === 'in_progress';
  const canReview = task.status === 'submitted' || task.status === 'under_review';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/inventory/counts/tasks" className="p-2 rounded-lg border border-input hover:bg-muted transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {getScheduleName(task.schedule)} — {new Date(task.countDate).toLocaleDateString()}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[task.status] ?? ''}`}>
                  {t(`inventory.counts.status.${task.status}`)}
                </span>
                <span className="text-sm text-muted-foreground">{getWarehouseName(task.warehouse)}</span>
                <span className="text-sm text-muted-foreground">→ {getUserName(task.assignedTo)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {task.status === 'pending' && (
              <button
                onClick={handleStart}
                disabled={startMut.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong transition-colors text-sm font-medium disabled:opacity-50"
              >
                <Play className="w-4 h-4" /> {t('inventory.counts.actions.start')}
              </button>
            )}
            {canSubmit && (
              <button
                onClick={handleSubmit}
                disabled={submitMut.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong transition-colors text-sm font-medium disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> {t('inventory.counts.actions.submit')}
              </button>
            )}
            {canReview && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={reviewMut.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-success text-white rounded-lg hover:bg-success/90 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" /> {t('inventory.counts.actions.approve')}
                </button>
                <button
                  onClick={handleReject}
                  disabled={reviewMut.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" /> {t('inventory.counts.actions.reject')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Rejection reason for rejected tasks */}
        {task.status === 'rejected' && task.rejectionReason && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm font-medium text-destructive">{t('inventory.counts.rejectionReason')}</p>
            <p className="text-sm text-destructive/80 mt-1">{task.rejectionReason}</p>
          </div>
        )}

        {/* Rejection reason input for reviewer */}
        {canReview && (
          <div className="bg-card border border-border rounded-lg p-4">
            <label className="block text-sm font-medium text-foreground mb-2">{t('inventory.counts.rejectionReason')}</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t('inventory.counts.rejectionReasonPlaceholder')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/50 min-h-[80px]"
            />
          </div>
        )}

        {/* Items table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">#</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('inventory.forms.fields.item') || 'Item'}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">SKU</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">{t('inventory.counts.systemQty')}</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">{t('inventory.counts.actualQty')}</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">{t('inventory.counts.variance')}</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('inventory.counts.varianceReason')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {task.items.map((item: CountTaskItem, index: number) => {
                  const variance = item.variance ?? (item.actualQuantity !== undefined ? item.actualQuantity - item.systemQuantity : undefined);
                  const hasVariance = variance !== undefined && variance !== 0;

                  return (
                    <tr key={index} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{index + 1}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{item.itemName}</td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{item.sku}</td>
                      <td className="px-4 py-3 text-center font-mono">{item.systemQuantity}</td>
                      <td className="px-4 py-3 text-center">
                        {canCount ? (
                          <input
                            type="number"
                            min={0}
                            defaultValue={item.actualQuantity ?? ''}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val)) handleUpdateItem(index, val);
                            }}
                            className="w-20 rounded border border-input bg-background px-2 py-1 text-center text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                          />
                        ) : (
                          <span className="font-mono">{item.actualQuantity ?? '—'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {variance !== undefined ? (
                          <span className={`font-mono font-medium ${variance > 0 ? 'text-success' : variance < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {variance > 0 ? '+' : ''}{variance}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {hasVariance && canCount ? (
                          <input
                            type="text"
                            defaultValue={item.varianceReason ?? ''}
                            placeholder={t('inventory.counts.varianceReasonPlaceholder')}
                            onBlur={(e) => {
                              if (e.target.value.trim()) handleUpdateReason(index, e.target.value.trim());
                            }}
                            className="w-full min-w-[180px] rounded border border-input bg-background px-2 py-1 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
                          />
                        ) : (
                          <span className="text-sm text-muted-foreground">{item.varianceReason || '—'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
