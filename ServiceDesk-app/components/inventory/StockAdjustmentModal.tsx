'use client';

import { useState } from 'react';
import { X, Plus, Minus, Package, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface StockAdjustmentModalProps {
 isOpen: boolean;
 onClose: () => void;
 item: {
 id: string;
 name: string;
 nameAr?: string;
 currentQuantity: number;
 unit: string;
 };
 onAdjust: (data: {
 itemId: string;
 quantity: number;
 movementType: string;
 reason?: string;
 notes?: string;
 }) => void;
 isLoading?: boolean;
}

export default function StockAdjustmentModal({
 isOpen,
 onClose,
 item,
 onAdjust,
 isLoading = false,
}: StockAdjustmentModalProps) {
 const { t } = useLanguage();
 const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
 const [quantity, setQuantity] = useState<number>(1);
 const [reason, setReason] = useState('');
 const [notes, setNotes] = useState('');

 if (!isOpen) return null;

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 
 const movementType = adjustmentType === 'add' ? 'adjustment_add' : 'adjustment_remove';
 
 onAdjust({
 itemId: item.id,
 quantity,
 movementType,
 reason: reason || undefined,
 notes: notes || undefined,
 });
 };

 const newQuantity = adjustmentType === 'add' 
 ? item.currentQuantity + quantity 
 : Math.max(0, item.currentQuantity - quantity);

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
 <div className="bg-background dark:bg-foreground/90 rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
 <div className="flex items-center justify-between p-6 border-b border-border dark:border-border">
 <h2 className="text-xl font-bold text-foreground dark:text-white">
 {t('inventory.adjustModal.title')}
 </h2>
 <button
 onClick={onClose}
 className="text-muted-foreground hover:text-muted-foreground dark:hover:text-muted-foreground"
 >
 <X className="w-6 h-6" />
 </button>
 </div>

 <form onSubmit={handleSubmit} className="p-6 space-y-6">
 <div className="bg-brand-surface dark:bg-brand-soft rounded-lg p-4">
 <div className="flex items-center gap-3">
 <Package className="w-5 h-5 text-brand dark:text-brand" />
 <div className="flex-1">
 <div className="font-medium text-foreground dark:text-white">
 {item.name}
 </div>
 {item.nameAr && (
 <div className="text-sm text-muted-foreground dark:text-muted-foreground">
 {item.nameAr}
 </div>
 )}
 <div className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
 {t('inventory.adjustModal.currentLevel')}: <span className="font-semibold">{item.currentQuantity} {item.unit}</span>
 </div>
 </div>
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-2">
 {t('inventory.adjustModal.title')}
 </label>
 <div className="grid grid-cols-2 gap-3">
 <button
 type="button"
 onClick={() => setAdjustmentType('add')}
 className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
 adjustmentType === 'add'
 ? 'border-success bg-success-soft text-success dark:text-success'
 : 'border-border dark:border-border text-foreground dark:text-muted-foreground'
 }`}
 >
 <Plus className="w-5 h-5" />
 {t('inventory.adjustModal.addStock')}
 </button>
 <button
 type="button"
 onClick={() => setAdjustmentType('remove')}
 className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
 adjustmentType === 'remove'
 ? 'border-destructive bg-destructive-soft text-destructive dark:text-destructive'
 : 'border-border dark:border-border text-foreground dark:text-muted-foreground'
 }`}
 >
 <Minus className="w-5 h-5" />
 {t('inventory.adjustModal.removeStock')}
 </button>
 </div>
 </div>

 <div>
 <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-2">
 {t('inventory.adjustModal.quantity')} ({item.unit})
 </label>
 <input
 type="number"
 min="1"
 value={quantity}
 onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
 className="w-full px-4 py-2 border border-border dark:border-border rounded-lg bg-background dark:bg-foreground/80 text-foreground dark:text-background focus:ring-2 focus:ring-ring focus:border-transparent"
 required
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-2">
 {t('inventory.adjustModal.reason')}
 </label>
 <select
 value={reason}
 onChange={(e) => setReason(e.target.value)}
 className="w-full px-4 py-2 border border-border dark:border-border rounded-lg bg-background dark:bg-foreground/80 text-foreground dark:text-background focus:ring-2 focus:ring-ring focus:border-transparent"
 >
 <option value="">{t('inventory.adjustModal.selectReason')}</option>
 {adjustmentType === 'add' ? (
 <>
 <option value="restock">{t('inventory.adjustModal.reasons.restock')}</option>
 <option value="return">{t('inventory.adjustModal.reasons.returned')}</option>
 <option value="correction">{t('inventory.adjustModal.reasons.adjustment')}</option>
 </>
 ) : (
 <>
 <option value="usage">{t('inventory.adjustModal.reasons.usage')}</option>
 <option value="damaged">{t('inventory.adjustModal.reasons.damaged')}</option>
 <option value="expired">{t('inventory.adjustModal.reasons.expired')}</option>
 <option value="correction">{t('inventory.adjustModal.reasons.adjustment')}</option>
 </>
 )}
 </select>
 </div>

 <div>
 <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-2">
 {t('inventory.adjustModal.notes')}
 </label>
 <textarea
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 rows={3}
 className="w-full px-4 py-2 border border-border dark:border-border rounded-lg bg-background dark:bg-foreground/80 text-foreground dark:text-background focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
 placeholder={t('inventory.adjustModal.notes')}
 />
 </div>

 <div className="bg-muted/50 dark:bg-foreground/80/50 rounded-lg p-4">
 <div className="flex items-center justify-between text-sm">
 <span className="text-muted-foreground dark:text-muted-foreground">{t('inventory.adjustModal.newLevel')}:</span>
 <span className={`font-bold text-lg ${
 adjustmentType === 'add' 
 ? 'text-success dark:text-success' 
 : 'text-destructive dark:text-destructive'
 }`}>
 {newQuantity} {item.unit}
 </span>
 </div>
 {adjustmentType === 'remove' && newQuantity === 0 && (
 <div className="flex items-center gap-2 mt-2 text-warning dark:text-warning text-xs">
 <AlertCircle className="w-4 h-4" />
 <span>{t('inventory.adjustModal.warning')}</span>
 </div>
 )}
 </div>

 <div className="flex gap-3 pt-4">
 <button
 type="button"
 onClick={onClose}
 className="flex-1 px-4 py-2 border border-border dark:border-border text-foreground dark:text-muted-foreground rounded-lg hover:bg-muted/50 dark:hover:bg-foreground/80 transition-colors"
 disabled={isLoading}
 >
 {t('inventory.adjustModal.cancel')}
 </button>
 <button
 type="submit"
 className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${
 adjustmentType === 'add'
 ? 'bg-success hover:bg-success/80'
 : 'bg-destructive hover:bg-destructive/90'
 } disabled:opacity-50 disabled:cursor-not-allowed`}
 disabled={isLoading}
 >
 {isLoading ? t('inventory.adjustModal.adjusting') : (adjustmentType === 'add' ? t('inventory.adjustModal.addButton') : t('inventory.adjustModal.removeButton'))}
 </button>
 </div>
 </form>
 </div>
 </div>
 );
}
