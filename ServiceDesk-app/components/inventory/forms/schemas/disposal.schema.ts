import { z } from 'zod';
import type { InventoryFormSchema } from '../types/inventory-form.types';

// ── Zod schema ───────────────────────────────────────────────────

export const disposalZod = z.object({
  itemId: z.string().min(1, 'Please select an item to dispose.'),
  disposalReason: z.string().min(1, 'Disposal reason is required.'),
  disposalMethod: z.enum(['recycle', 'donate', 'sell', 'scrap', 'destroy'], { message: 'Please select a disposal method.' }),
  approvalAttachment: z.string().min(1, 'Please upload the approval document.'),
  notes: z.string().optional(),
});

export type DisposalFormData = z.infer<typeof disposalZod>;

export const disposalDefaults: DisposalFormData = {
  itemId: '',
  disposalReason: '',
  disposalMethod: 'scrap',
  approvalAttachment: '',
  notes: '',
};

// ── Form schema definition ───────────────────────────────────────

export const disposalFormSchema: InventoryFormSchema = {
  id: 'disposal',
  title: 'Item Disposal',
  description: 'Dispose of old or damaged items with approval.',
  requestType: 'item_disposal',
  mode: 'create',
  autosave: false,
  reviewRequired: true,
  submitLabel: 'Submit Disposal Request',
  zodSchema: disposalZod,

  steps: [
    {
      id: 'item',
      title: 'Select Item',
      description: 'Choose the item to dispose.',
      fields: [
        { name: 'itemId', label: 'Item', type: 'item-picker', required: true, fullWidth: true, helperText: 'Only inactive or damaged items can be disposed.' },
      ],
    },
    {
      id: 'disposal-details',
      title: 'Disposal Details',
      description: 'Provide reason, method, and approval.',
      fields: [
        {
          name: 'disposalReason',
          label: 'Reason for Disposal',
          type: 'select',
          required: true,
          fullWidth: true,
          options: [
            { label: 'End of life', value: 'end_of_life' },
            { label: 'Irreparable damage', value: 'irreparable' },
            { label: 'Obsolete / replaced', value: 'obsolete' },
            { label: 'Safety concern', value: 'safety' },
            { label: 'Excess stock', value: 'excess' },
            { label: 'Other', value: 'other' },
          ],
        },
        {
          name: 'disposalMethod',
          label: 'Disposal Method',
          type: 'radio',
          required: true,
          fullWidth: true,
          options: [
            { label: 'Recycle', value: 'recycle' },
            { label: 'Donate', value: 'donate' },
            { label: 'Sell', value: 'sell' },
            { label: 'Scrap', value: 'scrap' },
            { label: 'Destroy', value: 'destroy' },
          ],
        },
        { name: 'approvalAttachment', label: 'Approval Document', type: 'attachment-upload', required: true, accept: '.pdf,.jpg,.jpeg,.png', maxFiles: 1, fullWidth: true, helperText: 'Upload the signed disposal approval.' },
        { name: 'notes', label: 'Notes', type: 'textarea', advanced: true, fullWidth: true },
      ],
    },
  ],
};
