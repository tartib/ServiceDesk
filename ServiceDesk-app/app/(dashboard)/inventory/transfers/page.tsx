'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ArrowLeftRight, X as XIcon, ChevronLeft } from 'lucide-react';
import { useTransfers, useCancelTransfer } from '@/hooks/useTransfers';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import Link from 'next/link';
import type { StockTransfer, TransferStatus, InvWarehouse, InventoryItem } from '@/types';

const STATUS_STYLES: Record<string, { dot: string; bg: string; text: string }> = {
  pending: { dot: 'bg-warning', bg: 'bg-warning/10', text: 'text-warning' },
  completed: { dot: 'bg-success', bg: 'bg-success/10', text: 'text-success' },
  cancelled: { dot: 'bg-destructive', bg: 'bg-destructive/10', text: 'text-destructive' },
};

function getWarehouseName(w: InvWarehouse | string): string {
  return typeof w === 'string' ? w : w.warehouseName;
}

function getPartLabel(p: InventoryItem | string): string {
  return typeof p === 'string' ? p : `${p.partNo} — ${p.partDescription}`;
}

function getUserName(u: { name: string } | string | undefined): string {
  if (!u) return '—';
  return typeof u === 'string' ? u : u.name;
}

export default function TransfersPage() {
  const { t } = useLanguage();
  const [filterStatus, setFilterStatus] = useState<TransferStatus | ''>('');

  const filters: Record<string, string | undefined> = {};
  if (filterStatus) filters.status = filterStatus;

  const transfersQuery = useTransfers(filters);
  const tData = transfersQuery.data as { data?: { transfers?: StockTransfer[] } } | undefined;
  const transfers: StockTransfer[] = (tData?.data?.transfers ?? []) as StockTransfer[];
  const isLoading = transfersQuery.isLoading;

  const cancelMut = useCancelTransfer();

  const handleCancel = async (id: string) => {
    try {
      await cancelMut.mutateAsync(id);
      toast.success('Transfer cancelled');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/inventory" className="p-2 rounded-lg border border-input hover:bg-muted transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('inventory.transfer.title') || 'Transfers'}</h1>
            <p className="text-muted-foreground mt-1">{t('inventory.transfer.subtitle') || 'Stock transfers between warehouses'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="h-8 px-2.5 text-sm border border-input rounded-md bg-background text-foreground"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as TransferStatus | '')}
          >
            <option value="">All Statuses</option>
            {(['pending', 'completed', 'cancelled'] as const).map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>
          ) : transfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <ArrowLeftRight className="w-12 h-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">{t('inventory.transfer.noTransfers') || 'No transfers found'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Part</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">From</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">To</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Created By</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Date</th>
                    <th className="px-4 py-3 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {transfers.map((tr, idx) => {
                    const st = STATUS_STYLES[tr.status] || STATUS_STYLES.pending;
                    return (
                      <tr key={tr._id || tr.id} className={`border-b border-border/50 hover:bg-accent/50 transition-colors ${idx % 2 === 1 ? 'bg-muted/20' : ''}`}>
                        <td className="px-4 py-3 text-sm font-medium text-foreground whitespace-nowrap">{getPartLabel(tr.part)}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{getWarehouseName(tr.sourceWarehouse)}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{getWarehouseName(tr.destinationWarehouse)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-foreground text-right tabular-nums">{tr.quantity}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-md ${st.bg} ${st.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                            {tr.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{getUserName(tr.createdBy)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground tabular-nums">{new Date(tr.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          {tr.status === 'pending' && (
                            <button onClick={() => handleCancel(tr._id || tr.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors" title="Cancel" disabled={cancelMut.isPending}>
                              <XIcon className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
