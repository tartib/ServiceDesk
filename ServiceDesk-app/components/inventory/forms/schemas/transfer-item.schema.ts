import { z } from 'zod';
import type { InventoryFormSchema } from '../types/inventory-form.types';

// ── Zod schema ───────────────────────────────────────────────────

export const transferItemZod = z.object({
  itemId: z.string().min(1, 'Please select an item.'),
  sourceWarehouseId: z.string().min(1, 'Source warehouse is required.'),
  destinationWarehouseId: z.string().min(1, 'Please choose where to transfer.'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1.'),
  transferDate: z.string().min(1, 'Transfer date is required.'),
  reason: z.string().optional(),
  referenceNo: z.string().optional(),
  notes: z.string().optional(),
});

export type TransferItemFormData = z.infer<typeof transferItemZod>;

export const transferItemDefaults: TransferItemFormData = {
  itemId: '',
  sourceWarehouseId: '',
  destinationWarehouseId: '',
  quantity: 1,
  transferDate: new Date().toISOString().split('T')[0],
  reason: '',
  referenceNo: '',
  notes: '',
};

// ── Form schema factory (i18n-aware) ────────────────────────────

type T = (key: string) => string;

export function createTransferItemFormSchema(t: T): InventoryFormSchema {
  const f = (key: string) => t(`inventory.forms.fields.${key}`);
  const s = (key: string) => t(`inventory.forms.steps.${key}`);

  return {
    id: 'transfer-item',
    title: t('inventory.forms.transfer.title'),
    description: t('inventory.forms.transfer.description'),
    requestType: 'stock_transfer',
    mode: 'create',
    autosave: false,
    reviewRequired: true,
    submitLabel: t('inventory.forms.transfer.submit'),
    zodSchema: transferItemZod,

    steps: [
      {
        id: 'item',
        title: s('selectItem'),
        description: s('selectItemDesc'),
        fields: [
          { name: 'itemId', label: f('item'), type: 'item-picker', required: true, fullWidth: true, helperText: f('itemHelper') },
        ],
      },
      {
        id: 'transfer-details',
        title: s('transferDetails'),
        description: s('transferDetailsDesc'),
        fields: [
          { name: 'sourceWarehouseId', label: f('fromWarehouse'), type: 'warehouse-picker', required: true, readOnly: true, helperText: f('fromWarehouseHelper') },
          { name: 'destinationWarehouseId', label: f('toWarehouse'), type: 'warehouse-picker', required: true, helperText: f('toWarehouseHelper') },
          { name: 'quantity', label: f('quantity'), type: 'quantity', required: true, min: 1 },
          { name: 'transferDate', label: f('transferDate'), type: 'date', required: true },
          { name: 'referenceNo', label: f('referenceNo'), type: 'text', advanced: true },
          { name: 'reason', label: f('reason'), type: 'textarea', advanced: true },
          { name: 'notes', label: f('notes'), type: 'textarea', advanced: true },
        ],
      },
    ],
  };
}
