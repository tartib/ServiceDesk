'use client';

import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ChevronLeft, PackagePlus, Send, ArrowLeftRight, Settings, RotateCcw, History } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { useInventoryItems } from '@/hooks/useInventoryItems';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useCreateReceipt, useConfirmReceipt } from '@/hooks/useReceipts';
import { useCreateIssue } from '@/hooks/useIssues';
import { useCreateTransfer } from '@/hooks/useTransfers';
import { useCreateAdjustment } from '@/hooks/useAdjustments';
import { useCreateReturn } from '@/hooks/useReturns';
import { toast } from 'sonner';
import type { InventoryItem, InvWarehouse, AdjustmentType, ReturnCondition } from '@/types';

type ModalType = null | 'receive' | 'issue' | 'transfer' | 'adjust' | 'return';

export default function TransactionsPage() {
  const { t } = useLanguage();
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const itemsQuery = useInventoryItems({ status: 'active' });
  const itemsResult = (itemsQuery.data as { data?: { items?: InventoryItem[] } } | undefined)?.data;
  const items: InventoryItem[] = itemsResult?.items ?? [];

  const whQuery = useWarehouses();
  const whData = whQuery.data as { data?: { warehouses?: InvWarehouse[] } } | undefined;
  const warehouses: InvWarehouse[] = (whData?.data?.warehouses ?? []) as InvWarehouse[];

  const receiptMut = useCreateReceipt();
  const confirmMut = useConfirmReceipt();
  const issueMut = useCreateIssue();
  const transferMut = useCreateTransfer();
  const adjustMut = useCreateAdjustment();
  const returnMut = useCreateReturn();

  // Shared form state
  const [partId, setPartId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [destWarehouseId, setDestWarehouseId] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [notes, setNotes] = useState('');
  const [referenceNo, setReferenceNo] = useState('');
  const [reason, setReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('increase');
  const [returnCondition, setReturnCondition] = useState<ReturnCondition>('good');
  const [issuedTo, setIssuedTo] = useState('');

  const resetForm = () => {
    setPartId(''); setWarehouseId(''); setDestWarehouseId(''); setQuantity(0);
    setNotes(''); setReferenceNo(''); setReason(''); setIssuedTo('');
    setAdjustmentType('increase'); setReturnCondition('good');
    setActiveModal(null);
  };

  const handleReceive = async () => {
    try {
      const r = await receiptMut.mutateAsync({ partId, warehouseId, quantity, referenceNo: referenceNo || undefined, notes: notes || undefined });
      // Auto-confirm
      const receipt = (r as { data?: { receipt?: { _id?: string } } })?.data?.receipt;
      if (receipt?._id) await confirmMut.mutateAsync(receipt._id);
      toast.success('Stock received & confirmed');
      resetForm();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  };

  const handleIssue = async () => {
    try {
      await issueMut.mutateAsync({ partId, warehouseId, quantity, issuedTo: issuedTo || undefined, notes: notes || undefined });
      toast.success('Stock issued');
      resetForm();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  };

  const handleTransfer = async () => {
    try {
      await transferMut.mutateAsync({ partId, sourceWarehouseId: warehouseId, destinationWarehouseId: destWarehouseId, quantity, referenceNo: referenceNo || undefined, notes: notes || undefined });
      toast.success('Transfer completed');
      resetForm();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  };

  const handleAdjust = async () => {
    try {
      await adjustMut.mutateAsync({ partId, warehouseId, adjustmentType, quantity, reason, notes: notes || undefined });
      toast.success('Stock adjusted');
      resetForm();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  };

  const handleReturn = async () => {
    try {
      await returnMut.mutateAsync({ partId, warehouseId, quantity, condition: returnCondition, notes: notes || undefined });
      toast.success('Stock returned');
      resetForm();
    } catch (err) { toast.error(err instanceof Error ? err.message : 'Failed'); }
  };

  const inputCls = 'w-full h-9 px-3 text-sm border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30';

  const actions = [
    { key: 'receive' as const, icon: PackagePlus, label: t('inventory.transactions.receive') || 'Receive Stock', desc: 'Add incoming stock to warehouse', color: 'text-success' },
    { key: 'issue' as const, icon: Send, label: t('inventory.transactions.issue') || 'Issue Stock', desc: 'Issue stock out of warehouse', color: 'text-brand' },
    { key: 'transfer' as const, icon: ArrowLeftRight, label: t('inventory.transactions.transfer') || 'Transfer Stock', desc: 'Move stock between warehouses', color: 'text-warning' },
    { key: 'adjust' as const, icon: Settings, label: t('inventory.transactions.adjust') || 'Adjust Stock', desc: 'Increase, decrease or set balance', color: 'text-info' },
    { key: 'return' as const, icon: RotateCcw, label: t('inventory.transactions.return') || 'Return Stock', desc: 'Return issued stock', color: 'text-success' },
  ];

  const PartWarehouseFields = () => (
    <>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Part *</label>
        <select className={inputCls} value={partId} onChange={e => setPartId(e.target.value)} required>
          <option value="">Select part...</option>
          {items.map(i => <option key={i._id || i.id} value={i._id || i.id}>{i.partNo} — {i.partDescription}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Warehouse *</label>
        <select className={inputCls} value={warehouseId} onChange={e => setWarehouseId(e.target.value)} required>
          <option value="">Select warehouse...</option>
          {warehouses.map(w => <option key={w._id || w.id} value={w._id || w.id}>{w.warehouseName} ({w.code})</option>)}
        </select>
      </div>
    </>
  );

  const QuantityNotesFields = () => (
    <>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Quantity *</label>
        <input type="number" min={1} className={inputCls} value={quantity || ''} onChange={e => setQuantity(Number(e.target.value))} required />
      </div>
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Notes</label>
        <input className={inputCls} value={notes} onChange={e => setNotes(e.target.value)} />
      </div>
    </>
  );

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/inventory" className="p-2 rounded-lg border border-input hover:bg-muted transition-colors"><ChevronLeft className="w-4 h-4" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('inventory.transactions.title') || 'Transactions'}</h1>
            <p className="text-muted-foreground mt-1">Perform stock operations</p>
          </div>
          <Link href="/inventory/movements" className="ml-auto inline-flex items-center gap-2 px-4 py-2.5 border border-input text-foreground rounded-lg hover:bg-muted transition-colors font-medium text-sm">
            <History className="w-4 h-4" /> Movement History
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

      {/* Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card rounded-xl border border-border shadow-xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-foreground">
              {actions.find(a => a.key === activeModal)?.label}
            </h2>

            <div className="space-y-3">
              <PartWarehouseFields />

              {activeModal === 'transfer' && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Destination Warehouse *</label>
                  <select className={inputCls} value={destWarehouseId} onChange={e => setDestWarehouseId(e.target.value)} required>
                    <option value="">Select destination...</option>
                    {warehouses.filter(w => (w._id || w.id) !== warehouseId).map(w => <option key={w._id || w.id} value={w._id || w.id}>{w.warehouseName} ({w.code})</option>)}
                  </select>
                </div>
              )}

              <QuantityNotesFields />

              {(activeModal === 'receive' || activeModal === 'transfer') && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Reference No</label>
                  <input className={inputCls} value={referenceNo} onChange={e => setReferenceNo(e.target.value)} />
                </div>
              )}

              {activeModal === 'issue' && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Issued To</label>
                  <input className={inputCls} value={issuedTo} onChange={e => setIssuedTo(e.target.value)} />
                </div>
              )}

              {activeModal === 'adjust' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Adjustment Type *</label>
                    <select className={inputCls} value={adjustmentType} onChange={e => setAdjustmentType(e.target.value as AdjustmentType)}>
                      <option value="increase">Increase</option>
                      <option value="decrease">Decrease</option>
                      <option value="set_balance">Set Balance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Reason *</label>
                    <input className={inputCls} value={reason} onChange={e => setReason(e.target.value)} required />
                  </div>
                </>
              )}

              {activeModal === 'return' && (
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Condition *</label>
                  <select className={inputCls} value={returnCondition} onChange={e => setReturnCondition(e.target.value as ReturnCondition)}>
                    <option value="good">Good</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button onClick={resetForm} className="px-4 py-2 text-sm font-medium text-muted-foreground border border-input rounded-lg hover:bg-muted transition-colors">Cancel</button>
              <button
                onClick={() => {
                  if (activeModal === 'receive') handleReceive();
                  else if (activeModal === 'issue') handleIssue();
                  else if (activeModal === 'transfer') handleTransfer();
                  else if (activeModal === 'adjust') handleAdjust();
                  else if (activeModal === 'return') handleReturn();
                }}
                disabled={!partId || !warehouseId || quantity <= 0}
                className="px-4 py-2 text-sm font-medium bg-brand text-brand-foreground rounded-lg hover:bg-brand-strong transition-colors disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
