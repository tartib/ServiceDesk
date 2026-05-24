import { z } from 'zod';
import type { InventoryFormSchema } from '../types/inventory-form.types';

// ── Zod schema ───────────────────────────────────────────────────

export const receiveStockZod = z.object({
  partId: z.string().min(1, 'Please select an item.'),
  warehouseId: z.string().min(1, 'Please select a warehouse.'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1.'),
  referenceNo: z.string().optional(),
  notes: z.string().optional(),
});

export type ReceiveStockFormData = z.infer<typeof receiveStockZod>;

export const receiveStockDefaults: ReceiveStockFormData = {
  partId: '',
  warehouseId: '',
  quantity: 1,
  referenceNo: '',
  notes: '',
};

// ── Form schema factory (i18n-aware) ────────────────────────────

type T = (key: string) => string;

export function createReceiveStockFormSchema(t: T): InventoryFormSchema {
  const f = (key: string) => t(`inventory.forms.fields.${key}`);
  const s = (key: string) => t(`inventory.forms.steps.${key}`);

  return {
    id: 'receive-stock',
    title: t('inventory.forms.receive.title'),
    description: t('inventory.forms.receive.description'),
    requestType: 'receive_stock',
    mode: 'create',
    autosave: false,
    reviewRequired: false,
    submitLabel: t('inventory.forms.receive.submit'),
    zodSchema: receiveStockZod,

    steps: [
      {
        id: 'details',
        title: s('receiptDetails'),
        description: s('receiptDetailsDesc'),
        fields: [
          { name: 'partId', label: f('item'), type: 'item-picker', required: true, fullWidth: true },
          { name: 'warehouseId', label: f('warehouse'), type: 'warehouse-picker', required: true },
          { name: 'quantity', label: f('quantity'), type: 'quantity', required: true, min: 1 },
          { name: 'referenceNo', label: f('referenceNo'), type: 'text', placeholder: f('referenceNoPlaceholder') },
          { name: 'notes', label: f('notes'), type: 'textarea', advanced: true, fullWidth: true },
        ],
      },
    ],
  };
}
