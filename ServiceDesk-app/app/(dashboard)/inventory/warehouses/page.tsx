'use client';

import { useState, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Warehouse as WarehouseIcon, Plus, Edit, Trash2, ChevronLeft } from 'lucide-react';
import { useWarehouses, useCreateWarehouse, useUpdateWarehouse, useDeactivateWarehouse } from '@/hooks/useWarehouses';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';
import type { InvWarehouse } from '@/types';
import { InventoryTransactionDialog } from '@/components/inventory/forms/InventoryTransactionDialog';
import { createWarehouseFormSchema } from '@/components/inventory/forms/schemas/warehouse.schema';

export default function WarehousesPage() {
  const { t } = useLanguage();
  const warehouseSchema = useMemo(() => createWarehouseFormSchema(t), [t]);
  const whQuery = useWarehouses(true);
  const whData = whQuery.data as { data?: { warehouses?: InvWarehouse[] } } | undefined;
  const warehouses: InvWarehouse[] = (whData?.data?.warehouses ?? []) as InvWarehouse[];
  const isLoading = whQuery.isLoading;

  const createMut = useCreateWarehouse();
  const updateMut = useUpdateWarehouse();
  const deactivateMut = useDeactivateWarehouse();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<InvWarehouse | null>(null);

  const openCreate = () => { setEditing(null); setIsModalOpen(true); };
  const openEdit = (w: InvWarehouse) => { setEditing(w); setIsModalOpen(true); };

  const handleSubmit = useCallback(async (data: Record<string, unknown>) => {
    const payload = {
      warehouseName: data.warehouseName as string,
      warehouseNameAr: (data.warehouseNameAr as string) || '',
      code: data.code as string,
      address: (data.address as string) || '',
    };
    try {
      if (editing) {
        await updateMut.mutateAsync({ id: editing._id || editing.id, data: payload });
        toast.success(t('inventory.toast.warehouseUpdated'));
      } else {
        await createMut.mutateAsync(payload);
        toast.success(t('inventory.toast.warehouseCreated'));
      }
      setEditing(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('inventory.toast.operationFailed'));
      throw err; // re-throw so dialog stays open
    }
  }, [editing, createMut, updateMut]);

  const handleDeactivate = async (id: string) => {
    if (!confirm(t('inventory.warehouse.deleteConfirm') || 'Deactivate this warehouse?')) return;
    try {
      await deactivateMut.mutateAsync(id);
      toast.success(t('inventory.toast.warehouseDeactivated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('inventory.toast.operationFailed'));
    }
  };

  const editOverrides = useMemo(() => {
    if (!editing) return undefined;
    return {
      warehouseName: editing.warehouseName,
      warehouseNameAr: editing.warehouseNameAr || '',
      code: editing.code,
      address: editing.address || '',
    };
  }, [editing]);

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
          <div className="flex items-center justify-center py-20 text-muted-foreground">{t('inventory.messages.loading')}</div>
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
                  <span className={`text-xs font-medium ${w.status === 'active' ? 'text-success' : 'text-destructive'}`}>{t(`inventory.status.${w.status === 'active' ? 'active' : 'inactive'}`)}</span>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
                  <button onClick={() => openEdit(w)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-input rounded-md hover:bg-muted transition-colors">
                    <Edit className="w-3 h-3" /> {t('inventory.actions.edit')}
                  </button>
                  {!w.isDefault && (
                    <button onClick={() => handleDeactivate(w._id || w.id)} className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 border border-input rounded-md transition-colors" disabled={deactivateMut.isPending}>
                      <Trash2 className="w-3 h-3" /> {t('inventory.actions.deactivate')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <InventoryTransactionDialog
          open={isModalOpen}
          onOpenChange={(open) => { if (!open) { setIsModalOpen(false); setEditing(null); } }}
          schema={warehouseSchema}
          onSubmit={handleSubmit}
          overrides={editOverrides}
        />
      )}
    </DashboardLayout>
  );
}
