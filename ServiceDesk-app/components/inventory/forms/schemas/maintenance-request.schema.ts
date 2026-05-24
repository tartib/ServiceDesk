import { z } from 'zod';
import type { InventoryFormSchema } from '../types/inventory-form.types';

// ── Zod schema ───────────────────────────────────────────────────

export const maintenanceRequestZod = z
  .object({
    itemId: z.string().min(1, 'Please select an item.'),
    issueType: z.string().min(1, 'Please select the issue type.'),
    priority: z.enum(['low', 'medium', 'high'], { message: 'Please select a priority.' }),
    description: z.string().min(10, 'Please describe the issue (at least 10 characters).'),
    justification: z.string().optional(),
    photo: z.string().optional(),
    preferredDate: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (data) => data.priority !== 'high' || (data.justification && data.justification.length > 0),
    { message: 'High priority requires a justification.', path: ['justification'] },
  );

export type MaintenanceRequestFormData = z.infer<typeof maintenanceRequestZod>;

export const maintenanceRequestDefaults: MaintenanceRequestFormData = {
  itemId: '',
  issueType: '',
  priority: 'medium',
  description: '',
  justification: '',
  photo: '',
  preferredDate: '',
  notes: '',
};

// ── Form schema definition ───────────────────────────────────────

export const maintenanceRequestFormSchema: InventoryFormSchema = {
  id: 'maintenance-request',
  title: 'Maintenance Request',
  description: 'Request maintenance for an inventory item.',
  requestType: 'maintenance_request',
  mode: 'create',
  autosave: true,
  reviewRequired: true,
  submitLabel: 'Submit Request',
  zodSchema: maintenanceRequestZod,

  steps: [
    {
      id: 'item',
      title: 'Select Item',
      description: 'Choose the item that needs maintenance.',
      fields: [
        { name: 'itemId', label: 'Item', type: 'item-picker', required: true, fullWidth: true, helperText: 'Search by item name, asset tag, or serial number.' },
      ],
    },
    {
      id: 'details',
      title: 'Issue Details',
      description: 'Describe the maintenance needed.',
      fields: [
        {
          name: 'issueType',
          label: 'Issue Type',
          type: 'select',
          required: true,
          options: [
            { label: 'Preventive Maintenance', value: 'preventive' },
            { label: 'Corrective Repair', value: 'corrective' },
            { label: 'Calibration', value: 'calibration' },
            { label: 'Inspection', value: 'inspection' },
            { label: 'Software Update', value: 'software_update' },
            { label: 'Other', value: 'other' },
          ],
        },
        {
          name: 'priority',
          label: 'Priority',
          type: 'radio',
          required: true,
          options: [
            { label: 'Low', value: 'low', description: 'Can wait a few days' },
            { label: 'Medium', value: 'medium', description: 'Should be done this week' },
            { label: 'High', value: 'high', description: 'Urgent — item is critical' },
          ],
        },
        { name: 'description', label: 'Description', type: 'textarea', required: true, fullWidth: true, placeholder: 'Describe the issue or maintenance needed...' },
        {
          name: 'justification',
          label: 'Justification',
          type: 'textarea',
          fullWidth: true,
          placeholder: 'Why is this high priority?',
          visibleWhen: [{ field: 'priority', operator: 'eq', value: 'high' }],
          requiredWhen: [{ field: 'priority', operator: 'eq', value: 'high' }],
        },
        { name: 'preferredDate', label: 'Preferred Date', type: 'date', advanced: true, helperText: 'When would you like maintenance to happen?' },
        { name: 'photo', label: 'Photo', type: 'attachment-upload', accept: 'image/*', maxFiles: 5, advanced: true, fullWidth: true },
        { name: 'notes', label: 'Notes', type: 'textarea', advanced: true, fullWidth: true },
      ],
    },
  ],
};
