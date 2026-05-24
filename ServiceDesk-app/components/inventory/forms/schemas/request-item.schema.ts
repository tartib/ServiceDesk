import { z } from 'zod';
import type { InventoryFormSchema } from '../types/inventory-form.types';

// ── Zod schema ───────────────────────────────────────────────────

export const requestItemZod = z.object({
  categoryId: z.string().min(1, 'Please select a category.'),
  itemId: z.string().min(1, 'Please select an item.'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1.'),
  neededByDate: z.string().min(1, 'Please select the date you need the item by.'),
  deliveryLocationId: z.string().min(1, 'Please choose a delivery or pickup location.'),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export type RequestItemFormData = z.infer<typeof requestItemZod>;

export const requestItemDefaults: RequestItemFormData = {
  categoryId: '',
  itemId: '',
  quantity: 1,
  neededByDate: '',
  deliveryLocationId: '',
  reason: '',
  notes: '',
};

// ── Form schema definition ───────────────────────────────────────

export const requestItemFormSchema: InventoryFormSchema = {
  id: 'request-item',
  title: 'Request Item',
  description: 'Request an available item from inventory.',
  requestType: 'item_request',
  mode: 'create',
  autosave: true,
  reviewRequired: true,
  submitLabel: 'Submit Request',
  zodSchema: requestItemZod,

  steps: [
    {
      id: 'category',
      title: 'Choose Category',
      description: 'Select the item category.',
      fields: [
        {
          name: 'categoryId',
          label: 'Category',
          type: 'category-picker',
          required: true,
          helperText: 'Select the category of the item you need.',
          fullWidth: true,
        },
      ],
    },
    {
      id: 'item',
      title: 'Select Item',
      description: 'Search and choose the item you need.',
      fields: [
        {
          name: 'itemId',
          label: 'Item',
          type: 'item-picker',
          required: true,
          helperText: 'Search by item name, part number, or description.',
          fullWidth: true,
        },
      ],
    },
    {
      id: 'details',
      title: 'Request Details',
      description: 'Specify quantity, date, and delivery location.',
      fields: [
        {
          name: 'quantity',
          label: 'Quantity',
          type: 'quantity',
          required: true,
          min: 1,
          helperText: 'How many items do you need?',
          defaultValue: 1,
        },
        {
          name: 'neededByDate',
          label: 'Needed By',
          type: 'date',
          required: true,
          helperText: 'When do you need this item?',
        },
        {
          name: 'deliveryLocationId',
          label: 'Delivery Location',
          type: 'location-picker',
          required: true,
          helperText: 'Where should the item be delivered or picked up?',
        },
        {
          name: 'reason',
          label: 'Reason',
          type: 'textarea',
          placeholder: 'Why do you need this item?',
          advanced: true,
        },
        {
          name: 'notes',
          label: 'Notes',
          type: 'textarea',
          placeholder: 'Any additional notes...',
          advanced: true,
        },
      ],
    },
  ],
};
