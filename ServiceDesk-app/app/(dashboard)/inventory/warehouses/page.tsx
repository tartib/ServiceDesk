'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Warehouse as WarehouseIcon, Plus, Edit, Trash2, ChevronLeft, X } from 'lucide-react';
import { useWarehouses, useCreateWarehouse, useUpdateWarehouse, useDeactivateWarehouse } from '@/hooks/useWarehouses';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';
import type { InvWarehouse } from '@/types';

interface WarehouseFormState {
  warehouseName: string;
  warehouseNameAr: string;
  code: string;
  address: string;
}

const EMPTY_FORM: WarehouseFormState = { warehouseName: '', warehouseNameAr: '', code: '', address: '' };

export default function WarehousesPage() {
  const { t } = useLanguage();
  const whQuery = useWarehouses(true);
  const whData = whQuery.data as { data?: { warehouses?: InvWarehouse[] } } | undefined;
  const warehouses: InvWarehouse[] = (whData?.data?.warehouses ?? []) as InvWarehouse[];
  const isLoading = whQuery.isLoading;

  const createMut = useCreateWarehouse();
  const updateMut = useUpdateWarehouse();
  const deactivateMut = useDeactivateWarehouse();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<InvWarehouse | null>(null);
  const [form, setForm] = useState<WarehouseFormState>(EMPTY_FORM);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setIsModalOpen(true); };
  const openEdit = (w: InvWarehouse) => {
    setEditing(w);
    setForm({ warehouseName: w.warehouseName, warehouseNameAr: w.warehouseNameAr || '', code: w.code, address: w.address || '' });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing._id || editing.id, data: form });
        toast.success('Warehouse updated');
      } else {
        await createMut.mutateAsync(form);
        toast.success('Warehouse created');
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm(t('inventory.warehouse.deleteConfirm') || 'Deactivate this warehouse?')) return;
    try {
      await deactivateMut.mutateAsync(id);
      toast.success('Warehouse deactivated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed');
    }
  };

  const inputCls = 'w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-ring focus:border-transparent';

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/inventory" className="p-2 rounded-lg border border-input hover:bg-muted transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{t('inventory.warehouse.title') || 'Warehouses'}</h1>
              <p className="text-muted-foreground mt-1">{t('inventory.warehouse.subtitle') || 'Manage warehouses'}</p>
            </div>
          </div>
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong transition-colors font-medium text-sm shadow-sm">
            <Plus className="w-4 h-4" />
            {t('inventory.warehouse.add') || 'Add Warehouse'}
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>
        ) : warehouses.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <WarehouseIcon className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-muted-foreground">{t('inventory.warehouse.noWarehouses') || 'No warehouses yet'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {warehouses.map((w) => (
              <div key={w._id || w.id} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-brand-soft flex items-center justify-center">
                      <WarehouseIcon className="w-5 h-5 text-brand" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{w.warehouseName}</h3>
                      {w.warehouseNameAr && <p className="text-sm text-muted-foreground" dir="rtl">{w.warehouseNameAr}</p>}
                    </div>
                  </div>
                  {w.isDefault && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-brand text-brand-foreground">
                      {t('inventory.warehouse.default') || 'Default'}
                    </span>
                  )}
                </div>
                <div className="mt-4 space-y-1 text-sm">
                  <p className="text-muted-foreground font-mono text-xs">{w.code}</p>
                  {w.address && <p className="text-muted-foreground">{w.address}</p>}
                  <span className={`text-xs font-medium ${w.status === 'active' ? 'text-success' : 'text-destructive'}`}>{w.status}</span>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                  <button onClick={() => openEdit(w)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-input rounded-md hover:bg-muted transition-colors">
                    <Edit className="w-3 h-3" /> Edit
                  </button>
                  {!w.isDefault && (
                    <button onClick={() => handleDeactivate(w._id || w.id)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 border border-input rounded-md transition-colors" disabled={deactivateMut.isPending}>
                      <Trash2 className="w-3 h-3" /> Deactivate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">{editing ? 'Edit Warehouse' : 'Add Warehouse'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Name *</label>
                <input className={inputCls} value={form.warehouseName} onChange={e => setForm(p => ({ ...p, warehouseName: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Name (Arabic)</label>
                <input className={inputCls} value={form.warehouseNameAr} onChange={e => setForm(p => ({ ...p, warehouseNameAr: e.target.value }))} dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Code *</label>
                <input className={inputCls} value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Address</label>
                <input className={inputCls} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors text-sm">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong transition-colors text-sm font-medium disabled:opacity-50" disabled={createMut.isPending || updateMut.isPending}>
                  {(createMut.isPending || updateMut.isPending) ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
