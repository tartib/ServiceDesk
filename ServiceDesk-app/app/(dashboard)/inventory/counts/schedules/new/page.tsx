'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ChevronLeft, Save } from 'lucide-react';
import { useCreateCountSchedule } from '@/hooks/useCountSchedules';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { InvWarehouse, InventoryItem, CountFrequency, WeeklyDay } from '@/types';

export default function NewCountSchedulePage() {
  const { t } = useLanguage();
  const router = useRouter();
  const createMut = useCreateCountSchedule();

  const whQuery = useWarehouses(true);
  const whData = whQuery.data as { data?: { warehouses?: InvWarehouse[] } } | undefined;
  const warehouses: InvWarehouse[] = (whData?.data?.warehouses ?? []) as InvWarehouse[];

  const [form, setForm] = useState({
    name: '',
    frequency: 'daily' as CountFrequency,
    warehouseId: '',
    itemIds: [] as string[],
    assignedTo: '',
    startDate: new Date().toISOString().split('T')[0],
    dueTime: '17:00',
    weeklyDay: 'sun' as WeeklyDay,
    varianceThreshold: 5,
    notes: '',
  });

  const handleChange = (field: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.warehouseId || !form.assignedTo || !form.startDate || !form.dueTime) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      await createMut.mutateAsync({
        name: form.name,
        frequency: form.frequency,
        warehouseId: form.warehouseId,
        itemIds: form.itemIds,
        assignedTo: form.assignedTo,
        startDate: form.startDate,
        dueTime: form.dueTime,
        weeklyDay: form.frequency === 'weekly' ? form.weeklyDay : undefined,
        varianceThreshold: form.varianceThreshold,
        notes: form.notes || undefined,
      });
      toast.success(t('inventory.counts.toast.scheduleCreated'));
      router.push('/inventory/counts');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('inventory.toast.operationFailed'));
    }
  };

  const weekDays: WeeklyDay[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/inventory/counts" className="p-2 rounded-lg border border-input hover:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{t('inventory.counts.createSchedule')}</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{t('inventory.counts.scheduleName')}</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder={t('inventory.counts.scheduleNamePlaceholder')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
              required
            />
          </div>

          {/* Frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('inventory.counts.frequency')}</label>
              <select
                value={form.frequency}
                onChange={(e) => handleChange('frequency', e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              >
                <option value="daily">{t('inventory.counts.daily')}</option>
                <option value="weekly">{t('inventory.counts.weekly')}</option>
              </select>
            </div>
            {form.frequency === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">{t('inventory.counts.weeklyDay')}</label>
                <select
                  value={form.weeklyDay}
                  onChange={(e) => handleChange('weeklyDay', e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                >
                  {weekDays.map((d) => (
                    <option key={d} value={d} className="capitalize">{d.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Warehouse */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{t('inventory.forms.fields.warehouse')}</label>
            <select
              value={form.warehouseId}
              onChange={(e) => handleChange('warehouseId', e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
              required
            >
              <option value="">{t('inventory.forms.fields.selectWarehouse')}</option>
              {warehouses.map((w) => (
                <option key={w._id || w.id} value={w._id || w.id}>{w.warehouseName}</option>
              ))}
            </select>
          </div>

          {/* Assigned To (user ID input for now) */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{t('inventory.counts.assignedTo')}</label>
            <input
              type="text"
              value={form.assignedTo}
              onChange={(e) => handleChange('assignedTo', e.target.value)}
              placeholder={t('inventory.forms.fields.selectUser')}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
              required
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('inventory.counts.startDate')}</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t('inventory.counts.dueTime')}</label>
              <input
                type="time"
                value={form.dueTime}
                onChange={(e) => handleChange('dueTime', e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
                required
              />
            </div>
          </div>

          {/* Variance Threshold */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{t('inventory.counts.varianceThreshold')}</label>
            <input
              type="number"
              min={0}
              max={100}
              value={form.varianceThreshold}
              onChange={(e) => handleChange('varianceThreshold', parseInt(e.target.value, 10))}
              className="w-32 rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
            <p className="text-xs text-muted-foreground mt-1">{t('inventory.counts.varianceThresholdHelper')}</p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">{t('inventory.forms.fields.notes')}</label>
            <textarea
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand/50"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={createMut.isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong transition-colors font-medium text-sm shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {t('inventory.counts.createSchedule')}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
