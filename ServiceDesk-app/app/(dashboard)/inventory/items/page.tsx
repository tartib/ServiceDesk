'use client';

import { useState, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Package, Plus, ChevronLeft, ChevronRight, Search, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';
import { useInventoryItems, useCreateItem, useUpdateItem, useDeactivateItem } from '@/hooks/useInventoryItems';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import type { InventoryItem, InventoryItemFormData } from '@/types';
import { InventoryTransactionDialog } from '@/components/inventory/forms/InventoryTransactionDialog';
import { createAddItemFormSchema } from '@/components/inventory/forms/schemas/add-item.schema';
import { createEditItemFormSchema } from '@/components/inventory/forms/schemas/edit-item.schema';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function ItemsPage() {
  const { t } = useLanguage();

  const addItemSchema = useMemo(() => createAddItemFormSchema(t), [t]);
  const editItemSchema = useMemo(() => createEditItemFormSchema(t), [t]);

  const [search, setSearch] = useState('');
  const [groupName] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState('partNo');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);

  const filters = useMemo(() => {
    const f: Record<string, string | number> = { page, pageSize, sortBy, sortOrder };
    if (search) f.search = search;
    if (groupName) f.groupName = groupName;
    if (status) f.status = status;
    return f;
  }, [search, groupName, status, page, pageSize, sortBy, sortOrder]);

  const { data: itemsData, isLoading, isFetching } = useInventoryItems(filters);
  const result = (itemsData as { data?: { items?: InventoryItem[]; pagination?: { page: number; pageSize: number; totalItems: number; totalPages: number } } } | undefined)?.data ?? {};
  const items: InventoryItem[] = result.items ?? [];
  const pagination = result.pagination ?? { page: 1, pageSize: 25, totalItems: 0, totalPages: 1 };

  const createMut = useCreateItem();
  const updateMut = useUpdateItem();
  const deactivateMut = useDeactivateItem();

  const toggleSort = useCallback((field: string) => {
    setSortBy((prev: string) => {
      if (prev === field) {
        setSortOrder((o: 'asc' | 'desc') => (o === 'asc' ? 'desc' : 'asc'));
        return field;
      }
      setSortOrder('asc');
      return field;
    });
    setPage(1);
  }, []);

  const SortIndicator = ({ field }: { field: string }) => {
    if (sortBy !== field) return <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity" />;
    return sortOrder === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-brand" />
      : <ChevronDown className="w-3.5 h-3.5 text-brand" />;
  };

  const startIdx = pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const endIdx = Math.min(pagination.page * pagination.pageSize, pagination.totalItems);

  const handleSave = useCallback(async (data: Record<string, unknown>) => {
    try {
      const formData: InventoryItemFormData = {
        partNo: data.partNo as string,
        partDescription: data.partDescription as string,
        partDescriptionAr: (data.partDescriptionAr as string) || undefined,
        groupName: data.groupName as string,
        uom: data.uom as string,
        cost: (data.cost as number) ?? 0,
        minStock: (data.minStock as number) ?? 0,
        maxStock: (data.maxStock as number) ?? 0,
        reorderLevel: (data.reorderLevel as number) ?? 0,
        image: (data.image as string) || undefined,
      };
      if (editItem) {
        await updateMut.mutateAsync({ id: editItem._id || editItem.id, data: formData });
        toast.success(t('inventory.toast.itemUpdated'));
      } else {
        await createMut.mutateAsync(formData);
        toast.success(t('inventory.toast.itemCreated'));
      }
      setEditItem(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('inventory.toast.saveFailed'));
      throw err; // re-throw so dialog stays open
    }
  }, [editItem, createMut, updateMut]);

  const openEdit = (item: InventoryItem) => {
    setEditItem(item);
    setShowModal(true);
  };

  const openAdd = () => {
    setEditItem(null);
    setShowModal(true);
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateMut.mutateAsync(id);
      toast.success(t('inventory.toast.itemDeactivated'));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('inventory.toast.operationFailed'));
    }
  };

  // Build overrides for edit mode (pre-fill form with existing item data)
  const editOverrides = useMemo(() => {
    if (!editItem) return undefined;
    return {
      partNo: editItem.partNo,
      partDescription: editItem.partDescription,
      partDescriptionAr: editItem.partDescriptionAr ?? '',
      groupName: editItem.groupName,
      uom: editItem.uom,
      cost: editItem.cost,
      minStock: editItem.minStock,
      maxStock: editItem.maxStock,
      reorderLevel: editItem.reorderLevel,
      image: editItem.image ?? '',
    };
  }, [editItem]);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('inventory.items.title') || 'Inventory Items'}</h1>
            <p className="text-muted-foreground mt-1">{t('inventory.items.subtitle') || 'Manage parts catalog'}</p>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong transition-colors font-medium text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {t('inventory.addItem') || 'Add Item'}
          </button>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border border-border shadow-sm">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-border">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                className="w-full h-8 pl-8 pr-3 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30"
                placeholder="Search..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select className="h-8 px-2.5 text-sm border border-input rounded-md bg-background" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {[
                        { key: 'partNo', label: 'Part No', align: 'text-left' },
                        { key: 'partDescription', label: 'Description', align: 'text-left' },
                        { key: 'groupName', label: 'Group', align: 'text-left' },
                        { key: 'uom', label: 'UoM', align: 'text-left' },
                        { key: 'cost', label: 'Cost', align: 'text-right' },
                        { key: 'reorderLevel', label: 'Reorder', align: 'text-right' },
                        { key: 'status', label: 'Status', align: 'text-left' },
                      ].map(col => (
                        <th key={col.key} onClick={() => toggleSort(col.key)} className={`group px-4 py-3 ${col.align} text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap`}>
                          <span className="inline-flex items-center gap-1">{col.label}<SortIndicator field={col.key} /></span>
                        </th>
                      ))}
                      <th className="px-4 py-3 w-24" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr><td colSpan={8} className="py-16 text-center"><Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" /><p className="text-sm text-muted-foreground">No items found</p></td></tr>
                    ) : items.map((item, idx) => (
                      <tr key={item._id || item.id} className={`border-b border-border/50 hover:bg-accent/50 transition-colors ${idx % 2 === 1 ? 'bg-muted/20' : ''} ${isFetching ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{item.partNo}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.partDescription}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{item.groupName}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground uppercase">{item.uom}</td>
                        <td className="px-4 py-3 text-sm text-foreground text-right tabular-nums">{item.cost?.toFixed(2) ?? '—'}</td>
                        <td className="px-4 py-3 text-sm text-foreground text-right tabular-nums">{item.reorderLevel}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-md ${item.status === 'active' ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>{item.status}</span>
                        </td>
                        <td className="px-4 py-3 text-sm flex items-center gap-1">
                          <button onClick={() => openEdit(item)} className="px-2 py-1 text-xs text-brand hover:underline">Edit</button>
                          {item.status === 'active' && (
                            <button onClick={() => handleDeactivate(item._id || item.id)} className="px-2 py-1 text-xs text-destructive hover:underline">Deactivate</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border">
                <p className="text-sm text-muted-foreground">Showing <span className="font-medium text-foreground">{startIdx}–{endIdx}</span> of <span className="font-medium text-foreground">{pagination.totalItems}</span></p>
                <div className="flex items-center gap-3">
                  <select className="h-8 px-2 text-sm border border-input rounded-md bg-background text-foreground" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
                    {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}/page</option>)}
                  </select>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background disabled:opacity-30 hover:bg-muted transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="text-sm text-muted-foreground px-2 tabular-nums">{pagination.page}/{pagination.totalPages || 1}</span>
                    <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background disabled:opacity-30 hover:bg-muted transition-colors"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showModal && (
        <InventoryTransactionDialog
          open={showModal}
          onOpenChange={(open) => { if (!open) { setShowModal(false); setEditItem(null); } }}
          schema={editItem ? editItemSchema : addItemSchema}
          onSubmit={handleSave}
          overrides={editOverrides}
        />
      )}
    </DashboardLayout>
  );
}
