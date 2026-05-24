import { z } from 'zod';
import type { InventoryFormSchema } from '../types/inventory-form.types';

// ── Zod schema ───────────────────────────────────────────────────

export const damageReportZod = z.object({
  itemId: z.string().min(1, 'Please select the damaged item.'),
  damageType: z.string().min(1, 'Please select the damage type.'),
  severity: z.enum(['minor', 'moderate', 'major', 'critical'], { message: 'Please select damage severity.' }),
  description: z.string().min(10, 'Please describe the damage (at least 10 characters).'),
  photo: z.string().min(1, 'Please upload a photo of the damaged item.'),
  notes: z.string().optional(),
});

export type DamageReportFormData = z.infer<typeof damageReportZod>;

export const damageReportDefaults: DamageReportFormData = {
  itemId: '',
  damageType: '',
  severity: 'minor',
  description: '',
  photo: '',
  notes: '',
};

// ── Form schema definition ───────────────────────────────────────

export const damageReportFormSchema: InventoryFormSchema = {
  id: 'damage-report',
  title: 'Report Damaged Item',
  description: 'Report damage to an inventory item.',
  requestType: 'damage_report',
  mode: 'create',
  autosave: false,
  reviewRequired: true,
  submitLabel: 'Submit Report',
  zodSchema: damageReportZod,

  steps: [
    {
      id: 'item',
      title: 'Select Item',
      description: 'Choose the damaged item.',
      fields: [
        { name: 'itemId', label: 'Item', type: 'item-picker', required: true, fullWidth: true, helperText: 'Search by item name, asset tag, or serial number.' },
      ],
    },
    {
      id: 'damage',
      title: 'Damage Details',
      description: 'Describe the damage.',
      fields: [
        {
          name: 'damageType',
          label: 'Damage Type',
          type: 'select',
          required: true,
          fullWidth: true,
          options: [
            { label: 'Physical Damage', value: 'physical' },
            { label: 'Water Damage', value: 'water' },
            { label: 'Electrical Fault', value: 'electrical' },
            { label: 'Wear and Tear', value: 'wear' },
            { label: 'Manufacturing Defect', value: 'defect' },
            { label: 'Other', value: 'other' },
          ],
        },
        {
          name: 'severity',
          label: 'Severity',
          type: 'radio',
          required: true,
          fullWidth: true,
          options: [
            { label: 'Minor', value: 'minor', description: 'Cosmetic only, still usable' },
            { label: 'Moderate', value: 'moderate', description: 'Partially functional' },
            { label: 'Major', value: 'major', description: 'Barely functional' },
            { label: 'Critical', value: 'critical', description: 'Completely unusable' },
          ],
        },
        { name: 'description', label: 'Description', type: 'textarea', required: true, fullWidth: true, placeholder: 'Describe what happened and the extent of the damage...' },
        { name: 'photo', label: 'Photo', type: 'attachment-upload', required: true, accept: 'image/*', maxFiles: 5, fullWidth: true, helperText: 'Upload at least one photo of the damage.' },
        { name: 'notes', label: 'Notes', type: 'textarea', advanced: true, fullWidth: true },
      ],
    },
  ],
};
