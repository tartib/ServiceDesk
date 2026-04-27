'use client';

import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ChevronLeft, ChevronRight, History, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useMovements } from '@/hooks/useMovements';
import type { InventoryMovement, MovementType } from '@/types';

const PAGE_SIZE = 50;

const MOVEMENT_COLORS: Record<string, string> = {
  receive: 'text-success',
  book: 'text-brand',
  release_booking: 'text-muted-foreground',
  issue: 'text-destructive',
  transfer_in: 'text-success',
  transfer_out: 'text-warning',
  adjustment: 'text-info',
  return: 'text-success',
  reversal: 'text-destructive',
};

export default function MovementsPage() {
  const { t } = useLanguage();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const filters = useMemo(() => {
    const f: Record<string, string | number> = { page, pageSize: PAGE_SIZE };
    if (search) f.search = search;
    if (typeFilter) f.movementType = typeFilter;
    return f;
  }, [page, search, typeFilter]);

  const { data: movData, isLoading } = useMovements(filters);
  const result = (movData as { data?: { items?: InventoryMovement[]; movements?: InventoryMovement[]; pagination?: { page: number; pageSize: number; totalItems: number; totalPages: number } } } | undefined)?.data ?? {};
  const movements: InventoryMovement[] = result.items ?? result.movements ?? [];
  const pagination = result.pagination ?? { page: 1, pageSize: PAGE_SIZE, totalItems: 0, totalPages: 1 };

  const types: MovementType[] = ['receive', 'book', 'release_booking', 'issue', 'transfer_in', 'transfer_out', 'adjustment', 'return', 'reversal'];

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/inventory/transactions" className="p-2 rounded-lg border border-input hover:bg-muted transition-colors"><ChevronLeft className="w-4 h-4" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('inventory.movements.title') || 'Movement History'}</h1>
            <p className="text-muted-foreground mt-1">Immutable audit trail of all stock changes</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm">
          <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-border">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                className="w-full h-8 pl-8 pr-3 text-sm border border-input rounded-md bg-background placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30"
                placeholder="Search..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select className="h-8 px-2.5 text-sm border border-input rounded-md bg-background" value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
              <option value="">All Types</option>
              {types.map(typ => <option key={typ} value={typ}>{typ.replace(/_/g, ' ')}</option>)}
            </select>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>
          ) : movements.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <History className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No movements found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Part</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Warehouse</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Qty</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Before</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">After</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Ref</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m, idx) => (
                      <tr key={m._id} className={`border-b border-border/50 hover:bg-accent/50 ${idx % 2 === 1 ? 'bg-muted/20' : ''}`}>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{new Date(m.createdAt).toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-xs font-medium whitespace-nowrap">
                          <span className={MOVEMENT_COLORS[m.movementType] || 'text-foreground'}>{m.movementType.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="px-4 py-2.5 text-sm text-foreground whitespace-nowrap">{m.partDoc?.partNo ?? (typeof m.part === 'string' ? m.part : '—')}</td>
                        <td className="px-4 py-2.5 text-sm text-muted-foreground whitespace-nowrap">{m.warehouseDoc?.warehouseName ?? (typeof m.warehouse === 'string' ? m.warehouse : '—')}</td>
                        <td className="px-4 py-2.5 text-sm font-semibold text-foreground text-right tabular-nums">{m.quantity}</td>
                        <td className="px-4 py-2.5 text-sm text-muted-foreground text-right tabular-nums">{m.beforeInStock}</td>
                        <td className="px-4 py-2.5 text-sm text-foreground text-right tabular-nums">{m.afterInStock}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{m.referenceNo || '—'}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{m.createdByDoc?.name ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-sm text-muted-foreground">{pagination.totalItems} movements</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background disabled:opacity-30 hover:bg-muted"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="text-sm text-muted-foreground px-2 tabular-nums">{pagination.page}/{pagination.totalPages || 1}</span>
                  <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-input bg-background disabled:opacity-30 hover:bg-muted"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
