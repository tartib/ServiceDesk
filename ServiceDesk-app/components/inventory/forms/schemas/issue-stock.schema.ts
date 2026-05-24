import { z } from 'zod';
import type { InventoryFormSchema } from '../types/inventory-form.types';

// ── Zod schema ───────────────────────────────────────────────────

export const issueStockZod = z.object({
  partId: z.string().min(1, 'Please select an item.'),
  warehouseId: z.string().min(1, 'Please select a warehouse.'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1.'),
  issuedTo: z.string().optional(),
  notes: z.string().optional(),
});

export type IssueStockFormData = z.infer<typeof issueStockZod>;

export const issueStockDefaults: IssueStockFormData = {
  partId: '',
  warehouseId: '',
  quantity: 1,
  issuedTo: '',
  notes: '',
};

// ── Form schema factory (i18n-aware) ────────────────────────────

type T = (key: string) => string;

export function createIssueStockFormSchema(t: T): InventoryFormSchema {
  const f = (key: string) => t(`inventory.forms.fields.${key}`);
  const s = (key: string) => t(`inventory.forms.steps.${key}`);

  return {
    id: 'issue-stock',
    title: t('inventory.forms.issue.title'),
    description: t('inventory.forms.issue.description'),
    requestType: 'issue_stock',
    mode: 'create',
    autosave: false,
    reviewRequired: false,
    submitLabel: t('inventory.forms.issue.submit'),
    zodSchema: issueStockZod,

    steps: [
      {
        id: 'details',
        title: s('issueDetails'),
        description: s('issueDetailsDesc'),
        fields: [
          { name: 'partId', label: f('item'), type: 'item-picker', required: true, fullWidth: true },
          { name: 'warehouseId', label: f('warehouse'), type: 'warehouse-picker', required: true },
          { name: 'quantity', label: f('quantity'), type: 'quantity', required: true, min: 1 },
          { name: 'issuedTo', label: f('issuedTo'), type: 'user-picker', placeholder: f('issuedToPlaceholder') },
          { name: 'notes', label: f('notes'), type: 'textarea', advanced: true, fullWidth: true },
        ],
      },
    ],
  };
}
