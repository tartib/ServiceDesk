import { z } from 'zod';
import type { InventoryFormSchema } from '../types/inventory-form.types';

// ── Zod schema ───────────────────────────────────────────────────

export const stockAdjustmentZod = z.object({
  itemId: z.string().min(1, 'Please select an item.'),
  warehouseId: z.string().min(1, 'Please select a warehouse.'),
  adjustmentType: z.enum(['increase', 'decrease', 'set_balance'], { message: 'Please select an adjustment type.' }),
  currentQuantity: z.number().int().min(0),
  newQuantity: z.number().int().min(0, 'New quantity cannot be less than 0.'),
  reason: z.string().min(1, 'Adjustment reason is required.'),
  attachment: z.string().optional(),
  notes: z.string().optional(),
});

export type StockAdjustmentFormData = z.infer<typeof stockAdjustmentZod>;

export const stockAdjustmentDefaults: StockAdjustmentFormData = {
  itemId: '',
  warehouseId: '',
  adjustmentType: 'increase',
  currentQuantity: 0,
  newQuantity: 0,
  reason: '',
  attachment: '',
  notes: '',
};

// ── Form schema factory (i18n-aware) ────────────────────────────

type T = (key: string) => string;

export function createStockAdjustmentFormSchema(t: T): InventoryFormSchema {
  const f = (key: string) => t(`inventory.forms.fields.${key}`);
  const s = (key: string) => t(`inventory.forms.steps.${key}`);

  return {
    id: 'stock-adjustment',
    title: t('inventory.forms.adjust.title'),
    description: t('inventory.forms.adjust.description'),
    requestType: 'stock_adjustment',
    mode: 'create',
    autosave: true,
    reviewRequired: true,
    submitLabel: t('inventory.forms.adjust.submit'),
    zodSchema: stockAdjustmentZod,

    steps: [
      {
        id: 'item',
        title: s('selectItem'),
        description: s('selectItemSearchDesc'),
        fields: [
          { name: 'itemId', label: f('item'), type: 'item-picker', required: true, fullWidth: true },
          { name: 'warehouseId', label: f('warehouse'), type: 'warehouse-picker', required: true },
        ],
      },
      {
        id: 'adjustment',
        title: s('adjustment'),
        description: s('adjustmentDesc'),
        fields: [
          {
            name: 'adjustmentType',
            label: f('adjustmentType'),
            type: 'radio',
            required: true,
            fullWidth: true,
            options: [
              { label: f('adjustmentIncrease'), value: 'increase', description: f('adjustmentIncreaseDesc') },
              { label: f('adjustmentDecrease'), value: 'decrease', description: f('adjustmentDecreaseDesc') },
              { label: f('adjustmentSetBalance'), value: 'set_balance', description: f('adjustmentSetBalanceDesc') },
            ],
          },
          { name: 'currentQuantity', label: f('currentQuantity'), type: 'number', readOnly: true, helperText: f('currentQuantityHelper') },
          { name: 'newQuantity', label: f('newQuantity'), type: 'number', required: true, min: 0, helperText: f('newQuantityHelper') },
          { name: 'reason', label: f('reason'), type: 'textarea', required: true, fullWidth: true, placeholder: f('reasonPlaceholder') },
          { name: 'attachment', label: f('supportingDoc'), type: 'attachment-upload', accept: '.pdf,.jpg,.jpeg,.png', maxFiles: 3, fullWidth: true, helperText: f('supportingDocHelper'), advanced: true },
          { name: 'notes', label: f('notes'), type: 'textarea', advanced: true, fullWidth: true },
        ],
      },
    ],
  };
}
