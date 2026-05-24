'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ClipboardList, ChevronLeft, Zap, Eye } from 'lucide-react';
import { useCountTasks, useGenerateCountTasks } from '@/hooks/useCountTasks';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';
import type { InventoryCountTask, InvWarehouse, UserRef, InventoryCountSchedule } from '@/types';

const statusColor: Record<string, string> = {
  pending: 'text-muted-foreground bg-muted',
  in_progress: 'text-info bg-info/10',
  submitted: 'text-brand bg-brand-soft',
  under_review: 'text-warning bg-warning/10',
  approved: 'text-success bg-success/10',
  completed: 'text-success bg-success/10',
  rejected: 'text-destructive bg-destructive/10',
};

export default function CountTasksPage() {
  const { t } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const taskQuery = useCountTasks(statusFilter ? { status: statusFilter } : {});
  const taskData = taskQuery.data as { data?: { tasks?: InventoryCountTask[] } } | undefined;
  const tasks: InventoryCountTask[] = (taskData?.data?.tasks ?? []) as InventoryCountTask[];
  const isLoading = taskQuery.isLoading;

  const generateMut = useGenerateCountTasks();

  const handleGenerate = async () => {
    try {
      const res = await generateMut.mutateAsync(undefined);
      const count = (res as { data?: { count?: number } })?.data?.count ?? 0;
      toast.success(`${t('inventory.counts.toast.tasksGenerated')} (${count})`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('inventory.toast.operationFailed'));
    }
  };

  const getWarehouseName = (w: InvWarehouse | string) =>
    typeof w === 'object' ? w.warehouseName : w;
  const getUserName = (u: UserRef | string) =>
    typeof u === 'object' ? u.name : u;
  const getScheduleName = (s: InventoryCountSchedule | string) =>
    typeof s === 'object' ? s.name : s;

  const statuses = ['', 'pending', 'in_progress', 'submitted', 'under_review', 'approved', 'completed', 'rejected'];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/inventory/counts" className="p-2 rounded-lg border border-input hover:bg-muted transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('inventory.counts.tasks')}</h1>
              <p className="text-muted-foreground mt-1">{t('inventory.counts.title')}</p>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generateMut.isPending}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong transition-colors font-medium text-sm shadow-sm disabled:opacity-50"
          >
            <Zap className="w-4 h-4" /> {t('inventory.counts.generateTasks')}
          </button>
        </div>

        {/* Status filter */}
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                statusFilter === s
                  ? 'border-brand bg-brand text-brand-foreground'
                  : 'border-input text-muted-foreground hover:bg-muted'
              }`}
            >
              {s ? t(`inventory.counts.status.${s}`) : t('inventory.actions.all') || 'All'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">{t('inventory.messages.loading')}</div>
        ) : tasks.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <ClipboardList className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">{t('inventory.counts.noTasks')}</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('inventory.counts.countDate')}</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('inventory.counts.scheduleName')}</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('inventory.forms.fields.warehouse')}</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('inventory.counts.assignedTo')}</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">{t('inventory.forms.fields.item') || 'Items'}</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('inventory.status.title') || 'Status'}</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tasks.map((task) => {
                    const id = task._id || task.id;
                    return (
                      <tr key={id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs text-foreground">
                          {new Date(task.countDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-foreground">{getScheduleName(task.schedule)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{getWarehouseName(task.warehouse)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{getUserName(task.assignedTo)}</td>
                        <td className="px-4 py-3 text-center font-mono text-xs">{task.items.length}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[task.status] ?? ''}`}>
                            {t(`inventory.counts.status.${task.status}`)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/inventory/counts/tasks/${id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-input rounded-md hover:bg-muted transition-colors"
                          >
                            <Eye className="w-3 h-3" /> {t('inventory.actions.view') || 'View'}
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
