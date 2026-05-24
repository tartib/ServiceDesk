'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { CalendarClock, Plus, Pause, Play, Archive, ChevronLeft, ClipboardList } from 'lucide-react';
import {
  useCountSchedules,
  usePauseSchedule,
  useResumeSchedule,
  useArchiveSchedule,
} from '@/hooks/useCountSchedules';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';
import type { InventoryCountSchedule, InvWarehouse, UserRef } from '@/types';

export default function CountSchedulesPage() {
  const { t } = useLanguage();
  const schedQuery = useCountSchedules();
  const schedData = schedQuery.data as { data?: { schedules?: InventoryCountSchedule[] } } | undefined;
  const schedules: InventoryCountSchedule[] = (schedData?.data?.schedules ?? []) as InventoryCountSchedule[];
  const isLoading = schedQuery.isLoading;

  const pauseMut = usePauseSchedule();
  const resumeMut = useResumeSchedule();
  const archiveMut = useArchiveSchedule();

  const handlePause = async (id: string) => {
    try {
      await pauseMut.mutateAsync(id);
      toast.success(t('inventory.counts.toast.schedulePaused'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('inventory.toast.operationFailed'));
    }
  };

  const handleResume = async (id: string) => {
    try {
      await resumeMut.mutateAsync(id);
      toast.success(t('inventory.counts.toast.scheduleResumed'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('inventory.toast.operationFailed'));
    }
  };

  const handleArchive = async (id: string) => {
    if (!confirm('Archive this schedule?')) return;
    try {
      await archiveMut.mutateAsync(id);
      toast.success(t('inventory.counts.toast.scheduleArchived'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('inventory.toast.operationFailed'));
    }
  };

  const getWarehouseName = (w: InvWarehouse | string) =>
    typeof w === 'object' ? w.warehouseName : w;
  const getUserName = (u: UserRef | string) =>
    typeof u === 'object' ? u.name : u;

  const statusColor: Record<string, string> = {
    active: 'text-success bg-success/10',
    paused: 'text-warning bg-warning/10',
    archived: 'text-muted-foreground bg-muted',
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/inventory" className="p-2 rounded-lg border border-input hover:bg-muted transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('inventory.counts.title')}</h1>
              <p className="text-muted-foreground mt-1">{t('inventory.counts.schedules')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/inventory/counts/tasks"
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-input text-foreground rounded-lg hover:bg-muted transition-colors font-medium text-sm"
            >
              <ClipboardList className="w-4 h-4" /> {t('inventory.counts.tasks')}
            </Link>
            <Link
              href="/inventory/counts/schedules/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong transition-colors font-medium text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" /> {t('inventory.counts.createSchedule')}
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">{t('inventory.messages.loading')}</div>
        ) : schedules.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <CalendarClock className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">{t('inventory.counts.noSchedules')}</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('inventory.counts.scheduleName')}</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('inventory.counts.frequency')}</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('inventory.forms.fields.warehouse')}</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('inventory.counts.assignedTo')}</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('inventory.counts.dueTime')}</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">{t('inventory.status.title') || 'Status'}</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t('inventory.actions.title') || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {schedules.map((s) => {
                    const id = s._id || s.id;
                    return (
                      <tr key={id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-info/10 text-info">
                            {t(`inventory.counts.${s.frequency}`)}
                          </span>
                          {s.frequency === 'weekly' && s.weeklyDay && (
                            <span className="ml-1 text-xs text-muted-foreground capitalize">({s.weeklyDay})</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{getWarehouseName(s.warehouse)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{getUserName(s.assignedTo)}</td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{s.dueTime}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[s.status] ?? ''}`}>
                            {t(`inventory.counts.scheduleStatus.${s.status}`)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {s.status === 'active' && (
                              <button
                                onClick={() => handlePause(id)}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-warning hover:bg-warning/10 transition-colors"
                                title={t('inventory.counts.actions.pause')}
                              >
                                <Pause className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {s.status === 'paused' && (
                              <button
                                onClick={() => handleResume(id)}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-success hover:bg-success/10 transition-colors"
                                title={t('inventory.counts.actions.resume')}
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {s.status !== 'archived' && (
                              <button
                                onClick={() => handleArchive(id)}
                                className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                title={t('inventory.counts.actions.archive')}
                              >
                                <Archive className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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
