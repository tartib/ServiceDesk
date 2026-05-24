'use client';

import { useState, useCallback, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ChevronLeft, PackagePlus, Send, ArrowLeftRight, Settings, RotateCcw, History } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useCreateReceipt, useConfirmReceipt } from '@/hooks/useReceipts';
import { useCreateIssue } from '@/hooks/useIssues';
import { useCreateTransfer } from '@/hooks/useTransfers';
import { useCreateAdjustment } from '@/hooks/useAdjustments';
import { useCreateReturn } from '@/hooks/useReturns';
import { toast } from 'sonner';
import { InventoryTransactionDialog } from '@/components/inventory/forms/InventoryTransactionDialog';
import { createReceiveStockFormSchema } from '@/components/inventory/forms/schemas/receive-stock.schema';
import { createIssueStockFormSchema } from '@/components/inventory/forms/schemas/issue-stock.schema';
import { createTransferItemFormSchema } from '@/components/inventory/forms/schemas/transfer-item.schema';
import { createStockAdjustmentFormSchema } from '@/components/inventory/forms/schemas/stock-adjustment.schema';
import { createReturnItemFormSchema } from '@/components/inventory/forms/schemas/return-item.schema';
import type { InventoryFormSchema } from '@/components/inventory/forms/types/inventory-form.types';
import type { AdjustmentType, ReturnCondition } from '@/types';

type ModalType = null | 'receive' | 'issue' | 'transfer' | 'adjust' | 'return';

export default function TransactionsPage() {
  const { t } = useLanguage();
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const MODAL_SCHEMAS: Record<Exclude<ModalType, null>, InventoryFormSchema> = useMemo(() => ({
    receive: createReceiveStockFormSchema(t),
    issue: createIssueStockFormSchema(t),
    transfer: createTransferItemFormSchema(t),
    adjust: createStockAdjustmentFormSchema(t),
    return: createReturnItemFormSchema(t),
  }), [t]);

  const receiptMut = useCreateReceipt();
  const confirmMut = useConfirmReceipt();
  const issueMut = useCreateIssue();
  const transferMut = useCreateTransfer();
  const adjustMut = useCreateAdjustment();
  const returnMut = useCreateReturn();

  const handleSubmit = useCallback(async (data: Record<string, unknown>) => {
    const modal = activeModal;
    if (!modal) return;
    try {
      switch (modal) {
        case 'receive': {
          const r = await receiptMut.mutateAsync({
            partId: data.partId as string,
            warehouseId: data.warehouseId as string,
            quantity: data.quantity as number,
            referenceNo: (data.referenceNo as string) || undefined,
            notes: (data.notes as string) || undefined,
          });
          const receipt = (r as { data?: { receipt?: { _id?: string } } })?.data?.receipt;
          if (receipt?._id) await confirmMut.mutateAsync(receipt._id);
          toast.success(t('inventory.toast.stockReceived'));
          break;
        }
        case 'issue':
          await issueMut.mutateAsync({
            partId: data.partId as string,
            warehouseId: data.warehouseId as string,
            quantity: data.quantity as number,
            issuedTo: (data.issuedTo as string) || undefined,
            notes: (data.notes as string) || undefined,
          });
          toast.success(t('inventory.toast.stockIssued'));
          break;
        case 'transfer':
          await transferMut.mutateAsync({
            partId: data.itemId as string,
            sourceWarehouseId: data.sourceWarehouseId as string,
            destinationWarehouseId: data.destinationWarehouseId as string,
            quantity: data.quantity as number,
            referenceNo: (data.referenceNo as string) || undefined,
            notes: (data.notes as string) || undefined,
          });
          toast.success(t('inventory.toast.stockTransferred'));
          break;
        case 'adjust':
          await adjustMut.mutateAsync({
            partId: data.itemId as string,
            warehouseId: data.warehouseId as string,
            adjustmentType: data.adjustmentType as AdjustmentType,
            quantity: data.newQuantity as number,
            reason: data.reason as string,
            notes: (data.notes as string) || undefined,
          });
          toast.success(t('inventory.toast.stockAdjusted'));
          break;
        case 'return':
          await returnMut.mutateAsync({
            partId: data.itemId as string,
            warehouseId: data.warehouseId as string,
            quantity: data.quantity as number,
            condition: data.condition as ReturnCondition,
            notes: (data.notes as string) || undefined,
          });
          toast.success(t('inventory.toast.stockReturned'));
          break;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('inventory.toast.operationFailed'));
      throw err; // re-throw so dialog stays open
    }
  }, [activeModal, receiptMut, confirmMut, issueMut, transferMut, adjustMut, returnMut]);

  const actions = [
    { key: 'receive' as const, icon: PackagePlus, label: t('inventory.transactions.receive'), desc: t('inventory.transactions.receiveDesc'), color: 'text-success' },
    { key: 'issue' as const, icon: Send, label: t('inventory.transactions.issue'), desc: t('inventory.transactions.issueDesc'), color: 'text-brand' },
    { key: 'transfer' as const, icon: ArrowLeftRight, label: t('inventory.transactions.transfer'), desc: t('inventory.transactions.transferDesc'), color: 'text-warning' },
    { key: 'adjust' as const, icon: Settings, label: t('inventory.transactions.adjust'), desc: t('inventory.transactions.adjustDesc'), color: 'text-info' },
    { key: 'return' as const, icon: RotateCcw, label: t('inventory.transactions.return'), desc: t('inventory.transactions.returnDesc'), color: 'text-success' },
  ];

  const activeSchema = activeModal ? MODAL_SCHEMAS[activeModal] : null;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/inventory" className="p-2 rounded-lg border border-input hover:bg-muted transition-colors"><ChevronLeft className="w-4 h-4" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('inventory.transactions.title') || 'Transactions'}</h1>
            <p className="text-muted-foreground mt-1">{t('inventory.transactions.title')}</p>
          </div>
          <Link href="/inventory/movements" className="ml-auto inline-flex items-center gap-2 px-4 py-2.5 border border-input text-foreground rounded-lg hover:bg-muted transition-colors font-medium text-sm">
            <History className="w-4 h-4" /> {t('inventory.movements.title')}
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {actions.map(a => (
            <button key={a.key} onClick={() => setActiveModal(a.key)} className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-shadow text-left group">
              <a.icon className={`w-8 h-8 ${a.color} mb-3`} />
              <h3 className="font-semibold text-foreground group-hover:text-brand transition-colors">{a.label}</h3>
              <p className="text-xs text-muted-foreground mt-1">{a.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {activeSchema && (
        <InventoryTransactionDialog
          open={!!activeModal}
          onOpenChange={(open) => { if (!open) setActiveModal(null); }}
          schema={activeSchema}
          onSubmit={handleSubmit}
        />
      )}
    </DashboardLayout>
  );
}
