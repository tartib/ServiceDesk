import { z } from 'zod';
import type { InventoryFormSchema } from '../types/inventory-form.types';

// ── Zod schema ───────────────────────────────────────────────────

const countLineSchema = z.object({
  itemId: z.string().min(1),
  itemName: z.string(),
  expectedQuantity: z.number().int().min(0),
  countedQuantity: z.number().int().min(0, 'Counted quantity cannot be negative.'),
  varianceReason: z.string().optional(),
});

export const inventoryCountZod = z.object({
  warehouseId: z.string().min(1, 'Please select a warehouse.'),
  countDate: z.string().min(1, 'Count date is required.'),
  lines: z.array(countLineSchema).min(1, 'Add at least one item to count.'),
  notes: z.string().optional(),
});

export type CountLine = z.infer<typeof countLineSchema>;
export type InventoryCountFormData = z.infer<typeof inventoryCountZod>;

export const inventoryCountDefaults: InventoryCountFormData = {
  warehouseId: '',
  countDate: new Date().toISOString().split('T')[0],
  lines: [],
  notes: '',
};

// ── Form schema definition ───────────────────────────────────────

export const inventoryCountFormSchema: InventoryFormSchema = {
  id: 'inventory-count',
  title: 'Inventory Count',
  description: 'Count and reconcile stock in a warehouse.',
  requestType: 'inventory_count',
  mode: 'create',
  autosave: true,
  reviewRequired: true,
  submitLabel: 'Submit Count',
  zodSchema: inventoryCountZod,

  steps: [
    {
      id: 'location',
      title: 'Location',
      description: 'Select warehouse and count date.',
      fields: [
        { name: 'warehouseId', label: 'Warehouse', type: 'warehouse-picker', required: true, helperText: 'Choose the warehouse to count.' },
        { name: 'countDate', label: 'Count Date', type: 'date', required: true },
      ],
    },
    {
      id: 'count',
      title: 'Count Items',
      description: 'Enter the counted quantity for each item.',
      fields: [
        // This step uses a custom renderer for the count lines table.
        // The DynamicInventoryForm will detect the 'inventory-count' form id
        // and render the InventoryCountTable component instead.
      ],
    },
    {
      id: 'notes',
      title: 'Summary',
      description: 'Review variances and add notes.',
      fields: [
        { name: 'notes', label: 'Notes', type: 'textarea', fullWidth: true, placeholder: 'Any notes about this count...' },
      ],
    },
  ],
};
