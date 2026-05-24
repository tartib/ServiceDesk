'use client';

import { useState, useMemo, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Package, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search, ArrowUpDown, Warehouse, ClipboardList, CalendarClock } from 'lucide-react';
import { useStockBalances } from '@/hooks/useStockBalances';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import type { StockBalance } from '@/types';

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export default function InventoryPage() {
  const { t } = useLanguage();

  const [search, setSearch] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [alertStatus, setAlertStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState('partNo');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const warehousesQuery = useWarehouses();
  const whData = warehousesQuery.data as { data?: { warehouses?: Array<{ _id?: string; id?: string; warehouseName: string; isDefault?: boolean }> } } | undefined;
  const warehouses = whData?.data?.warehouses ?? [];

  const filters = useMemo(() => {
    const f: Record<string, string | number> = { page, pageSize, sortBy, sortOrder };
    if (search) f.search = search;
    if (selectedWarehouseId) f.warehouseId = selectedWarehouseId;
    if (alertStatus) f.alertStatus = alertStatus;
    return f;
  }, [search, selectedWarehouseId, alertStatus, page, pageSize, sortBy, sortOrder]);

  const { data: balanceData, isLoading, isFetching } = useStockBalances(filters);
  const result = (balanceData as { data?: { items?: StockBalance[]; pagination?: { page: number; pageSize: number; totalItems: number; totalPages: number } } } | undefined)?.data ?? {};
  const items: StockBalance[] = result.items ?? [];
  const pagination = result.pagination ?? { page: 1, pageSize: 25, totalItems: 0, totalPages: 1 };

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

  const getAlertBadge = (row: StockBalance) => {
    const reorder = row.partDoc?.reorderLevel ?? 0;
    if (row.available <= 0) return { dot: 'bg-destructive', bg: 'bg-destructive/10', text: 'text-destructive', label: t('inventory.status.outOfStock') || 'Out of Stock' };
    if (row.available <= reorder) return { dot: 'bg-warning', bg: 'bg-warning/10', text: 'text-warning', label: t('inventory.status.lowStock') || 'Low Stock' };
    return { dot: 'bg-success', bg: 'bg-success/10', text: 'text-success', label: t('inventory.status.inStock') || 'Normal' };
  };

  const startIdx = pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const endIdx = Math.min(pagination.page * pagination.pageSize, pagination.totalItems);

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('inventory.title') || 'Inventory'}</h1>
            <p className="text-muted-foreground mt-1">{t('inventory.subtitle') || 'Stock balances across warehouses'}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/inventory/items" className="inline-flex items-center gap-2 px-4 py-2.5 border border-input text-foreground rounded-lg hover:bg-muted transition-colors font-medium text-sm">
              <Package className="w-4 h-4" />
              {t('inventory.items.title') || 'Items'}
            </Link>
            <Link href="/inventory/warehouses" className="inline-flex items-center gap-2 px-4 py-2.5 border border-input text-foreground rounded-lg hover:bg-muted transition-colors font-medium text-sm">
              <Warehouse className="w-4 h-4" />
              {t('inventory.warehouse.title') || 'Warehouses'}
            </Link>
            <Link href="/inventory/counts" className="inline-flex items-center gap-2 px-4 py-2.5 border border-input text-foreground rounded-lg hover:bg-muted transition-colors font-medium text-sm">
              <CalendarClock className="w-4 h-4" />
              {t('inventory.counts.title') || 'Counts'}
            </Link>
            <Link href="/inventory/transactions" className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong transition-colors font-medium text-sm shadow-sm">
              <ClipboardList className="w-4 h-4" />
              {t('inventory.transactions.title') || 'Transactions'}
            </Link>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-card rounded-xl border border-border shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-border">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                className="w-full h-8 pl-8 pr-3 text-sm border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30"
                placeholder={t('inventory.search') || 'Search part no, description, group...'}
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select
              className="h-8 px-2.5 text-sm border border-input rounded-md bg-background text-foreground font-medium"
              value={selectedWarehouseId}
              onChange={e => { setSelectedWarehouseId(e.target.value); setPage(1); }}
            >
              <option value="">{t('inventory.warehouse.all') || 'All Warehouses'}</option>
              {warehouses.map((w) => (
                <option key={w._id || w.id} value={w._id || w.id || ''}>
                  {w.warehouseName}{w.isDefault ? ` (${t('inventory.warehouse.default') || 'Default'})` : ''}
                </option>
              ))}
            </select>
            <select
              className="h-8 px-2.5 text-sm border border-input rounded-md bg-background text-foreground"
              value={alertStatus}
              onChange={e => { setAlertStatus(e.target.value); setPage(1); }}
            >
              <option value="">{t('inventory.filter.allStatus') || 'All Status'}</option>
              <option value="low_stock">{t('inventory.status.lowStock') || 'Low Stock'}</option>
              <option value="out_of_stock">{t('inventory.status.outOfStock') || 'Out of Stock'}</option>
            </select>
            {(search || selectedWarehouseId || alertStatus) && (
              <button
                onClick={() => { setSearch(''); setSelectedWarehouseId(''); setAlertStatus(''); setPage(1); }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                {t('inventory.filter.clear') || 'Clear'}
              </button>
            )}
            {isFetching && !isLoading && (
              <div className="h-1 w-16 rounded-full bg-brand-soft overflow-hidden ml-auto">
                <div className="h-full w-1/2 bg-brand rounded-full animate-pulse" />
              </div>
            )}
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-muted-foreground">{t('inventory.messages.loading') || 'Loading...'}</div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      {[
                        { key: 'partNo', label: t('inventory.table.partNo') || 'Part No', align: 'text-left' },
                        { key: 'partDescription', label: t('inventory.table.description') || 'Description', align: 'text-left' },
                        { key: 'groupName', label: t('inventory.table.group') || 'Group', align: 'text-left' },
                        { key: 'inStock', label: t('inventory.table.inStock') || 'In Stock', align: 'text-right' },
                        { key: 'booked', label: t('inventory.table.booked') || 'Booked', align: 'text-right' },
                        { key: 'available', label: t('inventory.table.available') || 'Available', align: 'text-right' },
                        { key: 'uom', label: t('inventory.table.uom') || 'UoM', align: 'text-left' },
                        { key: 'cost', label: t('inventory.table.cost') || 'Cost', align: 'text-right' },
                      ].map(col => (
                        <th
                          key={col.key}
                          onClick={() => toggleSort(col.key)}
                          className={`group px-4 py-3 ${col.align} text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors whitespace-nowrap`}
                        >
                          <span className="inline-flex items-center gap-1">
                            {col.label}
                            <SortIndicator field={col.key} />
                          </span>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        {t('inventory.table.warehouse') || 'Warehouse'}
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        {t('inventory.table.status') || 'Status'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-16 text-center">
                          <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                          <p className="text-sm font-medium text-muted-foreground">{t('inventory.messages.noItems') || 'No stock balances found'}</p>
                        </td>
                      </tr>
                    ) : items.map((row, idx) => {
                      const st = getAlertBadge(row);
                      return (
                        <tr
                          key={row._id}
                          className={`border-b border-border/50 hover:bg-accent/50 transition-colors ${idx % 2 === 1 ? 'bg-muted/20' : ''} ${isFetching ? 'opacity-60' : ''}`}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">{row.partDoc?.partNo ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">{row.partDoc?.partDescription ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">{row.partDoc?.groupName ?? '—'}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-foreground text-right tabular-nums">{row.inStock.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-foreground text-right tabular-nums">{row.booked.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-foreground text-right tabular-nums">{row.available.toLocaleString()}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground uppercase">{row.partDoc?.uom ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-foreground text-right tabular-nums">{row.partDoc?.cost != null ? Number(row.partDoc.cost).toFixed(2) : '—'}</td>
                          <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">{row.warehouseDoc?.warehouseName ?? '—'}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md ${st.bg} ${st.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                              {st.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  {t('inventory.filter.showing') || 'Showing'}{' '}
                  <span className="font-medium text-foreground">{startIdx}–{endIdx}</span>{' '}
                  {t('inventory.filter.of') || 'of'}{' '}
                  <span className="font-medium text-foreground">{pagination.totalItems}</span>{' '}
                  {t('inventory.filter.items') || 'items'}
                </p>
                <div className="flex items-center gap-3">
                  <select
                    className="h-8 px-2 text-sm border border-input rounded-md bg-background text-foreground"
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                  >
                    {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s} / {t('inventory.filter.page') || 'page'}</option>)}
                  </select>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background text-foreground disabled:opacity-30 hover:bg-muted transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-muted-foreground px-2 tabular-nums">
                      {pagination.page} / {pagination.totalPages || 1}
                    </span>
                    <button
                      onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={page >= pagination.totalPages}
                      className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background text-foreground disabled:opacity-30 hover:bg-muted transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
